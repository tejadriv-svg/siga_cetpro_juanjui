import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { TipoDocumentoOficial } from '../../types';
import { Modal } from '../common/Modal';
import { Award, FileText, Search } from 'lucide-react';

interface NuevoCertificadoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NuevoCertificadoModal: React.FC<NuevoCertificadoModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    estudiantes,
    personas,
    programas,
    modulos,
    periodoActivo,
    emitirDocumentoOficial,
  } = useApp();

  const [estudianteId, setEstudianteId] = useState(estudiantes[0]?.id || '');
  const [tipo, setTipo] = useState<TipoDocumentoOficial>('Certificado Modular');
  const [programaId, setProgramaId] = useState(programas[0]?.id || '');
  const [moduloId, setModuloId] = useState(modulos[0]?.id || '');
  const [observaciones, setObservaciones] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredEstudiantes = estudiantes.filter((e) => {
    const p = personas.find((per) => per.id === e.personaId);
    if (!p) return false;
    const s = searchTerm.toLowerCase().trim();
    return (
      (p.numeroDocumento || '').includes(s) ||
      `${p.nombres || ''} ${p.apellidoPaterno || ''} ${p.apellidoMaterno || ''}`.toLowerCase().includes(s)
    );
  });

  const modulosDisponibles = modulos.filter((m) => m.programaId === programaId && (m.estado === 'ACTIVO' || !m.estado));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!estudianteId || !programaId) return;

    emitirDocumentoOficial({
      tipo,
      estudianteId,
      programaId,
      moduloId: tipo === 'Certificado Modular' ? moduloId : undefined,
      periodoAcademico: periodoActivo,
      estado: 'EMITIDO',
      observaciones: observaciones ? observaciones : undefined,
    });

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Emisión de Documento Oficial / Certificado"
      subtitle="Generación conforme a normativa R.V.M. N° 188-2020-MINEDU"
      maxWidth="xl"
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
            form="doc-form"
            className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors"
          >
            Generar y Emitir Documento
          </button>
        </>
      }
    >
      <form id="doc-form" onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Document Type */}
        <div>
          <label className="block font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-1">
            Tipo de Documento Oficial a Emitir
          </label>
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value as TipoDocumentoOficial)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:bg-white focus:outline-none"
          >
            <option value="Certificado Modular">Certificado Modular Oficial</option>
            <option value="Constancia de Matrícula">Constancia de Matrícula</option>
            <option value="Constancia de Egresado">Constancia de Egresado</option>
            <option value="Certificado de Estudios">Certificado de Estudios Completo</option>
          </select>
        </div>

        {/* Student Select */}
        <div className="space-y-2">
          <label className="block font-bold text-slate-900 uppercase tracking-wider text-[11px]">
            Seleccionar Estudiante Beneficiario
          </label>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por DNI o apellidos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
            />
          </div>

          <select
            value={estudianteId}
            onChange={(e) => setEstudianteId(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none"
          >
            {filteredEstudiantes.map((est) => {
              const per = personas.find((p) => p.id === est.personaId);
              return (
                <option key={est.id} value={est.id}>
                  {per?.apellidoPaterno} {per?.apellidoMaterno}, {per?.nombres} (DNI: {per?.numeroDocumento})
                </option>
              );
            })}
          </select>
        </div>

        {/* Program & Module */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Programa de Estudio</label>
            <select
              value={programaId}
              onChange={(e) => {
                setProgramaId(e.target.value);
                const firstMod = modulos.find((m) => m.programaId === e.target.value);
                if (firstMod) setModuloId(firstMod.id);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
            >
              {programas.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre} ({p.nivelFormativo})
                </option>
              ))}
            </select>
          </div>

          {tipo === 'Certificado Modular' && (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Módulo Formativo Aprobado</label>
              <select
                value={moduloId}
                onChange={(e) => setModuloId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
              >
                {modulosDisponibles.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.codigo}: {m.nombre}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">Observaciones / Notas Adicionales</label>
          <input
            type="text"
            placeholder="Ej. Cumplió con 120 horas de EFSRT y nota mínima aprobatoria."
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
          />
        </div>
      </form>
    </Modal>
  );
};
