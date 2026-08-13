"use client";

import React, { useState } from "react";
import { useGameStore } from "../lib/store/useGameStore";

export const TelemetryHUD: React.FC = () => {
  const [isMinimized, setIsMinimized] = useState<boolean>(false);

  const toastMessage = useGameStore((state) => state.toastMessage);
  const fsmState = useGameStore((state) => state.fsmState);
  const prefetchProgress = useGameStore((state) => state.prefetchProgress);
  const totalApiCalls = useGameStore((state) => state.totalApiCalls);
  const totalEstimatedCostINR = useGameStore((state) => state.totalEstimatedCostINR);
  const agents = useGameStore((state) => state.agents);
  const acquiredClues = useGameStore((state) => state.acquiredClues);

  const cluesCount = Object.keys(acquiredClues).length;

  return (
    <>
      {/* Floating Auto-Disappearing HUD Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-slate-950/95 border border-amber-500/60 text-amber-300 font-mono text-xs px-5 py-2.5 rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-2.5 animate-in fade-in zoom-in-95 duration-200">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          <span className="font-semibold">{toastMessage}</span>
        </div>
      )}

      <div
        className={`fixed top-4 right-4 z-40 bg-slate-950/90 backdrop-blur-md border border-sky-500/30 rounded-xl shadow-2xl text-slate-100 font-mono text-xs transition-all duration-300 ${
          isMinimized ? "w-48 p-2.5" : "w-80 p-4"
        }`}
      >
      {/* HUD Header with Minimize Toggle */}
      <div className={`flex items-center justify-between ${!isMinimized ? "border-b border-slate-800 pb-2 mb-3" : ""}`}>
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
          </span>
          <span className="font-bold text-sky-400 uppercase tracking-wider text-[11px] truncate">
            {isMinimized ? "AI Telemetry" : "AI Telemetry Engine"}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-amber-400 font-sans text-[9px]">
            {fsmState}
          </span>
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="text-slate-400 hover:text-white text-xs px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 rounded transition"
            title={isMinimized ? "Expand HUD" : "Minimize HUD"}
          >
            {isMinimized ? " ↙ " : " ↗ "}
          </button>
        </div>
      </div>

      {/* Expanded Content View */}
      {!isMinimized && (
        <>
          {/* Prefetch & Mystery Status */}
          <div className="space-y-2 mb-3 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Spatial Prefetch:</span>
              <span className="text-emerald-400 font-bold">
                {prefetchProgress.completed}/{prefetchProgress.total} Rooms Prebuilt
              </span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full transition-all duration-500"
                style={{ width: `${(prefetchProgress.completed / prefetchProgress.total) * 100}%` }}
              />
            </div>

            <div className="flex justify-between items-center pt-1 border-t border-slate-800/60">
              <span className="text-slate-400">Mystery Clues Discovered:</span>
              <span className="text-amber-400 font-bold">{cluesCount}/3 Clues</span>
            </div>
          </div>

          {/* Live Agent Status Panel */}
          <div className="space-y-1.5 mb-3">
            <div className="text-[10px] text-slate-400 uppercase font-semibold mb-1">Active Agents</div>
            {(Object.values(agents) as import("../lib/store/useGameStore").AgentTelemetry[]).map((agent) => (
              <div key={agent.name} className="flex items-center justify-between bg-slate-900/40 px-2 py-1 rounded">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      agent.status === "generating"
                        ? "bg-amber-400 animate-pulse"
                        : agent.status === "thinking"
                        ? "bg-sky-400 animate-ping"
                        : agent.status === "completed"
                        ? "bg-emerald-400"
                        : "bg-slate-600"
                    }`}
                  />
                  <span className="text-slate-300 text-[11px]">{agent.name}</span>
                </div>
                <span className="text-[10px] text-slate-400 truncate max-w-[110px]">{agent.lastAction}</span>
              </div>
            ))}
          </div>

          {/* API Cost & Metrics Ticker */}
          <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-[10px]">
            <div>
              <span className="text-slate-400">Model Calls: </span>
              <span className="text-sky-300 font-bold">{totalApiCalls}</span>
            </div>
            <div>
              <span className="text-slate-400">Est. Run Cost: </span>
              <span className="text-emerald-400 font-bold">₹{totalEstimatedCostINR.toFixed(2)}</span>
            </div>
          </div>
        </>
      )}
    </div>
  </>
  );
};
