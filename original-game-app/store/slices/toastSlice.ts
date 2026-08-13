import { StateCreator } from "zustand";

export interface ToastSlice {
  toastMessage: string | null;
  showToast: (message: string, durationMs?: number) => void;
}

let toastTimer: ReturnType<typeof setTimeout> | null = null;

export const createToastSlice: StateCreator<ToastSlice> = (set) => ({
  toastMessage: null,
  showToast: (message: string, durationMs = 3000) => {
    if (toastTimer) clearTimeout(toastTimer);
    set({ toastMessage: message });
    toastTimer = setTimeout(() => {
      set({ toastMessage: null });
    }, durationMs);
  },
});
