import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Badge } from '../common/Badge';
import { Search, Users, Calendar, Clock, MapPin, ChevronRight, Plus, Trash2, AlertTriangle } from 'lucide-react';
import { formatPeriodoDisplay, isSamePeriodo } from '../../utils/normalizePeriodo';
import { NuevaSeccionModal } from './NuevaSeccionModal';
import { NominaSeccionModal } from './NominaSeccionModal';
import { Modal } from '../common/Modal';

export const SeccionesList: React.FC = () => {
  const {
    secciones = [],
    modulos = [],
    programas = [],
    trabajadores = [],
    personas = [],
    matriculas = [],
    deleteSeccion,
    periodosAcademicos = [],
  } = useApp();
  
  const [search, setSearch] = useState('');
  const [progFilter, setProgFilter] = useState<string>('ALL');
  const [periodFilter, setPeriodFilter] = useState<string>('ALL');
  const [isNuevaSeccionOpen, setIsNuevaSeccionOpen] = useState(false);
  const [selectedSeccionNomina, setSelectedSeccionNomina] = useState<string | null>(null);
  const [seccionToDelete, setSeccionToDelete] = useState<string | null>(null);
  const [seccionToEdit, setSeccionToEdit] = useState<any | null>(null);

  // Lista ordenada de periodos académicos disponibles
  const periodosOptions = React.useMemo(() => {
    if (periodosAcademicos && periodosAcademicos.length > 0) {
      return [...periodosAcademicos].sort((a, b) => (b.nombre || '').localeCompare(a.nombre || ''));
    }
    // Fallback con periodos únicos encontrados en las secciones existentes
    const distinct: string[] = Array.from(new Set(secciones.map(s => String(s.periodoAcademico || '')).filter(Boolean)));
    return distinct.sort().reverse().map(p => ({
      id: p,
      codigo: p,
      nombre: `Periodo ${formatPeriodoDisplay(p)}`,
      estado: 'Inactivo'
    }));
  }, [periodosAcademicos, secciones]);

  const filteredSecciones = secciones.filter((sec) => {
    const mod = modulos.find(m => m.id === sec.moduloId);
    if (!mod) return false;
    
    if (progFilter !== 'ALL' && mod.programaId !== progFilter) return false;

    if (periodFilter !== 'ALL') {
      if (!isSamePeriodo(sec.periodoAcademico, periodFilter)) {
        return false;
      }
    }
    
    const s = search.toLowerCase();
    const matchesSearch = 
      (sec.nombre || '').toLowerCase().includes(s) ||
      (mod.nombre || '').toLowerCase().includes(s) ||
      (sec.codigo || '').toLowerCase().includes(s);
      
    if (!matchesSearch) return false;
    
    return true;
  });

  const handleConfirmDelete = async () => {
    if (seccionToDelete) {
      await deleteSeccion(seccionToDelete);
      setSeccionToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar sección o módulo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all"
            />
          </div>
          
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <select
              value={progFilter}
              onChange={(e) => setProgFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:bg-white focus:outline-none cursor-pointer"
            >
              <option value="ALL">Todos los Programas</option>
              {programas.map((p) => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>

            <select
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:bg-white focus:outline-none cursor-pointer"
            >
              <option value="ALL">Todos los Periodos</option>
              {periodosOptions.map((pa) => (
                <option key={pa.id || pa.codigo} value={pa.codigo}>
                  {pa.nombre || formatPeriodoDisplay(pa.codigo)}
                </option>
              ))}
            </select>
            
            <button
              onClick={() => setIsNuevaSeccionOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors shadow-2xs cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Aperturar Sección
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredSecciones.length === 0 && (
          <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-200 rounded-2xl">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-900">No hay secciones</h3>
            <p className="text-xs text-slate-500 mt-1">Apertura una nueva sección para empezar a matricular.</p>
          </div>
        )}
        
        {filteredSecciones.map((sec) => {
          const mod = modulos.find(m => m.id === sec.moduloId);
          const prog = programas.find(p => p.id === mod?.programaId);
          const docente = trabajadores.find(t => t.id === sec.trabajadorId);
          const docPersona = personas.find(p => p.id === docente?.personaId);
          
          const matriculadosCount = matriculas.filter(
            (m) => {
              if (m.seccionId !== sec.id) return false;
              if (!m.estadoMatricula) return true;
              const st = m.estadoMatricula.toUpperCase();
              return st === 'MATRICULADO' || st === 'REGULAR' || st === 'ACTIVA' || st === 'ACTIVO' || st === 'PROCESO' || st === 'CERTIFICADO';
            }
          ).length;
          const capacityRatio = sec.vacantes ? (matriculadosCount / sec.vacantes) * 100 : 0;
          
          return (
            <div key={sec.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-all group flex flex-col">
              <div className="p-5 border-b border-slate-100 flex-1 relative">
                <div className="flex justify-between items-start mb-3">
                  <Badge variant={(sec.estado || 'Activo').toUpperCase() === 'ACTIVO' ? 'success' : 'neutral'} size="sm" dot>
                    {(sec.estado || 'Activo').toUpperCase()}
                  </Badge>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                      {sec.codigo || 'S/C'}
                    </span>
                    <button
                      onClick={() => setSeccionToEdit(sec)}
                      className="text-slate-400 hover:text-sky-600 hover:bg-sky-50 p-1.5 rounded-lg transition-colors cursor-pointer"
                      title="Editar sección"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                    </button>
                    <button
                      onClick={() => setSeccionToDelete(sec.id)}
                      className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-1.5 rounded-lg transition-colors cursor-pointer"
                      title="Eliminar sección"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                
                <h3 className="font-bold text-slate-900 mb-1 leading-tight group-hover:text-sky-700 transition-colors">
                  {sec.nombre ? sec.nombre.replace(/Junajui/gi, 'Juanjui') : ''}
                </h3>
                <p className="text-[11px] font-semibold text-sky-600 mb-3 line-clamp-1">
                  Módulo: {mod?.nombre || 'Desconocido'}
                </p>
                
                <div className="space-y-2 mt-4">
                  <div className="flex flex-col gap-1.5 mt-2">
                    <div className="flex items-center gap-2 text-[11px] text-slate-600">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>Periodo: <span className="font-medium">{sec.periodoAcademico ? formatPeriodoDisplay(sec.periodoAcademico) : 'N/A'}</span></span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-600">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Turno: <span className="font-medium">{sec.turno || 'No asignado'}</span></span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-600">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>Sede: {sec.sedeNombre || 'Principal'} - Aula: {sec.aula || 'Virtual'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-600">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">Docente: {docPersona ? `${docPersona.nombres} ${docPersona.apellidoPaterno} ${docPersona.apellidoMaterno}` : 'Sin asignar'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-600">
                      <span className="truncate text-slate-400 font-semibold">Modalidad:</span>
                      <span className="font-medium text-slate-700">{sec.modalidadEducativa || 'Presencial'}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-slate-50 p-4 border-t border-slate-100">
                <div className="flex justify-between items-end mb-2">
                  <div>
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Matriculados</div>
                    <div className="text-lg font-black text-slate-900 leading-none">
                      {matriculadosCount} <span className="text-xs font-medium text-slate-500">/ {sec.vacantes || 30}</span>
                    </div>
                  </div>
                  <button onClick={() => setSelectedSeccionNomina(sec.id)} className="text-[11px] font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1 cursor-pointer">
                    Ver Nómina <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                
                <div className="w-full bg-slate-200 rounded-full h-1.5 mt-3 overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${capacityRatio >= 100 ? 'bg-red-500' : capacityRatio >= 80 ? 'bg-amber-500' : 'bg-sky-500'}`} 
                    style={{ width: `${Math.min(capacityRatio, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <NuevaSeccionModal 
        isOpen={isNuevaSeccionOpen || !!seccionToEdit} 
        onClose={() => {
          setIsNuevaSeccionOpen(false);
          setSeccionToEdit(null);
        }}
        seccionToEdit={seccionToEdit}
      />
      <NominaSeccionModal seccionId={selectedSeccionNomina} onClose={() => setSelectedSeccionNomina(null)} />

      {seccionToDelete && (
        <Modal
          isOpen={!!seccionToDelete}
          onClose={() => setSeccionToDelete(null)}
          title="Eliminar Sección"
          subtitle="Esta acción es irreversible"
          maxWidth="md"
          actions={
            <>
              <button
                type="button"
                onClick={() => setSeccionToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Eliminar Sección</span>
              </button>
            </>
          }
        >
          <div className="space-y-3 text-xs text-slate-700">
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-rose-900">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-xs">¿Deseas eliminar definitivamente esta sección?</p>
                <p className="text-[11px] text-rose-700 mt-0.5">
                  Si eliminas la sección, los alumnos matriculados en ella se quedarán sin sección asignada. Esta acción no se puede deshacer.
                </p>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
