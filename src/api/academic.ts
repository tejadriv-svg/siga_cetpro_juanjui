import { Router } from 'express';
import { db, createPool } from '../db/index.js';
import {
  cetpros,
  sedes,
  aulas,
  turnos,
  programas,
  secciones,
  seccionesUnidades,
  planesEstudios,
  modulos,
  unidadesDidacticas as unidades,
  nivelesFormativos,
  periodosClases,
  periodosAcademicos,
  periodosLectivos,
  horarios,
  asignacionesTrabajadores,
  trabajadores,
  personas,
  matriculas
} from '../db/schema.js';
import { eq, and, desc, inArray, ne } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export const academicRouter = Router();

const pool = createPool();

/**
 * Sincroniza y pre-carga automáticamente las unidades didácticas en secciones_unidades.
 * Asegura que para cada sección existan los registros relacionales de todas las unidades didácticas
 * de su módulo formativo, heredando docente, horas, créditos y fechas del período de clases,
 * sin sobreescribir las personalizaciones que el docente o coordinador ya haya establecido.
 */
export async function ensureSeccionesUnidades(seccionId?: string, moduloId?: string) {
  try {
    let query = `
      INSERT INTO secciones_unidades (
        seccion_id, unidad_id, docente_id, fecha_inicio, fecha_fin,
        horas, creditos, estado, fecha_registro, fecha_actualizacion
      )
      SELECT 
        s.id as seccion_id,
        u.id as unidad_id,
        COALESCE(
          (SELECT at.trabajador_id FROM asignaciones_trabajadores at WHERE at.seccion_id = s.id AND (at.unidad_id = u.id OR at.unidad_id IS NULL) LIMIT 1),
          (SELECT at2.trabajador_id FROM asignaciones_trabajadores at2 WHERE at2.seccion_id = s.id LIMIT 1),
          (SELECT t.id FROM trabajadores t LIMIT 1)
        ) as docente_id,
        COALESCE(pc.fecha_inicio, CURRENT_DATE) as fecha_inicio,
        COALESCE(pc.fecha_fin, CURRENT_DATE + INTERVAL '4 months') as fecha_fin,
        COALESCE(u.horas, 0) as horas,
        COALESCE(u.creditos, 0) as creditos,
        'PROGRAMADA' as estado,
        CURRENT_TIMESTAMP as fecha_registro,
        CURRENT_TIMESTAMP as fecha_actualizacion
      FROM secciones s
      JOIN unidades_didacticas u ON u.modulo_id = s.modulo_id
      LEFT JOIN periodos_clases pc ON s.periodo_clases_id = pc.id
      WHERE 1=1
    `;
    const params: any[] = [];
    if (seccionId) {
      params.push(seccionId);
      query += ` AND s.id = $${params.length}`;
    }
    if (moduloId) {
      params.push(moduloId);
      query += ` AND s.modulo_id = $${params.length}`;
    }
    query += ` ON CONFLICT (seccion_id, unidad_id) DO NOTHING;`;

    await pool.query(query, params);
  } catch (err) {
    console.error('Error auto-syncing secciones_unidades:', err);
  }
}

// Sincronización inicial automática al iniciar el backend
ensureSeccionesUnidades().catch(err => {
  console.error('Error en sincronización inicial de secciones_unidades:', err);
});

