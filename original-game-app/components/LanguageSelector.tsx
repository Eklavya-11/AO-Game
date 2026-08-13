"use client";

import React from "react";
import { useGameStore, SupportedLanguage } from "../lib/store/useGameStore";

export const LANGUAGE_OPTIONS: { code: SupportedLanguage; label: string; flag: string }[] = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "hi", label: "हिंदी (Hindi)", flag: "🇮🇳" },
  { code: "mr", label: "मराठी (Marathi)", flag: "🇮🇳" },
  { code: "ta", label: "தமிழ் (Tamil)", flag: "🇮🇳" },
  { code: "kn", label: "ಕನ್ನಡ (Kannada)", flag: "🇮🇳" },
];

export const LanguageSelector: React.FC = () => {
  const selectedLanguage = useGameStore((state) => state.selectedLanguage);
  const setSelectedLanguage = useGameStore((state) => state.setSelectedLanguage);

  return (
    <div className="relative inline-flex items-center gap-2 bg-slate-900/90 border border-slate-700/80 rounded-lg px-3 py-1.5 backdrop-blur-md shadow-lg">
      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">🌐 Voice & UI:</span>
      <select
        value={selectedLanguage}
        onChange={(e) => setSelectedLanguage(e.target.value as SupportedLanguage)}
        className="bg-transparent text-amber-400 font-medium text-xs focus:outline-none cursor-pointer pr-1"
      >
        {LANGUAGE_OPTIONS.map((lang) => (
          <option key={lang.code} value={lang.code} className="bg-slate-900 text-slate-100">
            {lang.flag} {lang.label}
          </option>
        ))}
      </select>
    </div>
  );
};
