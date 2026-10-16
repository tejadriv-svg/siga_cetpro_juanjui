import React, { useState, useEffect } from 'react';
import {
  Database,
  Table as TableIcon,
  RefreshCw,
  Search,
  Plus,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
  AlertTriangle,
  FileCode,
  Terminal,
  Download,
  Copy,
  Layers,
  Key,
  Play,
  Clock,
  Check,
  Flame,
  ArrowUpDown,
  Code
} from 'lucide-react';
import * as XLSX from 'xlsx';

import { useApp } from '../../context/AppContext';
import { NuevaSeccionModal } from '../estudiantes/NuevaSeccionModal';
import { Seccion } from '../../types';


interface ColumnSchema {
  column_name: string;
  data_type: string;
  udt_name?: string;
  is_nullable: string;
  column_default: string | null;
  character_maximum_length?: number | null;
  is_primary_key?: boolean;
  enum_values?: string[] | null;
}


const getDisplayLabel = (r: any) => {
  if (r && r._display_label) return r._display_label;
  if (!r) return 'Desconocido';
  // Try to compose a full name if it's a person
  if (r.nombres) {
    return [r.nombres, r.apellido_paterno, r.apellido_materno].filter(Boolean).join(' ');
  }
  return r.nombre_completo || 
         r.nombre || 
         r.nombre_modulo || 
         r.username || 
         r.titulo || 
         r.descripcion || 
         r.codigo || 
         r.numero_documento || 
         r.ie_procedencia ||
         r.id;
};

