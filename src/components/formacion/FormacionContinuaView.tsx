import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CursoLibre } from '../../types';
import { Badge } from '../common/Badge';
import {
  Sparkles,
  PlusCircle,
  Search,
  Users,
  Calendar,
  Clock,
  DollarSign,
  UserCheck,
  Award,
  BookOpen,
  CheckCircle2,
  Trash2,
  Edit,
  X,
  FileSpreadsheet,
} from 'lucide-react';

export const FormacionContinuaView: React.FC = () => {
  const {
    cursosLibres,
    inscripcionesCursos,
    personas,
    addCursoLibre,
    deleteCursoLibre,
    inscribirCursoLibre,
    addToast,
    setActiveView,
  } = useApp();

  const [search, setSearch] = useState('');
  const [selectedEstado, setSelectedEstado] = useState<string>('TODOS');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isInscribirModalOpen, setIsInscribirModalOpen] = useState(false);
  const [selectedCursoForInscripcion, setSelectedCursoForInscripcion] = useState<CursoLibre | null>(null);
  const [selectedCursoDetail, setSelectedCursoDetail] = useState<CursoLibre | null>(null);

  // New Course Form State
  const [nuevoCurso, setNuevoCurso] = useState({
    nombre: '',
    areaPrograma: 'Mecánica de Motos',
    trabajadorNombre: '',
    horas: 60,
    costo: 80,
    fechaInicio: '',
    fechaFin: '',
    horario: 'Sábados y Domingos 8:00 am - 1:00 pm',
    vacantes: 25,
    estado: 'Inscripciones Abiertas' as const,
    descripcion: '',
    requisitos: 'Mayor de 16 años, copia de DNI.',
  });

  // Inscripcion Form State
  const [selectedPersonaId, setSelectedPersonaId] = useState('');
  const [metodoPago, setMetodoPago] = useState<'Efectivo' | 'Yape' | 'Plin' | 'Depósito Banco de la Nación'>('Efectivo');
  const [montoInscripcion, setMontoInscripcion] = useState(0);

  const areasDisponibles = [
    'Mecánica de Motos',
    'Cocina y Panadería',
    'Corte y Confección',
    'Computación e Informática',
    'Electricidad y Electrónica',
    'Cosmetología y Peluquería',
    'Soldadura y Construcciones Metálicas',
    'Artesanía y Manualidades',
  ];

  const filteredCursos = cursosLibres.filter((c) => {
    const s = search.toLowerCase();
    const matchSearch =
      c.nombre.toLowerCase().includes(s) ||
      c.codigo.toLowerCase().includes(s) ||
      c.areaPrograma.toLowerCase().includes(s) ||
      c.trabajadorNombre.toLowerCase().includes(s);

    if (!matchSearch) return false;
    if (selectedEstado !== 'TODOS' && c.estado !== selectedEstado) return false;
    return true;
  });

  const totalInscritos = cursosLibres.reduce((acc, c) => acc + c.inscritos, 0);
  const totalRecaudadoEstimado = inscripcionesCursos.reduce((acc, i) => acc + i.montoPagado, 0);

  const handleCreateCurso = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoCurso.nombre.trim() || !nuevoCurso.trabajadorNombre.trim()) {
      addToast('Campos Incompletos', 'Por favor ingrese el nombre del curso y el docente responsable', 'warning');
      return;
    }

    addCursoLibre({
      ...nuevoCurso,
      horas: Number(nuevoCurso.horas),
      costo: Number(nuevoCurso.costo),
      vacantes: Number(nuevoCurso.vacantes),
    });

    setIsModalOpen(false);
    setNuevoCurso({
      nombre: '',
      areaPrograma: 'Mecánica de Motos',
      trabajadorNombre: '',
      horas: 60,
      costo: 80,
      fechaInicio: '',
      fechaFin: '',
      horario: 'Sábados y Domingos 8:00 am - 1:00 pm',
      vacantes: 25,
      estado: 'Inscripciones Abiertas',
      descripcion: '',
      requisitos: 'Mayor de 16 años, copia de DNI.',
    });
  };

  const handleOpenInscribir = (curso: CursoLibre) => {
    setSelectedCursoForInscripcion(curso);
    setMontoInscripcion(curso.costo);
    setIsInscribirModalOpen(true);
  };

  const handleConfirmInscripcion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCursoForInscripcion || !selectedPersonaId) {
      addToast('Seleccione Participante', 'Debe seleccionar una persona del padrón', 'warning');
      return;
    }

    await inscribirCursoLibre(
      selectedCursoForInscripcion.id,
      selectedPersonaId,
      Number(montoInscripcion),
      metodoPago
    );

    setIsInscribirModalOpen(false);
    setSelectedPersonaId('');
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  Formación Contínua y Cursos Libres
                </h1>
                <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-md text-[10px] font-mono font-bold uppercase">
                  RVM 188-2020-MINEDU
                </span>
                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-md text-[10px] font-mono font-bold uppercase">
                  CERTIFICACIÓN RÁPIDA
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Capacitación técnica modular, talleres extracurriculares de especialización y cursos de corta duración para la comunidad
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Aperturar Nuevo Curso</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Metric Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Cursos Ofertados</span>
            <BookOpen className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-xl font-bold text-slate-900 mt-2">{cursosLibres.length}</p>
          <span className="text-[10px] text-slate-500">Talleres técnicos vigentes</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Inscritos Totales</span>
            <Users className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-xl font-bold text-slate-900 mt-2">{totalInscritos}</p>
          <span className="text-[10px] text-emerald-600 font-medium">Participantes registrados</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Recaudación Talleres</span>
            <DollarSign className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-xl font-bold text-slate-900 mt-2">S/ {totalRecaudadoEstimado.toFixed(2)}</p>
          <span className="text-[10px] text-slate-500">Ingresos por capacitación</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Certificados Emitidos</span>
            <Award className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-xl font-bold text-slate-900 mt-2">
            {inscripcionesCursos.filter((i) => i.certificadoEmitido).length}
          </p>
          <span className="text-[10px] text-purple-600 font-medium">Con valor oficial</span>
        </div>
      </div>

      {/* 3. Search and Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por curso, código, área o docente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {['TODOS', 'Inscripciones Abiertas', 'En Curso', 'Finalizado'].map((estado) => (
            <button
              key={estado}
              onClick={() => setSelectedEstado(estado)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                selectedEstado === estado
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              {estado}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredCursos.map((curso) => {
          const inscritosList = inscripcionesCursos.filter((i) => i.cursoId === curso.id);
          const percentVacantes = Math.min(100, Math.round((curso.inscritos / curso.vacantes) * 100));

          return (
            <div
              key={curso.id}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden flex flex-col justify-between hover:border-slate-300 transition-all"
            >
              <div className="p-5 space-y-4">
                {/* Top badges */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                      {curso.codigo}
                    </span>
                    <p className="text-[11px] text-slate-500 font-medium mt-1">{curso.areaPrograma}</p>
                  </div>
                  <Badge
                    variant={
                      curso.estado === 'Inscripciones Abiertas'
                        ? 'success'
                        : curso.estado === 'En Curso'
                        ? 'primary'
                        : 'neutral'
                    }
                    size="sm"
                  >
                    {curso.estado}
                  </Badge>
                </div>

                {/* Course Name */}
                <h3 className="text-base font-bold text-slate-900 leading-snug line-clamp-2">
                  {curso.nombre}
                </h3>

                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {curso.descripcion}
                </p>

                {/* Meta specifications */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-2 text-xs text-slate-600">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-500">
                      <Clock className="w-3.5 h-3.5 text-blue-500" />
                      Duración:
                    </span>
                    <span className="font-semibold text-slate-800">{curso.horas} horas pedagógicas</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-500">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                      Inversión:
                    </span>
                    <span className="font-bold text-emerald-700">S/ {curso.costo.toFixed(2)}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-500">
                      <Calendar className="w-3.5 h-3.5 text-amber-500" />
                      Horario:
                    </span>
                    <span className="font-medium text-slate-800 truncate max-w-[170px]" title={curso.horario}>
                      {curso.horario}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-500">
                      <UserCheck className="w-3.5 h-3.5 text-purple-500" />
                      Docente:
                    </span>
                    <span className="font-medium text-slate-800 truncate max-w-[170px]">
                      {curso.trabajadorNombre}
                    </span>
                  </div>
                </div>

                {/* Vacancies progress bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Vacantes ocupadas:</span>
                    <span className="font-bold text-slate-800">
                      {curso.inscritos} / {curso.vacantes} ({percentVacantes}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        percentVacantes >= 100
                          ? 'bg-red-500'
                          : percentVacantes >= 70
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${percentVacantes}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="p-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => setSelectedCursoDetail(curso)}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold shadow-2xs transition-all cursor-pointer flex items-center gap-1"
                >
                  <Users className="w-3.5 h-3.5 text-slate-500" />
                  <span>Inscritos ({inscritosList.length})</span>
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenInscribir(curso)}
                    disabled={curso.inscritos >= curso.vacantes}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-lg text-xs font-bold shadow-2xs transition-all cursor-pointer disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Inscribir</span>
                  </button>

                  <button
                    onClick={() => deleteCursoLibre(curso.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title="Eliminar curso"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredCursos.length === 0 && (
          <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-slate-200">
            <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-700">No se encontraron cursos de formación contínua</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Intente con otro término de búsqueda o haga clic en "Aperturar Nuevo Curso" para registrar un nuevo taller.
            </p>
          </div>
        )}
      </div>

      {/* Modal: Aperturar Nuevo Curso */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Aperturar Curso de Formación Contínua</h3>
                  <p className="text-xs text-slate-500">Taller de capacitación y extensión técnica</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCurso} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Nombre del Curso / Taller *</label>
                <input
                  type="text"
                  required
                  placeholder="ej. Mantenimiento Preventivo de Mototaxis y Motocicletas"
                  value={nuevoCurso.nombre}
                  onChange={(e) => setNuevoCurso({ ...nuevoCurso, nombre: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Área / Especialidad Técnica</label>
                  <select
                    value={nuevoCurso.areaPrograma}
                    onChange={(e) => setNuevoCurso({ ...nuevoCurso, areaPrograma: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  >
                    {areasDisponibles.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Docente / Instructor Responsable *</label>
                  <input
                    type="text"
                    required
                    placeholder="ej. Ing. Carlos Mendoza"
                    value={nuevoCurso.trabajadorNombre}
                    onChange={(e) => setNuevoCurso({ ...nuevoCurso, trabajadorNombre: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Horas Pedagógicas</label>
                  <input
                    type="number"
                    min={10}
                    value={nuevoCurso.horas}
                    onChange={(e) => setNuevoCurso({ ...nuevoCurso, horas: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Costo de Inscripción (S/.)</label>
                  <input
                    type="number"
                    min={0}
                    step="0.5"
                    value={nuevoCurso.costo}
                    onChange={(e) => setNuevoCurso({ ...nuevoCurso, costo: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Vacantes Máximas</label>
                  <input
                    type="number"
                    min={1}
                    value={nuevoCurso.vacantes}
                    onChange={(e) => setNuevoCurso({ ...nuevoCurso, vacantes: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Horario de Clases</label>
                  <input
                    type="text"
                    placeholder="ej. Sábados 8:00am a 1:00pm"
                    value={nuevoCurso.horario}
                    onChange={(e) => setNuevoCurso({ ...nuevoCurso, horario: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Estado Inicial</label>
                  <select
                    value={nuevoCurso.estado}
                    onChange={(e) => setNuevoCurso({ ...nuevoCurso, estado: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  >
                    <option value="Inscripciones Abiertas">Inscripciones Abiertas</option>
                    <option value="En Curso">En Curso</option>
                    <option value="Finalizado">Finalizado</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Descripción y Competencias a Desarrollar</label>
                <textarea
                  rows={2}
                  placeholder="Resumen del contenido práctico del taller..."
                  value={nuevoCurso.descripcion}
                  onChange={(e) => setNuevoCurso({ ...nuevoCurso, descripcion: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Requisitos de Inscripción</label>
                <input
                  type="text"
                  placeholder="ej. Mayor de 16 años, DNI, ropa de trabajo"
                  value={nuevoCurso.requisitos}
                  onChange={(e) => setNuevoCurso({ ...nuevoCurso, requisitos: e.target.value })}
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
                  <span>Guardar y Aperturar</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Inscribir Participante */}
      {isInscribirModalOpen && selectedCursoForInscripcion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Inscripción en Ventanilla</h3>
                <p className="text-xs text-slate-500">{selectedCursoForInscripcion.nombre}</p>
              </div>
              <button
                onClick={() => setIsInscribirModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmInscripcion} className="space-y-4">
              <div className="bg-amber-50 p-3 rounded-xl border border-amber-200/60 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-amber-900">Curso: {selectedCursoForInscripcion.codigo}</span>
                  <p className="text-amber-700 text-[11px]">{selectedCursoForInscripcion.horario}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-amber-600 uppercase font-semibold">Costo</span>
                  <p className="font-bold text-emerald-700 text-sm">S/ {selectedCursoForInscripcion.costo.toFixed(2)}</p>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Seleccionar Participante del Padrón *</label>
                <select
                  required
                  value={selectedPersonaId}
                  onChange={(e) => setSelectedPersonaId(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                >
                  <option value="">-- Buscar persona por DNI o Apellidos --</option>
                  {personas.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.numeroDocumento} - {p.apellidoPaterno} {p.apellidoMaterno}, {p.nombres}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400">
                  ¿No está en el padrón?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setIsInscribirModalOpen(false);
                      setActiveView('padron');
                    }}
                    className="text-blue-600 underline font-semibold cursor-pointer"
                  >
                    Registrar en Padrón de Personas
                  </button>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Monto a Cobrar (S/.)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={montoInscripcion}
                    onChange={(e) => setMontoInscripcion(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Método de Pago</label>
                  <select
                    value={metodoPago}
                    onChange={(e) => setMetodoPago(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  >
                    <option value="Efectivo">Efectivo en Ventanilla</option>
                    <option value="Yape">Yape</option>
                    <option value="Plin">Plin</option>
                    <option value="Depósito Banco de la Nación">Depósito BN</option>
                  </select>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
                <p className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Emisión automática de Recibo de Caja TUPA
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  El pago se registrará inmediatamente en el módulo de Tesorería Institucional y sumará a la recaudación del día.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsInscribirModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Cobrar e Inscribir</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Detalle de Inscritos */}
      {selectedCursoDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                  {selectedCursoDetail.codigo}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">{selectedCursoDetail.nombre}</h3>
                <p className="text-xs text-slate-500">Nómina de participantes registrados</p>
              </div>
              <button
                onClick={() => setSelectedCursoDetail(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="overflow-hidden border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="p-3">#</th>
                      <th className="p-3">DNI</th>
                      <th className="p-3">Participante</th>
                      <th className="p-3">Fecha Inscripción</th>
                      <th className="p-3">Monto</th>
                      <th className="p-3 text-center">Certificado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {inscripcionesCursos
                      .filter((i) => i.cursoId === selectedCursoDetail.id)
                      .map((insc, idx) => {
                        const persona = personas.find((p) => p.id === insc.personaId);
                        return (
                          <tr key={insc.id} className="hover:bg-slate-50">
                            <td className="p-3 font-bold text-slate-400">{idx + 1}</td>
                            <td className="p-3 font-mono">{persona?.numeroDocumento || '---'}</td>
                            <td className="p-3 font-semibold text-slate-900">
                              {persona ? `${persona.apellidoPaterno} ${persona.apellidoMaterno}, ${persona.nombres}` : 'Participante'}
                            </td>
                            <td className="p-3 text-slate-500">{insc.fechaInscripcion}</td>
                            <td className="p-3 font-bold text-emerald-700">S/ {insc.montoPagado.toFixed(2)}</td>
                            <td className="p-3 text-center">
                              {insc.certificadoEmitido ? (
                                <Badge variant="success" size="sm">Emitido</Badge>
                              ) : (
                                <Badge variant="neutral" size="sm">Pendiente</Badge>
                              )}
                            </td>
                          </tr>
                        );
                      })}

                    {inscripcionesCursos.filter((i) => i.cursoId === selectedCursoDetail.id).length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-slate-400">
                          Aún no hay participantes inscritos en este taller.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <span className="text-xs text-slate-500">
                Total participantes: {selectedCursoDetail.inscritos} de {selectedCursoDetail.vacantes}
              </span>
              <button
                onClick={() => setSelectedCursoDetail(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
