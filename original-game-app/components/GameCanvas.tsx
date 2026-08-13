"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useGameStore, HotspotDef, EngineSceneData } from "../lib/store/useGameStore";
import { MobileControls } from "./MobileControls";
import { getCachedImage, preloadImage } from "../lib/image-cache";

export const GameCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Engine state subscriptions
  const fsmState = useGameStore((state) => state.fsmState);
  const currentSceneId = useGameStore((state) => state.currentSceneId);
  const scenes = useGameStore((state) => state.scenes);
  const setCurrentSceneId = useGameStore((state) => state.setCurrentSceneId);
  const updatePlayerPosImperative = useGameStore((state) => state.updatePlayerPosImperative);
  const setFSMState = useGameStore((state) => state.setFSMState);

  // Hotspot interaction state
  const [activeHotspot, setActiveHotspot] = useState<HotspotDef | null>(null);

  // Keyboard and D-pad movement tracking
  const keysPressed = useRef<{ [key: string]: boolean }>({});
  const mobileInputRef = useRef({ dx: 0, dy: 0 });
  const playerPosRef = useRef({ x: 50, y: 70, dir: "down" as "up" | "down" | "left" | "right", isMoving: false });
  const activeSceneRef = useRef<EngineSceneData | null>(null);

  // Keep active scene ref updated
  useEffect(() => {
    if (currentSceneId) {
      const scene = scenes[currentSceneId];
      if (scene) {
        activeSceneRef.current = scene;
      }
    }
  }, [currentSceneId, scenes]);

  // Handle interaction router
  const handleHotspotInteraction = useCallback(
    (hotspot: HotspotDef) => {
      if (hotspot.kind === "building") {
        const targetInteriorId = `interior_${hotspot.id}`;
        const interiorScene = scenes[targetInteriorId];

        if (interiorScene) {
          playerPosRef.current = { x: 50, y: 75, dir: "up", isMoving: false };
          setCurrentSceneId(targetInteriorId);
        } else {
          setFSMState("PREFETCHING");
          setTimeout(() => {
            playerPosRef.current = { x: 50, y: 75, dir: "up", isMoving: false };
            setCurrentSceneId(targetInteriorId);
            setFSMState("EXPLORING");
          }, 600);
        }
      } else if (hotspot.kind === "exit") {
        const parentId = activeSceneRef.current?.parentId || "street_overworld";
        playerPosRef.current = { x: 50, y: 35, dir: "down", isMoving: false };
        setCurrentSceneId(parentId);
      } else if (hotspot.kind === "npc") {
        setFSMState("DIALOGUE_ACTIVE");
      }
    },
    [scenes, setCurrentSceneId, setFSMState]
  );

  // Keyboard Event Listeners (both e.key and e.code for robust cross-browser movement)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      keysPressed.current[e.code] = true;
      keysPressed.current[k] = true;

      // 'E' or Enter key interaction trigger
      if ((e.code === "KeyE" || k === "e" || k === "enter") && activeHotspot) {
        handleHotspotInteraction(activeHotspot);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      keysPressed.current[e.code] = false;
      keysPressed.current[k] = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [activeHotspot, handleHotspotInteraction]);

  // Direction handler for touch/mobile D-pad
  const handleMobileDirection = (dx: number, dy: number) => {
    mobileInputRef.current = { dx, dy };
  };

  // Main 60 FPS Procedural Render & Physics Engine Loop
  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();

    const render = (currentTime: number) => {
      const deltaTime = Math.min(0.05, (currentTime - lastTime) / 1000);
      lastTime = currentTime;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const scene = activeSceneRef.current;
      const currentFsm = useGameStore.getState().fsmState;

      // 1. Movement Calculations (Allow movement in EXPLORING and PREFETCHING background state)
      if ((currentFsm === "EXPLORING" || currentFsm === "PREFETCHING") && scene) {
        const speed = 28 * deltaTime; // Movement speed
        let moveX = mobileInputRef.current.dx * speed;
        let moveY = mobileInputRef.current.dy * speed;

        const k = keysPressed.current;
        if (k["KeyW"] || k["w"] || k["ArrowUp"] || k["arrowup"]) moveY -= speed;
        if (k["KeyS"] || k["s"] || k["ArrowDown"] || k["arrowdown"]) moveY += speed;
        if (k["KeyA"] || k["a"] || k["ArrowLeft"] || k["arrowleft"]) moveX -= speed;
        if (k["KeyD"] || k["d"] || k["ArrowRight"] || k["arrowright"]) moveX += speed;

        const isMoving = moveX !== 0 || moveY !== 0;
        playerPosRef.current.isMoving = isMoving;

        if (isMoving) {
          if (moveX !== 0 && moveY !== 0) {
            moveX *= 0.7071;
            moveY *= 0.7071;
          }

          let dir = playerPosRef.current.dir;
          if (Math.abs(moveX) > Math.abs(moveY)) {
            dir = moveX > 0 ? "right" : "left";
          } else if (moveY !== 0) {
            dir = moveY > 0 ? "down" : "up";
          }
          playerPosRef.current.dir = dir;

          // Axis-independent collision checks to allow smooth sliding along walls
          const targetX = playerPosRef.current.x + moveX;
          const targetY = playerPosRef.current.y + moveY;

          // Check X movement
          const gridX = Math.floor((targetX / 100) * 32);
          const currentGridY = Math.floor((playerPosRef.current.y / 100) * 32);
          const xBlocked =
            gridX < 0 ||
            gridX >= 32 ||
            (scene.collisionGrid && scene.collisionGrid[currentGridY]?.[gridX] === 1);

          if (!xBlocked) {
            playerPosRef.current.x = Math.max(2, Math.min(98, targetX));
          }

          // Check Y movement
          const gridY = Math.floor((targetY / 100) * 32);
          const currentGridX = Math.floor((playerPosRef.current.x / 100) * 32);
          const yBlocked =
            gridY < 0 ||
            gridY >= 32 ||
            (scene.collisionGrid && scene.collisionGrid[gridY]?.[currentGridX] === 1);

          if (!yBlocked) {
            playerPosRef.current.y = Math.max(2, Math.min(98, targetY));
          }

          updatePlayerPosImperative(
            playerPosRef.current.x,
            playerPosRef.current.y,
            playerPosRef.current.dir
          );
        }
      }

      // 2. Scene Backdrop Pass (Generated Art Image + Procedural Fallback)
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const cachedImg = scene?.imageUrl ? getCachedImage(scene.imageUrl) : null;
      if (cachedImg && cachedImg.naturalWidth > 0) {
        // Draw Generated Live Visual Art Image (Cover Fit)
        const scale = Math.max(canvas.width / cachedImg.naturalWidth, canvas.height / cachedImg.naturalHeight);
        const drawW = cachedImg.naturalWidth * scale;
        const drawH = cachedImg.naturalHeight * scale;
        const offsetX = (canvas.width - drawW) / 2;
        const offsetY = (canvas.height - drawH) / 2;
        ctx.drawImage(cachedImg, offsetX, offsetY, drawW, drawH);
      } else {
        // Preload image in background
        if (scene?.imageUrl) {
          preloadImage(scene.imageUrl).catch(() => {});
        }

        if (scene?.kind === "interior") {
          // Interior Room Background
          ctx.fillStyle = "#1e1b18";
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Wooden floor planks
          ctx.strokeStyle = "#2e2924";
          ctx.lineWidth = 1;
          for (let y = 0; y < canvas.height; y += 30) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
          }

          // Room Backwall
          ctx.fillStyle = "#110e0c";
          ctx.fillRect(0, 0, canvas.width, 120);
          ctx.fillStyle = "#78350f";
          ctx.fillRect(0, 116, canvas.width, 4); // Wooden trim line
        } else {
          // Overworld Night Street Background
          ctx.fillStyle = "#090d16";
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Cobblestone Road
          ctx.fillStyle = "#1e293b";
          ctx.fillRect(0, 180, canvas.width, canvas.height - 180);

          // Road Texture detail
          ctx.strokeStyle = "#334155";
          ctx.lineWidth = 1;
          for (let x = 0; x < canvas.width; x += 40) {
            ctx.beginPath();
            ctx.moveTo(x, 180);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
          }

          // Distant Building Facades
          ctx.fillStyle = "#0f172a";
          ctx.fillRect(0, 20, canvas.width, 160);
        }
      }

      // 3. Render Interactive Hotspots & Building Structures
      let closestHotspot: HotspotDef | null = null;
      let minDistance = Infinity;

      if (scene?.hotspots) {
        scene.hotspots.forEach((h) => {
          const hX = (h.rect.x / 100) * canvas.width;
          const hY = (h.rect.y / 100) * canvas.height;
          const hW = (h.rect.w / 100) * canvas.width;
          const hH = (h.rect.h / 100) * canvas.height;

          // Building structure render
          if (h.kind === "building") {
            ctx.fillStyle = "#1e293b";
            ctx.fillRect(hX - 10, hY - 40, hW + 20, hH + 40);
            ctx.strokeStyle = "#fbbf24";
            ctx.lineWidth = 2;
            ctx.strokeRect(hX - 10, hY - 40, hW + 20, hH + 40);

            // Doorway
            ctx.fillStyle = "#451a03";
            ctx.fillRect(hX, hY, hW, hH);
          } else if (h.kind === "npc") {
            // NPC Sprite Body
            ctx.fillStyle = "#f59e0b";
            ctx.beginPath();
            ctx.arc(hX + hW / 2, hY + hH / 2, 14, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 2;
            ctx.stroke();

            // NPC Label Tag
            ctx.fillStyle = "#fbbf24";
            ctx.font = "bold 11px sans-serif";
            ctx.fillText(`🗣️ ${h.name}`, hX - 10, hY - 12);
          } else if (h.kind === "exit") {
            // Exit Rug / Portal
            ctx.fillStyle = "rgba(239, 68, 68, 0.4)";
            ctx.fillRect(hX, hY, hW, hH);
            ctx.strokeStyle = "#ef4444";
            ctx.lineWidth = 2;
            ctx.strokeRect(hX, hY, hW, hH);
          }

          // Distance check to player
          const playerPxX = (playerPosRef.current.x / 100) * canvas.width;
          const playerPxY = (playerPosRef.current.y / 100) * canvas.height;

          const dist = Math.hypot(playerPxX - (hX + hW / 2), playerPxY - (hY + hH / 2));
          if (dist < 65 && dist < minDistance) {
            minDistance = dist;
            closestHotspot = h;
          }
        });
      }

      setActiveHotspot(closestHotspot);

      // 4. Render Animated Player Character Sprite
      const pxX = (playerPosRef.current.x / 100) * canvas.width;
      const pxY = (playerPosRef.current.y / 100) * canvas.height;
      const isMoving = playerPosRef.current.isMoving;
      const walkBob = isMoving ? Math.abs(Math.sin(currentTime / 100)) * 4 : 0;

      // Player Shadow
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      ctx.beginPath();
      ctx.ellipse(pxX, pxY + 10, 12, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Character Body Circle
      ctx.fillStyle = "#10b981"; // Emerald cloak
      ctx.beginPath();
      ctx.arc(pxX, pxY - walkBob, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#ffffff";
      ctx.stroke();

      // Facing Direction Indicator
      ctx.fillStyle = "#ffffff";
      let eyeX = pxX;
      let eyeY = pxY - walkBob;
      if (playerPosRef.current.dir === "left") eyeX -= 5;
      if (playerPosRef.current.dir === "right") eyeX += 5;
      if (playerPosRef.current.dir === "up") eyeY -= 5;
      if (playerPosRef.current.dir === "down") eyeY += 5;

      ctx.beginPath();
      ctx.arc(eyeX, eyeY, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // 5. In-Canvas Interaction Prompt Banner
      const activePromptSpot = closestHotspot as HotspotDef | null;
      if (activePromptSpot) {
        const hintText = `${activePromptSpot.hint} (Press E / Action)`;
        ctx.font = "bold 12px sans-serif";
        const textWidth = ctx.measureText(hintText).width;

        ctx.fillStyle = "rgba(15, 23, 42, 0.92)";
        ctx.fillRect(pxX - textWidth / 2 - 12, pxY - 50, textWidth + 24, 26);
        ctx.strokeStyle = "#fbbf24";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(pxX - textWidth / 2 - 12, pxY - 50, textWidth + 24, 26);

        ctx.fillStyle = "#fbbf24";
        ctx.textAlign = "center";
        ctx.fillText(hintText, pxX, pxY - 33);
        ctx.textAlign = "left";
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [setFSMState, setCurrentSceneId, scenes, updatePlayerPosImperative]);

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-slate-950 p-4">
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        className="w-full max-w-4xl h-auto aspect-[4/3] rounded-xl shadow-2xl border border-slate-800"
      />

      <MobileControls
        activeHotspot={activeHotspot}
        onInteract={handleHotspotInteraction}
        onDirectionChange={handleMobileDirection}
      />
    </div>
  );
};
