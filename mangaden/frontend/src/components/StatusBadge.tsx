import type { TaskStatus } from '../types';

const STATUS_LABELS: Record<TaskStatus, string> = {
  done:     'Done',
  not_done: 'Not Done',
};

const CSS_MAP: Record<TaskStatus, string> = {
  done:     'completed',
  not_done: 'plan_to_read',
};

export function StatusBadge({ status }: { status: TaskStatus }) {
  const cssClass = CSS_MAP[status];
  return (
    <span className={`status-badge status-badge--${cssClass}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}
