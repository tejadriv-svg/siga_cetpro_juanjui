import { Router } from 'express';
import { db } from '../db/index.js';
import { 
  certificadosModulares, 
  estudiantes, 
  personas, 
  modulos, 
  programas, 
  nivelesFormativos, 
  unidadesDidacticas, 
  tiposUnidades,
  notasUnidades, 
  efsrt, 
  notasEfsrt, 
  auditorias 
} from '../db/schema.js';
import { eq, and, desc, sql } from 'drizzle-orm';
import crypto from 'crypto';

export const certificadosModularesRouter = Router();

// -------------------------------------------------------------
// 1. GET /api/certificados-modulares (Listado Oficial Relacional)
// -------------------------------------------------------------
certificadosModularesRouter.get('/', async (_req, res) => {
  try {
    const rows = await db
      .select({
        id: certificadosModulares.id,
        estudianteId: certificadosModulares.estudianteId,
        moduloId: certificadosModulares.moduloId,
        programaId: certificadosModulares.programaId,
        matriculaId: certificadosModulares.matriculaId,
        numeroCertificado: certificadosModulares.numeroCertificado,
        codigoCertificado: certificadosModulares.codigoCertificado,
        fechaEmision: certificadosModulares.fechaEmision,
        horasModulo: certificadosModulares.horasModulo,
        creditosModulo: certificadosModulares.creditosModulo,
        promedioUnidades: certificadosModulares.promedioUnidades,
        notaEfsrt: certificadosModulares.notaEfsrt,
        promedioFinal: certificadosModulares.promedioFinal,
        detalleCalificaciones: certificadosModulares.detalleCalificaciones,
        resolucionDirectoral: certificadosModulares.resolucionDirectoral,
        tomoFolio: certificadosModulares.tomoFolio,
        codigoVerificacionQr: certificadosModulares.codigoVerificacionQr,
        hashSeguridad: certificadosModulares.hashSeguridad,
        estado: certificadosModulares.estado,
        fechaEntrega: certificadosModulares.fechaEntrega,
        documentoId: certificadosModulares.documentoId,
        observaciones: certificadosModulares.observaciones,
        usuarioId: certificadosModulares.usuarioId,
        fechaRegistro: certificadosModulares.fechaRegistro,
        fechaActualizacion: certificadosModulares.fechaActualizacion,

        // Relaciones
        personaDni: personas.numeroDocumento,
        personaNombres: personas.nombres,
        personaApellidoPaterno: personas.apellidoPaterno,
        personaApellidoMaterno: personas.apellidoMaterno,
        estudianteCodigo: estudiantes.codigoEstudiante,
        moduloNombre: modulos.nombre,
        moduloCodigo: modulos.codigo,
        moduloOrden: modulos.orden,
        programaNombre: programas.nombre,
        programaCodigo: programas.codigo,
        nivelFormativo: nivelesFormativos.nombre,
      })
      .from(certificadosModulares)
      .innerJoin(estudiantes, eq(certificadosModulares.estudianteId, estudiantes.id))
      .innerJoin(personas, eq(estudiantes.personaId, personas.id))
      .innerJoin(modulos, eq(certificadosModulares.moduloId, modulos.id))
      .leftJoin(programas, eq(certificadosModulares.programaId, programas.id))
      .leftJoin(nivelesFormativos, eq(programas.nivelFormativoId, nivelesFormativos.id))
      .orderBy(desc(certificadosModulares.fechaEmision), desc(certificadosModulares.numeroCertificado));

    const result = rows.map((r) => ({
      ...r,
      creditosModulo: r.creditosModulo ? Number(r.creditosModulo) : undefined,
      promedioUnidades: r.promedioUnidades ? Number(r.promedioUnidades) : undefined,
      notaEfsrt: r.notaEfsrt ? Number(r.notaEfsrt) : undefined,
      promedioFinal: r.promedioFinal ? Number(r.promedioFinal) : undefined,
      detalleCalificaciones: typeof r.detalleCalificaciones === 'string' 
        ? JSON.parse(r.detalleCalificaciones) 
        : r.detalleCalificaciones,
    }));

    res.json(result);
  } catch (error: any) {
    console.error('Error al obtener certificados modulares:', error);
    res.status(500).json({ error: 'Error al obtener certificados modulares', details: error.message });
  }
});

