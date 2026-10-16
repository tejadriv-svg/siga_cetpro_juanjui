import React from 'react';
import { useApp } from '../../context/AppContext';
import { DocumentoOficial } from '../../types';
import { Modal } from '../common/Modal';
import { QrCode } from '../common/QrCode';
import { Printer, Award, ShieldCheck, Download } from 'lucide-react';

interface CertificadoModularPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  doc: DocumentoOficial;
}

export const CertificadoModularPreviewModal: React.FC<CertificadoModularPreviewModalProps> = ({
  isOpen,
  onClose,
  doc,
}) => {
  const { estudiantes, personas, programas, modulos, institucion } = useApp();

  const est = estudiantes.find((e) => e.id === doc.estudianteId);
  const per = est ? personas.find((p) => p.id === est.personaId) : null;
  const prog = programas.find((p) => p.id === doc.programaId);
  const mod = modulos.find((m) => m.id === doc.moduloId);

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Vista Previa de Documento Oficial - MINEDU"
      subtitle="Formato oficial con validez nacional conforme a la R.V.M. N° 188-2020-MINEDU"
      maxWidth="3xl"
      actions={
        <>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors"
          >
            Cerrar
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir en Papel Oficial</span>
          </button>
        </>
      }
    >
      {/* Formal Certificate Sheet Container */}
      <div className="bg-amber-50/30 p-8 border-4 border-double border-amber-800/40 rounded-2xl shadow-sm space-y-6 text-center font-serif text-slate-900 relative overflow-hidden">
        {/* Background watermark effect */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
          <Award className="w-96 h-96 text-slate-900" />
        </div>

        {/* Header */}
        <div className="space-y-1 border-b border-amber-900/20 pb-4">
          <div className="text-[11px] font-sans uppercase font-bold tracking-widest text-amber-950">
            República del Perú • Ministerio de Educación
          </div>
          <div className="text-[10px] font-sans uppercase tracking-wider text-slate-600">
            Dirección Regional de Educación San Martín • UGEL Mariscal Cáceres
          </div>
          <div className="text-xl font-bold text-slate-900 pt-2 tracking-wide font-serif">
            CENTRO DE EDUCACIÓN TÉCNICO-PRODUCTIVA "JUANJUÍ"
          </div>
          <div className="text-[10px] font-sans text-slate-500">
            Código Modular: 0533836 • Código de Local: 477262 • RUC: 20531285566
          </div>
        </div>

        {/* Certificate Title */}
        <div className="space-y-2 py-2">
          <div className="inline-block px-4 py-1 bg-amber-100/80 border border-amber-300/80 text-amber-950 font-sans font-bold text-xs rounded-full uppercase tracking-wider">
            {doc.tipo}
          </div>
          <div className="text-[11px] font-mono text-slate-500">
            Registro Oficial N° {doc.numeroDocumento}
          </div>
        </div>

        {/* Body Text */}
        <div className="space-y-4 max-w-xl mx-auto text-xs leading-relaxed font-sans text-slate-800">
          <p className="text-sm">
            La Dirección del <strong>CETPRO Público "Juanjuí"</strong>, de conformidad con la{' '}
            <em>Resolución Viceministerial N° 188-2020-MINEDU</em> y las normas del Catálogo Nacional de la Oferta Formativa (CNOF), otorga el presente a:
          </p>

          <div className="py-2">
            <span className="text-xl font-bold text-slate-950 uppercase tracking-wide border-b-2 border-slate-900 px-4 inline-block font-serif">
              {per?.apellidoPaterno} {per?.apellidoMaterno}, {per?.nombres}
            </span>
            <div className="text-xs text-slate-600 font-mono mt-1">
              Documento Nacional de Identidad N°: <strong>{per?.numeroDocumento}</strong>
            </div>
          </div>

          <p className="text-xs">
            Por haber cursado y aprobado satisfactoriamente los módulos de formación técnico-productiva correspondientes al Programa de Estudio de:
          </p>

          <div className="p-3 bg-white/80 rounded-xl border border-amber-200/80 shadow-xs space-y-1">
            <div className="font-bold text-slate-900 text-sm font-sans">
              {prog?.nombre}
            </div>
            <div className="text-[11px] text-amber-900 font-medium">
              Nivel Formativo: {prog?.nivelFormativo}
            </div>
            {mod && (
              <div className="text-xs text-slate-700 pt-1 border-t border-amber-100">
                Módulo Formativo: <strong>{mod.nombre}</strong> ({mod.horas} Horas • {mod.creditos} Créditos)
              </div>
            )}
          </div>

          <p className="text-[11px] text-slate-600 italic">
            Expedido en la ciudad de Juanjuí, provincia de Mariscal Cáceres, departamento de San Martín, a los {doc.fechaEmision}.
          </p>
        </div>

        {/* Signatures and QR Code */}
        <div className="pt-8 border-t border-amber-900/20 grid grid-cols-3 items-center gap-4 text-[10px] font-sans text-slate-600">
          <div className="text-center">
            <div className="h-12 border-b border-slate-400 mb-1" />
            <div className="font-bold text-slate-900">{institucion.director || 'Dirección General'}</div>
            <div className="text-slate-500">Director General - CETPRO Juanjuí</div>
          </div>

          <div className="flex flex-col items-center justify-center space-y-1">
            <QrCode value={doc.codigoVerificacionQR} size={70} label="" showLink={false} />
            <div className="text-[9px] font-mono text-emerald-800 font-semibold flex items-center gap-0.5">
              <ShieldCheck className="w-3 h-3 text-emerald-600" /> Verificación CNOF
            </div>
          </div>

          <div className="text-center">
            <div className="h-12 border-b border-slate-400 mb-1" />
            <div className="font-bold text-slate-900">Coordinación Académica</div>
            <div className="text-slate-500">CETPRO Juanjuí - San Martín</div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
