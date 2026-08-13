"use client";

import React, { useState } from "react";
import { useGameStore, SupportedLanguage } from "../lib/store/useGameStore";
import { resolveLanguageProfile, fetchSarvamTTSStreamAndDownload } from "../i18n/LanguageRouter";
import { audioManager } from "../assets/audio/AudioManager";

export const DevAudioTester: React.FC = () => {
  const selectedLanguage = useGameStore((state) => state.selectedLanguage);
  const showToast = useGameStore((state) => state.showToast);
  const incrementApiCalls = useGameStore((state) => state.incrementApiCalls);

  const [testText, setTestText] = useState<string>(
    "A lantern-lit Chandni Chowk bazaar in 1650 during a heavy monsoon."
  );
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [lastAudioUrl, setLastAudioUrl] = useState<string | null>(null);

  const handleTestAudio = async (triggerDownload = false) => {
    setIsStreaming(true);
    showToast(`Streaming Sarvam TTS Audio (${selectedLanguage.toUpperCase()})...`, 2500);

    const profile = resolveLanguageProfile(selectedLanguage);
    incrementApiCalls(0.04);

    const { blob, downloadUrl } = await fetchSarvamTTSStreamAndDownload(
      testText,
      profile.speaker,
      profile.langCode,
      triggerDownload
    );

    setIsStreaming(false);

    if (blob && downloadUrl) {
      setLastAudioUrl(downloadUrl);
      await audioManager.playAudioBlob(blob);
      showToast(`✅ Audio Playing (${profile.region})`, 3000);
    } else {
      showToast("⚠️ Sarvam API limit reached — Audio fallback triggered.", 3000);
    }
  };

  return (
    <div className="mt-3 pt-3 border-t border-slate-800 text-xs">
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold text-amber-400">🎙️ External Sarvam Audio Tester</span>
        <span className="text-[10px] text-slate-500 font-mono">POST https://api.sarvam.ai</span>
      </div>

      <input
        type="text"
        value={testText}
        onChange={(e) => setTestText(e.target.value)}
        className="w-full bg-slate-950 border border-slate-700/70 rounded px-2 py-1 text-slate-200 text-xs mb-2 focus:outline-none focus:border-amber-500"
        placeholder="Enter sentence to test Sarvam TTS..."
      />

      <div className="flex items-center gap-2">
        <button
          onClick={() => handleTestAudio(false)}
          disabled={isStreaming}
          className="flex-1 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold px-3 py-1 rounded transition disabled:opacity-50"
        >
          {isStreaming ? "Streaming..." : "▶️ Stream Sarvam Audio"}
        </button>

        <button
          onClick={() => handleTestAudio(true)}
          disabled={isStreaming}
          className="bg-slate-800 hover:bg-slate-700 border border-amber-500/50 text-amber-400 font-semibold px-2.5 py-1 rounded transition"
          title="Stream and download .wav audio file"
        >
          ⬇️ Download .wav
        </button>
      </div>

      {lastAudioUrl && (
        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
          <span>Audio Ready:</span>
          <a
            href={lastAudioUrl}
            download={`sarvam_test_${selectedLanguage}_${Date.now()}.wav`}
            className="text-amber-400 underline hover:text-amber-300"
          >
            Direct File Download Link
          </a>
        </div>
      )}
    </div>
  );
};
