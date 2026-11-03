from __future__ import annotations

import io
import json
import os
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sklearn.cluster import KMeans
from sklearn.decomposition import PCA
from sklearn.metrics import silhouette_score
from sklearn.preprocessing import StandardScaler


# ============================================================
# 1. PROJECT DIRECTORIES
# ============================================================

ROOT = Path(__file__).resolve().parents[1]

DATA_DIR = ROOT / "data"
RESULTS_DIR = ROOT / "results"
MODEL_DIR = ROOT / "models"

for folder in (DATA_DIR, RESULTS_DIR, MODEL_DIR):
    folder.mkdir(parents=True, exist_ok=True)


RAW_PATH = DATA_DIR / "uploaded_nhts_trips.csv"

BUNDLED_NHTS_PATH = (
    DATA_DIR / "MoveSense_NHTS_Automobile_Trips.csv"
)

CLEAN_PATH = DATA_DIR / "automobile_trips.csv"

RESULTS_PATH = RESULTS_DIR / "training_results.json"

MODEL_PATH = MODEL_DIR / "movesense_kmeans_pipeline.joblib"


# ============================================================
# 2. FASTAPI APPLICATION
# ============================================================

# MoveSense uses K-Means as its clustering algorithm.
# PCA is used only for 2D visualisation after clustering.
# PCA does NOT generate cluster labels.
#
# Factor Analysis is a separate statistical technique and
# is not used as the clustering algorithm in this pipeline.

