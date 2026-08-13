/**
 * Ananta Engine — Consolidated Audio Manager
 * Manages HTML5 Web Audio AudioContext unlock on initial user gesture, SHA-256 hashing, and IndexedDB caching.
 */

export async function computeSHA256(text: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export class AudioManager {
  private static instance: AudioManager;
  private audioCtx: AudioContext | null = null;
  private isUnlocked: boolean = false;
  private currentAudio: HTMLAudioElement | null = null;

  private dbName = "AnantaVoiceDB";
  private storeName = "audio_cache";

  private constructor() {
    if (typeof window !== "undefined") {
      const unlockEvents = ["keydown", "mousedown", "touchstart", "pointerdown"];
      const unlockHandler = () => {
        this.unlockContext();
        unlockEvents.forEach((evt) => window.removeEventListener(evt, unlockHandler));
      };
      unlockEvents.forEach((evt) => window.addEventListener(evt, unlockHandler, { once: true }));
    }
  }

  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  public unlockContext() {
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
      console.warn("[AudioManager] AudioContext unlock attempt:", e);
    }
  }

  public async playAudioBlob(blob: Blob): Promise<boolean> {
    this.unlockContext();

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
      console.warn("[AudioManager] HTML5 Audio play rejected. Attempting Web Audio API decode:", e);

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
          console.warn("[AudioManager] Web Audio API decode failed:", webAudioErr);
        }
      }
      return false;
    }
  }

  public stopAudio() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }
  }

  // IndexedDB Storage Methods
  private async getDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  public async getCachedAudio(hash: string): Promise<Blob | null> {
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const tx = db.transaction(this.storeName, "readonly");
        const store = tx.objectStore(this.storeName);
        const req = store.get(hash);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      });
    } catch {
      return null;
    }
  }

  public async cacheAudio(hash: string, blob: Blob): Promise<void> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(this.storeName, "readwrite");
        const store = tx.objectStore(this.storeName);
        const req = store.put(blob, hash);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch {
      // Ignore storage errors in private browsing modes
    }
  }
}

export const audioManager = AudioManager.getInstance();
