import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Calendar,
  Clock,
  BookOpen,
  Layers,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
  Building,
  Check,
  Plus,
  Trash2,
  Users,
  GraduationCap
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface AsistenteAperturaCicloModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AsistenteAperturaCicloModal: React.FC<AsistenteAperturaCicloModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    periodosLectivos,
    turnos,
    programas,
    modulos,
    aulas,
    trabajadores,
    ejecutarAperturaRapida,
  } = useApp();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // --- Step 1: Año Lectivo ---
  const currentYear = new Date().getFullYear();
  const [modoAnio, setModoAnio] = useState<'nuevo' | 'existente'>('nuevo');
  const [selectedLectivoId, setSelectedLectivoId] = useState<string>('');
  const [nuevoAnio, setNuevoAnio] = useState({
    codigo: `${currentYear}`,
    nombre: `Año Lectivo ${currentYear}`,
    fechaInicio: `${currentYear}-03-01`,
    fechaFin: `${currentYear}-12-31`,
  });

  // --- Step 2: Periodo Académico y Clases ---
  const [periodoAcademico, setPeriodoAcademico] = useState({
    codigo: `${currentYear}-I`,
    nombre: `Periodo Académico ${currentYear}-I`,
    fechaInicio: `${currentYear}-03-01`,
    fechaFin: `${currentYear}-07-31`,
  });

  const [periodoClases, setPeriodoClases] = useState({
    codigo: `PCL-${currentYear}-M1`,
    nombre: `Periodo de Clases Módulo I - ${currentYear}`,
    fechaInicio: `${currentYear}-03-15`,
    fechaFin: `${currentYear}-07-15`,
  });

  // --- Step 3: Turnos Habilitados ---
  const [turnosSeleccionados, setTurnosSeleccionados] = useState<
    Array<{ codigo: string; nombre: string; horaInicioReferencial: string; horaFinReferencial: string; activo: boolean }>
  >([
    { codigo: 'TUR-MAN', nombre: 'Mañana', horaInicioReferencial: '08:00', horaFinReferencial: '13:00', activo: true },
    { codigo: 'TUR-TAR', nombre: 'Tarde', horaInicioReferencial: '14:00', horaFinReferencial: '19:00', activo: true },
    { codigo: 'TUR-NOC', nombre: 'Noche', horaInicioReferencial: '18:30', horaFinReferencial: '22:30', activo: true },
  ]);

  // --- Step 4: Secciones a Generar ---
  interface SeccionItem {
    moduloId: string;
    moduloNombre: string;
    programaNombre: string;
    nombre: string;
    turnoNombre: string;
    aulaId: string;
    trabajadorId: string;
    capacidad: number;
    modalidadEducativa: string;
    seleccionado: boolean;
  }

  const [seccionesPlan, setSeccionesPlan] = useState<SeccionItem[]>([]);
  const [filtroPrograma, setFiltroPrograma] = useState<string>('TODOS');

  // Inicializar secciones propuestas a partir de módulos activos
  useEffect(() => {
    if (isOpen) {
      if (periodosLectivos.length > 0) {
        setSelectedLectivoId(periodosLectivos[0].id);
      }

      const activeModulos = modulos.filter(m => m.estado !== 'Inactivo' && m.estado !== 'INACTIVO');
      const items: SeccionItem[] = activeModulos.map(m => {
        const prog = programas.find(p => p.id === m.programaId);
        return {
          moduloId: m.id,
          moduloNombre: m.nombre,
          programaNombre: prog?.nombre || 'Programa General',
          nombre: 'Sección Única',
          turnoNombre: 'Mañana',
          aulaId: aulas[0]?.id || '',
          trabajadorId: '',
          capacidad: 30,
          modalidadEducativa: 'Presencial',
          seleccionado: true,
        };
      });
      setSeccionesPlan(items);
      setCurrentStep(1);
    }
  }, [isOpen, modulos, programas, aulas, periodosLectivos]);

  if (!isOpen) return null;

  const toggleSelectAllSecciones = (select: boolean) => {
    setSeccionesPlan(prev =>
      prev.map(s => {
        if (filtroPrograma === 'TODOS' || s.programaNombre === filtroPrograma) {
          return { ...s, seleccionado: select };
        }
        return s;
      })
    );
  };

  const handleUpdateSeccionItem = (moduloId: string, updates: Partial<SeccionItem>) => {
    setSeccionesPlan(prev =>
      prev.map(s => (s.moduloId === moduloId ? { ...s, ...updates } : s))
    );
  };

  const handleToggleTurno = (index: number) => {
    setTurnosSeleccionados(prev => {
      const next = [...prev];
      next[index].activo = !next[index].activo;
      return next;
    });
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    try {
      // 1. Prepare Year
      let anioData: any = {};
      if (modoAnio === 'existente' && selectedLectivoId) {
        const found = periodosLectivos.find(p => p.id === selectedLectivoId);
        anioData = { id: found?.id, codigo: found?.codigo, nombre: found?.nombre };
      } else {
        anioData = nuevoAnio;
      }

      // 2. Prepare Active Turns
      const activeTurnos = turnosSeleccionados
        .filter(t => t.activo)
        .map(t => ({
          codigo: t.codigo,
          nombre: t.nombre,
          horaInicioReferencial: t.horaInicioReferencial,
          horaFinReferencial: t.horaFinReferencial,
        }));

      // 3. Prepare Sections
      const selectedSecciones = seccionesPlan
        .filter(s => s.seleccionado)
        .map(s => ({
          moduloId: s.moduloId,
          nombre: s.nombre,
          turnoNombre: s.turnoNombre,
          aulaId: s.aulaId || undefined,
          trabajadorId: s.trabajadorId || undefined,
          capacidad: Number(s.capacidad) || 30,
          modalidadEducativa: s.modalidadEducativa,
        }));

      await ejecutarAperturaRapida({
        anioLectivo: anioData,
        periodoAcademico,
        periodoClases,
        turnosHabilitados: activeTurnos,
        seccionesGenerar: selectedSecciones,
      });

      onClose();
    } catch (e: any) {
      // Toast already shown in context
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredSecciones = seccionesPlan.filter(s =>
    filtroPrograma === 'TODOS' ? true : s.programaNombre === filtroPrograma
  );

  const selectedCount = seccionesPlan.filter(s => s.seleccionado).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold tracking-tight text-white">
                  Asistente Rápido: Apertura de Año Lectivo / Nuevo Módulo
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/30 text-blue-200 border border-blue-400/40 font-mono">
                  WIZARD INTEGRAL
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Configura en un solo lugar y en 4 pasos el año, periodos, turnos y apertura de secciones
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wizard Stepper Progress */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between gap-2 overflow-x-auto shrink-0 text-xs">
          {[
            { step: 1, label: '1. Año Lectivo', icon: Calendar },
            { step: 2, label: '2. Periodos Académicos', icon: Layers },
            { step: 3, label: '3. Turnos de Dictado', icon: Clock },
            { step: 4, label: '4. Secciones por Módulo', icon: BookOpen },
          ].map((s) => {
            const isCompleted = currentStep > s.step;
            const isCurrent = currentStep === s.step;
            return (
              <button
                key={s.step}
                onClick={() => setCurrentStep(s.step)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-medium transition-all whitespace-nowrap cursor-pointer ${
                  isCurrent
                    ? 'bg-blue-600 text-white font-bold shadow-xs'
                    : isCompleted
                    ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-bold ${
                    isCurrent
                      ? 'bg-white/20 text-white'
                      : isCompleted
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {isCompleted ? <Check className="w-3 h-3" /> : s.step}
                </div>
                <span>{s.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Body / Steps Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* STEP 1: AÑO LECTIVO */}
          {currentStep === 1 && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="flex items-start gap-3 p-4 bg-blue-50/80 border border-blue-200/80 rounded-2xl">
                <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-xs text-blue-900 leading-relaxed">
                  <strong>Paso 1: Parámetros del Año Lectivo Institucional</strong>
                  <p className="mt-0.5 text-blue-800/90">
                    Define el año de operaciones académicas (ej. 2026). Puedes seleccionar uno previamente creado o inicializar el nuevo año con sus fechas oficiales MINEDU.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 border-b border-slate-200 pb-3">
                <button
                  type="button"
                  onClick={() => setModoAnio('nuevo')}
                  className={`pb-1 text-xs font-bold transition-colors cursor-pointer ${
                    modoAnio === 'nuevo'
                      ? 'border-b-2 border-blue-600 text-blue-700'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  ➕ Inicializar Nuevo Año Lectivo
                </button>
                {periodosLectivos.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setModoAnio('existente')}
                    className={`pb-1 text-xs font-bold transition-colors cursor-pointer ${
                      modoAnio === 'existente'
                        ? 'border-b-2 border-blue-600 text-blue-700'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    📂 Usar Año Lectivo Existente ({periodosLectivos.length})
                  </button>
                )}
              </div>

              {modoAnio === 'existente' && periodosLectivos.length > 0 ? (
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-slate-700">Seleccionar Año Lectivo Registrado</label>
                  <select
                    value={selectedLectivoId}
                    onChange={(e) => setSelectedLectivoId(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-blue-500"
                  >
                    {periodosLectivos.map((pl) => (
                      <option key={pl.id} value={pl.id}>
                        {pl.nombre} ({pl.codigo}) — {pl.fechaInicio} al {pl.fechaFin} [{pl.estado}]
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Código del Año Lectivo</label>
                    <input
                      type="text"
                      value={nuevoAnio.codigo}
                      onChange={(e) => setNuevoAnio({ ...nuevoAnio, codigo: e.target.value })}
                      placeholder="Ej. 2026"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold font-mono focus:bg-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Denominación Oficial</label>
                    <input
                      type="text"
                      value={nuevoAnio.nombre}
                      onChange={(e) => setNuevoAnio({ ...nuevoAnio, nombre: e.target.value })}
                      placeholder="Ej. Año Lectivo 2026"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Fecha de Inicio Anual</label>
                    <input
                      type="date"
                      value={nuevoAnio.fechaInicio}
                      onChange={(e) => setNuevoAnio({ ...nuevoAnio, fechaInicio: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Fecha de Cierre Anual</label>
                    <input
                      type="date"
                      value={nuevoAnio.fechaFin}
                      onChange={(e) => setNuevoAnio({ ...nuevoAnio, fechaFin: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: PERIODOS ACADEMICOS Y CLASES */}
          {currentStep === 2 && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="flex items-start gap-3 p-4 bg-indigo-50/80 border border-indigo-200/80 rounded-2xl">
                <AlertCircle className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <div className="text-xs text-indigo-900 leading-relaxed">
                  <strong>Paso 2: Periodo Académico y Calendario de Clases</strong>
                  <p className="mt-0.5 text-indigo-800/90">
                    El periodo académico agrupa los procesos de matrícula y actas (ej. 2026-I). El periodo de clases define el rango exacto en el que los docentes dictarán los módulos formativos.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs">
                  <Layers className="w-4 h-4" />
                  <span>A. Periodo Académico (Semestral o Modular)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Código del Periodo</label>
                    <input
                      type="text"
                      value={periodoAcademico.codigo}
                      onChange={(e) => setPeriodoAcademico({ ...periodoAcademico, codigo: e.target.value })}
                      placeholder="Ej. 2026-I"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Nombre del Periodo</label>
                    <input
                      type="text"
                      value={periodoAcademico.nombre}
                      onChange={(e) => setPeriodoAcademico({ ...periodoAcademico, nombre: e.target.value })}
                      placeholder="Ej. Periodo Académico 2026-I"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Fecha Inicio del Periodo</label>
                    <input
                      type="date"
                      value={periodoAcademico.fechaInicio}
                      onChange={(e) => setPeriodoAcademico({ ...periodoAcademico, fechaInicio: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Fecha Fin del Periodo</label>
                    <input
                      type="date"
                      value={periodoAcademico.fechaFin}
                      onChange={(e) => setPeriodoAcademico({ ...periodoAcademico, fechaFin: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs">
                  <Calendar className="w-4 h-4" />
                  <span>B. Periodo de Dictado de Clases</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Código del Periodo de Clases</label>
                    <input
                      type="text"
                      value={periodoClases.codigo}
                      onChange={(e) => setPeriodoClases({ ...periodoClases, codigo: e.target.value })}
                      placeholder="Ej. PCL-2026-M1"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Nombre Descriptivo</label>
                    <input
                      type="text"
                      value={periodoClases.nombre}
                      onChange={(e) => setPeriodoClases({ ...periodoClases, nombre: e.target.value })}
                      placeholder="Ej. Periodo de Clases Módulo I - 2026"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Fecha de Inicio de Clases</label>
                    <input
                      type="date"
                      value={periodoClases.fechaInicio}
                      onChange={(e) => setPeriodoClases({ ...periodoClases, fechaInicio: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Fecha de Fin de Clases</label>
                    <input
                      type="date"
                      value={periodoClases.fechaFin}
                      onChange={(e) => setPeriodoClases({ ...periodoClases, fechaFin: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: TURNOS Y HORARIOS */}
          {currentStep === 3 && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="flex items-start gap-3 p-4 bg-emerald-50/80 border border-emerald-200/80 rounded-2xl">
                <Clock className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs text-emerald-900 leading-relaxed">
                  <strong>Paso 3: Configuración de Turnos y Franjas Horarias</strong>
                  <p className="mt-0.5 text-emerald-800/90">
                    Selecciona los turnos que estarán operativos durante este ciclo y ajusta las horas referenciales de entrada y salida para cada uno.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {turnosSeleccionados.map((t, idx) => (
                  <div
                    key={t.codigo}
                    className={`p-4 rounded-2xl border transition-all ${
                      t.activo
                        ? 'bg-emerald-50/40 border-emerald-300 shadow-xs'
                        : 'bg-slate-50/70 border-slate-200 opacity-60'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={t.activo}
                          onChange={() => handleToggleTurno(idx)}
                          className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                        <div>
                          <span className="text-xs font-bold text-slate-900">
                            Turno {t.nombre}
                          </span>
                          <span className="ml-2 font-mono text-[10px] text-slate-500">
                            ({t.codigo})
                          </span>
                        </div>
                      </div>

                      {t.activo && (
                        <div className="flex items-center gap-2 text-xs">
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-500 font-medium">Hora Inicio:</span>
                            <input
                              type="time"
                              value={t.horaInicioReferencial}
                              onChange={(e) => {
                                const next = [...turnosSeleccionados];
                                next[idx].horaInicioReferencial = e.target.value;
                                setTurnosSeleccionados(next);
                              }}
                              className="px-2 py-1 bg-white border border-slate-200 rounded-lg font-mono font-bold text-slate-800"
                            />
                          </div>
                          <span className="text-slate-400">—</span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-500 font-medium">Hora Fin:</span>
                            <input
                              type="time"
                              value={t.horaFinReferencial}
                              onChange={(e) => {
                                const next = [...turnosSeleccionados];
                                next[idx].horaFinReferencial = e.target.value;
                                setTurnosSeleccionados(next);
                              }}
                              className="px-2 py-1 bg-white border border-slate-200 rounded-lg font-mono font-bold text-slate-800"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 4: SECCIONES POR MODULO */}
          {currentStep === 4 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-start gap-3 p-4 bg-amber-50/80 border border-amber-200/80 rounded-2xl">
                <BookOpen className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900 leading-relaxed">
                  <strong>Paso 4: Apertura y Generación en Bloque de Secciones</strong>
                  <p className="mt-0.5 text-amber-800/90">
                    Marca los módulos formativos que se aperturarán para este ciclo. El sistema creará automáticamente las secciones seleccionadas en sus respectivos turnos con vacantes predeterminadas.
                  </p>
                </div>
              </div>

              {/* Action bar and filters */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-slate-700">Filtrar por Programa:</span>
                  <select
                    value={filtroPrograma}
                    onChange={(e) => setFiltroPrograma(e.target.value)}
                    className="px-2.5 py-1 bg-white border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="TODOS">Todos los Programas ({programas.length})</option>
                    {programas.map((p) => (
                      <option key={p.id} value={p.nombre}>
                        {p.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleSelectAllSecciones(true)}
                    className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-medium cursor-pointer"
                  >
                    Seleccionar Visibles
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleSelectAllSecciones(false)}
                    className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-medium cursor-pointer"
                  >
                    Desmarcar
                  </button>
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-800 font-bold rounded-md text-[11px]">
                    {selectedCount} seleccionados
                  </span>
                </div>
              </div>

              {/* Sections Table */}
              <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-3 py-2.5 w-8 text-center">✓</th>
                      <th className="px-3 py-2.5">Programa y Módulo</th>
                      <th className="px-3 py-2.5">Nombre Sección</th>
                      <th className="px-3 py-2.5">Turno</th>
                      <th className="px-3 py-2.5">Aula / Taller</th>
                      <th className="px-3 py-2.5">Docente</th>
                      <th className="px-3 py-2.5 w-16 text-center">Vacantes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredSecciones.map((sec) => (
                      <tr key={sec.moduloId} className={sec.seleccionado ? 'bg-white' : 'bg-slate-50/50 opacity-50'}>
                        <td className="px-3 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={sec.seleccionado}
                            onChange={(e) => handleUpdateSeccionItem(sec.moduloId, { seleccionado: e.target.checked })}
                            className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <div className="font-bold text-slate-900 leading-snug">{sec.moduloNombre}</div>
                          <div className="text-[10px] text-slate-500">{sec.programaNombre}</div>
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={sec.nombre}
                            disabled={!sec.seleccionado}
                            onChange={(e) => handleUpdateSeccionItem(sec.moduloId, { nombre: e.target.value })}
                            className="w-28 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg font-medium text-xs disabled:opacity-50"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <select
                            value={sec.turnoNombre}
                            disabled={!sec.seleccionado}
                            onChange={(e) => handleUpdateSeccionItem(sec.moduloId, { turnoNombre: e.target.value })}
                            className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium disabled:opacity-50"
                          >
                            {turnosSeleccionados.filter(t => t.activo).map((t) => (
                              <option key={t.codigo} value={t.nombre}>
                                {t.nombre}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <select
                            value={sec.aulaId}
                            disabled={!sec.seleccionado}
                            onChange={(e) => handleUpdateSeccionItem(sec.moduloId, { aulaId: e.target.value })}
                            className="w-28 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium truncate disabled:opacity-50"
                          >
                            <option value="">-- Sin Aula --</option>
                            {aulas.map((a) => (
                              <option key={a.id} value={a.id}>
                                {a.nombre}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <select
                            value={sec.trabajadorId}
                            disabled={!sec.seleccionado}
                            onChange={(e) => handleUpdateSeccionItem(sec.moduloId, { trabajadorId: e.target.value })}
                            className="w-32 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium truncate disabled:opacity-50"
                          >
                            <option value="">-- Por Asignar --</option>
                            {trabajadores.map((t) => (
                              <option key={t.id} value={t.id}>
                                {t.persona?.nombres || t.persona?.apellidoPaterno ? `${t.persona.nombres} ${t.persona.apellidoPaterno}` : t.numeroDocumento}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <input
                            type="number"
                            min="5"
                            max="60"
                            value={sec.capacidad}
                            disabled={!sec.seleccionado}
                            onChange={(e) => handleUpdateSeccionItem(sec.moduloId, { capacidad: Number(e.target.value) })}
                            className="w-14 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-center font-bold text-xs disabled:opacity-50"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer / Navigation Controls */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
            disabled={currentStep === 1 || isSubmitting}
            className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Paso Anterior</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-slate-600 hover:text-slate-900 rounded-xl text-xs font-medium transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            {currentStep < 4 ? (
              <button
                type="button"
                onClick={() => setCurrentStep(prev => Math.min(4, prev + 1))}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <span>Siguiente Paso</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinalSubmit}
                disabled={isSubmitting || selectedCount === 0}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Inicializando Periodo...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>⚡ ¡Ejecutar Apertura e Inicializar Período!</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
