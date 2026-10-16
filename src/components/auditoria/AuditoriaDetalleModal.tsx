import React from 'react';
import { AuditoriaLog } from '../../types';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import { 
  ShieldCheck, 
  Clock, 
  User, 
  Server, 
  FileCode, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle,
  Layers,
  Globe
} from 'lucide-react';

interface AuditoriaDetalleModalProps {
  isOpen: boolean;
  onClose: () => void;
  log: AuditoriaLog | null;
}

export const AuditoriaDetalleModal: React.FC<AuditoriaDetalleModalProps> = ({
  isOpen,
  onClose,
  log,
}) => {
  if (!log) return null;

  const datosAnteriores = log.datosAnteriores;
  const datosNuevos = log.datosNuevos;
  const tieneAmbos = Boolean(datosAnteriores && datosNuevos && typeof datosAnteriores === 'object' && typeof datosNuevos === 'object');

  // Encontrar claves que cambiaron
  const keysDiff: string[] = [];
  if (tieneAmbos) {
    const allKeys = Array.from(new Set([...Object.keys(datosAnteriores), ...Object.keys(datosNuevos)]));
    allKeys.forEach((k) => {
      const valAnt = JSON.stringify(datosAnteriores[k]);
      const valNue = JSON.stringify(datosNuevos[k]);
      if (valAnt !== valNue) {
        keysDiff.push(k);
      }
    });
  }

  const getBadge = (accion: string) => {
    if (accion.includes('CREDENCIAL')) return <Badge variant="warning">ðŸ”‘ {accion}</Badge>;
    if (accion.includes('ELIMIN') || accion.includes('ANULAR')) return <Badge variant="danger">{accion}</Badge>;
    if (accion.includes('CREAR') || accion.includes('EMISION')) return <Badge variant="success">{accion}</Badge>;
    return <Badge variant="primary">{accion}</Badge>;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      size="xl"
    >
      <div className="flex flex-col h-full text-slate-800">
        {/* Cabecera del modal */}
        <div className="bg-slate-900 text-white px-6 py-4 rounded-t-lg flex items-center justify-between border-b border-slate-700 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-sky-500/20 text-sky-400 rounded-xl border border-sky-500/30">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-wide">
                  InspecciÃ³n Detallada de Trazabilidad
                </h3>
                {getBadge(log.accion)}
              </div>
              <p className="text-xs text-slate-400 mt-0.5 font-mono">
                ID Evento: {log.id}
              </p>
            </div>
          </div>
        </div>

        {/* Cuerpo con metadatos y visor diff */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[75vh] bg-slate-50">
          
          {/* 1. Tarjeta de Metadatos de la OperaciÃ³n */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <Layers className="w-4 h-4 text-blue-600" /> Metadatos del Evento
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">FECHA Y HORA</span>
                <span className="font-semibold text-slate-900 block mt-0.5">{log.fecha || log.timestamp}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">USUARIO RESPONSABLE</span>
                <span className="font-bold text-slate-900 block mt-0.5">{log.usuarioNombre}</span>
                <span className="text-[10px] text-slate-500 font-mono">{log.usuarioRol || log.rol}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">MÃ“DULO / TABLA</span>
                <span className="font-mono font-bold text-blue-700 block mt-0.5">{log.entidad || log.tabla}</span>
                {log.registroId && (
                  <span className="text-[10px] text-slate-400 font-mono truncate block" title={log.registroId}>
                    ID: {log.registroId}
                  </span>
                )}
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">ORIGEN DE PETICIÃ“N</span>
                <span className="font-mono text-slate-800 block mt-0.5">IP: {log.ip}</span>
                <span className="text-[10px] text-slate-400 truncate block" title={log.userAgent || ''}>
                  {log.userAgent || 'Cliente SIGA'}
                </span>
              </div>
            </div>

            <div className="p-3 bg-blue-50/60 rounded-lg border border-blue-200/70 text-xs">
              <span className="font-bold text-blue-900 block mb-1">DescripciÃ³n Operativa:</span>
              <p className="text-slate-700">{log.detalles || log.detalle || 'Sin descripciÃ³n adicional.'}</p>
            </div>
          </div>

          {/* 2. Visor Diff Antes vs DespuÃ©s */}
          {tieneAmbos ? (
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <FileCode className="w-4 h-4 text-amber-600" /> Comparativa de Estados (Diff Antes vs DespuÃ©s)
                </h4>
                <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded text-[11px] font-bold">
                  {keysDiff.length} {keysDiff.length === 1 ? 'campo modificado' : 'campos modificados'}
                </span>
              </div>

              {/* Tabla de campos modificados */}
              {keysDiff.length > 0 && (
                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
                      <tr>
                        <th className="p-2.5 w-1/4">Campo / Atributo</th>
                        <th className="p-2.5 w-3/8 text-rose-800 bg-rose-50/50">Valor Anterior (Pre-modificaciÃ³n)</th>
                        <th className="p-2.5 w-3/8 text-emerald-800 bg-emerald-50/50">Valor Nuevo (Post-modificaciÃ³n)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono">
                      {keysDiff.map((k) => (
                        <tr key={k} className="hover:bg-slate-50">
                          <td className="p-2.5 font-bold text-slate-700 font-sans">{k}</td>
                          <td className="p-2.5 text-rose-700 bg-rose-50/30 break-all">
                            {JSON.stringify(datosAnteriores[k], null, 2)}
                          </td>
                          <td className="p-2.5 text-emerald-700 bg-emerald-50/30 font-bold break-all">
                            {JSON.stringify(datosNuevos[k], null, 2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Vista JSON Cruda Plegable */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                <div>
                  <span className="text-[11px] font-bold text-slate-600 block mb-1">Snapshot Completo Anterior:</span>
                  <pre className="p-3 bg-slate-900 text-slate-200 text-[10px] rounded-lg overflow-x-auto max-h-48 font-mono border border-slate-800">
                    {JSON.stringify(datosAnteriores, null, 2)}
                  </pre>
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-600 block mb-1">Snapshot Completo Nuevo:</span>
                  <pre className="p-3 bg-slate-900 text-slate-200 text-[10px] rounded-lg overflow-x-auto max-h-48 font-mono border border-slate-800">
                    {JSON.stringify(datosNuevos, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          ) : datosNuevos ? (
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Datos Registrados (Payload)
              </h4>
              <pre className="p-3 bg-slate-900 text-emerald-400 text-xs rounded-lg overflow-x-auto max-h-60 font-mono border border-slate-800">
                {typeof datosNuevos === 'object' ? JSON.stringify(datosNuevos, null, 2) : String(datosNuevos)}
              </pre>
            </div>
          ) : datosAnteriores ? (
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" /> Registro Eliminado / Retirado
              </h4>
              <pre className="p-3 bg-slate-900 text-rose-300 text-xs rounded-lg overflow-x-auto max-h-60 font-mono border border-slate-800">
                {typeof datosAnteriores === 'object' ? JSON.stringify(datosAnteriores, null, 2) : String(datosAnteriores)}
              </pre>
            </div>
          ) : null}

        </div>

        {/* Pie del modal */}
        <div className="bg-slate-100 px-6 py-3 rounded-b-lg flex justify-end border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            Cerrar InspecciÃ³n
          </button>
        </div>
      </div>
    </Modal>
  );
};

