import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { ExternalLink } from 'lucide-react';

interface QrCodeProps {
  value: string;
  size?: number;
  label?: string;
  showLink?: boolean;
}

export const QrCode: React.FC<QrCodeProps> = ({
  value,
  size = 140,
  label = 'Escanee para verificar autenticidad',
  showLink = true,
}) => {
  const [dataUrl, setDataUrl] = useState<string>('');

  useEffect(() => {
    if (!value) return;

    QRCode.toDataURL(value, {
      width: Math.max(size * 2, 200), // Alta resolución para lectura nítida e impresión
      margin: 1,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then((url) => {
        setDataUrl(url);
      })
      .catch((err) => {
        console.error('Error generando QR code:', err);
      });
  }, [value, size]);

  return (
    <div className="flex flex-col items-center justify-center p-2 bg-white rounded-xl">
      <div className="relative p-1 bg-white rounded-lg border border-slate-200 shadow-2xs">
        {dataUrl ? (
          <img
            src={dataUrl}
            alt="Código QR de Verificación"
            width={size}
            height={size}
            className="block rounded"
            style={{ width: `${size}px`, height: `${size}px` }}
          />
        ) : (
          <div
            className="bg-slate-100 animate-pulse rounded flex items-center justify-center text-[10px] text-slate-400"
            style={{ width: `${size}px`, height: `${size}px` }}
          >
            Generando QR...
          </div>
        )}
      </div>

      {label && <p className="text-[10px] text-slate-500 font-medium mt-1.5 text-center">{label}</p>}

      {showLink && value.startsWith('http') && (
        <a
          href={value}
          target="_blank"
          rel="noreferrer"
          className="mt-1 inline-flex items-center gap-1 text-[10px] text-sky-600 hover:text-sky-800 font-mono underline truncate max-w-[180px]"
        >
          <span>{value.replace(/^https?:\/\//, '')}</span>
          <ExternalLink className="w-2.5 h-2.5 shrink-0" />
        </a>
      )}
    </div>
  );
};
