import { Router } from 'express';
import { db } from '../db/index.js';
import { personas, estudiantes, trabajadores, apoderadosEstudiantes, egresados, personasRoles, rolesPersonas, matriculas } from '../db/schema.js';
import { eq, desc, and, sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export const padronRouter = Router();

// =======================
// PERSONAS
// =======================

// Obtener todas las personas
padronRouter.get('/personas', async (req, res) => {
  try {
    const [allPersonas, allEstudiantes, allTrabajadores, allApoderados, allEgresados, allRoles, allPersonasRoles, allMatriculas] = await Promise.all([
      db.select().from(personas).orderBy(desc(personas.fechaRegistro)),
      db.select().from(estudiantes),
      db.select().from(trabajadores),
      db.select().from(apoderadosEstudiantes),
      db.select().from(egresados),
      db.select().from(rolesPersonas),
      db.select().from(personasRoles),
      db.select().from(matriculas)
    ]);

    const rolApoderadoObj = allRoles.find(r => r.codigo === 'APODERADO');
    const rolApoderadoId = rolApoderadoObj?.id;

    const enrichedPersonas = allPersonas.map((p) => {
      const est = allEstudiantes.find((e) => e.personaId === p.id);
      const trab = allTrabajadores.find((t) => t.personaId === p.id);
      const apod = allApoderados.find((a) => a.personaId === p.id);
      const hasApodRole = rolApoderadoId ? allPersonasRoles.some(pr => pr.personaId === p.id && pr.rolPersonaId === rolApoderadoId) : false;
      const isEnrolled = est ? allMatriculas.some(m => m.estudianteId === est.id) : false;
      
      const egres = allEgresados.find((eg) => est && eg.estudianteId === est.id);
      
      let rolPrimario: 'ESTUDIANTE' | 'TRABAJADOR' | 'APODERADO' | 'EGRESADO' = 'ESTUDIANTE';
      if ((p as any).rolPrimario) {
        rolPrimario = (p as any).rolPrimario;
      } else if (trab) {
        rolPrimario = 'TRABAJADOR';
      } else if (apod || hasApodRole) {
        // If persona is registered as apoderado and is not actively enrolled in courses
        if (!isEnrolled) {
          rolPrimario = 'APODERADO';
        } else {
          rolPrimario = 'ESTUDIANTE';
        }
      } else if (egres) {
        rolPrimario = 'EGRESADO';
      } else if (est) {
        rolPrimario = 'ESTUDIANTE';
      }

      return {
        ...p,
        sexo: normalizeGenero(p.genero),
        genero: normalizeGenero(p.genero),
        direccion: p.direccionActual || '',
        correo: p.email || '',
        esEstudiante: rolPrimario === 'ESTUDIANTE' || (!!est && isEnrolled) || rolPrimario === 'EGRESADO',
        esTrabajador: !!trab || rolPrimario === 'TRABAJADOR',
        rolPrimario,
        // Estudiante fields
        estudianteId: est?.id,
        codigoEstudiante: est?.codigoEstudiante || '',
        trabaja: est?.trabaja || false,
        ieProcedencia: est?.ieProcedencia || '',
        puestoTrabajo: est?.puestoTrabajo || '',
        lugarNacimiento: est?.lugarNacimiento || '',
        distritoNacimiento: est?.distritoNacimiento || '',
        provinciaNacimiento: est?.provinciaNacimiento || '',
        regionNacimiento: est?.regionNacimiento || '',
        paisNacimiento: est?.paisNacimiento || '',
        telefonoContacto: est?.telefonoContacto || '',
        lenguaOriginaria: est?.lenguaOriginaria || '',
        // Trabajador fields
        trabajadorId: trab?.id,
        codigoPlaza: trab?.codigoPlaza || '',
        motivoPlaza: trab?.motivoPlaza || '',
        cargo: trab?.cargo || '',
        condicion: trab?.condicion || '',
        escalaRegimen: trab?.escalaRegimen || '',
        tituloEspecialidad: trab?.tituloEspecialidad || '',
        rdNombramientoContrato: trab?.rdNombramientoContrato || '',
        estadoTrabajador: trab?.estado || 'Activo',
        // Apoderado fields
        apoderadoId: apod?.id,
        estudianteAsociadoId: apod?.estudianteId || '',
        parentesco: apod?.parentesco || '',
        esApoderadoPrincipal: apod?.esApoderadoPrincipal || false,
        viveConEstudiante: apod?.viveConEstudiante || false,
        // Egresado fields
        egresadoId: egres?.id,
        programaId: egres?.programaId || '',
        planEstudioId: egres?.planEstudioId || '',
        matriculaId: egres?.matriculaId || '',
        fechaEgreso: egres?.fechaEgreso || '',
        numeroRegistroTitulo: egres?.numeroRegistroTitulo || '',
        observacionesEgresado: egres?.observaciones || ''
      };
    });

    res.json(enrichedPersonas);
  } catch (error) {
    console.error('Error fetching personas:', error);
    res.status(500).json({ error: 'Error fetching personas' });
  }
});

function normalizePersonaDocType(docType?: string): any {
  if (!docType) return 'DNI';
  const upper = docType.toUpperCase();
  if (upper.includes('EXTRANJ') || upper === 'CE') return 'CE';
  if (upper.includes('PAS') || upper === 'PASAPORTE') return 'PAS';
  if (upper === 'RUC') return 'RUC';
  return 'DNI';
}

function normalizeGenero(gen?: string): any {
  if (!gen) return 'H';
  const upper = gen.toUpperCase().trim();
  // F, FEM, FEMENINO, MUJER, M, etc. -> 'M' (Mujer)
  if (upper === 'M' || upper === 'F' || upper.startsWith('FEM') || upper.startsWith('MUJ')) return 'M';
  // H, HOMBRE, MASC, MASCULINO, VARON, V -> 'H' (Hombre)
  if (upper === 'H' || upper === 'V' || upper.startsWith('HOMB') || upper.startsWith('MASC') || upper.startsWith('VAR')) return 'H';
  return 'H';
}

function normalizeTrabajadorEstado(estado?: string): any {
  if (!estado) return 'Activo';
  const upper = estado.toUpperCase();
  if (upper === 'INACTIVO' || upper === 'CESANTE') return 'Cesante';
  if (upper === 'LICENCIA') return 'Licencia';
  if (upper === 'DESTACADO') return 'Destacado';
  if (upper === 'DESIGNADO') return 'Designado';
  return 'Activo';
}

function normalizeTrabajadorCondicion(cond?: string): any {
  if (!cond) return 'Contratado(a)';
  if (cond.toLowerCase().includes('nombr')) return 'Nombrado(a)';
  return 'Contratado(a)';
}

function normalizeNivelEducativo(nivel?: string): any {
  if (!nivel || !nivel.trim()) return null;
  const low = nivel.toLowerCase().trim();
  if (low.includes('secundaria') && low.includes('completa')) return 'Secundaria completa';
  if (low.includes('secundaria') && low.includes('incompleta')) return 'Secundaria incompleta';
  if (low.includes('primaria') && low.includes('completa')) return 'Primaria completa';
  if (low.includes('primaria') && low.includes('incompleta')) return 'Primaria incompleta';
  if (low.includes('superior') && low.includes('univ')) return 'Superior universitaria';
  if (low.includes('superior') && low.includes('pedag')) return 'Superior pedagógica';
  if (low.includes('superior') && low.includes('tecnol')) return 'Superior tecnológica';
  if (low.includes('superior') && low.includes('téc')) return 'Superior técnica';
  if (low.includes('sin educ')) return 'Sin educación formal';
  return 'Secundaria completa';
}

function normalizeEstadoCivil(ec?: string): any {
  if (!ec || !ec.trim()) return null;
  const low = ec.toLowerCase().trim();
  if (low.startsWith('solt')) return 'Soltero(a)';
  if (low.startsWith('cas')) return 'Casado(a)';
  if (low.startsWith('conv')) return 'Conviviente';
  if (low.startsWith('div')) return 'Divorciado(a)';
  if (low.startsWith('viu')) return 'Viudo(a)';
  if (low.startsWith('junt')) return 'Juntadito(a)';
  return 'Soltero(a)';
}

function normalizeOperadorTelefonico(op?: string): any {
  if (!op || typeof op !== 'string' || !op.trim()) return null;
  const clean = op.trim();
  const valid = ['Movistar', 'Claro', 'Entel', 'Bitel', 'Otro'];
  const match = valid.find(v => v.toLowerCase() === clean.toLowerCase());
  return match || 'Otro';
}

function normalizeTipoDiscapacidad(disc?: string, hasDiscapacidad?: boolean): any {
  if (!hasDiscapacidad || !disc || typeof disc !== 'string' || !disc.trim()) return null;
  const clean = disc.trim();
  const valid = [
    'Intelectual leve', 'Intelectual moderada', 'Intelectual severa',
    'Auditiva hipoacusia', 'Auditiva sordera', 'Visual baja visión',
    'Visual ceguera', 'Físico Motora', 'Trastorno del espectro autista',
    'Sordo ceguera', 'Multidiscapacidad', 'Otra discapacidad'
  ];
  const match = valid.find(v => v.toLowerCase() === clean.toLowerCase());
  return match || 'Otra discapacidad';
}

// Crear nueva persona
padronRouter.post('/personas', async (req, res) => {
  try {
    const data = req.body;
    
    const hasDiscapacidad = typeof data.discapacidad === 'boolean'
      ? data.discapacidad
      : (data.discapacidad === 'true' || data.discapacidad === 'SI' || false);

    const cargaFamiliarNum = (data.cargaFamiliar !== undefined && data.cargaFamiliar !== null && data.cargaFamiliar !== '')
      ? (!isNaN(parseInt(data.cargaFamiliar)) ? Math.max(0, parseInt(data.cargaFamiliar)) : null)
      : null;

    const result = await db.insert(personas)
      .values({
        tipoDocumento: normalizePersonaDocType(data.tipoDocumento),
        numeroDocumento: data.numeroDocumento?.trim(),
        apellidoPaterno: data.apellidoPaterno?.trim(),
        apellidoMaterno: data.apellidoMaterno?.trim() || null,
        nombres: data.nombres?.trim(),
        fechaNacimiento: data.fechaNacimiento || null,
        genero: normalizeGenero(data.sexo !== undefined ? data.sexo : data.genero),
        direccionActual: data.direccionActual?.trim() || data.direccion?.trim() || null,
        telefono: data.telefono?.trim() || null,
        email: data.email?.trim() || data.correo?.trim() || null,
        nivelEducativo: normalizeNivelEducativo(data.nivelEducativo),
        estadoCivil: normalizeEstadoCivil(data.estadoCivil),
        cargaFamiliar: cargaFamiliarNum,
        internetCasa: typeof data.internetCasa === 'boolean' ? data.internetCasa : (data.internetCasa === 'true' || data.internetCasa === 'SI' || false),
        equipoClasesVirtuales: data.equipoClasesVirtuales?.trim() || null,
        operadorTelefonico: normalizeOperadorTelefonico(data.operadorTelefonico),
        discapacidad: hasDiscapacidad,
        tipoDiscapacidad: normalizeTipoDiscapacidad(data.tipoDiscapacidad, hasDiscapacidad),
        fotoUrl: data.fotoUrl?.trim() || null,
        observaciones: data.observaciones?.trim() || null,
      })
      .returning();
      
    const personaId = result[0].id;

    if (data.rolPrimario === 'ESTUDIANTE' || data.esEstudiante || data.rolPrimario === 'EGRESADO') {
      const codigoEst = data.codigoEstudiante?.trim() || null;
      await db.insert(estudiantes).values({
        personaId: personaId,
        codigoEstudiante: codigoEst,
        trabaja: typeof data.trabaja === 'boolean' ? data.trabaja : (data.trabaja === 'true' || false),
        ieProcedencia: data.ieProcedencia?.trim() || null,
        puestoTrabajo: data.puestoTrabajo?.trim() || null,
        lugarNacimiento: data.lugarNacimiento?.trim() || null,
        distritoNacimiento: data.distritoNacimiento?.trim() || null,
        provinciaNacimiento: data.provinciaNacimiento?.trim() || null,
        regionNacimiento: data.regionNacimiento?.trim() || null,
        paisNacimiento: data.paisNacimiento?.trim() || null,
        telefonoContacto: data.telefonoContacto?.trim() || null,
        lenguaOriginaria: data.lenguaOriginaria?.trim() || null,
      });

      const roles = await db.select().from(rolesPersonas).where(eq(rolesPersonas.codigo, 'ESTUDIANTE')).limit(1);
      if (roles.length > 0) {
        await db.insert(personasRoles).values({ personaId, rolPersonaId: roles[0].id }).onConflictDoNothing();
      }
    }

    if (data.rolPrimario === 'TRABAJADOR' || data.esTrabajador) {
      await db.insert(trabajadores).values({
        personaId: personaId,
        codigoPlaza: data.codigoPlaza || null,
        motivoPlaza: data.motivoPlaza || null,
        cargo: data.cargo || null,
        condicion: normalizeTrabajadorCondicion(data.condicion),
        escalaRegimen: data.escalaRegimen || null,
        tituloEspecialidad: data.tituloEspecialidad || null,
        rdNombramientoContrato: data.rdNombramientoContrato || null,
        estado: normalizeTrabajadorEstado(data.estadoTrabajador)
      });

      if (data.rolAccesoId) {
        await db.insert(personasRoles).values({ personaId, rolPersonaId: data.rolAccesoId }).onConflictDoNothing();
      } else {
        const roles = await db.select().from(rolesPersonas).where(eq(rolesPersonas.codigo, 'DOCENTE')).limit(1);
        if (roles.length > 0) {
          await db.insert(personasRoles).values({ personaId, rolPersonaId: roles[0].id }).onConflictDoNothing();
        }
      }
    }

    if (data.rolPrimario === 'APODERADO' && data.estudianteAsociadoId) {
      await db.insert(apoderadosEstudiantes).values({
        estudianteId: data.estudianteAsociadoId,
        personaId: personaId,
        parentesco: data.parentesco || 'Familiar',
        esApoderadoPrincipal: data.esApoderadoPrincipal || false,
        viveConEstudiante: data.viveConEstudiante || false,
      });

      const roles = await db.select().from(rolesPersonas).where(eq(rolesPersonas.codigo, 'APODERADO')).limit(1);
      if (roles.length > 0) {
        await db.insert(personasRoles).values({ personaId, rolPersonaId: roles[0].id }).onConflictDoNothing();
      }
    }

    if (data.rolPrimario === 'EGRESADO' && data.matriculaId && data.programaId && data.planEstudioId && data.fechaEgreso) {
      const estList = await db.select().from(estudiantes).where(eq(estudiantes.personaId, personaId)).limit(1);
      if (estList.length > 0) {
        await db.insert(egresados).values({
          estudianteId: estList[0].id,
          programaId: data.programaId,
          planEstudioId: data.planEstudioId,
          matriculaId: data.matriculaId,
          fechaEgreso: data.fechaEgreso,
          numeroRegistroTitulo: data.numeroRegistroTitulo || null,
          observaciones: data.observacionesEgresado || null
        }).onConflictDoNothing();
      }

      // Auto-update student state
      const mat = await db.select().from(matriculas).where(eq(matriculas.id, data.matriculaId)).limit(1);
      if (mat.length > 0) {
        await db.update(matriculas).set({ condicion: data.numeroRegistroTitulo ? 'Titulado' : 'Egresado' }).where(eq(matriculas.id, data.matriculaId));
      }
    }

    res.json(result[0]);
  } catch (error) {
    console.error('Error creating persona:', error);
    res.status(500).json({ error: 'Error creating persona' });
  }
});

// Actualizar persona
padronRouter.put('/personas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const hasDiscapacidad = typeof data.discapacidad === 'boolean'
      ? data.discapacidad
      : (data.discapacidad === 'true' || data.discapacidad === 'SI' || false);

    const cargaFamiliarNum = (data.cargaFamiliar !== undefined && data.cargaFamiliar !== null && data.cargaFamiliar !== '')
      ? (!isNaN(parseInt(data.cargaFamiliar)) ? Math.max(0, parseInt(data.cargaFamiliar)) : null)
      : null;

    const result = await db.update(personas)
      .set({
        tipoDocumento: normalizePersonaDocType(data.tipoDocumento),
        numeroDocumento: data.numeroDocumento?.trim(),
        apellidoPaterno: data.apellidoPaterno?.trim(),
        apellidoMaterno: data.apellidoMaterno?.trim() || null,
        nombres: data.nombres?.trim(),
        fechaNacimiento: data.fechaNacimiento || null,
        genero: normalizeGenero(data.sexo !== undefined ? data.sexo : data.genero),
        direccionActual: data.direccionActual?.trim() || data.direccion?.trim() || null,
        telefono: data.telefono?.trim() || null,
        email: data.email?.trim() || data.correo?.trim() || null,
        nivelEducativo: normalizeNivelEducativo(data.nivelEducativo),
        estadoCivil: normalizeEstadoCivil(data.estadoCivil),
        cargaFamiliar: cargaFamiliarNum,
        internetCasa: typeof data.internetCasa === 'boolean' ? data.internetCasa : (data.internetCasa === 'true' || data.internetCasa === 'SI' || false),
        equipoClasesVirtuales: data.equipoClasesVirtuales?.trim() || null,
        operadorTelefonico: normalizeOperadorTelefonico(data.operadorTelefonico),
        discapacidad: hasDiscapacidad,
        tipoDiscapacidad: normalizeTipoDiscapacidad(data.tipoDiscapacidad, hasDiscapacidad),
        fotoUrl: data.fotoUrl !== undefined ? (data.fotoUrl?.trim() || null) : null,
        observaciones: data.observaciones?.trim() || null,
      })
      .where(eq(personas.id, id))
      .returning();

    if (data.rolPrimario === 'ESTUDIANTE' || data.esEstudiante || data.rolPrimario === 'EGRESADO') {
      const existingEst = await db.select().from(estudiantes).where(eq(estudiantes.personaId, id)).limit(1);
      const estData = {
        codigoEstudiante: data.codigoEstudiante?.trim() || null,
        trabaja: typeof data.trabaja === 'boolean' ? data.trabaja : (data.trabaja === 'true' || false),
        ieProcedencia: data.ieProcedencia?.trim() || null,
        puestoTrabajo: data.puestoTrabajo?.trim() || null,
        lugarNacimiento: data.lugarNacimiento?.trim() || null,
        distritoNacimiento: data.distritoNacimiento?.trim() || null,
        provinciaNacimiento: data.provinciaNacimiento?.trim() || null,
        regionNacimiento: data.regionNacimiento?.trim() || null,
        paisNacimiento: data.paisNacimiento?.trim() || null,
        telefonoContacto: data.telefonoContacto?.trim() || null,
        lenguaOriginaria: data.lenguaOriginaria?.trim() || null,
      };
      if (existingEst.length > 0) {
        await db.update(estudiantes).set(estData).where(eq(estudiantes.id, existingEst[0].id));
      } else {
        await db.insert(estudiantes).values({ personaId: id, ...estData });
      }

      const roles = await db.select().from(rolesPersonas).where(eq(rolesPersonas.codigo, 'ESTUDIANTE')).limit(1);
      if (roles.length > 0) {
        await db.insert(personasRoles).values({ personaId: id, rolPersonaId: roles[0].id }).onConflictDoNothing();
      }
    }

    if (data.rolPrimario === 'TRABAJADOR' || data.esTrabajador) {
      const existingTrab = await db.select().from(trabajadores).where(eq(trabajadores.personaId, id)).limit(1);
      const trabData = {
        codigoPlaza: data.codigoPlaza || null,
        motivoPlaza: data.motivoPlaza || null,
        cargo: data.cargo || null,
        condicion: normalizeTrabajadorCondicion(data.condicion),
        escalaRegimen: data.escalaRegimen || null,
        tituloEspecialidad: data.tituloEspecialidad || null,
        rdNombramientoContrato: data.rdNombramientoContrato || null,
        estado: normalizeTrabajadorEstado(data.estadoTrabajador || data.estado),
      };
      if (existingTrab.length > 0) {
        await db.update(trabajadores).set(trabData).where(eq(trabajadores.id, existingTrab[0].id));
      } else {
        await db.insert(trabajadores).values({ personaId: id, ...trabData });
      }
    }

    if (data.rolPrimario === 'EGRESADO' && data.matriculaId && data.programaId && data.planEstudioId && data.fechaEgreso) {
      const estList = await db.select().from(estudiantes).where(eq(estudiantes.personaId, id)).limit(1);
      const studentId = estList[0]?.id;

      const egResult = await db.select().from(egresados).where(eq(egresados.matriculaId, data.matriculaId)).limit(1);
      if (egResult.length > 0) {
        await db.update(egresados)
          .set({
            programaId: data.programaId,
            planEstudioId: data.planEstudioId,
            fechaEgreso: data.fechaEgreso,
            numeroRegistroTitulo: data.numeroRegistroTitulo || null,
            observaciones: data.observacionesEgresado || null
          })
          .where(eq(egresados.id, egResult[0].id));
      } else if (studentId) {
        await db.insert(egresados).values({
          estudianteId: studentId,
          programaId: data.programaId,
          planEstudioId: data.planEstudioId,
          matriculaId: data.matriculaId,
          fechaEgreso: data.fechaEgreso,
          numeroRegistroTitulo: data.numeroRegistroTitulo || null,
          observaciones: data.observacionesEgresado || null
        }).onConflictDoNothing();
        
        // Auto-update student state
        const mat = await db.select().from(matriculas).where(eq(matriculas.id, data.matriculaId)).limit(1);
        if (mat.length > 0) {
          await db.update(matriculas).set({ condicion: data.numeroRegistroTitulo ? 'Titulado' : 'Egresado' }).where(eq(matriculas.id, data.matriculaId));
        }
      }
    }

    res.json(result[0]);
  } catch (error) {
    console.error('Error updating persona:', error);
    res.status(500).json({ error: 'Error updating persona' });
  }
});

