"use client";
import { useEffect } from "react";

export default function ThemeLoader() {
  useEffect(() => {
    // Synchro DB — applique si différent du localStorage (autre appareil, premier chargement)
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
