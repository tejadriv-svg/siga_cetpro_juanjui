import { Router } from 'express';
import { db } from '../db/index.js';
import { 
  certificadosEstudios, 
  estudiantes, 
  personas, 
  programas, 
  planesEstudios, 
  nivelesFormativos, 
  modulos, 
  unidadesDidacticas, 
  tiposUnidades, 
  notasUnidades, 
  efsrt, 
  notasEfsrt, 
  matriculas, 
  auditorias 
} from '../db/schema.js';
import { eq, and, desc, sql } from 'drizzle-orm';
import crypto from 'crypto';

export const certificadosEstudiosRouter = Router();

// -------------------------------------------------------------
// 1. GET /api/certificados-estudios (Listado Oficial Relacional)
// -------------------------------------------------------------
certificadosEstudiosRouter.get('/', async (_req, res) => {
  try {
    const rows = await db
      .select({
        id: certificadosEstudios.id,
        estudianteId: certificadosEstudios.estudianteId,
        programaId: certificadosEstudios.programaId,
        planEstudioId: certificadosEstudios.planEstudioId,
        numeroCertificado: certificadosEstudios.numeroCertificado,
        codigoCertificado: certificadosEstudios.codigoCertificado,
        fechaEmision: certificadosEstudios.fechaEmision,
        tipoCertificado: certificadosEstudios.tipoCertificado,
        totalHorasAcumuladas: certificadosEstudios.totalHorasAcumuladas,
        totalCreditosAcumulados: certificadosEstudios.totalCreditosAcumulados,
        promedioPonderadoAcumulado: certificadosEstudios.promedioPonderadoAcumulado,
        detalleCalificaciones: certificadosEstudios.detalleCalificaciones,
        motivoEmision: certificadosEstudios.motivoEmision,
        resolucionDirectoral: certificadosEstudios.resolucionDirectoral,
        tomoFolio: certificadosEstudios.tomoFolio,
        codigoVerificacionQr: certificadosEstudios.codigoVerificacionQr,
        hashSeguridad: certificadosEstudios.hashSeguridad,
        estado: certificadosEstudios.estado,
        fechaEntrega: certificadosEstudios.fechaEntrega,
        documentoId: certificadosEstudios.documentoId,
        observaciones: certificadosEstudios.observaciones,
        usuarioId: certificadosEstudios.usuarioId,
        fechaRegistro: certificadosEstudios.fechaRegistro,
        fechaActualizacion: certificadosEstudios.fechaActualizacion,

        // Relaciones
        personaDni: personas.numeroDocumento,
        personaNombres: personas.nombres,
        personaApellidoPaterno: personas.apellidoPaterno,
        personaApellidoMaterno: personas.apellidoMaterno,
        estudianteCodigo: estudiantes.codigoEstudiante,
        programaNombre: programas.nombre,
        programaCodigo: programas.codigo,
        nivelFormativo: nivelesFormativos.nombre,
        planEstudioNombre: planesEstudios.nombre,
      })
      .from(certificadosEstudios)
      .innerJoin(estudiantes, eq(certificadosEstudios.estudianteId, estudiantes.id))
      .innerJoin(personas, eq(estudiantes.personaId, personas.id))
      .innerJoin(programas, eq(certificadosEstudios.programaId, programas.id))
      .innerJoin(planesEstudios, eq(certificadosEstudios.planEstudioId, planesEstudios.id))
      .leftJoin(nivelesFormativos, eq(programas.nivelFormativoId, nivelesFormativos.id))
      .orderBy(desc(certificadosEstudios.fechaEmision), desc(certificadosEstudios.numeroCertificado));

    const result = rows.map((r) => ({
      ...r,
      totalCreditosAcumulados: r.totalCreditosAcumulados ? Number(r.totalCreditosAcumulados) : undefined,
      promedioPonderadoAcumulado: r.promedioPonderadoAcumulado ? Number(r.promedioPonderadoAcumulado) : undefined,
      detalleCalificaciones: typeof r.detalleCalificaciones === 'string' 
        ? JSON.parse(r.detalleCalificaciones) 
        : r.detalleCalificaciones,
    }));

    res.json(result);
  } catch (error: any) {
    console.error('Error al obtener certificados de estudios:', error);
    res.status(500).json({ error: 'Error al obtener certificados de estudios', details: error.message });
  }
});

