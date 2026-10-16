/**
 * Utilidades de ordenamiento alfabético para Nóminas, Actas y Documentos Oficiales.
 * 
 * Criterio oficial:
 * 1. Apellido paterno (de izquierda a derecha según el abecedario español).
 * 2. Apellido materno (de izquierda a derecha según el abecedario español).
 * 3. Nombres (de izquierda a derecha según el abecedario español).
 */

export interface PersonaLike {
  apellidoPaterno?: string | null;
  apellidoMaterno?: string | null;
  nombres?: string | null;
}

/**
 * Normaliza y compara dos cadenas de texto carácter por carácter usando el abecedario español.
 */
export function compareSpanishStrings(a?: string | null, b?: string | null): number {
  const strA = (a || '').trim();
  const strB = (b || '').trim();

  // Si ambos están vacíos, son iguales
  if (!strA && !strB) return 0;
  // Los vacíos van al final
  if (!strA) return 1;
  if (!strB) return -1;

  // Comparación sensible al español (A-Z de izquierda a derecha), ignorando diferencias de mayúsculas/minúsculas
  const cmp = strA.localeCompare(strB, 'es', { sensitivity: 'base', numeric: true });
  if (cmp !== 0) return cmp;

  // En caso de empate base (ej. tildes), desempate estándar
  return strA.localeCompare(strB, 'es');
}

/**
 * Compara dos personas por Apellido Paterno -> Apellido Materno -> Nombres
 */
export function comparePersonasAlphabetical(
  pA?: PersonaLike | null,
  pB?: PersonaLike | null
): number {
  // 1. Apellido Paterno
  const cmpPat = compareSpanishStrings(pA?.apellidoPaterno, pB?.apellidoPaterno);
  if (cmpPat !== 0) return cmpPat;

  // 2. Apellido Materno
  const cmpMat = compareSpanishStrings(pA?.apellidoMaterno, pB?.apellidoMaterno);
  if (cmpMat !== 0) return cmpMat;

  // 3. Nombres
  return compareSpanishStrings(pA?.nombres, pB?.nombres);
}

/**
 * Helper para comparar dos matrículas por el nombre de la persona asociada.
 */
export function compareMatriculasByPersona(
  mA: { estudianteId: string },
  mB: { estudianteId: string },
  personas: Array<{ id: string; apellidoPaterno?: string; apellidoMaterno?: string; nombres?: string }>,
  estudiantes: Array<{ id: string; personaId: string }>
): number {
  const estA = estudiantes.find((e) => e.id === mA.estudianteId);
  const perA = estA ? personas.find((p) => p.id === estA.personaId) : null;

  const estB = estudiantes.find((e) => e.id === mB.estudianteId);
  const perB = estB ? personas.find((p) => p.id === estB.personaId) : null;

  return comparePersonasAlphabetical(perA, perB);
}

/**
 * Helper para comparar dos estudiantes por la persona asociada.
 */
export function compareEstudiantesByPersona(
  eA: { personaId: string },
  eB: { personaId: string },
  personas: Array<{ id: string; apellidoPaterno?: string; apellidoMaterno?: string; nombres?: string }>
): number {
  const perA = personas.find((p) => p.id === eA.personaId);
  const perB = personas.find((p) => p.id === eB.personaId);

  return comparePersonasAlphabetical(perA, perB);
}
