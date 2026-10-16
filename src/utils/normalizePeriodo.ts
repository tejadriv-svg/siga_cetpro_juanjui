/**
 * Utilidades para normalización y comparación flexible de Periodos Académicos
 * Soporta formatos:
 * - "2025_1", "2025_2", "2026_1", "2026_2"
 * - "2025-1", "2025-2", "2026-1", "2026-2"
 * - "2025-I", "2025-II", "2026-I", "2026-II"
 * - "PER-ACA-2025-1", "PER-ACA-2025-2", "PER-ACA-2026-1", "PER-ACA-2026-2"
 * - "Periodo académico 2025 1", "Periodo académico 2025-I"
 */

export interface ParsedPeriodo {
  anio: number;
  semestre: number;
  keyRoman: string; // ej. "2025-I"
  keyNumeric: string; // ej. "2025-1"
  codigo: string; // ej. "PER-ACA-2025-1"
  label: string; // ej. "Periodo Académico 2025-I"
}

export function parsePeriodo(raw?: string | null): ParsedPeriodo | null {
  if (!raw) return null;
  const s = String(raw).trim().toUpperCase();
  if (!s) return null;

  // Extraer año de 4 dígitos (ej. 2023, 2024, 2025, 2026, 2027)
  const yearMatch = s.match(/(20\d\d)/);
  if (!yearMatch) return null;
  const anio = parseInt(yearMatch[1], 10);

  // Determinar semestre: 1 (I) o 2 (II)
  // Remover el año temporalmente para no confundir el "-2" del año 202x
  const sWithoutYear = s.replace(yearMatch[1], '');

  let semestre = 1;
  if (
    sWithoutYear.includes('-2') ||
    sWithoutYear.includes('-II') ||
    sWithoutYear.includes('_2') ||
    sWithoutYear.includes('_II') ||
    sWithoutYear.includes('/2') ||
    sWithoutYear.includes('/II') ||
    sWithoutYear.includes(' 2') ||
    sWithoutYear.includes(' II') ||
    sWithoutYear.endsWith('2') ||
    sWithoutYear.endsWith('II') ||
    sWithoutYear.includes('SEGUNDO')
  ) {
    semestre = 2;
  } else if (
    sWithoutYear.includes('-1') ||
    sWithoutYear.includes('-I') ||
    sWithoutYear.includes('_1') ||
    sWithoutYear.includes('_I') ||
    sWithoutYear.includes('/1') ||
    sWithoutYear.includes('/I') ||
    sWithoutYear.includes(' 1') ||
    sWithoutYear.includes(' I') ||
    sWithoutYear.endsWith('1') ||
    sWithoutYear.endsWith('I') ||
    sWithoutYear.includes('PRIMERO')
  ) {
    semestre = 1;
  }

  const roman = semestre === 1 ? 'I' : 'II';

  return {
    anio,
    semestre,
    keyRoman: `${anio}-${roman}`,
    keyNumeric: `${anio}-${semestre}`,
    codigo: `PER-ACA-${anio}-${semestre}`,
    label: `Periodo académico ${anio}-${roman}`,
  };
}

/**
 * Normaliza cualquier formato de periodo al formato canónico Romano (ej. "2025-I", "2026-II")
 */
export function normalizePeriodo(raw?: string | null): string {
  if (!raw) return '';
  const parsed = parsePeriodo(raw);
  if (parsed) return parsed.keyRoman;
  return String(raw).trim();
}

/**
 * Normaliza cualquier formato de periodo al formato canónico Numérico (ej. "2025-1", "2026-2")
 */
export function normalizePeriodoNumeric(raw?: string | null): string {
  if (!raw) return '';
  const parsed = parsePeriodo(raw);
  if (parsed) return parsed.keyNumeric;
  return String(raw).trim();
}

/**
 * Compara dos cadenas de periodo y devuelve true si representan el mismo periodo académico
 */
export function isSamePeriodo(p1?: string | null, p2?: string | null): boolean {
  if (!p1 && !p2) return true;
  if (!p1 || !p2) return false;
  const parsed1 = parsePeriodo(p1);
  const parsed2 = parsePeriodo(p2);
  if (parsed1 && parsed2) {
    return parsed1.anio === parsed2.anio && parsed1.semestre === parsed2.semestre;
  }
  return String(p1).trim().toUpperCase() === String(p2).trim().toUpperCase();
}

/**
 * Devuelve la representación legible para el usuario en cabeceras y tarjetas
 */
export function formatPeriodoDisplay(raw?: string | null): string {
  if (!raw) return '';
  const parsed = parsePeriodo(raw);
  if (parsed) return parsed.keyRoman;
  return String(raw).trim();
}