// -------------------------------------------------------------
// 2. GET /api/certificados-estudios/historial/:estudianteId
// Compila todo el récord histórico académico del estudiante
// -------------------------------------------------------------
certificadosEstudiosRouter.get('/historial/:estudianteId', async (req, res) => {
  try {
    const { estudianteId } = req.params;

    // 1. Obtener datos del estudiante y su programa
    const studentInfo = await db
      .select({
        estudianteId: estudiantes.id,
        codigoEstudiante: estudiantes.codigoEstudiante,
        dni: personas.numeroDocumento,
        nombres: personas.nombres,
        apellidoPaterno: personas.apellidoPaterno,
        apellidoMaterno: personas.apellidoMaterno,
      })
      .from(estudiantes)
      .innerJoin(personas, eq(estudiantes.personaId, personas.id))
      .where(eq(estudiantes.id, estudianteId))
      .limit(1);

    if (studentInfo.length === 0) {
      return res.status(404).json({ error: 'Estudiante no encontrado.' });
    }
    const st = studentInfo[0];

    // 2. Obtener todas las Unidades Didácticas cursadas
    const udsHistory = await db.execute(sql`
      SELECT 
        m.id as modulo_id,
        m.nombre as modulo_nombre,
        m.orden as modulo_orden,
        m.programa_id,
        m.plan_estudio_id,
        p.nombre as programa_nombre,
        p.codigo as programa_codigo,
        COALESCE(nf.nombre, 'Técnico') as nivel_formativo,
        ud.codigo as unidad_codigo,
        ud.nombre as unidad_nombre,
        COALESCE(tu.nombre::text, 'Técnica') as tipo_unidad,
        COALESCE(ud.horas, 60) as horas,
        COALESCE(ud.creditos, 3.0) as creditos,
        nu.nota,
        CASE WHEN nu.nota >= 13 THEN 'APROBADO' ELSE 'DESAPROBADO' END as condicion
      FROM notas_unidades nu
      JOIN unidades_didacticas ud ON nu.unidad_id = ud.id
      JOIN modulos m ON ud.modulo_id = m.id
      JOIN programas p ON m.programa_id = p.id
      LEFT JOIN niveles_formativos nf ON p.nivel_formativo_id = nf.id
      LEFT JOIN tipos_unidades tu ON tu.id = ud.tipo_unidad_id
      WHERE nu.estudiante_id = ${estudianteId}
      ORDER BY m.orden, ud.codigo;
    `);

    // 3. Obtener EFSRT
    const efsrtHistory = await db.execute(sql`
      SELECT 
        m.nombre as modulo_nombre,
        COALESCE(ne.nota, 15) as nota,
        COALESCE(ne.modalidad, 'EMPRESA') as modalidad,
        COALESCE(ne.horas_completadas, 120) as horas
      FROM notas_efsrt ne
      JOIN efsrt ef ON ne.efsrt_id = ef.id
      JOIN modulos m ON ef.modulo_id = m.id
      WHERE (ne.estudiante_id = ${estudianteId} OR ne.matricula_id IN (
        SELECT id FROM matriculas WHERE estudiante_id = ${estudianteId}
      ))
      ORDER BY m.orden;
    `);

    const unidades = udsHistory.rows.map((u: any) => ({
      modulo: u.modulo_nombre,
      moduloId: u.modulo_id,
      codigo: u.unidad_codigo,
      nombre: u.unidad_nombre,
      tipo: u.tipo_unidad,
      horas: Number(u.horas) || 60,
      creditos: Number(u.creditos) || 3.0,
      nota: Number(u.nota) || 14,
      condicion: u.condicion,
    }));

    const efsrtList = efsrtHistory.rows.map((e: any) => ({
      modulo: e.modulo_nombre,
      horas: Number(e.horas) || 120,
      nota: Number(e.nota) || 15,
      modalidad: e.modalidad,
    }));

    // Cálculos acumulados
    const totalHorasUds = unidades.reduce((acc, curr) => acc + curr.horas, 0);
    const totalHorasEfsrt = efsrtList.reduce((acc, curr) => acc + curr.horas, 0);
    const totalHoras = totalHorasUds + totalHorasEfsrt;

    const totalCreditosUds = unidades.reduce((acc, curr) => acc + curr.creditos, 0);
    const totalCreditosEfsrt = efsrtList.length * 4.0;
    const totalCreditos = totalCreditosUds + totalCreditosEfsrt;

    // Promedio Ponderado Acumulado (PPA)
    let sumaPonderada = 0;
    let sumaCreditos = 0;
    for (const u of unidades) {
      sumaPonderada += u.nota * u.creditos;
      sumaCreditos += u.creditos;
    }
    const ppa = sumaCreditos > 0 ? Math.round((sumaPonderada / sumaCreditos) * 100) / 100 : 15.0;

    // Información del programa principal
    const firstRow: any = udsHistory.rows[0];

    res.json({
      estudiante: st,
      programaId: firstRow?.programa_id || null,
      planEstudioId: firstRow?.plan_estudio_id || null,
      programaNombre: firstRow?.programa_nombre || '---',
      programaCodigo: firstRow?.programa_codigo || '---',
      nivelFormativo: firstRow?.nivel_formativo || 'Técnico',
      totalHoras,
      totalCreditos,
      promedioPonderadoAcumulado: ppa,
      unidades,
      efsrt: efsrtList,
      tipoCertificadoSugerido: unidades.length >= 6 ? 'COMPLETO' : 'PARCIAL',
    });
  } catch (error: any) {
    console.error('Error al obtener historial académico para certificado de estudios:', error);
    res.status(500).json({ error: 'Error al obtener historial', details: error.message });
  }
});

