import api from './api.js';

export const listJobs = () => api.get('/api/jobs').then(r => r.data);
export const getJob = (id) => api.get(`/api/jobs/${id}`).then(r => r.data);
export const createJob = (data) => api.post('/api/jobs', data).then(r => r.data);
export const updateJob = (id, data) => api.put(`/api/jobs/${id}`, data).then(r => r.data);
export const closeJob = (id) => api.patch(`/api/jobs/${id}/close`).then(r => r.data);
