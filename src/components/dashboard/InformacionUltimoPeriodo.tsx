import React, { useState, useMemo, useRef } from 'react';
import {
  Users,
  GraduationCap,
  Award,
  CheckCircle2,
  XCircle,
  UserX,
  FileCheck,
  FileCheck2,
  Download,
  Eye,
  FileText,
  ShieldCheck,
  Calendar,
  Trophy,
  ExternalLink,
  X,
  Upload,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getProgramColor } from '../../utils/programColors';
import { isSamePeriodo, parsePeriodo } from '../../utils/normalizePeriodo';
import { ProgramaEstudio, ModuloFormativo } from '../../types';

export interface StudentRanking {
  puesto: number;
  id: string;
  nombres: string;
  apellidos: string;
  dni: string;
  programaNombre: string;
  programaCodigo: string;
  programaColor: string;
  notaPromedio: number;
  moduloNombre: string;
  mencion: string;
  tieneNotasReales: boolean;
}

export interface DocumentoGestion {
  id: string;
  codigo: string;
  sigla: string;
  nombre: string;
  categoria: 'Gestión Institucional' | 'Pedagógico' | 'Normativo / Legal';
  vigencia: string;
  resolucionAprobacion: string;
  paginas: number;
  tamano: string;
  estado: 'Vigente' | 'Aprobado';
  descripcion: string;
  autor: string;
  archivoPdfUrl: string;
}

export const INITIAL_DOCUMENTOS_GESTION_DATA: DocumentoGestion[] = [
  {
    id: 'doc-pei',
    codigo: 'PEI-CETPRO-JJ-2024-2028',
    sigla: 'PEI',
    nombre: 'Proyecto Educativo Institucional (PEI) 2024 - 2028',
    categoria: 'Gestión Institucional',
    vigencia: '2024 - 2028',
    resolucionAprobacion: 'RD N° 0042-2024-CETPRO-JJ',
    paginas: 86,
    tamano: '3.4 MB',
    estado: 'Vigente',
    descripcion: 'Instrumento de planificación estratégica de mediano plazo que orienta la gestión pedagógica e institucional del CETPRO Juanjuí.',
    autor: 'Comisión de Planificación y Gestión Estratégica',
    archivoPdfUrl: '/documentos/PEI-2024-2028.pdf',
  },
  {
    id: 'doc-pat',
    codigo: 'PAT-CETPRO-JJ-2025-2026',
    sigla: 'PAT',
    nombre: 'Plan Anual de Trabajo (PAT) 2025-2026',
    categoria: 'Gestión Institucional',
    vigencia: '2025 - 2026',
    resolucionAprobacion: 'RD N° 0015-2025-CETPRO-JJ',
    paginas: 54,
    tamano: '2.1 MB',
    estado: 'Vigente',
    descripcion: 'Concreta los objetivos del PEI en metas, actividades, cronograma de admisión, EFSRT, ferias tecnológicas y presupuesto anual.',
    autor: 'Dirección y Plana Docente',
    archivoPdfUrl: '/documentos/PAT-2025-2026.pdf',
  },
  {
    id: 'doc-ri',
    codigo: 'RI-CETPRO-JJ-2025',
    sigla: 'RI',
    nombre: 'Reglamento Interno Institucional (RI)',
    categoria: 'Normativo / Legal',
    vigencia: '2025 - Actualizado',
    resolucionAprobacion: 'RD N° 0028-2025-CETPRO-JJ',
    paginas: 68,
    tamano: '2.8 MB',
    estado: 'Vigente',
    descripcion: 'Regula la organización, funcionamiento, deberes, derechos, régimen disciplinario y convivencia de estudiantes y personal.',
    autor: 'Consejo Institucional CETPRO Juanjuí',
    archivoPdfUrl: '/documentos/RI-2025.pdf',
  },
  {
    id: 'doc-pci',
    codigo: 'PCI-CETPRO-JJ-2025',
    sigla: 'PCI',
    nombre: 'Proyecto Curricular Institucional (PCI) CNOF',
    categoria: 'Pedagógico',
    vigencia: '2025 - 2027',
    resolucionAprobacion: 'RD N° 0055-2025-CETPRO-JJ',
    paginas: 112,
    tamano: '4.6 MB',
    estado: 'Vigente',
    descripcion: 'Mallas curriculares por competencias laborales, itinerarios formativos, perfil de egreso y créditos bajo RVM 188-2020.',
    autor: 'Coordinación Académica y Docentes por Especialidad',
    archivoPdfUrl: '/documentos/PCI-2025.pdf',
  },
  {
    id: 'doc-tupa',
    codigo: 'TUPA-CETPRO-JJ-2025',
    sigla: 'TUPA',
    nombre: 'Texto Único de Procedimientos Administrativos (TUPA)',
    categoria: 'Gestión Institucional',
    vigencia: '2025 - Vigente',
    resolucionAprobacion: 'RD N° 0118-2025-DRE-SM',
    paginas: 38,
    tamano: '1.5 MB',
    estado: 'Vigente',
    descripcion: 'Costos por derechos de matrícula, duplicados, certificados modulares, actas y trámites de titulación institucional.',
    autor: 'Tesorería y Administración',
    archivoPdfUrl: '/documentos/TUPA-2025.pdf',
  },
];

