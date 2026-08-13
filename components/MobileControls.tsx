"use client";

import React, { useRef, useState } from "react";
import { useGameStore, HotspotDef } from "../lib/store/useGameStore";

export const MobileControls: React.FC<{
  activeHotspot: HotspotDef | null;
  onInteract: (hotspot: HotspotDef) => void;
  onDirectionChange: (dx: number, dy: number) => void;
}> = ({ activeHotspot, onInteract, onDirectionChange }) => {
  const fsmState = useGameStore((state) => state.fsmState);
  const [activeDir, setActiveDir] = useState<string | null>(null);

  if (fsmState === "DIALOGUE_ACTIVE") return null;

  const handleTouchStart = (dir: string, dx: number, dy: number) => {
    setActiveDir(dir);
    onDirectionChange(dx, dy);
  };

  const handleTouchEnd = () => {
    setActiveDir(null);
    onDirectionChange(0, 0);
  };

  return (
    <div className="fixed bottom-4 left-4 z-40 flex items-end gap-6 pointer-events-auto">
      {/* Directional D-Pad */}
      <div className="relative w-32 h-32 bg-slate-950/80 backdrop-blur-md border border-slate-800 rounded-full p-2 flex items-center justify-center shadow-2xl">
        {/* Up */}
        <button
          onMouseDown={() => handleTouchStart("up", 0, -1)}
          onMouseUp={handleTouchEnd}
          onTouchStart={() => handleTouchStart("up", 0, -1)}
          onTouchEnd={handleTouchEnd}
          className={`absolute top-2 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition ${
            activeDir === "up" ? "bg-amber-500 text-slate-950" : "bg-slate-800 text-slate-200 hover:bg-slate-700"
          }`}
        >
          ▲
        </button>

        {/* Down */}
        <button
          onMouseDown={() => handleTouchStart("down", 0, 1)}
          onMouseUp={handleTouchEnd}
          onTouchStart={() => handleTouchStart("down", 0, 1)}
          onTouchEnd={handleTouchEnd}
          className={`absolute bottom-2 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition ${
            activeDir === "down" ? "bg-amber-500 text-slate-950" : "bg-slate-800 text-slate-200 hover:bg-slate-700"
          }`}
        >
          ▼
        </button>

        {/* Left */}
        <button
          onMouseDown={() => handleTouchStart("left", -1, 0)}
          onMouseUp={handleTouchEnd}
          onTouchStart={() => handleTouchStart("left", -1, 0)}
          onTouchEnd={handleTouchEnd}
          className={`absolute left-2 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition ${
            activeDir === "left" ? "bg-amber-500 text-slate-950" : "bg-slate-800 text-slate-200 hover:bg-slate-700"
          }`}
        >
          ◀
        </button>

        {/* Right */}
        <button
          onMouseDown={() => handleTouchStart("right", 1, 0)}
          onMouseUp={handleTouchEnd}
          onTouchStart={() => handleTouchStart("right", 1, 0)}
          onTouchEnd={handleTouchEnd}
          className={`absolute right-2 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition ${
            activeDir === "right" ? "bg-amber-500 text-slate-950" : "bg-slate-800 text-slate-200 hover:bg-slate-700"
          }`}
        >
          ▶
        </button>

        {/* Center Knob */}
        <div className="w-6 h-6 bg-slate-900 border border-slate-700 rounded-full" />
      </div>

      {/* Action Button */}
      {activeHotspot && (
        <button
          onClick={() => onInteract(activeHotspot)}
          className="h-14 px-5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-2xl shadow-2xl flex items-center gap-2 animate-bounce"
        >
          <span className="text-base">✋</span>
          <span>Inspect {activeHotspot.name}</span>
        </button>
      )}
    </div>
  );
};
