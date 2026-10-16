import React, { useState } from 'react';
import { CertificadosView } from '../certificados/CertificadosView';
import { ReportesView } from './ReportesView';
import { FileCheck2, TrendingUp, Sparkles } from 'lucide-react';

export const EmisionYReportesView: React.FC<{ defaultTab?: 'emision' | 'reportes' }> = ({ defaultTab = 'emision' }) => {
  const [activeTab, setActiveTab] = useState<'emision' | 'reportes'>(defaultTab);

  return (
    <div className="space-y-4">
      {/* Unified Tab Bar Header */}
      <div className="bg-white p-2 sm:p-3 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-xs">
            {activeTab === 'emision' ? (
              <FileCheck2 className="w-5 h-5" />
            ) : (
              <TrendingUp className="w-5 h-5" />
            )}
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              Emisión y Reportes
              <span className="text-[10px] bg-indigo-50 text-indigo-700 font-mono font-semibold px-2 py-0.5 rounded-full border border-indigo-200/60 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" /> Oficial
              </span>
            </h1>
            <p className="text-xs text-slate-500">
              Certificados modulares con QR, actas oficiales y consolidados estadísticos UGEL
            </p>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center bg-slate-100/80 p-1 rounded-xl border border-slate-200/60 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('emision')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'emision'
                ? 'bg-white text-blue-700 shadow-xs border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileCheck2 className="w-4 h-4" />
            <span>Emisión de Documentos</span>
          </button>
          <button
            onClick={() => setActiveTab('reportes')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'reportes'
                ? 'bg-white text-indigo-700 shadow-xs border border-slate-200/60'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Reportes y Metas</span>
          </button>
        </div>
      </div>

      {/* Render Active View */}
      <div>
        {activeTab === 'emision' ? <CertificadosView /> : <ReportesView />}
      </div>
    </div>
  );
};