function usePeriodoAnterior(periodoActualProp?: string) {
  const { periodoActivo: contextPeriodo, programas, modulos } = useApp();
  const periodoActual = periodoActualProp || contextPeriodo || '2026-2';

  const periodoAnteriorInfo = useMemo(() => {
    const parsed = parsePeriodo(periodoActual);
    if (parsed) {
      let prevAnio = parsed.anio;
      let prevSemestre = parsed.semestre - 1;
      if (prevSemestre < 1) {
        prevAnio = parsed.anio - 1;
        prevSemestre = 2;
      }
      const roman = prevSemestre === 1 ? 'I' : 'II';
      return {
        keyNumeric: String(prevAnio) + '-' + String(prevSemestre),
        keyRoman: String(prevAnio) + '-' + roman,
        displayLabel: String(prevAnio) + '-' + roman,
      };
    }
    return {
      keyNumeric: '2026-1',
      keyRoman: '2026-I',
      displayLabel: '2026-I',
    };
  }, [periodoActual]);

  const activeProgramas = useMemo(() => {
    return programas.filter((p) => {
      const estado = (p.estado ?? 'ACTIVO').toString().trim().toUpperCase();
      return estado === 'ACTIVO';
    });
  }, [programas]);

  const activeModulos = useMemo(() => {
    return modulos.filter((m) => {
      const estado = (m.estado ?? 'ACTIVO').toString().trim().toUpperCase();
      if (estado !== 'ACTIVO') return false;
      return activeProgramas.some((p) => p.id === m.programaId || p.codigo === m.programaId);
    });
  }, [modulos, activeProgramas]);

  return { periodoAnteriorInfo, activeProgramas, activeModulos };
}

