import { consumer } from '../config/kafka.js';
import pool from '../config/db.js';
import { sendEmail } from '../services/emailService.js';

const TOPIC = 'candidate.notifications';

/**
 * Starts the Kafka consumer, listens for candidate notification events,
 * sends rejection emails, and updates the candidate stage and notification
 * status in Postgres based on delivery outcome.
 */
export async function startNotificationConsumer() {
  await consumer.connect();
  await consumer.subscribe({ topic: TOPIC, fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ message }) => {
      let payload;
      try {
        payload = JSON.parse(message.value.toString());
      } catch {
        console.error('Invalid message payload — skipping');
        return;
      }

      const { notificationId, candidateId, to, subject, body } = payload;

      try {
        await sendEmail({ to, subject, body });

        // Email delivered — now move the candidate to rejected and record the stage change
        const { rows } = await pool.query(
          `SELECT current_stage FROM candidates WHERE id = $1`,
          [candidateId]
        );
        const previousStage = rows[0]?.current_stage;

        await pool.query('BEGIN');
        await pool.query(
          `UPDATE candidates SET current_stage = 'rejected' WHERE id = $1`,
          [candidateId]
        );
        await pool.query(
          `INSERT INTO candidate_stage_history (candidate_id, from_stage, to_stage)
           VALUES ($1, $2, 'rejected')`,
          [candidateId, previousStage]
        );
        await pool.query(
          `UPDATE notifications SET status = 'sent', sent_at = NOW() WHERE id = $1`,
          [notificationId]
        );
        await pool.query('COMMIT');

        console.log(`Notification ${notificationId} sent to ${to} — candidate ${candidateId} moved to rejected`);
      } catch (err) {
        await pool.query('ROLLBACK').catch(() => {});
        console.error(`Failed to send notification ${notificationId}:`, err.message);

        // Email failed — mark notification as failed, stage stays unchanged
        await pool.query(
          `UPDATE notifications SET status = 'failed' WHERE id = $1`,
          [notificationId]
        );
      }
    },
  });
}
