import React, { forwardRef, useMemo } from 'react';
import {
  ProgramaEstudio,
  ModuloFormativo,
  Seccion,
  Matricula,
  Estudiante,
  Persona,
  NotaUnidad,
  NotaEFSRT,
  UnidadDidactica,
  InstitucionInfo
} from '../../types';
import { compareMatriculasByPersona } from '../../utils/sortPersonas';
import { QrCode } from '../common/QrCode';

interface ActaEvaluacionPrintProps {
  institucion?: InstitucionInfo;
  programa: ProgramaEstudio;
  modulo: ModuloFormativo;
  seccion?: Seccion;
  periodo: string;
  matriculas: Matricula[];
  estudiantes: Estudiante[];
  personas: Persona[];
  notasUnidades: NotaUnidad[];
  notasEFSRT: NotaEFSRT[];
  unidades: UnidadDidactica[];
}

export const ActaEvaluacionPrint = forwardRef<HTMLDivElement, ActaEvaluacionPrintProps>(
  ({ institucion, programa, modulo, seccion, periodo, matriculas, estudiantes, personas, notasUnidades, notasEFSRT, unidades }, ref) => {
    const sortedMatriculas = useMemo(() => {
      return [...matriculas].sort((a, b) => compareMatriculasByPersona(a, b, personas, estudiantes));
    }, [matriculas, personas, estudiantes]);

    const udtDisponibles = unidades.filter(u => !(u.tipo === 'Empleabilidad' || u.codigo?.includes('UDE')));
    const udeDisponibles = unidades.filter(u => u.tipo === 'Empleabilidad' || u.codigo?.includes('UDE'));

    return (
      <div ref={ref} className="bg-white p-8 print:p-0 w-full font-sans text-[11px] text-black">
        {/* Header */}
        <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-4">
          <div className="flex gap-4 items-center">
            {institucion?.logoUrl && (
              <img src={institucion.logoUrl} alt="Logo" className="h-16 w-16 object-contain" />
            )}
            <div>
              <h2 className="font-bold text-sm uppercase">MINISTERIO DE EDUCACIÓN</h2>
              <h1 className="font-bold text-lg uppercase">{institucion?.nombre || 'CETPRO JUANJUÍ'}</h1>
              <p className="text-[10px]">R.M. / R.D.: {institucion?.resolucionAutorizacion || '---'}</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="font-bold text-base uppercase">ACTA OFICIAL DE EVALUACIÓN</h2>
            <p className="text-[10px] uppercase font-bold mt-1">Periodo Académico: {periodo}</p>
          </div>
        </div>

        {/* Info Box */}
        <div className="grid grid-cols-2 gap-4 mb-4 border border-black p-3">
          <div>
            <div className="flex mb-1"><span className="w-32 font-bold uppercase">Programa:</span> <span className="uppercase">{programa?.nombre}</span></div>
            <div className="flex mb-1"><span className="w-32 font-bold uppercase">Módulo:</span> <span className="uppercase">{modulo?.nombre}</span></div>
            <div className="flex mb-1"><span className="w-32 font-bold uppercase">Nivel Formativo:</span> <span className="uppercase">{programa?.nivelFormativo}</span></div>
          </div>
          <div>
            <div className="flex mb-1"><span className="w-24 font-bold uppercase">Sección:</span> <span className="uppercase">{seccion?.nombre || 'ÚNICA'}</span></div>
            <div className="flex mb-1"><span className="w-24 font-bold uppercase">Turno:</span> <span className="uppercase">{seccion?.turno || '---'}</span></div>
            <div className="flex mb-1"><span className="w-24 font-bold uppercase">Docente:</span> <span className="uppercase">{institucion?.director || '---'}</span></div>
          </div>
        </div>

        {/* Table */}
        <table className="w-full border-collapse border border-black text-center mb-6">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-black p-1 w-8" rowSpan={2}>N°</th>
              <th className="border border-black p-1" rowSpan={2}>APELLIDOS Y NOMBRES</th>
              {udtDisponibles.length > 0 && (
                <th className="border border-black p-1" colSpan={udtDisponibles.length}>Unidades Didácticas (UDT)</th>
              )}
              {udeDisponibles.length > 0 && (
                <th className="border border-black p-1" colSpan={udeDisponibles.length}>U. de Empleabilidad (UDE)</th>
              )}
              <th className="border border-black p-1 w-12" rowSpan={2}>EFSRT</th>
              <th className="border border-black p-1 w-20" rowSpan={2}>Situación Final</th>
            </tr>
            <tr className="bg-gray-100">
              {udtDisponibles.map((u, i) => (
                <th key={'udt_h_'+i} className="border border-black p-1 w-8 text-[9px]" title={u.nombre}>
                  {u.codigo ? u.codigo.slice(-4) : `UDT${i+1}`}
                </th>
              ))}
              {udeDisponibles.map((u, i) => (
                <th key={'ude_h_'+i} className="border border-black p-1 w-8 text-[9px]" title={u.nombre}>
                  {u.codigo ? u.codigo.slice(-4) : `UDE${i+1}`}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedMatriculas.length === 0 ? (
              <tr><td colSpan={10} className="border border-black p-4 italic">No hay estudiantes matriculados</td></tr>
            ) : (
              sortedMatriculas.map((mat, idx) => {
                const est = estudiantes.find((e) => e.id === mat.estudianteId);
                const per = est ? personas.find((p) => p.id === est.personaId) : undefined;
                
                const notasUdt = udtDisponibles.map(u => {
                  const nu = notasUnidades.find(n => n.estudianteId === mat.estudianteId && n.unidadDidacticaId === u.id);
                  return nu ? nu.promedioFinal : 0;
                });
                const notasUde = udeDisponibles.map(u => {
                  const nu = notasUnidades.find(n => n.estudianteId === mat.estudianteId && n.unidadDidacticaId === u.id);
                  return nu ? nu.promedioFinal : 0;
                });
                
                const efsrt = notasEFSRT.find(ef => ef.estudianteId === mat.estudianteId && ef.moduloId === modulo.id);
                const notaEfsrt = efsrt ? efsrt.notaVigesimal : 0;
                
                const hasAnyGrade = [...notasUdt, ...notasUde, notaEfsrt].some(n => n > 0);
                const isApproved = udtDisponibles.every((_, i) => notasUdt[i] >= 13) && 
                                   udeDisponibles.every((_, i) => notasUde[i] >= 13) && 
                                   notaEfsrt >= 13 && hasAnyGrade && unidades.length > 0;

                return (
                  <tr key={mat.id}>
                    <td className="border border-black p-1">{idx + 1}</td>
                    <td className="border border-black p-1 text-left font-bold uppercase text-[10px]">
                      {per ? `${per.apellidoPaterno} ${per.apellidoMaterno}, ${per.nombres}` : '---'}
                    </td>
                    {notasUdt.map((nu, i) => (
                      <td key={`udt_${mat.id}_${i}`} className={`border border-black p-1 font-mono ${nu < 13 && nu > 0 ? 'text-red-600' : ''}`}>
                        {nu > 0 ? nu.toString().padStart(2, '0') : '--'}
                      </td>
                    ))}
                    {notasUde.map((nu, i) => (
                      <td key={`ude_${mat.id}_${i}`} className={`border border-black p-1 font-mono ${nu < 13 && nu > 0 ? 'text-red-600' : ''}`}>
                        {nu > 0 ? nu.toString().padStart(2, '0') : '--'}
                      </td>
                    ))}
                    <td className={`border border-black p-1 font-mono font-bold ${notaEfsrt < 13 && notaEfsrt > 0 ? 'text-red-600' : ''}`}>
                      {notaEfsrt > 0 ? notaEfsrt.toString().padStart(2, '0') : '--'}
                    </td>
                    <td className="border border-black p-1 font-bold text-[10px] uppercase">
                      {hasAnyGrade ? (isApproved ? 'Aprobado' : (hasAnyGrade && (notasUdt.some(n => n >= 10 && n < 13) || notasUde.some(n => n >= 10 && n < 13)) ? 'Recuperación' : 'Desaprobado')) : 'Sin Evaluar'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Resumen Estadístico Oficial MINEDU */}
        {sortedMatriculas.length > 0 && (() => {
          const totalMat = sortedMatriculas.length;
          let aprobadosCount = 0;
          let desaprobadosCount = 0;
          let recupCount = 0;

          sortedMatriculas.forEach(mat => {
            const notasUdt = udtDisponibles.map(u => {
              const nu = notasUnidades.find(n => (n.estudianteId === mat.estudianteId || n.matriculaId === mat.id) && n.unidadDidacticaId === u.id);
              return nu ? nu.promedioFinal : 0;
            });
            const notasUde = udeDisponibles.map(u => {
              const nu = notasUnidades.find(n => (n.estudianteId === mat.estudianteId || n.matriculaId === mat.id) && n.unidadDidacticaId === u.id);
              return nu ? nu.promedioFinal : 0;
            });
            const efsrt = notasEFSRT.find(ef => ef.estudianteId === mat.estudianteId && ef.moduloId === modulo.id);
            const notaEfsrt = efsrt ? efsrt.notaVigesimal : 0;

            const hasGrades = [...notasUdt, ...notasUde, notaEfsrt].some(n => n > 0);
            if (!hasGrades) return;

            const isApp = udtDisponibles.every((_, i) => notasUdt[i] >= 13) &&
                          udeDisponibles.every((_, i) => notasUde[i] >= 13) &&
                          notaEfsrt >= 13 && unidades.length > 0;

            if (isApp) {
              aprobadosCount++;
            } else if (notasUdt.some(n => n >= 10 && n < 13) || notasUde.some(n => n >= 10 && n < 13)) {
              recupCount++;
            } else {
              desaprobadosCount++;
            }
          });

          const pctAprobados = totalMat > 0 ? Math.round((aprobadosCount / totalMat) * 100) : 0;
          const qrPayload = `SIGA-CETPRO-JUANJUI|ACTA|MOD:${modulo?.codigo || 'MOD'}|PER:${periodo}|MAT:${totalMat}|APR:${aprobadosCount}|DES:${desaprobadosCount}|EMISION:${new Date().toISOString().slice(0,10)}`;
          const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=95x95&data=${encodeURIComponent(qrPayload)}`;

          return (
            <div className="mb-6">
              <div className="grid grid-cols-5 border border-black text-center text-[10px] bg-slate-50 font-bold mb-4">
                <div className="p-1 border-r border-black">Total Matriculados: {totalMat}</div>
                <div className="p-1 border-r border-black text-emerald-800">Aprobados: {aprobadosCount} ({pctAprobados}%)</div>
                <div className="p-1 border-r border-black text-amber-800">En Recuperación: {recupCount}</div>
                <div className="p-1 border-r border-black text-rose-800">Desaprobados: {desaprobadosCount}</div>
                <div className="p-1">Eficiencia: {pctAprobados}%</div>
              </div>

              {/* Footer Signatures with QR Code */}
              <div className="mt-8 flex justify-between items-end text-center px-4">
                <div>
                  <div className="w-44 border-t border-black pt-1 mb-1 mx-auto uppercase font-bold text-[10px]">
                    Docente Responsable
                  </div>
                  <div className="text-[9px] text-gray-700">Firma y Sello</div>
                </div>

                {/* QR Code */}
                <div className="flex flex-col items-center">
                  <div className="border border-slate-300 bg-white p-0.5">
                    <QrCode value={qrPayload} size={72} showLink={false} />
                  </div>
                  <div className="text-[8px] text-gray-600 font-mono mt-1">
                    VERIFICACIÓN DIGITAL SIGA
                  </div>
                  <div className="text-[7px] text-gray-400 font-mono">
                    RVM 188-2020-MINEDU
                  </div>
                </div>

                <div>
                  <div className="w-44 border-t border-black pt-1 mb-1 mx-auto uppercase font-bold text-[10px]">
                    {institucion?.director || 'Director(a) CETPRO'}
                  </div>
                  <div className="text-[9px] text-gray-700">Firma y Sello Dirección</div>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    );
  }
);
ActaEvaluacionPrint.displayName = 'ActaEvaluacionPrint';
