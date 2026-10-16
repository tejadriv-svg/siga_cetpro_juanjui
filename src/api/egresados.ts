import { Router } from 'express';
import { db } from '../db/index.js';
import { egresados, estudiantes, personas, programas, planesEstudios, nivelesFormativos, matriculas, modulos, notasUnidades, notasEfsrt, auditorias, personasRoles, rolesPersonas } from '../db/schema.js';
import { eq, and, desc, sql, or, ilike } from 'drizzle-orm';
import crypto from 'crypto';

function normalizeSituacionLaboral(sit?: string): string {
  if (!sit) return 'BUSCANDO_EMPLEO';
  const u = sit.toUpperCase().trim();
  if (u.includes('ESPECIALIDAD') || u.includes('AREA') || u.includes('TRABAJANDO')) return 'TRABAJANDO_EN_ESPECIALIDAD';
  if (u.includes('OTRA')) return 'TRABAJANDO_OTRA_AREA';
  if (u.includes('EMPRENDIMIENTO') || u.includes('NEGOCIO') || u.includes('PROPIO')) return 'EMPRENDIMIENTO_PROPIO';
  if (u.includes('SUPERIOR') || u.includes('ESTUDIANDO')) return 'ESTUDIANDO_SUPERIOR';
  if (u.includes('NO_DISP') || u.includes('INACTIVO')) return 'NO_DISPONIBLE';
  return 'BUSCANDO_EMPLEO';
}

export const egresadosRouter = Router();

// -------------------------------------------------------------
// 1. GET /api/egresados (Listado Oficial Relacional)
// -------------------------------------------------------------
egresadosRouter.get('/', async (_req, res) => {
  try {
    const rows = await db
      .select({
        id: egresados.id,
        estudianteId: egresados.estudianteId,
        programaId: egresados.programaId,
        planEstudioId: egresados.planEstudioId,
        matriculaId: egresados.matriculaId,
        codigoEgresado: egresados.codigoEgresado,
        fechaEgreso: egresados.fechaEgreso,
        estadoTramite: egresados.estadoTramite,
        totalCreditosAprobados: egresados.totalCreditosAprobados,
        totalHorasAcumuladas: egresados.totalHorasAcumuladas,
        resolucionDirectoral: egresados.resolucionDirectoral,
        tomoFolio: egresados.tomoFolio,
        codigoVerificacionQr: egresados.codigoVerificacionQr,
        hashSeguridad: egresados.hashSeguridad,
        modalidadTitulacion: egresados.modalidadTitulacion,
        fechaSustentacion: egresados.fechaSustentacion,
        calificacionTitulacion: egresados.calificacionTitulacion,
        resultadoSustentacion: egresados.resultadoSustentacion,
        juradoCalificador: egresados.juradoCalificador,
        numeroTitulo: egresados.numeroTitulo,
        numeroRegistroTitulo: egresados.numeroRegistroTitulo,
        fechaEmisionTitulo: egresados.fechaEmisionTitulo,
        situacionLaboral: egresados.situacionLaboral,
        empresaActual: egresados.empresaActual,
        rucEmpresa: egresados.rucEmpresa,
        cargoActual: egresados.cargoActual,
        ingresoMensualAprox: egresados.ingresoMensualAprox,
        telefonoActual: egresados.telefonoActual,
        emailActual: egresados.emailActual,
        fechaActualizacionLaboral: egresados.fechaActualizacionLaboral,
        observaciones: egresados.observaciones,
        // Relaciones
        personaDni: personas.numeroDocumento,
        personaNombres: personas.nombres,
        personaApellidoPaterno: personas.apellidoPaterno,
        personaApellidoMaterno: personas.apellidoMaterno,
        personaTelefono: personas.telefono,
        personaEmail: personas.email,
        programaNombre: programas.nombre,
        programaCodigo: programas.codigo,
        nivelFormativo: nivelesFormativos.nombre,
      })
      .from(egresados)
      .innerJoin(estudiantes, eq(egresados.estudianteId, estudiantes.id))
      .innerJoin(personas, eq(estudiantes.personaId, personas.id))
      .innerJoin(programas, eq(egresados.programaId, programas.id))
      .leftJoin(nivelesFormativos, eq(programas.nivelFormativoId, nivelesFormativos.id))
      .orderBy(desc(egresados.fechaEgreso));

    const result = rows.map((r) => ({
      ...r,
      totalCreditosAprobados: r.totalCreditosAprobados ? Number(r.totalCreditosAprobados) : undefined,
      calificacionTitulacion: r.calificacionTitulacion ? Number(r.calificacionTitulacion) : undefined,
    }));

    res.json(result);
  } catch (error: any) {
    console.error('Error al obtener egresados:', error);
    res.status(500).json({ error: 'Error al obtener egresados', details: error.message });
  }
});

