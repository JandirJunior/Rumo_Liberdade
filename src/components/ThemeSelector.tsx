// src/components/ThemeSelector.tsx
import { useTheme } from "@/hooks/useTheme";

const themes = [
  "theme-festim",
  "theme-arcano",
  "theme-cache",
  "theme-exodia",
  "theme-reaver",
  "theme-orbita",
];

export default function ThemeSelector() {
  const { changeTheme } = useTheme();

  return (
    <div className="flex gap-2">
      {themes.map((t) => (
        <button
          key={t}
          onClick={() => changeTheme(t)}
          className="px-3 py-1 border rounded"
        >
          {t.replace("theme-", "").toUpperCase()}
        </button>
      ))}
    </div>
  );
}
