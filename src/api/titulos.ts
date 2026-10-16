import { Router } from 'express';
import { db } from '../db/index.js';
import { 
  titulos, 
  egresados, 
  estudiantes, 
  personas, 
  programas, 
  planesEstudios, 
  nivelesFormativos, 
  auditorias 
} from '../db/schema.js';
import { eq, and, desc, sql } from 'drizzle-orm';
import crypto from 'crypto';

export const titulosRouter = Router();

function numeroALetras(n: number): string {
  const round = Math.round(n);
  const mapa: { [key: number]: string } = {
    0: 'CERO',
    1: 'UNO',
    2: 'DOS',
    3: 'TRES',
    4: 'CUATRO',
    5: 'CINCO',
    6: 'SEIS',
    7: 'SIETE',
    8: 'OCHO',
    9: 'NUEVE',
    10: 'DIEZ',
    11: 'ONCE',
    12: 'DOCE',
    13: 'TRECE',
    14: 'CATORCE',
    15: 'QUINCE',
    16: 'DIECISÉIS',
    17: 'DIECISIETE',
    18: 'DIECIOCHO',
    19: 'DIECINUEVE',
    20: 'VEINTE',
  };
  return mapa[round] || round.toString();
}

function normalizeModalidadTitulacion(mod?: string): string {
  if (!mod) return 'TRABAJO_APLICACION_PROFESIONAL';
  const u = mod.toUpperCase().trim();
  if (u.includes('EXAMEN') || u.includes('SUFICIENCIA')) return 'EXAMEN_SUFICIENCIA_PROFESIONAL';
  if (u.includes('EXPERIENCIA') || u.includes('LABORAL')) return 'EXPERIENCIA_LABORAL_EXTRAORDINARIA';
  return 'TRABAJO_APLICACION_PROFESIONAL';
}

// -------------------------------------------------------------
// 1. GET /api/titulos (Listado Maestro de Títulos)
// -------------------------------------------------------------
titulosRouter.get('/', async (_req, res) => {
  try {
    const rows = await db
      .select({
        id: titulos.id,
        estudianteId: titulos.estudianteId,
        egresadoId: titulos.egresadoId,
        programaId: titulos.programaId,
        planEstudioId: titulos.planEstudioId,
        numeroTitulo: titulos.numeroTitulo,
        codigoTitulo: titulos.codigoTitulo,
        codigoRegistroNacional: titulos.codigoRegistroNacional,
        numeroActaSustentacion: titulos.numeroActaSustentacion,
        denominacionTitulo: titulos.denominacionTitulo,
        modalidadTitulacion: titulos.modalidadTitulacion,
        tituloProyecto: titulos.tituloProyecto,
        fechaSustentacion: titulos.fechaSustentacion,
        horaSustentacion: titulos.horaSustentacion,
        calificacion: titulos.calificacion,
        calificacionLetras: titulos.calificacionLetras,
        resultadoSustentacion: titulos.resultadoSustentacion,
        juradoCalificador: titulos.juradoCalificador,
        totalHorasAcumuladas: titulos.totalHorasAcumuladas,
        totalCreditosAcumulados: titulos.totalCreditosAcumulados,
        resolucionDirectoral: titulos.resolucionDirectoral,
        libroRegistro: titulos.libroRegistro,
        tomoFolio: titulos.tomoFolio,
        codigoVerificacionQr: titulos.codigoVerificacionQr,
        hashSeguridad: titulos.hashSeguridad,
        estado: titulos.estado,
        fechaEmision: titulos.fechaEmision,
        fechaAprobacion: titulos.fechaAprobacion,
        fechaVisadoUgel: titulos.fechaVisadoUgel,
        fechaEntrega: titulos.fechaEntrega,
        documentoId: titulos.documentoId,
        observaciones: titulos.observaciones,
        usuarioId: titulos.usuarioId,
        fechaRegistro: titulos.fechaRegistro,
        fechaActualizacion: titulos.fechaActualizacion,
        // Relaciones
        personaDni: personas.numeroDocumento,
        personaNombres: personas.nombres,
        personaApellidoPaterno: personas.apellidoPaterno,
        personaApellidoMaterno: personas.apellidoMaterno,
        estudianteCodigo: estudiantes.codigoEstudiante,
        codigoEgresado: egresados.codigoEgresado,
        fechaEgreso: egresados.fechaEgreso,
        programaNombre: programas.nombre,
        programaCodigo: programas.codigo,
        nivelFormativo: nivelesFormativos.nombre,
        planEstudioNombre: planesEstudios.nombre,
      })
      .from(titulos)
      .innerJoin(egresados, eq(titulos.egresadoId, egresados.id))
      .innerJoin(estudiantes, eq(titulos.estudianteId, estudiantes.id))
      .innerJoin(personas, eq(estudiantes.personaId, personas.id))
      .innerJoin(programas, eq(titulos.programaId, programas.id))
      .innerJoin(planesEstudios, eq(titulos.planEstudioId, planesEstudios.id))
      .leftJoin(nivelesFormativos, eq(programas.nivelFormativoId, nivelesFormativos.id))
      .orderBy(desc(titulos.fechaEmision), desc(titulos.codigoTitulo));

    const formatted = rows.map((r: any) => ({
      ...r,
      totalHorasAcumuladas: r.totalHorasAcumuladas ? Number(r.totalHorasAcumuladas) : undefined,
      totalCreditosAcumulados: r.totalCreditosAcumulados ? Number(r.totalCreditosAcumulados) : undefined,
      calificacion: r.calificacion ? Number(r.calificacion) : undefined,
    }));

    res.json(formatted);
  } catch (error: any) {
    console.error('Error al obtener títulos:', error);
    res.status(500).json({ error: 'Error al obtener títulos profesionales', details: error.message });
  }
});

