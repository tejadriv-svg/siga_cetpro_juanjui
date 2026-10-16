/**
 * Utilidades unificadas para Género / Sexo en el SIGA CETPRO Juanjuí.
 * 
 * Regla oficial MINEDU y Base de Datos Postgres (tipo_genero enum: ['H', 'M']):
 * - 'H': Hombre / Masculino / Varón
 * - 'M': Mujer / Femenino
 */

export type GeneroOficial = 'H' | 'M';

export function normalizeSexo(val?: string | null): GeneroOficial {
  if (!val) return 'H';
  const s = val.toString().trim().toUpperCase();

  // 1. Casos Mujer / Femenino (F, FEM, FEMENINO, MUJER, M, etc.)
  if (
    s === 'M' ||
    s === 'MUJER' ||
    s === 'F' ||
    s.startsWith('FEM') ||
    s === 'WOMAN' ||
    s === 'FEMALE'
  ) {
    return 'M';
  }

  // 2. Casos Hombre / Masculino (H, HOMBRE, MASC, MASCULINO, VARON, VARÓN, V, etc.)
  if (
    s === 'H' ||
    s === 'HOMBRE' ||
    s === 'V' ||
    s.startsWith('MASC') ||
    s.startsWith('VAR') ||
    s === 'MAN' ||
    s === 'MALE'
  ) {
    return 'H';
  }

  return 'H';
}

export function formatSexoLabel(val?: string | null): string {
  const norm = normalizeSexo(val);
  return norm === 'M' ? 'Mujer' : 'Hombre';
}

export function formatSexoHombreMujer(val?: string | null): string {
  const norm = normalizeSexo(val);
  return norm === 'M' ? 'Mujer' : 'Hombre';
}