// -------------------------------------------------------------
// 2. GET /api/egresados/candidatos (Auditoría Académica de Estudiantes con Avance)
// -------------------------------------------------------------
egresadosRouter.get('/candidatos', async (_req, res) => {
  try {
    // Obtener estudiantes con módulos y verificar su avance
    const candidatesQuery = await db.execute(sql`
      SELECT 
        e.id as estudiante_id,
        p.numero_documento,
        p.apellido_paterno,
        p.apellido_materno,
        p.nombres,
        p.telefono,
        p.email,
        prog.id as programa_id,
        prog.codigo as programa_codigo,
        prog.nombre as programa_nombre,
        MAX(mod.plan_estudio_id::text) as plan_estudio_id,
        prog.duracion_horas_referencial,
        prog.creditos as total_creditos,
        COUNT(DISTINCT m.id) as total_matriculas,
        COUNT(DISTINCT nu.id) as total_unidades_aprobadas,
        COUNT(DISTINCT ne.id) as total_efsrt_aprobadas,
        MAX(m.id::text) as ultima_matricula_id,
        CASE WHEN eg.id IS NOT NULL THEN TRUE ELSE FALSE END as ya_egresado
      FROM estudiantes e
      JOIN personas p ON e.persona_id = p.id
      JOIN matriculas m ON m.estudiante_id = e.id
      JOIN modulos mod ON m.modulo_id = mod.id
      JOIN programas prog ON mod.programa_id = prog.id
      LEFT JOIN notas_unidades nu ON nu.estudiante_id = e.id AND nu.estado = 'APROBADO'
      LEFT JOIN notas_efsrt ne ON ne.estudiante_id = e.id AND ne.estado = 'APROBADO'
      LEFT JOIN egresados eg ON eg.estudiante_id = e.id AND eg.programa_id = prog.id
      GROUP BY 
        e.id, p.numero_documento, p.apellido_paterno, p.apellido_materno, p.nombres, 
        p.telefono, p.email, prog.id, prog.codigo, prog.nombre, 
        prog.duracion_horas_referencial, prog.creditos, eg.id
      HAVING COUNT(DISTINCT m.id) >= 2 OR COUNT(DISTINCT ne.id) >= 1
      ORDER BY total_efsrt_aprobadas DESC, total_unidades_aprobadas DESC, total_matriculas DESC;
    `);

    res.json(candidatesQuery.rows);
  } catch (error: any) {
    console.error('Error al obtener candidatos a egreso:', error);
    res.status(500).json({ error: 'Error al obtener candidatos a egreso', details: error.message });
  }
});

