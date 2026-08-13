"use client";

import React, { useEffect, useState } from "react";
import { useGameStore } from "../lib/store/useGameStore";
import { voiceCache, sha256 } from "../lib/world-engine";
import { fetchSarvamTTS } from "../lib/gemini";

export const FinaleModal: React.FC = () => {
  const fsmState = useGameStore((state) => state.fsmState);
  const worldTitle = useGameStore((state) => state.worldTitle);
  const worldPremise = useGameStore((state) => state.worldPremise);
  const acquiredClues = useGameStore((state) => state.acquiredClues);
  const resetEngine = useGameStore((state) => state.resetEngine);

  const [isPlayingSecret, setIsPlayingSecret] = useState<boolean>(false);
  const [spokenStatus, setSpokenStatus] = useState<string>("Revealing Truth...");

  const cluesCount = Object.keys(acquiredClues).length;
  const isFinaleTriggered = fsmState === "FINALE_UNRAVELED" || cluesCount >= 3;

  const secretText = `The ultimate truth is revealed: The tiffin box contains the lost deed to the Mumbai harbor lights. You have unraveled the mystery of ${worldTitle || "the city"}!`;

  useEffect(() => {
    if (isFinaleTriggered) {
      playFinaleVoice();
    }
  }, [isFinaleTriggered]);

  const playFinaleVoice = async () => {
    setIsPlayingSecret(true);
    setSpokenStatus("Sarvam Bulbul v3 Voicing Finale...");

    const hash = await sha256(`finale_${secretText}`);
    let cachedBlob = await voiceCache.getAudioBlob(hash);

    if (!cachedBlob) {
      cachedBlob = await fetchSarvamTTS(secretText, "bulbul_v3_default");
      if (cachedBlob) {
        await voiceCache.putAudioBlob(hash, cachedBlob);
      }
    }

    if (cachedBlob && cachedBlob.size > 20) {
      try {
        const audioUrl = URL.createObjectURL(cachedBlob);
        const audio = new Audio(audioUrl);
        audio.play().catch(() => {});
      } catch {}
    }

    setSpokenStatus("Finale Revelation Complete!");
    setIsPlayingSecret(false);
  };

  if (!isFinaleTriggered) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-700">
      {/* Golden Particle Glow Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-500/20 via-amber-950/30 to-slate-950 pointer-events-none" />

      {/* Main Achievement Card */}
      <div className="relative w-full max-w-2xl bg-slate-900 border-2 border-amber-500/60 rounded-3xl p-8 shadow-2xl text-center flex flex-col items-center z-10 overflow-hidden">
        {/* Shimmer Header Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-amber-500/20 via-amber-400/40 to-amber-500/20 border border-amber-400/60 rounded-full text-amber-300 font-mono text-xs uppercase tracking-widest mb-6 animate-pulse">
          🏆 Mystery Solved — Finale Unraveled
        </div>

        {/* World Title */}
        <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-sky-300 font-serif mb-2">
          {worldTitle || "The Mumbai Night Market"}
        </h2>
        <p className="text-xs text-slate-400 italic mb-6">{worldPremise}</p>

        {/* Finale Generated Visual Frame */}
        <div className="relative w-full h-64 bg-slate-950 rounded-2xl border border-amber-500/40 overflow-hidden shadow-inner mb-6 flex items-center justify-center">
          <img
            src="https://picsum.photos/seed/finale_unraveled/800/600"
            alt="Finale Unraveled Visual"
            className="w-full h-full object-cover animate-in zoom-in-105 duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
          <div className="absolute bottom-4 left-4 right-4 text-left">
            <span className="text-[10px] text-amber-400 font-mono uppercase font-bold block mb-1">
              Secret Unraveled
            </span>
            <p className="text-sm font-semibold text-slate-100 leading-snug">{secretText}</p>
          </div>
        </div>

        {/* Voiced Status Indicator */}
        <div className="flex items-center gap-3 bg-slate-950 px-4 py-2 rounded-xl border border-slate-800 text-xs font-mono text-amber-300 mb-6">
          <span className={`w-2 h-2 rounded-full ${isPlayingSecret ? "bg-amber-400 animate-ping" : "bg-emerald-400"}`} />
          <span>{spokenStatus}</span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-4 w-full">
          <button
            onClick={() => playFinaleVoice()}
            disabled={isPlayingSecret}
            className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-xs rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span>🔊</span> Replay Spoken Secret
          </button>
          <button
            onClick={resetEngine}
            className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2"
          >
            <span>🔄</span> Start New Investigation
          </button>
        </div>
      </div>
    </div>
  );
};