// --- CETPRO ---
academicRouter.get('/cetpro', async (req, res) => {
  try {
    const allCetpros = await db.select().from(cetpros);
    if (allCetpros.length === 0) {
      return res.json(null);
    }
    res.json(allCetpros[0]);
  } catch (error) {
    console.error('Error fetching CETPRO:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

academicRouter.post('/cetpro', async (req, res) => {
  try {
    const data = req.body;
    const existing = await db.select().from(cetpros);
    let result;
    if (existing.length > 0) {
      result = await db.update(cetpros)
        .set({
          nombre: data.nombre,
          codigoModular: data.codigoModular,
          codigoLocal: data.codigoLocal,
          telefonoFijo: data.telefonoFijo,
          ruc: data.ruc,
          cuentaCorrienteBn: data.cuentaBancariaBN,
          tipoGestion: data.tipoGestion,
          ugel: data.ugel,
          dreGre: data.dreGre,
          direccion: data.direccion,
          distrito: data.distrito,
          provincia: data.provincia,
          region: data.region,
                  })
        .where(eq(cetpros.id, existing[0].id))
        .returning();
    } else {
      result = await db.insert(cetpros)
        .values({
          nombre: data.nombre || 'Nuevo CETPRO',
          codigoModular: data.codigoModular || '0000000',
          codigoLocal: data.codigoLocal,
          telefonoFijo: data.telefonoFijo,
          ruc: data.ruc,
          cuentaCorrienteBn: data.cuentaBancariaBN,
          tipoGestion: data.tipoGestion,
          ugel: data.ugel,
          dreGre: data.dreGre,
          direccion: data.direccion,
          distrito: data.distrito,
          provincia: data.provincia,
          region: data.region,
                  })
        .returning();
    }
    res.json(result[0]);
  } catch (error) {
    console.error('Error saving CETPRO:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- SEDES ---
academicRouter.get('/sedes', async (req, res) => {
  try {
    const allSedes = await db.select().from(sedes);
    res.json(allSedes.map(s => ({
      id: s.id,
      codigo: s.codigo,
      nombre: s.nombre,
      direccion: s.direccion,
      departamento: s.region,
      provincia: s.provincia,
      distrito: s.distrito,
      
    })));
  } catch (error) {
    console.error('Error fetching sedes:', error);
    res.status(500).json({ error: 'Error fetching sedes' });
  }
});

// --- AULAS ---
academicRouter.get('/aulas', async (req, res) => {
  try {
    const allAulas = await db.select().from(aulas);
    res.json(allAulas.map(a => ({
      id: a.id,
      sedeId: a.sedeId,
      codigo: a.codigo,
      nombre: a.nombre,
      tipoAmbiente: a.tipoAmbiente,
      capacidad: a.capacidad || 30,
      
    })));
  } catch (error) {
    console.error('Error fetching aulas:', error);
    res.status(500).json({ error: 'Error fetching aulas' });
  }
});

// --- PERIODOS LECTIVOS ---
academicRouter.get('/periodos-lectivos', async (req, res) => {
  try {
    const allPLectivos = await db.select().from(periodosLectivos);
    res.json(allPLectivos.map(pl => ({
      id: pl.id,
      cetproId: pl.cetproId,
      codigo: pl.codigo,
      nombre: pl.nombre,
      fechaInicio: pl.fechaInicio,
      fechaFin: pl.fechaFin,
      estado: pl.estado
    })));
  } catch (error) {
    console.error('Error fetching periodos lectivos:', error);
    res.status(500).json({ error: 'Error fetching periodos lectivos' });
  }
});

academicRouter.post('/periodos-lectivos', async (req, res) => {
  try {
    const data = req.body;
    let cetproId = data.cetproId;
    if (!cetproId) {
      const cetproList = await db.select().from(cetpros).limit(1);
      cetproId = cetproList[0]?.id;
    }
    if (!cetproId) {
      return res.status(400).json({ error: 'No existe una institución configurada' });
    }

    const [nuevo] = await db.insert(periodosLectivos).values({
      cetproId,
      codigo: data.codigo || `LECTIVO-${new Date().getFullYear()}`,
      nombre: data.nombre || `Año Lectivo ${new Date().getFullYear()}`,
      fechaInicio: data.fechaInicio || `${new Date().getFullYear()}-03-01`,
      fechaFin: data.fechaFin || `${new Date().getFullYear()}-12-31`,
      estado: data.estado || 'ACTIVO',
    }).returning();

    res.json(nuevo);
  } catch (error: any) {
    console.error('Error creating periodo lectivo:', error);
    res.status(500).json({ error: error.message || 'Error creating periodo lectivo' });
  }
});

academicRouter.put('/periodos-lectivos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const updateData: any = {};
    if (data.codigo) updateData.codigo = data.codigo;
    if (data.nombre) updateData.nombre = data.nombre;
    if (data.fechaInicio) updateData.fechaInicio = data.fechaInicio;
    if (data.fechaFin) updateData.fechaFin = data.fechaFin;
    if (data.estado) {
      updateData.estado = data.estado;
      if (data.estado.toUpperCase() === 'ACTIVO') {
        await db.update(periodosLectivos).set({ estado: 'INACTIVO' }).where(ne(periodosLectivos.id, id));
      }
    }

    const [updated] = await db.update(periodosLectivos).set(updateData).where(eq(periodosLectivos.id, id)).returning();
    res.json(updated);
  } catch (error: any) {
    console.error('Error updating periodo lectivo:', error);
    res.status(500).json({ error: error.message || 'Error updating periodo lectivo' });
  }
});

academicRouter.put('/periodos-lectivos/:id/activar', async (req, res) => {
  try {
    const { id } = req.params;
    await db.update(periodosLectivos).set({ estado: 'INACTIVO' });
    const [updated] = await db.update(periodosLectivos).set({ estado: 'ACTIVO' }).where(eq(periodosLectivos.id, id)).returning();
    const all = await db.select().from(periodosLectivos);
    res.json({ success: true, updated, periodos: all });
  } catch (error: any) {
    console.error('Error activating periodo lectivo:', error);
    res.status(500).json({ error: error.message || 'Error activating periodo lectivo' });
  }
});

academicRouter.delete('/periodos-lectivos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.delete(periodosLectivos).where(eq(periodosLectivos.id, id));
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting periodo lectivo:', error);
    res.status(500).json({ error: error.message || 'Error deleting periodo lectivo' });
  }
});

// --- TURNOS ---
academicRouter.get('/turnos', async (req, res) => {
  try {
    const allTurnos = await db.select().from(turnos);
    res.json(allTurnos.map(t => ({
      id: t.id,
      codigo: t.codigo,
      nombre: t.nombre,
      horaInicioReferencial: t.horaInicioReferencial,
      horaFinReferencial: t.horaFinReferencial,
      estado: t.estado || 'Activo',
    })));
  } catch (error) {
    console.error('Error fetching turnos:', error);
    res.status(500).json({ error: 'Error fetching turnos' });
  }
});

academicRouter.post('/turnos', async (req, res) => {
  try {
    const data = req.body;
    const estado = (data.estado?.toLowerCase() === 'inactivo') ? 'Inactivo' : 'Activo';
    const [nuevo] = await db.insert(turnos).values({
      codigo: data.codigo || `TUR-${Math.floor(100 + Math.random() * 900)}`,
      nombre: data.nombre,
      horaInicioReferencial: data.horaInicioReferencial || '08:00',
      horaFinReferencial: data.horaFinReferencial || '13:00',
      estado: estado as any,
    }).returning();
    res.json(nuevo);
  } catch (error: any) {
    console.error('Error creating turno:', error);
    res.status(500).json({ error: error.message || 'Error creating turno' });
  }
});

academicRouter.put('/turnos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const updateData: any = {};
    if (data.codigo) updateData.codigo = data.codigo;
    if (data.nombre) updateData.nombre = data.nombre;
    if (data.horaInicioReferencial) updateData.horaInicioReferencial = data.horaInicioReferencial;
    if (data.horaFinReferencial) updateData.horaFinReferencial = data.horaFinReferencial;
    if (data.estado) updateData.estado = (data.estado.toLowerCase() === 'inactivo') ? 'Inactivo' : 'Activo';

    const [updated] = await db.update(turnos).set(updateData).where(eq(turnos.id, id)).returning();
    res.json(updated);
  } catch (error: any) {
    console.error('Error updating turno:', error);
    res.status(500).json({ error: error.message || 'Error updating turno' });
  }
});

academicRouter.delete('/turnos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.delete(turnos).where(eq(turnos.id, id));
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting turno:', error);
    res.status(500).json({ error: error.message || 'Error deleting turno' });
  }
});

// --- PERIODOS ACADEMICOS ---
academicRouter.get('/periodos-academicos', async (req, res) => {
  try {
    const allPAcad = await db.select().from(periodosAcademicos);
    res.json(allPAcad.map(pa => ({
      id: pa.id,
      periodoLectivoId: pa.periodoLectivoId,
      codigo: pa.codigo,
      nombre: pa.nombre,
      fechaInicio: pa.fechaInicio,
      fechaFin: pa.fechaFin,
      estado: pa.estado
    })));
  } catch (error) {
    console.error('Error fetching periodos academicos:', error);
    res.status(500).json({ error: 'Error fetching periodos academicos' });
  }
});

academicRouter.post('/periodos-academicos', async (req, res) => {
  try {
    const data = req.body;
    let lectivoId = data.periodoLectivoId;
    if (!lectivoId) {
      const plFirst = await db.select().from(periodosLectivos).limit(1);
      lectivoId = plFirst[0]?.id;
    }
    if (!lectivoId) {
      return res.status(400).json({ error: 'Se requiere un año lectivo previo' });
    }

    const [nuevo] = await db.insert(periodosAcademicos).values({
      periodoLectivoId: lectivoId,
      codigo: data.codigo || `PER-ACA-${new Date().getFullYear()}-1`,
      nombre: data.nombre || `Periodo Académico ${new Date().getFullYear()}-I`,
      fechaInicio: data.fechaInicio || `${new Date().getFullYear()}-03-01`,
      fechaFin: data.fechaFin || `${new Date().getFullYear()}-07-31`,
      estado: data.estado || 'ACTIVO',
    }).returning();
    res.json(nuevo);
  } catch (error: any) {
    console.error('Error creating periodo academico:', error);
    res.status(500).json({ error: error.message || 'Error creating periodo academico' });
  }
});

academicRouter.put('/periodos-academicos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const updateData: any = {};
    if (data.periodoLectivoId) updateData.periodoLectivoId = data.periodoLectivoId;
    if (data.codigo) updateData.codigo = data.codigo;
    if (data.nombre) updateData.nombre = data.nombre;
    if (data.fechaInicio) updateData.fechaInicio = data.fechaInicio;
    if (data.fechaFin) updateData.fechaFin = data.fechaFin;
    if (data.estado) {
      updateData.estado = data.estado;
      if (data.estado.toUpperCase() === 'ACTIVO') {
        await db.update(periodosAcademicos).set({ estado: 'INACTIVO' }).where(ne(periodosAcademicos.id, id));
      }
    }

    const [updated] = await db.update(periodosAcademicos).set(updateData).where(eq(periodosAcademicos.id, id)).returning();
    res.json(updated);
  } catch (error: any) {
    console.error('Error updating periodo academico:', error);
    res.status(500).json({ error: error.message || 'Error updating periodo academico' });
  }
});

