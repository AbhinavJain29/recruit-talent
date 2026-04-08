import api from './api.js';

export const listCandidates = (jobId, params) =>
  api.get(`/api/jobs/${jobId}/candidates`, { params }).then(r => r.data);

export const getCandidate = (id) =>
  api.get(`/api/candidates/${id}`).then(r => r.data);

export const advanceCandidate = (id) =>
  api.patch(`/api/candidates/${id}/advance`).then(r => r.data);

export const rejectCandidate = (id) =>
  api.patch(`/api/candidates/${id}/reject`).then(r => r.data);

export const sendNotification = (id, subject, body) =>
  api.post(`/api/candidates/${id}/notify`, { subject, body }).then(r => r.data);

export const listInterviewers = (id) =>
  api.get(`/api/candidates/${id}/interviewers`).then(r => r.data);

export const assignInterviewer = (candidateId, interviewerId) =>
  api.post(`/api/candidates/${candidateId}/interviewers`, { interviewer_id: interviewerId });

export const removeInterviewer = (candidateId, interviewerId) =>
  api.delete(`/api/candidates/${candidateId}/interviewers/${interviewerId}`);
