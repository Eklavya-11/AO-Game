"use client";

import React, { useState, useEffect } from "react";
import { useGameStore } from "../lib/store/useGameStore";
import { createNewWorldPipeline, startDirectorAgentWatcher } from "../lib/world-engine";
import { generateShareCode, supabase } from "../lib/supabase";
import { GameCanvas } from "./GameCanvas";
import { DialogueBox } from "./DialogueBox";
import { TelemetryHUD } from "./TelemetryHUD";
import { JournalModal } from "./JournalModal";
import { Minimap } from "./Minimap";
import { FinaleModal } from "./FinaleModal";
import { DefeatModal } from "./DefeatModal";
import { AuthModal } from "./AuthModal";
import { LanguageSelector } from "./LanguageSelector";
import { ParallaxBackground } from "./ParallaxBackground";

export const PROMPT_PRESETS = [
  {
    id: "lagaan",
    title: "🏏 Lagaan Heritage",
    prompt:
      "A sun-scorched 1893 Champaner village during the drought, where I must deliver a hidden wager scroll to Bhuvan before the British captain arrives.",
  },
  {
    id: "mughal",
    title: "🕌 Mughal Mystery",
    prompt:
      "A lantern-lit Chandni Chowk in 1650 during a heavy monsoon, where I must navigate crowded bazaar corridors to deliver a coded royal parchment to Shah Jahan's Vizier.",
  },
];

