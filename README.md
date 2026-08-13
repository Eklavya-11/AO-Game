# OriginalGame — Real-Time Generative World Engine

> **Prompt a single sentence. Step inside a fully playable 2D universe instantly.**

**OriginalGame** is a zero-asset, real-time generative game engine that transforms short natural language prompts into fully interactive, voiced 2D adventure environments directly inside your browser. 

Imagine typing:
> *"A sun-scorched 1893 Champaner village during the drought, where I must deliver a hidden wager scroll to Bhuvan before the British captain arrives."*

Within moments, **OriginalGame** synthesizes and loads a complete 2D RPG realm: an isometric backdrop rendered by Gemini image models, a canvas-driven player avatar responsive to WASD/Touch movement, physical obstacles mapped to a 32x32 walkability mask, exploreable interior buildings, regional NPCs who converse using Sarvam Bulbul v3 voice streams, and an unraveling mystery leading to a grand finale reveal.

---

## Why Multimodal AI is Fundamental to OriginalGame

OriginalGame is not a static text-to-image generator or a branching narrative UI. Live multimodal AI generation is the backbone of the entire gameplay loop:

1. **Fully Dynamic Runtime Generation**: Nothing in OriginalGame is pre-built. Overworld environments, interior rooms, NPC personalities, collision boundaries, and victory frames are created strictly on-the-fly at runtime.
2. **Background Spatial Prefetching**: As soon as the main overworld spawns, an autonomous Vision Agent generates all interior locations simultaneously while you walk. By pre-building rooms ahead of player movement, stepping through doorways requires zero load time.
3. **Orchestrated Agent Telemetry**: A single 5-minute session triggers over **20+ automated AI operations** — balancing narrative planning, image synthesis, visual spatial perception, code-switched dialogue generation, and regional TTS speech. The live in-game HUD displays active agent states, model calls, and session execution costs in real time (running at paise-scale efficiency under ₹0.60).

---

## Cultural & Creative Impact in India

**OriginalGame** brings Indian history, regional cinema, and local folklore to life without requiring massive production budgets:

* **Folklore & Storytelling Preservation**: Recreate legendary period settings — from Champaner in *Lagaan* to historic trade routes — voiced natively across regional Indian languages and accents (Hindi, Marathi, Tamil, Kannada, and Indian English).
* **Interactive Educational Worlds**: Teachers and students can input any historical era and immediately walk through a grounded 2D space to interact with voiced historical figures.
* **Democratized Game Authoring**: Shifts the cost of indie game environment design from expensive studio budgets to accessible paise-per-play runtime costs.

---

## Engine Architecture Overview

* **Rendering Engine**: Next.js 16 (App Router), React, HTML5 60 FPS Canvas Physics Engine, Tailwind CSS.
* **State Management**: Zustand Finite State Machine (`IDLE`, `CREATING_WORLD`, `EXPLORING`, `DIALOGUE_ACTIVE`, `PREFETCHING`, `FINALE_UNRAVELED`) with 10-scene LRU memory caching.
* **AI Pipeline**: Google Gemini 3.5 Flash (Narrative Director & Dialogue), Gemini 2.5 Flash Image / Imagen 3 (Environment Art), Gemini 3.5 Vision (32x32 Spatial Walkability Grids).
* **Voice Synthesis**: Sarvam Bulbul v3 Regional TTS with SHA-256 `IndexedDB` audio caching and browser `SpeechSynthesis` graceful fallback.
* **Cloud Infrastructure**: Supabase Auth and 6-Character World Sharing System.
