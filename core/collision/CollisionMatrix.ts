/**
 * Ananta Engine — Vision-to-Grid 32x32 Collision Engine
 * Converts AI vision landmarks and scene structures into a 32x32 binary walkability matrix.
 * 0 = Walkable, 1 = Solid Obstacle.
 */

export type CollisionGrid = number[][]; // 32x32 array

export class CollisionMatrix {
  public static GRID_SIZE = 32;

  /**
   * Generates a base 32x32 collision grid for overworld or interior maps
   */
  public static createBaseGrid(isInterior: boolean): CollisionGrid {
    const grid: CollisionGrid = Array.from({ length: 32 }, () => Array(32).fill(0));

    if (!isInterior) {
      // Overworld Street / Field: Outer boundaries & upper building facade / treeline
      for (let c = 0; c < 32; c++) {
        grid[0][c] = 1; // Top border
        grid[31][c] = 1; // Bottom border
        grid[c][0] = 1; // Left border
        grid[c][31] = 1; // Right border
      }

      // Default upper facade (rows 1..6 blocked except door pathways at cols 6-9, 14-17, 23-26)
      for (let r = 1; r < 7; r++) {
        for (let c = 1; c < 31; c++) {
          if ((c >= 6 && c <= 9) || (c >= 14 && c <= 17) || (c >= 23 && c <= 26)) {
            grid[r][c] = 0;
          } else {
            grid[r][c] = 1;
          }
        }
      }
    } else {
      // Interior Room: Perimeter walls blocked
      for (let i = 0; i < 32; i++) {
        grid[0][i] = 1; // Top wall
        grid[31][i] = 1; // Bottom wall
        grid[i][0] = 1; // Left wall
        grid[i][31] = 1; // Right wall
      }
      // Leave bottom exit doorway open at cols 14-17
      for (let c = 14; c <= 17; c++) {
        grid[31][c] = 0;
      }
    }

    return grid;
  }

  /**
   * Enhances 32x32 collision grid using Gemini 3.5 Flash Vision detected landmarks
   * (e.g. wells, trees, carts, anvils, water troughs, iron chests)
   */
  public static applyVisionLandmarks(grid: CollisionGrid, landmarks: string[], isInterior: boolean): CollisionGrid {
    const updatedGrid = grid.map((row) => [...row]);

    landmarks.forEach((landmark) => {
      const lower = landmark.toLowerCase();

      // Wells / Tubs
      if (lower.includes("well") || lower.includes("trough")) {
        // Mark upper left well block (rows 4..7, cols 4..8)
        for (let r = 4; r <= 7; r++) {
          for (let c = 4; c <= 8; c++) {
            updatedGrid[r][c] = 1;
          }
        }
      }

      // Trees / Foliage
      if (lower.includes("tree") || lower.includes("foliage")) {
        // Mark mid-left treeline (rows 8..14, cols 6..12)
        for (let r = 8; r <= 14; r++) {
          for (let c = 6; c <= 12; c++) {
            updatedGrid[r][c] = 1;
          }
        }
      }

      // Bullock Carts / Wagons
      if (lower.includes("cart") || lower.includes("wagon")) {
        // Mark upper right cart block (rows 5..8, cols 20..25)
        for (let r = 5; r <= 8; r++) {
          for (let c = 20; c <= 25; c++) {
            updatedGrid[r][c] = 1;
          }
        }
      }

      // Blacksmith Anvil / Furnace / Table
      if (isInterior && (lower.includes("anvil") || lower.includes("furnace") || lower.includes("table") || lower.includes("counter"))) {
        // Mark center interior workbench / furnace (rows 12..18, cols 10..22)
        for (let r = 12; r <= 18; r++) {
          for (let c = 10; c <= 22; c++) {
            updatedGrid[r][c] = 1;
          }
        }
      }
    });

    return updatedGrid;
  }

  /**
   * Checks if normalized player position (0..100%, 0..100%) lands in a walkable cell
   */
  public static isWalkable(grid: CollisionGrid | undefined, normX: number, normY: number): boolean {
    if (!grid || grid.length !== 32) return true;

    const cellX = Math.max(0, Math.min(31, Math.floor((normX / 100) * 32)));
    const cellY = Math.max(0, Math.min(31, Math.floor((normY / 100) * 32)));

    return grid[cellY]?.[cellX] !== 1;
  }
}
