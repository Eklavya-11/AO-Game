import { ai } from "../../assets/audio/SarvamTTS"; // Uses GoogleGenAI client initialized in gemini.ts / SarvamTTS facade

export interface GameBibleData {
  title: string;
  ambient: string;
  clues: string[];
  secret: string;
}

export async function generateGameBible(prompt: string): Promise<GameBibleData> {
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
    console.warn("[BibleGenerator] Fallback to structured bible generator:", e);
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
