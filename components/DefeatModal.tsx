"use client";

import React, { useEffect } from "react";
import { useGameStore } from "../lib/store/useGameStore";
import { voiceEngine } from "../lib/audio/voice-engine";

export const DefeatModal: React.FC = () => {
  const fsmState = useGameStore((state) => state.fsmState);
  const setFSMState = useGameStore((state) => state.setFSMState);
  const resetEngine = useGameStore((state) => state.resetEngine);
  const worldTitle = useGameStore((state) => state.worldTitle);

  useEffect(() => {
    if (fsmState === "DEFEAT_CAPTURED") {
      voiceEngine.speakSpeechSynthesis(
        "Captain Russell's guards have intercepted you! The wager scroll is lost!",
        "en-IN"
      );
    }
  }, [fsmState]);

  if (fsmState !== "DEFEAT_CAPTURED") return null;

  const handleRetry = () => {
    voiceEngine.stopCurrentVoice();
    setFSMState("EXPLORING");
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-lg flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-slate-900 border-2 border-red-500/80 rounded-2xl p-6 max-w-md w-full text-center shadow-2xl relative overflow-hidden">
        {/* Ominous Glow Effect */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-red-600/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-amber-600/20 rounded-full blur-3xl" />

        <div className="w-16 h-16 bg-red-950 border border-red-500/60 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl shadow-lg">
          🚨
        </div>

        <h2 className="text-2xl font-extrabold text-red-400 mb-1 tracking-tight">
          QUEST FAILED: INTERCEPTED!
        </h2>
        <p className="text-xs text-slate-400 mb-4 font-mono">
          {worldTitle || "Champaner 1893: The Wager Scroll"}
        </p>

        <div className="bg-slate-950/80 border border-red-900/60 rounded-xl p-4 mb-5 text-left text-xs text-slate-300 space-y-2">
          <p className="text-red-300 font-semibold">
            ⚠️ Captain Russell's redcoat guards spotted you near the village gates!
          </p>
          <p className="text-slate-400 leading-relaxed">
            The hidden wager scroll was confiscated before it could reach Bhuvan. Without the official revenue waiver seal, Captain Russell has declared the wager void and tripled the Lagaan tax for Champaner!
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleRetry}
            className="flex-1 py-3 bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold text-xs rounded-xl shadow-lg transition"
          >
            🔄 Retry Wager Quest
          </button>
          <button
            onClick={resetEngine}
            className="py-3 px-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition"
          >
            🏠 Main Menu
          </button>
        </div>
      </div>
    </div>
  );
};