academicRouter.put('/periodos-academicos/:id/activar', async (req, res) => {
  try {
    const { id } = req.params;
    await db.update(periodosAcademicos).set({ estado: 'INACTIVO' });
    const [updated] = await db.update(periodosAcademicos).set({ estado: 'ACTIVO' }).where(eq(periodosAcademicos.id, id)).returning();
    const all = await db.select().from(periodosAcademicos);
    res.json({ success: true, updated, periodos: all });
  } catch (error: any) {
    console.error('Error activating periodo academico:', error);
    res.status(500).json({ error: error.message || 'Error activating periodo academico' });
  }
});

academicRouter.delete('/periodos-academicos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.delete(periodosAcademicos).where(eq(periodosAcademicos.id, id));
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting periodo academico:', error);
    res.status(500).json({ error: error.message || 'Error deleting periodo academico' });
  }
});

// --- PERIODOS DE CLASES ---
academicRouter.get('/periodos-clases', async (req, res) => {
  try {
    const allPClases = await db.select().from(periodosClases);
    res.json(allPClases.map(pc => ({
      id: pc.id,
      periodoAcademicoId: pc.periodoAcademicoId,
      codigo: pc.codigo,
      nombre: pc.nombre,
      fechaInicio: pc.fechaInicio,
      fechaFin: pc.fechaFin,
    })));
  } catch (error) {
    console.error('Error fetching periodos clases:', error);
    res.status(500).json({ error: 'Error fetching periodos clases' });
  }
});

academicRouter.post('/periodos-clases', async (req, res) => {
  try {
    const data = req.body;
    let paId = data.periodoAcademicoId;
    if (!paId) {
      const paFirst = await db.select().from(periodosAcademicos).limit(1);
      paId = paFirst[0]?.id;
    }
    if (!paId) {
      return res.status(400).json({ error: 'Se requiere un periodo académico previo' });
    }

    const [nuevo] = await db.insert(periodosClases).values({
      periodoAcademicoId: paId,
      codigo: data.codigo || `PCL-${new Date().getFullYear()}-M1`,
      nombre: data.nombre || `Periodo de Clases Módulo I - ${new Date().getFullYear()}`,
      fechaInicio: data.fechaInicio || `${new Date().getFullYear()}-03-15`,
      fechaFin: data.fechaFin || `${new Date().getFullYear()}-07-15`,
    }).returning();
    res.json(nuevo);
  } catch (error: any) {
    console.error('Error creating periodo de clases:', error);
    res.status(500).json({ error: error.message || 'Error creating periodo de clases' });
  }
});

academicRouter.put('/periodos-clases/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const updateData: any = {};
    if (data.periodoAcademicoId) updateData.periodoAcademicoId = data.periodoAcademicoId;
    if (data.codigo) updateData.codigo = data.codigo;
    if (data.nombre) updateData.nombre = data.nombre;
    if (data.fechaInicio) updateData.fechaInicio = data.fechaInicio;
    if (data.fechaFin) updateData.fechaFin = data.fechaFin;

    const [updated] = await db.update(periodosClases).set(updateData).where(eq(periodosClases.id, id)).returning();

    // Actualizar automáticamente fechas en secciones_unidades para unidades en estado 'PROGRAMADA'
    if (data.fechaInicio || data.fechaFin) {
      try {
        await pool.query(`
          UPDATE secciones_unidades su
          SET 
            fecha_inicio = COALESCE($1, su.fecha_inicio),
            fecha_fin = COALESCE($2, su.fecha_fin),
            fecha_actualizacion = CURRENT_TIMESTAMP
          FROM secciones s
          WHERE su.seccion_id = s.id 
            AND s.periodo_clases_id = $3
            AND su.estado = 'PROGRAMADA'
        `, [data.fechaInicio || null, data.fechaFin || null, id]);
      } catch (syncErr) {
        console.error('Error syncing dates in secciones_unidades from periodo_clases:', syncErr);
      }
    }

    res.json(updated);
  } catch (error: any) {
    console.error('Error updating periodo clases:', error);
    res.status(500).json({ error: error.message || 'Error updating periodo clases' });
  }
});

academicRouter.delete('/periodos-clases/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.delete(periodosClases).where(eq(periodosClases.id, id));
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting periodo clases:', error);
    res.status(500).json({ error: error.message || 'Error deleting periodo clases' });
  }
});