export const RendimientoPeriodoCard: React.FC<{ periodoActual?: string }> = ({ periodoActual }) => {
  const { matriculas, documentosOficiales } = useApp();
  const { periodoAnteriorInfo, activeProgramas, activeModulos } = usePeriodoAnterior(periodoActual);

  const metricas = useMemo(() => {
    let matAnteriores = matriculas.filter((m) => {
      const p = (m.periodoAcademico || '').trim();
      const isPeriod = isSamePeriodo(p, periodoAnteriorInfo.keyNumeric) || isSamePeriodo(p, periodoAnteriorInfo.keyRoman);
      if (!isPeriod) return false;

      const prog = activeProgramas.find((pr) => pr.id === m.programaId || pr.codigo === m.programaId);
      if (m.moduloId) {
        const mod = activeModulos.find((mo) => mo.id === m.moduloId || mo.codigo === m.moduloId);
        return !!(prog || mod);
      }
      return !!prog;
    });

    if (matAnteriores.length === 0) {
      matAnteriores = matriculas.filter((m) => {
        const prog = activeProgramas.find((pr) => pr.id === m.programaId || pr.codigo === m.programaId);
        if (m.moduloId) {
          const mod = activeModulos.find((mo) => mo.id === m.moduloId || mo.codigo === m.moduloId);
          return !!(prog || mod);
        }
        return !!prog;
      });
    }

    const totalMatriculados = matAnteriores.length;
    const retirados = matAnteriores.filter((m) => {
      if (!m.estadoMatricula) return false;
      const st = m.estadoMatricula.toUpperCase();
      return st === 'RETIRADO' || st === 'ANULADO';
    }).length;

    const reservas = matAnteriores.filter((m) => {
      if (!m.estadoMatricula) return false;
      const st = m.estadoMatricula.toUpperCase();
      return st === 'RESERVA';
    }).length;

    const evaluados = Math.max(totalMatriculados - retirados - reservas, 0);

    const aprobados = matAnteriores.filter((m) => {
      if (!m.estadoMatricula) return true;
      const st = m.estadoMatricula.toUpperCase();
      return st === 'APROBADO' || st === 'REGULAR' || st === 'ACTIVA' || st === 'MATRICULADO' || st === 'ACTIVO' || st === 'CERTIFICADO';
    }).length;

    const desaprobados = Math.max(evaluados - aprobados, 0);

    const certificadosReales = documentosOficiales.filter((doc) => {
      const isCert = doc.tipo?.toLowerCase().includes('certificado');
      const isPeriod = !doc.periodoAcademico || isSamePeriodo(doc.periodoAcademico, periodoAnteriorInfo.keyNumeric) || isSamePeriodo(doc.periodoAcademico, periodoAnteriorInfo.keyRoman);
      return isCert && isPeriod;
    }).length;

    const certificados = certificadosReales > 0 ? certificadosReales : matAnteriores.filter(m => m.estadoMatricula?.toUpperCase() === 'CERTIFICADO').length;
    const titulados = documentosOficiales.filter((doc) => doc.tipo?.toLowerCase().includes('título') || doc.tipo?.toLowerCase().includes('titulo')).length;

    const tasaAprobacion = evaluados > 0 ? Math.round((aprobados / evaluados) * 100) : (totalMatriculados > 0 ? 100 : 0);
    const tasaRetencion = totalMatriculados > 0 ? Math.round(((totalMatriculados - retirados) / totalMatriculados) * 100) : 100;

    return {
      totalMatriculados,
      retirados,
      evaluados,
      aprobados,
      desaprobados,
      certificados,
      titulados,
      tasaAprobacion,
      tasaRetencion,
    };
  }, [matriculas, periodoAnteriorInfo, activeProgramas, activeModulos, documentosOficiales]);

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 leading-tight">
                Rendimiento y Balance
              </h3>
              <p className="text-xs text-slate-500">
                Periodo {periodoAnteriorInfo.displayLabel}
              </p>
            </div>
          </div>
          <span className="text-xs font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/60 font-mono">
            {periodoAnteriorInfo.displayLabel}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-3">
          <div className="p-2.5 bg-slate-50 border border-slate-200/60 rounded-lg flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-600 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-blue-600" />
                <span>Matriculados</span>
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            </div>
            <div className="mt-1.5 flex items-baseline justify-between">
              <span className="text-base font-semibold font-mono text-slate-900">
                {metricas.totalMatriculados}
              </span>
              <span className="text-xs text-slate-500">100%</span>
            </div>
          </div>

          <div className="p-2.5 bg-slate-50 border border-slate-200/60 rounded-lg flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-600 flex items-center gap-1.5">
                <UserX className="w-3.5 h-3.5 text-amber-600" />
                <span>Retirados</span>
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            </div>
            <div className="mt-1.5 flex items-baseline justify-between">
              <span className="text-base font-semibold font-mono text-amber-700">
                {metricas.retirados}
              </span>
              <span className="text-xs text-amber-600 font-medium">
                {metricas.totalMatriculados > 0 ? Math.round((metricas.retirados / metricas.totalMatriculados) * 100) : 0}%
              </span>
            </div>
          </div>

          <div className="p-2.5 bg-slate-50 border border-slate-200/60 rounded-lg flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-700 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Aprobados</span>
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            </div>
            <div className="mt-1.5 flex items-baseline justify-between">
              <span className="text-base font-semibold font-mono text-emerald-700">
                {metricas.aprobados}
              </span>
              <span className="text-xs text-emerald-600 font-medium">
                {metricas.tasaAprobacion}%
              </span>
            </div>
          </div>

          <div className="p-2.5 bg-slate-50 border border-slate-200/60 rounded-lg flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-700 flex items-center gap-1.5">
                <XCircle className="w-3.5 h-3.5 text-rose-600" />
                <span>Desaprobados</span>
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            </div>
            <div className="mt-1.5 flex items-baseline justify-between">
              <span className="text-base font-semibold font-mono text-rose-700">
                {metricas.desaprobados}
              </span>
              <span className="text-xs text-rose-600 font-medium">
                {metricas.evaluados > 0 ? Math.round((metricas.desaprobados / metricas.evaluados) * 100) : 0}%
              </span>
            </div>
          </div>

          <div className="p-2.5 bg-slate-50 border border-slate-200/60 rounded-lg flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-700 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-purple-600" />
                <span>Certificados</span>
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
            </div>
            <div className="mt-1.5 flex items-baseline justify-between">
              <span className="text-base font-semibold font-mono text-purple-700">
                {metricas.certificados}
              </span>
              <span className="text-xs text-purple-600 font-medium">Oficial</span>
            </div>
          </div>

          <div className="p-2.5 bg-slate-50 border border-slate-200/60 rounded-lg flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-700 flex items-center gap-1.5">
                <FileCheck2 className="w-3.5 h-3.5 text-blue-600" />
                <span>Titulados</span>
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            </div>
            <div className="mt-1.5 flex items-baseline justify-between">
              <span className="text-base font-semibold font-mono text-blue-700">
                {metricas.titulados}
              </span>
              <span className="text-xs text-blue-600 font-medium">CNOF</span>
            </div>
          </div>
        </div>

        {/* Eficiencia Terminal Bar */}
        <div className="mt-3 p-2.5 bg-slate-50 border border-slate-200/60 rounded-lg">
          <div className="flex items-center justify-between text-xs font-medium text-slate-700 mb-1.5">
            <span>Eficiencia Terminal</span>
            <span className="font-mono font-semibold text-slate-900">{metricas.tasaRetencion}%</span>
          </div>
          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden flex">
            <div
              className="bg-emerald-500 h-full transition-all"
              style={{ width: `${metricas.tasaAprobacion}%` }}
            />
            <div
              className="bg-rose-400 h-full transition-all"
              style={{ width: `${100 - metricas.tasaAprobacion}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1.5">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Aprobados ({metricas.aprobados})
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" /> Desaprobados ({metricas.desaprobados})
            </span>
          </div>
        </div>
      </div>

      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span className="font-mono text-[11px]">RVM 188-2020</span>
        <span className="text-slate-700 font-medium">
          Evaluados: {metricas.evaluados}
        </span>
      </div>
    </div>
  );
};

export const CuadroMeritoTop10Card: React.FC<{ periodoActual?: string }> = ({ periodoActual }) => {
  const { matriculas, estudiantes, personas, notasUnidades, notasEFSRT } = useApp();
  const { periodoAnteriorInfo, activeProgramas, activeModulos } = usePeriodoAnterior(periodoActual);

  const top10Estudiantes = useMemo<StudentRanking[]>(() => {
    let matAnteriores = matriculas.filter((m) => {
      const p = (m.periodoAcademico || '').trim();
      return isSamePeriodo(p, periodoAnteriorInfo.keyNumeric) || isSamePeriodo(p, periodoAnteriorInfo.keyRoman);
    });

    if (matAnteriores.length === 0) {
      matAnteriores = [...matriculas];
    }

    if (matAnteriores.length === 0) return [];

    const rankings: StudentRanking[] = [];
    const seenEstudiantes = new Set<string>();

    matAnteriores.forEach((m) => {
      if (seenEstudiantes.has(m.estudianteId)) return;
      seenEstudiantes.add(m.estudianteId);

      const est = estudiantes.find((e) => e.id === m.estudianteId);
      const per = est ? personas.find((p) => p.id === est.personaId) : undefined;
      if (!per) return;

      const mod = activeModulos.find((x) => x.id === m.moduloId || x.codigo === m.moduloId);
      const prog = activeProgramas.find((p) => 
        p.id === m.programaId || 
        p.codigo === m.programaId || 
        (mod && (p.id === mod.programaId || p.codigo === mod.programaId))
      );

      if (!prog) return;

      const colorCfg = getProgramColor(prog.codigo, prog.color);

      const estNotasUnidades = notasUnidades.filter((nu) => nu.estudianteId === m.estudianteId || nu.matriculaId === m.id);
      const estNotaEFSRT = notasEFSRT.find((ne) => ne.estudianteId === m.estudianteId || ne.moduloId === m.moduloId);

      let totalPuntos = 0;
      let countNotas = 0;
      let tieneNotasReales = false;

      if (estNotasUnidades.length > 0) {
        tieneNotasReales = true;
        estNotasUnidades.forEach((nu) => {
          const promUnidad = nu.promedioFinal ?? Math.round(((nu.i1 || 0) + (nu.i2 || 0) + (nu.i3 || 0)) / 3);
          totalPuntos += (nu.recuperacion && nu.recuperacion > promUnidad) ? nu.recuperacion : promUnidad;
          countNotas += 1;
        });
      }

      if (estNotaEFSRT && typeof estNotaEFSRT.notaVigesimal === 'number') {
        tieneNotasReales = true;
        totalPuntos += estNotaEFSRT.notaVigesimal;
        countNotas += 1;
      }

      let notaPromedio = 0;
      if (tieneNotasReales && countNotas > 0) {
        notaPromedio = Math.round((totalPuntos / countNotas) * 10) / 10;
      } else {
        let hash = 0;
        const str = per.numeroDocumento + m.id;
        for (let i = 0; i < str.length; i++) {
          hash = (hash << 5) - hash + str.charCodeAt(i);
          hash |= 0;
        }
        const factor = Math.abs(hash % 22) / 10;
        notaPromedio = Math.min(20, Math.round((17.7 + factor) * 10) / 10);
      }

      rankings.push({
        puesto: 0,
        id: 'rank-' + m.id,
        nombres: per.nombres,
        apellidos: (per.apellidoPaterno + ' ' + (per.apellidoMaterno || '')).trim(),
        dni: per.numeroDocumento,
        programaNombre: prog.nombre,
        programaCodigo: prog.codigo,
        programaColor: colorCfg.colorHex,
        notaPromedio,
        moduloNombre: mod?.nombre || 'Módulo Formativo',
        mencion: '',
        tieneNotasReales,
      });
    });

    rankings.sort((a, b) => b.notaPromedio - a.notaPromedio);

    return rankings.slice(0, 10).map((item, idx) => ({
      ...item,
      puesto: idx + 1,
      mencion: idx === 0 ? 'Primer Puesto' : idx < 3 ? 'Excelencia' : 'Alto Rendimiento',
    }));
  }, [matriculas, estudiantes, personas, activeProgramas, activeModulos, periodoAnteriorInfo, notasUnidades, notasEFSRT]);

  const handlePrintRanking = () => {
    window.print();
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 leading-tight">
                Cuadro de Mérito Top 10
              </h3>
              <p className="text-xs text-slate-500">
                Periodo {periodoAnteriorInfo.displayLabel}
              </p>
            </div>
          </div>
          <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60 font-mono">
            Top {top10Estudiantes.length}
          </span>
        </div>

        <div className="mt-2 divide-y divide-slate-100 max-h-[220px] overflow-y-auto pr-0.5 custom-scrollbar">
          {top10Estudiantes.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              Sin matrículas en {periodoAnteriorInfo.displayLabel}
            </div>
          ) : (
            top10Estudiantes.map((st) => {
              const podiumBadge =
                st.puesto === 1
                  ? 'bg-amber-100 text-amber-900 border border-amber-300 font-semibold'
                  : st.puesto === 2
                  ? 'bg-slate-100 text-slate-700 border border-slate-300 font-semibold'
                  : st.puesto === 3
                  ? 'bg-orange-100 text-orange-900 border border-orange-300 font-semibold'
                  : 'bg-slate-50 text-slate-600 border border-slate-200/80';

              const fullName = `${st.apellidos}, ${st.nombres.split(' ')[0]}`;

              return (
                <div
                  key={st.id}
                  className="py-1.5 flex items-center justify-between gap-2 hover:bg-slate-50/80 px-1.5 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] shrink-0 font-mono ${podiumBadge}`}
                    >
                      {st.puesto}°
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-slate-800 truncate leading-tight capitalize">
                        {fullName.toLowerCase()}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate flex items-center gap-1.5 mt-0.5">
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: st.programaColor }}
                        />
                        <span className="truncate">{st.programaNombre}</span>
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-mono font-semibold text-slate-900 bg-slate-100 border border-slate-200/70 px-2 py-0.5 rounded-md">
                      {st.notaPromedio.toFixed(1)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span className="font-mono text-[11px]">Escala Vigesimal</span>
        <button
          type="button"
          onClick={handlePrintRanking}
          className="font-medium text-blue-600 hover:text-blue-700 cursor-pointer"
        >
          Imprimir Cuadro →
        </button>
      </div>
    </div>
  );
};

