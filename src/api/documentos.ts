import { Router } from 'express';
import { db } from '../db/index.js';
import { documentos, tiposDocumentosArchivos, estudiantes, personas, trabajadores, modulos, programas, auditorias } from '../db/schema.js';
import { eq, and, desc, sql, ilike, or } from 'drizzle-orm';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

export const documentosRouter = Router();

// 1. Configuración de Multer para Carga Segura de Archivos
const uploadDir = path.join(process.cwd(), 'uploads', 'documentos');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const timestamp = Date.now();
    const cleanName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${timestamp}_${cleanName}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB max
});

// Mapa de Tipos de Documentos del Frontend a Códigos de BD
const TIPO_UI_TO_CODIGO: Record<string, string> = {
  'Resolución Directoral': 'DOC-RES-DIR',
  'Convenio Institucional': 'DOC-CONVENIO',
  'Proyecto Curricular (PCI)': 'DOC-RES-DIR',
  'Plan Anual de Trabajo (PAT)': 'DOC-RES-DIR',
  'Certificado Modular': 'DOC-CERT-MOD',
  'Constancia de Estudios': 'DOC-CONST-EST',
  'Constancia de Egresado': 'DOC-CONST-EST',
  'Ficha de Matrícula': 'DOC-FICHA-MAT',
  'Acta Consolidada': 'DOC-ACTA-EVAL',
  'Oficio / Memorándum': 'DOC-OFICIO',
};

const CODIGO_TO_TIPO_UI: Record<string, string> = {
  'DOC-RES-DIR': 'Resolución Directoral',
  'DOC-CONVENIO': 'Convenio Institucional',
  'DOC-CERT-MOD': 'Certificado Modular',
  'DOC-CONST-EST': 'Constancia de Estudios',
  'DOC-FICHA-MAT': 'Ficha de Matrícula',
  'DOC-ACTA-EVAL': 'Acta Consolidada',
  'DOC-MEMO': 'Oficio / Memorándum',
  'DOC-OFICIO': 'Oficio / Memorándum',
  'DOC-CERT-EST': 'Certificado de Estudios',
  'DOC-TITULO': 'Título / Acta de Titulación Profesional',
};

// Generador de correlativo oficial
async function generarCorrelativoOficial(tipoUi: string): Promise<string> {
  const anio = new Date().getFullYear();
  const countRes = await db.select({ count: sql<number>`count(*)` }).from(documentos);
  const nextNum = (Number(countRes[0]?.count || 0) + 1).toString().padStart(4, '0');

  switch (tipoUi) {
    case 'Resolución Directoral':
    case 'Proyecto Curricular (PCI)':
    case 'Plan Anual de Trabajo (PAT)':
      return `RD N° ${nextNum}-${anio}-CETPRO-JJ`;
    case 'Certificado Modular':
      return `CERT-MOD-${anio}-${nextNum}`;
    case 'Constancia de Estudios':
    case 'Constancia de Egresado':
      return `CONST-EST-${anio}-${nextNum}`;
    case 'Ficha de Matrícula':
      return `FICHA-MAT-${anio}-${nextNum}`;
    case 'Convenio Institucional':
      return `CONV-INT-${anio}-${nextNum}`;
    case 'Oficio / Memorándum':
      return `OFICIO N° ${nextNum}-${anio}-CETPRO-JJ/DG`;
    case 'Acta Consolidada':
      return `ACTA-MOD-${anio}-${nextNum}`;
    default:
      return `DOC-OF-${anio}-${nextNum}`;
  }
}

