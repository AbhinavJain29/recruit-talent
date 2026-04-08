import { useNavigate } from 'react-router-dom';
import { FileTextIcon, ChevronRightIcon, XIcon } from 'lucide-react';
import Badge from './Badge.jsx';
import { canAdvance, canReject, STAGE_ORDER } from '../utils/stages.js';

/**
 * Compact candidate card shown inside a pipeline column.
 * @param {{ candidate: object, onAdvance: (c) => void, onReject: (c) => void }} props
 */
export default function CandidateCard({ candidate, onAdvance, onReject }) {
  const navigate = useNavigate();
  const nextStage = canAdvance(candidate.current_stage)
    ? STAGE_ORDER[STAGE_ORDER.indexOf(candidate.current_stage) + 1]
    : null;

  return (
    <div className="bg-white border rounded-lg p-3 shadow-sm hover:shadow transition-shadow">
      <div
        className="cursor-pointer"
        onClick={() => navigate(`/candidates/${candidate.id}`)}
      >
        <p className="font-medium text-sm text-gray-900 truncate">{candidate.name}</p>
        <p className="text-xs text-gray-400 truncate mt-0.5">{candidate.email}</p>
      </div>

      <div className="mt-2 flex items-center gap-1.5 flex-wrap">
        {candidate.resume_url && (
          <a href={candidate.resume_url} target="_blank" rel="noreferrer"
            onClick={e => e.stopPropagation()}
            className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
            <FileTextIcon className="w-3 h-3" /> Resume
          </a>
        )}
        {candidate.interviewers?.length > 0 && (
          <span className="text-xs text-gray-400">
            {candidate.interviewers.length} interviewer{candidate.interviewers.length > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {canAdvance(candidate.current_stage) || canReject(candidate.current_stage) ? (
        <div className="mt-2.5 flex gap-1.5">
          {nextStage && (
            <button
              onClick={() => onAdvance(candidate)}
              className="flex-1 flex items-center justify-center gap-1 text-xs bg-gray-900 text-white rounded-md py-1.5 hover:bg-gray-700"
            >
              <ChevronRightIcon className="w-3 h-3" /> Advance
            </button>
          )}
          {canReject(candidate.current_stage) && (
            <button
              onClick={() => onReject(candidate)}
              className="flex items-center justify-center gap-1 text-xs border border-red-200 text-red-600 rounded-md px-2 py-1.5 hover:bg-red-50"
            >
              <XIcon className="w-3 h-3" /> Reject
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
}
