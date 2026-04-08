import { STAGE_LABELS, STAGE_COLORS } from '../utils/stages.js';

/**
 * Displays a colour-coded stage badge.
 * @param {{ stage: string, className?: string }} props
 */
export default function Badge({ stage, className = '' }) {
  const color = STAGE_COLORS[stage] ?? 'bg-gray-100 text-gray-700';
  const label = STAGE_LABELS[stage] ?? stage;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color} ${className}`}>
      {label}
    </span>
  );
}
