import { StateCreator } from "zustand";

export type EngineFSMState =
  | "IDLE"
  | "CREATING_WORLD"
  | "EXPLORING"
  | "DIALOGUE_ACTIVE"
  | "PREFETCHING"
  | "EVENT_TRIGGERED"
  | "FINALE_UNRAVELED"
  | "DEFEAT_CAPTURED";

export interface FSMSlice {
  fsmState: EngineFSMState;
  setFSMState: (state: EngineFSMState) => void;
}

export const createFSMSlice: StateCreator<FSMSlice> = (set) => ({
  fsmState: "IDLE",
  setFSMState: (state: EngineFSMState) => set({ fsmState: state }),
});
