"use client";
import { useEffect } from "react";

export default function ThemeLoader() {
  useEffect(() => {
    // Application rapide depuis localStorage pour éviter le flash
    const cached = localStorage.getItem("horus-theme");
    if (cached && cached !== "slate") {
      document.documentElement.setAttribute("data-theme", cached);
    }

    // Confirmation depuis la base
    fetch("/api/settings")
      .then((r) => r.json())
      .then((settings: Record<string, string>) => {
        const theme = settings["theme.id"] ?? "slate";
        localStorage.setItem("horus-theme", theme);
        if (theme === "slate") {
          document.documentElement.removeAttribute("data-theme");
        } else {
          document.documentElement.setAttribute("data-theme", theme);
        }
      })
      .catch(() => {});
  }, []);

  return null;
}
