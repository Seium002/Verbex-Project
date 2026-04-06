"use client";

import { ReactNode, useEffect, useState } from "react";

const THEME_KEY = "verbex-theme";

type ThemeMode = "dark";

function applyTheme(mode: ThemeMode) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", mode);
}

export default function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeMode>("dark");

  useEffect(() => {
    const stored = window.localStorage.getItem(THEME_KEY);
    const initial = stored === "dark" ? stored : "dark";
    setTheme(initial);
    applyTheme(initial);
  }, []);

  return <>{children}</>;
}
