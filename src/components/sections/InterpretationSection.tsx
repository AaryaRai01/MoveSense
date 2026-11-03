import { Panel, Note } from '@/components/ui';
import { useMoveSense } from '@/api/MoveSenseContext';

export function InterpretationSection() {
  const { results } = useMoveSense();
  if (!results) return <div className="space-y-6 max-w-5xl"><Panel title="Cluster profiles appear after training"><p className="text-sage text-sm leading-relaxed">Run K-Means from the Training section. The profiles below will then use the fitted model's actual mean distance, duration, departure hour, peak-hour share, and trip count.</p></Panel></div>;
  const rows = results.cluster_profiles;
  return <div className="space-y-6 animate-fadeIn max-w-5xl">
    <Panel title="Cluster Profiles" subtitle="Profiles computed from the trained model's actual assignments">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rows.map((c) => <div key={c.cluster} className="bg-panel-2 border border-border-soft rounded-md p-4">
          <div className="flex items-center justify-between gap-2 mb-4"><div><div className="text-amber font-mono text-xs">CLUSTER {c.cluster}</div><div className="text-sage-bright text-lg font-mono mt-1">{Number(c.trip_count).toLocaleString()} trips</div></div><div className="text-sage-dim text-xs font-mono">{Number(c.percentage).toFixed(1)}%</div></div>
          <div className="grid grid-cols-2 gap-2">
            <Metric label="Mean distance" value={`${Number(c.avg_distance_miles).toFixed(2)} mi`} />
            <Metric label="Mean duration" value={`${Number(c.avg_duration_min).toFixed(1)} min`} />
            <Metric label="Mean departure hour" value={`${Number(c.avg_departure_hour).toFixed(1)} h`} />
            <Metric label="Peak-hour share" value={`${(Number(c.peak_hour_share)*100).toFixed(1)}%`} />
          </div>
          <p className="text-sage-dim text-xs leading-relaxed mt-3 border-t border-border-soft pt-3">Interpret this cluster by comparing its metrics with the other clusters. Cluster IDs are arbitrary and do not imply rank or category.</p>
        </div>)}
      </div>
    </Panel>
    <Panel title="Full Profile Table" subtitle="Unscaled feature means in interpretable units">
      <div className="overflow-x-auto"><table className="w-full text-xs"><thead><tr className="text-sage-dim uppercase text-[10px] border-b border-border-soft"><th className="text-left p-2">Cluster</th><th className="text-right p-2">Trips</th><th className="text-right p-2">%</th><th className="text-right p-2">Distance mi</th><th className="text-right p-2">Duration min</th><th className="text-right p-2">Departure h</th><th className="text-right p-2">Peak share</th></tr></thead><tbody>{rows.map(c=><tr key={c.cluster} className="border-b border-border-soft/50"><td className="p-2 text-amber font-mono">{c.cluster}</td><td className="p-2 text-right">{Number(c.trip_count).toLocaleString()}</td><td className="p-2 text-right">{Number(c.percentage).toFixed(1)}%</td><td className="p-2 text-right">{Number(c.avg_distance_miles).toFixed(2)}</td><td className="p-2 text-right">{Number(c.avg_duration_min).toFixed(1)}</td><td className="p-2 text-right">{Number(c.avg_departure_hour).toFixed(1)}</td><td className="p-2 text-right">{(Number(c.peak_hour_share)*100).toFixed(1)}%</td></tr>)}</tbody></table></div>
    </Panel>
    <Note tone="amber">Describe a cluster as short-distance, long-duration, or peak-hour-heavy only after comparing its observed profile with the others. The NHTS represents US travel and should not be generalized to Indian traffic without additional evidence.</Note>
  </div>;
}
function Metric({label,value}:{label:string;value:string}) { return <div className="bg-ink/50 border border-border-soft rounded px-2.5 py-2"><div className="text-sage-dim text-[10px] uppercase">{label}</div><div className="text-sage-bright font-mono text-sm mt-1">{value}</div></div>; }
