import { memo } from 'react';
import { motion } from 'framer-motion';
import { Check, Edit2, Trash2 } from 'lucide-react';
import type { Task } from '../types';
import { SymbolCover } from './SymbolCover';
import { useTaskDispatch } from '../context/TaskContext';
import { useToast } from '../context/ToastContext';

interface TaskCardProps {
  task:         Task;
  onEditClick: (task: Task) => void;
}

const cardVariants = {
  hidden:  { opacity: 0, y: 16, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: 'easeOut' as const,
    },
  },
};

const getImageUrl = (url: string | null) => {
  if (!url) return null;
  if (url.startsWith('http') || url.startsWith('/') || url.startsWith('data:')) {
    return url;
  }
  return `/api/goodstuff/img/${encodeURIComponent(url)}`;
};

export const TaskCard = memo(function TaskCard({ task, onEditClick }: TaskCardProps) {
  const dispatch = useTaskDispatch();
  const { showToast } = useToast();

  const isDone = task.status === 'done';

  const handleToggleStatus = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const newStatus = isDone ? 'not_done' : 'done';

    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const updated = await res.json();
        dispatch({ type: 'UPDATE', payload: updated });
        showToast(isDone ? 'Marked task as not done' : 'Task completed!', 'success');
      }
    } catch (err) {
      showToast('Failed to update task status.', 'error');
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!window.confirm(`Delete task "${task.title}"?`)) return;

    try {
      const res = await fetch(`/api/tasks/${task.id}`, { method: 'DELETE' });
      if (res.ok) {
        dispatch({ type: 'REMOVE', payload: task.id });
        showToast('Task deleted.', 'info');
      }
    } catch (err) {
      showToast('Failed to delete task.', 'error');
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onEditClick(task);
  };

  const coverSrc = getImageUrl(task.coverUrl);

  return (
    <motion.div
      variants={cardVariants}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={`manga-card task-card ${isDone ? 'task-card--done' : ''}`}
      style={{
        position: 'relative',
        cursor: 'default',
        borderRadius: '12px',
        overflow: 'hidden',
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        height: '240px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Cover Image or Fallback */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', height: '70%' }}>
        {coverSrc ? (
          <img
            src={coverSrc}
            alt={task.title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              filter: isDone ? 'grayscale(80%) opacity(40%)' : 'none',
              transition: 'all 0.3s ease',
            }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', filter: isDone ? 'grayscale(80%) opacity(40%)' : 'none', transition: 'all 0.3s ease' }}>
            <SymbolCover title={task.title} />
          </div>
        )}

        {/* Checkbox Trigger Top-Right */}
        <button
          type="button"
          onClick={handleToggleStatus}
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            background: isDone ? '#10B981' : 'rgba(0, 0, 0, 0.5)',
            border: isDone ? 'none' : '2px solid rgba(255, 255, 255, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            cursor: 'pointer',
            zIndex: 10,
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            transition: 'all 0.2s ease',
          }}
          title={isDone ? 'Mark as Not Done' : 'Mark as Done'}
        >
          {isDone && <Check size={16} strokeWidth={3} />}
        </button>

        {/* Quick Operations Top-Left */}
        <div
          className="task-card__actions"
          style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            display: 'flex',
            gap: '8px',
            opacity: 0, // shown on hover
            transition: 'opacity 0.2s ease',
            zIndex: 10,
          }}
        >
          <button
            type="button"
            onClick={handleEdit}
            className="action-btn action-btn--edit"
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              background: 'rgba(15, 15, 15, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            title="Edit Task"
          >
            <Edit2 size={13} />
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="action-btn action-btn--delete"
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              background: 'rgba(15, 15, 15, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            title="Delete Task"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Title / Name Row */}
      <div
        style={{
          padding: '12px 14px',
          background: 'rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(4px)',
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          display: 'flex',
          alignItems: 'center',
          flex: '0 0 auto',
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: '14px',
            fontWeight: 600,
            color: isDone ? 'var(--muted)' : 'var(--text)',
            textDecoration: isDone ? 'line-through' : 'none',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            flex: 1,
            transition: 'color 0.2s ease',
          }}
          title={task.title}
        >
          {task.title}
        </h3>
      </div>

      {/* Hover action inject style */}
      <style>{`
        .task-card:hover .task-card__actions {
          opacity: 1 !important;
        }
        .action-btn:hover {
          transform: scale(1.08);
        }
        .action-btn--edit:hover {
          background: #4F46E5 !important;
          border-color: #6366F1 !important;
        }
        .action-btn--delete:hover {
          background: #DC2626 !important;
          border-color: #EF4444 !important;
        }
      `}</style>
    </motion.div>
  );
});
