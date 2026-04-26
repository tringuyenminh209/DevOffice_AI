import { create } from 'zustand';
import { api } from '../lib/api';
import { supabase } from '../lib/supabase';
import type { Task, TaskEvent } from '../lib/types';

interface TaskState {
  current: Task | null;
  events: TaskEvent[];
  loading: boolean;
  error: string | null;

  loadTask: (taskId: string) => Promise<void>;
  subscribeEvents: (taskId: string) => () => void;
  reset: () => void;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  current: null,
  events: [],
  loading: false,
  error: null,

  loadTask: async (taskId) => {
    set({ loading: true, error: null });
    try {
      const [task, events] = await Promise.all([
        api.getTask(taskId),
        api.getTaskEvents(taskId, 200),
      ]);
      set({ current: task, events, loading: false });
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
    }
  },

  subscribeEvents: (taskId) => {
    const channel = supabase
      .channel(`task:${taskId}`)
      // New events INSERTED into task_events
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'task_events',
          filter: `task_id=eq.${taskId}`,
        },
        (payload) => {
          const ev = payload.new as TaskEvent;
          set({ events: [...get().events, ev] });

          // task.completed / task.failed → reload task to pick up status
          if (ev.eventType === 'task.completed' || ev.eventType === 'task.failed') {
            get().loadTask(taskId).catch(() => {});
          }
        },
      )
      // Tasks status update
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tasks',
          filter: `id=eq.${taskId}`,
        },
        (payload) => {
          const updated = payload.new as Task;
          if (get().current) {
            set({ current: { ...get().current!, ...updated } });
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  reset: () => set({ current: null, events: [], error: null }),
}));
