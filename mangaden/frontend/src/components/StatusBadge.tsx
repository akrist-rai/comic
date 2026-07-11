import type { Status } from '../types';

const STATUS_LABELS: Record<Status, string> = {
  reading:      'Reading',
  completed:    'Completed',
  on_hold:      'On Hold',
  dropped:      'Dropped',
  plan_to_read: 'Plan to Read',
};

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={`status-badge status-badge--${status}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}
