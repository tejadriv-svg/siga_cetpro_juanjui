import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { ReciboPago, Persona } from '../../types';
import { Modal } from '../common/Modal';
import { Search, UserCheck, DollarSign, Wallet, AlertCircle, CheckCircle2, Clock, Printer, X, CreditCard, ChevronRight } from 'lucide-react';
import { AmortizarCuotaModal } from './AmortizarCuotaModal';

interface EstadoCuentaModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPersonaId?: string;
  onPrintRecibo?: (recibo: ReciboPago) => void;
}

export const EstadoCuentaModal: React.FC<EstadoCuentaModalProps> = ({
  isOpen,
  onClose,
  initialPersonaId,
  onPrintRecibo,
}) => {
  const { personas, recibos, matriculas, estudiantes, programas, modulos } = useApp();

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>(initialPersonaId || '');
  const [amortizarRecibo, setAmortizarRecibo] = useState<ReciboPago | null>(null);

  // Filtrado rápido de personas
  const filteredPersonas = useMemo(() => {
    if (!searchTerm.trim()) return personas.slice(0, 15);
    const s = searchTerm.toLowerCase().trim();
    return personas.filter((p) => {
      const doc = (p.numeroDocumento || '').toLowerCase();
      const fullName = `${p.nombres || ''} ${p.apellidoPaterno || ''} ${p.apellidoMaterno || ''}`.toLowerCase();
      return doc.includes(s) || fullName.includes(s);
    }).slice(0, 20);
  }, [personas, searchTerm]);

  const selectedPersona = useMemo(() => {
    return personas.find((p) => p.id === selectedPersonaId);
  }, [personas, selectedPersonaId]);

  // Recibos asociados a la persona
  const personaRecibos = useMemo(() => {
    if (!selectedPersonaId) return [];
    return recibos
      .filter((r) => r.personaId === selectedPersonaId)
      .sort((a, b) => new Date(b.fechaEmision).getTime() - new Date(a.fechaEmision).getTime());
  }, [recibos, selectedPersonaId]);

  // Totales
  const resumenFinanciero = useMemo(() => {
    let totalComprometido = 0;
    let totalAbonado = 0;
    let totalPendiente = 0;

    personaRecibos.forEach((r) => {
      if (r.estado === 'Anulado') return;
      const abono = Number(r.monto || 0);
      const pendiente = Number(r.montoPendiente || 0);
      const comprom = Number(r.montoTotal || (abono + pendiente));

      // Si es amortización vinculada a un padre, el compromiso y saldo principal residen en el padre
      if (!r.pagoPadreId) {
        totalComprometido += comprom;
        totalPendiente += pendiente;
      }
      totalAbonado += abono;
    });

    return {
      totalComprometido,
      totalAbonado,
      totalPendiente,
    };
  }, [personaRecibos]);

  // Matrículas activas del estudiante
  const matriculasPersona = useMemo(() => {
    if (!selectedPersonaId) return [];
    const est = estudiantes.find((e) => e.personaId === selectedPersonaId);
    if (!est) return [];
    return matriculas
      .filter((m) => m.estudianteId === est.id)
      .map((m) => {
        const mod = modulos.find((mo) => mo.id === m.moduloId);
        const prog = programas.find((p) => p.id === mod?.programaId);
        return {
          matricula: m,
          modulo: mod,
          programa: prog,
        };
      });
  }, [selectedPersonaId, estudiantes, matriculas, modulos, programas]);

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Estado de Cuenta y Deudas por Estudiante"
        subtitle="Consulta consolidada de cobros, amortizaciones y saldos deudores pendientes"
        maxWidth="2xl"
        actions={
          <div className="flex items-center justify-between w-full">
            <span className="text-[11px] text-slate-500 font-medium">
              CETPRO Juanjuí — Sistema Integrado de Gestión Académica y Tesorería
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cerrar Ventana
            </button>
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          {/* Buscador de Estudiante */}
          <div className="space-y-2">
            <label className="block font-bold text-slate-800 text-[11px] uppercase tracking-wider">
              1. Buscar Estudiante o Contribuyente por DNI o Apellidos
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Escribe el DNI o nombre del estudiante..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-medium"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Sugerencias de búsqueda rápida */}
            {searchTerm.trim() && (
              <div className="max-h-40 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-md p-1 space-y-0.5">
                {filteredPersonas.length === 0 ? (
                  <div className="p-3 text-center text-slate-400 text-xs">
                    No se encontró a nadie con ese criterio
                  </div>
                ) : (
                  filteredPersonas.map((p) => {
                    const isSel = p.id === selectedPersonaId;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setSelectedPersonaId(p.id);
                          setSearchTerm('');
                        }}
                        className={`w-full text-left px-3 py-1.5 rounded-lg flex items-center justify-between text-xs transition-colors cursor-pointer ${
                          isSel ? 'bg-blue-50 text-blue-900 font-bold' : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                            {p.numeroDocumento}
                          </span>
                          <span>{p.apellidoPaterno} {p.apellidoMaterno}, {p.nombres}</span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* Información del Estudiante Seleccionado */}
          {selectedPersona ? (
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 border border-blue-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-black text-slate-900 text-sm">
                      {selectedPersona.apellidoPaterno} {selectedPersona.apellidoMaterno}, {selectedPersona.nombres}
                    </div>
                    <div className="text-[11px] text-blue-900 font-mono mt-0.5 flex flex-wrap items-center gap-2">
                      <span>DNI: <strong>{selectedPersona.numeroDocumento}</strong></span>
                      {selectedPersona.telefono && <span>• Tel: {selectedPersona.telefono}</span>}
                      {selectedPersona.email && <span>• {selectedPersona.email}</span>}
                    </div>
                  </div>
                </div>

                {matriculasPersona.length > 0 && (
                  <div className="sm:text-right text-[11px] text-slate-600 bg-white/70 px-3 py-1.5 rounded-xl border border-blue-100">
                    <span className="font-bold text-slate-900">Programa Matriculado:</span>
                    <div className="text-blue-800 font-semibold truncate max-w-xs">
                      {matriculasPersona[0]?.programa?.nombre}
                    </div>
                  </div>
                )}
              </div>

              {/* Tarjetas de Resumen Financiero */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                  <div className="text-[11px] text-slate-500 font-medium">Compromiso Total Acordado</div>
                  <div className="font-mono font-black text-slate-900 text-lg mt-1">
                    S/ {resumenFinanciero.totalComprometido.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Total de conceptos o cuotas pactadas
                  </div>
                </div>

                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl">
                  <div className="text-[11px] text-emerald-700 font-medium flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Total Pagado / Amortizado</span>
                  </div>
                  <div className="font-mono font-black text-emerald-800 text-lg mt-1">
                    S/ {resumenFinanciero.totalAbonado.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-emerald-600 mt-0.5">
                    Ingresado efectivamente a caja
                  </div>
                </div>

                <div className={`p-3.5 rounded-2xl border ${
                  resumenFinanciero.totalPendiente > 0
                    ? 'bg-amber-50 border-amber-300'
                    : 'bg-teal-50 border-teal-200'
                }`}>
                  <div className={`text-[11px] font-medium flex items-center gap-1.5 ${
                    resumenFinanciero.totalPendiente > 0 ? 'text-amber-800' : 'text-teal-700'
                  }`}>
                    {resumenFinanciero.totalPendiente > 0 ? (
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                    )}
                    <span>Saldo Deudor Pendiente</span>
                  </div>
                  <div className={`font-mono font-black text-lg mt-1 ${
                    resumenFinanciero.totalPendiente > 0 ? 'text-amber-900' : 'text-teal-800'
                  }`}>
                    S/ {resumenFinanciero.totalPendiente.toFixed(2)}
                  </div>
                  <div className={`text-[10px] mt-0.5 ${
                    resumenFinanciero.totalPendiente > 0 ? 'text-amber-700' : 'text-teal-600'
                  }`}>
                    {resumenFinanciero.totalPendiente > 0 ? 'Monto por cobrar al estudiante' : 'Al día / Sin deudas pendientes'}
                  </div>
                </div>
              </div>

              {/* Desglose de Comprobantes y Recibos */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Historial de Comprobantes y Pagos Realizados ({personaRecibos.length})
                  </h4>
                  {personaRecibos.some((r) => Number(r.montoPendiente || 0) > 0 && r.estado !== 'Anulado') && (
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-800 border border-amber-200 rounded-full text-[10px] font-bold">
                      Tiene cuotas pendientes de pago
                    </span>
                  )}
                </div>

                {personaRecibos.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-slate-500 text-xs">
                    No se registran pagos ni recibos emitidos a nombre de este estudiante.
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold text-[11px]">
                            <th className="py-2.5 px-3">N° Recibo</th>
                            <th className="py-2.5 px-3">Fecha</th>
                            <th className="py-2.5 px-3">Concepto & Programa</th>
                            <th className="py-2.5 px-3 text-center">Cuota</th>
                            <th className="py-2.5 px-3 text-right">Abono (S/)</th>
                            <th className="py-2.5 px-3 text-right">Saldo Restante</th>
                            <th className="py-2.5 px-3 text-center">Estado</th>
                            <th className="py-2.5 px-3 text-center">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                          {personaRecibos.map((r) => {
                            const pendiente = Number(r.montoPendiente || 0);
                            const tienePendiente = pendiente > 0 && r.estado !== 'Anulado';

                            return (
                              <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                                <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                                  {r.numeroRecibo}
                                </td>
                                <td className="py-2.5 px-3 font-mono text-slate-600 whitespace-nowrap">
                                  {r.fechaPago || r.fechaEmision}
                                </td>
                                <td className="py-2.5 px-3">
                                  <div className="font-bold text-slate-900">{r.conceptoNombre}</div>
                                  {r.glosaDetalle && (
                                    <div className="text-[11px] text-blue-700 italic">
                                      Glosa: {r.glosaDetalle}
                                    </div>
                                  )}
                                  {r.programaNombre && (
                                    <div className="text-[10px] text-slate-500">
                                      {r.programaNombre} {r.moduloNombre ? `— ${r.moduloNombre}` : ''}
                                    </div>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  {r.totalCuotas && r.totalCuotas > 1 ? (
                                    <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-mono font-semibold">
                                      {r.numeroCuota || 1}/{r.totalCuotas}
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 text-[10px]">Único</span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-800">
                                  S/ {Number(r.monto).toFixed(2)}
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono font-bold">
                                  {pendiente > 0 ? (
                                    <span className="text-amber-700">S/ {pendiente.toFixed(2)}</span>
                                  ) : (
                                    <span className="text-slate-400 font-normal">S/ 0.00</span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                      r.estado === 'Pagado'
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : r.estado === 'Pendiente'
                                        ? 'bg-amber-100 text-amber-800'
                                        : 'bg-rose-100 text-rose-800'
                                    }`}
                                  >
                                    {r.estado}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  <div className="flex items-center justify-center gap-1.5">
                                    {tienePendiente && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const rootR = r.pagoPadreId ? (personaRecibos.find((x) => x.id === r.pagoPadreId) || r) : r;
                                          setAmortizarRecibo(rootR);
                                        }}
                                        className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors shadow-2xs cursor-pointer"
                                        title="Cobrar cuota o registrar amortización"
                                      >
                                        <CreditCard className="w-3 h-3" />
                                        <span>Amortizar</span>
                                      </button>
                                    )}

                                    {onPrintRecibo && (
                                      <button
                                        type="button"
                                        onClick={() => onPrintRecibo(r)}
                                        className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
                                        title="Imprimir comprobante oficial"
                                      >
                                        <Printer className="w-3.5 h-3.5" />
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
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-slate-500">
              Utiliza el buscador superior para seleccionar al estudiante y ver su estado de cuenta consolidado.
            </div>
          )}
        </div>
      </Modal>

      {/* Modal para amortizar una cuota de este estudiante */}
      {amortizarRecibo && (
        <AmortizarCuotaModal
          isOpen={!!amortizarRecibo}
          onClose={() => setAmortizarRecibo(null)}
          reciboPadre={amortizarRecibo}
          onReciboCreated={(nuevo) => {
            setAmortizarRecibo(null);
            if (onPrintRecibo) onPrintRecibo(nuevo);
          }}
        />
      )}
    </>
  );
};
