import React, { useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { ProgramaEstudio } from '../../types';
import { Badge } from '../common/Badge';
import {
  X,
  BookOpen,
  Clock,
  Award,
  Layers,
  CheckCircle2,
  Calendar,
  Building,
  Upload,
  Download,
} from 'lucide-react';

interface ProgramaDetalleDrawerProps {
  programa: ProgramaEstudio;
  onClose: () => void;
}

export const ProgramaDetalleDrawer: React.FC<ProgramaDetalleDrawerProps> = ({
  programa,
  onClose,
}) => {
  const { modulos = [], unidades = [], updateModulo, updatePrograma, secciones = [], trabajadores = [], personas = [], addToast } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const progModulos = modulos.filter((m) => m.programaId === programa.id);

  const handleUploadPlanPdf = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileUrl = URL.createObjectURL(file);
    updatePrograma(programa.id, { archivoUrl: fileUrl });

    if (addToast) {
      addToast(
        'Plan de Estudios Vinculado',
        `Se adjuntó exitosamente el archivo "${file.name}" al programa ${programa.nombre}`,
        'success'
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end animate-fadeIn">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleUploadPlanPdf}
        accept=".pdf,.doc,.docx,.xls,.xlsx"
        className="hidden"
      />

      <div
        className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col transform transition-transform animate-slideLeft border-l border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="primary" size="sm">{programa.nivelFormativo}</Badge>
              <span className="font-mono text-xs text-slate-400 font-semibold">{programa.codigo}</span>
              <select
                value={programa.estado || 'ACTIVO'}
                onChange={(e) => updatePrograma(programa.id, { estado: e.target.value })}
                className="ml-2 bg-white border border-slate-300 text-xs rounded-md px-2 py-0.5 outline-none font-medium text-slate-700 focus:ring-1 focus:ring-sky-500 shadow-sm"
              >
                <option value="ACTIVO">Activo</option>
                <option value="INACTIVO">Inactivo</option>
              </select>
            </div>
            <h3 className="text-base font-bold text-slate-900 mt-1">
              {programa.nombre}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Curricular Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Overview */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-3">
            <p className="text-slate-700 leading-relaxed">{programa.descripcion}</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200">
              <div>
                <span className="text-slate-400 block text-[10px]">Total Horas:</span>
                <strong className="text-slate-900 font-mono">{programa.totalHoras} hrs</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Créditos CNOF:</span>
                <strong className="text-slate-900 font-mono">{programa.totalCreditos} créd.</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">N° Módulos:</span>
                <strong className="text-slate-900 font-mono">{progModulos.length} módulos</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Normativa:</span>
                <strong className="text-slate-900 text-[11px]">RVM 188-2020</strong>
              </div>
            </div>
          </div>

          {/* Modules and Units */}
          <div className="space-y-4">
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-xs flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-sky-600" />
              Estructura Modular y Unidades Didácticas
            </h4>

            {progModulos.map((mod, idx) => {
              const modUnidades = unidades.filter((u) => u.moduloId === mod.id);
              const modSecciones = secciones.filter((s) => s.moduloId === mod.id);

              return (
                <div
                  key={mod.id}
                  className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono font-bold text-sky-700 text-xs block">
                        MÓDULO {idx + 1}: {mod.codigo}
                      </span>
                      <h5 className="font-bold text-slate-900 text-sm mt-0.5">{mod.nombre}</h5>
                    </div>
                    <Badge variant="purple" size="sm">
                      {mod.horas} hrs • {mod.creditos} créd.
                    </Badge>
                    <select
                      value={mod.estado || 'ACTIVO'}
                      onChange={(e) => updateModulo(mod.id, { estado: e.target.value })}
                      className="ml-2 bg-slate-50 border border-slate-200 text-xs rounded-md px-2 py-0.5 outline-none font-medium focus:ring-1 focus:ring-sky-500"
                    >
                      <option value="ACTIVO">Activo</option>
                      <option value="INACTIVO">Inactivo</option>
                    </select>
                  </div>

                  <p className="text-slate-600 text-xs">{mod.descripcion}</p>

                  {/* Units list */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-100">
                    <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      Unidades Didácticas Asociadas:
                    </div>
                    {modUnidades.length === 0 ? (
                      <div className="text-slate-400 italic text-[11px]">
                        Unidades didácticas estándar (Capacidad Técnica 1, 2, Empleabilidad y EFSRT 120h).
                      </div>
                    ) : (
                      modUnidades.map((u) => (
                        <div
                          key={u.id}
                          className="p-2 bg-slate-50 rounded-lg flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-semibold text-slate-800">{u.nombre}</span>
                            <span className="text-[10px] text-slate-400 font-mono ml-2">({u.tipo})</span>
                          </div>
                          <span className="font-mono font-bold text-slate-700">{u.horas}h</span>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Active Sections */}
                  {modSecciones.length > 0 && (
                    <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                      <span className="text-[11px] text-slate-400">Secciones activas:</span>
                      {modSecciones.map((s) => (
                        <span
                          key={s.id}
                          className="px-2 py-0.5 bg-sky-50 text-sky-700 border border-sky-200 rounded text-[10px] font-semibold"
                        >
                          Sección {s.nombre} ({s.turno} - {s.aula})
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-2">
           <div className="flex items-center gap-2">
             {programa.archivoUrl ? (
                <a 
                   href={programa.archivoUrl} 
                   target="_blank" 
                   rel="noopener noreferrer"
                   className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Ver Plan de Estudios</span>
                </a>
             ) : (
                <span className="text-slate-400 text-xs italic">Plan de estudios sin archivo</span>
             )}

             <button
               type="button"
               onClick={() => {
                 if (fileInputRef.current) fileInputRef.current.click();
               }}
               className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
               title="Adjuntar o reemplazar el archivo del Plan de Estudios (PDF, Word, Excel)"
             >
               <Upload className="w-3.5 h-3.5" />
               <span>Adjuntar / Subir Archivo</span>
             </button>
           </div>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Cerrar Malla
          </button>
        </div>
      </div>
    </div>
  );
};
