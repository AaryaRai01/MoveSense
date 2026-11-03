# MoveSense — Urban Mobility Pattern Segmentation

> **MoveSense is an unsupervised machine-learning case study that uses K-Means clustering to group automobile trips by distance, travel duration, departure time, and peak-hour behaviour.**

This report documents the results stored in the attached `MoveSense.ipynb` notebook. The reported metrics and charts below are extracted from that notebook's executed outputs.

---

## 1. Case Study

Urban mobility data contains trips with different travel characteristics. The purpose of MoveSense is to explore whether automobile trips can be grouped into meaningful mobility patterns using unsupervised learning.

The notebook treats **one trip as one observation** and uses K-Means to assign each trip to a cluster based on four numerical features. Since there are no predefined cluster labels, the model discovers groups from the feature values rather than predicting known categories.

## 2. Dataset Overview

| Item | Notebook result |
|---|---:|
| Dataset file | `MoveSense_NHTS_Automobile_Trips.csv` |
| Dataset source identified in notebook | National Household Travel Survey (NHTS), V2.1 subset |
| Initial records | 27,360 |
| Initial columns | 102 |
| Valid automobile trips after notebook cleaning | 27,360 |
| Selected feature matrix | 27,360 rows × 4 features |

### Dataset selection and cleaning

The notebook selects records where `TRIPMODE` is either `1` or `2`. It reports the following mode counts before filtering:

| `TRIPMODE` | Records |
|---:|---:|
| 1 | 20,456 |
| 2 | 6,904 |
| **Total** | **27,360** |

The notebook then:
- Converts the required columns to numeric values.
- Validates `STRTTIME` as a valid HHMM time (0–2359, with minutes below 60).
- Derives the departure hour from `STRTTIME`.
- Removes records with missing required values.
- Keeps trips with `TRPMILES > 0` and `< 1000`.
- Keeps trips with `TRVLCMIN > 0` and `< 1440`.

The executed notebook reports **27,360 valid trips** after this process. In this particular CSV, the two reported `TRIPMODE` counts already add up to all 27,360 input rows.

## 3. Features Selected

Four numerical features are passed to K-Means:

| Feature used by model | Source / derivation | Meaning |
|---|---|---|
| `distance_miles` | `TRPMILES` | Distance travelled in miles |
| `travel_time_min` | `TRVLCMIN` | Trip duration in minutes |
| `departure_hour` | Hour derived from `STRTTIME` | Hour at which the trip begins |
| `peak_hour_flag` | Derived from `departure_hour` | 1 if the trip starts during a defined peak window; otherwise 0 |

**Peak-hour windows in the notebook:** 7–9 AM and 4–6 PM (hours 7, 8, 9, 16, 17, and 18).

### Feature scaling

The notebook applies `StandardScaler` to all four features before fitting K-Means. This is necessary because the features use different units and numerical ranges. Standardization gives each feature a comparable scale for the distance calculations used by K-Means.

## 4. Why K-Means?

K-Means was selected because this is an unsupervised clustering task with numerical trip features. It is relatively efficient, straightforward to implement, and produces cluster centroids that can be profiled to understand the groups.

### Qualitative comparison with other clustering algorithms

> The table below is a conceptual comparison of algorithms. The notebook experimentally evaluates K-Means only; it does **not** report benchmark scores for the other algorithms.

| Algorithm | How it groups data | Strengths | Limitations for this case study |
|---|---|---|---|
| **K-Means** | Assigns each trip to the nearest centroid | Efficient on numerical data; simple to interpret; produces centroid-based profiles | Requires K; sensitive to outliers and scaling; favours compact, roughly spherical clusters |
| DBSCAN | Groups points in dense regions and marks sparse points as noise | Does not require K; can identify noise and irregularly shaped groups | Sensitive to `eps` and `min_samples`; varying-density data can be difficult |
| Agglomerative clustering | Builds a hierarchy by repeatedly merging clusters | Supports hierarchical exploration and different linkage methods | Can be computationally expensive on larger datasets; requires a cut level or cluster count |
| Gaussian Mixture Model (GMM) | Models data as a mixture of probability distributions | Gives probabilistic/soft cluster membership | Requires distribution assumptions and model selection; may be sensitive to initialization |

