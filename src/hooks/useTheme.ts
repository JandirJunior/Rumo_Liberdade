import { useState } from "react";

export function useTheme() {
  const [theme, setTheme] = useState("theme-festim");

  function changeTheme(newTheme: string) {
    document.documentElement.classList.remove(theme);
    document.documentElement.classList.add(newTheme);
    setTheme(newTheme);
  }

  return { theme, changeTheme };
}
