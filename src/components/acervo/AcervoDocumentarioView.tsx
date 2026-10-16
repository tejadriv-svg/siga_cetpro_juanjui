import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { DocumentoOficial, TipoDocumentoOficial, EstadoDocumento, ConfidencialidadDocumento } from '../../types';
import { Badge } from '../common/Badge';
import * as XLSX from 'xlsx';
import {
  FolderArchive,
  PlusCircle,
  Search,
  FileText,
  Building,
  Calendar,
  QrCode,
  CheckCircle2,
  BookOpen,
  Scroll,
  FileCheck2,
  Trash2,
  Edit,
  X,
  Printer,
  ExternalLink,
  ShieldCheck,
  Download,
  FileSpreadsheet,
  UploadCloud,
  FileDown,
  Copy,
  Check,
  Lock,
  Eye,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export const AcervoDocumentarioView: React.FC = () => {
  const {
    documentosOficiales,
    addDocumentoAcervo,
    updateDocumentoOficial,
    deleteDocumentoOficial,
    uploadDocumentoArchivo,
    addToast,
    institucion,
    currentUser,
  } = useApp();

  const [search, setSearch] = useState('');
  const [selectedTipo, setSelectedTipo] = useState<string>('TODOS');
  const [selectedEstado, setSelectedEstado] = useState<string>('TODOS');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<DocumentoOficial | null>(null);
  const [selectedDocPreview, setSelectedDocPreview] = useState<DocumentoOficial | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Paginación y límite de visualización (10 más recientes por defecto)
  const [limitCount, setLimitCount] = useState<number | 'ALL'>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formDoc, setFormDoc] = useState({
    tipo: 'Resolución Directoral' as TipoDocumentoOficial,
    numeroDocumento: '',
    titulo: '',
    fechaEmision: new Date().toISOString().split('T')[0],
    estado: 'EMITIDO' as EstadoDocumento,
    confidencialidad: 'PUBLICO' as ConfidencialidadDocumento,
    tomoFolio: 'Tomo 01, Folio 01, Archivo Central',
    entidadEmisora: 'CETPRO Juanjuí',
    destinatario: '',
    observaciones: '',
    archivoUrl: '',
    nombreArchivo: '',
    tamanoBytes: 0,
    hashArchivo: '',
  });

  const tiposDisponibles: TipoDocumentoOficial[] = [
    'Resolución Directoral',
    'Convenio Institucional',
    'Proyecto Curricular (PCI)',
    'Plan Anual de Trabajo (PAT)',
    'Certificado Modular',
    'Constancia de Estudios',
    'Constancia de Egresado',
    'Ficha de Matrícula',
    'Acta Consolidada',
    'Oficio / Memorándum',
  ];

  const filteredDocs = useMemo(() => {
    return documentosOficiales
      .filter((d) => {
        const s = search.toLowerCase();
        const matchSearch =
          (d.numeroDocumento || '').toLowerCase().includes(s) ||
          (d.titulo || '').toLowerCase().includes(s) ||
          (d.tipo || '').toLowerCase().includes(s) ||
          (d.entidadEmisora || '').toLowerCase().includes(s) ||
          (d.destinatario || '').toLowerCase().includes(s) ||
          (d.tomoFolio || '').toLowerCase().includes(s);

        if (!matchSearch) return false;
        if (selectedTipo !== 'TODOS' && d.tipo !== selectedTipo) return false;
        if (selectedEstado !== 'TODOS' && d.estado !== selectedEstado) return false;

        return true;
      })
      .sort((a, b) => {
        const dateA = a.fechaEmision || (a as any).createdAt || '';
        const dateB = b.fechaEmision || (b as any).createdAt || '';
        if (dateB && dateA) return dateB.localeCompare(dateA);
        return (b.id || '').localeCompare(a.id || '');
      });
  }, [documentosOficiales, search, selectedTipo, selectedEstado]);

  // Reset a la página 1 cuando cambian los filtros o el límite
  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedTipo, selectedEstado, limitCount]);

  // Paginación y documentos mostrados
  const totalDocsCount = filteredDocs.length;
  const pageSize = limitCount === 'ALL' ? totalDocsCount : limitCount;
  const totalPages = Math.max(1, Math.ceil(totalDocsCount / (pageSize || 1)));
  const effectivePage = Math.min(currentPage, totalPages);
  const displayedDocs = useMemo(() => {
    if (limitCount === 'ALL') return filteredDocs;
    const start = (effectivePage - 1) * pageSize;
    return filteredDocs.slice(start, start + pageSize);
  }, [filteredDocs, limitCount, effectivePage, pageSize]);

  // Métricas
  const totalCount = documentosOficiales.length;
  const rdCount = documentosOficiales.filter((d) => d.tipo === 'Resolución Directoral').length;
  const conveniosCount = documentosOficiales.filter((d) => d.tipo === 'Convenio Institucional').length;
  const planesCount = documentosOficiales.filter(
    (d) => d.tipo === 'Proyecto Curricular (PCI)' || d.tipo === 'Plan Anual de Trabajo (PAT)'
  ).length;
  const conArchivoCount = documentosOficiales.filter((d) => Boolean(d.archivoUrl || d.rutaStorage)).length;

  const handleOpenCreate = () => {
    setEditingDoc(null);
    setSelectedFile(null);
    setFormDoc({
      tipo: 'Resolución Directoral',
      numeroDocumento: `RD N° ${(totalCount + 1).toString().padStart(4, '0')}-2026-CETPRO-JJ`,
      titulo: '',
      fechaEmision: new Date().toISOString().split('T')[0],
      estado: 'EMITIDO',
      confidencialidad: 'PUBLICO',
      tomoFolio: 'Tomo 08, Folio 12, Archivo Dirección',
      entidadEmisora: institucion.nombre || 'CETPRO Juanjuí',
      destinatario: '',
      observaciones: '',
      archivoUrl: '',
      nombreArchivo: '',
      tamanoBytes: 0,
      hashArchivo: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (doc: DocumentoOficial) => {
    setEditingDoc(doc);
    setSelectedFile(null);
    setFormDoc({
      tipo: doc.tipo,
      numeroDocumento: doc.numeroDocumento,
      titulo: doc.titulo || '',
      fechaEmision: doc.fechaEmision,
      estado: (doc.estado as EstadoDocumento) || 'EMITIDO',
      confidencialidad: (doc.confidencialidad as ConfidencialidadDocumento) || 'PUBLICO',
      tomoFolio: doc.tomoFolio || '',
      entidadEmisora: doc.entidadEmisora || institucion.nombre,
      destinatario: doc.destinatario || '',
      observaciones: doc.observaciones || '',
      archivoUrl: doc.archivoUrl || doc.rutaStorage || '',
      nombreArchivo: doc.nombreArchivo || '',
      tamanoBytes: doc.tamanoBytes || 0,
      hashArchivo: doc.hashArchivo || '',
    });
    setIsModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      setSelectedFile(f);
      setFormDoc((prev) => ({
        ...prev,
        nombreArchivo: f.name,
        tamanoBytes: f.size,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDoc.numeroDocumento.trim()) {
      addToast('Campo Requerido', 'Ingrese el número correlativo del documento oficial', 'warning');
      return;
    }

    try {
      setIsUploading(true);
      let uploadResult = null;

      // Si seleccionó un archivo nuevo, subirlo al servidor
      if (selectedFile) {
        uploadResult = await uploadDocumentoArchivo(selectedFile);
      }

      const docPayload = {
        ...formDoc,
        archivoUrl: uploadResult?.archivoUrl || formDoc.archivoUrl,
        rutaStorage: uploadResult?.rutaStorage || formDoc.archivoUrl,
        nombreArchivo: uploadResult?.nombreArchivo || formDoc.nombreArchivo,
        tamanoBytes: uploadResult?.tamanoBytes || formDoc.tamanoBytes,
        hashArchivo: uploadResult?.hashArchivo || formDoc.hashArchivo,
        mimeType: uploadResult?.mimeType || (formDoc.nombreArchivo.endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream'),
      };

      if (editingDoc) {
        await updateDocumentoOficial({
          ...editingDoc,
          ...docPayload,
        });
      } else {
        await addDocumentoAcervo(docPayload);
      }

      setIsModalOpen(false);
      setSelectedFile(null);
    } catch (err: any) {
      console.error('Error al guardar documento:', err);
      addToast('Error', err.message || 'No se pudo registrar el documento', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCopyValidationLink = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    addToast('Enlace Copiado', 'URL de verificación copiada al portapapeles.', 'info');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Exportar Inventario Documental UGEL (.xlsx)
  const handleExportarExcelUGEL = () => {
    const headerRows = [
      ["GOBIERNO REGIONAL DE SAN MARTÍN - DIRECCIÓN REGIONAL DE EDUCACIÓN"],
      ["UNIDAD DE GESTIÓN EDUCATIVA LOCAL DE MARISCAL CÁCERES - JUANJUÍ"],
      ["CENTRO DE EDUCACIÓN TÉCNICO PRODUCTIVA 'JUANJUÍ'"],
      ["INVENTARIO OFICIAL DEL ACERVO DOCUMENTARIO Y ARCHIVO CENTRAL"],
      [],
      ["FECHA DE CORTE:", new Date().toLocaleDateString('es-PE'), "", "TOTAL EXPEDIENTES:", documentosOficiales.length],
      ["RESPONSABLE DE ARCHIVO:", currentUser?.nombreCompleto || "Secretaría Académica", "", "ESTADO ARCHIVO:", "CONFORME / CUSTODIA PERMANENTE"],
      []
    ];

    const colHeaders = [
      "N°", "TIPO DE DOCUMENTO", "NÚMERO OFICIAL", "TÍTULO / ASUNTO",
      "FECHA EMISIÓN", "ENTIDAD EMISORA", "DESTINATARIO / TITULAR",
      "ESTADO", "CONFIDENCIALIDAD", "TOMO / FOLIO (UBICACIÓN)", "TIENE ARCHIVO ADJUNTO", "CÓDIGO QR / VALIDACIÓN"
    ];

    const rowsData = filteredDocs.map((doc, idx) => [
      idx + 1,
      doc.tipo,
      doc.numeroDocumento,
      doc.titulo || doc.tipo,
      doc.fechaEmision,
      doc.entidadEmisora || 'CETPRO Juanjuí',
      doc.destinatario || '---',
      doc.estado || 'EMITIDO',
      doc.confidencialidad || 'PUBLICO',
      doc.tomoFolio || 'Archivo Central',
      (doc.archivoUrl || doc.rutaStorage) ? 'SÍ (DIGITALIZADO)' : 'PENDIENTE DE ESCANEO',
      doc.codigoVerificacionQR || doc.codigoVerificacionQr || '---'
    ]);

    const allAoa = [
      ...headerRows,
      colHeaders,
      ...rowsData,
      [],
      [],
      ["", "____________________________________", "", "", "____________________________________"],
      ["", "RESPONSABLE DE ARCHIVO CENTRAL", "", "", institucion?.director || "DIRECTOR(A) GENERAL CETPRO"],
      ["", "Firma y Sello", "", "", "Firma y Sello de Dirección"]
    ];

    const ws = XLSX.utils.aoa_to_sheet(allAoa);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Acervo Documentario");
    const fileName = `Inventario_Acervo_Documentario_${new Date().getFullYear()}.xlsx`;
    XLSX.writeFile(wb, fileName);
    addToast('Excel Generado', `Se descargó ${fileName} con formato oficial para UGEL.`, 'success');
  };

  const getTipoBadge = (tipo: TipoDocumentoOficial) => {
    switch (tipo) {
      case 'Resolución Directoral':
        return <Badge variant="primary" size="sm">Resolución</Badge>;
      case 'Convenio Institucional':
        return <Badge variant="success" size="sm">Convenio</Badge>;
      case 'Proyecto Curricular (PCI)':
      case 'Plan Anual de Trabajo (PAT)':
        return <Badge variant="purple" size="sm">Gestión Pedagógica</Badge>;
      case 'Certificado Modular':
        return <Badge variant="indigo" size="sm">Certificado</Badge>;
      case 'Constancia de Estudios':
      case 'Constancia de Egresado':
        return <Badge variant="neutral" size="sm">{tipo}</Badge>;
      default:
        return <Badge variant="neutral" size="sm">{tipo}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
              <FolderArchive className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  Acervo Documentario y Archivo Central
                </h1>
                <span className="px-2 py-0.5 bg-teal-50 text-teal-700 border border-teal-200 rounded-md text-[10px] font-mono font-bold uppercase">
                  LEY N° 25323 ARCHIVOS
                </span>
                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-md text-[10px] font-mono font-bold uppercase">
                  {totalCount} EXPEDIENTES EN BD
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Custodia digital y física de Resoluciones Directorales, Convenios, PCI, PAT, Certificados y Oficios oficiales
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={handleExportarExcelUGEL}
              className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 rounded-xl text-xs font-bold shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
              title="Descargar padrón de acervo para supervisión de UGEL"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Exportar Padrón UGEL (.xlsx)</span>
            </button>

            <button
              type="button"
              onClick={handleOpenCreate}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Archivar Nuevo Documento</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Metric Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total en Archivo</span>
            <FolderArchive className="w-4 h-4 text-teal-500" />
          </div>
          <p className="text-xl font-bold text-slate-900 mt-1.5">{totalCount}</p>
          <span className="text-[10px] text-slate-500">Expedientes registrados</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Resoluciones (RD)</span>
            <Scroll className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-xl font-bold text-blue-700 mt-1.5">{rdCount}</p>
          <span className="text-[10px] text-blue-600 font-medium">DRE, UGEL y CETPRO</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Convenios</span>
            <Building className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-xl font-bold text-emerald-700 mt-1.5">{conveniosCount}</p>
          <span className="text-[10px] text-emerald-600 font-medium">Prácticas y alianzas</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Planes de Gestión</span>
            <BookOpen className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-xl font-bold text-purple-700 mt-1.5">{planesCount}</p>
          <span className="text-[10px] text-purple-600 font-medium">PCI, PAT y PEI</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Digitalizados</span>
            <FileCheck2 className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-xl font-bold text-indigo-700 mt-1.5">{conArchivoCount}</p>
          <span className="text-[10px] text-indigo-600 font-medium">Con PDF / Escaneo adjunto</span>
        </div>
      </div>

      {/* 3. Search and Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por número de RD, asunto, titular, convenio o tomo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap">
          <select
            value={selectedTipo}
            onChange={(e) => setSelectedTipo(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none text-slate-700"
          >
            <option value="TODOS">Todos los Tipos de Documentos</option>
            {tiposDisponibles.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          <select
            value={selectedEstado}
            onChange={(e) => setSelectedEstado(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none text-slate-700"
          >
            <option value="TODOS">Todos los Estados</option>
            <option value="EMITIDO">Emitido</option>
            <option value="FIRMADO">Firmado</option>
            <option value="ARCHIVADO">Archivado</option>
            <option value="BORRADOR">Borrador</option>
            <option value="ANULADO">Anulado</option>
          </select>
        </div>
      </div>

      {/* 4. Table of Documents */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-4">N° Documento</th>
                <th className="p-4">Tipo</th>
                <th className="p-4 min-w-[220px]">Título / Asunto Institucional</th>
                <th className="p-4">Fecha Emisión</th>
                <th className="p-4">Destinatario / Titular</th>
                <th className="p-4">Tomo / Folio Físico</th>
                <th className="p-4 text-center">Estado</th>
                <th className="p-4 text-center">Adjunto</th>
                <th className="p-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {displayedDocs.map((doc) => {
                const hasFile = Boolean(doc.archivoUrl || doc.rutaStorage);
                return (
                  <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 font-mono font-bold text-slate-900">
                      <span className="bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 inline-block text-xs">
                        {doc.numeroDocumento}
                      </span>
                    </td>
                    <td className="p-4">
                      {getTipoBadge(doc.tipo)}
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-slate-900 text-xs leading-snug">
                        {doc.titulo || doc.tipo}
                      </p>
                      {doc.observaciones && (
                        <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{doc.observaciones}</p>
                      )}
                    </td>
                    <td className="p-4 text-slate-600 font-medium whitespace-nowrap">
                      {doc.fechaEmision}
                    </td>
                    <td className="p-4 text-slate-700 font-medium">
                      {doc.destinatario || doc.entidadEmisora || '---'}
                    </td>
                    <td className="p-4 text-slate-600 font-mono text-[11px]">
                      {doc.tomoFolio || 'Archivo Central'}
                    </td>
                    <td className="p-4 text-center">
                      <Badge
                        variant={
                          doc.estado === 'FIRMADO' || doc.estado === 'EMITIDO' || doc.estado === 'Vigente'
                            ? 'success'
                            : doc.estado === 'ARCHIVADO'
                            ? 'primary'
                            : doc.estado === 'BORRADOR'
                            ? 'warning'
                            : 'danger'
                        }
                        size="sm"
                      >
                        {doc.estado}
                      </Badge>
                    </td>
                    <td className="p-4 text-center">
                      {hasFile ? (
                        <a
                          href={doc.archivoUrl || doc.rutaStorage}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-[10px] font-bold transition-all"
                          title="Ver / descargar archivo escaneado original"
                        >
                          <FileDown className="w-3 h-3" />
                          <span>PDF</span>
                        </a>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">Sin adjunto</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedDocPreview(doc)}
                          className="p-1.5 text-slate-600 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors cursor-pointer"
                          title="Ver Ficha Oficial y Validación QR"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(doc)}
                          className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="Editar expediente"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteDocumentoOficial(doc.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Eliminar de archivo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {displayedDocs.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-slate-400">
                    <FolderArchive className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <p className="font-bold text-slate-700 text-sm">No se encontraron expedientes en el acervo</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Compruebe los filtros o registre un nuevo documento institucional.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Barra de paginación y límite */}
        {totalDocsCount > 0 && (
          <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <span>
                Mostrando <strong className="text-slate-900">{displayedDocs.length}</strong> de <strong className="text-slate-900">{totalDocsCount}</strong> expedientes (más recientes primero)
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 text-[11px]">Mostrar:</span>
                <select
                  value={limitCount}
                  onChange={(e) => setLimitCount(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
                  className="bg-white border border-slate-300 rounded px-2 py-1 text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  <option value={10}>10 más recientes</option>
                  <option value={25}>25 por página</option>
                  <option value={50}>50 por página</option>
                  <option value="ALL">Todos ({totalDocsCount})</option>
                </select>
              </div>

              {limitCount !== 'ALL' && totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={effectivePage <= 1}
                    className="p-1 rounded border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700"
                    title="Página anterior"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[11px] font-semibold text-slate-700 px-1">
                    {effectivePage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={effectivePage >= totalPages}
                    className="p-1 rounded border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700"
                    title="Página siguiente"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal: Archivar o Editar Documento */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold">
                  <FolderArchive className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingDoc ? 'Editar Expediente de Acervo' : 'Archivar Nuevo Documento Institucional'}
                  </h3>
                  <p className="text-xs text-slate-500">Archivo Central y Repositorio Oficial CETPRO (Supabase PostgreSQL)</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Tipo de Documento Oficial *</label>
                  <select
                    value={formDoc.tipo}
                    onChange={(e) => setFormDoc({ ...formDoc, tipo: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  >
                    {tiposDisponibles.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Número Correlativo Oficial *</label>
                  <input
                    type="text"
                    required
                    placeholder="ej. RD N° 0025-2026-CETPRO-JJ"
                    value={formDoc.numeroDocumento}
                    onChange={(e) => setFormDoc({ ...formDoc, numeroDocumento: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs font-mono font-bold border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Título / Asunto Descriptivo *</label>
                <input
                  type="text"
                  required
                  placeholder="ej. Aprobación del Plan Anual de Trabajo PAT y Cuadro de Asignación Docente 2026"
                  value={formDoc.titulo}
                  onChange={(e) => setFormDoc({ ...formDoc, titulo: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Fecha de Emisión</label>
                  <input
                    type="date"
                    value={formDoc.fechaEmision}
                    onChange={(e) => setFormDoc({ ...formDoc, fechaEmision: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Estado Oficial</label>
                  <select
                    value={formDoc.estado}
                    onChange={(e) => setFormDoc({ ...formDoc, estado: e.target.value as EstadoDocumento })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  >
                    <option value="EMITIDO">Emitido</option>
                    <option value="FIRMADO">Firmado</option>
                    <option value="ARCHIVADO">Archivado</option>
                    <option value="BORRADOR">Borrador</option>
                    <option value="ANULADO">Anulado</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Confidencialidad</label>
                  <select
                    value={formDoc.confidencialidad}
                    onChange={(e) => setFormDoc({ ...formDoc, confidencialidad: e.target.value as ConfidencialidadDocumento })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  >
                    <option value="PUBLICO">Público</option>
                    <option value="INTERNO">Uso Interno</option>
                    <option value="CONFIDENCIAL">Confidencial</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Entidad Emisora</label>
                  <input
                    type="text"
                    placeholder="ej. CETPRO Juanjuí / DRE San Martín"
                    value={formDoc.entidadEmisora}
                    onChange={(e) => setFormDoc({ ...formDoc, entidadEmisora: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Destinatario / Titular</label>
                  <input
                    type="text"
                    placeholder="ej. UGEL Mariscal Cáceres / Nombre del beneficiario"
                    value={formDoc.destinatario}
                    onChange={(e) => setFormDoc({ ...formDoc, destinatario: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Ubicación Física (Tomo / Folio / Estante) *</label>
                <input
                  type="text"
                  placeholder="ej. Tomo 04, Folio 112, Archivo Central DRE"
                  value={formDoc.tomoFolio}
                  onChange={(e) => setFormDoc({ ...formDoc, tomoFolio: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              {/* Subida de Archivo Físico con Multer */}
              <div className="space-y-1.5 p-3.5 bg-slate-50 border border-dashed border-slate-300 rounded-xl">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <UploadCloud className="w-4 h-4 text-teal-600" />
                  <span>Adjuntar Documento Digitalizado (PDF / Escaneo)</span>
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold cursor-pointer shadow-2xs flex items-center gap-1"
                  >
                    <span>Seleccionar Archivo</span>
                  </button>
                  <span className="text-xs text-slate-500 truncate max-w-[280px]">
                    {selectedFile ? selectedFile.name : formDoc.nombreArchivo ? formDoc.nombreArchivo : 'Ningún archivo seleccionado'}
                  </span>
                </div>
                {formDoc.archivoUrl && !selectedFile && (
                  <p className="text-[11px] text-emerald-600 font-medium">
                    ✓ Archivo existente adjuntado ({formDoc.nombreArchivo})
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Observaciones y Resumen Ejecutivo</label>
                <textarea
                  rows={2}
                  placeholder="Detalles sobre el alcance del documento, acuerdos del convenio o metas autorizadas..."
                  value={formDoc.observaciones}
                  onChange={(e) => setFormDoc({ ...formDoc, observaciones: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isUploading}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isUploading ? 'Guardando Archivo...' : editingDoc ? 'Guardar Cambios' : 'Archivar Documento'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Vista Oficial y Verificación QR */}
      {selectedDocPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">Validación de Acervo Institucional</h3>
              </div>
              <button
                onClick={() => setSelectedDocPreview(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                    {selectedDocPreview.tipo}
                  </span>
                  <h4 className="text-base font-bold text-slate-900 mt-1">
                    {selectedDocPreview.numeroDocumento}
                  </h4>
                  <p className="text-xs text-slate-700 font-medium">
                    {selectedDocPreview.titulo}
                  </p>
                </div>

                <div className="w-24 h-24 bg-white border border-slate-300 rounded-xl p-1.5 flex flex-col items-center justify-center shrink-0 shadow-xs">
                  <QrCode className="w-16 h-16 text-slate-900" />
                  <span className="text-[8px] font-mono font-bold text-teal-700">QR OFICIAL</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs pt-3 border-t border-slate-200 text-slate-600">
                <div>
                  <span className="font-semibold text-slate-500">Fecha de Emisión:</span>
                  <p className="font-bold text-slate-800">{selectedDocPreview.fechaEmision}</p>
                </div>

                <div>
                  <span className="font-semibold text-slate-500">Estado Oficial:</span>
                  <p className="font-bold text-emerald-700">{selectedDocPreview.estado || 'EMITIDO'}</p>
                </div>

                <div>
                  <span className="font-semibold text-slate-500">Entidad Emisora:</span>
                  <p className="font-medium text-slate-800">{selectedDocPreview.entidadEmisora || 'CETPRO Juanjuí'}</p>
                </div>

                <div>
                  <span className="font-semibold text-slate-500">Ubicación Física:</span>
                  <p className="font-medium text-slate-800">{selectedDocPreview.tomoFolio || 'Archivo Central'}</p>
                </div>
              </div>

              {/* URL de Validación Pública */}
              <div className="pt-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Enlace de Verificación Pública:</span>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="text"
                    readOnly
                    value={selectedDocPreview.codigoVerificacionQR || selectedDocPreview.codigoVerificacionQr || `https://siga.cetprojuanjui.edu.pe/validar?doc=${encodeURIComponent(selectedDocPreview.numeroDocumento)}`}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-[11px] font-mono text-slate-600 select-all"
                  />
                  <button
                    type="button"
                    onClick={() => handleCopyValidationLink(selectedDocPreview.codigoVerificacionQR || selectedDocPreview.codigoVerificacionQr || `https://siga.cetprojuanjui.edu.pe/validar?doc=${encodeURIComponent(selectedDocPreview.numeroDocumento)}`)}
                    className="px-2.5 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? 'Copiado' : 'Copiar'}</span>
                  </button>
                </div>
              </div>

              {selectedDocPreview.observaciones && (
                <div className="text-xs bg-white p-3 rounded-lg border border-slate-200">
                  <span className="font-bold text-slate-700">Resumen y Alcance:</span>
                  <p className="text-slate-600 mt-1 text-[11px] leading-relaxed">
                    {selectedDocPreview.observaciones}
                  </p>
                </div>
              )}

              {(selectedDocPreview.archivoUrl || selectedDocPreview.rutaStorage) && (
                <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-lg flex items-center justify-between">
                  <div className="text-xs">
                    <span className="font-bold text-indigo-900">Documento Digitalizado Adjunto</span>
                    <p className="text-[11px] text-indigo-700">{selectedDocPreview.nombreArchivo || 'Archivo adjunto en PDF'}</p>
                  </div>
                  <a
                    href={selectedDocPreview.archivoUrl || selectedDocPreview.rutaStorage}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Ver / Descargar</span>
                  </a>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedDocPreview(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cerrar
              </button>
              <button
                onClick={() => {
                  window.print();
                }}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Ficha de Acervo</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
