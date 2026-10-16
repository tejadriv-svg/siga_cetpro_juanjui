import { Router } from 'express';
import { db } from '../db/index.js';
import { pagos, conceptosPagos, metodosPagos, matriculas, estudiantes, modulos, programas, periodosAcademicos, secciones } from '../db/schema.js';
import { eq, desc } from 'drizzle-orm';

export const tesoreriaRouter = Router();

// Obtener conceptos de pago
tesoreriaRouter.get('/conceptos', async (req, res) => {
  try {
    const allConceptos = await db.select().from(conceptosPagos).orderBy(conceptosPagos.codigo);
    res.json(allConceptos.map(c => {
      const monto = c.montoReferencial ? Number(c.montoReferencial) : 0;
      let categoria: any = 'Otros';
      const cod = c.codigo.toUpperCase();
      if (cod.includes('MAT')) categoria = 'Matrícula';
      else if (cod.includes('CERT') || cod.includes('TIT')) categoria = 'Certificación';
      else if (cod.includes('CON')) categoria = 'Constancias';
      else if (cod.includes('TAL') || cod.includes('CUR')) categoria = 'Talleres';

      return {
        id: c.id,
        codigo: c.codigo,
        nombre: c.concepto || c.codigo,
        concepto: c.concepto,
        montoSugerido: monto,
        montoFijo: monto,
        esMontoLibre: monto === 0,
        estado: c.estado || 'Activo',
        categoria,
        aplicaMora: false
      };
    }));
  } catch (error) {
    console.error('Error fetching conceptosPagos:', error);
    res.status(500).json({ error: 'Error fetching conceptosPagos' });
  }
});

// Crear nuevo concepto de pago (para configuración inicial / TUPA anual)
tesoreriaRouter.post('/conceptos', async (req, res) => {
  try {
    const { codigo, concepto, nombre, montoSugerido, montoReferencial, estado } = req.body;
    const montoVal = montoReferencial !== undefined ? montoReferencial : (montoSugerido !== undefined ? montoSugerido : 0);
    const [nuevo] = await db.insert(conceptosPagos)
      .values({
        codigo: String(codigo || `CP-${Date.now().toString().slice(-4)}`).trim().toUpperCase(),
        concepto: String(concepto || nombre || 'Nuevo Concepto').trim(),
        montoReferencial: Number(montoVal).toFixed(2),
        estado: estado || 'Activo'
      })
      .returning();

    const monto = nuevo.montoReferencial ? Number(nuevo.montoReferencial) : 0;
    res.json({
      id: nuevo.id,
      codigo: nuevo.codigo,
      nombre: nuevo.concepto || nuevo.codigo,
      concepto: nuevo.concepto,
      montoSugerido: monto,
      montoFijo: monto,
      esMontoLibre: monto === 0,
      estado: nuevo.estado,
      categoria: 'Otros',
      aplicaMora: false
    });
  } catch (error) {
    console.error('Error creating conceptoPago:', error);
    res.status(500).json({ error: 'Error creating conceptoPago' });
  }
});

// Actualizar concepto de pago (tasas anuales / edición de TUPA)
tesoreriaRouter.put('/conceptos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { codigo, concepto, nombre, montoSugerido, montoReferencial, estado } = req.body;
    const montoVal = montoReferencial !== undefined ? montoReferencial : montoSugerido;

    const [updated] = await db.update(conceptosPagos)
      .set({
        ...(codigo ? { codigo: String(codigo).trim().toUpperCase() } : {}),
        ...(concepto || nombre ? { concepto: String(concepto || nombre).trim() } : {}),
        ...(montoVal !== undefined ? { montoReferencial: Number(montoVal).toFixed(2) } : {}),
        ...(estado ? { estado } : {})
      })
      .where(eq(conceptosPagos.id, id))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: 'Concepto no encontrado' });
    }

    const monto = updated.montoReferencial ? Number(updated.montoReferencial) : 0;
    res.json({
      id: updated.id,
      codigo: updated.codigo,
      nombre: updated.concepto || updated.codigo,
      concepto: updated.concepto,
      montoSugerido: monto,
      montoFijo: monto,
      esMontoLibre: monto === 0,
      estado: updated.estado,
      categoria: 'Otros',
      aplicaMora: false
    });
  } catch (error) {
    console.error('Error updating conceptoPago:', error);
    res.status(500).json({ error: 'Error updating conceptoPago' });
  }
});

