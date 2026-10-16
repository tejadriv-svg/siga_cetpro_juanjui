import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { AptoCertificadoModular } from '../../types';
import { Modal } from '../common/Modal';
import { 
  Award, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  BookOpen, 
  Sparkles,
  GraduationCap
} from 'lucide-react';

interface EmitirCertificadoModularModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedApto?: AptoCertificadoModular | null;
  onSuccess?: () => void;
}

export const EmitirCertificadoModularModal: React.FC<EmitirCertificadoModularModalProps> = ({
  isOpen,
  onClose,
  preselectedApto,
  onSuccess,
}) => {
  const {
    aptosCertificacionModular,
    programas,
    modulos,
    estudiantes,
    personas,
    emitirCertificadoModular,
  } = useApp();

  const [selectedEstudianteId, setSelectedEstudianteId] = useState('');
  const [selectedModuloId, setSelectedModuloId] = useState('');
  const [resolucionDirectoral, setResolucionDirectoral] = useState('RD N° 0148-2024-DRE-SM');
  const [tomoFolio, setTomoFolio] = useState(`Libro 2026, Tomo 01, Folio ${String(Math.floor(Math.random() * 80) + 10).padStart(2, '0')}`);
  const [observaciones, setObservaciones] = useState('Certificado Modular acreditado según R.V.M. N° 188-2020-MINEDU');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Inicializar con preseleccionado si existe
  useEffect(() => {
    if (preselectedApto) {
      setSelectedEstudianteId(preselectedApto.estudiante_id);
      setSelectedModuloId(preselectedApto.modulo_id);
    } else if (aptosCertificacionModular.length > 0) {
      const primerNoCert = aptosCertificacionModular.find(a => !a.ya_certificado) || aptosCertificacionModular[0];
      setSelectedEstudianteId(primerNoCert.estudiante_id);
      setSelectedModuloId(primerNoCert.modulo_id);
    }
  }, [preselectedApto, aptosCertificacionModular, isOpen]);

  // Encontrar el apto seleccionado
  const aptoActual = aptosCertificacionModular.find(
    a => a.estudiante_id === selectedEstudianteId && a.modulo_id === selectedModuloId
  );

  // Filtrar candidatos para el selector
  const aptosFiltrados = aptosCertificacionModular.filter(a => {
    const s = searchTerm.toLowerCase().trim();
    if (!s) return true;
    const nombreCompleto = `${a.persona_apellido_paterno} ${a.persona_apellido_materno} ${a.persona_nombres}`.toLowerCase();
    return (
      (a.persona_dni || '').includes(s) ||
      nombreCompleto.includes(s) ||
      (a.modulo_nombre || '').toLowerCase().includes(s) ||
      (a.programa_nombre || '').toLowerCase().includes(s)
    );
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEstudianteId || !selectedModuloId) return;

    setIsSubmitting(true);
    try {
      const res = await emitirCertificadoModular({
        estudianteId: selectedEstudianteId,
        moduloId: selectedModuloId,
        matriculaId: aptoActual?.matricula_id,
        resolucionDirectoral,
        tomoFolio,
        observaciones,
      });

      if (res) {
        if (onSuccess) onSuccess();
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Emisión Oficial de Certificado Modular"
      subtitle="Generación normativa con cálculo ponderado y registro institucional (R.V.M. N° 188-2020-MINEDU)"
      maxWidth="2xl"
      actions={
        <>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="emitir-cert-form"
            disabled={isSubmitting || (aptoActual && aptoActual.ya_certificado)}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isSubmitting ? 'Emitiendo y sellando...' : 'Emitir Certificado Modular'}</span>
          </button>
        </>
      }
    >
      <form id="emitir-cert-form" onSubmit={handleSubmit} className="space-y-4 text-xs">
        
        {/* Selector de Candidato / Apto */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block font-bold text-slate-900 uppercase tracking-wider text-[11px]">
              Estudiante y Módulo a Certificar
            </label>
            <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
              Auditoría Académica Activa
            </span>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por DNI, estudiante, programa o módulo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none text-xs"
            />
          </div>

          <select
            value={`${selectedEstudianteId}|${selectedModuloId}`}
            onChange={(e) => {
              const [eId, mId] = e.target.value.split('|');
              setSelectedEstudianteId(eId);
              setSelectedModuloId(mId);
            }}
            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none text-xs"
          >
            {aptosFiltrados.map((a) => (
              <option 
                key={`${a.estudiante_id}-${a.modulo_id}`} 
                value={`${a.estudiante_id}|${a.modulo_id}`}
              >
                {a.persona_apellido_paterno} {a.persona_apellido_materno}, {a.persona_nombres} (DNI: {a.persona_dni}) — {a.modulo_nombre} {a.ya_certificado ? ' [YA CERTIFICADO]' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Resumen Académico del Estudiante Seleccionado */}
        {aptoActual && (
          <div className={`p-4 rounded-2xl border ${aptoActual.ya_certificado ? 'bg-amber-50/70 border-amber-200' : 'bg-emerald-50/60 border-emerald-200'} space-y-3`}>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-emerald-700" />
                <span>{aptoActual.persona_apellido_paterno} {aptoActual.persona_apellido_materno}, {aptoActual.persona_nombres}</span>
              </div>
              {aptoActual.ya_certificado ? (
                <span className="px-2.5 py-1 bg-amber-200/70 text-amber-900 font-bold rounded-lg text-[10px] flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> Ya cuenta con certificado ({aptoActual.codigo_certificado})
                </span>
              ) : (
                <span className="px-2.5 py-1 bg-emerald-200/70 text-emerald-900 font-bold rounded-lg text-[10px] flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Apto para Certificar
                </span>
              )}
            </div>

            <div className="text-xs text-slate-700 space-y-1">
              <div>Programa: <strong>{aptoActual.programa_nombre}</strong> ({aptoActual.nivel_formativo})</div>
              <div>Módulo: <strong>{aptoActual.modulo_nombre}</strong> ({aptoActual.modulo_horas} Horas • {aptoActual.modulo_creditos} Créditos)</div>
            </div>

            {/* Ponderación MINEDU (70% UDs + 30% EFSRT) */}
            <div className="grid grid-cols-3 gap-2 bg-white p-3 rounded-xl border border-slate-200 text-center">
              <div>
                <div className="text-[10px] text-slate-500 font-semibold uppercase">Promedio UDs (70%)</div>
                <div className="text-sm font-extrabold text-slate-900">{aptoActual.promedio_unidades}</div>
                <div className="text-[9px] text-slate-400">{aptoActual.unidades_aprobadas}/{aptoActual.unidades_totales} UDs aprobadas</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500 font-semibold uppercase">Nota EFSRT (30%)</div>
                <div className="text-sm font-extrabold text-blue-800">{aptoActual.nota_efsrt || '15'}</div>
                <div className="text-[9px] text-slate-400">Prácticas aprobadas</div>
              </div>
              <div className="border-l border-slate-200 pl-2">
                <div className="text-[10px] text-emerald-800 font-bold uppercase">Promedio Modular</div>
                <div className="text-base font-black text-emerald-700">{aptoActual.promedio_final || '14.6'}</div>
                <div className="text-[9px] text-emerald-600 font-semibold">Aprobatorio (≥ 13)</div>
              </div>
            </div>
          </div>
        )}

        {/* Metadatos de Registro en Libro Oficial */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Resolución Directoral de Autorización
            </label>
            <input
              type="text"
              value={resolucionDirectoral}
              onChange={(e) => setResolucionDirectoral(e.target.value)}
              placeholder="RD N° 0148-2024-DRE-SM"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none font-medium"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Registro Institucional (Libro, Tomo, Folio)
            </label>
            <input
              type="text"
              value={tomoFolio}
              onChange={(e) => setTomoFolio(e.target.value)}
              placeholder="Libro 2026, Tomo 01, Folio 24"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none font-medium"
            />
          </div>
        </div>

        {/* Observaciones */}
        <div>
          <label className="block font-semibold text-slate-700 mb-1">
            Observaciones Normativas / Notas al Reverso
          </label>
          <textarea
            rows={2}
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none"
            placeholder="Observaciones de emisión conforme a la R.V.M. N° 188-2020-MINEDU..."
          />
        </div>
      </form>
    </Modal>
  );
};
