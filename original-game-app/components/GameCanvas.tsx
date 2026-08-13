"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useGameStore, HotspotDef, EngineSceneData } from "../lib/store/useGameStore";
import { MobileControls } from "./MobileControls";
import { CanvasRenderer } from "../core/canvas/Renderer";
import { InputManager } from "../core/canvas/InputManager";
import { calculateSlidingMovement } from "../core/collision/Physics";

export const GameCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Engine state subscriptions
  const currentSceneId = useGameStore((state) => state.currentSceneId);
  const scenes = useGameStore((state) => state.scenes);
  const setCurrentSceneId = useGameStore((state) => state.setCurrentSceneId);
  const updatePlayerPosImperative = useGameStore((state) => state.updatePlayerPosImperative);
  const setFSMState = useGameStore((state) => state.setFSMState);

  // Hotspot interaction state
  const [activeHotspot, setActiveHotspot] = useState<HotspotDef | null>(null);

  // Domain Instances
  const rendererRef = useRef<CanvasRenderer>(new CanvasRenderer());
  const inputManagerRef = useRef<InputManager>(new InputManager());
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

  // Initialize InputManager keyboard listeners
  useEffect(() => {
    const inputMgr = inputManagerRef.current;
    inputMgr.initListeners();
    return () => inputMgr.destroy();
  }, []);

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

  // Interaction Key Trigger Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if ((e.code === "KeyE" || k === "e" || k === "enter") && activeHotspot) {
        handleHotspotInteraction(activeHotspot);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeHotspot, handleHotspotInteraction]);

  // Direction handler for touch/mobile D-pad
  const handleMobileDirection = (dx: number, dy: number) => {
    inputManagerRef.current.setMobileInput(dx, dy);
  };

  // Main 60 FPS Procedural Render & Physics Engine Loop
  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();
    let animTick = 0;

    const render = (currentTime: number) => {
      const deltaTime = Math.min(0.05, (currentTime - lastTime) / 1000);
      lastTime = currentTime;
      animTick += deltaTime;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const scene = activeSceneRef.current;
      const currentFsm = useGameStore.getState().fsmState;

      // 1. Physics & Movement Calculations via Physics module
      if ((currentFsm === "EXPLORING" || currentFsm === "EVENT_TRIGGERED" || currentFsm === "PREFETCHING") && scene) {
        const speed = 28 * deltaTime;
        const { moveX, moveY } = inputManagerRef.current.getMovementDelta(speed);

        const moveResult = calculateSlidingMovement(
          playerPosRef.current.x,
          playerPosRef.current.y,
          playerPosRef.current.dir,
          moveX,
          moveY,
          scene.collisionGrid
        );

        playerPosRef.current.x = moveResult.nextX;
        playerPosRef.current.y = moveResult.nextY;
        playerPosRef.current.dir = moveResult.dir;
        playerPosRef.current.isMoving = moveResult.isMoving;

        if (moveResult.isMoving) {
          updatePlayerPosImperative(moveResult.nextX, moveResult.nextY, moveResult.dir);
        }
      }

      // 2. Proximity Distance Check for Interactive Hotspots
      let closestHotspot: HotspotDef | null = null;
      let minDistance = Infinity;

      if (scene?.hotspots) {
        scene.hotspots.forEach((h) => {
          const hX = (h.rect.x / 100) * canvas.width;
          const hY = (h.rect.y / 100) * canvas.height;
          const hW = (h.rect.w / 100) * canvas.width;
          const hH = (h.rect.h / 100) * canvas.height;

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

      // 3. Delegate drawing pass to CanvasRenderer
      rendererRef.current.renderFrame(
        ctx,
        canvas.width,
        canvas.height,
        scene || undefined,
        playerPosRef.current,
        playerPosRef.current.isMoving,
        animTick,
        closestHotspot
      );

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
