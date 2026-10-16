import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Estudiante, EstadoEstudiante } from '../../types';
import { formatPeriodoDisplay, isSamePeriodo, normalizePeriodo } from '../../utils/normalizePeriodo';
import { getProgramColor } from '../../utils/programColors';
import { Badge } from '../common/Badge';
import { EstudianteDrawer } from './EstudianteDrawer';
import { NuevaMatriculaModal } from './NuevaMatriculaModal';
import { FichaMatriculaPrint } from './FichaMatriculaPrint';
import { SeccionesList } from './SeccionesList';
import { compareEstudiantesByPersona } from '../../utils/sortPersonas';
import {
  GraduationCap,
  Search,
  UserPlus,
  Filter,
  Eye,
  FileCheck2,
  Calendar,
  BookOpen,
  Award,
  ChevronRight,
  ChevronLeft,
  UploadCloud,
  Users,
  Layers,
  TrendingUp,
  CheckCircle2,
  X,
  RotateCcw,
  Sparkles,
  School,
  Printer,
} from 'lucide-react';

export const EstudiantesView: React.FC = () => {
  const {
    estudiantes,
    personas,
    programas,
    modulos,
    secciones,
    matriculas,
    selectedEstudianteId,
    setSelectedEstudianteId,
    periodoActivo,
    setActiveView,
    updateMatricula,
    currentUser,
    hasPermission,
  } = useApp();

  const isEstudianteRole = currentUser?.rol === 'ESTUDIANTE';
  const canCrearMatricula = hasPermission('MATRICULA', 'CREAR');

  const [activeTab, setActiveTab] = useState<'estudiantes' | 'secciones'>('estudiantes');
  const [search, setSearch] = useState('');
  const [progFilter, setProgFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [periodFilter, setPeriodFilter] = useState<string>('ALL');
  const [quickStatFilter, setQuickStatFilter] = useState<'ALL' | 'ACTIVO' | 'ANTERIOR' | 'REGULAR' | 'EGRESADO'>('ALL');
  const [programPeriodView, setProgramPeriodView] = useState<'ACTIVO' | 'ANTERIOR' | '2026' | 'ALL'>('ACTIVO');
  
  const [isMatriculaModalOpen, setIsMatriculaModalOpen] = useState(false);
  const [selectedPersonaIdForMatricula, setSelectedPersonaIdForMatricula] = useState<string | undefined>(undefined);
  const [printMatriculaId, setPrintMatriculaId] = useState<string | null>(null);

  // Determine actual and previous periods
  const periodoActualCode = periodoActivo || '2026-2';
  const periodoAnteriorCode = '2026-1';

  // Matricula count helper matching student, program and modules
  const matchMatriculaToProgram = (
    m: typeof matriculas[0],
    progIdOrCode: string
  ): boolean => {
    if (m.programaId === progIdOrCode) return true;
    if (m.moduloId) {
      const mod = modulos.find((x) => x.id === m.moduloId);
      if (mod && (mod.programaId === progIdOrCode)) return true;
    }
    const prog = programas.find(p => p.id === progIdOrCode || p.codigo === progIdOrCode);
    if (prog && (m.programaId === prog.id || m.programaId === prog.codigo)) return true;
    return false;
  };

  // Pre-calculated stats
  const matriculadosPeriodoActual = useMemo(() => {
    return matriculas.filter((m) => isSamePeriodo(m.periodoAcademico, periodoActualCode));
  }, [matriculas, periodoActualCode]);

  const matriculadosPeriodoAnterior = useMemo(() => {
    return matriculas.filter((m) => isSamePeriodo(m.periodoAcademico, periodoAnteriorCode));
  }, [matriculas, periodoAnteriorCode]);

  const uniqueEstudiantesActivos = useMemo(() => {
    const ids = new Set(matriculadosPeriodoActual.map((m) => m.estudianteId));
    return ids.size;
  }, [matriculadosPeriodoActual]);

  const uniqueEstudiantesAnteriores = useMemo(() => {
    const ids = new Set(matriculadosPeriodoAnterior.map((m) => m.estudianteId));
    return ids.size;
  }, [matriculadosPeriodoAnterior]);

  const countRegulares = useMemo(() => {
    return estudiantes.filter((e) => e.estado === 'Regular').length;
  }, [estudiantes]);

  const countEgresadosTitulados = useMemo(() => {
    return estudiantes.filter((e) => e.estado === 'Egresado' || e.estado === 'Titulado').length;
  }, [estudiantes]);

  // Program enrollment summary by selected period mode
  const programEnrollmentStats = useMemo(() => {
    let targetMatriculas = matriculas;
    let label = 'Todos los periodos';

    if (programPeriodView === 'ACTIVO') {
      targetMatriculas = matriculadosPeriodoActual;
      label = `Periodo Activo (${formatPeriodoDisplay(periodoActualCode)})`;
    } else if (programPeriodView === 'ANTERIOR') {
      targetMatriculas = matriculadosPeriodoAnterior;
      label = `Periodo Anterior (${formatPeriodoDisplay(periodoAnteriorCode)})`;
    } else if (programPeriodView === '2026') {
      targetMatriculas = matriculas.filter(
        (m) => isSamePeriodo(m.periodoAcademico, '2026-1') || isSamePeriodo(m.periodoAcademico, '2026-2')
      );
      label = 'Año Académico 2026';
    }

    const totalCount = targetMatriculas.length;

    const stats = programas.map((prog) => {
      const matching = targetMatriculas.filter((m) => matchMatriculaToProgram(m, prog.id));
      const count = matching.length;
      const percentage = totalCount > 0 ? (count / totalCount) * 100 : 0;
      const colorCfg = getProgramColor(prog.codigo, prog.color || prog.nombre);

      return {
        programa: prog,
        count,
        percentage,
        colorCfg,
      };
    });

    // Sort by count descending, then active status
    return {
      stats: stats.sort((a, b) => b.count - a.count),
      totalCount,
      label,
    };
  }, [
    programas,
    matriculas,
    matriculadosPeriodoActual,
    matriculadosPeriodoAnterior,
    programPeriodView,
    periodoActualCode,
    periodoAnteriorCode,
    modulos,
  ]);

  // Filter students based on all criteria
  const filteredEstudiantes = useMemo(() => {
    if (isEstudianteRole) {
      const myEst = estudiantes.filter((e) => e.personaId === currentUser?.personaId);
      return myEst.length > 0 ? myEst : (estudiantes.slice(0, 1));
    }
    const s = search.toLowerCase().trim();
    return estudiantes.filter((est) => {
      const persona = personas.find((p) => p.id === est.personaId);

      // 1. Search Filter
      if (s) {
        const fullName = `${persona?.nombres || ''} ${persona?.apellidoPaterno || ''} ${persona?.apellidoMaterno || ''}`.toLowerCase();
        
        const relatedMods = matriculas
          .filter(m => m.estudianteId === est.id)
          .map(m => {
             const mod = modulos.find(mod => mod.id === m.moduloId);
             return mod ? mod.nombre.toLowerCase() : '';
          })
          .join(' ');

        const matchesSearch =
          (est.codigoEstudiante || '').toLowerCase().includes(s) ||
          (persona?.numeroDocumento || '').includes(s) ||
          fullName.includes(s) ||
          (est.periodoIngreso || '').toLowerCase().includes(s) ||
          relatedMods.includes(s);
        if (!matchesSearch) return false;
      }

      const studentMats = matriculas.filter((m) => m.estudianteId === est.id);

      // 2. Program Filter
      if (progFilter !== 'ALL') {
        const progTarget = programas.find((p) => p.id === progFilter || p.codigo === progFilter);
        const isEnrolledInProg =
          studentMats.some((m) => matchMatriculaToProgram(m, progFilter)) ||
          est.programaId === progFilter ||
          (progTarget && est.programaId === progTarget.id) ||
          (progTarget && est.programaId === progTarget.codigo);
        if (!isEnrolledInProg) return false;
      }

      // 3. Status Filter
      if (statusFilter !== 'ALL') {
        const sorted = [...matriculas.filter(m => m.estudianteId === est.id)].sort((a, b) => new Date(b.fechaMatricula).getTime() - new Date(a.fechaMatricula).getTime());
        const latest = sorted[0];
        const estado = latest?.estadoMatricula || 'Proceso';
        if (estado.toUpperCase() !== statusFilter.toUpperCase()) {
          return false;
        }
      }

      // 4. Period Filter dropdown
      if (periodFilter !== 'ALL') {
        const hasMatInPeriod = studentMats.some((m) => isSamePeriodo(m.periodoAcademico, periodFilter));
        if (!hasMatInPeriod) return false;
      }

      // 5. Quick Stat Card Filter
      if (quickStatFilter === 'ACTIVO') {
        const hasActive = studentMats.some((m) => isSamePeriodo(m.periodoAcademico, periodoActualCode));
        if (!hasActive) return false;
      } else if (quickStatFilter === 'ANTERIOR') {
        const hasAnterior = studentMats.some((m) => isSamePeriodo(m.periodoAcademico, periodoAnteriorCode));
        if (!hasAnterior) return false;
      } else if (quickStatFilter === 'REGULAR') {
        if (est.estado !== 'Regular') return false;
      } else if (quickStatFilter === 'EGRESADO') {
        if (est.estado !== 'Egresado' && est.estado !== 'Titulado') return false;
      }

      return true;
    }).sort((a, b) => {
      // 1. Priorizar por la fecha de matrícula más reciente
      const matsA = matriculas.filter((m) => m.estudianteId === a.id);
      const matsB = matriculas.filter((m) => m.estudianteId === b.id);

      const latestMatA = matsA.reduce((max, m) => {
        const t = new Date(m.fechaMatricula || (m as any).createdAt || 0).getTime();
        return t > max ? t : max;
      }, 0);

      const latestMatB = matsB.reduce((max, m) => {
        const t = new Date(m.fechaMatricula || (m as any).createdAt || 0).getTime();
        return t > max ? t : max;
      }, 0);

      if (latestMatB !== latestMatA) {
        return latestMatB - latestMatA;
      }

      // 2. Desempate por fecha de ingreso / registro del estudiante o persona
      const perA = personas.find((p) => p.id === a.personaId);
      const perB = personas.find((p) => p.id === b.personaId);

      const dateA = new Date(a.fechaIngreso || (a as any).createdAt || perA?.fechaRegistro || 0).getTime();
      const dateB = new Date(b.fechaIngreso || (b as any).createdAt || perB?.fechaRegistro || 0).getTime();

      if (dateB !== dateA) {
        return dateB - dateA;
      }

      return (b.id || '').localeCompare(a.id || '');
    });
  }, [
    estudiantes,
    personas,
    matriculas,
    search,
    progFilter,
    statusFilter,
    periodFilter,
    quickStatFilter,
    periodoActualCode,
    periodoAnteriorCode,
    modulos,
    programas,
  ]);

  const [limitCount, setLimitCount] = useState<number | 'ALL'>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [search, progFilter, statusFilter, periodFilter, quickStatFilter, limitCount]);

  const totalItems = filteredEstudiantes.length;
  const pageSize = limitCount === 'ALL' ? totalItems : limitCount;
  const totalPages = Math.max(1, Math.ceil(totalItems / (pageSize || 1)));
  const effectivePage = Math.min(currentPage, totalPages);
  const displayedEstudiantes = limitCount === 'ALL'
    ? filteredEstudiantes
    : filteredEstudiantes.slice((effectivePage - 1) * pageSize, effectivePage * pageSize);

  const resetAllFilters = () => {
    setSearch('');
    setProgFilter('ALL');
    setStatusFilter('ALL');
    setPeriodFilter('ALL');
    setQuickStatFilter('ALL');
  };

  const hasActiveFilters =
    search !== '' ||
    progFilter !== 'ALL' ||
    statusFilter !== 'ALL' ||
    periodFilter !== 'ALL' ||
    quickStatFilter !== 'ALL';

  const getStatusBadge = (estado: string) => {
    const st = estado.toUpperCase();
    switch (st) {
      case 'PROCESO':
        return <Badge variant="neutral" size="sm" dot>Proceso</Badge>;
      case 'ACTIVO':
        return <Badge variant="success" size="sm" dot>Activo</Badge>;
      case 'CERTIFICADO':
        return <Badge variant="primary" size="sm" dot>Certificado</Badge>;
      case 'RESERVA':
        return <Badge variant="warning" size="sm" dot>Reserva</Badge>;
      case 'RETIRADO':
        return <Badge variant="danger" size="sm" dot>Retirado</Badge>;
      default:
        return <Badge variant="neutral" size="sm">{estado}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  Gestión de Estudiantes y Matrículas
                </h1>
                <span className="px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-md text-[10px] font-mono font-bold uppercase">
                  DNI ÚNICO
                </span>
                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-md text-[10px] font-mono font-bold uppercase">
                  PERIODO {formatPeriodoDisplay(periodoActivo)}
                </span>
                <span className="px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-md text-[10px] font-mono font-bold">
                  {estudiantes.length} REGISTROS
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Control del directorio de alumnos, historial académico, matrícula modular y avance curricular por programa CNOF
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {canCrearMatricula && !isEstudianteRole && (
              <>
                <button
                  onClick={() => setActiveView('importador')}
                  className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <UploadCloud className="w-4 h-4 text-blue-600" />
                  <span>Importar Excel</span>
                </button>
                <button
                  onClick={() => setIsMatriculaModalOpen(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Nueva Matrícula</span>
                </button>
              </>
            )}
            {isEstudianteRole && (
              <span className="px-3 py-1.5 bg-sky-50 text-sky-700 border border-sky-200 rounded-xl text-xs font-bold flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-sky-600" />
                <span>Mi Ficha de Matrícula Oficial</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 2. Main Navigation Toggle (3 Botones Superiores) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Botón 1: Directorio de Estudiantes */}
        <button
          onClick={() => {
            setActiveTab('estudiantes');
            setQuickStatFilter('ALL');
            setPeriodFilter('ALL');
          }}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
            activeTab === 'estudiantes' && quickStatFilter !== 'ACTIVO'
              ? 'bg-blue-50/90 border-blue-300 ring-2 ring-blue-500/20 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                activeTab === 'estudiantes' && quickStatFilter !== 'ACTIVO'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Directorio de Estudiantes
              </div>
              <div className="text-[11px] text-slate-500">
                Padrón académico unificado y fichas
              </div>
            </div>
          </div>
          <span
            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold ${
              activeTab === 'estudiantes' && quickStatFilter !== 'ACTIVO'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-700'
            }`}
          >
            {estudiantes.length}
          </span>
        </button>

        {/* Botón 2: Gestión de Secciones y Nóminas */}
        <button
          onClick={() => setActiveTab('secciones')}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
            activeTab === 'secciones'
              ? 'bg-blue-50/90 border-blue-300 ring-2 ring-blue-500/20 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                activeTab === 'secciones'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Gestión de Secciones y Nóminas
              </div>
              <div className="text-[11px] text-slate-500">
                Grupos modulares y nóminas oficiales
              </div>
            </div>
          </div>
          <span
            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold ${
              activeTab === 'secciones'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-700'
            }`}
          >
            {secciones.length}
          </span>
        </button>

        {/* Botón 3: Matriculados en el Periodo Seleccionado */}
        <button
          onClick={() => {
            setActiveTab('estudiantes');
            setQuickStatFilter(quickStatFilter === 'ACTIVO' ? 'ALL' : 'ACTIVO');
          }}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
            activeTab === 'estudiantes' && quickStatFilter === 'ACTIVO'
              ? 'bg-emerald-50/90 border-emerald-300 ring-2 ring-emerald-500/20 shadow-xs'
              : 'bg-white border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/30'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                activeTab === 'estudiantes' && quickStatFilter === 'ACTIVO'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-50 text-emerald-600'
              }`}
            >
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <span>
                  {programPeriodView === 'ACTIVO'
                    ? `${formatPeriodoDisplay(periodoActualCode)} (Activo)`
                    : programPeriodView === 'ANTERIOR'
                    ? `${formatPeriodoDisplay(periodoAnteriorCode)} (Anterior)`
                    : programPeriodView === '2026'
                    ? 'Año 2026'
                    : 'Todos los periodos'}
                </span>
                {programPeriodView === 'ACTIVO' && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
              </div>
              <div className="text-[11px] text-slate-500">
                {programEnrollmentStats.totalCount} matrículas
              </div>
            </div>
          </div>
          <span
            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold ${
              activeTab === 'estudiantes' && quickStatFilter === 'ACTIVO'
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-100 text-emerald-800'
            }`}
          >
            {matriculadosPeriodoActual.length}
          </span>
        </button>
      </div>

      {activeTab === 'estudiantes' ? (
        <>
          {/* 4. Cuadros Informativos de Matriculados por Programa (Visible únicamente al filtrar por Periodo Activo) */}
          {quickStatFilter === 'ACTIVO' && (
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <School className="w-4 h-4 text-blue-600" />
                  <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                    Matriculados por Programa de Estudio ({programEnrollmentStats.label})
                  </h3>
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md text-[10px] font-mono font-bold">
                    {programEnrollmentStats.totalCount} MATRÍCULAS
                  </span>
                </div>

                {/* Period Selector Buttons */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] text-slate-400 mr-1">Periodo a consultar:</span>
                  <div className="inline-flex p-0.5 bg-slate-100 rounded-lg border border-slate-200 text-xs">
                    <button
                      onClick={() => setProgramPeriodView('ACTIVO')}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                        programPeriodView === 'ACTIVO'
                          ? 'bg-white text-emerald-700 font-bold shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Activo ({formatPeriodoDisplay(periodoActualCode)})
                    </button>
                    <button
                      onClick={() => setProgramPeriodView('ANTERIOR')}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                        programPeriodView === 'ANTERIOR'
                          ? 'bg-white text-blue-700 font-bold shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Anterior ({formatPeriodoDisplay(periodoAnteriorCode)})
                    </button>
                    <button
                      onClick={() => setProgramPeriodView('2026')}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                        programPeriodView === '2026'
                          ? 'bg-white text-slate-900 font-bold shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Año 2026
                    </button>
                    <button
                      onClick={() => setProgramPeriodView('ALL')}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                        programPeriodView === 'ALL'
                          ? 'bg-white text-slate-900 font-bold shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Histórico
                    </button>
                  </div>
                </div>
              </div>

              {/* Program Cards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 pt-3">
                {programEnrollmentStats.stats.map(({ programa, count, percentage, colorCfg }) => {
                  const isSelected = progFilter === programa.id || progFilter === programa.codigo;

                  return (
                    <button
                      key={programa.id}
                      onClick={() => {
                        setProgFilter(isSelected ? 'ALL' : programa.id);
                      }}
                      title={`Clic para filtrar estudiantes de ${programa.nombre}`}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden group ${
                        isSelected
                          ? 'ring-2 ring-blue-500 shadow-sm font-bold'
                          : 'hover:border-slate-300 hover:shadow-2xs bg-white'
                      }`}
                      style={{
                        backgroundColor: isSelected ? colorCfg.colorBgLight : undefined,
                        borderColor: isSelected ? colorCfg.colorBorder : undefined,
                      }}
                    >
                      {/* Top row: Program code and color dot */}
                      <div className="flex items-center justify-between gap-1.5 mb-1.5">
                        <div className="flex items-center gap-1.5 truncate">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: colorCfg.colorHex }}
                          />
                          <span className="font-mono text-[10px] font-bold text-slate-500 truncate">
                            {programa.codigo}
                          </span>
                        </div>
                        {isSelected && (
                          <span className="px-1.5 py-0.2 bg-blue-600 text-white rounded text-[9px] font-bold uppercase shrink-0">
                            Filtrado
                          </span>
                        )}
                      </div>

                      {/* Program Short Name */}
                      <div
                        className="text-xs font-bold truncate leading-snug"
                        style={{ color: isSelected ? colorCfg.colorText : '#1e293b' }}
                      >
                        {colorCfg.nombreCorto || programa.nombre}
                      </div>

                      {/* Metric row: Count & Percentage */}
                      <div className="flex items-baseline justify-between mt-2 pt-1 border-t border-slate-100">
                        <div className="flex items-baseline gap-1">
                          <span
                            className="text-lg font-black font-mono"
                            style={{ color: isSelected ? colorCfg.colorText : '#0f172a' }}
                          >
                            {count}
                          </span>
                          <span className="text-[10px] text-slate-400">estudiantes</span>
                        </div>
                        <span
                          className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded"
                          style={{
                            backgroundColor: isSelected ? '#ffffff' : colorCfg.colorBgLight,
                            color: colorCfg.colorText,
                          }}
                        >
                          {percentage.toFixed(1)}%
                        </span>
                      </div>

                      {/* Mini progress bar */}
                      <div className="w-full bg-slate-100 h-1 rounded-full mt-1.5 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(100, percentage)}%`,
                            backgroundColor: colorCfg.colorHex,
                          }}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>

              {progFilter !== 'ALL' && (
                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500">
                    Mostrando estudiantes de:{' '}
                    <strong className="text-slate-800">
                      {programas.find((p) => p.id === progFilter || p.codigo === progFilter)?.nombre}
                    </strong>
                  </span>
                  <button
                    onClick={() => setProgFilter('ALL')}
                    className="text-blue-600 hover:text-blue-800 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    Quitar filtro de programa
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 5. Filter and Search Bar (Padrón Maestro Style) */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por DNI, nombres, apellidos o periodo de ingreso..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium"
              />
            </div>

            {/* Filter Dropdowns and Reset */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <select
                value={progFilter}
                onChange={(e) => setProgFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:bg-white focus:outline-none"
              >
                <option value="ALL">Todos los Programas ({programas.length})</option>
                {programas.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.codigo} - {p.nombre}
                  </option>
                ))}
              </select>

              <select
                value={periodFilter}
                onChange={(e) => setPeriodFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:bg-white focus:outline-none"
              >
                <option value="ALL">Todos los Periodos</option>
                <option value="2026-2">Periodo 2026-II (Activo)</option>
                <option value="2026-1">Periodo 2026-I</option>
                <option value="2025-2">Periodo 2025-II</option>
                <option value="2025-1">Periodo 2025-I</option>
              </select>

              <select
                className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer transition-all"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="ALL">Todos los Estados</option>
                <option value="Proceso">Proceso</option>
                <option value="Activo">Activo</option>
                <option value="Certificado">Certificado</option>
                <option value="Reserva">Reserva</option>
                <option value="Retirado">Retirado</option>
              </select>

              {hasActiveFilters && (
                <button
                  onClick={resetAllFilters}
                  title="Restablecer todos los filtros"
                  className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Limpiar</span>
                </button>
              )}
            </div>
          </div>

          {/* 6. Students Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between text-xs">
              <div className="font-bold text-slate-700">
                Mostrando <span className="font-mono text-blue-600">{filteredEstudiantes.length}</span> de{' '}
                <span className="font-mono text-slate-500">{estudiantes.length}</span> estudiantes registrados
              </div>
              {hasActiveFilters && (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-medium">
                    Filtros activos
                  </span>
                  <button
                    onClick={resetAllFilters}
                    className="text-[11px] text-blue-600 hover:underline font-bold cursor-pointer"
                  >
                    Restablecer
                  </button>
                </div>
              )}
            </div>

            {filteredEstudiantes.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                  <UserPlus className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-800">
                  {hasActiveFilters
                    ? 'No se encontraron estudiantes con los filtros aplicados'
                    : 'Aún no hay estudiantes registrados'}
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mt-1">
                  {hasActiveFilters
                    ? 'Intenta restablecer la búsqueda o los filtros de programa, periodo y estado.'
                    : 'Puedes registrar nuevos estudiantes individualmente o importar un padrón de alumnos desde un archivo Excel.'}
                </p>
                <div className="flex gap-2.5 mt-4">
                  {hasActiveFilters ? (
                    <button
                      onClick={resetAllFilters}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Limpiar Filtros</span>
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => setActiveView('importador')}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <UploadCloud className="w-4 h-4" />
                        <span>Importar Padrón Excel</span>
                      </button>
                      <button
                        onClick={() => setIsMatriculaModalOpen(true)}
                        className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <UserPlus className="w-4 h-4" />
                        <span>Registrar Matrícula</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="px-4 py-3">Código / DNI</th>
                      <th className="px-4 py-3">Estudiante</th>
                      <th className="px-4 py-3">Programa de Estudio</th>
                      <th className="px-4 py-3">Ingreso / Historial</th>
                      <th className="px-4 py-3">Estado</th>
                      <th className="px-4 py-3 text-right">Ficha Académica</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {displayedEstudiantes.map((est) => {
                      const persona = personas.find((p) => p.id === est.personaId);
                      const studentMats = matriculas.filter((m) => m.estudianteId === est.id);
                      
                      // Comprehensive program resolution:
                      // 1. From estudiante record
                      // 2. From matriculas programaId
                      // 3. From matricula's moduloId -> modulo.programaId
                      let prog = est.programaId
                        ? programas.find((p) => p.id === est.programaId || p.codigo === est.programaId)
                        : null;

                      if (!prog && studentMats.length > 0) {
                        for (const m of studentMats) {
                          if (m.programaId) {
                            prog = programas.find((p) => p.id === m.programaId || p.codigo === m.programaId);
                            if (prog) break;
                          }
                          if (m.moduloId) {
                            const mod = modulos.find((x) => x.id === m.moduloId);
                            if (mod?.programaId) {
                              prog = programas.find((p) => p.id === mod.programaId || p.codigo === mod.programaId);
                              if (prog) break;
                            }
                          }
                        }
                      }

                      const latestMat = studentMats[0];
                      const colorCfg = getProgramColor(prog?.codigo, prog?.color || prog?.nombre);
                      const matCount = studentMats.length;

                      return (
                        <tr
                          key={est.id}
                          onClick={() => setSelectedEstudianteId(est.id)}
                          className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                        >
                          <td className="px-4 py-3">
                            <div className="inline-flex items-center px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-mono font-bold text-[11px] border border-blue-200 mb-1">
                              {est.codigoEstudiante ? `Cód: ${est.codigoEstudiante}` : 'Sin código'}
                            </div>
                            <div className="text-[11px] text-slate-700 font-mono font-bold">
                              DNI: {persona?.numeroDocumento || '---'}
                            </div>
                          </td>

                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              {persona?.fotoUrl && !persona.fotoUrl.includes('\\') ? (
                                <img
                                  src={persona.fotoUrl}
                                  alt={persona.nombres}
                                  className="w-8 h-8 rounded-lg object-cover border border-slate-200 shadow-2xs shrink-0"
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display = 'none';
                                  }}
                                />
                              ) : (
                                <div
                                  className="w-8 h-8 rounded-lg font-bold text-xs flex items-center justify-center border shrink-0"
                                  style={{
                                    backgroundColor: colorCfg.colorBgLight,
                                    borderColor: colorCfg.colorBorder,
                                    color: colorCfg.colorText,
                                  }}
                                >
                                  {persona?.nombres?.[0] || 'E'}
                                  {persona?.apellidoPaterno?.[0] || ''}
                                </div>
                              )}
                              <div>
                                <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                                  {persona?.apellidoPaterno} {persona?.apellidoMaterno}, {persona?.nombres}
                                </div>
                                <div className="text-[11px] text-slate-500 mt-0.5">
                                  {persona?.telefono || 'Sin teléfono'} • {persona?.correo || 'Sin correo'}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-3">
                            {prog ? (
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className="w-2 h-2 rounded-full shrink-0"
                                    style={{ backgroundColor: colorCfg.colorHex }}
                                  />
                                  <span className="font-semibold text-slate-900">{prog.nombre}</span>
                                </div>
                                <div className="text-[10px] text-slate-400 font-mono">
                                  {prog.codigo} • {prog.nivelFormativo}
                                </div>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (persona) {
                                    setSelectedPersonaIdForMatricula(persona.id);
                                    setIsMatriculaModalOpen(true);
                                  }
                                }}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300/80 text-[11px] font-semibold transition-all hover:scale-[1.02] shadow-2xs cursor-pointer group/btn"
                                title="Haga clic para matricular a este estudiante en un módulo"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
                                <span>Pendiente de matrícula</span>
                                <span className="text-[10px] bg-amber-200/80 text-amber-900 px-1.5 py-0.2 rounded font-bold ml-0.5 group-hover/btn:bg-amber-300">
                                  + Matricular
                                </span>
                              </button>
                            )}
                          </td>

                          <td className="px-4 py-3">
                            <div className="font-medium text-slate-800">
                              Ingreso: {est.periodoIngreso || '—'}
                            </div>
                            <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                              <span className={`px-1.5 py-0.2 rounded font-mono font-semibold ${
                                matCount === 0 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                              }`}>
                                {matCount} matrícula(s)
                              </span>
                              {latestMat && (
                                <span className="text-blue-600 font-mono font-bold">
                                  Últ: {formatPeriodoDisplay(latestMat.periodoAcademico)}
                                </span>
                              )}
                            </div>
                            {latestMat?.condicionArancelaria && latestMat.condicionArancelaria !== 'REGULAR' && (
                              <div className="mt-1">
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 inline-block">
                                  {latestMat.condicionArancelaria === 'EXONERADO' ? 'Exonerado CONADIS' :
                                   latestMat.condicionArancelaria === 'CONVENIO' ? `Convenio: ${latestMat.convenioNombre || 'Institucional'}` :
                                   latestMat.condicionArancelaria === 'BECA_COMPLETA' ? 'Beca 100%' :
                                   latestMat.condicionArancelaria === 'SEMIBECA' ? 'Semibeca 50%' : 'Caso Social'}
                                </span>
                              </div>
                            )}
                          </td>

                          <td className="px-4 py-3">
                            {latestMat ? (
                              <select
                                value={
                                  latestMat.estadoMatricula?.toUpperCase() === 'ACTIVA'
                                    ? 'ACTIVO'
                                    : latestMat.estadoMatricula?.toUpperCase() === 'INACTIVA'
                                    ? 'PROCESO'
                                    : latestMat.estadoMatricula?.toUpperCase() || 'ACTIVO'
                                }
                                onChange={async (e) => {
                                  e.stopPropagation();
                                  await updateMatricula(latestMat.id, { estadoMatricula: e.target.value });
                                }}
                                onClick={(e) => e.stopPropagation()}
                                className={`text-[11px] font-bold rounded-lg px-2 py-1 border cursor-pointer uppercase ${
                                  latestMat?.estadoMatricula?.toUpperCase() === 'RETIRADO'
                                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                                    : latestMat?.estadoMatricula?.toUpperCase() === 'RESERVA'
                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                    : latestMat?.estadoMatricula?.toUpperCase() === 'CERTIFICADO'
                                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                                    : latestMat?.estadoMatricula?.toUpperCase() === 'ACTIVA' || latestMat?.estadoMatricula?.toUpperCase() === 'ACTIVO'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : 'bg-slate-100 text-slate-600 border-slate-300'
                                }`}
                              >
                                <option value="ACTIVO">Activo</option>
                                <option value="PROCESO">Proceso</option>
                                <option value="CERTIFICADO">Certificado</option>
                                <option value="RESERVA">Reserva</option>
                                <option value="RETIRADO">Retirado</option>
                              </select>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                                Sin matrícula
                              </span>
                            )}
                          </td>

                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {latestMat && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setPrintMatriculaId(latestMat.id);
                                  }}
                                  className="px-2.5 py-1 text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg flex items-center gap-1 text-[11px] font-semibold transition-colors cursor-pointer shadow-2xs"
                                  title="Imprimir Ficha Oficial de Matrícula"
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                  <span>Ficha</span>
                                </button>
                              )}
                              <div className="inline-flex items-center gap-1 text-slate-600 font-bold group-hover:text-blue-600 bg-slate-100 group-hover:bg-blue-50 px-2.5 py-1 rounded-lg transition-colors text-[11px]">
                                <span>Ver</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Barra de Paginación y Control de Registros */}
            {totalItems > 0 && (
              <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <span>
                    Mostrando <strong className="text-slate-900">{displayedEstudiantes.length}</strong> de <strong className="text-slate-900">{totalItems}</strong> estudiantes (más recientes primero)
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-slate-500">Ver:</span>
                    <select
                      value={limitCount}
                      onChange={(e) => {
                        const val = e.target.value === 'ALL' ? 'ALL' : Number(e.target.value);
                        setLimitCount(val);
                      }}
                      className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
                    >
                      <option value={10}>10 recientes</option>
                      <option value={25}>25 por página</option>
                      <option value={50}>50 por página</option>
                      <option value="ALL">Todos ({totalItems})</option>
                    </select>
                  </div>

                  {limitCount !== 'ALL' && totalPages > 1 && (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={effectivePage === 1}
                        className="p-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        title="Página anterior"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="text-[11px] font-medium px-1">
                        {effectivePage} de {totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={effectivePage === totalPages}
                        className="p-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        title="Página siguiente"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <SeccionesList />
      )}

      {/* Student Details Slide-Over Drawer */}
      {selectedEstudianteId && (
        <EstudianteDrawer
          estudianteId={selectedEstudianteId}
          onClose={() => setSelectedEstudianteId(null)}
        />
      )}

      {/* New Matricula Wizard */}
      <NuevaMatriculaModal
        isOpen={isMatriculaModalOpen}
        initialPersonaId={selectedPersonaIdForMatricula}
        onClose={() => {
          setIsMatriculaModalOpen(false);
          setSelectedPersonaIdForMatricula(undefined);
        }}
        onSuccess={(matriculaId) => setPrintMatriculaId(matriculaId)}
      />

      {/* Ficha de Matrícula (Print View) */}
      {printMatriculaId && (
        <FichaMatriculaPrint
          isOpen={!!printMatriculaId}
          onClose={() => setPrintMatriculaId(null)}
          matriculaId={printMatriculaId}
        />
      )}
    </div>
  );
};
