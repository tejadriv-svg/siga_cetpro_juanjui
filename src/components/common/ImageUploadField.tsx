import React, { useState, useRef } from 'react';
import { Upload, Link as LinkIcon, Trash2, Image as ImageIcon, AlertTriangle, Check, RefreshCw } from 'lucide-react';

interface ImageUploadFieldProps {
  label: string;
  sublabel?: string;
  value: string;
  onChange: (value: string) => void;
  aspectRatio?: 'square' | 'wide' | 'auto';
  previewSize?: 'sm' | 'md' | 'lg';
  placeholderText?: string;
  helperText?: string;
  maxSizeMB?: number;
}

export const ImageUploadField: React.FC<ImageUploadFieldProps> = ({
  label,
  sublabel,
  value,
  onChange,
  aspectRatio = 'square',
  previewSize = 'md',
  placeholderText = 'https://ejemplo.com/imagen.png o enlace web...',
  helperText,
  maxSizeMB = 5,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'url'>('upload');
  const [urlInput, setUrlInput] = useState(value && !value.startsWith('data:') && !value.includes('\\') ? value : '');
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if current value is a Windows/local filesystem path that browsers cannot load
  const isLocalDrivePath = Boolean(
    value && (
      value.match(/^[a-zA-Z]:\\/) ||
      value.startsWith('file://') ||
      value.includes('\\system_cetpro') ||
      value.includes('Mi unidad')
    )
  );

  const handleFile = (file: File) => {
    setErrorMessage(null);
    if (!file.type.startsWith('image/')) {
      setErrorMessage('El archivo seleccionado debe ser una imagen (PNG, JPG, JPEG, WEBP, SVG).');
      return;
    }

    if (file.size > maxSizeMB * 1024 * 1024) {
      setErrorMessage(`La imagen supera el límite de ${maxSizeMB}MB. Por favor selecciona una imagen más liviana.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        onChange(e.target.result as string);
        setErrorMessage(null);
      }
    };
    reader.onerror = () => {
      setErrorMessage('Error al procesar el archivo de imagen.');
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleUrlApply = () => {
    if (urlInput.trim()) {
      onChange(urlInput.trim());
      setErrorMessage(null);
    }
  };

  const handleClear = () => {
    onChange('');
    setUrlInput('');
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const sizeClasses = {
    sm: 'w-14 h-14',
    md: 'w-20 h-20',
    lg: 'w-28 h-28',
  }[previewSize];

  const aspectClasses = {
    square: 'aspect-square rounded-2xl',
    wide: 'aspect-video rounded-xl',
    auto: 'rounded-xl',
  }[aspectRatio];

  return (
    <div className="space-y-2">
      {/* Label and Sublabel */}
      <div className="flex items-center justify-between">
        <div>
          <label className="block text-xs font-bold text-slate-800 tracking-tight">{label}</label>
          {sublabel && <p className="text-[11px] text-slate-500">{sublabel}</p>}
        </div>
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="text-[11px] text-red-600 hover:text-red-700 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
          >
            <Trash2 className="w-3 h-3" />
            <span>Eliminar imagen</span>
          </button>
        )}
      </div>

      {/* Local Drive Path Warning */}
      {isLocalDrivePath && (
        <div className="p-3 bg-amber-50/90 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-start gap-2.5 shadow-2xs">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-[11px]">Ruta de archivo local detectada:</p>
            <code className="text-[10px] bg-amber-100/80 px-1.5 py-0.5 rounded font-mono break-all block text-amber-950">
              {value}
            </code>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              Los navegadores web bloquean el acceso a rutas locales de Windows (<code className="font-mono text-[10px]">G:\...</code> o <code className="font-mono text-[10px]">C:\...</code>) por directivas de seguridad. Por favor, <strong>sube el archivo directamente</strong> usando el botón de abajo para que se guarde y visualice correctamente en la aplicación.
            </p>
          </div>
        </div>
      )}

      {/* Main Upload Container */}
      <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Preview Box */}
          <div className="relative group shrink-0">
            <div
              className={`${sizeClasses} ${aspectClasses} bg-white border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden shadow-xs relative`}
            >
              {value && !isLocalDrivePath ? (
                <img
                  src={value}
                  alt="Vista previa"
                  className="w-full h-full object-contain p-1"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <div className="text-center p-2 text-slate-400 flex flex-col items-center justify-center">
                  <ImageIcon className="w-6 h-6 mb-1 text-slate-400" />
                  <span className="text-[9px] font-semibold uppercase tracking-wider">
                    {isLocalDrivePath ? 'Subir imagen' : 'Sin imagen'}
                  </span>
                </div>
              )}
            </div>

            {value && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute -top-2 -right-2 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-md transition-colors cursor-pointer"
                title="Quitar imagen"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Controls & Inputs */}
          <div className="flex-1 w-full space-y-2.5">
            {/* Mode Switcher */}
            <div className="flex items-center gap-1 p-0.5 bg-slate-200/80 rounded-lg w-fit text-[11px] font-semibold text-slate-600">
              <button
                type="button"
                onClick={() => setActiveTab('upload')}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                  activeTab === 'upload' ? 'bg-white text-blue-700 shadow-2xs' : 'hover:text-slate-900'
                }`}
              >
                <Upload className="w-3 h-3" />
                <span>Subir Archivo</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('url')}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                  activeTab === 'url' ? 'bg-white text-blue-700 shadow-2xs' : 'hover:text-slate-900'
                }`}
              >
                <LinkIcon className="w-3 h-3" />
                <span>Enlace Web</span>
              </button>
            </div>

            {activeTab === 'upload' ? (
              /* Drag & Drop Area / File Picker */
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-3 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-blue-500 bg-blue-50/70'
                    : 'border-slate-300 hover:border-blue-400 bg-white hover:bg-slate-50/50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, image/webp, image/svg+xml"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFile(file);
                  }}
                />
                <div className="flex items-center justify-center gap-2 text-xs text-slate-700">
                  <Upload className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="font-semibold text-blue-700 hover:underline">Haz clic para examinar</span>
                  <span className="text-slate-400 font-normal">o arrastra y suelta tu imagen aquí</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">Formatos: PNG, JPG, WEBP, SVG (Máx. {maxSizeMB}MB)</p>
              </div>
            ) : (
              /* Web URL Input */
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <LinkIcon className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    placeholder={placeholderText}
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleUrlApply();
                      }
                    }}
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleUrlApply}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-2xs transition-colors cursor-pointer shrink-0 flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Aplicar</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {errorMessage && (
          <p className="text-xs text-red-600 font-medium flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>{errorMessage}</span>
          </p>
        )}

        {helperText && <p className="text-[11px] text-slate-500">{helperText}</p>}
      </div>
    </div>
  );
};
