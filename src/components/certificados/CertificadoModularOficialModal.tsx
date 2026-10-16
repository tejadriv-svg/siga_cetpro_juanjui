import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CertificadoModularDetallado } from '../../types';
import { Modal } from '../common/Modal';
import { QrCode } from '../common/QrCode';
import { 
  Printer, 
  Award, 
  ShieldCheck, 
  FileCheck2, 
  GraduationCap, 
  Layers, 
  BookOpen, 
  CheckCircle2, 
  Building2 
} from 'lucide-react';

interface CertificadoModularOficialModalProps {
  isOpen: boolean;
  onClose: () => void;
  certificado: CertificadoModularDetallado;
}

// Convertidor de número vigesimal a letras formal
function numeroALetras(n: number): string {
  const round = Math.round(n);
  const mapa: { [key: number]: string } = {
    0: 'CERO',
    1: 'UNO',
    2: 'DOS',
    3: 'TRES',
    4: 'CUATRO',
    5: 'CINCO',
    6: 'SEIS',
    7: 'SIETE',
    8: 'OCHO',
    9: 'NUEVE',
    10: 'DIEZ',
    11: 'ONCE',
    12: 'DOCE',
    13: 'TRECE',
    14: 'CATORCE',
    15: 'QUINCE',
    16: 'DIECISÉIS',
    17: 'DIECISIETE',
    18: 'DIECIOCHO',
    19: 'DIECINUEVE',
    20: 'VEINTE',
  };
  return mapa[round] || round.toString();
}

function formatearFechaLarga(fechaStr?: string): string {
  if (!fechaStr) return 'Fecha no registrada';
  try {
    const partes = fechaStr.split('-');
    if (partes.length === 3) {
      const anio = partes[0];
      const mesNum = parseInt(partes[1], 10);
      const dia = parseInt(partes[2], 10);
      const meses = [
        'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
        'julio', 'agosto', 'setiembre', 'octubre', 'noviembre', 'diciembre'
      ];
      return `${dia} de ${meses[mesNum - 1] || 'marzo'} del ${anio}`;
    }
    const d = new Date(fechaStr);
    return d.toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return fechaStr;
  }
}

