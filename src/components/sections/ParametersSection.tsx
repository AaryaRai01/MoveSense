import { useState } from 'react';
import { Panel, Tag, Divider, Note, KV } from '@/components/ui';
import { PARAM_SPECS, TRAINING_PIPELINE } from '@/data/model';
import { SlidersHorizontal, RotateCw, Play, Info } from 'lucide-react';
import { useMoveSense } from '@/api/MoveSenseContext';

export function ParametersSection() {
  const { apiOnline, dataset, results, busy, error, message, trainModel } = useMoveSense();
  const [autoCodes, setAutoCodes] = useState('1,2');
  const [params, setParams] = useState<Record<string, number | string>>(() =>
    Object.fromEntries(
      PARAM_SPECS.map((p) => [
        p.key,
        p.control === 'select' ? (p.options?.[0].value ?? '') : p.defaultValue,
      ])
    )
  );

  const [kMin, setKMin] = useState(2);
  const [kMax, setKMax] = useState(8);
  const [activeSpec, setActiveSpec] = useState<null | typeof PARAM_SPECS[number]>(null);

  const update = (key: string, val: number | string) => setParams((p) => ({ ...p, [key]: val }));

  const kCandidates = Array.from({ length: kMax - kMin + 1 }, (_, i) => kMin + i);

  return (
    <div className="space-y-6 animate-fadeIn max-w-5xl">
      <Panel title="Interactive Parameter Panel" subtitle="Changes are sent to FastAPI when you train the model">
        <div className="flex items-start gap-2 mb-4">
          <Info size={15} className="text-amber shrink-0 mt-0.5" />
          <p className="text-sage text-xs leading-relaxed">
            Changing these controls updates the interface and the generated code snippet, but
            does <span className="text-sage-bright">not</span> retrain the model. Actual retraining
            happens on the Python FastAPI backend, which returns new inertia and silhouette values.
          </p>
        </div>

        {/* K candidate range */}
        <div className="bg-panel-2 border border-border-soft rounded-md p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <SlidersHorizontal size={14} className="text-amber" />
            <span className="text-sage-bright text-xs font-mono uppercase tracking-wider">Candidate K range</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-sage-dim text-[11px] font-mono">min K</span>
              <input
                type="range" min={2} max={7} step={1} value={kMin}
                onChange={(e) => setKMin(Math.min(Number(e.target.value), kMax - 1))}
                className="w-full accent-amber mt-1"
              />
              <span className="text-amber font-mono text-sm">{kMin}</span>
            </label>
            <label className="block">
              <span className="text-sage-dim text-[11px] font-mono">max K</span>
              <input
                type="range" min={3} max={8} step={1} value={kMax}
                onChange={(e) => setKMax(Math.max(Number(e.target.value), kMin + 1))}
                className="w-full accent-amber mt-1"
              />
              <span className="text-amber font-mono text-sm">{kMax}</span>
            </label>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-3">
            {kCandidates.map((k) => (
              <Tag key={k} tone="amber">{k}</Tag>
            ))}
          </div>
        </div>

        {/* Other params */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {PARAM_SPECS.filter((p) => p.key !== 'n_clusters_candidates').map((spec) => (
            <div key={spec.key} className="bg-panel-2 border border-border-soft rounded-md p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sage-bright text-xs font-mono">{spec.label}</span>
                <button
                  onClick={() => setActiveSpec(activeSpec === spec ? null : spec)}
                  className="text-sage-dim hover:text-amber transition-colors"
                >
                  <Info size={13} />
                </button>
              </div>
              {spec.control === 'slider' ? (
                <>
                  <input
                    type="range"
                    min={spec.min}
                    max={spec.max}
                    step={spec.step}
                    value={Number(params[spec.key])}
                    onChange={(e) => update(spec.key, Number(e.target.value))}
                    className="w-full accent-amber"
                  />
                  <div className="flex justify-between mt-1">
                    <span className="text-sage-dim text-[10px] font-mono">{spec.min}</span>
                    <span className="text-amber font-mono text-sm">{params[spec.key]}</span>
                    <span className="text-sage-dim text-[10px] font-mono">{spec.max}</span>
                  </div>
                </>
              ) : (
                <select
                  value={String(params[spec.key])}
                  onChange={(e) => update(spec.key, e.target.value)}
                  className="w-full bg-ink border border-border-soft rounded px-2 py-1.5 text-sage-bright text-xs font-mono focus:border-amber/40 outline-none"
                >
                  {spec.options?.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              )}
              {activeSpec === spec && (
                <div className="mt-3 pt-3 border-t border-border-soft space-y-2 animate-fadeIn">
                  <div>
                    <span className="text-sage-dim text-[10px] uppercase tracking-wider">What it controls</span>
                    <p className="text-sage text-[11px] leading-relaxed mt-0.5">{spec.explanation}</p>
                  </div>
                  <div>
                    <span className="text-sage-dim text-[10px] uppercase tracking-wider">Why used</span>
                    <p className="text-sage text-[11px] leading-relaxed mt-0.5">{spec.why}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <Divider label="Generated sklearn call" />
        <div className="bg-ink/80 border border-border-soft rounded-md p-4 font-mono text-xs overflow-x-auto">
          <span className="code-token-kw">from</span> <span className="code-token-mod">sklearn.cluster</span> <span className="code-token-kw">import</span> <span className="code-token-fn">KMeans</span>{'\n'}
          <span className="code-token-var">kmeans</span> <span className="code-token-op">=</span> <span className="code-token-fn">KMeans</span>({'\n  '}
          n_clusters<span className="code-token-op">=</span><span className="code-token-num">{kMin}</span>,{'\n  '}
          init<span className="code-token-op">=</span><span className="code-token-str">"{String(params['init'])}"</span>,{'\n  '}
          n_init<span className="code-token-op">=</span><span className="code-token-num">{params['n_init']}</span>,{'\n  '}
          max_iter<span className="code-token-op">=</span><span className="code-token-num">{params['max_iter']}</span>,{'\n  '}
          random_state<span className="code-token-op">=</span><span className="code-token-num">{params['random_state']}</span>,{'\n'}
          )
        </div>

        <div className="mt-4 bg-panel-2 border border-border-soft rounded-md p-3">
          <label className="block text-sage-bright text-xs font-mono mb-1">Verified automobile mode codes (comma-separated)</label>
          <input value={autoCodes} onChange={e => setAutoCodes(e.target.value)} placeholder="Enter codes from the matching NHTS codebook, e.g. ..." className="w-full bg-ink border border-border-soft rounded px-3 py-2 text-sage text-xs font-mono outline-none focus:border-amber/50" />
          <p className="text-sage-dim text-[10px] mt-2">The bundled CSV uses TRIPMODE values 1 and 2. Verify the definitions against the matching NHTS codebook before reporting results. If you upload another release or use TRPTRANS, update the codes accordingly.</p>
        </div>
        {message && <p className="text-moss text-xs mt-3">{message}</p>}
        {error && <p className="text-rust text-xs mt-3">{error}</p>}
        {results && <p className="text-sage text-xs mt-3">Last run: {results.dataset.valid_trip_count.toLocaleString()} valid trips · selected K={results.metrics.selected_k} · silhouette={results.metrics.silhouette_score.toFixed(4)}</p>}
        <div className="flex items-center gap-3 mt-4">
          <button
            disabled={!apiOnline || !dataset || busy}
            onClick={() => void trainModel({
              min_k: kMin, max_k: kMax, init: String(params.init || 'k-means++'),
              n_init: Number(params.n_init), max_iter: Number(params.max_iter),
              random_state: Number(params.random_state),
              auto_mode_codes: autoCodes.split(',').map(v => Number(v.trim())).filter(v => Number.isFinite(v)),
            })}
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-amber/10 border border-amber/30 text-amber text-xs font-mono disabled:opacity-40 disabled:cursor-not-allowed hover:bg-amber/15"
          >
            <Play size={13} /> {busy ? 'Training…' : 'Train K-Means'}
          </button>
          <button
            onClick={() => { setKMin(2); setKMax(8); setParams(Object.fromEntries(PARAM_SPECS.map(p => [p.key, p.control === 'select' ? (p.options?.[0].value ?? '') : p.defaultValue]))); setAutoCodes('1,2'); }}
            className="flex items-center gap-2 px-4 py-2 rounded-md bg-panel-2 border border-border-soft text-sage-dim text-xs font-mono hover:text-amber"
          >
            <RotateCw size={13} /> Reset
          </button>
          <span className="text-sage-dim text-[11px] font-mono">{apiOnline ? (dataset ? 'Dataset ready' : 'Bundled dataset ready — check Dataset details') : 'Start FastAPI backend first'}</span>
        </div>
      </Panel>

      <Panel title="Parameter Reference" subtitle="What every hyperparameter controls and why it is used">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-sage-dim uppercase tracking-wider text-[10px] border-b border-border-soft">
                <th className="text-left py-2 px-3 font-mono">Parameter</th>
                <th className="text-left py-2 px-3 font-mono">Default</th>
                <th className="text-left py-2 px-3 font-mono">What it controls</th>
                <th className="text-left py-2 px-3 font-mono">Why used</th>
              </tr>
            </thead>
            <tbody>
              {PARAM_SPECS.map((p) => (
                <tr key={p.key} className="border-b border-border-soft/50 align-top hover:bg-panel-2/50">
                  <td className="py-2.5 px-3">
                    <span className="text-amber font-mono">{p.label}</span>
                    <div className="text-sage-dim text-[10px] font-mono mt-0.5">{p.sklearn}</div>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-sage-bright">
                    {p.control === 'select' ? p.options?.[0].label : p.defaultValue}
                  </td>
                  <td className="py-2.5 px-3 text-sage max-w-[220px]">{p.explanation}</td>
                  <td className="py-2.5 px-3 text-sage max-w-[240px]">{p.why}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title="Training Pipeline" subtitle="The ordered sequence from raw NHTS data to labelled clusters">
        <div className="space-y-0">
          {TRAINING_PIPELINE.map((step, i) => (
            <div key={step.step} className="flex items-center gap-3">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-md bg-amber/10 border border-amber/30 flex items-center justify-center text-amber font-mono text-xs shrink-0">
                  {step.step}
                </div>
                {i < TRAINING_PIPELINE.length - 1 && <div className="w-px h-6 bg-border" />}
              </div>
              <div className="pb-3">
                <div className="text-sage-bright text-xs font-medium">{step.label}</div>
                <div className="text-sage-dim text-[11px] leading-relaxed">{step.detail}</div>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Scaling — StandardScaler" subtitle="Why and how features are standardised">
        <p className="text-sage text-xs leading-relaxed max-w-2xl mb-4">
          K-Means uses Euclidean distance, which is dominated by features with large numerical
          ranges. Trip distance can be 0–200 miles while departure hour is 0–23 — without
          scaling, distance alone would determine cluster membership. StandardScaler
          transforms each feature to zero mean and unit variance so all four features
          contribute comparably to the distance metric.
        </p>
        <div className="bg-ink/80 border border-border-soft rounded-md p-4 font-mono text-xs">
          <span className="code-token-var">z</span> <span className="code-token-op">=</span> (x <span className="code-token-op">-</span> μ) <span className="code-token-op">/</span> σ
        </div>
        <Divider />
        <div className="space-y-1">
          <KV k="Distance (mi)" v="μ ≈ 8, σ ≈ 9 → scaled" />
          <KV k="Duration (min)" v="μ ≈ 18, σ ≈ 15 → scaled" />
          <KV k="Depart hour" v="μ ≈ 13, σ ≈ 5 → scaled" />
          <KV k="Peak indicator" v="μ ≈ 0.3, σ ≈ 0.46 → scaled" />
        </div>
        <p className="text-sage-dim text-[11px] mt-3">Values shown are typical ranges, not computed statistics.</p>
      </Panel>

      <Note tone="amber">
        The parameter panel controls only the frontend display state. The buttons are disabled
        until a Python backend endpoint is connected to perform real training and return
        updated inertia and silhouette scores.
      </Note>
    </div>
  );
}
