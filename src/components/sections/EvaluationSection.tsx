import { Panel, Note } from '@/components/ui';
import { useMoveSense } from '@/api/MoveSenseContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, ZAxis, Legend, BarChart, Bar } from 'recharts';

const palette = ['#E8A34A', '#6B8A5F', '#C9694E', '#D9C7A3', '#F2BC74', '#8FBF7B', '#B07A2E'];

export function EvaluationSection() {
  const { results } = useMoveSense();
  if (!results) return <div className="space-y-6 max-w-5xl"><Panel title="Training required" subtitle="Graphs are generated from the real fitted model"><p className="text-sage text-sm leading-relaxed">Open Training and run K-Means on the loaded NHTS trip records. After training, this page will display the actual inertia, silhouette score, elbow curve, PCA projection, cluster-profile heatmap, cluster sizes, and original-unit profiles returned by the Python backend. No metrics are fabricated.</p></Panel></div>;
  const { evaluation, metrics, pca_points, cluster_profiles, dataset } = results;
  const counts = cluster_profiles.map(p => ({ cluster: `C${p.cluster}`, trips: p.trip_count }));
  const features = [
    { key: 'avg_distance_miles', label: 'Avg distance (mi)' },
    { key: 'avg_duration_min', label: 'Avg duration (min)' },
    { key: 'avg_departure_hour', label: 'Departure hour' },
    { key: 'peak_hour_share', label: 'Peak-hour share' },
  ] as const;
  const means = features.map(f => {
    const vals = cluster_profiles.map(p => Number(p[f.key] ?? 0));
    const max = Math.max(...vals, 1e-9), min = Math.min(...vals);
    return { feature: f.label, ...Object.fromEntries(cluster_profiles.map((p,i) => [`c${p.cluster}`, (vals[i]-min)/(max-min || 1)])) };
  });
  return <div className="space-y-6 animate-fadeIn max-w-5xl">
    <Panel title="Real Training Results" subtitle="Values returned by the Python FastAPI backend">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-panel-2 border border-border-soft rounded-md p-3"><div className="text-sage-dim text-[10px] uppercase">Valid trips</div><div className="text-amber text-lg font-mono">{dataset.valid_trip_count.toLocaleString()}</div></div>
        <div className="bg-panel-2 border border-border-soft rounded-md p-3"><div className="text-sage-dim text-[10px] uppercase">Selected K</div><div className="text-amber text-lg font-mono">{metrics.selected_k}</div></div>
        <div className="bg-panel-2 border border-border-soft rounded-md p-3"><div className="text-sage-dim text-[10px] uppercase">Silhouette</div><div className="text-sage-bright text-lg font-mono">{metrics.silhouette_score.toFixed(4)}</div></div>
        <div className="bg-panel-2 border border-border-soft rounded-md p-3"><div className="text-sage-dim text-[10px] uppercase">Inertia / WCSS</div><div className="text-sage-bright text-lg font-mono">{metrics.inertia.toLocaleString(undefined,{maximumFractionDigits:2})}</div></div>
      </div>
      <p className="text-sage-dim text-xs mt-3">Scores are calculated from the uploaded dataset. Silhouette is an internal clustering metric, not classification accuracy.</p>
    </Panel>
    <Panel title="1. Elbow Curve" subtitle="Candidate K versus within-cluster sum of squares">
      <div className="h-72"><ResponsiveContainer width="100%" height="100%"><LineChart data={evaluation}><CartesianGrid strokeDasharray="3 3" stroke="#33402F"/><XAxis dataKey="k" stroke="#9DAA96"/><YAxis stroke="#9DAA96"/><Tooltip contentStyle={{backgroundColor:'#1B241D',border:'1px solid #33402F'}}/><Line dataKey="inertia" name="Inertia / WCSS" stroke="#E8A34A" strokeWidth={2} dot/></LineChart></ResponsiveContainer></div>
      <p className="text-sage-dim text-xs">Inertia generally decreases as K increases. Select the elbow where the reduction begins to flatten; do not choose K from inertia alone.</p>
    </Panel>
    <Panel title="2. Silhouette Score by K" subtitle="Higher values generally indicate more cohesive and better-separated clusters">
      <div className="h-72"><ResponsiveContainer width="100%" height="100%"><LineChart data={evaluation}><CartesianGrid strokeDasharray="3 3" stroke="#33402F"/><XAxis dataKey="k" stroke="#9DAA96"/><YAxis domain={[-1,1]} stroke="#9DAA96"/><Tooltip contentStyle={{backgroundColor:'#1B241D',border:'1px solid #33402F'}}/><Line dataKey="silhouette" name="Silhouette score" stroke="#8FBF7B" strokeWidth={2} dot/></LineChart></ResponsiveContainer></div>
    </Panel>
    <Panel title="3. PCA Projection" subtitle="A 2D projection for visualization; K-Means trains on the full feature matrix">
      <div className="h-80"><ResponsiveContainer width="100%" height="100%"><ScatterChart><CartesianGrid strokeDasharray="3 3" stroke="#33402F"/><XAxis type="number" dataKey="pc1" name="PC1" stroke="#9DAA96"/><YAxis type="number" dataKey="pc2" name="PC2" stroke="#9DAA96"/><ZAxis range={[25,25]}/><Tooltip contentStyle={{backgroundColor:'#1B241D',border:'1px solid #33402F'}}/><Legend/>{Array.from({length:metrics.selected_k},(_,cluster)=><Scatter key={cluster} name={`Cluster ${cluster}`} data={pca_points.filter(p=>p.cluster===cluster)} fill={palette[cluster%palette.length]} fillOpacity={0.65}/>)}</ScatterChart></ResponsiveContainer></div>
    </Panel>
    <Panel title="4. Cluster Profile Heatmap" subtitle="Values normalized feature-wise across clusters (0 = lower, 1 = higher)">
      <div className="overflow-x-auto"><div className="min-w-[520px] space-y-1">
        <div className="grid gap-1" style={{gridTemplateColumns:`150px repeat(${cluster_profiles.length}, minmax(50px,1fr))`}}><div/>{cluster_profiles.map(p=><div key={p.cluster} className="text-center text-sage-dim text-xs font-mono">C{p.cluster}</div>)}</div>
        {means.map(row=><div key={row.feature} className="grid gap-1" style={{gridTemplateColumns:`150px repeat(${cluster_profiles.length}, minmax(50px,1fr))`}}><div className="text-sage text-xs flex items-center">{row.feature}</div>{cluster_profiles.map(p=>{const v=Number((row as any)[`c${p.cluster}`] ?? 0);return <div key={p.cluster} className="rounded py-3 text-center text-xs font-mono" style={{backgroundColor:`rgba(232,163,74,${0.15+v*0.75})`,color:v>.5?'#111411':'#C8D4C2'}}>{v.toFixed(2)}</div>})}</div>)}
      </div></div>
    </Panel>
    <Panel title="5. Cluster Sizes" subtitle="Number of valid automobile trips assigned to each cluster">
      <div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={counts}><CartesianGrid strokeDasharray="3 3" stroke="#33402F"/><XAxis dataKey="cluster" stroke="#9DAA96"/><YAxis stroke="#9DAA96"/><Tooltip contentStyle={{backgroundColor:'#1B241D',border:'1px solid #33402F'}}/><Bar dataKey="trips" name="Trips" fill="#E8A34A"/></BarChart></ResponsiveContainer></div>
    </Panel>
    <Note tone="amber">Interpret clusters alongside their original-unit profiles. A high silhouette score does not prove that clusters are meaningful commuter categories; validate their practical interpretation.</Note>
  </div>;
}
