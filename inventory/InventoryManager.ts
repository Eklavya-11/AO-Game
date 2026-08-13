import { useGameStore } from "../lib/store/useGameStore";
import { InventoryItem } from "../store/slices/sceneSlice";

export function addClueItemToInventory(itemName: string, significance?: string) {
  const item: InventoryItem = {
    id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    name: itemName,
    significance: significance || "Discovered during investigation",
    acquiredAt: Date.now(),
  };
  useGameStore.getState().addItemToInventory(item);
}