// Obtener recibos / pagos con información de matrícula, programa, módulo y cuotas
tesoreriaRouter.get('/pagos', async (req, res) => {
  try {
    const allPagos = await db.select().from(pagos).orderBy(desc(pagos.fechaPago));
    const allConceptos = await db.select().from(conceptosPagos);
    const allMetodos = await db.select().from(metodosPagos);

    // Obtener información de matrículas para resolver estudiante, persona, programa y módulo
    const allMatriculas = await db
      .select({
        matriculaId: matriculas.id,
        personaId: estudiantes.personaId,
        programaNombre: programas.nombre,
        moduloNombre: modulos.nombre,
        periodoCodigo: periodosAcademicos.codigo,
        seccionNombre: secciones.nombre
      })
      .from(matriculas)
      .innerJoin(estudiantes, eq(matriculas.estudianteId, estudiantes.id))
      .leftJoin(modulos, eq(matriculas.moduloId, modulos.id))
      .leftJoin(programas, eq(modulos.programaId, programas.id))
      .leftJoin(periodosAcademicos, eq(matriculas.periodoAcademicoId, periodosAcademicos.id))
      .leftJoin(secciones, eq(matriculas.seccionId, secciones.id));

    const matMap = new Map(allMatriculas.map(m => [m.matriculaId, m]));

    res.json(allPagos.map(p => {
      const concepto = allConceptos.find(c => c.id === p.conceptoPagoId);
      const metodo = allMetodos.find(m => m.id === p.metodoPagoId);
      const matInfo = p.matriculaId ? matMap.get(p.matriculaId) : undefined;
      let resolvedPersonaId = matInfo?.personaId;
      let cleanObs = p.observaciones || undefined;

      const personaMatch = cleanObs?.match(/\[PERSONA:([a-f0-9-]+)\]/);
      if (personaMatch) {
        resolvedPersonaId = personaMatch[1];
        cleanObs = cleanObs.replace(/\[PERSONA:[a-f0-9-]+\]\s*/g, '').trim() || undefined;
      }

      let glosaDetalle: string | undefined = undefined;
      const glosaMatch = cleanObs?.match(/\[GLOSA:(.*?)\]/);
      if (glosaMatch) {
        glosaDetalle = glosaMatch[1];
        cleanObs = cleanObs.replace(/\[GLOSA:.*?\]\s*/g, '').trim() || undefined;
      }

      let beneficioTipo: any = undefined;
      let beneficioNombre: string | undefined = undefined;
      let montoOriginal: number | undefined = undefined;
      let montoDescuento: number | undefined = undefined;
      let porcentajeDescuento: number | undefined = undefined;
      let documentoSustento: string | undefined = undefined;

      const beneficioMatch = cleanObs?.match(/\[BENEFICIO:(\{.*?\})\]/);
      if (beneficioMatch) {
        try {
          const bData = JSON.parse(beneficioMatch[1]);
          beneficioTipo = bData.tipo;
          beneficioNombre = bData.nombre;
          montoOriginal = bData.orig !== undefined ? Number(bData.orig) : undefined;
          montoDescuento = bData.desc !== undefined ? Number(bData.desc) : undefined;
          porcentajeDescuento = bData.porc !== undefined ? Number(bData.porc) : undefined;
          documentoSustento = bData.sust;
        } catch (e) {}
        cleanObs = cleanObs?.replace(/\[BENEFICIO:\{.*?\}\]\s*/g, '').trim() || undefined;
      }

      if (!resolvedPersonaId) {
        resolvedPersonaId = p.usuarioId || 'uuid-fallback';
      }

      let metodoNombre: any = 'Efectivo';
      if (metodo) {
        if (metodo.metodo.toLowerCase().includes('yape') || metodo.metodo.toLowerCase().includes('plin')) {
          metodoNombre = 'Yape / Plin';
        } else if (metodo.metodo.toLowerCase().includes('depósito') || metodo.metodo.toLowerCase().includes('tran')) {
          metodoNombre = 'Banco de la Nación';
        } else {
          metodoNombre = 'Efectivo';
        }
      }

      return {
        id: p.id,
        numeroRecibo: p.numeroRecibo || p.id.substring(0, 8),
        personaId: resolvedPersonaId,
        matriculaId: p.matriculaId || undefined,
        programaNombre: matInfo?.programaNombre,
        moduloNombre: matInfo?.moduloNombre,
        periodoCodigo: matInfo?.periodoCodigo,
        seccionNombre: matInfo?.seccionNombre,
        glosaDetalle,
        conceptoId: p.conceptoPagoId,
        conceptoNombre: concepto ? concepto.concepto : 'Concepto de Pago',
        monto: Number(p.monto),
        montoTotal: Number(p.montoTotal || p.monto),
        montoPendiente: Number(p.montoPendiente || 0),
        numeroCuota: p.numeroCuota || 1,
        totalCuotas: p.totalCuotas || 1,
        fechaVencimiento: p.fechaVencimiento || undefined,
        pagoPadreId: p.pagoPadreId || undefined,
        metodoPago: metodoNombre,
        numeroOperacion: undefined,
        fechaEmision: p.fechaPago,
        horaEmision: '12:00',
        cajeroNombre: 'Admin',
        estado: p.estado as any,
        observaciones: cleanObs,
        motivoAnulacion: p.motivoAnulacion || undefined,
        beneficioTipo,
        beneficioNombre,
        montoOriginal,
        montoDescuento,
        porcentajeDescuento,
        documentoSustento
      };
    }));
  } catch (error) {
    console.error('Error fetching pagos:', error);
    res.status(500).json({ error: 'Error fetching pagos' });
  }
});