export const CertificadoModularOficialModal: React.FC<CertificadoModularOficialModalProps> = ({
  isOpen,
  onClose,
  certificado,
}) => {
  const { institucion } = useApp();
  const [ladoVista, setLadoVista] = useState<'AMBOS' | 'ANVERSO' | 'REVERSO'>('AMBOS');

  const handlePrint = (lado?: 'AMBOS' | 'ANVERSO' | 'REVERSO') => {
    if (lado) setLadoVista(lado);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const nombreCompleto = `${certificado.personaApellidoPaterno || ''} ${certificado.personaApellidoMaterno || ''}, ${certificado.personaNombres || ''}`.trim();
  const promUnidades = certificado.promedioUnidades || 14;
  const notaEfsrt = certificado.notaEfsrt || 15;
  const promFinal = certificado.promedioFinal || Math.round((promUnidades * 0.7 + notaEfsrt * 0.3) * 10) / 10;
  const desglose = certificado.detalleCalificaciones || [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Certificado Modular Oficial — R.V.M. N° 188-2020-MINEDU"
      subtitle={`${certificado.codigoCertificado || certificado.numeroCertificado} • ${nombreCompleto}`}
      maxWidth="4xl"
      actions={
        <div className="flex items-center justify-between w-full flex-wrap gap-2">
          {/* Lado selector */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setLadoVista('AMBOS')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                ladoVista === 'AMBOS' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Ambas Caras (Dúplex)
            </button>
            <button
              type="button"
              onClick={() => setLadoVista('ANVERSO')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                ladoVista === 'ANVERSO' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Anverso (Principal)
            </button>
            <button
              type="button"
              onClick={() => setLadoVista('REVERSO')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                ladoVista === 'REVERSO' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Reverso (Notas y QR)
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors"
            >
              Cerrar
            </button>
            <button
              type="button"
              onClick={() => handlePrint()}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Certificado Oficial</span>
            </button>
          </div>
        </div>
      }
    >
      <div id="print-certificate-container" className="space-y-8 font-serif text-slate-900">
        
        {/* ========================================================================= */}
        {/* CARA 1: ANVERSO DEL CERTIFICADO MODULAR                                   */}
        {/* ========================================================================= */}
        {(ladoVista === 'AMBOS' || ladoVista === 'ANVERSO') && (
          <div className="certificate-page anverso-page bg-amber-50/20 p-8 sm:p-12 border-8 border-double border-amber-900/40 rounded-3xl shadow-xs relative overflow-hidden text-center">
            {/* Watermark */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
              <Award className="w-[450px] h-[450px] text-slate-950" />
            </div>

            {/* Banner Institucional Superior */}
            <div className="space-y-1.5 border-b-2 border-amber-950/20 pb-5">
              <div className="text-[12px] font-sans uppercase font-extrabold tracking-[0.2em] text-amber-950">
                REPÚBLICA DEL PERÚ • MINISTERIO DE EDUCACIÓN
              </div>
              <div className="text-[11px] font-sans uppercase tracking-widest text-slate-700 font-semibold">
                DIRECCIÓN REGIONAL DE EDUCACIÓN SAN MARTÍN • UGEL MARISCAL CÁCERES
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-slate-950 pt-2 tracking-wide font-serif uppercase">
                CETPRO PÚBLICO "JUANJUÍ"
              </div>
              <div className="text-[10px] font-sans text-slate-600 tracking-wide">
                CÓDIGO MODULAR: <strong>0533836</strong> • CÓDIGO LOCAL: <strong>477262</strong> • RESOLUCIÓN DIRECTORAL DE CREACIÓN N° 0148-1983-ED
              </div>
            </div>

            {/* Título Oficial */}
            <div className="py-6 space-y-2">
              <div className="inline-block px-6 py-1.5 bg-amber-100 border border-amber-300 text-amber-950 font-sans font-extrabold text-sm rounded-full uppercase tracking-[0.15em] shadow-2xs">
                CERTIFICADO MODULAR
              </div>
              <div className="text-xs font-mono font-bold text-slate-700">
                CÓDIGO OFICIAL: <span className="text-emerald-800">{certificado.codigoCertificado || 'CM-2026-0001'}</span> • REGISTRO N°: {certificado.numeroCertificado}
              </div>
            </div>

            {/* Cuerpo del Certificado */}
            <div className="max-w-2xl mx-auto space-y-5 text-slate-800 text-sm leading-relaxed font-sans text-center">
              <p className="italic text-slate-700 text-xs">
                El Director del Centro de Educación Técnico-Productiva Público "Juanjuí", de conformidad con la{' '}
                <strong>Resolución Viceministerial N° 188-2020-MINEDU</strong> y los lineamientos del Catálogo Nacional de la Oferta Formativa (CNOF):
              </p>

              <div className="pt-2">
                <span className="text-xs uppercase tracking-widest text-slate-500 font-bold block mb-1">
                  OTORGA EL PRESENTE CERTIFICADO A:
                </span>
                <span className="text-2xl sm:text-3xl font-extrabold text-slate-950 uppercase tracking-wide border-b-2 border-slate-950 px-6 inline-block font-serif pb-1">
                  {nombreCompleto}
                </span>
                <div className="text-xs font-mono text-slate-700 font-bold mt-2">
                  Documento Nacional de Identidad N°: <span className="text-slate-950">{certificado.personaDni || '--------'}</span>
                  {certificado.estudianteCodigo && (
                    <span className="ml-3 text-slate-500">• Cód. Estudiante: {certificado.estudianteCodigo}</span>
                  )}
                </div>
              </div>

              <p className="text-xs text-slate-700">
                Por haber cursado y aprobado satisfactoriamente todos los créditos y horas pedagógicas correspondientes al:{' '}
              </p>

              {/* Caja del Módulo */}
              <div className="p-4 bg-white/90 rounded-2xl border-2 border-amber-300/80 shadow-xs space-y-2 text-center max-w-xl mx-auto">
                <div className="text-[11px] font-sans font-extrabold uppercase tracking-wider text-amber-950">
                  MÓDULO FORMATIVO N° {certificado.moduloOrden || 1}
                </div>
                <div className="text-base sm:text-lg font-bold text-slate-950 font-serif leading-snug uppercase">
                  {certificado.moduloNombre}
                </div>
                <div className="text-xs font-medium text-slate-700 flex items-center justify-center gap-3 pt-1 border-t border-amber-100 flex-wrap">
                  <span>Programa: <strong>{certificado.programaNombre}</strong></span>
                  <span>•</span>
                  <span>Nivel: <strong>{certificado.nivelFormativo || 'Técnico'}</strong></span>
                  <span>•</span>
                  <span className="text-emerald-800 font-bold">{certificado.horasModulo || 560} Horas</span>
                  <span>•</span>
                  <span className="text-emerald-800 font-bold">{certificado.creditosModulo || 21} Créditos</span>
                </div>
              </div>

              <p className="text-xs text-slate-600 italic pt-2">
                Expedido en la ciudad de Juanjuí, provincia de Mariscal Cáceres, departamento de San Martín, el{' '}
                <strong>{formatearFechaLarga(certificado.fechaEmision)}</strong>.
              </p>
            </div>

            {/* Metadatos de Registro en Libro y Firmas */}
            <div className="pt-8 border-t-2 border-amber-950/20 grid grid-cols-1 sm:grid-cols-3 items-end gap-6 text-[10px] font-sans text-slate-700 mt-6">
              {/* Registro Institucional */}
              <div className="text-left bg-white/80 p-3 rounded-xl border border-amber-200 space-y-1">
                <div className="font-bold text-amber-950 uppercase text-[9px] tracking-wider border-b border-amber-200 pb-0.5">
                  Registro Institucional
                </div>
                <div>Libro/Folio: <strong>{certificado.tomoFolio || 'Libro 2026, Tomo 01, Folio 01'}</strong></div>
                <div>R.D. Autorización: <strong>{certificado.resolucionDirectoral || 'RD N° 0148-2024-DRE-SM'}</strong></div>
                <div>Estado: <strong className="text-emerald-700">{certificado.estado}</strong></div>
              </div>

              {/* Firma Secretario Académico */}
              <div className="text-center space-y-1">
                <div className="h-16 border-b border-slate-400 mb-1 mx-4" />
                <div className="font-bold text-slate-950 text-[11px] uppercase">
                  {institucion.secretarioAcademico || 'SECRETARÍA ACADÉMICA'}
                </div>
                <div className="text-slate-500 text-[9px]">Secretario(a) Académico(a)</div>
                <div className="text-slate-400 text-[8px]">CETPRO Juanjuí - San Martín</div>
              </div>

              {/* Firma Director General */}
              <div className="text-center space-y-1">
                <div className="h-16 border-b border-slate-400 mb-1 mx-4" />
                <div className="font-bold text-slate-950 text-[11px] uppercase">
                  {institucion.director || 'DIRECCIÓN GENERAL'}
                </div>
                <div className="text-slate-500 text-[9px]">Director General</div>
                <div className="text-slate-400 text-[8px]">CETPRO Juanjuí - San Martín</div>
              </div>
            </div>
          </div>
        )}

        {/* Separador de página para impresión dúplex */}
        {ladoVista === 'AMBOS' && (
          <div className="page-break my-8 border-b-2 border-dashed border-slate-300 relative text-center">
            <span className="bg-slate-100 text-slate-500 text-[10px] font-mono px-3 py-1 rounded-full uppercase absolute -top-3 left-1/2 -translate-x-1/2 font-bold">
              SALTO DE PÁGINA (REVERSO)
            </span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* CARA 2: REVERSO - MATRIZ DE CALIFICACIONES Y VALIDACIÓN QR                */}
        {/* ========================================================================= */}
        {(ladoVista === 'AMBOS' || ladoVista === 'REVERSO') && (
          <div className="certificate-page reverso-page bg-white p-8 sm:p-12 border-4 border-slate-300 rounded-3xl shadow-xs space-y-6 text-slate-900">
            {/* Encabezado Reverso */}
            <div className="text-center space-y-1 border-b pb-4">
              <div className="text-xs font-sans font-extrabold uppercase tracking-widest text-slate-900">
                CETPRO PÚBLICO "JUANJUÍ" • SAN MARTÍN
              </div>
              <h2 className="text-lg font-bold font-serif uppercase tracking-wide text-slate-950">
                REGISTRO OFICIAL DE CALIFICACIONES DEL MÓDULO FORMATIVO
              </h2>
              <div className="text-[11px] font-sans text-slate-600">
                Conforme al Artículo 42° de la R.V.M. N° 188-2020-MINEDU • Escala Vigesimal (0 a 20) • Nota Mínima Aprobatoria: 13
              </div>
            </div>

            {/* Datos Resumen del Estudiante y Módulo */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-sans bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <div>Estudiante: <strong>{nombreCompleto}</strong></div>
                <div>DNI: <strong>{certificado.personaDni || '---'}</strong> • Código: <strong>{certificado.estudianteCodigo || '---'}</strong></div>
                <div>Programa: <strong>{certificado.programaNombre}</strong> ({certificado.nivelFormativo})</div>
              </div>
              <div className="sm:text-right">
                <div>Módulo: <strong>{certificado.moduloNombre}</strong></div>
                <div>Código Oficial: <strong className="text-emerald-700 font-mono">{certificado.codigoCertificado || 'CM-2026-0001'}</strong></div>
                <div>Horas: <strong>{certificado.horasModulo}</strong> • Créditos: <strong>{certificado.creditosModulo}</strong></div>
              </div>
            </div>

            {/* Matriz Curricular de Unidades Didácticas */}
            <div className="border border-slate-300 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-xs font-sans text-left border-collapse">
                <thead>
                  <tr className="bg-slate-800 text-white font-bold text-[11px] uppercase tracking-wider">
                    <th className="py-2.5 px-3 w-10 text-center">N°</th>
                    <th className="py-2.5 px-3 w-28">Código</th>
                    <th className="py-2.5 px-3">Denominación de la Unidad Didáctica</th>
                    <th className="py-2.5 px-3 w-24 text-center">Tipo</th>
                    <th className="py-2.5 px-3 w-16 text-center">Horas</th>
                    <th className="py-2.5 px-3 w-16 text-center">Créd.</th>
                    <th className="py-2.5 px-3 w-20 text-center">Nota</th>
                    <th className="py-2.5 px-3 w-32 text-center">En Letras</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {desglose.length > 0 ? (
                    desglose.map((ud, idx) => (
                      <tr key={ud.codigo || idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                        <td className="py-2 px-3 text-center font-mono text-slate-500">{idx + 1}</td>
                        <td className="py-2 px-3 font-mono font-bold text-slate-700 text-[11px]">{ud.codigo}</td>
                        <td className="py-2 px-3 font-medium text-slate-900">{ud.nombre}</td>
                        <td className="py-2 px-3 text-center text-slate-600 text-[10px]">{ud.tipo}</td>
                        <td className="py-2 px-3 text-center font-mono text-slate-700">{ud.horas}</td>
                        <td className="py-2 px-3 text-center font-mono text-slate-700">{ud.creditos}</td>
                        <td className="py-2 px-3 text-center font-mono font-bold text-emerald-700 text-sm">
                          {ud.nota}
                        </td>
                        <td className="py-2 px-3 text-center font-bold text-[10px] uppercase text-slate-800">
                          {numeroALetras(ud.nota)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-4 text-center text-slate-500 italic">
                        No se ha registrado el desglose de unidades didácticas.
                      </td>
                    </tr>
                  )}

                  {/* Subtotal Promedio de Unidades */}
                  <tr className="bg-amber-50/80 font-bold border-t-2 border-amber-200">
                    <td colSpan={6} className="py-2.5 px-4 text-right text-slate-800 uppercase text-[11px]">
                      PROMEDIO DE UNIDADES DIDÁCTICAS (70% PONDERACIÓN):
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono text-emerald-800 text-sm font-extrabold">
                      {promUnidades}
                    </td>
                    <td className="py-2.5 px-3 text-center uppercase text-[10px] text-slate-900 font-bold">
                      {numeroALetras(promUnidades)}
                    </td>
                  </tr>

                  {/* Fila de EFSRT */}
                  <tr className="bg-blue-50/80 font-bold border-t border-blue-200">
                    <td colSpan={6} className="py-2.5 px-4 text-right text-slate-800 uppercase text-[11px]">
                      EXPERIENCIAS FORMATIVAS EN SITUACIONES REALES DE TRABAJO - EFSRT (30% PONDERACIÓN):
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono text-blue-900 text-sm font-extrabold">
                      {notaEfsrt}
                    </td>
                    <td className="py-2.5 px-3 text-center uppercase text-[10px] text-slate-900 font-bold">
                      {numeroALetras(notaEfsrt)}
                    </td>
                  </tr>

                  {/* PROMEDIO FINAL MODULAR MINEDU */}
                  <tr className="bg-emerald-800 text-white font-extrabold border-t-2 border-emerald-950 text-sm">
                    <td colSpan={6} className="py-3 px-4 text-right uppercase tracking-wider">
                      CALIFICACIÓN FINAL DEL MÓDULO FORMATIVO (PROMEDIO PONDERADO):
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-base font-black tracking-wide text-amber-300">
                      {promFinal}
                    </td>
                    <td className="py-3 px-3 text-center uppercase text-xs tracking-wider text-amber-300">
                      {numeroALetras(promFinal)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Bloque de Autenticidad, QR y Hash de Seguridad */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center bg-slate-50 p-5 rounded-2xl border border-slate-200 text-xs font-sans">
              {/* QR Code */}
              <div className="flex flex-col items-center justify-center space-y-1">
                <QrCode 
                  value={certificado.codigoVerificacionQr || `https://siga.cetprojuanjui.edu.pe/validar-certificado?num=${certificado.codigoCertificado}`} 
                  size={105} 
                  label="" 
                  showLink={false} 
                />
                <div className="text-[10px] font-mono text-emerald-800 font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  VERIFICACIÓN OFICIAL QR
                </div>
              </div>

              {/* Datos de Autenticidad y Hash */}
              <div className="space-y-1.5 sm:col-span-2">
                <div className="font-bold text-slate-900 text-xs uppercase flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Garantía de Autenticidad y Validez Nacional
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  El presente certificado modular ha sido expedido de acuerdo con el Catálogo Nacional de la Oferta Formativa (CNOF) del Ministerio de Educación. La autenticidad de este documento y de sus calificaciones puede ser verificada escaneando el código QR institucional o accediendo al Sistema Integrado de Gestión Académica (SIGA).
                </p>
                <div className="font-mono text-[10px] text-slate-700 bg-white p-2 rounded-lg border border-slate-200">
                  <div>Hash de Seguridad: <strong>{certificado.hashSeguridad || 'd41d8cd98f00b204e9800998ecf8427e'}</strong></div>
                  <div>Plataforma: <strong>https://siga.cetprojuanjui.edu.pe/validar-certificado</strong></div>
                </div>
              </div>
            </div>

            {/* Firmas de Cierre Reverso */}
            <div className="pt-6 border-t border-slate-300 grid grid-cols-2 gap-8 text-[10px] font-sans text-slate-700">
              <div className="text-center">
                <div className="h-12 border-b border-slate-400 mb-1 mx-8" />
                <div className="font-bold text-slate-950 uppercase">{institucion.secretarioAcademico || 'Secretaría Académica'}</div>
                <div className="text-slate-500">Secretario(a) Académico(a) • CETPRO Juanjuí</div>
              </div>
              <div className="text-center">
                <div className="h-12 border-b border-slate-400 mb-1 mx-8" />
                <div className="font-bold text-slate-950 uppercase">{institucion.director || 'Dirección General'}</div>
                <div className="text-slate-500">Director General • CETPRO Juanjuí</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Estilos específicos para impresión */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-certificate-container, #print-certificate-container * {
            visibility: visible;
          }
          #print-certificate-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
            background: white !important;
          }
          .page-break {
            page-break-after: always;
            break-after: page;
            height: 0;
            padding: 0;
            margin: 0;
            border: none;
          }
          .certificate-page {
            box-shadow: none !important;
            border-radius: 0 !important;
            width: 100% !important;
            min-height: 98vh !important;
            margin: 0 !important;
            padding: 2.5cm !important;
          }
        }
      `}</style>
    </Modal>
  );
};
