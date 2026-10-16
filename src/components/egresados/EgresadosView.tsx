import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { EgresadoDetallado, EstadoTramiteEgresado, SituacionLaboralEgresado, ModalidadTitulacion, TituloDetallado, AptoTitulacion } from '../../types';
import { exportarTitulosUgelExcel } from '../../utils/excelTitulos';
import { TituloOficialModal } from '../titulacion/TituloOficialModal';
import { RegistrarTitulacionModal } from '../titulacion/RegistrarTitulacionModal';
import { comparePersonasAlphabetical } from '../../utils/sortPersonas';
import { Badge } from '../common/Badge';
import { QrCode } from '../common/QrCode';
import {
  GraduationCap,
  Award,
  Briefcase,
  Search,
  Filter,
  UserCheck,
  Building2,
  FileSpreadsheet,
  Printer,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  TrendingUp,
  FileText,
  Phone,
  Mail,
  X,
  ExternalLink,
  Edit3,
  Calendar,
  AlertCircle,
  Download,
  Trash2
} from 'lucide-react';
import * as XLSX from 'xlsx';

export const EgresadosView: React.FC = () => {
  const {
    egresados,
    candidatosEgreso,
    programas,
    estudiantes,
    personas,
    institucion,
    currentUser,
    addEgresado,
    updateEgresado,
    registrarTitulacionEgresado,
    actualizarSeguimientoLaboral,
    deleteEgresado,
    refreshEgresados,
    titulos,
    aptosTitulacion,
    deleteTitulo,
    refreshTitulos,
    addToast
  } = useApp();

  const [activeTab, setActiveTab] = useState<'padron' | 'candidatos' | 'titulacion' | 'seguimiento'>('padron');
  const [search, setSearch] = useState('');
  const [progFilter, setProgFilter] = useState<string>('ALL');
  const [estadoFilter, setEstadoFilter] = useState<string>('ALL');
  const [situacionFilter, setSituacionFilter] = useState<string>('ALL');

  // Paginación y límite de visualización (10 más recientes por defecto)
  const [limitCount, setLimitCount] = useState<number | 'ALL'>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Modales y filtros de Titulación Oficial (RVM 188-2020-MINEDU)
  const [selectedTituloParaVer, setSelectedTituloParaVer] = useState<TituloDetallado | null>(null);
  const [isRegistrarTituloOpen, setIsRegistrarTituloOpen] = useState<boolean>(false);
  const [tituloParaEditar, setTituloParaEditar] = useState<TituloDetallado | null>(null);
  const [egresadoParaTitular, setEgresadoParaTitular] = useState<AptoTitulacion | null>(null);

  const [titSearch, setTitSearch] = useState<string>('');
  const [titNivelFilter, setTitNivelFilter] = useState<string>('ALL');
  const [titEstadoFilter, setTitEstadoFilter] = useState<string>('ALL');

  // Modales
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedStudentForGraduation, setSelectedStudentForGraduation] = useState<any | null>(null);
  const [selectedEgresadoForTitulacion, setSelectedEgresadoForTitulacion] = useState<EgresadoDetallado | null>(null);
  const [selectedEgresadoForLaboral, setSelectedEgresadoForLaboral] = useState<EgresadoDetallado | null>(null);
  const [selectedEgresadoForConstancia, setSelectedEgresadoForConstancia] = useState<EgresadoDetallado | null>(null);
  const [qrModalEgresado, setQrModalEgresado] = useState<EgresadoDetallado | null>(null);

  // Estados de formularios
  const [titulacionForm, setTitulacionForm] = useState<{
    modalidad: ModalidadTitulacion;
    fechaSustentacion: string;
    calificacion: number;
    resultado: 'APROBADO_UNANIMIDAD' | 'APROBADO_MAYORIA' | 'DESAPROBADO';
    jurado: string;
    numeroTitulo: string;
  }>({
    modalidad: 'TRABAJO_APLICACION_PROFESIONAL',
    fechaSustentacion: new Date().toISOString().split('T')[0],
    calificacion: 16,
    resultado: 'APROBADO_UNANIMIDAD',
    jurado: 'Lic. Carlos Silva (Presidente), Lic. Ana Torres (Secretaria), Lic. Marcos Ríos (Vocal)',
    numeroTitulo: ''
  });

  const [laboralForm, setLaboralForm] = useState<{
    situacionLaboral: SituacionLaboralEgresado;
    empresaActual: string;
    rucEmpresa: string;
    cargoActual: string;
    ingresoMensualAprox: string;
    telefonoActual: string;
    emailActual: string;
  }>({
    situacionLaboral: 'TRABAJANDO_EN_ESPECIALIDAD',
    empresaActual: '',
    rucEmpresa: '',
    cargoActual: '',
    ingresoMensualAprox: 'S/ 1,025 - S/ 2,000',
    telefonoActual: '',
    emailActual: ''
  });

  // Métricas Principales
  const totalEgresados = egresados.length;
  const totalTitulados = egresados.filter(e => e.estadoTramite === 'TITULADO').length;
  const enEspecialidad = egresados.filter(e => e.situacionLaboral === 'TRABAJANDO_EN_ESPECIALIDAD' || e.situacionLaboral === 'EMPRENDIMIENTO_PROPIO').length;
  const tasaEmpleabilidad = totalEgresados > 0 ? Math.round((enEspecialidad / totalEgresados) * 100) : 0;
  const totalCandidatos = candidatosEgreso.filter(c => !c.ya_egresado).length;

  // Filtrado de egresados
  const filteredEgresados = useMemo(() => {
    return egresados.filter(eg => {
      const q = search.toLowerCase().trim();
      const matchSearch = q === '' ||
        (eg.codigoEgresado || '').toLowerCase().includes(q) ||
        (eg.personaDni || '').toLowerCase().includes(q) ||
        (eg.personaNombres || '').toLowerCase().includes(q) ||
        (eg.personaApellidoPaterno || '').toLowerCase().includes(q) ||
        (eg.personaApellidoMaterno || '').toLowerCase().includes(q) ||
        (eg.programaNombre || '').toLowerCase().includes(q) ||
        (eg.numeroTitulo || '').toLowerCase().includes(q);

      if (!matchSearch) return false;
      if (progFilter !== 'ALL' && eg.programaId !== progFilter) return false;
      if (estadoFilter !== 'ALL' && eg.estadoTramite !== estadoFilter) return false;
      if (situacionFilter !== 'ALL' && eg.situacionLaboral !== situacionFilter) return false;

      return true;
    }).sort((a, b) => {
      const dateA = new Date(a.fechaEgreso || (a as any).fechaSustentacion || (a as any).createdAt || 0).getTime();
      const dateB = new Date(b.fechaEgreso || (b as any).fechaSustentacion || (b as any).createdAt || 0).getTime();
      if (dateB !== dateA) return dateB - dateA;
      return (b.id || '').localeCompare(a.id || '');
    });
  }, [egresados, search, progFilter, estadoFilter, situacionFilter]);

  // Reset a la página 1 cuando cambian los filtros o el límite
  useEffect(() => {
    setCurrentPage(1);
  }, [search, progFilter, estadoFilter, situacionFilter, limitCount]);

  // Paginación y egresados mostrados
  const totalEgresadosCount = filteredEgresados.length;
  const pageSize = limitCount === 'ALL' ? totalEgresadosCount : limitCount;
  const totalPages = Math.max(1, Math.ceil(totalEgresadosCount / (pageSize || 1)));
  const effectivePage = Math.min(currentPage, totalPages);
  const displayedEgresados = useMemo(() => {
    if (limitCount === 'ALL') return filteredEgresados;
    const start = (effectivePage - 1) * pageSize;
    return filteredEgresados.slice(start, start + pageSize);
  }, [filteredEgresados, limitCount, effectivePage, pageSize]);

  // Filtrado de candidatos
  const filteredCandidatos = useMemo(() => {
    return candidatosEgreso.filter(c => {
      const q = search.toLowerCase().trim();
      const matchSearch = q === '' ||
        (c.numero_documento || '').includes(q) ||
        (c.apellido_paterno || '').toLowerCase().includes(q) ||
        (c.nombres || '').toLowerCase().includes(q) ||
        (c.programa_nombre || '').toLowerCase().includes(q);

      if (!matchSearch) return false;
      if (progFilter !== 'ALL' && c.programa_id !== progFilter) return false;
      return true;
    }).sort((a, b) => comparePersonasAlphabetical(
      { apellidoPaterno: a.apellido_paterno, apellidoMaterno: a.apellido_materno, nombres: a.nombres },
      { apellidoPaterno: b.apellido_paterno, apellidoMaterno: b.apellido_materno, nombres: b.nombres }
    ));
  }, [candidatosEgreso, search, progFilter]);

  // Manejadores
  const handleOpenTitulacion = (eg: EgresadoDetallado) => {
    setSelectedEgresadoForTitulacion(eg);
    setTitulacionForm({
      modalidad: eg.modalidadTitulacion || 'TRABAJO_APLICACION_PROFESIONAL',
      fechaSustentacion: eg.fechaSustentacion || new Date().toISOString().split('T')[0],
      calificacion: eg.calificacionTitulacion || 16,
      resultado: eg.resultadoSustentacion || 'APROBADO_UNANIMIDAD',
      jurado: eg.juradoCalificador || 'Lic. Carlos Silva (Presidente), Lic. Ana Torres (Secretaria), Lic. Marcos Ríos (Vocal)',
      numeroTitulo: eg.numeroTitulo || `TIT-CETPRO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
    });
  };

  const handleSaveTitulacion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEgresadoForTitulacion) return;

    const ok = await registrarTitulacionEgresado(selectedEgresadoForTitulacion.id, {
      ...titulacionForm,
      calificacionTitulacion: Number(titulacionForm.calificacion),
      usuarioId: currentUser?.id
    });

    if (ok) {
      setSelectedEgresadoForTitulacion(null);
    }
  };

  const handleOpenLaboral = (eg: EgresadoDetallado) => {
    setSelectedEgresadoForLaboral(eg);
    setLaboralForm({
      situacionLaboral: eg.situacionLaboral || 'TRABAJANDO_EN_ESPECIALIDAD',
      empresaActual: eg.empresaActual || '',
      rucEmpresa: eg.rucEmpresa || '',
      cargoActual: eg.cargoActual || '',
      ingresoMensualAprox: eg.ingresoMensualAprox || 'S/ 1,025 - S/ 2,000',
      telefonoActual: eg.telefonoActual || eg.personaTelefono || '',
      emailActual: eg.emailActual || eg.personaEmail || ''
    });
  };

  const handleSaveLaboral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEgresadoForLaboral) return;

    const ok = await actualizarSeguimientoLaboral(selectedEgresadoForLaboral.id, laboralForm);
    if (ok) {
      setSelectedEgresadoForLaboral(null);
    }
  };

  const handleGraduateCandidate = async (candidate: any) => {
    const ok = await addEgresado({
      estudianteId: candidate.estudiante_id,
      programaId: candidate.programa_id,
      planEstudioId: candidate.plan_estudio_id,
      matriculaId: candidate.ultima_matricula_id,
      totalCreditosAprobados: Number(candidate.total_creditos) || 40,
      totalHorasAcumuladas: candidate.duracion_horas_referencial || 950,
      resolucionDirectoral: `RD N° 00${Math.floor(25 + Math.random() * 50)}-2026-CETPRO-J`,
      tomoFolio: `Libro 2026, Tomo 02, Folio ${Math.floor(10 + Math.random() * 40)}`,
      usuarioId: currentUser?.id
    });

    if (ok) {
      addToast('Egresado Acreditado', `${candidate.apellido_paterno} ${candidate.nombres} registrado como Egresado Oficial.`, 'success');
      refreshEgresados();
    }
  };

  // Exportar a Excel Oficial UGEL
  const exportarExcelUgel = () => {
    const data = filteredEgresados.map((eg, idx) => ({
      'N°': idx + 1,
      'CÓDIGO EGRESADO': eg.codigoEgresado,
      'DNI': eg.personaDni || '',
      'APELLIDO PATERNO': eg.personaApellidoPaterno || '',
      'APELLIDO MATERNO': eg.personaApellidoMaterno || '',
      'NOMBRES': eg.personaNombres || '',
      'PROGRAMA DE ESTUDIOS': eg.programaNombre || '',
      'NIVEL FORMATIVO': eg.nivelFormativo || 'Ciclo Técnico / Auxiliar Técnico',
      'FECHA EGRESO': eg.fechaEgreso,
      'CRÉDITOS': eg.totalCreditosAprobados || 40,
      'HORAS': eg.totalHorasAcumuladas || 950,
      'ESTADO TRÁMITE': eg.estadoTramite,
      'RD APROBACIÓN': eg.resolucionDirectoral || '',
      'TOMO Y FOLIO': eg.tomoFolio || '',
      'TÍTULO N°': eg.numeroTitulo || '---',
      'MODALIDAD TITULACIÓN': eg.modalidadTitulacion || '---',
      'NOTA SUSTENTACIÓN': eg.calificacionTitulacion || '---',
      'SITUACIÓN LABORAL': eg.situacionLaboral,
      'EMPRESA / EMPRENDIMIENTO': eg.empresaActual || '---',
      'CARGO': eg.cargoActual || '---',
      'TELÉFONO CONTACTO': eg.telefonoActual || eg.personaTelefono || '',
      'CORREO ELECTRÓNICO': eg.emailActual || eg.personaEmail || '',
      'HASH VALIDACIÓN QR': eg.hashSeguridad || ''
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'PADRON_EGRESADOS_UGEL');

    // Autoajuste de columnas
    const colWidths = Object.keys(data[0] || {}).map(key => ({
      wch: Math.max(key.length + 3, 14)
    }));
    ws['!cols'] = colWidths;

    const fechaStr = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `PADRON_OFICIAL_EGRESADOS_UGEL_${fechaStr}.xlsx`);
    addToast('Padrón Exportado', 'El padrón oficial de egresados se descargó en formato Excel para la UGEL.', 'info');
  };

  // Helper de badges
  const getBadgeEstado = (estado: EstadoTramiteEgresado) => {
    switch (estado) {
      case 'TITULADO':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1"><Award className="w-3 h-3" /> Titulado</span>;
      case 'EN_TRAMITE_TITULACION':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-300 flex items-center gap-1"><Clock className="w-3 h-3" /> En Trámite Título</span>;
      case 'EXPEDIENTADO':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-300 flex items-center gap-1"><FileText className="w-3 h-3" /> Expedientado</span>;
      case 'OBSERVADO':
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Observado</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1"><GraduationCap className="w-3 h-3" /> Egresado</span>;
    }
  };

  const getBadgeLaboral = (sit: SituacionLaboralEgresado) => {
    switch (sit) {
      case 'TRABAJANDO_EN_ESPECIALIDAD':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">En Especialidad</span>;
      case 'EMPRENDIMIENTO_PROPIO':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">Emprendimiento</span>;
      case 'TRABAJANDO_OTRA_AREA':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">Otra Área</span>;
      case 'ESTUDIANDO_SUPERIOR':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-cyan-50 text-cyan-700 border border-cyan-200">Estudiando Sup.</span>;
      default:
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">Buscando Empleo</span>;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Encabezado Oficial Normativo */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-sm shrink-0">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  Padrón Oficial de Egresados, Titulación y Empleabilidad
                </h1>
                <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-md text-[11px] font-bold font-mono uppercase">
                  R.V.M. 188-2020-MINEDU
                </span>
                <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-[11px] font-bold font-mono uppercase">
                  REGISTRA MINEDU
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Gestión integral de egreso, sustentación de títulos, validación con código QR y seguimiento a la inserción laboral del CETPRO Juanjuí
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={exportarExcelUgel}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-2 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Exportar UGEL (.xlsx)</span>
            </button>
            <button
              onClick={() => setActiveTab('candidatos')}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-2 cursor-pointer"
            >
              <UserCheck className="w-4 h-4" />
              <span>Auditar Candidatos ({totalCandidatos})</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Dashboard de KPIs Oficiales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Egresados</span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">{totalEgresados}</span>
            <span className="text-[11px] text-blue-600 font-medium mt-0.5 inline-flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Acreditados en Libro
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <GraduationCap className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Titulados Oficiales</span>
            <span className="text-2xl font-black text-emerald-700 mt-1 block">{totalTitulados}</span>
            <span className="text-[11px] text-emerald-600 font-medium mt-0.5 inline-flex items-center gap-1">
              <Award className="w-3 h-3" /> {totalEgresados > 0 ? Math.round((totalTitulados / totalEgresados) * 100) : 0}% de titulación
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Award className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Tasa de Empleabilidad</span>
            <span className="text-2xl font-black text-purple-700 mt-1 block">{tasaEmpleabilidad}%</span>
            <span className="text-[11px] text-purple-600 font-medium mt-0.5 inline-flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> {enEspecialidad} en especialidad
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Briefcase className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Candidatos a Egreso</span>
            <span className="text-2xl font-black text-amber-700 mt-1 block">{totalCandidatos}</span>
            <span className="text-[11px] text-amber-600 font-medium mt-0.5 inline-flex items-center gap-1">
              <Clock className="w-3 h-3" /> Con módulos listos
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 3. Selector de Pestañas */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-2xl px-4 pt-2 gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('padron')}
          className={`pb-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 cursor-pointer transition-all ${
            activeTab === 'padron'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>Padrón de Egresados ({totalEgresados})</span>
        </button>
        <button
          onClick={() => setActiveTab('candidatos')}
          className={`pb-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 cursor-pointer transition-all ${
            activeTab === 'candidatos'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Candidatos a Egreso ({totalCandidatos})</span>
        </button>
        <button
          onClick={() => setActiveTab('titulacion')}
          className={`pb-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 cursor-pointer transition-all ${
            activeTab === 'titulacion'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Titulación y Sustentación ({totalTitulados})</span>
        </button>
        <button
          onClick={() => setActiveTab('seguimiento')}
          className={`pb-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 cursor-pointer transition-all ${
            activeTab === 'seguimiento'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>Seguimiento e Inserción Laboral ({tasaEmpleabilidad}%)</span>
        </button>
      </div>

      {/* 4. Barra de Búsqueda y Filtros */}
      <div className="bg-white p-4 rounded-b-2xl border-x border-b border-slate-200 -mt-6 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex-1 min-w-[240px] relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por DNI, apellidos, nombres, código egresado o título..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={progFilter}
            onChange={(e) => setProgFilter(e.target.value)}
            className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="ALL">Todos los Programas</option>
            {programas.map((p) => (
              <option key={p.id} value={p.id}>{p.nombre}</option>
            ))}
          </select>

          {activeTab === 'padron' && (
            <>
              <select
                value={estadoFilter}
                onChange={(e) => setEstadoFilter(e.target.value)}
                className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="ALL">Todos los Estados</option>
                <option value="EGRESADO">Egresado</option>
                <option value="EN_TRAMITE_TITULACION">En Trámite Título</option>
                <option value="TITULADO">Titulado</option>
                <option value="EXPEDIENTADO">Expedientado</option>
              </select>

              <select
                value={situacionFilter}
                onChange={(e) => setSituacionFilter(e.target.value)}
                className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="ALL">Toda Situación Laboral</option>
                <option value="TRABAJANDO_EN_ESPECIALIDAD">En Especialidad</option>
                <option value="EMPRENDIMIENTO_PROPIO">Emprendimiento Propio</option>
                <option value="TRABAJANDO_OTRA_AREA">Trabajando Otra Área</option>
                <option value="BUSCANDO_EMPLEO">Buscando Empleo</option>
              </select>
            </>
          )}
        </div>
      </div>

      {/* 5. Contenido por Pestañas */}
      {activeTab === 'padron' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">Código / DNI</th>
                  <th className="py-3.5 px-4">Estudiante Egresado</th>
                  <th className="py-3.5 px-4">Programa Formativo</th>
                  <th className="py-3.5 px-4">Fecha Egreso</th>
                  <th className="py-3.5 px-4">Créditos / Horas</th>
                  <th className="py-3.5 px-4">Estado Trámite</th>
                  <th className="py-3.5 px-4">Inserción Laboral</th>
                  <th className="py-3.5 px-4">Custodia Libro</th>
                  <th className="py-3.5 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {displayedEgresados.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-12 text-slate-400">
                      <GraduationCap className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                      <p className="font-semibold">No se encontraron egresados con los filtros actuales.</p>
                      <p className="text-xs text-slate-400 mt-1">Revisa la pestaña de "Candidatos a Egreso" para promover nuevos egresados.</p>
                    </td>
                  </tr>
                ) : (
                  displayedEgresados.map((eg) => (
                    <tr key={eg.id} className="hover:bg-slate-50/70 transition-all">
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-blue-700 block">{eg.codigoEgresado}</span>
                        <span className="text-[11px] text-slate-400 font-mono">DNI: {eg.personaDni}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900 block">
                          {eg.personaApellidoPaterno} {eg.personaApellidoMaterno}, {eg.personaNombres}
                        </span>
                        <span className="text-[11px] text-slate-500 inline-flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400" /> {eg.telefonoActual || eg.personaTelefono || 'Sin teléfono'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-medium text-slate-800 block">{eg.programaNombre}</span>
                        <span className="text-[10px] text-slate-400 block">{eg.nivelFormativo || 'Auxiliar Técnico'}</span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-600">
                        {eg.fechaEgreso}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-700 block">{eg.totalCreditosAprobados || 40} Créditos</span>
                        <span className="text-[11px] text-slate-400">{eg.totalHorasAcumuladas || 950} Horas</span>
                      </td>
                      <td className="py-3.5 px-4">
                        {getBadgeEstado(eg.estadoTramite)}
                        {eg.numeroTitulo && (
                          <span className="text-[10px] font-mono text-emerald-700 block mt-1">
                            {eg.numeroTitulo}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {getBadgeLaboral(eg.situacionLaboral)}
                        {eg.empresaActual && (
                          <span className="text-[10px] text-slate-600 truncate max-w-[140px] block mt-0.5" title={eg.empresaActual}>
                            {eg.empresaActual}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-[11px] text-slate-500 font-mono">
                        <span className="block">{eg.tomoFolio || 'Sin asignar'}</span>
                        <span className="text-[10px] text-slate-400 block">{eg.resolucionDirectoral}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setQrModalEgresado(eg)}
                            title="Validar Código QR"
                            className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg transition-all cursor-pointer"
                          >
                            <ShieldCheck className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setSelectedEgresadoForConstancia(eg)}
                            title="Imprimir Constancia de Egreso"
                            className="p-1.5 hover:bg-slate-100 text-slate-700 rounded-lg transition-all cursor-pointer"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenTitulacion(eg)}
                            title="Registrar / Ver Titulación"
                            className="p-1.5 hover:bg-purple-50 text-purple-600 rounded-lg transition-all cursor-pointer"
                          >
                            <Award className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenLaboral(eg)}
                            title="Actualizar Seguimiento Laboral"
                            className="p-1.5 hover:bg-emerald-50 text-emerald-600 rounded-lg transition-all cursor-pointer"
                          >
                            <Briefcase className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Barra de paginación y límite */}
          {totalEgresadosCount > 0 && (
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <span>
                  Mostrando <strong className="text-slate-900">{displayedEgresados.length}</strong> de <strong className="text-slate-900">{totalEgresadosCount}</strong> egresados (más recientes primero)
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 text-[11px]">Mostrar:</span>
                  <select
                    value={limitCount}
                    onChange={(e) => setLimitCount(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
                    className="bg-white border border-slate-300 rounded px-2 py-1 text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value={10}>10 más recientes</option>
                    <option value={25}>25 por página</option>
                    <option value={50}>50 por página</option>
                    <option value="ALL">Todos ({totalEgresadosCount})</option>
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
      )}

      {activeTab === 'candidatos' && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900">
              <span className="font-bold block">Auditoría Automática de Avance Curricular:</span>
              La siguiente lista muestra los estudiantes que tienen módulos y prácticas preprofesionales (EFSRT) registradas y que son aptos para ser promovidos a la condición de <strong>Egresados Oficiales</strong> según los artículos de la R.V.M. N° 188-2020-MINEDU.
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">DNI</th>
                  <th className="py-3.5 px-4">Estudiante Candidato</th>
                  <th className="py-3.5 px-4">Programa Formativo</th>
                  <th className="py-3.5 px-4 text-center">Matrículas</th>
                  <th className="py-3.5 px-4 text-center">U.D. Aprobadas</th>
                  <th className="py-3.5 px-4 text-center">EFSRT Aprobadas</th>
                  <th className="py-3.5 px-4">Estado Actual</th>
                  <th className="py-3.5 px-4 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredCandidatos.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-10 text-slate-400">
                      No hay candidatos que coincidan con la búsqueda.
                    </td>
                  </tr>
                ) : (
                  filteredCandidatos.map((cand) => (
                    <tr key={cand.estudiante_id} className="hover:bg-slate-50/70 transition-all">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                        {cand.numero_documento}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900 block">
                          {cand.apellido_paterno} {cand.apellido_materno}, {cand.nombres}
                        </span>
                        <span className="text-[11px] text-slate-400">{cand.telefono || cand.email || 'Sin contacto'}</span>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-800">
                        {cand.programa_nombre}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-slate-700">
                        {cand.total_matriculas}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-bold">
                          {cand.total_unidades_aprobadas} UDs
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-md font-bold ${
                          Number(cand.total_efsrt_aprobadas) > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {cand.total_efsrt_aprobadas} EFSRT
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {cand.ya_egresado ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            Ya Registrado
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                            Apto para Egreso
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {cand.ya_egresado ? (
                          <span className="text-slate-400 text-[11px]">Acreditado</span>
                        ) : (
                          <button
                            onClick={() => handleGraduateCandidate(cand)}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition-all flex items-center gap-1 mx-auto cursor-pointer"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Aprobar Egreso</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'titulacion' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200 bg-slate-50/60 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Expedientes de Titulación Profesional</h2>
              <p className="text-xs text-slate-500">Acreditación según Trabajo de Aplicación Profesional o Examen de Suficiencia</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">Título N°</th>
                  <th className="py-3.5 px-4">Titulado(a)</th>
                  <th className="py-3.5 px-4">Programa Formativo</th>
                  <th className="py-3.5 px-4">Modalidad</th>
                  <th className="py-3.5 px-4">Fecha Sustentación</th>
                  <th className="py-3.5 px-4 text-center">Calificación</th>
                  <th className="py-3.5 px-4">Jurado Calificador</th>
                  <th className="py-3.5 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {egresados.filter(e => e.estadoTramite === 'TITULADO').length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-10 text-slate-400">
                      No hay egresados titulados registrados aún. Usa la acción "Gestionar Titulación" en el Padrón.
                    </td>
                  </tr>
                ) : (
                  egresados.filter(e => e.estadoTramite === 'TITULADO').map(eg => (
                    <tr key={eg.id} className="hover:bg-slate-50/70 transition-all">
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-700">
                        {eg.numeroTitulo}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900 block">{eg.personaApellidoPaterno} {eg.personaApellidoMaterno}, {eg.personaNombres}</span>
                        <span className="text-[11px] text-slate-400">DNI: {eg.personaDni}</span>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-800">
                        {eg.programaNombre}
                      </td>
                      <td className="py-3.5 px-4 text-[11px]">
                        <span className="font-medium text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                          {eg.modalidadTitulacion === 'TRABAJO_APLICACION_PROFESIONAL' ? 'Trabajo Aplicación' : 'Examen Suficiencia'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-600">
                        {eg.fechaSustentacion || eg.fechaEgreso}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-sm">
                          {eg.calificacionTitulacion || 16}
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">Aprobado</span>
                      </td>
                      <td className="py-3.5 px-4 text-[11px] text-slate-500 max-w-[200px] truncate" title={eg.juradoCalificador || ''}>
                        {eg.juradoCalificador || 'Jurado Oficial CETPRO'}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleOpenTitulacion(eg)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium cursor-pointer"
                        >
                          Editar
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'seguimiento' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-bold text-slate-500 block mb-3 uppercase tracking-wider">Distribución Laboral</span>
              <div className="space-y-2.5">
                <div>
                  <div className="flex justify-between text-xs font-medium mb-1">
                    <span className="text-emerald-700 font-bold">En su Especialidad</span>
                    <span>{egresados.filter(e => e.situacionLaboral === 'TRABAJANDO_EN_ESPECIALIDAD').length}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${totalEgresados > 0 ? (egresados.filter(e => e.situacionLaboral === 'TRABAJANDO_EN_ESPECIALIDAD').length / totalEgresados) * 100 : 0}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-medium mb-1">
                    <span className="text-indigo-700 font-bold">Emprendimiento Propio</span>
                    <span>{egresados.filter(e => e.situacionLaboral === 'EMPRENDIMIENTO_PROPIO').length}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${totalEgresados > 0 ? (egresados.filter(e => e.situacionLaboral === 'EMPRENDIMIENTO_PROPIO').length / totalEgresados) * 100 : 0}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-medium mb-1">
                    <span className="text-amber-700 font-bold">Buscando Empleo</span>
                    <span>{egresados.filter(e => e.situacionLaboral === 'BUSCANDO_EMPLEO').length}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full rounded-full" style={{ width: `${totalEgresados > 0 ? (egresados.filter(e => e.situacionLaboral === 'BUSCANDO_EMPLEO').length / totalEgresados) * 100 : 0}%` }}></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs md:col-span-2">
              <span className="text-xs font-bold text-slate-500 block mb-2 uppercase tracking-wider">Bolsa de Trabajo & Alianzas Estratégicas</span>
              <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                El seguimiento laboral permite reportar a la <strong>UGEL Mariscal Cáceres</strong> y al <strong>SINEACE</strong> el impacto real de las especialidades técnicas del CETPRO Juanjuí en la cuenca del Huallaga Central.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <span className="text-xl font-bold text-slate-900 block">{egresados.filter(e => e.empresaActual).length}</span>
                  <span className="text-[11px] text-slate-500">Centros de Trabajo</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <span className="text-xl font-bold text-emerald-700 block">{egresados.filter(e => e.situacionLaboral === 'EMPRENDIMIENTO_PROPIO').length}</span>
                  <span className="text-[11px] text-slate-500">Emprendimientos</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <span className="text-xl font-bold text-blue-700 block">{tasaEmpleabilidad}%</span>
                  <span className="text-[11px] text-slate-500">Tasa Empleo</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <span className="text-xl font-bold text-purple-700 block">{totalEgresados}</span>
                  <span className="text-[11px] text-slate-500">Monitoreados</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-200 bg-slate-50/60">
              <h2 className="text-sm font-bold text-slate-900">Directorio de Inserción Laboral</h2>
            </div>
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">Egresado(a)</th>
                  <th className="py-3.5 px-4">Programa</th>
                  <th className="py-3.5 px-4">Situación</th>
                  <th className="py-3.5 px-4">Empresa / Negocio</th>
                  <th className="py-3.5 px-4">Cargo / Función</th>
                  <th className="py-3.5 px-4">Rango Ingreso</th>
                  <th className="py-3.5 px-4">Teléfono</th>
                  <th className="py-3.5 px-4 text-center">Actualizar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredEgresados.map((eg) => (
                  <tr key={eg.id} className="hover:bg-slate-50/70 transition-all">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {eg.personaApellidoPaterno} {eg.personaApellidoMaterno}, {eg.personaNombres}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-700">{eg.programaNombre}</td>
                    <td className="py-3.5 px-4">{getBadgeLaboral(eg.situacionLaboral)}</td>
                    <td className="py-3.5 px-4 font-medium text-slate-800">{eg.empresaActual || '---'}</td>
                    <td className="py-3.5 px-4 text-slate-600">{eg.cargoActual || '---'}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">{eg.ingresoMensualAprox || '---'}</td>
                    <td className="py-3.5 px-4 font-mono text-blue-700">{eg.telefonoActual || eg.personaTelefono || '---'}</td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleOpenLaboral(eg)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium cursor-pointer"
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: Sello Digital y Código QR */}
      {qrModalEgresado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-sm">Acreditación Digital Oficial (QR)</h3>
              </div>
              <button
                onClick={() => setQrModalEgresado(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-xl border border-slate-200">
              <QrCode
                value={`https://siga.cetprojuanjui.edu.pe/validar-egresado?cod=${qrModalEgresado.codigoEgresado}&hash=${qrModalEgresado.hashSeguridad || 'ok'}`}
                size={180}
              />
              <span className="text-[11px] font-mono text-slate-500 mt-3 block text-center font-bold">
                {qrModalEgresado.codigoEgresado}
              </span>
              <span className="text-[10px] text-slate-400 text-center block">
                Hash: {qrModalEgresado.hashSeguridad}
              </span>
            </div>

            <div className="space-y-1.5 text-xs text-slate-700 bg-blue-50/50 p-3.5 rounded-xl border border-blue-100">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Egresado:</span>
                <span className="font-bold">{qrModalEgresado.personaApellidoPaterno} {qrModalEgresado.personaNombres}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Programa:</span>
                <span className="font-bold">{qrModalEgresado.programaNombre}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Resolución:</span>
                <span className="font-mono font-bold text-blue-700">{qrModalEgresado.resolucionDirectoral}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Libro / Folio:</span>
                <span className="font-mono text-slate-800">{qrModalEgresado.tomoFolio}</span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <a
                href={`/api/egresados/validar/${qrModalEgresado.codigoEgresado}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold text-center flex items-center justify-center gap-1.5 shadow-xs transition-all"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Comprobar API de Validación</span>
              </a>
              <button
                onClick={() => setQrModalEgresado(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Gestión de Titulación */}
      {selectedEgresadoForTitulacion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-purple-600" />
                <h3 className="font-bold text-slate-900 text-sm">Expediente de Titulación Profesional</h3>
              </div>
              <button
                onClick={() => setSelectedEgresadoForTitulacion(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
              <span className="text-slate-500 block">Graduando(a):</span>
              <span className="text-slate-900 font-bold text-sm block">
                {selectedEgresadoForTitulacion.personaApellidoPaterno} {selectedEgresadoForTitulacion.personaApellidoMaterno}, {selectedEgresadoForTitulacion.personaNombres}
              </span>
              <span className="text-slate-600 block mt-0.5">{selectedEgresadoForTitulacion.programaNombre}</span>
            </div>

            <form onSubmit={handleSaveTitulacion} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Modalidad de Titulación (RVM 188-2020-MINEDU)</label>
                <select
                  value={titulacionForm.modalidad}
                  onChange={(e) => setTitulacionForm({ ...titulacionForm, modalidad: e.target.value as any })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="TRABAJO_APLICACION_PROFESIONAL">Trabajo de Aplicación Profesional (Proyecto)</option>
                  <option value="EXAMEN_SUFICIENCIA_PROFESIONAL">Examen de Suficiencia Profesional</option>
                  <option value="EXPERIENCIA_LABORAL_EXTRAORDINARIA">Experiencia Laboral Extraordinaria Acreditada</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Fecha Sustentación</label>
                  <input
                    type="date"
                    value={titulacionForm.fechaSustentacion}
                    onChange={(e) => setTitulacionForm({ ...titulacionForm, fechaSustentacion: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Calificación Vigesimal (0-20)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="20"
                    value={titulacionForm.calificacion}
                    onChange={(e) => setTitulacionForm({ ...titulacionForm, calificacion: Number(e.target.value) })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Número de Título Oficial</label>
                <input
                  type="text"
                  value={titulacionForm.numeroTitulo}
                  onChange={(e) => setTitulacionForm({ ...titulacionForm, numeroTitulo: e.target.value })}
                  placeholder="Ej. TIT-CETPRO-2026-0004"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Jurado Calificador Institucional</label>
                <textarea
                  rows={2}
                  value={titulacionForm.jurado}
                  onChange={(e) => setTitulacionForm({ ...titulacionForm, jurado: e.target.value })}
                  placeholder="Nombres y cargos de los docentes miembros del jurado"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold shadow-xs transition-all cursor-pointer"
                >
                  Registrar y Emitir Título
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedEgresadoForTitulacion(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Seguimiento Laboral */}
      {selectedEgresadoForLaboral && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-sm">Monitoreo e Inserción Laboral</h3>
              </div>
              <button
                onClick={() => setSelectedEgresadoForLaboral(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveLaboral} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Situación Laboral Actual</label>
                <select
                  value={laboralForm.situacionLaboral}
                  onChange={(e) => setLaboralForm({ ...laboralForm, situacionLaboral: e.target.value as any })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="TRABAJANDO_EN_ESPECIALIDAD">Trabajando en su Especialidad Formativa</option>
                  <option value="EMPRENDIMIENTO_PROPIO">Emprendimiento Propio / Negocio Independiente</option>
                  <option value="TRABAJANDO_OTRA_AREA">Trabajando en otra Área</option>
                  <option value="BUSCANDO_EMPLEO">Buscando Empleo Activamente</option>
                  <option value="ESTUDIANDO_SUPERIOR">Continuando Estudios Superiores</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Empresa / Negocio Empleador</label>
                <input
                  type="text"
                  value={laboralForm.empresaActual}
                  onChange={(e) => setLaboralForm({ ...laboralForm, empresaActual: e.target.value })}
                  placeholder="Ej. Taller de Confecciones Juanjuí"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Cargo / Puesto</label>
                  <input
                    type="text"
                    value={laboralForm.cargoActual}
                    onChange={(e) => setLaboralForm({ ...laboralForm, cargoActual: e.target.value })}
                    placeholder="Ej. Patronista"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Rango Ingreso</label>
                  <select
                    value={laboralForm.ingresoMensualAprox}
                    onChange={(e) => setLaboralForm({ ...laboralForm, ingresoMensualAprox: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Menos de S/ 1,025">Menos de S/ 1,025</option>
                    <option value="S/ 1,025 - S/ 2,000">S/ 1,025 - S/ 2,000</option>
                    <option value="Más de S/ 2,000">Más de S/ 2,000</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Teléfono Actualizado</label>
                  <input
                    type="text"
                    value={laboralForm.telefonoActual}
                    onChange={(e) => setLaboralForm({ ...laboralForm, telefonoActual: e.target.value })}
                    placeholder="9XXXXXXXX"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Correo Electrónico</label>
                  <input
                    type="email"
                    value={laboralForm.emailActual}
                    onChange={(e) => setLaboralForm({ ...laboralForm, emailActual: e.target.value })}
                    placeholder="correo@ejemplo.com"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs transition-all cursor-pointer"
                >
                  Guardar Seguimiento
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedEgresadoForLaboral(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Constancia Oficial de Egreso Impresa */}
      {selectedEgresadoForConstancia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 p-8 space-y-6 animate-in fade-in my-8 print:m-0 print:p-0 print:shadow-none">
            {/* Membrete Oficial */}
            <div className="text-center space-y-1 border-b-2 border-slate-800 pb-4">
              <h4 className="text-[11px] font-bold tracking-wider uppercase text-slate-600">Gobierno Regional de San Martín</h4>
              <h4 className="text-[11px] font-bold tracking-wider uppercase text-slate-600">Dirección Regional de Educación de San Martín</h4>
              <h4 className="text-[11px] font-bold tracking-wider uppercase text-slate-600">Unidad de Gestión Educativa Local Mariscal Cáceres</h4>
              <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight mt-2">
                CENTRO DE EDUCACIÓN TÉCNICO-PRODUCTIVA "JUANJUÍ"
              </h2>
              <span className="text-[10px] text-slate-500 font-mono block">R.D. N° 0148-2024-DRE-SM / CÓDIGO MODULAR: 0463877</span>
            </div>

            {/* Título del Documento */}
            <div className="text-center py-2">
              <h1 className="text-xl font-black text-slate-900 tracking-wider uppercase underline underline-offset-4">
                CONSTANCIA DE EGRESO
              </h1>
              <span className="text-xs font-mono font-bold text-blue-700 block mt-1">
                REGISTRO N° {selectedEgresadoForConstancia.codigoEgresado}
              </span>
            </div>

            {/* Cuerpo Oficial */}
            <div className="text-xs text-slate-800 leading-relaxed text-justify space-y-3 font-serif">
              <p>
                La Dirección del <strong>CENTRO DE EDUCACIÓN TÉCNICO-PRODUCTIVA "JUANJUÍ"</strong>, que suscribe, hace constar que:
              </p>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center font-sans font-bold text-sm text-slate-900">
                {selectedEgresadoForConstancia.personaApellidoPaterno} {selectedEgresadoForConstancia.personaApellidoMaterno}, {selectedEgresadoForConstancia.personaNombres}
              </div>
              <p>
                Identificado(a) con Documento Nacional de Identidad <strong>N° {selectedEgresadoForConstancia.personaDni}</strong>, ha cumplido satisfactoriamente con la totalidad de los módulos formativos, Unidades Didácticas y las Experiencias Formativas en Situaciones Reales de Trabajo (EFSRT), correspondientes al Programa de Estudios de:
              </p>
              <div className="p-2.5 bg-blue-50/60 border border-blue-200 rounded-lg text-center font-sans font-black text-sm text-blue-900">
                {selectedEgresadoForConstancia.programaNombre?.toUpperCase()}
              </div>
              <p>
                Habiendo acumulado un total de <strong>{selectedEgresadoForConstancia.totalCreditosAprobados || 40} Créditos Académicos</strong> y <strong>{selectedEgresadoForConstancia.totalHorasAcumuladas || 950} Horas Cronológicas</strong>, aprobados mediante <strong>{selectedEgresadoForConstancia.resolucionDirectoral}</strong> y asentados en el <strong>{selectedEgresadoForConstancia.tomoFolio}</strong> del Libro de Registro Oficial de Egresados del CETPRO Juanjuí.
              </p>
              <p>
                Por tanto, se le otorga la presente <strong>CONSTANCIA DE EGRESADO(A)</strong> de acuerdo con lo normado en la <strong>Resolución Viceministerial N° 188-2020-MINEDU</strong>, para los fines que estime conveniente.
              </p>
              <p className="text-right pt-2">
                Juanjuí, {selectedEgresadoForConstancia.fechaEgreso}
              </p>
            </div>

            {/* Sello QR y Firmas */}
            <div className="grid grid-cols-3 gap-4 pt-8 items-end border-t border-slate-200 font-sans">
              <div className="flex flex-col items-center">
                <QrCode
                  value={`https://siga.cetprojuanjui.edu.pe/validar-egresado?cod=${selectedEgresadoForConstancia.codigoEgresado}&hash=${selectedEgresadoForConstancia.hashSeguridad || 'ok'}`}
                  size={100}
                />
                <span className="text-[9px] font-mono text-slate-400 mt-1 block">VERIFICACIÓN DIGITAL</span>
              </div>
              <div className="text-center">
                <div className="w-32 border-b border-slate-400 mx-auto mb-1"></div>
                <span className="text-[10px] font-bold text-slate-700 block">SECRETARÍA ACADÉMICA</span>
                <span className="text-[9px] text-slate-400 block">CETPRO Juanjuí</span>
              </div>
              <div className="text-center">
                <div className="w-32 border-b border-slate-400 mx-auto mb-1"></div>
                <span className="text-[10px] font-bold text-slate-700 block">DIRECCIÓN GENERAL</span>
                <span className="text-[9px] text-slate-400 block">CETPRO Juanjuí</span>
              </div>
            </div>

            {/* Botones */}
            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 print:hidden">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Constancia</span>
              </button>
              <button
                onClick={() => setSelectedEgresadoForConstancia(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
