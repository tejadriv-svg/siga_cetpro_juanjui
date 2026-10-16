import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { MetodoPago, ReciboPago } from '../../types';
import { Modal } from '../common/Modal';
import { Wallet, DollarSign, Printer, Check, Calendar, AlertCircle, ArrowRight } from 'lucide-react';

interface AmortizarCuotaModalProps {
  isOpen: boolean;
  onClose: () => void;
  reciboPadre: ReciboPago | null;
  onReciboCreated?: (recibo: ReciboPago, shouldPrint?: boolean) => void;
}

export const AmortizarCuotaModal: React.FC<AmortizarCuotaModalProps> = ({
  isOpen,
  onClose,
  reciboPadre,
  onReciboCreated,
}) => {
  const { addRecibo, personas, recibos } = useApp();

  const [montoAbono, setMontoAbono] = useState<number>(0);
  const [fechaPago, setFechaPago] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [numeroRecibo, setNumeroRecibo] = useState<string>('');
  const [metodoPago, setMetodoPago] = useState<MetodoPago>('Efectivo');
  const [numeroOperacion, setNumeroOperacion] = useState<string>('');
  const [observaciones, setObservaciones] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const rootPadre = useMemo(() => {
    if (!reciboPadre) return null;
    return reciboPadre.pagoPadreId
      ? (recibos.find((r) => r.id === reciboPadre.pagoPadreId) || reciboPadre)
      : reciboPadre;
  }, [reciboPadre, recibos]);

  const titular = useMemo(() => {
    if (!rootPadre) return null;
    return personas.find((p) => p.id === rootPadre.personaId);
  }, [rootPadre, personas]);

  const pagosCadena = useMemo(() => {
    if (!rootPadre) return [];
    return recibos.filter(
      (r) => (r.id === rootPadre.id || r.pagoPadreId === rootPadre.id) && r.estado !== 'Anulado'
    );
  }, [rootPadre, recibos]);

  const maxCuota = useMemo(() => {
    if (pagosCadena.length === 0) return Number(rootPadre?.numeroCuota || 1);
    return Math.max(...pagosCadena.map((r) => Number(r.numeroCuota || 1)), 1);
  }, [pagosCadena, rootPadre]);

  const saldoPendienteActual = Number(rootPadre?.montoPendiente || 0);
  const nuevoSaldoPendiente = Math.max(0, Math.round((saldoPendienteActual - montoAbono) * 100) / 100);
  const siguienteCuotaNum = maxCuota + 1;
  const totalCuotasSerie = Math.max(siguienteCuotaNum, Number(rootPadre?.totalCuotas || 2));

  useEffect(() => {
    if (isOpen && reciboPadre) {
      setMontoAbono(reciboPadre.montoPendiente || 0);
      setFechaPago(new Date().toISOString().split('T')[0]);
      setNumeroRecibo('');
      setNumeroOperacion('');
      setObservaciones(`Amortización de cuota para ${reciboPadre.conceptoNombre}`);
      setMetodoPago('Efectivo');
      setIsSubmitting(false);
    }
  }, [isOpen, reciboPadre]);

  if (!reciboPadre) return null;

  const handleSave = async (shouldPrint: boolean) => {
    if (montoAbono <= 0 || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const estadoFinal = nuevoSaldoPendiente > 0 ? 'Pendiente' : 'Pagado';

      const nuevoRecibo = await addRecibo({
        personaId: rootPadre.personaId,
        matriculaId: rootPadre.matriculaId,
        conceptoId: rootPadre.conceptoId,
        conceptoNombre: rootPadre.conceptoNombre,
        pagoPadreId: rootPadre.id,
        monto: montoAbono,
        montoTotal: Number(rootPadre.montoTotal || (Number(rootPadre.monto) + saldoPendienteActual)),
        montoPendiente: nuevoSaldoPendiente,
        numeroCuota: siguienteCuotaNum,
        totalCuotas: totalCuotasSerie,
        fechaPago: fechaPago || undefined,
        numeroRecibo: numeroRecibo.trim() || undefined,
        metodoPago,
        estado: estadoFinal,
        numeroOperacion: numeroOperacion ? numeroOperacion : undefined,
        observaciones: observaciones ? observaciones : undefined,
        programaNombre: rootPadre.programaNombre,
        moduloNombre: rootPadre.moduloNombre,
        periodoCodigo: rootPadre.periodoCodigo,
        glosaDetalle: rootPadre.glosaDetalle,
      });

      if (onReciboCreated) {
        onReciboCreated(nuevoRecibo, shouldPrint);
      } else {
        onClose();
      }
    } catch (error) {
      console.error('Error al amortizar cuota:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Amortización / Cobro de Cuota Pendiente"
      subtitle={`Registro de abono a deuda para el comprobante ${reciboPadre.numeroRecibo}`}
      maxWidth="lg"
      actions={
        <div className="flex items-center justify-between w-full">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
          >
            Cancelar
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isSubmitting || montoAbono <= 0}
              onClick={() => handleSave(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{isSubmitting ? 'Registrando...' : 'Guardar Abono'}</span>
            </button>

            <button
              type="button"
              disabled={isSubmitting || montoAbono <= 0}
              onClick={() => handleSave(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Printer className="w-4 h-4" />
              <span>{isSubmitting ? 'Registrando...' : 'Guardar e Imprimir Recibo'}</span>
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-4 text-xs">
        {/* Resumen del Compromiso Original */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-2">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Titular</span>
              <div className="font-bold text-slate-900 text-sm">
                {titular ? `${titular.apellidoPaterno} ${titular.apellidoMaterno}, ${titular.nombres}` : 'Estudiante'}
              </div>
              <div className="text-[11px] text-slate-500 font-mono">
                DNI: {titular?.numeroDocumento || '---'}
              </div>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Concepto</span>
              <div className="font-bold text-blue-700">{reciboPadre.conceptoNombre}</div>
              {reciboPadre.programaNombre && (
                <div className="text-[11px] text-slate-500">
                  {reciboPadre.programaNombre} {reciboPadre.moduloNombre ? `— ${reciboPadre.moduloNombre}` : ''}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center pt-1">
            <div className="p-2 bg-white rounded-xl border border-slate-200/80">
              <div className="text-[10px] text-slate-500 font-medium">Compromiso Total</div>
              <div className="font-mono font-bold text-slate-900 text-xs mt-0.5">
                S/ {(reciboPadre.montoTotal || reciboPadre.monto).toFixed(2)}
              </div>
            </div>

            <div className="p-2 bg-amber-50 rounded-xl border border-amber-200">
              <div className="text-[10px] text-amber-700 font-medium">Saldo Pendiente Actual</div>
              <div className="font-mono font-black text-amber-800 text-sm mt-0.5">
                S/ {saldoPendienteActual.toFixed(2)}
              </div>
            </div>

            <div className="p-2 bg-blue-50 rounded-xl border border-blue-200">
              <div className="text-[10px] text-blue-700 font-medium">Cuota a Emitir</div>
              <div className="font-mono font-bold text-blue-800 text-xs mt-0.5">
                Cuota {siguienteCuotaNum} de {totalCuotasSerie}
              </div>
            </div>
          </div>
        </div>

        {/* Inputs de Abono */}
        <div className="space-y-3 pt-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-bold text-slate-800 text-xs">
                  Monto a Cancelar en este Abono (S/)
                </label>
                <span className="text-[10px] text-slate-400 font-mono">
                  Máx: S/ {saldoPendienteActual.toFixed(2)}
                </span>
              </div>
              <input
                type="number"
                step="0.50"
                min="0.50"
                max={saldoPendienteActual}
                required
                value={montoAbono}
                onChange={(e) => setMontoAbono(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono font-bold text-slate-900 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />

              {/* Botones de atajo rápido */}
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <span className="text-[10px] text-slate-500">Abonar:</span>
                {[
                  { label: 'Total Saldo', val: saldoPendienteActual },
                  { label: '50% Saldo', val: Math.round((saldoPendienteActual * 0.5) * 100) / 100 },
                  { label: 'S/ 50', val: 50 },
                  { label: 'S/ 70', val: 70 },
                  { label: 'S/ 100', val: 100 },
                  { label: 'S/ 150', val: 150 },
                ]
                  .filter((chip) => chip.val <= saldoPendienteActual && chip.val > 0)
                  .map((chip) => (
                    <button
                      key={chip.label}
                      type="button"
                      onClick={() => setMontoAbono(chip.val)}
                      className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-mono font-semibold transition-colors cursor-pointer"
                    >
                      {chip.label}
                    </button>
                  ))}
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-slate-800 text-xs">
                    Fecha de Pago (Física)
                  </label>
                  {fechaPago === new Date().toISOString().split('T')[0] ? (
                    <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 text-[9px] font-bold rounded">
                      Hoy (Sugerido)
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setFechaPago(new Date().toISOString().split('T')[0])}
                      className="text-[10px] text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                    >
                      Hoy
                    </button>
                  )}
                </div>
                <input
                  type="date"
                  required
                  value={fechaPago}
                  onChange={(e) => setFechaPago(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-mono text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  N° Recibo / Comprobante
                  <span className="text-slate-400 font-normal text-[10px] ml-1">(Opcional)</span>
                </label>
                <input
                  type="text"
                  placeholder="Ej. 010707 (Auto si vacío)"
                  value={numeroRecibo}
                  onChange={(e) => setNumeroRecibo(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-mono text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Saldo Restante Proyectado */}
          <div className="p-3 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-emerald-600 text-white rounded-lg">
                <ArrowRight className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-emerald-950">
                  Saldo Restante tras este Abono
                </div>
                <div className="text-[10px] text-emerald-700">
                  {nuevoSaldoPendiente <= 0 ? '¡La deuda quedará 100% CANCELADA!' : 'Quedará registrado como saldo pendiente.'}
                </div>
              </div>
            </div>

            <div className="font-mono font-black text-lg text-emerald-900">
              S/ {nuevoSaldoPendiente.toFixed(2)}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Método de Pago</label>
              <select
                value={metodoPago}
                onChange={(e) => setMetodoPago(e.target.value as MetodoPago)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              >
                <option value="Efectivo">Efectivo (Ventanilla)</option>
                <option value="Yape / Plin">Yape / Plin (Billetera Digital)</option>
                <option value="Banco de la Nación">Depósito Banco de la Nación</option>
              </select>
            </div>

            {metodoPago !== 'Efectivo' ? (
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  N° de Operación / Transferencia
                </label>
                <input
                  type="text"
                  placeholder="Ej. OP-445892"
                  value={numeroOperacion}
                  onChange={(e) => setNumeroOperacion(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            ) : (
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Observaciones</label>
                <input
                  type="text"
                  placeholder="Ej. Pago a cuenta cuota 2"
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};
