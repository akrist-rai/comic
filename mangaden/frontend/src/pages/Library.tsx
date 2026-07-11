import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Task } from '../types';
import { TaskCard } from '../components/TaskCard';
import { FilterBar, type FilterStatus } from '../components/FilterBar';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { AddTaskModal } from '../components/AddTaskModal';
import { EditTaskModal } from '../components/EditTaskModal';
import { useTaskState, useTaskDispatch } from '../context/TaskContext';
import { useTasks } from '../hooks/useTasks';

const gridVariants = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.05, delayChildren: 0.02 } },
};

export default function Library() {
  const [activeStatus, setActiveStatus] = useState<FilterStatus>('all');
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const { items, loading, error } = useTaskState();
  const dispatch = useTaskDispatch();

  useEffect(() => {
    const controller = new AbortController();
    dispatch({ type: 'SET_LOADING', payload: true });

    fetch('/api/tasks', { signal: controller.signal })
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch tasks');
        return res.json() as Promise<Task[]>;
      })
      .then(data => dispatch({ type: 'SET_LIST', payload: data }))
      .catch(err => {
        if (err.name !== 'AbortError') {
          dispatch({ type: 'SET_ERROR', payload: 'Could not load tasks. Is the backend running?' });
        }
      });

    return () => controller.abort();
  }, [dispatch]);

  const { tasks: filteredTasks } = useTasks({ 
    status: activeStatus, 
    search 
  });

  const handleSearchChange = useCallback((q: string) => setSearch(q), []);
  const handleStatusChange = useCallback((s: FilterStatus) => setActiveStatus(s), []);
  const handleOpenAddModal = useCallback(() => setShowAddModal(true), []);
  const handleCloseAddModal = useCallback(() => setShowAddModal(false), []);
  const handleEditClick = useCallback((task: Task) => setEditingTask(task), []);
  const handleCloseEditModal = useCallback(() => setEditingTask(null), []);

  return (
    <main className="library" style={{ paddingBottom: '3rem' }}>
      <header className="library__header">
        <h1 className="library__title">Taskden</h1>
        <button type="button" className="btn btn--primary btn--sm" onClick={handleOpenAddModal}>
          + Create Task
        </button>
      </header>

      <FilterBar
        activeStatus={activeStatus}
        search={search}
        total={items.length}
        filtered={filteredTasks.length}
        onStatusChange={handleStatusChange}
        onSearchChange={handleSearchChange}
      />

      {loading ? (
        <LoadingSkeleton />
      ) : error ? (
        <div className="error-banner">{error}</div>
      ) : filteredTasks.length === 0 ? (
        <div className="empty-state">
          <p>No tasks found.</p>
          {search && (
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => setSearch('')}>
              Clear search
            </button>
          )}
        </div>
      ) : (
        <motion.div
          key={activeStatus + search}
          className="manga-grid"
          variants={gridVariants}
          initial="hidden"
          animate="visible"
        >
          {filteredTasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onEditClick={handleEditClick}
            />
          ))}
        </motion.div>
      )}

      {/* Add Task Modal */}
      <AnimatePresence mode="wait">
        {showAddModal && <AddTaskModal onClose={handleCloseAddModal} />}
      </AnimatePresence>

      {/* Edit Task Modal */}
      <AnimatePresence mode="wait">
        {editingTask && (
          <EditTaskModal 
            task={editingTask} 
            onClose={handleCloseEditModal} 
          />
        )}
      </AnimatePresence>
    </main>
  );
}
