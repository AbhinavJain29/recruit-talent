# End-to-End Demo Guide

This guide walks you through setting up the app locally and testing the full candidate rejection flow — from the recruiter UI all the way to an email landing in your inbox.

---

## What you'll test

- Browsing job postings and candidate pipelines
- Advancing a candidate through hiring stages
- Triggering a rejection email with an editable draft
- Receiving the actual email in your inbox
- Seeing the candidate's stage automatically update to **Rejected** after delivery

---

## Part 1 — Setup

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) — must be running
- [Node.js 20+](https://nodejs.org/)
- A [Resend](https://resend.com) account and API key (free tier works)

---

### Step 1 — Clone the repo

```bash
git clone https://github.com/AbhinavJain29/recruit-talent.git
cd recruit-talent
```

---

### Step 2 — Configure environment files

```bash
cp backend/.env.example backend/.env
cp notification-service/.env.example notification-service/.env
```

Open `notification-service/.env` and fill in your Resend API key:

```
RESEND_API_KEY=re_your_actual_key_here
```

> **Note:** Keep `FROM_EMAIL` as `onboarding@resend.dev`. This is Resend's pre-verified sandbox sender — no domain setup required.

---

### Step 3 — Start infrastructure

```bash
docker compose up -d postgres zookeeper kafka
```

Wait about 10 seconds for Kafka to fully start before continuing.

---

### Step 4 — Install dependencies

```bash
npm install --prefix backend
npm install --prefix frontend
npm install --prefix notification-service
```

---

### Step 5 — Run database migrations and seed data

```bash
npm run migrate --prefix backend
npm run seed --prefix backend
```

This creates all tables and populates them with 4 jobs, 24 candidates across various stages, 3 interviewers, and sample notifications.

---

### Step 6 — Start all three services

Open three separate terminal tabs and run one command in each:

**Terminal 1 — Backend API**
```bash
npm run dev --prefix backend
```
> Ready when you see: `Backend listening on port 3001`

**Terminal 2 — Notification Service**
```bash
npm run dev --prefix notification-service
```
> Ready when you see: `Notification consumer started`

**Terminal 3 — Frontend**
```bash
npm run dev --prefix frontend
```
> Ready when you see: `Local: http://localhost:5173`

---

### Step 7 — Open the app

Navigate to **http://localhost:5173**

---

## Part 2 — Exploring the App

### Jobs Dashboard

You'll land on the jobs dashboard. You'll see 4 job postings:

| Job | Status |
|---|---|
| Senior Frontend Engineer | Open |
| Backend Engineer | Open |
| Product Designer | Open |
| Data Analyst | Closed |

Each card shows the department, location, recruiter, and total candidate count.

**Try it:**
- Click **New Job** to create a job posting
- Click the **···** menu on any job to edit it or close it
- Click any job card to open the pipeline view

---

### Pipeline View

The pipeline shows all candidates for that job grouped by stage as a Kanban board:

```
Applied → Recruiter Screen → Tech Screen → Interview → Offer → Hired → Rejected
```

**Try it:**
- Search for a candidate by name using the search bar
- Click **→** on any candidate card to advance them to the next stage
- Click a candidate's name to open their full profile

---

### Candidate Profile

The profile page shows:
- Current stage badge
- Resume and feedback document links
- Full stage history timeline
- Assigned interviewers
- Notification delivery status (if a rejection email was sent)

---

## Part 3 — E2E Rejection Email Test

This is the core flow. You'll reject a candidate and receive the rejection email in your own inbox.

---

### Step 1 — Point a candidate's email at your inbox

The seed data uses placeholder emails. You need to update one candidate to use your real email address.

Run this command (replace `your@email.com` with your actual email):

```bash
docker exec -it recruit-talent-postgres-1 psql -U recruiter -d recruit_talent \
  -c "UPDATE candidates SET email = 'your@email.com' WHERE name = 'Felix Grant';"
```

> Felix Grant is a **Product Designer** candidate currently at the **Interview** stage — a natural point for rejection.

---

### Step 2 — Navigate to Felix Grant's profile

1. Go to **http://localhost:5173**
2. Click on **Product Designer**
3. Find **Felix Grant** in the Interview column
4. Click his name to open the profile

---

### Step 3 — Reject the candidate

1. On the profile page, click the **Reject** button
2. A modal will appear with an auto-generated rejection email draft containing:
   - Felix's name and the role he applied for
   - A link to his feedback document
3. **Edit the email body** if you'd like — the text area is fully editable
4. Click **Send Rejection Email**

---

### Step 4 — Watch it process

After clicking confirm:

1. The backend creates a notification record (`status: queued`) and publishes a message to the `candidate.notifications` Kafka topic
2. The notification service picks up the message, sends the email via Resend, then updates:
   - Notification status → `sent`
   - Candidate stage → `rejected`

This takes **2–5 seconds**.

---

### Step 5 — Check your inbox

Open your email inbox. You should receive a message:

- **From:** `onboarding@resend.dev`
- **To:** your email address
- **Subject:** something like `Update on your application for Product Designer`
- **Body:** the draft you reviewed (and optionally edited) in the modal

> Check your spam folder if it doesn't appear within a minute.

---

### Step 6 — Verify the status in the app

Refresh Felix Grant's profile page (or wait ~5 seconds and it updates automatically). You should see:

- Stage badge updated to **Rejected**
- A green **Email sent** badge next to the stage
- The **Notifications** section at the bottom showing `sent` status with a timestamp
- A new entry in the **Stage History** timeline showing the transition to Rejected

---

## What each status means

| Status | Meaning |
|---|---|
| `queued` | Message published to Kafka, email not yet sent |
| `sent` | Email delivered successfully, candidate moved to Rejected |
| `failed` | Email delivery failed, candidate stage is **not** changed |

> The stage only changes to Rejected **after** the email is confirmed delivered — never before.

---

## Resetting for another test run

To re-seed fresh data (this resets all candidates, stages, and notifications):

```bash
npm run seed --prefix backend
```

Remember to update the candidate email again after reseeding if you want to repeat the email test.
