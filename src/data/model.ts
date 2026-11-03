export type SectionId =
  | 'overview'
  | 'algorithm'
  | 'parameters'
  | 'evaluation'
  | 'code';

export interface NavItem {
  id: SectionId;
  label: string;
  short: string;
  index: string;
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'overview', label: 'Case Study', short: 'Case Study', index: '01' },
  { id: 'algorithm', label: 'Why K-Means?', short: 'Algorithm Choice', index: '02' },
  { id: 'parameters', label: 'Training', short: 'Training', index: '03' },
  { id: 'evaluation', label: 'Graphs', short: 'Graphs', index: '04' },
  { id: 'code', label: 'Code', short: 'Code', index: '05' },
];

export interface DatasetStatus {
  loaded: boolean;
  source: string;
  recordCount: number | null;
  automobileTrips: number | null;
  releaseLabel: string;
}

export const DATASET_STATUS: DatasetStatus = {
  loaded: false,
  source: 'National Household Travel Survey (NHTS) — nhts.ornl.gov',
  recordCount: null,
  automobileTrips: null,
  releaseLabel: 'Release selection pending',
};

export interface SourceAttribute {
  source: string;
  description: string;
  selected: boolean;
  engineered: boolean;
}

export interface FeatureSpec {
  name: string;
  units: string;
  type: 'numeric' | 'categorical' | 'binary';
  source: 'source' | 'engineered';
  transformation: string;
  reason: string;
  column: string;
}

export const SOURCE_ATTRIBUTES: SourceAttribute[] = [
  { source: 'WTTRPNUM', description: 'Trip number within person travel day', selected: false, engineered: false },
  { source: 'TRIPMODE', description: 'Release-specific transportation mode code used to filter automobile trips', selected: false, engineered: false },
  { source: 'TRPMILES', description: 'Reported trip distance in miles', selected: true, engineered: false },
  { source: 'TRVLCMIN', description: 'Reported trip travel duration in minutes', selected: true, engineered: false },
  { source: 'STRTTIME', description: 'Trip start time (HHMM)', selected: true, engineered: false },
  { source: 'ENDTIME', description: 'Trip end time (HHMM)', selected: false, engineered: false },
  { source: 'TRPACCMP', description: 'Number of accompanying passengers', selected: false, engineered: false },
  { source: 'TRPPURP', description: 'Trip purpose category', selected: false, engineered: false },
  { source: 'TDTRPNUM', description: 'Travel-day trip sequence number', selected: false, engineered: false },
  { source: 'VEHID', description: 'Vehicle identifier for the trip', selected: false, engineered: false },
];

export const FEATURE_SPECS: FeatureSpec[] = [
  {
    name: 'Trip distance',
    column: 'TRPMILES',
    units: 'miles',
    type: 'numeric',
    source: 'source',
    transformation: 'Used as-is after unit verification; StandardScaler applied',
    reason: 'Primary magnitude of the trip — the dominant axis separating short errands from long commutes.',
  },
  {
    name: 'Travel duration',
    column: 'TRVLCMIN',
    units: 'minutes',
    type: 'numeric',
    source: 'source',
    transformation: 'Used as-is; StandardScaler applied',
    reason: 'Temporal cost of the trip. Captures congestion and routing effects that distance alone cannot.',
  },
  {
    name: 'Departure hour',
    column: 'STRTTIME',
    units: 'hour (0–23)',
    type: 'numeric',
    source: 'engineered',
    transformation: 'Derived from STRTTIME (HHMM) via integer division by 100',
    reason: 'Circular temporal signal. Separates morning commutes, midday errands, and evening trips.',
  },
  {
    name: 'Peak-hour indicator',
    column: 'is_peak',
    units: '0 / 1',
    type: 'binary',
    source: 'engineered',
    transformation: 'Derived from departure hour: 1 if hour ∈ {7,8,9,16,17,18}, else 0',
    reason: 'Binary flag emphasising rush-hour trips that dominate commuting patterns.',
  },
];

