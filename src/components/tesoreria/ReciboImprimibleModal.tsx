import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { useApp } from '../../context/AppContext';
import { ReciboPago } from '../../types';
import { Modal } from '../common/Modal';
import { Printer, CheckCircle2, Scissors, Info, ExternalLink } from 'lucide-react';

const LOGO_MINEDU_URL = "/logos/LogoMinedu.png";
const LOGO_CETPRO_URL = "/logos/LogoCetpro.png";

interface ReciboImprimibleModalProps {
  isOpen: boolean;
  onClose: () => void;
  recibo: ReciboPago;
}

export const ReciboImprimibleModal: React.FC<ReciboImprimibleModalProps> = ({
  isOpen,
  onClose,
  recibo,
}) => {
  const { personas, currentUser } = useApp();
  const persona = personas.find((p) => p.id === recibo.personaId);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isPrinting, setIsPrinting] = useState(false);
  const printAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!recibo) return;

    const qrText = [
      'CETPRO PÚBLICO "JUANJUÍ"',
      'COMPROBANTE OFICIAL DE CAJA',
      `RECIBO N°: ${recibo.numeroRecibo}`,
      persona ? `CONTRIBUYENTE: ${persona.apellidoPaterno} ${persona.apellidoMaterno}, ${persona.nombres}` : '',
      persona ? `DNI: ${persona.numeroDocumento}` : '',
      `CONCEPTO: ${recibo.conceptoNombre}`,
      recibo.beneficioTipo && recibo.beneficioTipo !== 'REGULAR' ? `CONDICIÓN: ${recibo.beneficioTipo} ${recibo.beneficioNombre ? `(${recibo.beneficioNombre})` : ''}` : '',
      recibo.montoDescuento ? `DESCUENTO: S/ ${recibo.montoDescuento.toFixed(2)}` : '',
      recibo.documentoSustento ? `SUSTENTO: ${recibo.documentoSustento}` : '',
      `MONTO: S/ ${recibo.monto.toFixed(2)} (${recibo.metodoPago})`,
      `FECHA: ${recibo.fechaEmision} ${recibo.horaEmision}`,
      `ESTADO: ${recibo.estado.toUpperCase()}`,
    ].filter(Boolean).join('\n');

    QRCode.toDataURL(qrText, {
      width: 240,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('Error generando QR code:', err));
  }, [recibo, persona]);

  const generatePrintableHtml = () => {
    const renderVoucherHtml = (tipoCopia: 'ORIGINAL' | 'COPIA') => {
      const isOriginal = tipoCopia === 'ORIGINAL';
      const badgeText = isOriginal ? 'ORIGINAL (ESTUDIANTE / USUARIO)' : 'COPIA (ARCHIVO / CAJA)';
      const badgeClass = isOriginal ? 'type-original' : 'type-copia';

      return `
        <div class="voucher-container">
          <!-- Header -->
          <div class="header">
            <img src="${LOGO_MINEDU_URL}" alt="MINEDU" class="header-logo" onerror="this.style.display='none'" />
            <div class="header-center">
              <div class="inst-title">CETPRO PÚBLICO "JUANJUÍ"</div>
              <div class="inst-subtitle">DRE San Martín • UGEL Mariscal Cáceres</div>
              <div class="inst-ruc">RUC: 20531285566 • Cód. Modular: 0533836</div>
              <div class="inst-addr">Jr. Huallaga N° 311, Juanjuí, San Martín</div>
              <div><span class="type-badge ${badgeClass}">${badgeText}</span></div>
            </div>
            <img src="${LOGO_CETPRO_URL}" alt="CETPRO" class="header-logo" onerror="this.style.display='none'" />
          </div>

          <!-- Recibo Número -->
          <div class="receipt-number-box">
            <div class="receipt-number-title">Comprobante de Caja Institucional</div>
            <div class="receipt-number-val">RECIBO N°: ${recibo.numeroRecibo}</div>
          </div>

          <!-- Datos de la Transacción -->
          <table class="data-table">
            <tr>
              <td class="data-label">Fecha y Hora:</td>
              <td class="data-val">${recibo.fechaEmision} ${recibo.horaEmision}</td>
            </tr>
            <tr>
              <td class="data-label">Contribuyente:</td>
              <td class="data-val" style="font-weight: 800;">
                ${persona ? `${persona.apellidoPaterno} ${persona.apellidoMaterno}, ${persona.nombres}` : 'PÚBLICO GENERAL'}
              </td>
            </tr>
            <tr>
              <td class="data-label">DNI / Documento:</td>
              <td class="data-val font-mono">${persona?.numeroDocumento || '---'}</td>
            </tr>
            <tr>
              <td class="data-label">Concepto TUPA:</td>
              <td class="data-val" style="color: #0369a1;">${recibo.conceptoNombre}</td>
            </tr>
            ${recibo.beneficioTipo && recibo.beneficioTipo !== 'REGULAR' ? `
              <tr>
                <td class="data-label">Condición / Beneficio:</td>
                <td class="data-val" style="color: #4338ca; font-weight: 700;">
                  ${recibo.beneficioTipo === 'CONVENIO' ? `CONVENIO: ${recibo.beneficioNombre || 'Institucional'}` :
                    recibo.beneficioTipo === 'BECA_COMPLETA' ? 'BECA COMPLETA (100% GRATUIDAD)' :
                    recibo.beneficioTipo === 'SEMIBECA' ? 'SEMIBECA (50% DESCUENTO)' :
                    recibo.beneficioTipo === 'EXONERADO' ? 'EXONERACIÓN TOTAL (CONADIS/LEY)' :
                    'CASO SOCIAL ACREDITADO'}
                </td>
              </tr>
              ${recibo.montoDescuento ? `
                <tr>
                  <td class="data-label">Subvención / Descuento:</td>
                  <td class="data-val font-mono" style="color: #b91c1c; font-weight: bold;">
                    - S/ ${recibo.montoDescuento.toFixed(2)} ${recibo.porcentajeDescuento ? `(${recibo.porcentajeDescuento}%)` : ''}
                  </td>
                </tr>
              ` : ''}
              ${recibo.documentoSustento ? `
                <tr>
                  <td class="data-label">Documento Sustento:</td>
                  <td class="data-val font-mono" style="font-size: 7pt; color: #475569;">
                    ${recibo.documentoSustento}
                  </td>
                </tr>
              ` : ''}
            ` : ''}
            <tr>
              <td class="data-label">Método de Pago:</td>
              <td class="data-val">${recibo.metodoPago}</td>
            </tr>
            ${recibo.numeroOperacion ? `
              <tr>
                <td class="data-label">N° Operación:</td>
                <td class="data-val font-mono">${recibo.numeroOperacion}</td>
              </tr>
            ` : ''}
            ${recibo.observaciones ? `
              <tr>
                <td class="data-label">Observación / Glosa:</td>
                <td class="data-val" style="font-style: italic; font-weight: normal;">${recibo.observaciones}</td>
              </tr>
            ` : ''}
          </table>

          <!-- Monto Cancelado -->
          <div class="amount-box">
            <div class="amount-row">
              <span class="amount-label">
                ${recibo.totalCuotas && recibo.totalCuotas > 1 ? `Cuota ${recibo.numeroCuota || 1} de ${recibo.totalCuotas}` : 'Total Cancelado'}
              </span>
              <span class="amount-value" style="${recibo.monto === 0 ? 'color: #059669;' : ''}">
                S/ ${recibo.monto.toFixed(2)} ${recibo.monto === 0 ? '<span style="font-size: 7.5pt; font-weight: 800; background: #d1fae5; color: #065f46; padding: 1.5px 5px; border-radius: 4px; margin-left: 4px; letter-spacing: 0.5px;">GRATUIDAD</span>' : ''}
              </span>
            </div>
            ${recibo.totalCuotas && recibo.totalCuotas > 1 ? `
              <div class="amount-sub">
                <span>Costo Total: S/ ${(recibo.montoTotal || recibo.monto).toFixed(2)}</span>
                ${recibo.montoPendiente !== undefined && recibo.montoPendiente > 0 ? `
                  <span style="color: #b45309; font-weight: bold;">Saldo Pendiente: S/ ${recibo.montoPendiente.toFixed(2)}</span>
                ` : '<span style="color: #059669; font-weight: bold;">TOTALMENTE CANCELADO</span>'}
              </div>
            ` : ''}
          </div>

          <!-- Pie del Recibo: Firma y QR -->
          <div class="footer">
            <div class="signature-area">
              <div class="signature-line"></div>
              <div class="signature-name">${recibo.cajeroNombre || currentUser?.nombreCompleto || 'Cajero de Turno'}</div>
              <div class="signature-text">Recaudación / Tesorería CETPRO</div>
              <div class="signature-text" style="color: #059669; font-weight: 600; margin-top: 2px;">✓ Registro Verificado</div>
            </div>

            <div class="qr-area">
              ${qrDataUrl ? `<img src="${qrDataUrl}" alt="QR" class="qr-img" />` : '<div style="width:65px; height:65px; border:1px solid #ccc;"></div>'}
              <div class="qr-text">Verificación SIGA</div>
            </div>
          </div>
        </div>
      `;
    };

    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Recibo_Caja_${recibo.numeroRecibo}_CETPRO_Juanjui</title>
        <style>
          @page {
            size: A4 landscape;
            margin: 8mm 6mm;
          }
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
            color: #0f172a;
            background: #ffffff;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .sheet {
            width: 100%;
            height: 190mm;
            display: flex;
            flex-direction: row;
            justify-content: space-between;
            align-items: stretch;
            box-sizing: border-box;
          }
          .voucher-container {
            width: 48.2%;
            height: 100%;
            border: 1.5px solid #cbd5e1;
            border-radius: 8px;
            padding: 8px 12px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            background: #ffffff;
            box-sizing: border-box;
            overflow: hidden;
          }
          .divider {
            width: 3.6%;
            height: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: space-between;
            padding: 2.5mm 0;
            box-sizing: border-box;
            overflow: hidden;
          }
          .divider-line {
            width: 0px;
            flex: 1;
            border-left: 1.5px dashed #94a3b8;
            margin: 2px 0;
          }
          .divider-endpoint {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            line-height: 1.1;
          }
          .divider-scissor {
            font-size: 10pt;
            line-height: 1;
            color: #64748b;
          }
          .divider-text-tag {
            font-size: 5.5pt;
            font-weight: 800;
            color: #64748b;
            letter-spacing: 0.5px;
            text-transform: uppercase;
            white-space: nowrap;
          }
          .divider-mid-scissor {
            font-size: 8pt;
            line-height: 1;
            color: #94a3b8;
            background: #ffffff;
            padding: 2px 0;
          }
          .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 1.5px dashed #cbd5e1;
            padding-bottom: 5px;
            margin-bottom: 5px;
          }
          .header-logo {
            height: 38px;
            max-width: 65px;
            object-fit: contain;
          }
          .header-center {
            text-align: center;
            flex: 1;
            padding: 0 4px;
          }
          .inst-title {
            font-size: 10.5pt;
            font-weight: 900;
            color: #0f172a;
            letter-spacing: 0.3px;
            line-height: 1.1;
          }
          .inst-subtitle {
            font-size: 7pt;
            color: #64748b;
          }
          .inst-ruc {
            font-size: 7pt;
            color: #334155;
            font-weight: 700;
          }
          .inst-addr {
            font-size: 6.5pt;
            color: #64748b;
          }
          .type-badge {
            display: inline-block;
            padding: 1.5px 8px;
            border-radius: 4px;
            font-size: 6.8pt;
            font-weight: 800;
            letter-spacing: 0.5px;
            text-transform: uppercase;
            margin-top: 3px;
          }
          .type-original {
            background: #0f172a;
            color: #ffffff;
          }
          .type-copia {
            background: #334155;
            color: #ffffff;
          }
          .receipt-number-box {
            background: #f8fafc;
            border: 1px solid #cbd5e1;
            border-radius: 6px;
            padding: 4px 8px;
            text-align: center;
            margin-bottom: 6px;
          }
          .receipt-number-title {
            font-size: 6.8pt;
            text-transform: uppercase;
            font-weight: 700;
            color: #64748b;
          }
          .receipt-number-val {
            font-family: monospace;
            font-size: 11pt;
            font-weight: 900;
            color: #0f172a;
            letter-spacing: 1px;
          }
          .data-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 8pt;
            margin-bottom: 4px;
            table-layout: fixed;
          }
          .data-table td {
            padding: 2.2px 0;
            vertical-align: top;
            word-break: break-word;
          }
          .data-label {
            width: 32%;
            color: #64748b;
            font-size: 7.5pt;
          }
          .data-val {
            width: 68%;
            color: #0f172a;
            font-weight: 600;
            text-align: right;
            padding-right: 2px;
          }
          .font-mono {
            font-family: monospace;
          }
          .amount-box {
            background: #f1f5f9;
            border: 1.5px solid #cbd5e1;
            border-radius: 6px;
            padding: 5px 8px;
            margin: 4px 0;
          }
          .amount-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .amount-label {
            font-size: 7.5pt;
            font-weight: 800;
            color: #334155;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .amount-value {
            font-family: monospace;
            font-size: 12pt;
            font-weight: 900;
            color: #0f172a;
          }
          .amount-sub {
            font-size: 6.8pt;
            color: #64748b;
            margin-top: 1px;
            display: flex;
            justify-content: space-between;
          }
          .footer {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            border-top: 1px dashed #cbd5e1;
            padding-top: 5px;
            margin-top: 3px;
          }
          .signature-area {
            display: flex;
            flex-direction: column;
            align-items: center;
            width: 130px;
            text-align: center;
          }
          .signature-line {
            width: 110px;
            border-bottom: 1px solid #0f172a;
            margin-bottom: 3px;
          }
          .signature-text {
            font-size: 6.2pt;
            color: #64748b;
            line-height: 1.1;
          }
          .signature-name {
            font-size: 7pt;
            font-weight: 700;
            color: #0f172a;
          }
          .qr-area {
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .qr-img {
            width: 62px;
            height: 62px;
            border: 1px solid #cbd5e1;
            border-radius: 4px;
          }
          .qr-text {
            font-size: 5.8pt;
            font-weight: 700;
            color: #059669;
            margin-top: 1.5px;
            letter-spacing: 0.5px;
            text-transform: uppercase;
          }
        </style>
      </head>
      <body>
        <div class="sheet">
          ${renderVoucherHtml('ORIGINAL')}
          <div class="divider">
            <div class="divider-endpoint">
              <span class="divider-scissor">✂</span>
              <span class="divider-text-tag">CORTAR</span>
              <span class="divider-text-tag">AQUÍ</span>
            </div>
            <div class="divider-line"></div>
            <div class="divider-mid-scissor">✂</div>
            <div class="divider-line"></div>
            <div class="divider-endpoint">
              <span class="divider-scissor" style="transform: rotate(180deg); display: inline-block;">✂</span>
              <span class="divider-text-tag">CORTAR</span>
              <span class="divider-text-tag">AQUÍ</span>
            </div>
          </div>
          ${renderVoucherHtml('COPIA')}
        </div>
      </body>
      </html>
    `;
  };

  const handlePrint = () => {
    setIsPrinting(true);
    const html = generatePrintableHtml();

    // Abrir una ventana limpia dedicada exclusivamente a imprimir el recibo
    // Esto previene que se imprima la interfaz o dashboard del sistema
    const printWindow = window.open('', '_blank', 'width=1150,height=750,menubar=no,toolbar=no,location=no,status=no');
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();

      const triggerPrint = () => {
        try {
          printWindow.focus();
          printWindow.print();
        } catch (err) {
          console.error('Error al invocar impresión en ventana:', err);
        } finally {
          setIsPrinting(false);
        }
      };

      if (printWindow.document.readyState === 'complete') {
        setTimeout(triggerPrint, 300);
      } else {
        printWindow.onload = () => setTimeout(triggerPrint, 300);
        setTimeout(triggerPrint, 700);
      }
    } else {
      // Si el navegador bloqueó la ventana emergente, usar impresión directa
      window.print();
      setIsPrinting(false);
    }
  };

  const renderScreenVoucher = (tipo: 'ORIGINAL' | 'COPIA') => {
    const isOriginal = tipo === 'ORIGINAL';
    return (
      <div className="bg-white p-4 border border-slate-300 rounded-xl space-y-3 font-sans text-slate-800 text-xs shadow-2xs flex-1 flex flex-col justify-between">
        {/* Header */}
        <div className="text-center border-b border-dashed border-slate-300 pb-3 space-y-1">
          <div className="flex items-center justify-between">
            <img src={LOGO_MINEDU_URL} alt="MINEDU" className="h-7 max-w-[50px] object-contain" onError={(e) => (e.currentTarget.style.display = 'none')} />
            <div className="text-center flex-1 px-1">
              <div className="font-extrabold text-slate-900 text-xs tracking-wide leading-tight">
                CETPRO PÚBLICO "JUANJUÍ"
              </div>
              <div className="text-[9px] text-slate-500">
                DRE San Martín • UGEL Mariscal Cáceres
              </div>
            </div>
            <img src={LOGO_CETPRO_URL} alt="CETPRO" className="h-8 max-w-[50px] object-contain" onError={(e) => (e.currentTarget.style.display = 'none')} />
          </div>

          <div className="text-[9px] text-slate-500 font-mono">
            RUC: <strong>20531285566</strong> • Cód. Modular: <strong>0533836</strong>
          </div>

          <div className="mt-1">
            <span className={`inline-block px-2.5 py-0.5 text-white font-mono font-bold text-[9px] rounded uppercase ${isOriginal ? 'bg-slate-900' : 'bg-slate-700'}`}>
              {isOriginal ? 'ORIGINAL (ESTUDIANTE / USUARIO)' : 'COPIA (ARCHIVO / CAJA)'}
            </span>
          </div>
        </div>

        {/* N° Recibo */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-center">
          <div className="text-[9px] uppercase tracking-wider text-slate-500 font-semibold">Comprobante de Caja Oficial</div>
          <div className="font-mono font-extrabold text-xs text-slate-900 tracking-wider">
            RECIBO N°: {recibo.numeroRecibo}
          </div>
        </div>

        {/* Details Table */}
        <div className="space-y-1.5 text-[11px]">
          <div className="flex justify-between">
            <span className="text-slate-500">Fecha y Hora:</span>
            <span className="font-mono font-semibold">{recibo.fechaEmision} {recibo.horaEmision}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-500">Contribuyente:</span>
            <span className="font-bold text-right text-slate-900 truncate max-w-[190px]">
              {persona ? `${persona.apellidoPaterno} ${persona.apellidoMaterno}, ${persona.nombres}` : 'PÚBLICO GENERAL'}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-500">DNI / Documento:</span>
            <span className="font-mono font-bold">{persona?.numeroDocumento || '---'}</span>
          </div>

          <div className="flex justify-between border-t border-slate-100 pt-1">
            <span className="text-slate-500">Concepto TUPA:</span>
            <span className="font-semibold text-right text-sky-800 truncate max-w-[200px]">{recibo.conceptoNombre}</span>
          </div>

          {recibo.beneficioTipo && recibo.beneficioTipo !== 'REGULAR' && (
            <div className="space-y-1 bg-indigo-50/60 p-1.5 rounded-lg border border-indigo-100 text-[10px]">
              <div className="flex justify-between items-center">
                <span className="text-indigo-900 font-bold">Beneficio:</span>
                <span className="px-1.5 py-0.5 bg-indigo-600 text-white rounded font-bold uppercase text-[9px]">
                  {recibo.beneficioTipo === 'CONVENIO' ? `CONVENIO: ${recibo.beneficioNombre || 'Institucional'}` :
                   recibo.beneficioTipo === 'BECA_COMPLETA' ? 'BECA COMPLETA' :
                   recibo.beneficioTipo === 'SEMIBECA' ? 'SEMIBECA' :
                   recibo.beneficioTipo === 'EXONERADO' ? 'EXONERADO' : 'CASO SOCIAL'}
                </span>
              </div>
              {recibo.montoDescuento ? (
                <div className="flex justify-between">
                  <span className="text-slate-600">Subvención:</span>
                  <span className="font-mono font-bold text-rose-700">
                    - S/ {recibo.montoDescuento.toFixed(2)} {recibo.porcentajeDescuento ? `(${recibo.porcentajeDescuento}%)` : ''}
                  </span>
                </div>
              ) : null}
              {recibo.documentoSustento ? (
                <div className="flex justify-between text-[9px] text-slate-500">
                  <span>Sustento:</span>
                  <span className="font-mono font-semibold truncate max-w-[170px]">{recibo.documentoSustento}</span>
                </div>
              ) : null}
            </div>
          )}

          <div className="flex justify-between">
            <span className="text-slate-500">Método de Pago:</span>
            <span className="font-medium">{recibo.metodoPago}</span>
          </div>

          {recibo.numeroOperacion && (
            <div className="flex justify-between">
              <span className="text-slate-500">N° de Operación:</span>
              <span className="font-mono font-semibold">{recibo.numeroOperacion}</span>
            </div>
          )}

          {recibo.observaciones && (
            <div className="flex justify-between">
              <span className="text-slate-500">Glosa / Observación:</span>
              <span className="text-slate-600 italic text-[10px] truncate max-w-[190px]">{recibo.observaciones}</span>
            </div>
          )}
        </div>

        {/* Amount Box */}
        <div className="p-2.5 bg-slate-100 rounded-lg space-y-1 border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
              {recibo.totalCuotas && recibo.totalCuotas > 1 ? `Cuota ${recibo.numeroCuota || 1} de ${recibo.totalCuotas}` : 'Total Cancelado'}
            </span>
            <span className={`font-mono font-black text-sm ${recibo.monto === 0 ? 'text-emerald-700 flex items-center gap-1' : 'text-slate-900'}`}>
              S/ {recibo.monto.toFixed(2)}
              {recibo.monto === 0 && (
                <span className="text-[9px] px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold">GRATUIDAD</span>
              )}
            </span>
          </div>

          {recibo.totalCuotas && recibo.totalCuotas > 1 && (
            <div className="pt-1 border-t border-slate-200 flex justify-between items-center text-[10px]">
              <span className="text-slate-500">Monto Total: S/ {(recibo.montoTotal || recibo.monto).toFixed(2)}</span>
              {recibo.montoPendiente !== undefined && recibo.montoPendiente > 0 ? (
                <span className="text-amber-700 font-bold">Saldo: S/ {recibo.montoPendiente.toFixed(2)}</span>
              ) : (
                <span className="text-emerald-700 font-bold">CANCELADO</span>
              )}
            </div>
          )}
        </div>

        {/* Footer: Signature & QR */}
        <div className="flex items-center justify-between pt-2 border-t border-dashed border-slate-300">
          <div className="text-center w-28">
            <div className="w-24 border-b border-slate-800 mx-auto mb-1"></div>
            <div className="text-[10px] font-bold text-slate-800 leading-tight">
              {recibo.cajeroNombre || currentUser?.nombreCompleto || 'Cajero de Turno'}
            </div>
            <div className="text-[8px] text-slate-400">Recaudación / Tesorería</div>
            <div className="text-[8px] text-emerald-700 flex items-center justify-center gap-0.5 font-bold mt-0.5">
              <CheckCircle2 className="w-2.5 h-2.5" /> Verificado
            </div>
          </div>

          <div className="flex flex-col items-center">
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="QR" className="w-14 h-14 border border-slate-200 rounded p-0.5 bg-white" />
            ) : (
              <div className="w-14 h-14 bg-slate-100 rounded flex items-center justify-center text-[8px] text-slate-400">
                QR
              </div>
            )}
            <span className="text-[8px] font-bold text-emerald-700 tracking-wider uppercase mt-0.5">
              Validez SIGA
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Comprobante de Pago Oficial (2 por Hoja A4)"
      subtitle="Formato institucional A4 horizontal: 1 ejemplar para el estudiante y 1 para archivo de caja"
      maxWidth="5xl"
      actions={
        <div className="flex items-center justify-between w-full">
          <div className="text-[11px] text-slate-500 hidden sm:flex items-center gap-1.5">
            <Scissors className="w-3.5 h-3.5 text-slate-400" />
            <span>Impresión económica en 1 sola hoja A4 para recortar por la mitad.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isPrinting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
            >
              Cerrar
            </button>
            <button
              type="button"
              onClick={handlePrint}
              disabled={isPrinting}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Printer className="w-4 h-4" />
              <span>{isPrinting ? 'Generando Impresión...' : 'Imprimir A4 (2 Comprobantes por Hoja)'}</span>
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-3">
        {/* Banner informativo */}
        <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-2 text-xs text-emerald-900">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Formato A4 Horizontal (Landscape):</strong> Se imprimirán automáticamente los <strong>2 comprobantes gemelos</strong> en una sola página con línea punteada para recortar.
            </span>
          </div>
          <button
            onClick={handlePrint}
            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-lg shrink-0 flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5" />
            Imprimir Ahora
          </button>
        </div>

        {/* On-screen Visual Preview Container (A4 Landscape Layout) */}
        <div className="bg-slate-100 p-3 sm:p-4 rounded-2xl border border-slate-200 overflow-x-auto">
          <div
            ref={printAreaRef}
            id="printable-receipt-area"
            className="bg-white rounded-xl p-4 shadow-sm border border-slate-300 min-w-[700px] flex items-stretch gap-3 relative"
          >
            {/* Voucher 1: Original Estudiante */}
            {renderScreenVoucher('ORIGINAL')}

            {/* Middle Divider with Scissor Icon */}
            <div className="flex flex-col items-center justify-between py-3 px-1 select-none shrink-0 w-8">
              <div className="flex flex-col items-center text-slate-500">
                <Scissors className="w-3.5 h-3.5" />
                <span className="text-[7px] font-mono font-bold mt-0.5 tracking-tight text-slate-500">CORTAR</span>
                <span className="text-[6.5px] font-mono font-bold tracking-tight text-slate-400">AQUÍ</span>
              </div>
              <div className="w-0 flex-1 border-l-2 border-dashed border-slate-300 my-2 relative flex items-center justify-center">
                <div className="bg-white p-0.5 text-slate-400">
                  <Scissors className="w-3 h-3 rotate-90" />
                </div>
              </div>
              <div className="flex flex-col items-center text-slate-500">
                <Scissors className="w-3.5 h-3.5 rotate-180" />
                <span className="text-[7px] font-mono font-bold mt-0.5 tracking-tight text-slate-500">CORTAR</span>
                <span className="text-[6.5px] font-mono font-bold tracking-tight text-slate-400">AQUÍ</span>
              </div>
            </div>

            {/* Voucher 2: Copia Archivo */}
            {renderScreenVoucher('COPIA')}
          </div>
        </div>
      </div>
    </Modal>
  );
};
