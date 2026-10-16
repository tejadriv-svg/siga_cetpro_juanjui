import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import {
  TrendingUp,
  Layers,
  LineChart as LineIcon,
  BarChart2,
  CheckCircle2,
  Filter,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getProgramColor } from '../../utils/programColors';
import { isSamePeriodo, formatPeriodoDisplay, parsePeriodo } from '../../utils/normalizePeriodo';
import { ProgramaEstudio, Matricula, ModuloFormativo } from '../../types';

interface EstadisticaPeriodosProps {
  periodoActivo?: string;
  matriculasActualesCount?: number;
  matriculasDetalle?: Matricula[];
  programas?: ProgramaEstudio[];
}

interface PeriodoDef {
  key: string;
  label: string;
  anio: number;
  semestre: number;
  isActivo?: boolean;
}

export const EstadisticaPeriodos: React.FC<EstadisticaPeriodosProps> = ({
  periodoActivo: propPeriodoActivo,
  matriculasDetalle: propMatriculas,
  programas: propProgramas,
}) => {
  const context = useApp();
  const periodoActivo = propPeriodoActivo || context?.periodoActivo || '2026-2';
  const rawProgramas = propProgramas || context?.programas || [];
  const rawMatriculas = propMatriculas || context?.matriculas || [];
  const rawModulos = context?.modulos || [];
  const rawPeriodos = context?.periodosAcademicos || [];

  const [chartMode, setChartMode] = useState<'multiline' | 'stacked' | 'total'>('multiline');
  const [periodRange, setPeriodRange] = useState<'all' | 'recent'>('recent');
  const [visiblePrograms, setVisiblePrograms] = useState<Record<string, boolean>>({});
  const [highlightedProgramId, setHighlightedProgramId] = useState<string | null>(null);

  const dynamicPeriodos: PeriodoDef[] = useMemo(() => {
    let list: PeriodoDef[] = [];
    if (rawPeriodos && rawPeriodos.length > 0) {
      const sorted = [...rawPeriodos].sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));
      list = sorted.map((p) => {
        const parsed = parsePeriodo(p.nombre || p.codigo);
        return {
          key: parsed ? parsed.keyRoman : p.nombre!,
          label: parsed ? parsed.keyRoman : p.nombre!,
          anio: parsed ? parsed.anio : 2025,
          semestre: parsed ? parsed.semestre : 1,
          isActivo: p.estado === 'Activo' || p.estado === 'ACTIVO',
        };
      });
    } else {
      list = [
        { key: '2024-I', label: '2024-I', anio: 2024, semestre: 1 },
        { key: '2024-II', label: '2024-II', anio: 2024, semestre: 2 },
        { key: '2025-I', label: '2025-I', anio: 2025, semestre: 1 },
        { key: '2025-II', label: '2025-II', anio: 2025, semestre: 2 },
        { key: '2026-I', label: '2026-I', anio: 2026, semestre: 1 },
        { key: '2026-II', label: '2026-II', anio: 2026, semestre: 2, isActivo: true },
      ];
    }
    return list;
  }, [rawPeriodos]);

  // Consider strictly ACTIVO programs
  const displayedProgramas = useMemo(() => {
    const list = rawProgramas.filter((p) => {
      if (!p || !p.nombre) return false;
      const estado = (p.estado ?? 'ACTIVO').toString().trim().toUpperCase();
      return estado === 'ACTIVO';
    });

    return list.sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));
  }, [rawProgramas]);

  // Consider strictly ACTIVO modulos
  const activeModulos = useMemo(() => {
    return rawModulos.filter((m) => {
      if (!m || !m.nombre) return false;
      const estado = (m.estado ?? 'ACTIVO').toString().trim().toUpperCase();
      return estado === 'ACTIVO';
    });
  }, [rawModulos]);

  // Color mapping
  const programColorsMap = useMemo(() => {
    const map = new Map<string, ReturnType<typeof getProgramColor>>();
    displayedProgramas.forEach((prog) => {
      const colorCfg = getProgramColor(prog.codigo || prog.nombre, prog.color || prog.nombre);
      map.set(prog.id, colorCfg);
      if (prog.codigo) {
        map.set(prog.codigo, colorCfg);
      }
    });
    return map;
  }, [displayedProgramas]);

  // Initialize visibility
  useMemo(() => {
    setVisiblePrograms((prev) => {
      const next = { ...prev };
      let changed = false;
      displayedProgramas.forEach((p) => {
        if (next[p.id] === undefined) {
          next[p.id] = true;
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [displayedProgramas]);

  // Match function
  const matchMatriculaToProgram = (
    m: Matricula,
    prog: ProgramaEstudio,
    modulosList: ModuloFormativo[]
  ): boolean => {
    if (m.programaId && (m.programaId === prog.id || m.programaId === prog.codigo)) {
      if (m.moduloId) {
        const mod = modulosList.find((x) => x.id === m.moduloId || x.codigo === m.moduloId);
        return !!mod;
      }
      return true;
    }
    if (m.moduloId) {
      const mod = modulosList.find((x) => x.id === m.moduloId || x.codigo === m.moduloId);
      if (mod && (mod.programaId === prog.id || mod.programaId === prog.codigo)) {
        return true;
      }
    }
    return false;
  };

  // Active period counts per program
  const activePeriodCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    displayedProgramas.forEach((prog) => {
      const matching = rawMatriculas.filter((m) => {
        const isCurrent = isSamePeriodo(m.periodoAcademico, periodoActivo);
        return isCurrent && matchMatriculaToProgram(m, prog, activeModulos);
      });
      counts[prog.id] = matching.length;
    });
    return counts;
  }, [displayedProgramas, rawMatriculas, periodoActivo, activeModulos]);

  // Total in active period
  const totalActiveEnrollments = useMemo(() => {
    return Object.values(activePeriodCounts).reduce((acc: number, v: number) => acc + v, 0);
  }, [activePeriodCounts]);

  // Selected periods
  const activePeriodsList = useMemo(() => {
    if (periodRange === 'recent') {
      return dynamicPeriodos.slice(-6);
    }
    return dynamicPeriodos;
  }, [periodRange, dynamicPeriodos]);

  // Compute chart data row by row
  const periodosData = useMemo(() => {
    return activePeriodsList.map((periodo) => {
      const row: Record<string, any> = {
        periodo: periodo.label,
        codigo: `PER-ACA-${periodo.anio}-${periodo.semestre}`,
        isActivo: isSamePeriodo(periodo.key, periodoActivo),
        total: 0,
      };

      let sumTotal = 0;

      const realMatriculasForPeriod = rawMatriculas.filter((m) =>
        isSamePeriodo(m.periodoAcademico, periodo.key)
      );
      const hasRealData = realMatriculasForPeriod.length > 0;

      displayedProgramas.forEach((prog) => {
        let val = 0;
        if (hasRealData) {
          const matching = realMatriculasForPeriod.filter((m) =>
            matchMatriculaToProgram(m, prog, activeModulos)
          );
          val = matching.length;
        } else {
          val = 0;
        }

        row[prog.id] = val;
        sumTotal += val;
      });

      row.total = sumTotal;
      return row;
    });
  }, [activePeriodsList, displayedProgramas, rawMatriculas, periodoActivo, rawModulos]);

  const toggleProgram = (progId: string) => {
    setVisiblePrograms((prev) => ({
      ...prev,
      [progId]: !prev[progId],
    }));
  };

  const showAllPrograms = () => {
    const next: Record<string, boolean> = {};
    displayedProgramas.forEach((p) => {
      next[p.id] = true;
    });
    setVisiblePrograms(next);
  };

  const hideAllPrograms = () => {
    const next: Record<string, boolean> = {};
    displayedProgramas.forEach((p) => {
      next[p.id] = false;
    });
    setVisiblePrograms(next);
  };

  // Custom Tooltip (Estilo Supabase)
  const CustomTooltipContent = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    const rowData = payload[0]?.payload || {};
    const isActivoRow = rowData.isActivo;

    const currentItems = payload
      .filter((p: any) => p.dataKey !== 'total' && p.value !== undefined)
      .sort((a: any, b: any) => (b.value || 0) - (a.value || 0));

    const totalSum =
      rowData.total ||
      currentItems.reduce((acc: number, curr: any) => acc + (curr.value || 0), 0);

    return (
      <div className="bg-white/95 backdrop-blur-md text-slate-800 border border-slate-200/90 rounded-xl p-3 shadow-xl text-xs max-w-xs z-50 min-w-[220px]">
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2 mb-2">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-900 text-xs">Periodo {label}</span>
            {isActivoRow && (
              <span className="px-1.5 py-0.2 bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-mono font-medium rounded">
                ACTUAL
              </span>
            )}
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 font-medium block">Total</span>
            <span className="font-mono font-semibold text-slate-900 text-xs">{totalSum}</span>
          </div>
        </div>

        <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
          {currentItems.map((item: any) => {
            const prog = displayedProgramas.find((p) => p.id === item.dataKey);
            const colorCfg = programColorsMap.get(item.dataKey) || getProgramColor(prog?.codigo);
            const pct = totalSum > 0 ? ((item.value / totalSum) * 100).toFixed(1) : '0.0';

            return (
              <div key={item.dataKey} className="flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1.5 truncate">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: colorCfg.colorHex }}
                  />
                  <span className="text-slate-700 truncate font-medium">
                    {prog?.nombre || item.name}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 font-mono">
                  <span className="font-semibold text-slate-900">{item.value}</span>
                  <span className="text-[10px] text-slate-400">({pct}%)</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="border-t border-slate-100 mt-2 pt-1.5 flex items-center justify-between text-[11px] text-slate-500">
          <span>Consolidado</span>
          <span className="font-mono text-slate-800 font-medium">{totalSum} matriculados</span>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs w-full h-full flex flex-col justify-between">
      {/* Header with Title & Chart Mode Selectors */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5 flex-wrap min-w-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900">
              Evolución de Matrículas por Periodo
            </h3>
          </div>
          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200/60 text-xs font-mono font-medium rounded-md">
            Activo: {formatPeriodoDisplay(periodoActivo)} • {totalActiveEnrollments} est.
          </span>
        </div>

        {/* Action Controls estilo Segmented Control de Supabase */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Time range selector */}
          <div className="inline-flex p-0.5 bg-slate-100 rounded-lg border border-slate-200/70 text-xs">
            <button
              onClick={() => setPeriodRange('all')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                periodRange === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Histórico ({dynamicPeriodos.length})
            </button>
            <button
              onClick={() => setPeriodRange('recent')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                periodRange === 'recent'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Últimos 6
            </button>
          </div>

          {/* Chart Mode Toggle */}
          <div className="inline-flex p-0.5 bg-slate-100 rounded-lg border border-slate-200/70 text-xs">
            <button
              onClick={() => setChartMode('multiline')}
              title="Líneas por programa"
              className={`px-2 py-1 rounded-md text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                chartMode === 'multiline'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <LineIcon className="w-3.5 h-3.5" />
              <span>Líneas</span>
            </button>
            <button
              onClick={() => setChartMode('stacked')}
              title="Áreas apiladas"
              className={`px-2 py-1 rounded-md text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                chartMode === 'stacked'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Apiladas</span>
            </button>
            <button
              onClick={() => setChartMode('total')}
              title="Curva total consolidada"
              className={`px-2 py-1 rounded-md text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                chartMode === 'total'
                  ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>Total</span>
            </button>
          </div>
        </div>
      </div>

      {/* Selector y Chips de Programas */}
      <div className="py-2.5">
        <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <Filter className="w-3 h-3 text-slate-400" />
            <span>Filtro por Especialidad</span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={showAllPrograms}
              className="text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer font-medium"
            >
              <Eye className="w-3 h-3" />
              <span>Mostrar todos</span>
            </button>
            <span className="text-slate-300">•</span>
            <button
              onClick={hideAllPrograms}
              className="text-slate-500 hover:text-slate-700 flex items-center gap-1 cursor-pointer font-medium"
            >
              <EyeOff className="w-3 h-3" />
              <span>Ocultar todos</span>
            </button>
          </div>
        </div>

        {/* Chips Grid de Programas */}
        <div className="flex flex-wrap gap-1.5">
          {displayedProgramas.map((prog) => {
            const colorCfg =
              programColorsMap.get(prog.id) || getProgramColor(prog.codigo, prog.color);
            const isVisible = visiblePrograms[prog.id] !== false;
            const countActivo = activePeriodCounts[prog.id] || 0;
            const isHighlighted = highlightedProgramId === prog.id;

            return (
              <button
                key={prog.id}
                onClick={() => toggleProgram(prog.id)}
                onMouseEnter={() => setHighlightedProgramId(prog.id)}
                onMouseLeave={() => setHighlightedProgramId(null)}
                title={`${prog.codigo ? prog.codigo + ' - ' : ''}${prog.nombre}`}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs transition-all cursor-pointer select-none ${
                  isVisible
                    ? isHighlighted
                      ? 'bg-slate-50 border-slate-400 text-slate-900 shadow-2xs font-medium'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50/80 shadow-2xs'
                    : 'opacity-40 bg-slate-50 border-slate-200 text-slate-400 line-through'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: colorCfg.colorHex }}
                />
                <span className="truncate max-w-[130px] sm:max-w-[180px]">
                  {prog.nombre}
                </span>
                <span className="font-mono text-[11px] text-slate-500 font-medium shrink-0 ml-0.5">
                  {countActivo}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* CHART CANVAS */}
      <div className="h-60 sm:h-68 w-full pt-1">
        <ResponsiveContainer width="100%" height="100%">
          {chartMode === 'stacked' ? (
            <AreaChart data={periodosData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="periodo"
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
                tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#94a3b8', fontSize: 11 }}
              />
              <Tooltip content={<CustomTooltipContent />} />

              {displayedProgramas.map((prog) => {
                const colorCfg =
                  programColorsMap.get(prog.id) || getProgramColor(prog.codigo, prog.color);
                const isVisible = visiblePrograms[prog.id] !== false;
                if (!isVisible) return null;

                return (
                  <Area
                    key={prog.id}
                    type="monotone"
                    dataKey={prog.id}
                    name={prog.nombre}
                    stackId="1"
                    stroke={colorCfg.colorHex}
                    fill={colorCfg.colorHex}
                    fillOpacity={0.3}
                    strokeWidth={1.5}
                  />
                );
              })}
            </AreaChart>
          ) : chartMode === 'total' ? (
            <AreaChart data={periodosData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="colorTotalGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="periodo"
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
                tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#94a3b8', fontSize: 11 }}
              />
              <Tooltip content={<CustomTooltipContent />} />
              <Area
                type="monotone"
                dataKey="total"
                name="Total General de Matrículas"
                stroke="#2563eb"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorTotalGrad)"
                dot={{ r: 3.5, fill: '#2563eb', strokeWidth: 1.5, stroke: '#fff' }}
                activeDot={{ r: 5, stroke: '#2563eb', strokeWidth: 2, fill: '#fff' }}
              />
            </AreaChart>
          ) : (
            <LineChart data={periodosData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="periodo"
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
                tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#94a3b8', fontSize: 11 }}
              />
              <Tooltip content={<CustomTooltipContent />} />

              {displayedProgramas.map((prog) => {
                const colorCfg =
                  programColorsMap.get(prog.id) || getProgramColor(prog.codigo, prog.color);
                const isVisible = visiblePrograms[prog.id] !== false;
                const isHighlighted = highlightedProgramId === prog.id;
                const isAnyHighlighted = highlightedProgramId !== null;

                if (!isVisible) return null;

                return (
                  <Line
                    key={prog.id}
                    type="monotone"
                    dataKey={prog.id}
                    name={prog.nombre}
                    stroke={colorCfg.colorHex}
                    strokeWidth={isHighlighted ? 3 : isAnyHighlighted ? 1.5 : 2}
                    strokeOpacity={isHighlighted ? 1 : isAnyHighlighted ? 0.35 : 0.9}
                    dot={{
                      r: isHighlighted ? 4.5 : 3,
                      fill: colorCfg.colorHex,
                      strokeWidth: 1.5,
                      stroke: '#ffffff',
                    }}
                    activeDot={{
                      r: 5.5,
                      fill: colorCfg.colorHex,
                      stroke: '#ffffff',
                      strokeWidth: 2,
                    }}
                  />
                );
              })}
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Summary Footer */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2 text-xs text-slate-500 flex-wrap">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>
            Totales BD:{' '}
            {activePeriodsList.map((p, i) => {
              const count = periodosData.find((d) => d.periodo === p.key)?.total || 0;
              return (
                <span key={p.key} className="mr-1">
                  <span className="font-semibold text-slate-700">{count}</span> ({p.key})
                  {i < activePeriodsList.length - 1 ? ', ' : '.'}
                </span>
              );
            })}
          </span>
        </div>
        <div className="text-xs text-slate-400 font-mono">
          Total histórico: {rawMatriculas.length} matrículas
        </div>
      </div>
    </div>
  );
};
