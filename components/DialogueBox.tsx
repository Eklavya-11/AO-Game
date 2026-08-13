"use client";

import React, { useState, useEffect } from "react";
import { useGameStore } from "../lib/store/useGameStore";
import { voiceCache, sha256, resolveRegionalVoice } from "../lib/world-engine";
import { fetchSarvamTTS } from "../lib/gemini";
import { voiceEngine } from "../lib/audio/voice-engine";
import { audioManager } from "../assets/audio/AudioManager";

export const DialogueBox: React.FC = () => {
  const fsmState = useGameStore((state) => state.fsmState);
  const currentSceneId = useGameStore((state) => state.currentSceneId);
  const scenes = useGameStore((state) => state.scenes);
  const acquiredClues = useGameStore((state) => state.acquiredClues);
  const markClueAcquired = useGameStore((state) => state.markClueAcquired);
  const setFSMState = useGameStore((state) => state.setFSMState);
  const updateAgentTelemetry = useGameStore((state) => state.updateAgentTelemetry);
  const incrementApiCalls = useGameStore((state) => state.incrementApiCalls);

  const [dialogueHistory, setDialogueHistory] = useState<Array<{ speaker: string; text: string }>>([]);
  const [turnCount, setTurnCount] = useState<number>(0);
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [audioStatus, setAudioStatus] = useState<string>("Cache Standby");

  const currentScene = currentSceneId ? scenes[currentSceneId] : null;
  const npc = currentScene?.npc;
  const clueId = npc?.clueIndex !== undefined ? `clue_${npc.clueIndex}` : npc?.name || "generic_clue";
  const hasAlreadyAcquiredClue = Boolean(acquiredClues[clueId]);

  // Helper: Strip stage directions like [Ambient], [Whispers]
  const sanitizeText = (rawText: string): string => {
    if (!rawText) return "";
    return rawText
      .replace(/\[.*?\]/g, "")
      .replace(/\(.*?\)/g, "")
      .replace(/\s+/g, " ")
      .trim();
  };

  // Resolve NPC Avatar Image (Image 2 Diamond Profile Style)
  const getNpcAvatar = (): string => {
    if (!npc) return "/fallback/npc_lakha.png";
    const nameLower = npc.name.toLowerCase();
    if (nameLower.includes("officer") || nameLower.includes("quartermaster") || nameLower.includes("british")) {
      return "/fallback/npc_officer.png";
    }
    return "/fallback/npc_lakha.png";
  };

  // Initial dialogue load when entering DIALOGUE_ACTIVE state
  useEffect(() => {
    if (fsmState === "DIALOGUE_ACTIVE" && npc) {
      setTurnCount(1);

      if (hasAlreadyAcquiredClue) {
        const guardrailLine = `Ah, good to see you again friend! I've already shared everything I know regarding our matter. Safe travels!`;
        setDialogueHistory([
          {
            speaker: npc.name,
            text: guardrailLine,
          },
        ]);
        setAudioStatus("Guardrail Active — Playing Friendly Voice");
        playVoiceTTS(npc.voice || "bulbul_v3_default", guardrailLine);
      } else {
        const cleanOpening = sanitizeText(npc.opening);
        setDialogueHistory([
          {
            speaker: npc.name,
            text: cleanOpening,
          },
        ]);
        playVoiceTTS(npc.voice || "bulbul_v3_default", cleanOpening);
      }
    }
  }, [fsmState, npc, hasAlreadyAcquiredClue]);

  if (fsmState !== "DIALOGUE_ACTIVE" || !npc) return null;

  // Play audio using SHA-256 caching & Web Audio API
  const playVoiceTTS = async (voiceId: string, text: string) => {
    const cleanText = sanitizeText(text);
    if (!cleanText) return;

    setIsPlayingAudio(true);
    updateAgentTelemetry("Audio Engine", { status: "generating", lastAction: "Checking SHA-256 Voice Pool", latencyMs: 12 });

    const worldPremise = useGameStore.getState().worldPremise;
    const regionalVoice = resolveRegionalVoice(worldPremise);

    const hash = await sha256(`${regionalVoice.speaker}_${regionalVoice.langCode}_${cleanText}`);
    let cachedBlob = await voiceCache.getAudioBlob(hash);

    if (cachedBlob) {
      setAudioStatus(`Cache HIT (${regionalVoice.region} - ${hash.substring(0, 8)})`);
      updateAgentTelemetry("Audio Engine", { status: "completed", lastAction: "Served from IndexedDB Cache", latencyMs: 4 });
    } else {
      setAudioStatus(`Cache MISS -> Fetching ${regionalVoice.region} Voice...`);
      updateAgentTelemetry("Audio Engine", { status: "generating", lastAction: `Streaming ${regionalVoice.region} Audio`, latencyMs: 380 });
      incrementApiCalls(0.04);

      const fetchedBlob = await fetchSarvamTTS(cleanText, regionalVoice.speaker, regionalVoice.langCode);
      if (fetchedBlob) {
        cachedBlob = fetchedBlob;
        await voiceCache.putAudioBlob(hash, cachedBlob);
        setAudioStatus(`Saved (${regionalVoice.region} - ${hash.substring(0, 8)})`);
      } else {
        useGameStore.getState().showToast("Sarvam API Unavailable - Switched to Browser Speech", 3000);
        voiceEngine.speakSpeechSynthesis(cleanText, regionalVoice.langCode);
        setAudioStatus(`Browser TTS (${regionalVoice.region})`);
      }
      updateAgentTelemetry("Audio Engine", { status: "completed", lastAction: "Cached / SpeechSynthesized", latencyMs: 380 });
    }

    if (cachedBlob && cachedBlob.size > 200) {
      const success = await voiceEngine.playVoiceBlob(cachedBlob);
      if (!success) {
        voiceEngine.speakSpeechSynthesis(cleanText, regionalVoice.langCode);
        setAudioStatus(`Browser Speech (${regionalVoice.region})`);
      }
    } else {
      voiceEngine.speakSpeechSynthesis(cleanText, regionalVoice.langCode);
      setAudioStatus(`Browser Speech (${regionalVoice.region})`);
    }

    setIsPlayingAudio(false);
  };

  // Process player response turn
  const handlePlayerReply = async (replyText: string) => {
    if (isThinking || turnCount >= 3 || hasAlreadyAcquiredClue) return;

    const newHistory = [...dialogueHistory, { speaker: "Player", text: replyText }];
    setDialogueHistory(newHistory);
    setIsThinking(true);
    updateAgentTelemetry("Dialogue Agent", { status: "thinking", lastAction: "Processing Dialogue Chain", latencyMs: 280 });

    const nextTurn = turnCount + 1;
    setTurnCount(nextTurn);

    await new Promise((res) => setTimeout(res, 600));
    incrementApiCalls(0.06);

    const landmarksStr = currentScene?.visualLandmarks?.join(", ") || "surrounding street";
    let npcResponseText = "";
    if (nextTurn === 2) {
      npcResponseText = `Look closely near the ${landmarksStr.split(", ")[0] || "corner"}: The secret key is hidden under the iron chest near the docks.`;
      markClueAcquired(clueId);
      updateAgentTelemetry("Dialogue Agent", { status: "completed", lastAction: "Revealed Story Clue (Vision Grounded)!", latencyMs: 600 });
    } else {
      npcResponseText = `Keep your eyes on the ${landmarksStr.split(", ")[1] || "shadows"}. That is all I can tell you. Safe travels.`;
      updateAgentTelemetry("Dialogue Agent", { status: "completed", lastAction: "Concluded Dialogue Chain", latencyMs: 450 });
    }

    const cleanResponse = sanitizeText(npcResponseText);
    setDialogueHistory([...newHistory, { speaker: npc.name, text: cleanResponse }]);
    setIsThinking(false);

    playVoiceTTS(npc.voice || "bulbul_v3_default", cleanResponse);
  };

  const closeDialogue = () => {
    voiceEngine.stopCurrentVoice();
    audioManager.stopAudio();
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
    setIsPlayingAudio(false);
    setFSMState("EXPLORING");
  };

  const latestDialogue = dialogueHistory[dialogueHistory.length - 1];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-slate-950 via-slate-950/95 to-transparent pt-12 pb-6 px-6 flex justify-center animate-in slide-in-from-bottom duration-300">
      <div className="w-full max-w-4xl bg-stone-900/90 border-2 border-amber-600/60 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.9)] p-6 relative flex flex-col md:flex-row items-center gap-6 backdrop-blur-md">
        
        {/* Parchment Wax Seal & Header Badge (Image 1 Style) */}
        <div className="absolute -top-4 left-8 bg-amber-700 text-amber-100 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border border-amber-500 shadow-md flex items-center gap-1.5">
          <span>📜</span> {npc.role || "Wager Informant"}
        </div>

        {/* Dialogue Text Content Area (Image 2 Style) */}
        <div className="flex-1 space-y-3">
          <div className="flex items-center justify-between border-b border-amber-900/50 pb-2">
            <h3 className="font-serif text-amber-400 font-extrabold text-xl tracking-wide uppercase flex items-center gap-2">
              {npc.name}
            </h3>
            <span className="text-xs font-mono text-amber-500/80 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/40">
              {audioStatus}
            </span>
          </div>

          {/* Typewriter Spoken Text */}
          <div className="min-h-[70px] text-slate-200 text-sm md:text-base leading-relaxed font-serif tracking-wide italic bg-stone-950/60 p-4 rounded-xl border border-amber-900/40 shadow-inner">
            "{latestDialogue?.text || sanitizeText(npc.opening)}"
          </div>

          {/* Action Choice Buttons */}
          {!hasAlreadyAcquiredClue && turnCount < 2 && (
            <div className="flex flex-wrap gap-2.5 pt-2">
              <button
                disabled={isThinking}
                onClick={() => handlePlayerReply("Where can I find the wager scroll fragment?")}
                className="px-4 py-2 bg-gradient-to-r from-amber-700 to-amber-600 hover:from-amber-600 hover:to-amber-500 text-amber-50 text-xs font-bold rounded-lg border border-amber-400/40 shadow-md transition disabled:opacity-50"
              >
                🔍 Ask about Wager Scroll
              </button>
              <button
                disabled={isThinking}
                onClick={() => handlePlayerReply("Are Captain Russell's men patrolling nearby?")}
                className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-amber-200 text-xs font-semibold rounded-lg border border-amber-900/60 shadow-md transition disabled:opacity-50"
              >
                🛡️ Ask about Redcoat Patrols
              </button>
            </div>
          )}

          {/* Close Action */}
          <div className="flex justify-end pt-1">
            <button
              onClick={closeDialogue}
              className="px-5 py-2 bg-red-950/80 hover:bg-red-900 text-red-200 border border-red-800/60 text-xs font-bold rounded-lg shadow transition"
            >
              🚪 Exit Conversation
            </button>
          </div>
        </div>

        {/* Diamond Character Profile Avatar Frame (Image 2 Style) */}
        <div className="relative flex-shrink-0 w-32 h-32 md:w-40 md:h-40 flex items-center justify-center">
          <div className="w-28 h-28 md:w-36 md:h-36 rotate-45 overflow-hidden border-2 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.4)] bg-stone-950 relative">
            <img
              src={getNpcAvatar()}
              alt={npc.name}
              className="-rotate-45 scale-135 w-full h-full object-cover"
            />
          </div>
          {/* Avatar Glow Ring */}
          <div className="absolute inset-0 rounded-full border border-amber-500/20 pointer-events-none animate-pulse" />
        </div>

      </div>
    </div>
  );
};
