import create from 'zustand';

interface FocusedPhotoState {
  path: string | null;
  setPath: (p: string | null) => void;
}

const useFocusedPhotoStore = create<FocusedPhotoState>((set) => ({
  path: null,
  setPath: (p: string | null) => set({ path: p }),
}));

export default useFocusedPhotoStore;
