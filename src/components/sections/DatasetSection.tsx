import { Panel, Tag, KV, Divider, Note } from '@/components/ui';
import { SOURCE_ATTRIBUTES, FEATURE_SPECS, DATASET_STATUS } from '@/data/model';
import { ExternalLink, Database, Filter, GitBranch, UploadCloud, Wifi, WifiOff } from 'lucide-react';
import { useMoveSense } from '@/api/MoveSenseContext';

const DATA_DICT = [
  { col: 'TRPMILES', desc: 'Trip distance reported by respondent', type: 'float', unit: 'miles' },
  { col: 'TRVLCMIN', desc: 'Travel time for the trip', type: 'float', unit: 'minutes' },
  { col: 'STRTTIME', desc: 'Trip start time as HHMM integer', type: 'int', unit: 'HHMM' },
  { col: 'ENDTIME', desc: 'Trip end time as HHMM integer', type: 'int', unit: 'HHMM' },
  { col: 'TRIPMODE / TRPTRANS', desc: 'Transportation mode (release-specific coded field)', type: 'int(coded)', unit: 'code' },
  { col: 'depart_hour', desc: 'Derived: hour of day from STRTTIME', type: 'int', unit: 'hour' },
  { col: 'is_peak', desc: 'Derived: 1 if depart_hour is a rush hour', type: 'binary', unit: '0/1' },
];

const PREPROCESS_STEPS = [
  { step: 'Mode filter', detail: 'For 2022 NHTS V2.1, retain TRIPMODE codes 1 and 2 (private vehicle driver/passenger). Verify older releases against their own codebook.' },
  { step: 'Null drop', detail: 'Remove rows with missing TRPMILES, TRVLCMIN, or STRTTIME.' },
  { step: 'Range guard', detail: 'Drop trips with distance ≤ 0 or duration ≤ 0 (data-entry errors).' },
  { step: 'Hour derive', detail: 'Compute depart_hour = STRTTIME // 100; clip to [0, 23].' },
  { step: 'Peak flag', detail: 'Set is_peak = 1 if depart_hour ∈ {7,8,9,16,17,18}, else 0.' },
  { step: 'Standardise', detail: 'Fit StandardScaler on the four-feature matrix; store the scaler.' },
];

