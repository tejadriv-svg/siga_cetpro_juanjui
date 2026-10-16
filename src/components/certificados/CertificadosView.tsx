import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  CertificadoModularDetallado, 
  AptoCertificadoModular, 
  DocumentoOficial, 
  EstadoCertificadoModular,
  CertificadoEstudioDetallado,
  EstadoCertificadoEstudio,
  TipoCertificadoEstudio
} from '../../types';
import { Badge } from '../common/Badge';
import { QrCode } from '../common/QrCode';
import { NuevoCertificadoModal } from './NuevoCertificadoModal';
import { CertificadoModularOficialModal } from './CertificadoModularOficialModal';
import { EmitirCertificadoModularModal } from './EmitirCertificadoModularModal';
import { CertificadoEstudioOficialModal } from './CertificadoEstudioOficialModal';
import { EmitirCertificadoEstudioModal } from './EmitirCertificadoEstudioModal';
import { exportarCertificadosUgelExcel } from '../../utils/excelCertificados';
import { exportarCertificadosEstudiosUgelExcel } from '../../utils/excelCertificadosEstudios';
import { comparePersonasAlphabetical } from '../../utils/sortPersonas';
import {
  FileCheck2,
  Award,
  Search,
  PlusCircle,
  Eye,
  Printer,
  ShieldCheck,
  Calendar,
  CheckCircle2,
  ExternalLink,
  GraduationCap,
  Download,
  FileSpreadsheet,
  Layers,
  AlertCircle,
  Filter,
  Trash2,
  Edit3,
  Clock,
  Sparkles,
  Check,
  X,
  BookOpen,
  FileText
} from 'lucide-react';

