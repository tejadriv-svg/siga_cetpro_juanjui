import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Badge } from '../common/Badge';
import { QrCode } from '../common/QrCode';
import { Modal } from '../common/Modal';
import { formatPeriodoDisplay } from '../../utils/normalizePeriodo';
import { formatSexoLabel } from '../../utils/genero';
import { EditarEstudianteModal } from './EditarEstudianteModal';
import { EditarMatriculaModal } from './EditarMatriculaModal';
import { RegistrarRetiroModal } from './RegistrarRetiroModal';
import { RegistrarTrasladoModal } from './RegistrarTrasladoModal';
import { FichaMatriculaPrint } from './FichaMatriculaPrint';
import { NuevaMatriculaModal } from './NuevaMatriculaModal';
import { NuevoCobroModal } from '../tesoreria/NuevoCobroModal';
import { ReciboImprimibleModal } from '../tesoreria/ReciboImprimibleModal';
import { EstadoEstudiante, Matricula, ReciboPago, NotaUnidad, NotaEFSRT } from '../../types';
import {
  X,
  User,
  GraduationCap,
  Calendar,
  BookOpen,
  Award,
  Wallet,
  FileCheck2,
  Phone,
  Mail,
  MapPin,
  Building2,
  CheckCircle2,
  XCircle,
  Clock,
  Printer,
  FileText,
  AlertCircle,
  ExternalLink,
  Wifi,
  Laptop,
  HeartHandshake,
  Users,
  Camera,
  Trash2,
  Plus,
  Edit,
  Edit2,
  Ban,
  AlertTriangle,
  RotateCcw,
  Check,
  ArrowRightLeft,
  UserMinus,
} from 'lucide-react';

interface EstudianteDrawerProps {
  estudianteId: string;
  onClose: () => void;
}

