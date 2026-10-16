import { Router } from 'express';
import { db } from '../db/index.js';
import { matriculas, periodosAcademicos, periodosLectivos, planesEstudios, sedes, cetpros, modulos, estudiantes, personas, secciones, periodosClases, retiros, traslados, reingresos } from '../db/schema.js';
import { eq, desc, and } from 'drizzle-orm';

export const matriculaRouter = Router();

// Helper to parse tariff benefit metadata stored in matriculas.observaciones
function parseBeneficioFromObservaciones(obs?: string | null) {
  let beneficioTipo = 'REGULAR';
  let beneficioNombre: string | undefined;
  let resolucionSustento: string | undefined;
  let montoPactado: number | undefined;
  let porcentajeDescuento: number | undefined;
  let cleanObservaciones = obs || '';

  if (obs) {
    const match = obs.match(/\[BENEFICIO:(\{.*?\})\]/);
    if (match) {
      try {
        const meta = JSON.parse(match[1]);
        beneficioTipo = meta.tipo || 'REGULAR';
        beneficioNombre = meta.nombre;
        resolucionSustento = meta.sustento;
        montoPactado = meta.montoPactado !== undefined ? Number(meta.montoPactado) : undefined;
        porcentajeDescuento = meta.porcentajeDescuento !== undefined ? Number(meta.porcentajeDescuento) : undefined;
        cleanObservaciones = obs.replace(match[0], '').trim();
      } catch (e) {
        console.error('Error parsing BENEFICIO tag in matricula:', e);
      }
    }
  }

  return {
    beneficioTipo,
    beneficioNombre,
    resolucionSustento,
    montoPactado,
    porcentajeDescuento,
    cleanObservaciones,
  };
}

// Helper to build or update matriculas.observaciones with tariff benefit tag
function buildObservacionesWithBeneficio(
  baseObs: string | null | undefined,
  beneficio: {
    condicionArancelaria?: string;
    convenioNombre?: string;
    resolucionSustento?: string;
    montoPactado?: number;
    porcentajeDescuento?: number;
  }
): string {
  let cleaned = (baseObs || '').replace(/\[BENEFICIO:(\{.*?\})\]\s*/g, '').trim();

  if (beneficio.condicionArancelaria && beneficio.condicionArancelaria !== 'REGULAR') {
    const meta = {
      tipo: beneficio.condicionArancelaria,
      nombre: beneficio.convenioNombre || undefined,
      sustento: beneficio.resolucionSustento || undefined,
      montoPactado: beneficio.montoPactado !== undefined ? Number(beneficio.montoPactado) : undefined,
      porcentajeDescuento: beneficio.porcentajeDescuento !== undefined ? Number(beneficio.porcentajeDescuento) : undefined,
    };
    return `[BENEFICIO:${JSON.stringify(meta)}] ${cleaned}`.trim();
  }

  return cleaned;
}

// Obtener todas las matrículas
matriculaRouter.get('/', async (req, res) => {
  try {
    const allMatriculas = await db
      .select({
        matricula: matriculas,
        modulo: modulos,
        periodo: periodosAcademicos
      })
      .from(matriculas)
      .leftJoin(modulos, eq(matriculas.moduloId, modulos.id))
      .leftJoin(periodosAcademicos, eq(matriculas.periodoAcademicoId, periodosAcademicos.id))
      .orderBy(desc(matriculas.fechaMatricula));
    
    // Map to frontend format
    const mapped = allMatriculas.map(row => {
      const m = row.matricula;
      const mod = row.modulo;
      const pa = row.periodo;
      
      let periodoStr = '2026-2';
      if (pa?.codigo) {
        periodoStr = pa.codigo.replace('PER-ACA-', '');
      } else if (pa?.nombre) {
        periodoStr = pa.nombre;
      }

      const {
        beneficioTipo,
        beneficioNombre,
        resolucionSustento,
        montoPactado,
        porcentajeDescuento,
        cleanObservaciones
      } = parseBeneficioFromObservaciones(m.observaciones);

      return {
        id: m.id,
        codigoMatricula: m.codigoMatricula,
        estudianteId: m.estudianteId,
        moduloId: m.moduloId,
        programaId: mod?.programaId || null,
        seccionId: m.seccionId || null,
        periodoAcademico: periodoStr,
        tipo: 'Regular' as const,
        fechaMatricula: m.fechaMatricula,
        condicion: m.condicion,
        estadoMatricula: m.estadoMatricula,
        formacion: m.formacion,
        oportunidadTecnica: m.oportunidadTecnica,
        observaciones: cleanObservaciones || undefined,
        condicionArancelaria: beneficioTipo,
        convenioNombre: beneficioNombre,
        resolucionSustento: resolucionSustento,
        montoPactado: montoPactado,
        porcentajeDescuento: porcentajeDescuento
      };
    });
    res.json(mapped);
  } catch (error) {
    console.error('Error fetching matriculas:', error);
    res.status(500).json({ error: 'Error fetching matriculas' });
  }
});