export const CertificadosView: React.FC = () => {
  const {
    certificadosModulares,
    aptosCertificacionModular,
    certificadosEstudios,
    documentosOficiales,
    programas,
    modulos,
    institucion,
    updateCertificadoModular,
    deleteCertificadoModular,
    refreshCertificadosModulares,
    updateCertificadoEstudio,
    deleteCertificadoEstudio,
    refreshCertificadosEstudios,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'ESTUDIOS' | 'MODULARES' | 'AUDITORIA' | 'OTROS'>('ESTUDIOS');
  const [search, setSearch] = useState('');
  const [programaFilter, setProgramaFilter] = useState<string>('ALL');
  const [estadoFilter, setEstadoFilter] = useState<string>('ALL');
  const [tipoEstudioFilter, setTipoEstudioFilter] = useState<string>('ALL');

  // Modales Certificados Modulares
  const [isEmitirModalOpen, setIsEmitirModalOpen] = useState(false);
  const [selectedCertForPreview, setSelectedCertForPreview] = useState<CertificadoModularDetallado | null>(null);
  const [selectedAptoParaEmitir, setSelectedAptoParaEmitir] = useState<AptoCertificadoModular | null>(null);

  // Modales Certificados de Estudios
  const [isEmitirEstudioModalOpen, setIsEmitirEstudioModalOpen] = useState(false);
  const [selectedEstudioForPreview, setSelectedEstudioForPreview] = useState<CertificadoEstudioDetallado | null>(null);

  // Modal Otros Documentos
  const [isNuevoOtroDocOpen, setIsNuevoOtroDocOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Filtrado de Certificados de Estudios
  const filteredEstudios = certificadosEstudios.filter((c) => {
    const s = search.toLowerCase().trim();
    const nombreCompleto = `${c.personaApellidoPaterno || ''} ${c.personaApellidoMaterno || ''} ${c.personaNombres || ''}`.toLowerCase();

    const matchesSearch = s === '' ||
      (c.codigoCertificado || '').toLowerCase().includes(s) ||
      (c.numeroCertificado || '').toLowerCase().includes(s) ||
      (c.personaDni || '').includes(s) ||
      nombreCompleto.includes(s) ||
      (c.programaNombre || '').toLowerCase().includes(s);

    if (!matchesSearch) return false;
    if (programaFilter !== 'ALL' && c.programaId !== programaFilter) return false;
    if (estadoFilter !== 'ALL' && c.estado !== estadoFilter) return false;
    if (tipoEstudioFilter !== 'ALL' && c.tipoCertificado !== tipoEstudioFilter) return false;

    return true;
  }).sort((a, b) => {
    const dateA = new Date(a.fechaEmision || (a as any).createdAt || 0).getTime();
    const dateB = new Date(b.fechaEmision || (b as any).createdAt || 0).getTime();
    if (dateB !== dateA) return dateB - dateA;
    return (b.id || '').localeCompare(a.id || '');
  });

  // Filtrado de Certificados Modulares
  const filteredCertificados = certificadosModulares.filter((c) => {
    const s = search.toLowerCase().trim();
    const nombreCompleto = `${c.personaApellidoPaterno || ''} ${c.personaApellidoMaterno || ''} ${c.personaNombres || ''}`.toLowerCase();
    
    const matchesSearch = s === '' ||
      (c.codigoCertificado || '').toLowerCase().includes(s) ||
      (c.numeroCertificado || '').toLowerCase().includes(s) ||
      (c.personaDni || '').includes(s) ||
      nombreCompleto.includes(s) ||
      (c.moduloNombre || '').toLowerCase().includes(s) ||
      (c.programaNombre || '').toLowerCase().includes(s);

    if (!matchesSearch) return false;
    if (programaFilter !== 'ALL' && c.programaId !== programaFilter) return false;
    if (estadoFilter !== 'ALL' && c.estado !== estadoFilter) return false;

    return true;
  }).sort((a, b) => {
    const dateA = new Date(a.fechaEmision || (a as any).createdAt || 0).getTime();
    const dateB = new Date(b.fechaEmision || (b as any).createdAt || 0).getTime();
    if (dateB !== dateA) return dateB - dateA;
    return (b.id || '').localeCompare(a.id || '');
  });

  // Filtrado de Aptos para Auditoría
  const filteredAptos = aptosCertificacionModular.filter((a) => {
    const s = search.toLowerCase().trim();
    const nombreCompleto = `${a.persona_apellido_paterno} ${a.persona_apellido_materno} ${a.persona_nombres}`.toLowerCase();
    
    const matchesSearch = s === '' ||
      (a.persona_dni || '').includes(s) ||
      nombreCompleto.includes(s) ||
      (a.modulo_nombre || '').toLowerCase().includes(s) ||
      (a.programa_nombre || '').toLowerCase().includes(s);

    if (!matchesSearch) return false;
    if (programaFilter !== 'ALL' && a.programa_id !== programaFilter) return false;

    return true;
  }).sort((a, b) => comparePersonasAlphabetical(
    { apellidoPaterno: a.persona_apellido_paterno, apellidoMaterno: a.persona_apellido_materno, nombres: a.persona_nombres },
    { apellidoPaterno: b.persona_apellido_paterno, apellidoMaterno: b.persona_apellido_materno, nombres: b.persona_nombres }
  ));

  // Exportar Excel UGEL
  const handleExportExcel = async () => {
    try {
      setIsExporting(true);
      if (activeTab === 'ESTUDIOS') {
        await exportarCertificadosEstudiosUgelExcel(certificadosEstudios, institucion);
      } else {
        await exportarCertificadosUgelExcel(certificadosModulares, institucion);
      }
    } catch (e) {
      console.error('Error al exportar a Excel:', e);
    } finally {
      setIsExporting(false);
    }
  };

  // Cambiar Estado rápido Modular
  const handleCambiarEstadoModular = async (cert: CertificadoModularDetallado, nuevoEstado: EstadoCertificadoModular) => {
    const data: any = { estado: nuevoEstado };
    if (nuevoEstado === 'ENTREGADO' && !cert.fechaEntrega) {
      data.fechaEntrega = new Date().toISOString().split('T')[0];
    }
    await updateCertificadoModular(cert.id, data);
  };

  // Cambiar Estado rápido Estudio
  const handleCambiarEstadoEstudio = async (cert: CertificadoEstudioDetallado, nuevoEstado: EstadoCertificadoEstudio) => {
    const data: any = { estado: nuevoEstado };
    if (nuevoEstado === 'ENTREGADO' && !cert.fechaEntrega) {
      data.fechaEntrega = new Date().toISOString().split('T')[0];
    }
    await updateCertificadoEstudio(cert.id, data);
  };

  // Métricas Modulares
  const totalModulares = certificadosModulares.length;
  const entregadosModulares = certificadosModulares.filter(c => c.estado === 'ENTREGADO').length;
  const firmadosModulares = certificadosModulares.filter(c => c.estado === 'FIRMADO' || c.estado === 'EMITIDO').length;
  const aptosListos = aptosCertificacionModular.filter(a => a.cumple_requisitos && !a.ya_certificado).length;

  // Métricas Estudios
  const totalEstudios = certificadosEstudios.length;
  const estudiosCompletos = certificadosEstudios.filter(c => c.tipoCertificado === 'COMPLETO').length;
  const estudiosParciales = certificadosEstudios.filter(c => c.tipoCertificado === 'PARCIAL').length;
  const sumaPpa = certificadosEstudios.reduce((acc, c) => acc + (Number(c.promedioPonderadoAcumulado) || 0), 0);
  const promedioPpaGeneral = totalEstudios > 0 ? (sumaPpa / totalEstudios).toFixed(1) : '0.0';

  return (
    <div className="space-y-6">
      {/* 1. Header Banner Oficial */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-800 text-white flex items-center justify-center font-bold text-lg shadow-sm shrink-0">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  Certificados de Estudios y Certificación Modular
                </h1>
                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md text-[10px] font-mono font-bold uppercase">
                  R.V.M. N° 188-2020-MINEDU
                </span>
                <span className="px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-md text-[10px] font-mono font-bold uppercase">
                  REGISTRA MINEDU
                </span>
                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-md text-[10px] font-mono font-bold uppercase">
                  VALIDACIÓN QR
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Acreditación de trayectoria académica, cálculo de PPA acumulado, certificación modular, actas oficiales y emisión oficial en 2 caras (Anverso & Reverso)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={handleExportExcel}
              disabled={isExporting || (activeTab === 'ESTUDIOS' ? totalEstudios === 0 : totalModulares === 0)}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-800 rounded-xl text-xs font-bold border border-slate-300 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
              <span>{isExporting ? 'Generando...' : 'Padrón UGEL (.xlsx)'}</span>
            </button>

            {activeTab === 'ESTUDIOS' ? (
              <button
                onClick={() => setIsEmitirEstudioModalOpen(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Emitir Certificado de Estudios</span>
              </button>
            ) : activeTab === 'MODULARES' ? (
              <button
                onClick={() => {
                  setSelectedAptoParaEmitir(null);
                  setIsEmitirModalOpen(true);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Emitir Certificado Modular</span>
              </button>
            ) : null}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-t border-slate-200 bg-slate-50/70 px-6 gap-6 text-xs font-semibold overflow-x-auto">
          <button
            onClick={() => {
              setActiveTab('ESTUDIOS');
              setEstadoFilter('ALL');
            }}
            className={`py-3 border-b-2 font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
              activeTab === 'ESTUDIOS'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Certificados de Estudios ({totalEstudios})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('MODULARES');
              setEstadoFilter('ALL');
            }}
            className={`py-3 border-b-2 font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
              activeTab === 'MODULARES'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Certificados Modulares Oficiales ({totalModulares})</span>
          </button>

          <button
            onClick={() => setActiveTab('AUDITORIA')}
            className={`py-3 border-b-2 font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
              activeTab === 'AUDITORIA'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
            <span>Auditoría Modular y Aptos</span>
            {aptosListos > 0 && (
              <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
                {aptosListos} listos
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('OTROS')}
            className={`py-3 border-b-2 font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
              activeTab === 'OTROS'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4 text-purple-600" />
            <span>Otros Documentos ({documentosOficiales.length})</span>
          </button>
        </div>
      </div>

      {/* 2. KPI Metrics Dinámicos */}
      {activeTab === 'ESTUDIOS' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Certificados de Estudios</div>
              <div className="text-2xl font-black text-indigo-950 mt-1">{totalEstudios}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">En registro oficial institucional</div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <GraduationCap className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Certificados Completos</div>
              <div className="text-2xl font-black text-emerald-700 mt-1">{estudiosCompletos}</div>
              <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">Egresados con todos los módulos</div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Certificados Parciales</div>
              <div className="text-2xl font-black text-amber-700 mt-1">{estudiosParciales}</div>
              <div className="text-[11px] text-amber-600 font-semibold mt-0.5">Para traslados y convalidación</div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <BookOpen className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">PPA General Promedio</div>
              <div className="text-2xl font-black text-indigo-700 mt-1">{promedioPpaGeneral}</div>
              <div className="text-[11px] text-indigo-600 font-semibold mt-0.5">Promedio ponderado acumulado</div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Certificados Modulares</div>
              <div className="text-2xl font-black text-slate-900 mt-1">{totalModulares}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">En libro oficial institucional</div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Award className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Entregados al Alumno</div>
              <div className="text-2xl font-black text-teal-700 mt-1">{entregadosModulares}</div>
              <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">Con constancia de entrega</div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Firmados / En Trámite</div>
              <div className="text-2xl font-black text-blue-700 mt-1">{firmadosModulares}</div>
              <div className="text-[11px] text-blue-600 font-semibold mt-0.5">Listos para entrega</div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Aptos para Emisión</div>
              <div className="text-2xl font-black text-amber-700 mt-1">{aptosListos}</div>
              <div className="text-[11px] text-amber-600 font-semibold mt-0.5">UDs y EFSRT concluidos</div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
          </div>
        </div>
      )}

      {/* 3. Filtros y Búsqueda */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por DNI, estudiante, código oficial..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={programaFilter}
              onChange={(e) => setProgramaFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden w-full sm:w-auto font-medium"
            >
              <option value="ALL">Todos los Programas</option>
              {programas.map((p) => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
          </div>

          {activeTab === 'ESTUDIOS' && (
            <select
              value={tipoEstudioFilter}
              onChange={(e) => setTipoEstudioFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden w-full sm:w-auto font-medium"
            >
              <option value="ALL">Todos los Tipos</option>
              <option value="COMPLETO">Completos</option>
              <option value="PARCIAL">Parciales</option>
            </select>
          )}

          {(activeTab === 'ESTUDIOS' || activeTab === 'MODULARES') && (
            <select
              value={estadoFilter}
              onChange={(e) => setEstadoFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden w-full sm:w-auto font-medium"
            >
              <option value="ALL">Todos los Estados</option>
              <option value="EMITIDO">Emitido</option>
              <option value="FIRMADO">Firmado</option>
              <option value="ENTREGADO">Entregado</option>
              <option value="BORRADOR">Borrador</option>
              <option value="ANULADO">Anulado</option>
            </select>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: LISTADO OFICIAL DE CERTIFICADOS DE ESTUDIOS                        */}
      {/* ========================================================================= */}
      {activeTab === 'ESTUDIOS' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Código & Registro</th>
                  <th className="py-3 px-4">Estudiante & DNI</th>
                  <th className="py-3 px-4">Programa & Plan</th>
                  <th className="py-3 px-3 text-center">Tipo</th>
                  <th className="py-3 px-3 text-center">Horas/Créd.</th>
                  <th className="py-3 px-3 text-center">PPA Acumulado</th>
                  <th className="py-3 px-3 text-center">Estado</th>
                  <th className="py-3 px-4 text-center">Libro / Folio</th>
                  <th className="py-3 px-4 text-right">Acciones Oficiales</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEstudios.length > 0 ? (
                  filteredEstudios.map((cert) => (
                    <tr key={cert.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Código y Registro */}
                      <td className="py-3.5 px-4 font-medium">
                        <div className="font-mono font-bold text-indigo-800 text-xs">
                          {cert.codigoCertificado || 'S/C'}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {cert.numeroCertificado}
                        </div>
                        <div className="text-[9px] text-slate-400 mt-0.5">
                          Emisión: {cert.fechaEmision}
                        </div>
                      </td>

                      {/* Estudiante & DNI */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">
                          {cert.personaApellidoPaterno} {cert.personaApellidoMaterno}, {cert.personaNombres}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                          <span>DNI: {cert.personaDni}</span>
                          <span>•</span>
                          <span>Cód: {cert.estudianteCodigo || '---'}</span>
                        </div>
                      </td>

                      {/* Programa & Plan */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">{cert.programaNombre}</div>
                        <div className="text-[10px] text-slate-500">
                          Nivel: {cert.nivelFormativo || 'Técnico'} • {cert.planEstudioNombre || 'Modular'}
                        </div>
                      </td>

                      {/* Tipo */}
                      <td className="py-3.5 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          cert.tipoCertificado === 'COMPLETO'
                            ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}>
                          {cert.tipoCertificado}
                        </span>
                      </td>

                      {/* Horas / Créditos */}
                      <td className="py-3.5 px-3 text-center">
                        <span className="font-black text-slate-800">{cert.totalCreditosAcumulados || 0} c</span>
                        <div className="text-[10px] text-slate-500 font-mono">{cert.totalHorasAcumuladas || 0} hrs</div>
                      </td>

                      {/* PPA */}
                      <td className="py-3.5 px-3 text-center">
                        <div className={`text-sm font-black ${
                          Number(cert.promedioPonderadoAcumulado) >= 13 ? 'text-indigo-800' : 'text-red-600'
                        }`}>
                          {cert.promedioPonderadoAcumulado ? Number(cert.promedioPonderadoAcumulado).toFixed(2) : '---'}
                        </div>
                        <span className="text-[9px] font-bold text-slate-400 block uppercase">PPA</span>
                      </td>

                      {/* Estado */}
                      <td className="py-3.5 px-3 text-center">
                        <select
                          value={cert.estado}
                          onChange={(e) => handleCambiarEstadoEstudio(cert, e.target.value as EstadoCertificadoEstudio)}
                          className={`text-[10px] font-bold px-2 py-1 rounded-lg border focus:outline-hidden cursor-pointer ${
                            cert.estado === 'ENTREGADO' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                            cert.estado === 'FIRMADO' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                            cert.estado === 'EMITIDO' ? 'bg-cyan-50 text-cyan-800 border-cyan-200' :
                            cert.estado === 'ANULADO' ? 'bg-red-50 text-red-800 border-red-200' :
                            'bg-slate-50 text-slate-700 border-slate-200'
                          }`}
                        >
                          <option value="BORRADOR">Borrador</option>
                          <option value="EMITIDO">Emitido</option>
                          <option value="FIRMADO">Firmado</option>
                          <option value="ENTREGADO">Entregado</option>
                          <option value="ANULADO">Anulado</option>
                        </select>
                      </td>

                      {/* Libro / Folio */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="font-mono text-[11px] text-slate-700 bg-slate-50 px-2 py-1 rounded-md border border-slate-200 block">
                          {cert.tomoFolio || 'Libro 2026'}
                        </span>
                        <span className="text-[9px] text-slate-400 block mt-0.5">
                          {cert.resolucionDirectoral || 'RD N° 0148-2024'}
                        </span>
                      </td>

                      {/* Acciones Oficiales */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedEstudioForPreview(cert)}
                            title="Ver e Imprimir Formato Oficial A4 (2 Caras: Anverso & Reverso)"
                            className="p-1.5 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {cert.codigoVerificacionQr && (
                            <a
                              href={`/api/certificados-estudios/validar/${cert.codigoCertificado}`}
                              target="_blank"
                              rel="noreferrer"
                              title="Validación Pública Online QR"
                              className="p-1.5 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}

                          <button
                            onClick={async () => {
                              if (window.confirm(`¿Está seguro de eliminar el certificado de estudios ${cert.codigoCertificado}?`)) {
                                await deleteCertificadoEstudio(cert.id);
                              }
                            }}
                            title="Eliminar Certificado"
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="py-10 text-center text-slate-400 italic">
                      No se encontraron certificados de estudios registrados con los filtros seleccionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: LISTADO OFICIAL DE CERTIFICADOS MODULARES                          */}
      {/* ========================================================================= */}
      {activeTab === 'MODULARES' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Código & Registro</th>
                  <th className="py-3 px-4">Estudiante & DNI</th>
                  <th className="py-3 px-4">Programa & Módulo</th>
                  <th className="py-3 px-3 text-center">Horas/Créd.</th>
                  <th className="py-3 px-3 text-center">Prom. Final</th>
                  <th className="py-3 px-3 text-center">Estado</th>
                  <th className="py-3 px-4 text-center">Libro / Folio</th>
                  <th className="py-3 px-4 text-right">Acciones Oficiales</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCertificados.length > 0 ? (
                  filteredCertificados.map((cert) => (
                    <tr key={cert.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Código y Registro */}
                      <td className="py-3.5 px-4 font-medium">
                        <div className="font-mono font-bold text-emerald-800 text-xs">
                          {cert.codigoCertificado || 'S/C'}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {cert.numeroCertificado}
                        </div>
                        <div className="text-[9px] text-slate-400 mt-0.5">
                          Emisión: {cert.fechaEmision}
                        </div>
                      </td>

                      {/* Estudiante & DNI */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">
                          {cert.personaApellidoPaterno} {cert.personaApellidoMaterno}, {cert.personaNombres}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                          <span>DNI: {cert.personaDni}</span>
                          <span>•</span>
                          <span>Cód: {cert.estudianteCodigo || '---'}</span>
                        </div>
                      </td>

                      {/* Programa & Módulo */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">{cert.moduloNombre}</div>
                        <div className="text-[10px] text-slate-500">
                          {cert.programaNombre} • {cert.nivelFormativo || 'Técnico'}
                        </div>
                      </td>

                      {/* Horas / Créditos */}
                      <td className="py-3.5 px-3 text-center">
                        <span className="font-black text-slate-800">{cert.creditosModulo || 0} c</span>
                        <div className="text-[10px] text-slate-500 font-mono">{cert.horasModulo || 0} hrs</div>
                      </td>

                      {/* Calificaciones */}
                      <td className="py-3.5 px-3 text-center">
                        <div className={`text-sm font-black ${
                          (cert.promedioFinal || 0) >= 13 ? 'text-emerald-700' : 'text-red-600'
                        }`}>
                          {cert.promedioFinal ? Number(cert.promedioFinal).toFixed(1) : '---'}
                        </div>
                        <div className="text-[9px] text-slate-400">
                          UDs: {cert.promedioUnidades || '-'} | EFSRT: {cert.notaEfsrt || '-'}
                        </div>
                      </td>

                      {/* Estado */}
                      <td className="py-3.5 px-3 text-center">
                        <select
                          value={cert.estado}
                          onChange={(e) => handleCambiarEstadoModular(cert, e.target.value as EstadoCertificadoModular)}
                          className={`text-[10px] font-bold px-2 py-1 rounded-lg border focus:outline-hidden cursor-pointer ${
                            cert.estado === 'ENTREGADO' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                            cert.estado === 'FIRMADO' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                            cert.estado === 'EMITIDO' ? 'bg-cyan-50 text-cyan-800 border-cyan-200' :
                            cert.estado === 'ANULADO' ? 'bg-red-50 text-red-800 border-red-200' :
                            'bg-slate-50 text-slate-700 border-slate-200'
                          }`}
                        >
                          <option value="BORRADOR">Borrador</option>
                          <option value="EMITIDO">Emitido</option>
                          <option value="FIRMADO">Firmado</option>
                          <option value="ENTREGADO">Entregado</option>
                          <option value="ANULADO">Anulado</option>
                        </select>
                      </td>

                      {/* Libro / Folio */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="font-mono text-[11px] text-slate-700 bg-slate-50 px-2 py-1 rounded-md border border-slate-200 block">
                          {cert.tomoFolio || 'Libro 2026'}
                        </span>
                        <span className="text-[9px] text-slate-400 block mt-0.5">
                          {cert.resolucionDirectoral || 'RD N° 0148-2024'}
                        </span>
                      </td>

                      {/* Acciones Oficiales */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedCertForPreview(cert)}
                            title="Ver e Imprimir Formato Oficial A4 (2 Caras: Anverso & Reverso)"
                            className="p-1.5 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {cert.codigoVerificacionQr && (
                            <a
                              href={`/api/certificados-modulares/validar/${cert.codigoCertificado}`}
                              target="_blank"
                              rel="noreferrer"
                              title="Validación Pública Online QR"
                              className="p-1.5 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}

                          <button
                            onClick={async () => {
                              if (window.confirm(`¿Está seguro de eliminar el certificado modular ${cert.codigoCertificado}?`)) {
                                await deleteCertificadoModular(cert.id);
                              }
                            }}
                            title="Eliminar Certificado"
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-slate-400 italic">
                      No se encontraron certificados modulares registrados con los filtros seleccionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: AUDITORÍA ACADÉMICA Y APTOS PARA CERTIFICAR MODULARES             */}
      {/* ========================================================================= */}
      {activeTab === 'AUDITORIA' && (
        <div className="space-y-4">
          <div className="bg-amber-50/60 border border-amber-200/80 p-4 rounded-2xl flex items-start gap-3 text-xs text-amber-900">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Regla Normativa de Acreditación (R.V.M. N° 188-2020-MINEDU):</p>
              <p className="text-amber-800 mt-0.5">
                Para que un estudiante sea apto a la certificación modular, debe haber aprobado con nota mínima de trece (13) el 100% de las Unidades Didácticas del Módulo (Técnicas y Empleabilidad) y la respectiva EFSRT. El promedio final modular pondera 70% promedio de UDs y 30% nota de EFSRT.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Estudiante & DNI</th>
                    <th className="py-3 px-4">Programa & Módulo</th>
                    <th className="py-3 px-3 text-center">Unidades Aprobadas</th>
                    <th className="py-3 px-3 text-center">Prom. UDs</th>
                    <th className="py-3 px-3 text-center">EFSRT</th>
                    <th className="py-3 px-3 text-center">Prom. Final Estimado</th>
                    <th className="py-3 px-3 text-center">Dictamen Auditoría</th>
                    <th className="py-3 px-4 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAptos.length > 0 ? (
                    filteredAptos.map((apto, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4 font-medium">
                          <div className="font-bold text-slate-900">
                            {apto.persona_apellido_paterno} {apto.persona_apellido_materno}, {apto.persona_nombres}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            DNI: {apto.persona_dni} • Cód: {apto.estudiante_codigo}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-800">{apto.modulo_nombre}</div>
                          <div className="text-[10px] text-slate-500">{apto.programa_nombre}</div>
                        </td>

                        <td className="py-3.5 px-3 text-center">
                          <span className={`font-mono font-bold ${
                            apto.unidades_aprobadas === apto.total_unidades_modulo ? 'text-emerald-700' : 'text-amber-700'
                          }`}>
                            {apto.unidades_aprobadas} / {apto.total_unidades_modulo}
                          </span>
                        </td>

                        <td className="py-3.5 px-3 text-center">
                          <span className="font-black text-slate-800">{apto.promedio_unidades}</span>
                        </td>

                        <td className="py-3.5 px-3 text-center">
                          {apto.nota_efsrt ? (
                            <span className="font-black text-emerald-700">{apto.nota_efsrt}</span>
                          ) : (
                            <span className="text-[10px] text-red-500 font-bold bg-red-50 px-2 py-0.5 rounded-full">
                              Pendiente
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-3 text-center">
                          {apto.promedio_final_estimado ? (
                            <span className="text-sm font-black text-slate-900">{apto.promedio_final_estimado}</span>
                          ) : (
                            <span className="text-slate-400">---</span>
                          )}
                        </td>

                        <td className="py-3.5 px-3 text-center">
                          {apto.ya_certificado ? (
                            <span className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-[10px] font-bold inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Ya Certificado
                            </span>
                          ) : apto.cumple_requisitos ? (
                            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-bold inline-flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-emerald-600" /> Apto para Emitir
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full text-[10px] font-medium">
                              En proceso
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          {apto.cumple_requisitos && !apto.ya_certificado ? (
                            <button
                              onClick={() => {
                                setSelectedAptoParaEmitir(apto);
                                setIsEmitirModalOpen(true);
                              }}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs"
                            >
                              Emitir Certificado
                            </button>
                          ) : (
                            <button
                              disabled
                              className="px-3 py-1.5 bg-slate-100 text-slate-400 rounded-lg text-xs font-medium cursor-not-allowed"
                            >
                              {apto.ya_certificado ? 'Emitido' : 'Incompleto'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400 italic">
                        No se encontraron estudiantes para auditoría académica con los filtros actuales.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: OTROS DOCUMENTOS OFICIALES (CONSTANCIAS, ACTAS, MEMOS)              */}
      {/* ========================================================================= */}
      {activeTab === 'OTROS' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200">
            <div className="text-xs text-slate-600">
              Gestión de documentos oficiales adicionales (Constancias de Matrícula, Constancias de Egresado, etc.)
            </div>
            <button
              onClick={() => setIsNuevoOtroDocOpen(true)}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Emitir Constancia / Documento</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Tipo & Número</th>
                    <th className="py-3 px-4">Estudiante / Destinatario</th>
                    <th className="py-3 px-4">Fecha Emisión</th>
                    <th className="py-3 px-4 text-center">Estado</th>
                    <th className="py-3 px-4 text-center">QR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {documentosOficiales.map((doc) => (
                    <tr key={doc.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{doc.tipo}</div>
                        <div className="text-[11px] font-mono text-slate-500">{doc.numeroDocumento}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        {doc.destinatario || 'Estudiante'}
                      </td>
                      <td className="py-3 px-4 text-slate-600">{doc.fechaEmision}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full text-[10px] font-bold">
                          {doc.estado || 'EMITIDO'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {doc.codigoVerificacionQR && (
                          <div className="flex justify-center">
                            <QrCode value={doc.codigoVerificacionQR} size={28} label="" showLink={false} />
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: Vista Previa Oficial Certificado Modular (Anverso y Reverso) */}
      {selectedCertForPreview && (
        <CertificadoModularOficialModal
          isOpen={!!selectedCertForPreview}
          onClose={() => setSelectedCertForPreview(null)}
          certificado={selectedCertForPreview}
        />
      )}

      {/* MODAL 2: Emisión Oficial de Certificado Modular */}
      {isEmitirModalOpen && (
        <EmitirCertificadoModularModal
          isOpen={isEmitirModalOpen}
          onClose={() => {
            setIsEmitirModalOpen(false);
            setSelectedAptoParaEmitir(null);
          }}
          preselectedApto={selectedAptoParaEmitir}
          onSuccess={() => {
            refreshCertificadosModulares();
          }}
        />
      )}

      {/* MODAL 3: Vista Previa Oficial Certificado de Estudios (Anverso y Reverso) */}
      {selectedEstudioForPreview && (
        <CertificadoEstudioOficialModal
          isOpen={!!selectedEstudioForPreview}
          onClose={() => setSelectedEstudioForPreview(null)}
          certificado={selectedEstudioForPreview}
        />
      )}

      {/* MODAL 4: Emisión Oficial de Certificado de Estudios */}
      {isEmitirEstudioModalOpen && (
        <EmitirCertificadoEstudioModal
          isOpen={isEmitirEstudioModalOpen}
          onClose={() => setIsEmitirEstudioModalOpen(false)}
          onSuccess={() => {
            refreshCertificadosEstudios();
          }}
        />
      )}

      {/* MODAL 5: Emisión de Otros Documentos Oficiales */}
      {isNuevoOtroDocOpen && (
        <NuevoCertificadoModal
          isOpen={isNuevoOtroDocOpen}
          onClose={() => setIsNuevoOtroDocOpen(false)}
        />
      )}
    </div>
  );
};
