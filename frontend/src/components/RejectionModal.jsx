import * as Dialog from '@radix-ui/react-dialog';
import { useState } from 'react';
import { sendNotification } from '../services/candidateService.js';

/**
 * Modal for reviewing and editing the auto-generated rejection email before sending.
 * @param {{ open: boolean, candidateId: string, draft: { subject: string, body: string }, onClose: () => void, onSent: () => void }} props
 */
export default function RejectionModal({ open, candidateId, draft, onClose, onSent }) {
  const [subject, setSubject] = useState(draft?.subject ?? '');
  const [body, setBody] = useState(draft?.body ?? '');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  // Sync when a new draft comes in
  if (draft?.subject && subject !== draft.subject && !sending) {
    setSubject(draft.subject);
    setBody(draft.body);
  }

  async function handleSend() {
    if (!subject.trim() || !body.trim()) return setError('Subject and body are required.');
    setSending(true);
    setError('');
    try {
      await sendNotification(candidateId, subject, body);
      onSent();
      onClose();
    } catch {
      setError('Failed to send notification. Please try again.');
    } finally {
      setSending(false);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={v => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 z-20" />
        <Dialog.Content className="fixed z-30 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-xl w-full max-w-2xl p-6">
          <Dialog.Title className="text-lg font-semibold mb-1">Send Rejection Email</Dialog.Title>
          <p className="text-sm text-gray-500 mb-4">Review and edit the draft before sending.</p>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
              <input
                value={subject}
                onChange={e => setSubject(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Body</label>
              <textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                rows={10}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none font-mono"
              />
            </div>
          </div>

          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-2 mt-4">
            <button onClick={onClose}
              className="px-4 py-2 text-sm rounded-lg border hover:bg-gray-50">
              Cancel
            </button>
            <button onClick={handleSend} disabled={sending}
              className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50">
              {sending ? 'Sending…' : 'Send Email'}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
