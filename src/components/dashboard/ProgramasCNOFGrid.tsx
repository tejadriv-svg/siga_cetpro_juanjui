import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Clock,
  Award,
  Users,
  Layers,
  Building2,
  ChevronRight,
  ShieldCheck,
  Search,
  ArrowRight,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getProgramColor } from '../../utils/programColors';
import { isSamePeriodo } from '../../utils/normalizePeriodo';
import { Badge } from '../common/Badge';
import { ProgramaEstudio } from '../../types';

interface ProgramasCNOFGridProps {
  onSelectPrograma?: (programa: ProgramaEstudio) => void;
}

const isAuxiliarTecnico = (nivel?: string): boolean => {
  if (!nivel) return false;
  const n = nivel.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  return n.includes('auxiliar');
};

const isTecnico = (nivel?: string): boolean => {
  if (!nivel) return false;
  const n = nivel.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  return n.includes('tecnico') && !n.includes('auxiliar');
};

const isProgramaActivo = (prog: ProgramaEstudio): boolean => {
  if (!prog || !prog.nombre) return false;
  const st = (prog.estado ?? 'ACTIVO').toString().trim().toUpperCase();
  return st === 'ACTIVO';
};

const DOCENTES_ESPECIALISTAS: Record<string, { docente: string; titulo: string; turno: string; moduloActual: string }> = {
  'CAL-01': {
    docente: 'Prof. Marina Ruiz Pinedo',
    titulo: 'Especialista Patronaje',
    turno: 'Tarde (2:00 pm)',
    moduloActual: 'Módulo I: Calzado',
  },
  'MEC-02': {
    docente: 'Ing. Carlos Mendoza Ríos',
    titulo: 'Ing. Mecánico CNOF',
    turno: 'Mañana (8:00 am)',
    moduloActual: 'Módulo I: Frenos',
  },
  'PAN-03': {
    docente: 'Chef Rosa Elena Bartra',
    titulo: 'Especialista Panadería',
    turno: 'Mañana (8:00 am)',
    moduloActual: 'Módulo I: Masas',
  },
  'SOL-04': {
    docente: 'Prof. Jorge Luis Tapullima',
    titulo: 'Técnico Soldador 6G',
    turno: 'Tarde (2:00 pm)',
    moduloActual: 'Módulo I: SMAW',
  },
  'MAD-05': {
    docente: 'Prof. Segundo Vásquez',
    titulo: 'Especialista Muebles',
    turno: 'Mañana (8:00 am)',
    moduloActual: 'Módulo I: Armado',
  },
  'PEL-06': {
    docente: 'Prof. Rosa Mercedes García',
    titulo: 'Cosmiatra y Estilista',
    turno: 'Tarde (2:00 pm)',
    moduloActual: 'Módulo I: Barbería',
  },
  'TEX-07': {
    docente: 'Prof. Ana Gabriela Sánchez',
    titulo: 'Diseñadora de Modas',
    turno: 'Mañana (8:00 am)',
    moduloActual: 'Módulo I: Confección',
  },
};

