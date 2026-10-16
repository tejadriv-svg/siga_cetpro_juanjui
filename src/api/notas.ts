import { Router } from 'express';
import { db } from '../db/index.js';
import { notasUnidades, notasEfsrt, efsrt, asistenciasEstudiantes, estadosAsistencias, auditorias, matriculas } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { requireAuth } from '../middleware/auth.js';

export const notasRouter = Router();

// 1. GET /api/notas/unidades
notasRouter.get('/unidades', async (req, res) => {
  try {
    const { unidadId, matriculaId, estudianteId } = req.query;
    const conditions = [];

    if (unidadId && typeof unidadId === 'string') {
      conditions.push(eq(notasUnidades.unidadId, unidadId));
    }
    if (matriculaId && typeof matriculaId === 'string') {
      conditions.push(eq(notasUnidades.matriculaId, matriculaId));
    }
    if (estudianteId && typeof estudianteId === 'string') {
      conditions.push(eq(notasUnidades.estudianteId, estudianteId));
    }

    const query = conditions.length > 0
      ? db.select().from(notasUnidades).where(and(...conditions))
      : db.select().from(notasUnidades);

    const records = await query;
    res.json(records.map(r => {
      const c1Val = r.c1 != null ? Number(r.c1) : undefined;
      const c2Val = r.c2 != null ? Number(r.c2) : undefined;
      const c3Val = r.c3 != null ? Number(r.c3) : undefined;
      const notaFinal = r.nota != null ? Number(r.nota) : 0;
      const recupVal = r.recuperacion != null ? Number(r.recuperacion) : undefined;

      return {
        id: r.id,
        matriculaId: r.matriculaId,
        estudianteId: r.estudianteId || '',
        unidadDidacticaId: r.unidadId,
        c1: c1Val,
        c2: c2Val,
        c3: c3Val,
        // Compatibilidad retroactiva con componentes antiguos:
        i1: c1Val ?? 0,
        i2: c2Val ?? 0,
        i3: c3Val ?? 0,
        promedioFinal: notaFinal,
        recuperacion: recupVal,
        estado: r.estado || 'PENDIENTE',
        criteriosDetalle: r.criteriosDetalle || null,
        conclusionDescriptiva: r.conclusionDescriptiva || '',
        bloqueado: r.bloqueado ?? false,
        fechaCierre: r.fechaCierre || null,
        fechaRegistro: r.fechaRegistro,
        fechaActualizacion: r.fechaActualizacion,
        usuarioId: r.usuarioId
      };
    }));
  } catch (error: any) {
    console.error('Error fetching notas_unidades:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// 2. POST /api/notas/unidades
notasRouter.post('/unidades', async (req, res) => {
  try {
    const dataList = req.body; // Expects an array
    if (!Array.isArray(dataList) || dataList.length === 0) {
      return res.status(400).json({ error: 'Se esperaba un arreglo de calificaciones' });
    }

    const isUuid = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
    const results = [];
    let usuarioActorId: string | null = null;

    for (const data of dataList) {
      const safeMatriculaId = isUuid(data.matriculaId) ? data.matriculaId : null;
      const safeUnidadId = isUuid(data.unidadDidacticaId) ? data.unidadDidacticaId : null;
      const safeEstudianteId = isUuid(data.estudianteId) ? data.estudianteId : null;

      if (!safeMatriculaId || !safeUnidadId) continue;
      if (data.usuarioId && isUuid(data.usuarioId)) usuarioActorId = data.usuarioId;

      // Buscar registro existente
      let existing = [];
      if (isUuid(data.id)) {
        existing = await db.select().from(notasUnidades).where(eq(notasUnidades.id, data.id));
      }
      if (existing.length === 0) {
        existing = await db.select().from(notasUnidades).where(
          and(
            eq(notasUnidades.matriculaId, safeMatriculaId),
            eq(notasUnidades.unidadId, safeUnidadId)
          )
        );
      }

      // Validar si la unidad/acta está bloqueada
      if (existing.length > 0 && existing[0].bloqueado && !data.forzarDesbloqueo) {
        return res.status(403).json({
          error: 'Esta unidad didáctica se encuentra con el acta CERRADA y BLOQUEADA. Solicite reapertura a la Dirección.',
          unidadId: safeUnidadId
        });
      }

      // Capacidades e indicadores
      const c1 = data.c1 !== undefined ? data.c1 : (data.i1 !== undefined ? data.i1 : null);
      const c2 = data.c2 !== undefined ? data.c2 : (data.i2 !== undefined ? data.i2 : null);
      const c3 = data.c3 !== undefined ? data.c3 : (data.i3 !== undefined ? data.i3 : null);
      const recup = data.recuperacion !== undefined && data.recuperacion !== '' && !isNaN(data.recuperacion) ? Number(data.recuperacion) : null;

      // Cálculo de promedio ponderado según RVM 188-2020:
      let promCalculado = 0;
      if (c1 !== null && c2 !== null && c3 !== null) {
        promCalculado = Math.round((Number(c1) + Number(c2) + Number(c3)) / 3);
      } else if (data.promedioFinal !== undefined) {
        promCalculado = Number(data.promedioFinal);
      }

      let promFinal = promCalculado;
      if (recup !== null && recup > promCalculado) {
        promFinal = recup;
      }

      // Cálculo de estado normativo
      let estadoCalc = 'PENDIENTE';
      if (data.estado && ['CONVALIDADO', 'RETIRADO'].includes(data.estado.toUpperCase())) {
        estadoCalc = data.estado.toUpperCase();
      } else if (c1 !== null || c2 !== null || c3 !== null || promFinal > 0) {
        if (promFinal >= 13) {
          estadoCalc = 'APROBADO';
        } else if (promCalculado >= 10 && (recup === null || recup === 0)) {
          estadoCalc = 'RECUPERACION';
        } else {
          estadoCalc = 'DESAPROBADO';
        }
      }

      const payloadFields = {
        matriculaId: safeMatriculaId,
        estudianteId: safeEstudianteId || (existing[0]?.estudianteId ?? null),
        unidadId: safeUnidadId,
        c1: c1 !== null ? c1.toString() : null,
        c2: c2 !== null ? c2.toString() : null,
        c3: c3 !== null ? c3.toString() : null,
        nota: promFinal > 0 ? promFinal.toString() : null,
        recuperacion: recup !== null ? recup.toString() : null,
        estado: estadoCalc,
        criteriosDetalle: data.criteriosDetalle || null,
        conclusionDescriptiva: typeof data.conclusionDescriptiva === 'string' ? data.conclusionDescriptiva : (data.observaciones || null),
        fechaActualizacion: new Date().toISOString(),
        usuarioId: usuarioActorId || existing[0]?.usuarioId || null
      };

      if (existing.length > 0) {
        const [updated] = await db.update(notasUnidades)
          .set(payloadFields)
          .where(eq(notasUnidades.id, existing[0].id))
          .returning();
        results.push(updated);
      } else {
        const [inserted] = await db.insert(notasUnidades)
          .values(payloadFields)
          .returning();
        results.push(inserted);
      }
    }

    // Registrar auditoría del guardado
    if (results.length > 0) {
      try {
        await db.insert(auditorias).values({
          usuarioId: usuarioActorId,
          accion: 'REGISTRO_CALIFICACIONES',
          tabla: 'notas_unidades',
          registroId: results[0].id,
          datosNuevos: {
            detalle: `Guardado masivo de ${results.length} calificaciones en matriz de evaluación.`
          }
        });
      } catch (auditErr) {
        console.warn('Auditoria no insertada:', auditErr);
      }
    }

    res.json({ success: true, count: results.length, notas: results });
  } catch (error: any) {
    console.error('Error saving notas_unidades:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// 3. POST /api/notas/unidades/cerrar-acta
notasRouter.post('/unidades/cerrar-acta', async (req, res) => {
  try {
    const { unidadId, seccionId, usuarioId } = req.body;
    if (!unidadId) {
      return res.status(400).json({ error: 'unidadId es requerido para cerrar el acta' });
    }

    const nowIso = new Date().toISOString();
    const updated = await db.update(notasUnidades)
      .set({
        bloqueado: true,
        fechaCierre: nowIso,
        fechaActualizacion: nowIso,
        usuarioId: usuarioId || null
      })
      .where(eq(notasUnidades.unidadId, unidadId))
      .returning();

    // Auditoría
    try {
      await db.insert(auditorias).values({
        usuarioId: usuarioId || null,
        accion: 'CIERRE_ACTA_EVALUACION',
        tabla: 'notas_unidades',
        registroId: unidadId,
        datosNuevos: {
          detalle: `Cierre y bloqueo definitivo del acta de notas para la Unidad Didáctica ${unidadId}. Total alumnos sellados: ${updated.length}`
        }
      });
    } catch (e) {}

    res.json({
      success: true,
      message: `Acta cerrada y sellada exitosamente (${updated.length} alumnos bloqueados).`,
      count: updated.length
    });
  } catch (error: any) {
    console.error('Error cerrando acta:', error);
    res.status(500).json({ error: 'Error al cerrar acta', details: error.message });
  }
});

// 4. POST /api/notas/unidades/desbloquear-acta
notasRouter.post('/unidades/desbloquear-acta', async (req, res) => {
  try {
    const { unidadId, usuarioId, motivo } = req.body;
    if (!unidadId) {
      return res.status(400).json({ error: 'unidadId es requerido para reabrir el acta' });
    }

    const nowIso = new Date().toISOString();
    const updated = await db.update(notasUnidades)
      .set({
        bloqueado: false,
        fechaCierre: null,
        fechaActualizacion: nowIso,
        usuarioId: usuarioId || null
      })
      .where(eq(notasUnidades.unidadId, unidadId))
      .returning();

    // Auditoría
    try {
      await db.insert(auditorias).values({
        usuarioId: usuarioId || null,
        accion: 'REAPERTURA_ACTA_EVALUACION',
        tabla: 'notas_unidades',
        registroId: unidadId,
        datosNuevos: {
          detalle: `Reapertura de acta de la Unidad Didáctica ${unidadId}. Motivo: ${motivo || 'Rectificación solicitada'}`
        }
      });
    } catch (e) {}

    res.json({
      success: true,
      message: `Acta desbloqueada para edición (${updated.length} registros).`,
      count: updated.length
    });
  } catch (error: any) {
    console.error('Error desbloqueando acta:', error);
    res.status(500).json({ error: 'Error al desbloquear acta', details: error.message });
  }
});

// ==========================================
// EVALUACIÓN DE EFSRT (PRÁCTICAS PREPROFESIONALES)
// ==========================================

// 1. GET /api/notas/efsrt
notasRouter.get('/efsrt', async (req, res) => {
  try {
    const records = await db
      .select({
        nota: notasEfsrt,
        efsrtInfo: efsrt,
      })
      .from(notasEfsrt)
      .leftJoin(efsrt, eq(notasEfsrt.efsrtId, efsrt.id));

    res.json(records.map(({ nota: r, efsrtInfo }) => {
      const notaVig = Number(r.nota || 0);
      return {
        id: r.id,
        matriculaId: r.matriculaId,
        estudianteId: r.estudianteId,
        efsrtId: r.efsrtId,
        moduloId: efsrtInfo?.moduloId || '',
        modalidad: r.modalidad || 'EMPRESA',
        empresaRuc: r.empresaRuc || '',
        empresaNombre: r.empresaNombre || '',
        empresaDireccion: r.empresaDireccion || '',
        supervisorEmpresa: r.supervisorEmpresa || '',
        supervisorEmpresaCargo: r.supervisorEmpresaCargo || '',
        docenteSupervisorId: r.docenteSupervisorId || '',
        horasCompletadas: Number(r.horasCompletadas || 0),
        horasRequeridas: Number(efsrtInfo?.horas || 0),
        dominioOperativo: Number(r.dominioOperativo || 0),
        usoEquipos: Number(r.usoEquipos || 0),
        seguridadHigiene: Number(r.seguridadHigiene || 0),
        puntualidadAsistencia: Number(r.puntualidadAsistencia || 0),
        trabajoEquipo: Number(r.trabajoEquipo || 0),
        iniciativaAdaptabilidad: Number(r.iniciativaAdaptabilidad || 0),
        notaVigesimal: notaVig,
        fechaInicio: r.fechaInicio ? String(r.fechaInicio) : '',
        fechaTermino: r.fechaTermino ? String(r.fechaTermino) : '',
        numeroConstancia: r.numeroConstancia || '',
        archivoConstanciaUrl: r.archivoConstanciaUrl || '',
        estado: r.estado || (notaVig >= 13 ? 'APROBADO' : notaVig > 0 ? 'DESAPROBADO' : 'EN_EJECUCION'),
        conclusionDescriptiva: r.conclusionDescriptiva || '',
        bloqueado: Boolean(r.bloqueado),
        fechaCierre: r.fechaCierre,
        fechaRegistro: r.fechaRegistro,
        fechaActualizacion: r.fechaActualizacion,
        usuarioId: r.usuarioId
      };
    }));
  } catch (error: any) {
    console.error('Error fetching notas_efsrt:', error);
    res.status(500).json({ error: 'Error al consultar notas EFSRT', details: error.message });
  }
});

// 2. POST /api/notas/efsrt (Compatible con individual y Batch)
notasRouter.post('/efsrt', async (req, res) => {
  try {
    const payload = req.body;
    const items: any[] = Array.isArray(payload) 
      ? payload 
      : Array.isArray(payload.registros) 
      ? payload.registros 
      : [payload];

    const actorUsuarioId = req.body.usuarioId || null;
    const results = [];
    const isUuid = (str?: string) => Boolean(str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str));

    for (const item of items) {
      if (!item) continue;

      // 1. Obtener o resolver efsrtId del módulo
      let realEfsrtId = item.efsrtId;
      if (!isUuid(realEfsrtId) && isUuid(item.moduloId)) {
        const foundEfsrt = await db.select().from(efsrt).where(eq(efsrt.moduloId, item.moduloId)).limit(1);
        if (foundEfsrt.length > 0) {
          realEfsrtId = foundEfsrt[0].id;
        } else {
          const [inserted] = await db.insert(efsrt).values({
            moduloId: item.moduloId,
            codigo: 'EFSRT-' + Math.random().toString(36).substring(2, 7).toUpperCase(),
            nombre: 'Prácticas Preprofesionales (EFSRT)',
            horas: 120,
            creditos: '4.00'
          }).returning();
          realEfsrtId = inserted.id;
        }
      }

      if (!isUuid(realEfsrtId)) {
        continue;
      }

      // 2. Resolver estudianteId y matriculaId
      let safeEstudianteId = isUuid(item.estudianteId) ? item.estudianteId : null;
      let safeMatriculaId = isUuid(item.matriculaId) ? item.matriculaId : null;

      if (!safeEstudianteId && safeMatriculaId) {
        const mRow = await db.select().from(matriculas).where(eq(matriculas.id, safeMatriculaId)).limit(1);
        if (mRow.length > 0) safeEstudianteId = mRow[0].estudianteId;
      }

      if (!safeMatriculaId && safeEstudianteId) {
        const mRow = await db.select().from(matriculas).where(eq(matriculas.estudianteId, safeEstudianteId)).limit(1);
        if (mRow.length > 0) safeMatriculaId = mRow[0].id;
      }

      if (!safeMatriculaId) continue;

      // 3. Verificar si el registro existe y si está bloqueado
      let existing = null;
      if (isUuid(item.id)) {
        const rows = await db.select().from(notasEfsrt).where(eq(notasEfsrt.id, item.id)).limit(1);
        if (rows.length > 0) existing = rows[0];
      }
      if (!existing && safeMatriculaId && realEfsrtId) {
        const rows = await db.select().from(notasEfsrt)
          .where(and(eq(notasEfsrt.matriculaId, safeMatriculaId), eq(notasEfsrt.efsrtId, realEfsrtId)))
          .limit(1);
        if (rows.length > 0) existing = rows[0];
      }

      if (existing && existing.bloqueado) {
        return res.status(403).json({
          error: 'El registro de EFSRT se encuentra CERRADO y SELLADO oficialmente. No se permiten modificaciones sin reapertura formal.'
        });
      }

      // 4. Calcular promedio de los 6 indicadores (RVM 188-2020)
      const domOp = Math.max(0, Math.min(20, Number(item.dominioOperativo || 0)));
      const usoEq = Math.max(0, Math.min(20, Number(item.usoEquipos || 0)));
      const segHig = Math.max(0, Math.min(20, Number(item.seguridadHigiene || 0)));
      const puntAs = Math.max(0, Math.min(20, Number(item.puntualidadAsistencia || 0)));
      const trabEq = Math.max(0, Math.min(20, Number(item.trabajoEquipo || 0)));
      const inicAd = Math.max(0, Math.min(20, Number(item.iniciativaAdaptabilidad || 0)));

      const sumIndicadores = domOp + usoEq + segHig + puntAs + trabEq + inicAd;
      let finalGrade = item.notaVigesimal !== undefined && item.notaVigesimal !== null && item.notaVigesimal > 0
        ? Math.round(Number(item.notaVigesimal))
        : sumIndicadores > 0 
        ? Math.round(sumIndicadores / 6)
        : 0;

      finalGrade = Math.max(0, Math.min(20, finalGrade));

      let estadoCalculado = 'EN_EJECUCION';
      if (finalGrade >= 13) {
        estadoCalculado = 'APROBADO';
      } else if (finalGrade > 0) {
        estadoCalculado = 'DESAPROBADO';
      }

      const nowIso = new Date().toISOString();
      const fieldsToSave = {
        matriculaId: safeMatriculaId,
        estudianteId: safeEstudianteId,
        efsrtId: realEfsrtId,
        dominioOperativo: domOp.toString(),
        usoEquipos: usoEq.toString(),
        seguridadHigiene: segHig.toString(),
        puntualidadAsistencia: puntAs.toString(),
        trabajoEquipo: trabEq.toString(),
        iniciativaAdaptabilidad: inicAd.toString(),
        nota: finalGrade.toString(),
        modalidad: item.modalidad || 'EMPRESA',
        empresaRuc: item.empresaRuc || null,
        empresaNombre: item.empresaNombre || null,
        empresaDireccion: item.empresaDireccion || null,
        supervisorEmpresa: item.supervisorEmpresa || null,
        supervisorEmpresaCargo: item.supervisorEmpresaCargo || null,
        docenteSupervisorId: isUuid(item.docenteSupervisorId) ? item.docenteSupervisorId : null,
        horasCompletadas: Number(item.horasCompletadas || 0),
        fechaInicio: item.fechaInicio ? item.fechaInicio : null,
        fechaTermino: item.fechaTermino ? item.fechaTermino : null,
        numeroConstancia: item.numeroConstancia || null,
        archivoConstanciaUrl: item.archivoConstanciaUrl || item.constanciaUrl || null,
        estado: estadoCalculado,
        fechaActualizacion: nowIso,
        usuarioId: actorUsuarioId || item.usuarioId || null,
      };

      if (existing) {
        const [updated] = await db.update(notasEfsrt)
          .set(fieldsToSave)
          .where(eq(notasEfsrt.id, existing.id))
          .returning();
        results.push(updated);
      } else {
        const [inserted] = await db.insert(notasEfsrt)
          .values({
            ...fieldsToSave,
            fechaRegistro: nowIso,
            bloqueado: false
          })
          .returning();
        results.push(inserted);
      }
    }

    // Auditoría
    if (results.length > 0) {
      try {
        await db.insert(auditorias).values({
          usuarioId: actorUsuarioId,
          accion: 'REGISTRO_NOTAS_EFSRT',
          tabla: 'notas_efsrt',
          registroId: results[0].id,
          datosNuevos: {
            detalle: `Guardado de evaluación EFSRT para ${results.length} estudiantes.`
          }
        });
      } catch (e) {}
    }

    res.json({ success: true, count: results.length, notas: results });
  } catch (error: any) {
    console.error('Error saving notas_efsrt:', error);
    res.status(500).json({ error: 'Error al registrar notas EFSRT', details: error.message });
  }
});

// 3. POST /api/notas/efsrt/cerrar-acta
notasRouter.post('/efsrt/cerrar-acta', async (req, res) => {
  try {
    const { moduloId, efsrtId, usuarioId } = req.body;
    let targetEfsrtId = efsrtId;

    if (!targetEfsrtId && moduloId) {
      const eRows = await db.select().from(efsrt).where(eq(efsrt.moduloId, moduloId)).limit(1);
      if (eRows.length > 0) targetEfsrtId = eRows[0].id;
    }

    if (!targetEfsrtId) {
      return res.status(400).json({ error: 'efsrtId o moduloId es requerido para sellar el registro EFSRT' });
    }

    const nowIso = new Date().toISOString();
    const updated = await db.update(notasEfsrt)
      .set({
        bloqueado: true,
        fechaCierre: nowIso,
        fechaActualizacion: nowIso,
        usuarioId: usuarioId || null
      })
      .where(eq(notasEfsrt.efsrtId, targetEfsrtId))
      .returning();

    try {
      await db.insert(auditorias).values({
        usuarioId: usuarioId || null,
        accion: 'CIERRE_ACTA_EFSRT',
        tabla: 'notas_efsrt',
        registroId: targetEfsrtId,
        datosNuevos: {
          detalle: `Cierre y blindaje definitivo de evaluaciones EFSRT (${updated.length} alumnos).`
        }
      });
    } catch (e) {}

    res.json({
      success: true,
      message: `Registro de EFSRT cerrado y sellado exitosamente (${updated.length} estudiantes).`,
      count: updated.length
    });
  } catch (error: any) {
    console.error('Error cerrando acta EFSRT:', error);
    res.status(500).json({ error: 'Error al cerrar acta EFSRT', details: error.message });
  }
});

// 4. POST /api/notas/efsrt/desbloquear-acta
notasRouter.post('/efsrt/desbloquear-acta', async (req, res) => {
  try {
    const { moduloId, efsrtId, usuarioId, motivo } = req.body;
    let targetEfsrtId = efsrtId;

    if (!targetEfsrtId && moduloId) {
      const eRows = await db.select().from(efsrt).where(eq(efsrt.moduloId, moduloId)).limit(1);
      if (eRows.length > 0) targetEfsrtId = eRows[0].id;
    }

    if (!targetEfsrtId) {
      return res.status(400).json({ error: 'efsrtId o moduloId es requerido para reabrir el registro EFSRT' });
    }

    const nowIso = new Date().toISOString();
    const updated = await db.update(notasEfsrt)
      .set({
        bloqueado: false,
        fechaCierre: null,
        fechaActualizacion: nowIso,
        usuarioId: usuarioId || null
      })
      .where(eq(notasEfsrt.efsrtId, targetEfsrtId))
      .returning();

    try {
      await db.insert(auditorias).values({
        usuarioId: usuarioId || null,
        accion: 'REAPERTURA_ACTA_EFSRT',
        tabla: 'notas_efsrt',
        registroId: targetEfsrtId,
        datosNuevos: {
          detalle: `Reapertura de registro EFSRT. Motivo: ${motivo || 'Rectificación solicitada'}`
        }
      });
    } catch (e) {}

    res.json({
      success: true,
      message: `Registro de EFSRT desbloqueado para edición (${updated.length} alumnos).`,
      count: updated.length
    });
  } catch (error: any) {
    console.error('Error desbloqueando acta EFSRT:', error);
    res.status(500).json({ error: 'Error al desbloquear acta EFSRT', details: error.message });
  }
});

// ==========================================
// CONTROL DE ASISTENCIA DE ESTUDIANTES
// ==========================================

// Obtener catálogo de estados de asistencias (PRES, TARD, FALT, JUST)
notasRouter.get('/asistencias/estados', async (req, res) => {
  try {
    const estados = await db.select().from(estadosAsistencias).orderBy(estadosAsistencias.codigo);
    res.json(estados.map(e => ({
      id: e.id,
      codigo: e.codigo,
      nombre: e.nombre,
      afectaPorcentaje: Boolean(e.afectaPorcentaje)
    })));
  } catch (error: any) {
    console.error('Error fetching estados_asistencias:', error);
    res.status(500).json({ error: 'Error fetching estados de asistencia', details: error.message });
  }
});

// Obtener asistencias por sección, unidad y/o fecha
notasRouter.get('/asistencias', async (req, res) => {
  try {
    const { seccionId, unidadId, fecha } = req.query;

    const conditions = [];
    if (seccionId && typeof seccionId === 'string') {
      conditions.push(eq(asistenciasEstudiantes.seccionId, seccionId));
    }
    if (unidadId && typeof unidadId === 'string') {
      conditions.push(eq(asistenciasEstudiantes.unidadId, unidadId));
    }
    if (fecha && typeof fecha === 'string') {
      conditions.push(eq(asistenciasEstudiantes.fecha, fecha));
    }

    const records = await db
      .select({
        asistencia: asistenciasEstudiantes,
        estado: estadosAsistencias
      })
      .from(asistenciasEstudiantes)
      .leftJoin(estadosAsistencias, eq(asistenciasEstudiantes.estadoAsistenciaId, estadosAsistencias.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    res.json(records.map(r => ({
      id: r.asistencia.id,
      matriculaId: r.asistencia.matriculaId,
      unidadId: r.asistencia.unidadId || undefined,
      seccionId: r.asistencia.seccionId || undefined,
      fecha: r.asistencia.fecha,
      estadoAsistenciaId: r.asistencia.estadoAsistenciaId,
      codigoEstado: r.estado?.codigo || 'PRES',
      nombreEstado: r.estado?.nombre || 'Presente',
      observacion: r.asistencia.observacion || undefined,
      usuarioId: r.asistencia.usuarioId || undefined
    })));
  } catch (error: any) {
    console.error('Error fetching asistencias_estudiantes:', error);
    res.status(500).json({ error: 'Error fetching asistencias', details: error.message });
  }
});

// Guardar asistencias en lote (batch upsert por día y sección)
notasRouter.post('/asistencias/batch', async (req, res) => {
  try {
    const { fecha, unidadId, seccionId, registros, usuarioId } = req.body;

    if (!fecha || !Array.isArray(registros) || registros.length === 0) {
      return res.status(400).json({ error: 'Parámetros incompletos (fecha y registros requeridos)' });
    }

    const savedResults = [];

    for (const item of registros) {
      const { matriculaId, estadoAsistenciaId, observacion } = item;
      if (!matriculaId || !estadoAsistenciaId) continue;

      const whereClause = and(
        eq(asistenciasEstudiantes.matriculaId, matriculaId),
        unidadId ? eq(asistenciasEstudiantes.unidadId, unidadId) : eq(asistenciasEstudiantes.fecha, fecha),
        eq(asistenciasEstudiantes.fecha, fecha)
      );

      const existing = await db
        .select({ id: asistenciasEstudiantes.id })
        .from(asistenciasEstudiantes)
        .where(whereClause)
        .limit(1);

      if (existing.length > 0) {
        const [updated] = await db
          .update(asistenciasEstudiantes)
          .set({
            estadoAsistenciaId,
            seccionId: seccionId || null,
            observacion: observacion || null,
            usuarioId: usuarioId || null
          })
          .where(eq(asistenciasEstudiantes.id, existing[0].id))
          .returning();
        savedResults.push(updated);
      } else {
        const [created] = await db
          .insert(asistenciasEstudiantes)
          .values({
            matriculaId,
            unidadId: unidadId || null,
            seccionId: seccionId || null,
            fecha,
            estadoAsistenciaId,
            observacion: observacion || null,
            usuarioId: usuarioId || null
          })
          .returning();
        savedResults.push(created);
      }
    }

    res.json({
      success: true,
      count: savedResults.length,
      asistencias: savedResults
    });
  } catch (error: any) {
    console.error('Error saving batch asistencias:', error);
    res.status(500).json({ error: 'Error guardando asistencias', details: error.message });
  }
});
