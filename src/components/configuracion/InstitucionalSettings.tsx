import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { ImageUploadField } from '../common/ImageUploadField';
import { AsistenteAperturaCicloModal } from './AsistenteAperturaCicloModal';
import { CronogramaUnidadesModal } from './CronogramaUnidadesModal';
import { NuevaSeccionModal } from '../estudiantes/NuevaSeccionModal';
import { NominaMatriculaPrint } from '../estudiantes/NominaMatriculaPrint';
import { TasasTarifasAnualesTab } from './TasasTarifasAnualesTab';
import { PeriodoLectivo, PeriodoAcademico, PeriodoClases, Turno, Seccion, Horario } from '../../types';
import {
  Building,
  Save,
  Database,
  DollarSign,
  RefreshCw,
  Download,
  Shield,
  Calendar,
  Clock,
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  Sparkles,
  Layers,
  CheckCircle2,
  Users,
  GraduationCap,
  CalendarRange,
  School,
  Clock3,
  CalendarCheck,
  AlertCircle,
  FileText
} from 'lucide-react';

export const InstitucionalSettings: React.FC = () => {
  const {
    institucion,
    updateInstitucion,
    conceptosPago,
    addToast,
    personas,
    estudiantes,
    matriculas,
    recibos,
    periodosLectivos,
    periodosAcademicos,
    periodosClases,
    turnos,
    secciones,
    aulas,
    trabajadores,
    horarios,
    addPeriodoLectivo,
    updatePeriodoLectivo,
    activarPeriodoLectivo,
    deletePeriodoLectivo,
    addPeriodoAcademico,
    updatePeriodoAcademico,
    activarPeriodoAcademico,
    deletePeriodoAcademico,
    addPeriodoClases,
    updatePeriodoClases,
    deletePeriodoClases,
    addTurno,
    updateTurno,
    deleteTurno,
    deleteSeccion,
    addHorario,
    deleteHorario,
  } = useApp();

  // Active Sub-tab inside "Configuración Inicial Institucional"
  const [activeSubTab, setActiveSubTab] = useState<'periodos' | 'turnos' | 'secciones' | 'tasas' | 'identidad' | 'mantenimiento'>('periodos');

  // Asistente Rápido Modal
  const [isAsistenteOpen, setIsAsistenteOpen] = useState(false);

  // Nueva Sección Modal
  const [isNuevaSeccionOpen, setIsNuevaSeccionOpen] = useState(false);
  const [seccionToEdit, setSeccionToEdit] = useState<Seccion | null>(null);

  // Institutional Identity form state
  const [formData, setFormData] = useState({ ...institucion });
  const [isSaving, setIsSaving] = useState(false);

  // --- CRUD Modals State ---
  // Modal Año Lectivo
  const [isLectivoModalOpen, setIsLectivoModalOpen] = useState(false);
  const [editingLectivo, setEditingLectivo] = useState<PeriodoLectivo | null>(null);
  const [lectivoForm, setLectivoForm] = useState({
    codigo: `${new Date().getFullYear()}`,
    nombre: `Año Lectivo ${new Date().getFullYear()}`,
    fechaInicio: `${new Date().getFullYear()}-03-01`,
    fechaFin: `${new Date().getFullYear()}-12-31`,
    estado: 'ACTIVO',
  });

  // Modal Periodo Académico
  const [isAcademicoModalOpen, setIsAcademicoModalOpen] = useState(false);
  const [editingAcademico, setEditingAcademico] = useState<PeriodoAcademico | null>(null);
  const [academicoForm, setAcademicoForm] = useState({
    periodoLectivoId: '',
    codigo: `${new Date().getFullYear()}-I`,
    nombre: `Periodo Académico ${new Date().getFullYear()}-I`,
    fechaInicio: `${new Date().getFullYear()}-03-01`,
    fechaFin: `${new Date().getFullYear()}-07-31`,
    estado: 'ACTIVO',
  });

  // Modal Periodo de Clases
  const [isClasesModalOpen, setIsClasesModalOpen] = useState(false);
  const [editingClases, setEditingClases] = useState<PeriodoClases | null>(null);
  const [clasesForm, setClasesForm] = useState({
    periodoAcademicoId: '',
    codigo: `PCL-${new Date().getFullYear()}-M1`,
    nombre: `Periodo de Clases Módulo I - ${new Date().getFullYear()}`,
    fechaInicio: `${new Date().getFullYear()}-03-15`,
    fechaFin: `${new Date().getFullYear()}-07-15`,
  });

  // Modal Turno
  const [isTurnoModalOpen, setIsTurnoModalOpen] = useState(false);
  const [editingTurno, setEditingTurno] = useState<Turno | null>(null);
  const [turnoForm, setTurnoForm] = useState({
    codigo: '',
    nombre: '',
    horaInicioReferencial: '08:00',
    horaFinReferencial: '13:00',
    estado: 'Activo',
  });

  // Modal Asignación de Horario para una Sección
  const [selectedSeccionForHorario, setSelectedSeccionForHorario] = useState<Seccion | null>(null);
  const [selectedSeccionNominaPrint, setSelectedSeccionNominaPrint] = useState<string | null>(null);
  const [selectedSeccionCronograma, setSelectedSeccionCronograma] = useState<Seccion | null>(null);
  const [horarioForm, setHorarioForm] = useState({
    diaSemana: 1,
    horaInicio: '08:00',
    horaFin: '13:00',
    aulaId: '',
  });

  // Handlers for Institutional Save & Backup
  const handleSaveInstitucion = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    updateInstitucion(formData);
    setTimeout(() => {
      setIsSaving(false);
      addToast('Configuración Guardada', 'Los parámetros institucionales fueron actualizados con éxito.', 'success');
    }, 400);
  };

  const handleExportBackup = () => {
    const backup = {
      institucion,
      personas,
      estudiantes,
      matriculas,
      recibos,
      exportedAt: new Date().toISOString(),
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backup, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `SIGA_CETPRO_Juanjui_Backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    addToast('Copia de Seguridad Generada', 'La base de datos completa ha sido exportada en formato JSON.', 'success');
  };

  const [isGenerating, setIsGenerating] = useState(false);
  const handleGenerateAccesses = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/admin/generar-accesos', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        addToast('Accesos Generados', `Se crearon ${data.generated} cuentas de usuario exitosamente.`);
      } else {
        addToast('Error', data.error || 'Ocurrió un error.');
      }
    } catch (e) {
      addToast('Error de Red', 'No se pudo conectar con el servidor.');
    } finally {
      setIsGenerating(false);
    }
  };

  // --- Handlers: Año Lectivo ---
  const handleOpenNewLectivo = () => {
    setEditingLectivo(null);
    setLectivoForm({
      codigo: `${new Date().getFullYear()}`,
      nombre: `Año Lectivo ${new Date().getFullYear()}`,
      fechaInicio: `${new Date().getFullYear()}-03-01`,
      fechaFin: `${new Date().getFullYear()}-12-31`,
      estado: 'ACTIVO',
    });
    setIsLectivoModalOpen(true);
  };

  const handleOpenEditLectivo = (pl: PeriodoLectivo) => {
    setEditingLectivo(pl);
    setLectivoForm({
      codigo: pl.codigo,
      nombre: pl.nombre,
      fechaInicio: pl.fechaInicio,
      fechaFin: pl.fechaFin,
      estado: pl.estado || 'ACTIVO',
    });
    setIsLectivoModalOpen(true);
  };

  const handleSaveLectivo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingLectivo) {
        await updatePeriodoLectivo({ ...editingLectivo, ...lectivoForm });
      } else {
        await addPeriodoLectivo({ ...lectivoForm, cetproId: '' });
      }
      setIsLectivoModalOpen(false);
    } catch (error) {}
  };

  // --- Handlers: Periodo Académico ---
  const handleOpenNewAcademico = () => {
    setEditingAcademico(null);
    setAcademicoForm({
      periodoLectivoId: periodosLectivos[0]?.id || '',
      codigo: `${new Date().getFullYear()}-I`,
      nombre: `Periodo Académico ${new Date().getFullYear()}-I`,
      fechaInicio: `${new Date().getFullYear()}-03-01`,
      fechaFin: `${new Date().getFullYear()}-07-31`,
      estado: 'ACTIVO',
    });
    setIsAcademicoModalOpen(true);
  };

  const handleOpenEditAcademico = (pa: PeriodoAcademico) => {
    setEditingAcademico(pa);
    setAcademicoForm({
      periodoLectivoId: pa.periodoLectivoId || periodosLectivos[0]?.id || '',
      codigo: pa.codigo,
      nombre: pa.nombre,
      fechaInicio: pa.fechaInicio,
      fechaFin: pa.fechaFin,
      estado: pa.estado || 'ACTIVO',
    });
    setIsAcademicoModalOpen(true);
  };

  const handleSaveAcademico = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAcademico) {
        await updatePeriodoAcademico({ ...editingAcademico, ...academicoForm });
      } else {
        await addPeriodoAcademico(academicoForm);
      }
      setIsAcademicoModalOpen(false);
    } catch (error) {}
  };

  // --- Handlers: Periodo de Clases ---
  const handleOpenNewClases = () => {
    setEditingClases(null);
    setClasesForm({
      periodoAcademicoId: periodosAcademicos[0]?.id || '',
      codigo: `PCL-${new Date().getFullYear()}-M1`,
      nombre: `Periodo de Clases Módulo I - ${new Date().getFullYear()}`,
      fechaInicio: `${new Date().getFullYear()}-03-15`,
      fechaFin: `${new Date().getFullYear()}-07-15`,
    });
    setIsClasesModalOpen(true);
  };

  const handleOpenEditClases = (pc: PeriodoClases) => {
    setEditingClases(pc);
    setClasesForm({
      periodoAcademicoId: pc.periodoAcademicoId,
      codigo: pc.codigo,
      nombre: pc.nombre,
      fechaInicio: pc.fechaInicio,
      fechaFin: pc.fechaFin,
    });
    setIsClasesModalOpen(true);
  };

  const handleSaveClases = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingClases) {
        await updatePeriodoClases({ ...editingClases, ...clasesForm });
      } else {
        await addPeriodoClases(clasesForm);
      }
      setIsClasesModalOpen(false);
    } catch (error) {}
  };

  // --- Handlers: Turnos ---
  const handleOpenNewTurno = () => {
    setEditingTurno(null);
    setTurnoForm({
      codigo: `TUR-${Math.floor(100 + Math.random() * 900)}`,
      nombre: '',
      horaInicioReferencial: '08:00',
      horaFinReferencial: '13:00',
      estado: 'Activo',
    });
    setIsTurnoModalOpen(true);
  };

  const handleOpenEditTurno = (t: Turno) => {
    setEditingTurno(t);
    setTurnoForm({
      codigo: t.codigo,
      nombre: t.nombre,
      horaInicioReferencial: t.horaInicioReferencial || '08:00',
      horaFinReferencial: t.horaFinReferencial || '13:00',
      estado: t.estado || 'Activo',
    });
    setIsTurnoModalOpen(true);
  };

  const handleSaveTurno = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTurno) {
        await updateTurno({ ...editingTurno, ...turnoForm });
      } else {
        await addTurno(turnoForm);
      }
      setIsTurnoModalOpen(false);
    } catch (error) {}
  };

  // --- Handlers: Horarios de Sección ---
  const handleOpenHorariosSeccion = (sec: Seccion) => {
    setSelectedSeccionForHorario(sec);
    setHorarioForm({
      diaSemana: 1,
      horaInicio: '08:00',
      horaFin: '13:00',
      aulaId: sec.aulaId || aulas[0]?.id || '',
    });
  };

  const handleAddHorarioToSeccion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSeccionForHorario) return;
    try {
      await addHorario({
        seccionId: selectedSeccionForHorario.id,
        diaSemana: Number(horarioForm.diaSemana),
        horaInicio: horarioForm.horaInicio,
        horaFin: horarioForm.horaFin,
        aulaId: horarioForm.aulaId || null,
      });
    } catch (error) {}
  };

  // Dias de semana labels
  const diasSemanaNombres = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  // Current Active Period Stats
  const activeLectivo = periodosLectivos.find(p => p.estado === 'ACTIVO') || periodosLectivos[0];
  const activeAcademico = periodosAcademicos.find(p => p.estado === 'ACTIVO') || periodosAcademicos[0];
  const activeClases = periodosClases[0];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Top Action & Overview Hero Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 rounded-3xl p-6 text-white shadow-xl border border-blue-900/50 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-8 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/30 text-blue-200 border border-blue-400/40 font-mono">
                CONFIGURACIÓN CENTRALIZADA
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-mono">
                ESTADO OPERATIVO EN VIVO
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Configuración Inicial Institucional y del Año Lectivo
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Configura en un solo lugar el Año Lectivo, Periodos Académicos, Periodo de Clases, Turnos, Horarios y Secciones para todo el módulo o año, evitando pasos repetitivos o inconsistencias.
            </p>
          </div>

          {/* Quick Wizard Trigger Button */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setIsAsistenteOpen(true)}
              className="px-5 py-3.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-2xl text-xs font-bold shadow-lg hover:shadow-indigo-500/25 transition-all flex items-center justify-center gap-2.5 cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
              <span>⚡ Asistente Rápido: Apertura de Año / Módulo</span>
            </button>
          </div>
        </div>

        {/* Live Status Indicators Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 mt-6 pt-6 border-t border-white/10 text-xs">
          <div className="bg-white/5 backdrop-blur-xs p-3 rounded-2xl border border-white/10">
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              <span>Año Lectivo</span>
            </div>
            <div className="text-sm font-bold text-white mt-1">
              {activeLectivo ? activeLectivo.codigo : 'No definido'}
            </div>
            <div className="text-[10px] text-emerald-400 font-mono mt-0.5">
              {activeLectivo?.estado || 'Sin registro'}
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xs p-3 rounded-2xl border border-white/10">
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <span>Periodo Académico</span>
            </div>
            <div className="text-sm font-bold text-white mt-1 truncate">
              {activeAcademico ? activeAcademico.codigo : 'No definido'}
            </div>
            <div className="text-[10px] text-slate-300 truncate mt-0.5">
              {activeAcademico?.nombre || 'Pendiente'}
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xs p-3 rounded-2xl border border-white/10">
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <CalendarRange className="w-3.5 h-3.5 text-cyan-400" />
              <span>Dictado de Clases</span>
            </div>
            <div className="text-sm font-bold text-white mt-1 truncate">
              {activeClases ? activeClases.codigo : 'Sin calendario'}
            </div>
            <div className="text-[10px] text-slate-300 truncate mt-0.5">
              {activeClases ? `${activeClases.fechaInicio} al ${activeClases.fechaFin}` : 'Pendiente'}
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xs p-3 rounded-2xl border border-white/10">
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Turnos Habilitados</span>
            </div>
            <div className="text-sm font-bold text-white mt-1">
              {turnos.length} Turnos
            </div>
            <div className="text-[10px] text-slate-300 truncate mt-0.5">
              {turnos.map(t => t.nombre).join(', ') || 'Ninguno'}
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-xs p-3 rounded-2xl border border-white/10 col-span-2 sm:col-span-4 lg:col-span-1">
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
              <span>Secciones Operativas</span>
            </div>
            <div className="text-sm font-bold text-white mt-1">
              {secciones.length} Secciones
            </div>
            <div className="text-[10px] text-emerald-300 mt-0.5">
              Listas para matrícula
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Navigation Bar */}
      <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 rounded-2xl border border-slate-200/80 overflow-x-auto">
        {[
          { id: 'periodos' as const, label: '📅 Calendario y Periodos', icon: Calendar },
          { id: 'turnos' as const, label: '⏰ Turnos y Horarios', icon: Clock },
          { id: 'secciones' as const, label: '📋 Secciones Operativas', icon: BookOpen },
          { id: 'tasas' as const, label: '💰 Tasas y Tarifas del Año', icon: DollarSign },
          { id: 'identidad' as const, label: '🏛️ Identidad y TUPA MINEDU', icon: Building },
          { id: 'mantenimiento' as const, label: '🛡️ Seguridad y Respaldo', icon: Shield },
        ].map((tab) => {
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                isActive
                  ? 'bg-white text-blue-700 shadow-xs border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* SUB-TAB 1: CALENDARIO Y PERIODOS (Año Lectivo, Periodo Académico y Clases) */}
      {/* ========================================================================= */}
      {activeSubTab === 'periodos' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          
          {/* 1.1 Años Lectivos */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    1. Años Lectivos Institucionales
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Parámetros del año oficial de funcionamiento del CETPRO Juanjuí
                </p>
              </div>

              <button
                type="button"
                onClick={handleOpenNewLectivo}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Nuevo Año Lectivo</span>
              </button>
            </div>

            {periodosLectivos.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-500">
                No hay años lectivos registrados. Utiliza el botón superior o el Asistente Rápido.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {periodosLectivos.map((pl) => (
                  <div
                    key={pl.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      pl.estado === 'ACTIVO'
                        ? 'bg-blue-50/40 border-blue-200 shadow-xs'
                        : 'bg-slate-50 border-slate-200 opacity-80'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm font-black text-slate-900">
                        {pl.codigo}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          pl.estado === 'ACTIVO'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {pl.estado}
                      </span>
                    </div>

                    <div className="text-xs font-bold text-slate-800 mt-1.5">
                      {pl.nombre}
                    </div>

                    <div className="text-[11px] text-slate-500 mt-2 flex items-center gap-1.5">
                      <CalendarRange className="w-3.5 h-3.5 text-slate-400" />
                      <span>{pl.fechaInicio} al {pl.fechaFin}</span>
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
                      <div>
                        {pl.estado !== 'ACTIVO' && (
                          <button
                            type="button"
                            onClick={() => activarPeriodoLectivo(pl.id)}
                            className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white rounded-lg border border-emerald-300 text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                            title="Establecer como Año Lectivo Activo"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Activar</span>
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEditLectivo(pl)}
                          className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-blue-100/60 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                          title="Editar Fechas"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`¿Eliminar el año lectivo ${pl.codigo}?`)) {
                              deletePeriodoLectivo(pl.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                          title="Eliminar"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 1.2 Periodos Académicos */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    2. Periodos Académicos (Ciclos / Semestres)
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Periodos para inscripciones, convalidaciones y registros de actas (ej. 2026-I, 2026-II)
                </p>
              </div>

              <button
                type="button"
                onClick={handleOpenNewAcademico}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Nuevo Periodo Académico</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-2.5">Código</th>
                    <th className="px-4 py-2.5">Denominación</th>
                    <th className="px-4 py-2.5">Año Vinculado</th>
                    <th className="px-4 py-2.5">Vigencia Oficial</th>
                    <th className="px-4 py-2.5">Estado</th>
                    <th className="px-4 py-2.5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {periodosAcademicos.map((pa) => {
                    const lectivo = periodosLectivos.find(pl => pl.id === pa.periodoLectivoId);
                    return (
                      <tr key={pa.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3 font-mono font-bold text-slate-900">{pa.codigo}</td>
                        <td className="px-4 py-3 font-medium text-slate-800">{pa.nombre}</td>
                        <td className="px-4 py-3 text-slate-600">
                          {lectivo ? `${lectivo.codigo} (${lectivo.nombre})` : 'Año General'}
                        </td>
                        <td className="px-4 py-3 text-slate-500 font-mono">
                          {pa.fechaInicio} al {pa.fechaFin}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                pa.estado === 'ACTIVO'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-slate-200 text-slate-600'
                              }`}
                            >
                              {pa.estado}
                            </span>
                            {pa.estado !== 'ACTIVO' && (
                              <button
                                type="button"
                                onClick={() => activarPeriodoAcademico(pa.id)}
                                className="px-2 py-0.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white rounded-md border border-emerald-300 text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                                title="Establecer como Periodo Académico Activo"
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Activar</span>
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEditAcademico(pa)}
                              className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                              title="Editar"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`¿Eliminar el periodo académico ${pa.codigo}?`)) {
                                  deletePeriodoAcademico(pa.id);
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Eliminar"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* 1.3 Periodos de Clases */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <CalendarRange className="w-5 h-5 text-cyan-600" />
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    3. Periodos de Dictado de Clases (Módulos Formativos)
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Rangos de fechas efectivos donde los docentes imparten las unidades didácticas y asistencias
                </p>
              </div>

              <button
                type="button"
                onClick={handleOpenNewClases}
                className="px-3.5 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Nuevo Periodo de Clases</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-2.5">Código</th>
                    <th className="px-4 py-2.5">Descripción de Clases</th>
                    <th className="px-4 py-2.5">Periodo Académico</th>
                    <th className="px-4 py-2.5">Fecha Inicio</th>
                    <th className="px-4 py-2.5">Fecha Cierre</th>
                    <th className="px-4 py-2.5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {periodosClases.map((pc) => {
                    const acad = periodosAcademicos.find(pa => pa.id === pc.periodoAcademicoId);
                    return (
                      <tr key={pc.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3 font-mono font-bold text-slate-900">{pc.codigo}</td>
                        <td className="px-4 py-3 font-medium text-slate-800">{pc.nombre}</td>
                        <td className="px-4 py-3 text-slate-600">{acad?.nombre || pc.periodoAcademicoId}</td>
                        <td className="px-4 py-3 font-mono text-slate-700">{pc.fechaInicio}</td>
                        <td className="px-4 py-3 font-mono text-slate-700">{pc.fechaFin}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEditClases(pc)}
                              className="p-1.5 text-slate-600 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors cursor-pointer"
                              title="Editar"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`¿Eliminar el periodo de clases ${pc.codigo}?`)) {
                                  deletePeriodoClases(pc.id);
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Eliminar"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: TURNOS Y HORARIOS DE DICTADO                                   */}
      {/* ========================================================================= */}
      {activeSubTab === 'turnos' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5 animate-in fade-in duration-150">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-600" />
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Configuración de Turnos y Franjas Horarias
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Turnos oficiales habilitados para dictado formativo (Mañana, Tarde, Noche, Fines de Semana)
              </p>
            </div>

            <button
              type="button"
              onClick={handleOpenNewTurno}
              className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Turno</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {turnos.map((t) => (
              <div
                key={t.id}
                className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-amber-300 hover:shadow-xs transition-all space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-slate-500">
                    {t.codigo}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      t.estado === 'Activo'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {t.estado || 'Activo'}
                  </span>
                </div>

                <div className="text-base font-black text-slate-900">
                  Turno {t.nombre}
                </div>

                <div className="p-3 bg-white border border-slate-200/80 rounded-xl space-y-1 text-xs">
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="text-slate-400">Hora Entrada:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {t.horaInicioReferencial || '08:00'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="text-slate-400">Hora Salida:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {t.horaFinReferencial || '13:00'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => handleOpenEditTurno(t)}
                    className="p-1.5 text-slate-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                    title="Editar Turno"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`¿Eliminar el turno ${t.nombre}?`)) {
                        deleteTurno(t.id);
                      }
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 3: SECCIONES OPERATIVAS Y HORARIOS ASIGNADOS                      */}
      {/* ========================================================================= */}
      {activeSubTab === 'secciones' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5 animate-in fade-in duration-150">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Catálogo General de Secciones y Horarios por Módulo
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Secciones habilitadas para matrícula con sus docentes, turnos, aulas y bloques horarios
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setSeccionToEdit(null);
                  setIsNuevaSeccionOpen(true);
                }}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Abrir Sección</span>
              </button>

              <button
                type="button"
                onClick={() => setIsAsistenteOpen(true)}
                className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>Apertura Masiva</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-2.5">Código / Sección</th>
                  <th className="px-4 py-2.5">Turno</th>
                  <th className="px-4 py-2.5">Aula / Ambiente</th>
                  <th className="px-4 py-2.5">Docente Asignado</th>
                  <th className="px-4 py-2.5 text-center">Matriculados / Vacantes</th>
                  <th className="px-4 py-2.5">Horarios Semanales</th>
                  <th className="px-4 py-2.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {secciones.map((sec) => {
                  const secHorarios = horarios.filter(h => h.seccionId === sec.id);
                  const docente = trabajadores.find(t => t.id === sec.trabajadorId);
                  const docenteNombre = docente?.persona?.nombres 
                    ? `${docente.persona.nombres} ${docente.persona.apellidoPaterno || ''}` 
                    : (docente ? docente.numeroDocumento : 'Sin Asignar');

                  return (
                    <tr key={sec.id} className="hover:bg-slate-50/60">
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900">{sec.nombre}</div>
                        <div className="font-mono text-[10px] text-slate-500">{sec.codigo}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900">
                          {sec.turno}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-700">
                        {sec.aula || 'Sin Aula'}
                      </td>
                      <td className="px-4 py-3 text-slate-700 truncate max-w-[150px]" title={docenteNombre}>
                        {docenteNombre}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-bold text-slate-900">{sec.matriculados}</span>
                        <span className="text-slate-400"> / {sec.vacantes || sec.capacidad || 30}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {secHorarios.length === 0 ? (
                            <span className="text-slate-400 text-[10px]">Sin Horarios</span>
                          ) : (
                            secHorarios.map(h => (
                              <span
                                key={h.id}
                                className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-mono"
                              >
                                {diasSemanaNombres[h.diaSemana]?.substring(0, 3)} {h.horaInicio?.substring(0, 5)}-{h.horaFin?.substring(0, 5)}
                              </span>
                            ))
                          )}
                          <button
                            type="button"
                            onClick={() => handleOpenHorariosSeccion(sec)}
                            className="text-blue-600 hover:text-blue-800 text-[10px] font-bold underline ml-1 cursor-pointer"
                          >
                            + Configurar
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedSeccionCronograma(sec)}
                            className="p-1.5 text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            title="Cronograma de Unidades Didácticas (UDT / UDE)"
                          >
                            <CalendarCheck className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedSeccionNominaPrint(sec.id)}
                            className="p-1.5 text-rose-700 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Nómina Oficial de Matrícula MINEDU (A4)"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSeccionToEdit(sec);
                              setIsNuevaSeccionOpen(true);
                            }}
                            className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Editar Sección"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`¿Eliminar la sección ${sec.nombre}?`)) {
                                deleteSeccion(sec.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Eliminar Sección"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 4: IDENTIDAD INSTITUCIONAL Y TUPA (MINEDU RVM 188-2020)           */}
      {/* ========================================================================= */}
      {activeSubTab === 'identidad' && (
        <form id="config-form" onSubmit={handleSaveInstitucion} className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <Building className="w-5 h-5 text-sky-600" />
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Identidad Institucional (MINEDU / RVM 188-2020)
                </h3>
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>{isSaving ? 'Guardando...' : 'Guardar Identidad'}</span>
              </button>
            </div>

            {/* Logo oficial */}
            <div className="border-b border-slate-100 pb-5">
              <ImageUploadField
                label="Logotipo Oficial Institucional (Tabla cetpros / Columna logo_url)"
                sublabel="Este logo se muestra en la cabecera del sistema, certificados oficiales, fichas de matrícula y reportes del CETPRO."
                value={formData.logoUrl || ''}
                onChange={(newLogo) => setFormData({ ...formData, logoUrl: newLogo })}
                aspectRatio="square"
                previewSize="md"
                helperText="Sube el archivo del logo oficial (PNG con transparencia recomendado) o proporciona un enlace web directo."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Nombre Oficial de la Institución</label>
                <input
                  type="text"
                  required
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Código Modular MINEDU</label>
                <input
                  type="text"
                  required
                  value={formData.codigoModular}
                  onChange={(e) => setFormData({ ...formData, codigoModular: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Código de Local</label>
                <input
                  type="text"
                  required
                  value={formData.codigoLocal}
                  onChange={(e) => setFormData({ ...formData, codigoLocal: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Número de RUC</label>
                <input
                  type="text"
                  required
                  value={formData.ruc}
                  onChange={(e) => setFormData({ ...formData, ruc: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">DRE / Instancia Regional</label>
                <input
                  type="text"
                  required
                  value={formData.dre}
                  onChange={(e) => setFormData({ ...formData, dre: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">UGEL de Jurisdicción</label>
                <input
                  type="text"
                  required
                  value={formData.ugel}
                  onChange={(e) => setFormData({ ...formData, ugel: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Director(a) General</label>
                <input
                  type="text"
                  required
                  value={formData.director}
                  onChange={(e) => setFormData({ ...formData, director: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Cuenta Corriente Banco de la Nación</label>
                <input
                  type="text"
                  value={formData.cuentaBancariaBN || ''}
                  onChange={(e) => setFormData({ ...formData, cuentaBancariaBN: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block font-semibold text-slate-700 mb-1">Dirección del Local Institucional</label>
                <input
                  type="text"
                  value={formData.direccion}
                  onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>
          </div>

          {/* TUPA Fees Table */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <DollarSign className="w-5 h-5 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Catálogo de Conceptos TUPA Institucional
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-2.5">Código</th>
                    <th className="px-4 py-2.5">Denominación del Arancel / Servicio</th>
                    <th className="px-4 py-2.5">Categoría</th>
                    <th className="px-4 py-2.5 text-right">Tarifa Referencial (S/)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {conceptosPago.map((conc) => (
                    <tr key={conc.id}>
                      <td className="px-4 py-2.5 font-mono font-bold text-slate-900">{conc.codigo}</td>
                      <td className="px-4 py-2.5 font-medium text-slate-800">{conc.nombre}</td>
                      <td className="px-4 py-2.5">
                        <Badge variant="neutral" size="sm">{conc.categoria}</Badge>
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono font-bold text-slate-900">
                        S/ {conc.montoSugerido?.toFixed(2) || '0.00'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 5: ACCESOS, MANTENIMIENTO Y SEGURIDAD                             */}
      {/* ========================================================================= */}
      {activeSubTab === 'mantenimiento' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Shield className="w-5 h-5 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Gestión de Accesos de Usuarios
              </h3>
            </div>
            <p className="text-xs text-slate-600">
              Genera automáticamente cuentas de usuario para todos los estudiantes y docentes importados en la base de datos.
              Su usuario y contraseña por defecto será su número de DNI.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleGenerateAccesses}
                disabled={isGenerating}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Shield className="w-4 h-4" />
                <span>{isGenerating ? 'Generando...' : 'Generar Cuentas de Acceso'}</span>
              </button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Database className="w-5 h-5 text-purple-600" />
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Mantenimiento y Copias de Seguridad
              </h3>
            </div>
            <p className="text-xs text-slate-600">
              Descargue una copia de seguridad íntegra de todos los registros académicos, padrón de personas, matrículas y tesorería en formato JSON estructurado.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleExportBackup}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Exportar Copia de Seguridad (.json)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB: TASAS Y TARIFAS DEL AÑO (TUPA / CUOTAS ANUALES)                  */}
      {/* ========================================================================= */}
      {activeSubTab === 'tasas' && (
        <TasasTarifasAnualesTab />
      )}

      {/* --- MODAL WIZARD: APERTURA RÁPIDA --- */}
      <AsistenteAperturaCicloModal
        isOpen={isAsistenteOpen}
        onClose={() => setIsAsistenteOpen(false)}
      />

      {/* --- MODAL: NUEVA SECCIÓN --- */}
      <NuevaSeccionModal
        isOpen={isNuevaSeccionOpen}
        onClose={() => {
          setIsNuevaSeccionOpen(false);
          setSeccionToEdit(null);
        }}
        seccionToEdit={seccionToEdit}
      />

      {/* --- MODAL: AÑO LECTIVO --- */}
      <Modal
        isOpen={isLectivoModalOpen}
        onClose={() => setIsLectivoModalOpen(false)}
        title={editingLectivo ? 'Editar Año Lectivo' : 'Nuevo Año Lectivo'}
        subtitle="Configura el código y vigencia del año escolar del CETPRO"
      >
        <form onSubmit={handleSaveLectivo} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Código del Año</label>
            <input
              type="text"
              required
              value={lectivoForm.codigo}
              onChange={(e) => setLectivoForm({ ...lectivoForm, codigo: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold font-mono focus:bg-white"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Nombre Oficial</label>
            <input
              type="text"
              required
              value={lectivoForm.nombre}
              onChange={(e) => setLectivoForm({ ...lectivoForm, nombre: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Fecha Inicio</label>
              <input
                type="date"
                required
                value={lectivoForm.fechaInicio}
                onChange={(e) => setLectivoForm({ ...lectivoForm, fechaInicio: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Fecha Cierre</label>
              <input
                type="date"
                required
                value={lectivoForm.fechaFin}
                onChange={(e) => setLectivoForm({ ...lectivoForm, fechaFin: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
              />
            </div>
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Estado</label>
            <select
              value={lectivoForm.estado}
              onChange={(e) => setLectivoForm({ ...lectivoForm, estado: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-bold"
            >
              <option value="ACTIVO">ACTIVO</option>
              <option value="CERRADO">CERRADO</option>
              <option value="PLANIFICACION">PLANIFICACION</option>
            </select>
          </div>
          <div className="flex items-center justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={() => setIsLectivoModalOpen(false)}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 rounded-xl font-medium cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold cursor-pointer shadow-xs"
            >
              Guardar Año Lectivo
            </button>
          </div>
        </form>
      </Modal>

      {/* --- MODAL: PERIODO ACADÉMICO --- */}
      <Modal
        isOpen={isAcademicoModalOpen}
        onClose={() => setIsAcademicoModalOpen(false)}
        title={editingAcademico ? 'Editar Periodo Académico' : 'Nuevo Periodo Académico'}
        subtitle="Configura el ciclo semestral o modular y su año vinculado"
      >
        <form onSubmit={handleSaveAcademico} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Año Lectivo Perteneciente</label>
            <select
              value={academicoForm.periodoLectivoId}
              onChange={(e) => setAcademicoForm({ ...academicoForm, periodoLectivoId: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-medium"
            >
              {periodosLectivos.map((pl) => (
                <option key={pl.id} value={pl.id}>
                  {pl.nombre} ({pl.codigo})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Código del Periodo</label>
            <input
              type="text"
              required
              value={academicoForm.codigo}
              onChange={(e) => setAcademicoForm({ ...academicoForm, codigo: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold font-mono focus:bg-white"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Denominación</label>
            <input
              type="text"
              required
              value={academicoForm.nombre}
              onChange={(e) => setAcademicoForm({ ...academicoForm, nombre: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Fecha Inicio</label>
              <input
                type="date"
                required
                value={academicoForm.fechaInicio}
                onChange={(e) => setAcademicoForm({ ...academicoForm, fechaInicio: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Fecha Fin</label>
              <input
                type="date"
                required
                value={academicoForm.fechaFin}
                onChange={(e) => setAcademicoForm({ ...academicoForm, fechaFin: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
              />
            </div>
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Estado</label>
            <select
              value={academicoForm.estado}
              onChange={(e) => setAcademicoForm({ ...academicoForm, estado: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-bold"
            >
              <option value="ACTIVO">ACTIVO</option>
              <option value="CERRADO">CERRADO</option>
              <option value="INACTIVO">INACTIVO</option>
            </select>
          </div>
          <div className="flex items-center justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={() => setIsAcademicoModalOpen(false)}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 rounded-xl font-medium cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold cursor-pointer shadow-xs"
            >
              Guardar Periodo Académico
            </button>
          </div>
        </form>
      </Modal>

      {/* --- MODAL: PERIODO DE CLASES --- */}
      <Modal
        isOpen={isClasesModalOpen}
        onClose={() => setIsClasesModalOpen(false)}
        title={editingClases ? 'Editar Periodo de Clases' : 'Nuevo Periodo de Clases'}
        subtitle="Define las fechas de dictado de clases presenciales o modulares"
      >
        <form onSubmit={handleSaveClases} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Periodo Académico Vinculado</label>
            <select
              value={clasesForm.periodoAcademicoId}
              onChange={(e) => setClasesForm({ ...clasesForm, periodoAcademicoId: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-medium"
            >
              {periodosAcademicos.map((pa) => (
                <option key={pa.id} value={pa.id}>
                  {pa.nombre} ({pa.codigo})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Código del Periodo de Clases</label>
            <input
              type="text"
              required
              value={clasesForm.codigo}
              onChange={(e) => setClasesForm({ ...clasesForm, codigo: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold font-mono focus:bg-white"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Nombre Descriptivo</label>
            <input
              type="text"
              required
              value={clasesForm.nombre}
              onChange={(e) => setClasesForm({ ...clasesForm, nombre: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Fecha Inicio de Clases</label>
              <input
                type="date"
                required
                value={clasesForm.fechaInicio}
                onChange={(e) => setClasesForm({ ...clasesForm, fechaInicio: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Fecha Fin de Clases</label>
              <input
                type="date"
                required
                value={clasesForm.fechaFin}
                onChange={(e) => setClasesForm({ ...clasesForm, fechaFin: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={() => setIsClasesModalOpen(false)}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 rounded-xl font-medium cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-bold cursor-pointer shadow-xs"
            >
              Guardar Periodo de Clases
            </button>
          </div>
        </form>
      </Modal>

      {/* --- MODAL: TURNO --- */}
      <Modal
        isOpen={isTurnoModalOpen}
        onClose={() => setIsTurnoModalOpen(false)}
        title={editingTurno ? 'Editar Turno' : 'Nuevo Turno'}
        subtitle="Configura el nombre del turno y sus horas de dictado referenciales"
      >
        <form onSubmit={handleSaveTurno} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Código</label>
            <input
              type="text"
              required
              value={turnoForm.codigo}
              onChange={(e) => setTurnoForm({ ...turnoForm, codigo: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold focus:bg-white"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Nombre del Turno</label>
            <input
              type="text"
              required
              value={turnoForm.nombre}
              onChange={(e) => setTurnoForm({ ...turnoForm, nombre: e.target.value })}
              placeholder="Ej. Mañana, Tarde, Noche, Sabatino"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-semibold"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Hora Inicio</label>
              <input
                type="time"
                required
                value={turnoForm.horaInicioReferencial}
                onChange={(e) => setTurnoForm({ ...turnoForm, horaInicioReferencial: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-mono font-bold"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Hora Fin</label>
              <input
                type="time"
                required
                value={turnoForm.horaFinReferencial}
                onChange={(e) => setTurnoForm({ ...turnoForm, horaFinReferencial: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-mono font-bold"
              />
            </div>
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Estado</label>
            <select
              value={turnoForm.estado}
              onChange={(e) => setTurnoForm({ ...turnoForm, estado: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white font-bold"
            >
              <option value="Activo">Activo</option>
              <option value="Inactivo">Inactivo</option>
            </select>
          </div>
          <div className="flex items-center justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={() => setIsTurnoModalOpen(false)}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 rounded-xl font-medium cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold cursor-pointer shadow-xs"
            >
              Guardar Turno
            </button>
          </div>
        </form>
      </Modal>

      {/* --- MODAL: GESTIÓN DE HORARIOS DE UNA SECCIÓN --- */}
      <Modal
        isOpen={!!selectedSeccionForHorario}
        onClose={() => setSelectedSeccionForHorario(null)}
        title={`Horarios: ${selectedSeccionForHorario?.nombre || ''}`}
        subtitle="Asigna días y horas semanales en los que se dictará esta sección"
      >
        {selectedSeccionForHorario && (
          <div className="space-y-5 text-xs">
            {/* Current Schedules for this section */}
            <div className="space-y-2">
              <label className="block font-bold text-slate-700">Horarios Programados Actualmente</label>
              {horarios.filter(h => h.seccionId === selectedSeccionForHorario.id).length === 0 ? (
                <div className="p-4 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-500">
                  Esta sección aún no tiene bloques de horario programados. Agrega uno a continuación.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {horarios
                    .filter(h => h.seccionId === selectedSeccionForHorario.id)
                    .map((h) => (
                      <div key={h.id} className="p-3 bg-white flex items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-800 font-bold rounded-md">
                            {diasSemanaNombres[h.diaSemana]}
                          </span>
                          <span className="font-mono font-bold text-slate-800">
                            {h.horaInicio?.substring(0, 5)} - {h.horaFin?.substring(0, 5)}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => deleteHorario(h.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Form to add a new schedule block */}
            <form onSubmit={handleAddHorarioToSeccion} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <div className="font-bold text-slate-800 flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-blue-600" />
                <span>Agregar Bloque de Horario</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Día de Semana</label>
                  <select
                    value={horarioForm.diaSemana}
                    onChange={(e) => setHorarioForm({ ...horarioForm, diaSemana: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-medium text-xs"
                  >
                    <option value={1}>Lunes</option>
                    <option value={2}>Martes</option>
                    <option value={3}>Miércoles</option>
                    <option value={4}>Jueves</option>
                    <option value={5}>Viernes</option>
                    <option value={6}>Sábado</option>
                    <option value={7}>Domingo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-medium mb-1">Hora Inicio</label>
                  <input
                    type="time"
                    required
                    value={horarioForm.horaInicio}
                    onChange={(e) => setHorarioForm({ ...horarioForm, horaInicio: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-mono font-bold text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-medium mb-1">Hora Fin</label>
                  <input
                    type="time"
                    required
                    value={horarioForm.horaFin}
                    onChange={(e) => setHorarioForm({ ...horarioForm, horaFin: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-mono font-bold text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
                >
                  Guardar Bloque Horario
                </button>
              </div>
            </form>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedSeccionForHorario(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cerrar Ventana
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Nómina Oficial MINEDU (A4) */}
      {selectedSeccionNominaPrint && (
        <NominaMatriculaPrint
          isOpen={!!selectedSeccionNominaPrint}
          onClose={() => setSelectedSeccionNominaPrint(null)}
          seccionId={selectedSeccionNominaPrint}
        />
      )}

      {/* Modal Cronograma de Unidades Didácticas (UDT / UDE) */}
      {selectedSeccionCronograma && (
        <CronogramaUnidadesModal
          isOpen={!!selectedSeccionCronograma}
          onClose={() => setSelectedSeccionCronograma(null)}
          seccion={selectedSeccionCronograma}
        />
      )}

    </div>
  );
};
