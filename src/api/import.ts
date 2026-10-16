
import express from 'express';
import { createPool, db } from '../db/index.js';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '../db/schema.js';
import * as relations from '../db/relations.js';
import { eq, and } from 'drizzle-orm';
import { personas, estudiantes, programas, planesEstudios, modulos, unidadesDidacticas, nivelesFormativos, sectoresEconomicos, familiasProductivas, actividadesEconomicas, tiposUnidades, trabajadores, apoderadosEstudiantes, periodosAcademicos, matriculas, periodosLectivos, sedes, secciones, rolesPersonas, personasRoles } from '../db/schema.js';

const router = express.Router();

async function withRetry<T>(fn: () => Promise<T>, retries = 3, delayMs = 200): Promise<T> {
  let lastError: any;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;
      const msg = (err?.message || '').toLowerCase();
      if (
        msg.includes('connection terminated') ||
        msg.includes('econnreset') ||
        msg.includes('closed') ||
        msg.includes('timeout') ||
        msg.includes('broken pipe') ||
        msg.includes('pool')
      ) {
        await new Promise((resolve) => setTimeout(resolve, delayMs * (i + 1)));
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

const getValue = (row: any, keys: string[]) => {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null) return row[key];
    const upperKey = key.toUpperCase();
    for (const rowKey of Object.keys(row)) {
      if (rowKey.toUpperCase().replace(/\s+/g, '') === upperKey || rowKey.toUpperCase() === upperKey) {
        return row[rowKey];
      }
    }
  }
  return null;
};

const normalizeStr = (str: string) => {
  if (!str) return '';
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();
};

