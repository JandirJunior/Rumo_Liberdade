// src/components/XPToast.tsx
import { useEffect, useState } from "react";

export default function XPToast({ xp }: { xp: number }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-purple-700 text-white px-4 py-2 rounded-lg shadow-lg animate-bounce">
      +{xp} XP!
    </div>
  );
}