// -------------------------------------------------------------
// 2. GET /api/titulos/aptos (Auditoría de Egresados Aptos para Titulación)
// -------------------------------------------------------------
titulosRouter.get('/aptos', async (_req, res) => {
  try {
    const aptosQuery = await db.execute(sql`
      SELECT 
        e.id as egresado_id,
        e.estudiante_id,
        e.programa_id,
        e.plan_estudio_id,
        e.codigo_egresado,
        e.fecha_egreso,
        COALESCE(e.total_creditos_aprobados, 40) as total_creditos_aprobados,
        COALESCE(e.total_horas_acumuladas, 950) as total_horas_acumuladas,
        p.numero_documento as persona_dni,
        p.nombres as persona_nombres,
        p.apellido_paterno as persona_apellido_paterno,
        p.apellido_materno as persona_apellido_materno,
        est.codigo_estudiante as estudiante_codigo,
        prog.nombre as programa_nombre,
        prog.codigo as programa_codigo,
        COALESCE(nf.nombre, 'Técnico') as nivel_formativo,
        t.id as titulo_id,
        t.codigo_titulo,
        t.estado as estado_titulo,
        CASE WHEN t.id IS NOT NULL THEN true ELSE false END as ya_titulado
      FROM egresados e
      JOIN estudiantes est ON e.estudiante_id = est.id
      JOIN personas p ON est.persona_id = p.id
      JOIN programas prog ON e.programa_id = prog.id
      LEFT JOIN niveles_formativos nf ON prog.nivel_formativo_id = nf.id
      LEFT JOIN titulos t ON t.egresado_id = e.id AND t.estado != 'ANULADO'
      ORDER BY e.fecha_egreso DESC, p.apellido_paterno;
    `);

    res.json(aptosQuery.rows);
  } catch (error: any) {
    console.error('Error al auditar aptos para titulación:', error);
    res.status(500).json({ error: 'Error al obtener egresados aptos', details: error.message });
  }
});

