import { useEffect, useState } from 'react';
import { PlusIcon } from 'lucide-react';
import { listJobs, closeJob } from '../services/jobService.js';
import JobCard from './JobCard.jsx';
import CreateJobModal from './CreateJobModal.jsx';

/**
 * Main dashboard showing all job postings.
 */
export default function JobsDashboard() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState(null);

  useEffect(() => { fetchJobs(); }, []);

  async function fetchJobs() {
    try {
      const data = await listJobs();
      setJobs(data);
    } catch {
      setError('Failed to load jobs.');
    } finally {
      setLoading(false);
    }
  }

  async function handleClose(job) {
    if (!confirm(`Close "${job.title}"? Candidates will remain visible.`)) return;
    try {
      const updated = await closeJob(job.id);
      setJobs(js => js.map(j => j.id === updated.id ? { ...j, ...updated } : j));
    } catch {
      alert('Failed to close job.');
    }
  }

  function handleEdit(job) {
    setEditingJob(job);
    setModalOpen(true);
  }

  function handleJobSaved(saved) {
    setJobs(js => {
      const exists = js.find(j => j.id === saved.id);
      return exists
        ? js.map(j => j.id === saved.id ? { ...j, ...saved } : j)
        : [{ ...saved, candidate_count: 0 }, ...js];
    });
  }

  const openJobs = jobs.filter(j => j.status === 'open');
  const closedJobs = jobs.filter(j => j.status === 'closed');

  if (loading) return <div className="p-8 text-gray-500">Loading jobs…</div>;
  if (error) return <div className="p-8 text-red-600">{error}</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Job Postings</h1>
          <p className="text-sm text-gray-500 mt-1">{openJobs.length} open · {closedJobs.length} closed</p>
        </div>
        <button
          onClick={() => { setEditingJob(null); setModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-700"
        >
          <PlusIcon className="w-4 h-4" /> New Job
        </button>
      </div>

      {openJobs.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Open</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {openJobs.map(job => (
              <JobCard key={job.id} job={job} onEdit={handleEdit} onClose={handleClose} />
            ))}
          </div>
        </section>
      )}

      {closedJobs.length > 0 && (
        <section>
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Closed</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 opacity-60">
            {closedJobs.map(job => (
              <JobCard key={job.id} job={job} onEdit={handleEdit} onClose={handleClose} />
            ))}
          </div>
        </section>
      )}

      {jobs.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          No job postings yet. Create one to get started.
        </div>
      )}

      <CreateJobModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingJob(null); }}
        onSaved={handleJobSaved}
        job={editingJob}
      />
    </div>
  );
}
