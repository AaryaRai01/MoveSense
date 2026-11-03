import { type ReactNode } from 'react';

export function Panel({
  children,
  className = '',
  title,
  subtitle,
  accent,
}: {
  children: ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  accent?: boolean;
}) {
  return (
    <section
      className={`bg-panel border border-border-soft rounded-lg shadow-panel ${accent ? 'shadow-glow' : ''} ${className}`}
    >
      {title && (
        <header className="flex items-baseline justify-between gap-4 px-5 py-3.5 border-b border-border-soft">
          <div>
            <h3 className="text-sage-bright font-medium text-[13px] tracking-wide uppercase">{title}</h3>
            {subtitle && <p className="text-sage-dim text-xs mt-0.5">{subtitle}</p>}
          </div>
        </header>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function Tag({ children, tone = 'sage' }: { children: ReactNode; tone?: 'sage' | 'amber' | 'rust' | 'moss' }) {
  const tones: Record<string, string> = {
    sage: 'bg-panel-2 text-sage border-border',
    amber: 'bg-amber/10 text-amber border-amber/30',
    rust: 'bg-rust/10 text-rust border-rust/30',
    moss: 'bg-moss/10 text-moss border-moss/30',
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono border ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function KV({ k, v }: { k: string; v: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2 border-b border-border-soft last:border-0">
      <span className="text-sage-dim text-xs font-mono">{k}</span>
      <span className="text-sage-bright text-xs font-mono text-right">{v}</span>
    </div>
  );
}

export function Stat({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="bg-panel-2 border border-border-soft rounded-md px-4 py-3">
      <div className="text-sage-dim text-[11px] uppercase tracking-wider">{label}</div>
      <div className="mt-1 font-mono text-sage-bright text-lg">
        {value}
        {unit && <span className="text-sage-dim text-xs ml-1">{unit}</span>}
      </div>
    </div>
  );
}

export function Divider({ label }: { label?: string }) {
  if (!label) return <div className="h-px bg-border-soft my-6" />;
  return (
    <div className="flex items-center gap-3 my-6">
      <div className="h-px bg-border-soft flex-1" />
      <span className="text-sage-dim text-[11px] uppercase tracking-wider font-mono">{label}</span>
      <div className="h-px bg-border-soft flex-1" />
    </div>
  );
}

export function Note({ children, tone = 'amber' }: { children: ReactNode; tone?: 'amber' | 'rust' | 'moss' }) {
  const tones: Record<string, string> = {
    amber: 'border-amber/40 bg-amber/5 text-amber-soft',
    rust: 'border-rust/40 bg-rust/5 text-rust',
    moss: 'border-moss/40 bg-moss/5 text-moss',
  };
  return (
    <div className={`border rounded-md px-4 py-3 text-xs leading-relaxed ${tones[tone]}`}>
      {children}
    </div>
  );
}