// -------------------------------------------------------------
// 3. GET /api/titulos/validar/:codigo (Validación Pública QR)
// -------------------------------------------------------------
titulosRouter.get('/validar/:codigo', async (req, res) => {
  try {
    const { codigo } = req.params;

    const row = await db
      .select({
        id: titulos.id,
        numeroTitulo: titulos.numeroTitulo,
        codigoTitulo: titulos.codigoTitulo,
        codigoRegistroNacional: titulos.codigoRegistroNacional,
        numeroActaSustentacion: titulos.numeroActaSustentacion,
        denominacionTitulo: titulos.denominacionTitulo,
        modalidadTitulacion: titulos.modalidadTitulacion,
        tituloProyecto: titulos.tituloProyecto,
        fechaSustentacion: titulos.fechaSustentacion,
        calificacion: titulos.calificacion,
        resultadoSustentacion: titulos.resultadoSustentacion,
        juradoCalificador: titulos.juradoCalificador,
        resolucionDirectoral: titulos.resolucionDirectoral,
        tomoFolio: titulos.tomoFolio,
        libroRegistro: titulos.libroRegistro,
        estado: titulos.estado,
        fechaEmision: titulos.fechaEmision,
        hashSeguridad: titulos.hashSeguridad,
        // Egresado & Alumno
        dni: personas.numeroDocumento,
        nombres: personas.nombres,
        apellidoPaterno: personas.apellidoPaterno,
        apellidoMaterno: personas.apellidoMaterno,
        codigoEstudiante: estudiantes.codigoEstudiante,
        codigoEgresado: egresados.codigoEgresado,
        // Programa
        programa: programas.nombre,
        nivelFormativo: nivelesFormativos.nombre,
        totalCreditos: titulos.totalCreditosAcumulados,
        totalHoras: titulos.totalHorasAcumuladas,
      })
      .from(titulos)
      .innerJoin(egresados, eq(titulos.egresadoId, egresados.id))
      .innerJoin(estudiantes, eq(titulos.estudianteId, estudiantes.id))
      .innerJoin(personas, eq(estudiantes.personaId, personas.id))
      .innerJoin(programas, eq(titulos.programaId, programas.id))
      .leftJoin(nivelesFormativos, eq(programas.nivelFormativoId, nivelesFormativos.id))
      .where(
        sql`${titulos.codigoTitulo} = ${codigo} OR ${titulos.numeroTitulo} = ${codigo} OR ${titulos.codigoRegistroNacional} = ${codigo} OR ${titulos.hashSeguridad} = ${codigo}`
      )
      .limit(1);

    if (row.length === 0) {
      return res.status(404).json({
        valido: false,
        mensaje: 'Título Profesional no encontrado o código de verificación inválido.',
      });
    }

    const t = row[0];
    res.json({
      valido: t.estado !== 'ANULADO',
      estado: t.estado,
      codigoTitulo: t.codigoTitulo,
      codigoRegistroNacional: t.codigoRegistroNacional,
      numeroTitulo: t.numeroTitulo,
      numeroActaSustentacion: t.numeroActaSustentacion,
      denominacionTitulo: t.denominacionTitulo,
      titulado: `${t.apellidoPaterno} ${t.apellidoMaterno || ''}, ${t.nombres}`.trim(),
      dni: t.dni,
      codigoEstudiante: t.codigoEstudiante,
      codigoEgresado: t.codigoEgresado,
      programa: t.programa,
      nivelFormativo: t.nivelFormativo || 'Técnico',
      modalidadTitulacion: t.modalidadTitulacion,
      tituloProyecto: t.tituloProyecto,
      calificacion: t.calificacion ? Number(t.calificacion) : undefined,
      resultadoSustentacion: t.resultadoSustentacion,
      fechaSustentacion: t.fechaSustentacion,
      fechaEmision: t.fechaEmision,
      resolucionDirectoral: t.resolucionDirectoral,
      tomoFolio: t.tomoFolio,
      libroRegistro: t.libroRegistro,
      hashSeguridad: t.hashSeguridad,
      institucion: 'CETPRO JUANJUÍ',
      ugel: 'UGEL Mariscal Cáceres',
      dre: 'DRE San Martín',
    });
  } catch (error: any) {
    console.error('Error al validar título:', error);
    res.status(500).json({ error: 'Error al validar título', details: error.message });
  }
});

