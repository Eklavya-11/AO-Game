/**
 * HTML5 Web Audio Engine & Autoplay Unlock Manager for Ananta Engine
 */

class VoiceEngineManager {
  private audioCtx: AudioContext | null = null;
  private isUnlocked: boolean = false;
  private currentAudio: HTMLAudioElement | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      const unlockEvents = ["keydown", "mousedown", "touchstart", "pointerdown"];
      const unlockHandler = () => {
        this.unlockAudioContext();
        unlockEvents.forEach((evt) => window.removeEventListener(evt, unlockHandler));
      };
      unlockEvents.forEach((evt) => window.addEventListener(evt, unlockHandler, { once: true }));
    }
  }

  public unlockAudioContext() {
    if (this.isUnlocked) return;
    try {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        if (!this.audioCtx) {
          this.audioCtx = new AudioCtxClass();
        }
        if (this.audioCtx.state === "suspended") {
          this.audioCtx.resume();
        }
      }
      this.isUnlocked = true;
    } catch (e) {
      console.warn("[VoiceEngine] AudioContext unlock attempt:", e);
    }
  }

  public async playVoiceBlob(blob: Blob): Promise<boolean> {
    this.unlockAudioContext();

    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }

    try {
      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);
      this.currentAudio = audio;

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        await playPromise;
      }
      return true;
    } catch (e) {
      console.warn("[VoiceEngine] HTML5 Audio play rejected. Attempting Web Audio API decode:", e);

      if (this.audioCtx) {
        try {
          const arrayBuffer = await blob.arrayBuffer();
          const audioBuffer = await this.audioCtx.decodeAudioData(arrayBuffer);
          const source = this.audioCtx.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(this.audioCtx.destination);
          source.start(0);
          return true;
        } catch (webAudioErr) {
          console.warn("[VoiceEngine] Web Audio API decode failed:", webAudioErr);
        }
      }
      return false;
    }
  }

  public stopCurrentVoice() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }
  }

  public speakSpeechSynthesis(text: string, langCode: string = "hi-IN"): boolean {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return false;

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = langCode || "hi-IN";
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      const triggerSpeak = () => {
        const voices = window.speechSynthesis.getVoices();
        const langPrefix = langCode.split("-")[0];
        const regionalVoice =
          voices.find((v) => v.lang.startsWith(langPrefix)) ||
          voices.find((v) => v.lang.includes("en-IN") || v.lang.includes("hi"));

        if (regionalVoice) {
          utterance.voice = regionalVoice;
        }
        window.speechSynthesis.speak(utterance);
      };

      if (window.speechSynthesis.getVoices().length > 0) {
        triggerSpeak();
      } else {
        window.speechSynthesis.onvoiceschanged = () => {
          triggerSpeak();
          window.speechSynthesis.onvoiceschanged = null;
        };
      }
      return true;
    } catch (e) {
      console.warn("[VoiceEngine] Native SpeechSynthesis fallback error:", e);
      return false;
    }
  }

  public getUnlockedStatus(): boolean {
    return this.isUnlocked;
  }
}

export const voiceEngine = new VoiceEngineManager();
