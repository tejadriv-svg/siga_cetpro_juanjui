import React, { useState, useMemo } from 'react';
import { Modal } from '../common/Modal';
import { useApp } from '../../context/AppContext';
import { Matricula, TipoTraslado } from '../../types';
import { ArrowRightLeft, Building2, Layers, AlertCircle, FileCheck, Users, HelpCircle } from 'lucide-react';

interface RegistrarTrasladoModalProps {
  isOpen: boolean;
  onClose: () => void;
  matricula: Matricula;
  estudianteNombre?: string;
  estudianteDni?: string;
  moduloNombre?: string;
  seccionNombre?: string;
  onSuccess?: () => void;
}

export const RegistrarTrasladoModal: React.FC<RegistrarTrasladoModalProps> = ({
  isOpen,
  onClose,
  matricula,
  estudianteNombre,
  estudianteDni,
  moduloNombre,
  seccionNombre,
  onSuccess,
}) => {
  const {
    secciones,
    programas,
    modulos,
    sedes,
    registrarTraslado,
  } = useApp();

  const [tipoTraslado, setTipoTraslado] = useState<TipoTraslado>('INTERNO_SECCION');
  const [seccionDestinoId, setSeccionDestinoId] = useState('');
  const [programaDestinoId, setProgramaDestinoId] = useState(matricula.programaId || '');
  const [moduloDestinoId, setModuloDestinoId] = useState(matricula.moduloId || '');
  const [institucionDestino, setInstitucionDestino] = useState('');
  const [motivo, setMotivo] = useState('');
  const [resolucionDirectoral, setResolucionDirectoral] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modulos para el programa destino
  const modulosDisponibles = useMemo(() => {
    if (!programaDestinoId) return [];
    return modulos.filter((m) => m.programaId === programaDestinoId);
  }, [modulos, programaDestinoId]);

  // Secciones disponibles para el módulo destino
  const seccionesDisponibles = useMemo(() => {
    const targetMod = tipoTraslado === 'INTERNO_SECCION' ? matricula.moduloId : moduloDestinoId;
    if (!targetMod) return [];
    return secciones.filter((s) => {
      // Excluir la sección actual si estamos en el mismo módulo
      if (s.id === matricula.seccionId && targetMod === matricula.moduloId) return false;
      return s.moduloId === targetMod;
    });
  }, [secciones, matricula.moduloId, matricula.seccionId, moduloDestinoId, tipoTraslado]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (tipoTraslado === 'INTERNO_SECCION' && !seccionDestinoId) {
      setError('Seleccione la sección o turno de destino.');
      return;
    }

    if (tipoTraslado === 'INTERNO_PROGRAMA' && (!programaDestinoId || !moduloDestinoId)) {
      setError('Seleccione el programa y módulo de destino.');
      return;
    }

    if (tipoTraslado === 'EXTERNO_SALIDA' && !institucionDestino.trim()) {
      setError('Especifique el nombre de la institución receptora.');
      return;
    }

    setIsSubmitting(true);

    const ok = await registrarTraslado({
      matriculaOrigenId: matricula.id,
      tipoTraslado,
      seccionDestinoId: tipoTraslado !== 'EXTERNO_SALIDA' ? seccionDestinoId || undefined : undefined,
      moduloDestinoId: tipoTraslado === 'INTERNO_PROGRAMA' ? moduloDestinoId : matricula.moduloId,
      programaDestinoId: tipoTraslado === 'INTERNO_PROGRAMA' ? programaDestinoId : matricula.programaId,
      institucionDestino: tipoTraslado === 'EXTERNO_SALIDA' ? institucionDestino.trim() : undefined,
      motivo: motivo.trim() || undefined,
      resolucionDirectoral: resolucionDirectoral.trim() || undefined,
      observaciones: observaciones.trim() || undefined,
    });

    setIsSubmitting(false);

    if (ok) {
      if (onSuccess) onSuccess();
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Registrar Traslado de Matrícula"
      subtitle="Movilidad académica interna o cambio de institución"
      maxWidth="lg"
      actions={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>{isSubmitting ? 'Procesando...' : 'Confirmar Traslado'}</span>
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs text-slate-700">
        {/* Resumen Origen */}
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 grid grid-cols-2 gap-2 text-[11px]">
          <div>
            <span className="text-slate-400 block uppercase text-[10px] font-bold">Estudiante</span>
            <span className="font-semibold text-slate-900">{estudianteNombre || '---'}</span>
            {estudianteDni && <span className="text-slate-500 font-mono block">DNI: {estudianteDni}</span>}
          </div>
          <div>
            <span className="text-slate-400 block uppercase text-[10px] font-bold">Matrícula Origen</span>
            <span className="font-semibold text-slate-900">{matricula.codigoMatricula}</span>
            <span className="text-slate-500 block truncate">{moduloNombre} - {seccionNombre}</span>
          </div>
        </div>

        {error && (
          <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs font-medium">
            {error}
          </div>
        )}

        {/* Tipo de Traslado */}
        <div>
          <label className="block font-bold text-slate-800 mb-1">Tipo de Traslado</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => {
                setTipoTraslado('INTERNO_SECCION');
                setSeccionDestinoId('');
              }}
              className={`p-2.5 rounded-xl border text-left transition-all ${
                tipoTraslado === 'INTERNO_SECCION'
                  ? 'border-sky-500 bg-sky-50 text-sky-900 font-bold ring-1 ring-sky-500'
                  : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
              }`}
            >
              <span className="block text-xs">Cambio de Sección</span>
              <span className="text-[10px] text-slate-500 font-normal">Mismo módulo y turno</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setTipoTraslado('INTERNO_PROGRAMA');
                setSeccionDestinoId('');
              }}
              className={`p-2.5 rounded-xl border text-left transition-all ${
                tipoTraslado === 'INTERNO_PROGRAMA'
                  ? 'border-sky-500 bg-sky-50 text-sky-900 font-bold ring-1 ring-sky-500'
                  : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
              }`}
            >
              <span className="block text-xs">Cambio Programa</span>
              <span className="text-[10px] text-slate-500 font-normal">Dentro de Juanjuí</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setTipoTraslado('EXTERNO_SALIDA');
              }}
              className={`p-2.5 rounded-xl border text-left transition-all ${
                tipoTraslado === 'EXTERNO_SALIDA'
                  ? 'border-amber-500 bg-amber-50 text-amber-900 font-bold ring-1 ring-amber-500'
                  : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
              }`}
            >
              <span className="block text-xs">Traslado Externo</span>
              <span className="text-[10px] text-slate-500 font-normal">Hacia otro CETPRO</span>
            </button>
          </div>
        </div>

        {/* Destino según el tipo */}
        {tipoTraslado === 'INTERNO_SECCION' && (
          <div className="space-y-2 bg-sky-50/50 p-3 rounded-xl border border-sky-100">
            <label className="block font-bold text-sky-950 text-xs">
              Sección / Turno Destino <span className="text-rose-500">*</span>
            </label>
            {seccionesDisponibles.length === 0 ? (
              <p className="text-slate-500 italic text-[11px]">
                No hay otras secciones registradas para este mismo módulo.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {seccionesDisponibles.map((sec) => {
                  const vacantes = Math.max(0, (sec.capacidad || 20) - (sec.matriculados || 0));
                  const isSelected = seccionDestinoId === sec.id;
                  return (
                    <div
                      key={sec.id}
                      onClick={() => setSeccionDestinoId(sec.id)}
                      className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-sky-500 bg-white shadow-xs ring-1 ring-sky-500 text-sky-950 font-semibold'
                          : 'border-slate-200 bg-white hover:border-sky-300 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs">{sec.nombre}</span>
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                          {sec.turno}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1 flex items-center justify-between">
                        <span>Aula: {sec.aula || 'Taller'}</span>
                        <span className={vacantes > 0 ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>
                          {vacantes} vacantes libres
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {tipoTraslado === 'INTERNO_PROGRAMA' && (
          <div className="space-y-3 bg-sky-50/50 p-3 rounded-xl border border-sky-100">
            <div>
              <label className="block font-bold text-sky-950 mb-1">Programa de Destino</label>
              <select
                value={programaDestinoId}
                onChange={(e) => {
                  setProgramaDestinoId(e.target.value);
                  const firstMod = modulos.find((m) => m.programaId === e.target.value);
                  setModuloDestinoId(firstMod?.id || '');
                  setSeccionDestinoId('');
                }}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none text-xs"
              >
                {programas.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre} ({p.nivelFormativo})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-sky-950 mb-1">Módulo Formativo</label>
              <select
                value={moduloDestinoId}
                onChange={(e) => {
                  setModuloDestinoId(e.target.value);
                  setSeccionDestinoId('');
                }}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none text-xs"
              >
                {modulosDisponibles.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nombre} (Ciclo {m.cicloFormativo || 'I'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-sky-950 mb-1">Sección Destino</label>
              <select
                value={seccionDestinoId}
                onChange={(e) => setSeccionDestinoId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none text-xs"
              >
                <option value="">-- Seleccionar Sección --</option>
                {seccionesDisponibles.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nombre} - Turno {s.turno} (Matriculados: {s.matriculados || 0})
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {tipoTraslado === 'EXTERNO_SALIDA' && (
          <div className="space-y-2 bg-amber-50/70 p-3 rounded-xl border border-amber-200">
            <label className="block font-bold text-amber-950 text-xs">
              Institución Educativa Receptora (Destino) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Ej. CETPRO Tarapoto, IESTP Mariscal Cáceres..."
              value={institucionDestino}
              onChange={(e) => setInstitucionDestino(e.target.value)}
              required
              className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl focus:outline-none text-xs"
            />
            <p className="text-[10px] text-amber-800">
              La matrícula actual pasará a estado TRASLADADO y el estudiante cambiará su condición general a &quot;Trasladado&quot;.
            </p>
          </div>
        )}

        {/* Motivo y Resolución */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-bold text-slate-800 mb-1">
              Resolución Directoral (RD) / FUT Sustento
            </label>
            <input
              type="text"
              placeholder="Ej. R.D. N° 085-2026-CETPRO-J"
              value={resolucionDirectoral}
              onChange={(e) => setResolucionDirectoral(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none text-xs"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-800 mb-1">Motivo del Traslado</label>
            <input
              type="text"
              placeholder="Ej. Cruce laboral, cambio de turno, mudanza..."
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none text-xs"
            />
          </div>
        </div>

        <div>
          <label className="block text-slate-500 font-medium mb-1">Observaciones</label>
          <input
            type="text"
            placeholder="Anotaciones para el acta y secretaría..."
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none text-xs"
          />
        </div>
      </form>
    </Modal>
  );
};
