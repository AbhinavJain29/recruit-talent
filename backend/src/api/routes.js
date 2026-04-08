import { Router } from 'express';
import * as jobHandlers from './jobHandlers.js';
import * as candidateHandlers from './candidateHandlers.js';

const router = Router();

// Jobs
router.get('/jobs', jobHandlers.listJobs);
router.post('/jobs', jobHandlers.createJob);
router.get('/jobs/:id', jobHandlers.getJob);
router.put('/jobs/:id', jobHandlers.updateJob);
router.patch('/jobs/:id/close', jobHandlers.closeJob);

// Candidates per job
router.get('/jobs/:id/candidates', candidateHandlers.listCandidates);

// Candidate actions
router.get('/candidates/:id', candidateHandlers.getCandidate);
router.patch('/candidates/:id/advance', candidateHandlers.advanceCandidate);
router.patch('/candidates/:id/reject', candidateHandlers.rejectCandidate);
router.post('/candidates/:id/notify', candidateHandlers.sendNotification);

// Interviewers
router.get('/candidates/:id/interviewers', candidateHandlers.listInterviewers);
router.post('/candidates/:id/interviewers', candidateHandlers.assignInterviewer);
router.delete('/candidates/:id/interviewers/:iid', candidateHandlers.removeInterviewer);

export default router;
