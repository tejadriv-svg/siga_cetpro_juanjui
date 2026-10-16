import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Persona } from '../../types';
import { Badge } from '../common/Badge';
import { PersonaDrawer } from './PersonaDrawer';
import { NuevaPersonaModal } from './NuevaPersonaModal';
import { comparePersonasAlphabetical } from '../../utils/sortPersonas';
import { formatSexoLabel } from '../../utils/genero';
import {
  Users,
  Search,
  UserPlus,
  Filter,
  Phone,
  Mail,
  MapPin,
  GraduationCap,
  Briefcase,
  Shield,
  Eye,
  Edit2,
  Trash2,
  FileSpreadsheet,
  UploadCloud,
  UserCheck,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export const PadronMaestroView: React.FC = () => {
  const { personas, estudiantes, trabajadores, selectedPersonaId, setSelectedPersonaId, deletePersona, setActiveView } = useApp();

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'ESTUDIANTE' | 'TRABAJADOR' | 'DOCENTE' | 'ADMINISTRATIVO' | 'DIRECTIVO' | 'APODERADO' | 'EGRESADO'>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPersona, setEditingPersona] = useState<Persona | null>(null);

  const getPersonaRole = (p: Persona): string => {
    if (p.rolPrimario) return p.rolPrimario;
    if (p.parentesco || p.estudianteAsociadoId) return 'APODERADO';
    if (p.fechaEgreso || p.numeroRegistroTitulo) return 'EGRESADO';
    if (p.esTrabajador) return 'DOCENTE';
    if (p.esEstudiante) return 'ESTUDIANTE';
    return 'ESTUDIANTE';
  };

  const isPersonalRole = (role: string) =>
    role === 'TRABAJADOR' || role === 'DOCENTE' || role === 'ADMINISTRATIVO' || role === 'DIRECTIVO';

  // Filter logic
  const filteredPersonas = personas.filter((p) => {
    const s = search.toLowerCase().trim();
    const fullName = `${p.nombres || ''} ${p.apellidoPaterno || ''} ${p.apellidoMaterno || ''}`.toLowerCase();
    const contactInfo = `${p.telefono || ''} ${p.correo || ''} ${p.numeroDocumento || ''}`.toLowerCase();
    
    const matchesSearch = s === '' || fullName.includes(s) || contactInfo.includes(s);

    if (!matchesSearch) return false;

    if (roleFilter !== 'ALL') {
      const role = getPersonaRole(p);
      if (roleFilter === 'TRABAJADOR') {
        return isPersonalRole(role);
      }
      return role === roleFilter;
    }

    return true;
  }).sort((a, b) => {
    const dateA = new Date(a.fechaRegistro || (a as any).createdAt || 0).getTime();
    const dateB = new Date(b.fechaRegistro || (b as any).createdAt || 0).getTime();
    if (dateB !== dateA) return dateB - dateA;
    return (b.id || '').localeCompare(a.id || '');
  });

  const [limitCount, setLimitCount] = useState<number | 'ALL'>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [search, roleFilter, limitCount]);

  const totalItems = filteredPersonas.length;
  const pageSize = limitCount === 'ALL' ? totalItems : limitCount;
  const totalPages = Math.max(1, Math.ceil(totalItems / (pageSize || 1)));
  const effectivePage = Math.min(currentPage, totalPages);
  const displayedPersonas = limitCount === 'ALL'
    ? filteredPersonas
    : filteredPersonas.slice((effectivePage - 1) * pageSize, effectivePage * pageSize);

  const countEstudiantes = personas.filter((p) => getPersonaRole(p) === 'ESTUDIANTE').length;
  const countTrabajadores = personas.filter((p) => isPersonalRole(getPersonaRole(p))).length;
  const countApoderados = personas.filter((p) => getPersonaRole(p) === 'APODERADO').length;
  const countEgresados = personas.filter((p) => getPersonaRole(p) === 'EGRESADO').length;

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  Padrón Maestro de Personas
                </h1>
                <span className="px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-md text-[10px] font-mono font-bold uppercase">
                  DNI ÚNICO
                </span>
                <span className="px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-md text-[10px] font-mono font-bold">
                  {personas.length} REGISTROS
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Directorio unificado de identidad institucional (Estudiantes, Trabajadores, Apoderados y Egresados)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => setActiveView('asistencia-personal')}
              className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
              title="Ir al Control de Asistencias y Kiosco DNI del Personal"
            >
              <UserCheck className="w-4 h-4 text-indigo-600" />
              <span>Control de Asistencia</span>
            </button>
            <button
              onClick={() => setActiveView('importador')}
              className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <UploadCloud className="w-4 h-4 text-blue-600" />
              <span>Importar Excel</span>
            </button>
            <button
              onClick={() => {
                setEditingPersona(null);
                setIsModalOpen(true);
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Registrar Persona</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Counter Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div
          onClick={() => setRoleFilter('ALL')}
          className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
            roleFilter === 'ALL'
              ? 'bg-blue-50/80 border-blue-300 ring-2 ring-blue-500/20'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Personas</div>
          <div className="text-2xl font-black text-slate-900 font-mono mt-0.5">{personas.length}</div>
        </div>

        <div
          onClick={() => setRoleFilter('ESTUDIANTE')}
          className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
            roleFilter === 'ESTUDIANTE'
              ? 'bg-blue-50/80 border-blue-300 ring-2 ring-blue-500/20'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">Estudiantes</div>
          <div className="text-2xl font-black text-slate-900 font-mono mt-0.5">{countEstudiantes}</div>
        </div>

        <div
          onClick={() => setRoleFilter('TRABAJADOR')}
          className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
            roleFilter === 'TRABAJADOR'
              ? 'bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-500/20'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Trabajadores</div>
          <div className="text-2xl font-black text-slate-900 font-mono mt-0.5">{countTrabajadores}</div>
        </div>

        <div
          onClick={() => setRoleFilter('APODERADO')}
          className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
            roleFilter === 'APODERADO'
              ? 'bg-purple-50/80 border-purple-300 ring-2 ring-purple-500/20'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="text-[11px] font-bold text-purple-700 uppercase tracking-wider">Apoderados</div>
          <div className="text-2xl font-black text-slate-900 font-mono mt-0.5">{countApoderados}</div>
        </div>

        <div
          onClick={() => setRoleFilter('EGRESADO')}
          className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
            roleFilter === 'EGRESADO'
              ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-500/20'
              : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Egresados</div>
          <div className="text-2xl font-black text-slate-900 font-mono mt-0.5">{countEgresados}</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por DNI, nombres, apellidos o teléfono..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          <span className="text-xs text-slate-400 font-medium whitespace-nowrap">Filtrar por rol:</span>
          {(['ALL', 'ESTUDIANTE', 'TRABAJADOR', 'APODERADO', 'EGRESADO'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                roleFilter === r
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {r === 'ALL'
                ? 'Todos'
                : r === 'ESTUDIANTE'
                ? 'Estudiante'
                : r === 'TRABAJADOR'
                ? 'Trabajador'
                : r === 'APODERADO'
                ? 'Apoderado'
                : 'Egresado'}
            </button>
          ))}
        </div>
      </div>

      {/* Person Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredPersonas.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
              <Users className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800">
              {search || roleFilter !== 'ALL'
                ? 'No se encontraron personas con los filtros actuales'
                : 'No hay personas registradas'}
            </h4>
            <p className="text-xs text-slate-500 max-w-sm mt-1">
              {search || roleFilter !== 'ALL'
                ? 'Intenta restablecer la búsqueda o el filtro de rol.'
                : 'Puedes registrar personas individualmente o importar un padrón masivo desde Excel.'}
            </p>
            <div className="flex gap-2.5 mt-4">
              <button
                onClick={() => setActiveView('importador')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <span>Importar Padrón Excel</span>
              </button>
              <button
                onClick={() => {
                  setEditingPersona(null);
                  setIsModalOpen(true);
                }}
                className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <span>Nueva Persona</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">Documento (DNI)</th>
                  <th className="px-4 py-3">Apellidos y Nombres</th>
                  <th className="px-4 py-3">Roles Institucionales</th>
                  <th className="px-4 py-3">Contacto</th>
                  <th className="px-4 py-3">Dirección (Juanjuí)</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedPersonas.map((per) => (
                  <tr key={per.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">
                      <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {per.tipoDocumento}: {per.numeroDocumento}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        {per.fotoUrl && !per.fotoUrl.includes('\\') ? (
                          <img
                            src={per.fotoUrl}
                            alt={per.nombres}
                            className="w-8 h-8 rounded-lg object-cover border border-slate-200 shadow-2xs shrink-0"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 font-bold text-xs flex items-center justify-center border border-slate-200 shrink-0">
                            {per.nombres?.[0] || 'P'}{per.apellidoPaterno?.[0] || ''}
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-slate-900 text-xs">
                            {per.apellidoPaterno} {per.apellidoMaterno}, {per.nombres}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            Sexo: {formatSexoLabel(per.sexo)} • Nac: {per.fechaNacimiento || '-'}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(() => {
                          const role = getPersonaRole(per);
                          if (role === 'ESTUDIANTE') return <Badge variant="primary" size="sm">Estudiante</Badge>;
                          if (role === 'DOCENTE') return <Badge variant="success" size="sm">Docente</Badge>;
                          if (role === 'ADMINISTRATIVO') return <Badge variant="neutral" size="sm">Administrativo</Badge>;
                          if (role === 'DIRECTIVO') return <Badge variant="warning" size="sm">Directivo</Badge>;
                          if (role === 'TRABAJADOR') return <Badge variant="success" size="sm">Docente / Personal</Badge>;
                          if (role === 'APODERADO') return <Badge variant="purple" size="sm">Apoderado</Badge>;
                          if (role === 'EGRESADO') return <Badge variant="warning" size="sm">Egresado</Badge>;
                          return <Badge variant="neutral" size="sm">Registrado</Badge>;
                        })()}
                      </div>
                    </td>

                    <td className="px-4 py-3 space-y-0.5 text-[11px] text-slate-600">
                      <div className="flex items-center gap-1.5 font-mono">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{per.telefono || 'Sin teléfono'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-500 truncate max-w-[180px]">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <span>{per.correo}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-slate-600 max-w-[200px] truncate text-[11px]">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{per.direccion}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedPersonaId(per.id)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="Ver detalle completo"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingPersona(per);
                            setIsModalOpen(true);
                          }}
                          className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="Editar persona"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deletePersona(per.id)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Eliminar persona"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Barra de Paginación y Control de Registros */}
        {totalItems > 0 && (
          <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <span>
                Mostrando <strong className="text-slate-900">{displayedPersonas.length}</strong> de <strong className="text-slate-900">{totalItems}</strong> personas (más recientes primero)
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-500">Ver:</span>
                <select
                  value={limitCount}
                  onChange={(e) => {
                    const val = e.target.value === 'ALL' ? 'ALL' : Number(e.target.value);
                    setLimitCount(val);
                  }}
                  className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
                >
                  <option value={10}>10 recientes</option>
                  <option value={25}>25 por página</option>
                  <option value={50}>50 por página</option>
                  <option value="ALL">Todos ({totalItems})</option>
                </select>
              </div>

              {limitCount !== 'ALL' && totalPages > 1 && (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={effectivePage === 1}
                    className="p-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    title="Página anterior"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-[11px] font-medium px-1">
                    {effectivePage} de {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={effectivePage === totalPages}
                    className="p-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    title="Página siguiente"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Slide-over Drawer */}
      {selectedPersonaId && (
        <PersonaDrawer
          personaId={selectedPersonaId}
          onClose={() => setSelectedPersonaId(null)}
          onEdit={(p) => {
            setEditingPersona(p);
            setIsModalOpen(true);
          }}
        />
      )}

      {/* Modal create / edit */}
      <NuevaPersonaModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingPersona(null);
        }}
        initialData={editingPersona}
      />
    </div>
  );
};
