import { createContext, useContext, useReducer, type ReactNode } from 'react';
import type { Task } from '../types';

interface TaskState {
  items:   Task[];
  loading: boolean;
  error:   string | null;
}

type TaskAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR';   payload: string | null }
  | { type: 'SET_LIST';    payload: Task[] }
  | { type: 'ADD';         payload: Task }
  | { type: 'UPDATE';      payload: Task }
  | { type: 'REMOVE';      payload: string }; // payload = task.id

function taskReducer(state: TaskState, action: TaskAction): TaskState {
  switch (action.type) {
    case 'SET_LOADING': return { ...state, loading: action.payload };
    case 'SET_ERROR':   return { ...state, error: action.payload, loading: false };
    case 'SET_LIST':    return { ...state, items: action.payload, loading: false, error: null };
    case 'ADD':         return { ...state, items: [...state.items, action.payload] };
    case 'UPDATE':      return {
      ...state,
      items: state.items.map(t => t.id === action.payload.id ? action.payload : t),
    };
    case 'REMOVE':      return {
      ...state,
      items: state.items.filter(t => t.id !== action.payload),
    };
    default: return state;
  }
}

const initialState: TaskState = { items: [], loading: false, error: null };

const TaskStateContext    = createContext<TaskState | undefined>(undefined);
const TaskDispatchContext = createContext<React.Dispatch<TaskAction> | undefined>(undefined);

export function TaskProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(taskReducer, initialState);

  return (
    <TaskStateContext.Provider value={state}>
      <TaskDispatchContext.Provider value={dispatch}>
        {children}
      </TaskDispatchContext.Provider>
    </TaskStateContext.Provider>
  );
}

export function useTaskState(): TaskState {
  const ctx = useContext(TaskStateContext);
  if (!ctx) throw new Error('useTaskState must be used inside <TaskProvider>');
  return ctx;
}

export function useTaskDispatch(): React.Dispatch<TaskAction> {
  const ctx = useContext(TaskDispatchContext);
  if (!ctx) throw new Error('useTaskDispatch must be used inside <TaskProvider>');
  return ctx;
}
