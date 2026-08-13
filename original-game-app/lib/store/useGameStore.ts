import { create } from "zustand";
import { devtools } from "zustand/middleware";

/** Engine Finite State Machine States */
export type EngineFSMState =
  | "IDLE"
  | "CREATING_WORLD"
  | "EXPLORING"
  | "DIALOGUE_ACTIVE"
  | "PREFETCHING"
  | "EVENT_TRIGGERED"
  | "FINALE_UNRAVELED";

/** Inventory item definition */
export type InventoryItem = {
  id: string;
  name: string;
  significance?: string;
  acquiredAt: number;
};

/** Hotspot bounding box and attributes */
export type HotspotDef = {
  id: string;
  kind: "building" | "npc" | "exit" | "item" | "action";
  name: string;
  hint: string;
  rect: { x: number; y: number; w: number; h: number };
  interiorPrompt?: string;
  clueIndex?: number;
  itemName?: string;
  outcome?: string;
};

/** Scene Data structure cached in memory */
export type EngineSceneData = {
  id: string;
  kind: "street" | "interior";
  title: string;
  ambient: string;
  imageUrl: string;
  visualLandmarks?: string[]; // Detected pixel landmarks from Gemini 3.5 Flash Vision pass
  hotspots: HotspotDef[];
  collisionGrid: number[][]; // 32x32 binary grid: 0 = open, 1 = obstacle
  npc?: {
    name: string;
    role: string;
    persona: string;
    opening: string;
    voice?: string;
    clueIndex?: number;
  };
  parentId?: string;
};

/** Agent Telemetry Data */
export type AgentTelemetry = {
  name: string;
  status: "idle" | "thinking" | "generating" | "completed" | "error";
  lastAction: string;
  latencyMs: number;
};

/** Game Store Interface */
export interface GameEngineStore {
  // FSM Engine State
  fsmState: EngineFSMState;
  setFSMState: (state: EngineFSMState) => void;

  // Active Scene & World Meta
  currentSceneId: string | null;
  visitedScenes: string[];
  worldTitle: string;
  worldPremise: string;
  setWorldMeta: (title: string, premise: string) => void;
  setCurrentSceneId: (sceneId: string) => void;

  // Clues & Inventory
  acquiredClues: Record<string, boolean>; // key: npcId or clueIndex
  markClueAcquired: (clueId: string) => void;
  inventory: InventoryItem[];
  addItemToInventory: (item: InventoryItem) => void;

  // Scene & Asset Cache (with LRU max 10)
  scenes: Record<string, EngineSceneData>;
  sceneAccessOrder: string[]; // Order of scene IDs for LRU eviction
  putScene: (scene: EngineSceneData) => void;
  getScene: (sceneId: string) => EngineSceneData | undefined;

  // Imperative Player State (Canvas Bridge)
  playerPos: { x: number; y: number; dir: "up" | "down" | "left" | "right" };
  updatePlayerPosImperative: (x: number, y: number, dir?: "up" | "down" | "left" | "right") => void;

  // Live Telemetry & Cost Tracking
  agents: Record<string, AgentTelemetry>;
  updateAgentTelemetry: (agentName: string, telemetry: Partial<AgentTelemetry>) => void;
  prefetchProgress: { completed: number; total: number };
  setPrefetchProgress: (completed: number, total: number) => void;
  totalApiCalls: number;
  totalEstimatedCostINR: number;
  incrementApiCalls: (costINRDelta?: number) => void;

  // Toast Notification System
  toastMessage: string | null;
  showToast: (message: string, durationMs?: number) => void;

  // Reset Engine State
  resetEngine: () => void;
}

const MAX_SCENE_CACHE_SIZE = 10;
let toastTimer: ReturnType<typeof setTimeout> | null = null;

