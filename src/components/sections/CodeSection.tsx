import { useState } from 'react';
import { Panel, Tag, Divider } from '@/components/ui';
import { CodeBlock } from '@/components/CodeBlock';
import { CODE_SAMPLES } from '@/data/model';
import { Copy, Check, Code2 } from 'lucide-react';

export function CodeSection() {
  const [copied, setCopied] = useState<string | null>(null);

  const copy = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-6 animate-fadeIn max-w-5xl">
      <Panel title="Python Implementation" subtitle="scikit-learn code for the full NHTS clustering pipeline">
        <div className="flex items-start gap-3">
          <Code2 size={16} className="text-amber shrink-0 mt-0.5" />
          <p className="text-sage text-xs leading-relaxed">
            The code below implements the complete pipeline: loading and cleaning the NHTS
            automobile-trip data, engineering features, standardising with StandardScaler,
            fitting KMeans with k-means++ initialisation, evaluating candidate K values, and
            profiling the resulting clusters. All snippets use scikit-learn and are consistent
            with the proposed NHTS dataset pipeline.
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-3">
          <Tag tone="amber">scikit-learn</Tag>
          <Tag>pandas</Tag>
          <Tag>numpy</Tag>
          <Tag tone="moss">StandardScaler</Tag>
          <Tag tone="moss">KMeans</Tag>
        </div>
      </Panel>

      {CODE_SAMPLES.map((sample) => (
        <Panel key={sample.id} title={sample.title} subtitle={sample.description}>
          <div className="flex justify-end mb-2">
            <button
              onClick={() => copy(sample.id, sample.code)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-panel-2 border border-border-soft text-sage-dim hover:text-amber hover:border-amber/30 transition-colors text-[11px] font-mono"
            >
              {copied === sample.id ? <Check size={12} className="text-moss" /> : <Copy size={12} />}
              {copied === sample.id ? 'copied' : 'copy'}
            </button>
          </div>
          <CodeBlock code={sample.code} />
          <Divider />
          <p className="text-sage-dim text-[11px] leading-relaxed">
            {sample.description}
          </p>
        </Panel>
      ))}

      <Panel title="Reproducibility Notes" subtitle="How to reproduce the experiment">
        <ul className="space-y-2">
          <li className="flex items-start gap-2">
            <span className="text-amber/60 font-mono text-[11px] mt-0.5">›</span>
            <span className="text-sage text-xs leading-relaxed">All random operations use <span className="font-mono text-amber">random_state=42</span> for deterministic output.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber/60 font-mono text-[11px] mt-0.5">›</span>
            <span className="text-sage text-xs leading-relaxed">The scaler is fit on the training feature matrix only and reused for any downstream transformation.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber/60 font-mono text-[11px] mt-0.5">›</span>
            <span className="text-sage text-xs leading-relaxed">Labelled data and cluster profiles are saved as CSV for downstream analysis and presentation.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber/60 font-mono text-[11px] mt-0.5">›</span>
            <span className="text-sage text-xs leading-relaxed">Column names must be verified against the selected NHTS release codebook before running.</span>
          </li>
        </ul>
      </Panel>
    </div>
  );
}