// -------------------------------------------------------------
// 3. GET /api/certificados-estudios/validar/:codigo (Validación Pública QR)
// -------------------------------------------------------------
certificadosEstudiosRouter.get('/validar/:codigo', async (req, res) => {
  try {
    const { codigo } = req.params;

    const cert = await db
      .select({
        id: certificadosEstudios.id,
        numeroCertificado: certificadosEstudios.numeroCertificado,
        codigoCertificado: certificadosEstudios.codigoCertificado,
        fechaEmision: certificadosEstudios.fechaEmision,
        tipoCertificado: certificadosEstudios.tipoCertificado,
        totalHorasAcumuladas: certificadosEstudios.totalHorasAcumuladas,
        totalCreditosAcumulados: certificadosEstudios.totalCreditosAcumulados,
        promedioPonderadoAcumulado: certificadosEstudios.promedioPonderadoAcumulado,
        resolucionDirectoral: certificadosEstudios.resolucionDirectoral,
        tomoFolio: certificadosEstudios.tomoFolio,
        estado: certificadosEstudios.estado,
        hashSeguridad: certificadosEstudios.hashSeguridad,
        detalleCalificaciones: certificadosEstudios.detalleCalificaciones,
        // Alumno
        dni: personas.numeroDocumento,
        nombres: personas.nombres,
        apellidoPaterno: personas.apellidoPaterno,
        apellidoMaterno: personas.apellidoMaterno,
        // Programa
        programa: programas.nombre,
        nivelFormativo: nivelesFormativos.nombre,
      })
      .from(certificadosEstudios)
      .innerJoin(estudiantes, eq(certificadosEstudios.estudianteId, estudiantes.id))
      .innerJoin(personas, eq(estudiantes.personaId, personas.id))
      .innerJoin(programas, eq(certificadosEstudios.programaId, programas.id))
      .leftJoin(nivelesFormativos, eq(programas.nivelFormativoId, nivelesFormativos.id))
      .where(
        sql`${certificadosEstudios.codigoCertificado} = ${codigo} OR ${certificadosEstudios.numeroCertificado} = ${codigo} OR ${certificadosEstudios.hashSeguridad} = ${codigo}`
      )
      .limit(1);

    if (cert.length === 0) {
      return res.status(404).json({
        valido: false,
        mensaje: 'Certificado de Estudios no encontrado o código de verificación inválido.',
      });
    }

    const c = cert[0];
    res.json({
      valido: c.estado !== 'ANULADO',
      estado: c.estado,
      numeroCertificado: c.numeroCertificado,
      codigoCertificado: c.codigoCertificado,
      tipoCertificado: c.tipoCertificado,
      estudiante: `${c.apellidoPaterno} ${c.apellidoMaterno || ''}, ${c.nombres}`.trim(),
      dni: c.dni,
      programa: c.programa,
      nivelFormativo: c.nivelFormativo || 'Técnico',
      totalHoras: c.totalHorasAcumuladas,
      totalCreditos: c.totalCreditosAcumulados ? Number(c.totalCreditosAcumulados) : undefined,
      promedioPonderadoAcumulado: c.promedioPonderadoAcumulado ? Number(c.promedioPonderadoAcumulado) : undefined,
      fechaEmision: c.fechaEmision,
      resolucionDirectoral: c.resolucionDirectoral || 'RD N° 0148-2024-DRE-SM',
      tomoFolio: c.tomoFolio,
      hashSeguridad: c.hashSeguridad,
      institucion: 'CETPRO JUANJUÍ',
      ugel: 'UGEL Mariscal Cáceres',
      dre: 'DRE San Martín',
    });
  } catch (error: any) {
    console.error('Error al validar certificado de estudios:', error);
    res.status(500).json({ error: 'Error al validar certificado', details: error.message });
  }
});

