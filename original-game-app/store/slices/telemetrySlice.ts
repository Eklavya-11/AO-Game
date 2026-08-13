import { StateCreator } from "zustand";

export type AgentTelemetry = {
  name: string;
  status: "idle" | "thinking" | "generating" | "completed" | "error";
  lastAction: string;
  latencyMs: number;
};

export interface TelemetrySlice {
  agents: Record<string, AgentTelemetry>;
  updateAgentTelemetry: (agentName: string, telemetry: Partial<AgentTelemetry>) => void;
  prefetchProgress: { completed: number; total: number };
  setPrefetchProgress: (completed: number, total: number) => void;
  totalApiCalls: number;
  totalEstimatedCostINR: number;
  incrementApiCalls: (costINRDelta?: number) => void;
}

export const createTelemetrySlice: StateCreator<TelemetrySlice> = (set) => ({
  agents: {
    "World Director": { name: "World Director", status: "idle", lastAction: "Standby", latencyMs: 0 },
    "Vision Agent": { name: "Vision Agent", status: "idle", lastAction: "Standby", latencyMs: 0 },
    "Dialogue Agent": { name: "Dialogue Agent", status: "idle", lastAction: "Standby", latencyMs: 0 },
    "Audio Engine": { name: "Audio Engine", status: "idle", lastAction: "Standby", latencyMs: 0 },
  },
  updateAgentTelemetry: (agentName: string, telemetry: Partial<AgentTelemetry>) =>
    set((state) => ({
      agents: {
        ...state.agents,
        [agentName]: {
          ...state.agents[agentName],
          ...telemetry,
        },
      },
    })),

  prefetchProgress: { completed: 0, total: 3 },
  setPrefetchProgress: (completed: number, total: number) => set({ prefetchProgress: { completed, total } }),

  totalApiCalls: 0,
  totalEstimatedCostINR: 0.0,
  incrementApiCalls: (costINRDelta = 0.05) =>
    set((state) => ({
      totalApiCalls: state.totalApiCalls + 1,
      totalEstimatedCostINR: Number((state.totalEstimatedCostINR + costINRDelta).toFixed(2)),
    })),
});
