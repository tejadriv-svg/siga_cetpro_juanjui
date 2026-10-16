import React, { useMemo, useState } from 'react';
import { normalizeSexo } from '../../utils/genero';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import {
  Users,
  BookOpen,
  GraduationCap,
  Calendar,
  Layers,
  PieChart as PieIcon,
  BarChart3,
  Sparkles,
  Info,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { normalizePeriodo, isSamePeriodo } from '../../utils/normalizePeriodo';
import { getProgramColor } from '../../utils/programColors';
import { ProgramaEstudio, Matricula, ModuloFormativo, Persona, Estudiante } from '../../types';

interface EstadisticasPeriodoActualProps {
  periodoActivo?: string;
  documentosGestionSlot?: React.ReactNode;
}

const GENDER_COLORS = {
  Mujer: '#e11d48', // Rose 600
  Hombre: '#2563eb', // Blue 600
  'No especificado': '#64748b', // Slate 500
};

const AGE_BRACKET_COLORS = [
  '#14b8a6', // Teal 500
  '#06b6d4', // Cyan 500
  '#0ea5e9', // Sky 500
  '#3b82f6', // Blue 500
  '#6366f1', // Indigo 500
  '#8b5cf6', // Violet 500
  '#a855f7', // Purple 500
  '#d946ef', // Fuchsia 500
  '#ec4899', // Pink 500
  '#f43f5e', // Rose 500
];

function calculateAge(birthDateStr?: string): number | null {
  if (!birthDateStr) return null;
  const birth = new Date(birthDateStr);
  if (isNaN(birth.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
    age--;
  }
  return age >= 0 && age <= 120 ? age : null;
}

export const EstadisticasPeriodoActual: React.FC<EstadisticasPeriodoActualProps> = ({
  periodoActivo: propPeriodoActivo,
  documentosGestionSlot,
}) => {
  const context = useApp();
  const periodoActivo = propPeriodoActivo || context?.periodoActivo || '2026-2';
  const rawProgramas = context?.programas || [];
  const rawMatriculas = context?.matriculas || [];
  const rawModulos = context?.modulos || [];
  const rawEstudiantes = context?.estudiantes || [];
  const rawPersonas = context?.personas || [];
  const rawSecciones = context?.secciones || [];
  const rawTrabajadores = context?.trabajadores || [];

  const [selectedProgFilter, setSelectedProgFilter] = useState<string>('all');

  // 1. Programas Activos
  const activeProgramas = useMemo(() => {
    return rawProgramas.filter((p) => {
      if (!p || !p.nombre) return false;
      const estado = (p.estado ?? 'ACTIVO').toString().trim().toUpperCase();
      return estado === 'ACTIVO';
    });
  }, [rawProgramas]);

  // 1.1 Módulos Activos (pertenecientes a programas activos)
  const activeModulos = useMemo(() => {
    return rawModulos.filter((m) => {
      if (!m || !m.nombre) return false;
      const estado = (m.estado ?? 'ACTIVO').toString().trim().toUpperCase();
      if (estado !== 'ACTIVO') return false;
      return activeProgramas.some((p) => p.id === m.programaId || p.codigo === m.programaId);
    });
  }, [rawModulos, activeProgramas]);

  // 2. Mapeo de personas y estudiantes
  const personaByEstudianteId = useMemo(() => {
    const map = new Map<string, Persona>();
    rawEstudiantes.forEach((est) => {
      const per = rawPersonas.find((p) => p.id === est.personaId);
      if (per) {
        map.set(est.id, per);
      }
    });
    // También mapear personas directamente si el ID coincide
    rawPersonas.forEach((per) => {
      if (!map.has(per.id)) {
        map.set(per.id, per);
      }
    });
    return map;
  }, [rawEstudiantes, rawPersonas]);

  // Helper para vincular matrícula a programa activo
  const getMatriculaProgram = (m: Matricula): ProgramaEstudio | undefined => {
    if (m.programaId) {
      const found = activeProgramas.find((p) => p.id === m.programaId || p.codigo === m.programaId);
      if (found) return found;
    }
    if (m.moduloId) {
      const mod = activeModulos.find((x) => x.id === m.moduloId || x.codigo === m.moduloId);
      if (mod) {
        const found = activeProgramas.find((p) => p.id === mod.programaId || p.codigo === mod.programaId);
        if (found) return found;
      }
    }
    return undefined;
  };

  // Helper para vincular matrícula a módulo activo
  const getMatriculaModulo = (m: Matricula): ModuloFormativo | undefined => {
    if (m.moduloId) {
      return activeModulos.find((x) => x.id === m.moduloId || x.codigo === m.moduloId);
    }
    return undefined;
  };

  // 2. Nuevo estado para el filtro de periodos
  // Por defecto usa el periodo activo que viene como prop
  const [targetPeriod, setTargetPeriod] = useState<string>(periodoActivo);

  const periodosDisponibles = useMemo(() => {
    const periodos = new Set<string>();
    rawMatriculas.forEach(m => periodos.add(normalizePeriodo(m.periodoAcademico)));
    periodos.add(normalizePeriodo(periodoActivo));
    return Array.from(periodos).sort().reverse();
  }, [rawMatriculas, periodoActivo]);

  // 3. Matrículas del periodo objetivo (restringidas a programas activos)
  const datasetMatriculas = useMemo(() => {
    return rawMatriculas.filter((m) => {
      if (targetPeriod !== 'HISTORICO') {
        const isPeriod = isSamePeriodo(m.periodoAcademico, targetPeriod);
        if (!isPeriod) return false;
      }
      return getMatriculaProgram(m) !== undefined;
    });
  }, [rawMatriculas, targetPeriod, activeProgramas, activeModulos]);

  // --- DATOS 1: NÚMERO DE MATRÍCULAS POR PROGRAMA ---
  const dataPorPrograma = useMemo(() => {
    return activeProgramas.map((prog) => {
      const count = datasetMatriculas.filter((m) => {
        const p = getMatriculaProgram(m);
        return p?.id === prog.id || p?.codigo === prog.codigo;
      }).length;

      const colorCfg = getProgramColor(prog.codigo, prog.color);

      return {
        id: prog.id,
        codigo: prog.codigo,
        nombre: prog.nombre,
        nombreCorto: prog.codigo,
        matriculas: count,
        color: colorCfg.colorHex,
        colorBg: colorCfg.colorBgLight,
        nivel: prog.nivelFormativo,
      };
    });
  }, [activeProgramas, datasetMatriculas, activeModulos]);

  // --- DATOS 2: NÚMERO DE MATRÍCULAS POR SECCIÓN / MÓDULO (12 SECCIONES EN CONFORMACIÓN) ---
  const dataPorModulo = useMemo(() => {
    // 1. Secciones del periodo con estado ACTIVO
    const activeSecciones = rawSecciones.filter((s) => {
      const isPeriod = isSamePeriodo(s.periodoAcademico, targetPeriod === 'HISTORICO' ? periodoActivo : targetPeriod);
      const isSecActiva = (s.estado ?? 'ACTIVO').toString().trim().toUpperCase() === 'ACTIVO';
      return isPeriod && isSecActiva;
    });

    let secList = activeSecciones;

    if (selectedProgFilter !== 'all') {
      secList = secList.filter((sec) => {
        const prog = activeProgramas.find((p) => p.id === selectedProgFilter || p.codigo === selectedProgFilter);
        const mod = rawModulos.find((m) => m.id === sec.moduloId || m.codigo === sec.moduloId);
        return (
          sec.programaId === prog?.id ||
          sec.programaId === prog?.codigo ||
          mod?.programaId === prog?.id ||
          mod?.programaId === prog?.codigo
        );
      });
    }

    const result = secList.map((sec) => {
      const mod = rawModulos.find((m) => m.id === sec.moduloId || m.codigo === sec.moduloId);
      const prog = activeProgramas.find(
        (p) => p.id === sec.programaId || p.codigo === sec.programaId || p.id === mod?.programaId || p.codigo === mod?.programaId
      );
      const colorCfg = getProgramColor(prog?.codigo, prog?.color);

      // Contar matrículas de esta sección específica
      const count = datasetMatriculas.filter((m) => {
        if (m.seccionId && m.seccionId === sec.id) return true;
        if (!m.seccionId && m.moduloId && (m.moduloId === sec.moduloId || m.moduloId === mod?.id || m.moduloId === mod?.codigo)) {
          const peers = activeSecciones.filter((s) => s.moduloId === sec.moduloId);
          if (peers.length === 1) return true;
        }
        return false;
      }).length;

      let docenteNombre = 'Sin asignar';
      if (sec.trabajadorId) {
        const trabajador = rawTrabajadores.find((t) => t.id === sec.trabajadorId);
        if (trabajador) {
          const docentePersona = rawPersonas.find((p) => p.id === trabajador.personaId);
          if (docentePersona) {
            docenteNombre = `${docentePersona.nombres} ${docentePersona.apellidoPaterno}`;
          }
        }
      }

      // Nombre amigable y sede corta
      const rawSede = (sec.sedeNombre || 'Juanjui')
        .replace('Sede Principal ', '')
        .replace('Sede ', '')
        .trim();

      const moduloCode = mod?.codigo ? mod.codigo.split('-').slice(-2).join('-') : 'MOD';
      const moduloNombre = mod?.nombre || sec.nombre.replace(/^Sección [A-Z] - /, '');

      return {
        id: sec.id,
        codigo: sec.codigo || sec.id,
        nombre: moduloNombre,
        seccionNombre: sec.nombre,
        sedeLabel: rawSede,
        moduloCode: moduloCode,
        programaNombre: prog?.nombre || 'General',
        programaCodigo: prog?.codigo || '',
        periodo: sec.periodoAcademico || periodoActivo,
        sede: sec.sedeNombre || 'Principal',
        turno: sec.turno || 'Mañana',
        docente: docenteNombre,
        matriculas: count,
        capacidad: sec.capacidad || 30,
        horas: mod?.horas || 0,
        creditos: mod?.creditos || 0,
        color: colorCfg.colorHex,
      };
    });

    return result.sort((a, b) => b.matriculas - a.matriculas);
  }, [rawSecciones, rawModulos, activeProgramas, datasetMatriculas, selectedProgFilter, rawTrabajadores, rawPersonas, periodoActivo, targetPeriod]);

  const dataPorEdad = useMemo(() => {
    // 1. Recolectar frecuencias por edad exacta
    const countsByAge = new Map<number, number>();
    
    datasetMatriculas.forEach((m) => {
      const persona = personaByEstudianteId.get(m.estudianteId);
      const age = calculateAge(persona?.fechaNacimiento);
      if (age !== null && age >= 10 && age <= 100) { 
        countsByAge.set(age, (countsByAge.get(age) || 0) + 1);
      }
    });

    // 2. Ordenar las edades encontradas de menor a mayor
    const uniqueAges = Array.from(countsByAge.keys()).sort((a, b) => a - b);
    
    // 3. Crear la estructura para el gráfico
    const totalCalculado = Array.from(countsByAge.values()).reduce((acc, count) => acc + count, 0);

    return uniqueAges.map((age, i) => {
      const count = countsByAge.get(age) || 0;
      return {
        key: `age_${age}`,
        label: `${age} años`,
        start: age,
        end: age,
        count,
        porcentaje: totalCalculado > 0 ? Math.round((count / totalCalculado) * 100) : 0,
        color: AGE_BRACKET_COLORS[i % AGE_BRACKET_COLORS.length],
      };
    });
  }, [datasetMatriculas, personaByEstudianteId]);

  // --- DATOS 4: NÚMERO DE MATRÍCULAS POR SEXO ---
  const dataPorSexo = useMemo(() => {
    let countMujer = 0;
    let countHombre = 0;
    let countOtro = 0;

    datasetMatriculas.forEach((m) => {
      const persona = personaByEstudianteId.get(m.estudianteId);
      const s = normalizeSexo(persona?.sexo);
      if (s === 'M') {
        countMujer++;
      } else {
        countHombre++;
      }
    });

    const total = countMujer + countHombre + countOtro;

    const list = [
      {
        name: 'Mujeres (M)',
        genero: 'Mujer',
        value: countMujer,
        color: GENDER_COLORS['Mujer'],
        porcentaje: total > 0 ? Math.round((countMujer / total) * 100) : 0,
      },
      {
        name: 'Hombres (H)',
        genero: 'Hombre',
        value: countHombre,
        color: GENDER_COLORS['Hombre'],
        porcentaje: total > 0 ? Math.round((countHombre / total) * 100) : 0,
      },
    ];

    if (countOtro > 0) {
      list.push({
        name: 'No especificado',
        genero: 'No especificado',
        value: countOtro,
        color: GENDER_COLORS['No especificado'],
        porcentaje: total > 0 ? Math.round((countOtro / total) * 100) : 0,
      });
    }

    return list;
  }, [datasetMatriculas, personaByEstudianteId]);


  const CustomModuloXAxisTick = (props: any) => {
    const { x, y, payload } = props;
    const secData = dataPorModulo.find((d) => d.id === payload.value);
    if (!secData) return null;
    return (
      <g transform={`translate(${x},${y})`}>
        <text x={0} y={0} dy={12} textAnchor="end" fill="#334155" fontSize={10} fontWeight={600} transform="rotate(-35)">
          {secData.moduloCode}
        </text>
        <text x={0} y={0} dy={23} textAnchor="end" fill="#64748b" fontSize={9} fontWeight={500} transform="rotate(-35)">
          {secData.sedeLabel}
        </text>
      </g>
    );
  };

  const totalMatriculasAnalizadas = datasetMatriculas.length;

  return (
    <div className="space-y-3 w-full">
      {/* Cabecera Principal con Selector de Periodo */}
      <div className="bg-white border border-slate-200/90 rounded-xl px-5 py-3 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm font-semibold text-slate-900 tracking-tight">
                {targetPeriod === 'HISTORICO' ? 'Estadísticas Históricas' : 'Estadísticas del Periodo'}
              </h2>
              {targetPeriod !== 'HISTORICO' && (
                <span className="text-xs font-mono font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                  {targetPeriod}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Distribución por Programa, Módulo, Edad y Sexo
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <select
            value={targetPeriod}
            onChange={(e) => setTargetPeriod(e.target.value)}
            className="text-xs bg-white border border-slate-200 text-slate-700 rounded-lg px-2.5 py-1.5 font-medium shadow-2xs focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
          >
            <option value={periodoActivo}>Periodo Actual ({periodoActivo})</option>
            {periodosDisponibles.filter((p) => p !== periodoActivo).map((p) => (
              <option key={p} value={p}>Periodo {p}</option>
            ))}
            <option value="HISTORICO">Total Histórico (Todos)</option>
          </select>

          <span className="text-xs text-slate-500 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200/60 font-mono">
            Total: <span className="text-slate-900 font-semibold">{totalMatriculasAnalizadas}</span>
          </span>
        </div>
      </div>

      {/* Grid de 4 Columnas Modulares */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
        {/* DIAGRAMA 1: MATRÍCULAS POR PROGRAMA (1 de 4 partes) */}
        <div className="lg:col-span-1 bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900 leading-tight">
                  Por Programa
                </h3>
                <p className="text-xs text-slate-500">
                  {activeProgramas.length} Especialidades
                </p>
              </div>
            </div>
          </div>

          <div className="h-64 sm:h-72 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={dataPorPrograma}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis
                  type="number"
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
                  allowDecimals={false}
                />
                <YAxis
                  type="category"
                  dataKey="nombre"
                  tickFormatter={(val) => (val.length > 16 ? val.substring(0, 16) + '...' : val)}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#334155', fontSize: 11, fontWeight: 500 }}
                  width={115}
                />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white/95 backdrop-blur-md text-slate-800 p-3 rounded-xl border border-slate-200 shadow-xl text-xs space-y-1.5 min-w-[200px]">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: data.color }}
                            />
                            <span className="font-semibold text-slate-900">{data.nombre}</span>
                            <span className="text-[11px] text-slate-400">({data.nivel})</span>
                          </div>
                          <div className="pt-1.5 border-t border-slate-100 flex justify-between items-center">
                            <span className="text-slate-500">Matriculados:</span>
                            <span className="font-semibold text-xs font-mono text-slate-900">
                              {data.matriculas} estudiantes
                            </span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="matriculas" barSize={14} radius={[0, 4, 4, 0]}>
                  {dataPorPrograma.map((entry) => (
                    <Cell key={`cell-prog-${entry.id}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-2 pt-2 border-t border-slate-100 grid grid-cols-2 gap-1.5 text-xs">
            {dataPorPrograma.slice(0, 4).map((p) => (
              <div key={p.id} className="flex items-center gap-1.5 truncate">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                <span className="text-slate-600 truncate text-[11px]" title={p.nombre}>{p.nombre}:</span>
                <span className="font-mono text-slate-900 font-semibold text-[11px]">{p.matriculas}</span>
              </div>
            ))}
          </div>
        </div>

        {/* DIAGRAMA 2: MATRÍCULAS POR SECCIÓN / MÓDULO (2 de 4 partes) */}
        <div className="lg:col-span-2 bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-slate-900 leading-tight">
                    Matrículas por Sección en Conformación
                  </h3>
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-xs font-mono font-medium">
                    {dataPorModulo.length} Secciones
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Oferta académica formativa activa en el periodo
                </p>
              </div>
            </div>

            {/* Selector de filtro opcional por programa */}
            {activeProgramas.length > 1 && (
              <select
                value={selectedProgFilter}
                onChange={(e) => setSelectedProgFilter(e.target.value)}
                className="text-xs bg-white border border-slate-200 text-slate-700 rounded-lg px-2.5 py-1 font-medium shadow-2xs focus:outline-none cursor-pointer max-w-[160px] truncate"
              >
                <option value="all">Todas ({dataPorModulo.length})</option>
                {activeProgramas.map((prog) => (
                  <option key={prog.id} value={prog.id}>
                    {prog.codigo} - {prog.nombre.substring(0, 16)}...
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="h-64 sm:h-72 w-full pt-1">
            {dataPorModulo.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={dataPorModulo}
                  margin={{ top: 10, right: 10, left: -20, bottom: 55 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="id"
                    tickLine={false}
                    axisLine={{ stroke: '#cbd5e1' }}
                    tick={<CustomModuloXAxisTick />}
                    interval={0}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    cursor={{ fill: '#f8fafc' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white/95 backdrop-blur-md text-slate-800 p-3 rounded-xl border border-slate-200 shadow-xl text-xs space-y-1.5 max-w-[280px]">
                            <div className="flex items-center gap-2">
                              <span
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: data.color }}
                              />
                              <span className="font-semibold text-slate-900 text-xs">{data.codigo}</span>
                            </div>
                            <p className="text-xs text-blue-700 font-medium leading-snug">
                              {data.seccionNombre}
                            </p>
                            <p className="text-[11px] text-slate-600">
                              Módulo: {data.nombre}
                            </p>
                            <div className="space-y-0.5 text-[11px] text-slate-500 pt-1.5 border-t border-slate-100">
                              <p><span className="text-slate-400">Programa:</span> {data.programaNombre}</p>
                              <p><span className="text-slate-400">Sede:</span> {data.sede} • <span className="text-slate-400">Turno:</span> {data.turno}</p>
                              <p><span className="text-slate-400">Docente:</span> {data.docente}</p>
                            </div>
                            <div className="pt-1.5 border-t border-slate-100 flex justify-between items-center">
                              <span className="text-slate-500">Matriculados:</span>
                              <span className="font-semibold text-xs font-mono text-slate-900">
                                {data.matriculas} / {data.capacidad} vacantes
                              </span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="matriculas" barSize={16} radius={[4, 4, 0, 0]}>
                    {dataPorModulo.map((entry) => (
                      <Cell key={`cell-mod-${entry.id}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs text-center p-4">
                <BookOpen className="w-7 h-7 text-slate-300 mb-2" />
                <p>No se encontraron secciones activas para este filtro.</p>
              </div>
            )}
          </div>

          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>{dataPorModulo.length} secciones activas ofertadas</span>
            <span className="font-mono font-medium text-slate-700">
              Promedio: {Math.round(totalMatriculasAnalizadas / Math.max(dataPorModulo.length, 1))} / sección
            </span>
          </div>
        </div>

        {/* DIAGRAMA 3: MATRÍCULAS POR SEXO (1 de 4 partes) */}
        <div className="lg:col-span-1 bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900 leading-tight">
                  Por Sexo
                </h3>
                <p className="text-xs text-slate-500">
                  Distribución por género
                </p>
              </div>
            </div>
            <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
              DNI
            </span>
          </div>

          {/* Gráfico Donut Elegante */}
          <div className="h-64 sm:h-72 w-full flex items-center justify-center relative my-auto">
            <div className="w-full h-full max-w-[240px] max-h-[240px] relative shrink-0 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white/95 backdrop-blur-md text-slate-800 p-2.5 rounded-xl border border-slate-200 shadow-xl text-xs space-y-1 min-w-[150px]">
                            <div className="flex items-center gap-1.5">
                              <span
                                className="w-2.5 h-2.5 rounded-full"
                                style={{ backgroundColor: data.color }}
                              />
                              <span className="font-semibold text-slate-900">{data.name}</span>
                            </div>
                            <div className="pt-1 border-t border-slate-100 flex justify-between items-center text-xs">
                              <span className="text-slate-500">Total:</span>
                              <span className="font-semibold font-mono text-slate-900">
                                {data.value} ({data.porcentaje}%)
                              </span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Pie
                    data={dataPorSexo}
                    cx="50%"
                    cy="50%"
                    innerRadius={68}
                    outerRadius={96}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {dataPorSexo.map((entry, index) => (
                      <Cell key={`cell-sex-${index}`} fill={entry.color} stroke="#ffffff" strokeWidth={2} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              {/* Centro del Donut */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-semibold tracking-tight text-slate-900 leading-none">
                  {totalMatriculasAnalizadas}
                </span>
                <span className="text-xs text-slate-400 font-medium mt-1">
                  Estudiantes
                </span>
              </div>
            </div>
          </div>

          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-around text-xs">
            {dataPorSexo.map((s) => (
              <div key={s.name} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                <span className="text-slate-600 font-medium">{s.genero}:</span>
                <span className="font-mono text-slate-900 font-semibold">{s.value}</span>
                <span className="text-slate-400 font-mono text-[11px]">({s.porcentaje}%)</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FILA 3: MATRÍCULAS POR EDAD Y DOCUMENTOS DE GESTIÓN */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
        {/* DIAGRAMA 4: MATRÍCULAS POR GRUPO DE EDAD (3 de 4 partes) */}
        <div className="lg:col-span-3 bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900 leading-tight">
                  Matrículas por Edad (Distribución Completa)
                </h3>
                <p className="text-xs text-slate-500">
                  Rango etario según DNI de estudiantes registrados
                </p>
              </div>
            </div>
            <span className="text-xs font-mono text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200/60">
              {dataPorEdad.length} Edades Registradas
            </span>
          </div>

          <div className="h-64 sm:h-72 w-full pt-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={dataPorEdad}
                margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tick={{ fill: '#475569', fontSize: 10, fontWeight: 500 }}
                  interval={dataPorEdad.length > 20 ? 1 : 0}
                  angle={-45}
                  textAnchor="end"
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
                  allowDecimals={false}
                />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white/95 backdrop-blur-md text-slate-800 p-2.5 rounded-xl border border-slate-200 shadow-xl text-xs space-y-1 min-w-[170px]">
                          <div className="flex items-center gap-1.5">
                            <span
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: data.color }}
                            />
                            <span className="font-semibold text-slate-900 text-xs">{data.label}</span>
                          </div>
                          <div className="pt-1 border-t border-slate-100 flex justify-between items-center">
                            <span className="text-slate-500">Estudiantes:</span>
                            <span className="font-semibold text-xs font-mono text-slate-900">
                              {data.count} ({data.porcentaje}%)
                            </span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="count" barSize={14} radius={[3, 3, 0, 0]}>
                  {dataPorEdad.map((entry, index) => (
                    <Cell key={`cell-age-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CUADRO DOCUMENTOS DE GESTIÓN (1 de 4 partes) */}
        {documentosGestionSlot && (
          <div className="lg:col-span-1 flex flex-col h-full">
            {documentosGestionSlot}
          </div>
        )}
      </div>
    </div>
  );
};
