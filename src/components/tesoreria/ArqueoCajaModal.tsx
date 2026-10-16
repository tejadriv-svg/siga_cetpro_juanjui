import React from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';
import { Calendar, DollarSign, Wallet, Smartphone, Building, Printer, CheckCircle2 } from 'lucide-react';

interface ArqueoCajaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ArqueoCajaModal: React.FC<ArqueoCajaModalProps> = ({ isOpen, onClose }) => {
  const { recibos, periodoActivo, currentUser, institucion } = useApp();

  const today = new Date().toISOString().split('T')[0];
  const recibosHoy = recibos.filter((r) => r.fechaEmision === today && r.estado === 'Emitido');

  const totalEfectivo = recibosHoy
    .filter((r) => r.metodoPago === 'Efectivo')
    .reduce((acc, r) => acc + r.monto, 0);

  const totalDigital = recibosHoy
    .filter((r) => r.metodoPago === 'Yape / Plin')
    .reduce((acc, r) => acc + r.monto, 0);

  const totalBanco = recibosHoy
    .filter((r) => r.metodoPago === 'Banco de la Nación')
    .reduce((acc, r) => acc + r.monto, 0);

  const totalGeneral = totalEfectivo + totalDigital + totalBanco;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Cierre y Arqueo Diario de Caja - ${today}`}
      subtitle="Conciliación de ingresos por ventanilla y canales electrónicos"
      maxWidth="lg"
      actions={
        <>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors"
          >
            Cerrar
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Reporte de Cierre</span>
          </button>
        </>
      }
    >
      <div className="space-y-5 text-xs">
        {/* Banner summary */}
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
              Total Recaudado Hoy
            </span>
            <div className="text-2xl font-bold text-emerald-950 font-mono mt-0.5">
              S/ {totalGeneral.toFixed(2)}
            </div>
          </div>
          <div className="text-right">
            <span className="text-[11px] text-emerald-700 block">Comprobantes</span>
            <span className="font-bold text-emerald-950 font-mono text-base">{recibosHoy.length} recibos</span>
          </div>
        </div>

        {/* Breakdown by method */}
        <div className="space-y-3">
          <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
            Desglose por Canal de Pago
          </h4>

          <div className="space-y-2">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Wallet className="w-4 h-4 text-sky-600" />
                <div>
                  <div className="font-semibold text-slate-900">Efectivo en Caja Física</div>
                  <div className="text-[10px] text-slate-400">
                    {recibosHoy.filter((r) => r.metodoPago === 'Efectivo').length} transacciones
                  </div>
                </div>
              </div>
              <div className="font-bold text-slate-900 font-mono text-sm">
                S/ {totalEfectivo.toFixed(2)}
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Smartphone className="w-4 h-4 text-purple-600" />
                <div>
                  <div className="font-semibold text-slate-900">Billeteras Digitales (Yape / Plin)</div>
                  <div className="text-[10px] text-slate-400">
                    {recibosHoy.filter((r) => r.metodoPago === 'Yape / Plin').length} transacciones
                  </div>
                </div>
              </div>
              <div className="font-bold text-slate-900 font-mono text-sm">
                S/ {totalDigital.toFixed(2)}
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Building className="w-4 h-4 text-amber-600" />
                <div>
                  <div className="font-semibold text-slate-900">Banco de la Nación (Cta. Cte.)</div>
                  <div className="text-[10px] text-slate-400">
                    {recibosHoy.filter((r) => r.metodoPago === 'Banco de la Nación').length} transacciones
                  </div>
                </div>
              </div>
              <div className="font-bold text-slate-900 font-mono text-sm">
                S/ {totalBanco.toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        {/* Institutional signature footer */}
        <div className="pt-4 border-t border-slate-200 grid grid-cols-2 gap-4 text-center text-[10px] text-slate-400">
          <div>
            <div className="h-10 border-b border-slate-300 mb-1" />
            <span>Firma del Cajero(a) Responsable</span>
            <div className="font-semibold text-slate-700">{currentUser.nombre}</div>
          </div>
          <div>
            <div className="h-10 border-b border-slate-300 mb-1" />
            <span>V° B° Dirección / Administración</span>
            <div className="font-semibold text-slate-700">{institucion.director || 'Dirección General'}</div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
