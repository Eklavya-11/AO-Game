import { isPositionWalkable } from "./CollisionGrid";

export type Direction = "up" | "down" | "left" | "right";

export interface MovementResult {
  nextX: number;
  nextY: number;
  dir: Direction;
  isMoving: boolean;
}

export function calculateSlidingMovement(
  currentX: number,
  currentY: number,
  currentDir: Direction,
  moveX: number,
  moveY: number,
  collisionGrid?: number[][]
): MovementResult {
  const isMoving = moveX !== 0 || moveY !== 0;
  if (!isMoving) {
    return { nextX: currentX, nextY: currentY, dir: currentDir, isMoving: false };
  }

  // Normalize diagonal movement speed
  let dx = moveX;
  let dy = moveY;
  if (dx !== 0 && dy !== 0) {
    dx *= 0.7071;
    dy *= 0.7071;
  }

  // Determine facing direction
  let dir = currentDir;
  if (Math.abs(dx) > Math.abs(dy)) {
    dir = dx > 0 ? "right" : "left";
  } else if (Math.abs(dy) > 0) {
    dir = dy > 0 ? "down" : "up";
  }

  // Calculate prospective positions with boundaries (0..100)
  let targetX = Math.max(4, Math.min(96, currentX + dx));
  let targetY = Math.max(4, Math.min(96, currentY + dy));

  // Axis-independent sliding checks against 32x32 grid
  const canMoveX = isPositionWalkable(collisionGrid, targetX, currentY);
  const canMoveY = isPositionWalkable(collisionGrid, currentX, targetY);

  const finalX = canMoveX ? targetX : currentX;
  const finalY = canMoveY ? targetY : currentY;

  return { nextX: finalX, nextY: finalY, dir, isMoving: true };
}