const getCommonPersonaFields = (row: any) => {
  const dni = (getValue(row, ['numero_documento', 'DNI', 'DOCUMENTO', 'NUMERODOCUMENTO']) || `DNI-${Date.now()}-${Math.floor(Math.random()*10000)}`).toString().trim();
  const tipoDoc = (getValue(row, ['tipo_documento', 'TIPODOCUMENTO']) || 'DNI').toString().trim();
  const nombres = (getValue(row, ['nombres', 'NOMBRES', 'NOMBRE']) || '').toString().trim().toUpperCase();
  const apePat = (getValue(row, ['apellido_paterno', 'APELLIDOPATERNO', 'APELLIDOS']) || '').toString().trim().toUpperCase();
  const apeMat = (getValue(row, ['apellido_materno', 'APELLIDOMATERNO']) || '').toString().trim().toUpperCase();
  const correo = (getValue(row, ['email', 'CORREO', 'EMAIL', 'CORREOELECTRONICO']) || '').toString().trim();
  const telefono = (getValue(row, ['telefono', 'TELEFONO', 'CELULAR', 'telefono_contacto']) || '').toString().trim();
  
  const rawFechaNac = getValue(row, ['fecha_nacimiento', 'FECHANACIMIENTO', 'FECHA_NACIMIENTO']);
  let fechaNac = null;
  if (rawFechaNac) {
    if (typeof rawFechaNac === 'number') {
      const d = new Date(Math.round((rawFechaNac - 25569) * 86400 * 1000));
      fechaNac = d.toISOString().split('T')[0];
    } else if (typeof rawFechaNac === 'string') {
      if (rawFechaNac.includes('/')) {
        const parts = rawFechaNac.split('/');
        if (parts.length === 3) {
           fechaNac = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        } else {
           fechaNac = rawFechaNac; 
        }
      } else if (rawFechaNac.includes('-')) {
        fechaNac = rawFechaNac;
      }
    } else if (rawFechaNac instanceof Date) {
      fechaNac = rawFechaNac.toISOString().split('T')[0];
    }
  }
  
  const rawGenero = (getValue(row, ['genero', 'GENERO', 'SEXO']) || '').toString().trim() || null;
  let genero: 'H' | 'M' | null = null;
  if (rawGenero) {
    const upper = rawGenero.toUpperCase();
    if (upper === 'M' || upper === 'F' || upper.startsWith('FEM') || upper.startsWith('MUJ')) genero = 'M';
    else if (upper === 'H' || upper === 'V' || upper.startsWith('HOMB') || upper.startsWith('MASC') || upper.startsWith('VAR')) genero = 'H';
    else genero = 'H';
  }
  const direccion = (getValue(row, ['direccion_actual', 'DIRECCION', 'DOMICILIO']) || '').toString().trim() || null;
  const nivelEdu = (getValue(row, ['nivel_educativo', 'NIVELEDUCATIVO', 'NIVEL_EDUCATIVO']) || '').toString().trim() || null;
  const estadoCivil = (getValue(row, ['estado_civil', 'ESTADOCIVIL', 'ESTADO_CIVIL']) || '').toString().trim() || null;
  
  const cargaFamStr = getValue(row, ['carga_familiar']);
  const parsedCarga = cargaFamStr ? parseInt(cargaFamStr.toString(), 10) : null;
  const cargaFamiliar = isNaN(parsedCarga) ? null : parsedCarga;
  
  const intCasaStr = getValue(row, ['Internet_Casa', 'internet_casa']);
  const internetCasa = intCasaStr ? (intCasaStr.toString().toLowerCase() === 'si' || intCasaStr.toString().toLowerCase() === 'sí') : null;
  
  const equipoVirtual = getValue(row, ['Equipo_Clases_Virtuales', 'equipo_clases_virtuales']) || null;
  
  let rawOperador = getValue(row, ['operador_telefónico', 'operador_telefonico', 'OPERADOR_TELEFONICO', 'OPERADOR', 'TELEFONIA']);
  let operadorTel: string | null = null;
  if (rawOperador) {
    const opUpper = rawOperador.toString().trim().toUpperCase();
    if (opUpper.includes('MOVISTAR') || opUpper.includes('TELEFONICA')) operadorTel = 'Movistar';
    else if (opUpper.includes('CLARO')) operadorTel = 'Claro';
    else if (opUpper.includes('ENTEL')) operadorTel = 'Entel';
    else if (opUpper.includes('BITEL')) operadorTel = 'Bitel';
    else if (opUpper.includes('OTRO')) operadorTel = 'Otro';
    else operadorTel = 'Otro';
  }
  
  const discapStr = getValue(row, ['discapacidad', 'DISCAPACIDAD']);
  const discapacidad = discapStr ? (discapStr.toString().toLowerCase() === 'si' || discapStr.toString().toLowerCase() === 'sí') : false;
  
  let rawDiscap = getValue(row, ['tipo_discapacidad', 'TIPO_DISCAPACIDAD', 'TIPODISCAPACIDAD']);
  let tipoDiscap: string | null = null;
  if (rawDiscap) {
    const tdUpper = rawDiscap.toString().trim().toUpperCase();
    if (tdUpper.includes('INTELECTUAL') && tdUpper.includes('LEVE')) tipoDiscap = 'Intelectual leve';
    else if (tdUpper.includes('INTELECTUAL') && tdUpper.includes('MODERAD')) tipoDiscap = 'Intelectual moderada';
    else if (tdUpper.includes('INTELECTUAL') && tdUpper.includes('SEVER')) tipoDiscap = 'Intelectual severa';
    else if (tdUpper.includes('AUDITIVA') && tdUpper.includes('HIPOACUSIA')) tipoDiscap = 'Auditiva hipoacusia';
    else if (tdUpper.includes('AUDITIVA') || tdUpper.includes('SORDER')) tipoDiscap = 'Auditiva sordera';
    else if (tdUpper.includes('VISUAL') && (tdUpper.includes('BAJA') || tdUpper.includes('VISION'))) tipoDiscap = 'Visual baja visión';
    else if (tdUpper.includes('VISUAL') || tdUpper.includes('CEGUER')) tipoDiscap = 'Visual ceguera';
    else if (tdUpper.includes('FISIC') || tdUpper.includes('MOTOR')) tipoDiscap = 'Físico Motora';
    else if (tdUpper.includes('AUTIS') || tdUpper.includes('ESPECTRO') || tdUpper.includes('TEA')) tipoDiscap = 'Trastorno del espectro autista';
    else if (tdUpper.includes('SORDO') && tdUpper.includes('CEGUER')) tipoDiscap = 'Sordo ceguera';
    else if (tdUpper.includes('MULTI')) tipoDiscap = 'Multidiscapacidad';
    else tipoDiscap = 'Otra discapacidad';
  }
  const fotoUrl = getValue(row, ['foto_url', 'FOTO_URL', 'fotoUrl', 'FOTO', 'URL_FOTO', 'LINK_FOTO', 'FOTOGRAFIA', 'FOTO_LINK', 'AVATAR', 'IMAGEN', 'FOTO_PERFIL', 'FOTO_ESTUDIANTE']) || null;
  const observaciones = getValue(row, ['observaciones']) || null;

  return {
    tipoDocumento: tipoDoc,
    numeroDocumento: dni,
    nombres,
    apellidoPaterno: apePat,
    apellidoMaterno: apeMat,
    email: correo,
    telefono,
    fechaNacimiento: fechaNac,
    genero,
    direccionActual: direccion,
    nivelEducativo: nivelEdu,
    estadoCivil,
    cargaFamiliar,
    internetCasa,
    equipoClasesVirtuales: equipoVirtual,
    operadorTelefonico: operadorTel as any,
    discapacidad,
    tipoDiscapacidad: tipoDiscap as any,
    fotoUrl,
    observaciones,
  };
};

