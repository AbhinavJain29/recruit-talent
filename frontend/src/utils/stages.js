export const STAGE_ORDER = [
  'applied',
  'recruiter_screen',
  'tech_screen',
  'interview',
  'offer',
  'hired',
];

export const STAGE_LABELS = {
  applied: 'Applied',
  recruiter_screen: 'Recruiter Screen',
  tech_screen: 'Tech Screen',
  interview: 'Interview',
  offer: 'Offer',
  hired: 'Hired',
  rejected: 'Rejected',
};

export const STAGE_COLORS = {
  applied: 'bg-gray-100 text-gray-700',
  recruiter_screen: 'bg-blue-100 text-blue-700',
  tech_screen: 'bg-purple-100 text-purple-700',
  interview: 'bg-amber-100 text-amber-700',
  offer: 'bg-green-100 text-green-700',
  hired: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-700',
};

/** Returns true if the candidate can be advanced further */
export function canAdvance(stage) {
  const idx = STAGE_ORDER.indexOf(stage);
  return idx !== -1 && idx < STAGE_ORDER.length - 1;
}

/** Returns true if the candidate can be rejected */
export function canReject(stage) {
  return stage !== 'rejected' && stage !== 'hired';
}
