import { GoogleGenAI } from "@google/genai";

export const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "AIzaSyDJb8TxZTfZIzdEj1ueD31SngzrKVUh9kc",
});

export async function fetchSarvamTTS(
  text: string,
  speaker: string = "kavya",
  langCode: string = "hi-IN"
): Promise<Blob | null> {
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
        target_language_code: langCode,
        speaker: speaker || "kavya",
        pace: 1.0,
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
        return new Blob([byteArray], { type: "audio/wav" });
      }
    }
  } catch (e) {
    console.warn("[Sarvam TTS] API streaming fallback:", e);
  }
  return null;
}