export const ProgramasCNOFGrid: React.FC<ProgramasCNOFGridProps> = ({ onSelectPrograma }) => {
  const {
    programas = [],
    modulos = [],
    matriculas = [],
    secciones = [],
    trabajadores = [],
    personas = [],
    periodoActivo = '2026-2',
    metasProgramas = [],
    setActiveView,
  } = useApp();

  const [filterNivel, setFilterNivel] = useState<'TODOS' | 'Auxiliar Técnico' | 'Técnico'>('TODOS');
  const [searchTerm, setSearchTerm] = useState('');

  // 1. Filtrar únicamente los programas con estado Activo (máximo 7 activos)
  const activeProgramas = useMemo(() => {
    return programas.filter(isProgramaActivo);
  }, [programas]);

  const totalActivosCount = activeProgramas.length;
  const auxTecnicoCount = useMemo(() => {
    return activeProgramas.filter((p) => isAuxiliarTecnico(p.nivelFormativo)).length;
  }, [activeProgramas]);
  const tecnicoCount = useMemo(() => {
    return activeProgramas.filter((p) => isTecnico(p.nivelFormativo)).length;
  }, [activeProgramas]);

  // 2. Filtrado dinámico
  const filteredProgramas = useMemo(() => {
    return activeProgramas.filter((prog) => {
      let matchNivel = true;
      if (filterNivel === 'Auxiliar Técnico') {
        matchNivel = isAuxiliarTecnico(prog.nivelFormativo);
      } else if (filterNivel === 'Técnico') {
        matchNivel = isTecnico(prog.nivelFormativo);
      }

      const term = searchTerm.trim().toLowerCase();
      const matchSearch =
        term === '' ||
        (prog.nombre && prog.nombre.toLowerCase().includes(term)) ||
        (prog.codigo && prog.codigo.toLowerCase().includes(term)) ||
        (prog.tallerResponsable && prog.tallerResponsable.toLowerCase().includes(term));

      return matchNivel && matchSearch;
    });
  }, [activeProgramas, filterNivel, searchTerm]);

  const totalMatriculasPeriodo = useMemo(() => {
    return matriculas.filter((m) => {
      return isSamePeriodo(m.periodoAcademico, periodoActivo);
    }).length;
  }, [matriculas, periodoActivo]);

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs w-full space-y-3">
      {/* 1. Header de la Sección */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-semibold text-slate-900 tracking-tight">
                Programas de Estudio Activos (CNOF)
              </h3>
              <span className="text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/60 font-mono">
                {periodoActivo}
              </span>
              <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60 font-mono">
                {totalActivosCount} Activos
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Oferta educativa técnica modular autorizada bajo RVM 188-2020-MINEDU
            </p>
          </div>
        </div>

        {/* Controles de Búsqueda Rápida */}
        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar programa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 w-36 sm:w-48 shadow-2xs"
            />
          </div>

          <button
            type="button"
            onClick={() => setActiveView('programas')}
            className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 shadow-2xs"
          >
            <span>Ver Mallas</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Grid de 7 Recuadros Compactos para los 7 Programas Activos */}
      {filteredProgramas.length === 0 ? (
        <div className="py-8 px-4 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
          <p className="text-xs font-medium text-slate-500">No se encontraron programas activos</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2.5">
          {filteredProgramas.map((prog) => {
            const colorCfg = getProgramColor(prog.codigo, prog.color);

            // Módulos del programa
            const progModulos = modulos.filter((m) => m.programaId === prog.id);
            const numModulos = progModulos.length > 0 ? progModulos.length : prog.modulosCount || 2;

            // Matrículas en periodo activo
            const matriculasPrograma = matriculas.filter((m) => {
              const matchProg = m.programaId === prog.id;
              const matchPeriodo = !m.periodoAcademico || isSamePeriodo(m.periodoAcademico, periodoActivo);
              if (m.moduloId) {
                const isModActivo = progModulos.some((pm) => pm.id === m.moduloId || pm.codigo === m.moduloId);
                return matchProg && matchPeriodo && isModActivo;
              }
              return matchProg && matchPeriodo;
            });
            const matriculadosPeriodoActual = matriculasPrograma.length;

            // Metas
            const metaProg = metasProgramas.find((mp) => mp.programaId === prog.id);
            const metaCupos = metaProg?.meta || (prog.nivelFormativo === 'Técnico' ? 30 : 25);
            const percentAvance = Math.min(Math.round((matriculadosPeriodoActual / metaCupos) * 100), 100);

            // Docente
            const seccionActiva = secciones.find(
              (s) => progModulos.some((m) => m.id === s.moduloId) && isSamePeriodo(s.periodoAcademico, periodoActivo)
            );
            let docenteNombre = '';
            let turnoActivo = 'Mañana';

            if (seccionActiva) {
              turnoActivo = seccionActiva.turno || 'Mañana';
              const trab = trabajadores.find((t) => t.id === seccionActiva.trabajadorId);
              if (trab) {
                const per = personas.find((p) => p.id === trab.personaId);
                if (per) {
                  docenteNombre = per.nombres.split(' ')[0] + ' ' + per.apellidoPaterno;
                }
              }
            }

            if (!docenteNombre) {
              const defaultDoc = DOCENTES_ESPECIALISTAS[prog.codigo] || {
                docente: 'Docente Titular',
                titulo: 'Lic. Educación',
                turno: 'Mañana',
                moduloActual: 'Módulo I',
              };
              docenteNombre = defaultDoc.docente;
              turnoActivo = defaultDoc.turno;
            }

            // Horas y Créditos
            const totalHoras = prog.totalHoras || (prog.nivelFormativo === 'Técnico' ? 2000 : 950);
            const totalCreditos = prog.totalCreditos || (prog.nivelFormativo === 'Técnico' ? 80 : 40);

            return (
              <div
                key={prog.id}
                onClick={() => {
                  if (onSelectPrograma) {
                    onSelectPrograma(prog);
                  } else {
                    setActiveView('programas');
                  }
                }}
                className="bg-white rounded-xl border border-slate-200/90 hover:border-slate-300 p-3 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between cursor-pointer group relative overflow-hidden"
              >
                {/* Accent strip */}
                <div
                  className="absolute top-0 left-0 right-0 h-1"
                  style={{ backgroundColor: colorCfg.colorHex }}
                />

                <div className="space-y-2 pt-1">
                  {/* Badges */}
                  <div className="flex items-center justify-between gap-1">
                    <span
                      className="font-mono text-[10px] font-semibold px-1.5 py-0.5 rounded border"
                      style={{
                        backgroundColor: colorCfg.colorHex + '12',
                        color: colorCfg.colorHex,
                        borderColor: colorCfg.colorHex + '30',
                      }}
                    >
                      {prog.codigo}
                    </span>
                    <span
                      className={
                        'px-1.5 py-0.5 rounded text-[10px] font-medium ' +
                        (prog.nivelFormativo === 'Técnico'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200/60'
                          : 'bg-purple-50 text-purple-700 border border-purple-200/60')
                      }
                    >
                      {prog.nivelFormativo === 'Técnico' ? 'Técnico' : 'Aux. Téc.'}
                    </span>
                  </div>

                  {/* Nombre del Programa */}
                  <div>
                    <h4
                      className="font-semibold text-xs text-slate-900 leading-snug group-hover:text-blue-600 transition-colors line-clamp-2 min-h-[32px]"
                      title={prog.nombre}
                    >
                      {prog.nombre}
                    </h4>
                  </div>

                  {/* Métricas: Créditos, Horas, Módulos */}
                  <div className="grid grid-cols-3 gap-0.5 bg-slate-50 p-1.5 rounded-lg border border-slate-100 text-center">
                    <div>
                      <span className="text-[9px] text-slate-400 font-medium block">Créd.</span>
                      <strong className="text-xs font-mono font-semibold text-slate-800">{totalCreditos}</strong>
                    </div>
                    <div className="border-x border-slate-200/60 px-0.5">
                      <span className="text-[9px] text-slate-400 font-medium block">Horas</span>
                      <strong className="text-xs font-mono font-semibold text-slate-800">{totalHoras}</strong>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 font-medium block">Mód.</span>
                      <strong className="text-xs font-mono font-semibold text-slate-800">{numModulos}</strong>
                    </div>
                  </div>

                  {/* Docente y Turno */}
                  <div className="bg-slate-50/70 p-2 rounded-lg border border-slate-100 text-xs space-y-0.5">
                    <p className="font-medium text-slate-800 truncate" title={docenteNombre}>
                      {docenteNombre}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate">
                      {turnoActivo}
                    </p>
                  </div>

                  {/* Matrícula y Avance */}
                  <div className="space-y-1 pt-0.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Matrícula:</span>
                      <span className="font-mono font-semibold text-slate-900">
                        {matriculadosPeriodoActual} <span className="text-slate-400 font-normal">/{metaCupos}</span>
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.max(percentAvance, 5)}%`,
                          backgroundColor: colorCfg.colorHex,
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Footer link */}
                <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                  <span className="font-mono text-[10px] truncate max-w-[80px]">
                    {prog.resolucionAutorizacion ? prog.resolucionAutorizacion.substring(0, 10) : 'R.D.'}
                  </span>
                  <span className="font-medium text-blue-600 group-hover:text-blue-700 transition-colors flex items-center gap-0.5">
                    <span>Malla</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer informativo */}
      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            7 Programas autorizados por la DRE San Martín y articulados al <strong>Catálogo Nacional de la Oferta Formativa (CNOF)</strong>.
          </span>
        </div>
        <div className="font-mono text-xs text-slate-500 self-end sm:self-auto">
          Total Matrículas: <strong className="text-slate-900 font-semibold">{totalMatriculasPeriodo}</strong>
        </div>
      </div>
    </div>
  );
};
