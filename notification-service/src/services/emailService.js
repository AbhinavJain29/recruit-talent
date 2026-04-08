import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Sends a rejection email to a candidate.
 * @param {object} params
 * @param {string} params.to - Recipient email address
 * @param {string} params.subject - Email subject line
 * @param {string} params.body - Plain-text email body
 * @returns {Promise<void>}
 */
export async function sendEmail({ to, subject, body }) {
  const { data, error } = await resend.emails.send({
    from: process.env.FROM_EMAIL,
    to,
    subject,
    text: body,
  });

  if (error) {
    throw new Error(`Resend error: ${error.message}`);
  }

  console.log(`Email dispatched via Resend — id: ${data.id}`);
}
