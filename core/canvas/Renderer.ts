import { EngineSceneData, HotspotDef } from "../../store/slices/sceneSlice";
import { Direction } from "../collision/Physics";
import { drawPlayerSprite } from "../../assets/sprites/SpriteRenderer";
import { getCachedImage, preloadImage } from "../../lib/image-cache";

export class CanvasRenderer {
  public renderFrame(
    ctx: CanvasRenderingContext2D,
    canvasWidth: number,
    canvasHeight: number,
    scene: EngineSceneData | undefined,
    playerPos: { x: number; y: number; dir: Direction },
    isMoving: boolean,
    animTick: number,
    nearHotspot: HotspotDef | null
  ) {
    // Clear canvas
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // 1. Draw Scene Backdrop Image (or fallback procedural grid)
    if (scene) {
      if (scene.imageUrl) {
        preloadImage(scene.imageUrl);
        const cachedImg = getCachedImage(scene.imageUrl);
        if (cachedImg) {
          const nw = cachedImg.naturalWidth || 800;
          const nh = cachedImg.naturalHeight || 600;
          const scale = Math.max(canvasWidth / nw, canvasHeight / nh);
          const sw = nw * scale;
          const sh = nh * scale;
          const sx = (canvasWidth - sw) / 2;
          const sy = (canvasHeight - sh) / 2;
          ctx.drawImage(cachedImg, sx, sy, sw, sh);
        } else {
          this.drawProceduralFallback(ctx, canvasWidth, canvasHeight, scene);
        }
      } else {
        this.drawProceduralFallback(ctx, canvasWidth, canvasHeight, scene);
      }

      // 2. Draw Hotspot Doors / Bounding Rectangles
      this.drawHotspots(ctx, canvasWidth, canvasHeight, scene.hotspots);
    } else {
      ctx.fillStyle = "#020617";
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    }

    // 3. Draw Player Character Sprite (Scales up in interior house scenes)
    const playerPxX = (playerPos.x / 100) * canvasWidth;
    const playerPxY = (playerPos.y / 100) * canvasHeight;
    const isInterior = scene?.kind === "interior";
    drawPlayerSprite(ctx, playerPxX, playerPxY, playerPos.dir, isMoving, animTick, isInterior);

    // 4. Draw Proximity Interaction Prompt Banner
    if (nearHotspot) {
      this.drawProximityBanner(ctx, canvasWidth, canvasHeight, nearHotspot);
    }
  }

  private drawProceduralFallback(
    ctx: CanvasRenderingContext2D,
    cw: number,
    ch: number,
    scene: EngineSceneData
  ) {
    ctx.fillStyle = scene.kind === "interior" ? "#0f172a" : "#1e293b";
    ctx.fillRect(0, 0, cw, ch);

    // Draw Subtle 32x32 Grid
    ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
    ctx.lineWidth = 1;
    const cellW = cw / 32;
    const cellH = ch / 32;
    for (let i = 0; i <= 32; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cellW, 0);
      ctx.lineTo(i * cellW, ch);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i * cellH);
      ctx.lineTo(cw, i * cellH);
      ctx.stroke();
    }
  }

  private drawHotspots(
    ctx: CanvasRenderingContext2D,
    cw: number,
    ch: number,
    hotspots: HotspotDef[]
  ) {
    hotspots.forEach((h) => {
      const hx = (h.rect.x / 100) * cw;
      const hy = (h.rect.y / 100) * ch;
      const hw = (h.rect.w / 100) * cw;
      const hh = (h.rect.h / 100) * ch;

      ctx.strokeStyle = h.kind === "building" ? "rgba(245, 158, 11, 0.8)" : "rgba(56, 189, 248, 0.8)";
      ctx.lineWidth = 2;
      ctx.strokeRect(hx, hy, hw, hh);

      ctx.fillStyle = h.kind === "building" ? "rgba(245, 158, 11, 0.15)" : "rgba(56, 189, 248, 0.15)";
      ctx.fillRect(hx, hy, hw, hh);
    });
  }

  private drawProximityBanner(
    ctx: CanvasRenderingContext2D,
    cw: number,
    ch: number,
    hotspot: HotspotDef
  ) {
    const bannerW = Math.min(380, cw * 0.8);
    const bannerH = 40;
    const bx = (cw - bannerW) / 2;
    const by = ch - 60;

    ctx.save();
    ctx.fillStyle = "rgba(15, 23, 42, 0.95)";
    ctx.strokeStyle = "rgba(245, 158, 11, 0.8)";
    ctx.lineWidth = 1.5;

    // Rounded rectangle banner
    ctx.beginPath();
    ctx.roundRect(bx, by, bannerW, bannerH, 10);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#fbbf24";
    ctx.font = "bold 13px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(hotspot.hint || `Press E to inspect ${hotspot.name}`, cw / 2, by + bannerH / 2);
    ctx.restore();
  }
}
