import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, SearchIcon, MapPinIcon, BuildingIcon, UsersIcon, UserIcon } from 'lucide-react';
import { listCandidates, advanceCandidate, rejectCandidate } from '../services/candidateService.js';
import { getJob } from '../services/jobService.js';
import { STAGE_ORDER, STAGE_LABELS } from '../utils/stages.js';
import CandidateCard from './CandidateCard.jsx';
import RejectionModal from './RejectionModal.jsx';

/** All pipeline stages shown as Kanban columns, rejected last */
const PIPELINE_COLUMNS = [...STAGE_ORDER, 'rejected'];

/**
 * Kanban pipeline view for a single job.
 * Shows job details at the top, active stage columns, and a separate rejected section below.
 */
export default function JobPipeline() {
  const { id: jobId } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [rejectionState, setRejectionState] = useState(null);

  useEffect(() => {
    Promise.all([
      getJob(jobId),
      listCandidates(jobId),
    ]).then(([jobData, candidatesData]) => {
      setJob(jobData);
      setCandidates(candidatesData);
    }).finally(() => setLoading(false));
  }, [jobId]);

  async function handleAdvance(candidate) {
    try {
      const updated = await advanceCandidate(candidate.id);
      setCandidates(cs => cs.map(c => c.id === updated.id ? { ...c, current_stage: updated.current_stage } : c));
    } catch (err) {
      alert(err.response?.data?.error ?? 'Failed to advance candidate.');
    }
  }

  async function handleReject(candidate) {
    try {
      const { draft } = await rejectCandidate(candidate.id);
      setRejectionState({ candidateId: candidate.id, draft });
    } catch (err) {
      alert(err.response?.data?.error ?? 'Failed to reject candidate.');
    }
  }

  const filtered = search
    ? candidates.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.email.toLowerCase().includes(search.toLowerCase())
      )
    : candidates;

  const byStage = Object.fromEntries(
    PIPELINE_COLUMNS.map(s => [s, filtered.filter(c => c.current_stage === s)])
  );

  if (loading) return <div className="p-8 text-gray-500">Loading pipeline…</div>;

  return (
    <div className="flex flex-col h-[calc(100vh-56px)]">

      {/* Job details header */}
      <div className="bg-white border-b px-4 sm:px-6 py-4 shrink-0">
        <div className="flex items-start gap-4">
          <button onClick={() => navigate('/')} className="text-gray-400 hover:text-gray-700 mt-1">
            <ArrowLeftIcon className="w-5 h-5" />
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-lg font-semibold text-gray-900">{job?.title}</h1>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                job?.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
              }`}>
                {job?.status === 'open' ? 'Open' : 'Closed'}
              </span>
            </div>

            <div className="mt-1.5 flex flex-wrap gap-4 text-sm text-gray-500">
              {job?.department && (
                <span className="flex items-center gap-1">
                  <BuildingIcon className="w-3.5 h-3.5" /> {job.department}
                </span>
              )}
              {job?.location && (
                <span className="flex items-center gap-1">
                  <MapPinIcon className="w-3.5 h-3.5" /> {job.location}
                </span>
              )}
              <span className="flex items-center gap-1">
                <UsersIcon className="w-3.5 h-3.5" /> {candidates.length} candidate{candidates.length !== 1 ? 's' : ''}
              </span>
              {job?.recruiter_name && (
                <span className="flex items-center gap-1">
                  <UserIcon className="w-3.5 h-3.5" /> {job.recruiter_name}
                </span>
              )}
            </div>

            {job?.description && (
              <p className="mt-1.5 text-sm text-gray-400 line-clamp-1">{job.description}</p>
            )}
          </div>

          <div className="relative shrink-0">
            <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search candidates…"
              className="pl-8 pr-3 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 w-48"
            />
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">

        {/* Active pipeline Kanban */}
        <div className="flex gap-3 p-4 h-full">
          {PIPELINE_COLUMNS.map(stage => (
            <div key={stage} className="flex flex-col flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2 px-1">
                <span className={`text-xs font-semibold uppercase tracking-wide ${
                  stage === 'rejected' ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {STAGE_LABELS[stage]}
                </span>
                <span className={`text-xs rounded-full px-2 py-0.5 ${
                  stage === 'rejected' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-400'
                }`}>
                  {byStage[stage].length}
                </span>
              </div>
              <div className={`flex-1 rounded-xl p-2 space-y-2 min-h-32 ${
                stage === 'rejected' ? 'bg-red-50' : 'bg-gray-50'
              }`}>
                {byStage[stage].map(c => (
                  <CandidateCard key={c.id} candidate={c} onAdvance={handleAdvance} onReject={handleReject} />
                ))}
                {byStage[stage].length === 0 && (
                  <p className="text-xs text-gray-300 text-center pt-4">Empty</p>
                )}
              </div>
            </div>
          ))}
        </div>

      </div>

      {rejectionState && (
        <RejectionModal
          open={!!rejectionState}
          candidateId={rejectionState.candidateId}
          draft={rejectionState.draft}
          onClose={() => setRejectionState(null)}
          onSent={() => { setRejectionState(null); setTimeout(fetchCandidates, 1000); }}
        />
      )}
    </div>
  );
}
