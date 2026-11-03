# MoveSense — Urban Automobile Mobility Segmentation Using K-Means

**MoveSense** is a machine learning case study that identifies patterns in urban automobile travel by applying K-Means clustering to real-world National Household Travel Survey (NHTS) trip data.

The project focuses on discovering groups of automobile trips with similar travel characteristics, such as distance, duration, and departure-time patterns. Instead of relying on predefined commuter categories, MoveSense uses unsupervised learning to identify travel behaviour directly from the data.

---

## 1. Case Study: Understanding Urban Automobile Mobility

### The Problem

Urban transportation systems generate large amounts of travel data, but understanding how people move across a city requires more than simply counting trips or measuring total distance.

Different automobile trips can represent very different mobility patterns:

- Short-distance trips with relatively low travel durations.
- Long-distance trips involving extended travel times.
- Trips concentrated around particular departure-time periods.
- Trips with similar travel characteristics that may represent common mobility behaviours.

Without structured analysis, these patterns can be difficult to identify from raw trip-level datasets.

### Our Approach

MoveSense addresses this problem through **unsupervised machine learning**.

The system processes automobile trip records from the National Household Travel Survey (NHTS), extracts relevant travel features, and applies K-Means clustering to group trips based on their similarities.

The objective is to discover meaningful mobility segments that can support:

- Understanding automobile travel behaviour.
- Identifying similarities between different trips.
- Analysing travel patterns across time and distance.
- Supporting data-driven urban mobility research and planning.

**Unit of analysis:** One automobile trip.

**Learning approach:** Unsupervised learning.

**Core algorithm:** K-Means clustering.

**Dataset source:** National Household Travel Survey (NHTS), 2022 V2.1.

---

## 2. Why K-Means Clustering?

K-Means was selected because the problem involves discovering groups within numerical travel data without having predefined labels.

The dataset does not provide ready-made categories such as short-distance commuters, long-distance travellers, or peak-hour travellers. These categories need to be discovered from the underlying patterns.

K-Means is suitable for this task because:

1. **Unsupervised learning:** It discovers groups without requiring labelled training data.
2. **Centroid-based grouping:** Each cluster is represented by a centroid, making the resulting groups easier to analyse.
3. **Numerical feature compatibility:** It works naturally with engineered numerical travel features.
4. **Computational efficiency:** It can process large trip-level datasets efficiently.
5. **Interpretability:** Cluster centres and feature profiles help explain the characteristics of each mobility segment.

The algorithm uses distance-based similarity to assign each trip to the nearest cluster centroid.

### Comparison with Other Clustering Algorithms

The following is a conceptual comparison of clustering approaches, not a benchmark claiming that every algorithm was experimentally evaluated on the MoveSense dataset.

| Algorithm | Working principle | Advantages | Limitations for MoveSense |
|---|---|---|---|
| **K-Means** | Groups observations around K centroids using distance. | Efficient, interpretable, suitable for numerical trip features. | Requires K in advance; sensitive to scaling and outliers. |
| Hierarchical Clustering | Builds a hierarchy of clusters using successive merges or splits. | Shows relationships between clusters; does not initially require a fixed K. | Can become computationally expensive on large datasets. |
| DBSCAN | Groups points based on density and identifies noise. | Can identify irregularly shaped clusters and outliers. | Sensitive to density parameters; varying-density travel patterns can be difficult to handle. |
| Gaussian Mixture Model (GMM) | Models data as a mixture of probability distributions. | Provides probabilistic cluster membership. | Requires distribution assumptions and can be more complex to interpret. |

### Why K-Means Was the Final Choice

For this case study, K-Means provides a practical balance between computational efficiency, numerical feature processing, and interpretability.

Its centroid-based approach makes it possible to analyse the average characteristics of each discovered travel segment.

The objective is not to claim that K-Means is universally superior to other algorithms. It is to use an algorithm that fits the structure and requirements of this particular mobility segmentation problem.

---

## 3. Dataset and Feature Engineering

### Data Source

MoveSense uses automobile-trip records derived from the **2022 National Household Travel Survey (NHTS), Version 2.1**.

The dataset contains individual travel observations. The preprocessing pipeline filters the records to retain valid automobile trips for analysis.

Each row represents one trip rather than one individual or household.

### Features Used

The revised backend applies feature engineering to represent trip characteristics numerically.

