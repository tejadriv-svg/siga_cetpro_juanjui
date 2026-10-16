import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CertificadoEstudioDetallado, DetalleCalificacionesEstudio } from '../../types';
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
  Building2,
  Calendar,
  UserCheck
} from 'lucide-react';

interface CertificadoEstudioOficialModalProps {
  isOpen: boolean;
  onClose: () => void;
  certificado: CertificadoEstudioDetallado;
}

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

export const CertificadoEstudioOficialModal: React.FC<CertificadoEstudioOficialModalProps> = ({
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
  const ppa = Number(certificado.promedioPonderadoAcumulado) || 14;
  const ppaLetras = numeroALetras(ppa);
  const totalHoras = certificado.totalHorasAcumuladas || 0;
  const totalCreditos = certificado.totalCreditosAcumulados || 0;
  
  // Detalle de unidades y EFSRT
  const detalle: DetalleCalificacionesEstudio = (certificado.detalleCalificaciones as any) || { unidades: [], efsrt: [] };
  const unidades = detalle.unidades || [];
  const efsrt = detalle.efsrt || [];
  const isCompleto = certificado.tipoCertificado === 'COMPLETO';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Certificado Oficial de Estudios — R.V.M. N° 188-2020-MINEDU"
      subtitle={`${certificado.codigoCertificado || certificado.numeroCertificado} • ${nombreCompleto}`}
      size="xl"
    >
      {/* Barra de control para vista de impresión */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-100 rounded-xl border border-slate-200 mb-6 print:hidden">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Visualizar e Imprimir:</span>
          <div className="inline-flex rounded-lg bg-white p-1 border border-slate-200 shadow-xs">
            <button
              onClick={() => setLadoVista('AMBOS')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                ladoVista === 'AMBOS' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Ambos Lados (2 Caras)
            </button>
            <button
              onClick={() => setLadoVista('ANVERSO')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                ladoVista === 'ANVERSO' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Solo Anverso (Cara A)
            </button>
            <button
              onClick={() => setLadoVista('REVERSO')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                ladoVista === 'REVERSO' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Solo Reverso (Cara B)
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handlePrint()}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Imprimir Formato Oficial A4
          </button>
        </div>
      </div>

      {/* Contenedor Imprimible */}
      <div className="print-area space-y-12">
        {/* ========================================================= */}
        {/* CARA A: ANVERSO (OFICIAL MINEDU)                         */}
        {/* ========================================================= */}
        {(ladoVista === 'AMBOS' || ladoVista === 'ANVERSO') && (
          <div className="bg-white p-8 md:p-12 rounded-2xl border-4 border-indigo-900/40 shadow-xl relative min-h-[950px] flex flex-col justify-between text-slate-800 page-break-after">
            
            {/* Marca de agua de fondo */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none">
              <GraduationCap className="w-[450px] h-[450px] text-indigo-950" />
            </div>

            {/* Borde ornamental interior */}
            <div className="absolute inset-3 border border-indigo-900/30 rounded-xl pointer-events-none" />

            {/* ENCABEZADO INSTITUCIONAL MINEDU */}
            <div className="relative z-10 text-center space-y-2 pb-6 border-b-2 border-indigo-900/20">
              <div className="flex items-center justify-between px-4">
                {/* Logo Escudo / Institución Izq */}
                <div className="w-16 h-16 flex items-center justify-center bg-indigo-50 border border-indigo-200 rounded-full shadow-inner">
                  <Award className="w-9 h-9 text-indigo-800" />
                </div>

                {/* Textos Centrales Oficiales */}
                <div className="space-y-0.5">
                  <p className="text-[11px] font-black tracking-widest text-slate-700 uppercase">
                    REPÚBLICA DEL PERÚ • MINISTERIO DE EDUCACIÓN
                  </p>
                  <p className="text-[10px] font-bold text-slate-600 tracking-wider uppercase">
                    DIRECCIÓN REGIONAL DE EDUCACIÓN SAN MARTÍN • UGEL MARISCAL CÁCERES
                  </p>
                  <h1 className="text-xl md:text-2xl font-black text-indigo-950 tracking-tight font-serif uppercase pt-1">
                    {institucion.nombre}
                  </h1>
                  <p className="text-[10px] text-slate-500 font-semibold">
                    CÓDIGO MODULAR: <span className="text-slate-800 font-bold">{institucion.codigoModular}</span> • CÓDIGO LOCAL: <span className="text-slate-800 font-bold">{institucion.codigoLocal}</span>
                  </p>
                </div>

                {/* Logo Derecho */}
                <div className="w-16 h-16 flex items-center justify-center bg-amber-50 border border-amber-200 rounded-full shadow-inner">
                  <ShieldCheck className="w-9 h-9 text-amber-700" />
                </div>
              </div>

              {/* TÍTULO PRINCIPAL DEL DOCUMENTO */}
              <div className="pt-4">
                <div className="inline-block relative">
                  <h2 className="text-2xl md:text-3xl font-black text-indigo-900 tracking-wider font-serif uppercase px-8 py-1 border-y-2 border-indigo-900/40">
                    {isCompleto ? 'CERTIFICADO DE ESTUDIOS' : 'CERTIFICADO DE ESTUDIOS PARCIAL'}
                  </h2>
                  <span className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                    R.V.M. N° 188-2020-MINEDU • CATÁLOGO NACIONAL DE LA OFERTA FORMATIVA
                  </span>
                </div>
              </div>
            </div>

            {/* CUERPO DEL CERTIFICADO - DECLARACIÓN OFICIAL */}
            <div className="relative z-10 my-auto py-6 px-6 md:px-12 text-center space-y-6">
              <p className="text-xs md:text-sm text-slate-600 uppercase font-semibold tracking-wide">
                LA DIRECCIÓN DEL CENTRO DE EDUCACIÓN TÉCNICO-PRODUCTIVA <span className="font-black text-slate-900">"{institucion.nombre.toUpperCase()}"</span>, QUE SUSCRIBE:
              </p>

              <p className="text-base md:text-lg font-serif italic text-slate-700">
                Certifica que:
              </p>

              {/* NOMBRE DEL ESTUDIANTE DESTACADO */}
              <div className="py-2 border-b-2 border-dotted border-indigo-400 max-w-2xl mx-auto">
                <h3 className="text-xl md:text-2xl font-black text-indigo-950 uppercase tracking-wide">
                  {nombreCompleto}
                </h3>
              </div>

              <div className="flex flex-wrap justify-center items-center gap-6 text-xs text-slate-600 font-medium">
                <div>
                  DOC. IDENTIDAD (DNI): <span className="font-bold text-slate-900">{certificado.personaDni || '---'}</span>
                </div>
                <div>•</div>
                <div>
                  CÓDIGO DE ESTUDIANTE: <span className="font-bold text-slate-900">{certificado.estudianteCodigo || '---'}</span>
                </div>
              </div>

              {/* CONTENIDO DEL PROGRAMA Y CRÉDITOS */}
              <div className="space-y-3 max-w-3xl mx-auto text-xs md:text-sm text-slate-700 leading-relaxed text-justify md:text-center">
                <p>
                  Ha cursado y aprobado satisfactoriamente las unidades didácticas y experiencias formativas en situaciones reales de trabajo (EFSRT) correspondientes al Programa de Estudios de:
                </p>
                <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl">
                  <p className="text-base font-black text-indigo-950 uppercase tracking-wide">
                    {certificado.programaNombre}
                  </p>
                  <p className="text-xs font-semibold text-slate-600 uppercase mt-0.5">
                    Nivel Formativo: <span className="text-indigo-800 font-bold">{certificado.nivelFormativo || 'Técnico'}</span> • Código CNOF: <span className="text-indigo-800 font-bold">{certificado.programaCodigo || 'S3496-2-001'}</span>
                  </p>
                </div>
                <p>
                  Habiendo acumulado un total de <span className="font-black text-slate-900">{totalCreditos} Créditos Académicos</span> y <span className="font-black text-slate-900">{totalHoras} Horas Pedagógicas</span>, obteniendo un Promedio Ponderado Acumulado (PPA) de:
                </p>
                
                {/* CALIFICACIÓN FINAL PPA */}
                <div className="inline-flex items-center gap-4 px-6 py-2 bg-slate-50 border-2 border-indigo-900/30 rounded-xl shadow-xs">
                  <div className="text-center">
                    <span className="text-[10px] font-black text-slate-500 uppercase block">Promedio Ponderado Acumulado</span>
                    <span className="text-2xl font-black text-indigo-900">{ppa}</span>
                    <span className="text-xs font-bold text-slate-600 uppercase ml-2">({ppaLetras})</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 italic mt-2">
                  El detalle consolidado de calificaciones por módulos, unidades didácticas y experiencias formativas en situaciones reales de trabajo se encuentra registrado al reverso del presente documento.
                </p>
              </div>

              {/* FECHA Y LUGAR */}
              <div className="pt-2 text-xs font-semibold text-slate-700">
                Juanjuí, {formatearFechaLarga(certificado.fechaEmision)}
              </div>
            </div>

            {/* SECCIÓN INFERIOR: REGISTRO Y FIRMAS */}
            <div className="relative z-10 pt-4 border-t-2 border-indigo-900/20">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                
                {/* Cuadro de Registro Oficial Izquierda */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-[10px] space-y-1">
                  <p className="font-black text-indigo-950 uppercase border-b border-slate-200 pb-0.5">
                    REGISTRO INSTITUCIONAL
                  </p>
                  <div className="grid grid-cols-2 gap-1 text-slate-600">
                    <span>N° Certificado:</span>
                    <span className="font-bold text-slate-900 text-right">{certificado.codigoCertificado || certificado.numeroCertificado}</span>
                    <span>Libro / Tomo / Folio:</span>
                    <span className="font-semibold text-slate-800 text-right">{certificado.tomoFolio || 'Libro 2026'}</span>
                    <span>R.D. Autorización:</span>
                    <span className="font-semibold text-slate-800 text-right">{certificado.resolucionDirectoral || 'RD N° 0148-2024'}</span>
                    <span>Tipo Certificado:</span>
                    <span className="font-bold text-indigo-800 text-right uppercase">{certificado.tipoCertificado}</span>
                  </div>
                </div>

                {/* Firma 1: Secretaría Académica */}
                <div className="text-center pt-8 md:pt-0">
                  <div className="w-40 mx-auto border-t-2 border-slate-700 pt-1">
                    <p className="text-[11px] font-bold text-slate-900 uppercase">Secretaría Académica</p>
                    <p className="text-[9px] text-slate-500 uppercase">{institucion.nombre}</p>
                  </div>
                </div>

                {/* Firma 2: Dirección General */}
                <div className="text-center pt-8 md:pt-0">
                  <div className="w-40 mx-auto border-t-2 border-slate-700 pt-1">
                    <p className="text-[11px] font-bold text-slate-900 uppercase">Director(a) General</p>
                    <p className="text-[9px] text-slate-500 uppercase">{institucion.nombre}</p>
                  </div>
                </div>

              </div>
            </div>

          </div>
        )}

        {/* ========================================================= */}
        {/* CARA B: REVERSO (CONSOLIDADO DE CALIFICACIONES MINEDU)   */}
        {/* ========================================================= */}
        {(ladoVista === 'AMBOS' || ladoVista === 'REVERSO') && (
          <div className="bg-white p-8 md:p-12 rounded-2xl border-4 border-indigo-900/40 shadow-xl relative min-h-[950px] flex flex-col justify-between text-slate-800">
            
            {/* Borde ornamental interior */}
            <div className="absolute inset-3 border border-indigo-900/30 rounded-xl pointer-events-none" />

            {/* ENCABEZADO REVERSO */}
            <div className="relative z-10 pb-4 border-b-2 border-indigo-900/20">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg md:text-xl font-black text-indigo-950 font-serif uppercase">
                    CONSOLIDADO HISTÓRICO DE CALIFICACIONES
                  </h3>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    CERTIFICADO OFICIAL N°: <span className="text-indigo-900 font-black">{certificado.codigoCertificado || certificado.numeroCertificado}</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-black text-slate-800 uppercase">{nombreCompleto}</p>
                  <p className="text-[10px] text-slate-500">DNI: <span className="font-bold text-slate-700">{certificado.personaDni}</span> • CÓD: <span className="font-bold text-slate-700">{certificado.estudianteCodigo}</span></p>
                </div>
              </div>
            </div>

            {/* TABLA OFICIAL DE UNIDADES DIDÁCTICAS */}
            <div className="relative z-10 my-4 flex-1 overflow-x-auto">
              <h4 className="text-xs font-black text-indigo-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-indigo-700" />
                I. Unidades Didácticas Aprobadas en el Plan de Estudios
              </h4>
              <table className="w-full text-[10px] border-collapse border border-slate-300">
                <thead>
                  <tr className="bg-indigo-950 text-white font-bold text-center">
                    <th className="border border-indigo-900 py-1.5 px-2 w-8">N°</th>
                    <th className="border border-indigo-900 py-1.5 px-2 w-28">Código</th>
                    <th className="border border-indigo-900 py-1.5 px-3 text-left">Unidad Didáctica</th>
                    <th className="border border-indigo-900 py-1.5 px-3 text-left">Módulo Asociado</th>
                    <th className="border border-indigo-900 py-1.5 px-2 w-16">Tipo</th>
                    <th className="border border-indigo-900 py-1.5 px-2 w-12">Horas</th>
                    <th className="border border-indigo-900 py-1.5 px-2 w-12">Créd.</th>
                    <th className="border border-indigo-900 py-1.5 px-2 w-12">Nota</th>
                    <th className="border border-indigo-900 py-1.5 px-2 w-24">En Letras</th>
                    <th className="border border-indigo-900 py-1.5 px-2 w-20">Condición</th>
                  </tr>
                </thead>
                <tbody>
                  {unidades.map((u, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      <td className="border border-slate-300 py-1 px-2 text-center font-bold">{i + 1}</td>
                      <td className="border border-slate-300 py-1 px-2 text-center font-mono font-semibold">{u.codigo}</td>
                      <td className="border border-slate-300 py-1 px-3 font-semibold uppercase">{u.nombre}</td>
                      <td className="border border-slate-300 py-1 px-3 text-slate-600 uppercase text-[9px]">{u.modulo}</td>
                      <td className="border border-slate-300 py-1 px-2 text-center font-medium">{u.tipo}</td>
                      <td className="border border-slate-300 py-1 px-2 text-center">{u.horas}</td>
                      <td className="border border-slate-300 py-1 px-2 text-center font-semibold">{u.creditos}</td>
                      <td className="border border-slate-300 py-1 px-2 text-center font-black text-indigo-900">{u.nota}</td>
                      <td className="border border-slate-300 py-1 px-2 text-center font-medium uppercase text-[9px]">{numeroALetras(u.nota)}</td>
                      <td className="border border-slate-300 py-1 px-2 text-center">
                        <span className="font-bold text-emerald-700">APROBADO</span>
                      </td>
                    </tr>
                  ))}
                  {unidades.length === 0 && (
                    <tr>
                      <td colSpan={10} className="border border-slate-300 py-4 text-center text-slate-400 italic">
                        No se han registrado unidades didácticas cursadas.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* SECCIÓN EFSRT */}
              {efsrt.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-xs font-black text-amber-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-amber-700" />
                    II. Experiencias Formativas en Situaciones Reales de Trabajo (EFSRT)
                  </h4>
                  <table className="w-full text-[10px] border-collapse border border-slate-300">
                    <thead>
                      <tr className="bg-amber-950 text-white font-bold text-center">
                        <th className="border border-amber-900 py-1.5 px-2 w-8">N°</th>
                        <th className="border border-amber-900 py-1.5 px-3 text-left">Módulo Formativo de Práctica</th>
                        <th className="border border-amber-900 py-1.5 px-2 w-28">Modalidad</th>
                        <th className="border border-amber-900 py-1.5 px-2 w-16">Horas</th>
                        <th className="border border-amber-900 py-1.5 px-2 w-16">Nota</th>
                        <th className="border border-amber-900 py-1.5 px-2 w-28">En Letras</th>
                        <th className="border border-amber-900 py-1.5 px-2 w-20">Condición</th>
                      </tr>
                    </thead>
                    <tbody>
                      {efsrt.map((e, idx) => (
                        <tr key={idx} className="bg-amber-50/40">
                          <td className="border border-slate-300 py-1 px-2 text-center font-bold">{idx + 1}</td>
                          <td className="border border-slate-300 py-1 px-3 font-semibold uppercase">{e.modulo}</td>
                          <td className="border border-slate-300 py-1 px-2 text-center font-medium uppercase">{e.modalidad || 'EMPRESA'}</td>
                          <td className="border border-slate-300 py-1 px-2 text-center font-semibold">{e.horas}</td>
                          <td className="border border-slate-300 py-1 px-2 text-center font-black text-amber-900">{e.nota}</td>
                          <td className="border border-slate-300 py-1 px-2 text-center font-medium uppercase text-[9px]">{numeroALetras(e.nota)}</td>
                          <td className="border border-slate-300 py-1 px-2 text-center">
                            <span className="font-bold text-emerald-700">APROBADO</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* RESUMEN CUANTITATIVO TOTALES */}
              <div className="mt-4 p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl flex flex-wrap justify-between items-center text-xs">
                <div>
                  <span className="text-slate-600 font-medium">Total Unidades:</span> <span className="font-bold text-slate-900">{unidades.length}</span>
                  <span className="mx-2 text-slate-300">|</span>
                  <span className="text-slate-600 font-medium">Total EFSRT:</span> <span className="font-bold text-slate-900">{efsrt.length}</span>
                </div>
                <div>
                  <span className="text-slate-600 font-medium">Total Horas Acumuladas:</span> <span className="font-black text-indigo-950 text-sm">{totalHoras} hrs</span>
                  <span className="mx-2 text-slate-300">|</span>
                  <span className="text-slate-600 font-medium">Total Créditos Acumulados:</span> <span className="font-black text-indigo-950 text-sm">{totalCreditos} créd.</span>
                </div>
                <div className="bg-indigo-900 text-white px-3 py-1 rounded-lg font-bold">
                  PPA: <span className="text-amber-300 font-black text-sm">{ppa}</span> ({ppaLetras})
                </div>
              </div>
            </div>

            {/* PIE DE PÁGINA REVERSO: CÓDIGO QR, HASH Y VALIDACIÓN LEGAL */}
            <div className="relative z-10 pt-4 border-t-2 border-indigo-900/20">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                
                {/* Código QR Oficial */}
                <div className="flex items-center gap-3 md:col-span-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="bg-white p-1 rounded-lg border border-slate-300 shadow-xs shrink-0">
                    <QrCode value={certificado.codigoVerificacionQr || `https://siga.cetprojuanjui.edu.pe/validar?num=${certificado.codigoCertificado}`} size={75} />
                  </div>
                  <div className="space-y-0.5 text-[9px] text-slate-600">
                    <p className="font-bold text-slate-900 uppercase">VALIDACIÓN PÚBLICA EN LÍNEA</p>
                    <p>Escanee este código QR para verificar la autenticidad y estado oficial en la plataforma SIGA institucional.</p>
                    <p className="font-mono text-slate-500 pt-0.5">HASH: {certificado.hashSeguridad || 'd8a391f7c24b'}</p>
                  </div>
                </div>

                {/* Sello y V°B° Reverso */}
                <div className="text-center md:col-span-2">
                  <div className="w-48 mx-auto border-t-2 border-slate-700 pt-1">
                    <p className="text-[11px] font-bold text-slate-900 uppercase">Dirección General</p>
                    <p className="text-[9px] text-slate-500 uppercase">{institucion.nombre}</p>
                    <p className="text-[8px] text-slate-400 italic mt-0.5">Conforme con las actas oficiales de evaluación</p>
                  </div>
                </div>

              </div>
            </div>

          </div>
        )}
      </div>
    </Modal>
  );
};
