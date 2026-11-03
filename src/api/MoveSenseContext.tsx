import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

export interface TrainParams {
  min_k: number; max_k: number; selected_k?: number; init: string;
  n_init: number; max_iter: number; random_state: number; auto_mode_codes: number[];
}
export interface TrainingResult {
  status: string;
  dataset: { filename: string; source_rows: number; mode_filtered_rows: number | null; valid_trip_count: number; unit_of_analysis: string; note: string };
  parameters: { min_k: number; max_k: number; selected_k: number; init: string; n_init: number; max_iter: number; random_state: number; features: string[]; scaling: string; peak_hours: number[] };
  metrics: { selected_k: number; silhouette_score: number; inertia: number; pca_variance_ratio: number[] };
  evaluation: { k: number; inertia: number; silhouette: number }[];
  cluster_profiles: { cluster: number; trip_count: number; avg_distance_miles: number; avg_duration_min: number; avg_departure_hour: number; peak_hour_share: number; percentage: number }[];
  pca_points: { pc1: number; pc2: number; cluster: number }[];
}
type ContextValue = {
  apiOnline: boolean; checking: boolean; dataset: any; results: TrainingResult | null;
  busy: boolean; error: string | null; message: string | null;
  uploadDataset: (file: File) => Promise<void>;
  trainModel: (params: TrainParams) => Promise<void>;
  refresh: () => Promise<void>; clearMessage: () => void;
};
const Context = createContext<ContextValue | null>(null);

export function MoveSenseProvider({ children }: { children: ReactNode }) {
  const [apiOnline, setApiOnline] = useState(false);
  const [checking, setChecking] = useState(true);
  const [dataset, setDataset] = useState<any>(null);
  const [results, setResults] = useState<TrainingResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const refresh = async () => {
    setChecking(true);
    try {
      const health = await fetch(`${API_BASE}/api/health`);
      if (!health.ok) throw new Error('API health check failed');
      setApiOnline(true);
      const s = await fetch(`${API_BASE}/api/status`).then(r => r.json());
      setDataset(s.dataset ?? null);
      if (s.results_available) {
        const r = await fetch(`${API_BASE}/api/results`);
        if (r.ok) setResults(await r.json());
      }
      setError(null);
    } catch {
      setApiOnline(false);
    } finally { setChecking(false); }
  };

  useEffect(() => { void refresh(); }, []);

  const uploadDataset = async (file: File) => {
    setBusy(true); setError(null); setMessage(null);
    try {
      const form = new FormData(); form.append('file', file);
      const response = await fetch(`${API_BASE}/api/dataset/upload`, { method: 'POST', body: form });
      const body = await response.json();
      if (!response.ok) throw new Error(body.detail || 'Upload failed');
      setDataset(body); setResults(null);
      setMessage(`Loaded ${Number(body.source_rows).toLocaleString()} source rows from ${body.filename}. Review detected columns and verify automobile mode codes before training.`);
    } catch (e) { setError(e instanceof Error ? e.message : 'Upload failed'); }
    finally { setBusy(false); }
  };


  const trainModel = async (params: TrainParams) => {
    setBusy(true); setError(null); setMessage(null);
    try {
      const response = await fetch(`${API_BASE}/api/train`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(params)
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.detail || 'Training failed');
      setResults(body); setDataset((previous: any) => ({ ...(previous ?? {}), ...body.dataset }));
      setMessage(`Training complete: ${Number(body.dataset.valid_trip_count).toLocaleString()} trips, K=${body.metrics.selected_k}.`);
    } catch (e) { setError(e instanceof Error ? e.message : 'Training failed'); }
    finally { setBusy(false); }
  };

  const value = useMemo(() => ({
    apiOnline, checking, dataset, results, busy, error, message,
    uploadDataset, trainModel, refresh, clearMessage: () => setMessage(null),
  }), [apiOnline, checking, dataset, results, busy, error, message]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useMoveSense() {
  const value = useContext(Context);
  if (!value) throw new Error('useMoveSense must be used within MoveSenseProvider');
  return value;
}
