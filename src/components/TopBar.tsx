import { Menu, Database } from 'lucide-react';

export function TopBar({ onMenu, sectionLabel }: { onMenu: () => void; sectionLabel: string }) {
  return (
    <header className="sticky top-0 z-20 bg-ink/90 backdrop-blur-sm border-b border-border-soft">
      <div className="flex items-center justify-between px-4 md:px-8 h-14">
        <div className="flex items-center gap-3">
          <button onClick={onMenu} className="md:hidden text-sage-dim hover:text-sage-bright" aria-label="Open navigation">
            <Menu size={20} />
          </button>
          <div className="text-sage-dim text-xs font-mono hidden sm:block">
            movesense / <span className="text-sage-bright">{sectionLabel}</span>
          </div>
        </div>
        <a href="https://nhts.ornl.gov/" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-sage-dim hover:text-amber text-xs font-mono transition-colors">
          <Database size={14} />
          <span>NHTS data source</span>
        </a>
      </div>
    </header>
  );
}