export const useGameStore = create<GameEngineStore>((set, get) => ({
  // Initial FSM State
  fsmState: "IDLE",
  setFSMState: (state: EngineFSMState) => set({ fsmState: state }),

    // World & Scene Meta
    currentSceneId: null,
    visitedScenes: [],
    worldTitle: "",
    worldPremise: "",
    setWorldMeta: (title: string, premise: string) => set({ worldTitle: title, worldPremise: premise }),
    setCurrentSceneId: (sceneId: string) =>
      set((state) => ({
        currentSceneId: sceneId,
        visitedScenes: state.visitedScenes.includes(sceneId)
          ? state.visitedScenes
          : [...state.visitedScenes, sceneId],
        sceneAccessOrder: [
          ...state.sceneAccessOrder.filter((id) => id !== sceneId),
          sceneId,
        ],
      })),

    // Clues & Inventory
    acquiredClues: {},
    markClueAcquired: (clueId: string) =>
      set((state) => ({
        acquiredClues: { ...state.acquiredClues, [clueId]: true },
      })),
    inventory: [],
    addItemToInventory: (item: InventoryItem) =>
      set((state) => ({
        inventory: [...state.inventory.filter((i) => i.id !== item.id), item],
      })),

    // LRU Scene Cache Management
    scenes: {},
    sceneAccessOrder: [],

    putScene: (scene: EngineSceneData) => {
      const state = get();
      const currentScenes = { ...state.scenes };
      let newAccessOrder = state.sceneAccessOrder.filter((id) => id !== scene.id);
      newAccessOrder.push(scene.id);

      // Store scene
      currentScenes[scene.id] = scene;

      // LRU Eviction check if cache size exceeds limit
      if (newAccessOrder.length > MAX_SCENE_CACHE_SIZE) {
        const evictedId = newAccessOrder.shift();
        if (evictedId && currentScenes[evictedId]) {
          const evictedScene = currentScenes[evictedId];
          // Revoke Blob URLs if applicable to avoid memory leaks
          if (evictedScene.imageUrl.startsWith("blob:")) {
            try {
              URL.revokeObjectURL(evictedScene.imageUrl);
            } catch (e) {
              console.warn(`[LRU Engine] Failed to revoke blob URL for ${evictedId}:`, e);
            }
          }
          delete currentScenes[evictedId];
        }
      }

      set({
        scenes: currentScenes,
        sceneAccessOrder: newAccessOrder,
      });
    },

    getScene: (sceneId: string) => {
      const state = get();
      return state.scenes[sceneId];
    },

    // Imperative Canvas Bridge update (does not trigger unnecessary React structural renders)
    playerPos: { x: 50, y: 50, dir: "down" },
    updatePlayerPosImperative: (x: number, y: number, dir?: "up" | "down" | "left" | "right") => {
      const currentPos = get().playerPos;
      set({
        playerPos: {
          x,
          y,
          dir: dir || currentPos.dir,
        },
      });
    },

    // Telemetry and Cost Metrics
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
        totalEstimatedCostINR: state.totalEstimatedCostINR + costINRDelta,
      })),

    // Toast Notification System
    toastMessage: null,
    showToast: (message: string, durationMs = 3000) => {
      if (toastTimer) clearTimeout(toastTimer);
      set({ toastMessage: message });
      toastTimer = setTimeout(() => {
        set({ toastMessage: null });
      }, durationMs);
    },

    // Full Engine Reset
    resetEngine: () => {
      // Revoke all cached blob URLs before resetting
      const scenes = get().scenes;
      Object.values(scenes).forEach((scene) => {
        if (scene.imageUrl?.startsWith("blob:")) {
          try {
            URL.revokeObjectURL(scene.imageUrl);
          } catch {}
        }
      });

      set({
        fsmState: "IDLE",
        currentSceneId: null,
        worldTitle: "",
        worldPremise: "",
        acquiredClues: {},
        inventory: [],
        scenes: {},
        sceneAccessOrder: [],
        playerPos: { x: 50, y: 50, dir: "down" },
        prefetchProgress: { completed: 0, total: 3 },
        totalApiCalls: 0,
        totalEstimatedCostINR: 0.0,
      });
    },
}));