// --- APERTURA RÁPIDA DE AÑO / MÓDULO (WIZARD SETUP) ---
academicRouter.post('/apertura-rapida', async (req, res) => {
  try {
    const {
      anioLectivo,
      periodoAcademico,
      periodoClases: pClasesInput,
      turnosHabilitados,
      seccionesGenerar,
    } = req.body;

    // 1. Obtener o crear CETPRO
    const allCetpros = await db.select().from(cetpros).limit(1);
    const cetproId = allCetpros[0]?.id;
    if (!cetproId) {
      return res.status(400).json({ error: 'No se encontró la institución principal registrada.' });
    }

    // 2. Gestionar Año Lectivo
    let lectivoRecord: any;
    if (anioLectivo?.id) {
      const found = await db.select().from(periodosLectivos).where(eq(periodosLectivos.id, anioLectivo.id));
      lectivoRecord = found[0];
    }
    if (!lectivoRecord && anioLectivo?.codigo) {
      const existing = await db.select().from(periodosLectivos).where(eq(periodosLectivos.codigo, anioLectivo.codigo));
      if (existing.length > 0) {
        lectivoRecord = existing[0];
      } else {
        const [created] = await db.insert(periodosLectivos).values({
          cetproId,
          codigo: anioLectivo.codigo,
          nombre: anioLectivo.nombre || `Año Lectivo ${anioLectivo.codigo}`,
          fechaInicio: anioLectivo.fechaInicio || `${anioLectivo.codigo}-03-01`,
          fechaFin: anioLectivo.fechaFin || `${anioLectivo.codigo}-12-31`,
          estado: 'ACTIVO',
        }).returning();
        lectivoRecord = created;
      }
    }

    if (!lectivoRecord) {
      return res.status(400).json({ error: 'Debe especificar el Año Lectivo.' });
    }

    // 3. Gestionar Periodo Académico
    let academicoRecord: any;
    if (periodoAcademico?.id) {
      const found = await db.select().from(periodosAcademicos).where(eq(periodosAcademicos.id, periodoAcademico.id));
      academicoRecord = found[0];
    }
    if (!academicoRecord && periodoAcademico?.codigo) {
      const existing = await db.select().from(periodosAcademicos).where(eq(periodosAcademicos.codigo, periodoAcademico.codigo));
      if (existing.length > 0) {
        academicoRecord = existing[0];
      } else {
        const [created] = await db.insert(periodosAcademicos).values({
          periodoLectivoId: lectivoRecord.id,
          codigo: periodoAcademico.codigo,
          nombre: periodoAcademico.nombre || `Periodo Académico ${periodoAcademico.codigo}`,
          fechaInicio: periodoAcademico.fechaInicio || lectivoRecord.fechaInicio,
          fechaFin: periodoAcademico.fechaFin || lectivoRecord.fechaFin,
          estado: 'ACTIVO',
        }).returning();
        academicoRecord = created;
      }
    }

    if (!academicoRecord) {
      return res.status(400).json({ error: 'Debe especificar el Periodo Académico.' });
    }

    // 4. Gestionar Periodo de Clases
    let clasesRecord: any;
    if (pClasesInput?.id) {
      const found = await db.select().from(periodosClases).where(eq(periodosClases.id, pClasesInput.id));
      clasesRecord = found[0];
    }
    if (!clasesRecord && pClasesInput?.codigo) {
      const existing = await db.select().from(periodosClases).where(eq(periodosClases.codigo, pClasesInput.codigo));
      if (existing.length > 0) {
        clasesRecord = existing[0];
      } else {
        const [created] = await db.insert(periodosClases).values({
          periodoAcademicoId: academicoRecord.id,
          codigo: pClasesInput.codigo,
          nombre: pClasesInput.nombre || `Periodo de Clases ${pClasesInput.codigo}`,
          fechaInicio: pClasesInput.fechaInicio || academicoRecord.fechaInicio,
          fechaFin: pClasesInput.fechaFin || academicoRecord.fechaFin,
        }).returning();
        clasesRecord = created;
      }
    }

    if (!clasesRecord) {
      return res.status(400).json({ error: 'Debe especificar el Periodo de Clases.' });
    }

    // 5. Gestionar Turnos seleccionados
    const turnosMap: Record<string, string> = {}; // nombre/codigo -> id
    const currentTurnos = await db.select().from(turnos);
    for (const t of currentTurnos) {
      turnosMap[t.nombre.toLowerCase()] = t.id;
      turnosMap[t.codigo.toLowerCase()] = t.id;
    }

    if (Array.isArray(turnosHabilitados)) {
      for (const th of turnosHabilitados) {
        if (!turnosMap[th.nombre?.toLowerCase()] && !turnosMap[th.codigo?.toLowerCase()]) {
          const [nuevoTurno] = await db.insert(turnos).values({
            codigo: th.codigo || `TUR-${th.nombre.substring(0, 3).toUpperCase()}`,
            nombre: th.nombre,
            horaInicioReferencial: th.horaInicioReferencial || '08:00',
            horaFinReferencial: th.horaFinReferencial || '13:00',
            estado: 'Activo',
          }).returning();
          turnosMap[nuevoTurno.nombre.toLowerCase()] = nuevoTurno.id;
          turnosMap[nuevoTurno.codigo.toLowerCase()] = nuevoTurno.id;
        }
      }
    }

    // 6. Obtener Sede predeterminada
    const allSedes = await db.select().from(sedes).limit(1);
    const defaultSedeId = allSedes[0]?.id;

    // 7. Generar Secciones seleccionadas en bloque
    const seccionesCreadas = [];
    if (Array.isArray(seccionesGenerar) && seccionesGenerar.length > 0) {
      for (const sec of seccionesGenerar) {
        // Resolver planEstudioId
        let planEstudioId = sec.planEstudioId;
        if (!planEstudioId && sec.moduloId) {
          const mod = await db.select().from(modulos).where(eq(modulos.id, sec.moduloId)).limit(1);
          if (mod.length > 0 && mod[0].planEstudioId) {
            planEstudioId = mod[0].planEstudioId;
          }
        }
        if (!planEstudioId) {
          const pl = await db.select().from(planesEstudios).limit(1);
          planEstudioId = pl[0]?.id;
        }

        let turnoId = sec.turnoId;
        if (!turnoId && sec.turnoNombre) {
          turnoId = turnosMap[sec.turnoNombre.toLowerCase()];
        }

        const secCodigo = sec.codigo?.trim() || `SEC-${Math.floor(10000 + Math.random() * 90000)}`;

        const [createdSec] = await db.insert(secciones).values({
          codigo: secCodigo,
          nombre: sec.nombre || 'Sección A',
          moduloId: sec.moduloId,
          planEstudioId: planEstudioId!,
          periodoClasesId: clasesRecord.id,
          sedeId: sec.sedeId || defaultSedeId!,
          aulaId: sec.aulaId || null,
          turnoId: turnoId || null,
          modalidadEducativa: sec.modalidadEducativa || 'Presencial',
          capacidad: sec.capacidad || 30,
          estado: 'Activo' as any,
        }).returning();

        // Si se asignó un docente
        if (sec.trabajadorId && clasesRecord.id) {
          await db.insert(asignacionesTrabajadores).values({
            trabajadorId: sec.trabajadorId,
            seccionId: createdSec.id,
            periodoClasesId: clasesRecord.id,
            horasAsignadas: 30,
          });
        }

        seccionesCreadas.push(createdSec);
      }

      // Pre-cargar y sincronizar automáticamente todas las unidades didácticas de las nuevas secciones
      await ensureSeccionesUnidades();
    }

    res.json({
      success: true,
      periodoLectivo: lectivoRecord,
      periodoAcademico: academicoRecord,
      periodoClases: clasesRecord,
      totalSeccionesCreadas: seccionesCreadas.length,
      seccionesCreadas
    });

  } catch (error: any) {
    console.error('Error en apertura rápida de ciclo:', error);
    res.status(500).json({ error: error.message || 'Error en el asistente de apertura rápida' });
  }
});

