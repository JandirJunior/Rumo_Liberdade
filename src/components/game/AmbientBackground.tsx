'use client';

import { useEffect, useRef } from 'react';

type AmbientBackgroundProps = {
  videoUrl?: string;
  opacity?: number;
  blur?: number;
};

export function AmbientBackground({ videoUrl = '/assets/video/ambient.webm', opacity = 0.15, blur = 4 }: AmbientBackgroundProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {
        console.log('Autoplay prevented for ambient background.');
      });
    }
  }, [videoUrl]);

  return (
    <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden bg-black">
      <video
        ref={videoRef}
        src={videoUrl}
        autoPlay
        loop
        muted
        playsInline
        className="w-full h-full object-cover"
        style={{
          opacity: opacity,
          filter: `blur(${blur}px)`,
        }}
      />
      {/* Fallback gradient if video fails or is loading */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/80" />
    </div>
  );
}
