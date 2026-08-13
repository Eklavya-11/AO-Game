import { useGameStore } from "../../lib/store/useGameStore";

export interface QuestState {
  acquiredCluesCount: number;
  totalClues: number;
  isComplete: boolean;
}

export function getQuestState(): QuestState {
  const acquiredClues = useGameStore.getState().acquiredClues;
  const count = Object.keys(acquiredClues).length;
  return {
    acquiredCluesCount: count,
    totalClues: 3,
    isComplete: count >= 3,
  };
}

export function recordClueDiscovery(clueId: string) {
  const store = useGameStore.getState();
  store.markClueAcquired(clueId);
  const updatedCount = Object.keys(useGameStore.getState().acquiredClues).length;
  if (updatedCount >= 3) {
    store.setFSMState("FINALE_UNRAVELED");
  }
}
