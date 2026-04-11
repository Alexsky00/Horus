// ISO 3166-1 alpha-2 codes → nom affiché
// Utilisé avec la librairie flag-icons : <span className={`fi fi-${code.toLowerCase()}`} />
export const NATIONALITIES: { code: string; label: string }[] = [
  { code: "ES", label: "España" },
  { code: "FR", label: "Francia" },
  { code: "DE", label: "Alemania" },
  { code: "GB", label: "Reino Unido" },
  { code: "IT", label: "Italia" },
  { code: "US", label: "Estados Unidos" },
  { code: "NL", label: "Países Bajos" },
  { code: "BE", label: "Bélgica" },
  { code: "CH", label: "Suiza" },
  { code: "PT", label: "Portugal" },
  { code: "AU", label: "Australia" },
  { code: "CA", label: "Canadá" },
  { code: "JP", label: "Japón" },
  { code: "CN", label: "China" },
  { code: "BR", label: "Brasil" },
  { code: "AR", label: "Argentina" },
  { code: "MX", label: "México" },
  { code: "PL", label: "Polonia" },
  { code: "SE", label: "Suecia" },
  { code: "NO", label: "Noruega" },
  { code: "DK", label: "Dinamarca" },
  { code: "RU", label: "Rusia" },
];

export function getNationalityLabel(code: string): string {
  return NATIONALITIES.find((n) => n.code === code)?.label ?? code;
}