// -------------------------------------------------------------
// 2. GET /api/certificados-modulares/aptos (Auditoría Académica de Aptos)
// -------------------------------------------------------------
certificadosModularesRouter.get('/aptos', async (req, res) => {
  try {
    const { programaId, moduloId } = req.query;

    let filterSql = sql`TRUE`;
    if (programaId) {
      filterSql = sql`${filterSql} AND m.programa_id = ${programaId as string}`;
    }
    if (moduloId) {
      filterSql = sql`${filterSql} AND m.id = ${moduloId as string}`;
    }

    const aptosQuery = await db.execute(sql`
      WITH resumen_uds AS (
        SELECT 
          nu.estudiante_id,
          ud.modulo_id,
          COUNT(DISTINCT ud.id) as total_unidades_cursadas,
          COUNT(DISTINCT CASE WHEN nu.nota >= 13 THEN ud.id END) as unidades_aprobadas,
          ROUND(AVG(nu.nota)::numeric, 2) as promedio_unidades
        FROM notas_unidades nu
        JOIN unidades_didacticas ud ON nu.unidad_id = ud.id
        WHERE nu.nota IS NOT NULL
        GROUP BY nu.estudiante_id, ud.modulo_id
      ),
      total_modulo_uds AS (
        SELECT 
          modulo_id, 
          COUNT(id) as total_unidades_requeridas
        FROM unidades_didacticas
        GROUP BY modulo_id
      ),
      resumen_efsrt AS (
        SELECT 
          COALESCE(ne.estudiante_id, mat.estudiante_id) as estudiante_id,
          ef.modulo_id,
          MAX(COALESCE(ne.nota, 0)) as nota_efsrt
        FROM notas_efsrt ne
        LEFT JOIN matriculas mat ON ne.matricula_id = mat.id
        JOIN efsrt ef ON ne.efsrt_id = ef.id
        GROUP BY COALESCE(ne.estudiante_id, mat.estudiante_id), ef.modulo_id
      )
      SELECT 
        e.id as estudiante_id,
        m.id as modulo_id,
        p.id as programa_id,
        mat.id as matricula_id,
        per.numero_documento as persona_dni,
        per.nombres as persona_nombres,
        per.apellido_paterno as persona_apellido_paterno,
        per.apellido_materno as persona_apellido_materno,
        e.codigo_estudiante as estudiante_codigo,
        m.nombre as modulo_nombre,
        m.codigo as modulo_codigo,
        m.horas as modulo_horas,
        m.creditos as modulo_creditos,
        p.nombre as programa_nombre,
        p.codigo as programa_codigo,
        COALESCE(nf.nombre, 'Técnico') as nivel_formativo,
        tmu.total_unidades_requeridas as unidades_totales,
        ru.unidades_aprobadas,
        ru.total_unidades_cursadas,
        ru.promedio_unidades,
        COALESCE(re.nota_efsrt, 0) as nota_efsrt,
        ROUND((ru.promedio_unidades * 0.7 + COALESCE(re.nota_efsrt, 14) * 0.3)::numeric, 2) as promedio_final,
        CASE 
          WHEN ru.unidades_aprobadas = ru.total_unidades_cursadas AND COALESCE(re.nota_efsrt, 0) >= 13 
          THEN true 
          ELSE false 
        END as cumple_requisitos,
        CASE WHEN cm.id IS NOT NULL THEN true ELSE false END as ya_certificado,
        cm.id as certificado_id,
        cm.codigo_certificado,
        cm.estado as estado_certificado
      FROM resumen_uds ru
      JOIN total_modulo_uds tmu ON ru.modulo_id = tmu.modulo_id
      LEFT JOIN resumen_efsrt re ON ru.estudiante_id = re.estudiante_id AND ru.modulo_id = re.modulo_id
      JOIN estudiantes e ON ru.estudiante_id = e.id
      JOIN personas per ON e.persona_id = per.id
      JOIN modulos m ON ru.modulo_id = m.id
      JOIN programas p ON m.programa_id = p.id
      LEFT JOIN niveles_formativos nf ON p.nivel_formativo_id = nf.id
      LEFT JOIN (
        SELECT DISTINCT ON (estudiante_id, modulo_id) id, estudiante_id, modulo_id
        FROM matriculas
        ORDER BY estudiante_id, modulo_id, fecha_matricula DESC
      ) mat ON mat.estudiante_id = e.id AND mat.modulo_id = m.id
      LEFT JOIN public.certificados_modulares cm ON cm.estudiante_id = e.id AND cm.modulo_id = m.id
      WHERE ru.total_unidades_cursadas > 0
        AND ${filterSql}
      ORDER BY p.nombre, m.orden, per.apellido_paterno, per.apellido_materno;
    `);

    const formatted = aptosQuery.rows.map((row: any) => ({
      ...row,
      modulo_horas: Number(row.modulo_horas) || 0,
      modulo_creditos: Number(row.modulo_creditos) || 0,
      unidades_totales: Number(row.unidades_totales) || 0,
      unidades_aprobadas: Number(row.unidades_aprobadas) || 0,
      promedio_unidades: Number(row.promedio_unidades) || 0,
      nota_efsrt: Number(row.nota_efsrt) || 0,
      total_unidades_cursadas: Number(row.total_unidades_cursadas) || 0,
      cumple_requisitos: Boolean(row.cumple_requisitos),
      ya_certificado: Boolean(row.ya_certificado),
    }));

    res.json(formatted);
  } catch (error: any) {
    console.error('Error al obtener aptos para certificación modular:', error);
    res.status(500).json({ error: 'Error al obtener aptos', details: error.message });
  }
});

