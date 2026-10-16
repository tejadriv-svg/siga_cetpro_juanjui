import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useApp } from '../../context/AppContext';
import { Matricula, TipoRetiro } from '../../types';
import { AlertTriangle, UserMinus, Calendar, FileText, CheckCircle2, BookmarkCheck } from 'lucide-react';

interface RegistrarRetiroModalProps {
  isOpen: boolean;
  onClose: () => void;
  matricula: Matricula;
  estudianteNombre?: string;
  estudianteDni?: string;
  moduloNombre?: string;
  seccionNombre?: string;
  onSuccess?: () => void;
}

export const RegistrarRetiroModal: React.FC<RegistrarRetiroModalProps> = ({
  isOpen,
  onClose,
  matricula,
  estudianteNombre,
  estudianteDni,
  moduloNombre,
  seccionNombre,
  onSuccess,
}) => {
  const { registrarRetiro } = useApp();

  const [tipoRetiro, setTipoRetiro] = useState<TipoRetiro>('VOLUNTARIO');
  const [fechaRetiro, setFechaRetiro] = useState(new Date().toISOString().split('T')[0]);
  const [motivo, setMotivo] = useState('');
  const [numeroDocumentoSustento, setNumeroDocumentoSustento] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!motivo.trim()) {
      setError('Por favor detalle el motivo del retiro.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const ok = await registrarRetiro({
      matriculaId: matricula.id,
      tipoRetiro,
      fechaRetiro,
      motivo: motivo.trim(),
      numeroDocumentoSustento: numeroDocumentoSustento.trim() || undefined,
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
      title="Formalizar Retiro de Matrícula"
      subtitle="Registro oficial de desvinculación o suspensión académica"
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
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
          >
            <UserMinus className="w-4 h-4" />
            <span>{isSubmitting ? 'Procesando...' : 'Confirmar Retiro Formal'}</span>
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs text-slate-700">
        {/* Banner Informativo */}
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-amber-900">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-xs">Efectos académicos normativos (MINEDU):</p>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              Esta acción no borra la historia académica del alumno; actualizará la matrícula <strong>{matricula.codigoMatricula}</strong> a estado <strong>{tipoRetiro === 'RESERVA' ? 'RESERVA' : 'RETIRADO'}</strong>, liberará 1 vacante en la sección y registrará el sustento para posibles auditorías o futuros reingresos.
            </p>
          </div>
        </div>

        {/* Resumen de la Matrícula */}
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 grid grid-cols-2 gap-2 text-[11px]">
          <div>
            <span className="text-slate-400 block uppercase text-[10px] font-bold">Estudiante</span>
            <span className="font-semibold text-slate-900">{estudianteNombre || '---'}</span>
            {estudianteDni && <span className="text-slate-500 font-mono block">DNI: {estudianteDni}</span>}
          </div>
          <div>
            <span className="text-slate-400 block uppercase text-[10px] font-bold">Matrícula / Sección</span>
            <span className="font-semibold text-slate-900">{matricula.codigoMatricula}</span>
            <span className="text-slate-500 block truncate">{moduloNombre || 'Módulo'} - {seccionNombre || 'Sección'}</span>
          </div>
        </div>

        {error && (
          <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs font-medium">
            {error}
          </div>
        )}

        {/* Campos del Formulario */}
        <div className="space-y-3">
          <div>
            <label className="block font-bold text-slate-800 mb-1">Tipo de Retiro</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setTipoRetiro('VOLUNTARIO')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  tipoRetiro === 'VOLUNTARIO'
                    ? 'border-rose-500 bg-rose-50 text-rose-900 font-bold ring-1 ring-rose-500'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <span className="block text-xs">Voluntario</span>
                <span className="text-[10px] text-slate-500 font-normal">A solicitud por FUT</span>
              </button>

              <button
                type="button"
                onClick={() => setTipoRetiro('POR_INASISTENCIAS')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  tipoRetiro === 'POR_INASISTENCIAS'
                    ? 'border-rose-500 bg-rose-50 text-rose-900 font-bold ring-1 ring-rose-500'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <span className="block text-xs">Por Inasistencias</span>
                <span className="text-[10px] text-slate-500 font-normal">De oficio (&gt; 30%)</span>
              </button>

              <button
                type="button"
                onClick={() => setTipoRetiro('RESERVA')}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  tipoRetiro === 'RESERVA'
                    ? 'border-purple-500 bg-purple-50 text-purple-900 font-bold ring-1 ring-purple-500'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <span className="block text-xs">Reserva Matrícula</span>
                <span className="text-[10px] text-slate-500 font-normal">Hasta 1 año lectivo</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                Fecha de Efecto del Retiro
              </label>
              <input
                type="date"
                value={fechaRetiro}
                onChange={(e) => setFechaRetiro(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none text-xs"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                N° Documento / FUT / Resolución
              </label>
              <input
                type="text"
                placeholder="Ej. FUT N° 045-2026, RD-012"
                value={numeroDocumentoSustento}
                onChange={(e) => setNumeroDocumentoSustento(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-800 mb-1">
              Motivo del Retiro <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              placeholder="Explique las razones (ej. Motivos laborales, viaje fuera de la provincia, salud, límite de inasistencias alcanzado)..."
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              required
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none text-xs"
            />
          </div>

          <div>
            <label className="block text-slate-500 font-medium mb-1">Observaciones adicionales</label>
            <input
              type="text"
              placeholder="Notas internas para secretaría académica..."
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none text-xs"
            />
          </div>
        </div>
      </form>
    </Modal>
  );
};
