import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { TituloDetallado } from '../../types';
import { Modal } from '../common/Modal';
import { QrCode } from '../common/QrCode';
import { 
  Printer, 
  Award, 
  ShieldCheck, 
  FileCheck2, 
  GraduationCap, 
  Users, 
  BookOpen, 
  CheckCircle2, 
  Building2,
  Calendar,
  Clock,
  FileText
} from 'lucide-react';

interface TituloOficialModalProps {
  isOpen: boolean;
  onClose: () => void;
  titulo: TituloDetallado;
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

export const TituloOficialModal: React.FC<TituloOficialModalProps> = ({
  isOpen,
  onClose,
  titulo
}) => {
  const { institucion } = useApp();
  const [seccionActiva, setSeccionActiva] = useState<'TITULO' | 'ACTA'>('TITULO');
  const [ladoVista, setLadoVista] = useState<'AMBOS' | 'ANVERSO' | 'REVERSO'>('AMBOS');

  const handlePrint = () => {
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const nombreCompleto = `${titulo.personaApellidoPaterno || ''} ${titulo.personaApellidoMaterno || ''}, ${titulo.personaNombres || ''}`.trim();
  const esTecnico = (titulo.nivelFormativo || '').toLowerCase().includes('tÃ©cnico') && !(titulo.nivelFormativo || '').toLowerCase().includes('auxiliar');
  const modeloAnexo = esTecnico ? 'ANEXO NÂ° 5A' : 'ANEXO NÂ° 5B';
  const denominacionFinal = titulo.denominacionTitulo || (esTecnico ? `TÃ‰CNICO EN ${(titulo.programaNombre || '').toUpperCase()}` : `AUXILIAR TÃ‰CNICO EN ${(titulo.programaNombre || '').toUpperCase()}`);

  const jurado = titulo.juradoCalificador || {
    presidente: { nombre: 'Lic. Carlos Silva Ramos', cargo: 'Docente Formador Principal', dni: '01234567' },
    secretario: { nombre: 'Lic. Ana Torres Pezo', cargo: 'Docente de Especialidad', dni: '02345678' },
    vocal: { nombre: 'Lic. Marcos RÃ­os del Castillo', cargo: 'Docente Evaluador', dni: '03456789' }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      size="full"
    >
      <div className="flex flex-col h-full">
        {/* Barra superior de herramientas (oculta al imprimir) */}
        <div className="print:hidden bg-slate-900 text-white px-6 py-4 rounded-t-lg flex flex-wrap items-center justify-between gap-4 border-b border-slate-700 shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white tracking-wide">
                  {seccionActiva === 'TITULO' ? `TÃ­tulo Oficial a Nombre de la NaciÃ³n (${modeloAnexo})` : 'Acta Oficial de SustentaciÃ³n de TitulaciÃ³n'}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950 text-emerald-300 border border-emerald-700">
                  {titulo.codigoTitulo || 'TIT-2026'}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-950 text-blue-300 border border-blue-700">
                  {titulo.nivelFormativo || (esTecnico ? 'TÃ©cnico' : 'Auxiliar TÃ©cnico')}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                R.V.M. NÂ° 188-2020-MINEDU â€¢ Graduado(a): <strong className="text-white">{nombreCompleto}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Selector de SecciÃ³n: TÃ­tulo vs Acta */}
            <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700">
              <button
                type="button"
                onClick={() => setSeccionActiva('TITULO')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all ${
                  seccionActiva === 'TITULO'
                    ? 'bg-amber-600 text-white shadow-sm font-semibold'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                TÃ­tulo ({modeloAnexo})
              </button>
              <button
                type="button"
                onClick={() => setSeccionActiva('ACTA')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all ${
                  seccionActiva === 'ACTA'
                    ? 'bg-amber-600 text-white shadow-sm font-semibold'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <FileCheck2 className="w-3.5 h-3.5" />
                Acta de SustentaciÃ³n
              </button>
            </div>

            {seccionActiva === 'TITULO' && (
              <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700">
                <button
                  type="button"
                  onClick={() => setLadoVista('AMBOS')}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                    ladoVista === 'AMBOS'
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Ambos Lados
                </button>
                <button
                  type="button"
                  onClick={() => setLadoVista('ANVERSO')}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                    ladoVista === 'ANVERSO'
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Anverso
                </button>
                <button
                  type="button"
                  onClick={() => setLadoVista('REVERSO')}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                    ladoVista === 'REVERSO'
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Reverso
                </button>
              </div>
            )}

            <button
              onClick={handlePrint}
              type="button"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-sm transition-all"
            >
              <Printer className="w-4 h-4" />
              Imprimir Documento
            </button>
          </div>
        </div>

        {/* Contenedor del documento imprimible */}
        <div className="flex-1 overflow-y-auto bg-slate-100 p-4 md:p-8 flex flex-col items-center">
          
          {/* ======================================================== */}
          {/* VISTA 1: TÃTULO OFICIAL A NOMBRE DE LA NACIÃ“N (ANEXOS 5A / 5B) */}
          {/* ======================================================== */}
          {seccionActiva === 'TITULO' && (
            <div className="w-full max-w-5xl flex flex-col gap-8">
              
              {/* --- ANVERSO DEL TÃTULO (DIPLOMA SOLEMNE) --- */}
              {(ladoVista === 'AMBOS' || ladoVista === 'ANVERSO') && (
                <div 
                  className="w-full bg-amber-50/40 rounded-xl border-8 border-double border-amber-900/60 p-8 md:p-12 shadow-2xl relative overflow-hidden text-slate-900 print:border-8 print:shadow-none print:m-0 print:p-8"
                  style={{
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                    background: '#FEFDFB'
                  }}
                >
                  {/* Marca de agua de fondo y bordes ornamentales */}
                  <div className="absolute inset-2 border-2 border-amber-800/30 pointer-events-none rounded-lg" />
                  <div className="absolute inset-3 border border-amber-700/20 pointer-events-none rounded-md" />

                  {/* Encabezado solemne */}
                  <div className="text-center relative z-10 space-y-1">
                    <div className="inline-flex items-center justify-center p-2 rounded-full mb-1">
                      {institucion.logoUrl ? (
                        <img src={institucion.logoUrl} alt="Escudo CETPRO" className="h-16 w-auto object-contain mx-auto" />
                      ) : (
                        <div className="w-16 h-16 rounded-full border-2 border-amber-800 flex items-center justify-center text-amber-900 bg-amber-100/50 mx-auto">
                          <Building2 className="w-8 h-8" />
                        </div>
                      )}
                    </div>
                    <p className="text-xs font-bold tracking-widest text-slate-600 uppercase">
                      RepÃºblica del PerÃº â€¢ Ministerio de EducaciÃ³n
                    </p>
                    <p className="text-xs font-semibold text-slate-500 tracking-wide uppercase">
                      DirecciÃ³n Regional de EducaciÃ³n de San MartÃ­n â€¢ UGEL Mariscal CÃ¡ceres
                    </p>
                    <h2 className="text-xl font-serif font-black text-amber-950 tracking-wider uppercase pt-2">
                      {institucion.nombre}
                    </h2>
                    <p className="text-xs font-medium text-slate-500">
                      CÃ“DIGO MODULAR: {institucion.codigoModular} â€¢ D.S. NÂ° 004-2019-MINEDU / R.V.M. NÂ° 188-2020-MINEDU
                    </p>
                  </div>

                  {/* Leyenda central solemne */}
                  <div className="text-center my-6 relative z-10">
                    <div className="inline-block border-y-2 border-amber-800/60 py-2 px-10">
                      <h1 className="text-2xl md:text-3xl font-serif font-black tracking-widest text-amber-900 uppercase">
                        A NOMBRE DE LA NACIÃ“N
                      </h1>
                    </div>
                    <p className="text-xs text-slate-600 uppercase tracking-widest mt-2">
                      {modeloAnexo} â€¢ {esTecnico ? 'TÃTULO DE TÃ‰CNICO' : 'TÃTULO DE AUXILIAR TÃ‰CNICO'}
                    </p>
                  </div>

                  {/* Cuerpo del TÃ­tulo */}
                  <div className="text-center space-y-4 relative z-10 max-w-3xl mx-auto font-serif">
                    <p className="text-sm md:text-base text-slate-700 italic">
                      Por cuanto:
                    </p>
                    <h3 className="text-xl md:text-2xl font-black text-slate-900 tracking-wider underline decoration-amber-600/50 decoration-2 underline-offset-8 uppercase font-sans">
                      {nombreCompleto}
                    </h3>
                    <p className="text-xs md:text-sm text-slate-600 font-sans">
                      Identificado(a) con Documento Nacional de Identidad NÂ° <strong className="text-slate-800">{titulo.personaDni}</strong>
                    </p>

                    <p className="text-xs md:text-sm text-slate-700 leading-relaxed pt-2">
                      Ha cumplido satisfactoriamente con la totalidad de los mÃ³dulos formativos, horas y crÃ©ditos acadÃ©micos, y demÃ¡s requisitos establecidos en la normativa vigente del Ministerio de EducaciÃ³n, por tanto se le confiere el:
                    </p>

                    {/* MenciÃ³n del TÃ­tulo enmarcado */}
                    <div className="py-4 px-6 bg-amber-100/50 rounded-lg border-2 border-amber-800/40 my-4 inline-block max-w-2xl">
                      <p className="text-xs uppercase tracking-widest text-amber-900 font-bold font-sans">
                        TÃTULO DE:
                      </p>
                      <h2 className="text-lg md:text-xl font-black text-amber-950 uppercase tracking-wide mt-1 font-sans">
                        {denominacionFinal}
                      </h2>
                      <div className="flex justify-center gap-6 text-xs text-slate-700 font-sans mt-2 pt-2 border-t border-amber-800/20">
                        <span>Nivel Formativo: <strong>{titulo.nivelFormativo || (esTecnico ? 'TÃ©cnico' : 'Auxiliar TÃ©cnico')}</strong></span>
                        <span>Total Horas: <strong>{titulo.totalHorasAcumuladas || (esTecnico ? 1760 : 950)} hrs</strong></span>
                        <span>CrÃ©ditos: <strong>{titulo.totalCreditosAcumulados || (esTecnico ? 80 : 40)} crÃ©ditos</strong></span>
                      </div>
                    </div>

                    <p className="text-xs md:text-sm text-slate-700">
                      Por tanto, se expide el presente TÃ­tulo para que se le reconozca como tal y se le otorguen los derechos, prerrogativas y privilegios que las leyes de la RepÃºblica le confieren.
                    </p>

                    <p className="text-xs text-slate-600 italic pt-2">
                      Dado en la ciudad de JuanjuÃ­, a los {formatearFechaLarga(titulo.fechaEmision || new Date().toISOString().split('T')[0])}.
                    </p>
                  </div>

                  {/* SecciÃ³n de Firmas Anverso */}
                  <div className="grid grid-cols-2 gap-12 mt-16 pt-4 relative z-10 text-center text-xs font-sans">
                    <div>
                      <div className="border-t-2 border-slate-700 pt-2 w-64 mx-auto">
                        <p className="font-bold text-slate-900 uppercase">DIRECTOR(A) GENERAL</p>
                        <p className="text-slate-600">{institucion.nombre}</p>
                      </div>
                    </div>
                    <div>
                      <div className="border-t-2 border-slate-700 pt-2 w-64 mx-auto">
                        <p className="font-bold text-slate-900 uppercase">DIRECTOR(A) UGEL MARISCAL CÃCERES</p>
                        <p className="text-slate-600">DirecciÃ³n Regional de EducaciÃ³n San MartÃ­n</p>
                      </div>
                    </div>
                  </div>

                  {/* Pie de pÃ¡gina con cÃ³digo */}
                  <div className="mt-8 pt-3 border-t border-amber-800/20 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                    <span>CÃ“DIGO OFICIAL: {titulo.codigoTitulo || 'TIT-2026'}</span>
                    <span>REGISTRO NACIONAL: {titulo.codigoRegistroNacional || 'MINEDU-TIT-2026'}</span>
                    <span>HASH: {titulo.hashSeguridad || 'AUTENTICADO'}</span>
                  </div>
                </div>
              )}

              {/* --- REVERSO DEL TÃTULO (REGISTRO INSTITUCIONAL & SEGURIDAD) --- */}
              {(ladoVista === 'AMBOS' || ladoVista === 'REVERSO') && (
                <div 
                  className="w-full bg-white rounded-xl border-4 border-slate-300 p-8 md:p-12 shadow-xl relative text-slate-900 print:border-2 print:shadow-none print:m-0 print:p-8"
                  style={{ minHeight: '600px' }}
                >
                  <div className="border-b-2 border-slate-800 pb-3 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                        REVERSO DEL TÃTULO â€¢ REGISTRO INSTITUCIONAL Y VISACIÃ“N OFICIAL
                      </h3>
                      <p className="text-xs text-slate-500">
                        Conforme al Numeral 8 de la R.V.M. NÂ° 188-2020-MINEDU
                      </p>
                    </div>
                    <span className="text-xs font-bold font-mono px-3 py-1 bg-slate-100 rounded border border-slate-300">
                      {titulo.codigoTitulo}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
                    {/* Columna Izquierda: Registro del CETPRO */}
                    <div className="border border-slate-300 rounded-lg p-5 bg-slate-50/50 space-y-3">
                      <div className="flex items-center gap-2 text-blue-900 border-b border-slate-200 pb-2">
                        <BookOpen className="w-4 h-4" />
                        <h4 className="text-xs font-bold uppercase tracking-wider">
                          1. Registro Institucional en el CETPRO
                        </h4>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between border-b border-slate-200/70 pb-1">
                          <span className="text-slate-500">ResoluciÃ³n Directoral de TitulaciÃ³n:</span>
                          <span className="font-bold text-slate-800">{titulo.resolucionDirectoral || 'RD NÂ° 0180-2026-DRE-SM'}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-200/70 pb-1">
                          <span className="text-slate-500">Libro de Registro Oficial:</span>
                          <span className="font-semibold text-slate-800">{titulo.libroRegistro || 'Libro Oficial de TÃ­tulos 2026'}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-200/70 pb-1">
                          <span className="text-slate-500">Tomo y Folio:</span>
                          <span className="font-semibold text-slate-800">{titulo.tomoFolio || 'Libro 2026, Tomo 01, Folio 01'}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-200/70 pb-1">
                          <span className="text-slate-500">Acta de SustentaciÃ³n NÂ°:</span>
                          <span className="font-bold text-blue-800">{titulo.numeroActaSustentacion || 'ACT-TIT-2026'}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-200/70 pb-1">
                          <span className="text-slate-500">Modalidad de TitulaciÃ³n:</span>
                          <span className="font-semibold text-slate-800">
                            {titulo.modalidadTitulacion === 'TRABAJO_APLICACION_PROFESIONAL' ? 'Trabajo de AplicaciÃ³n Profesional' : 'Examen de Suficiencia Profesional'}
                          </span>
                        </div>
                        <div className="flex justify-between border-b border-slate-200/70 pb-1">
                          <span className="text-slate-500">CalificaciÃ³n de SustentaciÃ³n:</span>
                          <span className="font-bold text-emerald-700">{titulo.calificacion != null ? `${Number(titulo.calificacion).toFixed(1)}/20 (${titulo.calificacionLetras || ''})` : 'Aprobado'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Fecha de ExpediciÃ³n:</span>
                          <span className="font-semibold text-slate-800">{formatearFechaLarga(titulo.fechaEmision)}</span>
                        </div>
                      </div>

                      {/* Espacio para firma institucional */}
                      <div className="pt-8 text-center">
                        <div className="border-t border-slate-400 w-48 mx-auto pt-1">
                          <p className="text-[10px] font-bold text-slate-800 uppercase">SECRETARÃA ACADÃ‰MICA</p>
                          <p className="text-[9px] text-slate-500">{institucion.nombre}</p>
                        </div>
                      </div>
                    </div>

                    {/* Columna Derecha: VisaciÃ³n UGEL y AutenticaciÃ³n QR */}
                    <div className="border border-slate-300 rounded-lg p-5 bg-slate-50/50 space-y-4">
                      <div className="flex items-center gap-2 text-emerald-900 border-b border-slate-200 pb-2">
                        <ShieldCheck className="w-4 h-4" />
                        <h4 className="text-xs font-bold uppercase tracking-wider">
                          2. VisaciÃ³n UGEL y Seguridad CriptogrÃ¡fica
                        </h4>
                      </div>

                      <div className="flex items-center justify-center p-3 bg-white rounded border border-slate-200">
                        {titulo.codigoVerificacionQr ? (
                          <div className="text-center">
                            <QrCode 
                              data={titulo.codigoVerificacionQr}
                              size={120}
                              className="mx-auto"
                            />
                            <p className="text-[9px] text-slate-500 mt-1 font-mono">
                              VerificaciÃ³n Digital RVM 188
                            </p>
                          </div>
                        ) : (
                          <div className="w-24 h-24 bg-slate-100 flex items-center justify-center text-slate-400 text-xs">
                            CÃ³digo QR
                          </div>
                        )}
                      </div>

                      <div className="space-y-1.5 text-xs">
                        <div className="flex justify-between border-b border-slate-200/70 pb-1">
                          <span className="text-slate-500">Registro Nacional MINEDU:</span>
                          <span className="font-mono font-bold text-slate-800">{titulo.codigoRegistroNacional || 'MINEDU-TIT-2026'}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-200/70 pb-1">
                          <span className="text-slate-500">Fecha de Visado UGEL:</span>
                          <span className="font-semibold text-slate-800">{formatearFechaLarga(titulo.fechaVisadoUgel) || 'En trÃ¡mite de visaciÃ³n'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Firma Digital Hash SHA-256:</span>
                          <span className="font-mono text-[10px] text-slate-700 bg-slate-100 px-1 py-0.5 rounded">{titulo.hashSeguridad || 'd41d8cd98f00'}</span>
                        </div>
                      </div>

                      {/* Espacio para sello de UGEL */}
                      <div className="pt-4 text-center">
                        <div className="border border-dashed border-slate-400 rounded p-4 text-[10px] text-slate-400 uppercase">
                          Espacio reservado para Sello y VisaciÃ³n de UGEL Mariscal CÃ¡ceres
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* ======================================================== */}
          {/* VISTA 2: ACTA OFICIAL DE SUSTENTACIÃ“N / TITULACIÃ“N */}
          {/* ======================================================== */}
          {seccionActiva === 'ACTA' && (
            <div className="w-full max-w-4xl bg-white rounded-xl border border-slate-300 p-8 md:p-12 shadow-xl text-slate-900 print:border-none print:shadow-none print:m-0 print:p-6">
              
              {/* Encabezado del Acta */}
              <div className="text-center border-b-2 border-slate-900 pb-4 space-y-1">
                <p className="text-xs font-bold tracking-widest text-slate-600 uppercase">
                  Ministerio de EducaciÃ³n â€¢ DRE San MartÃ­n â€¢ UGEL Mariscal CÃ¡ceres
                </p>
                <h2 className="text-lg font-black text-slate-900 uppercase">
                  {institucion.nombre}
                </h2>
                <p className="text-xs text-slate-500">
                  CÃ“DIGO MODULAR: {institucion.codigoModular} â€¢ R.V.M. NÂ° 188-2020-MINEDU
                </p>
                <div className="pt-2">
                  <span className="inline-block px-4 py-1 rounded bg-slate-900 text-white font-bold text-sm tracking-wider uppercase">
                    ACTA OFICIAL DE SUSTENTACIÃ“N DE TITULACIÃ“N
                  </span>
                  <p className="text-xs font-mono font-bold text-slate-700 mt-1">
                    NÂ° {titulo.numeroActaSustentacion || 'ACT-TIT-2026-0001'}
                  </p>
                </div>
              </div>

              {/* Contenido legal del Acta */}
              <div className="mt-6 space-y-4 text-xs md:text-sm text-slate-800 leading-relaxed text-justify">
                <p>
                  En las instalaciones del <strong>{institucion.nombre}</strong>, ubicado en {institucion.direccion || 'JuanjuÃ­'}, a las <strong>{titulo.horaSustentacion || '10:00 AM'}</strong> del dÃ­a <strong>{formatearFechaLarga(titulo.fechaSustentacion || titulo.fechaEmision)}</strong>, se constituyÃ³ el <strong>JURADO CALIFICADOR</strong> designado mediante ResoluciÃ³n Directoral correspondiente, integrado por los siguientes docentes:
                </p>

                {/* Lista de Miembros del Jurado */}
                <div className="bg-slate-50 border border-slate-300 rounded-lg p-4 space-y-2 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                    <div>
                      <strong className="text-blue-900">PRESIDENTE(A):</strong> {jurado.presidente?.nombre || 'Docente Designado'}
                    </div>
                    <div className="text-slate-500">
                      DNI: {jurado.presidente?.dni || '--------'} â€¢ Cargo: {jurado.presidente?.cargo || 'Docente'}
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                    <div>
                      <strong className="text-blue-900">SECRETARIO(A):</strong> {jurado.secretario?.nombre || 'Docente Designado'}
                    </div>
                    <div className="text-slate-500">
                      DNI: {jurado.secretario?.dni || '--------'} â€¢ Cargo: {jurado.secretario?.cargo || 'Docente'}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <strong className="text-blue-900">VOCAL:</strong> {jurado.vocal?.nombre || 'Docente Designado'}
                    </div>
                    <div className="text-slate-500">
                      DNI: {jurado.vocal?.dni || '--------'} â€¢ Cargo: {jurado.vocal?.cargo || 'Docente'}
                    </div>
                  </div>
                </div>

                <p>
                  Para calificar la sustentaciÃ³n del graduando(a) <strong>{nombreCompleto}</strong>, identificado(a) con DNI NÂ° <strong>{titulo.personaDni}</strong>, egresado(a) del Programa de Estudio <strong>{titulo.programaNombre}</strong> conducente a la obtenciÃ³n del TÃ­tulo Oficial de <strong>{denominacionFinal}</strong> ({titulo.nivelFormativo}).
                </p>

                <p>
                  <strong>Modalidad de TitulaciÃ³n:</strong> {titulo.modalidadTitulacion === 'TRABAJO_APLICACION_PROFESIONAL' ? 'TRABAJO DE APLICACIÃ“N PROFESIONAL' : 'EXAMEN DE SUFICIENCIA PROFESIONAL'}.
                </p>

                <p>
                  <strong>TÃ­tulo del Trabajo / EvaluaciÃ³n:</strong> "{titulo.tituloProyecto || 'ImplementaciÃ³n y AplicaciÃ³n TÃ©cnica de Competencias Profesionales'}".
                </p>

                <p>
                  Concluido el acto de sustentaciÃ³n y absueltas las preguntas formuladas por los miembros del jurado evaluador, se procediÃ³ a la deliberaciÃ³n correspondiente, obteniÃ©ndose el siguiente resultado:
                </p>

                {/* Cuadro de CalificaciÃ³n y Resultado */}
                <div className="p-4 bg-emerald-50 border-2 border-emerald-600 rounded-lg flex flex-col md:flex-row items-center justify-around gap-4 text-center my-4">
                  <div>
                    <span className="text-[11px] text-emerald-800 uppercase font-semibold block">CALIFICACIÃ“N VIGESIMAL</span>
                    <span className="text-3xl font-black text-emerald-950 font-mono">
                      {titulo.calificacion != null ? Number(titulo.calificacion).toFixed(1) : '17.0'} / 20
                    </span>
                    <span className="text-xs text-emerald-800 font-bold block mt-0.5">
                      ({titulo.calificacionLetras || 'DIECISIETE'})
                    </span>
                  </div>

                  <div className="h-12 w-px bg-emerald-300 hidden md:block" />

                  <div>
                    <span className="text-[11px] text-emerald-800 uppercase font-semibold block">DICTAMEN FINAL DEL JURADO</span>
                    <span className="inline-block px-4 py-1.5 rounded-full text-sm font-black bg-emerald-700 text-white uppercase tracking-wider mt-1">
                      {titulo.resultadoSustentacion === 'APROBADO_UNANIMIDAD' ? 'APROBADO POR UNANIMIDAD' : 'APROBADO POR MAYORÃA'}
                    </span>
                  </div>
                </div>

                <p>
                  En fe de lo cual, siendo las horas seÃ±aladas, se da por concluido el acto acadÃ©mico de sustentaciÃ³n, firmando la presente acta los miembros del Jurado Calificador y el(la) graduando(a).
                </p>
              </div>

              {/* SecciÃ³n de Firmas del Acta */}
              <div className="grid grid-cols-3 gap-6 mt-16 pt-6 text-center text-xs border-t border-slate-200">
                <div>
                  <div className="border-t border-slate-700 pt-1 w-full mx-auto">
                    <p className="font-bold text-slate-900">{jurado.presidente?.nombre}</p>
                    <p className="text-[10px] text-slate-500 uppercase">PRESIDENTE DEL JURADO</p>
                    <p className="text-[10px] text-slate-400">DNI: {jurado.presidente?.dni}</p>
                  </div>
                </div>
                <div>
                  <div className="border-t border-slate-700 pt-1 w-full mx-auto">
                    <p className="font-bold text-slate-900">{jurado.secretario?.nombre}</p>
                    <p className="text-[10px] text-slate-500 uppercase">SECRETARIO DEL JURADO</p>
                    <p className="text-[10px] text-slate-400">DNI: {jurado.secretario?.dni}</p>
                  </div>
                </div>
                <div>
                  <div className="border-t border-slate-700 pt-1 w-full mx-auto">
                    <p className="font-bold text-slate-900">{jurado.vocal?.nombre}</p>
                    <p className="text-[10px] text-slate-500 uppercase">VOCAL DEL JURADO</p>
                    <p className="text-[10px] text-slate-400">DNI: {jurado.vocal?.dni}</p>
                  </div>
                </div>
              </div>

              <div className="mt-12 text-center text-xs">
                <div className="border-t border-slate-700 pt-1 w-64 mx-auto">
                  <p className="font-bold text-slate-900 uppercase">{nombreCompleto}</p>
                  <p className="text-[10px] text-slate-500 uppercase">GRADUANDO(A) TITULADO(A)</p>
                  <p className="text-[10px] text-slate-400">DNI: {titulo.personaDni}</p>
                </div>
              </div>

              {/* Pie de pÃ¡gina con hash y registro */}
              <div className="mt-8 pt-3 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                <span>ACTA: {titulo.numeroActaSustentacion}</span>
                <span>TÃTULO: {titulo.codigoTitulo}</span>
                <span>HASH: {titulo.hashSeguridad}</span>
              </div>
            </div>
          )}

        </div>
      </div>
    </Modal>
  );
};