// -------------------------------------------------------------
// 3. GET /api/certificados-modulares/validar/:codigo (Validación Pública QR)
// -------------------------------------------------------------
certificadosModularesRouter.get('/validar/:codigo', async (req, res) => {
  try {
    const { codigo } = req.params;

    const cert = await db
      .select({
        id: certificadosModulares.id,
        numeroCertificado: certificadosModulares.numeroCertificado,
        codigoCertificado: certificadosModulares.codigoCertificado,
        fechaEmision: certificadosModulares.fechaEmision,
        horasModulo: certificadosModulares.horasModulo,
        creditosModulo: certificadosModulares.creditosModulo,
        promedioFinal: certificadosModulares.promedioFinal,
        resolucionDirectoral: certificadosModulares.resolucionDirectoral,
        tomoFolio: certificadosModulares.tomoFolio,
        estado: certificadosModulares.estado,
        hashSeguridad: certificadosModulares.hashSeguridad,
        detalleCalificaciones: certificadosModulares.detalleCalificaciones,
        // Alumno
        dni: personas.numeroDocumento,
        nombres: personas.nombres,
        apellidoPaterno: personas.apellidoPaterno,
        apellidoMaterno: personas.apellidoMaterno,
        // Programa y Módulo
        programa: programas.nombre,
        modulo: modulos.nombre,
        nivelFormativo: nivelesFormativos.nombre,
      })
      .from(certificadosModulares)
      .innerJoin(estudiantes, eq(certificadosModulares.estudianteId, estudiantes.id))
      .innerJoin(personas, eq(estudiantes.personaId, personas.id))
      .innerJoin(modulos, eq(certificadosModulares.moduloId, modulos.id))
      .leftJoin(programas, eq(certificadosModulares.programaId, programas.id))
      .leftJoin(nivelesFormativos, eq(programas.nivelFormativoId, nivelesFormativos.id))
      .where(
        sql`${certificadosModulares.codigoCertificado} = ${codigo} OR ${certificadosModulares.numeroCertificado} = ${codigo} OR ${certificadosModulares.hashSeguridad} = ${codigo}`
      )
      .limit(1);

    if (cert.length === 0) {
      return res.status(404).json({
        valido: false,
        mensaje: 'Certificado Modular no encontrado o código inválido.',
      });
    }

    const c = cert[0];
    res.json({
      valido: c.estado !== 'ANULADO',
      estado: c.estado,
      numeroCertificado: c.numeroCertificado,
      codigoCertificado: c.codigoCertificado,
      estudiante: `${c.apellidoPaterno} ${c.apellidoMaterno || ''}, ${c.nombres}`.trim(),
      dni: c.dni,
      programa: c.programa,
      modulo: c.modulo,
      nivelFormativo: c.nivelFormativo || 'Técnico',
      horas: c.horasModulo,
      creditos: c.creditosModulo ? Number(c.creditosModulo) : undefined,
      promedioFinal: c.promedioFinal ? Number(c.promedioFinal) : undefined,
      fechaEmision: c.fechaEmision,
      resolucionDirectoral: c.resolucionDirectoral || 'R.D. N° 0145-2026-D-CETPRO-J',
      tomoFolio: c.tomoFolio,
      hashSeguridad: c.hashSeguridad,
      institucion: 'CETPRO JUANJUÍ',
      ugel: 'UGEL Mariscal Cáceres',
      dre: 'DRE San Martín',
    });
  } catch (error: any) {
    console.error('Error al validar certificado modular:', error);
    res.status(500).json({ error: 'Error al validar certificado', details: error.message });
  }
});

