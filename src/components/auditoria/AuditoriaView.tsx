import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { AuditoriaLog } from '../../types';
import { Badge } from '../common/Badge';
import { exportarAuditoriasExcel } from '../../utils/excelAuditorias';
import { AuditoriaDetalleModal } from './AuditoriaDetalleModal';
import {
  ShieldAlert,
  Search,
  History,
  User,
  Clock,
  Filter,
  CheckCircle2,
  FileText,
  FileSpreadsheet,
  RefreshCw,
  Eye,
  KeyRound,
  GraduationCap,
  Layers,
  AlertTriangle,
  Calendar,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export const AuditoriaView: React.FC = () => {
  const { auditoriaLogs, refreshAuditorias, institucion } = useApp();

  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('ALL');
  const [entityFilter, setEntityFilter] = useState<string>('ALL');
  const [fechaDesde, setFechaDesde] = useState<string>('');
  const [fechaHasta, setFechaHasta] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [selectedLog, setSelectedLog] = useState<AuditoriaLog | null>(null);

  // Paginación y límite de visualización (10 más recientes por defecto)
  const [limitCount, setLimitCount] = useState<number | 'ALL'>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Recargar datos desde el servidor
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshAuditorias({
        tabla: entityFilter,
        accion: actionFilter,
        fechaDesde: fechaDesde || undefined,
        fechaHasta: fechaHasta || undefined,
        busqueda: search || undefined,
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Filtrado reactivo en cliente para respuesta instantánea (ordenados por el más reciente)
  const filteredLogs = useMemo(() => {
    return auditoriaLogs
      .filter((log) => {
        const s = search.toLowerCase().trim();
        const matchesSearch =
          s === '' ||
          (log.usuarioNombre || '').toLowerCase().includes(s) ||
          (log.entidad || log.tabla || '').toLowerCase().includes(s) ||
          (log.detalles || log.detalle || '').toLowerCase().includes(s) ||
          (log.ip || '').includes(s);

        if (!matchesSearch) return false;

        if (actionFilter !== 'ALL') {
          if (actionFilter === 'CREDENCIALES' && !log.accion.includes('CREDENCIAL')) return false;
          if (actionFilter === 'ELIMINACIONES' && !log.accion.includes('ELIMIN') && !log.accion.includes('ANULAR')) return false;
          if (actionFilter === 'MODIFICACIONES' && !log.accion.includes('ACTUALIZ') && !log.accion.includes('EDIT')) return false;
          if (actionFilter === 'CREACIONES' && !log.accion.includes('CREAR') && !log.accion.includes('EMISION') && !log.accion.includes('NUEV')) return false;
        }

        if (entityFilter !== 'ALL') {
          const ent = (log.entidad || log.tabla || '').toUpperCase();
          if (!ent.includes(entityFilter.toUpperCase())) return false;
        }

        if (fechaDesde && log.timestamp) {
          const fLog = log.timestamp.split('T')[0];
          if (fLog < fechaDesde) return false;
        }

        if (fechaHasta && log.timestamp) {
          const fLog = log.timestamp.split('T')[0];
          if (fLog > fechaHasta) return false;
        }

        return true;
      })
      .sort((a, b) => {
        const timeA = a.timestamp || a.fecha || '';
        const timeB = b.timestamp || b.fecha || '';
        if (timeA && timeB) return timeB.localeCompare(timeA);
        return (Number(b.id) || 0) - (Number(a.id) || 0);
      });
  }, [auditoriaLogs, search, actionFilter, entityFilter, fechaDesde, fechaHasta]);

  // Reset a la página 1 cuando cambian los filtros o el límite
  useEffect(() => {
    setCurrentPage(1);
  }, [search, actionFilter, entityFilter, fechaDesde, fechaHasta, limitCount]);

  // Paginación y registros mostrados
  const totalLogs = filteredLogs.length;
  const pageSize = limitCount === 'ALL' ? totalLogs : limitCount;
  const totalPages = Math.max(1, Math.ceil(totalLogs / (pageSize || 1)));
  const effectivePage = Math.min(currentPage, totalPages);
  const displayedLogs = useMemo(() => {
    if (limitCount === 'ALL') return filteredLogs;
    const start = (effectivePage - 1) * pageSize;
    return filteredLogs.slice(start, start + pageSize);
  }, [filteredLogs, limitCount, effectivePage, pageSize]);

  // CÃ¡lculo de KPIs en tiempo real
  const kpis = useMemo(() => {
    const hoyStr = new Date().toISOString().split('T')[0];
    const total = auditoriaLogs.length;

    const eventosHoy = auditoriaLogs.filter((l) => {
      if (!l.timestamp) return false;
      return l.timestamp.startsWith(hoyStr);
    }).length;

    const seguridad = auditoriaLogs.filter((l) => 
      l.accion.includes('CREDENCIAL') || 
      l.accion.includes('ELIMIN') || 
      l.accion.includes('ANULAR') ||
      l.accion.includes('RETIRO')
    ).length;

    const academicos = auditoriaLogs.filter((l) => {
      const ent = (l.entidad || l.tabla || '').toLowerCase();
      return (
        ent.includes('nota') || 
        ent.includes('cert') || 
        ent.includes('titul') || 
        ent.includes('matric') || 
        ent.includes('egres')
      );
    }).length;

    return { total, eventosHoy, seguridad, academicos };
  }, [auditoriaLogs]);

  const handleExportExcel = () => {
    exportarAuditoriasExcel(filteredLogs, institucion);
  };

  const clearFilters = () => {
    setSearch('');
    setActionFilter('ALL');
    setEntityFilter('ALL');
    setFechaDesde('');
    setFechaHasta('');
  };

  const getActionBadge = (accion: string) => {
    if (accion.includes('CREDENCIAL')) return <Badge variant="warning" size="sm">ðŸ”‘ CREDENCIALES</Badge>;
    if (accion.includes('ELIMIN') || accion.includes('ANULAR')) return <Badge variant="danger" size="sm">{accion}</Badge>;
    if (accion.includes('CREAR') || accion.includes('EMISION') || accion.includes('NUEV')) return <Badge variant="success" size="sm">{accion}</Badge>;
    if (accion.includes('ACTUALIZ') || accion.includes('EDIT')) return <Badge variant="primary" size="sm">{accion}</Badge>;
    return <Badge variant="neutral" size="sm">{accion}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
              <ShieldAlert className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  AuditorÃ­a de Seguridad y Trazabilidad Institucional
                </h1>
                <span className="px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-md text-[10px] font-mono font-bold uppercase">
                  R.V.M. NÂ° 188-2020-MINEDU
                </span>
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-[10px] font-mono font-bold uppercase">
                  INMUTABLE
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                BitÃ¡cora legal de operaciones, cambios de notas, certificaciones, cobros y movimientos en PostgreSQL
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              title="Refrescar logs desde la base de datos"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Actualizando...' : 'Recargar'}</span>
            </button>

            <button
              onClick={handleExportExcel}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Exportar PadrÃ³n (.xlsx)</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Tarjetas KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-semibold block uppercase tracking-wider">Total Eventos</span>
            <span className="text-2xl font-black text-slate-900 font-mono mt-0.5 block">{kpis.total}</span>
            <span className="text-[10px] text-slate-400">Registrados en BD</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <History className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-semibold block uppercase tracking-wider">Operaciones Hoy</span>
            <span className="text-2xl font-black text-sky-700 font-mono mt-0.5 block">{kpis.eventosHoy}</span>
            <span className="text-[10px] text-sky-600 font-medium">Jornada actual</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-semibold block uppercase tracking-wider">Seguridad CrÃ­tica</span>
            <span className="text-2xl font-black text-amber-700 font-mono mt-0.5 block">{kpis.seguridad}</span>
            <span className="text-[10px] text-amber-600 font-medium">Credenciales y bajas</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <KeyRound className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-semibold block uppercase tracking-wider">GestiÃ³n AcadÃ©mica</span>
            <span className="text-2xl font-black text-purple-700 font-mono mt-0.5 block">{kpis.academicos}</span>
            <span className="text-[10px] text-purple-600 font-medium">TÃ­tulos, notas, actas</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <GraduationCap className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. Barra de BÃºsqueda y Filtros */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3 justify-between">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por usuario, rol, detalle, IP o entidad..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
            {/* Filtro AcciÃ³n */}
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:bg-white focus:outline-none"
            >
              <option value="ALL">Todas las Acciones</option>
              <option value="CREACIONES">Creaciones / Emisiones</option>
              <option value="MODIFICACIONES">Modificaciones / Ediciones</option>
              <option value="ELIMINACIONES">Eliminaciones / Anulaciones</option>
              <option value="CREDENCIALES">Cambio de Credenciales</option>
            </select>

            {/* Filtro Entidad */}
            <select
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:bg-white focus:outline-none"
            >
              <option value="ALL">Todos los MÃ³dulos</option>
              <option value="TITULOS">TÃ­tulos Profesionales</option>
              <option value="CERTIFICADOS_MODULARES">Certificados Modulares</option>
              <option value="CERTIFICADOS_ESTUDIOS">Certificados de Estudios</option>
              <option value="NOTAS">Calificaciones y EFSRT</option>
              <option value="MATRICULAS">MatrÃ­culas</option>
              <option value="EGRESADOS">Egresados</option>
              <option value="PAGOS">TesorerÃ­a y Caja</option>
              <option value="PERSONAS">PadrÃ³n de Personas</option>
              <option value="USUARIOS">Usuarios y Seguridad</option>
              <option value="DOCUMENTOS">Acervo Documental</option>
            </select>

            {/* Filtro Rango de Fechas */}
            <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 border border-slate-200 rounded-xl text-xs">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="date"
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
                className="bg-transparent text-[11px] text-slate-700 outline-none"
                title="Fecha Desde"
              />
              <span className="text-slate-400">-</span>
              <input
                type="date"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
                className="bg-transparent text-[11px] text-slate-700 outline-none"
                title="Fecha Hasta"
              />
            </div>

            {(search || actionFilter !== 'ALL' || entityFilter !== 'ALL' || fechaDesde || fechaHasta) && (
              <button
                onClick={clearFilters}
                className="p-2 text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs flex items-center gap-1 transition-all"
                title="Limpiar Filtros"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
          <span>
            Mostrando <strong>{filteredLogs.length}</strong> de <strong>{auditoriaLogs.length}</strong> eventos registrados
          </span>
          <span className="italic">
            Haga clic en el botÃ³n de inspecciÃ³n para comparar los datos anteriores vs nuevos.
          </span>
        </div>
      </div>

      {/* 4. Tabla de AuditorÃ­a */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50/80 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-4 py-3.5">Fecha y Hora</th>
                <th className="px-4 py-3.5">Usuario Responsable</th>
                <th className="px-4 py-3.5">AcciÃ³n</th>
                <th className="px-4 py-3.5">MÃ³dulo / Tabla</th>
                <th className="px-4 py-3.5">Detalles de la OperaciÃ³n</th>
                <th className="px-4 py-3.5 text-center">IP</th>
                <th className="px-4 py-3.5 text-center">InspecciÃ³n</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                    <ShieldAlert className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    No se encontraron registros de auditoría coincidentes con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                displayedLogs.map((log) => {
                  const tieneDiff = Boolean(log.datosAnteriores || log.datosNuevos);
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap font-mono text-[11px]">
                        {log.fecha || (log.timestamp ? new Date(log.timestamp).toLocaleString('es-PE') : '-')}
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900 text-xs">{log.usuarioNombre}</div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          {log.usuarioRol || log.rol || 'USUARIO'}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        {getActionBadge(log.accion)}
                      </td>

                      <td className="px-4 py-3">
                        <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-[11px] font-mono">
                          {log.entidad || log.tabla}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-slate-700 max-w-md">
                        <span className="line-clamp-2" title={log.detalles || log.detalle}>
                          {log.detalles || log.detalle || 'Operación registrada'}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-center text-slate-500 font-mono text-[11px]">
                        {log.ip || '127.0.0.1'}
                      </td>

                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className={`p-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 mx-auto transition-all cursor-pointer ${
                            tieneDiff
                              ? 'bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                          }`}
                          title="Inspeccionar datos y comparativa antes/después"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Detalle</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Barra de paginación y límite */}
        {totalLogs > 0 && (
          <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <span>
                Mostrando <strong className="text-slate-900">{displayedLogs.length}</strong> de <strong className="text-slate-900">{totalLogs}</strong> eventos (más recientes primero)
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 text-[11px]">Mostrar:</span>
                <select
                  value={limitCount}
                  onChange={(e) => setLimitCount(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
                  className="bg-white border border-slate-300 rounded px-2 py-1 text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-sky-500"
                >
                  <option value={10}>10 más recientes</option>
                  <option value={25}>25 por página</option>
                  <option value={50}>50 por página</option>
                  <option value="ALL">Todos ({totalLogs})</option>
                </select>
              </div>

              {limitCount !== 'ALL' && totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={effectivePage <= 1}
                    className="p-1 rounded border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700"
                    title="Página anterior"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[11px] font-semibold text-slate-700 px-1">
                    {effectivePage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={effectivePage >= totalPages}
                    className="p-1 rounded border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700"
                    title="Página siguiente"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 5. Modal de InspecciÃ³n Detallada (Diff) */}
      {selectedLog && (
        <AuditoriaDetalleModal
          isOpen={Boolean(selectedLog)}
          onClose={() => setSelectedLog(null)}
          log={selectedLog}
        />
      )}
    </div>
  );
};