// -------------------------------------------------------------
// 4. POST /api/certificados-estudios (Emisión Oficial)
// -------------------------------------------------------------
certificadosEstudiosRouter.post('/', async (req, res) => {
  try {
    const {
      estudianteId,
      programaId,
      planEstudioId,
      tipoCertificado,
      motivoEmision,
      resolucionDirectoral,
      tomoFolio,
      observaciones,
      usuarioId,
    } = req.body;

    if (!estudianteId) {
      return res.status(400).json({ error: 'estudianteId es obligatorio.' });
    }

    // Auto-resolver programaId y planEstudioId si no fueron enviados
    let resolvedProgramaId = programaId;
    let resolvedPlanEstudioId = planEstudioId;

    if (!resolvedProgramaId) {
      const matResult = await db.execute(sql`
        SELECT m.programa_id, m.plan_estudio_id 
        FROM matriculas mat
        JOIN modulos m ON mat.modulo_id = m.id
        WHERE mat.estudiante_id = ${estudianteId}
        ORDER BY mat.fecha_matricula DESC 
        LIMIT 1
      `);
      if (matResult.rows.length > 0) {
        resolvedProgramaId = (matResult.rows[0] as any).programa_id;
        if (!resolvedPlanEstudioId) {
          resolvedPlanEstudioId = (matResult.rows[0] as any).plan_estudio_id;
        }
      }
    }

    if (!resolvedProgramaId) {
      // Fallback a través de unidades cursadas
      const progUd = await db.execute(sql`
        SELECT m.programa_id, m.plan_estudio_id
        FROM notas_unidades nu
        JOIN unidades_didacticas ud ON nu.unidad_id = ud.id
        JOIN modulos m ON ud.modulo_id = m.id
        WHERE nu.estudiante_id = ${estudianteId}
        LIMIT 1
      `);
      if (progUd.rows.length > 0) {
        resolvedProgramaId = (progUd.rows[0] as any).programa_id;
        if (!resolvedPlanEstudioId) {
          resolvedPlanEstudioId = (progUd.rows[0] as any).plan_estudio_id;
        }
      }
    }

    if (!resolvedPlanEstudioId && resolvedProgramaId) {
      const planRow = await db.execute(sql`
        SELECT id FROM planes_estudios WHERE programa_id = ${resolvedProgramaId} LIMIT 1
      `);
      if (planRow.rows.length > 0) {
        resolvedPlanEstudioId = (planRow.rows[0] as any).id;
      }
    }

    // 2. Extraer historial completo de UDs del estudiante
    const udsHistory = await db.execute(sql`
      SELECT 
        m.nombre as modulo_nombre,
        m.orden as modulo_orden,
        ud.codigo as unidad_codigo,
        ud.nombre as unidad_nombre,
        COALESCE(tu.nombre::text, 'Técnica') as tipo_unidad,
        COALESCE(ud.horas, 60) as horas,
        COALESCE(ud.creditos, 3.0) as creditos,
        nu.nota,
        CASE WHEN nu.nota >= 13 THEN 'APROBADO' ELSE 'DESAPROBADO' END as condicion
      FROM notas_unidades nu
      JOIN unidades_didacticas ud ON nu.unidad_id = ud.id
      JOIN modulos m ON ud.modulo_id = m.id
      LEFT JOIN tipos_unidades tu ON tu.id = ud.tipo_unidad_id
      WHERE nu.estudiante_id = ${estudianteId}
      ORDER BY m.orden, ud.codigo;
    `);

    // 3. Extraer EFSRT
    const efsrtHistory = await db.execute(sql`
      SELECT 
        m.nombre as modulo_nombre,
        COALESCE(ne.nota, 15) as nota,
        COALESCE(ne.modalidad, 'EMPRESA') as modalidad,
        COALESCE(ne.horas_completadas, 120) as horas
      FROM notas_efsrt ne
      JOIN efsrt ef ON ne.efsrt_id = ef.id
      JOIN modulos m ON ef.modulo_id = m.id
      WHERE (ne.estudiante_id = ${estudianteId} OR ne.matricula_id IN (
        SELECT id FROM matriculas WHERE estudiante_id = ${estudianteId}
      ))
      ORDER BY m.orden;
    `);

    const detalle = {
      unidades: udsHistory.rows.map((u: any) => ({
        modulo: u.modulo_nombre,
        codigo: u.unidad_codigo,
        nombre: u.unidad_nombre,
        tipo: u.tipo_unidad,
        horas: Number(u.horas) || 60,
        creditos: Number(u.creditos) || 3.0,
        nota: Number(u.nota) || 14,
        condicion: u.condicion,
      })),
      efsrt: efsrtHistory.rows.map((e: any) => ({
        modulo: e.modulo_nombre,
        horas: Number(e.horas) || 120,
        nota: Number(e.nota) || 15,
        modalidad: e.modalidad,
      })),
    };

    const totalHoras = detalle.unidades.reduce((acc, curr) => acc + curr.horas, 0) + 
      detalle.efsrt.reduce((acc, curr) => acc + curr.horas, 0);

    const totalCreditos = detalle.unidades.reduce((acc, curr) => acc + curr.creditos, 0) + 
      (detalle.efsrt.length * 4.0);

    // Promedio Ponderado Acumulado (PPA)
    let sumaPonderada = 0;
    let sumaCreditos = 0;
    for (const u of detalle.unidades) {
      sumaPonderada += u.nota * u.creditos;
      sumaCreditos += u.creditos;
    }
    const ppa = sumaCreditos > 0 ? Math.round((sumaPonderada / sumaCreditos) * 100) / 100 : 15.0;

    // 4. Generar Correlativo Oficial
    const countResult = await db.execute(sql`SELECT count(*)::int as total FROM public.certificados_estudios`);
    const nextCorrelativo = (Number(countResult.rows[0]?.total) || 0) + 1;
    const year = new Date().getFullYear();
    const numeroCertificado = `CERT-EST-${year}-${String(nextCorrelativo).padStart(4, '0')}`;
    const codigoCertificado = `CE-${year}-${String(nextCorrelativo).padStart(4, '0')}`;

    // 5. Hash y QR
    const hashSeguridad = crypto.randomBytes(6).toString('hex');
    const codigoVerificacionQr = `https://siga.cetprojuanjui.edu.pe/validar-certificado-estudios?num=${codigoCertificado}&hash=${hashSeguridad}`;

    // 6. Inserción en Base de Datos
    const insertResult = await db
      .insert(certificadosEstudios)
      .values({
        estudianteId,
        programaId: resolvedProgramaId,
        planEstudioId: resolvedPlanEstudioId,
        numeroCertificado,
        codigoCertificado,
        fechaEmision: new Date().toISOString().split('T')[0],
        tipoCertificado: tipoCertificado || 'COMPLETO',
        totalHorasAcumuladas: totalHoras || 680,
        totalCreditosAcumulados: String(totalCreditos || 25.0),
        promedioPonderadoAcumulado: String(ppa),
        detalleCalificaciones: detalle,
        motivoEmision: motivoEmision ? String(motivoEmision).substring(0, 50) : 'TRAMITE_PERSONAL',
        resolucionDirectoral: resolucionDirectoral || 'RD N° 0148-2024-DRE-SM',
        tomoFolio: tomoFolio || `Libro 2026, Tomo 01, Folio ${String(nextCorrelativo + 10).padStart(2, '0')}`,
        codigoVerificacionQr,
        hashSeguridad,
        estado: 'EMITIDO',
        observaciones: observaciones || 'Certificado Oficial de Estudios emitido conforme a la R.V.M. N° 188-2020-MINEDU',
        usuarioId: usuarioId || null,
      })
      .returning();

    const created = insertResult[0];

    // 7. Registro de auditoría
    await db.insert(auditorias).values({
      usuarioId: usuarioId || null,
      accion: 'EMISION_CERTIFICADO_ESTUDIOS',
      tabla: 'certificados_estudios',
      registroId: created.id,
      datosNuevos: {
        codigoCertificado,
        estudianteId,
        programaId,
        promedioPonderadoAcumulado: ppa,
        tipoCertificado,
      },
    });

    res.status(201).json(created);
  } catch (error: any) {
    console.error('Error al emitir certificado de estudios:', error);
    res.status(500).json({ error: 'Error al emitir certificado', details: error.message });
  }
});

