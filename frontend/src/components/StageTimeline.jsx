import { STAGE_LABELS } from '../utils/stages.js';

/**
 * Vertical timeline of a candidate's stage history.
 * @param {{ history: object[] }} props
 */
export default function StageTimeline({ history }) {
  if (!history?.length) return <p className="text-sm text-gray-400">No history yet.</p>;

  return (
    <ol className="relative border-l border-gray-200 space-y-4 ml-2">
      {history.map((entry, i) => (
        <li key={entry.id ?? i} className="ml-4">
          <div className="absolute -left-1.5 mt-1.5 w-3 h-3 rounded-full bg-gray-900 border-2 border-white" />
          <p className="text-sm font-medium text-gray-800">{STAGE_LABELS[entry.to_stage] ?? entry.to_stage}</p>
          {entry.from_stage && (
            <p className="text-xs text-gray-400">from {STAGE_LABELS[entry.from_stage] ?? entry.from_stage}</p>
          )}
          <p className="text-xs text-gray-400 mt-0.5">
            {new Date(entry.changed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </li>
      ))}
    </ol>
  );
}
