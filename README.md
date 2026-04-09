# Recruit Talent

A recruiter-facing job application management portal. Recruiters can track open roles, manage candidate pipelines, and automatically notify rejected candidates via email — powered by an async Kafka-based notification system.

**[→ End-to-End Demo Guide](./DEMO.md)** — step-by-step local setup through a live rejection email test.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                        Browser                          │
│               React SPA  (localhost:5173)               │
└────────────────────────┬────────────────────────────────┘
                         │ HTTP (REST)
┌────────────────────────▼────────────────────────────────┐
│              Backend API  (localhost:3001)               │
│                  Node.js + Express                       │
│                                                         │
│  • Job & candidate CRUD                                 │
│  • Stage progression logic                              │
│  • Rejection email draft generation                     │
│  • Publishes to Kafka on recruiter confirmation         │
└──────────┬──────────────────────┬───────────────────────┘
           │ SQL                  │ Produce
┌──────────▼──────────┐  ┌───────▼──────────────────────┐
│     PostgreSQL      │  │       Apache Kafka            │
│    (port 5432)      │  │  topic: candidate.notifications│
└──────────▲──────────┘  └───────┬──────────────────────┘
           │ SQL                  │ Consume
           │          ┌───────────▼──────────────────────┐
           │          │     Notification Service          │
           │          │        Node.js consumer           │
           └──────────│                                   │
                      │  • Consumes Kafka messages        │
                      │  • Sends email via Resend         │
                      │  • Updates candidate stage        │
                      │    to 'rejected' on success       │
                      │  • Marks notification failed      │
                      │    on error (stage unchanged)     │
                      └───────────────────────────────────┘
```

---

## Services

### `frontend/`
**React (Vite) + Tailwind CSS + shadcn/ui — port 5173**

Single-page application for recruiters. No login required for MVP.

| Screen | Route | Description |
|---|---|---|
| Jobs Dashboard | `/` | All job postings with status and candidate counts |
| Pipeline | `/jobs/:id` | Kanban board with candidates grouped by stage |
| Candidate Profile | `/candidates/:id` | Full profile, stage history, interviewers, documents |
| Rejection Modal | overlay | Editable rejection email draft before sending |

---

### `backend/`
**Node.js + Express — port 3001**

REST API that owns all business logic and acts as the Kafka producer.

| Layer | Path | Responsibility |
|---|---|---|
| Route handlers | `src/api/` | HTTP request/response, input validation |
| Services | `src/services/` | Business logic — jobs, candidates, notifications |
| Database | `src/db/` | Schema, migrations, seed script |
| Config | `src/config/` | Postgres pool, Kafka producer |

**Key endpoints:**

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/jobs` | List all jobs with candidate counts |
| `GET` | `/api/jobs/:id` | Get a single job |
| `POST` | `/api/jobs` | Create a job posting |
| `PUT` | `/api/jobs/:id` | Edit a job posting |
| `PATCH` | `/api/jobs/:id/close` | Close a job posting |
| `GET` | `/api/jobs/:id/candidates` | List candidates (supports `?search=&stage=`) |
| `GET` | `/api/candidates/:id` | Full candidate profile + history + notifications |
| `PATCH` | `/api/candidates/:id/advance` | Move to next stage |
| `PATCH` | `/api/candidates/:id/reject` | Validate rejection + return email draft |
| `POST` | `/api/candidates/:id/notify` | Publish rejection email to Kafka |
| `GET/POST/DELETE` | `/api/candidates/:id/interviewers` | Manage assigned interviewers |

---

### `notification-service/`
**Node.js Kafka consumer — no HTTP port**

Subscribes to the `candidate.notifications` Kafka topic and handles delivery.

| Layer | Path | Responsibility |
|---|---|---|
| Consumer | `src/consumers/notificationConsumer.js` | Kafka message processing |
| Email | `src/services/emailService.js` | Sends email via Resend |
| Config | `src/config/` | Kafka consumer, Postgres pool |

**Message flow:**
1. Receives `{ notificationId, candidateId, to, subject, body }` from Kafka
2. Sends email via Resend
3. **On success:** sets `candidate.current_stage = 'rejected'`, records stage history, marks notification `sent`
4. **On failure:** marks notification `failed`, candidate stage is left unchanged

---

## Data Model

```
recruiters          jobs                    candidates
──────────          ────                    ──────────
id                  id                      id
name                title                   name
email               description             email
                    department              job_id ──────────────────┐
                    location                current_stage            │
                    status                  resume_url               │
                    recruiter_id ───┐       feedback_doc_url         │
                    created_at      │       created_at               │
                                    │                                │
                              recruiters                             │
                                                                     │
interviewers        candidate_interviewers   candidate_stage_history │
────────────        ─────────────────────   ───────────────────────  │
id                  candidate_id ────────── id                       │
name                interviewer_id          candidate_id ────────────┘
email                                       from_stage
                                            to_stage
notifications                               changed_at
─────────────
id
candidate_id
email_body
status (queued/sent/failed)
created_at
sent_at
```

**Pipeline stages (in order):**
```
applied → recruiter_screen → tech_screen → interview → offer → hired
                                                ↓ (from any stage)
                                            rejected
```

---

## Local Development

### Prerequisites
- Docker Desktop
- Node.js 20+
- A [Resend](https://resend.com) API key

### Setup

**1. Clone and configure environment**
```bash
cp .env.example .env
# Add your RESEND_API_KEY to .env
```

**2. Start infrastructure (Postgres + Kafka + Zookeeper)**
```bash
docker compose up -d postgres zookeeper kafka
```

**3. Install dependencies**
```bash
npm install --prefix backend
npm install --prefix frontend
npm install --prefix notification-service
```

**4. Create .env files for each service**
```bash
cp backend/.env.example backend/.env
cp notification-service/.env.example notification-service/.env
# Set RESEND_API_KEY in notification-service/.env
```

**5. Run database migration and seed**
```bash
npm run migrate --prefix backend
npm run seed --prefix backend
```

**6. Start all three services** (in separate terminals)
```bash
# Terminal 1
npm run dev --prefix backend

# Terminal 2
npm run dev --prefix notification-service

# Terminal 3
npm run dev --prefix frontend
```

**7. Open the app**

Navigate to `http://localhost:5173`

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, Radix UI |
| Backend | Node.js, Express |
| Database | PostgreSQL 15 |
| Messaging | Apache Kafka (Confluent) |
| Email | Resend |
| Local infra | Docker Compose |