// -------------------------------------------------------------
// 3. GET /api/egresados/verificar-requisitos/:estudianteId
// -------------------------------------------------------------
egresadosRouter.get('/verificar-requisitos/:estudianteId', async (req, res) => {
  try {
    const { estudianteId } = req.params;

    const [estudiante] = await db
      .select({
        id: estudiantes.id,
        personaId: estudiantes.personaId,
        dni: personas.numeroDocumento,
        nombres: personas.nombres,
        apellidoPaterno: personas.apellidoPaterno,
        apellidoMaterno: personas.apellidoMaterno,
      })
      .from(estudiantes)
      .innerJoin(personas, eq(estudiantes.personaId, personas.id))
      .where(eq(estudiantes.id, estudianteId))
      .limit(1);

    if (!estudiante) {
      return res.status(404).json({ error: 'Estudiante no encontrado' });
    }

    // Unidades aprobadas
    const udsAprobadas = await db
      .select()
      .from(notasUnidades)
      .where(and(eq(notasUnidades.estudianteId, estudianteId), eq(notasUnidades.estado, 'APROBADO')));

    // EFSRT aprobadas
    const efsrtAprobadas = await db
      .select()
      .from(notasEfsrt)
      .where(and(eq(notasEfsrt.estudianteId, estudianteId), eq(notasEfsrt.estado, 'APROBADO')));

    const cumpleEfsrt = efsrtAprobadas.length > 0;
    const cumpleUds = udsAprobadas.length >= 4; // Umbral modular

    res.json({
      estudiante,
      totalUdsAprobadas: udsAprobadas.length,
      totalEfsrtAprobadas: efsrtAprobadas.length,
      cumpleEfsrt,
      cumpleUds,
      aptoParaEgreso: cumpleEfsrt && cumpleUds,
    });
  } catch (error: any) {
    console.error('Error al verificar requisitos:', error);
    res.status(500).json({ error: 'Error al verificar requisitos', details: error.message });
  }
});

// -------------------------------------------------------------
// 4. GET /api/egresados/validar/:codigo (Público para QR de Constancia y Título)
// -------------------------------------------------------------
egresadosRouter.get('/validar/:codigo', async (req, res) => {
  try {
    const { codigo } = req.params;
    const cleanCodigo = decodeURIComponent(codigo);

    const rows = await db
      .select({
        id: egresados.id,
        codigoEgresado: egresados.codigoEgresado,
        fechaEgreso: egresados.fechaEgreso,
        estadoTramite: egresados.estadoTramite,
        totalCreditos: egresados.totalCreditosAprobados,
        totalHoras: egresados.totalHorasAcumuladas,
        resolucionDirectoral: egresados.resolucionDirectoral,
        tomoFolio: egresados.tomoFolio,
        codigoVerificacionQr: egresados.codigoVerificacionQr,
        hashSeguridad: egresados.hashSeguridad,
        numeroTitulo: egresados.numeroTitulo,
        modalidadTitulacion: egresados.modalidadTitulacion,
        fechaSustentacion: egresados.fechaSustentacion,
        calificacionTitulacion: egresados.calificacionTitulacion,
        // Estudiante y Programa
        dni: personas.numeroDocumento,
        nombres: personas.nombres,
        apellidoPaterno: personas.apellidoPaterno,
        apellidoMaterno: personas.apellidoMaterno,
        programaNombre: programas.nombre,
        programaCodigo: programas.codigo,
        nivelFormativo: nivelesFormativos.nombre,
      })
      .from(egresados)
      .innerJoin(estudiantes, eq(egresados.estudianteId, estudiantes.id))
      .innerJoin(personas, eq(estudiantes.personaId, personas.id))
      .innerJoin(programas, eq(egresados.programaId, programas.id))
      .leftJoin(nivelesFormativos, eq(programas.nivelFormativoId, nivelesFormativos.id))
      .where(or(
        eq(egresados.codigoEgresado, cleanCodigo),
        eq(egresados.numeroTitulo, cleanCodigo),
        ilike(egresados.codigoVerificacionQr, `%${cleanCodigo}%`),
        eq(egresados.hashSeguridad, cleanCodigo)
      ))
      .limit(1);

    if (rows.length === 0) {
      return res.status(404).json({
        valido: false,
        mensaje: 'El registro de egresado o título no existe en el Padrón Oficial del CETPRO Juanjuí o el código es inválido.',
      });
    }

    const eg = rows[0];

    res.json({
      valido: true,
      institucion: 'CENTRO DE EDUCACIÓN TÉCNICO PRODUCTIVA JUANJUÍ',
      dre: 'DIRECCIÓN REGIONAL DE EDUCACIÓN DE SAN MARTÍN',
      ugel: 'UGEL MARISCAL CÁCERES - JUANJUÍ',
      normativa: 'R.V.M. N° 188-2020-MINEDU / R.V.M. N° 277-2019-MINEDU',
      egresado: {
        codigo: eg.codigoEgresado,
        titular: `${eg.apellidoPaterno} ${eg.apellidoMaterno}, ${eg.nombres}`,
        dni: eg.dni,
        programa: eg.programaNombre,
        nivel: eg.nivelFormativo || 'Ciclo Técnico / Auxiliar Técnico',
        fechaEgreso: eg.fechaEgreso,
        estado: eg.estadoTramite,
        creditosHoras: `${eg.totalCreditos || 40} Créditos / ${eg.totalHoras || 950} Horas`,
        resolucionAprobacion: eg.resolucionDirectoral,
        custodiaLibro: eg.tomoFolio,
        tituloOficial: eg.numeroTitulo ? {
          numero: eg.numeroTitulo,
          modalidad: eg.modalidadTitulacion,
          fechaSustentacion: eg.fechaSustentacion,
          calificacion: eg.calificacionTitulacion,
        } : null,
        hashSeguridad: eg.hashSeguridad,
      }
    });
  } catch (error: any) {
    console.error('Error al validar egresado:', error);
    res.status(500).json({ error: 'Error al validar egresado', details: error.message });
  }
});

