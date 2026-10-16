import React, { useState } from 'react';
import { Building, UploadCloud, Database, Settings, ShieldAlert } from 'lucide-react';
import { InstitucionalSettings } from './InstitucionalSettings';
import { ImportadorView } from '../importador/ImportadorView';
import { DatabaseExplorerView } from '../explorer/DatabaseExplorerView';
import { AuditoriaView } from '../auditoria/AuditoriaView';

export const ConfiguracionView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'institucional' | 'importador' | 'explorer' | 'auditoria'>('institucional');

  const tabs = [
    {
      id: 'institucional' as const,
      label: '1. Configuración Inicial Institucional',
      description: 'Año Lectivo, Periodos, Turnos, Horarios y Secciones',
      icon: <Building className="w-4 h-4" />,
    },
    {
      id: 'importador' as const,
      label: '2. Importador Masivo (Excel)',
      description: 'Carga masiva .xlsx de catálogos y padrón',
      icon: <UploadCloud className="w-4 h-4" />,
    },
    {
      id: 'explorer' as const,
      label: '3. Gestor de Catálogos y BD',
      description: 'Aulas, Secciones, Niveles y Tablas',
      icon: <Database className="w-4 h-4" />,
    },
    {
      id: 'auditoria' as const,
      label: '4. Auditoría de Seguridad y Logs',
      description: 'Historial inmutable de cambios y accesos',
      icon: <ShieldAlert className="w-4 h-4" />,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner / Tab Selector */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-200/80 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  Ajustes del Sistema, Catálogos y Auditoría
                </h1>
                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-md text-[10px] font-mono font-bold uppercase">
                  ADMINISTRACIÓN
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Panel centralizado para configuración institucional, importador Excel, mantenimiento de base de datos y logs de seguridad
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 bg-slate-50/80">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`p-4 text-left transition-all cursor-pointer flex items-start gap-3 ${
                  isActive
                    ? 'bg-white border-b-2 sm:border-b-0 sm:border-t-4 border-blue-600 text-blue-700 shadow-xs'
                    : 'hover:bg-slate-100/80 text-slate-600 hover:text-slate-900'
                }`}
              >
                <div
                  className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                    isActive ? 'bg-blue-100 text-blue-600' : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {tab.icon}
                </div>
                <div className="min-w-0">
                  <div className={`text-xs font-bold ${isActive ? 'text-blue-900' : 'text-slate-800'}`}>
                    {tab.label}
                  </div>
                  <div className="text-[11px] text-slate-500 truncate mt-0.5">
                    {tab.description}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content Display */}
      <div className="transition-all">
        {activeTab === 'institucional' && <InstitucionalSettings />}
        {activeTab === 'importador' && <ImportadorView />}
        {activeTab === 'explorer' && <DatabaseExplorerView />}
        {activeTab === 'auditoria' && <AuditoriaView />}
      </div>
    </div>
  );
};
