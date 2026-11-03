import { Activity, Cpu, SlidersHorizontal, BarChart3, Code, X, Database } from 'lucide-react';
import { NAV_ITEMS, type SectionId } from '@/data/model';
import { useMoveSense } from '@/api/MoveSenseContext';

const ICONS: Record<SectionId, typeof Activity> = {
  overview: Activity,
  algorithm: Cpu,
  parameters: SlidersHorizontal,
  evaluation: BarChart3,
  code: Code,
};

export function Sidebar({
  active,
  onSelect,
  mobileOpen,
  onCloseMobile,
}: {
  active: SectionId;
  onSelect: (id: SectionId) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}) {
  const { apiOnline, dataset, results } = useMoveSense();
  const trained = results?.status === 'trained';

  return (
    <>
      {mobileOpen && <div className="fixed inset-0 bg-black/60 z-30 md:hidden" onClick={onCloseMobile} />}
      <aside className={`fixed md:sticky top-0 left-0 z-40 h-screen w-64 shrink-0 bg-ink border-r border-border-soft flex flex-col transition-transform duration-300 md:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="px-5 py-5 border-b border-border-soft">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-md bg-amber/10 border border-amber/30 flex items-center justify-center"><Activity className="text-amber" size={18} /></div>
              <div><div className="text-sage-bright font-semibold text-sm tracking-tight">MoveSense</div><div className="text-sage-dim text-[10px] font-mono uppercase tracking-wider">Trip Pattern Analysis</div></div>
            </div>
            <button onClick={onCloseMobile} className="md:hidden text-sage-dim hover:text-sage-bright" aria-label="Close navigation"><X size={18} /></button>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const Icon = ICONS[item.id];
            const isActive = active === item.id;
            return <button key={item.id} onClick={() => { onSelect(item.id); onCloseMobile(); }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left transition-all group ${isActive ? 'bg-amber/10 border border-amber/30 text-amber' : 'border border-transparent text-sage hover:bg-panel hover:border-border-soft'}`}>
              <Icon size={16} className={isActive ? 'text-amber' : 'text-sage-dim group-hover:text-sage'} />
              <span className="text-xs flex-1 leading-tight">{item.label}</span>
              <span className={`font-mono text-[10px] ${isActive ? 'text-amber/60' : 'text-sage-dim/40'}`}>{item.index}</span>
            </button>;
          })}
        </nav>

        <div className="px-5 py-4 border-t border-border-soft space-y-2">
          <div className="flex items-center gap-2 text-[10px] font-mono text-sage-dim"><span className={`w-1.5 h-1.5 rounded-full ${apiOnline ? 'bg-moss' : 'bg-rust'}`} /><span>{apiOnline ? 'API CONNECTED' : 'API OFFLINE'}</span></div>
          <div className="flex items-center gap-2 text-[10px] font-mono text-sage-dim"><Database size={11} /><span>{dataset ? 'TRIP DATA LOADED' : 'DATA NOT LOADED'}</span></div>
          <div className="text-sage-dim/60 text-[10px] font-mono">{trained ? 'MODEL TRAINED' : 'MODEL NOT TRAINED'}</div>
        </div>
      </aside>
    </>
  );
}
