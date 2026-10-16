import React, { forwardRef } from 'react';
import { NotaEFSRT, ModuloFormativo, ProgramaEstudio, InstitucionInfo, Estudiante, Persona } from '../../types';
import { QrCode } from '../common/QrCode';

interface FichaEFSRTPrintProps {
  institucion: InstitucionInfo | null;
  programa: ProgramaEstudio;
  modulo: ModuloFormativo;
  estudiante: Estudiante | undefined;
  persona: Persona | undefined;
  notaEFSRT: NotaEFSRT | undefined;
  periodo: string;
}

const numeroALetras = (num: number): string => {
  const palabras: Record<number, string> = {
    0: 'CERO', 1: 'UNO', 2: 'DOS', 3: 'TRES', 4: 'CUATRO',
    5: 'CINCO', 6: 'SEIS', 7: 'SIETE', 8: 'OCHO', 9: 'NUEVE',
    10: 'DIEZ', 11: 'ONCE', 12: 'DOCE', 13: 'TRECE', 14: 'CATORCE',
    15: 'QUINCE', 16: 'DIECISÉIS', 17: 'DIECISIETE', 18: 'DIECIOCHO',
    19: 'DIECINUEVE', 20: 'VEINTE'
  };
  return palabras[Math.round(num)] || String(num);
};

