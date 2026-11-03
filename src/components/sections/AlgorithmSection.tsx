import { Panel, Tag, Divider } from '@/components/ui';

const STEPS = [
  { n: 1, title: 'Initialize K centroids', detail: 'Use K-Means++ to place K initial centroids so they are spread apart, reducing the risk of poor convergence.' },
  { n: 2, title: 'Compute Euclidean distances', detail: 'For every observation x, compute the squared Euclidean distance to each of the K centroids.' },
  { n: 3, title: 'Assign to nearest centroid', detail: 'Each observation is assigned to the cluster whose centroid is closest, minimising its individual contribution to WCSS.' },
  { n: 4, title: 'Update centroids', detail: 'Recompute each centroid as the mean of all observations assigned to it. This minimises WCSS for the current assignment.' },
  { n: 5, title: 'Repeat until convergence', detail: 'Loop steps 2–4 until no point changes cluster, or max_iter is reached. WCSS decreases monotonically each iteration.' },
];

const ASSUMPTIONS = [
  'Clusters are roughly spherical and similar in spread — K-Means uses Euclidean distance, so it favours convex, isotropic groups.',
  'The number of clusters K must be chosen in advance; it cannot be inferred from the algorithm itself.',
  'Scale matters: features with large numerical ranges dominate the distance metric unless data is standardised.',
  'K-Means is sensitive to outliers; a single distant point can pull a centroid far from the bulk of its cluster.',
];

const LIMITATIONS = [
  'Cannot represent overlapping or non-convex clusters; every point belongs to exactly one cluster.',
  'Converges to a local minimum of WCSS, not necessarily the global minimum — hence n_init restarts.',
  'The final clusters depend on the initial centroid placement (mitigated by k-means++ and a fixed random_state).',
  'Hard assignment: no probability of membership (unlike a Gaussian Mixture Model).',
];