// -------------------------------------------------------------
// 5. POST /api/egresados (Registro Formal de Egresado)
// -------------------------------------------------------------
egresadosRouter.post('/', async (req, res) => {
  try {
    const {
      estudianteId,
      programaId,
      planEstudioId,
      matriculaId,
      fechaEgreso,
      totalCreditosAprobados,
      totalHorasAcumuladas,
      resolucionDirectoral,
      tomoFolio,
      situacionLaboral,
      empresaActual,
      cargoActual,
      observaciones,
      usuarioId,
    } = req.body;

    if (!estudianteId || !programaId) {
      return res.status(400).json({ error: 'estudianteId y programaId son obligatorios.' });
    }

    // 1. Obtener planEstudioId si no vino
    let finalPlanEstudioId = planEstudioId;
    if (!finalPlanEstudioId) {
      const [firstPlan] = await db.select().from(planesEstudios).limit(1);
      finalPlanEstudioId = firstPlan?.id;
    }

    // 2. Generar correlativo oficial EGR-2026-XXXX
    const currentYear = new Date().getFullYear();
    const countResult = await db.execute(sql`SELECT count(*) FROM egresados;`);
    const nextNum = Number(countResult.rows[0].count) + 1;
    const codigoEgresado = `EGR-${currentYear}-${String(nextNum).padStart(4, '0')}`;

    // 3. Generar token y URL de validación QR
    const hashSeguridad = crypto.randomBytes(6).toString('hex');
    const codigoVerificacionQr = `https://siga.cetprojuanjui.edu.pe/validar-egresado?cod=${codigoEgresado}&hash=${hashSeguridad}`;

    // 4. Insertar egresado
    const [inserted] = await db
      .insert(egresados)
      .values({
        estudianteId,
        programaId,
        planEstudioId: finalPlanEstudioId,
        matriculaId: (matriculaId && String(matriculaId).trim().length > 20) ? String(matriculaId).trim() : null,
        codigoEgresado,
        fechaEgreso: fechaEgreso || new Date().toISOString().split('T')[0],
        estadoTramite: 'EGRESADO',
        totalCreditosAprobados: totalCreditosAprobados || 40,
        totalHorasAcumuladas: totalHorasAcumuladas || 950,
        resolucionDirectoral: resolucionDirectoral || `RD N° 00${nextNum + 20}-2026-CETPRO-J`,
        tomoFolio: tomoFolio || `Libro ${currentYear}, Tomo 01, Folio ${nextNum}`,
        codigoVerificacionQr,
        hashSeguridad,
        situacionLaboral: normalizeSituacionLaboral(situacionLaboral),
        empresaActual: empresaActual || null,
        cargoActual: cargoActual || null,
        observaciones: observaciones || 'Egresado con plan de estudios y EFSRT concluidas.',
        usuarioId: usuarioId || null,
      })
      .returning();

    // 5. Asignar rol EGRESADO a la persona
    try {
      const [est] = await db.select().from(estudiantes).where(eq(estudiantes.id, estudianteId)).limit(1);
      if (est) {
        const [rolEgresado] = await db.select().from(rolesPersonas).where(eq(rolesPersonas.codigo, 'EGRESADO')).limit(1);
        if (rolEgresado) {
          await db
            .insert(personasRoles)
            .values({ personaId: est.personaId, rolPersonaId: rolEgresado.id })
            .onConflictDoNothing();
        }
      }
    } catch {}

    // 6. Auditoría institucional
    try {
      await db.insert(auditorias).values({
        usuarioId: usuarioId || null,
        accion: 'REGISTRO_EGRESADO',
        tabla: 'egresados',
        registroId: inserted.id,
        datosNuevos: {
          codigoEgresado,
          estudianteId,
          programaId,
        },
      });
    } catch {}

    res.status(201).json(inserted);
  } catch (error: any) {
    console.error('Error al registrar egresado:', error);
    res.status(500).json({ error: 'Error al registrar egresado', details: error.message });
  }
});

