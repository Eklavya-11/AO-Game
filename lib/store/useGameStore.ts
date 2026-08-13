import { create } from "zustand";
import { FSMSlice, createFSMSlice, EngineFSMState } from "../../store/slices/fsmSlice";
import { PlayerSlice, createPlayerSlice, PlayerPosition, PlayerDirection } from "../../store/slices/playerSlice";
import { SceneSlice, createSceneSlice, EngineSceneData, HotspotDef, InventoryItem } from "../../store/slices/sceneSlice";
import { TelemetrySlice, createTelemetrySlice, AgentTelemetry } from "../../store/slices/telemetrySlice";
import { ToastSlice, createToastSlice } from "../../store/slices/toastSlice";
import { I18nSlice, createI18nSlice, SupportedLanguage } from "../../store/slices/i18nSlice";

export type {
  EngineFSMState,
  PlayerPosition,
  PlayerDirection,
  EngineSceneData,
  HotspotDef,
  InventoryItem,
  AgentTelemetry,
  SupportedLanguage,
};

export type GameEngineStore = FSMSlice & PlayerSlice & SceneSlice & TelemetrySlice & ToastSlice & I18nSlice & {
  resetEngine: () => void;
};

export const useGameStore = create<GameEngineStore>((set, get, store) => ({
  ...createFSMSlice(set, get, store),
  ...createPlayerSlice(set, get, store),
  ...createSceneSlice(set, get, store),
  ...createTelemetrySlice(set, get, store),
  ...createToastSlice(set, get, store),
  ...createI18nSlice(set, get, store),

  resetEngine: () => {
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
      visitedScenes: [],
      worldTitle: "",
      worldPremise: "",
      acquiredClues: {},
      inventory: [],
      scenes: {},
      sceneAccessOrder: [],
      playerPos: { x: 50, y: 50, dir: "down" },
      totalApiCalls: 0,
      totalEstimatedCostINR: 0.0,
      prefetchProgress: { completed: 0, total: 3 },
      toastMessage: null,
    });
  },
}));
