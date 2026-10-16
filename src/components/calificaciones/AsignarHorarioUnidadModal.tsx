import React, { useState, useEffect } from 'react';
import {
  X,
  Clock,
  Calendar,
  Plus,
  Trash2,
  RefreshCw,
  Building,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Seccion, UnidadDidactica, HorarioDetalle } from '../../types';

interface AsignarHorarioUnidadModalProps {
  isOpen: boolean;
  onClose: () => void;
  seccion: Seccion | null;
  unidad: UnidadDidactica | null;
  onSuccess?: () => void;
}

const DIAS_SEMANA = [
  { dia: 1, nombre: 'Lunes' },
  { dia: 2, nombre: 'Martes' },
  { dia: 3, nombre: 'Miércoles' },
  { dia: 4, nombre: 'Jueves' },
  { dia: 5, nombre: 'Viernes' },
  { dia: 6, nombre: 'Sábado' },
  { dia: 7, nombre: 'Domingo' },
];

const PRESETS = [
  { label: 'Mañana B1 (07:30 - 09:45)', inicio: '07:30', fin: '09:45' },
  { label: 'Mañana B2 (10:05 - 12:20)', inicio: '10:05', fin: '12:20' },
  { label: 'Tarde B1 (14:30 - 16:45)', inicio: '14:30', fin: '16:45' },
  { label: 'Tarde B2 (17:05 - 19:20)', inicio: '17:05', fin: '19:20' },
  { label: 'Noche (19:00 - 22:00)', inicio: '19:00', fin: '22:00' },
];