| Feature | Description | Purpose |
|---|---|---|
| Log Trip Distance | Log-transformed trip distance. | Reduces the influence of highly skewed distance values. |
| Log Trip Duration | Log-transformed travel duration. | Reduces skewness caused by unusually long trips. |
| Departure Time — Sine | Sine transformation of departure time. | Captures the cyclic nature of time. |
| Departure Time — Cosine | Cosine transformation of departure time. | Preserves the relationship between times near midnight. |

### Why Transform Departure Time?

Time is cyclic rather than linear.

For example, 11:55 PM and 12:05 AM are only ten minutes apart, even though their numerical hour values appear far apart.

To represent this relationship, departure time is transformed using:

\[
\theta = \frac{2\pi h}{24}
\]

\[
Time_{sin} = \sin(\theta)
\]

\[
Time_{cos} = \cos(\theta)
\]

Where:

- \(h\) is the departure hour.
- \(\theta\) is its angular representation.

This gives the clustering algorithm a more meaningful representation of departure-time similarity.

### Feature Scaling

The engineered features are standardized using `StandardScaler`.

\[
Z = \frac{X-\mu}{\sigma}
\]

Where:

- \(X\) is the original feature value.
- \(\mu\) is the feature mean.
- \(\sigma\) is the feature standard deviation.
- \(Z\) is the standardized value.

Scaling is important because K-Means uses distance calculations. Without standardization, features with larger numerical ranges could dominate the clustering process.

---

## 4. How K-Means Works in MoveSense

K-Means partitions the dataset into K clusters by minimizing the within-cluster sum of squared distances.

### Step 1 — Data Preparation

- Load the NHTS automobile-trip dataset.
- Validate the required fields.
- Filter invalid or irrelevant records.
- Engineer the numerical travel features.
- Standardize the feature matrix.

### Step 2 — Select the Number of Clusters

K represents the number of mobility segments the algorithm will identify.

MoveSense evaluates candidate cluster counts using the Elbow Method and Silhouette Score.

**Elbow Method**

The Elbow Method examines the Within-Cluster Sum of Squares (WCSS), also known as inertia.

\[
WCSS = \sum_{j=1}^{K}\sum_{x_i \in C_j}
\|x_i-\mu_j\|^2
\]

A lower WCSS indicates that observations are closer to their assigned centroids. The elbow point helps identify where increasing K produces diminishing improvements.

**Silhouette Score**

The Silhouette Score measures how well observations fit within their assigned clusters compared with neighbouring clusters.

\[
s(i)=\frac{b(i)-a(i)}{\max(a(i),b(i))}
\]

Where:

- \(a(i)\) is the average distance to observations in the same cluster.
- \(b(i)\) is the lowest average distance to observations in another cluster.

The score ranges from -1 to +1. Higher values generally indicate better-separated clusters.

### Step 3 — Initialize Centroids

The algorithm initializes K centroids in the standardized feature space.

### Step 4 — Assign Trips to Clusters

Each trip is assigned to the nearest centroid using Euclidean distance.

\[
d(x,\mu_j)=\sqrt{\sum_{m=1}^{n}(x_m-\mu_{jm})^2}
\]

### Step 5 — Update Centroids

The centroid of each cluster is recalculated as the mean of all observations assigned to that cluster.

\[
\mu_j=\frac{1}{|C_j|}\sum_{x_i \in C_j}x_i
\]

### Step 6 — Repeat Until Convergence

The assignment and centroid-update steps repeat until the centroids stabilize or the stopping condition is reached.

### Step 7 — Evaluate and Interpret Clusters

After training, the system evaluates the clustering output and generates cluster-level summaries and visualizations to understand the resulting mobility segments.

---

## 5. Model Evaluation and Visualizations

MoveSense uses multiple evaluation methods to analyse the quality and characteristics of the generated clusters.

| Evaluation | What it tells us |
|---|---|
| Elbow Curve | How within-cluster variation changes as K increases. |
| Silhouette Score | How well-separated the resulting clusters are. |
| Cluster Distribution | How many trips are assigned to each cluster. |
| Cluster Profiles | The average feature characteristics of each cluster. |
| PCA Visualization | A two-dimensional representation of the high-dimensional feature space. |

### PCA Visualization

Principal Component Analysis (PCA) is used to project the standardized feature space into two dimensions for visualization.

PCA is **not the clustering algorithm** in MoveSense. K-Means performs the actual clustering, while PCA helps visualize the resulting groups.

