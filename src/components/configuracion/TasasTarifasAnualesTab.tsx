import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { ConceptoPago } from '../../types';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import {
  DollarSign,
  Search,
  Plus,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Layers,
  Tag,
  CalendarCheck,
  TrendingUp,
  Info
} from 'lucide-react';

export const TasasTarifasAnualesTab: React.FC = () => {
  const { conceptosPago, updateConceptoPago, addConceptoPago, periodoActivo } = useApp();

  const [search, setSearch] = useState('');
  const [categoriaFilter, setCategoriaFilter] = useState<string>('TODAS');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedConcepto, setSelectedConcepto] = useState<ConceptoPago | null>(null);

  // Formulario de edición / creación
  const [formValues, setFormValues] = useState({
    codigo: '',
    nombre: '',
    montoSugerido: 0,
    categoria: 'Otros' as ConceptoPago['categoria'],
    esMontoLibre: false,
    estado: 'Activo' as 'Activo' | 'Inactivo',
  });
  const [isSaving, setIsSaving] = useState(false);

  // Filtrado de conceptos
  const filteredConceptos = useMemo(() => {
    return conceptosPago.filter((c) => {
      const q = search.toLowerCase().trim();
      const matchSearch =
        q === '' ||
        (c.codigo || '').toLowerCase().includes(q) ||
        (c.nombre || '').toLowerCase().includes(q);

      if (!matchSearch) return false;

      if (categoriaFilter !== 'TODAS') {
        if (categoriaFilter === 'MANTO' && !(c.codigo.includes('MANTO') || c.nombre.toLowerCase().includes('mantenimiento'))) return false;
        if (categoriaFilter === 'CERT' && !(c.codigo.includes('CERT') || c.codigo.includes('TIT') || c.nombre.toLowerCase().includes('título') || c.nombre.toLowerCase().includes('certificado'))) return false;
        if (categoriaFilter === 'CURSOS' && !(c.codigo.includes('CUR') || c.codigo.includes('TAL') || c.codigo.includes('SERV') || c.nombre.toLowerCase().includes('curso') || c.nombre.toLowerCase().includes('capacitac'))) return false;
      }

      return true;
    });
  }, [conceptosPago, search, categoriaFilter]);

  // KPIs de tarifas destacadas
  const montoFinSemana = conceptosPago.find(c => c.codigo === 'PAGO_MANTO_FIN_SEMANA')?.montoSugerido ?? 300;
  const montoRegular = conceptosPago.find(c => c.codigo === 'PAGO_MANTO')?.montoSugerido ?? 200;
  const montoCertificado = conceptosPago.find(c => c.codigo === 'PAGO_CERT')?.montoSugerido ?? 5;
  const montoTituloAux = conceptosPago.find(c => c.codigo === 'PAGO_TIT1')?.montoSugerido ?? 100;

  const handleOpenEdit = (c: ConceptoPago) => {
    setSelectedConcepto(c);
    setFormValues({
      codigo: c.codigo,
      nombre: c.nombre,
      montoSugerido: c.montoSugerido,
      categoria: c.categoria || 'Otros',
      esMontoLibre: c.montoSugerido === 0 || Boolean(c.esMontoLibre),
      estado: c.estado || 'Activo',
    });
    setIsEditModalOpen(true);
  };

  const handleOpenNew = () => {
    setSelectedConcepto(null);
    setFormValues({
      codigo: `CP-${Math.floor(100 + Math.random() * 900)}`,
      nombre: '',
      montoSugerido: 50,
      categoria: 'Otros',
      esMontoLibre: false,
      estado: 'Activo',
    });
    setIsNewModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConcepto) return;
    setIsSaving(true);
    try {
      const finalMonto = formValues.esMontoLibre ? 0 : Number(formValues.montoSugerido);
      await updateConceptoPago(selectedConcepto.id, {
        codigo: formValues.codigo,
        nombre: formValues.nombre,
        montoSugerido: finalMonto,
        montoFijo: finalMonto,
        esMontoLibre: formValues.esMontoLibre,
        estado: formValues.estado,
        categoria: formValues.categoria,
      });
      setIsEditModalOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveNew = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const finalMonto = formValues.esMontoLibre ? 0 : Number(formValues.montoSugerido);
      await addConceptoPago({
        codigo: formValues.codigo,
        nombre: formValues.nombre,
        montoSugerido: finalMonto,
        montoFijo: finalMonto,
        esMontoLibre: formValues.esMontoLibre,
        estado: formValues.estado,
        categoria: formValues.categoria,
        aplicaMora: false,
      });
      setIsNewModalOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      
      {/* 1. Header Banner & Explicación TUPA */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <DollarSign className="w-4 h-4" />
              </div>
              <h2 className="text-base font-bold text-slate-900">
                Costos, Aranceles y Tasas Oficiales del Año (TUPA CETPRO)
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Configura los costos que regirán en caja durante el ciclo {periodoActivo?.codigo || 'vigente'}. Cualquier ajuste aquí se refleja inmediatamente en el formulario de cobro en ventanilla.
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenNew}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Agregar Nueva Tasa / Arancel</span>
          </button>
        </div>

        {/* Tarjetas resumen de tarifas críticas configuradas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl">
            <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
              Mantenimiento Fin de Semana
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-black text-amber-900">S/ {montoFinSemana.toFixed(2)}</span>
              <span className="text-[10px] text-amber-700">/ módulo</span>
            </div>
            <span className="text-[10px] text-amber-700 mt-0.5 block">
              Secciones Sábado y Domingo (Autofinanciadas)
            </span>
          </div>

          <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl">
            <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider block">
              Mantenimiento Regular
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-black text-blue-900">S/ {montoRegular.toFixed(2)}</span>
              <span className="text-[10px] text-blue-700">/ módulo</span>
            </div>
            <span className="text-[10px] text-blue-700 mt-0.5 block">
              Turnos Mañana, Tarde y Noche
            </span>
          </div>

          <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-2xl">
            <span className="text-[10px] font-bold text-purple-800 uppercase tracking-wider block">
              Certificados Modulares
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-black text-purple-900">S/ {montoCertificado.toFixed(2)}</span>
              <span className="text-[10px] text-purple-700">/ trámite</span>
            </div>
            <span className="text-[10px] text-purple-700 mt-0.5 block">
              R.V.M. 188-2020-MINEDU
            </span>
          </div>

          <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl">
            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
              Título Auxiliar Técnico
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-black text-emerald-900">S/ {montoTituloAux.toFixed(2)}</span>
              <span className="text-[10px] text-emerald-700">/ expediente</span>
            </div>
            <span className="text-[10px] text-emerald-700 mt-0.5 block">
              Titulación oficial UGEL / CETPRO
            </span>
          </div>
        </div>
      </div>

      {/* 2. Filtros y Búsqueda */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por concepto o código de tasa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={categoriaFilter}
            onChange={(e) => setCategoriaFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="TODAS">Todos los Conceptos ({conceptosPago.length})</option>
            <option value="MANTO">Aportes y Mantenimiento de Módulo</option>
            <option value="CERT">Certificados y Títulos Oficiales</option>
            <option value="CURSOS">Cursos Libres, Capacitaciones y Servicios</option>
          </select>
        </div>
      </div>

      {/* 3. Tabla de Tarifas Oficiales */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50/80 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-4 py-3.5">Código</th>
                <th className="px-4 py-3.5">Concepto / Arancel Institucional</th>
                <th className="px-4 py-3.5">Categoría</th>
                <th className="px-4 py-3.5 text-right">Tarifa Oficial del Año</th>
                <th className="px-4 py-3.5 text-center">Modalidad de Cobro</th>
                <th className="px-4 py-3.5 text-center">Estado</th>
                <th className="px-4 py-3.5 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredConceptos.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-slate-400">
                    No se encontraron conceptos arancelarios coincidentes.
                  </td>
                </tr>
              ) : (
                filteredConceptos.map((concepto) => {
                  const esLibre = concepto.montoSugerido === 0 || concepto.esMontoLibre;
                  const isFinSemana = concepto.codigo === 'PAGO_MANTO_FIN_SEMANA';

                  return (
                    <tr key={concepto.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-slate-700">
                        <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-[11px]">
                          {concepto.codigo}
                        </span>
                      </td>

                      <td className="px-4 py-3 font-semibold text-slate-900">
                        <div className="flex items-center gap-2">
                          <span>{concepto.nombre}</span>
                          {isFinSemana && (
                            <span className="px-2 py-0.2 bg-amber-100 text-amber-800 border border-amber-300 rounded text-[9.5px] font-bold">
                              Fin de Semana
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3 text-slate-600">
                        <Badge variant="neutral" size="sm">{concepto.categoria || 'Otros'}</Badge>
                      </td>

                      <td className="px-4 py-3 text-right font-mono font-bold text-sm">
                        {esLibre ? (
                          <span className="text-blue-600 text-xs italic font-normal">
                            Tarifa Abierta / Variable
                          </span>
                        ) : (
                          <span className="text-slate-900">
                            S/ {concepto.montoSugerido.toFixed(2)}
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-center">
                        {esLibre ? (
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-md text-[10px] font-semibold">
                            Monto Libre en Ventanilla
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-md text-[10px] font-semibold">
                            Monto Predefinido
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-center">
                        <Badge
                          variant={concepto.estado === 'Inactivo' ? 'neutral' : 'success'}
                          size="sm"
                        >
                          {concepto.estado || 'Activo'}
                        </Badge>
                      </td>

                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(concepto)}
                          className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg text-xs font-bold transition-all flex items-center gap-1 mx-auto cursor-pointer"
                          title="Modificar costo o condiciones para este año"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                          <span>Editar Tasa</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: EDITAR TASA OFICIAL DEL AÑO */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Modificar Tasa: ${selectedConcepto?.nombre || ''}`}
        subtitle="Ajusta el costo oficial aprobado para este concepto en el CETPRO Juanjuí"
        maxWidth="md"
        actions={
          <div className="flex items-center justify-end gap-2 w-full">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="form-edit-tasa"
              disabled={isSaving}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSaving ? 'Guardando...' : 'Guardar Cambios de Tarifa'}</span>
            </button>
          </div>
        }
      >
        <form id="form-edit-tasa" onSubmit={handleSaveEdit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Concepto / Denominación Oficial</label>
            <input
              type="text"
              required
              value={formValues.nombre}
              onChange={(e) => setFormValues({ ...formValues, nombre: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Código de Tasa</label>
              <input
                type="text"
                required
                value={formValues.codigo}
                onChange={(e) => setFormValues({ ...formValues, codigo: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs font-bold focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Categoría</label>
              <select
                value={formValues.categoria}
                onChange={(e) => setFormValues({ ...formValues, categoria: e.target.value as any })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none"
              >
                <option value="Matrícula">Matrícula y Aportes</option>
                <option value="Certificación">Certificación y Títulos</option>
                <option value="Constancias">Constancias y Trámites</option>
                <option value="Talleres">Talleres y Cursos</option>
                <option value="Otros">Otros Servicios</option>
              </select>
            </div>
          </div>

          {/* Modalidad de Cobro */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800">
              <input
                type="checkbox"
                checked={formValues.esMontoLibre}
                onChange={(e) => setFormValues({ ...formValues, esMontoLibre: e.target.checked })}
                className="w-4 h-4 text-emerald-600 rounded border-slate-300"
              />
              <span>Tarifa Abierta / Monto Libre en Ventanilla</span>
            </label>
            <p className="text-[11px] text-slate-500">
              Activa esta opción para cursos de capacitación, servicios de taller o alquileres donde el monto se acuerda libremente al cobrar.
            </p>
          </div>

          {!formValues.esMontoLibre && (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Tarifa Oficial Aprobada para este Año (S/)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">S/</span>
                <input
                  type="number"
                  step="0.50"
                  min="0"
                  required={!formValues.esMontoLibre}
                  value={formValues.montoSugerido}
                  onChange={(e) => setFormValues({ ...formValues, montoSugerido: parseFloat(e.target.value) || 0 })}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl font-mono font-bold text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Ej. Cambiar de 300.00 a 350.00 para la sección de fin de semana del próximo año.
              </p>
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Estado</label>
            <select
              value={formValues.estado}
              onChange={(e) => setFormValues({ ...formValues, estado: e.target.value as any })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none"
            >
              <option value="Activo">Activo (Disponible en Caja)</option>
              <option value="Inactivo">Inactivo (Ocultar temporalmente)</option>
            </select>
          </div>
        </form>
      </Modal>

      {/* MODAL: REGISTRAR NUEVA TASA */}
      <Modal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        title="Registrar Nueva Tasa o Concepto Arancelario"
        subtitle="Agrega un nuevo arancel al catálogo oficial del CETPRO"
        maxWidth="md"
        actions={
          <div className="flex items-center justify-end gap-2 w-full">
            <button
              type="button"
              onClick={() => setIsNewModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="form-new-tasa"
              disabled={isSaving}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSaving ? 'Guardando...' : 'Crear Concepto'}</span>
            </button>
          </div>
        }
      >
        <form id="form-new-tasa" onSubmit={handleSaveNew} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Concepto / Denominación Oficial</label>
            <input
              type="text"
              required
              placeholder="Ej. Taller de Gastronomía Navideña / Derecho de Sustentación..."
              value={formValues.nombre}
              onChange={(e) => setFormValues({ ...formValues, nombre: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Código Identificador</label>
              <input
                type="text"
                required
                value={formValues.codigo}
                onChange={(e) => setFormValues({ ...formValues, codigo: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs font-bold focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Categoría</label>
              <select
                value={formValues.categoria}
                onChange={(e) => setFormValues({ ...formValues, categoria: e.target.value as any })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none"
              >
                <option value="Matrícula">Matrícula y Aportes</option>
                <option value="Certificación">Certificación y Títulos</option>
                <option value="Constancias">Constancias y Trámites</option>
                <option value="Talleres">Talleres y Cursos</option>
                <option value="Otros">Otros Servicios</option>
              </select>
            </div>
          </div>

          {/* Modalidad de Cobro */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800">
              <input
                type="checkbox"
                checked={formValues.esMontoLibre}
                onChange={(e) => setFormValues({ ...formValues, esMontoLibre: e.target.checked })}
                className="w-4 h-4 text-emerald-600 rounded border-slate-300"
              />
              <span>Tarifa Abierta / Monto Libre en Ventanilla</span>
            </label>
            <p className="text-[11px] text-slate-500">
              Permite al cajero ingresar cualquier monto acordado al momento de cobrar.
            </p>
          </div>

          {!formValues.esMontoLibre && (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Tarifa Sugerida / Oficial (S/)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">S/</span>
                <input
                  type="number"
                  step="0.50"
                  min="0"
                  required={!formValues.esMontoLibre}
                  value={formValues.montoSugerido}
                  onChange={(e) => setFormValues({ ...formValues, montoSugerido: parseFloat(e.target.value) || 0 })}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl font-mono font-bold text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          )}
        </form>
      </Modal>

    </div>
  );
};
