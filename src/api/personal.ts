import { Router } from 'express';
import { db } from '../db/index.js';
import { asistenciasTrabajadores, trabajadores, personas } from '../db/schema.js';
import { eq, and, gte, lte, desc } from 'drizzle-orm';

export const personalRouter = Router();

// ==========================================
// 1. GET /api/personal/asistencias
// Consulta asistencias por fecha, mes o trabajador
// ==========================================
personalRouter.get('/asistencias', async (req, res) => {
  try {
    const { fecha, mes, anio, trabajadorId } = req.query;

    const conditions = [];

    if (fecha && typeof fecha === 'string') {
      conditions.push(eq(asistenciasTrabajadores.fecha, fecha));
    } else if (mes && anio) {
      const m = parseInt(mes as string, 10);
      const y = parseInt(anio as string, 10);
      const startDate = `${y}-${m.toString().padStart(2, '0')}-01`;
      const lastDay = new Date(y, m, 0).getDate();
      const endDate = `${y}-${m.toString().padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`;
      conditions.push(gte(asistenciasTrabajadores.fecha, startDate));
      conditions.push(lte(asistenciasTrabajadores.fecha, endDate));
    }

    if (trabajadorId && typeof trabajadorId === 'string') {
      conditions.push(eq(asistenciasTrabajadores.trabajadorId, trabajadorId));
    }

    const records = await db
      .select({
        asistencia: asistenciasTrabajadores,
        trabajador: trabajadores,
        persona: personas
      })
      .from(asistenciasTrabajadores)
      .innerJoin(trabajadores, eq(asistenciasTrabajadores.trabajadorId, trabajadores.id))
      .innerJoin(personas, eq(trabajadores.personaId, personas.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(asistenciasTrabajadores.fecha));

    res.json(records.map(r => ({
      id: r.asistencia.id,
      trabajadorId: r.asistencia.trabajadorId,
      fecha: r.asistencia.fecha,
      horaEntrada: r.asistencia.horaEntrada,
      horaSalida: r.asistencia.horaSalida,
      estadoAsistencia: r.asistencia.estadoAsistencia || 'PRESENTE',
      observacion: r.asistencia.observacion,
      usuarioId: r.asistencia.usuarioId,
      minutosTardanza: r.asistencia.minutosTardanza || 0,
      tipoRegistro: r.asistencia.tipoRegistro || 'MANUAL',
      nombres: r.persona.nombres,
      apellidoPaterno: r.persona.apellidoPaterno,
      apellidoMaterno: r.persona.apellidoMaterno || '',
      numeroDocumento: r.persona.numeroDocumento,
      cargo: r.trabajador.cargo || 'DOCENTE',
      condicion: r.trabajador.condicion || 'Nombrado(a)'
    })));
  } catch (error: any) {
    console.error('Error fetching asistencias_trabajadores:', error);
    res.status(500).json({ error: 'Error al obtener asistencias del personal', details: error.message });
  }
});

// ==========================================
// 2. POST /api/personal/asistencias/batch
// Guardado en lote diario (Panel Administrativo)
// ==========================================
personalRouter.post('/asistencias/batch', async (req, res) => {
  try {
    const { fecha, registros, usuarioId } = req.body;

    if (!fecha || !Array.isArray(registros) || registros.length === 0) {
      return res.status(400).json({ error: 'Parámetros incompletos (fecha y registros son requeridos)' });
    }

    const savedResults = [];

    for (const item of registros) {
      const {
        trabajadorId,
        horaEntrada,
        horaSalida,
        estadoAsistencia,
        observacion,
        minutosTardanza,
        tipoRegistro
      } = item;

      if (!trabajadorId) continue;

      const whereClause = and(
        eq(asistenciasTrabajadores.trabajadorId, trabajadorId),
        eq(asistenciasTrabajadores.fecha, fecha)
      );

      const existing = await db
        .select({ id: asistenciasTrabajadores.id })
        .from(asistenciasTrabajadores)
        .where(whereClause)
        .limit(1);

      if (existing.length > 0) {
        const [updated] = await db
          .update(asistenciasTrabajadores)
          .set({
            horaEntrada: horaEntrada || null,
            horaSalida: horaSalida || null,
            estadoAsistencia: estadoAsistencia || 'PRESENTE',
            observacion: observacion || null,
            minutosTardanza: typeof minutosTardanza === 'number' ? minutosTardanza : 0,
            tipoRegistro: tipoRegistro || 'MANUAL',
            usuarioId: usuarioId || null
          })
          .where(eq(asistenciasTrabajadores.id, existing[0].id))
          .returning();
        savedResults.push(updated);
      } else {
        const [created] = await db
          .insert(asistenciasTrabajadores)
          .values({
            trabajadorId,
            fecha,
            horaEntrada: horaEntrada || null,
            horaSalida: horaSalida || null,
            estadoAsistencia: estadoAsistencia || 'PRESENTE',
            observacion: observacion || null,
            minutosTardanza: typeof minutosTardanza === 'number' ? minutosTardanza : 0,
            tipoRegistro: tipoRegistro || 'MANUAL',
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
    console.error('Error saving batch asistencias trabajadores:', error);
    res.status(500).json({ error: 'Error al guardar asistencias del personal', details: error.message });
  }
});

// ==========================================
// 3. POST /api/personal/asistencias/marcar-dni
// Marcación rápida interactiva (Terminal Kiosco)
// ==========================================
personalRouter.post('/asistencias/marcar-dni', async (req, res) => {
  try {
    const { dni, usuarioId } = req.body;

    if (!dni || typeof dni !== 'string' || dni.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'DNI no ingresado o inválido' });
    }

    const cleanDni = dni.trim();

    // 1. Buscar persona por DNI
    const [personaEncontrada] = await db
      .select()
      .from(personas)
      .where(eq(personas.numeroDocumento, cleanDni))
      .limit(1);

    if (!personaEncontrada) {
      return res.status(404).json({
        success: false,
        message: `No se encontró personal registrado con DNI ${cleanDni}.`
      });
    }

    // 2. Buscar trabajador activo
    const [trabajador] = await db
      .select()
      .from(trabajadores)
      .where(and(eq(trabajadores.personaId, personaEncontrada.id), eq(trabajadores.estado, 'Activo')))
      .limit(1);

    if (!trabajador) {
      return res.status(404).json({
        success: false,
        message: `${personaEncontrada.nombres} ${personaEncontrada.apellidoPaterno} no figura como trabajador activo.`
      });
    }

    // 3. Obtener fecha y hora local del servidor
    const now = new Date();
    // Obtener formato YYYY-MM-DD local
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const fechaHoy = `${yyyy}-${mm}-${dd}`;

    // Obtener formato HH:mm:ss
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();
    const horaActual = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    // 4. Verificar si ya existe registro hoy
    const [existing] = await db
      .select()
      .from(asistenciasTrabajadores)
      .where(and(
        eq(asistenciasTrabajadores.trabajadorId, trabajador.id),
        eq(asistenciasTrabajadores.fecha, fechaHoy)
      ))
      .limit(1);

    const nombreCompleto = `${personaEncontrada.apellidoPaterno} ${personaEncontrada.apellidoMaterno || ''}, ${personaEncontrada.nombres}`.trim();
    const cargo = trabajador.cargo || 'Docente';

    // Regla de tardanza: ingreso después de 08:00 con 10 min de tolerancia (08:10)
    let estadoCalculado = 'PRESENTE';
    let minutosTardanza = 0;
    if (hours > 8 || (hours === 8 && minutes > 10)) {
      estadoCalculado = 'TARDANZA';
      minutosTardanza = (hours - 8) * 60 + (minutes - 10);
    }

    if (!existing) {
      // Registrar ENTRADA
      const [nuevo] = await db
        .insert(asistenciasTrabajadores)
        .values({
          trabajadorId: trabajador.id,
          fecha: fechaHoy,
          horaEntrada: horaActual,
          estadoAsistencia: estadoCalculado,
          minutosTardanza,
          tipoRegistro: 'SISTEMA_DNI',
          usuarioId: usuarioId || null
        })
        .returning();

      return res.json({
        success: true,
        tipo: 'ENTRADA',
        hora: horaActual,
        fecha: fechaHoy,
        trabajador: {
          id: trabajador.id,
          dni: cleanDni,
          nombreCompleto,
          cargo,
          condicion: trabajador.condicion || 'Nombrado(a)'
        },
        estadoAsistencia: estadoCalculado,
        minutosTardanza,
        message: `¡Bienvenido(a)! Entrada registrada a las ${horaActual}`
      });
    }

    if (!existing.horaSalida) {
      // Registrar SALIDA
      const [actualizado] = await db
        .update(asistenciasTrabajadores)
        .set({
          horaSalida: horaActual,
          tipoRegistro: 'SISTEMA_DNI'
        })
        .where(eq(asistenciasTrabajadores.id, existing.id))
        .returning();

      return res.json({
        success: true,
        tipo: 'SALIDA',
        hora: horaActual,
        horaEntrada: existing.horaEntrada,
        fecha: fechaHoy,
        trabajador: {
          id: trabajador.id,
          dni: cleanDni,
          nombreCompleto,
          cargo,
          condicion: trabajador.condicion || 'Nombrado(a)'
        },
        estadoAsistencia: existing.estadoAsistencia,
        minutosTardanza: existing.minutosTardanza,
        message: `¡Hasta luego! Salida registrada a las ${horaActual}`
      });
    }

    // Si ya tenía entrada y salida, actualizamos la salida
    const [actualizado] = await db
      .update(asistenciasTrabajadores)
      .set({
        horaSalida: horaActual
      })
      .where(eq(asistenciasTrabajadores.id, existing.id))
      .returning();

    return res.json({
      success: true,
      tipo: 'SALIDA_ACTUALIZADA',
      hora: horaActual,
      horaEntrada: existing.horaEntrada,
      fecha: fechaHoy,
      trabajador: {
        id: trabajador.id,
        dni: cleanDni,
        nombreCompleto,
        cargo,
        condicion: trabajador.condicion || 'Nombrado(a)'
      },
      estadoAsistencia: existing.estadoAsistencia,
      minutosTardanza: existing.minutosTardanza,
      message: `Salida actualizada a las ${horaActual}`
    });

  } catch (error: any) {
    console.error('Error en marcación rápida por DNI:', error);
    res.status(500).json({ success: false, message: 'Error en el servidor al registrar marcación', details: error.message });
  }
});

// ==========================================
// 4. GET /api/personal/asistencias/reporte-mensual
// Consolidado mensual para UGEL (Parte Mensual)
// ==========================================
personalRouter.get('/asistencias/reporte-mensual', async (req, res) => {
  try {
    const { mes, anio } = req.query;

    const m = mes ? parseInt(mes as string, 10) : (new Date().getMonth() + 1);
    const y = anio ? parseInt(anio as string, 10) : new Date().getFullYear();

    const startDate = `${y}-${m.toString().padStart(2, '0')}-01`;
    const lastDay = new Date(y, m, 0).getDate();
    const endDate = `${y}-${m.toString().padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`;

    // Obtener todos los trabajadores activos
    const allTrabajadores = await db
      .select({
        trabajador: trabajadores,
        persona: personas
      })
      .from(trabajadores)
      .innerJoin(personas, eq(trabajadores.personaId, personas.id))
      .where(eq(trabajadores.estado, 'Activo'));

    // Obtener todas las asistencias del mes
    const monthAsistencias = await db
      .select()
      .from(asistenciasTrabajadores)
      .where(and(
        gte(asistenciasTrabajadores.fecha, startDate),
        lte(asistenciasTrabajadores.fecha, endDate)
      ));

    // Consolidar por trabajador
    const reporte = allTrabajadores.map(({ trabajador, persona }) => {
      const asistenciasTrab = monthAsistencias.filter(a => a.trabajadorId === trabajador.id);

      const diasLaborados = asistenciasTrab.filter(a =>
        a.estadoAsistencia === 'PRESENTE' || a.estadoAsistencia === 'TARDANZA' || a.estadoAsistencia === 'COMISION'
      ).length;

      const tardanzas = asistenciasTrab.filter(a => a.estadoAsistencia === 'TARDANZA').length;
      const minutosTardanza = asistenciasTrab.reduce((sum, a) => sum + (a.minutosTardanza || 0), 0);
      const faltasInjustificadas = asistenciasTrab.filter(a => a.estadoAsistencia === 'FALTA_INJUSTIFICADA').length;
      const faltasJustificadas = asistenciasTrab.filter(a => a.estadoAsistencia === 'FALTA_JUSTIFICADA').length;
      const permisos = asistenciasTrab.filter(a => a.estadoAsistencia === 'PERMISO').length;
      const licencias = asistenciasTrab.filter(a => a.estadoAsistencia === 'LICENCIA').length;
      const comisiones = asistenciasTrab.filter(a => a.estadoAsistencia === 'COMISION').length;

      return {
        trabajadorId: trabajador.id,
        nombres: persona.nombres,
        apellidos: `${persona.apellidoPaterno} ${persona.apellidoMaterno || ''}`.trim(),
        numeroDocumento: persona.numeroDocumento,
        cargo: trabajador.cargo || 'DOCENTE',
        condicion: trabajador.condicion || 'Nombrado(a)',
        diasLaborados,
        tardanzas,
        minutosTardanza,
        faltasInjustificadas,
        faltasJustificadas,
        permisos,
        licencias,
        comisiones
      };
    });

    res.json(reporte);
  } catch (error: any) {
    console.error('Error generando reporte mensual de personal:', error);
    res.status(500).json({ error: 'Error al generar reporte mensual', details: error.message });
  }
});
