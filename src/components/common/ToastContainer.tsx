import React from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-md w-full pointer-events-none">
      {toasts.map((toast) => {
        const icons = {
          success: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />,
          error: <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />,
          warning: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />,
          info: <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />,
        };

        const borderStyles = {
          success: 'border-emerald-200 bg-emerald-50/90 text-emerald-900',
          error: 'border-rose-200 bg-rose-50/90 text-rose-900',
          warning: 'border-amber-200 bg-amber-50/90 text-amber-900',
          info: 'border-blue-200 bg-blue-50/90 text-blue-900',
        };

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg backdrop-blur-md transition-all animate-slideUp ${borderStyles[toast.type]}`}
          >
            {icons[toast.type]}
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-semibold uppercase tracking-wider">
                {typeof toast.title === 'string' ? toast.title : String(toast.title || 'Notificación')}
              </h4>
              <p className="text-xs mt-0.5 leading-relaxed opacity-90">
                {typeof toast.message === 'string' ? toast.message : String(toast.message || '')}
              </p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="p-1 rounded-md opacity-60 hover:opacity-100 hover:bg-black/5 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