// Crear pago / recibo (Soporta fechaPago histórica manual, cuotas flexibles y glosa de concepto)
tesoreriaRouter.post('/pagos', async (req, res) => {
  try {
    const data = req.body;
    
    // Concepto
    let conceptoId = data.conceptoId;
    if (conceptoId && String(conceptoId).startsWith('cp-')) {
      const dbConceptos = await db.select().from(conceptosPagos).limit(1);
      conceptoId = dbConceptos[0]?.id || 'uuid-fallback';
    }

    // Resolver o recibir matriculaId
    let matriculaId = data.matriculaId || null;
    if (!matriculaId && data.personaId) {
      const matFound = await db
        .select({ id: matriculas.id })
        .from(matriculas)
        .innerJoin(estudiantes, eq(matriculas.estudianteId, estudiantes.id))
        .where(eq(estudiantes.personaId, data.personaId))
        .orderBy(desc(matriculas.fechaMatricula))
        .limit(1);
      matriculaId = matFound[0]?.id || null;
    }

    // Resolver metodoPagoId
    const allMetodos = await db.select().from(metodosPagos);
    let matchedMetodo = allMetodos.find(m => m.metodo.toLowerCase() === 'efectivo');
    if (data.metodoPago === 'Yape / Plin') {
      matchedMetodo = allMetodos.find(m => m.metodo.toLowerCase().includes('yape')) || matchedMetodo;
    } else if (data.metodoPago === 'Banco de la Nación') {
      matchedMetodo = allMetodos.find(m => m.metodo.toLowerCase().includes('depósito') || m.metodo.toLowerCase().includes('tran')) || matchedMetodo;
    }

    const nextNum = Math.floor(1000 + Math.random() * 9000);
    const numeroRecibo = (data.numeroRecibo && String(data.numeroRecibo).trim())
      ? String(data.numeroRecibo).trim()
      : `REC-${new Date().getFullYear()}-${nextNum}`;

    const montoNum = Number(data.monto) || 0;
    const montoTotalNum = Number(data.montoTotal !== undefined ? data.montoTotal : montoNum);
    const montoPendienteNum = Number(data.montoPendiente !== undefined ? data.montoPendiente : Math.max(0, montoTotalNum - montoNum));
    const numeroCuota = Number(data.numeroCuota || 1);
    const totalCuotas = Number(data.totalCuotas || 1);

    // Determinar estado adecuado
    let estado = data.estado || (montoPendienteNum > 0 ? 'Pendiente' : 'Pagado');
    if (!['Pendiente', 'Emitido', 'Pagado', 'Anulado'].includes(estado)) {
      estado = 'Emitido';
    }

    // Observaciones enriquecidas con tags
    let finalObs = data.observaciones ? String(data.observaciones).trim() : null;
    if (data.personaId) {
      finalObs = `[PERSONA:${data.personaId}] ${finalObs || ''}`.trim();
    }
    if (data.glosaDetalle && String(data.glosaDetalle).trim()) {
      finalObs = `[GLOSA:${String(data.glosaDetalle).trim()}] ${finalObs || ''}`.trim();
    }
    if (data.beneficioTipo && data.beneficioTipo !== 'REGULAR') {
      const bPayload = JSON.stringify({
        tipo: data.beneficioTipo,
        nombre: data.beneficioNombre || '',
        orig: data.montoOriginal || montoTotalNum,
        desc: data.montoDescuento || 0,
        porc: data.porcentajeDescuento || 0,
        sust: data.documentoSustento || ''
      });
      finalObs = `[BENEFICIO:${bPayload}] ${finalObs || ''}`.trim();
    }

    // Fecha de pago (permite fecha histórica asignada manualmente)
    const fechaPago = (data.fechaPago && String(data.fechaPago).trim())
      ? String(data.fechaPago).trim()
      : new Date().toISOString().split('T')[0];

    const [nuevoPago] = await db.insert(pagos)
      .values({
        matriculaId: matriculaId || null,
        conceptoPagoId: conceptoId,
        metodoPagoId: matchedMetodo?.id,
        fechaPago,
        numeroRecibo,
        monto: montoNum.toFixed(2),
        montoTotal: montoTotalNum.toFixed(2),
        montoPendiente: montoPendienteNum.toFixed(2),
        numeroCuota,
        totalCuotas,
        fechaVencimiento: data.fechaVencimiento || null,
        pagoPadreId: data.pagoPadreId || null,
        estado,
        observaciones: finalObs,
      })
      .returning();

    // Si este pago amortiza un fraccionamiento existente (pagoPadreId), actualizamos el saldo del padre
    if (nuevoPago.pagoPadreId) {
      const [father] = await db.select().from(pagos).where(eq(pagos.id, nuevoPago.pagoPadreId)).limit(1);
      if (father) {
        const prevPendiente = Number(father.montoPendiente);
        const newFatherPendiente = Math.max(0, prevPendiente - montoNum);
        await db.update(pagos)
          .set({
            montoPendiente: newFatherPendiente.toFixed(2),
            estado: newFatherPendiente <= 0 ? 'Pagado' : 'Pendiente'
          })
          .where(eq(pagos.id, nuevoPago.pagoPadreId));
      }
    }
      
    res.json({
      id: nuevoPago.id,
      numeroRecibo: nuevoPago.numeroRecibo,
      personaId: data.personaId,
      matriculaId: nuevoPago.matriculaId || undefined,
      programaNombre: data.programaNombre,
      moduloNombre: data.moduloNombre,
      periodoCodigo: data.periodoCodigo,
      seccionNombre: data.seccionNombre,
      glosaDetalle: data.glosaDetalle,
      conceptoId: nuevoPago.conceptoPagoId,
      conceptoNombre: data.conceptoNombre || 'Concepto de Pago',
      monto: Number(nuevoPago.monto),
      montoTotal: Number(nuevoPago.montoTotal),
      montoPendiente: Number(nuevoPago.montoPendiente),
      numeroCuota: nuevoPago.numeroCuota,
      totalCuotas: nuevoPago.totalCuotas,
      fechaVencimiento: nuevoPago.fechaVencimiento || undefined,
      pagoPadreId: nuevoPago.pagoPadreId || undefined,
      metodoPago: data.metodoPago || 'Efectivo',
      numeroOperacion: data.numeroOperacion,
      fechaEmision: nuevoPago.fechaPago,
      horaEmision: new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
      cajeroNombre: 'Admin',
      estado: nuevoPago.estado as any,
      observaciones: (nuevoPago.observaciones || '')
        .replace(/\[PERSONA:[a-f0-9-]+\]\s*/g, '')
        .replace(/\[GLOSA:.*?\]\s*/g, '')
        .replace(/\[BENEFICIO:\{.*?\}\]\s*/g, '')
        .trim() || undefined,
      beneficioTipo: data.beneficioTipo || undefined,
      beneficioNombre: data.beneficioNombre || undefined,
      montoOriginal: data.montoOriginal !== undefined ? Number(data.montoOriginal) : undefined,
      montoDescuento: data.montoDescuento !== undefined ? Number(data.montoDescuento) : undefined,
      porcentajeDescuento: data.porcentajeDescuento !== undefined ? Number(data.porcentajeDescuento) : undefined,
      documentoSustento: data.documentoSustento || undefined,
    });
  } catch (error) {
    console.error('Error creating pago:', error);
    res.status(500).json({ error: 'Error creating pago' });
  }
});

// Anular pago
tesoreriaRouter.put('/pagos/:id/anular', async (req, res) => {
  try {
    const { id } = req.params;
    const { motivo } = req.body;
    
    const [updatedPago] = await db.update(pagos)
      .set({
        estado: 'Anulado',
        motivoAnulacion: motivo || 'Anulado administrativamente por caja',
        observaciones: motivo ? `Anulado: ${motivo}` : 'Anulado'
      })
      .where(eq(pagos.id, id))
      .returning();

    res.json({
      id: updatedPago.id,
      estado: updatedPago.estado,
      motivoAnulacion: updatedPago.motivoAnulacion,
      observaciones: updatedPago.observaciones
    });
  } catch (error) {
    console.error('Error annulling pago:', error);
    res.status(500).json({ error: 'Error annulling pago' });
  }
});

// Eliminar pago definitivamente
tesoreriaRouter.delete('/pagos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.delete(pagos).where(eq(pagos.id, id));
    res.json({ success: true, message: 'Pago eliminado exitosamente' });
  } catch (error) {
    console.error('Error deleting pago:', error);
    res.status(500).json({ error: 'Error deleting pago' });
  }
});

