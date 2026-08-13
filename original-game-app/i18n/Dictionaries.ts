import { SupportedLanguage } from "../store/slices/i18nSlice";

export interface TranslationDictionary {
  inspectPrompt: string;
  speakPrompt: string;
  exitPrompt: string;
  journalTitle: string;
  telemetryTitle: string;
  newGameBtn: string;
  journalBtn: string;
}

export const REGIONAL_DICTIONARIES: Record<SupportedLanguage, TranslationDictionary> = {
  en: {
    inspectPrompt: "Press E to inspect",
    speakPrompt: "Press E to speak",
    exitPrompt: "Press E to exit",
    journalTitle: "Detective Journal",
    telemetryTitle: "AI Telemetry Engine",
    newGameBtn: "New Game",
    journalBtn: "Journal",
  },
  hi: {
    inspectPrompt: "जांचने के लिए E दबाएं",
    speakPrompt: "बात करने के लिए E दबाएं",
    exitPrompt: "बाहर निकलने के लिए E दबाएं",
    journalTitle: "जासूस की डायरी",
    telemetryTitle: "एआई टेलीमेट्री इंजन",
    newGameBtn: "नया खेल",
    journalBtn: "डायरी",
  },
  mr: {
    inspectPrompt: "तपासण्यासाठी E दाबा",
    speakPrompt: "बोलण्यासाठी E दाबा",
    exitPrompt: "बाहेर पडण्यासाठी E दाबा",
    journalTitle: "तपासणी नोंदवही",
    telemetryTitle: "एआय टेलिमेट्री इंजिन",
    newGameBtn: "नवीन खेळ",
    journalBtn: "नोंदवही",
  },
  ta: {
    inspectPrompt: "ஆராய E அழுத்தவும்",
    speakPrompt: "பேச E அழுத்தவும்",
    exitPrompt: "வெளியேற E அழுத்தவும்",
    journalTitle: "துப்பறியும் நாட்குறிப்பு",
    telemetryTitle: "ஏஐ டெலிமெட்ரி எஞ்சின்",
    newGameBtn: "புதிய விளையாட்டு",
    journalBtn: "நாட்குறிப்பு",
  },
  kn: {
    inspectPrompt: "ಪರಿಶೀಲಿಸಲು E ಒತ್ತಿ",
    speakPrompt: "ಮಾತನಾಡಲು E ಒತ್ತಿ",
    exitPrompt: "ಹೊರಹೋಗಲು E ಒತ್ತಿ",
    journalTitle: "ಪತ್ತೇದಾರಿ ಜರ್ನಲ್",
    telemetryTitle: "ಎಐ ಟೆಲಿಮೆಟ್ರಿ ಎಂಜಿನ್",
    newGameBtn: "ಹೊಸ ಆಟ",
    journalBtn: "ಜರ್ನಲ್",
  },
};

export function getDictionary(lang: SupportedLanguage = "en"): TranslationDictionary {
  return REGIONAL_DICTIONARIES[lang] || REGIONAL_DICTIONARIES.en;
}
