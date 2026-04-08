import pool from '../config/db.js';

/**
 * Returns all jobs with their status and total candidate count.
 * @returns {Promise<object[]>}
 */
export async function listJobs() {
  const { rows } = await pool.query(`
    SELECT
      j.*,
      r.name AS recruiter_name,
      COUNT(c.id)::int AS candidate_count
    FROM jobs j
    LEFT JOIN recruiters r ON r.id = j.recruiter_id
    LEFT JOIN candidates c ON c.job_id = j.id
    GROUP BY j.id, r.name
    ORDER BY j.created_at DESC
  `);
  return rows;
}

/**
 * Returns a single job by ID.
 * @param {string} id
 * @returns {Promise<object|null>}
 */
export async function getJob(id) {
  const { rows } = await pool.query(
    `SELECT j.*, r.name AS recruiter_name
     FROM jobs j
     LEFT JOIN recruiters r ON r.id = j.recruiter_id
     WHERE j.id = $1`,
    [id]
  );
  return rows[0] ?? null;
}

/**
 * Creates a new job posting.
 * @param {{ title: string, description: string, department: string, location: string, recruiter_id?: string }} data
 * @returns {Promise<object>}
 */
export async function createJob(data) {
  const { title, description, department, location, recruiter_id } = data;
  const { rows } = await pool.query(
    `INSERT INTO jobs (title, description, department, location, recruiter_id)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [title, description, department, location, recruiter_id ?? null]
  );
  return rows[0];
}

/**
 * Updates an existing job posting.
 * @param {string} id
 * @param {{ title?: string, description?: string, department?: string, location?: string }} data
 * @returns {Promise<object|null>}
 */
export async function updateJob(id, data) {
  const { title, description, department, location } = data;
  const { rows } = await pool.query(
    `UPDATE jobs
     SET
       title       = COALESCE($1, title),
       description = COALESCE($2, description),
       department  = COALESCE($3, department),
       location    = COALESCE($4, location)
     WHERE id = $5
     RETURNING *`,
    [title, description, department, location, id]
  );
  return rows[0] ?? null;
}

/**
 * Soft-closes a job posting. Candidates remain visible.
 * @param {string} id
 * @returns {Promise<object|null>}
 */
export async function closeJob(id) {
  const { rows } = await pool.query(
    `UPDATE jobs SET status = 'closed' WHERE id = $1 RETURNING *`,
    [id]
  );
  return rows[0] ?? null;
}
