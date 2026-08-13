import { StateCreator } from "zustand";

export type SupportedLanguage = "en" | "hi" | "mr" | "ta" | "kn";

export interface I18nSlice {
  selectedLanguage: SupportedLanguage;
  setSelectedLanguage: (lang: SupportedLanguage) => void;
}

export const createI18nSlice: StateCreator<I18nSlice> = (set) => ({
  selectedLanguage: "en",
  setSelectedLanguage: (lang: SupportedLanguage) => set({ selectedLanguage: lang }),
});
