import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { BienPatrimonial, EstadoConservacion } from '../../types';
import { Badge } from '../common/Badge';
import {
  Boxes,
  PlusCircle,
  Search,
  Wrench,
  QrCode,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Trash2,
  Edit,
  X,
  Printer,
  ShieldCheck,
  Building,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export const InventarioBienesView: React.FC = () => {
  const {
    bienesPatrimoniales,
    addBienPatrimonial,
    updateBienPatrimonial,
    deleteBienPatrimonial,
    addToast,
    institucion,
  } = useApp();

  const [search, setSearch] = useState('');
  const [selectedTaller, setSelectedTaller] = useState<string>('TODOS');
  const [selectedEstado, setSelectedEstado] = useState<string>('TODOS');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBien, setEditingBien] = useState<BienPatrimonial | null>(null);
  const [selectedQrBien, setSelectedQrBien] = useState<BienPatrimonial | null>(null);

  // Paginación y límite de visualización (10 más recientes por defecto)
  const [limitCount, setLimitCount] = useState<number | 'ALL'>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const [formBien, setFormBien] = useState({
    codigoPatrimonial: '',
    nombre: '',
    marca: '',
    modelo: '',
    serie: '',
    taller: 'Laboratorio de Cómputo e Informática',
    ubicacion: 'Pabellón B - Segundo Piso',
    estado: 'Bueno / Operativo' as EstadoConservacion,
    fechaAdquisicion: new Date().toISOString().split('T')[0],
    valorEstimado: 1500,
    responsableNombre: 'Lic. Jhonathan Silva',
    ultimoMantenimiento: new Date().toISOString().split('T')[0],
  });

  const talleresList = [
    'Laboratorio de Cómputo e Informática',
    'Taller de Mecánica Automotriz y Motos',
    'Taller de Confección Textil',
    'Taller de Cocina y Pastelería',
    'Taller de Metalmecánica y Estructuras',
    'Taller de Electricidad y Electrónica',
    'Aula Multiusos / Auditorio',
    'Dirección y Secretaría Académica',
  ];

  const filteredBienes = useMemo(() => {
    return bienesPatrimoniales
      .filter((b) => {
        const s = search.toLowerCase();
        const matchSearch =
          b.nombre.toLowerCase().includes(s) ||
          b.codigoPatrimonial.toLowerCase().includes(s) ||
          b.marca.toLowerCase().includes(s) ||
          b.modelo.toLowerCase().includes(s) ||
          b.serie.toLowerCase().includes(s) ||
          b.taller.toLowerCase().includes(s) ||
          b.responsableNombre.toLowerCase().includes(s);

        if (!matchSearch) return false;
        if (selectedTaller !== 'TODOS' && b.taller !== selectedTaller) return false;
        if (selectedEstado !== 'TODOS' && b.estado !== selectedEstado) return false;

        return true;
      })
      .sort((a, b) => {
        const dateA = a.fechaAdquisicion || (a as any).createdAt || '';
        const dateB = b.fechaAdquisicion || (b as any).createdAt || '';
        if (dateB && dateA) return dateB.localeCompare(dateA);
        return (b.id || '').localeCompare(a.id || '');
      });
  }, [bienesPatrimoniales, search, selectedTaller, selectedEstado]);

  // Reset a la página 1 cuando cambian los filtros o el límite
  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedTaller, selectedEstado, limitCount]);

  // Paginación y bienes mostrados
  const totalBienesCount = filteredBienes.length;
  const pageSize = limitCount === 'ALL' ? totalBienesCount : limitCount;
  const totalPages = Math.max(1, Math.ceil(totalBienesCount / (pageSize || 1)));
  const effectivePage = Math.min(currentPage, totalPages);
  const displayedBienes = useMemo(() => {
    if (limitCount === 'ALL') return filteredBienes;
    const start = (effectivePage - 1) * pageSize;
    return filteredBienes.slice(start, start + pageSize);
  }, [filteredBienes, limitCount, effectivePage, pageSize]);

  const valorTotal = bienesPatrimoniales.reduce((acc, b) => acc + (b.valorEstimado || 0), 0);
  const operativosCount = bienesPatrimoniales.filter((b) => b.estado === 'Bueno / Operativo').length;
  const mantenimientoCount = bienesPatrimoniales.filter((b) => b.estado === 'En Mantenimiento').length;

  const handleOpenCreate = () => {
    setEditingBien(null);
    const nextSeq = (bienesPatrimoniales.length + 143).toString().padStart(6, '0');
    setFormBien({
      codigoPatrimonial: `740895${nextSeq}`,
      nombre: '',
      marca: '',
      modelo: '',
      serie: '',
      taller: 'Laboratorio de Cómputo e Informática',
      ubicacion: 'Pabellón B - Segundo Piso',
      estado: 'Bueno / Operativo',
      fechaAdquisicion: new Date().toISOString().split('T')[0],
      valorEstimado: 1500,
      responsableNombre: 'Lic. Jhonathan Silva',
      ultimoMantenimiento: new Date().toISOString().split('T')[0],
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (bien: BienPatrimonial) => {
    setEditingBien(bien);
    setFormBien({
      codigoPatrimonial: bien.codigoPatrimonial,
      nombre: bien.nombre,
      marca: bien.marca,
      modelo: bien.modelo,
      serie: bien.serie,
      taller: bien.taller,
      ubicacion: bien.ubicacion,
      estado: bien.estado,
      fechaAdquisicion: bien.fechaAdquisicion,
      valorEstimado: bien.valorEstimado,
      responsableNombre: bien.responsableNombre,
      ultimoMantenimiento: bien.ultimoMantenimiento || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formBien.codigoPatrimonial.trim() || !formBien.nombre.trim()) {
      addToast('Campos Requeridos', 'Ingrese el código patrimonial y el nombre del bien', 'warning');
      return;
    }

    if (editingBien) {
      updateBienPatrimonial({
        ...editingBien,
        ...formBien,
        valorEstimado: Number(formBien.valorEstimado),
      });
    } else {
      addBienPatrimonial({
        ...formBien,
        valorEstimado: Number(formBien.valorEstimado),
      });
    }

    setIsModalOpen(false);
  };

  const getEstadoBadge = (estado: EstadoConservacion) => {
    switch (estado) {
      case 'Bueno / Operativo':
        return <Badge variant="success" size="sm">Bueno / Operativo</Badge>;
      case 'Regular':
        return <Badge variant="warning" size="sm">Regular</Badge>;
      case 'En Mantenimiento':
        return <Badge variant="primary" size="sm">En Mantenimiento</Badge>;
      case 'De Baja':
        return <Badge variant="danger" size="sm">De Baja</Badge>;
      default:
        return <Badge variant="neutral" size="sm">{estado}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  Inventario Patrimonial y Control de Bienes
                </h1>
                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md text-[10px] font-mono font-bold uppercase">
                  SBN - MARGUESÍ
                </span>
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-[10px] font-mono font-bold uppercase">
                  {operativosCount} OPERATIVOS
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Control de activos fijos, maquinarias de talleres técnicos, computadoras y mobiliario institucional
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={handleOpenCreate}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Registrar Bien Patrimonial</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Metric Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Bienes Registrados</span>
            <Boxes className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-xl font-bold text-slate-900 mt-2">{bienesPatrimoniales.length}</p>
          <span className="text-[10px] text-slate-500">Inventario SBN institucional</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Valorización Estimada</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-xl font-bold text-slate-900 mt-2">S/ {valorTotal.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</p>
          <span className="text-[10px] text-emerald-600 font-medium">Activos en talleres</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Operativos / Bueno</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xl font-bold text-emerald-700 mt-2">{operativosCount}</p>
          <span className="text-[10px] text-slate-500">Listos para dictado de clases</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">En Mantenimiento</span>
            <Wrench className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-xl font-bold text-amber-700 mt-2">{mantenimientoCount}</p>
          <span className="text-[10px] text-amber-600 font-medium">Revisión técnica periódica</span>
        </div>
      </div>

      {/* 3. Search and Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por código SBN, equipo, marca, taller o responsable..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap">
          <select
            value={selectedTaller}
            onChange={(e) => setSelectedTaller(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden text-slate-700"
          >
            <option value="TODOS">Todos los Talleres y Áreas</option>
            {talleresList.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          <select
            value={selectedEstado}
            onChange={(e) => setSelectedEstado(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden text-slate-700"
          >
            <option value="TODOS">Todos los Estados</option>
            <option value="Bueno / Operativo">Bueno / Operativo</option>
            <option value="Regular">Regular</option>
            <option value="En Mantenimiento">En Mantenimiento</option>
            <option value="De Baja">De Baja</option>
          </select>
        </div>
      </div>

      {/* 4. Table of Goods */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-4">Código Patrimonial</th>
                <th className="p-4">Bien / Maquinaria</th>
                <th className="p-4">Marca / Serie</th>
                <th className="p-4">Taller y Ubicación</th>
                <th className="p-4 text-center">Estado</th>
                <th className="p-4 text-right">Valor Estimado</th>
                <th className="p-4">Responsable</th>
                <th className="p-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {displayedBienes.map((bien) => (
                <tr key={bien.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-4 font-mono font-bold text-blue-600">
                    <span className="bg-blue-50 px-2 py-1 rounded-md border border-blue-200">
                      {bien.codigoPatrimonial}
                    </span>
                  </td>
                  <td className="p-4">
                    <p className="font-bold text-slate-900 text-sm leading-snug">{bien.nombre}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Adquirido: {bien.fechaAdquisicion}</p>
                  </td>
                  <td className="p-4">
                    <p className="font-semibold text-slate-800">{bien.marca || 'S/M'} - {bien.modelo || 'S/M'}</p>
                    <p className="text-[10px] font-mono text-slate-500">S/N: {bien.serie || '---'}</p>
                  </td>
                  <td className="p-4">
                    <p className="font-medium text-slate-800">{bien.taller}</p>
                    <p className="text-[11px] text-slate-500">{bien.ubicacion}</p>
                  </td>
                  <td className="p-4 text-center">
                    {getEstadoBadge(bien.estado)}
                  </td>
                  <td className="p-4 text-right font-bold text-slate-900">
                    S/ {bien.valorEstimado?.toFixed(2) || '0.00'}
                  </td>
                  <td className="p-4">
                    <p className="font-medium text-slate-800">{bien.responsableNombre}</p>
                    {bien.ultimoMantenimiento && (
                      <p className="text-[10px] text-slate-500">Mant.: {bien.ultimoMantenimiento}</p>
                    )}
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => setSelectedQrBien(bien)}
                        className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                        title="Ver Etiqueta QR SBN"
                      >
                        <QrCode className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(bien)}
                        className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                        title="Editar ficha"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteBienPatrimonial(bien.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Eliminar bien"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {displayedBienes.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-400">
                    <Boxes className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <p className="font-bold text-slate-700 text-sm">No se encontraron bienes patrimoniales</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Verifique los filtros aplicados o registre un nuevo equipo para los talleres técnicos.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Barra de paginación y límite */}
        {totalBienesCount > 0 && (
          <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <span>
                Mostrando <strong className="text-slate-900">{displayedBienes.length}</strong> de <strong className="text-slate-900">{totalBienesCount}</strong> bienes (más recientes primero)
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 text-[11px]">Mostrar:</span>
                <select
                  value={limitCount}
                  onChange={(e) => setLimitCount(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
                  className="bg-white border border-slate-300 rounded px-2 py-1 text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value={10}>10 más recientes</option>
                  <option value={25}>25 por página</option>
                  <option value={50}>50 por página</option>
                  <option value="ALL">Todos ({totalBienesCount})</option>
                </select>
              </div>

              {limitCount !== 'ALL' && totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={effectivePage <= 1}
                    className="p-1 rounded border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700"
                    title="Página anterior"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[11px] font-semibold text-slate-700 px-1">
                    {effectivePage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={effectivePage >= totalPages}
                    className="p-1 rounded border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700"
                    title="Página siguiente"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal: Registrar o Editar Bien */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                  <Boxes className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingBien ? 'Editar Ficha de Bien Patrimonial' : 'Registrar Nuevo Bien Patrimonial'}
                  </h3>
                  <p className="text-xs text-slate-500">Catálogo de Activos y Equipamiento Técnico CETPRO</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Código SBN / Marguesí *</label>
                  <input
                    type="text"
                    required
                    placeholder="ej. 740895000142"
                    value={formBien.codigoPatrimonial}
                    onChange={(e) => setFormBien({ ...formBien, codigoPatrimonial: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs font-mono font-bold border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Estado de Conservación</label>
                  <select
                    value={formBien.estado}
                    onChange={(e) => setFormBien({ ...formBien, estado: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  >
                    <option value="Bueno / Operativo">Bueno / Operativo</option>
                    <option value="Regular">Regular</option>
                    <option value="En Mantenimiento">En Mantenimiento</option>
                    <option value="De Baja">De Baja</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Denominación del Bien / Equipo *</label>
                <input
                  type="text"
                  required
                  placeholder="ej. Máquina de Coser Industrial Recta Automática JACK F4"
                  value={formBien.nombre}
                  onChange={(e) => setFormBien({ ...formBien, nombre: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Marca</label>
                  <input
                    type="text"
                    placeholder="ej. JACK / HP / Nova"
                    value={formBien.marca}
                    onChange={(e) => setFormBien({ ...formBien, marca: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Modelo</label>
                  <input
                    type="text"
                    placeholder="ej. F4 Direct Drive"
                    value={formBien.modelo}
                    onChange={(e) => setFormBien({ ...formBien, modelo: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Número de Serie (S/N)</label>
                  <input
                    type="text"
                    placeholder="ej. JK-2022-77129"
                    value={formBien.serie}
                    onChange={(e) => setFormBien({ ...formBien, serie: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Taller / Laboratorio Asignado</label>
                  <select
                    value={formBien.taller}
                    onChange={(e) => setFormBien({ ...formBien, taller: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  >
                    {talleresList.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Ubicación Exacta / Pabellón</label>
                  <input
                    type="text"
                    placeholder="ej. Pabellón A - Primer Piso"
                    value={formBien.ubicacion}
                    onChange={(e) => setFormBien({ ...formBien, ubicacion: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Valor Estimado (S/.)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={formBien.valorEstimado}
                    onChange={(e) => setFormBien({ ...formBien, valorEstimado: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Fecha Adquisición</label>
                  <input
                    type="date"
                    value={formBien.fechaAdquisicion}
                    onChange={(e) => setFormBien({ ...formBien, fechaAdquisicion: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Último Mantenimiento</label>
                  <input
                    type="date"
                    value={formBien.ultimoMantenimiento}
                    onChange={(e) => setFormBien({ ...formBien, ultimoMantenimiento: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Docente / Trabajador Custodio Responsable</label>
                <input
                  type="text"
                  placeholder="ej. Prof. Marina Ruiz Pinedo"
                  value={formBien.responsableNombre}
                  onChange={(e) => setFormBien({ ...formBien, responsableNombre: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{editingBien ? 'Guardar Cambios' : 'Registrar Bien'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Sticker QR SBN Patrimonial */}
      {selectedQrBien && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Etiqueta Patrimonial SBN</h3>
              <button
                onClick={() => setSelectedQrBien(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Sticker Preview */}
            <div className="p-4 bg-white border-2 border-slate-800 rounded-xl space-y-3 shadow-md font-sans">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-1.5">
                  <Building className="w-4 h-4 text-slate-900" />
                  <span className="text-[11px] font-black text-slate-900 tracking-tight uppercase">
                    {institucion.nombre}
                  </span>
                </div>
                <span className="text-[9px] font-bold text-slate-600">MINEDU / DRE-SM</span>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-24 h-24 bg-slate-100 border border-slate-300 rounded-lg flex flex-col items-center justify-center p-1 shrink-0">
                  <QrCode className="w-16 h-16 text-slate-900" />
                  <span className="text-[8px] font-mono text-slate-500 mt-0.5">SBN-PAT-QR</span>
                </div>

                <div className="space-y-1 min-w-0 text-xs">
                  <div className="bg-slate-900 text-white px-2 py-0.5 rounded font-mono font-bold text-[11px]">
                    SBN: {selectedQrBien.codigoPatrimonial}
                  </div>
                  <p className="font-bold text-slate-900 text-[11px] leading-tight line-clamp-2">
                    {selectedQrBien.nombre}
                  </p>
                  <p className="text-[10px] text-slate-600">
                    <span className="font-semibold">Taller:</span> {selectedQrBien.taller}
                  </p>
                  <p className="text-[10px] text-slate-600">
                    <span className="font-semibold">Serie:</span> {selectedQrBien.serie || 'N/A'}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-dashed border-slate-400 flex items-center justify-between text-[9px] text-slate-500 font-mono">
                <span>INVENTARIO GENERAL 2025</span>
                <span>JUANJUÍ - SAN MARTÍN</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedQrBien(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cerrar
              </button>
              <button
                onClick={() => {
                  window.print();
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Etiqueta</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