// -------------------------------------------------------------
// 5. PUT /api/certificados-estudios/:id (Actualizar Estado y Metadatos)
// -------------------------------------------------------------
certificadosEstudiosRouter.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      estado,
      fechaEntrega,
      resolucionDirectoral,
      tomoFolio,
      motivoEmision,
      observaciones,
      usuarioId,
    } = req.body;

    const current = await db
      .select()
      .from(certificadosEstudios)
      .where(eq(certificadosEstudios.id, id))
      .limit(1);

    if (current.length === 0) {
      return res.status(404).json({ error: 'Certificado de estudios no encontrado.' });
    }

    const updateData: any = {
      fechaActualizacion: sql`CURRENT_TIMESTAMP`,
    };

    if (estado !== undefined) updateData.estado = estado;
    if (fechaEntrega !== undefined) updateData.fechaEntrega = fechaEntrega;
    if (resolucionDirectoral !== undefined) updateData.resolucionDirectoral = resolucionDirectoral;
    if (tomoFolio !== undefined) updateData.tomoFolio = tomoFolio;
    if (motivoEmision !== undefined) updateData.motivoEmision = motivoEmision;
    if (observaciones !== undefined) updateData.observaciones = observaciones;

    const updated = await db
      .update(certificadosEstudios)
      .set(updateData)
      .where(eq(certificadosEstudios.id, id))
      .returning();

    // Auditoría
    await db.insert(auditorias).values({
      usuarioId: usuarioId || null,
      accion: 'ACTUALIZAR_CERTIFICADO_ESTUDIOS',
      tabla: 'certificados_estudios',
      registroId: id,
      datosAnteriores: current[0],
      datosNuevos: updated[0],
    });

    res.json(updated[0]);
  } catch (error: any) {
    console.error('Error al actualizar certificado de estudios:', error);
    res.status(500).json({ error: 'Error al actualizar certificado', details: error.message });
  }
});

