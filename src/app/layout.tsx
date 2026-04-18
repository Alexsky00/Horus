import type { Metadata, Viewport } from "next";
import "./globals.css";
import "flag-icons/css/flag-icons.min.css";
import VersionFooter from "@/components/VersionFooter";
import ThemeLoader from "@/components/ThemeLoader";

export const metadata: Metadata = {
  title: "Horus — Reservas",
  description: "Gestión de reservas turísticas",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Horus" },
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        {/* Script synchrone : applique le thème AVANT le premier rendu, sans flash */}
        <script dangerouslySetInnerHTML={{ __html: `
          try {
            var t = localStorage.getItem('horus-theme');
            if (t && t !== 'slate') document.documentElement.setAttribute('data-theme', t);
          } catch(e) {}
        ` }} />
      </head>
      <body className="min-h-screen">
        <ThemeLoader />
        <header className="bg-slate-800 border-b border-slate-700 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-amber-400 font-bold text-xl">☀ HORUS</span>
            <span className="text-slate-400 text-sm hidden sm:block">Gestión de Reservas</span>
          </div>
          <nav className="flex gap-4">
            <a href="/" className="text-slate-300 hover:text-amber-400 text-sm font-medium">
              Dashboard
            </a>
            <a href="/calendar" className="text-slate-300 hover:text-amber-400 text-sm font-medium">
              Calendario
            </a>
            <a href="/planning" className="text-slate-300 hover:text-amber-400 text-sm font-medium">
              Planning
            </a>
            <a href="/logs" className="text-slate-300 hover:text-amber-400 text-sm font-medium">
              Logs
            </a>
            <a href="/admin" className="text-slate-500 hover:text-slate-300 text-sm font-medium" title="Administración">
              ⚙
            </a>
          </nav>
        </header>
        <main className="max-w-5xl mx-auto px-4 py-6">{children}</main>
        <VersionFooter />
      </body>
    </html>
  );
}