export const AsignarHorarioUnidadModal: React.FC<AsignarHorarioUnidadModalProps> = ({
  isOpen,
  onClose,
  seccion,
  unidad,
  onSuccess,
}) => {
  const { aulas, addToast } = useApp();

  const [horarios, setHorarios] = useState<HorarioDetalle[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Formulario nuevo bloque
  const [diaSemana, setDiaSemana] = useState<number>(1);
  const [horaInicio, setHoraInicio] = useState<string>('07:30');
  const [horaFin, setHoraFin] = useState<string>('09:45');
  const [aulaId, setAulaId] = useState<string>('');

  const fetchHorariosUnidad = async () => {
    if (!seccion?.id) return;
    setLoading(true);
    try {
      let url = `/api/academic/horarios?seccionId=${seccion.id}`;
      if (unidad?.id) {
        url += `&unidadId=${unidad.id}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setHorarios(data);
      }
    } catch (err) {
      console.error('Error fetching horarios:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && seccion) {
      setAulaId(seccion.aulaId || '');
      fetchHorariosUnidad();
    }
  }, [isOpen, seccion?.id, unidad?.id]);

  if (!isOpen || !seccion || !unidad) return null;

  const handleAddHorario = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!horaInicio || !horaFin) {
      addToast('Atención', 'Indique hora de inicio y fin del bloque.', 'warning');
      return;
    }

    if (horaInicio >= horaFin) {
      addToast('Atención', 'La hora de inicio debe ser anterior a la hora de fin.', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/academic/horarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seccionId: seccion.id,
          unidadId: unidad.id,
          aulaId: aulaId || null,
          diaSemana,
          horaInicio,
          horaFin,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Error al agregar bloque horario');
      }

      addToast('Éxito', 'Bloque horario registrado exitosamente.', 'success');

      fetchHorariosUnidad();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error('Error creating horario:', err);
      addToast('Error', err.message || 'Error al crear horario', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteHorario = async (horarioId: string) => {
    if (!confirm('¿Eliminar este bloque horario de la unidad didáctica?')) return;

    try {
      const res = await fetch(`/api/academic/horarios/${horarioId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        addToast('Información', 'Bloque horario eliminado.', 'info');
        fetchHorariosUnidad();
        if (onSuccess) onSuccess();
      }
    } catch (err) {
      console.error('Error deleting horario:', err);
      addToast('Error', 'No se pudo eliminar el horario.', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 bg-slate-900 text-white flex items-start justify-between relative overflow-hidden">
          <div className="space-y-1 relative z-10">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30">
                Horario Semanal
              </span>
              <span className="text-slate-400 font-mono text-xs">
                {unidad.codigo}
              </span>
            </div>
            <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-400" />
              <span>Horarios de la Unidad Didáctica</span>
            </h2>
            <p className="text-xs text-slate-300">
              {unidad.nombre} • Sección: {seccion.nombre} ({seccion.turno})
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-5 flex-1 text-xs">
          {/* Bloques Existentes */}
          <div className="space-y-2">
            <h3 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center justify-between">
              <span>Bloques Horarios Asignados</span>
              <span className="text-slate-400 font-normal">({horarios.length} bloque{horarios.length === 1 ? '' : 's'})</span>
            </h3>

            {loading ? (
              <div className="p-6 text-center text-slate-400">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto text-blue-600 mb-1" />
                <span>Cargando horarios...</span>
              </div>
            ) : horarios.length === 0 ? (
              <div className="p-5 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-slate-500">
                <AlertCircle className="w-5 h-5 mx-auto text-amber-500 mb-1" />
                <p className="font-semibold">Esta unidad aún no tiene bloques de horario específicos.</p>
                <p className="text-[11px] text-slate-400">Utilice el formulario inferior para agregar días y horas de dictado.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {horarios.map((h) => (
                  <div
                    key={h.horario_id}
                    className="p-3 bg-blue-50/50 border border-blue-200 rounded-2xl flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-blue-950 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-blue-600" />
                        <span>{h.dia_nombre}</span>
                      </div>
                      <div className="font-mono text-slate-700 mt-0.5">
                        {h.hora_inicio?.substring(0, 5)} - {h.hora_fin?.substring(0, 5)}
                      </div>
                      {h.aula_nombre && (
                        <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
                          <Building className="w-3 h-3 text-slate-400" />
                          <span>{h.aula_nombre}</span>
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteHorario(h.horario_id)}
                      className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Eliminar bloque"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Formulario Agregar Bloque */}
          <form onSubmit={handleAddHorario} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
            <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-emerald-600" />
              <span>Agregar Nuevo Bloque Horario</span>
            </div>

            {/* Presets Rápidos */}
            <div>
              <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Presets de Horas Frecuentes
              </label>
              <div className="flex flex-wrap gap-1.5">
                {PRESETS.map((pr) => (
                  <button
                    key={pr.label}
                    type="button"
                    onClick={() => {
                      setHoraInicio(pr.inicio);
                      setHoraFin(pr.fin);
                    }}
                    className={`px-2 py-1 rounded-lg text-[10px] font-mono transition-colors cursor-pointer border ${
                      horaInicio === pr.inicio && horaFin === pr.fin
                        ? 'bg-blue-600 text-white border-blue-600 font-bold'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {pr.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Día de la Semana</label>
                <select
                  value={diaSemana}
                  onChange={(e) => setDiaSemana(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium"
                >
                  {DIAS_SEMANA.map((d) => (
                    <option key={d.dia} value={d.dia}>
                      {d.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Hora Inicio</label>
                <input
                  type="time"
                  required
                  value={horaInicio}
                  onChange={(e) => setHoraInicio(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl font-mono text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Hora Fin</label>
                <input
                  type="time"
                  required
                  value={horaFin}
                  onChange={(e) => setHoraFin(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl font-mono text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Aula / Ambiente de Clase</label>
              <select
                value={aulaId}
                onChange={(e) => setAulaId(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs"
              >
                <option value="">-- Aula Predeterminada de la Sección --</option>
                {aulas.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nombre} ({a.tipo || 'Aula'})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    <span>Guardar Bloque Horario</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white hover:bg-slate-800 rounded-xl font-semibold cursor-pointer text-xs"
          >
            Cerrar Ventana
          </button>
        </div>
      </div>
    </div>
  );
};
