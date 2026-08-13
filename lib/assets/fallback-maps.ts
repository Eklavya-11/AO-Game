import { EngineSceneData } from "../store/useGameStore";
import { generate32x32CollisionGrid } from "../world-engine";

export type FallbackWorldData = {
  title: string;
  premise: string;
  overworld: EngineSceneData;
  interiors: Record<string, EngineSceneData>;
};

export const FALLBACK_MAPS_REGISTRY: Record<string, FallbackWorldData> = {
  champaner_lagaan: {
    title: "Champaner 1893: The Wager Scroll",
    premise: "A sun-scorched 1893 Champaner village during the drought, where I must deliver a hidden wager scroll to Bhuvan before the British captain arrives.",
    overworld: {
      id: "street_overworld",
      kind: "street",
      title: "Champaner Village Square (1893)",
      ambient: "Hot drought wind sweeps across dry acacia trees and cracked earth as British patrols guard the central stepwell.",
      imageUrl: "/fallback/champaner_overworld.png",
      visualLandmarks: ["cracked sun-baked earth", "stone stepwell", "bullock hay cart", "acacia trees", "british patrol post"],
      hotspots: [
        {
          id: "door_1",
          kind: "building",
          name: "Blacksmith Forge",
          hint: "Press E to enter Village Forge",
          rect: { x: 31, y: 41, w: 8, h: 8 },
          interiorPrompt: "Indian village blacksmith forge in 1893 with glowing anvil",
          clueIndex: 0,
        },
        {
          id: "door_2",
          kind: "building",
          name: "British Cantonment HQ",
          hint: "Press E to enter Officers Office",
          rect: { x: 73, y: 32, w: 8, h: 8 },
          interiorPrompt: "Colonial British officers office with teakwood desk and safe",
          clueIndex: 1,
        },
        {
          id: "door_3",
          kind: "building",
          name: "Ancient Stepwell",
          hint: "Press E to inspect Central Stepwell",
          rect: { x: 49, y: 38, w: 8, h: 8 },
          interiorPrompt: "Deep stone stepwell with hidden brass cylinder",
          clueIndex: 2,
        },
      ],
      collisionGrid: generate32x32CollisionGrid(false),
    },
    interiors: {
      interior_door_1: {
        id: "interior_door_1",
        kind: "interior",
        title: "Blacksmith Forge",
        ambient: "Sparks rise from the glowing hearth as Lakha shapes iron for Bhuvan's team.",
        imageUrl: "/fallback/champaner_forge.png",
        visualLandmarks: ["glowing brick furnace", "iron anvil", "workbench with tools", "water trough"],
        hotspots: [
          {
            id: "npc_0",
            kind: "npc",
            name: "Lakha the Forge Keeper",
            hint: "Press E to speak with Lakha",
            rect: { x: 62, y: 55, w: 10, h: 12 },
            clueIndex: 0,
          },
          {
            id: "exit_door",
            kind: "exit",
            name: "Exit Door",
            hint: "Press E to return to village square",
            rect: { x: 12, y: 65, w: 12, h: 15 },
          },
        ],
        collisionGrid: generate32x32CollisionGrid(true, "interior_door_1"),
        npc: {
          name: "Lakha the Forge Keeper",
          role: "Village Blacksmith",
          persona: "Stoic craftsman devoted to the village cause",
          opening: "Greetings traveler! The iron key fragment to the wager chest is hidden beneath my heavy anvil. Speak softly!",
          voice: "rahul",
          clueIndex: 0,
        },
        parentId: "street_overworld",
      },
      interior_door_2: {
        id: "interior_door_2",
        kind: "interior",
        title: "British Cantonment HQ",
        ambient: "The ticking grandfather clock echoes against stone walls decorated with Union Jack banners.",
        imageUrl: "/fallback/champaner_cantonment.png",
        visualLandmarks: ["teakwood desk", "brass oil lamp", "iron safe", "union jack flag"],
        hotspots: [
          {
            id: "npc_1",
            kind: "npc",
            name: "Quartermaster Officer",
            hint: "Press E to speak with British Officer",
            rect: { x: 48, y: 45, w: 10, h: 12 },
            clueIndex: 1,
          },
          {
            id: "exit_door",
            kind: "exit",
            name: "Exit Door",
            hint: "Press E to return to village square",
            rect: { x: 75, y: 78, w: 12, h: 12 },
          },
        ],
        collisionGrid: generate32x32CollisionGrid(true, "interior_door_2"),
        npc: {
          name: "Quartermaster Officer",
          role: "British Revenue Collector",
          persona: "Strict bureaucrat overseeing Champaner tax records",
          opening: "State your business! Official tax ledgers and wager agreements are sealed inside the teakwood safe.",
          voice: "kavya",
          clueIndex: 1,
        },
        parentId: "street_overworld",
      },
      interior_door_3: {
        id: "interior_door_3",
        kind: "interior",
        title: "Ancient Stepwell",
        ambient: "Cool subterranean air rises from the stone stairs of the dried stepwell.",
        imageUrl: "/fallback/champaner_forge.png",
        visualLandmarks: ["stone steps", "brass cylinder", "carved pillars", "oil lamp"],
        hotspots: [
          {
            id: "npc_2",
            kind: "npc",
            name: "Kachra the Elder",
            hint: "Press E to speak with Kachra",
            rect: { x: 62, y: 55, w: 10, h: 12 },
            clueIndex: 2,
          },
          {
            id: "exit_door",
            kind: "exit",
            name: "Exit Door",
            hint: "Press E to return to village square",
            rect: { x: 12, y: 65, w: 12, h: 15 },
          },
        ],
        collisionGrid: generate32x32CollisionGrid(true, "interior_door_1"),
        npc: {
          name: "Kachra the Elder",
          role: "Village Elder & Scout",
          persona: "Wise elder guarding the final piece of the wager scroll",
          opening: "You found me! The final wager scroll piece is inside this brass cylinder. Deliver it to Bhuvan at once!",
          voice: "rahul",
          clueIndex: 2,
        },
        parentId: "street_overworld",
      },
    },
  },
};

export function getFallbackWorldData(prompt: string): FallbackWorldData {
  return FALLBACK_MAPS_REGISTRY.champaner_lagaan;
}
