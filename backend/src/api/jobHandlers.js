import * as jobService from '../services/jobService.js';

/**
 * GET /api/jobs
 * Returns all jobs with status and candidate count.
 */
export async function listJobs(req, res) {
  try {
    const jobs = await jobService.listJobs();
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * GET /api/jobs/:id
 * Returns a single job by ID.
 */
export async function getJob(req, res) {
  try {
    const job = await jobService.getJob(req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    res.json(job);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * POST /api/jobs
 * Creates a new job posting.
 * Body: { title, description, department, location, recruiter_id? }
 */
export async function createJob(req, res) {
  const { title, description, department, location, recruiter_id } = req.body;
  if (!title) return res.status(400).json({ error: 'title is required' });

  try {
    const job = await jobService.createJob({ title, description, department, location, recruiter_id });
    res.status(201).json(job);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * PUT /api/jobs/:id
 * Updates an existing job posting.
 * Body: { title?, description?, department?, location? }
 */
export async function updateJob(req, res) {
  try {
    const job = await jobService.updateJob(req.params.id, req.body);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    res.json(job);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * PATCH /api/jobs/:id/close
 * Soft-closes a job posting.
 */
export async function closeJob(req, res) {
  try {
    const job = await jobService.closeJob(req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    res.json(job);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
