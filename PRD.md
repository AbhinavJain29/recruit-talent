# PRD: Recruiter Talent Portal

**Version:** 1.1
**Date:** 2026-04-07

---

## 1. Overview

A recruiter-facing job application management portal that allows a recruiter to track open roles, manage candidate pipelines, coordinate with interviewers, and automatically notify rejected candidates via email — powered by an async Kafka-based notification system.

---

## 2. Goals

- Give recruiters a single view of all open jobs and their candidate pipelines
- Enable structured stage progression with rejection at any point
- Automate candidate rejection emails with a recruiter review step before sending
- Decouple notification delivery from the core app using Kafka

---

## 3. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite) + Tailwind CSS + shadcn/ui |
| Backend | Node.js + Express |
| Database | PostgreSQL |
| Messaging | Apache Kafka |
| Email Delivery | Resend (or SendGrid) |
| Storage (feedback docs) | AWS S3 (pre-signed URLs) |
| Local Dev | Docker Compose (Postgres + Kafka + backend) |

> Auth is out of scope for MVP. The app operates from a single recruiter POV with no login required.

---

## 4. User Roles

| Role | Description |
|---|---|
| **Recruiter** | Single assumed user — full access to all portal features |
| **Interviewer** | External — receives candidate info via email, adds feedback to a shared doc outside the app |

---

## 5. Feature List

### 5.1 Job Posting Management
- **F-01** View list of all job postings with status (Open / Closed) and candidate counts
- **F-02** Create a new job posting (title, description, department, location)
- **F-03** Edit an existing job posting
- **F-04** Close a job posting (soft-close; candidates remain visible)

---

### 5.2 Candidate Pipeline
- **F-05** View all candidates for a given job posting in a pipeline view (Kanban or list)
- **F-06** Pipeline stages (fixed, in order):
  1. Applied
  2. Recruiter Screen
  3. Tech Screen
  4. Interview
  5. Offer
  6. Hired
  7. Rejected *(accessible from any stage)*
- **F-07** Advance a candidate to the next stage
- **F-08** Reject a candidate from any stage (triggers notification flow)
- **F-09** Filter/search candidates by name or current stage within a job

---

### 5.3 Candidate Profile
- **F-10** View candidate profile: name, email, applied role, current stage, stage history (timeline)
- **F-11** View interviewers assigned to the candidate (name + email)
- **F-12** Assign / remove interviewers for a candidate
- **F-13** View feedback document link (auto-generated S3 doc per candidate)
- **F-14** Stage change history log (stage, timestamp)

---

### 5.4 Feedback Document (Auto-Generation)
- **F-15** When a candidate is created, automatically generate a feedback document (S3-hosted template) scoped to that candidate
- **F-16** Store the document URL on the candidate record
- **F-17** Recruiter can open the link directly from the candidate profile
- **F-18** Interviewers receive the document link via email (outside the app) and fill it externally

---

### 5.5 Rejection Notification Flow
- **F-19** When a recruiter moves a candidate to **Rejected**, the system auto-generates a rejection email draft using:
  - Candidate name and role
  - Feedback from the interviewer feedback document (falls back to a default template if unavailable)
- **F-20** Recruiter is presented with a modal/drawer to **review and edit** the draft email before confirming
- **F-21** On confirmation, the email payload is published to a Kafka topic (`candidate.notifications`)
- **F-22** A Kafka consumer service picks up the event and sends the email to the candidate via the email provider
- **F-23** Notification delivery status (queued / sent / failed) is stored and visible on the candidate profile

---

### 5.6 Mocked Data (MVP Scope)
- **F-24** Seed script to populate mock jobs, candidates (across various stages), and interviewers
- **F-25** Candidates are assumed to have applied externally; no public application form needed for MVP

---

## 6. Data Model (Entities)

| Entity | Key Fields |
|---|---|
| `recruiters` | id, name, email |
| `jobs` | id, title, description, department, location, status, recruiter_id, created_at |
| `candidates` | id, name, email, job_id, current_stage, resume_url, feedback_doc_url, created_at |
| `candidate_stage_history` | id, candidate_id, from_stage, to_stage, changed_at |
| `interviewers` | id, name, email |
| `candidate_interviewers` | candidate_id, interviewer_id *(join table)* |
| `notifications` | id, candidate_id, email_body, status (queued/sent/failed), created_at, sent_at |

> `jobs.recruiter_id` models ownership for future access control. Enforcement is deferred until authentication is added.

---

## 7. Directory Structure

```
recruit-talent/
├── docker-compose.yml              # Orchestrates all services + Postgres + Kafka
│
├── frontend/                       # React (Vite) — SPA recruiter UI
│   ├── Dockerfile
│   └── src/
│       ├── components/             # UI components (PascalCase)
│       ├── services/               # API call wrappers
│       └── utils/
│
├── backend/                        # Node.js + Express — REST API + Kafka producer
│   ├── Dockerfile
│   └── src/
│       ├── api/                    # Route handlers
│       ├── services/               # Business logic
│       ├── db/                     # Postgres queries + migrations
│       ├── utils/
│       └── config/
│
└── notification-service/           # Kafka consumer — email sender
    ├── Dockerfile
    └── src/
        ├── consumers/              # Kafka topic listeners
        ├── services/               # Email sending logic (Resend/SendGrid)
        └── config/                 # Kafka + email provider config
```

**Key architectural decisions:**
- Each service has its own `Dockerfile` and `package.json` — independently deployable when moving to cloud
- `notification-service` has no dependency on the backend; it consumes Kafka events, sends emails, and writes delivery status (`sent` / `failed`) directly to Postgres — avoiding a circular HTTP callback to the backend
- React (Vite) chosen over Next.js: internal recruiter dashboard (no SEO/SSR needed), and Express cleanly owns all Kafka producer logic

---

## 8. Notification System Architecture

```
Recruiter confirms rejection
        │
        ▼
POST /candidates/:id/reject
        │
        ▼
 Write notification record (status: queued)
        │
        ▼
 Publish to Kafka topic: candidate.notifications
        │
        ▼
 Kafka Consumer (separate Node.js service)
        │
        ▼
 Send email via Resend/SendGrid
        │
        ▼
 Update notification record (status: sent / failed)
```

---

## 9. UI Screens

| Screen | Description |
|---|---|
| Jobs Dashboard | List of all jobs with open/closed status and candidate count |
| Job Detail / Pipeline | Kanban or list of candidates by stage for a specific job |
| Candidate Profile | Full candidate view: details, stage history, interviewers, feedback doc link, notification status |
| Rejection Modal | Editable email draft; confirm sends to Kafka |
| Create/Edit Job | Form to manage job postings |

---

## 10. Out of Scope (MVP)

- Authentication / login
- Access control enforcement (recruiter can only see candidates for their assigned jobs — data model is in place, enforcement deferred to auth phase)
- Public candidate application form
- Interviewer login / in-app feedback submission
- Calendar / interview scheduling
- CSV import
- Multi-tenancy
- Mobile app

---

## 11. Definition of Done

Per `CLAUDE.md`:
1. All described behaviors work correctly across scenarios
2. Edge cases handled (rejecting from any stage, missing feedback doc, email delivery failure)
3. All new functions have JSDoc comments
4. Unit tests exist and pass for each feature
5. No linting errors
6. UI works at desktop and mobile viewport widths