// -------------------------------------------------------------
// 6. POST /api/egresados/:id/titulacion (Expediente y Sustentación de Título)
// -------------------------------------------------------------
egresadosRouter.post('/:id/titulacion', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      modalidadTitulacion,
      fechaSustentacion,
      calificacionTitulacion,
      resultadoSustentacion,
      juradoCalificador,
      numeroTitulo,
      fechaEmisionTitulo,
      usuarioId,
    } = req.body;

    const currentYear = new Date().getFullYear();
    const tituloGenerado = numeroTitulo || `TIT-CETPRO-${currentYear}-${Math.floor(1000 + Math.random() * 9000)}`;

    const [updated] = await db
      .update(egresados)
      .set({
        modalidadTitulacion: modalidadTitulacion || 'TRABAJO_APLICACION_PROFESIONAL',
        fechaSustentacion: fechaSustentacion || new Date().toISOString().split('T')[0],
        calificacionTitulacion: calificacionTitulacion ? String(calificacionTitulacion) : '16.00',
        resultadoSustentacion: resultadoSustentacion || 'APROBADO_UNANIMIDAD',
        juradoCalificador: juradoCalificador || null,
        numeroTitulo: tituloGenerado,
        numeroRegistroTitulo: tituloGenerado,
        fechaEmisionTitulo: fechaEmisionTitulo || new Date().toISOString().split('T')[0],
        estadoTramite: 'TITULADO',
        fechaActualizacion: sql`CURRENT_TIMESTAMP`,
      })
      .where(eq(egresados.id, id))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: 'Registro de egresado no encontrado' });
    }

    // Auditoría institucional
    try {
      await db.insert(auditorias).values({
        usuarioId: usuarioId || null,
        accion: 'TITULACION_EGRESADO',
        tabla: 'egresados',
        registroId: id,
        datosNuevos: {
          numeroTitulo: tituloGenerado,
          modalidadTitulacion,
          calificacionTitulacion,
        },
      });
    } catch {}

    res.json(updated);
  } catch (error: any) {
    console.error('Error al registrar titulación:', error);
    res.status(500).json({ error: 'Error al registrar titulación', details: error.message });
  }
});

