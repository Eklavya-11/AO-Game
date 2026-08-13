import { SupportedLanguage } from "../store/slices/i18nSlice";

export type RegionalVoiceProfile = {
  speaker: string;
  langCode: string;
  region: string;
};

export const LANGUAGE_SPEAKER_MAP: Record<SupportedLanguage, RegionalVoiceProfile> = {
  en: { speaker: "kavya", langCode: "hi-IN", region: "Indian English" },
  hi: { speaker: "rahul", langCode: "hi-IN", region: "Hindi" },
  mr: { speaker: "kavya", langCode: "hi-IN", region: "Marathi Accent" },
  ta: { speaker: "anushka", langCode: "ta-IN", region: "Tamil" },
  kn: { speaker: "aditya", langCode: "kn-IN", region: "Kannada" },
};

export function resolveLanguageProfile(lang: SupportedLanguage): RegionalVoiceProfile {
  return LANGUAGE_SPEAKER_MAP[lang] || LANGUAGE_SPEAKER_MAP.en;
}

/**
 * Sarvam Bulbul Regional Voice Router based on prompt location keywords
 */
export function resolveRegionalVoice(promptOrTitle: string): RegionalVoiceProfile {
  const text = promptOrTitle.toLowerCase();

  if (text.includes("chennai") || text.includes("madras") || text.includes("tamil")) {
    return LANGUAGE_SPEAKER_MAP.ta;
  }
  if (text.includes("bengaluru") || text.includes("bangalore") || text.includes("karnataka") || text.includes("kannada")) {
    return LANGUAGE_SPEAKER_MAP.kn;
  }
  if (text.includes("mumbai") || text.includes("maharashtra") || text.includes("pune") || text.includes("marathi")) {
    return LANGUAGE_SPEAKER_MAP.mr;
  }
  if (text.includes("delhi") || text.includes("north") || text.includes("hindi")) {
    return LANGUAGE_SPEAKER_MAP.hi;
  }

  return LANGUAGE_SPEAKER_MAP.en;
}

/**
 * Executes an explicit HTTP POST request to Sarvam Bulbul v3 TTS API with audio stream download functionality.
 */
export async function fetchSarvamTTSStreamAndDownload(
  text: string,
  speaker: string = "kavya",
  langCode: string = "hi-IN",
  triggerBrowserDownload: boolean = false
): Promise<{ blob: Blob | null; downloadUrl: string | null }> {
  const sarvamKey = process.env.SARVAM_API_KEY || "sk_w92tgqd1_U880daYuWPpyjkxNqD64cd6A";

  try {
    const res = await fetch("https://api.sarvam.ai/text-to-speech", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-subscription-key": sarvamKey,
      },
      body: JSON.stringify({
        inputs: [text],
        text: text,
        target_language_code: langCode,
        speaker: speaker || "kavya",
        pitch: 0,
        pace: 1.0,
        loudness: 1.5,
        speech_sample_rate: 22050,
        enable_preprocessing: true,
        model: "bulbul:v3",
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.audios && data.audios[0]) {
        const byteCharacters = atob(data.audios[0]);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: "audio/wav" });
        const downloadUrl = URL.createObjectURL(blob);

        if (triggerBrowserDownload && typeof window !== "undefined") {
          const a = document.createElement("a");
          a.href = downloadUrl;
          a.download = `sarvam_audio_${langCode}_${Date.now()}.wav`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }

        return { blob, downloadUrl };
      }
    }
  } catch (e) {
    console.warn("[Sarvam TTS Stream] Explicit POST error:", e);
  }

  return { blob: null, downloadUrl: null };
}
