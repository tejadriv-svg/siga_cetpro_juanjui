import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { HorarioDetalle } from '../../types';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { isSamePeriodo, formatPeriodoDisplay } from '../../utils/normalizePeriodo';
import {
  Clock,
  Calendar,
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Users,
  MapPin,
  BookOpen,
  Sparkles,
  LayoutGrid,
  List,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Award,
  Lock,
  Unlock,
  GripVertical,
  GraduationCap,
  Layers,
  Check
} from 'lucide-react';

const DIAS_SEMANA = [
  { dia: 1, nombre: 'Lunes' },
  { dia: 2, nombre: 'Martes' },
  { dia: 3, nombre: 'Miércoles' },
  { dia: 4, nombre: 'Jueves' },
  { dia: 5, nombre: 'Viernes' },
  { dia: 6, nombre: 'Sábado' },
  { dia: 7, nombre: 'Domingo' },
];

const PRESETS_HORARIOS = [
  // Lunes a Viernes - Mañana
  { label: 'Mañana - Bloque 1 (3h: 07:30 - 09:45)', inicio: '07:30', fin: '09:45' },
  { label: 'Mañana - Bloque 2 (3h: 10:05 - 12:20)', inicio: '10:05', fin: '12:20' },
  { label: 'Mañana - Empleabilidad fin de jornada (2h: 10:50 - 12:20)', inicio: '10:50', fin: '12:20' },
  { label: 'Mañana - Empleabilidad bloque completo (3h: 10:05 - 12:20)', inicio: '10:05', fin: '12:20' },

  // Lunes a Viernes - Tarde
  { label: 'Tarde - Bloque 1 (3h: 14:30 - 16:45)', inicio: '14:30', fin: '16:45' },
  { label: 'Tarde - Bloque 2 (3h: 17:05 - 19:20)', inicio: '17:05', fin: '19:20' },
  { label: 'Tarde - Empleabilidad fin de jornada (2h: 17:50 - 19:20)', inicio: '17:50', fin: '19:20' },
  { label: 'Tarde - Empleabilidad bloque completo (3h: 17:05 - 19:20)', inicio: '17:05', fin: '19:20' },

  // Fin de Semana (Sábados y Domingos) - 4 Bloques (2 Mañana + 2 Tarde)
  { label: 'Fin de Semana - Mañana Bloque 1 (3h: 07:30 - 09:45)', inicio: '07:30', fin: '09:45' },
  { label: 'Fin de Semana - Mañana Bloque 2 (3h: 10:05 - 12:20)', inicio: '10:05', fin: '12:20' },
  { label: 'Fin de Semana - Tarde Bloque 3 (3h: 13:00 - 15:15)', inicio: '13:00', fin: '15:15' },
  { label: 'Fin de Semana - Tarde Bloque 4 / Cierre (3h: 15:35 - 17:50)', inicio: '15:35', fin: '17:50' },
];

