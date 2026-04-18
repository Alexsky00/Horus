"use client";
import { useState } from "react";

const RELEASE_NOTES: { version: string; date: string; status: string; sections: { title: string; items: string[] }[] }[] = [
  {
    version: "v1.5",
    date: "2026-04-18",
    status: "Stable",
    sections: [
      {
        title: "Mejoras",
        items: [
          "Temas de colores — 6 palettes configurables depuis le menu Admin : Noche, Océano, Bosque, Vino, Desierto, Ártico",
          "Application immédiate sans rechargement + sauvegardé en base",
          "Correction flash — le thème est appliqué avant le premier rendu (script inline dans <head>)",
        ],
      },
    ],
  },
  {
    version: "v1.4",
    date: "2026-04-18",
    status: "Stable",
    sections: [
      {
        title: "Mejoras",
        items: [
          "Notas de versión — clic sur le numéro de version en pied de page affiche l'historique complet des releases",
        ],
      },
    ],
  },
  {
    version: "v1.3",
    date: "2026-04-15",
    status: "Stable",
    sections: [
      {
        title: "Mejoras",
        items: [
          "Champ téléphone — numéro client sur les cartes, panneau calendrier et formulaires (lien tel: cliquable)",
          "Recherche rapide — barre de recherche dans la vue calendrier (toutes les vues)",
          "Filtres statut — boutons Todos / Pendiente / Confirmada / Rechazada dans le calendrier",
          "Toggle jornada completa — filtre «☀ Solo jornada completa» dans le dashboard",
          "Pré-remplissage formulaire blocage — date initialisée sur la période visible dans le calendrier",
          "Création depuis le calendrier — clic sur un créneau semaine/jour ouvre le formulaire de réservation pré-rempli",
          "Planning — bloquages multi-jours groupés en une seule ligne (ex. «3 may – 14 may»)",
          "Vue semaine/jour — suppression de l'en-tête «all day», labels sur deux lignes sans débordement",
        ],
      },
    ],
  },
  {
    version: "v1.2",
    date: "2026-04-14",
    status: "Stable",
    sections: [
      {
        title: "Correcciones",
        items: [
          "Formulaire — heure initialisée à 09:00 au lieu de l'heure courante",
          "Sélecteur d'heure (blocage) — <select> 06:00–21:30 à la place de l'input natif",
          "ExternalRef — référence OTA supprimée du panneau latéral du calendrier",
        ],
      },
      {
        title: "Mejoras",
        items: [
          "Conflit jornada completa — une réservation allDay bloque toute la journée pour les autres réservations",
          "Calendrier semaine/jour — réservations et bloquages allDay affichés comme un bloc 06:00–22:00",
          "Couleur bloquage — unifié à slate-700 (#334155) pour la lisibilité sur fond sombre",
        ],
      },
    ],
  },
  {
    version: "v1.1",
    date: "2026-04-13",
    status: "Stable",
    sections: [
      {
        title: "Correcciones",
        items: [
          "Code réservation — badge amber (RCV, RC…) visible sur les cartes et dans le panneau",
          "ExternalRef — codes OTA masqués dans toute l'interface (conservés en base)",
          "Indicateur jornada completa — «☀ Toda la jornada» affiché sur les cartes et le panneau",
          "Sélecteur d'heure — <select> avec pas de 30 min (06:00–21:30), compatible tous navigateurs",
          "Timezone Gantt — toLocalKey() corrige le décalage d'un jour sur les événements allDay",
          "Navigation calendrier — la vue ne repart plus à aujourd'hui lors d'un changement de vue",
          "Réinitialisation — le reset complet vide aussi les bloquages et redirige vers le dashboard",
        ],
      },
      {
        title: "Mejoras",
        items: [
          "Planning — colonne «Cliente» ajoutée au tableau des réservations confirmées",
        ],
      },
    ],
  },
  {
    version: "v1.0-Alpha",
    date: "2026-04-12",
    status: "Internal alpha",
    sections: [
      {
        title: "Funcionalidades iniciales",
        items: [
          "Dashboard — liste, tuiles stat, recherche, filtres, tri, pagination",
          "Gestion réservations — créer, accepter, refuser, supprimer avec anti-double-booking",
          "Créneaux bloqués — bloquer tout ou partie d'une journée",
          "Calendrier — vues semaine/mois/jour, code couleur par statut, panneau latéral",
          "Gantt mensuel — barres de réservations avec label décalé si dépassement",
          "Planning — tableau mensuel des confirmées + bloquages",
          "Logs — historique des actions filtrables",
          "Données démo — 27 réservations + 35 bloquages sur 12 mois",
          "PWA — installable sur mobile, notifications push",
        ],
      },
    ],
  },
];

export default function VersionFooter() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <footer className="border-t border-slate-800 mt-8 py-3 text-center">
        <button
          onClick={() => setOpen(true)}
          className="text-slate-600 text-xs hover:text-slate-400 transition-colors cursor-pointer"
        >
          Horus v1.5
        </button>
      </footer>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-slate-900 border border-slate-700 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[80vh] flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700 shrink-0">
              <h2 className="text-white font-bold text-base">Notas de versión</h2>
              <button
                onClick={() => setOpen(false)}
                className="text-slate-400 hover:text-white text-xl leading-none transition-colors"
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto px-5 py-4 space-y-6">
              {RELEASE_NOTES.map((rel) => (
                <div key={rel.version}>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-amber-400 font-bold text-sm">{rel.version}</span>
                    <span className="text-slate-500 text-xs">{rel.date}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      rel.status === "Stable"
                        ? "bg-emerald-900/50 text-emerald-400"
                        : "bg-slate-700 text-slate-400"
                    }`}>
                      {rel.status}
                    </span>
                  </div>
                  {rel.sections.map((sec) => (
                    <div key={sec.title} className="mb-3">
                      <p className="text-slate-400 text-xs font-semibold uppercase tracking-wide mb-1.5">
                        {sec.title}
                      </p>
                      <ul className="space-y-1">
                        {sec.items.map((item, i) => (
                          <li key={i} className="text-slate-300 text-xs flex gap-2">
                            <span className="text-slate-600 shrink-0">·</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