// Actualizar únicamente el enlace/URL de foto
padronRouter.patch('/personas/:id/foto', async (req, res) => {
  try {
    const { id } = req.params;
    const { fotoUrl } = req.body;

    const [updated] = await db.update(personas)
      .set({ fotoUrl: fotoUrl || null })
      .where(eq(personas.id, id))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: 'Persona no encontrada' });
    }

    res.json({ success: true, personaId: id, fotoUrl: updated.fotoUrl });
  } catch (error) {
    console.error('Error updating persona fotoUrl:', error);
    res.status(500).json({ error: 'Error updating fotoUrl' });
  }
});

padronRouter.delete('/personas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.delete(apoderadosEstudiantes).where(eq(apoderadosEstudiantes.personaId, id));
    
    const student = await db.select().from(estudiantes).where(eq(estudiantes.personaId, id)).limit(1);
    if (student.length > 0) {
      await db.delete(apoderadosEstudiantes).where(eq(apoderadosEstudiantes.estudianteId, student[0].id));
      await db.delete(estudiantes).where(eq(estudiantes.id, student[0].id));
    }
    
    await db.delete(personasRoles).where(eq(personasRoles.personaId, id));
    await db.delete(trabajadores).where(eq(trabajadores.personaId, id));
await db.delete(personas).where(eq(personas.id, id));
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting persona:', error);
    res.status(500).json({ error: 'Error deleting persona' });
  }
});