// -------------------------------------------------------------
// 4. POST /api/certificados-modulares (Emisión Oficial con Cálculo Ponderado)
// -------------------------------------------------------------
certificadosModularesRouter.post('/', async (req, res) => {
  try {
    const {
      estudianteId,
      moduloId,
      matriculaId,
      resolucionDirectoral,
      tomoFolio,
      observaciones,
      usuarioId
    } = req.body;

    if (!estudianteId || !moduloId) {
      return res.status(400).json({ error: 'estudianteId y moduloId son obligatorios.' });
    }

    // 1. Verificar si ya existe certificado para este estudiante y módulo
    const existing = await db
      .select({ id: certificadosModulares.id, codigo: certificadosModulares.codigoCertificado })
      .from(certificadosModulares)
      .where(
        and(
          eq(certificadosModulares.estudianteId, estudianteId),
          eq(certificadosModulares.moduloId, moduloId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return res.status(400).json({ 
        error: `El estudiante ya cuenta con un certificado emitido para este módulo (${existing[0].codigo || 'Registrado'}).` 
      });
    }

    // 2. Obtener información del módulo y programa
    const moduloInfo = await db
      .select({
        moduloId: modulos.id,
        moduloNombre: modulos.nombre,
        moduloCodigo: modulos.codigo,
        moduloHoras: modulos.horas,
        moduloCreditos: modulos.creditos,
        programaId: modulos.programaId,
      })
      .from(modulos)
      .where(eq(modulos.id, moduloId))
      .limit(1);

    if (moduloInfo.length === 0) {
      return res.status(404).json({ error: 'Módulo formativo no encontrado.' });
    }
    const mod = moduloInfo[0];

    // 3. Obtener desglose de calificaciones de Unidades Didácticas
    const udsQuery = await db.execute(sql`
      SELECT 
        ud.codigo as unidad_codigo,
        ud.nombre as unidad_nombre,
        COALESCE(tu.nombre::text, 'Técnica') as tipo_unidad,
        ud.horas,
        ud.creditos,
        nu.nota
      FROM unidades_didacticas ud
      LEFT JOIN tipos_unidades tu ON tu.id = ud.tipo_unidad_id
      LEFT JOIN notas_unidades nu ON nu.unidad_id = ud.id AND nu.estudiante_id = ${estudianteId}
      WHERE ud.modulo_id = ${moduloId}
      ORDER BY ud.codigo;
    `);

    const notasList = udsQuery.rows.map((u: any) => ({
      codigo: u.unidad_codigo,
      nombre: u.unidad_nombre,
      tipo: u.tipo_unidad || 'Técnica',
      horas: Number(u.horas) || 60,
      creditos: Number(u.creditos) || 3.0,
      nota: Number(u.nota) || 0,
    }));

    // Calcular promedio simple de unidades didácticas
    const validNotas = notasList.filter(n => n.nota > 0);
    const promUnidades = validNotas.length > 0 
      ? Math.round((validNotas.reduce((acc, curr) => acc + curr.nota, 0) / validNotas.length) * 100) / 100
      : 14.0;

    // 4. Obtener nota EFSRT
    const efsrtQuery = await db.execute(sql`
      SELECT MAX(ne.nota) as nota_efsrt
      FROM notas_efsrt ne
      JOIN efsrt ef ON ne.efsrt_id = ef.id
      WHERE ne.estudiante_id = ${estudianteId} AND ef.modulo_id = ${moduloId};
    `);

    const notaEfsrt = Number(efsrtQuery.rows[0]?.nota_efsrt) || 15.0;

    // Promedio Ponderado MINEDU (70% UDs + 30% EFSRT)
    const promFinal = Math.round((promUnidades * 0.7 + notaEfsrt * 0.3) * 10) / 10;

    // 5. Generar Correlativo Oficial
    const countResult = await db.execute(sql`SELECT count(*)::int as total FROM public.certificados_modulares`);
    const nextCorrelativo = (Number(countResult.rows[0]?.total) || 0) + 1;
    const year = new Date().getFullYear();
    const numeroCertificado = `CERT-MOD-${year}-${String(nextCorrelativo).padStart(4, '0')}`;
    const codigoCertificado = `CM-${year}-${String(nextCorrelativo).padStart(4, '0')}`;

    // 6. Seguridad y QR
    const hashSeguridad = crypto.randomBytes(6).toString('hex');
    const codigoVerificacionQr = `https://siga.cetprojuanjui.edu.pe/validar-certificado?num=${codigoCertificado}&hash=${hashSeguridad}`;

    // 7. Insertar en BD
    const insertResult = await db
      .insert(certificadosModulares)
      .values({
        estudianteId,
        moduloId,
        programaId: mod.programaId,
        matriculaId: matriculaId || null,
        numeroCertificado,
        codigoCertificado,
        fechaEmision: new Date().toISOString().split('T')[0],
        horasModulo: mod.moduloHoras || 280,
        creditosModulo: mod.moduloCreditos ? String(mod.moduloCreditos) : '12.0',
        promedioUnidades: String(promUnidades),
        notaEfsrt: String(notaEfsrt),
        promedioFinal: String(promFinal),
        detalleCalificaciones: notasList,
        resolucionDirectoral: resolucionDirectoral || 'R.D. N° 0145-2026-D-CETPRO-J',
        tomoFolio: tomoFolio || `LIB-2026 / FOL-${String(nextCorrelativo).padStart(3, '0')}`,
        codigoVerificacionQr,
        hashSeguridad,
        estado: 'EMITIDO',
        observaciones: observaciones || 'Certificado modular emitido conforme a la R.V.M. N° 188-2020-MINEDU',
        usuarioId: usuarioId || null,
      })
      .returning();

    const createdCert = insertResult[0];

    // 8. Registro de auditoría
    await db.insert(auditorias).values({
      usuarioId: usuarioId || null,
      accion: 'EMISION_CERTIFICADO_MODULAR',
      tabla: 'certificados_modulares',
      registroId: createdCert.id,
      datosNuevos: {
        codigoCertificado,
        estudianteId,
        moduloId,
        promFinal,
      },
    });

    res.status(201).json(createdCert);
  } catch (error: any) {
    console.error('Error al emitir certificado modular:', error);
    res.status(500).json({ error: 'Error al emitir certificado', details: error.message });
  }
});

// -------------------------------------------------------------
// 5. PUT /api/certificados-modulares/:id (Actualizar Estado y Datos)
// -------------------------------------------------------------
certificadosModularesRouter.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      estado,
      fechaEntrega,
      resolucionDirectoral,
      tomoFolio,
      observaciones,
      usuarioId
    } = req.body;

    const current = await db
      .select()
      .from(certificadosModulares)
      .where(eq(certificadosModulares.id, id))
      .limit(1);

    if (current.length === 0) {
      return res.status(404).json({ error: 'Certificado no encontrado.' });
    }

    const updateData: any = {
      fechaActualizacion: sql`CURRENT_TIMESTAMP`,
    };

    if (estado !== undefined) updateData.estado = estado;
    if (fechaEntrega !== undefined) updateData.fechaEntrega = fechaEntrega;
    if (resolucionDirectoral !== undefined) updateData.resolucionDirectoral = resolucionDirectoral;
    if (tomoFolio !== undefined) updateData.tomoFolio = tomoFolio;
    if (observaciones !== undefined) updateData.observaciones = observaciones;

    const updated = await db
      .update(certificadosModulares)
      .set(updateData)
      .where(eq(certificadosModulares.id, id))
      .returning();

    // Auditoría
    await db.insert(auditorias).values({
      usuarioId: usuarioId || null,
      accion: 'ACTUALIZAR_CERTIFICADO_MODULAR',
      tabla: 'certificados_modulares',
      registroId: id,
      datosAnteriores: current[0],
      datosNuevos: updated[0],
    });

    res.json(updated[0]);
  } catch (error: any) {
    console.error('Error al actualizar certificado modular:', error);
    res.status(500).json({ error: 'Error al actualizar certificado', details: error.message });
  }
});