app = FastAPI(
    title="MoveSense ML API",
    version="1.1.0",
    description="K-Means clustering backend for NHTS automobile trip data.",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv(
        "CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173",
    ).split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# 3. APPLICATION STATE
# ============================================================

state: dict[str, Any] = {
    "dataset_loaded": False,
    "training_complete": False,
    "dataset": None,
    "results": None,
}


# ============================================================
# 4. DATASET COLUMN ALIASES
# ============================================================

COLUMN_ALIASES: dict[str, list[str]] = {

    "distance": [
        "TRPMILES",
        "TRIPMILES",
        "DISTANCE_MILES",
        "DISTANCE",
        "distance_miles",
    ],

    "duration": [
        "TRVLCMIN",
        "TRVL_MIN",
        "TRIPTIME",
        "DURATION_MIN",
        "travel_time_min",
    ],

    "start": [
        "STRTTIME",
        "STARTTIME",
        "DEPARTURE_TIME",
        "departure_time_raw",
    ],

    "mode": [
        "TRIPMODE",
        "TRPTRANS",
        "TRPTRANS1",
        "TRPMODE",
        "MODE",
        "TRAVEL_MODE",
    ],

    "purpose": [
        "TRIPPURP",
        "WHYTRP1S",
        "WHYTRP90",
        "TRIP_PURPOSE",
    ],
}


# ============================================================
# 5. COLUMN DETECTION
# ============================================================

def resolve_column(
    df: pd.DataFrame,
    key: str,
) -> str | None:

    """
    Resolve a known NHTS field or one of the supported aliases.
    """

    lookup = {
        str(column).strip().upper(): column
        for column in df.columns
    }

    for candidate in COLUMN_ALIASES[key]:

        if candidate.upper() in lookup:

            return str(lookup[candidate.upper()])

    return None


def detected_columns(
    df: pd.DataFrame,
) -> dict[str, str | None]:

    return {
        key: resolve_column(df, key)
        for key in COLUMN_ALIASES
    }


# ============================================================
# 6. JSON SERIALIZATION
# ============================================================

def json_safe(value: Any) -> Any:

    """
    Convert NumPy and Pandas values into JSON-compatible values.
    """

    if isinstance(value, np.integer):
        return int(value)

    if isinstance(value, np.floating):

        return (
            None
            if not np.isfinite(value)
            else float(value)
        )

    if isinstance(value, np.bool_):
        return bool(value)

    if value is None:
        return None

    try:

        if pd.isna(value):
            return None

    except (TypeError, ValueError):

        pass

    return value


# ============================================================
# 7. LOAD BUNDLED DATASET
# ============================================================

def load_bundled_nhts_if_needed() -> None:

    """
    Load the bundled trip CSV at startup unless an uploaded
    CSV already exists.
    """

    if RAW_PATH.exists() and BUNDLED_NHTS_PATH.exists():

        try:

            same_as_bundle = (
                RAW_PATH.read_bytes()
                == BUNDLED_NHTS_PATH.read_bytes()
            )

        except OSError:

            same_as_bundle = False

        source_path = (
            BUNDLED_NHTS_PATH
            if same_as_bundle
            else RAW_PATH
        )

    else:

        source_path = (
            RAW_PATH
            if RAW_PATH.exists()
            else BUNDLED_NHTS_PATH
        )

    if not source_path.exists():
        return

    try:

        df = pd.read_csv(
            source_path,
            low_memory=False,
        )

        columns = detected_columns(df)

        if (
            source_path == BUNDLED_NHTS_PATH
            and not RAW_PATH.exists()
        ):

            RAW_PATH.write_bytes(
                source_path.read_bytes()
            )

        state["dataset_loaded"] = True

        state["training_complete"] = False

        state["results"] = None

        is_bundle = (
            source_path.name
            == BUNDLED_NHTS_PATH.name
        )

        state["dataset"] = {

            "filename": source_path.name,

            "source_rows": int(len(df)),

            "columns": [
                str(column)
                for column in df.columns
            ],

            "detected_columns": columns,

            "has_mode": columns["mode"] is not None,

            "has_start_time": columns["start"] is not None,

            "has_purpose": columns["purpose"] is not None,

            "releaseLabel": (

                "Bundled NHTS trip subset; confirm TRIPMODE definitions in the matching codebook"

                if is_bundle

                else "Previously uploaded trip CSV; verify its source release and codebook"
            ),

            "note": (
                "Rows represent trips. Automobile mode codes must be "
                "verified against the exact NHTS release codebook."
            ),
        }

    except Exception as exc:

        # Keep the API available even if the bundled CSV
        # cannot be loaded.

        state["dataset_loaded"] = False

        state["dataset"] = None

        print(
            f"Could not preload trip CSV: {exc}"
        )


# ============================================================
# 8. TRAINING PARAMETERS
# ============================================================

class TrainRequest(BaseModel):

    min_k: int = Field(
        2,
        ge=2,
        le=8,
    )

    max_k: int = Field(
        8,
        ge=2,
        le=12,
    )

    selected_k: int | None = Field(
        None,
        ge=2,
        le=12,
    )

    init: str = Field(
        "k-means++",
        pattern=r"^(k-means\+\+|random)$",
    )

    n_init: int = Field(
        20,
        ge=1,
        le=100,
    )

    max_iter: int = Field(
        300,
        ge=50,
        le=2000,
    )

    random_state: int = Field(
        42,
        ge=0,
        le=100000,
    )

    auto_mode_codes: list[int] = Field(
        default_factory=list
    )

    peak_hours: list[int] = Field(
        default_factory=lambda: [
            7, 8, 9, 16, 17, 18
        ]
    )

    outlier_cap_percentile: float = Field(
        98.0,
        ge=90.0,
        le=100.0,
    )

    min_cluster_share: float = Field(
        0.05,
        ge=0.0,
        le=0.25,
    )


# ============================================================
# 9. INITIALIZE DATASET
# ============================================================

load_bundled_nhts_if_needed()


# ============================================================
# 10. HEALTH CHECK
# ============================================================

@app.get("/api/health")
def health() -> dict[str, str]:

    return {
        "status": "ok",
        "service": "MoveSense ML API",
        "version": "1.1.0",
    }


# ============================================================
# 11. APPLICATION STATUS
# ============================================================

@app.get("/api/status")
def status() -> dict[str, Any]:

    return {

        "dataset_loaded": state["dataset_loaded"],

        "training_complete": state["training_complete"],

        "dataset": state.get("dataset"),

        "results_available": (
            state.get("results") is not None
        ),
    }


# ============================================================
# 12. DATASET UPLOAD
# ============================================================

@app.post("/api/dataset/upload")
async def upload_dataset(
    file: UploadFile = File(...),
) -> dict[str, Any]:

    """
    Upload and validate an NHTS trip-level CSV file.
    """

    if (
        not file.filename
        or not file.filename.lower().endswith(".csv")
    ):

        raise HTTPException(
            400,
            "Upload a CSV file from the NHTS trip-level dataset.",
        )

    raw = await file.read()

    if len(raw) > 100 * 1024 * 1024:

        raise HTTPException(
            413,
            "CSV exceeds the 100 MB upload limit.",
        )

    try:

        df = pd.read_csv(
            io.BytesIO(raw),
            low_memory=False,
        )

    except Exception as exc:

        raise HTTPException(
            400,
            f"Could not parse CSV: {exc}",
        ) from exc

    if len(df) < 2:

        raise HTTPException(
            400,
            "CSV must contain at least two data rows.",
        )

    columns = detected_columns(df)

    missing = [
        key
        for key in (
            "distance",
            "duration",
            "start",
        )
        if columns[key] is None
    ]

    if missing:

        missing_labels = ", ".join(missing)

        raise HTTPException(
            400,
            (
                f"Required trip fields were not detected "
                f"({missing_labels}). "
                f"Columns found: {', '.join(map(str, df.columns))}"
            ),
        )

    # Save uploaded dataset.

    RAW_PATH.write_bytes(raw)

    state["dataset_loaded"] = True

    state["training_complete"] = False

    state["results"] = None

    if RESULTS_PATH.exists():
        RESULTS_PATH.unlink()

    state["dataset"] = {

        "filename": file.filename,

        "source_rows": int(len(df)),

        "columns": [
            str(column)
            for column in df.columns
        ],

        "detected_columns": columns,

        "releaseLabel": (
            "User-uploaded NHTS trip CSV; verify source release and codebook"
        ),

        "has_mode": columns["mode"] is not None,

        "has_start_time": columns["start"] is not None,

        "has_purpose": columns["purpose"] is not None,

        "note": (
            "Mode codes are not inferred automatically. "
            "Verify them against the matching NHTS codebook."
        ),
    }

    return state["dataset"]


# ============================================================
# 13. K-MEANS TRAINING PIPELINE
# ============================================================

@app.post("/api/train")
def train(
    req: TrainRequest,
) -> dict[str, Any]:

    """
    Train K-Means, compare candidate K values,
    and return real evaluation outputs.
    """

    if not RAW_PATH.exists():

        raise HTTPException(
            400,
            "No trip CSV is available. Upload the official NHTS trip CSV first.",
        )

    if req.max_k < req.min_k:

        raise HTTPException(
            400,
            "max_k must be greater than or equal to min_k.",
        )

    try:

        df = pd.read_csv(
            RAW_PATH,
            low_memory=False,
        )

    except Exception as exc:

        raise HTTPException(
            400,
            f"Could not read the current dataset: {exc}",
        ) from exc

    columns = detected_columns(df)

    required = [
        key
        for key in (
            "distance",
            "duration",
            "start",
        )
        if columns[key] is None
    ]

    if required:

        raise HTTPException(
            400,
            "Required distance, duration, or departure-time columns are missing.",
        )

    source_rows = int(len(df))

    mode_filtered_rows: int | None = None

    # --------------------------------------------------------
    # 13.1 AUTOMOBILE MODE FILTERING
    # --------------------------------------------------------

    mode_column = columns["mode"]

    if mode_column is not None:

        if not req.auto_mode_codes:

            raise HTTPException(
                400,
                (
                    "Enter automobile mode code(s) verified "
                    "in the matching NHTS codebook. "
                    "Do not guess the codes."
                ),
            )

        mode_values = pd.to_numeric(
            df[mode_column],
            errors="coerce",
        )

        df = df.loc[
            mode_values.isin(
                req.auto_mode_codes
            )
        ].copy()

        mode_filtered_rows = int(len(df))

        if df.empty:

            raise HTTPException(
                400,
                (
                    "No rows match the supplied mode codes. "
                    "Verify the codes and the selected NHTS release."
                ),
            )

    # --------------------------------------------------------
    # 13.2 FEATURE EXTRACTION
    # --------------------------------------------------------

    distance_column = columns["distance"]

    duration_column = columns["duration"]

    start_column = columns["start"]

    assert (
        distance_column is not None
        and duration_column is not None
        and start_column is not None
    )

    df["distance_miles"] = pd.to_numeric(
        df[distance_column],
        errors="coerce",
    )

    df["travel_time_min"] = pd.to_numeric(
        df[duration_column],
        errors="coerce",
    )

    raw_time = pd.to_numeric(
        df[start_column],
        errors="coerce",
    )

    # Validate HHMM departure time.

    valid_time = (
        raw_time.between(0, 2359)
        & ((raw_time % 100) < 60)
    )

    df["departure_hour"] = np.where(
        valid_time,
        np.floor(raw_time / 100),
        np.nan,
    )

    # --------------------------------------------------------
    # 13.3 DATA CLEANING
    # --------------------------------------------------------

    # Remove missing, non-positive, and implausible values.
    # Extreme but valid trips are retained and handled
    # through capping of model inputs below.

    df = df[
        df["distance_miles"].notna()
        & df["travel_time_min"].notna()
        & df["departure_hour"].notna()
        & (df["distance_miles"] > 0)
        & (df["distance_miles"] < 1000)
        & (df["travel_time_min"] > 0)
        & (df["travel_time_min"] < 1440)
    ].copy()

    if len(df) < max(10, req.min_k + 1):

        raise HTTPException(
            400,
            (
                f"Only {len(df)} valid trips remain; "
                "more records are required."
            ),
        )

    df["departure_hour"] = (
        df["departure_hour"].astype(int)
    )

    # --------------------------------------------------------
    # 13.4 PEAK-HOUR FEATURE ENGINEERING
    # --------------------------------------------------------

    df["peak_hour_flag"] = (
        df["departure_hour"]
        .isin(req.peak_hours)
        .astype(int)
    )

    # --------------------------------------------------------
    # 13.5 OUTLIER HANDLING
    # --------------------------------------------------------

    # Winsorise only model inputs at the configured percentile.
    # This limits the influence of extremely long trips
    # without deleting those trip records.
    #
    # Cluster profiles continue to use original values.

    cap_q = (
        req.outlier_cap_percentile / 100.0
    )

    distance_cap = float(
        df["distance_miles"].quantile(cap_q)
    )

    duration_cap = float(
        df["travel_time_min"].quantile(cap_q)
    )

    model_features = pd.DataFrame(
        {

            "distance_miles_capped": (
                df["distance_miles"].clip(
                    upper=distance_cap
                )
            ),

            "travel_time_min_capped": (
                df["travel_time_min"].clip(
                    upper=duration_cap
                )
            ),

            "departure_hour": (
                df["departure_hour"].astype(float)
            ),

            "peak_hour_flag": (
                df["peak_hour_flag"].astype(float)
            ),
        },
        index=df.index,
    )

    # --------------------------------------------------------
    # 13.6 FEATURE SCALING
    # --------------------------------------------------------

    scaler = StandardScaler()

    X_scaled = scaler.fit_transform(
        model_features
    )

    # --------------------------------------------------------
    # 13.7 CANDIDATE K-MEANS TRAINING
    # --------------------------------------------------------

    max_k = min(
        req.max_k,
        len(df) - 1,
    )

    min_k = min(
        req.min_k,
        max_k,
    )

    candidate_ks = list(
        range(
            min_k,
            max_k + 1,
        )
    )

    evaluations: list[dict[str, Any]] = []

    fitted_models: dict[
        int,
        tuple[KMeans, np.ndarray],
    ] = {}

    silhouette_sample_size = min(
        3000,
        len(df),
    )

    for k in candidate_ks:

        candidate = KMeans(

            n_clusters=k,

            init=req.init,

            n_init=req.n_init,

            max_iter=req.max_iter,

            random_state=req.random_state,

            algorithm="lloyd",
        )

        labels = candidate.fit_predict(
            X_scaled
        )

        if len(np.unique(labels)) < 2:

            score = -1.0

        else:

            score = float(
                silhouette_score(
                    X_scaled,
                    labels,
                    sample_size=silhouette_sample_size,
                    random_state=req.random_state,
                )
            )

        cluster_sizes = np.bincount(
            labels,
            minlength=k,
        )

        min_share = float(
            cluster_sizes.min() / len(labels)
        )

        evaluations.append(
            {

                "k": int(k),

                "inertia": float(
                    candidate.inertia_
                ),

                "silhouette": score,

                "min_cluster_share": min_share,

                "cluster_sizes": [
                    int(size)
                    for size in cluster_sizes
                ],
            }
        )

        fitted_models[k] = (
            candidate,
            labels,
        )

    # --------------------------------------------------------
    # 13.8 SELECT OPTIMAL K
    # --------------------------------------------------------

    if req.selected_k is not None:

        if req.selected_k not in fitted_models:

            raise HTTPException(
                400,
                (
                    f"selected_k must be between "
                    f"{min_k} and {max_k} "
                    "for this training run."
                ),
            )

        chosen_k = req.selected_k

        selection_reason = (
            "K was explicitly selected in the training controls."
        )

    else:

        # Avoid choosing a superficially high silhouette
        # caused by a tiny outlier-only cluster.
        #
        # Among candidates where each cluster contains at
        # least the requested share of trips, choose the
        # highest silhouette score.

        eligible = [

            item
            for item in evaluations

            if (
                item["min_cluster_share"]
                >= req.min_cluster_share
            )
        ]

        pool = (
            eligible
            if eligible
            else evaluations
        )

        chosen = max(
            pool,
            key=lambda item: item["silhouette"],
        )

        chosen_k = int(
            chosen["k"]
        )

        selection_reason = (

            (
                f"Highest sampled silhouette among candidates "
                f"with each cluster at least "
                f"{req.min_cluster_share:.0%} of valid trips."
            )

            if eligible

            else (
                "No candidate met the minimum cluster-share rule; "
                "selected the highest sampled silhouette."
            )
        )

    # --------------------------------------------------------
    # 13.9 FINAL MODEL
    # --------------------------------------------------------

    model, labels = fitted_models[
        chosen_k
    ]

    df["cluster"] = labels.astype(int)

    # Save cleaned dataset.

    df.to_csv(
        CLEAN_PATH,
        index=False,
    )

    # --------------------------------------------------------
    # 13.10 CLUSTER PROFILING
    # --------------------------------------------------------

    profiles = (
        df.groupby("cluster")
        .agg(

            trip_count=(
                "cluster",
                "size",
            ),

            avg_distance_miles=(
                "distance_miles",
                "mean",
            ),

            median_distance_miles=(
                "distance_miles",
                "median",
            ),

            avg_duration_min=(
                "travel_time_min",
                "mean",
            ),

            median_duration_min=(
                "travel_time_min",
                "median",
            ),

            avg_departure_hour=(
                "departure_hour",
                "mean",
            ),

            peak_hour_share=(
                "peak_hour_flag",
                "mean",
            ),
        )
        .reset_index()
    )

    profiles["percentage"] = (
        profiles["trip_count"]
        / len(df)
        * 100.0
    )

    # --------------------------------------------------------
    # 13.11 PCA VISUALISATION
    # --------------------------------------------------------

    # PCA is used only to project the already-clustered
    # feature space into two dimensions.
    #
    # K-Means labels are calculated before this projection.

    pca = PCA(
        n_components=2,
        random_state=req.random_state,
    )

    coordinates = pca.fit_transform(
        X_scaled
    )

    max_points = min(
        2500,
        len(df),
    )

    rng = np.random.default_rng(
        req.random_state
    )

    if len(df) > max_points:

        selected_rows = np.sort(
            rng.choice(
                len(df),
                size=max_points,
                replace=False,
            )
        )

    else:

        selected_rows = np.arange(
            len(df)
        )

    pca_points = [

        {

            "pc1": float(
                coordinates[i, 0]
            ),

            "pc2": float(
                coordinates[i, 1]
            ),

            "cluster": int(
                labels[i]
            ),
        }

        for i in selected_rows
    ]

    # --------------------------------------------------------
    # 13.12 CONVERT CLUSTER PROFILES
    # --------------------------------------------------------

    profile_rows = [

        {
            key: json_safe(value)
            for key, value in row.items()
        }

        for row in profiles.to_dict(
            orient="records"
        )
    ]

    chosen_eval = next(
        item
        for item in evaluations
        if item["k"] == chosen_k
    )

    valid_trip_count = int(
        len(df)
    )

    sample_note = (

        "At least 2,000 valid trip records were used."

        if valid_trip_count >= 2000

        else (
            "Fewer than 2,000 valid trip records remain; "
            "use a larger sample for final conclusions."
        )
    )

    # ========================================================
    # 14. BUILD FINAL RESULTS
    # ========================================================

    result: dict[str, Any] = {

        "status": "trained",

        "dataset": {

            "filename": (
                state.get("dataset", {}).get(
                    "filename",
                    RAW_PATH.name,
                )
            ),

            "source_rows": source_rows,

            "mode_filtered_rows": mode_filtered_rows,

            "valid_trip_count": valid_trip_count,

            "columns": [
                str(column)
                for column in df.columns
            ],

            "detected_columns": columns,

            "unit_of_analysis": "automobile trip",

            "note": sample_note,
        },

        "parameters": {

            "min_k": min_k,

            "max_k": max_k,

            "selected_k": chosen_k,

            "init": req.init,

            "n_init": req.n_init,

            "max_iter": req.max_iter,

            "random_state": req.random_state,

            "features": list(
                model_features.columns
            ),

            "scaling": "StandardScaler",

            "peak_hours": req.peak_hours,

            "outlier_cap_percentile": (
                req.outlier_cap_percentile
            ),

            "distance_cap_miles": distance_cap,

            "duration_cap_minutes": duration_cap,

            "min_cluster_share": (
                req.min_cluster_share
            ),

            "selection_reason": selection_reason,
        },

        "metrics": {

            "selected_k": chosen_k,

            "silhouette_score": float(
                chosen_eval["silhouette"]
            ),

            "silhouette_sample_size": (
                silhouette_sample_size
            ),

            "inertia": float(
                model.inertia_
            ),

            "minimum_cluster_share": float(
                chosen_eval["min_cluster_share"]
            ),

            "pca_variance_ratio": [
                float(value)
                for value in pca.explained_variance_ratio_
            ],
        },

        "evaluation": evaluations,

        "cluster_profiles": profile_rows,

        "pca_points": pca_points,

        "methodology": {

            "clustering_algorithm": "K-Means",

            "outlier_handling": (
                f"Model inputs capped at the "
                f"{req.outlier_cap_percentile:g}th percentile; "
                "rows retained and profiles use original values."
            ),

            "silhouette_note": (
                "Silhouette is estimated on a reproducible sample; "
                "it is not classification accuracy. "
                "Compare it with cluster sizes and interpretability."
            ),

            "pca_role": (
                "Two-dimensional visualisation only; "
                "PCA did not generate cluster labels."
            ),
        },
    }

    # ========================================================
    # 15. SAVE TRAINED MODEL
    # ========================================================

    joblib.dump(

        {

            "model": model,

            "scaler": scaler,

            "features": list(
                model_features.columns
            ),

            "distance_cap_miles": distance_cap,

            "duration_cap_minutes": duration_cap,

            "peak_hours": req.peak_hours,
        },

        MODEL_PATH,
    )

    # ========================================================
    # 16. SAVE RESULTS
    # ========================================================

    RESULTS_PATH.write_text(
        json.dumps(
            result,
            indent=2,
            default=json_safe,
        )
    )

    # Update application state.

    state["training_complete"] = True

    state["results"] = result

    if state.get("dataset") is not None:

        state["dataset"].update(

            {

                "source_rows": source_rows,

                "mode_filtered_rows": mode_filtered_rows,

                "valid_trip_count": valid_trip_count,

                "training_note": sample_note,
            }
        )

    return result


# ============================================================
# 17. GET TRAINING RESULTS
# ============================================================

@app.get("/api/results")
def results() -> dict[str, Any]:

    """
    Return the latest training results.
    """

    if state.get("results") is not None:

        return state["results"]

    if RESULTS_PATH.exists():

        return json.loads(
            RESULTS_PATH.read_text()
        )

    raise HTTPException(
        404,
        (
            "No training results yet. "
            "Load a dataset and run K-Means training first."
        ),
    )


# ============================================================
# 18. DATASET PREVIEW
# ============================================================

@app.get("/api/dataset/preview")
def dataset_preview() -> dict[str, Any]:

    """
    Return the first 10 rows of the uploaded dataset.
    """

    if not RAW_PATH.exists():

        raise HTTPException(
            404,
            "No dataset is currently loaded.",
        )

    df = pd.read_csv(
        RAW_PATH,
        low_memory=False,
    )

    preview_df = df.head(10)

    preview = (
        preview_df
        .astype(object)
        .where(
            pd.notna(preview_df),
            None,
        )
    )

    return {

        "rows": int(len(df)),

        "columns": [
            str(column)
            for column in df.columns
        ],

        "preview": preview.to_dict(
            orient="records"
        ),
    }