import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { ProgramaEstudio } from '../../types';
import { Badge } from '../common/Badge';
import { ProgramaDetalleDrawer } from './ProgramaDetalleDrawer';
import { getProgramColor } from '../../utils/programColors';
import {
  BookOpen,
  Clock,
  Award,
  Layers,
  Sparkles,
  ChevronRight,
  GraduationCap,
  Building,
  CheckCircle2,
  Search,
  Users,
} from 'lucide-react';

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
  if (!prog) return false;
  const st = (prog.estado ?? 'Activo').toString().trim().toLowerCase();
  return st === 'activo' || st === 'activa' || st === 'active';
};

export const ProgramasView: React.FC = () => {
  const { programas = [], modulos = [], unidades = [], estudiantes = [], matriculas = [] } = useApp();
  const [selectedPrograma, setSelectedPrograma] = useState<ProgramaEstudio | null>(null);
  const [filterNivel, setFilterNivel] = useState<'TODOS' | 'Auxiliar Técnico' | 'Técnico'>('TODOS');
  const [searchTerm, setSearchTerm] = useState('');

  // 1. Filtrar programas con estado Activo
  const activeProgramas = useMemo(() => {
    return programas.filter(isProgramaActivo);
  }, [programas]);

  // Conteos
  const totalActivosCount = activeProgramas.length;
  const auxTecnicoCount = useMemo(() => {
    return activeProgramas.filter((p) => isAuxiliarTecnico(p.nivelFormativo)).length;
  }, [activeProgramas]);
  const tecnicoCount = useMemo(() => {
    return activeProgramas.filter((p) => isTecnico(p.nivelFormativo)).length;
  }, [activeProgramas]);

  // Filtrado
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
        (prog.tallerResponsable && prog.tallerResponsable.toLowerCase().includes(term)) ||
        (prog.resolucionAutorizacion && prog.resolucionAutorizacion.toLowerCase().includes(term));

      return matchNivel && matchSearch;
    });
  }, [activeProgramas, filterNivel, searchTerm]);

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  Programas de Estudio y Malla Curricular CNOF
                </h1>
                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-md text-[10px] font-mono font-bold uppercase">
                  RVM 188-2020-MINEDU
                </span>
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-[10px] font-mono font-bold uppercase">
                  {totalActivosCount} PROGRAMAS ACTIVOS
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Oferta formativa oficial de nivel Auxiliar Técnico y Técnico con módulos, unidades y créditos CNOF
              </p>
            </div>
          </div>

          {/* Filtros por Nivel y Búsqueda */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80 text-xs">
              <button
                type="button"
                onClick={() => setFilterNivel('TODOS')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  filterNivel === 'TODOS'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Todos ({totalActivosCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterNivel('Auxiliar Técnico')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  filterNivel === 'Auxiliar Técnico'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Aux. Técnico ({auxTecnicoCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterNivel('Técnico')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  filterNivel === 'Técnico'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Técnico ({tecnicoCount})
              </button>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar especialidad..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-44 sm:w-56"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Program Grid */}
      {filteredProgramas.length === 0 ? (
        <div className="py-12 px-4 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-white">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Search className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-800">No se encontraron programas activos</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            No hay programas con estado Activo para el nivel{' '}
            <strong className="text-slate-700 font-semibold">"{filterNivel}"</strong>
            {searchTerm ? ` o búsqueda "${searchTerm}"` : ''}.
          </p>
          <button
            type="button"
            onClick={() => {
              setFilterNivel('TODOS');
              setSearchTerm('');
            }}
            className="mt-4 px-4 py-2 bg-slate-50 hover:bg-slate-100 text-blue-600 border border-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Restablecer Filtros
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProgramas.map((prog) => {
            const progModulos = modulos.filter((m) => m.programaId === prog.id);
            const progEstudiantes = estudiantes.filter((e) => e.programaId === prog.id);
            const progMatriculas = matriculas.filter((m) => m.programaId === prog.id);
            const colorCfg = getProgramColor(prog.codigo, prog.color);

            return (
              <div
                key={prog.id}
                onClick={() => setSelectedPrograma(prog)}
                className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden"
                style={{
                  borderTopColor: colorCfg.colorHex,
                }}
              >
                {/* Barra superior de color de especialidad */}
                <div
                  className="absolute top-0 left-0 right-0 h-1.5"
                  style={{ backgroundColor: colorCfg.colorHex }}
                />

                <div className="space-y-3 pt-1">
                  <div className="flex items-center justify-between">
                    <span
                      className="font-mono text-[11px] font-extrabold px-2.5 py-0.5 rounded-md border tracking-wider"
                      style={{
                        backgroundColor: `${colorCfg.colorHex}15`,
                        color: colorCfg.colorHex,
                        borderColor: `${colorCfg.colorHex}35`,
                      }}
                    >
                      {prog.codigo}
                    </span>
                    <Badge
                      variant={isTecnico(prog.nivelFormativo) ? 'primary' : 'purple'}
                      size="sm"
                    >
                      {prog.nivelFormativo}
                    </Badge>
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900 text-sm group-hover:text-slate-800 transition-colors flex items-center gap-1.5">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: colorCfg.colorHex }}
                      />
                      <span>{prog.nombre}</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                      {prog.descripcion}
                    </p>
                  </div>

                  {/* Metrics */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                    <div className="bg-slate-50 p-2.5 rounded-xl">
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Horas Totales</span>
                      <strong className="text-slate-800 font-mono flex items-center gap-1 mt-0.5">
                        <Clock className="w-3.5 h-3.5 text-slate-600" />
                        {prog.totalHoras} hrs
                      </strong>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-xl">
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Créditos CNOF</span>
                      <strong className="text-slate-800 font-mono flex items-center gap-1 mt-0.5">
                        <Award className="w-3.5 h-3.5 text-purple-600" />
                        {prog.totalCreditos} Créditos
                      </strong>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                    <span>{progModulos.length > 0 ? progModulos.length : prog.modulosCount || 2} Módulos Formativos</span>
                    <span>{progEstudiantes.length} Alumnos Registrados</span>
                  </div>
                </div>

                <div
                  className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold group-hover:opacity-100 transition-opacity"
                  style={{ color: colorCfg.colorHex }}
                >
                  <span>Ver Módulos y Unidades</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Program Detail Drawer */}
      {selectedPrograma && (
        <ProgramaDetalleDrawer
          programa={selectedPrograma}
          onClose={() => setSelectedPrograma(null)}
        />
      )}
    </div>
  );
};