export const EstudianteDrawer: React.FC<EstudianteDrawerProps> = ({
  estudianteId,
  onClose,
}) => {
  const {
    estudiantes,
    personas,
    programas,
    modulos,
    unidades,
    secciones,
    matriculas,
    notasUnidades,
    notasEFSRT,
    recibos,
    documentosOficiales,
    periodoActivo,
    updateEstudiante,
    deleteEstudiante,
    updateMatricula,
    deleteMatricula,
    saveNotasUnidad,
    saveNotaEFSRT,
    anularRecibo,
    deleteRecibo,
    emitirDocumentoOficial,
    deleteDocumentoOficial,
  } = useApp();

  const [activeTab, setActiveTab] = useState<
    'general' | 'matriculas' | 'avance' | 'efsrt' | 'pagos' | 'documentos'
  >('general');

  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isNuevaMatriculaOpen, setIsNuevaMatriculaOpen] = useState(false);
  const [isNuevoCobroOpen, setIsNuevoCobroOpen] = useState(false);
  const [printMatriculaId, setPrintMatriculaId] = useState<string | null>(null);
  const [matriculaToEdit, setMatriculaToEdit] = useState<Matricula | null>(null);
  const [matriculaToRetirar, setMatriculaToRetirar] = useState<Matricula | null>(null);
  const [matriculaToTrasladar, setMatriculaToTrasladar] = useState<Matricula | null>(null);
  const [reciboToPrint, setReciboToPrint] = useState<ReciboPago | null>(null);

  // Deletion modals state
  const [matriculaToDelete, setMatriculaToDelete] = useState<Matricula | null>(null);
  const [isDeleteEstudianteOpen, setIsDeleteEstudianteOpen] = useState(false);
  const [reciboToDelete, setReciboToDelete] = useState<ReciboPago | null>(null);
  const [reciboToAnular, setReciboToAnular] = useState<ReciboPago | null>(null);
  const [motivoAnulacion, setMotivoAnulacion] = useState('');

  // Grade registration modal
  const [isNotaModalOpen, setIsNotaModalOpen] = useState(false);
  const [selectedUnidadId, setSelectedUnidadId] = useState('');
  const [notaI1, setNotaI1] = useState(14);
  const [notaI2, setNotaI2] = useState(15);
  const [notaI3, setNotaI3] = useState(14);

  // EFSRT registration modal
  const [isEFSRTModalOpen, setIsEFSRTModalOpen] = useState(false);
  const [efEmpresa, setEfEmpresa] = useState('');
  const [efRuc, setEfRuc] = useState('');
  const [efHoras, setEfHoras] = useState(120);
  const [efSupervisor, setEfSupervisor] = useState('');
  const [efFechaInicio, setEfFechaInicio] = useState('2026-03-01');
  const [efFechaFin, setEfFechaFin] = useState('2026-06-30');
  const [efNota, setEfNota] = useState(16);

  // Doc issuance modal
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [docTipo, setDocTipo] = useState<'Certificado Modular' | 'Constancia de Estudios' | 'Constancia de Matrícula' | 'Constancia de Egresado'>('Certificado Modular');
  const [docModuloId, setDocModuloId] = useState('');

  const estudiante = estudiantes.find((e) => e.id === estudianteId);
  if (!estudiante) return null;

  const persona = personas.find((p) => p.id === estudiante.personaId);
  const misMatriculas = matriculas
    .filter((m) => m.estudianteId === estudiante.id)
    .sort((a, b) => new Date(b.fechaMatricula || (b as any).createdAt || 0).getTime() - new Date(a.fechaMatricula || (a as any).createdAt || 0).getTime());

  let programa = estudiante.programaId
    ? programas.find((p) => p.id === estudiante.programaId || p.codigo === estudiante.programaId)
    : null;

  if (!programa && misMatriculas.length > 0) {
    for (const m of misMatriculas) {
      if (m.programaId) {
        programa = programas.find((p) => p.id === m.programaId || p.codigo === m.programaId) || null;
        if (programa) break;
      }
      if (m.moduloId) {
        const mod = modulos.find((x) => x.id === m.moduloId);
        if (mod?.programaId) {
          programa = programas.find((p) => p.id === mod.programaId || p.codigo === mod.programaId) || null;
          if (programa) break;
        }
      }
    }
  }

  // Student specific data
  const misNotas = notasUnidades.filter((n) => n.estudianteId === estudiante.id);
  const misEFSRT = notasEFSRT.filter((n) => n.estudianteId === estudiante.id);
  const misPagos = persona ? recibos.filter((r) => r.personaId === persona.id) : [];
  const misDocumentos = documentosOficiales.filter((d) => d.estudianteId === estudiante.id);
  const modulosPrograma = programa ? modulos.filter((m) => m.programaId === programa.id || m.programaId === programa.codigo) : [];
  const unidadesPrograma = modulosPrograma.length > 0 
    ? unidades.filter((u) => modulosPrograma.some((m) => m.id === u.moduloId))
    : unidades;

  // Calculate curricular progress
  const totalCreditos = programa?.totalCreditos || 40;
  const creditosAprobados = misNotas.filter((n) => n.promedioFinal >= 13).length * 5;
  const percentAvance = Math.min(Math.round((creditosAprobados / totalCreditos) * 100), 100);

  // Handlers
  const handleStatusChange = (newStatus: EstadoEstudiante) => {
    updateEstudiante({
      ...estudiante,
    });
  };

  const handleMatriculaStatusChange = (matriculaId: string, newEstado: any) => {
    updateMatricula(matriculaId, { estado: newEstado });
  };

  const handleConfirmDeleteMatricula = async () => {
    if (!matriculaToDelete) return;
    await deleteMatricula(matriculaToDelete.id);
    setMatriculaToDelete(null);
  };

  const handleConfirmDeleteEstudiante = async () => {
    await deleteEstudiante(estudiante.id);
    setIsDeleteEstudianteOpen(false);
    onClose();
  };

  const handleConfirmAnularRecibo = async () => {
    if (!reciboToAnular) return;
    await anularRecibo(reciboToAnular.id, motivoAnulacion);
    setReciboToAnular(null);
    setMotivoAnulacion('');
  };

  const handleConfirmDeleteRecibo = async () => {
    if (!reciboToDelete) return;
    await deleteRecibo(reciboToDelete.id);
    setReciboToDelete(null);
  };

  const handleSaveNota = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUnidadId) return;

    const prom = Math.round((Number(notaI1) + Number(notaI2) + Number(notaI3)) / 3);
    const existingIndex = misNotas.findIndex((n) => n.unidadDidacticaId === selectedUnidadId);
    
    const newNota: NotaUnidad = {
      id: existingIndex >= 0 ? misNotas[existingIndex].id : `not-${Date.now()}`,
      matriculaId: misMatriculas[0]?.id || 'mat-default',
      estudianteId: estudiante.id,
      unidadDidacticaId: selectedUnidadId,
      i1: Number(notaI1),
      i2: Number(notaI2),
      i3: Number(notaI3),
      promedioFinal: prom,
      fechaRegistro: new Date().toISOString().split('T')[0],
      observaciones: 'Evaluación registrada en SIGA',
    };

    await saveNotasUnidad([newNota]);
    setIsNotaModalOpen(false);
  };

  const handleSaveEFSRT = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!efEmpresa) return;

    const newEFSRT: NotaEFSRT = {
      id: `ef-${Date.now()}`,
      estudianteId: estudiante.id,
      moduloId: modulosPrograma[0]?.id || 'mod-1',
      empresaNombre: efEmpresa,
      empresaRuc: efRuc || '20123456789',
      supervisorEmpresa: efSupervisor || 'Supervisor de Práctica',
      trabajadorSupervisorId: 'trab-1',
      fechaInicio: efFechaInicio,
      fechaTermino: efFechaFin,
      horasCompletadas: Number(efHoras),
      notaVigesimal: Number(efNota),
    };

    await saveNotaEFSRT(newEFSRT);
    setIsEFSRTModalOpen(false);
    setEfEmpresa('');
    setEfRuc('');
    setEfSupervisor('');
  };

  const handleEmitirDoc = (e: React.FormEvent) => {
    e.preventDefault();
    emitirDocumentoOficial({
      tipo: docTipo,
      estudianteId: estudiante.id,
      programaId: estudiante.programaId || programa?.id,
      moduloId: docModuloId || modulosPrograma[0]?.id || 'mod-1',
      periodoAcademico: periodoActivo,
      observaciones: `${docTipo} emitido para ${persona?.nombres} ${persona?.apellidoPaterno}`,
    });
    setIsDocModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-[60] overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end animate-fadeIn">
      <div
        className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col transform transition-transform animate-slideLeft border-l border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            {persona?.fotoUrl && !persona.fotoUrl.includes('\\') ? (
              <img
                src={persona.fotoUrl}
                alt={persona.nombres}
                className="w-12 h-12 rounded-xl object-cover border-2 border-sky-400/50 shadow-sm shrink-0"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="w-11 h-11 rounded-xl bg-sky-500 text-white flex items-center justify-center font-bold text-lg shadow-sm shrink-0">
                {persona?.nombres?.[0] || 'E'}{persona?.apellidoPaterno?.[0] || ''}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold text-white leading-tight">
                  {persona?.apellidoPaterno} {persona?.apellidoMaterno}, {persona?.nombres}
                </h3>
                {/* Selector rápido de condición de estudiante */}
                <select
                  value={estudiante.estado}
                  onChange={(e) => handleStatusChange(e.target.value as EstadoEstudiante)}
                  className="bg-slate-800 text-sky-200 border border-slate-700 text-[11px] font-bold rounded-lg px-2 py-0.5 cursor-pointer focus:ring-1 focus:ring-sky-400"
                >
                  <option value="Regular">Regular</option>
                  <option value="Egresado">Egresado</option>
                  <option value="Titulado">Titulado</option>
                  <option value="Reserva">Reserva</option>
                  <option value="Retirado">Retirado</option>
                  <option value="Trasladado">Traslado</option>
                </select>
              </div>
              <p className="text-xs text-sky-200 font-mono mt-0.5">
                {estudiante.codigoEstudiante ? (
                  <span className="font-bold text-white bg-sky-800/70 px-2 py-0.5 rounded border border-sky-600 mr-2">
                    Cód: {estudiante.codigoEstudiante}
                  </span>
                ) : null}
                DNI: {persona?.numeroDocumento || '---'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold"
              title="Editar ficha"
            >
              <Edit className="w-4 h-4" />
              <span className="hidden sm:inline">Editar</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Program Title Banner */}
        <div className="px-6 py-2.5 bg-sky-50 border-b border-sky-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 truncate">
            <GraduationCap className="w-4 h-4 text-sky-700 shrink-0" />
            <span className="font-bold text-sky-950 truncate">{programa?.nombre || 'Programa no asignado'}</span>
            {programa?.nivelFormativo && (
              <span className="text-sky-600 shrink-0">({programa.nivelFormativo})</span>
            )}
          </div>
          <div className="text-[11px] font-semibold text-sky-800 shrink-0">
            Avance: {percentAvance}% ({creditosAprobados}/{totalCreditos} créd.)
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 px-6 bg-slate-50/60 overflow-x-auto">
          {[
            { id: 'general', label: 'Ficha General', icon: <User className="w-3.5 h-3.5" /> },
            { id: 'matriculas', label: `Matrículas (${misMatriculas.length})`, icon: <Calendar className="w-3.5 h-3.5" /> },
            { id: 'avance', label: 'Avance Curricular', icon: <BookOpen className="w-3.5 h-3.5" /> },
            { id: 'efsrt', label: `EFSRT (${misEFSRT.length})`, icon: <Award className="w-3.5 h-3.5" /> },
            { id: 'pagos', label: `Pagos (${misPagos.length})`, icon: <Wallet className="w-3.5 h-3.5" /> },
            { id: 'documentos', label: `Documentos (${misDocumentos.length})`, icon: <FileCheck2 className="w-3.5 h-3.5" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 py-3 px-3 border-b-2 text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? 'border-sky-600 text-sky-700 bg-white'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: FICHA GENERAL */}
          {activeTab === 'general' && (
            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-600">Condición Académica:</span>
                  
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsEditModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg transition-colors cursor-pointer"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    Editar Ficha
                  </button>
                  <button
                    onClick={() => setIsDeleteEstudianteOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Eliminar Estudiante
                  </button>
                </div>
              </div>

              {/* Filiación e Identidad */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-600" />
                  Filiación e Identidad Personal
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Documento de Identidad:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {persona?.tipoDocumento}: {persona?.numeroDocumento}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Fecha de Nacimiento:</span>
                    <span className="font-semibold text-slate-800">{persona?.fechaNacimiento || 'No registrada'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Sexo:</span>
                    <span className="font-semibold text-slate-800">
                      {formatSexoLabel(persona?.sexo)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Estado Civil:</span>
                    <span className="font-semibold text-slate-800">{persona?.estadoCivil || 'Soltero(a)'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Nivel Educativo:</span>
                    <span className="font-semibold text-slate-800">{persona?.nivelEducativo || 'Secundaria completa'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Periodo de Ingreso:</span>
                    <span className="font-semibold text-slate-800">
                      {estudiante.periodoIngreso} ({estudiante.anioIngreso})
                    </span>
                  </div>
                </div>
              </div>

              {/* Contacto y Residencia */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-600" />
                  Contacto y Residencia
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Teléfono Celular:</span>
                    <span className="font-mono font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      {persona?.telefono || 'No registrado'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Teléfono de Contacto (Directo):</span>
                    <span className="font-mono font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      {estudiante.telefonoContacto || persona?.telefonoContacto || 'No registrado'}
                    </span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Correo Electrónico:</span>
                    <span className="font-semibold text-slate-800 flex items-center gap-1.5 mt-0.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      {persona?.correo || 'No registrado'}
                    </span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Dirección Actual:</span>
                    <span className="font-semibold text-slate-800 flex items-center gap-1.5 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      {persona?.direccion || 'No registrada'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Procedencia y Lengua */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-600" />
                  Procedencia y Lengua
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Lugar de Nacimiento:</span>
                    <span className="font-semibold text-slate-800">
                      {estudiante.lugarNacimiento || [estudiante.distritoNacimiento, estudiante.provinciaNacimiento, estudiante.regionNacimiento].filter(Boolean).join(', ') || persona?.lugarNacimiento || 'No registrado'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Lengua Originaria:</span>
                    <span className="font-semibold text-slate-800">{estudiante.lenguaOriginaria || persona?.lenguaOriginaria || 'Castellano'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">I.E. de Procedencia:</span>
                    <span className="font-semibold text-slate-800">{estudiante.ieProcedencia || persona?.ieProcedencia || 'No registrada'}</span>
                  </div>
                </div>
              </div>

              {/* Datos Socioeconómicos */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Wifi className="w-3.5 h-3.5 text-slate-600" />
                  Socioeconomía y Conectividad
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">¿Trabaja Actualmente?:</span>
                    <span className="font-semibold text-slate-800">
                      {estudiante.trabaja ? `Sí (${estudiante.puestoTrabajo || 'Ocupado'})` : 'No'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Carga Familiar:</span>
                    <span className="font-semibold text-slate-800">{persona?.cargaFamiliar !== undefined ? `${persona.cargaFamiliar} personas` : '0 personas'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Internet en Casa:</span>
                    <span className="font-semibold text-slate-800 flex items-center gap-1">
                      {persona?.internetCasa ? (
                        <span className="text-emerald-700 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Sí
                        </span>
                      ) : (
                        <span className="text-slate-500 flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5 text-slate-400" /> No
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Apoderado si aplica */}
              {(() => {
                const apodPersona = personas.find(p => p.estudianteAsociadoId === estudiante.id || (p.apoderadoId && (p as any).estudianteId === estudiante.id));
                const emergencia = estudiante.contactoEmergencia;
                if (!apodPersona && !emergencia) return null;

                const nombreCompleto = apodPersona 
                  ? `${apodPersona.apellidoPaterno} ${apodPersona.apellidoMaterno || ''}, ${apodPersona.nombres}`.trim()
                  : emergencia?.nombre;
                const parentesco = apodPersona?.parentesco || emergencia?.parentesco || 'Apoderado/Tutor';
                const telefono = apodPersona?.telefono || emergencia?.telefono || 'No registrado';
                const dni = apodPersona?.numeroDocumento;

                return (
                  <div className="bg-purple-50/70 p-4 rounded-xl border border-purple-200 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-purple-950 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-purple-700" />
                        Apoderado / Tutor Legal Vinculado
                      </h4>
                      <div className="flex items-center gap-1.5">
                        {apodPersona?.esApoderadoPrincipal && (
                          <span className="text-[10px] bg-purple-200/80 text-purple-900 font-bold px-2 py-0.5 rounded-full">
                            Principal
                          </span>
                        )}
                        <span className="text-[10px] bg-purple-100 text-purple-800 font-semibold px-2 py-0.5 rounded-full border border-purple-200">
                          {apodPersona?.estado || 'ACTIVO'}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-[11px]">
                      <div>
                        <span className="text-purple-800/80 block text-[10px] uppercase font-semibold">Nombres:</span>
                        <span className="font-bold text-purple-950">{nombreCompleto}</span>
                      </div>
                      <div>
                        <span className="text-purple-800/80 block text-[10px] uppercase font-semibold">Parentesco:</span>
                        <span className="font-semibold text-purple-950">{parentesco}</span>
                      </div>
                      <div>
                        <span className="text-purple-800/80 block text-[10px] uppercase font-semibold">Teléfono:</span>
                        <span className="font-mono font-bold text-purple-950">{telefono}</span>
                      </div>
                      {dni && (
                        <div>
                          <span className="text-purple-800/80 block text-[10px] uppercase font-semibold">DNI:</span>
                          <span className="font-mono font-bold text-purple-950">{dni}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-4 pt-1 text-[10px] text-purple-900 border-t border-purple-200/60">
                      <span>¿Vive con el estudiante?: <strong>{apodPersona?.viveConEstudiante ? 'Sí' : 'No'}</strong></span>
                      <span>¿Es apoderado principal?: <strong>{apodPersona?.esApoderadoPrincipal ? 'Sí' : 'No'}</strong></span>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* TAB 2: MATRICULAS */}
          {activeTab === 'matriculas' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Historial de Matrículas Modulares
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Gestiona inscripciones, estados y emite fichas oficiales
                  </p>
                </div>
                <button
                  onClick={() => setIsNuevaMatriculaOpen(true)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nueva Matrícula</span>
                </button>
              </div>

              {misMatriculas.length === 0 ? (
                <div className="p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-center space-y-2">
                  <Calendar className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-xs font-semibold text-slate-700">No registra matrículas activas</p>
                  <p className="text-[11px] text-slate-500">Puedes inscribir al estudiante en un módulo formativo disponible.</p>
                  <button
                    onClick={() => setIsNuevaMatriculaOpen(true)}
                    className="mt-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Matricular en este Periodo</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {misMatriculas.map((mat) => {
                    const modulo = modulos.find((m) => m.id === mat.moduloId);
                    const matProg = programas.find((p) => p.id === mat.programaId || p.codigo === mat.programaId || p.id === modulo?.programaId);

                    return (
                      <div
                        key={mat.id}
                        className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:border-slate-300 transition-all space-y-3 text-xs"
                      >
                        {/* Header de Matrícula */}
                        <div className="flex items-center justify-between flex-wrap gap-2 pb-2.5 border-b border-slate-100">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono font-bold text-blue-700 text-xs bg-blue-50 px-2 py-0.5 rounded-md">
                                {mat.codigoMatricula}
                              </span>
                              <span className="font-bold text-slate-800 text-xs">
                                Periodo: {formatPeriodoDisplay(mat.periodoAcademico)}
                              </span>
                              {mat.condicionArancelaria && mat.condicionArancelaria !== 'REGULAR' && (
                                <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 border border-indigo-300 rounded text-[10px] font-bold uppercase flex items-center gap-1">
                                  <HeartHandshake className="w-3 h-3 text-indigo-600" />
                                  {mat.condicionArancelaria === 'EXONERADO'
                                    ? `Exonerado: ${mat.convenioNombre || 'CONADIS / Ley'}`
                                    : mat.condicionArancelaria === 'CONVENIO'
                                    ? `Convenio: ${mat.convenioNombre || 'Institucional'}`
                                    : mat.condicionArancelaria === 'BECA_COMPLETA'
                                    ? 'Beca Completa (100%)'
                                    : mat.condicionArancelaria === 'SEMIBECA'
                                    ? 'Semibeca (50%)'
                                    : 'Caso Social'}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              {matProg?.nombre || programa?.nombre}
                            </div>
                          </div>

                          {/* Controles de Estado y Acciones */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {(() => {
                              const normEstado = (mat.estadoMatricula?.toUpperCase() === 'ACTIVA' || mat.estadoMatricula?.toUpperCase() === 'ACTIVO')
                                ? 'ACTIVO'
                                : (mat.estadoMatricula?.toUpperCase() || 'ACTIVO');
                              
                              if (normEstado === 'RETIRADO') {
                                return (
                                  <span className="text-[10px] bg-rose-100 text-rose-800 font-bold px-2.5 py-1 rounded-lg border border-rose-200 uppercase">
                                    Retirado
                                  </span>
                                );
                              }
                              if (normEstado === 'TRASLADADO') {
                                return (
                                  <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2.5 py-1 rounded-lg border border-amber-200 uppercase">
                                    Trasladado
                                  </span>
                                );
                              }
                              if (normEstado === 'RESERVA') {
                                return (
                                  <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-2.5 py-1 rounded-lg border border-purple-200 uppercase">
                                    Reserva
                                  </span>
                                );
                              }
                              if (normEstado === 'CERTIFICADO') {
                                return (
                                  <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2.5 py-1 rounded-lg border border-blue-200 uppercase">
                                    Certificado
                                  </span>
                                );
                              }
                              return (
                                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-lg border border-emerald-200 uppercase">
                                  Activa
                                </span>
                              );
                            })()}

                            {/* Botones de Movilidad (Solo para matrículas activas) */}
                            {(!mat.estadoMatricula || mat.estadoMatricula.toUpperCase() === 'ACTIVA' || mat.estadoMatricula.toUpperCase() === 'ACTIVO') && (
                              <>
                                <button
                                  onClick={() => setMatriculaToTrasladar(mat)}
                                  className="p-1.5 text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-lg flex items-center gap-1 font-semibold border border-sky-200 transition-colors cursor-pointer"
                                  title="Gestionar traslado de sección, programa o institución"
                                >
                                  <ArrowRightLeft className="w-3.5 h-3.5" />
                                  <span className="hidden sm:inline text-[11px]">Traslado</span>
                                </button>

                                <button
                                  onClick={() => setMatriculaToRetirar(mat)}
                                  className="p-1.5 text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg flex items-center gap-1 font-semibold border border-rose-200 transition-colors cursor-pointer"
                                  title="Formalizar retiro voluntario o de oficio"
                                >
                                  <UserMinus className="w-3.5 h-3.5" />
                                  <span className="hidden sm:inline text-[11px]">Retiro</span>
                                </button>
                              </>
                            )}

                            {/* Botón Editar Matrícula */}
                            <button
                              onClick={() => setMatriculaToEdit(mat)}
                              className="p-1.5 text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg flex items-center gap-1 font-semibold border border-amber-200 transition-colors cursor-pointer"
                              title="Editar registro de matrícula (Sección, Periodo, Módulo, etc.)"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline text-[11px]">Editar</span>
                            </button>

                            {/* Botón Imprimir Ficha */}
                            <button
                              onClick={() => setPrintMatriculaId(mat.id)}
                              className="p-1.5 text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg flex items-center gap-1 font-semibold border border-blue-200 transition-colors cursor-pointer"
                              title="Imprimir Ficha Oficial de Matrícula"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline text-[11px]">Ficha</span>
                            </button>

                            {/* Botón Eliminar Matrícula */}
                            <button
                              onClick={() => setMatriculaToDelete(mat)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-1 font-semibold transition-colors cursor-pointer"
                              title="Eliminar registro por error de digitación"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Detalles de Módulo */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-[11px] bg-slate-50/70 p-2.5 rounded-xl">
                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Módulo:</span>
                            <strong className="text-slate-900 block truncate">{modulo?.nombre || mat.moduloId || 'Módulo Regular'}</strong>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Condición Arancel:</span>
                            {mat.condicionArancelaria && mat.condicionArancelaria !== 'REGULAR' ? (
                              <strong className="text-indigo-700 font-bold block truncate">
                                {mat.condicionArancelaria === 'EXONERADO' ? `Exonerado (${mat.convenioNombre || 'CONADIS'})` :
                                 mat.condicionArancelaria === 'CONVENIO' ? `Convenio: ${mat.convenioNombre || 'Aliado'}` :
                                 mat.condicionArancelaria === 'BECA_COMPLETA' ? 'Beca Completa (100%)' :
                                 mat.condicionArancelaria === 'SEMIBECA' ? 'Semibeca (50%)' : 'Caso Social'}
                              </strong>
                            ) : (
                              <strong className="text-slate-800 block">Tarifa Regular</strong>
                            )}
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Fecha Registro:</span>
                            <strong className="text-slate-800">{mat.fechaMatricula || 'Registrado'}</strong>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Recibo de Caja:</span>
                            <strong className="font-mono text-slate-800">
                              {mat.reciboPagoId ? `REC-${mat.reciboPagoId.substring(0, 6)}` : 'Exonerado / Directo'}
                            </strong>
                          </div>
                          {mat.observaciones && (
                            <div className="col-span-2">
                              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Observaciones:</span>
                              <span className="text-slate-600 italic">{mat.observaciones}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: AVANCE CURRICULAR Y NOTAS */}
          {activeTab === 'avance' && (
            <div className="space-y-4">
              <div className="bg-sky-50 p-4 rounded-xl border border-sky-200">
                <div className="flex justify-between items-center text-xs font-bold text-sky-950 mb-1.5">
                  <span>Progreso de Créditos Académicos</span>
                  <span>{percentAvance}% Completado</span>
                </div>
                <div className="w-full bg-sky-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-sky-600 h-2 rounded-full transition-all"
                    style={{ width: `${percentAvance}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-sky-800 mt-1">
                  <span>Aprobados: {creditosAprobados} créditos</span>
                  <span>Total Programa: {totalCreditos} créditos</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Calificaciones por Unidad Didáctica (0 - 20)
                  </h4>
                  <button
                    onClick={() => {
                      setSelectedUnidadId(unidadesPrograma[0]?.id || '');
                      setIsNotaModalOpen(true);
                    }}
                    className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Registrar Nota</span>
                  </button>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="p-2.5">Código / Unidad</th>
                        <th className="p-2.5 text-center">IE1</th>
                        <th className="p-2.5 text-center">IE2</th>
                        <th className="p-2.5 text-center">IE3</th>
                        <th className="p-2.5 text-center">Prom. UD</th>
                        <th className="p-2.5 text-center">Estado</th>
                        <th className="p-2.5 text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {misNotas.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-4 text-center text-slate-400 italic">
                            No registra notas de unidades didácticas todavía.
                          </td>
                        </tr>
                      ) : (
                        misNotas.map((nota) => {
                          const ud = unidades.find((u) => u.id === nota.unidadDidacticaId);
                          const isApproved = nota.promedioFinal >= 13;

                          return (
                            <tr key={nota.id} className="hover:bg-slate-50/80">
                              <td className="p-2.5">
                                <div className="font-semibold text-slate-900">{ud?.nombre || 'Unidad Didáctica'}</div>
                                <div className="text-[10px] text-slate-400 font-mono">{ud?.codigo} • {ud?.horas}h</div>
                              </td>
                              <td className="p-2.5 text-center font-mono">{nota.i1}</td>
                              <td className="p-2.5 text-center font-mono">{nota.i2}</td>
                              <td className="p-2.5 text-center font-mono">{nota.i3}</td>
                              <td className="p-2.5 text-center font-mono font-bold text-sm">
                                <span
                                  className={`px-2 py-0.5 rounded ${
                                    isApproved
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-rose-100 text-rose-800'
                                  }`}
                                >
                                  {nota.promedioFinal.toString().padStart(2, '0')}
                                </span>
                              </td>
                              <td className="p-2.5 text-center">
                                <Badge variant={isApproved ? 'success' : 'danger'} size="sm">
                                  {isApproved ? 'Aprobado' : 'Desaprobado'}
                                </Badge>
                              </td>
                              <td className="p-2.5 text-right">
                                <button
                                  onClick={() => {
                                    setSelectedUnidadId(nota.unidadDidacticaId);
                                    setNotaI1(nota.i1);
                                    setNotaI2(nota.i2);
                                    setNotaI3(nota.i3);
                                    setIsNotaModalOpen(true);
                                  }}
                                  className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                                  title="Editar nota"
                                >
                                  <Edit className="w-3.5 h-3.5" />
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
            </div>
          )}

          {/* TAB 4: EFSRT */}
          {activeTab === 'efsrt' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Experiencias Formativas (EFSRT)
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Prácticas pre-profesionales según R.V.M. N° 188-2020-MINEDU
                  </p>
                </div>
                <button
                  onClick={() => setIsEFSRTModalOpen(true)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Registrar Práctica</span>
                </button>
              </div>

              {misEFSRT.length === 0 ? (
                <div className="p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-center space-y-2">
                  <Award className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-xs font-semibold text-slate-700">Sin prácticas EFSRT registradas</p>
                  <p className="text-[11px] text-slate-500">Registra las prácticas modulares en empresas o talleres.</p>
                  <button
                    onClick={() => setIsEFSRTModalOpen(true)}
                    className="mt-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Registrar EFSRT</span>
                  </button>
                </div>
              ) : (
                misEFSRT.map((ef) => (
                  <div
                    key={ef.id}
                    className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-xs space-y-3 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-900 text-sm block">
                          {ef.empresaNombre}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          RUC: {ef.empresaRuc}
                        </span>
                      </div>
                      <Badge variant="success" size="md">Nota: {ef.notaVigesimal} / 20</Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-2.5 rounded-lg">
                      <div>
                        <span className="text-slate-400 block">Horas Realizadas:</span>
                        <strong className="text-slate-800">{ef.horasCompletadas} Horas cronológicas</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Supervisor en Empresa:</span>
                        <strong className="text-slate-800">{ef.supervisorEmpresa}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Periodo de Práctica:</span>
                        <strong className="text-slate-800">{ef.fechaInicio} al {ef.fechaTermino}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Constancia de Práctica:</span>
                        <span className="text-sky-600 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Verificada
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 5: PAGOS */}
          {activeTab === 'pagos' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Recibos y Pagos en Ventanilla
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Historial de cobros por matrícula, certificados y trámites
                  </p>
                </div>
                <button
                  onClick={() => setIsNuevoCobroOpen(true)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nuevo Cobro</span>
                </button>
              </div>

              {misPagos.length === 0 ? (
                <div className="p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-center space-y-2">
                  <Wallet className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-xs font-semibold text-slate-700">No registra pagos en caja</p>
                  <p className="text-[11px] text-slate-500">Puedes emitir un recibo de cobro directamente para este estudiante.</p>
                  <button
                    onClick={() => setIsNuevoCobroOpen(true)}
                    className="mt-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Emitir Recibo</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {misPagos.map((pago) => (
                    <div
                      key={pago.id}
                      className="p-3.5 bg-white rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between text-xs gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900">{pago.numeroRecibo}</span>
                          
                        </div>
                        <div className="text-slate-700 font-medium mt-0.5">{pago.conceptoNombre}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {pago.fechaEmision} • {pago.metodoPago} {pago.numeroOperacion ? `(Op: ${pago.numeroOperacion})` : ''}
                        </div>
                        {pago.observaciones && (
                          <div className="text-[10px] text-amber-700 italic mt-0.5">
                            {pago.observaciones}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="font-bold text-slate-900 font-mono text-sm">
                            S/ {pago.monto.toFixed(2)}
                          </div>
                        </div>

                        {/* Botones de Pago */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setReciboToPrint(pago)}
                            className="p-1.5 text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                            title="Imprimir Recibo"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          {pago.estado !== 'Anulado' && (
                            <button
                              onClick={() => {
                                setReciboToAnular(pago);
                                setMotivoAnulacion('');
                              }}
                              className="p-1.5 text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors cursor-pointer"
                              title="Anular Recibo"
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => setReciboToDelete(pago)}
                            className="p-1.5 text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
                            title="Eliminar Registro de Pago"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 6: DOCUMENTOS Y CERTIFICADOS OFICIALES */}
          {activeTab === 'documentos' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Certificados Modulares y Actas Oficiales
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Documentos con código de verificación QR institucional
                  </p>
                </div>
                <button
                  onClick={() => setIsDocModalOpen(true)}
                  className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Emitir Documento</span>
                </button>
              </div>

              {misDocumentos.length === 0 ? (
                <div className="p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-center space-y-2">
                  <FileCheck2 className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-xs font-semibold text-slate-700">No hay documentos oficiales emitidos</p>
                  <p className="text-[11px] text-slate-500">Emite certificados modulares, constancias de matrícula o de estudios.</p>
                  <button
                    onClick={() => setIsDocModalOpen(true)}
                    className="mt-2 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Emitir Certificado</span>
                  </button>
                </div>
              ) : (
                misDocumentos.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-xs space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-mono font-bold text-sky-700 text-sm block">
                          {doc.numeroDocumento}
                        </span>
                        <span className="text-xs text-slate-600 font-medium">{doc.tipo}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="purple" size="sm">MINEDU Oficial</Badge>
                        <button
                          onClick={() => deleteDocumentoOficial(doc.id)}
                          className="p-1 text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                          title="Eliminar documento"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 pt-2 border-t border-slate-100">
                      <QrCode value={doc.codigoVerificacionQR} size={70} label="" showLink={false} />
                      <div className="text-xs text-slate-600 space-y-1 flex-1">
                        <div><strong>Fecha de Emisión:</strong> {doc.fechaEmision}</div>
                        <div><strong>Estado:</strong> <span className="text-emerald-700 font-semibold">100% Válido</span></div>
                        <div className="text-[10px] text-slate-400 truncate">
                          QR: {doc.codigoVerificacionQR}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="text-[11px] text-slate-500">
            CETPRO Juanjuí • Sistema Académico SIGA
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Cerrar Ficha
          </button>
        </div>
      </div>
      
      {/* 1. Modal Editar Estudiante */}
      {estudiante && persona && (
        <EditarEstudianteModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          estudiante={estudiante}
          persona={persona}
        />
      )}

      {/* 2. Modal Imprimir Matrícula */}
      {printMatriculaId && (
        <FichaMatriculaPrint
          isOpen={!!printMatriculaId}
          onClose={() => setPrintMatriculaId(null)}
          matriculaId={printMatriculaId}
          zIndex="z-[70]"
        />
      )}

      {/* 2.1 Modal Editar Matrícula */}
      {matriculaToEdit && (
        <EditarMatriculaModal
          isOpen={!!matriculaToEdit}
          onClose={() => setMatriculaToEdit(null)}
          matricula={matriculaToEdit}
          estudiante={{
            ...estudiante,
            persona: persona
          }}
          onSuccess={() => {
            setMatriculaToEdit(null);
          }}
        />
      )}

      {/* 3. Modal Nueva Matrícula */}
      {isNuevaMatriculaOpen && persona && (
        <NuevaMatriculaModal
          isOpen={isNuevaMatriculaOpen}
          onClose={() => setIsNuevaMatriculaOpen(false)}
          initialPersonaId={persona.id}
          onSuccess={(id) => setPrintMatriculaId(id)}
        />
      )}

      {/* 4. Modal Nuevo Cobro */}
      {isNuevoCobroOpen && persona && (
        <NuevoCobroModal
          isOpen={isNuevoCobroOpen}
          onClose={() => setIsNuevoCobroOpen(false)}
          initialPersonaId={persona.id}
          onReciboCreated={(nuevo, shouldPrint) => {
            setIsNuevoCobroOpen(false);
            if (shouldPrint) {
              setReciboToPrint(nuevo);
            }
          }}
        />
      )}

      {/* 5. Modal Imprimir Recibo */}
      {reciboToPrint && (
        <ReciboImprimibleModal
          isOpen={!!reciboToPrint}
          onClose={() => setReciboToPrint(null)}
          recibo={reciboToPrint}
        />
      )}

      {/* Modal Registrar Retiro Formal */}
      {matriculaToRetirar && (
        <RegistrarRetiroModal
          isOpen={!!matriculaToRetirar}
          onClose={() => setMatriculaToRetirar(null)}
          matricula={matriculaToRetirar}
          estudianteNombre={`${persona?.apellidoPaterno || ''} ${persona?.nombres || ''}`.trim()}
          estudianteDni={persona?.numeroDocumento}
          moduloNombre={modulos.find((m) => m.id === matriculaToRetirar.moduloId)?.nombre}
          seccionNombre={secciones.find((s) => s.id === matriculaToRetirar.seccionId)?.nombre}
          onSuccess={() => setMatriculaToRetirar(null)}
        />
      )}

      {/* Modal Registrar Traslado Formal */}
      {matriculaToTrasladar && (
        <RegistrarTrasladoModal
          isOpen={!!matriculaToTrasladar}
          onClose={() => setMatriculaToTrasladar(null)}
          matricula={matriculaToTrasladar}
          estudianteNombre={`${persona?.apellidoPaterno || ''} ${persona?.nombres || ''}`.trim()}
          estudianteDni={persona?.numeroDocumento}
          moduloNombre={modulos.find((m) => m.id === matriculaToTrasladar.moduloId)?.nombre}
          seccionNombre={secciones.find((s) => s.id === matriculaToTrasladar.seccionId)?.nombre}
          onSuccess={() => setMatriculaToTrasladar(null)}
        />
      )}

      {/* 6. Modal Confirmar Eliminación de Matrícula */}
      {matriculaToDelete && (
        <Modal
          isOpen={!!matriculaToDelete}
          onClose={() => setMatriculaToDelete(null)}
          title="Eliminar Matrícula"
          subtitle="Confirmación de retiro de inscripción académica"
          maxWidth="md"
          actions={
            <>
              <button
                type="button"
                onClick={() => setMatriculaToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteMatricula}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Eliminar Definitivamente</span>
              </button>
            </>
          }
        >
          <div className="space-y-3 text-xs text-slate-700">
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-rose-900">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-xs">¿Estás seguro de eliminar esta matrícula?</p>
                <p className="text-[11px] text-rose-700 mt-0.5">
                  Esta acción retirará la matrícula <strong>{matriculaToDelete.codigoMatricula}</strong>, liberará la vacante en la sección y no se puede deshacer.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1 text-[11px]">
              <div><strong>Estudiante:</strong> {persona?.apellidoPaterno} {persona?.nombres} (DNI: {persona?.numeroDocumento})</div>
              <div><strong>Periodo:</strong> {formatPeriodoDisplay(matriculaToDelete.periodoAcademico)}</div>
              <div><strong>Tipo:</strong> {matriculaToDelete.tipo}</div>
            </div>
          </div>
        </Modal>
      )}

      {/* 7. Modal Confirmar Eliminación de Estudiante */}
      {isDeleteEstudianteOpen && (
        <Modal
          isOpen={isDeleteEstudianteOpen}
          onClose={() => setIsDeleteEstudianteOpen(false)}
          title="Eliminar Ficha de Estudiante"
          subtitle="Acción destructiva permanente"
          maxWidth="md"
          actions={
            <>
              <button
                type="button"
                onClick={() => setIsDeleteEstudianteOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteEstudiante}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Eliminar Estudiante</span>
              </button>
            </>
          }
        >
          <div className="space-y-3 text-xs text-slate-700">
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-rose-900">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-xs">¡Atención! Acción irreversible</p>
                <p className="text-[11px] text-rose-700 mt-0.5">
                  Se eliminará la ficha de estudiante de <strong>{persona?.apellidoPaterno} {persona?.nombres}</strong> junto con todas sus matrículas ({misMatriculas.length}) asociadas.
                </p>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* 8. Modal Anular Recibo */}
      {reciboToAnular && (
        <Modal
          isOpen={!!reciboToAnular}
          onClose={() => setReciboToAnular(null)}
          title="Anular Recibo de Pago"
          subtitle={`Recibo N° ${reciboToAnular.numeroRecibo}`}
          maxWidth="md"
          actions={
            <>
              <button
                type="button"
                onClick={() => setReciboToAnular(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmAnularRecibo}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Ban className="w-4 h-4" />
                <span>Confirmar Anulación</span>
              </button>
            </>
          }
        >
          <div className="space-y-3 text-xs">
            <p className="text-slate-600">
              Indica el motivo por el cual se anula el recibo por <strong>S/ {reciboToAnular.monto.toFixed(2)}</strong> ({reciboToAnular.conceptoNombre}):
            </p>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Motivo de anulación:
              </label>
              <input
                type="text"
                value={motivoAnulacion}
                onChange={(e) => setMotivoAnulacion(e.target.value)}
                placeholder="Ej. Error en digitación de monto o concepto"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>
        </Modal>
      )}

      {/* 9. Modal Confirmar Eliminación de Recibo */}
      {reciboToDelete && (
        <Modal
          isOpen={!!reciboToDelete}
          onClose={() => setReciboToDelete(null)}
          title="Eliminar Registro de Pago"
          subtitle={`Recibo ${reciboToDelete.numeroRecibo}`}
          maxWidth="md"
          actions={
            <>
              <button
                type="button"
                onClick={() => setReciboToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteRecibo}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Eliminar Pago</span>
              </button>
            </>
          }
        >
          <div className="space-y-3 text-xs text-slate-700">
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-rose-900">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-xs">¿Eliminar registro de pago?</p>
                <p className="text-[11px] text-rose-700 mt-0.5">
                  Se borrará permanentemente el recibo por <strong>S/ {reciboToDelete.monto.toFixed(2)}</strong> ({reciboToDelete.conceptoNombre}).
                </p>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* 10. Modal Registrar / Editar Nota */}
      {isNotaModalOpen && (
        <Modal
          isOpen={isNotaModalOpen}
          onClose={() => setIsNotaModalOpen(false)}
          title="Registrar / Calificar Unidad Didáctica"
          subtitle="Calificación de Indicadores de Logro (0 - 20)"
          maxWidth="md"
          actions={
            <>
              <button
                type="button"
                onClick={() => setIsNotaModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveNota}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Guardar Calificación</span>
              </button>
            </>
          }
        >
          <form onSubmit={handleSaveNota} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Selecciona la Unidad Didáctica:
              </label>
              <select
                value={selectedUnidadId}
                onChange={(e) => setSelectedUnidadId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
              >
                {unidadesPrograma.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.codigo} - {u.nombre} ({u.horas}h)
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Indicador 1 (IE1):</label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={notaI1}
                  onChange={(e) => setNotaI1(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-center font-mono font-bold text-sm"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Indicador 2 (IE2):</label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={notaI2}
                  onChange={(e) => setNotaI2(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-center font-mono font-bold text-sm"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Indicador 3 (IE3):</label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={notaI3}
                  onChange={(e) => setNotaI3(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-center font-mono font-bold text-sm"
                />
              </div>
            </div>

            <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 flex items-center justify-between font-bold text-blue-950">
              <span>Promedio Vigesimal Calculado:</span>
              <span className="text-base font-mono">
                {Math.round((Number(notaI1) + Number(notaI2) + Number(notaI3)) / 3)} / 20
              </span>
            </div>
          </form>
        </Modal>
      )}

      {/* 11. Modal Registrar EFSRT */}
      {isEFSRTModalOpen && (
        <Modal
          isOpen={isEFSRTModalOpen}
          onClose={() => setIsEFSRTModalOpen(false)}
          title="Registrar Práctica Pre-Profesional (EFSRT)"
          subtitle="Experiencias formativas en situaciones reales de trabajo"
          maxWidth="md"
          actions={
            <>
              <button
                type="button"
                onClick={() => setIsEFSRTModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveEFSRT}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Guardar EFSRT</span>
              </button>
            </>
          }
        >
          <form onSubmit={handleSaveEFSRT} className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nombre de la Empresa o Centro de Práctica:</label>
              <input
                type="text"
                required
                value={efEmpresa}
                onChange={(e) => setEfEmpresa(e.target.value)}
                placeholder="Ej. Taller Mecánico San Martín / Salón de Belleza Glamour"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">RUC de la Empresa:</label>
                <input
                  type="text"
                  value={efRuc}
                  onChange={(e) => setEfRuc(e.target.value)}
                  placeholder="20123456789"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Horas Cronológicas:</label>
                <input
                  type="number"
                  value={efHoras}
                  onChange={(e) => setEfHoras(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Supervisor en la Empresa:</label>
              <input
                type="text"
                value={efSupervisor}
                onChange={(e) => setEfSupervisor(e.target.value)}
                placeholder="Nombre del maestro de taller / jefe directo"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Inicio:</label>
                <input
                  type="date"
                  value={efFechaInicio}
                  onChange={(e) => setEfFechaInicio(e.target.value)}
                  className="w-full px-2 py-2 border border-slate-300 rounded-xl text-[11px]"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Término:</label>
                <input
                  type="date"
                  value={efFechaFin}
                  onChange={(e) => setEfFechaFin(e.target.value)}
                  className="w-full px-2 py-2 border border-slate-300 rounded-xl text-[11px]"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nota (0-20):</label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={efNota}
                  onChange={(e) => setEfNota(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-center font-mono font-bold text-sm"
                />
              </div>
            </div>
          </form>
        </Modal>
      )}

      {/* 12. Modal Emitir Documento Oficial */}
      {isDocModalOpen && (
        <Modal
          isOpen={isDocModalOpen}
          onClose={() => setIsDocModalOpen(false)}
          title="Emitir Documento Oficial"
          subtitle="Generación de certificado con código QR MINEDU"
          maxWidth="md"
          actions={
            <>
              <button
                type="button"
                onClick={() => setIsDocModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleEmitirDoc}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <FileCheck2 className="w-4 h-4" />
                <span>Emitir Documento</span>
              </button>
            </>
          }
        >
          <form onSubmit={handleEmitirDoc} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Tipo de Documento Oficial:</label>
              <select
                value={docTipo}
                onChange={(e) => setDocTipo(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
              >
                <option value="Certificado Modular">Certificado Modular (Aprobación de Módulo)</option>
                <option value="Constancia de Estudios">Constancia de Estudios</option>
                <option value="Constancia de Matrícula">Constancia de Matrícula</option>
                <option value="Constancia de Egresado">Constancia de Egresado</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Módulo Asociado:</label>
              <select
                value={docModuloId}
                onChange={(e) => setDocModuloId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
              >
                {modulosPrograma.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.codigo} - {m.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-purple-900 text-[11px]">
              El sistema generará un número de registro único correlativo y un código QR de autenticidad para consulta pública.
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
