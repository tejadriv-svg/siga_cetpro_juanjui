import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { EstadisticaPeriodos } from './EstadisticaPeriodos';
import { EstadisticasPeriodoActual } from './EstadisticasPeriodoActual';
import {
  RendimientoPeriodoCard,
  CuadroMeritoTop10Card,
  DocumentosGestionCard,
} from './InformacionUltimoPeriodo';
import { ProgramasCNOFGrid } from './ProgramasCNOFGrid';
import { isSamePeriodo } from '../../utils/normalizePeriodo';
import {
  Users,
  GraduationCap,
  Wallet,
  Receipt,
  FileCheck2,
  BookOpen,
  Calendar,
  Sparkles,
  ArrowRight,
  Search,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';

export const DashboardView: React.FC = () => {
  const {
    periodoActivo,
    programas,
    modulos,
    secciones,
    estudiantes,
    matriculas,
    recibos,
    documentosOficiales,
    metasProgramas,
    personas,
    setActiveView,
    setSelectedEstudianteId,
    addToast,
    refreshData,
    currentUser,
  } = useApp();

  const [tableSearch, setTableSearch] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Silently refresh data on mount
  React.useEffect(() => {
    refreshData().catch(console.error);
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const cacheKeys = [
        'siga_personas', 'siga_estudiantes', 'siga_trabajadores',
        'siga_matriculas', 'siga_notas_unidades', 'siga_notas_efsrt',
        'siga_recibos', 'siga_secciones', 'siga_modulos', 'siga_unidades',
        'siga_programas', 'siga_sedes', 'siga_aulas', 'siga_turnos'
      ];
      cacheKeys.forEach(k => localStorage.removeItem(k));
      
      await refreshData();
      addToast('Base de Datos Sincronizada', 'Todos los datos se han actualizado con éxito.', 'success');
    } catch (e) {
      addToast('Error al sincronizar', 'No se pudieron obtener los datos de la base de datos.', 'error');
    } finally {
      setIsRefreshing(false);
    }
  };

  const programasActivos = programas.filter(
    (p) => (p.estado ?? 'ACTIVO').toString().trim().toUpperCase() === 'ACTIVO'
  );
  const modulosActivos = modulos.filter(
    (m) =>
      (m.estado ?? 'ACTIVO').toString().trim().toUpperCase() === 'ACTIVO' &&
      programasActivos.some((p) => p.id === m.programaId || p.codigo === m.programaId)
  );

  const targetPeriod = periodoActivo?.codigo || periodoActivo?.nombre;

  // Computed metrics
  const matriculasActivas = matriculas.filter((m) => {
    if (targetPeriod && !isSamePeriodo(m.periodoAcademico, targetPeriod)) return false;
    const isProg = programasActivos.some((p) => p.id === m.programaId || p.codigo === m.programaId);
    if (m.moduloId) {
      const isMod = modulosActivos.some((mo) => mo.id === m.moduloId || mo.codigo === m.moduloId);
      return isProg || isMod;
    }
    return isProg;
  });

  const recibosActivos = recibos.filter((r) => {
    if (!periodoActivo) return true;
    const isAfterStart = !periodoActivo.fechaInicio || r.fechaEmision >= periodoActivo.fechaInicio;
    const isBeforeEnd = !periodoActivo.fechaFin || r.fechaEmision <= periodoActivo.fechaFin;
    return isAfterStart && isBeforeEnd;
  });

  const documentosOficialesActivos = documentosOficiales.filter((doc) => {
    if (!targetPeriod) return true;
    return isSamePeriodo(doc.periodoAcademico, targetPeriod);
  });

  const totalMatriculados = matriculasActivas.length;
  const totalMeta =
    metasProgramas
      .filter((mp) => programasActivos.some((p) => p.id === mp.programaId))
      .reduce((acc, m) => acc + m.metaMatricula, 0) || 120;
  const percentMeta = totalMeta > 0 ? Math.round((totalMatriculados / totalMeta) * 100) : 0;

  const totalRecaudado = recibosActivos
    .filter((r) => r.estado === 'Emitido')
    .reduce((acc, r) => acc + r.monto, 0);

  const totalPersonasRegistradas = personas.length;

  // Filtered matriculas for quick search (ordered by most recent)
  const filteredMatriculas = matriculasActivas
    .filter((mat) => {
      if (!tableSearch) return true;
      const est = estudiantes.find((e) => e.id === mat.estudianteId);
      const per = est ? personas.find((p) => p.id === est.personaId) : undefined;
      const prog = programas.find((p) => p.id === mat.programaId);
      const mod = modulos.find((m) => m.id === mat.moduloId);
      const query = tableSearch.toLowerCase().trim();
      const fullName = per
        ? (per.nombres + ' ' + (per.apellidoPaterno || '') + ' ' + (per.apellidoMaterno || '')).toLowerCase()
        : '';
      return (
        fullName.includes(query) ||
        per?.numeroDocumento.includes(query) ||
        prog?.nombre.toLowerCase().includes(query) ||
        mod?.nombre.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => new Date(b.fechaMatricula || 0).getTime() - new Date(a.fechaMatricula || 0).getTime());

  // Recent receipts for side card
  const recentRecibos = [...recibosActivos]
    .sort(
      (a, b) =>
        new Date(b.fechaRegistro || b.fechaEmision || 0).getTime() -
        new Date(a.fechaRegistro || a.fechaEmision || 0).getTime()
    )
    .slice(0, 5);

  return (
    <div className="space-y-4 pb-8 w-full">
      {/* ========================================================================= */}
      {/* 0. HEADER PRINCIPAL (Estilo Supabase Dashboard)                           */}
      {/* ========================================================================= */}
      <div className="bg-white border border-slate-200/90 rounded-xl px-5 py-3.5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-2xs">
            <Sparkles className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-base sm:text-lg font-semibold text-slate-900 tracking-tight">
                Panel General Institucional
              </h1>
              <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200/60 font-mono">
                {periodoActivo?.nombre || '2026-II'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Métricas consolidadas de gestión académica, matrícula y oferta formativa
            </p>
          </div>
        </div>

        {/* Controles de Período y Sincronización */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200/80 rounded-lg text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500 font-medium">Periodo:</span>
            <span className="font-semibold text-slate-800 font-mono">
              {periodoActivo?.codigo || '2026-2'}
            </span>
          </div>

          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white rounded-lg text-xs font-medium transition-colors shadow-2xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Sincronizando...' : 'Sincronizar'}</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. TARJETAS KPI (5 Módulos Equilibrados y Estéticos estilo Supabase)       */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* KPI 1: Matrículas Activas */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs hover:border-slate-300 transition-colors flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Matrículas Activas</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-semibold tracking-tight text-slate-900">
              {totalMatriculados.toLocaleString()}
            </span>
            <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60 font-mono">
              {percentMeta}% meta
            </span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-3">
            <div
              className="bg-blue-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(percentMeta, 100)}%` }}
            />
          </div>
        </div>

        {/* KPI 2: Recaudación Caja TUPA */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs hover:border-slate-300 transition-colors flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Recaudación de Caja</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-900 truncate">
              S/ {totalRecaudado.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2 flex items-center justify-between">
            <span>Caja TUPA</span>
            <span className="text-slate-600 font-medium font-mono">{recibosActivos.length} recibos</span>
          </p>
        </div>

        {/* KPI 3: Programas de Estudio */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs hover:border-slate-300 transition-colors flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Programas de Estudio</span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-semibold tracking-tight text-slate-900">
              {programasActivos.length}
            </span>
            <span className="text-xs font-medium text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200/60 font-mono">
              {modulosActivos.length} módulos
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Oferta formativa autorizada CNOF
          </p>
        </div>

        {/* KPI 4: Certificados Oficiales */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs hover:border-slate-300 transition-colors flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Certificados Emitidos</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <FileCheck2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-semibold tracking-tight text-slate-900">
              {documentosOficialesActivos.length}
            </span>
            <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/60">
              QR Oficial
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Documentos y actas validadas
          </p>
        </div>

        {/* KPI 5: Padrón DNI */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs hover:border-slate-300 transition-colors flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Padrón Institucional</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-semibold tracking-tight text-slate-900">
              {totalPersonasRegistradas.toLocaleString()}
            </span>
            <span className="text-xs font-medium text-slate-600 font-mono">
              Personas
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Comunidad educativa unificada
          </p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. FILA 1: EVOLUCIÓN HISTÓRICA + RENDIMIENTO + CUADRO DE MÉRITO            */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
        {/* Gráfico de Evolución: 2 partes */}
        <div className="lg:col-span-2 flex flex-col">
          <EstadisticaPeriodos
            periodoActivo={periodoActivo}
            matriculasActualesCount={totalMatriculados}
            matriculasDetalle={matriculasActivas}
            programas={programasActivos}
          />
        </div>

        {/* Balance y Rendimiento: 1 parte */}
        <div className="lg:col-span-1 flex flex-col">
          <RendimientoPeriodoCard periodoActual={periodoActivo} />
        </div>

        {/* Cuadro de Mérito Top 10: 1 parte */}
        <div className="lg:col-span-1 flex flex-col">
          <CuadroMeritoTop10Card periodoActual={periodoActivo} />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. FILAS 2 & 3: ESTADÍSTICAS DEL PERIODO ACTUAL                           */}
      {/* ========================================================================= */}
      <EstadisticasPeriodoActual
        periodoActivo={periodoActivo}
        documentosGestionSlot={<DocumentosGestionCard />}
      />

      {/* ========================================================================= */}
      {/* 4. FILA 4: ÚLTIMAS MATRÍCULAS Y CAJA RECIENTE                             */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
        {/* Tabla Últimas Matrículas (3 de 4 partes) */}
        <div className="lg:col-span-3 bg-white border border-slate-200/90 rounded-xl shadow-2xs flex flex-col justify-between overflow-hidden">
          <div>
            {/* Header de la Tabla */}
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between gap-3 flex-wrap bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    Últimas Matrículas Registradas
                  </h3>
                  <p className="text-xs text-slate-500">
                    Estudiantes incorporados recientemente en el periodo activo
                  </p>
                </div>
                <span className="ml-1 px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-xs font-mono font-medium">
                  {filteredMatriculas.length}
                </span>
              </div>

              {/* Buscador y Enlace Ver Todos */}
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Filtrar estudiante, DNI o programa..."
                    value={tableSearch}
                    onChange={(e) => setTableSearch(e.target.value)}
                    className="w-48 sm:w-60 pl-8 pr-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                </div>

                <button
                  onClick={() => setActiveView('estudiantes')}
                  className="text-blue-600 hover:text-blue-700 text-xs font-medium flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <span>Ver Todos</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Tabla */}
            <div className="overflow-x-auto w-full">
              {filteredMatriculas.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  {tableSearch
                    ? 'No se encontraron matrículas con ese criterio de búsqueda'
                    : 'No hay matrículas registradas en este periodo'}
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50/70 border-b border-slate-200/80 text-xs font-medium text-slate-500">
                    <tr>
                      <th className="px-4 py-2.5 font-medium">Estudiante</th>
                      <th className="px-4 py-2.5 font-medium">Documento</th>
                      <th className="px-4 py-2.5 font-medium">Programa de Estudio</th>
                      <th className="px-4 py-2.5 font-medium">Módulo / Sección</th>
                      <th className="px-4 py-2.5 text-right font-medium">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredMatriculas.slice(0, 8).map((mat) => {
                      const est = estudiantes.find((e) => e.id === mat.estudianteId);
                      const per = est ? personas.find((p) => p.id === est.personaId) : undefined;
                      const prog = programas.find((p) => p.id === mat.programaId);
                      const mod = modulos.find((m) => m.id === mat.moduloId);
                      const sec = mat.seccionId ? secciones.find((s) => s.id === mat.seccionId) : undefined;

                      const studentName = per
                        ? `${per.apellidoPaterno} ${per.apellidoMaterno || ''}, ${per.nombres}`
                        : 'Estudiante';

                      return (
                        <tr
                          key={mat.id}
                          onClick={() => {
                            setSelectedEstudianteId(mat.estudianteId);
                            setActiveView('estudiantes');
                          }}
                          className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                        >
                          <td className="px-4 py-2.5">
                            <p className="font-medium text-slate-900 group-hover:text-blue-600 transition-colors">
                              {studentName}
                            </p>
                            <span className="text-[11px] text-slate-400">
                              F. Matrícula: {mat.fechaMatricula || 'Registrado'}
                            </span>
                          </td>
                          <td className="px-4 py-2.5">
                            <span className="font-mono text-xs text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200/60">
                              {per?.numeroDocumento || '---'}
                            </span>
                          </td>
                          <td className="px-4 py-2.5">
                            <p className="font-medium text-slate-800">{prog?.nombre || 'Programa'}</p>
                            <span className="text-[11px] text-slate-400 font-mono">
                              {prog?.codigo || '---'}
                            </span>
                          </td>
                          <td className="px-4 py-2.5">
                            <p className="text-slate-700 truncate max-w-[200px]" title={mod?.nombre}>
                              {mod?.nombre || 'Módulo Formativo'}
                            </p>
                            <span className="text-[11px] text-slate-400">
                              Secc: {sec?.nombre || 'Única'}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            <span className="text-blue-600 group-hover:text-blue-700 font-medium text-xs inline-flex items-center gap-1">
                              <span>Ficha</span>
                              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Footer de la Tabla */}
          <div className="px-4 py-2.5 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Mostrando las últimas 8 matrículas del periodo</span>
            <span className="font-medium text-slate-700">
              Total periodo: {matriculasActivas.length} estudiantes
            </span>
          </div>
        </div>

        {/* Caja y Recibos Recientes (1 de 4 partes) */}
        <div className="lg:col-span-1 bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 leading-tight">
                    Caja y Recibos
                  </h3>
                  <p className="text-xs text-slate-500">Recaudación TUPA</p>
                </div>
              </div>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60 font-mono">
                S/ {totalRecaudado.toFixed(2)}
              </span>
            </div>

            {/* Lista Recibos */}
            <div className="mt-3 space-y-2 max-h-[220px] overflow-y-auto pr-0.5 custom-scrollbar">
              {recentRecibos.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  Sin recibos emitidos en este periodo
                </div>
              ) : (
                recentRecibos.map((rec) => {
                  const per = personas.find((p) => p.id === rec.personaId);
                  const contribuyente = per
                    ? `${per.nombres.split(' ')[0]} ${per.apellidoPaterno}`
                    : 'Contribuyente';

                  return (
                    <div
                      key={rec.id}
                      onClick={() => setActiveView('tesoreria')}
                      className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/60 hover:bg-white hover:border-slate-300 hover:shadow-2xs transition-all flex items-center justify-between gap-2 cursor-pointer"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-xs text-slate-800 truncate">
                          {contribuyente}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate">
                          {rec.numeroRecibo} • {rec.conceptoNombre}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-mono font-medium text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
                          S/ {rec.monto.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-400">Módulo de Caja</span>
            <button
              type="button"
              onClick={() => setActiveView('tesoreria')}
              className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 cursor-pointer"
            >
              <span>Ir a Tesorería</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. FILA 5: PROGRAMAS CNOF GRID (PARTE INFERIOR)                           */}
      {/* ========================================================================= */}
      <ProgramasCNOFGrid />
    </div>
  );
};