// -------------------------------------------------------------
// 6. DELETE /api/certificados-modulares/:id
// -------------------------------------------------------------
certificadosModularesRouter.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { usuarioId } = req.query;

    const current = await db
      .select()
      .from(certificadosModulares)
      .where(eq(certificadosModulares.id, id))
      .limit(1);

    if (current.length === 0) {
      return res.status(404).json({ error: 'Certificado no encontrado.' });
    }

    if (current[0].estado === 'ENTREGADO') {
      return res.status(400).json({ 
        error: 'No se puede eliminar un certificado modular que ya ha sido entregado físicamente al estudiante. Si es necesario, cámbielo a ANULADO.' 
      });
    }

    await db.delete(certificadosModulares).where(eq(certificadosModulares.id, id));

    // Auditoría
    await db.insert(auditorias).values({
      usuarioId: (usuarioId as string) || null,
      accion: 'ELIMINAR_CERTIFICADO_MODULAR',
      tabla: 'certificados_modulares',
      registroId: id,
      datosAnteriores: current[0],
    });

    res.json({ message: 'Certificado modular eliminado con éxito.' });
  } catch (error: any) {
    console.error('Error al eliminar certificado modular:', error);
    res.status(500).json({ error: 'Error al eliminar certificado', details: error.message });
  }
});
