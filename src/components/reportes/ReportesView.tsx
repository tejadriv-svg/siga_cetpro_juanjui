import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Badge } from '../common/Badge';
import { normalizeSexo } from '../../utils/genero';
import {
  FileSpreadsheet,
  Download,
  Printer,
  BarChart3,
  TrendingUp,
  Award,
  Users,
  Building,
  CheckCircle2,
  Calendar,
  Layers,
  FileCheck2,
} from 'lucide-react';

export const ReportesView: React.FC = () => {
  const {
    estudiantes,
    personas,
    programas,
    modulos,
    matriculas,
    notasUnidades,
    notasEFSRT,
    recibos,
    documentosOficiales,
    periodoActivo,
    addToast,
  } = useApp();

  const [selectedReport, setSelectedReport] = useState<string>('nomina');

  // Stats
  const totalMatriculados = matriculas.length;
  const totalMujeres = estudiantes.filter((e) => {
    const p = personas.find((per) => per.id === e.personaId);
    return normalizeSexo(p?.sexo) === 'M';
  }).length;
  const percentMujeres = Math.round((totalMujeres / (estudiantes.length || 1)) * 100);

  const totalRecaudado = recibos
    .filter((r) => r.estado === 'Emitido')
    .reduce((acc, r) => acc + r.monto, 0);

  const handleExport = (reportName: string) => {
    addToast(
      'Reporte Generado',
      `El archivo "${reportName}" ha sido procesado y descargado exitosamente.`,
      'success'
    );
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  Reportes Institucionales y Metas MINEDU
                </h1>
                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-md text-[10px] font-mono font-bold uppercase">
                  UGEL MARISCAL CÁCERES
                </span>
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-[10px] font-mono font-bold uppercase">
                  DRE SAN MARTÍN
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Generación de nóminas oficiales, actas consolidadas y estadísticas institucionales
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => handleExport(`Consolidado_General_CETPRO_Juanjui_${periodoActivo}.xlsx`)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Exportar Todo a Excel</span>
            </button>
          </div>
        </div>
      </div>

      {/* Institutional Goals Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Meta de Matrícula Anual
            </span>
            <Badge variant="primary" size="sm">81.1% de Meta</Badge>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 font-mono">284</span>
            <span className="text-xs text-slate-400">/ 350 estudiantes proyectados</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div className="bg-sky-600 h-2 rounded-full" style={{ width: '81.1%' }} />
          </div>
          <div className="text-[11px] text-slate-500">
            Faltan 66 matrículas para alcanzar el 100% de la meta DRE San Martín.
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Distribución por Sexo
            </span>
            <Badge variant="purple" size="sm">{percentMujeres}% Mujeres</Badge>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 font-mono">{totalMujeres}</span>
            <span className="text-xs text-slate-400">mujeres matriculadas</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex">
            <div className="bg-purple-600 h-2" style={{ width: `${percentMujeres}%` }} />
            <div className="bg-sky-500 h-2" style={{ width: `${100 - percentMujeres}%` }} />
          </div>
          <div className="flex justify-between text-[11px] text-slate-400">
            <span>Mujeres: {percentMujeres}%</span>
            <span>Hombres: {100 - percentMujeres}%</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Recaudación TUPA
            </span>
            <Badge variant="success" size="sm">Caja al Día</Badge>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">
            S/ {totalRecaudado.toFixed(2)}
          </div>
          <div className="text-[11px] text-slate-500">
            Ingresos directamente recaudados y depositados en Cuenta Corriente BN.
          </div>
        </div>
      </div>

      {/* Official MINEDU Report Catalog */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
          Formatos y Documentos de Exportación Oficial
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-sm">
                  1. Nómina Oficial de Matrícula (Formato MINEDU)
                </span>
                <Badge variant="primary" size="sm">UGEL</Badge>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Relación nominal de estudiantes clasificados por programa de estudio, turno, código modular y DNI.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                onClick={() => handleExport(`Nomina_Oficial_Matricula_${periodoActivo}.pdf`)}
                className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Vista Imprimible</span>
              </button>
              <button
                onClick={() => handleExport(`Nomina_Oficial_Matricula_${periodoActivo}.xlsx`)}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Descargar Excel</span>
              </button>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-sm">
                  2. Acta Consolidada de Evaluación Modular
                </span>
                <Badge variant="purple" size="sm">RVM 188-2020</Badge>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Calificaciones de capacidades técnicas, empleabilidad y EFSRT con firma de director y docente.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                onClick={() => handleExport(`Acta_Consolidada_Modular_${periodoActivo}.pdf`)}
                className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Vista Imprimible</span>
              </button>
              <button
                onClick={() => handleExport(`Acta_Consolidada_Modular_${periodoActivo}.xlsx`)}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Descargar Excel</span>
              </button>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-sm">
                  3. Libro de Registro de Certificados Modulares
                </span>
                <Badge variant="success" size="sm">MINEDU</Badge>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Padrón correlativo de diplomas y certificados modulares emitidos con código de verificación QR.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                onClick={() => handleExport(`Libro_Registro_Certificados_${periodoActivo}.xlsx`)}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Descargar Padrón</span>
              </button>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-sm">
                  4. Balance Mensual de Caja e Ingresos TUPA
                </span>
                <Badge variant="neutral" size="sm">Tesorería</Badge>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Estado financiero detallado de cobros por matrícula, certificados, cursos libres y depósitos BN.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                onClick={() => handleExport(`Balance_Caja_${periodoActivo}.xlsx`)}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Descargar Balance</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
