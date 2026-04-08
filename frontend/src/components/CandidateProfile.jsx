import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, FileTextIcon, ExternalLinkIcon, ChevronRightIcon, XIcon, MailIcon } from 'lucide-react';
import { getCandidate, advanceCandidate, rejectCandidate } from '../services/candidateService.js';
import Badge from './Badge.jsx';
import StageTimeline from './StageTimeline.jsx';
import RejectionModal from './RejectionModal.jsx';
import { canAdvance, canReject, STAGE_ORDER, STAGE_LABELS } from '../utils/stages.js';

/**
 * Full candidate profile page with stage history, interviewers, documents, and notification status.
 */
export default function CandidateProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rejectionState, setRejectionState] = useState(null);

  useEffect(() => { fetchCandidate(); }, [id]);

  async function fetchCandidate() {
    try {
      const data = await getCandidate(id);
      setCandidate(data);
    } catch {
      setError('Failed to load candidate.');
    } finally {
      setLoading(false);
    }
  }

  async function handleAdvance() {
    try {
      const updated = await advanceCandidate(id);
      setCandidate(c => ({ ...c, current_stage: updated.current_stage }));
      fetchCandidate(); // reload to get updated history
    } catch (err) {
      alert(err.response?.data?.error ?? 'Failed to advance candidate.');
    }
  }

  async function handleReject() {
    try {
      const { draft } = await rejectCandidate(id);
      setRejectionState({ candidateId: id, draft });
    } catch (err) {
      alert(err.response?.data?.error ?? 'Failed to reject candidate.');
    }
  }

  const latestNotification = candidate?.notifications?.[0];
  const nextStage = candidate && canAdvance(candidate.current_stage)
    ? STAGE_LABELS[STAGE_ORDER[STAGE_ORDER.indexOf(candidate.current_stage) + 1]]
    : null;

  if (loading) return <div className="p-8 text-gray-500">Loading candidate…</div>;
  if (error) return <div className="p-8 text-red-600">{error}</div>;
  if (!candidate) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-6">
        <ArrowLeftIcon className="w-4 h-4" /> Back
      </button>

      {/* Header */}
      <div className="bg-white border rounded-xl p-6 mb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{candidate.name}</h1>
            <p className="text-gray-500 mt-0.5">{candidate.email}</p>
            <p className="text-sm text-gray-400 mt-1">{candidate.job_title}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge stage={candidate.current_stage} className="text-sm px-3 py-1" />
            {latestNotification && (
              <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${
                latestNotification.status === 'sent' ? 'bg-green-100 text-green-700' :
                latestNotification.status === 'failed' ? 'bg-red-100 text-red-700' :
                'bg-yellow-100 text-yellow-700'
              }`}>
                <MailIcon className="w-3 h-3" />
                Email {latestNotification.status}
              </span>
            )}
          </div>
        </div>

        {/* Documents */}
        <div className="mt-4 flex flex-wrap gap-3">
          {candidate.resume_url && (
            <a href={candidate.resume_url} target="_blank" rel="noreferrer"
              className="flex items-center gap-1.5 text-sm text-blue-600 hover:underline">
              <FileTextIcon className="w-4 h-4" /> View Resume <ExternalLinkIcon className="w-3 h-3" />
            </a>
          )}
          {candidate.feedback_doc_url && (
            <a href={candidate.feedback_doc_url} target="_blank" rel="noreferrer"
              className="flex items-center gap-1.5 text-sm text-blue-600 hover:underline">
              <FileTextIcon className="w-4 h-4" /> Feedback Doc <ExternalLinkIcon className="w-3 h-3" />
            </a>
          )}
        </div>

        {/* Actions */}
        {(canAdvance(candidate.current_stage) || canReject(candidate.current_stage)) && (
          <div className="mt-5 flex gap-2 flex-wrap">
            {nextStage && (
              <button onClick={handleAdvance}
                className="flex items-center gap-1.5 px-4 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-700">
                <ChevronRightIcon className="w-4 h-4" /> Move to {nextStage}
              </button>
            )}
            {canReject(candidate.current_stage) && (
              <button onClick={handleReject}
                className="flex items-center gap-1.5 px-4 py-2 text-sm border border-red-200 text-red-600 rounded-lg hover:bg-red-50">
                <XIcon className="w-4 h-4" /> Reject
              </button>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Stage History */}
        <div className="bg-white border rounded-xl p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Stage History</h2>
          <StageTimeline history={candidate.stage_history} />
        </div>

        {/* Interviewers */}
        <div className="bg-white border rounded-xl p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Interviewers</h2>
          {candidate.interviewers?.length > 0 ? (
            <ul className="space-y-3">
              {candidate.interviewers.map(i => (
                <li key={i.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-600">
                    {i.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{i.name}</p>
                    <p className="text-xs text-gray-400">{i.email}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-400">No interviewers assigned.</p>
          )}
        </div>

        {/* Notifications */}
        {candidate.notifications?.length > 0 && (
          <div className="bg-white border rounded-xl p-6 md:col-span-2">
            <h2 className="font-semibold text-gray-900 mb-4">Notifications</h2>
            <ul className="space-y-3">
              {candidate.notifications.map(n => (
                <li key={n.id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Rejection email</span>
                  <div className="flex items-center gap-3 text-gray-400 text-xs">
                    {n.sent_at && <span>Sent {new Date(n.sent_at).toLocaleDateString()}</span>}
                    <span className={`px-2 py-0.5 rounded-full font-medium ${
                      n.status === 'sent' ? 'bg-green-100 text-green-700' :
                      n.status === 'failed' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>{n.status}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {rejectionState && (
        <RejectionModal
          open={!!rejectionState}
          candidateId={rejectionState.candidateId}
          draft={rejectionState.draft}
          onClose={() => setRejectionState(null)}
          onSent={() => { setRejectionState(null); setTimeout(fetchCandidate, 1000); }}
        />
      )}
    </div>
  );
}
