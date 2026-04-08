import pool from '../config/db.js';
import { producer } from '../config/kafka.js';

const TOPIC = 'candidate.notifications';

/**
 * Generates a rejection email draft for a candidate using their feedback doc context.
 * Falls back to a default template if no feedback doc is available.
 * @param {string} candidateId
 * @returns {Promise<{ subject: string, body: string }>}
 */
export async function generateRejectionDraft(candidateId) {
  const { rows } = await pool.query(
    `SELECT c.name, c.email, c.feedback_doc_url, j.title AS job_title
     FROM candidates c
     JOIN jobs j ON j.id = c.job_id
     WHERE c.id = $1`,
    [candidateId]
  );
  const candidate = rows[0];
  if (!candidate) throw new Error('Candidate not found');

  const subject = `Your application for ${candidate.job_title}`;
  const body = [
    `Hi ${candidate.name},`,
    '',
    `Thank you for taking the time to apply and interview for the ${candidate.job_title} role.`,
    'After careful consideration, we have decided to move forward with other candidates at this time.',
    '',
    candidate.feedback_doc_url
      ? `We have prepared feedback on your application which you can review here: ${candidate.feedback_doc_url}`
      : 'We encourage you to apply for future openings that match your skills.',
    '',
    'We appreciate your interest and wish you the best in your search.',
    '',
    'Best regards,',
    'The Recruiting Team',
  ].join('\n');

  return { subject, body };
}

/**
 * Persists a notification record as 'queued' and publishes it to Kafka.
 * @param {string} candidateId
 * @param {string} subject
 * @param {string} body - The recruiter-reviewed email body to send
 * @returns {Promise<object>} The created notification record
 */
export async function queueNotification(candidateId, subject, body) {
  const { rows: candidateRows } = await pool.query(
    `SELECT email FROM candidates WHERE id = $1`,
    [candidateId]
  );
  if (!candidateRows[0]) throw new Error('Candidate not found');

  const { rows } = await pool.query(
    `INSERT INTO notifications (candidate_id, email_body, status)
     VALUES ($1, $2, 'queued')
     RETURNING *`,
    [candidateId, body]
  );
  const notification = rows[0];

  await producer.send({
    topic: TOPIC,
    messages: [
      {
        key: candidateId,
        value: JSON.stringify({
          notificationId: notification.id,
          candidateId,
          to: candidateRows[0].email,
          subject,
          body,
        }),
      },
    ],
  });

  return notification;
}