// =======================
// ESTUDIANTES
// =======================

// Obtener todos los estudiantes
padronRouter.get('/estudiantes', async (req, res) => {
  try {
    const allEstudiantes = await db.select().from(estudiantes);
    res.json(allEstudiantes);
  } catch (error) {
    console.error('Error fetching estudiantes:', error);
    res.status(500).json({ error: 'Error fetching estudiantes' });
  }
});

// Crear nuevo estudiante
padronRouter.post('/estudiantes', async (req, res) => {
  try {
    const data = req.body;
    
    let targetPersonaId = data.personaId;

    if (data.personaData) {
      // Create persona first
      const pData = data.personaData;
      const hasDiscapacidad = typeof pData.discapacidad === 'boolean'
        ? pData.discapacidad
        : (pData.discapacidad === 'true' || pData.discapacidad === 'SI' || false);

      const cargaFamiliarNum = (pData.cargaFamiliar !== undefined && pData.cargaFamiliar !== null && pData.cargaFamiliar !== '')
        ? (!isNaN(parseInt(pData.cargaFamiliar)) ? Math.max(0, parseInt(pData.cargaFamiliar)) : null)
        : null;

      const personaResult = await db.insert(personas)
        .values({
          tipoDocumento: normalizePersonaDocType(pData.tipoDocumento),
          numeroDocumento: pData.numeroDocumento?.trim(),
          apellidoPaterno: pData.apellidoPaterno?.trim(),
          apellidoMaterno: pData.apellidoMaterno?.trim() || null,
          nombres: pData.nombres?.trim(),
          fechaNacimiento: pData.fechaNacimiento || null,
          genero: normalizeGenero(pData.sexo !== undefined ? pData.sexo : pData.genero),
          direccionActual: pData.direccionActual?.trim() || pData.direccion?.trim() || null,
          telefono: pData.telefono?.trim() || null,
          email: pData.email?.trim() || pData.correo?.trim() || null,
          nivelEducativo: normalizeNivelEducativo(pData.nivelEducativo),
          estadoCivil: normalizeEstadoCivil(pData.estadoCivil),
          cargaFamiliar: cargaFamiliarNum,
          internetCasa: typeof pData.internetCasa === 'boolean' ? pData.internetCasa : (pData.internetCasa === 'true' || pData.internetCasa === 'SI' || false),
          equipoClasesVirtuales: pData.equipoClasesVirtuales?.trim() || null,
          operadorTelefonico: normalizeOperadorTelefonico(pData.operadorTelefonico),
          discapacidad: hasDiscapacidad,
          tipoDiscapacidad: normalizeTipoDiscapacidad(pData.tipoDiscapacidad, hasDiscapacidad),
          fotoUrl: pData.fotoUrl?.trim() || null,
          observaciones: pData.observaciones?.trim() || null,
        })
        .returning();
      targetPersonaId = personaResult[0].id;
    }

    const result = await db.insert(estudiantes)
      .values({
        personaId: targetPersonaId,
        codigoEstudiante: data.codigoEstudiante?.trim() || null,
        trabaja: typeof data.trabaja === 'boolean' ? data.trabaja : (data.trabaja === 'true' || false),
        ieProcedencia: data.ieProcedencia?.trim() || null,
        puestoTrabajo: data.puestoTrabajo?.trim() || null,
        lugarNacimiento: data.lugarNacimiento?.trim() || null,
        distritoNacimiento: data.distritoNacimiento?.trim() || null,
        provinciaNacimiento: data.provinciaNacimiento?.trim() || null,
        regionNacimiento: data.regionNacimiento?.trim() || null,
        paisNacimiento: data.paisNacimiento?.trim() || null,
        telefonoContacto: data.telefonoContacto?.trim() || null,
        lenguaOriginaria: data.lenguaOriginaria?.trim() || null,
      })
      .returning();

    const roles = await db.select().from(rolesPersonas).where(eq(rolesPersonas.codigo, 'ESTUDIANTE')).limit(1);
    if (roles.length > 0) {
      await db.insert(personasRoles).values({ personaId: targetPersonaId, rolPersonaId: roles[0].id }).onConflictDoNothing();
    }

    res.json(result[0]);
  } catch (error) {
    console.error('Error creating estudiante:', error);
    res.status(500).json({ error: 'Error creating estudiante' });
  }
});

