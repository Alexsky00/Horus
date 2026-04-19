"use client";
import { useEffect, useState } from "react";

export default function SplashScreen() {
  // Phase : "in" → logo entre | "hold" → logo visible | "out" → overlay sort | "done" → démonté
  const [phase, setPhase] = useState<"in" | "hold" | "out" | "done">("in");

  useEffect(() => {
    // Ne jouer qu'une seule fois par session
    if (sessionStorage.getItem("horus-splash-done")) {
      setPhase("done");
      return;
    }
    const t1 = setTimeout(() => setPhase("hold"), 1000);   // fin du fade-in logo
    const t2 = setTimeout(() => setPhase("out"),  2800);  // début du fade-out overlay
    const t3 = setTimeout(() => {
      setPhase("done");
      sessionStorage.setItem("horus-splash-done", "1");
    }, 2000);                                              // démontage complet
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  if (phase === "done") return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        backgroundColor: "var(--bg, #0f172a)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "12px",
        transition: phase === "out" ? "opacity 0.55s ease" : undefined,
        opacity: phase === "out" ? 0 : 1,
        pointerEvents: phase === "out" ? "none" : "auto",
      }}
    >
      {/* Logo */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "8px",
          transform: phase === "in" ? "scale(0.7)" : "scale(1)",
          opacity: phase === "in" ? 0 : 1,
          transition: "transform 0.55s cubic-bezier(0.34,1.56,0.64,1), opacity 0.45s ease",
        }}
      >
        <span style={{ fontSize: "3.5rem", lineHeight: 1 }}>☀</span>
        <span
          style={{
            fontWeight: 800,
            fontSize: "2rem",
            letterSpacing: "0.15em",
            color: "var(--accent, #f59e0b)",
          }}
        >
          HORUS
        </span>
        <span
          style={{
            fontSize: "0.75rem",
            letterSpacing: "0.2em",
            color: "#64748b",
            textTransform: "uppercase",
          }}
        >
          Gestión de Reservas
        </span>
      </div>

      {/* Barre de chargement */}
      <div
        style={{
          marginTop: "32px",
          width: "120px",
          height: "2px",
          backgroundColor: "#1e293b",
          borderRadius: "9999px",
          overflow: "hidden",
          opacity: phase === "in" ? 0 : 1,
          transition: "opacity 0.3s ease 0.2s",
        }}
      >
        <div
          style={{
            height: "100%",
            backgroundColor: "var(--accent, #f59e0b)",
            borderRadius: "9999px",
            animation: "horus-progress 1.1s ease forwards",
          }}
        />
      </div>

      <style>{`
        @keyframes horus-progress {
          from { width: 0%; }
          to   { width: 100%; }
        }
      `}</style>
    </div>
  );
}
