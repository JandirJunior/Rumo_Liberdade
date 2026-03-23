'use client';

import { useTheme } from '@/lib/ThemeContext';
import { THEMES } from '@/lib/themes';

type AmbientBackgroundProps = {
  videoUrl?: string;
  opacity?: number;
  blur?: number;
};

export function AmbientBackground({ opacity = 0.05, blur = 8 }: AmbientBackgroundProps) {
  const { theme } = useTheme();
  const colors = THEMES[theme] || THEMES.ORBITA;

  return (
    <div
      className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden"
      style={{
        backgroundColor: colors.bgDark,
        backgroundImage: `linear-gradient(135deg, ${colors.bgDark}b3 0%, ${colors.bgPanel}66 100%)`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        filter: `blur(${blur}px)`,
        opacity,
      }}
    />
  );
}