// Actualizar estudiante
padronRouter.put('/estudiantes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const result = await db.update(estudiantes)
      .set({
        trabaja: data.trabaja,
        puestoTrabajo: data.puestoTrabajo,
        ieProcedencia: data.ieProcedencia,
        lugarNacimiento: data.lugarNacimiento,
        distritoNacimiento: data.distritoNacimiento,
        provinciaNacimiento: data.provinciaNacimiento,
        regionNacimiento: data.regionNacimiento,
        paisNacimiento: data.paisNacimiento,
        telefonoContacto: data.telefonoContacto,
        lenguaOriginaria: data.lenguaOriginaria,
      })
      .where(eq(estudiantes.id, id))
      .returning();

    res.json(result[0]);
  } catch (error) {
    console.error('Error updating estudiante:', error);
    res.status(500).json({ error: 'Error updating estudiante' });
  }
});

// Eliminar estudiante
padronRouter.delete('/estudiantes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // Eliminar matrículas asociadas
    await db.delete(matriculas).where(eq(matriculas.estudianteId, id));
    // Eliminar apoderados asociados
    await db.delete(apoderadosEstudiantes).where(eq(apoderadosEstudiantes.estudianteId, id));
    // Eliminar estudiante
    await db.delete(estudiantes).where(eq(estudiantes.id, id));
    res.json({ success: true, message: 'Estudiante eliminado exitosamente' });
  } catch (error) {
    console.error('Error deleting estudiante:', error);
    res.status(500).json({ error: 'Error deleting estudiante' });
  }
});