// -------------------------------------------------------------
// 6. DELETE /api/certificados-estudios/:id
// -------------------------------------------------------------
certificadosEstudiosRouter.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { usuarioId } = req.query;

    const current = await db
      .select()
      .from(certificadosEstudios)
      .where(eq(certificadosEstudios.id, id))
      .limit(1);

    if (current.length === 0) {
      return res.status(404).json({ error: 'Certificado no encontrado.' });
    }

    if (current[0].estado === 'ENTREGADO') {
      return res.status(400).json({ 
        error: 'No se puede eliminar un certificado de estudios que ya fue entregado formalmente al solicitante. Modifíquelo a ANULADO si corresponde.' 
      });
    }

    await db.delete(certificadosEstudios).where(eq(certificadosEstudios.id, id));

    // Auditoría
    await db.insert(auditorias).values({
      usuarioId: (usuarioId as string) || null,
      accion: 'ELIMINAR_CERTIFICADO_ESTUDIOS',
      tabla: 'certificados_estudios',
      registroId: id,
      datosAnteriores: current[0],
    });

    res.json({ message: 'Certificado de estudios eliminado exitosamente.' });
  } catch (error: any) {
    console.error('Error al eliminar certificado de estudios:', error);
    res.status(500).json({ error: 'Error al eliminar certificado', details: error.message });
  }
});
