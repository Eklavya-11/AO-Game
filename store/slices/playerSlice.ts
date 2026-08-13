import { StateCreator } from "zustand";

export type PlayerDirection = "up" | "down" | "left" | "right";

export interface PlayerPosition {
  x: number;
  y: number;
  dir: PlayerDirection;
}

export interface PlayerSlice {
  playerPos: PlayerPosition;
  updatePlayerPosImperative: (x: number, y: number, dir?: PlayerDirection) => void;
}

export const createPlayerSlice: StateCreator<PlayerSlice> = (set, get) => ({
  playerPos: { x: 50, y: 50, dir: "down" },
  updatePlayerPosImperative: (x: number, y: number, dir?: PlayerDirection) => {
    const currentPos = get().playerPos;
    set({
      playerPos: {
        x,
        y,
        dir: dir || currentPos.dir,
      },
    });
  },
});
