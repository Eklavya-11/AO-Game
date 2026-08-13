import { StateCreator } from "zustand";

export type InventoryItem = {
  id: string;
  name: string;
  significance?: string;
  acquiredAt: number;
};

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

export type EngineSceneData = {
  id: string;
  kind: "street" | "interior";
  title: string;
  ambient: string;
  imageUrl: string;
  visualLandmarks?: string[];
  hotspots: HotspotDef[];
  collisionGrid: number[][];
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

export interface SceneSlice {
  currentSceneId: string | null;
  visitedScenes: string[];
  worldTitle: string;
  worldPremise: string;
  acquiredClues: Record<string, boolean>;
  inventory: InventoryItem[];
  scenes: Record<string, EngineSceneData>;
  sceneAccessOrder: string[];

  setWorldMeta: (title: string, premise: string) => void;
  setCurrentSceneId: (sceneId: string) => void;
  markClueAcquired: (clueId: string) => void;
  addItemToInventory: (item: InventoryItem) => void;
  putScene: (scene: EngineSceneData) => void;
  getScene: (sceneId: string) => EngineSceneData | undefined;
}

const MAX_SCENE_CACHE_SIZE = 10;

export const createSceneSlice: StateCreator<SceneSlice> = (set, get) => ({
  currentSceneId: null,
  visitedScenes: [],
  worldTitle: "",
  worldPremise: "",
  acquiredClues: {},
  inventory: [],
  scenes: {},
  sceneAccessOrder: [],

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

  markClueAcquired: (clueId: string) =>
    set((state) => ({
      acquiredClues: { ...state.acquiredClues, [clueId]: true },
    })),

  addItemToInventory: (item: InventoryItem) =>
    set((state) => ({
      inventory: [...state.inventory.filter((i) => i.id !== item.id), item],
    })),

  putScene: (scene: EngineSceneData) => {
    const state = get();
    const currentScenes = { ...state.scenes };
    let newAccessOrder = state.sceneAccessOrder.filter((id) => id !== scene.id);
    newAccessOrder.push(scene.id);

    currentScenes[scene.id] = scene;

    if (newAccessOrder.length > MAX_SCENE_CACHE_SIZE) {
      const evictedId = newAccessOrder.shift();
      if (evictedId && currentScenes[evictedId]) {
        const evictedScene = currentScenes[evictedId];
        if (evictedScene.imageUrl.startsWith("blob:")) {
          try {
            URL.revokeObjectURL(evictedScene.imageUrl);
          } catch {}
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
});