// -------------------------------------------------------------
// 4. POST /api/titulos (Expedición Oficial de Título y Acta)
// -------------------------------------------------------------
titulosRouter.post('/', async (req, res) => {
  try {
    const {
      egresadoId,
      modalidadTitulacion,
      tituloProyecto,
      fechaSustentacion,
      horaSustentacion,
      calificacion,
      resultadoSustentacion,
      juradoCalificador,
      resolucionDirectoral,
      libroRegistro,
      tomoFolio,
      observaciones,
      usuarioId,
    } = req.body;

    if (!egresadoId) {
      return res.status(400).json({ error: 'egresadoId es obligatorio.' });
    }

    // 1. Obtener datos del egresado, programa y plan
    const egresadoInfo = await db.execute(sql`
      SELECT 
        e.id as egresado_id,
        e.estudiante_id,
        e.programa_id,
        e.plan_estudio_id,
        e.total_creditos_aprobados,
        e.total_horas_acumuladas,
        p.nombre as programa_nombre,
        COALESCE(nf.nombre, 'Técnico') as nivel_formativo
      FROM egresados e
      JOIN programas p ON e.programa_id = p.id
      LEFT JOIN niveles_formativos nf ON p.nivel_formativo_id = nf.id
      WHERE e.id = ${egresadoId}
      LIMIT 1;
    `);

    if (egresadoInfo.rows.length === 0) {
      return res.status(404).json({ error: 'Registro de egresado no encontrado.' });
    }
    const eg = egresadoInfo.rows[0] as any;

    // 2. Determinar denominación oficial según nivel formativo (ANEXOS 5A y 5B)
    const denominacionTitulo = eg.nivel_formativo === 'Auxiliar Técnico'
      ? `AUXILIAR TÉCNICO EN ${String(eg.programa_nombre).toUpperCase()}`
      : `TÉCNICO EN ${String(eg.programa_nombre).toUpperCase()}`;

    // 3. Generar Correlativo Oficial
    const countResult = await db.execute(sql`SELECT count(*)::int as total FROM public.titulos`);
    const nextNum = (Number(countResult.rows[0]?.total) || 0) + 1;
    const year = new Date().getFullYear();
    const correlativo = String(nextNum).padStart(4, '0');
    const codigoTitulo = `TIT-${year}-${correlativo}`;
    const codigoRegistroNacional = `MINEDU-TIT-${year}-${correlativo}`;
    const numeroActaSustentacion = `ACT-TIT-${year}-${correlativo}`;
    const numeroTitulo = codigoTitulo;

    // 4. Hash y QR
    const hashSeguridad = crypto.randomBytes(6).toString('hex');
    const codigoVerificacionQr = `https://siga.cetprojuanjui.edu.pe/validar-titulo?num=${codigoTitulo}&hash=${hashSeguridad}`;

    // 5. Calificación
    const notaNum = calificacion ? Number(calificacion) : 17.00;
    const notaLetras = numeroALetras(notaNum);
    const resultado = resultadoSustentacion || (notaNum >= 17 ? 'APROBADO_UNANIMIDAD' : notaNum >= 13 ? 'APROBADO_MAYORIA' : 'DESAPROBADO');

    // 6. Modalidad y Jurado por defecto si no viene completo
    const resolvedModalidad = normalizeModalidadTitulacion(modalidadTitulacion);
    const jurado = juradoCalificador || {
      presidente: { nombre: 'Lic. Carlos Silva Ramos', dni: '01234567', cargo: 'Docente Formador Principal' },
      secretario: { nombre: 'Lic. Ana Torres Pezo', dni: '02345678', cargo: 'Docente de Especialidad' },
      vocal: { nombre: 'Lic. Marcos Ríos del Castillo', dni: '03456789', cargo: 'Docente Evaluador' },
    };

    // 7. Insertar en public.titulos
    const [created] = await db
      .insert(titulos)
      .values({
        estudianteId: eg.estudiante_id,
        egresadoId: eg.egresado_id,
        programaId: eg.programa_id,
        planEstudioId: eg.plan_estudio_id,
        numeroTitulo,
        codigoTitulo,
        codigoRegistroNacional,
        numeroActaSustentacion,
        denominacionTitulo,
        modalidadTitulacion: resolvedModalidad,
        tituloProyecto: tituloProyecto || 'Proyecto de Aplicación Profesional Integrado al Sector Productivo Regional',
        fechaSustentacion: fechaSustentacion || new Date().toISOString().split('T')[0],
        horaSustentacion: horaSustentacion || '10:00 AM',
        calificacion: String(notaNum),
        calificacionLetras: notaLetras,
        resultadoSustentacion: resultado,
        juradoCalificador: jurado,
        totalHorasAcumuladas: Number(eg.total_horas_acumuladas) || 950,
        totalCreditosAcumulados: String(eg.total_creditos_aprobados || 40.00),
        resolucionDirectoral: resolucionDirectoral || 'RD N° 0180-2026-DRE-SM',
        libroRegistro: libroRegistro || 'Libro Oficial de Títulos Profesionales 2026',
        tomoFolio: tomoFolio || `Tomo 01, Folio ${String(nextNum + 10).padStart(2, '0')}`,
        codigoVerificacionQr,
        hashSeguridad,
        estado: 'EMITIDO',
        fechaEmision: new Date().toISOString().split('T')[0],
        observaciones: observaciones || 'Título Oficial expedido según R.V.M. N° 188-2020-MINEDU',
        usuarioId: usuarioId || null,
      })
      .returning();

    // 8. Actualizar estado en egresados a 'TITULADO'
    await db.execute(sql`
      UPDATE public.egresados
      SET 
        estado_tramite = 'TITULADO',
        modalidad_titulacion = ${resolvedModalidad},
        fecha_sustentacion = ${fechaSustentacion || new Date().toISOString().split('T')[0]},
        calificacion_titulacion = ${notaNum},
        resultado_sustentacion = ${resultado},
        numero_titulo = ${codigoTitulo},
        numero_registro_titulo = ${codigoRegistroNacional},
        fecha_emision_titulo = CURRENT_DATE,
        fecha_actualizacion = CURRENT_TIMESTAMP
      WHERE id = ${egresadoId};
    `);

    // 9. Registro de auditoría
    try {
      await db.insert(auditorias).values({
        usuarioId: usuarioId || null,
        accion: 'EXPEDICION_TITULO_PROFESIONAL',
        tabla: 'titulos',
        registroId: created.id,
        datosNuevos: {
          codigoTitulo,
          codigoRegistroNacional,
          egresadoId,
          denominacionTitulo,
          calificacion: notaNum,
        },
      });
    } catch {}

    res.status(201).json(created);
  } catch (error: any) {
    console.error('Error al expedir título:', error);
    res.status(500).json({ error: 'Error al expedir título', details: error.message });
  }
});

