import { create } from 'zustand';

interface FocusedDirectoryState {
  path: string | null;
  setPath: (path: string | null) => void;
  clear: () => void;
}

export const useFocusedDirectoryStore = create<FocusedDirectoryState>((set: (partial: Partial<FocusedDirectoryState> | ((state: FocusedDirectoryState) => Partial<FocusedDirectoryState>)) => void) => ({
    path: null,
    setPath: (path: string | null) => set(() => ({ path })),
    clear: () => set(() => ({ path: null })),
}));

export default useFocusedDirectoryStore;