export interface ParamSpec {
  key: string;
  label: string;
  sklearn: string;
  defaultValue: number;
  min: number;
  max: number;
  step: number;
  control: 'slider' | 'select';
  options?: { value: string; label: string }[];
  explanation: string;
  why: string;
}

export const PARAM_SPECS: ParamSpec[] = [
  {
    key: 'n_clusters_candidates',
    label: 'Candidate K range',
    sklearn: 'KMeans(n_clusters=K)',
    defaultValue: 2,
    min: 2,
    max: 8,
    step: 1,
    control: 'slider',
    explanation: 'Number of clusters K to evaluate. The elbow and silhouette curves are produced across every candidate K in [min, max].',
    why: 'K is unknown a priori. We sweep 2–8 to locate the elbow and silhouette peak, then select the best compromise.',
  },
  {
    key: 'init',
    label: 'Initialization',
    sklearn: 'init=',
    defaultValue: 0,
    min: 0,
    max: 0,
    step: 1,
    control: 'select',
    options: [
      { value: 'k-means++', label: 'k-means++' },
      { value: 'random', label: 'random' },
    ],
    explanation: 'Method used to place the initial centroids before the first assignment step.',
    why: 'k-means++ spreads initial centroids, lowering the chance of poor convergence and reducing sensitivity to random seeding.',
  },
  {
    key: 'n_init',
    label: 'n_init',
    sklearn: 'n_init=',
    defaultValue: 20,
    min: 1,
    max: 50,
    step: 1,
    control: 'slider',
    explanation: 'Number of times the algorithm is run with different centroid seeds.',
    why: 'K-Means can converge to a local minimum. Running 20 restarts and keeping the lowest-inertia result makes the solution robust.',
  },
  {
    key: 'max_iter',
    label: 'max_iter',
    sklearn: 'max_iter=',
    defaultValue: 300,
    min: 50,
    max: 1000,
    step: 50,
    control: 'slider',
    explanation: 'Maximum iterations of the assign–update loop for a single run.',
    why: 'Caps runtime while giving the algorithm ample room to converge on a dataset of this size.',
  },
  {
    key: 'random_state',
    label: 'random_state',
    sklearn: 'random_state=',
    defaultValue: 42,
    min: 0,
    max: 100,
    step: 1,
    control: 'slider',
    explanation: 'Seed for the random number generator used by k-means++ and restarts.',
    why: 'Fixes the seed so that results are reproducible — a reviewer can rerun the notebook and get the same clusters.',
  },
];

export interface TrainingStep {
  step: number;
  label: string;
  detail: string;
}

export const TRAINING_PIPELINE: TrainingStep[] = [
  { step: 1, label: 'Load', detail: 'Read the NHTS trip CSV into a pandas DataFrame.' },
  { step: 2, label: 'Validate', detail: 'Verify column names against the codebook; check dtypes and ranges.' },
  { step: 3, label: 'Filter', detail: 'Keep automobile trips only (TRPTRANS ∈ private-auto mode codes).' },
  { step: 4, label: 'Clean', detail: 'Drop rows with missing/negative trip distance or zero duration.' },
  { step: 5, label: 'Engineer', detail: 'Derive departure hour and peak-hour indicator from STRTTIME.' },
  { step: 6, label: 'Scale', detail: 'Fit StandardScaler on the feature matrix; transform for clustering.' },
  { step: 7, label: 'Train', detail: 'Fit KMeans for every candidate K using k-means++, n_init, max_iter.' },
  { step: 8, label: 'Evaluate', detail: 'Record inertia and silhouette; build elbow and silhouette curves.' },
  { step: 9, label: 'Profile', detail: 'Compute per-cluster means, sizes, and departure-time profiles.' },
];

export interface CodeSample {
  id: string;
  title: string;
  description: string;
  code: string;
}