// Crear nueva matrícula
matriculaRouter.post('/', async (req, res) => {
  try {
    const data = req.body;

    if (!data.estudianteId) {
      return res.status(400).json({ error: 'El estudiante es requerido' });
    }

    // If seccionId provided, retrieve section details
    let seccionObj: any = null;
    if (data.seccionId) {
      const secList = await db.select().from(secciones).where(eq(secciones.id, data.seccionId)).limit(1);
      seccionObj = secList[0] || null;
    }

    // Resolve Modulo
    let moduloId = data.moduloId || seccionObj?.moduloId;
    let moduloObj: any = null;
    if (moduloId) {
      const found = await db.select().from(modulos).where(eq(modulos.id, moduloId)).limit(1);
      moduloObj = found[0] || null;
    }
    if (!moduloId || !moduloObj) {
      const fallbackModulo = await db.select().from(modulos).limit(1);
      moduloId = fallbackModulo[0]?.id;
      moduloObj = fallbackModulo[0] || null;
    }

    const resolvedProgramaId = moduloObj?.programaId || data.programaId;

    // Resolve Sede
    let sedeId = data.sedeId || seccionObj?.sedeId;
    if (!sedeId) {
      const sedeList = await db.select().from(sedes).limit(1);
      sedeId = sedeList[0]?.id;
    }

    // Resolve Periodo Académico
    let pAcademicoId: string | null = null;
    let resolvedPeriodoCode: string = data.periodoAcademico || '2026-2';
    const allPeriodos = await db.select().from(periodosAcademicos);

    if (seccionObj?.periodoClasesId) {
      const pClases = await db.select().from(periodosClases).where(eq(periodosClases.id, seccionObj.periodoClasesId)).limit(1);
      if (pClases[0]?.periodoAcademicoId) {
        pAcademicoId = pClases[0].periodoAcademicoId;
        const matchingPa = allPeriodos.find(p => p.id === pAcademicoId);
        if (matchingPa?.codigo) resolvedPeriodoCode = matchingPa.codigo.replace('PER-ACA-', '');
      }
    }

    if (!pAcademicoId && data.periodoAcademico) {
      const pNorm = String(data.periodoAcademico).replace('_', '-').toUpperCase().trim();
      const matched = allPeriodos.find(p => {
        if (!p) return false;
        if (p.codigo === data.periodoAcademico || p.codigo === `PER-ACA-${pNorm}`) return true;
        if (p.codigo?.replace('PER-ACA-', '') === pNorm) return true;
        if (p.codigo?.includes(pNorm) || p.nombre?.toUpperCase().includes(pNorm)) return true;
        return false;
      });
      if (matched) {
        pAcademicoId = matched.id;
        resolvedPeriodoCode = matched.codigo ? matched.codigo.replace('PER-ACA-', '') : (matched.nombre || resolvedPeriodoCode);
      }
    }

    if (!pAcademicoId) {
      const activePa = allPeriodos.find(p => p.codigo?.includes('2026-2')) || allPeriodos[0];
      pAcademicoId = activePa?.id || (await db.select().from(periodosAcademicos).limit(1))[0]?.id;
      if (activePa?.codigo) resolvedPeriodoCode = activePa.codigo.replace('PER-ACA-', '');
    }

    // Obtener DNI del estudiante
    const [estudianteData] = await db
      .select({
        dni: personas.numeroDocumento
      })
      .from(estudiantes)
      .innerJoin(personas, eq(estudiantes.personaId, personas.id))
      .where(eq(estudiantes.id, data.estudianteId))
      .limit(1);

    const dni = estudianteData?.dni || 'EST';
    const shortMod = moduloObj?.codigo ? moduloObj.codigo.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4) : moduloId?.slice(0, 4);
    const shortPeriod = resolvedPeriodoCode.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6);

    // Check if active matricula already exists for (estudianteId, periodoAcademicoId, moduloId)
    const existingActive = await db.select().from(matriculas).where(
      and(
        eq(matriculas.estudianteId, data.estudianteId),
        eq(matriculas.periodoAcademicoId, pAcademicoId!),
        eq(matriculas.moduloId, moduloId),
        eq(matriculas.estadoMatricula, 'ACTIVA')
      )
    ).limit(1);

    // Build observations with benefit metadata if provided
    const obsFinal = buildObservacionesWithBeneficio(data.observaciones, {
      condicionArancelaria: data.condicionArancelaria,
      convenioNombre: data.convenioNombre,
      resolucionSustento: data.resolucionSustento,
      montoPactado: data.montoPactado,
      porcentajeDescuento: data.porcentajeDescuento
    });

    if (existingActive.length > 0) {
      const [updated] = await db.update(matriculas).set({
        seccionId: data.seccionId !== undefined ? (data.seccionId || null) : existingActive[0].seccionId,
        condicion: data.condicion || existingActive[0].condicion,
        fechaMatricula: data.fechaMatricula || existingActive[0].fechaMatricula,
        observaciones: obsFinal,
      }).where(eq(matriculas.id, existingActive[0].id)).returning();

      const {
        beneficioTipo,
        beneficioNombre,
        resolucionSustento,
        montoPactado,
        porcentajeDescuento,
        cleanObservaciones
      } = parseBeneficioFromObservaciones(updated.observaciones);

      return res.json({
        id: updated.id,
        codigoMatricula: updated.codigoMatricula,
        estudianteId: updated.estudianteId,
        moduloId: updated.moduloId,
        programaId: resolvedProgramaId,
        seccionId: updated.seccionId || null,
        periodoAcademico: resolvedPeriodoCode,
        tipo: data.tipo || 'Regular',
        fechaMatricula: updated.fechaMatricula,
        condicion: updated.condicion,
        observaciones: cleanObservaciones || undefined,
        condicionArancelaria: beneficioTipo,
        convenioNombre: beneficioNombre,
        resolucionSustento: resolucionSustento,
        montoPactado: montoPactado,
        porcentajeDescuento: porcentajeDescuento
      });
    }

    let candidateCode = `${dni}-${shortMod?.toLowerCase() || 'mod'}-${Math.floor(100 + Math.random() * 900)}`;
    const codeCheck = await db.select({ id: matriculas.id }).from(matriculas).where(eq(matriculas.codigoMatricula, candidateCode)).limit(1);
    if (codeCheck.length > 0) {
      candidateCode = `${dni}-${shortMod?.toLowerCase() || 'mod'}-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    const [nuevaMat] = await db.insert(matriculas)
      .values({
        codigoMatricula: candidateCode,
        estudianteId: data.estudianteId,
        sedeId: sedeId!,
        periodoAcademicoId: pAcademicoId!,
        moduloId: moduloId,
        seccionId: data.seccionId || null,
        fechaMatricula: data.fechaMatricula || new Date().toISOString().split('T')[0],
        estadoMatricula: data.estadoMatricula || 'ACTIVA',
        condicion: data.condicion || 'Ingresante',
        formacion: data.formacion || null,
        oportunidadTecnica: data.oportunidadTecnica || null,
        observaciones: obsFinal || null
      })
      .returning();

    const {
      beneficioTipo,
      beneficioNombre,
      resolucionSustento,
      montoPactado,
      porcentajeDescuento,
      cleanObservaciones
    } = parseBeneficioFromObservaciones(nuevaMat.observaciones);

    res.json({
      id: nuevaMat.id,
      codigoMatricula: nuevaMat.codigoMatricula,
      estudianteId: nuevaMat.estudianteId,
      moduloId: nuevaMat.moduloId,
      programaId: resolvedProgramaId,
      seccionId: nuevaMat.seccionId || null,
      periodoAcademico: resolvedPeriodoCode,
      tipo: data.tipo || 'Regular',
      fechaMatricula: nuevaMat.fechaMatricula,
      condicion: nuevaMat.condicion,
      estadoMatricula: nuevaMat.estadoMatricula,
      formacion: nuevaMat.formacion,
      oportunidadTecnica: nuevaMat.oportunidadTecnica,
      observaciones: cleanObservaciones || undefined,
      condicionArancelaria: beneficioTipo,
      convenioNombre: beneficioNombre,
      resolucionSustento: resolucionSustento,
      montoPactado: montoPactado,
      porcentajeDescuento: porcentajeDescuento
    });
  } catch (error) {
    console.error('Error creating matricula:', error);
    res.status(500).json({ error: 'Error al registrar matrícula en el servidor' });
  }
});

// Eliminar matrícula
matriculaRouter.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.delete(matriculas).where(eq(matriculas.id, id));
    res.json({ success: true, message: 'Matrícula eliminada exitosamente' });
  } catch (error) {
    console.error('Error deleting matricula:', error);
    res.status(500).json({ error: 'Error deleting matricula' });
  }
});

// Actualizar estado / datos de matrícula
matriculaRouter.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      codigoMatricula,
      estado,
      estadoMatricula,
      tipo,
      condicion,
      seccionId,
      moduloId,
      sedeId,
      periodoAcademicoId,
      formacion,
      oportunidadTecnica,
      fechaMatricula,
      observaciones,
      condicionArancelaria,
      convenioNombre,
      resolucionSustento,
      montoPactado,
      porcentajeDescuento,
    } = req.body;
    
    const updateData: any = {};
    const rawEstado = estadoMatricula || estado;
    if (rawEstado) {
      const eUpper = String(rawEstado).toUpperCase().trim();
      if (eUpper === 'ACTIVO' || eUpper === 'ACTIVA' || eUpper === 'REGULAR' || eUpper === 'MATRICULADO') {
        updateData.estadoMatricula = 'ACTIVA';
      } else if (eUpper === 'INACTIVO' || eUpper === 'INACTIVA') {
        updateData.estadoMatricula = 'INACTIVA';
      } else {
        updateData.estadoMatricula = eUpper; // 'RESERVA', 'RETIRADO', 'CERTIFICADO', 'PROCESO'
      }
    }

    if (codigoMatricula !== undefined) updateData.codigoMatricula = codigoMatricula;
    if (condicion !== undefined) updateData.condicion = condicion;
    if (seccionId !== undefined) updateData.seccionId = seccionId || null;
    if (moduloId !== undefined) updateData.moduloId = moduloId;
    if (sedeId !== undefined) updateData.sedeId = sedeId;
    if (periodoAcademicoId !== undefined) updateData.periodoAcademicoId = periodoAcademicoId;
    if (formacion !== undefined) updateData.formacion = formacion;
    if (oportunidadTecnica !== undefined) updateData.oportunidadTecnica = oportunidadTecnica;
    if (fechaMatricula !== undefined) updateData.fechaMatricula = fechaMatricula;

    // Handle observations and tariff benefit metadata
    if (condicionArancelaria !== undefined) {
      let baseObs = observaciones;
      if (baseObs === undefined) {
        const current = await db.select({ observaciones: matriculas.observaciones }).from(matriculas).where(eq(matriculas.id, id)).limit(1);
        baseObs = current[0]?.observaciones || '';
      }
      updateData.observaciones = buildObservacionesWithBeneficio(baseObs, {
        condicionArancelaria,
        convenioNombre,
        resolucionSustento,
        montoPactado,
        porcentajeDescuento
      });
    } else if (observaciones !== undefined) {
      updateData.observaciones = observaciones;
    }

    const [updated] = await db.update(matriculas)
      .set(updateData)
      .where(eq(matriculas.id, id))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: 'Matrícula no encontrada' });
    }

    const {
      beneficioTipo,
      beneficioNombre,
      resolucionSustento: parsedSustento,
      montoPactado: parsedMonto,
      porcentajeDescuento: parsedPorc,
      cleanObservaciones
    } = parseBeneficioFromObservaciones(updated.observaciones);

    res.json({
      ...updated,
      condicionArancelaria: beneficioTipo,
      convenioNombre: beneficioNombre,
      resolucionSustento: parsedSustento,
      montoPactado: parsedMonto,
      porcentajeDescuento: parsedPorc,
      observaciones: cleanObservaciones || undefined
    });
  } catch (error: any) {
    console.error('Error updating matricula:', error);
    res.status(500).json({ error: error?.message || 'Error updating matricula' });
  }
});

// Registrar Retiro formal de matrícula
matriculaRouter.post('/retiro', async (req, res) => {
  try {
    const { matriculaId, motivo, tipoRetiro = 'VOLUNTARIO', numeroDocumentoSustento, fechaRetiro, observaciones, usuarioId } = req.body;
    if (!matriculaId || !motivo) {
      return res.status(400).json({ error: 'La matrícula y el motivo son requeridos' });
    }

    const matList = await db.select().from(matriculas).where(eq(matriculas.id, matriculaId)).limit(1);
    if (matList.length === 0) {
      return res.status(404).json({ error: 'Matrícula no encontrada' });
    }
    const mat = matList[0];

    // 1. Insertar en tabla retiros
    const [nuevoRetiro] = await db.insert(retiros).values({
      matriculaId: mat.id,
      fechaRetiro: fechaRetiro || new Date().toISOString().split('T')[0],
      motivo: motivo.trim(),
      tipoRetiro: tipoRetiro || 'VOLUNTARIO',
      numeroDocumentoSustento: numeroDocumentoSustento ? numeroDocumentoSustento.trim() : null,
      observaciones: observaciones ? observaciones.trim() : null,
      usuarioId: usuarioId || null
    }).returning();

    // 2. Actualizar estado de la matrícula
    const nuevoEstadoMat = tipoRetiro === 'RESERVA' ? 'RESERVA' : 'RETIRADO';
    const [updatedMatricula] = await db.update(matriculas).set({
      estadoMatricula: nuevoEstadoMat,
      observaciones: `${mat.observaciones ? mat.observaciones + ' | ' : ''}Retiro registrado: ${motivo.trim()}`
    }).where(eq(matriculas.id, matriculaId)).returning();

    res.json({
      success: true,
      retiro: nuevoRetiro,
      matricula: updatedMatricula
    });
  } catch (error: any) {
    console.error('Error registrando retiro:', error);
    res.status(500).json({ error: error?.message || 'Error al registrar retiro' });
  }
});

// Registrar Traslado de matrícula
matriculaRouter.post('/traslado', async (req, res) => {
  try {
    const {
      matriculaOrigenId,
      tipoTraslado = 'INTERNO_SECCION',
      seccionDestinoId,
      moduloDestinoId,
      programaDestinoId,
      planEstudioDestinoId,
      sedeDestinoId,
      institucionDestino,
      institucionOrigen,
      motivo,
      resolucionDirectoral,
      observaciones,
      usuarioId
    } = req.body;

    if (!matriculaOrigenId) {
      return res.status(400).json({ error: 'La matrícula de origen es requerida' });
    }

    const matList = await db.select().from(matriculas).where(eq(matriculas.id, matriculaOrigenId)).limit(1);
    if (matList.length === 0) {
      return res.status(404).json({ error: 'Matrícula origen no encontrada' });
    }
    const matOrigen = matList[0];

    let matriculaDestinoId: string | null = null;
    let nuevaMatricula: any = null;

    // Si es traslado interno (de sección o programa), crear la nueva matrícula activa
    if (tipoTraslado === 'INTERNO_SECCION' || tipoTraslado === 'INTERNO_PROGRAMA') {
      const targetModuloId = moduloDestinoId || matOrigen.moduloId;
      const targetSedeId = sedeDestinoId || matOrigen.sedeId;
      const targetSeccionId = seccionDestinoId || null;

      const codeBase = matOrigen.codigoMatricula.replace(/-t\d+$/, '');
      const candidateCode = `${codeBase}-t${Math.floor(10 + Math.random() * 90)}`;

      const [nuevaMat] = await db.insert(matriculas).values({
        codigoMatricula: candidateCode,
        estudianteId: matOrigen.estudianteId,
        sedeId: targetSedeId,
        periodoAcademicoId: matOrigen.periodoAcademicoId,
        moduloId: targetModuloId,
        seccionId: targetSeccionId,
        fechaMatricula: new Date().toISOString().split('T')[0],
        estadoMatricula: 'ACTIVA',
        condicion: 'TRASLADO',
        formacion: matOrigen.formacion,
        oportunidadTecnica: matOrigen.oportunidadTecnica,
        observaciones: `Traslado interno desde matrícula ${matOrigen.codigoMatricula}. ${motivo ? 'Motivo: ' + motivo : ''}`
      }).returning();

      matriculaDestinoId = nuevaMat.id;
      nuevaMatricula = nuevaMat;
    }

    // Actualizar matrícula de origen a TRASLADADO
    const [updatedOrigen] = await db.update(matriculas).set({
      estadoMatricula: 'TRASLADADO'
    }).where(eq(matriculas.id, matriculaOrigenId)).returning();

    // Insertar en tabla traslados
    const [nuevoTraslado] = await db.insert(traslados).values({
      matriculaOrigenId: matOrigen.id,
      tipoTraslado,
      sedeDestinoId: sedeDestinoId || matOrigen.sedeId,
      programaDestinoId: programaDestinoId || null,
      planEstudioDestinoId: planEstudioDestinoId || null,
      moduloDestinoId: moduloDestinoId || matOrigen.moduloId,
      seccionDestinoId: seccionDestinoId || null,
      institucionDestino: institucionDestino || null,
      institucionOrigen: institucionOrigen || null,
      estado: 'APROBADO',
      matriculaDestinoId,
      resolucionDirectoral: resolucionDirectoral || null,
      fechaSolicitud: new Date().toISOString().split('T')[0],
      fechaAprobacion: new Date().toISOString().split('T')[0],
      motivo: motivo || null,
      observaciones: observaciones || null,
      usuarioId: usuarioId || null
    }).returning();

    res.json({
      success: true,
      traslado: nuevoTraslado,
      matriculaOrigen: updatedOrigen,
      matriculaDestino: nuevaMatricula
    });
  } catch (error: any) {
    console.error('Error registrando traslado:', error);
    res.status(500).json({ error: error?.message || 'Error al registrar traslado' });
  }
});

// Registrar Reingreso de matrícula
matriculaRouter.post('/reingreso', async (req, res) => {
  try {
    const {
      estudianteId,
      matriculaAnteriorId,
      seccionId,
      moduloId,
      sedeId,
      periodoAcademicoId,
      motivo,
      resolucionNumero,
      requiereConvalidacion = false,
      observaciones,
      usuarioId
    } = req.body;

    if (!estudianteId || !moduloId) {
      return res.status(400).json({ error: 'El estudiante y el módulo son requeridos' });
    }

    let resolvedSedeId = sedeId;
    if (!resolvedSedeId && seccionId) {
      const sec = await db.select({ sedeId: secciones.sedeId }).from(secciones).where(eq(secciones.id, seccionId)).limit(1);
      resolvedSedeId = sec[0]?.sedeId;
    }
    if (!resolvedSedeId) {
      const firstSede = await db.select({ id: sedes.id }).from(sedes).limit(1);
      resolvedSedeId = firstSede[0]?.id;
    }

    let resolvedPaId = periodoAcademicoId;
    if (!resolvedPaId) {
      const firstPa = await db.select({ id: periodosAcademicos.id }).from(periodosAcademicos).limit(1);
      resolvedPaId = firstPa[0]?.id;
    }

    const [estData] = await db
      .select({ dni: personas.numeroDocumento })
      .from(estudiantes)
      .innerJoin(personas, eq(estudiantes.personaId, personas.id))
      .where(eq(estudiantes.id, estudianteId))
      .limit(1);

    const dni = estData?.dni || 'EST';
    const candidateCode = `${dni}-reing-${Math.floor(100 + Math.random() * 900)}`;

    const [nuevaMat] = await db.insert(matriculas).values({
      codigoMatricula: candidateCode,
      estudianteId,
      sedeId: resolvedSedeId!,
      periodoAcademicoId: resolvedPaId!,
      moduloId,
      seccionId: seccionId || null,
      fechaMatricula: new Date().toISOString().split('T')[0],
      estadoMatricula: 'ACTIVA',
      condicion: 'REINGRESO',
      observaciones: `Reingreso formal registrado. ${observaciones || ''}`.trim()
    }).returning();

    const [nuevoReingreso] = await db.insert(reingresos).values({
      estudianteId,
      matriculaAnteriorId: matriculaAnteriorId || null,
      nuevaMatriculaId: nuevaMat.id,
      fecha: new Date().toISOString().split('T')[0],
      motivo: motivo || null,
      observaciones: observaciones || null,
      usuarioId: usuarioId || null,
      periodoAcademicoReingresoId: resolvedPaId || null,
      resolucionNumero: resolucionNumero || null,
      requiereConvalidacion: Boolean(requiereConvalidacion)
    }).returning();

    res.json({
      success: true,
      reingreso: nuevoReingreso,
      matricula: nuevaMat
    });
  } catch (error: any) {
    console.error('Error registrando reingreso:', error);
    res.status(500).json({ error: error?.message || 'Error al registrar reingreso' });
  }
});

// Consultar historial de movimientos (retiros, traslados, reingresos) del estudiante
matriculaRouter.get('/movimientos/:estudianteId', async (req, res) => {
  try {
    const { estudianteId } = req.params;

    const userRetiros = await db
      .select({
        retiro: retiros,
        codigoMatricula: matriculas.codigoMatricula
      })
      .from(retiros)
      .innerJoin(matriculas, eq(retiros.matriculaId, matriculas.id))
      .where(eq(matriculas.estudianteId, estudianteId))
      .orderBy(desc(retiros.fechaRetiro));

    const userTraslados = await db
      .select({
        traslado: traslados,
        codigoMatriculaOrigen: matriculas.codigoMatricula
      })
      .from(traslados)
      .innerJoin(matriculas, eq(traslados.matriculaOrigenId, matriculas.id))
      .where(eq(matriculas.estudianteId, estudianteId))
      .orderBy(desc(traslados.fechaSolicitud));

    const userReingresos = await db
      .select({
        reingreso: reingresos,
        codigoNuevaMatricula: matriculas.codigoMatricula
      })
      .from(reingresos)
      .innerJoin(matriculas, eq(reingresos.nuevaMatriculaId, matriculas.id))
      .where(eq(reingresos.estudianteId, estudianteId))
      .orderBy(desc(reingresos.fecha));

    res.json({
      retiros: userRetiros.map(r => ({ ...r.retiro, codigoMatricula: r.codigoMatricula })),
      traslados: userTraslados.map(t => ({ ...t.traslado, codigoMatriculaOrigen: t.codigoMatriculaOrigen })),
      reingresos: userReingresos.map(rg => ({ ...rg.reingreso, codigoNuevaMatricula: rg.codigoNuevaMatricula }))
    });
  } catch (error) {
    console.error('Error fetching movimientos:', error);
    res.status(500).json({ error: 'Error fetching movimientos' });
  }
});
