import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type JourneyItem = {
  type: 'node' | 'topic';
  name: string;
  namespace: string;
  timestamp: number;
};

interface JourneyState {
  items: JourneyItem[];
  addItem: (item: Omit<JourneyItem, 'timestamp'>) => void;
  clearItems: () => void;
  removeItem: (index: number) => void;
}

export const useJourneyStore = create<JourneyState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (item) => set((state) => ({
        items: [
          ...state.items,
          { ...item, timestamp: Date.now() }
        ].slice(-50) // Keep last 50 items
      })),
      clearItems: () => set({ items: [] }),
      removeItem: (index) => set((state) => ({
        items: state.items.filter((_, i) => i !== index)
      }))
    }),
    {
      name: 'ros-journey-storage'
    }
  )
); 