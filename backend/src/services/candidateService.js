import pool from '../config/db.js';

const STAGE_ORDER = [
  'applied',
  'recruiter_screen',
  'tech_screen',
  'interview',
  'offer',
  'hired',
];

/**
 * Lists candidates for a job, with optional filtering by name or stage.
 * @param {string} jobId
 * @param {{ search?: string, stage?: string }} filters
 * @returns {Promise<object[]>}
 */
export async function listCandidates(jobId, { search, stage } = {}) {
  const params = [jobId];
  const conditions = ['c.job_id = $1'];

  if (stage) {
    params.push(stage);
    conditions.push(`c.current_stage = $${params.length}::candidate_stage`);
  }

  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(c.name ILIKE $${params.length} OR c.email ILIKE $${params.length})`);
  }

  const { rows } = await pool.query(
    `SELECT c.*,
            COALESCE(json_agg(i.*) FILTER (WHERE i.id IS NOT NULL), '[]') AS interviewers
     FROM candidates c
     LEFT JOIN candidate_interviewers ci ON ci.candidate_id = c.id
     LEFT JOIN interviewers i ON i.id = ci.interviewer_id
     WHERE ${conditions.join(' AND ')}
     GROUP BY c.id
     ORDER BY c.created_at DESC`,
    params
  );
  return rows;
}

/**
 * Returns a full candidate profile including stage history and assigned interviewers.
 * @param {string} id
 * @returns {Promise<object|null>}
 */
export async function getCandidate(id) {
  const { rows: candidates } = await pool.query(
    `SELECT c.*, j.title AS job_title
     FROM candidates c
     JOIN jobs j ON j.id = c.job_id
     WHERE c.id = $1`,
    [id]
  );
  if (!candidates[0]) return null;

  const { rows: history } = await pool.query(
    `SELECT * FROM candidate_stage_history
     WHERE candidate_id = $1
     ORDER BY changed_at ASC`,
    [id]
  );

  const { rows: interviewers } = await pool.query(
    `SELECT i.* FROM interviewers i
     JOIN candidate_interviewers ci ON ci.interviewer_id = i.id
     WHERE ci.candidate_id = $1`,
    [id]
  );

  const { rows: notifications } = await pool.query(
    `SELECT id, status, created_at, sent_at
     FROM notifications
     WHERE candidate_id = $1
     ORDER BY created_at DESC`,
    [id]
  );

  return { ...candidates[0], stage_history: history, interviewers, notifications };
}

/**
 * Advances a candidate to the next stage in the pipeline.
 * Cannot advance from 'hired' or 'rejected'.
 * @param {string} id
 * @returns {Promise<object>}
 */
export async function advanceCandidate(id) {
  const { rows } = await pool.query(
    `SELECT id, current_stage FROM candidates WHERE id = $1`,
    [id]
  );
  const candidate = rows[0];
  if (!candidate) throw new Error('Candidate not found');

  const currentIdx = STAGE_ORDER.indexOf(candidate.current_stage);
  if (currentIdx === -1 || currentIdx === STAGE_ORDER.length - 1) {
    throw new Error(`Cannot advance from stage: ${candidate.current_stage}`);
  }

  const nextStage = STAGE_ORDER[currentIdx + 1];
  return _updateStage(id, candidate.current_stage, nextStage);
}

/**
 * Validates that a candidate can be rejected and returns their current record.
 * The actual stage change to 'rejected' happens in the notification service
 * only after the rejection email is successfully delivered.
 * @param {string} id
 * @returns {Promise<object>}
 */
export async function rejectCandidate(id) {
  const { rows } = await pool.query(
    `SELECT id, current_stage FROM candidates WHERE id = $1`,
    [id]
  );
  const candidate = rows[0];
  if (!candidate) throw new Error('Candidate not found');
  if (candidate.current_stage === 'rejected') {
    throw new Error('Candidate is already rejected');
  }
  if (candidate.current_stage === 'hired') {
    throw new Error('Cannot reject a hired candidate');
  }

  return candidate;
}

/**
 * Lists interviewers assigned to a candidate.
 * @param {string} candidateId
 * @returns {Promise<object[]>}
 */
export async function listInterviewers(candidateId) {
  const { rows } = await pool.query(
    `SELECT i.* FROM interviewers i
     JOIN candidate_interviewers ci ON ci.interviewer_id = i.id
     WHERE ci.candidate_id = $1`,
    [candidateId]
  );
  return rows;
}

/**
 * Assigns an interviewer to a candidate.
 * @param {string} candidateId
 * @param {string} interviewerId
 * @returns {Promise<void>}
 */
export async function assignInterviewer(candidateId, interviewerId) {
  await pool.query(
    `INSERT INTO candidate_interviewers (candidate_id, interviewer_id)
     VALUES ($1, $2)
     ON CONFLICT DO NOTHING`,
    [candidateId, interviewerId]
  );
}

/**
 * Removes an interviewer from a candidate.
 * @param {string} candidateId
 * @param {string} interviewerId
 * @returns {Promise<void>}
 */
export async function removeInterviewer(candidateId, interviewerId) {
  await pool.query(
    `DELETE FROM candidate_interviewers
     WHERE candidate_id = $1 AND interviewer_id = $2`,
    [candidateId, interviewerId]
  );
}

/**
 * Updates a candidate's stage and appends a history record.
 * @param {string} id
 * @param {string} fromStage
 * @param {string} toStage
 * @returns {Promise<object>}
 */
async function _updateStage(id, fromStage, toStage) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `UPDATE candidates SET current_stage = $1 WHERE id = $2 RETURNING *`,
      [toStage, id]
    );
    await client.query(
      `INSERT INTO candidate_stage_history (candidate_id, from_stage, to_stage)
       VALUES ($1, $2, $3)`,
      [id, fromStage, toStage]
    );
    await client.query('COMMIT');
    return rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
