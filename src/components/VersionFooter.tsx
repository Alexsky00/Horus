"use client";
import { useState } from "react";

const RELEASE_NOTES: { version: string; date: string; status: string; sections: { title: string; items: string[] }[] }[] = [
  {
    version: "v1.6",
    date: "2026-04-19",
    status: "Stable",
    sections: [
      {
        title: "Correcciones",
        items: [
          "Filtro jornada completa — reacciona inmediatamente sin necesidad de recargar la página",
          "Tri rápido — barra «Ordenar» siempre visible, incluso con el panel de filtros abierto",
          "Error franja bloqueada — mensaje ahora en español: «Franja bloqueada: …»",
          "Notificación de conflicto — banner púrpura al crear una reserva en conflicto (~8 s)",
          "Banner de error — botón ✕ para cerrar manualmente + desaparece al cambiar filtro",
        ],
      },
      {
        title: "Mejoras",
        items: [
          "Color conflicto — cambiado de rosa a púrpura (#a855f7) en todas las vistas",
          "Panel calendario — reservas en conflicto muestran «⚡ Conflicto» en púrpura (no «Pendiente»)",
          "Panel calendario — botones Aceptar/Rechazar visibles también para reservas en conflicto",
          "Traducción completa — todas las cadenas restantes en francés traducidas al español",
        ],
      },
    ],
  },
  {
    version: "v1.5",
    date: "2026-04-18",
    status: "Stable",
    sections: [
      {
        title: "Mejoras",
        items: [
          "Temas de colores — 6 paletas configurables desde el menú Admin: Noche, Océano, Bosque, Vino, Desierto, Ártico",
          "Aplicación inmediata sin recarga + guardado en base de datos",
          "Sin flash de tema — el tema se aplica antes del primer renderizado (script inline en <head>)",
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
          "Notas de versión — clic en el número de versión al pie muestra el historial completo de versiones",
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
          "Campo teléfono — número del cliente en las tarjetas, panel del calendario y formularios (enlace tel: clicable)",
          "Búsqueda rápida — barra de búsqueda en la vista calendario (todas las vistas)",
          "Filtros estado — botones Todos / Pendiente / Confirmada / Rechazada en el calendario",
          "Toggle jornada completa — filtro «☀ Solo jornada completa» en el dashboard",
          "Prellenado formulario bloqueo — fecha inicializada en el período visible en el calendario",
          "Creación desde el calendario — clic en un hueco semana/día abre el formulario de reserva prellenado",
          "Planificación — bloqueos de varios días agrupados en una sola fila (ej. «3 may – 14 may»)",
          "Vista semana/día — eliminación del encabezado «all day», etiquetas en dos líneas sin desbordamiento",
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
          "Formulario — hora inicializada a 09:00 en lugar de la hora actual",
          "Selector de hora (bloqueo) — <select> 06:00–21:30 en lugar del input nativo",
          "ExternalRef — referencia OTA eliminada del panel lateral del calendario",
        ],
      },
      {
        title: "Mejoras",
        items: [
          "Conflicto jornada completa — una reserva allDay bloquea todo el día para las demás reservas",
          "Calendario semana/día — reservas y bloqueos allDay mostrados como un bloque 06:00–22:00",
          "Color bloqueo — unificado a slate-700 (#334155) para la legibilidad sobre fondo oscuro",
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
          "Código reserva — badge amber (RCV, RC…) visible en las tarjetas y en el panel",
          "ExternalRef — códigos OTA ocultos en toda la interfaz (conservados en base de datos)",
          "Indicador jornada completa — «☀ Toda la jornada» mostrado en las tarjetas y el panel",
          "Selector de hora — <select> con paso de 30 min (06:00–21:30), compatible con todos los navegadores",
          "Timezone Gantt — toLocalKey() corrige el desfase de un día en los eventos allDay",
          "Navegación calendario — la vista ya no vuelve a hoy al cambiar de vista",
          "Reinicialización — el reset completo también vacía los bloqueos y redirige al dashboard",
        ],
      },
      {
        title: "Mejoras",
        items: [
          "Planificación — columna «Cliente» añadida a la tabla de reservas confirmadas",
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
          "Dashboard — lista, fichas de estadísticas, búsqueda, filtros, ordenación, paginación",
          "Gestión de reservas — crear, aceptar, rechazar, eliminar con anti-duplicados",
          "Franjas bloqueadas — bloquear todo o parte de un día",
          "Calendario — vistas semana/mes/día, código de color por estado, panel lateral",
          "Gantt mensual — barras de reservas con etiqueta desplazada si hay desbordamiento",
          "Planificación — tabla mensual de confirmadas + bloqueos",
          "Logs — historial de acciones filtrables",
          "Datos de demo — 27 reservas + 35 bloqueos en 12 meses",
          "PWA — instalable en móvil, notificaciones push",
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
          Horus v1.6
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
