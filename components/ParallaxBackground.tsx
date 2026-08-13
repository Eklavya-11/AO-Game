"use client";

import React, { useState, useEffect } from "react";

export const ParallaxBackground: React.FC = () => {
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      // Normalized coordinates from -1 to 1
      const x = (e.clientX / innerWidth - 0.5) * 2;
      const y = (e.clientY / innerHeight - 0.5) * 2;
      setMousePos({ x, y });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0">
      {/* Base Dark Gradient Layer */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950" />

      {/* Layer 1: Giant Spider & Stone Ruins Parallax Image */}
      <div
        className="absolute inset-0 transition-transform duration-300 ease-out scale-105"
        style={{
          transform: `translate(${mousePos.x * -18}px, ${mousePos.y * -14}px)`,
        }}
      >
        <img
          src="/fallback/bg_spider.png"
          alt="Parallax Spider Background"
          className="w-full h-full object-cover opacity-60 mix-blend-luminosity brightness-75 contrast-125"
        />
      </div>

      {/* Layer 2: Glowing Amber Ember Overlay */}
      <div
        className="absolute inset-0 bg-radial-vignette transition-transform duration-500 ease-out"
        style={{
          transform: `translate(${mousePos.x * 12}px, ${mousePos.y * 10}px)`,
        }}
      >
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-red-600/10 rounded-full blur-3xl" />
      </div>

      {/* Layer 3: Dark Vignette & Edge Shading (Image 3 Aesthetic) */}
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/60 to-slate-950/80" />
      <div className="absolute inset-0 shadow-[inset_0_0_120px_rgba(2,6,23,0.9)]" />
    </div>
  );
};