// =======================
// TRABAJADORES
// =======================

// Obtener todos los trabajadores
padronRouter.get('/trabajadores', async (req, res) => {
  try {
    const allTrabajadores = await db.select().from(trabajadores);
    res.json(allTrabajadores);
  } catch (error) {
    console.error('Error fetching trabajadores:', error);
    res.status(500).json({ error: 'Error fetching trabajadores' });
  }
});

// Crear nuevo trabajador
padronRouter.post('/trabajadores', async (req, res) => {
  try {
    const data = req.body;
    
    let targetPersonaId = data.personaId;
    if (data.personaData) {
      // Create persona first
      const pData = data.personaData;
      const personaResult = await db.insert(personas)
        .values({
          tipoDocumento: pData.tipoDocumento || 'DNI',
          numeroDocumento: pData.numeroDocumento,
          apellidoPaterno: pData.apellidoPaterno,
          apellidoMaterno: pData.apellidoMaterno,
          nombres: pData.nombres,
          fechaNacimiento: pData.fechaNacimiento,
          genero: normalizeGenero(pData.sexo !== undefined ? pData.sexo : pData.genero),
          direccionActual: pData.direccionActual || pData.direccion,
          telefono: pData.telefono,
          email: pData.email || pData.correo
        })
        .returning();
      targetPersonaId = personaResult[0].id;
    }
    
    const result = await db.insert(trabajadores)
      .values({
        personaId: targetPersonaId,
        codigoPlaza: data.codigoPlaza,
        motivoPlaza: data.motivoPlaza,
        cargo: data.cargo,
        condicion: data.condicion,
        escalaRegimen: data.escalaRegimen,
        tituloEspecialidad: data.tituloEspecialidad || data.especialidad,
        rdNombramientoContrato: data.rdNombramientoContrato,
        estado: data.estado || 'ACTIVO'
      })
      .returning();
      
    res.json(result[0]);
  } catch (error) {
    console.error('Error creating trabajador:', error);
    res.status(500).json({ error: 'Error creating trabajador' });
  }
});