router.post('/excel', async (req, res) => {
  const pool = createPool();
  let client = await pool.connect();
  let activeDb = drizzle(client, { schema: { ...schema, ...relations } });

  const getDb = async () => {
    try {
      await client.query('SELECT 1');
      return activeDb;
    } catch {
      try { client.release(); } catch {}
      client = await pool.connect();
      activeDb = drizzle(client, { schema: { ...schema, ...relations } });
      return activeDb;
    }
  };

  try {
    const { tipo, data } = req.body;
    if (!data || !Array.isArray(data) || !tipo) {
      return res.status(400).json({ error: 'Datos y tipo son requeridos' });
    }

    let inserted = 0;
    let skipped = 0;
    let skipReasons: string[] = [];

    // Pre-cargar roles para evitar SELECTs repetitivos
    const initialDb = await getDb();
    const allRoles = await initialDb.select().from(rolesPersonas);
    const roleIdByCode = new Map<string, string>();
    for (const r of allRoles) {
      if (r.codigo) roleIdByCode.set(r.codigo.toUpperCase().trim(), r.id);
    }

    if (tipo === 'trabajadores') {
      for (let idx = 0; idx < data.length; idx++) {
        const row = data[idx];
        try {
          const currentDb = await getDb();
          const common = getCommonPersonaFields(row);
          const cargo = getValue(row, ['cargo', 'CARGO']) || 'DOCENTE';
          const rawCondicion = (getValue(row, ['condicion', 'CONDICION', 'CONDICIÓN']) || 'Contratado(a)').toString().toLowerCase();
          const condicion = rawCondicion.includes('nombr') ? 'Nombrado(a)' : 'Contratado(a)';
          const codigoPlaza = getValue(row, ['codigo_plaza', 'CODIGO_PLAZA', 'PLAZA']) || null;
          const motivoPlaza = getValue(row, ['motivo_plaza', 'MOTIVO_PLAZA']) || null;
          const escalaRegimen = getValue(row, ['escala_regimen', 'ESCALA_REGIMEN', 'ESCALA', 'REGIMEN']) || null;
          const tituloEspecialidad = getValue(row, ['especialidad', 'TITULO', 'ESPECIALIDAD', 'TITULO_ESPECIALIDAD', 'titulo_especialidad']) || null;
          const rdNombramientoContrato = getValue(row, ['rd_nombramiento_contrato', 'RD_NOMBRAMIENTO_CONTRATO', 'RD_CONTRATO', 'RD_NOMBRAMIENTO', 'RESOLUCION']) || null;
          const rawEstado = (getValue(row, ['ESTADO', 'estado']) || 'Activo').toString().trim().toLowerCase();
          let estadoTrabajador = 'Activo';
          if (rawEstado.includes('inact') || rawEstado.includes('cesan')) estadoTrabajador = 'Cesante';
          else if (rawEstado.includes('licen')) estadoTrabajador = 'Licencia';
          else if (rawEstado.includes('destac')) estadoTrabajador = 'Destacado';
          else if (rawEstado.includes('desig')) estadoTrabajador = 'Designado';

          const pResult = await withRetry(() =>
            currentDb.insert(personas).values(common)
              .onConflictDoUpdate({
                target: personas.numeroDocumento,
                set: common
              })
              .returning()
          );

          if (pResult && pResult.length > 0) {
            const personaId = pResult[0].id;
            
            // Asignar rol del trabajador
            let rolStr = (getValue(row, ['ROL', 'CARGO']) || 'DOCENTE').toString().toUpperCase().trim();
            if (rolStr.includes('DOCENTE') || rolStr.includes('PROFESOR') || rolStr === 'TRABAJADOR') rolStr = 'DOCENTE';
            else if (rolStr.includes('DIRECTOR') || rolStr.includes('DIRECTIV')) rolStr = 'DIRECTIVO';
            else if (rolStr.includes('ADMIN') || rolStr.includes('SECRETAR') || rolStr.includes('COORDINADOR')) rolStr = 'ADMINISTRATIVO';

            const rolPersonaId = roleIdByCode.get(rolStr) || roleIdByCode.get('DOCENTE');
            if (rolPersonaId) {
              await withRetry(() =>
                currentDb.insert(personasRoles).values({
                  personaId,
                  rolPersonaId,})
                .onConflictDoUpdate({
                  target: [personasRoles.personaId, personasRoles.rolPersonaId],
                  set: {}
                })
              ).catch(() => {});
            }

            await withRetry(() =>
              currentDb.insert(trabajadores).values({
                personaId,
                codigoPlaza,
                motivoPlaza,
                cargo,
                condicion,
                escalaRegimen,
                tituloEspecialidad,
                rdNombramientoContrato,
                estado: estadoTrabajador,
              }).onConflictDoUpdate({
                target: trabajadores.personaId,
                set: {
                  codigoPlaza,
                  motivoPlaza,
                  cargo,
                  condicion,
                  escalaRegimen,
                  tituloEspecialidad,
                  rdNombramientoContrato,
                estado: estadoTrabajador,
                }
              })
            );
            inserted++;
          }
        } catch (rowError: any) {
          console.error(`Error importing trabajador`, rowError);
          skipped++;
          const errorMsg = rowError.detail || rowError.shortMessage || rowError.message || 'Error desconocido';
          skipReasons.push(`Error en fila ${row.DNI || row.numero_documento || 'desconocida'}: ${errorMsg}`);
        }
      }
    } else if (tipo === 'apoderados') {
      for (let idx = 0; idx < data.length; idx++) {
        const row = data[idx];
        try {
          const currentDb = await getDb();
          const dniEstudiante = (getValue(row, [
            'DNI_ESTUDIANTE', 'DNI_ESTUDIANTES', 'DNI ESTUDIANTE', 'ESTUDIANTE_DNI',
            'DNI_ALUMNO', 'DNI ALUMNO', 'DNI_HIJO', 'DNI HIJO', 'ESTUDIANTE',
            'DNI_ESTUDIANTE / ALUMNO', 'DNI_ESTUDIANTE/ALUMNO'
          ]) || '').toString().trim();

          const dniApoderado = (getValue(row, [
            'DNI_APODERADO', 'DNI_APODERADOS', 'DNI APODERADO', 'APODERADO_DNI',
            'DNI_PADRE', 'DNI_MADRE', 'DNI_TUTOR', 'DNI', 'DOCUMENTO_APODERADO',
            'NUMERO_DOCUMENTO', 'NUMERODOCUMENTO'
          ]) || '').toString().trim();
          
          if (!dniEstudiante || !dniApoderado) {
             skipped++;
             skipReasons.push(`Fila ${idx + 1}: Faltan datos clave (DNI Estudiante: "${dniEstudiante}", DNI Apoderado: "${dniApoderado}")`);
             continue;
          }

          // 1. Obtener o crear persona del Estudiante
          let pEstudiante = await withRetry(() => currentDb.select().from(personas).where(eq(personas.numeroDocumento, dniEstudiante)));
          if (pEstudiante.length === 0 && dniEstudiante.length < 8 && !isNaN(Number(dniEstudiante))) {
            const paddedDni = dniEstudiante.padStart(8, '0');
            pEstudiante = await withRetry(() => currentDb.select().from(personas).where(eq(personas.numeroDocumento, paddedDni)));
          }

          let estudiantePersonaId: string;
          if (pEstudiante.length === 0) {
            // Auto-crear persona básica de estudiante para no bloquear el registro del apoderado
            const newP = await withRetry(() =>
              currentDb.insert(personas).values({
                tipoDocumento: 'DNI',
                numeroDocumento: dniEstudiante,
                nombres: 'Estudiante',
                apellidoPaterno: `(DNI ${dniEstudiante})`,
                apellidoMaterno: '',}).onConflictDoUpdate({
                target: personas.numeroDocumento,
                set: {}
              }).returning()
            );
            estudiantePersonaId = newP && newP.length > 0 ? newP[0].id : '';
            if (!estudiantePersonaId) {
              const checkP = await withRetry(() => currentDb.select().from(personas).where(eq(personas.numeroDocumento, dniEstudiante)));
              estudiantePersonaId = checkP[0].id;
            }
          } else {
            estudiantePersonaId = pEstudiante[0].id;
          }
          
          // 2. Obtener o crear registro en tabla estudiantes
          let eRecords = await withRetry(() => currentDb.select().from(estudiantes).where(eq(estudiantes.personaId, estudiantePersonaId)));
          let estudianteId: string;
          if (eRecords.length === 0) {
            const newE = await withRetry(() =>
              currentDb.insert(estudiantes).values({
                personaId: estudiantePersonaId,}).returning()
            );
            estudianteId = newE && newE.length > 0 ? newE[0].id : '';
            if (!estudianteId) {
              const checkE = await withRetry(() => currentDb.select().from(estudiantes).where(eq(estudiantes.personaId, estudiantePersonaId)));
              estudianteId = checkE[0].id;
            }
          } else {
            estudianteId = eRecords[0].id;
          }

          // 3. Obtener o crear persona del Apoderado
          const nombres = (getValue(row, ['NOMBRES_APODERADO', 'NOMBRES', 'NOMBRE', 'NOMBRE_APODERADO']) || `Apoderado DNI ${dniApoderado}`).toString().trim();
          const apePat = (getValue(row, ['APELLIDO_PATERNO', 'APELLIDOPATERNO_APODERADO', 'APELLIDOS_APODERADO', 'APELLIDOPATERNO', 'APELLIDOS', 'APELLIDO_PATERNO_APODERADO']) || '-').toString().trim();
          const apeMat = (getValue(row, ['APELLIDO_MATERNO', 'APELLIDOMATERNO_APODERADO', 'APELLIDOMATERNO', 'APELLIDO_MATERNO_APODERADO']) || '').toString().trim();
          const tipoDoc = (getValue(row, ['TIPO_DOCUMENTO', 'TIPODOCUMENTO']) || 'DNI').toString().trim();
          const correo = getValue(row, ['CORREO', 'EMAIL', 'CORREO_ELECTRONICO', 'CORREO_APODERADO']) ? String(getValue(row, ['CORREO', 'EMAIL', 'CORREO_ELECTRONICO', 'CORREO_APODERADO'])).trim() : null;
          const telefono = getValue(row, ['TELEFONO', 'CELULAR', 'TELEFONO_APODERADO', 'CELULAR_APODERADO', 'TEL']) ? String(getValue(row, ['TELEFONO', 'CELULAR', 'TELEFONO_APODERADO', 'CELULAR_APODERADO', 'TEL'])).trim() : null;
          const direccion = getValue(row, ['DIRECCION', 'DOMICILIO', 'DIRECCION_APODERADO']) ? String(getValue(row, ['DIRECCION', 'DOMICILIO', 'DIRECCION_APODERADO'])).trim() : null;
          const estadoPersona = (getValue(row, ['ESTADO', 'estado']) || 'ACTIVO').toString().trim();
          
          let pApoderado = await withRetry(() => currentDb.select().from(personas).where(eq(personas.numeroDocumento, dniApoderado)));
          if (pApoderado.length === 0 && dniApoderado.length < 8 && !isNaN(Number(dniApoderado))) {
            const paddedDniApod = dniApoderado.padStart(8, '0');
            pApoderado = await withRetry(() => currentDb.select().from(personas).where(eq(personas.numeroDocumento, paddedDniApod)));
          }

          let apoderadoPersonaId: string;
          if (pApoderado.length === 0) {
            const newApodP = await withRetry(() =>
              currentDb.insert(personas).values({
                tipoDocumento: tipoDoc,
                numeroDocumento: dniApoderado,
                nombres: nombres,
                apellidoPaterno: apePat,
                apellidoMaterno: apeMat,
                email: correo,
                telefono: telefono,
                direccionActual: direccion,
                
              }).returning()
            );
            apoderadoPersonaId = newApodP[0].id;
          } else {
            apoderadoPersonaId = pApoderado[0].id;
            await withRetry(() =>
              currentDb.update(personas).set({
                ...(nombres && !nombres.startsWith('Apoderado DNI') ? { nombres } : {}),
                ...(apePat && apePat !== '-' ? { apellidoPaterno: apePat } : {}),
                ...(apeMat ? { apellidoMaterno: apeMat } : {}),
                ...(correo ? { email: correo } : {}),
                ...(telefono ? { telefono } : {}),
                ...(direccion ? { direccionActual: direccion } : {}),
                
              }).where(eq(personas.id, apoderadoPersonaId))
            );
          }

          // 4. Asignar rol APODERADO en personasRoles
          const rolApoderadoId = roleIdByCode.get('APODERADO');
          if (rolApoderadoId) {
            const existingRoles = await withRetry(() =>
              currentDb.select().from(personasRoles).where(
                and(
                  eq(personasRoles.personaId, apoderadoPersonaId),
                  eq(personasRoles.rolPersonaId, rolApoderadoId)
                )
              )
            );
            if (existingRoles.length === 0) {
              await withRetry(() =>
                currentDb.insert(personasRoles).values({
                  personaId: apoderadoPersonaId,
                  rolPersonaId: rolApoderadoId,})
              ).catch(() => {});
            }
          }

          // 5. Vincular en apoderadosEstudiantes
          const parentesco = (getValue(row, ['PARENTESCO', 'RELACION', 'VINCULO']) || 'Padre/Madre').toString().trim();
          const esPrincipalRaw = getValue(row, ['ES_APODERADO_PRINCIPAL', 'ES_PRINCIPAL', 'PRINCIPAL']);
          const esPrincipalStr = esPrincipalRaw !== undefined && esPrincipalRaw !== null ? String(esPrincipalRaw).toUpperCase().trim() : '';
          const esPrincipal = esPrincipalStr === 'SI' || esPrincipalStr === 'SÍ' || esPrincipalStr === 'TRUE' || esPrincipalStr === '1';
          
          const viveConRaw = getValue(row, ['VIVE_CON_ESTUDIANTE', 'VIVE_CON_ALUMNO', 'VIVECONESTUDIANTE']);
          const viveConEstudianteStr = viveConRaw !== undefined && viveConRaw !== null ? String(viveConRaw).toUpperCase().trim() : '';
          const viveConEstudiante = (viveConEstudianteStr === 'SI' || viveConEstudianteStr === 'SÍ' || viveConEstudianteStr === 'TRUE' || viveConEstudianteStr === '1');

          const existingLink = await withRetry(() =>
            currentDb.select().from(apoderadosEstudiantes).where(
              and(
                eq(apoderadosEstudiantes.estudianteId, estudianteId),
                eq(apoderadosEstudiantes.personaId, apoderadoPersonaId)
              )
            )
          );

          if (existingLink.length > 0) {
            await withRetry(() =>
              currentDb.update(apoderadosEstudiantes)
                .set({
                  parentesco: parentesco || existingLink[0].parentesco,
                  esApoderadoPrincipal: esPrincipal,
                  viveConEstudiante: viveConEstudiante,
                  
                })
                .where(eq(apoderadosEstudiantes.id, existingLink[0].id))
            );
          } else {
            await withRetry(() =>
              currentDb.insert(apoderadosEstudiantes).values({
                estudianteId,
                personaId: apoderadoPersonaId,
                parentesco: parentesco || 'Padre/Madre',
                esApoderadoPrincipal: esPrincipal,
                viveConEstudiante: viveConEstudiante,
                
              })
            );
          }

          inserted++;
          
        } catch (err: any) {
          console.error('Error in apoderado row', err);
          skipped++;
          const errorMsg = err?.detail || err?.shortMessage || err?.message || 'Error desconocido';
          skipReasons.push(`Error en fila ${row.DNI_APODERADO || row.DNI || idx + 1}: ${errorMsg}`);
        }
      }

    } else if (tipo === 'matriculas') {
      const currentDb = await getDb();
      const allModulos = await withRetry(() => currentDb.select().from(modulos));
      const allPeriodos = await withRetry(() => currentDb.select().from(periodosAcademicos));
      const allLectivos = await withRetry(() => currentDb.select().from(periodosLectivos));
      const allSedes = await withRetry(() => currentDb.select().from(sedes));
      const allSecciones = await withRetry(() => currentDb.select().from(secciones));
      const defaultSedeId = allSedes.length > 0 ? allSedes[0].id : null;

      for (let idx = 0; idx < data.length; idx++) {
        const row = data[idx];
        try {
          const rowDb = await getDb();
          const dni = (getValue(row, ['DNI', 'CódigoMatrícula', 'numero_documento']) || '').toString().trim();
          const moduloNombre = (getValue(row, ['Módulo', 'Modulo', 'CODIGO_MODULO', 'MODULO']) || '').toString().trim();
          
          if (!dni || !moduloNombre) {
            skipReasons.push(`Falta DNI o Módulo. Columnas: ${Object.keys(row).join(',')}`);
            skipped++;
            continue;
          }

          // Buscar persona
          let pEstudiante = await withRetry(() => rowDb.select().from(personas).where(eq(personas.numeroDocumento, dni)));
          if (pEstudiante.length === 0 && dni.length < 8 && !isNaN(Number(dni))) {
            const paddedDni = dni.padStart(8, '0');
            pEstudiante = await withRetry(() => rowDb.select().from(personas).where(eq(personas.numeroDocumento, paddedDni)));
          }

          let estudiantePersonaId: string;
          if (pEstudiante.length === 0) {
            const newP = await withRetry(() =>
              rowDb.insert(personas).values({
                tipoDocumento: 'DNI',
                numeroDocumento: dni,
                nombres: 'Estudiante',
                apellidoPaterno: `(DNI ${dni})`,
                apellidoMaterno: '',}).onConflictDoUpdate({
                target: personas.numeroDocumento,
                set: {}
              }).returning()
            );
            estudiantePersonaId = newP[0].id;
          } else {
            estudiantePersonaId = pEstudiante[0].id;
          }

          // Buscar o crear estudiante
          let eId = null;
          const eRecords = await withRetry(() => rowDb.select().from(estudiantes).where(eq(estudiantes.personaId, estudiantePersonaId)));
          if (eRecords.length === 0) {
            const eNew = await withRetry(() =>
              rowDb.insert(estudiantes).values({
                personaId: estudiantePersonaId,}).returning()
            );
            eId = eNew[0].id;
          } else {
            eId = eRecords[0].id;
          }
          
          if (!eId) {
             skipReasons.push(`No se pudo obtener el ID del estudiante para el DNI ${dni}`);
             skipped++;
             continue;
          }

          // Buscar Modulo por codigo o nombre
          const normModulo = normalizeStr(moduloNombre);
          const cleanString = (s: string) => s.replace(/[^A-Z0-9]/ig, '');
          const ultraNorm = cleanString(normModulo);

          let foundMod = allModulos.find(m => 
            (m.codigo && normalizeStr(m.codigo) === normModulo) || 
            (m.nombre && normalizeStr(m.nombre) === normModulo) || 
            m.id === moduloNombre
          );

          if (!foundMod) {
             foundMod = allModulos.find(m => {
               if (!m.nombre) return false;
               const ultraM = cleanString(normalizeStr(m.nombre));
               return ultraM === ultraNorm || ultraM.includes(ultraNorm) || ultraNorm.includes(ultraM);
             });
          }

          if (!foundMod) {
             skipReasons.push(`Módulo no encontrado: ${moduloNombre}`);
             skipped++;
             continue;
          }
          const mId = foundMod.id;

          // Obtener o Crear Periodo con soporte completo para 2025_1, 2025_2, 2026_1, 2026_2, 2025-1, 2025-I, etc.
          const rawPeriodoVal = getValue(row, [
            'PeriodoAcadémico',
            'Periodo Académico',
            'Periodo Academico',
            'PeriodoAcademico',
            'PERIODO_ACADEMICO',
            'PERIODO ACADEMICO',
            'PERIODO_ACAD',
            'PERIODO',
            'Periodo',
            'SEMESTRE',
            'PERIODO_LECTIVO_ACADEMICO',
            'PERIODO_MATRICULA',
            'AÑO_PERIODO',
            'PERIODOACADEMICO'
          ]);

          let rawPeriodoStr = (rawPeriodoVal || '2026-1').toString().trim();
          const yearMatch = rawPeriodoStr.match(/(20\d\d)/);
          const anio = yearMatch ? yearMatch[1] : '2026';
          
          let semNum = '1';
          let semRoman = 'I';
          const upperP = rawPeriodoStr.toUpperCase();
          if (
            upperP.includes('-2') ||
            upperP.includes('-II') ||
            upperP.includes('_2') ||
            upperP.includes('_II') ||
            upperP.includes('/2') ||
            upperP.includes('/II') ||
            upperP.includes(' 2') ||
            upperP.includes(' II') ||
            upperP.endsWith('2') ||
            upperP.endsWith('II') ||
            upperP.includes('SEGUNDO')
          ) {
            semNum = '2';
            semRoman = 'II';
          }

          const periodoCode = `PER-ACA-${anio}-${semNum}`;
          const periodoCodeRoman = `PER-ACA-${anio}-${semRoman}`;
          const rawLectivo = anio;
          
          let perId = null;
          const foundPer = allPeriodos.find(p => {
            if (!p) return false;
            if (p.codigo === periodoCode || p.codigo === periodoCodeRoman) return true;
            if (p.codigo?.includes(anio) && (p.codigo.includes(semNum) || p.codigo.includes(semRoman) || p.codigo.endsWith(semNum))) return true;
            if (p.nombre?.toUpperCase().includes(anio) && (p.nombre?.toUpperCase().includes(semNum) || p.nombre?.toUpperCase().includes(semRoman))) return true;
            return false;
          });
          
          if (foundPer) {
             perId = foundPer.id;
          } else {
             let lecId = allLectivos.find(l => l.codigo?.includes(rawLectivo))?.id;
             if (!lecId) {
                const defCetpro = 'fdb4023d-109b-48cf-bf87-2617fc0e704f';
                const newLec = await withRetry(() =>
                  rowDb.insert(periodosLectivos).values({
                    codigo: `PER-LEC-${rawLectivo}`,
                    nombre: `Periodo lectivo ${rawLectivo}`,
                    fechaInicio: `${rawLectivo}-03-01`,
                    fechaFin: `${rawLectivo}-12-31`,
                    cetproId: defCetpro
                  }).returning()
                );
                lecId = newLec[0].id;
                allLectivos.push(newLec[0]);
             }
             
             const isFirst = semNum === '1';
             const newPer = await withRetry(() =>
               rowDb.insert(periodosAcademicos).values({
                 periodoLectivoId: lecId,
                 codigo: periodoCode,
                 nombre: `Periodo académico ${anio}-${semRoman}`,
                 fechaInicio: isFirst ? `${rawLectivo}-03-01` : `${rawLectivo}-08-01`,
                 fechaFin: isFirst ? `${rawLectivo}-07-31` : `${rawLectivo}-12-31`,
                 
               }).returning()
             );
             perId = newPer[0].id;
             allPeriodos.push(newPer[0]);
          }

          const rawSede = getValue(row, ['SEDE', 'Sede', 'sede']);
          let finalSedeId = defaultSedeId;
          if (rawSede) {
            const matchSede = allSedes.find(s => normalizeStr(s.nombre || '') === normalizeStr(rawSede) || s.codigo === rawSede);
            if (matchSede) finalSedeId = matchSede.id;
          }

          const rawSeccion = getValue(row, ['SECCION', 'Seccion', 'seccion']);
          let finalSeccionId = null;
          if (rawSeccion) {
            const matchSeccion = allSecciones.find(s => normalizeStr(s.nombre || '') === normalizeStr(rawSeccion) || s.codigo === rawSeccion);
            if (matchSeccion) finalSeccionId = matchSeccion.id;
          }

          const rawFecha = getValue(row, ['FECHA_MATRICULA', 'FECHA', 'FechaMatricula']);
          let fechaMatricula = new Date().toISOString().split('T')[0];
          if (rawFecha) {
             const parsedDate = new Date(rawFecha);
             if (!isNaN(parsedDate.getTime())) {
                fechaMatricula = parsedDate.toISOString().split('T')[0];
             }
          }

          const rawEstado = getValue(row, ['ESTADO', 'ESTADO_MATRICULA', 'estado']) || 'ACTIVA';
          const rawCondicion = getValue(row, ['CONDICION', 'condicion']) || 'GRATUITO';
          const rawFormacion = getValue(row, ['FORMACION', 'formacion']) || 'PRESENCIAL';
          const rawOportunidad = getValue(row, ['OPORTUNIDAD_TECNICA', 'Oportunidad', 'oportunidad']) || 'NO';
          const rawObservaciones = getValue(row, ['OBSERVACIONES', 'observaciones']) || null;

          const codMatricula = `${dni}-${String(mId).slice(0,4)}-${String(perId).slice(0,4)}`;

          await withRetry(() =>
            rowDb.insert(matriculas).values({
              codigoMatricula: codMatricula,
              estudianteId: eId,
              sedeId: finalSedeId,
              periodoAcademicoId: perId,
              moduloId: mId,
              seccionId: finalSeccionId,
              fechaMatricula: fechaMatricula,
              estadoMatricula: rawEstado.toString().toUpperCase(),
              condicion: rawCondicion.toString().toUpperCase(),
              formacion: rawFormacion.toString().toUpperCase(),
              oportunidadTecnica: rawOportunidad.toString().toUpperCase(),
              observaciones: rawObservaciones ? String(rawObservaciones) : null
            }).onConflictDoUpdate({
              target: matriculas.codigoMatricula,
              set: {
                moduloId: mId,
                periodoAcademicoId: perId,
                sedeId: finalSedeId,
                seccionId: finalSeccionId,
                estadoMatricula: rawEstado.toString().toUpperCase(),
                condicion: rawCondicion.toString().toUpperCase(),
                formacion: rawFormacion.toString().toUpperCase(),
                oportunidadTecnica: rawOportunidad.toString().toUpperCase(),
                observaciones: rawObservaciones ? String(rawObservaciones) : null
              }
            })
          );
          
          inserted++;
        } catch (err: any) {
          skipReasons.push(`Error DNI ${getValue(row, ['DNI', 'CódigoMatrícula'])}: ${err.message}`);
          skipped++;
        }
      }

    } else if (tipo === 'estudiantes' || tipo === 'personas') {
      const defaultStudentRoleId = roleIdByCode.get('ESTUDIANTE') || allRoles[0]?.id;

      for (let idx = 0; idx < data.length; idx++) {
        const row = data[idx];
        if (!row || Object.keys(row).length === 0) continue;
        const checkDni = getValue(row, ['numero_documento', 'DNI', 'DOCUMENTO', 'NUMERODOCUMENTO']);
        const checkName = getValue(row, ['nombres', 'NOMBRES', 'NOMBRE']);
        if (!checkDni && !checkName) {
          skipped++;
          continue;
        }

        try {
          const rowDb = await getDb();
          const common = getCommonPersonaFields(row);
          
          const pResult = await withRetry(() =>
            rowDb.insert(personas).values(common)
              .onConflictDoUpdate({
                target: personas.numeroDocumento,
                set: common
              })
              .returning()
          );

          if (pResult && pResult.length > 0) {
            const personaId = pResult[0].id;
            
            // Detectar el rol explícito de la columna ROL (por defecto ESTUDIANTE)
            const rolStr = (getValue(row, ['ROL']) || (tipo === 'estudiantes' ? 'ESTUDIANTE' : 'ESTUDIANTE')).toString().toUpperCase().trim();
            
            let rolCodigo = 'ESTUDIANTE';
            let esTrabajador = false;

            if (rolStr.includes('DOCENTE') || rolStr.includes('PROFESOR') || rolStr === 'TRABAJADOR') {
              rolCodigo = 'DOCENTE';
              esTrabajador = true;
            } else if (rolStr.includes('DIRECTOR') || rolStr.includes('DIRECTIV')) {
              rolCodigo = 'DIRECTIVO';
              esTrabajador = true;
            } else if (rolStr.includes('ADMIN') || rolStr.includes('SECRETAR') || rolStr.includes('COORDINADOR') || rolStr.includes('MANTENIMIENTO')) {
              rolCodigo = 'ADMINISTRATIVO';
              esTrabajador = true;
            } else if (rolStr.includes('APODERADO')) {
              rolCodigo = 'APODERADO';
            } else if (rolStr.includes('EGRESADO')) {
              rolCodigo = 'EGRESADO';
            } else {
              rolCodigo = 'ESTUDIANTE';
            }
            
            // Asignar rol
            const targetRoleId = roleIdByCode.get(rolCodigo) || defaultStudentRoleId;
            if (targetRoleId) {
              await withRetry(() =>
                rowDb.insert(personasRoles).values({
                  personaId: personaId,
                  rolPersonaId: targetRoleId,})
                .onConflictDoUpdate({
                  target: [personasRoles.personaId, personasRoles.rolPersonaId],
                  set: {}
                })
              ).catch(() => {});
            }

            if (esTrabajador) {
              await withRetry(() =>
                rowDb.insert(trabajadores).values({
                  personaId: personaId,
                  cargo: rolCodigo,
                  condicion: 'CONTRATADO',})
                .onConflictDoUpdate({
                  target: trabajadores.personaId,
                  set: {}
                })
              );
            } else {
              const trabajaStr = getValue(row, ['TRABAJA', 'trabaja']);
              const trabaja = trabajaStr ? (trabajaStr.toString().toLowerCase() === 'si' || trabajaStr.toString().toLowerCase() === 'sí') : false;
              const ieProcedencia = getValue(row, ['IE_PROCEDENCIA', 'ie_procedencia']) || null;
              const puestoTrabajo = getValue(row, ['PUESTO_TRABAJO', 'puesto_trabajo']) || null;
              const lugarNacimiento = getValue(row, ['LUGAR_NACIMIENTO', 'lugar_nacimiento']) || null;
              const distritoNacimiento = getValue(row, ['DISTRITO_NACIMIENTO', 'distrito_nacimiento']) || null;
              const provinciaNacimiento = getValue(row, ['PROVINCIA_NACIMIENTO', 'provincia_nacimiento']) || null;
              const regionNacimiento = getValue(row, ['REGION_NACIMIENTO', 'region_nacimiento']) || null;
              const paisNacimiento = getValue(row, ['PAIS_NACIMIENTO', 'pais_nacimiento']) || null;
              const telefonoContacto = getValue(row, ['TELEFONO_CONTACTO', 'telefono_contacto']) || null;
              const lenguaOriginaria = getValue(row, ['LENGUA_ORIGINARIA', 'lengua_originaria']) || null;

              await withRetry(() =>
                rowDb.insert(estudiantes).values({
                  personaId: personaId,
                  trabaja,
                  ieProcedencia,
                  puestoTrabajo,
                  lugarNacimiento,
                  distritoNacimiento,
                  provinciaNacimiento,
                  regionNacimiento,
                  paisNacimiento,
                  telefonoContacto,
                  lenguaOriginaria,})
                .onConflictDoUpdate({
                  target: estudiantes.personaId,
                  set: { 
                    trabaja,
                    ieProcedencia,
                    puestoTrabajo,
                    lugarNacimiento,
                    distritoNacimiento,
                    provinciaNacimiento,
                    regionNacimiento,
                    paisNacimiento,
                    telefonoContacto,
                    lenguaOriginaria,}
                })
              );
            }
            inserted++;
          }
        } catch (rowError: any) {
          console.error(`Error importing persona`, rowError);
          skipped++;
          const cause = rowError.cause;
          const errorMsg = (cause?.detail) || (cause?.shortMessage) || (cause?.message) || rowError.message || 'Error desconocido';
          skipReasons.push(`Error en fila ${row.DNI || row.numero_documento || 'desconocida'}: ${errorMsg}`);
        }
      }
    }

    res.json({ message: 'Import completed', count: inserted, skipped, skipReasons: skipReasons.slice(0, 5) });
  } catch (error: any) {
    console.error('Error in import route:', error);
    res.status(500).json({ error: error.message || 'Error executing import' });
  } finally {
    try {
      client.release();
    } catch {}
  }
});

export { router as importRouter };
