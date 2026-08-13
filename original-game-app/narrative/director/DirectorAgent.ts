import { useGameStore } from "../../lib/store/useGameStore";

/**
 * World Director Agent Watcher: Triggers dynamic ambient events if player stalls
 */
export function startDirectorAgentWatcher(): () => void {
  let stallTimer: ReturnType<typeof setTimeout> | null = null;

  const resetTimer = () => {
    if (stallTimer) clearTimeout(stallTimer);
    stallTimer = setTimeout(() => {
      const store = useGameStore.getState();
      if (store.fsmState === "EXPLORING") {
        store.updateAgentTelemetry("World Director", {
          status: "generating",
          lastAction: "Ambient Event: Distant footsteps echo...",
          latencyMs: 150,
        });
        store.showToast("⚡ World Director: Distant footsteps echo through the rain...", 3000);
      }
    }, 25000);
  };

  const unsubscribe = useGameStore.subscribe((state, prevState) => {
    if (state.playerPos.x !== prevState.playerPos.x || state.playerPos.y !== prevState.playerPos.y) {
      resetTimer();
    }
  });

  resetTimer();

  return () => {
    if (stallTimer) clearTimeout(stallTimer);
    unsubscribe();
  };
}
