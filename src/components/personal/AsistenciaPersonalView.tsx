import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { AsistenciaTrabajador, EstadoAsistenciaTrabajador, ResumenMensualTrabajador } from '../../types';
import { Badge } from '../common/Badge';
import { useReactToPrint } from 'react-to-print';
import { comparePersonasAlphabetical } from '../../utils/sortPersonas';
import {
  Clock,
  Calendar,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  Save,
  Printer,
  Sparkles,
  Users,
  Search,
  Check,
  X,
  FileSpreadsheet,
  Monitor,
  Fingerprint,
  RotateCcw,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

interface AsistenciaLocal {
  id?: string;
  horaEntrada: string;
  horaSalida: string;
  estadoAsistencia: EstadoAsistenciaTrabajador | string;
  minutosTardanza: number;
  observacion: string;
  tipoRegistro: string;
}

export const AsistenciaPersonalView: React.FC = () => {
  const {
    trabajadores,
    personas,
    institucion,
    currentUser,
    addToast,
    fetchAsistenciasTrabajadores,
    saveAsistenciasTrabajadoresBatch,
    marcarAsistenciaTrabajadorDni,
    fetchReporteMensualPersonal,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'diario' | 'parte-mensual' | 'kiosco'>('diario');

  // ==========================================
  // ESTADOS PARA REGISTRO DIARIO
  // ==========================================
  const [fechaDiario, setFechaDiario] = useState<string>(new Date().toISOString().split('T')[0]);
  const [cargoFiltro, setCargoFiltro] = useState<string>('TODOS');
  const [searchPersonal, setSearchPersonal] = useState<string>('');
  const [loadingDiario, setLoadingDiario] = useState<boolean>(false);
  const [savingDiario, setSavingDiario] = useState<boolean>(false);

  // Mapa local de edición para el día seleccionado
  const [asistenciasDia, setAsistenciasDia] = useState<Record<string, AsistenciaLocal>>({});

  // Cargar asistencias al cambiar de fecha
  useEffect(() => {
    if (activeTab === 'diario' && fechaDiario) {
      setLoadingDiario(true);
      fetchAsistenciasTrabajadores({ fecha: fechaDiario })
        .then((records) => {
          const map: Record<string, AsistenciaLocal> = {};
          records.forEach((r) => {
            map[r.trabajadorId] = {
              id: r.id,
              horaEntrada: r.horaEntrada || '',
              horaSalida: r.horaSalida || '',
              estadoAsistencia: r.estadoAsistencia || 'PRESENTE',
              minutosTardanza: r.minutosTardanza || 0,
              observacion: r.observacion || '',
              tipoRegistro: r.tipoRegistro || 'MANUAL',
            };
          });
          setAsistenciasDia(map);
        })
        .finally(() => setLoadingDiario(false));
    }
  }, [fechaDiario, activeTab]);

  // Lista de trabajadores activos enriquecida con persona
  const trabajadoresActivos = trabajadores
    .filter((t) => t.estado === 'Activo')
    .map((t) => {
      const p = personas.find((per) => per.id === t.personaId);
      return {
        ...t,
        persona: p,
        nombreCompleto: p ? `${p.apellidoPaterno} ${p.apellidoMaterno || ''}, ${p.nombres}`.trim() : 'Trabajador',
        dni: p?.numeroDocumento || '---',
      };
    })
    .sort((a, b) => comparePersonasAlphabetical(a.persona, b.persona));

  const trabajadoresFiltrados = trabajadoresActivos.filter((t) => {
    if (cargoFiltro !== 'TODOS') {
      const cargoUpper = (t.cargo || '').toUpperCase();
      if (cargoFiltro === 'DOCENTE' && !cargoUpper.includes('DOCENTE') && !cargoUpper.includes('PROFESOR')) return false;
      if (cargoFiltro === 'ADMINISTRATIVO' && !cargoUpper.includes('ADMINISTRATIV') && !cargoUpper.includes('SECRETAR') && !cargoUpper.includes('AUXILIAR')) return false;
      if (cargoFiltro === 'DIRECTIVO' && !cargoUpper.includes('DIRECT')) return false;
    }
    if (searchPersonal.trim()) {
      const query = searchPersonal.toLowerCase();
      return t.nombreCompleto.toLowerCase().includes(query) || t.dni.includes(query);
    }
    return true;
  });

  const handleUpdateItem = (trabajadorId: string, updates: Partial<AsistenciaLocal>) => {
    setAsistenciasDia((prev) => {
      const current = prev[trabajadorId] || {
        horaEntrada: '',
        horaSalida: '',
        estadoAsistencia: 'PRESENTE',
        minutosTardanza: 0,
        observacion: '',
        tipoRegistro: 'MANUAL',
      };
      return {
        ...prev,
        [trabajadorId]: { ...current, ...updates },
      };
    });
  };

  const handleMarcarTodosATiempo = () => {
    setAsistenciasDia((prev) => {
      const updated = { ...prev };
      trabajadoresActivos.forEach((t) => {
        const curr = updated[t.id];
        updated[t.id] = {
          horaEntrada: curr?.horaEntrada || '07:45',
          horaSalida: curr?.horaSalida || '13:15',
          estadoAsistencia: 'PRESENTE',
          minutosTardanza: 0,
          observacion: curr?.observacion || '',
          tipoRegistro: 'MANUAL',
        };
      });
      return updated;
    });
    addToast('Marcado rápido aplicado', 'Se asignó horario puntual y estado PRESENTE a todo el personal.', 'info');
  };

  const handleSaveBatchDiario = async () => {
    const registros = (Object.entries(asistenciasDia) as [string, AsistenciaLocal][])
      .filter(([_, data]) => !!data.estadoAsistencia || !!data.horaEntrada)
      .map(([trabajadorId, data]) => ({
        trabajadorId,
        horaEntrada: data.horaEntrada || null,
        horaSalida: data.horaSalida || null,
        estadoAsistencia: data.estadoAsistencia,
        observacion: data.observacion || null,
        minutosTardanza: data.minutosTardanza || 0,
        tipoRegistro: data.tipoRegistro || 'MANUAL',
      }));

    if (registros.length === 0) {
      addToast('Sin cambios', 'No hay asistencias registradas para guardar en esta fecha.', 'info');
      return;
    }

    setSavingDiario(true);
    await saveAsistenciasTrabajadoresBatch({
      fecha: fechaDiario,
      registros,
    });
    setSavingDiario(false);
  };

  // Contadores del día
  const totalTrabajadores = trabajadoresActivos.length;
  const itemsDia = Object.values(asistenciasDia) as AsistenciaLocal[];
  const countPresentes = itemsDia.filter((v) => v.estadoAsistencia === 'PRESENTE').length;
  const countTardanzas = itemsDia.filter((v) => v.estadoAsistencia === 'TARDANZA').length;
  const countFaltas = itemsDia.filter(
    (v) => v.estadoAsistencia === 'FALTA_INJUSTIFICADA' || v.estadoAsistencia === 'FALTA_JUSTIFICADA'
  ).length;
  const countPermisos = itemsDia.filter(
    (v) => v.estadoAsistencia === 'PERMISO' || v.estadoAsistencia === 'LICENCIA' || v.estadoAsistencia === 'COMISION'
  ).length;

  // ==========================================
  // ESTADOS PARA PARTE MENSUAL UGEL
  // ==========================================
  const [mesReporte, setMesReporte] = useState<number>(new Date().getMonth() + 1);
  const [anioReporte, setAnioReporte] = useState<number>(new Date().getFullYear());
  const [reporteMensual, setReporteMensual] = useState<ResumenMensualTrabajador[]>([]);
  const [loadingReporte, setLoadingReporte] = useState<boolean>(false);

  const printParteRef = useRef<HTMLDivElement>(null);
  const handlePrintParte = useReactToPrint({
    contentRef: printParteRef,
    documentTitle: `Parte_Mensual_Asistencia_${mesReporte}_${anioReporte}_CETPRO_Juanjui`,
  });

  const loadReporteMensual = () => {
    setLoadingReporte(true);
    fetchReporteMensualPersonal(mesReporte, anioReporte)
      .then((data) => setReporteMensual(data || []))
      .finally(() => setLoadingReporte(false));
  };

  useEffect(() => {
    if (activeTab === 'parte-mensual') {
      loadReporteMensual();
    }
  }, [activeTab, mesReporte, anioReporte]);

  // ==========================================
  // ESTADOS PARA MODO KIOSCO DNI
  // ==========================================
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [kioscoDni, setKioscoDni] = useState<string>('');
  const [kioscoLoading, setKioscoLoading] = useState<boolean>(false);
  const [kioscoResult, setKioscoResult] = useState<{
    status: 'success' | 'error' | null;
    tipo?: string;
    hora?: string;
    nombre?: string;
    cargo?: string;
    message?: string;
  }>({ status: null });

  const [ultimasMarcaciones, setUltimasMarcaciones] = useState<
    Array<{
      hora: string;
      nombre: string;
      cargo: string;
      tipo: string;
      dni: string;
    }>
  >([]);

  const kioscoInputRef = useRef<HTMLInputElement>(null);

  // Reloj digital en vivo
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Mantener foco en el input del kiosco
  useEffect(() => {
    if (activeTab === 'kiosco') {
      kioscoInputRef.current?.focus();
    }
  }, [activeTab, kioscoResult]);

  const handleKioscoSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const dniClean = kioscoDni.trim();
    if (!dniClean || dniClean.length < 8) {
      setKioscoResult({
        status: 'error',
        message: 'Por favor ingrese un DNI válido de 8 dígitos.',
      });
      return;
    }

    setKioscoLoading(true);
    const res = await marcarAsistenciaTrabajadorDni(dniClean);
    setKioscoLoading(false);

    if (res.success && res.trabajador) {
      setKioscoResult({
        status: 'success',
        tipo: res.tipo,
        hora: res.hora,
        nombre: res.trabajador.nombreCompleto,
        cargo: res.trabajador.cargo,
        message: res.message,
      });

      setUltimasMarcaciones((prev) => [
        {
          hora: res.hora || '',
          nombre: res.trabajador.nombreCompleto,
          cargo: res.trabajador.cargo,
          tipo: res.tipo || 'ENTRADA',
          dni: dniClean,
        },
        ...prev.slice(0, 4),
      ]);

      setKioscoDni('');

      // Auto-ocultar feedback después de 4 segundos
      setTimeout(() => {
        setKioscoResult((prev) => (prev.status === 'success' ? { status: null } : prev));
        kioscoInputRef.current?.focus();
      }, 4000);
    } else {
      setKioscoResult({
        status: 'error',
        message: res.message || 'No se encontró trabajador activo con el DNI ingresado.',
      });
      setKioscoDni('');
      setTimeout(() => {
        setKioscoResult((prev) => (prev.status === 'error' ? { status: null } : prev));
        kioscoInputRef.current?.focus();
      }, 3500);
    }
  };

  const mesesNombres = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  return (
    <div className="space-y-6">
      {/* Cabecera Principal */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  Control de Asistencia del Personal
                </h1>
                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md text-[10px] font-mono font-bold uppercase">
                  D.L. 276 / LEY 29944
                </span>
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-[10px] font-mono font-bold uppercase">
                  PARTE MENSUAL UGEL
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Registro diario de jornada, horas de entrada/salida, tardanzas acumuladas y terminal de auto-marcación
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {activeTab === 'diario' && (
              <>
                <button
                  type="button"
                  onClick={() => setActiveTab('kiosco')}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Abrir terminal para que el personal marque con su DNI"
                >
                  <Monitor className="w-4 h-4 text-indigo-600" />
                  <span>Modo Kiosco DNI</span>
                </button>
                <button
                  type="button"
                  onClick={handleSaveBatchDiario}
                  disabled={savingDiario}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{savingDiario ? 'Guardando...' : 'Guardar Asistencias'}</span>
                </button>
              </>
            )}

            {activeTab === 'parte-mensual' && (
              <button
                type="button"
                onClick={() => handlePrintParte()}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Parte Mensual</span>
              </button>
            )}

            {activeTab === 'kiosco' && (
              <button
                type="button"
                onClick={() => setActiveTab('diario')}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Volver al Panel Administrativo</span>
              </button>
            )}
          </div>
        </div>

        {/* Subpestañas de navegación */}
        <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveTab('diario')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'diario'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>1. Registro Diario del Personal</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('parte-mensual')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'parte-mensual'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>2. Parte Mensual Consolidado (UGEL)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('kiosco')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'kiosco'
                ? 'bg-purple-600 text-white shadow-2xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Fingerprint className="w-3.5 h-3.5" />
            <span>3. Terminal Kiosco de Marcación</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* PESTAÑA 1: REGISTRO DIARIO (PANEL ADMINISTRATIVO)        */}
      {/* ======================================================== */}
      {activeTab === 'diario' && (
        <div className="space-y-4">
          {/* Barra de Filtros y Controles */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Selector de Fecha */}
              <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 border border-slate-200 rounded-xl text-xs">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-500 font-semibold text-[11px]">Fecha:</span>
                <input
                  type="date"
                  value={fechaDiario}
                  onChange={(e) => setFechaDiario(e.target.value)}
                  className="font-semibold text-slate-800 focus:outline-none bg-transparent cursor-pointer"
                />
                <button
                  type="button"
                  onClick={() => setFechaDiario(new Date().toISOString().split('T')[0])}
                  className="px-1.5 py-0.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded text-[10px] font-bold cursor-pointer"
                >
                  Hoy
                </button>
              </div>

              {/* Filtro por Cargo */}
              <select
                value={cargoFiltro}
                onChange={(e) => setCargoFiltro(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:bg-white"
              >
                <option value="TODOS">Todos los Cargos</option>
                <option value="DOCENTE">Docentes</option>
                <option value="ADMINISTRATIVO">Personal Administrativo</option>
                <option value="DIRECTIVO">Directivos</option>
              </select>

              {/* Búsqueda por texto */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar por DNI o nombre..."
                  value={searchPersonal}
                  onChange={(e) => setSearchPersonal(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none w-52"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleMarcarTodosATiempo}
                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                title="Llenar horas estándar (07:45 - 13:15) y estado PRESENTE"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Marcar Todos a Hora</span>
              </button>

              <button
                type="button"
                onClick={handleSaveBatchDiario}
                disabled={savingDiario}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{savingDiario ? 'Guardando...' : 'Guardar'}</span>
              </button>
            </div>
          </div>

          {/* Tarjetas de Métricas del Día */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
              <div className="text-slate-500 font-semibold text-[11px]">Total Nómina</div>
              <div className="text-lg font-bold text-slate-800 mt-0.5">{totalTrabajadores}</div>
            </div>
            <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-200 shadow-2xs">
              <div className="text-emerald-700 font-semibold text-[11px] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Presentes
              </div>
              <div className="text-lg font-bold text-emerald-800 mt-0.5">{countPresentes}</div>
            </div>
            <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-200 shadow-2xs">
              <div className="text-amber-700 font-semibold text-[11px] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Tardanzas
              </div>
              <div className="text-lg font-bold text-amber-800 mt-0.5">{countTardanzas}</div>
            </div>
            <div className="bg-rose-50/70 p-3 rounded-xl border border-rose-200 shadow-2xs">
              <div className="text-rose-700 font-semibold text-[11px] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Inasistencias
              </div>
              <div className="text-lg font-bold text-rose-800 mt-0.5">{countFaltas}</div>
            </div>
            <div className="bg-sky-50/70 p-3 rounded-xl border border-sky-200 shadow-2xs col-span-2 sm:col-span-1">
              <div className="text-sky-700 font-semibold text-[11px] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-500" /> Permiso/Lic.
              </div>
              <div className="text-lg font-bold text-sky-800 mt-0.5">{countPermisos}</div>
            </div>
          </div>

          {/* Tabla de Asistencias Diarias */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-3.5 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700">
                Nómina de Asistencia del Día: <span className="text-indigo-600">{fechaDiario}</span>
              </span>
              {loadingDiario && (
                <span className="text-indigo-600 animate-pulse font-semibold">Cargando registros...</span>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-3.5 py-3 w-10 text-center">N°</th>
                    <th className="px-3.5 py-3 min-w-[200px]">DNI / Personal</th>
                    <th className="px-3.5 py-3 w-32">Cargo / Condición</th>
                    <th className="px-3.5 py-3 w-24 text-center">Entrada</th>
                    <th className="px-3.5 py-3 w-24 text-center">Salida</th>
                    <th className="px-3.5 py-3 w-24 text-center">Tardanza</th>
                    <th className="px-3.5 py-3 min-w-[170px]">Estado Laboral</th>
                    <th className="px-3.5 py-3 min-w-[200px]">Observación / Justificación</th>
                    <th className="px-3.5 py-3 w-20 text-center">Origen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {trabajadoresFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-8 text-center text-slate-400">
                        No hay personal activo que coincida con el filtro.
                      </td>
                    </tr>
                  ) : (
                    trabajadoresFiltrados.map((t, index) => {
                      const item = asistenciasDia[t.id] || {
                        horaEntrada: '',
                        horaSalida: '',
                        estadoAsistencia: 'PRESENTE',
                        minutosTardanza: 0,
                        observacion: '',
                        tipoRegistro: 'MANUAL',
                      };

                      return (
                        <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-3.5 py-2.5 text-center font-mono text-slate-400">
                            {(index + 1).toString().padStart(2, '0')}
                          </td>
                          <td className="px-3.5 py-2.5">
                            <div className="font-semibold text-slate-900">{t.nombreCompleto}</div>
                            <div className="text-[11px] text-slate-400 font-mono">DNI: {t.dni}</div>
                          </td>
                          <td className="px-3.5 py-2.5">
                            <div className="font-medium text-slate-700 text-[11px]">{t.cargo || 'Docente'}</div>
                            <div className="text-[10px] text-slate-400">{t.condicion || 'Nombrado'}</div>
                          </td>
                          <td className="px-3.5 py-2.5 text-center">
                            <input
                              type="time"
                              value={item.horaEntrada ? item.horaEntrada.slice(0, 5) : ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                // Auto-calcular tardanza si hora > 08:00
                                let tardanzaMin = 0;
                                let nuevoEstado = item.estadoAsistencia;
                                if (val) {
                                  const [h, m] = val.split(':').map(Number);
                                  if (h > 8 || (h === 8 && m > 10)) {
                                    tardanzaMin = (h - 8) * 60 + (m - 10);
                                    nuevoEstado = 'TARDANZA';
                                  } else {
                                    nuevoEstado = 'PRESENTE';
                                  }
                                }
                                handleUpdateItem(t.id, {
                                  horaEntrada: val ? `${val}:00` : '',
                                  minutosTardanza: tardanzaMin,
                                  estadoAsistencia: nuevoEstado,
                                });
                              }}
                              className="w-24 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-center font-mono font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
                            />
                          </td>
                          <td className="px-3.5 py-2.5 text-center">
                            <input
                              type="time"
                              value={item.horaSalida ? item.horaSalida.slice(0, 5) : ''}
                              onChange={(e) =>
                                handleUpdateItem(t.id, {
                                  horaSalida: e.target.value ? `${e.target.value}:00` : '',
                                })
                              }
                              className="w-24 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-center font-mono font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs"
                            />
                          </td>
                          <td className="px-3.5 py-2.5 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <input
                                type="number"
                                min={0}
                                value={item.minutosTardanza}
                                onChange={(e) =>
                                  handleUpdateItem(t.id, {
                                    minutosTardanza: Math.max(0, parseInt(e.target.value, 10) || 0),
                                    estadoAsistencia: parseInt(e.target.value, 10) > 0 ? 'TARDANZA' : item.estadoAsistencia,
                                  })
                                }
                                className="w-14 px-1 py-1 bg-slate-50 border border-slate-200 rounded-lg text-center font-mono font-bold text-amber-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs"
                              />
                              <span className="text-[10px] text-slate-400">min</span>
                            </div>
                          </td>
                          <td className="px-3.5 py-2.5">
                            <select
                              value={item.estadoAsistencia}
                              onChange={(e) =>
                                handleUpdateItem(t.id, {
                                  estadoAsistencia: e.target.value as EstadoAsistenciaTrabajador,
                                })
                              }
                              className={`w-full px-2 py-1 rounded-lg text-xs font-semibold focus:outline-none border ${
                                item.estadoAsistencia === 'PRESENTE'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : item.estadoAsistencia === 'TARDANZA'
                                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                                  : item.estadoAsistencia === 'FALTA_INJUSTIFICADA'
                                  ? 'bg-rose-50 text-rose-800 border-rose-200'
                                  : item.estadoAsistencia === 'FALTA_JUSTIFICADA'
                                  ? 'bg-purple-50 text-purple-800 border-purple-200'
                                  : 'bg-sky-50 text-sky-800 border-sky-200'
                              }`}
                            >
                              <option value="PRESENTE">PRESENTE</option>
                              <option value="TARDANZA">TARDANZA</option>
                              <option value="FALTA_INJUSTIFICADA">FALTA INJUSTIFICADA</option>
                              <option value="FALTA_JUSTIFICADA">FALTA JUSTIFICADA</option>
                              <option value="PERMISO">PERMISO</option>
                              <option value="LICENCIA">LICENCIA</option>
                              <option value="COMISION">COMISIÓN DE SERV.</option>
                            </select>
                          </td>
                          <td className="px-3.5 py-2.5">
                            <input
                              type="text"
                              placeholder="Observación o motivo..."
                              value={item.observacion}
                              onChange={(e) =>
                                handleUpdateItem(t.id, { observacion: e.target.value })
                              }
                              className="w-full px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                          </td>
                          <td className="px-3.5 py-2.5 text-center">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                                item.tipoRegistro === 'SISTEMA_DNI'
                                  ? 'bg-indigo-100 text-indigo-700'
                                  : item.tipoRegistro === 'BIOMETRICO'
                                  ? 'bg-purple-100 text-purple-700'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {item.tipoRegistro === 'SISTEMA_DNI' ? 'KIOSCO' : item.tipoRegistro}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* PESTAÑA 2: PARTE MENSUAL CONSOLIDADO (UGEL)             */}
      {/* ======================================================== */}
      {activeTab === 'parte-mensual' && (
        <div className="space-y-4">
          {/* Controles de Selección de Mes y Año */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-700">Periodo del Parte Mensual:</span>
              <select
                value={mesReporte}
                onChange={(e) => setMesReporte(parseInt(e.target.value, 10))}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none"
              >
                {mesesNombres.map((nombre, i) => (
                  <option key={i + 1} value={i + 1}>
                    {nombre}
                  </option>
                ))}
              </select>

              <select
                value={anioReporte}
                onChange={(e) => setAnioReporte(parseInt(e.target.value, 10))}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none"
              >
                {[2025, 2026, 2027].map((y) => (
                  <option key={y} value={y}>
                    Año {y}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={loadReporteMensual}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Actualizar Datos
              </button>
            </div>

            <button
              type="button"
              onClick={() => handlePrintParte()}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer self-end sm:self-auto"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / Exportar Parte Mensual</span>
            </button>
          </div>

          {/* Tabla de Consolidado Mensual */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Consolidado Mensual de Asistencia y Tardanzas - {mesesNombres[mesReporte - 1]} {anioReporte}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Formato oficial para remisión a la Unidad de Gestión Educativa Local (UGEL Mariscal Cáceres - Juanjuí).
                </p>
              </div>
              {loadingReporte && (
                <span className="text-indigo-600 text-xs font-semibold animate-pulse">
                  Calculando resumen mensual...
                </span>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                    <th className="px-3.5 py-3 w-10 text-center">N°</th>
                    <th className="px-3.5 py-3">Apellidos y Nombres</th>
                    <th className="px-3.5 py-3 w-24">DNI</th>
                    <th className="px-3.5 py-3 w-28">Cargo</th>
                    <th className="px-3.5 py-3 w-24">Condición</th>
                    <th className="px-3 py-3 text-center bg-emerald-50 text-emerald-800">Días Lab.</th>
                    <th className="px-3 py-3 text-center bg-amber-50 text-amber-800">Tardanzas</th>
                    <th className="px-3 py-3 text-center bg-amber-50 text-amber-800 font-bold">Min. Tard.</th>
                    <th className="px-3 py-3 text-center bg-rose-50 text-rose-800">Faltas Inj.</th>
                    <th className="px-3 py-3 text-center bg-purple-50 text-purple-800">Faltas Just.</th>
                    <th className="px-3 py-3 text-center bg-sky-50 text-sky-800">Permisos</th>
                    <th className="px-3 py-3 text-center bg-blue-50 text-blue-800">Licencias</th>
                    <th className="px-3.5 py-3 text-right">Situación Planilla</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reporteMensual.length === 0 ? (
                    <tr>
                      <td colSpan={13} className="px-4 py-8 text-center text-slate-400">
                        No hay información de asistencia registrada para el mes seleccionado.
                      </td>
                    </tr>
                  ) : (
                    reporteMensual.map((item, idx) => {
                      const tieneDescuento = item.faltasInjustificadas > 0 || item.minutosTardanza > 0;
                      return (
                        <tr key={item.trabajadorId} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-3.5 py-2.5 text-center font-mono text-slate-400">
                            {(idx + 1).toString().padStart(2, '0')}
                          </td>
                          <td className="px-3.5 py-2.5 font-semibold text-slate-800">
                            {item.apellidos}, {item.nombres}
                          </td>
                          <td className="px-3.5 py-2.5 font-mono text-slate-600">{item.numeroDocumento}</td>
                          <td className="px-3.5 py-2.5 text-slate-700">{item.cargo}</td>
                          <td className="px-3.5 py-2.5 text-slate-500">{item.condicion}</td>
                          <td className="px-3 py-2.5 text-center font-bold text-emerald-700 bg-emerald-50/30 font-mono">
                            {item.diasLaborados}
                          </td>
                          <td className="px-3 py-2.5 text-center font-semibold text-amber-700 bg-amber-50/30 font-mono">
                            {item.tardanzas}
                          </td>
                          <td className="px-3 py-2.5 text-center font-bold text-amber-800 bg-amber-50/50 font-mono">
                            {item.minutosTardanza} m
                          </td>
                          <td className="px-3 py-2.5 text-center font-bold text-rose-700 bg-rose-50/30 font-mono">
                            {item.faltasInjustificadas}
                          </td>
                          <td className="px-3 py-2.5 text-center font-semibold text-purple-700 bg-purple-50/30 font-mono">
                            {item.faltasJustificadas}
                          </td>
                          <td className="px-3 py-2.5 text-center font-semibold text-sky-700 bg-sky-50/30 font-mono">
                            {item.permisos}
                          </td>
                          <td className="px-3 py-2.5 text-center font-semibold text-blue-700 bg-blue-50/30 font-mono">
                            {item.licencias}
                          </td>
                          <td className="px-3.5 py-2.5 text-right">
                            {tieneDescuento ? (
                              <Badge variant="danger" size="sm" dot>
                                Sujeto a Descuento
                              </Badge>
                            ) : (
                              <Badge variant="success" size="sm">
                                Conforme
                              </Badge>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Plantilla oculta para impresión oficial */}
          <div className="hidden">
            <div ref={printParteRef} className="p-8 text-black bg-white space-y-6 font-sans text-xs">
              <div className="border-b-2 border-black pb-4 text-center space-y-1">
                <div className="font-bold text-sm uppercase tracking-wider">
                  GOBIERNO REGIONAL DE SAN MARTÍN • DIRECCIÓN REGIONAL DE EDUCACIÓN
                </div>
                <div className="font-bold text-xs uppercase text-slate-700">
                  UNIDAD DE GESTIÓN EDUCATIVA LOCAL MARISCAL CÁCERES - JUANJUÍ
                </div>
                <div className="font-extrabold text-base uppercase pt-1 text-slate-900">
                  PARTE MENSUAL DE ASISTENCIA Y PUNTUALIDAD DEL PERSONAL
                </div>
                <div className="text-xs font-semibold text-slate-600">
                  INSTITUCIÓN: {institucion.nombre} • CÓDIGO MODULAR: {institucion.codigoModular}
                </div>
                <div className="text-xs font-bold text-indigo-900">
                  MES: {mesesNombres[mesReporte - 1].toUpperCase()} {anioReporte}
                </div>
              </div>

              <table className="w-full border-collapse border border-black text-[10px]">
                <thead>
                  <tr className="bg-slate-200 text-black font-bold">
                    <th className="border border-black p-1 text-center">N°</th>
                    <th className="border border-black p-1">APELLIDOS Y NOMBRES</th>
                    <th className="border border-black p-1 text-center">DNI</th>
                    <th className="border border-black p-1">CARGO</th>
                    <th className="border border-black p-1">CONDICIÓN</th>
                    <th className="border border-black p-1 text-center">DÍAS LAB.</th>
                    <th className="border border-black p-1 text-center">TARD. (VECES)</th>
                    <th className="border border-black p-1 text-center">MIN. TARDANZA</th>
                    <th className="border border-black p-1 text-center">FALTA INJUST.</th>
                    <th className="border border-black p-1 text-center">FALTA JUST.</th>
                    <th className="border border-black p-1 text-center">PERMISOS</th>
                    <th className="border border-black p-1 text-center">LICENCIAS</th>
                  </tr>
                </thead>
                <tbody>
                  {reporteMensual.map((r, i) => (
                    <tr key={r.trabajadorId}>
                      <td className="border border-black p-1 text-center font-mono">{i + 1}</td>
                      <td className="border border-black p-1 font-bold">{r.apellidos}, {r.nombres}</td>
                      <td className="border border-black p-1 text-center font-mono">{r.numeroDocumento}</td>
                      <td className="border border-black p-1">{r.cargo}</td>
                      <td className="border border-black p-1">{r.condicion}</td>
                      <td className="border border-black p-1 text-center font-bold">{r.diasLaborados}</td>
                      <td className="border border-black p-1 text-center">{r.tardanzas}</td>
                      <td className="border border-black p-1 text-center font-bold">{r.minutosTardanza}</td>
                      <td className="border border-black p-1 text-center font-bold">{r.faltasInjustificadas}</td>
                      <td className="border border-black p-1 text-center">{r.faltasJustificadas}</td>
                      <td className="border border-black p-1 text-center">{r.permisos}</td>
                      <td className="border border-black p-1 text-center">{r.licencias}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="pt-16 grid grid-cols-2 gap-12 text-center text-xs">
                <div>
                  <div className="border-t border-black w-48 mx-auto pt-1 font-bold">
                    Responsable de Personal
                  </div>
                  <div className="text-[10px] text-slate-500">CETPRO Juanjuí</div>
                </div>
                <div>
                  <div className="border-t border-black w-48 mx-auto pt-1 font-bold">
                    {institucion.director || 'Dirección General'}
                  </div>
                  <div className="text-[10px] text-slate-500">Director(a) CETPRO Juanjuí</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* PESTAÑA 3: TERMINAL KIOSCO DE MARCACIÓN (DNI)            */}
      {/* ======================================================== */}
      {activeTab === 'kiosco' && (
        <div className="max-w-3xl mx-auto space-y-6 py-4">
          {/* Tarjeta Central del Kiosco */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden p-6 sm:p-10 text-center space-y-6">
            {/* Reloj Digital en Vivo */}
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-full text-xs font-bold tracking-wide uppercase">
                <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping" />
                Terminal de Marcación en Tiempo Real
              </div>
              <div className="text-5xl sm:text-6xl font-extrabold tracking-tight text-slate-900 font-mono pt-2">
                {currentTime.toLocaleTimeString('es-PE', { hour12: true })}
              </div>
              <div className="text-sm font-semibold text-slate-500 capitalize">
                {currentTime.toLocaleDateString('es-PE', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </div>
            </div>

            {/* Input de DNI para marcación */}
            <form onSubmit={handleKioscoSubmit} className="max-w-md mx-auto space-y-3">
              <div className="relative">
                <input
                  ref={kioscoInputRef}
                  type="text"
                  maxLength={8}
                  autoFocus
                  disabled={kioscoLoading}
                  value={kioscoDni}
                  onChange={(e) => setKioscoDni(e.target.value.replace(/\D/g, ''))}
                  placeholder="DIGITE SU DNI AQUÍ..."
                  className="w-full text-center text-2xl sm:text-3xl font-mono font-bold tracking-widest px-4 py-3.5 bg-slate-50 border-2 border-indigo-500/80 rounded-2xl shadow-inner focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-100 placeholder:text-slate-300 placeholder:text-lg"
                />
              </div>

              <button
                type="submit"
                disabled={kioscoLoading || kioscoDni.length < 8}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-sm shadow-md shadow-indigo-200 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Fingerprint className="w-5 h-5" />
                <span>{kioscoLoading ? 'Verificando marcación...' : 'Marcar Asistencia'}</span>
              </button>
            </form>

            {/* Banner de Feedback / Resultado */}
            {kioscoResult.status === 'success' && (
              <div
                className={`p-5 rounded-2xl border transition-all text-left animate-in fade-in zoom-in-95 duration-200 flex items-start gap-4 ${
                  kioscoResult.tipo === 'ENTRADA'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-blue-50 border-blue-200 text-blue-900'
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 font-bold text-white text-lg ${
                    kioscoResult.tipo === 'ENTRADA' ? 'bg-emerald-600' : 'bg-blue-600'
                  }`}
                >
                  <Check className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider text-white ${
                        kioscoResult.tipo === 'ENTRADA' ? 'bg-emerald-700' : 'bg-blue-700'
                      }`}
                    >
                      {kioscoResult.tipo === 'ENTRADA' ? 'Marcación de Entrada' : 'Marcación de Salida'}
                    </span>
                    <span className="text-xs font-mono font-bold">{kioscoResult.hora}</span>
                  </div>
                  <div className="text-base font-bold text-slate-900">{kioscoResult.nombre}</div>
                  <div className="text-xs text-slate-600">
                    Cargo: <strong>{kioscoResult.cargo}</strong> • {kioscoResult.message}
                  </div>
                </div>
              </div>
            )}

            {kioscoResult.status === 'error' && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-left flex items-center gap-3 animate-in fade-in zoom-in-95 duration-200">
                <ShieldAlert className="w-6 h-6 text-rose-600 shrink-0" />
                <div>
                  <div className="font-bold text-sm">Aviso de Marcación</div>
                  <div className="text-xs">{kioscoResult.message}</div>
                </div>
              </div>
            )}

            {/* Instrucción rápida */}
            <p className="text-xs text-slate-400">
              Presione <strong>ENTER</strong> después de ingresar los 8 dígitos o deslice el código de barras de su DNI.
            </p>
          </div>

          {/* Últimas Marcaciones del Día */}
          {ultimasMarcaciones.length > 0 && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-slate-400" />
                  Últimas Marcaciones Registradas Hoy
                </span>
                <span className="text-slate-400 font-normal text-[11px]">En vivo</span>
              </div>

              <div className="divide-y divide-slate-100">
                {ultimasMarcaciones.map((m, idx) => (
                  <div key={idx} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 font-bold flex items-center justify-center text-[11px]">
                        {m.nombre.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-800">{m.nombre}</div>
                        <div className="text-[11px] text-slate-400">
                          {m.cargo} • DNI {m.dni}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          m.tipo === 'ENTRADA'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}
                      >
                        {m.tipo}
                      </span>
                      <div className="text-[11px] font-mono font-bold text-slate-700 mt-0.5">{m.hora}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
