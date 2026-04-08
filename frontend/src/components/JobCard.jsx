import { useNavigate } from 'react-router-dom';
import { MapPinIcon, UsersIcon, PencilIcon, XCircleIcon } from 'lucide-react';

/**
 * Card displaying a single job posting on the dashboard.
 * @param {{ job: object, onEdit: (job) => void, onClose: (job) => void }} props
 */
export default function JobCard({ job, onEdit, onClose }) {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/jobs/${job.id}`)}
      className="bg-white border rounded-xl p-5 hover:shadow-md transition-shadow cursor-pointer group"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">{job.title}</h3>
          <p className="text-sm text-gray-500 mt-0.5">{job.department}</p>
        </div>
        <span className={`shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          job.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
        }`}>
          {job.status === 'open' ? 'Open' : 'Closed'}
        </span>
      </div>

      <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
        {job.location && (
          <span className="flex items-center gap-1">
            <MapPinIcon className="w-3.5 h-3.5" /> {job.location}
          </span>
        )}
        <span className="flex items-center gap-1">
          <UsersIcon className="w-3.5 h-3.5" /> {job.candidate_count} candidate{job.candidate_count !== 1 ? 's' : ''}
        </span>
      </div>

      {job.recruiter_name && (
        <p className="mt-2 text-xs text-gray-400">Recruiter: {job.recruiter_name}</p>
      )}

      <div className="mt-4 flex gap-2" onClick={e => e.stopPropagation()}>
        <button
          onClick={() => onEdit(job)}
          className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900 border rounded-md px-2.5 py-1.5 hover:bg-gray-50"
        >
          <PencilIcon className="w-3 h-3" /> Edit
        </button>
        {job.status === 'open' && (
          <button
            onClick={() => onClose(job)}
            className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700 border border-red-200 rounded-md px-2.5 py-1.5 hover:bg-red-50"
          >
            <XCircleIcon className="w-3 h-3" /> Close
          </button>
        )}
      </div>
    </div>
  );
}