// -------------------------------------------------------------
// 1. GET /api/documentos (Lista completa con filtros y joins)
// -------------------------------------------------------------
documentosRouter.get('/', async (req, res) => {
  try {
    const { tipo, estado, estudianteId, search } = req.query;

    const rows = await db
      .select({
        id: documentos.id,
        tipoDocumentoId: documentos.tipoDocumentoId,
        tipoCodigo: tiposDocumentosArchivos.codigo,
        tipoNombre: tiposDocumentosArchivos.nombre,
        numeroDocumento: documentos.numeroDocumento,
        titulo: documentos.titulo,
        entidadEmisora: documentos.entidadEmisora,
        destinatario: documentos.destinatario,
        fechaEmision: documentos.fechaEmision,
        estado: documentos.estado,
        tomoFolio: documentos.tomoFolio,
        codigoVerificacionQr: documentos.codigoVerificacionQr,
        estudianteId: documentos.estudianteId,
        trabajadorId: documentos.trabajadorId,
        programaId: documentos.programaId,
        moduloId: documentos.moduloId,
        periodoAcademicoId: documentos.periodoAcademicoId,
        confidencialidad: documentos.confidencialidad,
        nombreArchivo: documentos.nombreArchivo,
        rutaStorage: documentos.rutaStorage,
        mimeType: documentos.mimeType,
        tamanoBytes: documentos.tamanoBytes,
        hashArchivo: documentos.hashArchivo,
        fechaCarga: documentos.fechaCarga,
        observaciones: documentos.observaciones,
        // Estudiante datos
        estudianteDni: personas.numeroDocumento,
        estudianteNombre: personas.nombres,
        estudiantePaterno: personas.apellidoPaterno,
        estudianteMaterno: personas.apellidoMaterno,
      })
      .from(documentos)
      .leftJoin(tiposDocumentosArchivos, eq(documentos.tipoDocumentoId, tiposDocumentosArchivos.id))
      .leftJoin(estudiantes, eq(documentos.estudianteId, estudiantes.id))
      .leftJoin(personas, eq(estudiantes.personaId, personas.id))
      .orderBy(desc(documentos.fechaCarga));

    // Mapear al modelo DocumentoOficial requerido por la interfaz
    const result = rows.map((r) => {
      const tipoUi = (r.tipoCodigo && CODIGO_TO_TIPO_UI[r.tipoCodigo]) || r.tipoNombre || 'Documento Oficial';
      const fileUrl = r.rutaStorage
        ? (r.rutaStorage.startsWith('http') ? r.rutaStorage : `/uploads/documentos/${path.basename(r.rutaStorage)}`)
        : undefined;

      return {
        id: r.id,
        tipoDocumentoId: r.tipoDocumentoId,
        tipo: tipoUi,
        numeroDocumento: r.numeroDocumento || '',
        titulo: r.titulo || '',
        entidadEmisora: r.entidadEmisora || 'CETPRO Juanjuí',
        destinatario: r.destinatario || (r.estudianteNombre ? `${r.estudiantePaterno || ''} ${r.estudianteMaterno || ''}, ${r.estudianteNombre}`.trim() : ''),
        fechaEmision: r.fechaEmision ? r.fechaEmision.toString() : new Date().toISOString().split('T')[0],
        estado: r.estado || 'EMITIDO',
        tomoFolio: r.tomoFolio || 'Archivo Central',
        codigoVerificacionQR: r.codigoVerificacionQr || '',
        codigoVerificacionQr: r.codigoVerificacionQr || '',
        estudianteId: r.estudianteId || undefined,
        trabajadorId: r.trabajadorId || undefined,
        programaId: r.programaId || undefined,
        moduloId: r.moduloId || undefined,
        periodoAcademicoId: r.periodoAcademicoId || undefined,
        confidencialidad: r.confidencialidad || 'PUBLICO',
        archivoUrl: fileUrl,
        nombreArchivo: r.nombreArchivo || undefined,
        rutaStorage: r.rutaStorage || undefined,
        mimeType: r.mimeType || undefined,
        tamanoBytes: r.tamanoBytes || undefined,
        hashArchivo: r.hashArchivo || undefined,
        observaciones: r.observaciones || '',
      };
    });

    res.json(result);
  } catch (error: any) {
    console.error('Error al listar documentos:', error);
    res.status(500).json({ error: 'Error al listar documentos oficiales', details: error.message });
  }
});