// --- SECCIONES ---
academicRouter.get('/secciones', async (req, res) => {
  try {
    const allSecciones = await db.select().from(secciones);
    const allAulas = await db.select().from(aulas);
    const allTurnos = await db.select().from(turnos);
    const allSedes = await db.select().from(sedes);
    const allAsignaciones = await db.select().from(asignacionesTrabajadores);
    const allMatriculas = await db.select().from(matriculas);
    const allPClases = await db.select().from(periodosClases);
    const allPAcademicos = await db.select().from(periodosAcademicos);

    const mapped = allSecciones.map(s => {
      const aulaObj = allAulas.find(a => a.id === s.aulaId);
      const turnoObj = allTurnos.find(t => t.id === s.turnoId);
      const sedeObj = allSedes.find(se => se.id === s.sedeId);
      const asig = allAsignaciones.find(a => a.seccionId === s.id);
      
      let pAcademicoName = '2026-2'; // default fallback
console.log("SECCION ID:", s.id, "P_CLASES_ID:", s.periodoClasesId);
      if (s.periodoClasesId) {
        const pClase = allPClases.find(pc => pc.id === s.periodoClasesId);
        if (pClase && pClase.periodoAcademicoId) {
          const pAcad = allPAcademicos.find(pa => pa.id === pClase.periodoAcademicoId);
          if (pAcad) {
            // We want it like 2026-II or 2025-I but the UI normalizes it using normalizePeriodo()
            // So we can just pass pAcad.codigo (e.g. PER-ACA-2025-1) and the UI will format it
            pAcademicoName = pAcad.codigo || pAcad.nombre || '2026-2';
          }
        }
      }

      const enrolledCount = allMatriculas.filter(m => m.seccionId === s.id && m.estadoMatricula !== 'ANULADA' && m.estadoMatricula !== 'Retirado').length;

      return {
        id: s.id,
        codigo: s.codigo,
        nombre: s.nombre ? s.nombre.replace(/Junajui/gi, 'Juanjui') : s.nombre,
        moduloId: s.moduloId,
        planEstudioId: s.planEstudioId,
        periodoClasesId: s.periodoClasesId,
        sedeId: s.sedeId,
        aulaId: s.aulaId,
        turnoId: s.turnoId,
        modalidadEducativa: s.modalidadEducativa || 'Presencial',
        trabajadorId: asig?.trabajadorId || '',
        periodoAcademico: typeof pAcademicoName !== 'undefined' ? pAcademicoName : '2026-2',
        turno: (turnoObj?.nombre as any) || 'Mañana',
        aula: aulaObj?.nombre || 'Aula Taller',
        sedeNombre: sedeObj?.nombre || '',
        vacantes: s.capacidad || 30,
        capacidad: s.capacidad || 30,
        matriculados: enrolledCount,
        estado: s.estado || 'ACTIVO'
      };
    });
    res.json(mapped);
  } catch (error) {
    console.error('Error fetching secciones:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

academicRouter.post('/secciones', async (req, res) => {
  try {
    const data = req.body;
    
    // Resolve planEstudioId from modulo
    let planEstudioId = data.planEstudioId;
    if (!planEstudioId && data.moduloId) {
      const mod = await db.select().from(modulos).where(eq(modulos.id, data.moduloId)).limit(1);
      if (mod.length > 0) planEstudioId = mod[0].planEstudioId;
    }
    if (!planEstudioId) {
      const pl = await db.select().from(planesEstudios).limit(1);
      planEstudioId = pl[0]?.id;
    }

    // Resolve periodoClasesId
    let pClasesId = data.periodoClasesId;
    if (!pClasesId) {
      const pcFirst = await db.select().from(periodosClases).limit(1);
      pClasesId = pcFirst[0]?.id;
    }

    // Resolve sedeId
    let sedeId = data.sedeId;
    if (!sedeId) {
      const s = await db.select().from(sedes).limit(1);
      sedeId = s[0]?.id;
    }

    // Resolve turnoId
    let turnoId = data.turnoId;
    if (!turnoId && data.turno) {
      const allTurnos = await db.select().from(turnos);
      const matchedTurno = allTurnos.find(t => t.nombre?.toLowerCase() === data.turno?.toLowerCase());
      if (matchedTurno) turnoId = matchedTurno.id;
    }

    // Resolve aulaId
    let aulaId = data.aulaId;
    if (!aulaId && data.aula) {
      const allAulas = await db.select().from(aulas);
      const matchedAula = allAulas.find(a => a.nombre?.toLowerCase().includes(data.aula?.toLowerCase()) || a.id === data.aula);
      if (matchedAula) aulaId = matchedAula.id;
    }

    const secCodigo = data.codigo?.trim() || `SEC-${Math.floor(1000 + Math.random() * 9000)}`;

    const rawEstado = data.estado || 'Activo';
    const normalizedEstado = (rawEstado.toLowerCase() === 'inactivo') ? 'Inactivo' : 'Activo';

    const [nuevaSeccion] = await db.insert(secciones).values({
      codigo: secCodigo,
      nombre: data.nombre || 'Sección Única',
      moduloId: data.moduloId,
      planEstudioId: planEstudioId,
      periodoClasesId: pClasesId,
      sedeId: sedeId,
      aulaId: aulaId || null,
      turnoId: turnoId || null,
      modalidadEducativa: data.modalidadEducativa || 'Presencial',
      capacidad: data.vacantes || data.capacidad || 30,
      estado: normalizedEstado as any,
    }).returning();

    // If trabajadorId provided, create/update asignaciones_trabajadores
    if (data.trabajadorId && pClasesId) {
      await db.insert(asignacionesTrabajadores).values({
        trabajadorId: data.trabajadorId,
        seccionId: nuevaSeccion.id,
        periodoClasesId: pClasesId,
        horasAsignadas: 30,
        });
    }

    // Pre-cargar y sincronizar automáticamente las unidades didácticas para la nueva sección
    await ensureSeccionesUnidades(nuevaSeccion.id);

    // Fetch details for return
    const aulaObj = aulaId ? (await db.select().from(aulas).where(eq(aulas.id, aulaId)))[0] : null;
    const turnoObj = turnoId ? (await db.select().from(turnos).where(eq(turnos.id, turnoId)))[0] : null;
    const sedeObj = sedeId ? (await db.select().from(sedes).where(eq(sedes.id, sedeId)))[0] : null;
    
    let pAcadCodeForNew = '2026-2';
    if (nuevaSeccion.periodoClasesId) {
       const pClaseNew = await db.select().from(periodosClases).where(eq(periodosClases.id, nuevaSeccion.periodoClasesId));
       if (pClaseNew.length > 0 && pClaseNew[0].periodoAcademicoId) {
          const pAcadNew = await db.select().from(periodosAcademicos).where(eq(periodosAcademicos.id, pClaseNew[0].periodoAcademicoId));
          if (pAcadNew.length > 0) {
            pAcadCodeForNew = pAcadNew[0].codigo || '2026-2';
          }
       }
    }
  

    res.json({
      id: nuevaSeccion.id,
      codigo: nuevaSeccion.codigo,
      nombre: nuevaSeccion.nombre,
      moduloId: nuevaSeccion.moduloId,
      planEstudioId: nuevaSeccion.planEstudioId,
      periodoClasesId: nuevaSeccion.periodoClasesId,
      sedeId: nuevaSeccion.sedeId,
      aulaId: nuevaSeccion.aulaId,
      turnoId: nuevaSeccion.turnoId,
      modalidadEducativa: nuevaSeccion.modalidadEducativa,
      trabajadorId: data.trabajadorId || '',
      periodoAcademico: typeof pAcadCodeForNew !== 'undefined' ? pAcadCodeForNew : '2026-2',
      turno: (turnoObj?.nombre as any) || data.turno || 'Mañana',
      aula: aulaObj?.nombre || 'Aula Taller',
      sedeNombre: sedeObj?.nombre || '',
      vacantes: nuevaSeccion.capacidad || 30,
      capacidad: nuevaSeccion.capacidad || 30,
      matriculados: 0
    });
  } catch (error) {
    console.error('Error creating seccion:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

academicRouter.put('/secciones/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    
    const updateData: any = {};
    if (data.nombre) updateData.nombre = data.nombre;
    if (data.codigo) updateData.codigo = data.codigo;
    if (data.moduloId) updateData.moduloId = data.moduloId;
    if (data.planEstudioId) {
      updateData.planEstudioId = data.planEstudioId;
    } else if (data.moduloId) {
      const mod = await db.select().from(modulos).where(eq(modulos.id, data.moduloId)).limit(1);
      if (mod.length > 0 && mod[0].planEstudioId) {
         updateData.planEstudioId = mod[0].planEstudioId;
      }
    }
    if (data.periodoClasesId) updateData.periodoClasesId = data.periodoClasesId;
    if (data.sedeId) updateData.sedeId = data.sedeId;
    if (data.aulaId !== undefined) updateData.aulaId = data.aulaId || null;
    if (data.turnoId !== undefined) updateData.turnoId = data.turnoId || null;
    if (data.modalidadEducativa) updateData.modalidadEducativa = data.modalidadEducativa;
    if (data.vacantes !== undefined || data.capacidad !== undefined) {
      updateData.capacidad = data.vacantes || data.capacidad;
    }
    if (data.estado !== undefined) {
      updateData.estado = (data.estado.toLowerCase() === 'inactivo') ? 'Inactivo' : 'Activo';
    }
    

    const [updated] = await db.update(secciones).set(updateData).where(eq(secciones.id, id)).returning();
    
    if (!updated) {
      return res.status(404).json({ error: 'Seccion not found' });
    }

    // Update or create docente asignado
    if (data.trabajadorId !== undefined) {
      await db.delete(asignacionesTrabajadores).where(eq(asignacionesTrabajadores.seccionId, id));
      if (data.trabajadorId && updated.periodoClasesId) {
        await db.insert(asignacionesTrabajadores).values({
          trabajadorId: data.trabajadorId,
          seccionId: id,
          periodoClasesId: updated.periodoClasesId,
          horasAsignadas: 30,
          });
      }
    }
    
    res.json({
      ...data,
      id: updated.id,
      codigo: updated.codigo,
      nombre: updated.nombre,
      vacantes: updated.capacidad,
      capacidad: updated.capacidad
    });
  } catch (error) {
    console.error('Error updating seccion:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

academicRouter.delete('/secciones/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // Delete worker assignments for this section
    await db.delete(asignacionesTrabajadores).where(eq(asignacionesTrabajadores.seccionId, id));
    // Clear seccionId on matriculas
    await db.update(matriculas).set({ seccionId: null }).where(eq(matriculas.seccionId, id));
    // Delete section
    await db.delete(secciones).where(eq(secciones.id, id));
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting seccion:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- MODULOS ---
academicRouter.get('/modulos', async (req, res) => {
  try {
    const allModulos = await db.select().from(modulos);
    res.json(allModulos.map(m => ({
      id: m.id,
      programaId: m.programaId,
      codigo: m.codigo || m.id.substring(0, 5),
      nombre: m.nombre,
      descripcion: m.descripcion || '',
      creditos: Number(m.creditos || 0),
      horas: m.horas ? Number(m.horas) : 0,
      estado: m.estado || 'ACTIVO'
    })));
  } catch (error) {
    console.error('Error fetching modulos:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
academicRouter.get('/programas', async (req, res) => {
  try {
    const rawProgramas = await db.select({
      id: programas.id,
      codigo: programas.codigo,
      nombre: programas.nombre,
      descripcion: programas.descripcion,
      duracionHorasReferencial: programas.duracionHorasReferencial,
      creditos: programas.creditos,
      estado: programas.estado,
            nivelFormativo: nivelesFormativos.nombre,
    })
    .from(programas)
    .leftJoin(nivelesFormativos, eq(programas.nivelFormativoId, nivelesFormativos.id));

    // Get planes to attach to the program
    const planes = await db.select().from(planesEstudios);

    const mapped = rawProgramas.map(p => {
       const plan = planes.find(pl => pl.programaId === p.id);
       return {
        id: p.id,
        codigo: p.codigo,
        nombre: p.nombre,
        descripcion: p.descripcion || '',
        nivelFormativo: p.nivelFormativo || 'Desconocido',
        totalHoras: p.duracionHorasReferencial || 0,
        totalCreditos: parseFloat(p.creditos as string) || 0,
                archivoPlanUrl: plan?.archivoPlanUrl || null,
        estado: p.estado || 'ACTIVO'
      }
    });
    
    res.json(mapped);
  } catch (error) {
    console.error('Error fetching programas:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


academicRouter.put('/programas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    
    const result = await db.update(programas).set({
      codigo: data.codigo,
      nombre: data.nombre,
      descripcion: data.descripcion,
      duracionHorasReferencial: data.duracionHorasReferencial,
      creditos: data.creditos,
      estado: data.estado
    }).where(eq(programas.id, id)).returning();

    // Cascading deactivation
    if (data.estado === 'Inactivo') {
      const updatedModulos = await db.update(modulos)
        .set({ estado: 'Inactivo' })
        .where(eq(modulos.programaId, id))
        .returning();
      
      if (updatedModulos.length > 0) {
        const moduloIds = updatedModulos.map(m => m.id);
        await db.update(secciones)
          .set({ estado: 'Inactivo' })
          .where(inArray(secciones.moduloId, moduloIds));
      }
    }

    res.json(result[0]);
  } catch (error) {
    console.error('Error updating programa:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

academicRouter.post('/programas', async (req, res) => {
  try {
    // Basic implementation for adding a program
    const data = req.body;
    const result = await db.insert(programas).values({
      codigo: data.codigo,
      nombre: data.nombre,
      descripcion: data.descripcion,
      duracionHorasReferencial: data.duracionHorasReferencial,
      nivelFormativoId: data.nivelFormativoId,
      estado: data.estado || 'ACTIVO',
    }).returning();
    res.json(result[0]);
  } catch (error) {
    console.error('Error saving programa:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

academicRouter.get('/unidades', async (req, res) => {
  try {
    const rawUnidades = await db.select({
      id: unidades.id,
      moduloId: unidades.moduloId,
      codigo: unidades.codigo,
      nombre: unidades.nombre,
      descripcion: unidades.descripcion,
      creditos: unidades.creditos,
      horas: unidades.horas,
      orden: unidades.orden,
      tipo: unidades.tipoUnidadId // We'd need to map this properly if we had tiposUnidades, for now return as string or default
    }).from(unidades);
    
    // Simplistic mapping
    const mapped = rawUnidades.map(u => ({
      id: u.id,
      moduloId: u.moduloId,
      codigo: u.codigo,
      nombre: u.nombre,
      descripcion: u.descripcion || '',
      creditos: parseFloat(u.creditos as string) || 0,
      horas: u.horas || 0,
      orden: u.orden,
      tipo: u.tipo || 'Específica' 
    }));
    res.json(mapped);
  } catch (error) {
    console.error('Error fetching unidades:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Alias for unidades-didacticas
academicRouter.get('/unidades-didacticas', async (req, res) => {
  try {
    const rawUnidades = await db.select({
      id: unidades.id,
      moduloId: unidades.moduloId,
      codigo: unidades.codigo,
      nombre: unidades.nombre,
      descripcion: unidades.descripcion,
      creditos: unidades.creditos,
      horas: unidades.horas,
      orden: unidades.orden,
      tipo: unidades.tipoUnidadId
    }).from(unidades);
    
    res.json(rawUnidades.map(u => ({
      id: u.id,
      moduloId: u.moduloId,
      codigo: u.codigo,
      nombre: u.nombre,
      descripcion: u.descripcion || '',
      creditos: parseFloat(u.creditos as string) || 0,
      horas: u.horas || 0,
      orden: u.orden,
      tipo: u.tipo || 'Específica' 
    })));
  } catch (error) {
    console.error('Error fetching unidades didacticas:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- PLANES DE ESTUDIO ---
academicRouter.get('/planes-estudio', async (req, res) => {
  try {
    const allPlanes = await db.select().from(planesEstudios);
    res.json(allPlanes.map(p => ({
      id: p.id,
      programaId: p.programaId,
      codigo: p.codigo,
      nombre: p.nombre,
      version: p.version,
      tipoPlanEstudio: p.tipoPlanEstudio,
      fechaInicio: p.fechaInicio,
      estado: p.estado || 'Activo',
      archivoPlanUrl: p.archivoPlanUrl
    })));
  } catch (error) {
    console.error('Error fetching planes de estudio:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- HORARIOS ---

academicRouter.get('/horarios', async (req, res) => {
  try {
    const { seccionId, periodoId, unidadId } = req.query;
    let query = 'SELECT * FROM v_horarios_detallados WHERE 1=1';
    const params: any[] = [];

    if (seccionId && seccionId !== 'ALL') {
      params.push(seccionId);
      query += ` AND seccion_id = $${params.length}`;
    }

    if (unidadId && unidadId !== 'ALL') {
      params.push(unidadId);
      query += ` AND unidad_id = $${params.length}`;
    }

    if (periodoId && periodoId !== 'ALL') {
      const pStr = String(periodoId).trim();
      const pRoman = pStr.replace('-1', '-I').replace('-2', '-II');
      const pNum = pStr.replace('-II', '-2').replace('-I', '-1');
      params.push(`%${pStr}%`);
      const p1 = params.length;
      params.push(`%${pRoman}%`);
      const p2 = params.length;
      params.push(`%${pNum}%`);
      const p3 = params.length;
      query += ` AND (periodo_codigo ILIKE $${p1} OR periodo_codigo ILIKE $${p2} OR periodo_codigo ILIKE $${p3})`;
    }

    query += ' ORDER BY dia_semana, hora_inicio';
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching horarios:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

academicRouter.post('/horarios', async (req, res) => {
  try {
    const { seccionId, asignacionDocenteId, docenteId, aulaId, diaSemana, horaInicio, horaFin, unidadId } = req.body;
    
    // Resolve asignacion if docenteId or missing
    let asigId = asignacionDocenteId;
    if (docenteId && seccionId) {
      const asigRes = await pool.query(
        'SELECT id FROM asignaciones_trabajadores WHERE seccion_id = $1 AND trabajador_id = $2 LIMIT 1',
        [seccionId, docenteId]
      );
      if (asigRes.rows.length > 0) {
        asigId = asigRes.rows[0].id;
      } else {
        const secInfo = await pool.query('SELECT periodo_clases_id FROM secciones WHERE id = $1', [seccionId]);
        const pcId = secInfo.rows[0]?.periodo_clases_id;
        if (pcId) {
          const newAsig = await pool.query(
            `INSERT INTO asignaciones_trabajadores (trabajador_id, seccion_id, periodo_clases_id)
             VALUES ($1, $2, $3) RETURNING id`,
            [docenteId, seccionId, pcId]
          );
          asigId = newAsig.rows[0].id;
        }
      }
    } else if (!asigId && seccionId) {
      const asigRes = await pool.query('SELECT id FROM asignaciones_trabajadores WHERE seccion_id = $1 LIMIT 1', [seccionId]);
      if (asigRes.rows.length > 0) asigId = asigRes.rows[0].id;
    }

    // Resolve aula if missing
    let aId = aulaId;
    if (!aId && seccionId) {
      const secRes = await pool.query('SELECT aula_id FROM secciones WHERE id = $1', [seccionId]);
      if (secRes.rows.length > 0) aId = secRes.rows[0].aula_id;
    }

    const cleanAsigId = asigId && String(asigId).trim() !== '' ? asigId : null;
    const cleanAulaId = aId && String(aId).trim() !== '' ? aId : null;
    const cleanUnidadId = unidadId && String(unidadId).trim() !== '' ? unidadId : null;

    const insertRes = await pool.query(
      `INSERT INTO horarios (seccion_id, asignacion_docente_id, aula_id, dia_semana, hora_inicio, hora_fin, unidad_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [seccionId, cleanAsigId, cleanAulaId, Number(diaSemana), horaInicio, horaFin, cleanUnidadId]
    );

    const newId = insertRes.rows[0].id;
    const { rows } = await pool.query('SELECT * FROM v_horarios_detallados WHERE horario_id = $1', [newId]);
    res.status(201).json(rows[0]);
  } catch (error: any) {
    console.error('Error creating horario:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

academicRouter.put('/horarios/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { diaSemana, horaInicio, horaFin, unidadId, aulaId, asignacionDocenteId, docenteId } = req.body;

    let targetAsigId = asignacionDocenteId;
    if (docenteId !== undefined) {
      if (!docenteId || String(docenteId).trim() === '') {
        targetAsigId = null;
      } else {
        const hRes = await pool.query('SELECT seccion_id FROM horarios WHERE id = $1', [id]);
        if (hRes.rows.length > 0) {
          const secId = hRes.rows[0].seccion_id;
          const asigRes = await pool.query(
            'SELECT id FROM asignaciones_trabajadores WHERE seccion_id = $1 AND trabajador_id = $2 LIMIT 1',
            [secId, docenteId]
          );
          if (asigRes.rows.length > 0) {
            targetAsigId = asigRes.rows[0].id;
          } else {
            const secInfo = await pool.query('SELECT periodo_clases_id FROM secciones WHERE id = $1', [secId]);
            const pcId = secInfo.rows[0]?.periodo_clases_id;
            if (pcId) {
              const newAsig = await pool.query(
                `INSERT INTO asignaciones_trabajadores (trabajador_id, seccion_id, periodo_clases_id)
                 VALUES ($1, $2, $3) RETURNING id`,
                [docenteId, secId, pcId]
              );
              targetAsigId = newAsig.rows[0].id;
            }
          }
        }
      }
    }

    const cleanUnidadId = unidadId !== undefined ? (unidadId && String(unidadId).trim() !== '' ? unidadId : null) : undefined;
    const cleanAulaId = aulaId !== undefined ? (aulaId && String(aulaId).trim() !== '' ? aulaId : null) : undefined;
    const cleanAsigId = targetAsigId !== undefined ? (targetAsigId && String(targetAsigId).trim() !== '' ? targetAsigId : null) : undefined;

    await pool.query(
      `UPDATE horarios
       SET dia_semana = COALESCE($1, dia_semana),
           hora_inicio = COALESCE($2, hora_inicio),
           hora_fin = COALESCE($3, hora_fin),
           unidad_id = CASE WHEN $4::boolean THEN $5::uuid ELSE unidad_id END,
           aula_id = CASE WHEN $6::boolean THEN $7::uuid ELSE aula_id END,
           asignacion_docente_id = CASE WHEN $8::boolean THEN $9::uuid ELSE asignacion_docente_id END
       WHERE id = $10`,
      [
        diaSemana !== undefined && diaSemana !== null ? Number(diaSemana) : null,
        horaInicio || null,
        horaFin || null,
        unidadId !== undefined, cleanUnidadId,
        aulaId !== undefined, cleanAulaId,
        targetAsigId !== undefined, cleanAsigId,
        id
      ]
    );

    const { rows } = await pool.query('SELECT * FROM v_horarios_detallados WHERE horario_id = $1', [id]);
    res.json(rows[0]);
  } catch (error: any) {
    console.error('Error updating horario:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

academicRouter.delete('/horarios/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM horarios WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting horario:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- CRONOGRAMA DE UNIDADES POR SECCIÓN (secciones_unidades) ---
academicRouter.get('/secciones/:seccionId/unidades', async (req, res) => {
  try {
    const { seccionId } = req.params;

    // Asegurar automáticamente que todas las unidades del módulo existan en secciones_unidades
    await ensureSeccionesUnidades(seccionId);

    // 1. Obtener la sección con su módulo y período de clases
    const secRes = await pool.query(`
      SELECT s.id, s.codigo, s.nombre, s.modulo_id, s.periodo_clases_id,
             pc.fecha_inicio as periodo_fecha_inicio, pc.fecha_fin as periodo_fecha_fin,
             m.nombre as modulo_nombre
      FROM secciones s
      LEFT JOIN periodos_clases pc ON s.periodo_clases_id = pc.id
      LEFT JOIN modulos m ON s.modulo_id = m.id
      WHERE s.id = $1
    `, [seccionId]);

    if (secRes.rows.length === 0) {
      return res.status(404).json({ error: 'Sección no encontrada' });
    }

    const seccion = secRes.rows[0];

    // 2. Obtener todas las unidades didácticas del módulo de la sección
    // y cruzarlas con secciones_unidades
    const unidadesRes = await pool.query(`
      SELECT 
        u.id as unidad_id,
        u.modulo_id,
        u.codigo as unidad_codigo,
        u.nombre as unidad_nombre,
        u.horas as unidad_horas,
        u.creditos as unidad_creditos,
        u.orden as unidad_orden,
        COALESCE(tu.nombre::text, 'Técnica') as unidad_tipo,
        su.id as seccion_unidad_id,
        su.seccion_id,
        COALESCE(
          su.docente_id,
          (SELECT at.trabajador_id FROM asignaciones_trabajadores at WHERE at.seccion_id = s.id AND (at.unidad_id = u.id OR at.unidad_id IS NULL) LIMIT 1),
          (SELECT at2.trabajador_id FROM asignaciones_trabajadores at2 WHERE at2.seccion_id = s.id LIMIT 1)
        ) as docente_id,
        COALESCE(su.fecha_inicio::text, pc.fecha_inicio::text, CURRENT_DATE::text) as fecha_inicio,
        COALESCE(su.fecha_fin::text, pc.fecha_fin::text, (CURRENT_DATE + INTERVAL '4 months')::date::text) as fecha_fin,
        COALESCE(su.horas, u.horas) as horas,
        COALESCE(su.creditos, u.creditos) as creditos,
        COALESCE(su.estado, 'PROGRAMADA') as estado,
        su.observaciones,
        COALESCE(
          CASE 
            WHEN p.id IS NOT NULL THEN CONCAT(p.apellido_paterno, ' ', p.apellido_materno, ', ', p.nombres)
            ELSE NULL 
          END,
          (SELECT CONCAT(p2.apellido_paterno, ' ', p2.apellido_materno, ', ', p2.nombres)
           FROM asignaciones_trabajadores at3
           JOIN trabajadores t3 ON at3.trabajador_id = t3.id
           JOIN personas p2 ON t3.persona_id = p2.id
           WHERE at3.seccion_id = s.id LIMIT 1)
        ) as docente_nombre
      FROM unidades_didacticas u
      LEFT JOIN tipos_unidades tu ON u.tipo_unidad_id = tu.id
      LEFT JOIN secciones s ON s.id = $1
      LEFT JOIN periodos_clases pc ON s.periodo_clases_id = pc.id
      LEFT JOIN secciones_unidades su ON su.unidad_id = u.id AND su.seccion_id = $1
      LEFT JOIN trabajadores t ON su.docente_id = t.id
      LEFT JOIN personas p ON t.persona_id = p.id
      WHERE u.modulo_id = $2
      ORDER BY 
        CASE WHEN COALESCE(tu.nombre::text, '') ILIKE '%empleabilidad%' OR u.codigo ILIKE '%UDE%' THEN 2 ELSE 1 END,
        u.orden ASC,
        u.codigo ASC
    `, [seccionId, seccion.modulo_id]);

    res.json({
      seccion,
      unidades: unidadesRes.rows
    });
  } catch (error: any) {
    console.error('Error fetching cronograma de unidades:', error);
    res.status(500).json({ error: error.message || 'Error interno' });
  }
});

academicRouter.post('/secciones/:seccionId/unidades', async (req, res) => {
  try {
    const { seccionId } = req.params;
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Se requiere una lista de unidades para guardar' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      for (const item of items) {
        if (!item.unidadId || !item.fechaInicio || !item.fechaFin) {
          continue;
        }

        await client.query(`
          INSERT INTO secciones_unidades (
            seccion_id, unidad_id, docente_id, fecha_inicio, fecha_fin,
            horas, creditos, estado, observaciones, fecha_actualizacion
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)
          ON CONFLICT (seccion_id, unidad_id) DO UPDATE SET
            docente_id = EXCLUDED.docente_id,
            fecha_inicio = EXCLUDED.fecha_inicio,
            fecha_fin = EXCLUDED.fecha_fin,
            horas = EXCLUDED.horas,
            creditos = EXCLUDED.creditos,
            estado = EXCLUDED.estado,
            observaciones = EXCLUDED.observaciones,
            fecha_actualizacion = CURRENT_TIMESTAMP
        `, [
          seccionId,
          item.unidadId,
          item.docenteId || null,
          item.fechaInicio,
          item.fechaFin,
          item.horas ? parseInt(item.horas, 10) : null,
          item.creditos ? parseFloat(item.creditos) : null,
          item.estado || 'PROGRAMADA',
          item.observaciones || null
        ]);
      }

      await client.query('COMMIT');
      res.json({ success: true, count: items.length });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('Error saving cronograma de unidades:', error);
    res.status(500).json({ error: error.message || 'Error al guardar cronograma' });
  }
});

// Actualizar o habilitar una unidad didáctica individual de una sección (fechas y estado)
academicRouter.put('/secciones/:seccionId/unidades/:unidadId', async (req, res) => {
  try {
    const { seccionId, unidadId } = req.params;
    const { fechaInicio, fechaFin, estado, docenteId, horas, creditos, observaciones } = req.body;

    if (!fechaInicio || !fechaFin) {
      return res.status(400).json({ error: 'Se requiere fecha de inicio y fecha de fin' });
    }

    const result = await pool.query(`
      INSERT INTO secciones_unidades (
        seccion_id, unidad_id, docente_id, fecha_inicio, fecha_fin,
        horas, creditos, estado, observaciones, fecha_actualizacion
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)
      ON CONFLICT (seccion_id, unidad_id) DO UPDATE SET
        docente_id = COALESCE(EXCLUDED.docente_id, secciones_unidades.docente_id),
        fecha_inicio = EXCLUDED.fecha_inicio,
        fecha_fin = EXCLUDED.fecha_fin,
        horas = COALESCE(EXCLUDED.horas, secciones_unidades.horas),
        creditos = COALESCE(EXCLUDED.creditos, secciones_unidades.creditos),
        estado = COALESCE(EXCLUDED.estado, secciones_unidades.estado),
        observaciones = COALESCE(EXCLUDED.observaciones, secciones_unidades.observaciones),
        fecha_actualizacion = CURRENT_TIMESTAMP
      RETURNING *
    `, [
      seccionId,
      unidadId,
      docenteId || null,
      fechaInicio,
      fechaFin,
      horas ? parseInt(horas, 10) : null,
      creditos ? parseFloat(creditos) : null,
      estado || 'EN_CURSO',
      observaciones || null
    ]);

    res.json({ success: true, seccionUnidad: result.rows[0] });
  } catch (error: any) {
    console.error('Error updating seccion_unidad:', error);
    res.status(500).json({ error: error.message || 'Error al actualizar unidad didáctica de la sección' });
  }
});

// Endpoint administrativo para forzar la sincronización / pre-carga de todas las unidades
academicRouter.post('/secciones-unidades/sincronizar', async (req, res) => {
  try {
    const { seccionId, moduloId } = req.body;
    await ensureSeccionesUnidades(seccionId, moduloId);
    res.json({ success: true, message: 'Sincronización de secciones y unidades completada exitosamente' });
  } catch (error: any) {
    console.error('Error manual sync:', error);
    res.status(500).json({ error: error.message || 'Error en sincronización' });
  }
});

// Crear una nueva unidad didáctica y pre-cargarla automáticamente en todas las secciones del módulo
academicRouter.post('/unidades-didacticas', async (req, res) => {
  try {
    const data = req.body;
    const [nueva] = await db.insert(unidades).values({
      moduloId: data.moduloId,
      codigo: data.codigo,
      nombre: data.nombre,
      descripcion: data.descripcion || null,
      horas: data.horas ? parseInt(data.horas, 10) : 0,
      creditos: data.creditos ? String(data.creditos) : '0',
      orden: data.orden ? parseInt(data.orden, 10) : 1,
      tipoUnidadId: data.tipoUnidadId || null,
    }).returning();

    // Auto-sincronizar con todas las secciones existentes de este módulo
    await ensureSeccionesUnidades(undefined, data.moduloId);

    res.status(201).json(nueva);
  } catch (error: any) {
    console.error('Error creating unidad didactica:', error);
    res.status(500).json({ error: error.message || 'Error creating unidad didactica' });
  }
});

export default academicRouter;