// -------------------------------------------------------------
// 7. PUT /api/egresados/:id/seguimiento (Inserción Laboral)
// -------------------------------------------------------------
egresadosRouter.put('/:id/seguimiento', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      situacionLaboral,
      empresaActual,
      rucEmpresa,
      cargoActual,
      ingresoMensualAprox,
      telefonoActual,
      emailActual,
    } = req.body;

    const [updated] = await db
      .update(egresados)
      .set({
        situacionLaboral: normalizeSituacionLaboral(situacionLaboral),
        empresaActual: empresaActual || null,
        rucEmpresa: rucEmpresa || null,
        cargoActual: cargoActual || null,
        ingresoMensualAprox: ingresoMensualAprox || null,
        telefonoActual: telefonoActual || null,
        emailActual: emailActual || null,
        fechaActualizacionLaboral: sql`CURRENT_DATE`,
        fechaActualizacion: sql`CURRENT_TIMESTAMP`,
      })
      .where(eq(egresados.id, id))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: 'Registro de egresado no encontrado' });
    }

    res.json(updated);
  } catch (error: any) {
    console.error('Error al actualizar seguimiento laboral:', error);
    res.status(500).json({ error: 'Error al actualizar seguimiento laboral', details: error.message });
  }
});

// -------------------------------------------------------------
// 8. PUT /api/egresados/:id (Actualización General)
// -------------------------------------------------------------
egresadosRouter.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      estadoTramite,
      resolucionDirectoral,
      tomoFolio,
      observaciones,
      fechaEgreso,
      usuarioId,
    } = req.body;

    const [updated] = await db
      .update(egresados)
      .set({
        estadoTramite: estadoTramite || undefined,
        resolucionDirectoral: resolucionDirectoral || undefined,
        tomoFolio: tomoFolio || undefined,
        observaciones: observaciones || undefined,
        fechaEgreso: fechaEgreso || undefined,
        fechaActualizacion: sql`CURRENT_TIMESTAMP`,
      })
      .where(eq(egresados.id, id))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: 'Registro de egresado no encontrado' });
    }

    // Auditoría
    try {
      await db.insert(auditorias).values({
        usuarioId: usuarioId || null,
        accion: 'ACTUALIZAR_EGRESADO',
        tabla: 'egresados',
        registroId: id,
        datosNuevos: { estadoTramite, resolucionDirectoral, tomoFolio },
      });
    } catch {}

    res.json(updated);
  } catch (error: any) {
    console.error('Error al actualizar egresado:', error);
    res.status(500).json({ error: 'Error al actualizar egresado', details: error.message });
  }
});

// -------------------------------------------------------------
// 9. DELETE /api/egresados/:id (Eliminación Auditada)
// -------------------------------------------------------------
egresadosRouter.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { motivo, usuarioId } = req.body || {};

    const [deleted] = await db
      .delete(egresados)
      .where(eq(egresados.id, id))
      .returning();

    if (!deleted) {
      return res.status(404).json({ error: 'Registro no encontrado' });
    }

    try {
      await db.insert(auditorias).values({
        usuarioId: usuarioId || null,
        accion: 'ELIMINAR_EGRESADO',
        tabla: 'egresados',
        registroId: id,
        datosAnteriores: {
          codigoEgresado: deleted.codigoEgresado,
          motivo: motivo || 'Eliminación administrativa',
        },
      });
    } catch {}

    res.json({ success: true, message: 'Registro de egresado eliminado exitosamente' });
  } catch (error: any) {
    console.error('Error al eliminar egresado:', error);
    res.status(500).json({ error: 'Error al eliminar egresado', details: error.message });
  }
});