export const HorariosView: React.FC = () => {
  const {
    secciones = [],
    modulos = [],
    unidades = [],
    trabajadores = [],
    personas = [],
    aulas = [],
    turnos = [],
    periodoActivo,
    periodosAcademicos = [],
    setActiveView,
    addToast,
    currentUser,
  } = useApp();

  const isDocente = currentUser?.rol === 'DOCENTE' || currentUser?.rol === 'TRABAJADOR';
  const currentTrabajador = isDocente ? trabajadores.find(t => t.personaId === currentUser?.personaId) : null;
  const docenteSecciones = useMemo(() => {
    if (!currentTrabajador) return [];
    return secciones.filter(s => s.trabajadorId === currentTrabajador.id);
  }, [currentTrabajador, secciones]);

  const [horarios, setHorarios] = useState<HorarioDetalle[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [periodoFilter, setPeriodoFilter] = useState<string>(() => {
    return periodoActivo ? formatPeriodoDisplay(periodoActivo) : '2026-II';
  });
  const [turnoFilter, setTurnoFilter] = useState<string>('ALL');
  const [seccionFilter, setSeccionFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Si el usuario es docente, preseleccionar automáticamente su sección asignada
  useEffect(() => {
    if (isDocente && docenteSecciones.length > 0 && seccionFilter === 'ALL') {
      setSeccionFilter(docenteSecciones[0].id);
    }
  }, [isDocente, docenteSecciones]);

  // Modo Diseño / Drag & Drop Interactivo
  const [isDesignMode, setIsDesignMode] = useState<boolean>(false);
  const [draggedHorarioId, setDraggedHorarioId] = useState<string | null>(null);
  const [dragOverDay, setDragOverDay] = useState<number | null>(null);

  // Cronograma de Unidades Didácticas (Programación Modular)
  const [cronograma, setCronograma] = useState<any[]>([]);
  const [cronogramaLoading, setCronogramaLoading] = useState<boolean>(false);
  const [showCronograma, setShowCronograma] = useState<boolean>(true);
  const [isFechasModalOpen, setIsFechasModalOpen] = useState<boolean>(false);
  const [fechasForm, setFechasForm] = useState<any[]>([]);
  const [isSavingFechas, setIsSavingFechas] = useState<boolean>(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingHorario, setEditingHorario] = useState<HorarioDetalle | null>(null);
  const [deletingHorarioId, setDeletingHorarioId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Form State
  const [formData, setFormData] = useState({
    seccionId: '',
    diaSemana: 1,
    horaInicio: '07:30',
    horaFin: '09:45',
    unidadId: '',
    aulaId: '',
    asignacionDocenteId: '',
    docenteId: '',
  });

  const fetchHorarios = async () => {
    setLoading(true);
    try {
      let url = `/api/academic/horarios?periodoId=${encodeURIComponent(periodoFilter)}`;
      if (seccionFilter !== 'ALL') {
        url += `&seccionId=${encodeURIComponent(seccionFilter)}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setHorarios(data);
      }
    } catch (err) {
      console.error('Error fetching horarios:', err);
      addToast('Error', 'No se pudieron cargar los horarios', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchCronograma = async (secId: string) => {
    if (!secId || secId === 'ALL') {
      setCronograma([]);
      return;
    }
    setCronogramaLoading(true);
    try {
      const res = await fetch(`/api/academic/secciones/${secId}/unidades`);
      if (res.ok) {
        const data = await res.json();
        setCronograma(data.unidades || []);
      }
    } catch (err) {
      console.error('Error fetching cronograma:', err);
    } finally {
      setCronogramaLoading(false);
    }
  };

  useEffect(() => {
    fetchHorarios();
  }, [periodoFilter, seccionFilter]);

  useEffect(() => {
    if (seccionFilter && seccionFilter !== 'ALL') {
      fetchCronograma(seccionFilter);
    } else {
      setCronograma([]);
    }
  }, [seccionFilter]);

  // Lista unificada de periodos disponibles
  const availablePeriodos = useMemo(() => {
    const set = new Set<string>();
    ['2026-II', '2026-I', '2025-II', '2025-I'].forEach(p => set.add(p));
    periodosAcademicos.forEach(pa => {
      const fmt = formatPeriodoDisplay(pa.codigo || pa.nombre);
      if (fmt) set.add(fmt);
    });
    secciones.forEach(s => {
      const fmt = formatPeriodoDisplay(s.periodoAcademico || s.codigo);
      if (fmt) set.add(fmt);
    });
    return Array.from(set);
  }, [periodosAcademicos, secciones]);

  // Secciones filtradas por periodo y turno
  const seccionesDelPeriodo = useMemo(() => {
    return secciones.filter(s => {
      const matchPeriodo =
        periodoFilter === 'ALL' ||
        isSamePeriodo(s.periodoAcademico, periodoFilter);

      const selectedTurno = turnos.find(t => t.id === turnoFilter);
      const matchTurno =
        turnoFilter === 'ALL' ||
        s.turnoId === turnoFilter ||
        (selectedTurno && s.turno && s.turno.toLowerCase() === selectedTurno.nombre.toLowerCase());

      return matchPeriodo && matchTurno;
    });
  }, [secciones, periodoFilter, turnoFilter, turnos]);

  // Sincronizar selección de sección al cambiar periodo o turno
  useEffect(() => {
    if (seccionesDelPeriodo.length > 0) {
      const exists = seccionesDelPeriodo.some(s => s.id === seccionFilter);
      if (!exists) {
        setSeccionFilter(seccionesDelPeriodo[0].id);
      }
    } else {
      setSeccionFilter('ALL');
    }
  }, [seccionesDelPeriodo, seccionFilter]);

  const currentSeccion = useMemo(() => {
    return secciones.find(s => s.id === seccionFilter) || null;
  }, [secciones, seccionFilter]);

  const currentModulo = useMemo(() => {
    if (!currentSeccion) return null;
    return modulos.find(m => m.id === currentSeccion.moduloId) || null;
  }, [currentSeccion, modulos]);

  // Unidades disponibles para la sección actual del filtro principal
  const unidadesDeLaSeccion = useMemo(() => {
    if (!currentModulo) return [];
    return unidades.filter(u => u.moduloId === currentModulo.id);
  }, [currentModulo, unidades]);

  // Horarios de la sección actual
  const horariosDeLaSeccion = useMemo(() => {
    return horarios.filter(h => h.seccion_id === seccionFilter);
  }, [horarios, seccionFilter]);

  // Sección y Módulo seleccionados dinámicamente dentro del modal
  const modalSeccion = useMemo(() => {
    return (
      secciones.find(s => s.id === formData.seccionId) ||
      currentSeccion ||
      seccionesDelPeriodo[0] ||
      secciones[0] ||
      null
    );
  }, [secciones, formData.seccionId, currentSeccion, seccionesDelPeriodo]);

  const modalModulo = useMemo(() => {
    if (!modalSeccion) return null;
    return modulos.find(m => m.id === modalSeccion.moduloId) || null;
  }, [modalSeccion, modulos]);

  const modalUnidades = useMemo(() => {
    if (!modalModulo) return [];
    return unidades.filter(u => u.moduloId === modalModulo.id);
  }, [modalModulo, unidades]);

  // Manejador al cambiar sección dentro del modal
  const handleModalSeccionChange = (newSecId: string) => {
    const sec = secciones.find(s => s.id === newSecId);
    const mod = modulos.find(m => m.id === sec?.moduloId);
    const secUnidades = mod ? unidades.filter(u => u.moduloId === mod.id) : [];

    setFormData(prev => ({
      ...prev,
      seccionId: newSecId,
      aulaId: sec?.aulaId || prev.aulaId || (aulas[0]?.id || ''),
      unidadId: secUnidades[0]?.id || '',
    }));
  };

  // Estadísticas de horas
  const stats = useMemo(() => {
    let tecnicas = 0;
    let empleabilidad = 0;

    horariosDeLaSeccion.forEach(h => {
      const hp = Number(h.horas_pedagogicas) || 0;
      if (h.tipo_unidad === 'Empleabilidad') {
        empleabilidad += hp;
      } else {
        tecnicas += hp;
      }
    });

    return {
      tecnicas: Math.round(tecnicas * 10) / 10,
      empleabilidad: Math.round(empleabilidad * 10) / 10,
      total: Math.round((tecnicas + empleabilidad) * 10) / 10,
    };
  }, [horariosDeLaSeccion]);

  // Abrir Modal de Creación
  const handleOpenCreate = () => {
    setEditingHorario(null);
    const initialSec =
      (seccionFilter !== 'ALL' ? secciones.find(s => s.id === seccionFilter) : null) ||
      (isDocente && docenteSecciones.length > 0 ? docenteSecciones[0] : null) ||
      seccionesDelPeriodo[0] ||
      secciones[0] ||
      null;

    const initialSecId = initialSec?.id || '';
    const initialMod = modulos.find(m => m.id === initialSec?.moduloId);
    const initialUnidades = initialMod ? unidades.filter(u => u.moduloId === initialMod.id) : [];

    setFormData({
      seccionId: initialSecId,
      diaSemana: 1,
      horaInicio: '07:30',
      horaFin: '09:45',
      unidadId: initialUnidades[0]?.id || '',
      aulaId: initialSec?.aulaId || (aulas[0]?.id || ''),
      asignacionDocenteId: '',
      docenteId: currentTrabajador?.id || initialSec?.trabajadorId || '',
    });
    setIsModalOpen(true);
  };

  // Abrir Modal de Edición
  const handleOpenEdit = (h: HorarioDetalle) => {
    setEditingHorario(h);
    const sec = secciones.find(s => s.id === h.seccion_id);

    // Buscar si algún trabajador coincide con el docente_nombre o de la sección
    let docId = sec?.trabajadorId || '';
    if (h.docente_nombre) {
      const docName = h.docente_nombre.toLowerCase();
      const matchTrab = trabajadores.find(t => {
        const p = personas.find(per => per.id === t.personaId);
        if (!p) return false;
        const pFull = `${p.nombres} ${p.apellidoPaterno} ${p.apellidoMaterno || ''}`.toLowerCase();
        return docName.includes(p.apellidoPaterno.toLowerCase()) || pFull.includes(docName);
      });
      if (matchTrab) docId = matchTrab.id;
    }

    setFormData({
      seccionId: h.seccion_id,
      diaSemana: h.dia_semana,
      horaInicio: (h.hora_inicio || '07:30').slice(0, 5),
      horaFin: (h.hora_fin || '09:45').slice(0, 5),
      unidadId: h.unidad_id || '',
      aulaId: aulas.find(a => a.nombre === h.aula_nombre || a.codigo === h.aula_codigo)?.id || sec?.aulaId || '',
      asignacionDocenteId: '',
      docenteId: docId,
    });
    setIsModalOpen(true);
  };

  // Guardar (Crear o Editar)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.seccionId) {
      addToast('Atención', 'Debe seleccionar una sección válida', 'warning');
      return;
    }
    if (!formData.horaInicio || !formData.horaFin) {
      addToast('Atención', 'Debe definir las horas de inicio y fin', 'warning');
      return;
    }
    if (formData.horaInicio >= formData.horaFin) {
      addToast('Horario Inválido', 'La hora de fin debe ser posterior a la hora de inicio', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        diaSemana: Number(formData.diaSemana),
        horaInicio: formData.horaInicio.length === 5 ? `${formData.horaInicio}:00` : formData.horaInicio,
        horaFin: formData.horaFin.length === 5 ? `${formData.horaFin}:00` : formData.horaFin,
        unidadId: formData.unidadId && formData.unidadId.trim() !== '' ? formData.unidadId : null,
        aulaId: formData.aulaId && formData.aulaId.trim() !== '' ? formData.aulaId : null,
        docenteId: formData.docenteId && formData.docenteId.trim() !== '' ? formData.docenteId : null,
      };

      if (editingHorario) {
        // Actualizar
        const res = await fetch(`/api/academic/horarios/${editingHorario.horario_id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          addToast('Éxito', 'Horario actualizado correctamente', 'success');
          setIsModalOpen(false);
          fetchHorarios();
        } else {
          const err = await res.json();
          addToast('Error', err.error || 'Error al actualizar', 'error');
        }
      } else {
        // Crear
        const res = await fetch('/api/academic/horarios', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            seccionId: formData.seccionId,
            ...payload,
          }),
        });
        if (res.ok) {
          addToast('Éxito', 'Bloque horario creado con éxito', 'success');
          setIsModalOpen(false);
          fetchHorarios();
        } else {
          const err = await res.json();
          addToast('Error', err.error || 'Error al crear', 'error');
        }
      }
    } catch (err: any) {
      addToast('Error', err.message || 'Error de conexión', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Eliminar
  const handleDelete = async () => {
    if (!deletingHorarioId) return;
    try {
      const res = await fetch(`/api/academic/horarios/${deletingHorarioId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        addToast('Eliminado', 'Bloque horario eliminado', 'info');
        setDeletingHorarioId(null);
        fetchHorarios();
      }
    } catch (err) {
      addToast('Error', 'No se pudo eliminar el horario', 'error');
    }
  };

  // Drag & Drop: Mover bloque a otro día
  const handleDropOnDay = async (targetDia: number) => {
    if (!draggedHorarioId) return;
    const item = horarios.find(h => h.horario_id === draggedHorarioId);
    if (!item) return;

    if (item.dia_semana === targetDia) {
      setDraggedHorarioId(null);
      setDragOverDay(null);
      return;
    }

    const targetDiaNombre = DIAS_SEMANA.find(d => d.dia === targetDia)?.nombre || `Día ${targetDia}`;
    const previousDia = item.dia_semana;

    // Actualización optimista local
    setHorarios(prev =>
      prev.map(h =>
        h.horario_id === draggedHorarioId
          ? { ...h, dia_semana: targetDia, dia_nombre: targetDiaNombre }
          : h
      )
    );
    setDraggedHorarioId(null);
    setDragOverDay(null);

    try {
      const res = await fetch(`/api/academic/horarios/${item.horario_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ diaSemana: targetDia }),
      });
      if (!res.ok) {
        throw new Error('Error al actualizar día');
      }
      addToast('Horario Reorganizado', `Bloque movido a ${targetDiaNombre}`, 'success');
      fetchHorarios();
    } catch (err: any) {
      // Revertir optimismo
      setHorarios(prev =>
        prev.map(h => (h.horario_id === item.horario_id ? { ...h, dia_semana: previousDia } : h))
      );
      addToast('Error', 'No se pudo mover el bloque de horario', 'error');
    }
  };

  // Abrir modal para programar fechas de unidades del módulo
  const handleOpenFechasModal = () => {
    if (!cronograma || cronograma.length === 0) {
      addToast('Aviso', 'No hay unidades registradas en este módulo', 'warning');
      return;
    }
    setFechasForm(
      cronograma.map(u => ({
        unidadId: u.unidad_id,
        unidadCodigo: u.unidad_codigo,
        unidadNombre: u.unidad_nombre,
        unidadTipo: u.unidad_tipo,
        fechaInicio: u.fecha_inicio ? u.fecha_inicio.slice(0, 10) : '',
        fechaFin: u.fecha_fin ? u.fecha_fin.slice(0, 10) : '',
        horas: u.horas || u.unidad_horas || 48,
        creditos: u.creditos || u.unidad_creditos || 2,
        docenteId: u.docente_id || '',
        estado: u.estado || 'PROGRAMADA',
      }))
    );
    setIsFechasModalOpen(true);
  };

  // Guardar fechas del cronograma
  const handleSaveFechas = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSeccion) return;
    setIsSavingFechas(true);
    try {
      const res = await fetch(`/api/academic/secciones/${currentSeccion.id}/unidades`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: fechasForm }),
      });
      if (res.ok) {
        addToast('Éxito', 'Cronograma de fechas guardado exitosamente', 'success');
        setIsFechasModalOpen(false);
        fetchCronograma(currentSeccion.id);
      } else {
        const err = await res.json();
        addToast('Error', err.error || 'Error al guardar fechas', 'error');
      }
    } catch (err: any) {
      addToast('Error', err.message || 'Error de conexión', 'error');
    } finally {
      setIsSavingFechas(false);
    }
  };

  const formatDateBR = (raw?: string | null) => {
    if (!raw) return '-';
    const clean = String(raw).slice(0, 10);
    const parts = clean.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return clean;
  };

  // Días relevantes para mostrar en la grilla según el turno de la sección
  const diasAMostrar = useMemo(() => {
    if (!currentSeccion) return DIAS_SEMANA.slice(0, 5);
    const turno = turnos.find(t => t.id === currentSeccion.turnoId);
    const tCod = turno?.codigo?.toUpperCase();
    if (tCod === 'S') return DIAS_SEMANA.filter(d => d.dia === 6);
    if (tCod === 'D') return DIAS_SEMANA.filter(d => d.dia === 7);
    return DIAS_SEMANA.slice(0, 5); // Lunes a Viernes
  }, [currentSeccion, turnos]);

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-blue-700 text-white flex items-center justify-center shadow-xs">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              Horarios de Clases y Carga Lectiva
              <span className="text-[10px] bg-sky-50 text-sky-700 font-mono font-semibold px-2 py-0.5 rounded-full border border-sky-200/60">
                {periodoFilter}
              </span>
            </h1>
            <p className="text-xs text-slate-500">
              Programación semanal, distribución de unidades técnicas y empleabilidad
            </p>
          </div>
        </div>

        {/* Acciones principales */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <button
            onClick={fetchHorarios}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl border border-slate-200 text-xs transition-colors cursor-pointer"
            title="Recargar horarios"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'grid' ? 'bg-white text-blue-700 shadow-2xs font-semibold' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Vista Malla Semanal"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'list' ? 'bg-white text-blue-700 shadow-2xs font-semibold' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Vista Lista"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Botón Modo Diseño / Bloquear Horarios */}
          {seccionFilter !== 'ALL' && viewMode === 'grid' && (
            <button
              onClick={() => {
                const nextMode = !isDesignMode;
                setIsDesignMode(nextMode);
                if (nextMode) {
                  addToast('Modo Diseño Habilitado', 'Puedes arrastrar y soltar los bloques de horario para reorganizarlos.', 'info');
                } else {
                  addToast('Distribución Bloqueada', 'Los horarios quedaron fijados para su operación normal.', 'success');
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-xs ${
                isDesignMode
                  ? 'bg-amber-500 hover:bg-amber-600 text-white ring-2 ring-amber-300 animate-pulse'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
              }`}
              title={isDesignMode ? 'Bloquear y asegurar horarios' : 'Habilitar arrastrar y soltar'}
            >
              {isDesignMode ? (
                <>
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Guardar y Bloquear</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>Diseñar / Reorganizar</span>
                </>
              )}
            </button>
          )}

          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Horario</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-wrap items-center gap-2.5">
        {/* Filtro Periodo */}
        <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-500 font-medium">Periodo:</span>
          <select
            value={periodoFilter}
            onChange={(e) => {
              setPeriodoFilter(e.target.value);
              setSeccionFilter('ALL');
            }}
            className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer"
          >
            {availablePeriodos.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
            <option value="ALL">Todos los periodos</option>
          </select>
        </div>

        {/* Filtro Turno */}
        <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-500 font-medium">Turno:</span>
          <select
            value={turnoFilter}
            onChange={(e) => {
              setTurnoFilter(e.target.value);
              setSeccionFilter('ALL');
            }}
            className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer"
          >
            <option value="ALL">Todos los turnos</option>
            {turnos.map(t => (
              <option key={t.id} value={t.id}>{t.nombre}</option>
            ))}
          </select>
        </div>

        {/* Selector de Sección */}
        <div className="flex-1 min-w-[240px] flex items-center gap-1.5 bg-blue-50/50 px-3 py-1.5 rounded-xl border border-blue-200/60 text-xs">
          <BookOpen className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span className="text-blue-700 font-semibold shrink-0">Sección:</span>
          <select
            value={seccionFilter}
            onChange={(e) => setSeccionFilter(e.target.value)}
            className="w-full bg-transparent font-bold text-slate-900 focus:outline-none cursor-pointer truncate"
          >
            {!isDocente && <option value="ALL">-- Ver todas las secciones ({seccionesDelPeriodo.length}) --</option>}
            {(isDocente && docenteSecciones.length > 0 ? docenteSecciones : seccionesDelPeriodo).map(s => {
              const mod = modulos.find(m => m.id === s.moduloId);
              const tur = turnos.find(t => t.id === s.turnoId) || { nombre: s.turno };
              return (
                <option key={s.id} value={s.id}>
                  [{tur?.nombre || 'T'}] {s.codigo} • {mod?.nombre || s.nombre}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Section Summary Card (When a section is selected) */}
      {currentSeccion && (
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-4 rounded-2xl text-white shadow-xs space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-700/60 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs bg-blue-500/20 text-blue-300 font-bold px-2 py-0.5 rounded border border-blue-400/30">
                  {currentSeccion.codigo}
                </span>
                <span className="text-xs text-slate-300">
                  Turno: <strong className="text-white">{turnos.find(t => t.id === currentSeccion.turnoId)?.nombre || 'General'}</strong>
                </span>
              </div>
              <h2 className="text-sm font-bold text-white mt-1">
                {currentModulo?.nombre || currentSeccion.nombre}
              </h2>
            </div>

            {/* Metrics Chips */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">
                <span className="text-[10px] text-slate-400 uppercase block font-semibold">Técnica</span>
                <span className="text-sm font-bold text-sky-300">{stats.tecnicas} hrs</span>
              </div>
              <div className="bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">
                <span className="text-[10px] text-slate-400 uppercase block font-semibold">Empleabilidad</span>
                <span className="text-sm font-bold text-emerald-300">{stats.empleabilidad} hrs</span>
              </div>
              <div className="bg-blue-600/30 px-3 py-1.5 rounded-xl border border-blue-400/40">
                <span className="text-[10px] text-blue-200 uppercase block font-semibold">Total Semanal</span>
                <span className="text-sm font-bold text-white">{stats.total} hrs</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-300">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                Aula: <strong className="text-white">{aulas.find(a => a.id === currentSeccion.aulaId)?.nombre || 'No asignada'}</strong>
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                Capacidad: <strong className="text-white">{currentSeccion.capacidad || 20} alumnos</strong>
              </span>
            </div>
            <div className="text-[11px] text-slate-400">
              * Las 30 horas pedagógicas se distribuyen según el plan de estudios CNOF
            </div>
          </div>
        </div>
      )}

      {/* Banner de Modo Diseño Drag & Drop */}
      {isDesignMode && currentSeccion && (
        <div className="bg-amber-50 border-2 border-amber-300 p-3 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-900 shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-200/80 flex items-center justify-center shrink-0">
              <GripVertical className="w-4 h-4 text-amber-800" />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-950">
                🎨 Modo Diseño Habilitado (Arrastrar y Soltar)
              </p>
              <p className="text-[11px] text-amber-800">
                Arrastra cualquier bloque de horario y suéltalo sobre el día al que desees moverlo. Al terminar, presiona "Listo, Bloquear Horarios".
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setIsDesignMode(false);
              addToast('Distribución Asegurada', 'Los horarios quedaron bloqueados para protegerlos contra movimientos involuntarios.', 'success');
            }}
            className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer shrink-0 flex items-center justify-center gap-1.5"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Listo, Bloquear Horarios</span>
          </button>
        </div>
      )}

      {/* Panel de Cronograma Modular y Cierre de Unidades Didácticas */}
      {currentSeccion && cronograma.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="p-3 bg-slate-50/80 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                  Cronograma Modular de Unidades Didácticas
                  <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.2 rounded-full">
                    {cronograma.length} Unidades
                  </span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  Fechas de inicio y fin por unidad técnica y transversalidad de empleabilidad
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleOpenFechasModal}
                className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Editar fechas de inicio y fin"
              >
                <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                <span>Programar Fechas</span>
              </button>
              <button
                onClick={() => setShowCronograma(!showCronograma)}
                className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
                title={showCronograma ? 'Ocultar cronograma' : 'Mostrar cronograma'}
              >
                {showCronograma ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {showCronograma && (
            <div className="p-3">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {cronograma.map((u) => {
                  const isEmp = u.unidad_tipo === 'Empleabilidad' || u.unidad_codigo?.includes('UDE');
                  const now = new Date();
                  const finDate = u.fecha_fin ? new Date(u.fecha_fin + 'T23:59:59') : null;
                  const iniDate = u.fecha_inicio ? new Date(u.fecha_inicio + 'T00:00:00') : null;

                  const isCulminada = finDate && now > finDate;
                  const isEnCurso = iniDate && finDate && now >= iniDate && now <= finDate;

                  return (
                    <div
                      key={u.unidad_id}
                      className={`p-3 rounded-xl border transition-all text-xs flex flex-col justify-between ${
                        isCulminada
                          ? 'bg-emerald-50/40 border-emerald-200'
                          : isEnCurso
                          ? 'bg-blue-50/50 border-blue-200 shadow-2xs'
                          : 'bg-slate-50/60 border-slate-200'
                      }`}
                    >
                      <div>
                        {/* Tipo y Estado */}
                        <div className="flex items-center justify-between gap-1 mb-1.5">
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded font-mono ${
                              isEmp
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-sky-100 text-sky-800'
                            }`}
                          >
                            {isEmp ? 'Empleabilidad (Transversal)' : 'Técnica Específica'}
                          </span>

                          {isCulminada ? (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-600 text-white flex items-center gap-0.5">
                              <CheckCircle2 className="w-2.5 h-2.5" /> Culminada
                            </span>
                          ) : isEnCurso ? (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-600 text-white animate-pulse">
                              En Desarrollo
                            </span>
                          ) : (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                              Programada
                            </span>
                          )}
                        </div>

                        {/* Nombre y Código */}
                        <h4 className="font-bold text-slate-900 leading-snug line-clamp-2 mb-1">
                          {u.unidad_nombre}
                        </h4>
                        <div className="text-[10px] font-mono text-slate-500 mb-2">
                          {u.unidad_codigo} • {u.horas || u.unidad_horas || 48} hrs ({u.creditos || 2} créd)
                        </div>

                        {/* Rango de Fechas */}
                        <div className="bg-white/80 p-2 rounded-lg border border-slate-200/70 space-y-1 mb-2">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-500 font-medium">Inicio:</span>
                            <strong className="text-slate-800 font-mono">{formatDateBR(u.fecha_inicio)}</strong>
                          </div>
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-500 font-medium">Fin:</span>
                            <strong className="text-slate-800 font-mono">{formatDateBR(u.fecha_fin)}</strong>
                          </div>
                        </div>
                      </div>

                      {/* Botón de Ingreso de Calificaciones cuando culmina */}
                      {isCulminada ? (
                        <button
                          onClick={() => setActiveView('calificaciones')}
                          className="w-full py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] shadow-2xs transition-colors cursor-pointer flex items-center justify-center gap-1.5 mt-1"
                        >
                          <GraduationCap className="w-3.5 h-3.5" />
                          <span>Ingresar Calificaciones</span>
                        </button>
                      ) : (
                        <div className="text-[10px] text-slate-400 text-center italic py-1">
                          {isEmp ? 'Dictado transversal todo el semestre' : 'Evaluación disponible al culminar fecha'}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
          <RefreshCw className="w-6 h-6 text-blue-600 animate-spin mx-auto" />
          <p className="text-xs text-slate-500">Cargando malla de horarios...</p>
        </div>
      ) : seccionFilter === 'ALL' ? (
        /* Vista de todas las secciones en tabla resumida */
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="p-3 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800">
              Todas las Secciones del Periodo ({seccionesDelPeriodo.length})
            </h3>
            <span className="text-[11px] text-slate-500">
              Haz clic en una sección para ver o modificar su horario semanal
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-100/60 font-semibold text-slate-700">
                  <th className="py-2.5 px-3">Código</th>
                  <th className="py-2.5 px-3">Turno</th>
                  <th className="py-2.5 px-3">Módulo / Especialidad</th>
                  <th className="py-2.5 px-3">Aula</th>
                  <th className="py-2.5 px-3 text-center">Horas Técnica</th>
                  <th className="py-2.5 px-3 text-center">Horas Empleab.</th>
                  <th className="py-2.5 px-3 text-center">Total Horas</th>
                  <th className="py-2.5 px-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {seccionesDelPeriodo.map((sec) => {
                  const mod = modulos.find(m => m.id === sec.moduloId);
                  const tur = turnos.find(t => t.id === sec.turnoId);
                  const aul = aulas.find(a => a.id === sec.aulaId);

                  const secHorarios = horarios.filter(h => h.seccion_id === sec.id);
                  let tec = 0;
                  let emp = 0;
                  secHorarios.forEach(h => {
                    const hp = Number(h.horas_pedagogicas) || 0;
                    if (h.tipo_unidad === 'Empleabilidad') emp += hp;
                    else tec += hp;
                  });

                  return (
                    <tr
                      key={sec.id}
                      onClick={() => setSeccionFilter(sec.id)}
                      className="hover:bg-blue-50/40 transition-colors cursor-pointer"
                    >
                      <td className="py-2.5 px-3 font-mono font-bold text-blue-700">{sec.codigo}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-semibold text-slate-700">
                          {tur?.nombre || 'General'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-900">{mod?.nombre || sec.nombre}</td>
                      <td className="py-2.5 px-3 text-slate-600">{aul?.nombre || '-'}</td>
                      <td className="py-2.5 px-3 text-center font-bold text-sky-700">{Math.round(tec)}h</td>
                      <td className="py-2.5 px-3 text-center font-bold text-emerald-700">{Math.round(emp)}h</td>
                      <td className="py-2.5 px-3 text-center font-bold text-slate-900">{Math.round(tec + emp)}h</td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSeccionFilter(sec.id);
                          }}
                          className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded-lg text-[11px] transition-colors"
                        >
                          Ver Malla
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        /* Vista Malla Semanal (Grilla de Días) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {diasAMostrar.map((diaInfo) => {
            const bloquesDelDia = horariosDeLaSeccion
              .filter(h => h.dia_semana === diaInfo.dia)
              .sort((a, b) => (a.hora_inicio || '').localeCompare(b.hora_inicio || ''));

            const isDayHovered = isDesignMode && dragOverDay === diaInfo.dia;

            return (
              <div
                key={diaInfo.dia}
                onDragOver={(e) => {
                  if (isDesignMode) {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                    if (dragOverDay !== diaInfo.dia) setDragOverDay(diaInfo.dia);
                  }
                }}
                onDragLeave={(e) => {
                  if (isDesignMode && e.currentTarget.contains(e.relatedTarget as Node) === false) {
                    setDragOverDay(null);
                  }
                }}
                onDrop={(e) => {
                  if (isDesignMode) {
                    e.preventDefault();
                    handleDropOnDay(diaInfo.dia);
                  }
                }}
                className={`bg-white rounded-2xl border shadow-2xs overflow-hidden flex flex-col transition-all ${
                  isDayHovered
                    ? 'border-2 border-dashed border-amber-500 bg-amber-50/40 ring-4 ring-amber-200/50 scale-[1.01]'
                    : isDesignMode
                    ? 'border-dashed border-slate-300'
                    : 'border-slate-200/90'
                }`}
              >
                {/* Cabecera del Día */}
                <div
                  className={`p-2.5 border-b flex items-center justify-between transition-colors ${
                    isDayHovered ? 'bg-amber-100/70 border-amber-300' : 'bg-slate-100/70 border-slate-200/80'
                  }`}
                >
                  <span className="font-bold text-xs text-slate-800">{diaInfo.nombre}</span>
                  <span className="text-[10px] bg-slate-200/70 text-slate-600 px-1.5 py-0.5 rounded font-mono font-semibold">
                    {bloquesDelDia.length} sesiones
                  </span>
                </div>

                {/* Lista de bloques */}
                <div className="p-2 space-y-2 flex-1">
                  {bloquesDelDia.length === 0 ? (
                    <div
                      className={`py-8 text-center text-xs rounded-xl border border-dashed transition-colors ${
                        isDayHovered
                          ? 'border-amber-400 bg-amber-100/50 text-amber-800 font-bold'
                          : 'border-slate-200 text-slate-400'
                      }`}
                    >
                      {isDesignMode ? '👉 Soltar bloque aquí' : 'Sin clases programadas'}
                    </div>
                  ) : (
                    bloquesDelDia.map((bloque) => {
                      const isEmpleabilidad = bloque.tipo_unidad === 'Empleabilidad';
                      const cronoItem = cronograma.find(c => c.unidad_id === bloque.unidad_id);
                      const now = new Date();
                      const finDate = cronoItem?.fecha_fin ? new Date(cronoItem.fecha_fin + 'T23:59:59') : null;
                      const iniDate = cronoItem?.fecha_inicio ? new Date(cronoItem.fecha_inicio + 'T00:00:00') : null;
                      const isCulminada = finDate && now > finDate;
                      const isEnCurso = iniDate && finDate && now >= iniDate && now <= finDate;

                      return (
                        <div
                          key={bloque.horario_id}
                          draggable={isDesignMode}
                          onDragStart={(e) => {
                            if (isDesignMode) {
                              e.dataTransfer.setData('text/plain', bloque.horario_id);
                              setDraggedHorarioId(bloque.horario_id);
                            }
                          }}
                          onDragEnd={() => {
                            setDraggedHorarioId(null);
                            setDragOverDay(null);
                          }}
                          className={`p-2.5 rounded-xl border transition-all text-xs relative group ${
                            isDesignMode
                              ? 'cursor-grab active:cursor-grabbing hover:shadow-md hover:scale-[1.02] border-dashed ring-1 ring-amber-300'
                              : ''
                          } ${
                            isEmpleabilidad
                              ? 'bg-emerald-50/60 border-emerald-200 hover:border-emerald-300'
                              : 'bg-blue-50/60 border-blue-200 hover:border-blue-300'
                          }`}
                        >
                          {/* Top Row: Horario y Badges */}
                          <div className="flex items-center justify-between gap-1 mb-1.5">
                            <span className="font-mono font-bold text-slate-800 text-[11px] flex items-center gap-1">
                              {isDesignMode && (
                                <GripVertical className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              )}
                              <Clock className="w-3 h-3 text-slate-400" />
                              {(bloque.hora_inicio || '00:00').slice(0, 5)} - {(bloque.hora_fin || '00:00').slice(0, 5)}
                            </span>
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.2 rounded font-mono ${
                                isEmpleabilidad
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {bloque.horas_pedagogicas} hrs • {isEmpleabilidad ? 'Empleab.' : 'Técnica'}
                            </span>
                          </div>

                          {/* Unidad Didáctica */}
                          <div className="font-semibold text-slate-900 leading-tight mb-1 text-[11px] line-clamp-2">
                            {bloque.unidad_nombre || 'Unidad Didáctica'}
                          </div>

                          {bloque.unidad_codigo && (
                            <div className="text-[10px] font-mono text-slate-500 mb-1">
                              {bloque.unidad_codigo}
                            </div>
                          )}

                          {/* Rango de Fechas del Cronograma Modular */}
                          {cronoItem?.fecha_inicio && cronoItem?.fecha_fin && (
                            <div className="bg-white/80 p-1.5 rounded-lg border border-slate-200/70 my-1 text-[10px] text-slate-600 flex items-center justify-between">
                              <span className="flex items-center gap-1 font-medium">
                                <Calendar className="w-3 h-3 text-slate-400" />
                                {formatDateBR(cronoItem.fecha_inicio)} al {formatDateBR(cronoItem.fecha_fin)}
                              </span>
                              {isCulminada ? (
                                <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1 py-0.2 rounded">
                                  Culminada
                                </span>
                              ) : isEnCurso ? (
                                <span className="text-[9px] font-bold text-blue-700 bg-blue-100 px-1 py-0.2 rounded">
                                  En Curso
                                </span>
                              ) : null}
                            </div>
                          )}

                          {/* Footer Info: Docente y Aula */}
                          <div className="pt-1.5 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-600">
                            <span className="truncate max-w-[110px]" title={bloque.docente_nombre}>
                              👨‍🏫 {bloque.docente_nombre?.split(' ')[0] || 'Docente'}
                            </span>
                            <span className="font-medium text-slate-500">
                              🚪 {bloque.aula_nombre || 'Aula'}
                            </span>
                          </div>

                          {/* Botón directo a ingresar calificaciones si culminó */}
                          {isCulminada && !isDesignMode && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveView('calificaciones');
                              }}
                              className="mt-1.5 w-full py-1 px-2 bg-emerald-600/10 hover:bg-emerald-600 hover:text-white text-emerald-800 font-bold rounded text-[10px] transition-colors flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <GraduationCap className="w-3 h-3" />
                              <span>Ingresar Calificaciones</span>
                            </button>
                          )}

                          {/* Hover Action Buttons */}
                          <div className="absolute top-1.5 right-1.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur-xs p-0.5 rounded-lg shadow-xs border border-slate-200">
                            <button
                              onClick={() => handleOpenEdit(bloque)}
                              className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded cursor-pointer"
                              title="Editar bloque"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => setDeletingHorarioId(bloque.horario_id)}
                              className="p-1 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded cursor-pointer"
                              title="Eliminar bloque"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Vista Lista de la Sección */
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100/60 font-semibold text-slate-700">
                <th className="py-2.5 px-3">Día</th>
                <th className="py-2.5 px-3">Horario</th>
                <th className="py-2.5 px-3 text-center">Horas Pedagógicas</th>
                <th className="py-2.5 px-3">Tipo</th>
                <th className="py-2.5 px-3">Unidad Didáctica</th>
                <th className="py-2.5 px-3">Docente</th>
                <th className="py-2.5 px-3">Aula</th>
                <th className="py-2.5 px-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {horariosDeLaSeccion.map((h) => (
                <tr key={h.horario_id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-2.5 px-3 font-semibold text-slate-800">{h.dia_nombre}</td>
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-700">
                    {(h.hora_inicio || '00:00').slice(0, 5)} - {(h.hora_fin || '00:00').slice(0, 5)}
                  </td>
                  <td className="py-2.5 px-3 text-center font-bold text-blue-700">{h.horas_pedagogicas} hrs</td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        h.tipo_unidad === 'Empleabilidad'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}
                    >
                      {h.tipo_unidad}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="font-semibold text-slate-900">{h.unidad_nombre}</div>
                    <div className="text-[10px] font-mono text-slate-400">{h.unidad_codigo}</div>
                  </td>
                  <td className="py-2.5 px-3 text-slate-700">{h.docente_nombre || 'Docente titular'}</td>
                  <td className="py-2.5 px-3 text-slate-600">{h.aula_nombre || '-'}</td>
                  <td className="py-2.5 px-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleOpenEdit(h)}
                        className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                        title="Editar"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeletingHorarioId(h.horario_id)}
                        className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Eliminar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Crear / Editar Horario */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingHorario ? 'Editar Bloque Horario' : 'Crear Nuevo Bloque Horario'}
        >
          <form onSubmit={handleSave} className="space-y-3.5">
            {/* Sección */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Sección {editingHorario ? '(Bloqueada en edición)' : ''}
              </label>
              <select
                value={formData.seccionId}
                onChange={(e) => handleModalSeccionChange(e.target.value)}
                disabled={!!editingHorario}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-75 disabled:cursor-not-allowed"
              >
                {(isDocente && docenteSecciones.length > 0 ? docenteSecciones : (seccionesDelPeriodo.length > 0 ? seccionesDelPeriodo : secciones)).map(s => {
                  const mod = modulos.find(m => m.id === s.moduloId);
                  const tur = turnos.find(t => t.id === s.turnoId) || { nombre: s.turno };
                  return (
                    <option key={s.id} value={s.id}>
                      [{tur?.nombre || 'T'}] {s.codigo} • {mod?.nombre || s.nombre}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Día de la semana */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Día de la Semana</label>
              <select
                value={formData.diaSemana}
                onChange={(e) => setFormData({ ...formData, diaSemana: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {DIAS_SEMANA.map(d => (
                  <option key={d.dia} value={d.dia}>{d.nombre}</option>
                ))}
              </select>
            </div>

            {/* Presets Rápidos de Horario */}
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">
                Franja Horaria Predefinida (Opcional):
              </label>
              <select
                onChange={(e) => {
                  const val = e.target.value;
                  if (!val) return;
                  const [ini, fin] = val.split('|');
                  setFormData({ ...formData, horaInicio: ini, horaFin: fin });
                }}
                className="w-full px-3 py-1.5 bg-slate-100/70 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="">-- Seleccionar horario estándar --</option>
                {PRESETS_HORARIOS.map((p, idx) => (
                  <option key={idx} value={`${p.inicio}|${p.fin}`}>{p.label}</option>
                ))}
              </select>
            </div>

            {/* Hora Inicio y Fin Personalizada */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Hora Inicio</label>
                <input
                  type="time"
                  required
                  value={formData.horaInicio}
                  onChange={(e) => setFormData({ ...formData, horaInicio: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Hora Fin</label>
                <input
                  type="time"
                  required
                  value={formData.horaFin}
                  onChange={(e) => setFormData({ ...formData, horaFin: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Unidad Didáctica */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Unidad Didáctica {modalModulo ? `(${modalModulo.nombre})` : ''}
              </label>
              <select
                value={formData.unidadId}
                onChange={(e) => setFormData({ ...formData, unidadId: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Sin unidad específica / Sesión libre --</option>
                {modalUnidades.length === 0 ? (
                  <option value="" disabled>-- No hay unidades registradas en este módulo --</option>
                ) : (
                  <>
                    {modalUnidades.filter(u => u.tipo !== 'Empleabilidad' && !u.codigo?.includes('UDE')).length > 0 && (
                      <optgroup label="Unidades Específicas / Técnicas">
                        {modalUnidades.filter(u => u.tipo !== 'Empleabilidad' && !u.codigo?.includes('UDE')).map(u => (
                          <option key={u.id} value={u.id}>
                            [Técnica] {u.codigo} • {u.nombre}
                          </option>
                        ))}
                      </optgroup>
                    )}
                    {modalUnidades.filter(u => u.tipo === 'Empleabilidad' || u.codigo?.includes('UDE')).length > 0 && (
                      <optgroup label="Unidades de Empleabilidad">
                        {modalUnidades.filter(u => u.tipo === 'Empleabilidad' || u.codigo?.includes('UDE')).map(u => (
                          <option key={u.id} value={u.id}>
                            [Empleabilidad] {u.codigo} • {u.nombre}
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </>
                )}
              </select>
            </div>

            {/* Aula */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Aula</label>
              <select
                value={formData.aulaId}
                onChange={(e) => setFormData({ ...formData, aulaId: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">
                  -- Aula predeterminada ({modalSeccion?.aula || aulas.find(a => a.id === modalSeccion?.aulaId)?.nombre || 'Asignada a la sección'}) --
                </option>
                {aulas.map(a => (
                  <option key={a.id} value={a.id}>{a.codigo} - {a.nombre}</option>
                ))}
              </select>
            </div>

            {/* Docente Responsable */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Docente Responsable / Asignado
              </label>
              <select
                value={formData.docenteId}
                onChange={(e) => setFormData({ ...formData, docenteId: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Docente predeterminado de la sección --</option>
                {trabajadores.map((t) => {
                  const p = personas.find(per => per.id === t.personaId);
                  const nombreDoc = p
                    ? `${p.apellidoPaterno} ${p.apellidoMaterno || ''}, ${p.nombres}`
                    : t.codigoPlaza || t.id;
                  return (
                    <option key={t.id} value={t.id}>
                      👨‍🏫 {nombreDoc}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Botones de acción */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                <span>{editingHorario ? 'Guardar Cambios' : 'Crear Horario'}</span>
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal Confirmar Eliminación */}
      {deletingHorarioId && (
        <Modal
          isOpen={!!deletingHorarioId}
          onClose={() => setDeletingHorarioId(null)}
          title="Confirmar Eliminación"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-rose-50 text-rose-800 rounded-xl text-xs border border-rose-200/60">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
              <span>
                ¿Estás seguro de que deseas eliminar este bloque de horario? Esta acción no se puede deshacer.
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setDeletingHorarioId(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal Programar / Modificar Fechas de Unidades */}
      {isFechasModalOpen && (
        <Modal
          isOpen={isFechasModalOpen}
          onClose={() => setIsFechasModalOpen(false)}
          title={`Programar Fechas de Unidades - ${currentSeccion?.codigo}`}
        >
          <form onSubmit={handleSaveFechas} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
            <div className="p-3 bg-blue-50/70 border border-blue-200/60 rounded-xl text-xs text-blue-900">
              <p className="font-bold mb-0.5 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-blue-700" />
                <span>Programación de Fechas por Unidad Didáctica</span>
              </p>
              <p className="text-[11px] text-blue-800">
                Define las fechas de inicio y fin para cada unidad técnica y de empleabilidad. Al culminar la fecha fin, se habilitará el ingreso de calificaciones en actas.
              </p>
            </div>

            <div className="space-y-3">
              {fechasForm.map((item, idx) => {
                const isEmp = item.unidadTipo === 'Empleabilidad' || item.unidadCodigo?.includes('UDE');
                return (
                  <div
                    key={item.unidadId}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <span className="font-bold text-slate-900 block">{item.unidadNombre}</span>
                        <span className="text-[10px] font-mono text-slate-500">
                          {item.unidadCodigo} • {item.horas} hrs
                        </span>
                      </div>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded font-mono shrink-0 ${
                          isEmp ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {isEmp ? 'Empleabilidad' : 'Técnica'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/60">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Fecha Inicio
                        </label>
                        <input
                          type="date"
                          required
                          value={item.fechaInicio}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFechasForm(prev =>
                              prev.map((f, i) => (i === idx ? { ...f, fechaInicio: val } : f))
                            );
                          }}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Fecha Fin
                        </label>
                        <input
                          type="date"
                          required
                          value={item.fechaFin}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFechasForm(prev =>
                              prev.map((f, i) => (i === idx ? { ...f, fechaFin: val } : f))
                            );
                          }}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 sticky bottom-0 bg-white py-2">
              <button
                type="button"
                onClick={() => setIsFechasModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSavingFechas}
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                {isSavingFechas ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                <span>Guardar Fechas del Cronograma</span>
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