export const OriginalGameContainer: React.FC = () => {
  const [promptInput, setPromptInput] = useState<string>(PROMPT_PRESETS[0].prompt);
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const fsmState = useGameStore((state) => state.fsmState);
  const resetEngine = useGameStore((state) => state.resetEngine);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserEmail(session?.user?.email || null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const stopWatcher = startDirectorAgentWatcher();
    return () => stopWatcher();
  }, []);

  const handleCreateWorld = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptInput.trim()) return;
    await createNewWorldPipeline(promptInput);
  };

  return (
    <div className="relative w-full h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center overflow-hidden font-sans">
      {/* 1. Parallax Mouse-Tracking Background (Image 3 Spider Aesthetic) */}
      {fsmState === "IDLE" && <ParallaxBackground />}

      {/* 2. UI Overlays */}
      <TelemetryHUD />
      <JournalModal />
      <Minimap />
      <FinaleModal />
      <DefeatModal />
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />

      {/* 3. Top Header Navigation Bar */}
      <header className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-6 py-4 bg-gradient-to-b from-slate-950/90 to-transparent">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-600/20 border border-amber-500/50 flex items-center justify-center text-amber-400 font-black text-lg shadow-lg">
            📜
          </div>
          <div>
            <h1 className="font-serif font-black text-amber-400 text-lg tracking-wider uppercase">
              ANANTA ENGINE
            </h1>
            <p className="text-[10px] text-slate-400 font-mono">Real-Time 2D Generative RPG</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <LanguageSelector />

          {userEmail ? (
            <div className="flex items-center gap-3 bg-stone-900/80 px-3 py-1.5 rounded-xl border border-stone-800 text-xs">
              <span className="text-amber-400">👤 {userEmail}</span>
              <button
                onClick={() => supabase.auth.signOut()}
                className="text-red-400 hover:text-red-300 font-bold"
              >
                Logout
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsAuthOpen(true)}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-amber-950 font-bold text-xs rounded-xl shadow-lg transition"
            >
              🔑 Sign In
            </button>
          )}
        </div>
      </header>

      {/* 4. Main Page Screen Layout (Image 3 Left Parchment Menu Style) */}
      {fsmState === "IDLE" && (
        <main className="z-20 w-full max-w-6xl px-6 flex flex-col md:flex-row items-center justify-between gap-12 my-auto pt-16">

          {/* Left Side RPG Parchment Menu Panel (Image 3 Aesthetic) */}
          <div className="w-full md:w-[480px] bg-stone-900/90 border-2 border-amber-600/60 rounded-3xl p-8 shadow-[0_0_80px_rgba(0,0,0,0.95)] backdrop-blur-xl relative overflow-hidden">

            {/* Red Wax Seal Badge (Image 1 Style) */}
            <div className="absolute -top-3 -right-3 w-12 h-12 bg-red-700 rounded-full border-2 border-amber-400 shadow-xl flex items-center justify-center text-amber-200 text-xs font-black">
              📜
            </div>

            <div className="mb-6">
              <span className="text-[11px] font-mono text-amber-500 uppercase tracking-widest bg-amber-950/80 px-3 py-1 rounded-full border border-amber-800/60">
                Generative AI Studio
              </span>
              <h2 className="font-serif text-3xl font-extrabold text-amber-400 mt-3 tracking-tight">
                START YOUR ADVENTURE
              </h2>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                Describe a scene in one sentence to generate overworld maps, interior rooms, character spritesheets, and voice dialogue in 30 seconds.
              </p>
            </div>

            {/* Prompt Showcase Presets (Image 1 RPG Tabs) */}
            <div className="mb-5 space-y-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Featured World Presets
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {PROMPT_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setPromptInput(preset.prompt)}
                    className={`p-3 rounded-xl border text-left transition text-xs font-semibold ${promptInput === preset.prompt
                        ? "bg-amber-600/30 border-amber-400 text-amber-200 shadow-lg"
                        : "bg-stone-950/60 border-stone-800 text-slate-400 hover:border-amber-700/60"
                      }`}
                  >
                    {preset.title}
                  </button>
                ))}
              </div>
            </div>

            {/* Prompt Input Form */}
            <form onSubmit={handleCreateWorld} className="space-y-4">
              <div>
                <textarea
                  rows={3}
                  value={promptInput}
                  onChange={(e) => setPromptInput(e.target.value)}
                  placeholder="Describe your scene concept..."
                  className="w-full bg-stone-950/80 border border-amber-900/60 rounded-xl p-3.5 text-xs text-slate-100 placeholder-stone-600 focus:outline-none focus:border-amber-500 transition shadow-inner font-serif resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-400 text-amber-950 font-black text-sm uppercase tracking-widest rounded-xl shadow-[0_0_30px_rgba(245,158,11,0.4)] transition transform active:scale-98 flex items-center justify-center gap-2"
              >
                <span>⚔️</span> GENERATE & PLAY WORLD
              </button>
            </form>
          </div>

          {/* Right Side Parallax Creature Title Banner */}
          <div className="hidden md:flex flex-col items-start max-w-lg space-y-4">
            <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full text-amber-400 text-xs font-mono">
              <span>✨</span> Multi-Agent Generative Engine
            </div>
            <h1 className="font-serif text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-600 leading-tight">
              EVERY PIXEL GENERATED AT PLAYTIME.
            </h1>
            <p className="text-sm text-slate-400 leading-relaxed font-light">
              Experience dynamic spatial prefetching, vision-to-grid collision matrices, and regional voice streaming built for AgentOrchestrator(AO) hackathon.
            </p>
          </div>

        </main>
      )}

      {/* 5. World Generation Progress Screen */}
      {fsmState === "CREATING_WORLD" && (
        <div className="z-20 flex flex-col items-center justify-center p-8 bg-stone-900/90 border border-amber-500/40 rounded-3xl backdrop-blur-xl shadow-2xl text-center max-w-md animate-pulse">
          <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
          <h2 className="font-serif text-2xl font-bold text-amber-400 mb-2">SYNTHESIZING REALM...</h2>
          <p className="text-xs text-slate-300 font-mono">
            Generating overworld backdrop, $32 \times 32$ collision matrix, spatial prefetch interiors, and Sarvam voice pipeline.
          </p>
        </div>
      )}

      {/* 6. Active Game Canvas & HUD */}
      {(fsmState === "EXPLORING" ||
        fsmState === "DIALOGUE_ACTIVE" ||
        fsmState === "EVENT_TRIGGERED" ||
        fsmState === "PREFETCHING" ||
        fsmState === "FINALE_UNRAVELED" ||
        fsmState === "DEFEAT_CAPTURED") && (
          <div className="relative w-full h-full flex items-center justify-center z-10">
            <GameCanvas />
            <DialogueBox />
          </div>
        )}
    </div>
  );
};
