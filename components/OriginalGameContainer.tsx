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
import { AuthModal } from "./AuthModal";

export const OriginalGameContainer: React.FC = () => {
  const [promptInput, setPromptInput] = useState<string>(
    "a rain-flooded night market in Mumbai, carrying a secret tiffin box"
  );
  const [shareModalCode, setShareModalCode] = useState<string | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const fsmState = useGameStore((state) => state.fsmState);
  const resetEngine = useGameStore((state) => state.resetEngine);

  // Initialize Auth state listener
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

  // Initialize Director Agent Watcher
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
      {/* Telemetry, Journal, Minimap & Finale Overlays */}
      <TelemetryHUD />
      <JournalModal />
      <Minimap />
      <FinaleModal />
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />

      {/* Main Game Interface based on FSM State */}
      {fsmState === "IDLE" || fsmState === "CREATING_WORLD" ? (
        <div className="w-full max-w-xl p-8 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl text-center backdrop-blur-md">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-mono text-slate-400">
              {userEmail ? `Logged in: ${userEmail}` : "Guest Mode"}
            </span>
            <button
              onClick={() => (userEmail ? supabase.auth.signOut() : setIsAuthOpen(true))}
              className="text-xs px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-amber-400 font-mono transition"
            >
              {userEmail ? "Sign Out" : "🔑 Sign In"}
            </button>
          </div>

          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-sky-400 mb-2">
            OriginalGame Engine
          </h1>
          <p className="text-xs text-slate-400 mb-6">
            Real-Time Procedural 2D Generative AI Engine — Powered by Gemini 3.5 & Sarvam TTS
          </p>

          <form onSubmit={handleCreateWorld} className="space-y-4">
            <textarea
              rows={3}
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              disabled={fsmState === "CREATING_WORLD"}
              placeholder="Describe your world premise..."
              className="w-full p-3.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/60 transition resize-none disabled:opacity-50"
            />

            <button
              type="submit"
              disabled={fsmState === "CREATING_WORLD"}
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm rounded-xl shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {fsmState === "CREATING_WORLD" ? (
                <>
                  <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  Generating World & Scenes...
                </>
              ) : (
                "Generate & Launch World"
              )}
            </button>
          </form>
        </div>
      ) : (
        <div className="relative w-full h-full flex flex-col items-center justify-center">
          {/* Top Reset & Share Buttons */}
          <div className="fixed top-72 left-52 z-40 flex items-center gap-2">
            <button
              onClick={resetEngine}
              className="bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs px-3 py-2 rounded-lg shadow-md transition"
            >
              🔄 New Game
            </button>
            <button
              onClick={() => {
                const code = generateShareCode();
                navigator.clipboard?.writeText(code);
                setShareModalCode(code);
              }}
              className="bg-slate-900/90 hover:bg-slate-800 border border-sky-500/40 text-sky-300 text-xs px-3 py-2 rounded-lg shadow-md transition flex items-center gap-1.5"
            >
              <span>🔗</span> Share Code
            </button>
          </div>

          {/* Share Code Modal */}
          {shareModalCode && (
            <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-sky-500/40 rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl">
                <h3 className="text-lg font-bold text-sky-400 mb-1">Share World Code</h3>
                <p className="text-xs text-slate-400 mb-4">Send this 6-character room code to friends to let them join and play your world storyline.</p>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-2xl font-mono tracking-widest text-amber-400 font-bold mb-4">
                  {shareModalCode}
                </div>
                <p className="text-[10px] text-emerald-400 mb-4">✓ Copied to clipboard!</p>
                <button
                  onClick={() => setShareModalCode(null)}
                  className="w-full py-2 bg-sky-600 hover:bg-sky-500 text-slate-950 font-bold text-xs rounded-xl transition"
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {/* Canvas Subsystem */}
          <GameCanvas />

          {/* Dialogue System */}
          <DialogueBox />
        </div>
      )}
    </div>
  );
};
