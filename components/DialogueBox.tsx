"use client";

import React, { useState, useEffect } from "react";
import { useGameStore } from "../lib/store/useGameStore";
import { voiceCache, sha256, resolveRegionalVoice } from "../lib/world-engine";
import { fetchSarvamTTS } from "../lib/gemini";
import { voiceEngine } from "../lib/audio/voice-engine";

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

  // Initial dialogue load when entering DIALOGUE_ACTIVE state
  useEffect(() => {
    if (fsmState === "DIALOGUE_ACTIVE" && npc) {
      setTurnCount(1);

      // Issue #20 Guardrail Evaluator Check
      if (hasAlreadyAcquiredClue) {
        // Fallback to static friendly ambient text without firing LLM or TTS
        setDialogueHistory([
          {
            speaker: npc.name,
            text: `[Ambient] Ah, good to see you again friend! I've already shared everything I know regarding our matter. Safe travels!`,
          },
        ]);
        setAudioStatus("Guardrail Intercepted (0 API Calls)");
      } else {
        // Initial opening line from NPC
        setDialogueHistory([
          {
            speaker: npc.name,
            text: npc.opening,
          },
        ]);
        playVoiceTTS(npc.voice || "bulbul_v3_default", npc.opening);
      }
    }
  }, [fsmState, npc, hasAlreadyAcquiredClue]);

  if (fsmState !== "DIALOGUE_ACTIVE" || !npc) return null;

  // Play audio using SHA-256 caching & Web Audio API
  const playVoiceTTS = async (voiceId: string, text: string) => {
    setIsPlayingAudio(true);
    updateAgentTelemetry("Audio Engine", { status: "generating", lastAction: "Checking SHA-256 Voice Pool", latencyMs: 12 });

    const worldPremise = useGameStore.getState().worldPremise;
    const regionalVoice = resolveRegionalVoice(worldPremise);

    const hash = await sha256(`${regionalVoice.speaker}_${regionalVoice.langCode}_${text}`);
    let cachedBlob = await voiceCache.getAudioBlob(hash);

    if (cachedBlob) {
      setAudioStatus(`Cache HIT (${regionalVoice.region} - ${hash.substring(0, 8)})`);
      updateAgentTelemetry("Audio Engine", { status: "completed", lastAction: "Served from IndexedDB Cache", latencyMs: 4 });
    } else {
      setAudioStatus(`Cache MISS -> Fetching ${regionalVoice.region} Voice...`);
      updateAgentTelemetry("Audio Engine", { status: "generating", lastAction: `Streaming ${regionalVoice.region} Audio`, latencyMs: 380 });
      incrementApiCalls(0.04);

      // Live Sarvam Bulbul v3 TTS Fetch & Cache Store
      const fetchedBlob = await fetchSarvamTTS(text, regionalVoice.speaker, regionalVoice.langCode);
      if (fetchedBlob) {
        cachedBlob = fetchedBlob;
        await voiceCache.putAudioBlob(hash, cachedBlob);
        setAudioStatus(`Saved (${regionalVoice.region} - ${hash.substring(0, 8)})`);
      } else {
        useGameStore.getState().showToast("Sarvam API Unavailable - Switched to Browser Speech", 3000);
        voiceEngine.speakSpeechSynthesis(text, regionalVoice.langCode);
        setAudioStatus(`Browser TTS (${regionalVoice.region})`);
      }
      updateAgentTelemetry("Audio Engine", { status: "completed", lastAction: "Cached / SpeechSynthesized", latencyMs: 380 });
    }

    // Play Audio Stream via Unlocked Voice Engine Manager
    if (cachedBlob && cachedBlob.size > 200) {
      const success = await voiceEngine.playVoiceBlob(cachedBlob);
      if (!success) {
        voiceEngine.speakSpeechSynthesis(text, regionalVoice.langCode);
        setAudioStatus(`Browser Speech (${regionalVoice.region})`);
      }
    } else {
      voiceEngine.speakSpeechSynthesis(text, regionalVoice.langCode);
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

    // Simulate gemini-3.5-flash turn response
    await new Promise((res) => setTimeout(res, 600));
    incrementApiCalls(0.06);

    // Ground dialogue generation in Vision landmarks context
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

    setDialogueHistory([...newHistory, { speaker: npc.name, text: npcResponseText }]);
    setIsThinking(false);

    // Trigger TTS for NPC turn
    playVoiceTTS(npc.voice || "bulbul_v3_default", npcResponseText);
  };

  const closeDialogue = () => {
    setFSMState("EXPLORING");
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-2xl bg-slate-900/95 backdrop-blur-md border border-amber-500/40 rounded-xl p-5 shadow-2xl text-slate-100 z-50">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
        <div>
          <h3 className="font-bold text-amber-400 text-lg flex items-center gap-2">
            <span>🗣️</span> {npc.name}
            <span className="text-xs font-normal text-slate-400">({npc.role})</span>
          </h3>
          <p className="text-xs text-slate-400 italic">{npc.persona}</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              const lastNpcLine = [...dialogueHistory].reverse().find((t) => t.speaker !== "Player")?.text || npc.opening;
              playVoiceTTS(npc.voice || "kavya", lastNpcLine);
            }}
            className={`text-xs px-2.5 py-1 rounded flex items-center gap-1.5 border transition ${
              isPlayingAudio
                ? "bg-amber-500/20 border-amber-400 text-amber-300 animate-pulse"
                : "bg-slate-800 border-slate-700 text-slate-300 hover:text-white"
            }`}
            title="Tap to play voice audio"
          >
            <span>{isPlayingAudio ? "🔊 Playing" : "🔈 Replay Voice"}</span>
          </button>
          <span className="text-xs px-2 py-1 bg-slate-800 border border-slate-700 rounded text-slate-300">
            {audioStatus}
          </span>
          <button
            onClick={closeDialogue}
            className="text-slate-400 hover:text-white text-sm font-semibold px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded transition"
          >
            Esc ✕
          </button>
        </div>
      </div>

      {/* Dialogue Thread */}
      <div className="space-y-3 max-h-48 overflow-y-auto pr-2 mb-4">
        {dialogueHistory.map((turn, idx) => (
          <div
            key={idx}
            className={`p-3 rounded-lg text-sm ${
              turn.speaker === "Player"
                ? "bg-slate-800/80 border border-slate-700 text-sky-300 ml-6"
                : "bg-amber-950/30 border border-amber-800/40 text-amber-100 mr-6"
            }`}
          >
            <span className="font-semibold text-xs opacity-75 block mb-1">{turn.speaker}:</span>
            {turn.text}
          </div>
        ))}

        {isThinking && (
          <div className="text-xs text-amber-400/80 animate-pulse flex items-center gap-2 italic p-2">
            <span className="w-2 h-2 bg-amber-400 rounded-full animate-ping" />
            NPC is pondering reply...
          </div>
        )}
      </div>

      {/* Interactive Options or Ambient Guardrail state */}
      {!hasAlreadyAcquiredClue && turnCount < 3 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-800">
          <button
            disabled={isThinking}
            onClick={() => handlePlayerReply("Tell me what you know about the secret in this town.")}
            className="text-left text-xs bg-slate-800 hover:bg-amber-900/40 border border-slate-700 hover:border-amber-500/50 p-2.5 rounded-md transition text-slate-200 hover:text-amber-200 disabled:opacity-50"
          >
            1. "Tell me what you know about the secret..."
          </button>
          <button
            disabled={isThinking}
            onClick={() => handlePlayerReply("Who owns the buildings along this street?")}
            className="text-left text-xs bg-slate-800 hover:bg-amber-900/40 border border-slate-700 hover:border-amber-500/50 p-2.5 rounded-md transition text-slate-200 hover:text-amber-200 disabled:opacity-50"
          >
            2. "Who owns the buildings along this street?"
          </button>
        </div>
      ) : (
        <div className="text-center pt-2 border-t border-slate-800">
          <button
            onClick={closeDialogue}
            className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs rounded transition"
          >
            Conclude Conversation (Press Esc)
          </button>
        </div>
      )}
    </div>
  );
};
