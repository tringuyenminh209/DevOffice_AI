import { create } from 'zustand';
import { api } from '../lib/api';
import { supabase } from '../lib/supabase';
import type { Company } from '../lib/types';

interface WorldState {
  companies: Company[];
  loading: boolean;
  error: string | null;
  load: () => Promise<void>;
  subscribe: () => () => void; // returns unsubscribe
}

export const useWorldStore = create<WorldState>((set, get) => ({
  companies: [],
  loading: false,
  error: null,

  load: async () => {
    set({ loading: true, error: null });
    try {
      const w = await api.getWorld();
      set({ companies: w.companies ?? [], loading: false });
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
    }
  },

  subscribe: () => {
    const channel = supabase
      .channel('world')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'companies' },
        (payload) => {
          const updated = payload.new as Company;
          set({
            companies: get().companies.map((c) => (c.id === updated.id ? { ...c, ...updated } : c)),
          });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  },
}));