### Interpreting the Results

The cluster profiles allow us to examine:

- Differences in average trip distance.
- Differences in average trip duration.
- Differences in departure-time patterns.
- The relative size of each discovered mobility segment.

The resulting clusters are data-driven groupings, not predefined demographic categories or verified individual commuter identities.

---

## 6. Results and Findings

The main output of MoveSense is a set of automobile mobility segments discovered through K-Means.

The results are evaluated using clustering metrics and visual analysis rather than classification accuracy, because the dataset does not contain predefined cluster labels.

### Results Summary

The following values should be populated from the latest successful training run:

| Metric | Latest run |
|---|---|
| Valid automobile trips | [Insert actual count] |
| Number of selected clusters (K) | [Insert selected K] |
| Silhouette Score | [Insert actual score] |
| Inertia / WCSS | [Insert actual value] |
| Number of features | 4 engineered features |

### Cluster-Level Analysis

| Cluster | Number of Trips | Average Trip Distance | Average Trip Duration | Departure-Time Pattern |
|---|---|---|---|---|
| Cluster 0 | [Actual value] | [Actual value] | [Actual value] | [Interpretation] |
| Cluster 1 | [Actual value] | [Actual value] | [Actual value] | [Interpretation] |
| Additional clusters | [If applicable] | [Actual value] | [Actual value] | [Interpretation] |

*The number of rows in this table must match the K selected by the actual training run.*

### Key Findings

The cluster profiles help reveal whether automobile trips naturally form distinct groups based on their distance, duration, and departure-time characteristics.

These findings can be used to explore differences in travel behaviour and provide an analytical foundation for further urban mobility studies.

The model identifies statistical similarities between trips; it does not establish the causes of those behaviours.

---

## 7. Project Workflow

```text
NHTS Dataset
     |
     v
Automobile Trip Filtering
     |
     v
Data Validation and Cleaning
     |
     v
Feature Engineering
     |
     v
Feature Standardization
     |
     v
K Selection
(Elbow Method + Silhouette Score)
     |
     v
K-Means Clustering
     |
     v
Cluster Evaluation
     |
     v
PCA Visualization
     |
     v
Cluster Profiles and Results
```

---

## 8. Technology Stack

| Component | Technology |
|---|---|
| Programming Language | Python |
| Machine Learning | Scikit-learn |
| Data Processing | Pandas, NumPy |
| Clustering Algorithm | K-Means |
| Feature Scaling | StandardScaler |
| Dimensionality Reduction | PCA |
| Backend | FastAPI |
| Frontend | React, TypeScript, Vite |
| Visualization | Recharts / Matplotlib |

---

## 9. Backend API

The FastAPI backend exposes endpoints for dataset handling, model training, and result retrieval.

| Endpoint | Purpose |
|---|---|
| `/api/health` | Checks backend availability. |
| `/api/status` | Returns project and training status. |
| `/api/dataset/upload` | Uploads the dataset. |
| `/api/dataset/preview` | Previews dataset records. |
| `/api/train` | Starts the K-Means training pipeline. |
| `/api/results` | Retrieves clustering results and evaluation information. |

---

## 10. Limitations and Future Scope

### Current Limitations

- K-Means requires the number of clusters to be selected before training.
- It is sensitive to outliers and feature scaling.
- It performs best when clusters are reasonably compact and separable in the chosen feature space.
- NHTS observations represent surveyed travel behaviour and may not capture every aspect of urban mobility.
- Discovered clusters indicate similarity, not causation.

### Future Scope

- Incorporate additional travel characteristics where reliable data is available.
- Analyse mobility patterns across different geographic regions.
- Compare K-Means results empirically against alternative clustering algorithms.
- Explore temporal and regional changes in automobile travel behaviour.
- Investigate how mobility segments can support transport planning and infrastructure decisions.

---

## 11. Conclusion

MoveSense demonstrates how unsupervised machine learning can be applied to real-world transportation data to discover patterns that are not explicitly labelled.

By combining NHTS automobile-trip data, feature engineering, standardization, and K-Means clustering, the project creates interpretable mobility segments based on travel characteristics.

The case study highlights the practical use of machine learning in understanding urban automobile mobility and demonstrates how data-driven segmentation can support further transportation analysis.

**Core idea:** Transform raw automobile-trip records into meaningful mobility segments using K-Means clustering.
