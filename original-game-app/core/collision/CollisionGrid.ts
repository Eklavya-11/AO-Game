/**
 * Vision-to-Grid Collision Matrix Generator (32x32 Grid)
 * Provides relaxed, open pathways for fluid player movement.
 * Only blocks upper roof facades and central pit hazards while preserving open streets.
 */

export function generate32x32CollisionGrid(isInterior: boolean, sceneType?: string): number[][] {
  const grid: number[][] = Array.from({ length: 32 }, () => Array(32).fill(0));

  if (!isInterior) {
    // 🌐 OVERWORLD MAP: Open street pathways with minimal facade blocking
    // Block upper roof facade (rows 0..5) except wide 4-cell doorways leading into the 3 house doors
    for (let r = 0; r <= 5; r++) {
      for (let c = 0; c < 32; c++) {
        // Doorway 1 (Forge): cols 8..12
        // Doorway 2 (Elder): cols 14..18
        // Doorway 3 (Outpost): cols 22..26
        if ((c >= 8 && c <= 12) || (c >= 14 && c <= 18) || (c >= 22 && c <= 26)) {
          grid[r][c] = 0; // Open doorway
        } else {
          grid[r][c] = 1; // Upper facade wall
        }
      }
    }

    // Small central stepwell pit hazard (rows 16..18, cols 14..18)
    for (let r = 16; r <= 18; r++) {
      for (let c = 14; c <= 18; c++) {
        grid[r][c] = 1;
      }
    }
  } else {
    // 🏠 INTERIOR ROOMS: Block outer perimeter walls, leave open interior floor
    for (let i = 0; i < 32; i++) {
      grid[0][i] = 1; // Top wall
      grid[31][i] = 1; // Bottom wall
      grid[i][0] = 1; // Left wall
      grid[i][31] = 1; // Right wall
    }

    // Wide exit doorway at bottom center (cols 12..19, row 31)
    for (let c = 12; c <= 19; c++) {
      grid[31][c] = 0;
    }
  }

  return grid;
}

/**
 * Validates if a normalized position (0..100%, 0..100%) is walkable on a 32x32 collision grid
 */
export function isPositionWalkable(grid: number[][] | undefined, posX: number, posY: number): boolean {
  if (!grid || grid.length !== 32) return true;

  const gridX = Math.max(0, Math.min(31, Math.floor((posX / 100) * 32)));
  const gridY = Math.max(0, Math.min(31, Math.floor((posY / 100) * 32)));

  return grid[gridY]?.[gridX] !== 1;
}