// -------------------------------------------------------------
// 5. PUT /api/titulos/:id (Actualizar Estado y Datos de Título)
// -------------------------------------------------------------
titulosRouter.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      estado,
      fechaVisadoUgel,
      fechaEntrega,
      resolucionDirectoral,
      libroRegistro,
      tomoFolio,
      codigoRegistroNacional,
      observaciones,
      usuarioId,
    } = req.body;

    const existing = await db.select().from(titulos).where(eq(titulos.id, id)).limit(1);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Título no encontrado.' });
    }

    const [updated] = await db
      .update(titulos)
      .set({
        estado: estado || existing[0].estado,
        fechaVisadoUgel: fechaVisadoUgel !== undefined ? fechaVisadoUgel : existing[0].fechaVisadoUgel,
        fechaEntrega: fechaEntrega !== undefined ? fechaEntrega : existing[0].fechaEntrega,
        resolucionDirectoral: resolucionDirectoral || existing[0].resolucionDirectoral,
        libroRegistro: libroRegistro || existing[0].libroRegistro,
        tomoFolio: tomoFolio || existing[0].tomoFolio,
        codigoRegistroNacional: codigoRegistroNacional || existing[0].codigoRegistroNacional,
        observaciones: observaciones || existing[0].observaciones,
        fechaActualizacion: sql`CURRENT_TIMESTAMP`,
      })
      .where(eq(titulos.id, id))
      .returning();

    // Auditoría
    try {
      await db.insert(auditorias).values({
        usuarioId: usuarioId || null,
        accion: 'ACTUALIZACION_TITULO',
        tabla: 'titulos',
        registroId: id,
        datosAnteriores: { estado: existing[0].estado },
        datosNuevos: { estado: updated.estado },
      });
    } catch {}

    res.json(updated);
  } catch (error: any) {
    console.error('Error al actualizar título:', error);
    res.status(500).json({ error: 'Error al actualizar título', details: error.message });
  }
});

// -------------------------------------------------------------
// 6. DELETE /api/titulos/:id (Eliminación protegida)
// -------------------------------------------------------------
titulosRouter.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { usuarioId } = req.query;

    const existing = await db.select().from(titulos).where(eq(titulos.id, id)).limit(1);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Título no encontrado.' });
    }

    const t = existing[0];
    if (t.estado === 'ENTREGADO') {
      return res.status(400).json({
        error: 'No se puede eliminar un título oficial que ya fue entregado al graduando. Modifíquelo a ANULADO si corresponde.',
      });
    }

    await db.delete(titulos).where(eq(titulos.id, id));

    // Revertir estado en egresados si corresponde
    await db.execute(sql`
      UPDATE public.egresados 
      SET estado_tramite = 'EGRESADO', numero_titulo = NULL, numero_registro_titulo = NULL
      WHERE id = ${t.egresadoId};
    `);

    // Auditoría
    try {
      await db.insert(auditorias).values({
        usuarioId: (usuarioId as string) || null,
        accion: 'ELIMINACION_TITULO',
        tabla: 'titulos',
        registroId: id,
        datosAnteriores: { codigoTitulo: t.codigoTitulo, egresadoId: t.egresadoId },
      });
    } catch {}

    res.json({ success: true, message: 'Título oficial retirado correctamente.' });
  } catch (error: any) {
    console.error('Error al eliminar título:', error);
    res.status(500).json({ error: 'Error al eliminar título', details: error.message });
  }
});
