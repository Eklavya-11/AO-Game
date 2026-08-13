"use client";

import React, { useState } from "react";
import { useGameStore } from "../lib/store/useGameStore";

export const Minimap: React.FC = () => {
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const scenes = useGameStore((state) => state.scenes);
  const currentSceneId = useGameStore((state) => state.currentSceneId);
  const visitedScenes = useGameStore((state) => state.visitedScenes);
  const playerPos = useGameStore((state) => state.playerPos);

  const sceneList = Object.values(scenes);
  const currentScene = currentSceneId ? scenes[currentSceneId] : null;

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`fixed top-4 left-4 z-40 transition-all duration-300 ease-in-out font-mono text-slate-100 ${
        isHovered
          ? "w-64 h-64 rounded-2xl bg-slate-950/95 border border-amber-500/60 p-4 shadow-2xl backdrop-blur-md"
          : "w-24 h-24 rounded-full bg-slate-950/80 border-2 border-amber-500/50 p-1.5 shadow-xl backdrop-blur-sm cursor-pointer overflow-hidden flex items-center justify-center"
      }`}
    >
      {!isHovered ? (
        /* Circular Compact View (Default state) */
        <div className="relative w-full h-full rounded-full bg-slate-900 overflow-hidden flex flex-col items-center justify-center">
          {/* Radar Scanline */}
          <div className="absolute inset-0 bg-gradient-to-b from-amber-500/20 via-transparent to-transparent animate-pulse pointer-events-none" />

          {/* Compass Icon / Label */}
          <span className="text-[10px] text-amber-400 font-bold tracking-tighter uppercase z-10 flex items-center gap-0.5">
            <span>🗺️</span> MAP
          </span>

          {/* Player Live Dot */}
          {currentScene && (
            <div
              className="absolute w-2.5 h-2.5 bg-emerald-400 rounded-full border border-slate-950 shadow-md animate-ping"
              style={{
                left: `${Math.max(15, Math.min(80, playerPos.x))}%`,
                top: `${Math.max(15, Math.min(80, playerPos.y))}%`,
              }}
            />
          )}

          {/* Subtitle */}
          <span className="text-[8px] text-slate-400 truncate max-w-[60px] z-10">
            {currentScene?.title?.split(" ")[0] || "Street"}
          </span>
        </div>
      ) : (
        /* Expanded Grid View on Hover */
        <div className="w-full h-full flex flex-col justify-between animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
            <span className="font-bold text-amber-400 uppercase tracking-wider text-[11px] flex items-center gap-1">
              <span>🗺️</span> Minimap Navigator
            </span>
            <span className="text-[9px] text-slate-400 truncate max-w-[90px]">
              {currentScene?.title || "Street"}
            </span>
          </div>

          {/* Grid View */}
          <div className="relative w-full h-36 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex items-center justify-center my-1">
            <div className="grid grid-cols-3 gap-2 p-2 w-full h-full">
              {/* Overworld node */}
              <div
                className={`flex flex-col items-center justify-center p-1 rounded-lg border text-[9px] text-center transition ${
                  currentSceneId === "street_overworld"
                    ? "bg-amber-500/30 border-amber-400 text-amber-300 font-bold shadow-sm"
                    : visitedScenes.includes("street_overworld")
                    ? "bg-slate-800/80 border-slate-700 text-slate-300"
                    : "bg-slate-950/40 border-slate-900 text-slate-600"
                }`}
              >
                <span className="text-sm">🏙️</span>
                <span className="truncate w-full font-sans">Street</span>
              </div>

              {/* Interior nodes */}
              {sceneList
                .filter((s) => s.kind === "interior")
                .slice(0, 2)
                .map((room) => {
                  const isCurrent = currentSceneId === room.id;
                  const isVisited = visitedScenes.includes(room.id);
                  return (
                    <div
                      key={room.id}
                      className={`flex flex-col items-center justify-center p-1 rounded-lg border text-[9px] text-center transition ${
                        isCurrent
                          ? "bg-sky-500/30 border-sky-400 text-sky-300 font-bold shadow-sm"
                          : isVisited
                          ? "bg-slate-800/80 border-slate-700 text-slate-300"
                          : "bg-slate-950/40 border-slate-900 text-slate-600"
                      }`}
                    >
                      <span className="text-sm">🏠</span>
                      <span className="truncate w-full font-sans">{room.title.split(" ")[0]}</span>
                    </div>
                  );
                })}
            </div>

            {/* Player Indicator Pin */}
            {currentScene && (
              <div
                className="absolute w-3 h-3 bg-emerald-400 rounded-full border border-slate-950 shadow-md animate-ping"
                style={{
                  left: `${Math.max(10, Math.min(85, playerPos.x))}%`,
                  top: `${Math.max(10, Math.min(85, playerPos.y))}%`,
                }}
              />
            )}
          </div>

          {/* Coordinates Footer */}
          <div className="flex justify-between items-center text-[10px] text-slate-400 border-t border-slate-800 pt-1.5">
            <span>X: {playerPos.x.toFixed(0)}</span>
            <span>Y: {playerPos.y.toFixed(0)}</span>
            <span className="text-emerald-400 uppercase font-semibold">{currentScene?.kind || "Street"}</span>
          </div>
        </div>
      )}
    </div>
  );
};
