import { EngineSceneData, HotspotDef } from "../store/useGameStore";
import { generate32x32CollisionGrid } from "../world-engine";

export type FallbackWorldData = {
  title: string;
  premise: string;
  overworld: EngineSceneData;
  interiors: Record<string, EngineSceneData>;
};

/** Pre-generated high-quality visual fallback scenes for key test prompts */
export const FALLBACK_MAPS_REGISTRY: Record<string, FallbackWorldData> = {
  mumbai_market: {
    title: "Night Market in Mumbai",
    premise: "a rain-flooded night market in Mumbai, carrying a secret tiffin box",
    overworld: {
      id: "street_overworld",
      kind: "street",
      title: "Night Market in Mumbai",
      ambient: "Rain drips onto the wet asphalt near the Chai Tapri as glowing neon reflections flicker in puddles.",
      imageUrl: "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?q=80&w=1000&auto=format&fit=crop",
      visualLandmarks: ["rain-slicked street", "neon tea stall sign", "puddle reflection", "iron chest", "spice sacks"],
      hotspots: [
        {
          id: "door_1",
          kind: "building",
          name: "Old Tea Shop",
          hint: "Press E to enter Chai Tapri",
          rect: { x: 22, y: 25, w: 10, h: 12 },
          interiorPrompt: "Cozy old tea shop inside with brass kettle",
          clueIndex: 0,
        },
        {
          id: "door_2",
          kind: "building",
          name: "Spice Merchant",
          hint: "Press E to enter Spice Stall",
          rect: { x: 50, y: 25, w: 10, h: 12 },
          interiorPrompt: "A colorful spice warehouse filled with sacks",
          clueIndex: 1,
        },
        {
          id: "door_3",
          kind: "building",
          name: "Antique Trader",
          hint: "Press E to enter Antique Shop",
          rect: { x: 78, y: 25, w: 10, h: 12 },
          interiorPrompt: "Dimly lit antique shop with dusty clocks",
          clueIndex: 2,
        },
      ],
      collisionGrid: generate32x32CollisionGrid(false),
    },
    interiors: {
      interior_door_1: {
        id: "interior_door_1",
        kind: "interior",
        title: "Old Tea Shop",
        ambient: "You enter Old Tea Shop. In the corner, you notice an antique wooden counter and brass kettle.",
        imageUrl: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=1000&auto=format&fit=crop",
        visualLandmarks: ["antique wooden counter", "brass kettle", "dusty wall clock", "hanging lantern"],
        hotspots: [
          {
            id: "npc_0",
            kind: "npc",
            name: "Merchant 1",
            hint: "Press E to speak with Old Tea Shop owner",
            rect: { x: 50, y: 40, w: 10, h: 12 },
            clueIndex: 0,
          },
          {
            id: "exit_door",
            kind: "exit",
            name: "Exit Door",
            hint: "Press E to return to street",
            rect: { x: 50, y: 85, w: 12, h: 10 },
          },
        ],
        collisionGrid: generate32x32CollisionGrid(true),
        npc: {
          name: "Keeper of Old Tea Shop",
          role: "Shop Owner",
          persona: "Cautious but observant local resident",
          opening: "Welcome traveler. Mind the brass kettle near the front! Looking for something special in Old Tea Shop?",
          voice: "kavya",
          clueIndex: 0,
        },
        parentId: "street_overworld",
      },
      interior_door_2: {
        id: "interior_door_2",
        kind: "interior",
        title: "Spice Merchant",
        ambient: "You enter Spice Merchant. Sacks of red chili and turmeric line the wooden shelves.",
        imageUrl: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?q=80&w=1000&auto=format&fit=crop",
        visualLandmarks: ["spice sacks", "brass scales", "wooden shelves", "oil lamp"],
        hotspots: [
          {
            id: "npc_1",
            kind: "npc",
            name: "Merchant 2",
            hint: "Press E to speak with Spice Merchant owner",
            rect: { x: 50, y: 40, w: 10, h: 12 },
            clueIndex: 1,
          },
          {
            id: "exit_door",
            kind: "exit",
            name: "Exit Door",
            hint: "Press E to return to street",
            rect: { x: 50, y: 85, w: 12, h: 10 },
          },
        ],
        collisionGrid: generate32x32CollisionGrid(true),
        npc: {
          name: "Keeper of Spice Merchant",
          role: "Spice Trader",
          persona: "Sharp trader who knows every secret along the harbor",
          opening: "Greetings friend! Looking to trade or hunting for missing harbor ledgers?",
          voice: "rahul",
          clueIndex: 1,
        },
        parentId: "street_overworld",
      },
      interior_door_3: {
        id: "interior_door_3",
        kind: "interior",
        title: "Antique Trader",
        ambient: "You enter Antique Trader. Ticking grandfather clocks fill the quiet dimly lit room.",
        imageUrl: "https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?q=80&w=1000&auto=format&fit=crop",
        visualLandmarks: ["grandfather clock", "iron chest", "magnifying glass", "dusty books"],
        hotspots: [
          {
            id: "npc_2",
            kind: "npc",
            name: "Merchant 3",
            hint: "Press E to speak with Antique Trader owner",
            rect: { x: 50, y: 40, w: 10, h: 12 },
            clueIndex: 2,
          },
          {
            id: "exit_door",
            kind: "exit",
            name: "Exit Door",
            hint: "Press E to return to street",
            rect: { x: 50, y: 85, w: 12, h: 10 },
          },
        ],
        collisionGrid: generate32x32CollisionGrid(true),
        npc: {
          name: "Keeper of Antique Trader",
          role: "Clockmaker & Archivist",
          persona: "Soft-spoken old man holding keys to lost harbor chests",
          opening: "Shh... listen closely to the clocks. What brings you to my antique shop tonight?",
          voice: "kavya",
          clueIndex: 2,
        },
        parentId: "street_overworld",
      },
    },
  },
};

/**
 * Finds a matching fallback world dataset if user prompt matches or relates to known test prompts
 */
export function getFallbackWorldData(prompt: string): FallbackWorldData {
  const p = prompt.toLowerCase();
  if (p.includes("mumbai") || p.includes("market") || p.includes("tiffin") || p.includes("rain")) {
    return FALLBACK_MAPS_REGISTRY.mumbai_market;
  }
  return FALLBACK_MAPS_REGISTRY.mumbai_market; // Default robust fallback
}
