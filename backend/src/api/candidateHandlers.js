import * as candidateService from '../services/candidateService.js';
import * as notificationService from '../services/notificationService.js';

/**
 * GET /api/jobs/:id/candidates
 * Lists candidates for a job. Supports ?search= and ?stage= query params.
 */
export async function listCandidates(req, res) {
  try {
    const candidates = await candidateService.listCandidates(req.params.id, req.query);
    res.json(candidates);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * GET /api/candidates/:id
 * Returns a full candidate profile with stage history, interviewers, and notification status.
 */
export async function getCandidate(req, res) {
  try {
    const candidate = await candidateService.getCandidate(req.params.id);
    if (!candidate) return res.status(404).json({ error: 'Candidate not found' });
    res.json(candidate);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * PATCH /api/candidates/:id/advance
 * Advances a candidate to the next pipeline stage.
 */
export async function advanceCandidate(req, res) {
  try {
    const candidate = await candidateService.advanceCandidate(req.params.id);
    res.json(candidate);
  } catch (err) {
    const status = err.message === 'Candidate not found' ? 404 : 400;
    res.status(status).json({ error: err.message });
  }
}

/**
 * PATCH /api/candidates/:id/reject
 * Moves a candidate to 'rejected' and returns a pre-filled rejection email draft.
 */
export async function rejectCandidate(req, res) {
  try {
    const candidate = await candidateService.rejectCandidate(req.params.id);
    const draft = await notificationService.generateRejectionDraft(req.params.id);
    res.json({ candidate, draft });
  } catch (err) {
    const status = err.message === 'Candidate not found' ? 404 : 400;
    res.status(status).json({ error: err.message });
  }
}

/**
 * POST /api/candidates/:id/notify
 * Queues a recruiter-reviewed rejection email and publishes it to Kafka.
 * Body: { subject: string, body: string }
 */
export async function sendNotification(req, res) {
  const { subject, body } = req.body;
  if (!subject || !body) {
    return res.status(400).json({ error: 'subject and body are required' });
  }
  try {
    const notification = await notificationService.queueNotification(req.params.id, subject, body);
    res.status(201).json(notification);
  } catch (err) {
    const status = err.message === 'Candidate not found' ? 404 : 500;
    res.status(status).json({ error: err.message });
  }
}

/**
 * GET /api/candidates/:id/interviewers
 * Lists interviewers assigned to a candidate.
 */
export async function listInterviewers(req, res) {
  try {
    const interviewers = await candidateService.listInterviewers(req.params.id);
    res.json(interviewers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * POST /api/candidates/:id/interviewers
 * Assigns an interviewer to a candidate.
 * Body: { interviewer_id: string }
 */
export async function assignInterviewer(req, res) {
  const { interviewer_id } = req.body;
  if (!interviewer_id) return res.status(400).json({ error: 'interviewer_id is required' });
  try {
    await candidateService.assignInterviewer(req.params.id, interviewer_id);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * DELETE /api/candidates/:id/interviewers/:iid
 * Removes an interviewer from a candidate.
 */
export async function removeInterviewer(req, res) {
  try {
    await candidateService.removeInterviewer(req.params.id, req.params.iid);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
