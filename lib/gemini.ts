import { GoogleGenAI } from "@google/genai";

// Initialize Gemini Client with provided Google API Key
export const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "AIzaSyDJb8TxZTfZIzdEj1ueD31SngzrKVUh9kc",
});

/**
 * Live Gemini 3.5 Flash Generation Endpoint for Game Bible & Scene Creation
 */
export async function generateGameBible(prompt: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `You are the lead narrative director of an isometric mystery adventure game.
      Premise: "${prompt}"
      Generate a structured JSON object for this game world:
      {
        "title": "Short evocative title",
        "ambient": "1 sentence describing the street setting",
        "clues": ["Clue 1 detail", "Clue 2 detail", "Clue 3 detail"],
        "secret": "The ultimate hidden truth unraveled at the finale"
      }`,
    });

    const text = response.text || "";
    const cleaned = text.replace(/```json|```/g, "").trim();
    return JSON.parse(cleaned);
  } catch (e) {
    console.warn("[Gemini API] Fallback to structured bible generator:", e);
    return {
      title: prompt.length > 20 ? prompt.substring(0, 20) + "..." : prompt,
      ambient: "Rain drips onto the wet asphalt as neon signs flicker overhead.",
      clues: [
        "The secret key is hidden under the iron chest near the docks.",
        "The spice merchant holds the ledger of past trades.",
        "The antique clockmaker knows who commissioned the golden box.",
      ],
      secret: "The tiffin box contains the lost deed to the Mumbai harbor harbor lights.",
    };
  }
}

/**
 * Live Imagen 3 Image Generation for Scene Backdrops
 */
export async function generateSceneImage(prompt: string, seed: string): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: process.env.IMAGE_MODEL || "gemini-2.5-flash-image",
      contents: `Isometric 2D game background art, ${prompt}, detailed pixel art digital illustration, retro RPG overworld map`,
      config: {
        responseModalities: ["IMAGE"],
      },
    });

    const parts = response.candidates?.[0]?.content?.parts ?? [];
    for (const part of parts) {
      if (part.inlineData?.data) {
        return `data:${part.inlineData.mimeType || "image/png"};base64,${part.inlineData.data}`;
      }
    }
  } catch (e) {
    console.warn("[Gemini Image API] Live generation fallback to local Champaner map:", e);
  }
  return "/fallback/champaner_overworld.png";
}

/**
 * Live Sarvam Bulbul v3 TTS API Call Function
 */
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
