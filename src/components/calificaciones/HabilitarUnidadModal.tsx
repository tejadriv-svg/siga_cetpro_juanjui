import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Clock,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Save,
  Users,
  Sparkles,
  RefreshCw,
  Layers
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Seccion, UnidadDidactica } from '../../types';

interface HabilitarUnidadModalProps {
  isOpen: boolean;
  onClose: () => void;
  seccion: Seccion | null;
  unidad: UnidadDidactica | null;
  initialData?: {
    fechaInicio?: string;
    fechaFin?: string;
    estado?: string;
    docenteId?: string;
    horas?: number;
    creditos?: number;
    observaciones?: string;
  };
  onSuccess?: () => void;
}

export const HabilitarUnidadModal: React.FC<HabilitarUnidadModalProps> = ({
  isOpen,
  onClose,
  seccion,
  unidad,
  initialData,
  onSuccess,
}) => {
  const { trabajadores, personas, addToast } = useApp();

  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [estado, setEstado] = useState<'PROGRAMADA' | 'EN_CURSO' | 'FINALIZADA'>('EN_CURSO');
  const [docenteId, setDocenteId] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen && seccion && unidad) {
      setFechaInicio(initialData?.fechaInicio || new Date().toISOString().substring(0, 10));
      setFechaFin(initialData?.fechaFin || new Date().toISOString().substring(0, 10));
      setEstado((initialData?.estado as any) || 'EN_CURSO');
      setDocenteId(initialData?.docenteId || seccion.trabajadorId || '');
      setObservaciones(initialData?.observaciones || '');
    }
  }, [isOpen, seccion, unidad, initialData]);

  if (!isOpen || !seccion || !unidad) return null;

  // Helper para nombre de docente
  const getDocenteNombre = (tId: string) => {
    const t = trabajadores.find((trab) => trab.id === tId);
    if (!t) return 'Sin Asignar';
    const p = (t as any).persona || personas.find((per) => per.id === t.personaId);
    if (p) {
      return `${p.apellidoPaterno || ''} ${p.apellidoMaterno || ''}, ${p.nombres || ''}`.trim();
    }
    return t.codigoPlaza || t.id;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fechaInicio || !fechaFin) {
      addToast('Atención', 'Debe ingresar la fecha de inicio y fin para la unidad didáctica.', 'warning');
      return;
    }

    if (fechaInicio > fechaFin) {
      addToast('Atención', 'La fecha de inicio no puede ser posterior a la fecha de fin.', 'warning');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch(`/api/academic/secciones/${seccion.id}/unidades/${unidad.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fechaInicio,
          fechaFin,
          estado,
          docenteId: docenteId || null,
          horas: unidad.horas,
          creditos: unidad.creditos,
          observaciones: observaciones || null,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Error al actualizar la unidad didáctica');
      }

      addToast(
        'Éxito',
        `¡Unidad ${unidad.codigo} configurada exitosamente (${estado === 'EN_CURSO' ? 'Habilitada / En Curso' : estado})!`,
        'success'
      );

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error saving seccion unidad:', err);
      addToast('Error', err.message || 'Error al guardar la configuración de la unidad', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const isUDE = unidad.tipo === 'Empleabilidad' || unidad.codigo.includes('UDE');

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 bg-slate-900 text-white flex items-start justify-between relative overflow-hidden">
          <div className="space-y-1 relative z-10">
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                isUDE ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
              }`}>
                {isUDE ? 'UDE - Empleabilidad' : 'UDT - Técnica / Específica'}
              </span>
              <span className="text-slate-400 font-mono text-xs">
                {unidad.codigo}
              </span>
            </div>
            <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-400" />
              <span>Habilitar y Programar Unidad</span>
            </h2>
            <p className="text-xs text-slate-300">
              Configure las fechas operativas y abra la unidad para el ingreso de asistencias y notas.
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

        {/* Resumen Pre-cargado */}
        <div className="bg-slate-50 border-b border-slate-200 p-4 text-xs space-y-2">
          <div className="font-bold text-slate-900 flex items-center justify-between">
            <span>{unidad.nombre}</span>
            <span className="font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              {unidad.horas} hrs • {unidad.creditos} crd
            </span>
          </div>
          <div className="text-slate-600 flex items-center justify-between">
            <span>
              <strong>Sección:</strong> {seccion.nombre} ({seccion.turno})
            </span>
            <span>
              <strong>Aula:</strong> {seccion.aula || 'Principal'}
            </span>
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSave} className="p-5 space-y-4 text-xs">
          {/* Selector de Estado */}
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1.5">
              Estado de la Unidad Didáctica
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setEstado('EN_CURSO')}
                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer font-bold ${
                  estado === 'EN_CURSO'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-400 ring-2 ring-emerald-500/20'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="text-xs">🟢 En Curso</div>
                <div className="text-[10px] font-normal text-slate-500 mt-0.5">Abierta / Activa</div>
              </button>

              <button
                type="button"
                onClick={() => setEstado('PROGRAMADA')}
                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer font-bold ${
                  estado === 'PROGRAMADA'
                    ? 'bg-blue-50 text-blue-800 border-blue-400 ring-2 ring-blue-500/20'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="text-xs">⚪ Programada</div>
                <div className="text-[10px] font-normal text-slate-500 mt-0.5">Próxima</div>
              </button>

              <button
                type="button"
                onClick={() => setEstado('FINALIZADA')}
                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer font-bold ${
                  estado === 'FINALIZADA'
                    ? 'bg-slate-100 text-slate-800 border-slate-400 ring-2 ring-slate-500/20'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="text-xs">🔵 Finalizada</div>
                <div className="text-[10px] font-normal text-slate-500 mt-0.5">Completada</div>
              </button>
            </div>
          </div>

          {/* Rango de Fechas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">
                Fecha de Inicio
              </label>
              <input
                type="date"
                required
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-mono text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">
                Fecha de Fin
              </label>
              <input
                type="date"
                required
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-mono text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden"
              />
            </div>
          </div>

          {/* Docente Responsable */}
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">
              Docente Responsable
            </label>
            <select
              value={docenteId}
              onChange={(e) => setDocenteId(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden font-medium text-slate-800"
            >
              <option value="">-- Docente Asignado a la Sección --</option>
              {trabajadores.map((t) => (
                <option key={t.id} value={t.id}>
                  {getDocenteNombre(t.id)}
                </option>
              ))}
            </select>
          </div>

          {/* Observaciones opcionales */}
          <div>
            <label className="block font-medium text-slate-600 text-[11px] mb-1">
              Notas u Observaciones (Opcional)
            </label>
            <input
              type="text"
              placeholder="Ej. Dictado intensivo en laboratorio / Turno rotativo..."
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden"
            />
          </div>

          {/* Botones de Acción */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-semibold cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Guardar y Habilitar Unidad</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
