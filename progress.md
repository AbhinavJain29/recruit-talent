# Implementation Progress

> Update status after each feature is completed. Statuses: `[ ]` pending · `[~]` in progress · `[x]` done

---

## Setup & Infrastructure

- [x] Initialise monorepo root with `docker-compose.yml`
- [x] Scaffold `frontend/` (React + Vite + Tailwind + shadcn/ui)
- [x] Scaffold `backend/` (Node.js + Express)
- [x] Scaffold `notification-service/` (Node.js + Kafka consumer)
- [x] Configure Postgres in Docker Compose
- [x] Configure Kafka + Zookeeper in Docker Compose
- [x] Write DB migration scripts (all tables)
- [x] Write seed script (mock jobs, candidates, interviewers, recruiters)

---

## Backend — Job Postings

- [x] F-01 · GET /jobs — list all jobs with status + candidate count
- [x] F-02 · POST /jobs — create a job posting
- [x] F-03 · PUT /jobs/:id — edit a job posting
- [x] F-04 · PATCH /jobs/:id/close — close a job posting

---

## Backend — Candidate Pipeline

- [x] F-05 · GET /jobs/:id/candidates — list candidates for a job with current stage
- [x] F-07 · PATCH /candidates/:id/advance — move candidate to next stage
- [x] F-08 · PATCH /candidates/:id/reject — reject candidate + trigger notification flow
- [x] F-09 · GET /jobs/:id/candidates?search=&stage= — filter/search candidates

---

## Backend — Candidate Profile

- [x] F-10 · GET /candidates/:id — full candidate profile + stage history
- [x] F-11 · GET /candidates/:id/interviewers — list assigned interviewers
- [x] F-12 · POST /candidates/:id/interviewers — assign interviewer
- [x] F-12 · DELETE /candidates/:id/interviewers/:iid — remove interviewer

---

## Backend — Feedback Document

- [x] F-15 · Auto-generate S3 feedback doc on candidate creation (mock URLs in seed)
- [x] F-16 · Store feedback_doc_url on candidate record
- [x] F-18 · Include doc URL in rejection email draft via notificationService

---

## Backend — Notification Flow

- [x] F-19 · Auto-generate rejection email draft on reject action
- [x] F-21 · POST /candidates/:id/notify — publish email payload to Kafka topic `candidate.notifications`
- [x] F-23 · Write notification record (status: queued) before publishing to Kafka

---

## Notification Service

- [x] F-22 · Kafka consumer listening on `candidate.notifications`
- [x] F-22 · Send email via Resend/SendGrid
- [x] F-23 · Update notification record to `sent` or `failed` after attempt

---

## Frontend — Jobs Dashboard

- [x] F-01 · Jobs list view: title, department, status (Open/Closed), candidate count
- [x] F-02 · Create job posting form
- [x] F-03 · Edit job posting form
- [x] F-04 · Close job posting action

---

## Frontend — Candidate Pipeline

- [x] F-05 · Candidate pipeline view per job (Kanban columns)
- [x] F-07 · Advance candidate to next stage
- [x] F-08 · Reject candidate from any stage
- [x] F-09 · Filter/search candidates by name or stage

---

## Frontend — Candidate Profile

- [x] F-10 · Candidate profile page: details + stage history timeline
- [x] F-11 · Interviewers section: list assigned interviewers
- [-] F-12 · Assign / remove interviewer UI (skipped)
- [x] F-13 · Resume + feedback document links (open in new tab)
- [x] F-23 · Notification status badge (queued / sent / failed)

---

## Frontend — Rejection Modal

- [x] F-19 · Auto-populate rejection email draft in modal
- [x] F-20 · Editable email body before confirming
- [x] F-21 · Confirm action publishes to Kafka via backend

---

## Testing

- [-] Unit tests — backend route handlers (skipped)
- [-] Unit tests — notification service consumer (skipped)
- [-] Unit tests — frontend components (skipped)
