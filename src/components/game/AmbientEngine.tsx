'use client';

import { useEffect, useRef } from 'react';

type AmbientEngineProps = {
  baseAudioUrl?: string;
  randomSounds?: string[];
  volume?: number;
};

export function AmbientEngine({ baseAudioUrl = '/assets/audio/base-ambient.mp3', randomSounds = [], volume = 0.2 }: AmbientEngineProps) {
  const baseAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Initialize base audio
    if (!baseAudioRef.current) {
      const audio = new Audio(baseAudioUrl);
      audio.loop = true;
      audio.volume = volume;
      baseAudioRef.current = audio;
    }

    const playAudio = async () => {
      try {
        await baseAudioRef.current?.play();
      } catch (e) {
        console.log('Autoplay prevented. User interaction needed.');
      }
    };

    playAudio();

    // Random sounds interval
    let timeoutId: NodeJS.Timeout;
    const playRandomSound = () => {
      if (randomSounds.length > 0) {
        const soundUrl = randomSounds[Math.floor(Math.random() * randomSounds.length)];
        const audio = new Audio(soundUrl);
        audio.volume = volume * 0.8;
        audio.play().catch(() => {});
      }
      
      // Schedule next random sound between 10s and 30s
      const nextInterval = Math.random() * 20000 + 10000;
      timeoutId = setTimeout(playRandomSound, nextInterval);
    };

    if (randomSounds.length > 0) {
      timeoutId = setTimeout(playRandomSound, 5000);
    }

    return () => {
      baseAudioRef.current?.pause();
      clearTimeout(timeoutId);
    };
  }, [baseAudioUrl, randomSounds, volume]);

  return null;
}
