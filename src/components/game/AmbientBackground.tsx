'use client';

import { useEffect, useRef } from 'react';

type AmbientBackgroundProps = {
  videoUrl?: string;
  opacity?: number;
  blur?: number;
};

export function AmbientBackground({ opacity = 0.15, blur = 4 }: AmbientBackgroundProps) {
  return (
    <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden bg-black">
      <div 
        className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 via-purple-900/10 to-black"
        style={{ opacity, filter: `blur(${blur}px)` }}
      />
      {/* Fallback gradient if video fails or is loading */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/80" />
    </div>
  );
}