export const FichaEFSRTPrint = forwardRef<HTMLDivElement, FichaEFSRTPrintProps>(
  ({ institucion, programa, modulo, estudiante, persona, notaEFSRT, periodo }, ref) => {
    if (!estudiante || !persona || !notaEFSRT) return null;

    const notaFinal = notaEFSRT.notaVigesimal || 0;
    const isAprobado = notaFinal >= 13;
    const nombreCompleto = `${persona.apellidoPaterno} ${persona.apellidoMaterno || ''}, ${persona.nombres}`.trim();
    const qrData = encodeURIComponent(
      `CETPRO JUANJUI|EFSRT|DNI:${persona.numeroDocumento}|MOD:${modulo.codigo}|NOTA:${notaFinal}|ESTADO:${notaEFSRT.estado || (isAprobado ? 'APROBADO' : 'DESAPROBADO')}`
    );

    const modalidadLabels: Record<string, string> = {
      'EMPRESA': 'En Centro Laboral / Empresa Productiva (Pública o Privada)',
      'PROYECTO_CETPRO': 'Proyecto Productivo o de Servicios del CETPRO',
      'COMUNIDAD': 'Actividades de Extensión o Servicio a la Comunidad',
      'CONVALIDACION': 'Convalidación por Experiencia Laboral Comprobada'
    };

    return (
      <div ref={ref} className="p-8 max-w-[210mm] mx-auto bg-white text-slate-900 font-sans text-xs print:m-0 print:p-6">
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            @page { size: A4 portrait; margin: 12mm 15mm; }
          }
        `}} />

        {/* Membrete Oficial */}
        <div className="border-b-2 border-slate-900 pb-3 mb-4 text-center">
          <div className="text-[10px] uppercase tracking-widest text-slate-600 font-bold">
            Gobierno Regional de San Martín • Dirección Regional de Educación de San Martín
          </div>
          <div className="text-[11px] font-bold text-slate-800 uppercase">
            Unidad de Gestión Educativa Local de Mariscal Cáceres - Juanjuí
          </div>
          <div className="text-base font-black text-slate-900 tracking-tight mt-0.5 uppercase">
            CENTRO DE EDUCACIÓN TÉCNICO-PRODUCTIVA "JUANJUÍ"
          </div>
          <div className="text-[10px] text-slate-600 font-mono mt-0.5">
            CÓDIGO MODULAR: {institucion?.codigoModular || '0427849'} • RUC: {institucion?.ruc || '20450143892'} • JUANJUÍ - PERÚ
          </div>
          <div className="mt-3 inline-block px-4 py-1 bg-slate-900 text-white font-bold text-xs rounded-sm uppercase tracking-wider">
            FICHA OFICIAL DE EVALUACIÓN Y ACREDITACIÓN DE EFSRT
          </div>
          <div className="text-[9px] text-slate-500 italic mt-0.5">
            (R.V.M. N° 188-2020-MINEDU / R.V.M. N° 277-2019-MINEDU - Lineamientos Académicos Generales CETPRO)
          </div>
        </div>

        {/* I. Datos del Estudiante */}
        <div className="mb-4">
          <div className="bg-slate-100 px-2 py-1 font-bold text-[11px] text-slate-800 border-l-4 border-slate-800 uppercase mb-2">
            I. DATOS DEL ESTUDIANTE Y PROGRAMA FORMATIVO
          </div>
          <table className="w-full border-collapse border border-slate-300 text-[11px]">
            <tbody>
              <tr>
                <td className="p-1.5 font-bold bg-slate-50 border border-slate-300 w-1/4">Apellidos y Nombres:</td>
                <td className="p-1.5 border border-slate-300 font-bold uppercase" colSpan={3}>{nombreCompleto}</td>
              </tr>
              <tr>
                <td className="p-1.5 font-bold bg-slate-50 border border-slate-300">N° Documento (DNI):</td>
                <td className="p-1.5 border border-slate-300 font-mono">{persona.numeroDocumento}</td>
                <td className="p-1.5 font-bold bg-slate-50 border border-slate-300 w-1/4">Periodo Lectivo:</td>
                <td className="p-1.5 border border-slate-300 font-mono">{periodo}</td>
              </tr>
              <tr>
                <td className="p-1.5 font-bold bg-slate-50 border border-slate-300">Programa de Estudios:</td>
                <td className="p-1.5 border border-slate-300" colSpan={3}>{programa.nombre} ({programa.nivelFormativo || 'Técnico'})</td>
              </tr>
              <tr>
                <td className="p-1.5 font-bold bg-slate-50 border border-slate-300">Módulo Formativo:</td>
                <td className="p-1.5 border border-slate-300" colSpan={3}>
                  <strong>{modulo.codigo}:</strong> {modulo.nombre}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* II. Datos del Centro de Prácticas */}
        <div className="mb-4">
          <div className="bg-slate-100 px-2 py-1 font-bold text-[11px] text-slate-800 border-l-4 border-slate-800 uppercase mb-2">
            II. DATOS DE LA ENTIDAD RECEPTORA Y EJECUCIÓN DE PRÁCTICAS
          </div>
          <table className="w-full border-collapse border border-slate-300 text-[11px]">
            <tbody>
              <tr>
                <td className="p-1.5 font-bold bg-slate-50 border border-slate-300 w-1/4">Modalidad EFSRT:</td>
                <td className="p-1.5 border border-slate-300" colSpan={3}>
                  {modalidadLabels[notaEFSRT.modalidad || 'EMPRESA'] || notaEFSRT.modalidad}
                </td>
              </tr>
              <tr>
                <td className="p-1.5 font-bold bg-slate-50 border border-slate-300">Razón Social / Empresa:</td>
                <td className="p-1.5 border border-slate-300 font-bold uppercase">{notaEFSRT.empresaNombre || '---'}</td>
                <td className="p-1.5 font-bold bg-slate-50 border border-slate-300 w-1/4">RUC Entidad:</td>
                <td className="p-1.5 border border-slate-300 font-mono">{notaEFSRT.empresaRuc || '---'}</td>
              </tr>
              <tr>
                <td className="p-1.5 font-bold bg-slate-50 border border-slate-300">Dirección / Ubicación:</td>
                <td className="p-1.5 border border-slate-300" colSpan={3}>{notaEFSRT.empresaDireccion || 'Juanjuí, Mariscal Cáceres'}</td>
              </tr>
              <tr>
                <td className="p-1.5 font-bold bg-slate-50 border border-slate-300">Supervisor de Empresa:</td>
                <td className="p-1.5 border border-slate-300">{notaEFSRT.supervisorEmpresa || '---'}</td>
                <td className="p-1.5 font-bold bg-slate-50 border border-slate-300">Cargo Supervisor:</td>
                <td className="p-1.5 border border-slate-300">{notaEFSRT.supervisorEmpresaCargo || 'Jefe de Operaciones / Taller'}</td>
              </tr>
              <tr>
                <td className="p-1.5 font-bold bg-slate-50 border border-slate-300">Periodo de Prácticas:</td>
                <td className="p-1.5 border border-slate-300 font-mono">
                  Del {notaEFSRT.fechaInicio || '---'} al {notaEFSRT.fechaTermino || '---'}
                </td>
                <td className="p-1.5 font-bold bg-slate-50 border border-slate-300">Horas Acreditadas:</td>
                <td className="p-1.5 border border-slate-300 font-bold font-mono">
                  {notaEFSRT.horasCompletadas || 120} Horas Cronológicas
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* III. Matriz de Evaluación de Indicadores */}
        <div className="mb-4">
          <div className="bg-slate-100 px-2 py-1 font-bold text-[11px] text-slate-800 border-l-4 border-slate-800 uppercase mb-2">
            III. CRITERIOS DE EVALUACIÓN DE COMPETENCIAS EN EL PUESTO DE TRABAJO
          </div>
          <table className="w-full border-collapse border border-slate-300 text-[11px]">
            <thead className="bg-slate-200 text-slate-800">
              <tr>
                <th className="p-1.5 border border-slate-300 w-10 text-center">N°</th>
                <th className="p-1.5 border border-slate-300 text-left">Dimensiones e Indicadores de Desempeño</th>
                <th className="p-1.5 border border-slate-300 w-24 text-center">Escala (0-20)</th>
                <th className="p-1.5 border border-slate-300 w-32 text-center">Calificación Obtenida</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-1.5 border border-slate-300 text-center font-mono font-bold">1</td>
                <td className="p-1.5 border border-slate-300">
                  <div className="font-bold">Dominio Operativo / Técnico</div>
                  <div className="text-[10px] text-slate-500">Aplica procesos, técnicas y destrezas del módulo en situaciones reales.</div>
                </td>
                <td className="p-1.5 border border-slate-300 text-center text-slate-500 font-mono">0 a 20</td>
                <td className="p-1.5 border border-slate-300 text-center font-mono font-bold text-sm">
                  {(notaEFSRT.dominioOperativo || 0).toString().padStart(2, '0')}
                </td>
              </tr>
              <tr>
                <td className="p-1.5 border border-slate-300 text-center font-mono font-bold">2</td>
                <td className="p-1.5 border border-slate-300">
                  <div className="font-bold">Uso y Cuidado de Equipos, Máquinas y Herramientas</div>
                  <div className="text-[10px] text-slate-500">Maneja adecuadamente el instrumental tecnológico y optimiza materiales.</div>
                </td>
                <td className="p-1.5 border border-slate-300 text-center text-slate-500 font-mono">0 a 20</td>
                <td className="p-1.5 border border-slate-300 text-center font-mono font-bold text-sm">
                  {(notaEFSRT.usoEquipos || 0).toString().padStart(2, '0')}
                </td>
              </tr>
              <tr>
                <td className="p-1.5 border border-slate-300 text-center font-mono font-bold">3</td>
                <td className="p-1.5 border border-slate-300">
                  <div className="font-bold">Seguridad Laboral e Higiene Ocupacional</div>
                  <div className="text-[10px] text-slate-500">Cumple normas de bioseguridad, prevención de riesgos y protección ambiental.</div>
                </td>
                <td className="p-1.5 border border-slate-300 text-center text-slate-500 font-mono">0 a 20</td>
                <td className="p-1.5 border border-slate-300 text-center font-mono font-bold text-sm">
                  {(notaEFSRT.seguridadHigiene || 0).toString().padStart(2, '0')}
                </td>
              </tr>
              <tr>
                <td className="p-1.5 border border-slate-300 text-center font-mono font-bold">4</td>
                <td className="p-1.5 border border-slate-300">
                  <div className="font-bold">Puntualidad, Asistencia y Responsabilidad Laboral</div>
                  <div className="text-[10px] text-slate-500">Cumple el horario del centro laboral y demuestra disciplina en las tareas.</div>
                </td>
                <td className="p-1.5 border border-slate-300 text-center text-slate-500 font-mono">0 a 20</td>
                <td className="p-1.5 border border-slate-300 text-center font-mono font-bold text-sm">
                  {(notaEFSRT.puntualidadAsistencia || 0).toString().padStart(2, '0')}
                </td>
              </tr>
              <tr>
                <td className="p-1.5 border border-slate-300 text-center font-mono font-bold">5</td>
                <td className="p-1.5 border border-slate-300">
                  <div className="font-bold">Trabajo en Equipo y Comunicación Asertiva</div>
                  <div className="text-[10px] text-slate-500">Se relaciona con respeto y empatía con compañeros y clientes.</div>
                </td>
                <td className="p-1.5 border border-slate-300 text-center text-slate-500 font-mono">0 a 20</td>
                <td className="p-1.5 border border-slate-300 text-center font-mono font-bold text-sm">
                  {(notaEFSRT.trabajoEquipo || 0).toString().padStart(2, '0')}
                </td>
              </tr>
              <tr>
                <td className="p-1.5 border border-slate-300 text-center font-mono font-bold">6</td>
                <td className="p-1.5 border border-slate-300">
                  <div className="font-bold">Iniciativa, Adaptabilidad y Resolución de Problemas</div>
                  <div className="text-[10px] text-slate-500">Propone soluciones prácticas ante contingencias imprevistas del servicio.</div>
                </td>
                <td className="p-1.5 border border-slate-300 text-center text-slate-500 font-mono">0 a 20</td>
                <td className="p-1.5 border border-slate-300 text-center font-mono font-bold text-sm">
                  {(notaEFSRT.iniciativaAdaptabilidad || 0).toString().padStart(2, '0')}
                </td>
              </tr>
              <tr className="bg-slate-100 font-bold">
                <td colSpan={2} className="p-2 border border-slate-300 text-right uppercase text-xs">
                  CALIFICACIÓN FINAL VIGESIMAL (PROMEDIO SIMPLE):
                </td>
                <td colSpan={2} className="p-2 border border-slate-300 text-center">
                  <span className="text-base font-black font-mono px-3 py-1 bg-white border border-slate-400 rounded">
                    {notaFinal.toString().padStart(2, '0')}
                  </span>
                  <span className="ml-2 text-[11px] uppercase tracking-wide text-slate-700">
                    ({numeroALetras(notaFinal)})
                  </span>
                </td>
              </tr>
              <tr>
                <td colSpan={2} className="p-2 border border-slate-300 text-right font-bold text-xs uppercase">
                  SITUACIÓN ACADÉMICA FINAL:
                </td>
                <td colSpan={2} className="p-2 border border-slate-300 text-center font-bold text-sm">
                  <span className={`px-4 py-0.5 rounded text-white ${isAprobado ? 'bg-emerald-700' : 'bg-rose-700'}`}>
                    {isAprobado ? 'APROBADO' : 'NO APROBADO'}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Footer & Firmas */}
        <div className="pt-6 mt-4">
          <div className="grid grid-cols-3 gap-6 text-center text-[10px]">
            <div>
              <div className="border-t border-slate-900 pt-1 font-bold uppercase">
                {notaEFSRT.supervisorEmpresa || 'SUPERVISOR DE EMPRESA'}
              </div>
              <div className="text-slate-600">Representante / Supervisor Laboral</div>
              <div className="text-[9px] text-slate-400">Firma y Sello de la Empresa</div>
            </div>

            <div>
              <div className="border-t border-slate-900 pt-1 font-bold uppercase">
                DOCENTE ASESOR DE PRÁCTICAS
              </div>
              <div className="text-slate-600">Supervisor de EFSRT - CETPRO</div>
              <div className="text-[9px] text-slate-400">Firma y Sello Docente</div>
            </div>

            <div>
              <div className="border-t border-slate-900 pt-1 font-bold uppercase">
                {institucion?.director || 'EDINSON RAUL TEJADA RIVERA'}
              </div>
              <div className="text-slate-600">Director(a) General CETPRO Juanjuí</div>
              <div className="text-[9px] text-slate-400">Firma y Sello de Dirección</div>
            </div>
          </div>

          {/* Sello QR y Hash de Verificación */}
          <div className="mt-8 pt-2 border-t border-slate-200 flex items-center justify-between text-[9px] text-slate-500">
            <div className="flex items-center gap-3">
              <div className="border border-slate-200 p-0.5 bg-white">
                <QrCode value={qrData} size={48} showLink={false} />
              </div>
              <div>
                <div className="font-bold text-slate-700 uppercase">Acreditación Digital Institucional CETPRO Juanjuí</div>
                <div>Documento probatorio para emisión de Certificado Modular Oficial (UGEL Mariscal Cáceres).</div>
                <div className="font-mono text-[8px] text-slate-400">ID: {notaEFSRT.id} • EMISIÓN: {new Date().toLocaleDateString('es-PE')}</div>
              </div>
            </div>
            <div className="text-right italic">
              Página 1 de 1 • Sistema Integrado de Gestión Académica (SIGA)
            </div>
          </div>
        </div>
      </div>
    );
  }
);