// -------------------------------------------------------------
// 2. GET /api/documentos/validar/:codigo (Público para QR)
// -------------------------------------------------------------
documentosRouter.get('/validar/:codigo', async (req, res) => {
  try {
    const { codigo } = req.params;
    const cleanCodigo = decodeURIComponent(codigo);

    const rows = await db
      .select({
        id: documentos.id,
        numeroDocumento: documentos.numeroDocumento,
        titulo: documentos.titulo,
        entidadEmisora: documentos.entidadEmisora,
        destinatario: documentos.destinatario,
        fechaEmision: documentos.fechaEmision,
        estado: documentos.estado,
        tomoFolio: documentos.tomoFolio,
        codigoVerificacionQr: documentos.codigoVerificacionQr,
        tipoNombre: tiposDocumentosArchivos.nombre,
        tipoCodigo: tiposDocumentosArchivos.codigo,
        hashArchivo: documentos.hashArchivo,
        estudianteDni: personas.numeroDocumento,
        estudianteNombre: personas.nombres,
        estudiantePaterno: personas.apellidoPaterno,
      })
      .from(documentos)
      .leftJoin(tiposDocumentosArchivos, eq(documentos.tipoDocumentoId, tiposDocumentosArchivos.id))
      .leftJoin(estudiantes, eq(documentos.estudianteId, estudiantes.id))
      .leftJoin(personas, eq(estudiantes.personaId, personas.id))
      .where(or(
        eq(documentos.numeroDocumento, cleanCodigo),
        ilike(documentos.codigoVerificacionQr, `%${cleanCodigo}%`)
      ))
      .limit(1);

    if (rows.length === 0) {
      return res.status(404).json({
        valido: false,
        mensaje: 'El documento no fue encontrado en los registros oficiales del CETPRO Juanjuí o el código es inválido.'
      });
    }

    const doc = rows[0];
    res.json({
      valido: doc.estado !== 'ANULADO',
      institucion: 'CENTRO DE EDUCACIÓN TÉCNICO PRODUCTIVA JUANJUÍ',
      dre: 'DIRECCIÓN REGIONAL DE EDUCACIÓN DE SAN MARTÍN',
      ugel: 'UGEL MARISCAL CÁCERES - JUANJUÍ',
      documento: {
        tipo: doc.tipoNombre,
        numero: doc.numeroDocumento,
        asunto: doc.titulo,
        titular: doc.destinatario || (doc.estudianteNombre ? `${doc.estudiantePaterno} ${doc.estudianteNombre}` : '---'),
        fechaEmision: doc.fechaEmision,
        estado: doc.estado,
        custodiaFisica: doc.tomoFolio,
        hashSeguridad: doc.hashArchivo || 'HASH-VALIDADO-OFICIAL',
      }
    });
  } catch (error: any) {
    console.error('Error al validar documento:', error);
    res.status(500).json({ error: 'Error al verificar autenticidad del documento' });
  }
});

// -------------------------------------------------------------
// 3. POST /api/documentos (Emisión y Registro Oficial)
// -------------------------------------------------------------
documentosRouter.post('/', async (req, res) => {
  try {
    const {
      tipo,
      numeroDocumento: customNumero,
      titulo,
      entidadEmisora,
      destinatario,
      fechaEmision,
      estado = 'EMITIDO',
      tomoFolio,
      estudianteId,
      trabajadorId,
      programaId,
      moduloId,
      periodoAcademicoId,
      confidencialidad = 'PUBLICO',
      archivoUrl,
      nombreArchivo,
      rutaStorage,
      mimeType,
      tamanoBytes,
      hashArchivo,
      observaciones,
      usuarioId
    } = req.body;

    // 1. Resolver tipo_documento_id
    let tipoId: string | null = null;
    const targetCodigo = TIPO_UI_TO_CODIGO[tipo] || 'DOC-OFICIO';
    const tipoRows = await db
      .select({ id: tiposDocumentosArchivos.id })
      .from(tiposDocumentosArchivos)
      .where(eq(tiposDocumentosArchivos.codigo, targetCodigo))
      .limit(1);

    if (tipoRows.length > 0) {
      tipoId = tipoRows[0].id;
    } else {
      const fallback = await db.select({ id: tiposDocumentosArchivos.id }).from(tiposDocumentosArchivos).limit(1);
      tipoId = fallback[0]?.id;
    }

    if (!tipoId) {
      return res.status(400).json({ error: 'No se encontró un tipo de documento válido en el catálogo.' });
    }

    // 2. Correlativo Oficial
    const numeroFinal = customNumero?.trim() ? customNumero.trim() : await generarCorrelativoOficial(tipo || 'Documento');
    const hash = crypto.randomBytes(6).toString('hex');
    const qrUrl = `https://siga.cetprojuanjui.edu.pe/validar?doc=${encodeURIComponent(numeroFinal)}&hash=${hash}`;

    const [inserted] = await db.insert(documentos).values({
      tipoDocumentoId: tipoId,
      numeroDocumento: numeroFinal,
      titulo: titulo || `${tipo} N° ${numeroFinal}`,
      entidadEmisora: entidadEmisora || 'CENTRO DE EDUCACIÓN TÉCNICO PRODUCTIVA JUANJUÍ',
      destinatario: destinatario || null,
      fechaEmision: fechaEmision || new Date().toISOString().split('T')[0],
      estado,
      tomoFolio: tomoFolio || 'Tomo 01, Folio 01, Archivo Central',
      codigoVerificacionQr: qrUrl,
      estudianteId: estudianteId || null,
      trabajadorId: trabajadorId || null,
      programaId: programaId || null,
      moduloId: moduloId || null,
      periodoAcademicoId: periodoAcademicoId || null,
      confidencialidad,
      nombreArchivo: nombreArchivo || null,
      rutaStorage: rutaStorage || archivoUrl || null,
      mimeType: mimeType || null,
      tamanoBytes: tamanoBytes || null,
      hashArchivo: hashArchivo || hash,
      usuarioId: usuarioId || null,
      observaciones: observaciones || null,
    }).returning();

    // 3. Registrar auditoría institucional
    try {
      await db.insert(auditorias).values({
        usuarioId: usuarioId || null,
        accion: 'EMISION_DOCUMENTO_OFICIAL',
        tabla: 'documentos',
        registroId: inserted.id,
        datosNuevos: {
          numeroDocumento: numeroFinal,
          tipo,
          titulo: inserted.titulo
        },
      });
    } catch (audErr) {
      console.warn('No se pudo registrar auditoria:', audErr);
    }

    res.status(201).json({
      ...inserted,
      tipo,
      codigoVerificacionQR: inserted.codigoVerificacionQr,
      archivoUrl: inserted.rutaStorage
    });
  } catch (error: any) {
    console.error('Error al emitir documento oficial:', error);
    res.status(500).json({ error: 'Error al emitir documento oficial', details: error.message });
  }
});