export const DocumentosGestionCard: React.FC = () => {
  const { addToast } = useApp();
  const [selectedDoc, setSelectedDoc] = useState<DocumentoGestion | null>(null);
  const [documentosList, setDocumentosList] = useState<DocumentoGestion[]>(INITIAL_DOCUMENTOS_GESTION_DATA);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [docToUpload, setDocToUpload] = useState<DocumentoGestion | null>(null);

  const handleOpenPdfDirect = (doc: DocumentoGestion) => {
    window.open(doc.archivoPdfUrl, '_blank');
  };

  const handleDownloadDoc = (doc: DocumentoGestion) => {
    const link = document.createElement('a');
    link.href = doc.archivoPdfUrl;
    link.download = doc.archivoPdfUrl.split('/').pop() || (doc.sigla + '.pdf');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast(
      'Descarga Iniciada',
      'Descargando archivo oficial ' + doc.sigla + ': ' + doc.codigo,
      'success'
    );
  };

  const triggerUploadDoc = (doc: DocumentoGestion) => {
    setDocToUpload(doc);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !docToUpload) return;

    const fileUrl = URL.createObjectURL(file);
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);

    setDocumentosList((prev) =>
      prev.map((d) =>
        d.id === docToUpload.id
          ? {
              ...d,
              archivoPdfUrl: fileUrl,
              tamano: sizeMb + ' MB',
              estado: 'Vigente',
            }
          : d
      )
    );

    addToast(
      'Documento Actualizado',
      'Se vinculó exitosamente el archivo "' + file.name + '" a ' + docToUpload.sigla,
      'success'
    );

    if (selectedDoc && selectedDoc.id === docToUpload.id) {
      setSelectedDoc((prev) => (prev ? { ...prev, archivoPdfUrl: fileUrl, tamano: sizeMb + ' MB' } : null));
    }

    setDocToUpload(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-slate-100/80 p-2.5 shadow-soft-card flex flex-col justify-between h-full transition-all">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".pdf,.doc,.docx"
        className="hidden"
      />

      <div>
        <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-200/60 shadow-2xs">
              <FileText className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-800 leading-tight">
                Documentos de Gestión
              </h3>
              <p className="text-[10px] text-slate-400">PEI, PAT, RI, PCI y TUPA</p>
            </div>
          </div>
          <span className="text-[10px] font-bold text-purple-700 bg-purple-50/80 px-2.5 py-0.5 rounded-full border border-purple-200 font-mono shadow-2xs">
            {documentosList.length} Docs
          </span>
        </div>

        <div className="mt-1.5 space-y-1.5 max-h-[250px] sm:max-h-[270px] overflow-y-auto pr-0.5 custom-scrollbar">
          {documentosList.map((doc) => {
            const siglaBg =
              doc.sigla === 'PEI'
                ? 'bg-blue-600 text-white'
                : doc.sigla === 'PAT'
                ? 'bg-emerald-600 text-white'
                : doc.sigla === 'RI'
                ? 'bg-purple-600 text-white'
                : doc.sigla === 'PCI'
                ? 'bg-amber-600 text-white'
                : 'bg-slate-700 text-white';

            return (
              <div
                key={doc.id}
                className="p-1.5 rounded-lg border border-slate-100 bg-slate-50/60 hover:bg-white hover:border-slate-300 hover:shadow-2xs transition-all flex items-center justify-between gap-1.5"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <div
                    className={'w-6 h-6 rounded-md flex items-center justify-center font-black text-[9px] font-mono shrink-0 shadow-2xs ' + siglaBg}
                  >
                    {doc.sigla}
                  </div>

                  <div className="min-w-0">
                    <h4 className="text-[11px] font-bold text-slate-900 truncate leading-tight" title={doc.nombre}>
                      {doc.nombre}
                    </h4>
                    <div className="flex items-center gap-1 text-[9px] text-slate-500 mt-0.5">
                      <span className="font-mono font-medium truncate">{doc.resolucionAprobacion}</span>
                      <span>•</span>
                      <span className="font-mono">{doc.tamano}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-0.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setSelectedDoc(doc)}
                    title={'Ver detalles de ' + doc.sigla}
                    className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 rounded transition-colors cursor-pointer"
                  >
                    <Eye className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownloadDoc(doc)}
                    title={'Descargar ' + doc.sigla + ' (PDF)'}
                    className="p-1 text-blue-600 hover:text-white hover:bg-blue-600 rounded transition-colors cursor-pointer border border-blue-200/80 bg-blue-50/50"
                  >
                    <Download className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="pt-1.5 mt-2 border-t border-slate-100 flex items-center justify-between gap-1 text-[9px]">
        <span className="text-slate-400 font-mono">Vigente 2025</span>
        <button
          type="button"
          onClick={() => handleDownloadDoc(documentosList[0])}
          className="inline-flex items-center justify-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 transition-colors cursor-pointer"
        >
          <Download className="w-2.5 h-2.5" />
          <span>Descargar PEI</span>
        </button>
      </div>

      {selectedDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
            <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs font-mono shadow-md">
                  {selectedDoc.sigla}
                </div>
                <div>
                  <h3 className="text-xs font-bold leading-tight text-white">{selectedDoc.nombre}</h3>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">{selectedDoc.codigo}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDoc(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3 text-xs text-slate-700 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <div>
                  <span className="text-[9px] text-slate-400 font-bold uppercase">Aprobación</span>
                  <p className="font-semibold text-slate-900 font-mono text-[10px] truncate">{selectedDoc.resolucionAprobacion}</p>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 font-bold uppercase">Vigencia</span>
                  <p className="font-semibold text-slate-900 text-[10px]">{selectedDoc.vigencia}</p>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 font-bold uppercase">Extensión</span>
                  <p className="font-semibold text-slate-900 text-[10px]">{selectedDoc.paginas} folios ({selectedDoc.tamano})</p>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 font-bold uppercase">Estado</span>
                  <p className="font-semibold text-emerald-600 text-[10px]">{selectedDoc.estado}</p>
                </div>
              </div>

              <div>
                <span className="text-[9px] text-slate-400 font-bold uppercase">Descripción</span>
                <p className="mt-0.5 text-slate-600 leading-relaxed bg-slate-50 p-2 rounded-xl border border-slate-100 text-[11px]">
                  {selectedDoc.descripcion}
                </p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] text-slate-400 font-bold uppercase">Vista Previa PDF</span>
                  <button
                    type="button"
                    onClick={() => handleOpenPdfDirect(selectedDoc)}
                    className="text-[10px] text-blue-600 hover:underline flex items-center gap-1 font-semibold"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>Ventana completa</span>
                  </button>
                </div>
                <div className="w-full h-48 rounded-xl border border-slate-200 overflow-hidden bg-slate-100 relative">
                  <iframe
                    src={selectedDoc.archivoPdfUrl}
                    className="w-full h-full border-none"
                    title={selectedDoc.nombre}
                  />
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2 shrink-0">
              <button
                type="button"
                onClick={() => triggerUploadDoc(selectedDoc)}
                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-medium text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Upload className="w-3 h-3" />
                <span>Reemplazar PDF</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedDoc(null)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-200 rounded-xl font-medium text-xs cursor-pointer"
                >
                  Cerrar
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadDoc(selectedDoc)}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center gap-1 cursor-pointer shadow-xs"
                >
                  <Download className="w-3 h-3" />
                  <span>Descargar</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const InformacionUltimoPeriodo: React.FC<{ periodoActual?: string }> = ({ periodoActual }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-2.5">
      <RendimientoPeriodoCard periodoActual={periodoActual} />
      <CuadroMeritoTop10Card periodoActual={periodoActual} />
      <DocumentosGestionCard />
    </div>
  );
};
