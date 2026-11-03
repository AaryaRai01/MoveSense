import type { ReactNode } from 'react';
import { Panel, Tag, Divider, Note } from '@/components/ui';
import {
  Activity,
  Target,
  Database,
  Route,
  Clock3,
  Layers,
} from 'lucide-react';
import { useMoveSense } from '@/api/MoveSenseContext';

export function OverviewSection() {
  const { apiOnline, dataset, results } = useMoveSense();

  const rowCount = Number(
    results?.dataset?.source_rows ?? dataset?.source_rows ?? 0
  );

  const validCount = Number(
    results?.dataset?.valid_trip_count ?? 0
  );

  const trained = results?.status === 'trained';

  return (
    <div className="space-y-6 animate-fadeIn max-w-5xl">
      <Panel accent className="bg-grid">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <Tag tone="amber">Case Study</Tag>
            <Tag tone="moss">Unsupervised Learning</Tag>
            <Tag>K-Means</Tag>
          </div>

          <h1 className="text-sage-bright text-2xl md:text-3xl font-semibold tracking-tight leading-tight">
            MoveSense — Automobile Travel Pattern Segmentation
          </h1>

          <p className="text-sage text-sm leading-relaxed max-w-3xl">
            MoveSense investigates whether real automobile trips can be
            grouped into useful travel patterns using distance, travel
            duration, and departure timing without pre-labelled categories.
            The project runs a complete machine-learning pipeline, from
            dataset validation and feature scaling to K-Means training,
            evaluation graphs, and cluster profiles.
          </p>

          <div className="flex items-center gap-2 text-sage-dim text-xs font-mono">
            <Activity size={14} className="text-amber" />
            <span>Real trip records · Python API · scikit-learn</span>
          </div>
        </div>
      </Panel>

      <Panel
        title="The Case Study"
        subtitle="The question this project investigates"
      >
        <p className="text-sage text-sm leading-relaxed">
          A 2-mile errand, a 12-mile commute, and a long inter-city journey
          may all be recorded as automobile trips, but they differ in
          distance, duration, and time of day. The goal is to discover groups
          of trips with similar characteristics using unsupervised clustering
          rather than assigning labels in advance.
        </p>

        <Divider />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-panel-2 border border-border-soft rounded-md p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target size={15} className="text-amber" />
              <span className="text-sage-bright text-xs uppercase tracking-wider font-medium">
                Research question
              </span>
            </div>

            <p className="text-sage text-xs leading-relaxed">
              Can K-Means reveal interpretable trip segments from distance,
              duration, departure hour, and peak-hour status?
            </p>
          </div>

          <div className="bg-panel-2 border border-border-soft rounded-md p-4">
            <div className="flex items-center gap-2 mb-2">
              <Database size={15} className="text-amber" />
              <span className="text-sage-bright text-xs uppercase tracking-wider font-medium">
                Data source
              </span>
            </div>

            <p className="text-sage text-xs leading-relaxed">
              National Household Travel Survey (NHTS), a US household travel
              survey. The project uses trip-level records and filters for
              private-vehicle travel using the mode codes configured for the
              selected dataset release.
            </p>

            <a
              href="https://nhts.ornl.gov/"
              target="_blank"
              rel="noreferrer"
              className="inline-block text-amber text-xs mt-2 hover:underline"
            >
              Official NHTS portal ↗
            </a>
          </div>
        </div>
      </Panel>

      <Panel
        title="Dataset and Model Status"
        subtitle="Status reported by the running Python backend"
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-panel-2 border border-border-soft rounded-md p-4">
            <div className="flex items-center gap-2 mb-2">
              <Database size={14} className="text-amber" />
              <span className="text-sage-dim text-[10px] uppercase tracking-wider">
                Dataset
              </span>
            </div>

            <div
              className={`font-mono text-sm ${
                dataset ? 'text-moss' : 'text-rust'
              }`}
            >
              {dataset ? 'Loaded' : 'Not loaded'}
            </div>

            <div className="text-sage-dim text-[11px] mt-1">
              {rowCount > 0
                ? `${rowCount.toLocaleString()} source trips`
                : 'Waiting for API dataset state'}
            </div>
          </div>

          <div className="bg-panel-2 border border-border-soft rounded-md p-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity size={14} className="text-amber" />
              <span className="text-sage-dim text-[10px] uppercase tracking-wider">
                Backend
              </span>
            </div>

            <div
              className={`font-mono text-sm ${
                apiOnline ? 'text-moss' : 'text-rust'
              }`}
            >
              {apiOnline ? 'Connected' : 'Offline'}
            </div>

            <div className="text-sage-dim text-[11px] mt-1">
              FastAPI · scikit-learn
            </div>
          </div>

          <div className="bg-panel-2 border border-border-soft rounded-md p-4">
            <div className="flex items-center gap-2 mb-2">
              <Layers size={14} className="text-amber" />
              <span className="text-sage-dim text-[10px] uppercase tracking-wider">
                Training
              </span>
            </div>

            <div
              className={`font-mono text-sm ${
                trained ? 'text-moss' : 'text-sage-bright'
              }`}
            >
              {trained ? 'Complete' : 'Not run yet'}
            </div>

            <div className="text-sage-dim text-[11px] mt-1">
              {trained
                ? `${validCount.toLocaleString()} valid trips`
                : 'Open Training to run K-Means'}
            </div>
          </div>
        </div>
      </Panel>

      <Panel
        title="Features Used"
        subtitle="Four numeric features describe each trip"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Feature
            icon={<Route size={15} className="text-amber" />}
            title="Trip distance"
            detail="TRPMILES · distance in miles; captures trip length."
          />

          <Feature
            icon={<Clock3 size={15} className="text-amber" />}
            title="Travel duration"
            detail="TRVLCMIN · reported travel time in minutes."
          />

          <Feature
            icon={<Clock3 size={15} className="text-amber" />}
            title="Departure hour"
            detail="Derived from STRTTIME (HHMM) and represented as hour 0–23."
          />

          <Feature
            icon={<Activity size={15} className="text-amber" />}
            title="Peak-hour flag"
            detail="1 for departure hours 07–09 or 16–18; otherwise 0. This is a project assumption."
          />
        </div>

        <p className="text-sage-dim text-xs mt-4 leading-relaxed">
          The four features are standardised before distance-based clustering.
          Each row represents a trip, not a person. The survey represents US
          travel patterns and should not be treated as a direct estimate of
          Indian traffic.
        </p>
      </Panel>

      <Panel
        title="Workflow"
        subtitle="From raw records to interpretable segments"
      >
        <div className="flex flex-wrap items-center gap-2">
          {[
            'Load data',
            'Validate fields',
            'Filter trips',
            'Clean values',
            'Engineer features',
            'Scale',
            'Train K-Means',
            'Evaluate',
            'Interpret',
          ].map((step, index) => (
            <div key={step} className="flex items-center gap-2">
              <span className="px-3 py-2 rounded-md bg-panel-2 border border-border-soft text-sage-bright text-[11px] font-mono">
                {step}
              </span>

              {index < 8 && (
                <span className="text-amber/50 text-xs">→</span>
              )}
            </div>
          ))}
        </div>
      </Panel>

      <Note tone="amber">
        The model discovers mathematical groupings; it does not know labels
        such as “commute” or “errand”. Assign those descriptions only after
        inspecting the real cluster profiles and checking whether they are
        supported by the data.
      </Note>
    </div>
  );
}

function Feature({
  icon,
  title,
  detail,
}: {
  icon: ReactNode;
  title: string;
  detail: string;
}) {
  return (
    <div className="bg-panel-2 border border-border-soft rounded-md p-4">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-sage-bright text-xs font-medium">
          {title}
        </span>
      </div>

      <p className="text-sage text-xs leading-relaxed">{detail}</p>
    </div>
  );
}