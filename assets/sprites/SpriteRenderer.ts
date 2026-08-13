import { Direction } from "../../core/collision/Physics";

let spritesheetImg: HTMLImageElement | null = null;

function getLoadedSpriteImage(): HTMLImageElement | null {
  if (typeof window === "undefined") return null;
  if (!spritesheetImg) {
    spritesheetImg = new Image();
    spritesheetImg.src = "/fallback/champaner_player_spritesheet.png";
  }
  if (spritesheetImg.complete && spritesheetImg.naturalWidth > 0) {
    return spritesheetImg;
  }
  return null;
}

interface DustParticle {
  x: number;
  y: number;
  radius: number;
  alpha: number;
}
const dustParticles: DustParticle[] = [];

export function drawPlayerSprite(
  ctx: CanvasRenderingContext2D,
  playerPxX: number,
  playerPxY: number,
  dir: Direction,
  isMoving: boolean,
  animTick: number,
  isInterior: boolean = false
) {
  ctx.save();

  // 1. Dust Particles on Movement
  if (isMoving && Math.random() < 0.3) {
    dustParticles.push({
      x: playerPxX + (Math.random() * 10 - 5),
      y: playerPxY + (isInterior ? 24 : 12) + (Math.random() * 4 - 2),
      radius: Math.random() * (isInterior ? 5 : 3) + 2,
      alpha: 0.5,
    });
  }

  for (let i = dustParticles.length - 1; i >= 0; i--) {
    const p = dustParticles[i];
    ctx.fillStyle = `rgba(217, 119, 6, ${p.alpha})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fill();

    p.alpha -= 0.03;
    p.radius += 0.1;
    if (p.alpha <= 0) dustParticles.splice(i, 1);
  }

  // 2. Dual Grounding Contact Shadow under feet (Scaled for interior vs overworld)
  const shadowXRadius = isInterior ? 28 : 16;
  const shadowYRadius = isInterior ? 11 : 7;
  const shadowYOffset = isInterior ? 26 : 14;

  ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
  ctx.beginPath();
  ctx.ellipse(playerPxX, playerPxY + shadowYOffset, shadowXRadius, shadowYRadius, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(120, 53, 15, 0.25)";
  ctx.beginPath();
  ctx.ellipse(playerPxX, playerPxY + shadowYOffset, shadowXRadius + 6, shadowYRadius + 3, 0, 0, Math.PI * 2);
  ctx.fill();

  // 3. Dynamic Frame Slicing & Scale (105px for interior rooms, 58px for overworld)
  const img = getLoadedSpriteImage();
  if (img) {
    const totalCols = 6;
    const totalRows = 4;

    const cellW = img.naturalWidth / totalCols;
    const cellH = img.naturalHeight / totalRows;

    let rowIdx = 0;
    let flipLeft = false;

    if (dir === "up") {
      rowIdx = 1;
    } else if (dir === "left") {
      rowIdx = 2; // Row 2 in 4x6 grid is Left-Facing
    } else if (dir === "right") {
      rowIdx = 3; // Row 3 in 4x6 grid is Right-Facing
    }

    const colIdx = isMoving ? Math.floor((animTick * 8) % totalCols) : 0;

    const topNumberCrop = 48;
    const srcX = colIdx * cellW;
    const srcY = rowIdx * cellH + topNumberCrop;
    const srcW = cellW;
    const srcH = Math.max(10, cellH - topNumberCrop);

    // Scale character up in interior rooms to match house furniture & NPC proportion
    const renderW = isInterior ? 105 : 58;
    const renderH = (srcH / srcW) * renderW;
    const destX = playerPxX - renderW / 2;
    const destY = playerPxY - renderH / 2;

    if (flipLeft) {
      ctx.save();
      ctx.translate(playerPxX, playerPxY);
      ctx.scale(-1, 1);
      ctx.drawImage(img, srcX, srcY, srcW, srcH, -renderW / 2, -renderH / 2, renderW, renderH);
      ctx.restore();
    } else {
      ctx.drawImage(img, srcX, srcY, srcW, srcH, destX, destY, renderW, renderH);
    }
  } else {
    // Stylish Procedural Hero Avatar Fallback
    const bobOffset = isMoving ? Math.sin(animTick * 12) * 3 : 0;
    const radius = isInterior ? 24 : 14;
    const spriteY = playerPxY - (isInterior ? 20 : 14) + bobOffset;

    // Body (White Dhoti)
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#451a03";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(playerPxX, spriteY + (isInterior ? 10 : 6), radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Saffron Turban Head
    ctx.fillStyle = "#f97316";
    ctx.strokeStyle = "#7c2d12";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(playerPxX, spriteY - (isInterior ? 6 : 4), radius * 0.75, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Direction Indicator Dot
    ctx.fillStyle = "#ffffff";
    let dotX = playerPxX;
    let dotY = spriteY - (isInterior ? 6 : 4);
    const offset = isInterior ? 10 : 6;

    if (dir === "up") dotY -= offset;
    if (dir === "down") dotY += offset;
    if (dir === "left") dotX -= offset;
    if (dir === "right") dotX += offset;

    ctx.beginPath();
    ctx.arc(dotX, dotY, isInterior ? 5 : 3.5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}