## 5. How K-Means Works

K-Means attempts to minimize the within-cluster sum of squared distances (WCSS), also called **inertia**.

1. **Choose K:** specify the number of clusters.
2. **Initialize centroids:** MoveSense uses K-Means++ initialization.
3. **Assign observations:** assign each trip to its nearest centroid using Euclidean distance in the standardized feature space.
4. **Update centroids:** calculate the mean feature vector of the trips assigned to each cluster.
5. **Repeat:** continue assignment and centroid updates until convergence or the iteration limit is reached.
6. **Return labels:** each trip receives a cluster identifier.

The labels `0` and `1` are identifiers only; they do not indicate a ranking.

## 6. K Selection: Why K = 2?

The notebook evaluates candidate cluster counts from **K = 2 through K = 8**. For each candidate, it fits a K-Means model and records inertia and silhouette score.

### Candidate evaluation results

| K | Inertia (WCSS) | Silhouette score |
|---:|---:|---:|
| 2 | 77,330.0384 | **0.8640** |
| 3 | 50,091.6223 | 0.4786 |
| 4 | 37,285.2056 | 0.5455 |
| 5 | 29,256.1721 | 0.5942 |
| 6 | 21,306.9177 | 0.6108 |
| 7 | 17,827.8276 | 0.6244 |
| 8 | 14,853.7324 | 0.6322 |

**Notebook selection rule:** choose the K with the highest silhouette score. Based on the recorded table, **K = 2** is selected because its silhouette score of **0.8640** is the highest among the tested candidates.

### What the metrics mean

- **Silhouette score:** measures how close an observation is to its own cluster compared with the nearest alternative cluster. Higher values generally indicate better cohesion and separation. The score ranges from -1 to +1.
- **Inertia / WCSS:** measures the sum of squared distances between observations and their assigned centroids. It normally decreases as K increases, so it should not be used by itself to choose K.

The notebook calculates silhouette scores using a sample of up to 5,000 observations (`sample_size=min(5000, len(X_scaled))`) with `random_state=42`. Inertia is taken from the fitted K-Means model.

### Important interpretation of K = 2

The high silhouette score should **not** be interpreted as proof that the dataset has two balanced, useful urban mobility segments. The final cluster distribution is extremely imbalanced:

- Cluster 0 contains 197 trips (about 0.72%).
- Cluster 1 contains 27,163 trips (about 99.28%).

The cluster profile also shows that Cluster 0 has much larger average distance and duration than Cluster 1. This suggests that K = 2 is primarily separating a small group of very long-distance/long-duration trips from the much larger group of ordinary trips in this dataset. This may be a valid separation, but it is not necessarily the same as discovering two balanced commuter segments.

For a stronger mobility-segmentation study, investigate the small cluster and the effect of extreme values. Consider testing justified transformations or robust preprocessing and comparing the resulting cluster profiles. Any such changes must be retrained and reported as a separate experiment.

## 7. K-Means Implementation

The following excerpt reflects the candidate-evaluation logic in the attached notebook:

```python
K_VALUES = range(2, 9)

INIT = "k-means++"
N_INIT = 20
MAX_ITER = 300
RANDOM_STATE = 42

results = []
models = {}

for k in K_VALUES:
    model = KMeans(
        n_clusters=k,
        init=INIT,
        n_init=N_INIT,
        max_iter=MAX_ITER,
        random_state=RANDOM_STATE
    )

    labels = model.fit_predict(X_scaled)

    score = silhouette_score(
        X_scaled,
        labels,
        sample_size=min(5000, len(X_scaled)),
        random_state=RANDOM_STATE
    )

    results.append({
        "K": k,
        "Inertia": model.inertia_,
        "Silhouette Score": score
    })

    models[k] = model

evaluation_df = pd.DataFrame(results)

best_k = int(
    evaluation_df.loc[
        evaluation_df["Silhouette Score"].idxmax(),
        "K"
    ]
)
```

After selecting K, the notebook fits a final K-Means model with the selected cluster count and assigns a cluster label to every trip.

