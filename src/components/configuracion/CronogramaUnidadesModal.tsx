import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Clock,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Save,
  Sparkles,
  Users,
  RefreshCw,
  Info,
  CalendarRange
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Seccion } from '../../types';

interface CronogramaUnidadesModalProps {
  isOpen: boolean;
  onClose: () => void;
  seccion: Seccion | null;
}

interface UnidadItem {
  unidad_id: string;
  modulo_id: string;
  unidad_codigo: string;
  unidad_nombre: string;
  unidad_horas: number;
  unidad_creditos: number;
  unidad_orden: number;
  unidad_tipo: string;
  seccion_unidad_id?: string;
  seccion_id?: string;
  docente_id?: string | null;
  fecha_inicio: string;
  fecha_fin: string;
  horas: number;
  creditos: number;
  estado: 'PROGRAMADA' | 'EN_CURSO' | 'FINALIZADA';
  observaciones?: string | null;
  docente_nombre?: string | null;
}

export const CronogramaUnidadesModal: React.FC<CronogramaUnidadesModalProps> = ({
  isOpen,
  onClose,
  seccion,
}) => {
  const { trabajadores, personas, addToast } = useApp();

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [periodoInfo, setPeriodoInfo] = useState<{
    fechaInicio?: string;
    fechaFin?: string;
    moduloNombre?: string;
  }>({});
  const [unidades, setUnidades] = useState<UnidadItem[]>([]);

  // Cargar datos de la API cuando el modal se abre
  useEffect(() => {
    if (!isOpen || !seccion?.id) return;

    const fetchCronograma = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/academic/secciones/${seccion.id}/unidades`);
        if (!res.ok) {
          throw new Error('Error al consultar el cronograma de unidades');
        }
        const data = await res.json();
        
        setPeriodoInfo({
          fechaInicio: data.seccion?.periodo_fecha_inicio,
          fechaFin: data.seccion?.periodo_fecha_fin,
          moduloNombre: data.seccion?.modulo_nombre,
        });

        // Formatear fechas a YYYY-MM-DD
        const formattedUnidades = (data.unidades || []).map((u: any) => ({
          ...u,
          fecha_inicio: u.fecha_inicio ? u.fecha_inicio.substring(0, 10) : '',
          fecha_fin: u.fecha_fin ? u.fecha_fin.substring(0, 10) : '',
          docente_id: u.docente_id || seccion.trabajadorId || '',
        }));

        setUnidades(formattedUnidades);
      } catch (err: any) {
        console.error('Error fetching cronograma:', err);
        addToast('Error', err.message || 'No se pudo cargar el cronograma de la sección', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCronograma();
  }, [isOpen, seccion?.id, seccion?.trabajadorId, addToast]);

  if (!isOpen || !seccion) return null;

  // Helper para nombre de trabajador/docente
  const getDocenteNombre = (tId: string) => {
    const t = trabajadores.find((trab) => trab.id === tId);
    if (!t) return 'Sin Asignar';
    const p = (t as any).persona || personas.find((per) => per.id === t.personaId);
    if (p) {
      return `${p.apellidoPaterno || ''} ${p.apellidoMaterno || ''}, ${p.nombres || ''}`.trim();
    }
    return t.codigoPlaza || t.id;
  };

  const handleFieldChange = (
    index: number,
    field: keyof UnidadItem,
    value: any
  ) => {
    setUnidades((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  // Función de distribución automática secuencial proporcional
  const handleAutoDistribuir = () => {
    if (unidades.length === 0) return;

    const baseInicio = periodoInfo.fechaInicio || seccion.periodoAcademico;
    const baseFin = periodoInfo.fechaFin;

    if (!baseInicio || !baseFin) {
      addToast(
        'Atención',
        'El período de clases no tiene definidas fechas de inicio y fin para calcular la distribución.',
        'warning'
      );
      return;
    }

    const start = new Date(baseInicio + 'T00:00:00');
    const end = new Date(baseFin + 'T00:00:00');

    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
      addToast('Atención', 'Rango de fechas de período inválido.', 'warning');
      return;
    }

    const totalDias = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    const totalHoras = unidades.reduce((acc, u) => acc + (Number(u.horas) || Number(u.unidad_horas) || 1), 0);

    let currentDate = new Date(start);

    const updated = unidades.map((u, idx) => {
      const uHoras = Number(u.horas) || Number(u.unidad_horas) || 1;
      const diasProporcion = Math.max(1, Math.round((uHoras / (totalHoras || 1)) * totalDias));

      const uInicioStr = currentDate.toISOString().substring(0, 10);

      // Calcular fecha fin
      let uFinDate = new Date(currentDate);
      uFinDate.setDate(uFinDate.getDate() + diasProporcion - 1);
      if (idx === unidades.length - 1 || uFinDate > end) {
        uFinDate = new Date(end);
      }
      const uFinStr = uFinDate.toISOString().substring(0, 10);

      // Avanzar fecha de inicio para la siguiente unidad
      currentDate = new Date(uFinDate);
      currentDate.setDate(currentDate.getDate() + 1);

      return {
        ...u,
        fecha_inicio: uInicioStr,
        fecha_fin: uFinStr,
      };
    });

    setUnidades(updated);
    addToast(
      'Información',
      'Fechas distribuidas secuencialmente según la carga horaria de cada unidad.',
      'info'
    );
  };

  const handleGuardar = async () => {
    // Validar que todas tengan fechas asignadas
    for (const u of unidades) {
      if (!u.fecha_inicio || !u.fecha_fin) {
        addToast(
          'Atención',
          `La unidad "${u.unidad_codigo} - ${u.unidad_nombre}" requiere fecha de inicio y fin.`,
          'warning'
        );
        return;
      }
      if (u.fecha_inicio > u.fecha_fin) {
        addToast(
          'Atención',
          `La fecha de inicio de "${u.unidad_codigo}" no puede ser posterior a su fecha de fin.`,
          'warning'
        );
        return;
      }
    }

    setIsSaving(true);
    try {
      const payload = {
        items: unidades.map((u) => ({
          unidadId: u.unidad_id,
          docenteId: u.docente_id || null,
          fechaInicio: u.fecha_inicio,
          fechaFin: u.fecha_fin,
          horas: u.horas || u.unidad_horas,
          creditos: u.creditos || u.unidad_creditos,
          estado: u.estado || 'PROGRAMADA',
          observaciones: u.observaciones || null,
        })),
      };

      const res = await fetch(`/api/academic/secciones/${seccion.id}/unidades`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Error al guardar el cronograma');
      }

      addToast(
        'Éxito',
        '¡Cronograma de unidades didácticas guardado exitosamente en la base de datos!',
        'success'
      );
      onClose();
    } catch (err: any) {
      console.error('Error saving cronograma:', err);
      addToast('Error', err.message || 'Error al guardar el cronograma', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const totalHoras = unidades.reduce((acc, u) => acc + (Number(u.horas) || Number(u.unidad_horas) || 0), 0);
  const totalCreditos = unidades.reduce((acc, u) => acc + (Number(u.creditos) || Number(u.unidad_creditos) || 0), 0);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-5xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-slate-900 text-white flex items-start justify-between relative overflow-hidden shrink-0">
          <div className="absolute right-0 top-0 w-80 h-full bg-linear-to-l from-emerald-500/10 to-transparent pointer-events-none" />
          <div className="space-y-1 relative z-10">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Sección: {seccion.nombre}
              </span>
              <span className="text-slate-400 font-mono text-xs">
                ({seccion.codigo || 'S/C'})
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
              <CalendarRange className="w-5 h-5 text-emerald-400" />
              <span>Cronograma y Programación por Unidades Didácticas</span>
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl">
              Defina las fechas operativas exactas de inicio y término para cada UDT (Técnica) y UDE (Empleabilidad), asegurando la correlatividad pedagógica y distribución de horas.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer relative z-10"
            title="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Resumen de sección y período */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <div>
              <span className="text-slate-400 font-medium">Módulo Formativo:</span>
              <span className="ml-1.5 font-bold text-slate-800">
                {periodoInfo.moduloNombre || 'Módulo Asignado'}
              </span>
            </div>
            {periodoInfo.fechaInicio && (
              <div className="flex items-center gap-1.5 text-slate-600">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                <span>Rango Oficial del Período:</span>
                <span className="font-mono font-bold text-slate-800">
                  {periodoInfo.fechaInicio} al {periodoInfo.fechaFin || '---'}
                </span>
              </div>
            )}
            <div className="flex items-center gap-3 font-mono">
              <span className="bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-700">
                Total: <strong>{totalHoras}</strong> hrs
              </span>
              <span className="bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-700">
                Créditos: <strong>{totalCreditos}</strong> crd
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleAutoDistribuir}
            disabled={isLoading || unidades.length === 0}
            className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 text-xs shadow-xs"
            title="Distribuir las fechas secuencialmente dentro del rango del período según las horas"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>⚡ Auto-Distribuir Fechas</span>
          </button>
        </div>

        {/* Contenido / Tabla Editable */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {isLoading ? (
            <div className="p-12 text-center text-slate-500 space-y-3">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-600" />
              <p className="text-sm font-medium">Cargando unidades del módulo y programación operativa...</p>
            </div>
          ) : unidades.length === 0 ? (
            <div className="p-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-500 space-y-2">
              <AlertCircle className="w-8 h-8 mx-auto text-amber-500" />
              <p className="text-sm font-semibold text-slate-700">No se encontraron unidades didácticas asociadas a este módulo.</p>
              <p className="text-xs text-slate-500">Asegúrese de haber cargado el plan de estudios con sus unidades didácticas.</p>
            </div>
          ) : (
            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="px-3.5 py-3 w-12 text-center">N°</th>
                    <th className="px-3.5 py-3 w-28">Código</th>
                    <th className="px-3.5 py-3">Unidad Didáctica</th>
                    <th className="px-3.5 py-3 w-24 text-center">Horas / Crd</th>
                    <th className="px-3.5 py-3 w-40">Fecha Inicio</th>
                    <th className="px-3.5 py-3 w-40">Fecha Fin</th>
                    <th className="px-3.5 py-3 w-52">Docente Responsable</th>
                    <th className="px-3.5 py-3 w-32">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {unidades.map((u, idx) => {
                    const isUDE = u.unidad_tipo.toLowerCase().includes('empleabilidad') || u.unidad_codigo.includes('UDE');

                    return (
                      <tr key={u.unidad_id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-3.5 py-3 text-center font-mono font-bold text-slate-500">
                          {idx + 1}
                        </td>
                        <td className="px-3.5 py-3">
                          <span
                            className={`px-2 py-0.5 rounded-md font-mono font-bold text-[11px] ${
                              isUDE
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : 'bg-blue-100 text-blue-800 border border-blue-200'
                            }`}
                          >
                            {u.unidad_codigo}
                          </span>
                        </td>
                        <td className="px-3.5 py-3 font-semibold text-slate-900">
                          <div>{u.unidad_nombre}</div>
                          <div className="text-[10px] text-slate-400 font-normal">
                            {isUDE ? 'Competencia de Empleabilidad' : 'Competencia Específica / Técnica'}
                          </div>
                        </td>
                        <td className="px-3.5 py-3 text-center font-mono">
                          <span className="font-bold text-slate-800">{u.horas || u.unidad_horas}h</span>
                          <span className="text-slate-400 ml-1">/ {u.creditos || u.unidad_creditos}c</span>
                        </td>
                        <td className="px-3.5 py-3">
                          <input
                            type="date"
                            value={u.fecha_inicio}
                            onChange={(e) => handleFieldChange(idx, 'fecha_inicio', e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-mono text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden"
                            required
                          />
                        </td>
                        <td className="px-3.5 py-3">
                          <input
                            type="date"
                            value={u.fecha_fin}
                            onChange={(e) => handleFieldChange(idx, 'fecha_fin', e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-mono text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden"
                            required
                          />
                        </td>
                        <td className="px-3.5 py-3">
                          <select
                            value={u.docente_id || ''}
                            onChange={(e) => handleFieldChange(idx, 'docente_id', e.target.value || null)}
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-hidden"
                          >
                            <option value="">-- Docente Titular de Sección --</option>
                            {trabajadores.map((t) => (
                              <option key={t.id} value={t.id}>
                                {getDocenteNombre(t.id)}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3.5 py-3">
                          <select
                            value={u.estado}
                            onChange={(e) => handleFieldChange(idx, 'estado', e.target.value as any)}
                            className={`w-full px-2 py-1.5 rounded-lg text-xs font-bold border outline-hidden ${
                              u.estado === 'FINALIZADA'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : u.estado === 'EN_CURSO'
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : 'bg-slate-50 text-slate-700 border-slate-200'
                            }`}
                          >
                            <option value="PROGRAMADA">PROGRAMADA</option>
                            <option value="EN_CURSO">EN CURSO</option>
                            <option value="FINALIZADA">FINALIZADA</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex items-start gap-2 bg-blue-50/60 p-3 rounded-xl border border-blue-100 text-blue-700 text-[11px]">
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-500" />
            <p>
              <strong>Nota sobre la programación pedagógica:</strong> Las fechas configuradas en esta ventana se guardan en la tabla relacional <code className="font-mono bg-blue-100/80 px-1 py-0.5 rounded text-blue-900">secciones_unidades</code> de PostgreSQL local, preservando la definición del plan de estudios intacta y permitiendo que distintas secciones o turnos tengan su propio cronograma independiente.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleGuardar}
            disabled={isSaving || isLoading || unidades.length === 0}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Guardando Cronograma...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Guardar Cronograma de Unidades</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