// -------------------------------------------------------------
// 4. POST /api/documentos/upload (Subida de Archivos con Multer)
// -------------------------------------------------------------
documentosRouter.post('/upload', upload.single('archivo'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'No se recibió ningún archivo para cargar.' });
    }

    // Calcular hash SHA-256 del archivo físico
    const fileBuffer = fs.readFileSync(file.path);
    const hashSum = crypto.createHash('sha256');
    hashSum.update(fileBuffer);
    const hexHash = hashSum.digest('hex');

    const relativePath = `/uploads/documentos/${file.filename}`;

    res.json({
      success: true,
      nombreArchivo: file.originalname,
      rutaStorage: relativePath,
      archivoUrl: relativePath,
      mimeType: file.mimetype,
      tamanoBytes: file.size,
      hashArchivo: hexHash,
      mensaje: 'Archivo cargado con éxito y hash SHA-256 generado.'
    });
  } catch (error: any) {
    console.error('Error al subir archivo:', error);
    res.status(500).json({ error: 'Error al procesar archivo', details: error.message });
  }
});

// -------------------------------------------------------------
// 5. PUT /api/documentos/:id (Actualizar Metadatos o Estado)
// -------------------------------------------------------------
documentosRouter.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      titulo,
      destinatario,
      fechaEmision,
      estado,
      tomoFolio,
      confidencialidad,
      observaciones,
      archivoUrl,
      nombreArchivo,
      tamanoBytes,
      hashArchivo,
      usuarioId
    } = req.body;

    const [updated] = await db
      .update(documentos)
      .set({
        titulo,
        destinatario,
        fechaEmision,
        estado,
        tomoFolio,
        confidencialidad,
        observaciones,
        rutaStorage: archivoUrl || undefined,
        nombreArchivo: nombreArchivo || undefined,
        tamanoBytes: tamanoBytes || undefined,
        hashArchivo: hashArchivo || undefined,
        fechaActualizacion: sql`CURRENT_TIMESTAMP`,
      })
      .where(eq(documentos.id, id))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: 'Documento no encontrado.' });
    }

    try {
      await db.insert(auditorias).values({
        usuarioId: usuarioId || null,
        accion: 'ACTUALIZAR_DOCUMENTO',
        tabla: 'documentos',
        registroId: id,
        datosNuevos: { documentoId: id, estado, tomoFolio },
      });
    } catch {}

    res.json(updated);
  } catch (error: any) {
    console.error('Error al actualizar documento:', error);
    res.status(500).json({ error: 'Error al actualizar documento', details: error.message });
  }
});

// -------------------------------------------------------------
// 6. DELETE /api/documentos/:id (Eliminación o Anulación Segura)
// -------------------------------------------------------------
documentosRouter.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { motivo, usuarioId } = req.body || {};

    const [deleted] = await db
      .delete(documentos)
      .where(eq(documentos.id, id))
      .returning();

    if (!deleted) {
      return res.status(404).json({ error: 'Documento no encontrado.' });
    }

    try {
      await db.insert(auditorias).values({
        usuarioId: usuarioId || null,
        accion: 'ELIMINAR_DOCUMENTO',
        tabla: 'documentos',
        registroId: id,
        datosAnteriores: {
          documentoId: id,
          numeroDocumento: deleted.numeroDocumento,
          motivo: motivo || 'Eliminación manual por administración'
        },
      });
    } catch {}

    res.json({ success: true, message: 'Documento eliminado exitosamente.' });
  } catch (error: any) {
    console.error('Error al eliminar documento:', error);
    res.status(500).json({ error: 'Error al eliminar documento', details: error.message });
  }
});