### Model parameters recorded in the notebook

| Parameter | Value |
|---|---:|
| Candidate K values | 2–8 |
| Initialization | `k-means++` |
| `n_init` | 20 |
| `max_iter` | 300 |
| `random_state` | 42 |
| Scaling | `StandardScaler` |

`n_init=20` runs the clustering with 20 initial centroid configurations. `max_iter=300` sets the maximum iterations per run. `random_state=42` makes the randomized initialization and silhouette sampling reproducible.

## 8. Final Results

| Metric | Result |
|---|---:|
| Selected K | **2** |
| Total trips clustered | **27,360** |
| Silhouette score | **0.8640** |
| Inertia (WCSS) | **77,330.04** |
| PCA variance explained by first two components | **72.88%** |

### Cluster-level profile

| Cluster | Trip count | Trip share | Average distance (miles) | Average duration (min) | Average departure hour | Peak-hour share |
|---:|---:|---:|---:|---:|---:|---:|
| 0 | 197 | 0.72% | 313.05 | 410.81 | 10.24 | 0.41 |
| 1 | 27,163 | 99.28% | 9.77 | 20.85 | 13.16 | 0.41 |

**Interpretation:** Cluster 0 represents a very small set of trips with substantially higher average distance and duration. Cluster 1 contains the overwhelming majority of trips and has much lower average distance and duration. Both clusters have a reported peak-hour share of approximately 0.41.

## 9. Visual Results

### 9.1 Trip Distance and Travel Duration Distribution
<img width="1289" height="390" alt="trip_distance_duration_distribution" src="https://github.com/user-attachments/assets/73bf91c2-981c-4afc-929f-b1bcd759e5e9" />

### 9.2 Automobile Trips by Departure Hour
<img width="989" height="390" alt="automobile_trips_by_departure_hour" src="https://github.com/user-attachments/assets/6a6c096c-f591-4d55-8d96-19d1472f6dc5" />

### 9.3 Elbow Method and Silhouette Score
<img width="1289" height="390" alt="k_selection_elbow_silhouette" src="https://github.com/user-attachments/assets/baf51fda-7052-4098-81c0-3eb4a25c7d32" />

### 9.4 Number of Trips per Cluster
<img width="690" height="390" alt="cluster_distribution" src="https://github.com/user-attachments/assets/ed676205-449e-49ae-accf-5291f817029d" />

### 9.5 PCA Visualization of K-Means Clusters
<img width="790" height="590" alt="pca_kmeans_clusters" src="https://github.com/user-attachments/assets/cd749780-44f8-40b4-b468-790d84208291" />

### 9.6 Cluster Feature Profile Heatmap
<img width="821" height="390" alt="cluster_feature_profile_heatmap" src="https://github.com/user-attachments/assets/aadfdec9-319a-4813-9992-df11b69c9517" />

## 10. Implementation Notes and Reproducibility

- The results in this report are from the **attached notebook's executed run**.
- In this notebook, K selection is based on the maximum silhouette score. It does **not** apply a minimum 5% cluster-share eligibility constraint.
- The previously inspected backend implementation had a minimum-cluster-share check in its automatic K-selection logic. If that rule is still present in the current backend, the notebook's K = 2 result is **not automatically the same as the backend's selected result**.
- The notebook's preprocessing removes records outside the stated distance/duration limits; it does not use the same capping operation described in the previously inspected backend code.
- Therefore, do not present the notebook metrics as API/backend metrics unless the current `backend/main.py` preprocessing, K-selection rule, and training parameters have been aligned and the backend has been retrained.
- The PCA plot is a visualization of the final labels. It is not evidence that the model was trained on two PCA components.

## 11. Conclusion

The executed notebook clustered 27,360 automobile trips using four standardized mobility features. It evaluated K values from 2 to 8 and selected K = 2 because it produced the highest recorded silhouette score (0.8640). The final result separates a small set of very long trips from the dominant group of shorter trips. The strong silhouette score is promising, but the 0.72% versus 99.28% cluster split is an important limitation: further preprocessing and cluster-validity analysis are needed before describing the result as two balanced urban mobility segments.