// Actualizar trabajador
padronRouter.put('/trabajadores/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const result = await db.update(trabajadores)
      .set({
        codigoPlaza: data.codigoPlaza,
        motivoPlaza: data.motivoPlaza,
        cargo: data.cargo,
        condicion: data.condicion,
        escalaRegimen: data.escalaRegimen,
        tituloEspecialidad: data.tituloEspecialidad || data.especialidad,
        rdNombramientoContrato: data.rdNombramientoContrato,
        estado: data.estado || 'ACTIVO'
      })
      .where(eq(trabajadores.id, id))
      .returning();
    res.json(result[0]);
  } catch (error) {
    console.error('Error updating trabajador:', error);
    res.status(500).json({ error: 'Error updating trabajador' });
  }
});

// =======================
// APODERADOS
// =======================
padronRouter.get('/apoderados', async (req, res) => {
  try {
    const allApoderados = await db.select().from(apoderadosEstudiantes);
    res.json(allApoderados);
  } catch (error) {
    console.error('Error fetching apoderados:', error);
    res.status(500).json({ error: 'Error fetching apoderados' });
  }
});

padronRouter.post('/apoderados', async (req, res) => {
  try {
    const data = req.body;
    let apoderadoPersonaId = data.personaId;

    if (!apoderadoPersonaId && data.dni) {
      const found = await db.select().from(personas).where(eq(personas.numeroDocumento, data.dni));
      if (found.length > 0) {
        apoderadoPersonaId = found[0].id;
        if (data.telefono || data.nombres) {
          await db.update(personas).set({
            ...(data.telefono ? { telefono: data.telefono } : {}),
            ...(data.nombres && !found[0].nombres ? { nombres: data.nombres } : {}),
            ...(data.apellidoPaterno && !found[0].apellidoPaterno ? { apellidoPaterno: data.apellidoPaterno } : {}),
          }).where(eq(personas.id, apoderadoPersonaId));
        }
      } else {
        const [newP] = await db.insert(personas).values({
          tipoDocumento: 'DNI',
          numeroDocumento: data.dni,
          nombres: data.nombres || 'Apoderado',
          apellidoPaterno: data.apellidoPaterno || '',
          apellidoMaterno: data.apellidoMaterno || '',
          telefono: data.telefono || null,
          fechaNacimiento: '1985-01-01',
          genero: 'M',
          direccionActual: '',
          
        }).returning();
        apoderadoPersonaId = newP.id;
      }
    }

    if (!apoderadoPersonaId || !data.estudianteId) {
      return res.status(400).json({ error: 'EstudianteId y Apoderado son requeridos' });
    }

    // Role
    const rolApoderado = await db.select().from(rolesPersonas).where(eq(rolesPersonas.codigo, 'APODERADO')).limit(1);
    if (rolApoderado.length > 0) {
      const existingPR = await db.select().from(personasRoles).where(and(
        eq(personasRoles.personaId, apoderadoPersonaId),
        eq(personasRoles.rolPersonaId, rolApoderado[0].id)
      ));
      if (existingPR.length === 0) {
        await db.insert(personasRoles).values({
          personaId: apoderadoPersonaId,
          rolPersonaId: rolApoderado[0].id,
          
        });
      }
    }

    const existingLink = await db.select().from(apoderadosEstudiantes).where(and(
      eq(apoderadosEstudiantes.estudianteId, data.estudianteId),
      eq(apoderadosEstudiantes.personaId, apoderadoPersonaId)
    ));

    let result;
    if (existingLink.length > 0) {
      result = await db.update(apoderadosEstudiantes).set({
        parentesco: data.parentesco || 'Padre / Madre / Tutor',
        esApoderadoPrincipal: data.esApoderadoPrincipal !== undefined ? Boolean(data.esApoderadoPrincipal) : true,
        viveConEstudiante: data.viveConEstudiante !== undefined ? Boolean(data.viveConEstudiante) : true,
      }).where(eq(apoderadosEstudiantes.id, existingLink[0].id)).returning();
    } else {
      result = await db.insert(apoderadosEstudiantes).values({
        estudianteId: data.estudianteId,
        personaId: apoderadoPersonaId,
        parentesco: data.parentesco || 'Padre / Madre / Tutor',
        esApoderadoPrincipal: data.esApoderadoPrincipal !== undefined ? Boolean(data.esApoderadoPrincipal) : true,
        viveConEstudiante: data.viveConEstudiante !== undefined ? Boolean(data.viveConEstudiante) : true,
      }).returning();
    }

    res.json({ success: true, apoderadoEstudiante: result[0], personaId: apoderadoPersonaId });
  } catch (error) {
    console.error('Error saving apoderado:', error);
    res.status(500).json({ error: 'Error saving apoderado' });
  }
});

// =======================
// EGRESADOS
// =======================
padronRouter.get('/egresados', async (req, res) => {
  try {
    const allEgresados = await db.select().from(egresados);
    res.json(allEgresados);
  } catch (error) {
    console.error('Error fetching egresados:', error);
    res.status(500).json({ error: 'Error fetching egresados' });
  }
});