export const CODE_SAMPLES: CodeSample[] = [
  {
    id: 'loading',
    title: '1. Load and validate automobile trips',
    description: 'Load the bundled NHTS trip subset. The workflow retains TRIPMODE values 1 and 2; verify the meanings against the exact release codebook before reporting results.',
    code: `import pandas as pd

trips = pd.read_csv("data/MoveSense_NHTS_Automobile_Trips.csv")
AUTO_MODE_CODES = {1, 2}
auto = trips[trips["TRIPMODE"].isin(AUTO_MODE_CODES)].copy()

for col in ["TRPMILES", "TRVLCMIN", "STRTTIME"]:
    auto[col] = pd.to_numeric(auto[col], errors="coerce")
auto = auto.dropna(subset=["TRPMILES", "TRVLCMIN", "STRTTIME"])
auto = auto[
    (auto["TRPMILES"] > 0) & (auto["TRPMILES"] < 1000)
    & (auto["TRVLCMIN"] > 0) & (auto["TRVLCMIN"] < 1440)
]
valid_time = auto["STRTTIME"].between(0, 2359) & (auto["STRTTIME"] % 100 < 60)
auto = auto[valid_time].copy()
print(f"Valid automobile trips: {len(auto):,}")`,
  },
  {
    id: 'features',
    title: '2. Engineer features and scale',
    description: 'Create the same four features used by the backend and standardise them before calculating Euclidean distances.',
    code: `import numpy as np
from sklearn.preprocessing import StandardScaler

auto["distance_miles"] = auto["TRPMILES"]
auto["travel_time_min"] = auto["TRVLCMIN"]
auto["departure_hour"] = np.floor(auto["STRTTIME"] / 100)
auto["peak_hour_flag"] = auto["departure_hour"].isin([7, 8, 9, 16, 17, 18]).astype(int)

FEATURES = ["distance_miles", "travel_time_min", "departure_hour", "peak_hour_flag"]
X = auto[FEATURES].astype(float)
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)`,
  },
  {
    id: 'candidate_k',
    title: '3. Evaluate candidate K values',
    description: 'Measure inertia and silhouette for K=2–8. Treat the silhouette maximum as a candidate and also inspect the elbow, cluster sizes, and interpretability.',
    code: `from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score

candidates = range(2, 9)
evaluations = []
for k in candidates:
    model = KMeans(n_clusters=k, init="k-means++", n_init=20,
                   max_iter=300, random_state=42)
    labels = model.fit_predict(X_scaled)
    score = silhouette_score(
        X_scaled, labels, sample_size=min(5000, len(X_scaled)), random_state=42
    )
    evaluations.append({"k": k, "inertia": model.inertia_, "silhouette": score})

results = pd.DataFrame(evaluations)
print(results)
selected_k = int(results.loc[results["silhouette"].idxmax(), "k"])`,
  },
  {
    id: 'kmeans',
    title: '4. Fit the selected K-Means model',
    description: 'Fit the final model using the K selected during candidate evaluation. The same initialization, restart count, iteration cap, and seed are used by the backend defaults.',
    code: `final_model = KMeans(
    n_clusters=selected_k,
    init="k-means++",
    n_init=20,
    max_iter=300,
    random_state=42,
)
auto["cluster"] = final_model.fit_predict(X_scaled)`,
  },
  {
    id: 'profile',
    title: '5. Profile the clusters',
    description: 'Aggregate cluster assignments in original units so the resulting groups can be interpreted using miles, minutes, departure hour, and peak-hour share.',
    code: `profile = auto.groupby("cluster").agg(
    trip_count=("cluster", "size"),
    avg_distance_miles=("distance_miles", "mean"),
    avg_duration_min=("travel_time_min", "mean"),
    avg_departure_hour=("departure_hour", "mean"),
    peak_hour_share=("peak_hour_flag", "mean"),
).reset_index()
profile["percentage"] = profile["trip_count"] / len(auto) * 100

auto.to_csv("data/automobile_trips_clustered.csv", index=False)
profile.to_csv("results/cluster_profiles.csv", index=False)
print(profile)`,
  },
];

