import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ReciboPago } from '../../types';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { NuevoCobroModal } from './NuevoCobroModal';
import { ArqueoCajaModal } from './ArqueoCajaModal';
import { ReciboImprimibleModal } from './ReciboImprimibleModal';
import { AmortizarCuotaModal } from './AmortizarCuotaModal';
import { EstadoCuentaModal } from './EstadoCuentaModal';
import {
  Wallet,
  Receipt,
  PlusCircle,
  Search,
  Calendar,
  CreditCard,
  Printer,
  Ban,
  ArrowUpRight,
  Filter,
  DollarSign,
  Smartphone,
  Building,
  Trash2,
  AlertTriangle,
  HeartHandshake,
  ChevronLeft,
  ChevronRight,
  BookOpen,
} from 'lucide-react';

export const TesoreriaView: React.FC = () => {
  const {
    recibos,
    personas,
    conceptosPago,
    currentUser,
    anularRecibo,
    deleteRecibo,
    periodoActivo,
    hasPermission,
  } = useApp();

  const canCobrar = hasPermission('TESORERIA', 'COBRAR');
  const canAnular = hasPermission('TESORERIA', 'ANULAR');
  const canEliminar = currentUser?.rol === 'DIRECTOR' || currentUser?.rol === 'ADMINISTRADOR';

  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [beneficioFilter, setBeneficioFilter] = useState<string>('ALL');
  const [isCobroModalOpen, setIsCobroModalOpen] = useState(false);
  const [isArqueoModalOpen, setIsArqueoModalOpen] = useState(false);
  const [isEstadoCuentaOpen, setIsEstadoCuentaOpen] = useState(false);
  const [reciboToAmortizar, setReciboToAmortizar] = useState<ReciboPago | null>(null);
  const [selectedReciboForPrint, setSelectedReciboForPrint] = useState<ReciboPago | null>(null);
  const [reciboToDelete, setReciboToDelete] = useState<ReciboPago | null>(null);
  const [reciboToAnular, setReciboToAnular] = useState<ReciboPago | null>(null);
  const [motivoAnulacion, setMotivoAnulacion] = useState('');

  // Financial calculations
  const totalEmitido = recibos
    .filter((r) => r.estado === 'Emitido' || r.estado === 'Pagado')
    .reduce((acc, r) => acc + r.monto, 0);

  const totalEfectivo = recibos
    .filter((r) => (r.estado === 'Emitido' || r.estado === 'Pagado') && r.metodoPago === 'Efectivo')
    .reduce((acc, r) => acc + r.monto, 0);

  const totalDigital = recibos
    .filter((r) => (r.estado === 'Emitido' || r.estado === 'Pagado') && r.metodoPago === 'Yape / Plin')
    .reduce((acc, r) => acc + r.monto, 0);

  const totalBanco = recibos
    .filter((r) => (r.estado === 'Emitido' || r.estado === 'Pagado') && r.metodoPago === 'Banco de la Nación')
    .reduce((acc, r) => acc + r.monto, 0);

  const totalPorCobrar = recibos
    .filter((r) => r.estado !== 'Anulado')
    .reduce((acc, r) => acc + (r.montoPendiente || 0), 0);

  const totalSubvencionado = recibos
    .filter((r) => r.estado !== 'Anulado' && r.montoDescuento && r.montoDescuento > 0)
    .reduce((acc, r) => acc + (r.montoDescuento || 0), 0);

  // Filter receipts
  const filteredRecibos = recibos.filter((r) => {
    const persona = personas.find((p) => p.id === r.personaId);
    
    const s = search.toLowerCase().trim();
    const fullName = persona ? `${persona.nombres || ''} ${persona.apellidoPaterno || ''} ${persona.apellidoMaterno || ''}`.toLowerCase() : '';
    const matchesSearch = s === '' ||
      (r.numeroRecibo || '').toLowerCase().includes(s) ||
      (r.conceptoNombre || '').toLowerCase().includes(s) ||
      (r.beneficioNombre || '').toLowerCase().includes(s) ||
      (persona && (persona.numeroDocumento || '').includes(s)) ||
      fullName.includes(s);

    if (!matchesSearch) return false;
    if (methodFilter !== 'ALL' && r.metodoPago !== methodFilter) return false;
    if (statusFilter !== 'ALL' && r.estado !== statusFilter) return false;

    if (beneficioFilter !== 'ALL') {
      if (beneficioFilter === 'REGULAR' && r.beneficioTipo && r.beneficioTipo !== 'REGULAR') return false;
      if (beneficioFilter === 'BENEFICIOS' && (!r.beneficioTipo || r.beneficioTipo === 'REGULAR')) return false;
      if (beneficioFilter === 'CONVENIO' && r.beneficioTipo !== 'CONVENIO') return false;
      if (beneficioFilter === 'EXONERADO' && r.beneficioTipo !== 'EXONERADO') return false;
      if (beneficioFilter === 'BECA_COMPLETA' && r.beneficioTipo !== 'BECA_COMPLETA') return false;
      if (beneficioFilter === 'SEMIBECA' && r.beneficioTipo !== 'SEMIBECA') return false;
    }

    return true;
  }).sort((a, b) => {
    const dateA = new Date(a.fechaEmision || a.fechaPago || (a as any).createdAt || 0).getTime();
    const dateB = new Date(b.fechaEmision || b.fechaPago || (b as any).createdAt || 0).getTime();
    if (dateB !== dateA) return dateB - dateA;
    return (b.id || '').localeCompare(a.id || '');
  });

  const [limitCount, setLimitCount] = useState<number | 'ALL'>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [search, methodFilter, statusFilter, beneficioFilter, limitCount]);

  const totalItems = filteredRecibos.length;
  const pageSize = limitCount === 'ALL' ? totalItems : limitCount;
  const totalPages = Math.max(1, Math.ceil(totalItems / (pageSize || 1)));
  const effectivePage = Math.min(currentPage, totalPages);
  const displayedRecibos = limitCount === 'ALL'
    ? filteredRecibos
    : filteredRecibos.slice((effectivePage - 1) * pageSize, effectivePage * pageSize);

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  Control de Caja y Tesorería Institucional
                </h1>
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-[10px] font-mono font-bold uppercase">
                  TUPA OFICIAL
                </span>
                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-md text-[10px] font-mono font-bold uppercase">
                  {periodoActivo}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Recaudación por conceptos de matrícula, certificados modulares, constancias y cursos de formación continua
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => setIsEstadoCuentaOpen(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              title="Consultar deudas y estado de cuenta consolidado por estudiante"
            >
              <Search className="w-4 h-4" />
              <span>Consultar Estado de Cuenta</span>
            </button>

            <button
              onClick={() => setIsArqueoModalOpen(true)}
              className="px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Calendar className="w-4 h-4 text-slate-500" />
              <span>Arqueo Diario</span>
            </button>

            {canCobrar ? (
              <button
                onClick={() => setIsCobroModalOpen(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Nuevo Cobro en Ventanilla</span>
              </button>
            ) : (
              <div className="px-3 py-1.5 bg-slate-100 text-slate-500 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-200">
                <span>Modo Consulta</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Recaudado
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2 font-mono">
            S/ {totalEmitido.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {recibos.filter((r) => r.estado === 'Emitido' || r.estado === 'Pagado').length} comprobantes válidos
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Efectivo en Caja
            </span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2 font-mono">
            S/ {totalEfectivo.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Ventanilla CETPRO Juanjuí</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Billeteras Digitales
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Smartphone className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2 font-mono">
            S/ {totalDigital.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Yape / Plin institucional</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Banco de la Nación
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Building className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2 font-mono">
            S/ {totalBanco.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Cuenta Corriente Pública</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-indigo-200 bg-indigo-50/20 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-indigo-800 uppercase tracking-wider">
              Subvenciones / Becas
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <HeartHandshake className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-indigo-700 mt-2 font-mono">
            S/ {totalSubvencionado.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-indigo-600 mt-1">
            {recibos.filter((r) => r.estado !== 'Anulado' && r.montoDescuento && r.montoDescuento > 0).length} exonerados / convenios
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-amber-200 bg-amber-50/20 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider">
              Saldo por Cobrar
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs">
              S/
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-700 mt-2 font-mono">
            S/ {totalPorCobrar.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-amber-600 mt-1">Cuotas pendientes</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por N° Recibo, DNI, convenio o concepto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={beneficioFilter}
            onChange={(e) => setBeneficioFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:bg-white focus:outline-none"
          >
            <option value="ALL">Todas las Tarifas / Beneficios</option>
            <option value="REGULAR">Tarifa Regular (Sin beneficio)</option>
            <option value="BENEFICIOS">Con Beneficio / Exoneración</option>
            <option value="CONVENIO">Convenios Institucionales</option>
            <option value="BECA_COMPLETA">Becas Completas (100%)</option>
            <option value="SEMIBECA">Semibecas (50%)</option>
            <option value="EXONERADO">Exonerados Oficiales (100%)</option>
          </select>

          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:bg-white focus:outline-none"
          >
            <option value="ALL">Todos los Métodos de Pago</option>
            <option value="Efectivo">Efectivo</option>
            <option value="Yape / Plin">Yape / Plin</option>
            <option value="Banco de la Nación">Banco de la Nación</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:bg-white focus:outline-none"
          >
            <option value="ALL">Todos los Estados</option>
            <option value="Emitido">Emitidos</option>
            <option value="Pagado">Pagados</option>
            <option value="Pendiente">Pendientes / Cuotas</option>
            <option value="Anulado">Anulados</option>
          </select>
        </div>
      </div>

      {/* Receipts Table or Empty State */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredRecibos.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
              <Receipt className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800">
              {search || methodFilter !== 'ALL' || statusFilter !== 'ALL'
                ? 'No se encontraron recibos con los filtros actuales'
                : 'Aún no hay comprobantes emitidos en caja'}
            </h4>
            <p className="text-xs text-slate-500 max-w-sm mt-1">
              {search || methodFilter !== 'ALL' || statusFilter !== 'ALL'
                ? 'Intenta restablecer la búsqueda o los filtros de método y estado.'
                : 'Registra cobros en ventanilla para emisión de recibos oficiales, matrículas o constancias.'}
            </p>
            <div className="flex gap-2.5 mt-4">
              <button
                onClick={() => setIsCobroModalOpen(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Nuevo Cobro en Ventanilla</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">N° Recibo</th>
                  <th className="px-4 py-3">Contribuyente / Estudiante</th>
                  <th className="px-4 py-3">Concepto Institucional</th>
                  <th className="px-4 py-3">Método / Op.</th>
                  <th className="px-4 py-3">Monto Cancelado</th>
                  <th className="px-4 py-3">Saldo Deudor</th>
                  <th className="px-4 py-3">Fecha y Hora</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">Comprobante</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedRecibos.map((rec) => {
                  const per = personas.find((p) => p.id === rec.personaId);
                  const isAnulado = rec.estado === 'Anulado';
                  const isPendiente = rec.estado === 'Pendiente' || (rec.montoPendiente && rec.montoPendiente > 0);

                  return (
                    <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">
                        {rec.numeroRecibo}
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900">
                          {per ? `${per.apellidoPaterno} ${per.apellidoMaterno}, ${per.nombres}` : 'Persona'}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          DNI: {per?.numeroDocumento}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="text-slate-900 font-bold">{rec.conceptoNombre}</div>
                        {rec.glosaDetalle && (
                          <div className="text-[11px] text-blue-700 font-medium italic mt-0.5">
                            Glosa: {rec.glosaDetalle}
                          </div>
                        )}
                        {rec.programaNombre && (
                          <div className="text-[10px] text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                            <BookOpen className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="font-semibold text-slate-700">{rec.programaNombre}</span>
                            {rec.moduloNombre && <span>• {rec.moduloNombre}</span>}
                            {rec.periodoCodigo && <span className="text-slate-400">({rec.periodoCodigo})</span>}
                          </div>
                        )}
                        {rec.totalCuotas && rec.totalCuotas > 1 ? (
                          <div className="text-[10px] text-blue-600 font-semibold mt-0.5">
                            Cuota {rec.numeroCuota || 1} de {rec.totalCuotas} (Total: S/ {(rec.montoTotal || rec.monto).toFixed(2)})
                          </div>
                        ) : null}
                        {rec.beneficioTipo && rec.beneficioTipo !== 'REGULAR' && (
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                              {rec.beneficioTipo === 'CONVENIO' ? `Convenio: ${rec.beneficioNombre || 'Institucional'}` :
                               rec.beneficioTipo === 'BECA_COMPLETA' ? 'Beca Completa (100%)' :
                               rec.beneficioTipo === 'SEMIBECA' ? 'Semibeca (50%)' :
                               rec.beneficioTipo === 'EXONERADO' ? 'Exonerado (100%)' : 'Caso Social'}
                            </span>
                            {rec.montoDescuento && rec.montoDescuento > 0 ? (
                              <span className="text-[10px] text-red-600 font-semibold">
                                (-S/ {rec.montoDescuento.toFixed(2)})
                              </span>
                            ) : null}
                            {rec.documentoSustento && (
                              <span className="text-[9px] text-slate-500 font-mono" title={`Sustento: ${rec.documentoSustento}`}>
                                Doc: {rec.documentoSustento}
                              </span>
                            )}
                          </div>
                        )}
                        {rec.observaciones && (
                          <div className="text-[10px] text-slate-400 italic truncate max-w-[200px] mt-0.5">
                            {rec.observaciones}
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <Badge variant="primary" size="sm">{rec.metodoPago}</Badge>
                        {rec.numeroOperacion && (
                          <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                            {rec.numeroOperacion}
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3 font-bold font-mono text-slate-900 text-sm">
                        {rec.monto === 0 && rec.beneficioTipo && rec.beneficioTipo !== 'REGULAR' ? (
                          <div className="flex flex-col items-start gap-0.5">
                            <span className="text-emerald-700 font-black text-[11px] px-2 py-0.5 bg-emerald-50 border border-emerald-300 rounded font-sans">
                              GRATUIDAD S/ 0.00
                            </span>
                            {rec.montoOriginal !== undefined && rec.montoOriginal > 0 && (
                              <span className="text-[10px] text-slate-400 line-through font-normal">
                                Base: S/ {rec.montoOriginal.toFixed(2)}
                              </span>
                            )}
                          </div>
                        ) : (
                          <div>
                            <div>S/ {(rec.monto || 0).toFixed(2)}</div>
                            {rec.montoOriginal !== undefined && rec.montoOriginal > rec.monto && (
                              <div className="text-[10px] text-slate-400 line-through font-normal">
                                Base: S/ {rec.montoOriginal.toFixed(2)}
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3 font-mono text-xs">
                        {rec.montoPendiente !== undefined && rec.montoPendiente > 0 ? (
                          <div className="text-amber-700 font-bold">
                            S/ {rec.montoPendiente.toFixed(2)}
                            {rec.fechaVencimiento && (
                              <div className="text-[10px] font-normal text-slate-400">
                                Vence: {rec.fechaVencimiento}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">S/ 0.00</span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">
                        <div>{rec.fechaEmision}</div>
                        <div className="text-[10px] text-slate-400">{rec.horaEmision}</div>
                      </td>

                      <td className="px-4 py-3">
                        <Badge
                          variant={
                            isAnulado
                              ? 'danger'
                              : isPendiente
                              ? 'warning'
                              : rec.estado === 'Pagado'
                              ? 'success'
                              : 'primary'
                          }
                          size="sm"
                          dot
                        >
                          {rec.estado}
                        </Badge>
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {rec.montoPendiente !== undefined && rec.montoPendiente > 0 && !isAnulado && canCobrar && (
                            <button
                              onClick={() => setReciboToAmortizar(rec)}
                              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                              title="Cobrar cuota pendiente / Amortizar"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              <span>Cobrar Cuota</span>
                            </button>
                          )}

                          <button
                            onClick={() => setSelectedReciboForPrint(rec)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                            title="Imprimir Recibo"
                          >
                            <Printer className="w-3.5 h-3.5 text-slate-500" />
                            <span>Voucher</span>
                          </button>

                          {!isAnulado && canAnular && (
                            <button
                              onClick={() => {
                                setReciboToAnular(rec);
                                setMotivoAnulacion('');
                              }}
                              className="p-1 text-slate-400 hover:text-amber-600 rounded-lg transition-colors cursor-pointer"
                              title="Anular recibo"
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {canEliminar && (
                            <button
                              onClick={() => setReciboToDelete(rec)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                              title="Eliminar registro de pago"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Barra de Paginación y Control de Registros */}
        {totalItems > 0 && (
          <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <span>
                Mostrando <strong className="text-slate-900">{displayedRecibos.length}</strong> de <strong className="text-slate-900">{totalItems}</strong> recibos emitidos (más recientes primero)
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-500">Ver:</span>
                <select
                  value={limitCount}
                  onChange={(e) => {
                    const val = e.target.value === 'ALL' ? 'ALL' : Number(e.target.value);
                    setLimitCount(val);
                  }}
                  className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
                >
                  <option value={10}>10 recientes</option>
                  <option value={25}>25 por página</option>
                  <option value={50}>50 por página</option>
                  <option value="ALL">Todos ({totalItems})</option>
                </select>
              </div>

              {limitCount !== 'ALL' && totalPages > 1 && (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={effectivePage === 1}
                    className="p-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    title="Página anterior"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-[11px] font-medium px-1">
                    {effectivePage} de {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={effectivePage === totalPages}
                    className="p-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    title="Página siguiente"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <NuevoCobroModal
        isOpen={isCobroModalOpen}
        onClose={() => setIsCobroModalOpen(false)}
        initialPersonaId={
          personas.find(p => 
            search.trim() && (
              (p.numeroDocumento || '').trim() === search.trim() ||
              `${p.nombres || ''} ${p.apellidoPaterno || ''} ${p.apellidoMaterno || ''}`.toLowerCase().includes(search.toLowerCase().trim())
            )
          )?.id
        }
        initialSearchTerm={search.trim()}
        onReciboCreated={(rec, shouldPrint) => {
          setIsCobroModalOpen(false);
          if (shouldPrint) {
            setSelectedReciboForPrint(rec);
          }
        }}
      />

      <ArqueoCajaModal
        isOpen={isArqueoModalOpen}
        onClose={() => setIsArqueoModalOpen(false)}
      />

      {selectedReciboForPrint && (
        <ReciboImprimibleModal
          isOpen={!!selectedReciboForPrint}
          onClose={() => setSelectedReciboForPrint(null)}
          recibo={selectedReciboForPrint}
        />
      )}

      {/* Modal Anular Recibo */}
      {reciboToAnular && (
        <Modal
          isOpen={!!reciboToAnular}
          onClose={() => setReciboToAnular(null)}
          title="Anular Recibo de Pago"
          subtitle={`Recibo N° ${reciboToAnular.numeroRecibo}`}
          maxWidth="md"
          actions={
            <>
              <button
                type="button"
                onClick={() => setReciboToAnular(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={async () => {
                  await anularRecibo(reciboToAnular.id, motivoAnulacion);
                  setReciboToAnular(null);
                  setMotivoAnulacion('');
                }}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Ban className="w-4 h-4" />
                <span>Confirmar Anulación</span>
              </button>
            </>
          }
        >
          <div className="space-y-3 text-xs">
            <p className="text-slate-600">
              Indica el motivo por el cual se anula el recibo <strong>{reciboToAnular.numeroRecibo}</strong> por <strong>S/ {reciboToAnular.monto.toFixed(2)}</strong>:
            </p>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Motivo de anulación:
              </label>
              <input
                type="text"
                value={motivoAnulacion}
                onChange={(e) => setMotivoAnulacion(e.target.value)}
                placeholder="Ej. Error en digitación de monto o concepto"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>
        </Modal>
      )}

      {/* Modal Confirmar Eliminación de Recibo */}
      {reciboToDelete && (
        <Modal
          isOpen={!!reciboToDelete}
          onClose={() => setReciboToDelete(null)}
          title="Eliminar Registro de Pago"
          subtitle={`Recibo ${reciboToDelete.numeroRecibo}`}
          maxWidth="md"
          actions={
            <>
              <button
                type="button"
                onClick={() => setReciboToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={async () => {
                  await deleteRecibo(reciboToDelete.id);
                  setReciboToDelete(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Eliminar Pago</span>
              </button>
            </>
          }
        >
          <div className="space-y-3 text-xs text-slate-700">
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-rose-900">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-xs">¿Eliminar registro de pago?</p>
                <p className="text-[11px] text-rose-700 mt-0.5">
                  Se borrará permanentemente el recibo <strong>{reciboToDelete.numeroRecibo}</strong> por <strong>S/ {reciboToDelete.monto.toFixed(2)}</strong> ({reciboToDelete.conceptoNombre}).
                </p>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal Amortización de Cuotas Pendientes */}
      {reciboToAmortizar && (
        <AmortizarCuotaModal
          isOpen={!!reciboToAmortizar}
          onClose={() => setReciboToAmortizar(null)}
          reciboPadre={reciboToAmortizar}
          onReciboCreated={(nuevo, shouldPrint) => {
            setReciboToAmortizar(null);
            if (shouldPrint) {
              setSelectedReciboForPrint(nuevo);
            }
          }}
        />
      )}

      {/* Modal Consulta Rápida de Estado de Cuenta */}
      <EstadoCuentaModal
        isOpen={isEstadoCuentaOpen}
        onClose={() => setIsEstadoCuentaOpen(false)}
        onPrintRecibo={(rec) => {
          setSelectedReciboForPrint(rec);
        }}
      />
    </div>
  );
};
