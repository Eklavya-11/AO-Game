"use client";

import React, { useState } from "react";
import { useGameStore } from "../lib/store/useGameStore";

export const JournalModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const worldTitle = useGameStore((state) => state.worldTitle);
  const worldPremise = useGameStore((state) => state.worldPremise);
  const acquiredClues = useGameStore((state) => state.acquiredClues);
  const inventory = useGameStore((state) => state.inventory);

  const cluesList = Object.keys(acquiredClues);

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-72 left-4 z-40 bg-slate-900/90 hover:bg-slate-800 border border-amber-500/40 text-amber-300 font-mono text-xs px-3 py-2 rounded-lg shadow-xl flex items-center gap-2 transition"
      >
        <span>📓</span> Detective Journal ({cluesList.length}/3)
      </button>

      {/* Slide-out Panel */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex justify-start">
          <div className="w-full max-w-md bg-slate-900 border-r border-slate-800 p-6 flex flex-col h-full overflow-y-auto text-slate-100 shadow-2xl animate-in slide-in-from-left duration-300">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
              <div>
                <h2 className="font-bold text-amber-400 text-xl font-serif">Detective Case Notes</h2>
                <p className="text-xs text-slate-400">{worldTitle || "Active Investigation"}</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            {/* Premise */}
            <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 mb-6 text-xs text-slate-300">
              <span className="font-semibold text-amber-400 block mb-1">World Premise:</span>
              {worldPremise || "Exploring the unknown..."}
            </div>

            {/* Mystery Clues Section */}
            <div className="mb-6">
              <h3 className="font-semibold text-sm text-sky-400 mb-3 uppercase tracking-wider flex items-center justify-between">
                <span>Discovered Clues</span>
                <span className="text-xs font-normal text-slate-400">{cluesList.length} of 3 Found</span>
              </h3>

              {cluesList.length === 0 ? (
                <div className="text-xs text-slate-500 italic bg-slate-950/50 p-4 rounded-lg border border-slate-800/50 text-center">
                  No clues discovered yet. Speak with merchants and inspect enterable buildings.
                </div>
              ) : (
                <div className="space-y-2">
                  {cluesList.map((clueId, idx) => (
                    <div
                      key={clueId}
                      className="p-3 bg-amber-950/20 border border-amber-800/40 rounded-lg text-xs text-amber-200 flex items-start gap-2"
                    >
                      <span className="text-amber-400 font-bold">#{idx + 1}</span>
                      <div>
                        <span className="font-semibold block text-amber-300">Clue Discovered:</span>
                        The key to the mystery is hidden near the docks under the iron chest.
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Inventory Section */}
            <div>
              <h3 className="font-semibold text-sm text-emerald-400 mb-3 uppercase tracking-wider">Inventory Items</h3>
              {inventory.length === 0 ? (
                <div className="text-xs text-slate-500 italic bg-slate-950/50 p-4 rounded-lg border border-slate-800/50 text-center">
                  Inventory is empty.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {inventory.map((item) => (
                    <div
                      key={item.id}
                      className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200"
                    >
                      <span className="font-bold block text-emerald-400">{item.name}</span>
                      <span className="text-[10px] text-slate-400">{item.significance}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