export const DatabaseExplorerView: React.FC = () => {

  const { secciones, fetchSecciones } = useApp();
  const [isSeccionModalOpen, setIsSeccionModalOpen] = useState(false);
  const [seccionToEdit, setSeccionToEdit] = useState<Seccion | null>(null);

  const [tables, setTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [tableData, setTableData] = useState<any[]>([]);
  const [schemaData, setSchemaData] = useState<ColumnSchema[]>([]);
  const [tableDDL, setTableDDL] = useState<string>('');
  const [foreignKeys, setForeignKeys] = useState<any[]>([]);
  const [loadingTables, setLoadingTables] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterQuery, setFilterQuery] = useState('');

  // Active sub-tab inside explorer
  const [viewMode, setViewMode] = useState<'records' | 'schema' | 'sql' | 'ddl'>('records');

  // SQL Console State
  const [sqlQuery, setSqlQuery] = useState<string>('SELECT * FROM cetpros LIMIT 10;');
  const [sqlResult, setSqlResult] = useState<{
    success: boolean;
    rows?: any[];
    fields?: string[];
    rowCount?: number;
    command?: string;
    executionTimeMs?: number;
    error?: string;
  } | null>(null);
  const [isRunningSql, setIsRunningSql] = useState(false);

  // Modal states for CRUD
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [activeRow, setActiveRow] = useState<any | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});

  // Column Management States (ALTER TABLE)
  const [isAddColumnModalOpen, setIsAddColumnModalOpen] = useState(false);
  const [isDropColumnModalOpen, setIsDropColumnModalOpen] = useState(false);
  const [columnToDrop, setColumnToDrop] = useState<string | null>(null);
  const [newColumnForm, setNewColumnForm] = useState({
    columnName: '',
    dataType: 'varchar(255)',
    isNullable: true,
    defaultValue: '',
  });

  // Truncate table modal
  const [isTruncateModalOpen, setIsTruncateModalOpen] = useState(false);

  // Status banners
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedDDL, setCopiedDDL] = useState(false);
  const [fkOptions, setFkOptions] = useState<Record<string, any[]>>({});

  const fetchTables = async () => {
    setLoadingTables(true);
    try {
      const res = await fetch('/api/explorer/tables');
      if (res.ok) {
        const data = await res.json();
        setTables(data);
        if (data.length > 0 && !selectedTable) {
          setSelectedTable(data[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching tables', err);
    } finally {
      setLoadingTables(false);
    }
  };

  const fetchTableDataAndSchema = async (tableName: string) => {
    setLoadingData(true);
    setTableData([]);
    setActionError(null);
    try {
      const [dataRes, schemaRes, ddlRes] = await Promise.all([
        fetch(`/api/explorer/tables/${tableName}`),
        fetch(`/api/explorer/tables/${tableName}/schema`),
        fetch(`/api/explorer/tables/${tableName}/ddl`),
      ]);

      if (dataRes.ok) {
        const d = await dataRes.json();
        setTableData(Array.isArray(d) ? d : []);
      } else {
        const errJson = await dataRes.json().catch(() => ({}));
        setActionError(errJson.error || `Error al obtener datos de la tabla "${tableName}"`);
        setTableData([]);
      }
      if (schemaRes.ok) {
        const s = await schemaRes.json();
        setSchemaData(s);
      }
      if (ddlRes.ok) {
        const ddl = await ddlRes.json();
        setTableDDL(ddl.ddl || '');
        const fks = ddl.foreignKeys || [];
        setForeignKeys(fks);
        
        const lookup: Record<string, any[]> = {};
        await Promise.all(fks.map(async (fk: any) => {
          try {
            const fkRes = await fetch(`/api/explorer/tables/${fk.foreign_table_name}?limit=all`);
            if (fkRes.ok) {
              lookup[fk.column_name] = await fkRes.json();
            }
          } catch (e) {}
        }));
        setFkOptions(lookup);
      }
    } catch (err) {
      console.error('Error fetching table details', err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

  useEffect(() => {
    if (selectedTable) {
      fetchTableDataAndSchema(selectedTable);
      setSqlQuery(`SELECT * FROM "${selectedTable}" LIMIT 50;`);
    }
  }, [selectedTable]);

  // Execute SQL Query
  const handleExecuteSql = async () => {
    if (!sqlQuery.trim()) return;
    setIsRunningSql(true);
    setSqlResult(null);
    try {
      const res = await fetch('/api/explorer/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sqlQuery }),
      });
      const data = await res.json();
      setSqlResult(data);
      if (data.success && selectedTable) {
        // Refresh tables if DDL query
        if (sqlQuery.toLowerCase().includes('create') || sqlQuery.toLowerCase().includes('alter') || sqlQuery.toLowerCase().includes('drop')) {
          fetchTables();
          fetchTableDataAndSchema(selectedTable);
        }
      }
    } catch (err: any) {
      setSqlResult({
        success: false,
        error: err.message || 'Error de conexión con el servidor',
      });
    } finally {
      setIsRunningSql(false);
    }
  };

  // Add Column Handler
  const handleAddColumn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTable || !newColumnForm.columnName) return;
    setIsSubmitting(true);
    setActionError(null);

    try {
      const res = await fetch(`/api/explorer/tables/${selectedTable}/columns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newColumnForm),
      });

      const data = await res.json();
      if (res.ok) {
        setActionSuccess(`Columna "${newColumnForm.columnName}" creada exitosamente.`);
        setIsAddColumnModalOpen(false);
        setNewColumnForm({
          columnName: '',
          dataType: 'varchar(255)',
          isNullable: true,
          defaultValue: '',
        });
        fetchTableDataAndSchema(selectedTable);
      } else {
        setActionError(data.error || 'Error al agregar columna');
      }
    } catch (err: any) {
      setActionError(err.message || 'Error de conexión');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Drop Column Handler
  const handleDropColumn = async () => {
    if (!selectedTable || !columnToDrop) return;
    setIsSubmitting(true);
    setActionError(null);

    try {
      const res = await fetch(`/api/explorer/tables/${selectedTable}/columns/${encodeURIComponent(columnToDrop)}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (res.ok) {
        setActionSuccess(`Columna "${columnToDrop}" eliminada exitosamente.`);
        setIsDropColumnModalOpen(false);
        setColumnToDrop(null);
        fetchTableDataAndSchema(selectedTable);
      } else {
        setActionError(data.error || 'Error al eliminar columna');
      }
    } catch (err: any) {
      setActionError(err.message || 'Error de conexión');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Truncate Table Handler
  const handleTruncateTable = async () => {
    if (!selectedTable) return;
    setIsSubmitting(true);
    setActionError(null);

    try {
      const res = await fetch(`/api/explorer/tables/${selectedTable}/truncate`, {
        method: 'POST',
      });

      const data = await res.json();
      if (res.ok) {
        setActionSuccess(`Tabla "${selectedTable}" vaciada correctamente.`);
        setIsTruncateModalOpen(false);
        fetchTableDataAndSchema(selectedTable);
      } else {
        setActionError(data.error || 'Error al vaciar tabla');
      }
    } catch (err: any) {
      setActionError(err.message || 'Error de conexión');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Export to Excel / CSV / JSON
  const handleExportData = (format: 'xlsx' | 'csv' | 'json') => {
    if (!selectedTable || tableData.length === 0) {
      alert('No hay registros para exportar en esta tabla.');
      return;
    }

    const cleanData = tableData.map(({ _display_label, ...rest }) => rest);

    if (format === 'json') {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(cleanData, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `${selectedTable}_${new Date().toISOString().slice(0,10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } else {
      const worksheet = XLSX.utils.json_to_sheet(cleanData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, selectedTable.substring(0, 31));

      if (format === 'xlsx') {
        XLSX.writeFile(workbook, `${selectedTable}_${new Date().toISOString().slice(0,10)}.xlsx`);
      } else if (format === 'csv') {
        XLSX.writeFile(workbook, `${selectedTable}_${new Date().toISOString().slice(0,10)}.csv`, { bookType: 'csv' });
      }
    }
    setActionSuccess(`Datos de "${selectedTable}" exportados exitosamente en formato .${format.toUpperCase()}`);
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    if (selectedTable === 'secciones') {
       setSeccionToEdit(null);
       setIsSeccionModalOpen(true);
       return;
    }
    const initial: Record<string, any> = {};
    schemaData.forEach((col) => {
      if (col.column_name === 'id' && col.column_default?.includes('gen_random_uuid')) {
        return;
      }
      if (col.column_name === 'created_at' || col.column_name === 'updated_at') {
        return;
      }
      if (col.enum_values && col.enum_values.length > 0) {
        initial[col.column_name] = col.is_nullable === 'YES' ? '' : col.enum_values[0];
      } else if (col.data_type === 'boolean') {
        initial[col.column_name] = true;
      } else {
        initial[col.column_name] = '';
      }
    });
    setFormData(initial);
    setActionError(null);
    setIsCreateModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (row: any) => {
    if (selectedTable === 'secciones') {
       const found = secciones.find(s => s.id === row.id);
       if (found) {
         setSeccionToEdit(found);
       } else {
         setSeccionToEdit({
            id: row.id,
            codigo: row.codigo,
            nombre: row.nombre,
            moduloId: row.modulo_id,
            planEstudioId: row.plan_estudio_id,
            periodoClasesId: row.periodo_clases_id,
            sedeId: row.sede_id,
            aulaId: row.aula_id,
            turnoId: row.turno_id,
            modalidadEducativa: row.modalidad_educativa,
            estado: row.estado,
            capacidad: row.capacidad,
            vacantes: row.capacidad || 30,
            trabajadorId: '',
            periodoAcademico: '',
            turno: '',
            aula: '',
            matriculados: 0
         });
       }
       setIsSeccionModalOpen(true);
       return;
    }
    setActiveRow(row);
    const initial: Record<string, any> = {};
    Object.keys(row).forEach((k) => {
      if (k === 'id' || k.startsWith('_')) return;
      initial[k] = row[k] === null || row[k] === undefined ? '' : row[k];
    });
    setFormData(initial);
    setActionError(null);
    setIsEditModalOpen(true);
  };

  // Open Delete Modal
  const handleOpenDelete = (row: any) => {
    setActiveRow(row);
    setActionError(null);
    setIsDeleteModalOpen(true);
  };

  // Submit Create
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTable) return;
    setIsSubmitting(true);
    setActionError(null);

    const payload: Record<string, any> = {};
    Object.entries(formData).forEach(([k, v]) => {
      if (v === '' || v === undefined) {
        const colDef = schemaData.find((c) => c.column_name === k);
        if (colDef && colDef.is_nullable === 'YES') {
          payload[k] = null;
        }
      } else {
        payload[k] = v;
      }
    });

    try {
      const res = await fetch(`/api/explorer/tables/${selectedTable}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setActionSuccess('Registro creado exitosamente');
        setIsCreateModalOpen(false);
        fetchTableDataAndSchema(selectedTable);
      } else {
        const err = await res.json();
        setActionError(err.error || 'Error al crear el registro');
      }
    } catch (err: any) {
      setActionError(err.message || 'Error de conexión');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Edit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTable || !activeRow) return;
    setIsSubmitting(true);
    setActionError(null);

    const payload: Record<string, any> = {};
    Object.entries(formData).forEach(([k, v]) => {
      if (v === '' || v === undefined) {
        payload[k] = null;
      } else {
        payload[k] = v;
      }
    });

    try {
      const rowId = activeRow.id || activeRow.codigo || activeRow.numero_documento;
      const res = await fetch(`/api/explorer/tables/${selectedTable}/${encodeURIComponent(rowId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setActionSuccess('Registro actualizado exitosamente');
        setIsEditModalOpen(false);
        fetchTableDataAndSchema(selectedTable);
      } else {
        const err = await res.json();
        setActionError(err.error || 'Error al actualizar el registro');
      }
    } catch (err: any) {
      setActionError(err.message || 'Error de conexión');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Delete
  const handleDeleteSubmit = async () => {
    if (!selectedTable || !activeRow) return;
    setIsSubmitting(true);
    setActionError(null);

    try {
      const rowId = activeRow.id || activeRow.codigo || activeRow.numero_documento;
      const res = await fetch(`/api/explorer/tables/${selectedTable}/${encodeURIComponent(rowId)}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setActionSuccess('Registro eliminado exitosamente');
        setIsDeleteModalOpen(false);
        fetchTableDataAndSchema(selectedTable);
      } else {
        const err = await res.json();
        setActionError(err.error || 'Error al eliminar el registro. Puede tener restricciones de clave foránea.');
      }
    } catch (err: any) {
      setActionError(err.message || 'Error de conexión');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedDDL(true);
    setTimeout(() => setCopiedDDL(false), 2000);
  };

  const filteredTables = tables.filter((t) =>
    t.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = (schemaData.length > 0
    ? schemaData.map((s) => s.column_name)
    : (tableData.length > 0 ? Object.keys(tableData[0]) : [])
  ).filter((col) => col !== '_display_label');

  const filteredRows = tableData.filter((row) => {
    if (!filterQuery) return true;
    return Object.values(row).some((val) =>
      String(val).toLowerCase().includes(filterQuery.toLowerCase())
    );
  });

  return (
    <div className="h-full flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden min-h-[650px]">
      {/* Top Header */}
      <div className="px-6 py-4 border-b border-slate-200 bg-white flex flex-col lg:flex-row lg:items-center justify-between gap-4 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                Explorador PostgreSQL & Consola DBeaver
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Administración integral de esquemas, columnas (DDL), registros (CRUD), consultas SQL en vivo y exportación.
              </p>
            </div>
          </div>
        </div>

        {/* Global Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {actionSuccess && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 animate-fadeIn">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{actionSuccess}</span>
            </div>
          )}

          {actionError && (
            <div className="flex items-center gap-1.5 text-xs text-rose-800 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-200 animate-fadeIn">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              <span>{actionError}</span>
            </div>
          )}

          <button
            onClick={() => selectedTable && fetchTableDataAndSchema(selectedTable)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            title="Refrescar metadatos y datos de la tabla"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingData ? 'animate-spin text-blue-600' : ''}`} />
            <span>Refrescar</span>
          </button>

          {/* Quick Export Dropdown */}
          <div className="relative group">
            <button
              disabled={!selectedTable || tableData.length === 0}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer disabled:opacity-40"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>Exportar</span>
            </button>
            <div className="absolute right-0 top-full mt-1 hidden group-hover:block z-30 w-44 bg-white rounded-xl shadow-lg border border-slate-200 p-1">
              <button
                onClick={() => handleExportData('xlsx')}
                className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg flex items-center gap-2 cursor-pointer font-medium"
              >
                <span>📊 Archivo Excel (.xlsx)</span>
              </button>
              <button
                onClick={() => handleExportData('csv')}
                className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg flex items-center gap-2 cursor-pointer font-medium"
              >
                <span>📄 Formato CSV (.csv)</span>
              </button>
              <button
                onClick={() => handleExportData('json')}
                className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-purple-50 hover:text-purple-700 rounded-lg flex items-center gap-2 cursor-pointer font-medium"
              >
                <span>📦 Objeto JSON (.json)</span>
              </button>
            </div>
          </div>

          <button
            onClick={() => setIsAddColumnModalOpen(true)}
            disabled={!selectedTable}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            title="Agregar una nueva columna a la tabla actual (ALTER TABLE ADD COLUMN)"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-700" />
            <span className="text-emerald-800">+ Columna</span>
          </button>

          <button
            onClick={handleOpenCreate}
            disabled={!selectedTable || loadingData}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span>+ Registro</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Tables Navigator */}
        <div className="w-64 border-r border-slate-200 bg-slate-50/70 flex flex-col shrink-0">
          <div className="p-3 border-b border-slate-200 bg-white">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Buscar tabla..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none focus:bg-white"
              />
            </div>
          </div>

          <div className="p-2.5 text-[10px] font-bold uppercase text-slate-500 tracking-wider flex items-center justify-between">
            <span>Tablas ({filteredTables.length} de {tables.length})</span>
            <span className="text-emerald-700 font-mono text-[9px] bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">PostgreSQL</span>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-0.5 custom-scrollbar">
            {loadingTables ? (
              <div className="p-4 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
                <span>Cargando catálogo...</span>
              </div>
            ) : filteredTables.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">No hay tablas coincidentes</div>
            ) : (
              filteredTables.map((table) => (
                <button
                  key={table}
                  onClick={() => {
                    setSelectedTable(table);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-left text-xs rounded-lg transition-all cursor-pointer ${
                    selectedTable === table
                      ? 'bg-blue-600 text-white font-bold shadow-xs'
                      : 'text-slate-700 hover:bg-slate-200/70 font-medium'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <TableIcon className={`w-3.5 h-3.5 ${selectedTable === table ? 'text-white' : 'text-slate-400'}`} />
                    <span className="truncate">{table}</span>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Quick Console Trigger */}
          <div className="p-3 border-t border-slate-200 bg-white">
            <button
              onClick={() => setViewMode('sql')}
              className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'sql'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              <Terminal className="w-4 h-4 text-amber-500" />
              <span>Consola SQL (DBeaver)</span>
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-white">
          {/* Subheader Navigation Tabs */}
          <div className="p-3 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 font-bold text-slate-900 text-sm">
                <TableIcon className="w-4 h-4 text-blue-600" />
                <span className="font-mono text-blue-900">{selectedTable || 'Seleccione tabla'}</span>
              </div>

              {/* DBeaver-style Tabs */}
              <div className="flex bg-slate-200/80 p-0.5 rounded-lg text-xs">
                <button
                  onClick={() => setViewMode('records')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                    viewMode === 'records'
                      ? 'bg-white text-blue-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Datos ({filteredRows.length})</span>
                </button>
                <button
                  onClick={() => setViewMode('schema')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                    viewMode === 'schema'
                      ? 'bg-white text-blue-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Code className="w-3.5 h-3.5" />
                  <span>Estructura ({schemaData.length} cols)</span>
                </button>
                <button
                  onClick={() => setViewMode('sql')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                    viewMode === 'sql'
                      ? 'bg-white text-blue-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Terminal className="w-3.5 h-3.5 text-amber-600" />
                  <span>Consola SQL</span>
                </button>
                <button
                  onClick={() => setViewMode('ddl')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                    viewMode === 'ddl'
                      ? 'bg-white text-blue-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileCode className="w-3.5 h-3.5" />
                  <span>Script DDL</span>
                </button>
              </div>
            </div>

            {/* Quick Actions / Filters */}
            <div className="flex items-center gap-2">
              {viewMode === 'records' && (
                <div className="relative w-60">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="Filtrar en tabla..."
                    value={filterQuery}
                    onChange={(e) => setFilterQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              )}

              {selectedTable && (
                <button
                  onClick={() => setIsTruncateModalOpen(true)}
                  className="px-2.5 py-1.5 text-xs text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-lg font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                  title="Vaciar todos los registros de la tabla (TRUNCATE TABLE)"
                >
                  <Flame className="w-3.5 h-3.5 text-rose-600" />
                  <span>Vaciar Tabla</span>
                </button>
              )}
            </div>
          </div>

          {/* VIEW: CONSOLE SQL (DBEAVER STYLE) */}
          {viewMode === 'sql' ? (
            <div className="flex-1 flex flex-col p-4 bg-slate-900 text-slate-100 overflow-hidden font-mono">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Editor SQL PostgreSQL</span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Quick SQL Snippets */}
                  <select
                    onChange={(e) => {
                      if (e.target.value && selectedTable) {
                        setSqlQuery(e.target.value.replace(/\{table\}/g, selectedTable));
                      }
                    }}
                    className="bg-slate-800 border border-slate-700 text-slate-300 text-xs px-2.5 py-1.5 rounded-lg focus:outline-none"
                    defaultValue=""
                  >
                    <option value="" disabled>Snippets SQL...</option>
                    <option value="SELECT * FROM {table} LIMIT 50;">SELECT * FROM {selectedTable}</option>
                    <option value="SELECT COUNT(*) AS total_registros FROM {table};">Conteo de filas</option>
                    <option value="ALTER TABLE {table} ADD COLUMN nuevo_campo varchar(100);">ALTER TABLE ADD COLUMN</option>
                    <option value="SELECT * FROM information_schema.tables WHERE table_schema='public';">Listar todas las tablas</option>
                  </select>

                  <button
                    onClick={handleExecuteSql}
                    disabled={isRunningSql || !sqlQuery.trim()}
                    className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-50"
                  >
                    {isRunningSql ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Play className="w-3.5 h-3.5 fill-current" />
                    )}
                    <span>{isRunningSql ? 'Ejecutando...' : 'Ejecutar SQL (Ctrl+Enter)'}</span>
                  </button>
                </div>
              </div>

              {/* SQL Textarea */}
              <div className="py-3">
                <textarea
                  value={sqlQuery}
                  onChange={(e) => setSqlQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                      e.preventDefault();
                      handleExecuteSql();
                    }
                  }}
                  placeholder="Escribe tu consulta SQL aquí (ej: SELECT * FROM cetpros;)"
                  rows={5}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-emerald-400 focus:outline-none focus:border-blue-500 resize-none shadow-inner"
                />
              </div>

              {/* SQL Results Panel */}
              <div className="flex-1 flex flex-col min-h-0 bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
                {/* Result header */}
                <div className="px-4 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-slate-200">Resultado de Consulta</span>
                    {sqlResult && (
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        sqlResult.success ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'
                      }`}>
                        {sqlResult.success ? 'EXITOSO' : 'ERROR'}
                      </span>
                    )}
                  </div>

                  {sqlResult && (
                    <div className="flex items-center gap-4 text-[11px]">
                      {sqlResult.executionTimeMs !== undefined && (
                        <span className="flex items-center gap-1 text-slate-400">
                          <Clock className="w-3 h-3 text-amber-400" />
                          <span>{sqlResult.executionTimeMs} ms</span>
                        </span>
                      )}
                      {sqlResult.rowCount !== undefined && (
                        <span>{sqlResult.rowCount} filas devueltas / afectadas</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Result content */}
                <div className="flex-1 overflow-auto custom-scrollbar p-3">
                  {!sqlResult ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-500 text-xs">
                      <Terminal className="w-8 h-8 text-slate-700 mb-2" />
                      <p>Presiona "Ejecutar SQL" para ver los resultados aquí.</p>
                    </div>
                  ) : !sqlResult.success ? (
                    <div className="p-4 bg-rose-950/40 border border-rose-900 rounded-lg text-rose-300 text-xs">
                      <div className="font-bold flex items-center gap-1.5 mb-1">
                        <AlertTriangle className="w-4 h-4 text-rose-400" />
                        <span>Error al ejecutar consulta SQL:</span>
                      </div>
                      <p className="font-mono">{sqlResult.error}</p>
                    </div>
                  ) : sqlResult.rows && sqlResult.rows.length > 0 ? (
                    <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
                      <thead className="bg-slate-900 sticky top-0">
                        <tr>
                          {(sqlResult.fields || Object.keys(sqlResult.rows[0])).map((f) => (
                            <th key={f} className="px-3 py-2 border-b border-slate-800 font-bold text-amber-300">
                              {f}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-900 text-slate-300 font-mono text-[11px]">
                        {sqlResult.rows.map((row, i) => (
                          <tr key={i} className="hover:bg-slate-900/60">
                            {(sqlResult.fields || Object.keys(sqlResult.rows![0])).map((f) => (
                              <td key={f} className="px-3 py-1.5 border-r border-slate-900">
                                {row[f] === null ? (
                                  <span className="text-slate-600 italic">null</span>
                                ) : typeof row[f] === 'object' ? (
                                  JSON.stringify(row[f])
                                ) : (
                                  String(row[f])
                                )}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="p-4 text-center text-slate-400 text-xs">
                      Consulta ejecutada exitosamente. 0 filas retornadas.
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : viewMode === 'ddl' ? (
            /* VIEW: DDL SCRIPT & RELATIONS */
            <div className="flex-1 p-6 overflow-auto custom-scrollbar space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Definición DDL (Data Definition Language)</h3>
                  <p className="text-xs text-slate-500">Script SQL oficial para crear la tabla <span className="font-mono font-bold text-blue-600">{selectedTable}</span></p>
                </div>
                <button
                  onClick={() => copyToClipboard(tableDDL)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  {copiedDDL ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedDDL ? 'Copiado' : 'Copiar DDL'}</span>
                </button>
              </div>

              <div className="bg-slate-900 text-emerald-400 p-4 rounded-xl font-mono text-xs overflow-x-auto shadow-sm border border-slate-800">
                <pre>{tableDDL || 'Generando DDL...'}</pre>
              </div>

              {foreignKeys.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-blue-600" />
                    <span>Relaciones y Claves Foráneas (Foreign Keys)</span>
                  </h4>
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600">
                        <tr>
                          <th className="px-4 py-2">Columna Local</th>
                          <th className="px-4 py-2">Tabla de Destino</th>
                          <th className="px-4 py-2">Columna de Destino</th>
                          <th className="px-4 py-2">Nombre de Restricción</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono">
                        {foreignKeys.map((fk, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="px-4 py-2 font-bold text-blue-700">{fk.column_name}</td>
                            <td className="px-4 py-2 text-emerald-700 font-bold">{fk.foreign_table_name}</td>
                            <td className="px-4 py-2 text-slate-700">{fk.foreign_column_name}</td>
                            <td className="px-4 py-2 text-slate-400 text-[11px]">{fk.constraint_name}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ) : viewMode === 'schema' ? (
            /* VIEW: SCHEMA / COLUMNS MANAGEMENT (ADD / DROP COLUMNS) */
            <div className="flex-1 p-6 overflow-auto custom-scrollbar space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span>Estructura de Columnas:</span>
                    <span className="font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">{selectedTable}</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Administra los campos de la tabla. Puedes crear nuevas columnas o eliminar columnas existentes con seguridad.
                  </p>
                </div>

                <button
                  onClick={() => setIsAddColumnModalOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nueva Columna (ALTER TABLE)</span>
                </button>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                    <tr>
                      <th className="px-4 py-3">Columna</th>
                      <th className="px-4 py-3">Tipo de Dato</th>
                      <th className="px-4 py-3">¿Permite Nulos?</th>
                      <th className="px-4 py-3">Valor por Defecto</th>
                      <th className="px-4 py-3 text-right">Acciones DDL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {schemaData.map((col) => (
                      <tr key={col.column_name} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-2.5 font-bold text-slate-900 flex items-center gap-1.5">
                          {col.is_primary_key && (
                            <span title="Primary Key" className="p-0.5 bg-amber-100 text-amber-700 rounded">
                              <Key className="w-3 h-3" />
                            </span>
                          )}
                          <span>{col.column_name}</span>
                        </td>
                        <td className="px-4 py-2.5 text-blue-600 font-semibold">
                          {col.data_type === 'character varying' && col.character_maximum_length
                            ? `varchar(${col.character_maximum_length})`
                            : col.data_type}
                        </td>
                        <td className="px-4 py-2.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              col.is_nullable === 'YES'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            {col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-slate-500 text-[11px]">
                          {col.column_default || <span className="text-slate-300 italic">ninguno</span>}
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          {col.column_name !== 'id' && (
                            <button
                              onClick={() => {
                                setColumnToDrop(col.column_name);
                                setIsDropColumnModalOpen(true);
                              }}
                              className="px-2 py-1 text-[11px] text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer font-sans font-semibold border border-transparent hover:border-rose-200"
                              title={`Eliminar columna "${col.column_name}"`}
                            >
                              Eliminar Columna
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* VIEW: RECORDS / DATA EXPLORER */
            <div className="flex-1 overflow-auto bg-white relative custom-scrollbar">
              {loadingData ? (
                <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
                  <div className="flex flex-col items-center gap-3">
                    <RefreshCw className="w-7 h-7 text-blue-600 animate-spin" />
                    <span className="text-xs font-semibold text-slate-600">Consultando PostgreSQL...</span>
                  </div>
                </div>
              ) : filteredRows.length === 0 ? (
                <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center h-full">
                  <Database className="w-12 h-12 text-slate-300 mb-3" />
                  <p className="text-sm font-bold text-slate-900">No hay registros en la tabla "{selectedTable}"</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm">
                    {filterQuery ? 'No coincide ningún registro con la búsqueda.' : 'La tabla está lista y vacía para recibir datos.'}
                  </p>
                  {!filterQuery && (
                    <button
                      onClick={handleOpenCreate}
                      className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Agregar Primer Registro</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="w-full overflow-x-auto">
                  <table className="w-full text-left border-collapse whitespace-nowrap text-xs">
                    <thead className="sticky top-0 bg-slate-100 shadow-xs z-10">
                      <tr>
                        <th className="px-3 py-2.5 border-b border-slate-200 font-bold text-slate-700 text-center w-20">
                          Acciones
                        </th>
                        {columns.map((col) => (
                          <th
                            key={col}
                            className="px-4 py-2.5 border-b border-slate-200 font-bold text-slate-700 border-l border-slate-200 uppercase tracking-wider text-[10px]"
                          >
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                      {filteredRows.map((row, i) => (
                        <tr key={i} className="hover:bg-blue-50/40 transition-colors group">
                          {/* Action buttons */}
                          <td className="px-3 py-2 text-center bg-slate-50/50 group-hover:bg-blue-50/60 sticky left-0 border-r border-slate-200">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleOpenEdit(row)}
                                className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-100 rounded transition-colors cursor-pointer"
                                title="Editar registro"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleOpenDelete(row)}
                                className="p-1 text-slate-500 hover:text-rose-600 hover:bg-rose-100 rounded transition-colors cursor-pointer"
                                title="Eliminar registro"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>

                          {columns.map((col) => {
                            const val = row[col];
                            const isUuid = typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
                            const isIdCol = col.toLowerCase() === 'id';
                            let displayVal = String(val);
                            let isFkMatch = false;

                            if (val === null) displayVal = 'null';
                            else if (val === undefined) displayVal = 'undefined';
                            else if (typeof val === 'object') displayVal = JSON.stringify(val);
                            else if (fkOptions[col]) {
                              const fkRow = fkOptions[col].find(r => r.id === val || String(r.id) === String(val));
                              if (fkRow) {
                                displayVal = getDisplayLabel(fkRow);
                                isFkMatch = true;
                              }
                            }

                            // Boolean styling
                            if (typeof val === 'boolean') {
                              return (
                                <td key={col} className="px-4 py-2 border-l border-slate-100">
                                  <span
                                    className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                                      val
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                                    }`}
                                  >
                                    {val ? 'ACTIVO' : 'INACTIVO'}
                                  </span>
                                </td>
                              );
                            }

                            // Estado / Enum badge styling
                            if (col.toLowerCase() === 'estado' && typeof val === 'string') {
                              const vLower = val.toLowerCase();
                              const isGreen = vLower === 'activo' || vLower === 'operativo';
                              const isRed = vLower === 'cesante' || vLower === 'inactivo' || vLower === 'baja';
                              const isAmber = vLower === 'licencia' || vLower === 'mantenimiento';
                              const isBlue = vLower === 'destacado' || vLower === 'designado';

                              const badgeClass = isGreen
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : isRed
                                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                                  : isAmber
                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                    : isBlue
                                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                                      : 'bg-slate-50 text-slate-700 border-slate-200';

                              return (
                                <td key={col} className="px-4 py-2 border-l border-slate-100">
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${badgeClass}`}>
                                    {val}
                                  </span>
                                </td>
                              );
                            }

                            // Primary key UUID styling (compact badge with copy)
                            if (isIdCol && isUuid) {
                              return (
                                <td key={col} className="px-4 py-2 border-l border-slate-100">
                                  <div className="flex items-center gap-1.5" title={`UUID: ${val}`}>
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-blue-50 text-blue-700 border border-blue-200">
                                      #{String(val).substring(0, 8)}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        copyToClipboard(String(val));
                                      }}
                                      className="p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                                      title="Copiar UUID completo"
                                    >
                                      <Copy className="w-3 h-3" />
                                    </button>
                                  </div>
                                </td>
                              );
                            }

                            return (
                              <td
                                key={col}
                                className={`px-4 py-2 border-l border-slate-100 ${
                                  val === null ? 'text-slate-300 italic' : 'text-slate-800'
                                }`}
                              >
                                {isFkMatch ? (
                                  <div className="flex flex-col" title={`ID: ${val}`}>
                                    <span className="font-semibold text-slate-900 max-w-[280px] truncate">
                                      {displayVal}
                                    </span>
                                    <div className="flex items-center gap-1 mt-0.5">
                                      <span className="text-[9px] text-slate-400 font-mono">
                                        #{String(val).substring(0, 8)}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          copyToClipboard(String(val));
                                        }}
                                        className="text-slate-300 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                                        title="Copiar UUID"
                                      >
                                        <Copy className="w-2.5 h-2.5" />
                                      </button>
                                    </div>
                                  </div>
                                ) : isUuid ? (
                                  <div className="flex items-center gap-1" title={`ID: ${val}`}>
                                    <span className="font-mono text-slate-600 text-[10px] bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                                      #{String(val).substring(0, 8)}...
                                    </span>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        copyToClipboard(String(val));
                                      }}
                                      className="text-slate-300 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                                      title="Copiar UUID"
                                    >
                                      <Copy className="w-2.5 h-2.5" />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="max-w-[280px] truncate" title={displayVal}>
                                    {displayVal}
                                  </div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* MODAL: ADD COLUMN (ALTER TABLE ADD COLUMN) */}
      {isAddColumnModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-scaleIn">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-emerald-50/70">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-700" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Agregar Nueva Columna a <span className="font-mono text-emerald-800">{selectedTable}</span>
                </h3>
              </div>
              <button
                onClick={() => setIsAddColumnModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddColumn} className="p-6 space-y-4">
              {actionError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{actionError}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Nombre de la Columna <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej. telefono_emergencia, observacion_ugel"
                  value={newColumnForm.columnName}
                  onChange={(e) =>
                    setNewColumnForm({ ...newColumnForm, columnName: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Tipo de Dato PostgreSQL <span className="text-rose-500">*</span>
                </label>
                <select
                  value={newColumnForm.dataType}
                  onChange={(e) =>
                    setNewColumnForm({ ...newColumnForm, dataType: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="varchar(255)">varchar(255) - Texto corto</option>
                  <option value="text">text - Texto largo</option>
                  <option value="integer">integer - Número entero</option>
                  <option value="numeric(10,2)">numeric(10,2) - Decimal / Moneda / Créditos</option>
                  <option value="boolean">boolean - Verdadero / Falso</option>
                  <option value="date">date - Fecha (AAAA-MM-DD)</option>
                  <option value="time">time - Hora (HH:MM:SS)</option>
                  <option value="timestamp with time zone">timestamp with time zone - Fecha y hora</option>
                  <option value="uuid">uuid - Identificador único</option>
                  <option value="jsonb">jsonb - Estructura JSON</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Valor por Defecto (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="ej. 'ACTIVO', 0, CURRENT_DATE, false"
                  value={newColumnForm.defaultValue}
                  onChange={(e) =>
                    setNewColumnForm({ ...newColumnForm, defaultValue: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isNullable"
                  checked={newColumnForm.isNullable}
                  onChange={(e) =>
                    setNewColumnForm({ ...newColumnForm, isNullable: e.target.checked })
                  }
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="isNullable" className="text-xs text-slate-700">
                  Permitir valores vacíos / nulos (<span className="font-mono font-bold">NULL</span>)
                </label>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddColumnModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>{isSubmitting ? 'Agregando...' : 'Crear Columna'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DROP COLUMN */}
      {isDropColumnModalOpen && columnToDrop && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-scaleIn">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">¿Eliminar columna?</h3>
                <p className="text-xs text-slate-500">Se eliminará la columna y los datos contenidos en ella.</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 font-mono text-xs space-y-1 text-slate-700">
              <div><strong className="text-slate-900">Tabla:</strong> {selectedTable}</div>
              <div><strong className="text-slate-900">Columna:</strong> {columnToDrop}</div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsDropColumnModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDropColumn}
                disabled={isSubmitting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>{isSubmitting ? 'Eliminando...' : 'Confirmar Eliminación'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: TRUNCATE TABLE */}
      {isTruncateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-scaleIn">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
                <Flame className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">¿Vaciar tabla por completo?</h3>
                <p className="text-xs text-slate-500">Se ejecutará <span className="font-mono">TRUNCATE TABLE "{selectedTable}" CASCADE</span>.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600">
              Todos los registros existentes en esta tabla serán eliminados permanentemente. Esta acción no se puede deshacer.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsTruncateModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleTruncateTable}
                disabled={isSubmitting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Flame className="w-3.5 h-3.5" />}
                <span>{isSubmitting ? 'Vaciando...' : 'Vaciar Tabla Ahora'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-scaleIn">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Nuevo Registro: <span className="font-mono text-blue-700">{selectedTable}</span>
                </h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              {actionError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{actionError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {schemaData.map((col) => {
                  if (col.column_name === 'id' && col.column_default?.includes('gen_random_uuid')) {
                    return null;
                  }
                  if (col.column_name === 'created_at' || col.column_name === 'updated_at') {
                    return null;
                  }

                  const isRequired = col.is_nullable === 'NO' && !col.column_default;

                  return (
                    <div key={col.column_name} className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-700">
                        {col.column_name} {isRequired && <span className="text-rose-500">*</span>}
                        <span className="ml-1 text-[10px] text-slate-400 font-mono">({col.data_type})</span>
                      </label>
                      {col.enum_values && Array.isArray(col.enum_values) && col.enum_values.length > 0 ? (
                        <select
                          value={formData[col.column_name] ?? ''}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              [col.column_name]: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                        >
                          {col.is_nullable === 'YES' && <option value="">-- Sin asignar (NULL) --</option>}
                          {col.enum_values.map((optVal) => (
                            <option key={optVal} value={optVal}>
                              {optVal}
                            </option>
                          ))}
                        </select>
                      ) : col.data_type === 'boolean' ? (
                        <select
                          value={String(formData[col.column_name] ?? true)}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              [col.column_name]: e.target.value === 'true',
                            })
                          }
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                        >
                          <option value="true">ACTIVO (true)</option>
                          <option value="false">INACTIVO (false)</option>
                        </select>
                      ) : fkOptions[col.column_name] ? (
                        <select
                          value={formData[col.column_name] ?? ''}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              [col.column_name]: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Seleccione...</option>
                          {fkOptions[col.column_name].map((opt) => (
                            <option key={opt.id} value={opt.id}>
                              {getDisplayLabel(opt)}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={
                            col.data_type.includes('date') || col.data_type.includes('timestamp') 
                              ? 'date' 
                              : col.data_type.includes('int') || col.data_type.includes('numeric') 
                                ? 'number' 
                                : 'text'
                          }
                          step="any"
                          required={isRequired}
                          value={formData[col.column_name] ?? ''}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              [col.column_name]: e.target.value,
                            })
                          }
                          placeholder={col.column_default ? `Default: ${col.column_default}` : ''}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>{isSubmitting ? 'Guardando...' : 'Insertar Registro'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {isEditModalOpen && activeRow && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-scaleIn">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Editar Registro: <span className="font-mono text-blue-700">{selectedTable}</span>
                </h3>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              {actionError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{actionError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.keys(formData).map((colName) => {
                  const colDef = schemaData.find((c) => c.column_name === colName);
                  const dataType = colDef?.data_type || 'text';

                  return (
                    <div key={colName} className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-700">
                        {colName}
                        <span className="ml-1 text-[10px] text-slate-400 font-mono">({dataType})</span>
                      </label>
                      {colDef?.enum_values && Array.isArray(colDef.enum_values) && colDef.enum_values.length > 0 ? (
                        <select
                          value={formData[colName] ?? ''}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              [colName]: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                        >
                          {colDef.is_nullable === 'YES' && <option value="">-- Sin asignar (NULL) --</option>}
                          {colDef.enum_values.map((optVal) => (
                            <option key={optVal} value={optVal}>
                              {optVal}
                            </option>
                          ))}
                        </select>
                      ) : dataType === 'boolean' || typeof formData[colName] === 'boolean' ? (
                        <select
                          value={String(formData[colName] ?? true)}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              [colName]: e.target.value === 'true',
                            })
                          }
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold"
                        >
                          <option value="true">ACTIVO (true)</option>
                          <option value="false">INACTIVO (false)</option>
                        </select>
                      ) : fkOptions[colName] ? (
                        <select
                          value={formData[colName] ?? ''}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              [colName]: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">-- Seleccionar --</option>
                          {fkOptions[colName].map(row => (
                            <option key={row.id} value={row.id}>
                              {getDisplayLabel(row)}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={
                            dataType.includes('date') || dataType.includes('timestamp')
                              ? 'date'
                              : dataType.includes('int') || dataType.includes('numeric') 
                                ? 'number' 
                                : 'text'
                          }
                          step="any"
                          value={formData[colName] ?? ''}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              [colName]: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  <span>{isSubmitting ? 'Guardando...' : 'Actualizar Registro'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {isDeleteModalOpen && activeRow && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-scaleIn">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">¿Eliminar registro?</h3>
                <p className="text-xs text-slate-500">Esta acción no se puede deshacer.</p>
              </div>
            </div>

            {actionError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
                {actionError}
              </div>
            )}

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 font-mono text-xs max-h-36 overflow-y-auto space-y-1 text-slate-700">
              <div><strong className="text-slate-900">Tabla:</strong> {selectedTable}</div>
              <div><strong className="text-slate-900">ID / Código:</strong> {activeRow.id || activeRow.codigo || activeRow.numero_documento || 'Registro'}</div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteSubmit}
                disabled={isSubmitting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>{isSubmitting ? 'Eliminando...' : 'Confirmar Eliminación'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <NuevaSeccionModal
        isOpen={isSeccionModalOpen}
        onClose={() => {
          setIsSeccionModalOpen(false);
          setSeccionToEdit(null);
          if (selectedTable === 'secciones') {
            fetchTableDataAndSchema('secciones');
            fetchSecciones();
          }
        }}
        seccionToEdit={seccionToEdit}
      />
    </div>
  );
};


