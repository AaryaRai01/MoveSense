import { useState } from 'react';
import { MoveSenseProvider, useMoveSense } from '@/api/MoveSenseContext';
import { Sidebar } from '@/components/Sidebar';
import { TopBar } from '@/components/TopBar';
import { NAV_ITEMS, type SectionId } from '@/data/model';
import { OverviewSection } from '@/components/sections/OverviewSection';
import { DatasetSection } from '@/components/sections/DatasetSection';
import { AlgorithmSection } from '@/components/sections/AlgorithmSection';
import { ParametersSection } from '@/components/sections/ParametersSection';
import { EvaluationSection } from '@/components/sections/EvaluationSection';
import { InterpretationSection } from '@/components/sections/InterpretationSection';
import { CodeSection } from '@/components/sections/CodeSection';

function AppContent() {
  const { apiOnline, checking } = useMoveSense();
  const [active, setActive] = useState<SectionId>('overview');
  const [mobileOpen, setMobileOpen] = useState(false);

  const activeItem = NAV_ITEMS.find((n) => n.id === active)!;
  const sectionLabel = activeItem.label;

  const renderSection = () => {
    switch (active) {
      case 'overview': return <OverviewSection />;
      case 'algorithm': return <AlgorithmSection />;
      case 'parameters': return <div className="space-y-8"><DatasetSection /><ParametersSection /></div>;
      case 'evaluation': return <div className="space-y-8"><EvaluationSection /><InterpretationSection /></div>;
      case 'code': return <CodeSection />;
    }
  };

  return (
    <div className="flex min-h-screen bg-ink">
      <Sidebar
        active={active}
        onSelect={setActive}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar onMenu={() => setMobileOpen(true)} sectionLabel={sectionLabel} />
        <main className="flex-1 px-4 md:px-8 py-6 md:py-8 overflow-x-hidden">
          <div className="max-w-6xl mx-auto">
            {renderSection()}
          </div>
        </main>
        <footer className="border-t border-border-soft px-4 md:px-8 py-4">
          <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-2 text-sage-dim text-[11px] font-mono">
            <span>MoveSense · Automobile Travel Pattern Segmentation</span>
            <span>K-Means · API {checking ? 'CHECKING' : apiOnline ? 'CONNECTED' : 'OFFLINE'}</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

function App() { return <MoveSenseProvider><AppContent /></MoveSenseProvider>; }

export default App;