export function AlgorithmSection() {
  return (
    <div className="space-y-6 animate-fadeIn max-w-5xl">
      <Panel title="K-Means Algorithm" subtitle="Unsupervised partitioning of n observations into K clusters">
        <p className="text-sage text-sm leading-relaxed max-w-3xl">
          K-Means is an iterative unsupervised algorithm that partitions <span className="font-mono text-sage-bright">n</span> observations
          into <span className="font-mono text-sage-bright">K</span> clusters by minimising the
          within-cluster sum of squared distances. It alternates between two steps — assignment
          and update — until the cluster labels stop changing.
        </p>
      </Panel>

      <Panel title="Why K-Means?" subtitle="Comparison with the clustering algorithms in this case study">
        <p className="text-sage text-xs leading-relaxed mb-4">
          The objective is to group automobile trips using their numeric travel characteristics, then describe each group with interpretable profiles. K-Means is selected because it is efficient on this trip-level dataset, works naturally with scaled numeric features, and provides centroids that can be explained in the original units. This is a case-specific choice, not a claim that it is always the best clustering method.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-xs">
            <thead>
              <tr className="text-sage-dim uppercase tracking-wider text-[10px] border-b border-border-soft">
                <th className="text-left p-3">Clustering method</th>
                <th className="text-left p-3">How it works</th>
                <th className="text-left p-3">Strength</th>
                <th className="text-left p-3">Trade-off for MoveSense</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border-soft/50 bg-amber/5">
                <td className="p-3 text-amber font-mono">K-Means <span className="text-[10px]">(chosen)</span></td>
                <td className="p-3 text-sage">Assigns each trip to the nearest centroid, then updates each centroid to the mean of its assigned trips.</td>
                <td className="p-3 text-sage">Fast, scalable, reproducible, and easy to explain through cluster means and sizes.</td>
                <td className="p-3 text-sage">K must be selected; sensitive to outliers and scaling; favours compact, roughly spherical groups.</td>
              </tr>
              <tr className="border-b border-border-soft/50">
                <td className="p-3 text-sage-bright font-mono">Gaussian Mixture Model (EM)</td>
                <td className="p-3 text-sage">Models the data as a mixture of Gaussian distributions. Expectation–maximisation alternates between estimating memberships and updating distribution parameters.</td>
                <td className="p-3 text-sage">Can model overlapping groups and different covariance shapes; provides membership probabilities.</td>
                <td className="p-3 text-sage">More parameters and distributional assumptions; interpretation and convergence can be more involved.</td>
              </tr>
              <tr className="border-b border-border-soft/50">
                <td className="p-3 text-sage-bright font-mono">Hierarchical clustering</td>
                <td className="p-3 text-sage">Repeatedly merges or splits groups to create a hierarchy; a dendrogram can show the structure.</td>
                <td className="p-3 text-sage">Reveals nested relationships and lets the analyst inspect different cut levels.</td>
                <td className="p-3 text-sage">Can be computationally expensive for many trips; outcomes depend on distance and linkage choices.</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
          <div className="bg-panel-2 border border-border-soft rounded-md p-4">
            <div className="text-sage-bright text-xs font-medium mb-1">Reason for selection</div>
            <p className="text-sage text-xs leading-relaxed">K-Means provides a clear baseline for thousands of trip records. After scaling the features, it minimises within-cluster sum of squares and returns centroids that can be translated into average distance, duration, and departure patterns.</p>
          </div>
          <div className="bg-panel-2 border border-border-soft rounded-md p-4">
            <div className="text-sage-bright text-xs font-medium mb-1">How we check whether it is appropriate</div>
            <p className="text-sage text-xs leading-relaxed">Compare candidate K values using the elbow curve and silhouette score, then inspect cluster sizes and trip profiles. A high silhouette alone is not enough: a tiny outlier-only cluster can inflate it and may not be useful for the case study.</p>
          </div>
        </div>
      </Panel>

      <Panel title="Related methods: PCA and Factor Analysis" subtitle="Useful analytical methods, but not clustering algorithms">
        <p className="text-sage text-xs leading-relaxed mb-4">
          PCA and Factor Analysis are often discussed alongside clustering because both can reduce or summarise features. They do not assign trips to clusters by themselves. MoveSense still uses K-Means to produce every cluster label.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-panel-2 border border-border-soft rounded-md p-4">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-amber text-xs font-mono">Principal Component Analysis (PCA)</span>
              <Tag tone="moss">Used for graphing</Tag>
            </div>
            <p className="text-sage text-xs leading-relaxed">Transforms correlated numeric features into orthogonal components that capture as much total variance as possible. In this project, PCA projects the scaled feature space into two dimensions so the existing K-Means labels can be visualised. The PCA coordinates do not train or replace K-Means.</p>
            <p className="text-sage-dim text-[11px] leading-relaxed mt-2">Limitation: components can be harder to interpret in the original units, and variance captured is not the same as cluster quality.</p>
          </div>
          <div className="bg-panel-2 border border-border-soft rounded-md p-4">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-amber text-xs font-mono">Factor Analysis (FA)</span>
              <Tag>Not used for clustering</Tag>
            </div>
            <p className="text-sage text-xs leading-relaxed">Explains correlations among observed variables using a smaller number of latent factors plus variable-specific error. FA is useful when the research question assumes underlying constructs that influence several measured variables.</p>
            <p className="text-sage-dim text-[11px] leading-relaxed mt-2">Why it is not the main method here: the case study is to segment trips from directly interpretable travel measurements, not to infer latent psychological or behavioural factors. FA could be explored as preprocessing in a separate experiment, followed by K-Means.</p>
          </div>
        </div>
        <div className="mt-4 border border-border-soft rounded-md p-3">
          <div className="text-sage-bright text-xs font-medium mb-1">Keep the roles separate</div>
          <p className="text-sage text-xs leading-relaxed">K-Means = clustering and assigning trip labels. PCA = dimensionality reduction for the two-dimensional evaluation plot. Factor Analysis = latent-factor modelling, not a clustering method. The current training backend fits K-Means only.</p>
        </div>
      </Panel>

      {/* Objective function */}
      <Panel title="Mathematical Objective" subtitle="The quantity K-Means minimises">
        <div className="bg-ink/80 border border-border-soft rounded-md p-6 text-center">
          <div className="text-sage-dim text-[11px] uppercase tracking-wider mb-3 font-mono">Within-Cluster Sum of Squares (WCSS / Inertia)</div>
          <div className="font-mono text-sage-bright text-lg md:text-xl leading-relaxed">
            WCSS = <span className="text-amber">Σ</span><sub className="text-sage-dim">k=1..K</sub>{' '}
            <span className="text-amber">Σ</span><sub className="text-sage-dim">x ∈ C<sub>k</sub></sub>{' '}
            ‖ x − μ<sub>k</sub> ‖²
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
          <div className="bg-panel-2 border border-border-soft rounded-md p-4">
            <div className="text-sage-bright text-xs font-mono mb-1">μ<sub>k</sub> = centroid of cluster k</div>
            <p className="text-sage text-xs leading-relaxed">
              The mean of all observations assigned to cluster k. Updating μ<sub>k</sub> to this
              mean is exactly what minimises WCSS for the current assignment.
            </p>
          </div>
          <div className="bg-panel-2 border border-border-soft rounded-md p-4">
            <div className="text-sage-bright text-xs font-mono mb-1">‖ x − μ<sub>k</sub> ‖² = squared distance</div>
            <p className="text-sage text-xs leading-relaxed">
              The squared Euclidean distance between an observation and its assigned centroid.
              Squaring penalises distant points more heavily, producing compact clusters.
            </p>
          </div>
        </div>
      </Panel>

      {/* Step-by-step */}
      <Panel title="Algorithm Steps" subtitle="The assign–update loop, in detail">
        <div className="space-y-4">
          {STEPS.map((s) => (
            <div key={s.n} className="flex items-start gap-4">
              <div className="shrink-0 w-10 h-10 rounded-md bg-amber/10 border border-amber/30 flex items-center justify-center text-amber font-mono text-sm">
                {s.n}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sage-bright text-sm font-medium">{s.title}</span>
                  {s.n === 1 && <Tag tone="amber">k-means++</Tag>}
                  {s.n === 3 && <Tag>assignment step</Tag>}
                  {s.n === 4 && <Tag tone="moss">update step</Tag>}
                  {s.n === 5 && <Tag tone="rust">convergence</Tag>}
                </div>
                <p className="text-sage text-xs leading-relaxed mt-1 max-w-2xl">{s.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      {/* Flowchart */}
      <Panel title="Algorithm Flowchart" subtitle="The control flow of a single K-Means run">
        <div className="flex flex-col items-center gap-3 py-2">
          {[
            { label: 'Start: raw data X, K, init, n_init, max_iter', tone: 'sage' },
            { label: 'Initialize K centroids (k-means++)', tone: 'amber' },
            { label: 'Compute Euclidean distance ‖x − μ‖² for all points', tone: 'sage' },
            { label: 'Assign each point to nearest centroid', tone: 'sage' },
            { label: 'Update centroids = mean of assigned points', tone: 'moss' },
            { label: 'Centroids changed? / max_iter reached?', tone: 'amber', diamond: true },
            { label: 'Record WCSS; restart if n_init not exhausted', tone: 'amber' },
            { label: 'Output: final clusters + lowest-WCSS model', tone: 'sage' },
          ].map((node, i) => (
            <div key={i} className="flex flex-col items-center gap-3">
              <div
                className={`px-5 py-2.5 rounded-md border text-center text-xs font-mono ${
                  node.tone === 'amber' ? 'border-amber/40 bg-amber/10 text-amber' :
                  node.tone === 'moss' ? 'border-moss/40 bg-moss/10 text-moss' :
                  'border-border bg-panel-2 text-sage-bright'
                } ${node.diamond ? 'rotate-0' : ''}`}
              >
                {node.label}
              </div>
              {i < 7 && <span className="text-amber/40 font-mono text-xs">↓</span>}
            </div>
          ))}
          <div className="text-sage-dim text-[10px] font-mono mt-2">
            ◇ Decision node · if no, loop back to assignment step
          </div>
        </div>
      </Panel>



      {/* Key concepts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Panel title="Key Concepts" subtitle="Terminology used throughout the project">
          <div className="space-y-3">
            <div>
              <div className="text-amber text-xs font-mono mb-1">Centroid (μ)</div>
              <p className="text-sage text-xs leading-relaxed">The arithmetic mean of all points in a cluster. It may not coincide with any actual observation.</p>
            </div>
            <div>
              <div className="text-amber text-xs font-mono mb-1">Dissimilarity</div>
              <p className="text-sage text-xs leading-relaxed">Measured here by squared Euclidean distance. K-Means minimises the total dissimilarity within clusters.</p>
            </div>
            <div>
              <div className="text-amber text-xs font-mono mb-1">Convergence</div>
              <p className="text-sage text-xs leading-relaxed">Reached when the assignment step leaves every point in its current cluster — no label changes between iterations.</p>
            </div>
            <div>
              <div className="text-amber text-xs font-mono mb-1">Feature Scaling</div>
              <p className="text-sage text-xs leading-relaxed">Standardising features to zero mean and unit variance so that no single feature dominates the Euclidean distance.</p>
            </div>
          </div>
        </Panel>

        <div className="space-y-6">
          <Panel title="Assumptions" subtitle="What K-Means presupposes">
            <ul className="space-y-2">
              {ASSUMPTIONS.map((a, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-amber/60 font-mono text-[11px] mt-0.5">›</span>
                  <span className="text-sage text-xs leading-relaxed">{a}</span>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>

      <Panel title="Strengths and Limitations" subtitle="An honest assessment of the algorithm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="text-moss text-xs font-mono uppercase tracking-wider mb-3">Strengths</div>
            <ul className="space-y-2">
              <li className="flex items-start gap-2"><span className="text-moss/60 font-mono text-[11px] mt-0.5">›</span><span className="text-sage text-xs leading-relaxed">Scales well to large datasets — each iteration is O(n·K·d).</span></li>
              <li className="flex items-start gap-2"><span className="text-moss/60 font-mono text-[11px] mt-0.5">›</span><span className="text-sage text-xs leading-relaxed">Simple to implement and interpret; clusters map to centroid means.</span></li>
              <li className="flex items-start gap-2"><span className="text-moss/60 font-mono text-[11px] mt-0.5">›</span><span className="text-sage text-xs leading-relaxed">Guaranteed to converge (WCSS is bounded below and decreases monotonically).</span></li>
              <li className="flex items-start gap-2"><span className="text-moss/60 font-mono text-[11px] mt-0.5">›</span><span className="text-sage text-xs leading-relaxed">Reproducible when random_state is fixed and k-means++ is used.</span></li>
            </ul>
          </div>
          <div>
            <div className="text-rust text-xs font-mono uppercase tracking-wider mb-3">Limitations</div>
            <ul className="space-y-2">
              {LIMITATIONS.map((l, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-rust/60 font-mono text-[11px] mt-0.5">›</span>
                  <span className="text-sage text-xs leading-relaxed">{l}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Panel>
    </div>
  );
}
