import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { TipoCertificadoEstudio } from '../../types';
import { Modal } from '../common/Modal';
import { 
  Award, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  BookOpen, 
  Sparkles,
  GraduationCap,
  Layers,
  Clock,
  FileCheck
} from 'lucide-react';

interface EmitirCertificadoEstudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedEstudianteId?: string | null;
  onSuccess?: () => void;
}

export const EmitirCertificadoEstudioModal: React.FC<EmitirCertificadoEstudioModalProps> = ({
  isOpen,
  onClose,
  preselectedEstudianteId,
  onSuccess,
}) => {
  const {
    estudiantes,
    personas,
    programas,
    emitirCertificadoEstudio,
  } = useApp();

  const [selectedEstudianteId, setSelectedEstudianteId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [tipoCertificado, setTipoCertificado] = useState<TipoCertificadoEstudio>('COMPLETO');
  const [motivoEmision, setMotivoEmision] = useState('TRAMITE_PERSONAL');
  const [resolucionDirectoral, setResolucionDirectoral] = useState('RD N° 0148-2024-DRE-SM');
  const [tomoFolio, setTomoFolio] = useState(`Libro 2026, Tomo 01, Folio ${String(Math.floor(Math.random() * 80) + 15).padStart(2, '0')}`);
  const [observaciones, setObservaciones] = useState('Certificado Oficial de Estudios emitido conforme a la R.V.M. N° 188-2020-MINEDU');
  
  const [isLoadingHistorial, setIsLoadingHistorial] = useState(false);
  const [historialData, setHistorialData] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Inicializar selección
  useEffect(() => {
    if (preselectedEstudianteId) {
      setSelectedEstudianteId(preselectedEstudianteId);
    } else if (estudiantes.length > 0 && !selectedEstudianteId) {
      setSelectedEstudianteId(estudiantes[0].id);
    }
  }, [preselectedEstudianteId, estudiantes, isOpen]);

  // Cargar historial académico cuando cambia el estudiante seleccionado
  useEffect(() => {
    if (!selectedEstudianteId || !isOpen) return;

    let isMounted = true;
    const fetchHistorial = async () => {
      setIsLoadingHistorial(true);
      try {
        const res = await fetch(`/api/certificados-estudios/historial/${selectedEstudianteId}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setHistorialData(data);
            if (data.tipoCertificadoSugerido) {
              setTipoCertificado(data.tipoCertificadoSugerido);
            }
          }
        }
      } catch (err) {
        console.error('Error al cargar historial del estudiante:', err);
      } finally {
        if (isMounted) setIsLoadingHistorial(false);
      }
    };

    fetchHistorial();

    return () => {
      isMounted = false;
    };
  }, [selectedEstudianteId, isOpen]);

  // Filtrado de lista de estudiantes
  const estudiantesFiltrados = estudiantes.filter(e => {
    const p = personas.find(item => item.id === e.personaId);
    const s = searchTerm.toLowerCase().trim();
    if (!s) return true;
    const nombreCompleto = `${p?.apellidoPaterno || ''} ${p?.apellidoMaterno || ''} ${p?.nombres || ''}`.toLowerCase();
    return (
      (p?.dni || '').includes(s) ||
      (e.codigo || '').toLowerCase().includes(s) ||
      nombreCompleto.includes(s)
    );
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEstudianteId || !historialData) return;

    setIsSubmitting(true);
    try {
      const res = await emitirCertificadoEstudio({
        estudianteId: selectedEstudianteId,
        programaId: historialData.programaId,
        planEstudioId: historialData.planEstudioId,
        tipoCertificado,
        motivoEmision,
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
      title="Emisión de Certificado Oficial de Estudios"
      subtitle="Compilación histórica automatizada con cálculo de PPA según R.V.M. N° 188-2020-MINEDU"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Selector y Búsqueda de Estudiante */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            1. Seleccionar Estudiante para Certificación de Estudios:
          </label>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por DNI, código o apellidos del estudiante..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500 mb-2"
            />
          </div>

          <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-white shadow-inner">
            {estudiantesFiltrados.slice(0, 50).map((est) => {
              const per = personas.find(p => p.id === est.personaId);
              const prog = programas.find(pr => pr.id === est.programaId);
              const isSelected = est.id === selectedEstudianteId;

              return (
                <div
                  key={est.id}
                  onClick={() => setSelectedEstudianteId(est.id)}
                  className={`p-2.5 flex items-center justify-between cursor-pointer transition-colors ${
                    isSelected ? 'bg-indigo-50/80 border-l-4 border-indigo-600' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                      isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {per?.nombres?.charAt(0) || 'E'}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">
                        {per?.apellidoPaterno} {per?.apellidoMaterno}, {per?.nombres}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        DNI: <span className="font-semibold text-slate-700">{per?.dni}</span> • Cód: <span className="font-semibold text-slate-700">{est.codigo}</span> • {prog?.nombre || 'Programa'}
                      </p>
                    </div>
                  </div>
                  {isSelected && (
                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Seleccionado
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Panel de Auditoría Académica y Vista Previa de Cálculos */}
        {isLoadingHistorial ? (
          <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl text-center">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mb-2" />
            <p className="text-xs text-slate-600 font-medium">Compilando trayectoria académica histórica del estudiante...</p>
          </div>
        ) : historialData ? (
          <div className="p-4 bg-indigo-50/50 border border-indigo-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-indigo-700" />
                <span className="text-xs font-black text-indigo-950 uppercase">Resumen Curricular Acumulado</span>
              </div>
              <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                historialData.tipoCertificadoSugerido === 'COMPLETO' 
                  ? 'bg-emerald-100 text-emerald-800' 
                  : 'bg-amber-100 text-amber-800'
              }`}>
                Sugerido: {historialData.tipoCertificadoSugerido}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-2 bg-white rounded-lg border border-indigo-100 shadow-xs">
                <span className="text-[10px] text-slate-500 font-medium block">Unidades Aprobadas</span>
                <span className="text-sm font-black text-indigo-950">{historialData.unidades?.length || 0} UDs</span>
              </div>
              <div className="p-2 bg-white rounded-lg border border-indigo-100 shadow-xs">
                <span className="text-[10px] text-slate-500 font-medium block">Horas Totales</span>
                <span className="text-sm font-black text-indigo-950">{historialData.totalHoras || 0} hrs</span>
              </div>
              <div className="p-2 bg-white rounded-lg border border-indigo-100 shadow-xs">
                <span className="text-[10px] text-slate-500 font-medium block">Créditos Totales</span>
                <span className="text-sm font-black text-indigo-950">{historialData.totalCreditos || 0} créd.</span>
              </div>
              <div className="p-2 bg-indigo-600 text-white rounded-lg shadow-xs">
                <span className="text-[10px] text-indigo-200 font-bold block uppercase">PPA Acumulado</span>
                <span className="text-sm font-black text-amber-300">{historialData.promedioPonderadoAcumulado || 0}</span>
              </div>
            </div>

            {/* Selector de Tipo de Certificado */}
            <div className="pt-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Tipo de Certificado a Emitir:
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                  tipoCertificado === 'COMPLETO' ? 'bg-white border-indigo-600 shadow-xs' : 'bg-slate-50 border-slate-200'
                }`}>
                  <input
                    type="radio"
                    name="tipoCertificado"
                    value="COMPLETO"
                    checked={tipoCertificado === 'COMPLETO'}
                    onChange={() => setTipoCertificado('COMPLETO')}
                    className="text-indigo-600"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">COMPLETO</span>
                    <span className="text-[10px] text-slate-500">Acredita la totalidad de módulos del plan</span>
                  </div>
                </label>

                <label className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                  tipoCertificado === 'PARCIAL' ? 'bg-white border-amber-600 shadow-xs' : 'bg-slate-50 border-slate-200'
                }`}>
                  <input
                    type="radio"
                    name="tipoCertificado"
                    value="PARCIAL"
                    checked={tipoCertificado === 'PARCIAL'}
                    onChange={() => setTipoCertificado('PARCIAL')}
                    className="text-amber-600"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">PARCIAL</span>
                    <span className="text-[10px] text-slate-500">Para traslados, convalidación o trámites</span>
                  </div>
                </label>
              </div>
            </div>
          </div>
        ) : null}

        {/* Parámetros Normativos y Administrativos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Motivo de Emisión:
            </label>
            <select
              value={motivoEmision}
              onChange={(e) => setMotivoEmision(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:border-indigo-500"
            >
              <option value="TRAMITE_PERSONAL">Trámite Personal / Particular</option>
              <option value="CONVALIDACION">Convalidación de Estudios</option>
              <option value="TRASLADO">Traslado Externo / Interno</option>
              <option value="TITULACION">Proceso de Titulación Profesional</option>
              <option value="TRABAJO">Convocatoria Laboral / Empleo</option>
              <option value="OTRO">Otro Motivo Justificado</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Resolución Directoral:
            </label>
            <input
              type="text"
              value={resolucionDirectoral}
              onChange={(e) => setResolucionDirectoral(e.target.value)}
              placeholder="RD N° 0148-2024-DRE-SM"
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Libro / Tomo / Folio:
            </label>
            <input
              type="text"
              value={tomoFolio}
              onChange={(e) => setTomoFolio(e.target.value)}
              placeholder="Libro 2026, Tomo 01, Folio 15"
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Observaciones Normativas:
            </label>
            <input
              type="text"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="R.V.M. N° 188-2020-MINEDU"
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Acciones */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !historialData || (historialData.unidades?.length === 0 && historialData.efsrt?.length === 0)}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer"
          >
            <Award className="w-4 h-4" />
            {isSubmitting ? 'Emitiendo y Firmando...' : 'Emitir Certificado de Estudios'}
          </button>
        </div>

      </form>
    </Modal>
  );
};
