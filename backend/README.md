# Backend API

Base URL: `http://localhost:3001`

---

## Health Check

```bash
curl http://localhost:3001/health
```

---

## Jobs

### List all jobs
```bash
curl http://localhost:3001/api/jobs
```

### Get a single job
```bash
curl http://localhost:3001/api/jobs/<job_id>
```

### Create a job
```bash
curl -X POST http://localhost:3001/api/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Staff Engineer",
    "description": "Lead technical direction across teams.",
    "department": "Engineering",
    "location": "Remote"
  }'
```

### Edit a job
```bash
curl -X PUT http://localhost:3001/api/jobs/<job_id> \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Staff Software Engineer",
    "location": "New York, NY"
  }'
```

### Close a job
```bash
curl -X PATCH http://localhost:3001/api/jobs/<job_id>/close
```

---

## Candidates

### List candidates for a job
```bash
curl "http://localhost:3001/api/jobs/<job_id>/candidates"
```

### Filter by stage
```bash
curl "http://localhost:3001/api/jobs/<job_id>/candidates?stage=interview"
```

### Search by name or email
```bash
curl "http://localhost:3001/api/jobs/<job_id>/candidates?search=jordan"
```

### Get a candidate profile (with stage history, interviewers, notifications)
```bash
curl http://localhost:3001/api/candidates/<candidate_id>
```

### Advance a candidate to the next stage
```bash
curl -X PATCH http://localhost:3001/api/candidates/<candidate_id>/advance
```

### Reject a candidate (returns candidate + rejection email draft)
```bash
curl -X PATCH http://localhost:3001/api/candidates/<candidate_id>/reject
```

### Send rejection notification (publish to Kafka after recruiter reviews draft)
```bash
curl -X POST http://localhost:3001/api/candidates/<candidate_id>/notify \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "Your application for Senior Frontend Engineer",
    "body": "Hi Jordan,\n\nThank you for interviewing...\n\nBest regards,\nThe Recruiting Team"
  }'
```

---

## Interviewers

### List interviewers assigned to a candidate
```bash
curl http://localhost:3001/api/candidates/<candidate_id>/interviewers
```

### Assign an interviewer to a candidate
```bash
curl -X POST http://localhost:3001/api/candidates/<candidate_id>/interviewers \
  -H "Content-Type: application/json" \
  -d '{ "interviewer_id": "<interviewer_id>" }'
```

### Remove an interviewer from a candidate
```bash
curl -X DELETE http://localhost:3001/api/candidates/<candidate_id>/interviewers/<interviewer_id>
```

---

## Running Locally

### 1. Start infrastructure
```bash
docker compose up -d postgres zookeeper kafka
```

### 2. Install dependencies
```bash
npm install
```

### 3. Run migration
```bash
npm run migrate
```

### 4. Seed mock data
```bash
npm run seed
```

### 5. Start the server
```bash
npm run dev
```

---

## Stage Order

Candidates move through stages in this order:

```
applied → recruiter_screen → tech_screen → interview → offer → hired
```

A candidate can be moved to `rejected` from any stage except `hired`.