export function DatasetSection() {
  const { apiOnline, busy, dataset, results, error, message, refresh, uploadDataset } = useMoveSense();

  return (
    <div className="space-y-6 animate-fadeIn max-w-5xl">
      <Panel title="Dataset Input" subtitle="Bundled NHTS automobile-trip data loads automatically; upload another trip CSV to replace it">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2 text-xs font-mono">
            {apiOnline ? <Wifi size={15} className="text-moss" /> : <WifiOff size={15} className="text-rust" />}
            <span className={apiOnline ? "text-moss" : "text-rust"}>{apiOnline ? "API CONNECTED" : "API OFFLINE"}</span>
            <span className="text-sage-dim">· http://127.0.0.1:8000</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => void refresh()} className="px-3 py-1.5 border border-border-soft rounded text-sage text-xs hover:border-amber/40">Recheck API</button>
          </div>
        </div>
        <label className="flex flex-col items-center justify-center gap-2 border border-dashed border-amber/40 rounded-md p-6 cursor-pointer hover:bg-panel-2/50">
          <UploadCloud size={22} className="text-amber" />
          <span className="text-sage-bright text-sm">Replace dataset with a trip CSV</span>
          <span className="text-sage-dim text-[11px] text-center">CSV only · maximum 100 MB · the uploaded file replaces the bundled dataset</span>
          <input type="file" accept=".csv,text/csv" className="hidden" disabled={!apiOnline || busy} onChange={(e) => { const f = e.target.files?.[0]; if (f) void uploadDataset(f); e.currentTarget.value = ''; }} />
        </label>
        {busy && <p className="text-amber text-xs mt-3 font-mono">Processing request…</p>}
        {message && <p className="text-moss text-xs mt-3">{message}</p>}
        {error && <p className="text-rust text-xs mt-3">{error}</p>}
        {dataset && <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-panel-2 border border-border-soft rounded p-3"><div className="text-sage-dim text-[10px] uppercase">File</div><div className="text-sage-bright text-xs mt-1 break-all">{dataset.filename || 'Uploaded dataset'}</div></div>
          <div className="bg-panel-2 border border-border-soft rounded p-3"><div className="text-sage-dim text-[10px] uppercase">Source rows</div><div className="text-amber font-mono text-lg mt-1">{Number(dataset.source_rows ?? dataset.sourceRows ?? dataset.valid_trip_count ?? 0).toLocaleString()}</div></div>
          <div className="bg-panel-2 border border-border-soft rounded p-3"><div className="text-sage-dim text-[10px] uppercase">Training result</div><div className="text-sage-bright font-mono text-sm mt-1">{results ? `K=${results.metrics.selected_k} · trained` : 'Awaiting training'}</div></div>
        </div>}
        {dataset?.detected_columns && <div className="mt-4"><div className="text-sage-bright text-xs mb-2">Detected source columns</div><div className="flex flex-wrap gap-1.5">{Object.entries(dataset.detected_columns).map(([k,v]) => <span key={k} className="px-2 py-1 rounded bg-ink border border-border-soft text-sage-dim text-[10px] font-mono">{k}: {String(v ?? 'not found')}</span>)}</div></div>}
      </Panel>

      <Panel title="Dataset Provenance" subtitle="Where the data comes from and how it is licensed">
        <div className="flex items-start gap-3 mb-4">
          <Database size={18} className="text-amber shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-sage-bright text-sm">National Household Travel Survey (NHTS)</h4>
            <p className="text-sage text-xs leading-relaxed max-w-2xl">
              The NHTS is a periodic national survey of US household travel, conducted by the
              Federal Highway Administration. It records trip-level data including mode,
              distance, duration, and timing — the raw material for travel-pattern analysis.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <a
            href="https://nhts.ornl.gov/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between gap-2 bg-panel-2 border border-border-soft rounded-md px-4 py-3 hover:border-amber/40 transition-colors group"
          >
            <span className="text-sage text-xs font-mono">Official portal</span>
            <span className="flex items-center gap-1.5 text-amber text-xs font-mono group-hover:underline">
              nhts.ornl.gov <ExternalLink size={12} />
            </span>
          </a>
          <a
            href="https://nhts.ornl.gov/documentation"
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between gap-2 bg-panel-2 border border-border-soft rounded-md px-4 py-3 hover:border-amber/40 transition-colors group"
          >
            <span className="text-sage text-xs font-mono">Codebook & docs</span>
            <span className="flex items-center gap-1.5 text-amber text-xs font-mono group-hover:underline">
              /documentation <ExternalLink size={12} />
            </span>
          </a>
        </div>
        <Divider />
        <div className="space-y-1">
          <KV k="Release" v={dataset?.releaseLabel || "Not loaded — verify the exact NHTS release and codebook"} />
          <KV k="Source file" v={dataset?.filename || "Upload NHTS trip CSV above"} />
          <KV k="Automobile trips" v={results ? results.dataset.valid_trip_count.toLocaleString() : <span className="text-rust">awaiting training</span>} />
          <KV k="Final record count" v={results ? results.dataset.valid_trip_count.toLocaleString() : <span className="text-rust">awaiting training</span>} />
        </div>
      </Panel>

      <Panel title="Original vs Selected Attributes" subtitle="Which NHTS columns are used and which are dropped">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-sage-dim uppercase tracking-wider text-[10px] border-b border-border-soft">
                <th className="text-left py-2 px-3 font-mono">Source Column</th>
                <th className="text-left py-2 px-3 font-mono">Description</th>
                <th className="text-center py-2 px-3 font-mono">Selected</th>
              </tr>
            </thead>
            <tbody>
              {SOURCE_ATTRIBUTES.map((attr) => (
                <tr key={attr.source} className="border-b border-border-soft/50 hover:bg-panel-2/50">
                  <td className="py-2.5 px-3 font-mono text-sage-bright">{attr.source}</td>
                  <td className="py-2.5 px-3 text-sage">{attr.description}</td>
                  <td className="py-2.5 px-3 text-center">
                    {attr.selected ? (
                      <Tag tone="amber">yes</Tag>
                    ) : (
                      <span className="text-sage-dim/40 font-mono">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title="Proposed Model Features" subtitle="Source attributes vs engineered features — pending codebook verification">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-sage-dim uppercase tracking-wider text-[10px] border-b border-border-soft">
                <th className="text-left py-2 px-3 font-mono">Feature</th>
                <th className="text-left py-2 px-3 font-mono">Column</th>
                <th className="text-left py-2 px-3 font-mono">Units</th>
                <th className="text-left py-2 px-3 font-mono">Type</th>
                <th className="text-left py-2 px-3 font-mono">Origin</th>
                <th className="text-left py-2 px-3 font-mono">Transformation</th>
                <th className="text-left py-2 px-3 font-mono">Reason</th>
              </tr>
            </thead>
            <tbody>
              {FEATURE_SPECS.map((f) => (
                <tr key={f.name} className="border-b border-border-soft/50 hover:bg-panel-2/50 align-top">
                  <td className="py-2.5 px-3 font-mono text-sage-bright whitespace-nowrap">{f.name}</td>
                  <td className="py-2.5 px-3 font-mono text-amber/80 whitespace-nowrap">{f.column}</td>
                  <td className="py-2.5 px-3 text-sage whitespace-nowrap">{f.units}</td>
                  <td className="py-2.5 px-3"><Tag>{f.type}</Tag></td>
                  <td className="py-2.5 px-3">
                    <Tag tone={f.source === 'engineered' ? 'moss' : 'sage'}>{f.source}</Tag>
                  </td>
                  <td className="py-2.5 px-3 text-sage max-w-[220px]">{f.transformation}</td>
                  <td className="py-2.5 px-3 text-sage max-w-[260px]">{f.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Panel title="Data Dictionary" subtitle="Selected and derived columns">
          <div className="space-y-1">
            {DATA_DICT.map((d) => (
              <KV key={d.col} k={d.col} v={`${d.type} · ${d.unit}`} />
            ))}
          </div>
        </Panel>

        <Panel title="Preprocessing Steps" subtitle="From raw NHTS export to feature matrix">
          <div className="space-y-3">
            {PREPROCESS_STEPS.map((s, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="flex items-center gap-2 shrink-0">
                  <GitBranch size={13} className="text-amber/60" />
                  <span className="text-amber font-mono text-[11px]">{String(i + 1).padStart(2, '0')}</span>
                </div>
                <div>
                  <div className="text-sage-bright text-xs font-medium">{s.step}</div>
                  <div className="text-sage-dim text-[11px] leading-relaxed">{s.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel title="Missing-Value Handling & Automobile-Mode Filtering" subtitle="How rows are kept or dropped">
        <div className="flex items-start gap-3 mb-3">
          <Filter size={16} className="text-amber shrink-0 mt-0.5" />
          <p className="text-sage text-xs leading-relaxed">
            Rows are dropped only when a <span className="text-sage-bright">required column is missing or physically impossible</span> —
            missing values are never imputed, because trip distance and duration are
            respondent-reported and imputation would inject synthetic structure into the
            clustering. Automobile trips are isolated using the NHTS mode codes for private
            vehicles (the release-specific private-vehicle codes); all other modes (walk, transit, etc.) are excluded from the
            analysis scope.
          </p>
        </div>
        <Divider label="Final record count" />
        <div className="text-center py-2">
          <div className="font-mono text-3xl text-amber">{results ? results.dataset.valid_trip_count.toLocaleString() : dataset ? Number(dataset.source_rows ?? 0).toLocaleString() : '—'}</div>
          <div className="text-sage-dim text-xs mt-1">{results ? 'valid trips used in the fitted model' : 'source trip records currently loaded'}</div>
        </div>
      </Panel>

      <Note tone="amber">
        The project includes a bundled NHTS automobile-trip subset to make the workflow runnable immediately. The current subset uses TRIPMODE values 1 and 2; verify those definitions against the matching official codebook before reporting results. An uploaded CSV replaces the bundled file for subsequent training runs and remains in the data folder until replaced or deleted.
      </Note>
    </div>
  );
}
