import React from 'react';
import { useApp } from '../../context/AppContext';
import { Persona } from '../../types';
import { Badge } from '../common/Badge';
import {
  X,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CreditCard,
  GraduationCap,
  Briefcase,
  Edit2,
  Receipt,
  FileCheck2,
  Wifi,
  Laptop,
  HeartHandshake,
  AlertCircle,
  FileText,
  Building,
  Award,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  ExternalLink,
  Camera,
} from 'lucide-react';

interface PersonaDrawerProps {
  personaId: string;
  onClose: () => void;
  onEdit: (persona: Persona) => void;
}

export const PersonaDrawer: React.FC<PersonaDrawerProps> = ({ personaId, onClose, onEdit }) => {
  const {
    personas,
    estudiantes,
    trabajadores,
    programas,
    planesEstudio,
    recibos,
    setSelectedEstudianteId,
    setActiveView,
  } = useApp();

  const persona = personas.find((p) => p.id === personaId);
  if (!persona) return null;

  const estudiante = estudiantes.find((e) => e.personaId === persona.id);
  const trabajador = trabajadores.find((d) => d.personaId === persona.id);
  const programa = estudiante ? programas.find((p) => p.id === estudiante.programaId) : null;
  const pagosPersona = recibos.filter((r) => r.personaId === persona.id);

  // Associated student if persona is apoderado
  const associatedStudent = persona.estudianteAsociadoId
    ? estudiantes.find((e) => e.id === persona.estudianteAsociadoId)
    : null;
  const associatedPersona = associatedStudent
    ? personas.find((p) => p.id === associatedStudent.personaId)
    : null;

  // Egresado plan and program
  const egresadoPrograma = persona.programaId
    ? programas.find((p) => p.id === persona.programaId)
    : null;
  const egresadoPlan = persona.planEstudioId
    ? planesEstudio.find((pl) => pl.id === persona.planEstudioId)
    : null;

  const getRole = () => {
    if (persona.rolPrimario) return persona.rolPrimario;
    if (persona.esTrabajador || trabajador) return 'TRABAJADOR';
    if (persona.esEstudiante || estudiante) return 'ESTUDIANTE';
    return 'REGISTRADO';
  };

  const currentRole = getRole();

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end animate-fadeIn">
      <div
        className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col transform transition-transform animate-slideLeft border-l border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            {persona.fotoUrl && !persona.fotoUrl.includes('\\') ? (
              <img
                src={persona.fotoUrl}
                alt={persona.nombres}
                className="w-12 h-12 rounded-xl object-cover border-2 border-sky-400/50 shadow-sm shrink-0"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="w-11 h-11 rounded-xl bg-sky-500 text-white flex items-center justify-center font-bold text-base shadow-sm shrink-0">
                {persona.nombres?.[0] || 'P'}{persona.apellidoPaterno?.[0] || ''}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white leading-tight">
                  {persona.apellidoPaterno} {persona.apellidoMaterno}, {persona.nombres}
                </h3>
                {currentRole === 'ESTUDIANTE' && <Badge variant="primary" size="sm">Estudiante</Badge>}
                {currentRole === 'DOCENTE' && <Badge variant="success" size="sm">Docente</Badge>}
                {currentRole === 'ADMINISTRATIVO' && <Badge variant="neutral" size="sm">Administrativo</Badge>}
                {currentRole === 'DIRECTIVO' && <Badge variant="warning" size="sm">Directivo</Badge>}
                {currentRole === 'TRABAJADOR' && <Badge variant="success" size="sm">Docente / Personal</Badge>}
                {currentRole === 'APODERADO' && <Badge variant="purple" size="sm">Apoderado</Badge>}
                {currentRole === 'EGRESADO' && <Badge variant="warning" size="sm">Egresado</Badge>}
              </div>
              <p className="text-xs text-sky-200 font-mono mt-0.5">
                {persona.tipoDocumento}: {persona.numeroDocumento}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(persona)}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Editar Persona"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Section: Identificación y Filiación */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 text-xs">
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-600" />
              Datos Personales y Filiación
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Tipo y N° Doc:</span>
                <span className="font-mono font-bold text-slate-800">
                  {persona.tipoDocumento}: {persona.numeroDocumento}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Fecha Nacimiento:</span>
                <span className="font-semibold text-slate-800">{persona.fechaNacimiento || 'No registrada'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Sexo:</span>
                <span className="font-semibold text-slate-800">
                  {persona.sexo === 'H' ? 'Hombre' : persona.sexo === 'M' ? 'Mujer' : persona.sexo || '-'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Estado Civil:</span>
                <span className="font-semibold text-slate-800">{persona.estadoCivil || 'No registrado'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Nivel Educativo:</span>
                <span className="font-semibold text-slate-800">{persona.nivelEducativo || 'Secundaria completa'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Carga Familiar:</span>
                <span className="font-semibold text-slate-800">{persona.cargaFamiliar !== undefined && persona.cargaFamiliar !== null ? `${persona.cargaFamiliar} personas` : '0 personas'}</span>
              </div>
              {persona.fotoUrl && (
                <div className="col-span-2 sm:col-span-3 pt-2 border-t border-slate-200/80 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Camera className="w-3.5 h-3.5 text-sky-600" />
                    <span className="text-slate-500 font-semibold text-[11px]">Fotografía registrada (foto_url):</span>
                  </div>
                  {persona.fotoUrl.includes('\\') ? (
                    <button
                      onClick={() => onEdit(persona)}
                      className="text-amber-600 hover:text-amber-700 font-semibold text-[11px] underline flex items-center gap-1 cursor-pointer"
                      title="Haz clic para subir la foto"
                    >
                      <span>Ruta local detectada • Subir archivo</span>
                      <Edit2 className="w-3 h-3" />
                    </button>
                  ) : (
                    <a
                      href={persona.fotoUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="inline-flex items-center gap-1 text-sky-600 hover:text-sky-700 font-semibold text-[11px] underline"
                    >
                      <span>Ver imagen en tamaño completo</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Section: Contacto y Residencia */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 text-xs">
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-600" />
              Contacto y Residencia
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Teléfono Celular:</span>
                <span className="font-mono font-semibold text-slate-800 flex items-center gap-1.5 mt-0.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  {persona.telefono || 'No registrado'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Teléfono de Contacto:</span>
                <span className="font-mono font-semibold text-slate-800 flex items-center gap-1.5 mt-0.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  {persona.telefonoContacto || estudiante?.telefonoContacto || 'No registrado'}
                </span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Correo Electrónico:</span>
                <span className="font-semibold text-slate-800 flex items-center gap-1.5 mt-0.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {persona.correo || 'No registrado'}
                </span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Dirección Actual:</span>
                <span className="font-semibold text-slate-800 flex items-center gap-1.5 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  {persona.direccion || 'No registrada'} {persona.ubigeo ? `(Ubigeo: ${persona.ubigeo})` : ''}
                </span>
              </div>
            </div>
          </div>

          {/* Section: Conectividad y Equipamiento */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 text-xs">
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Wifi className="w-3.5 h-3.5 text-slate-600" />
              Conectividad y Recursos Tecnológicos
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Internet en Casa:</span>
                <span className="font-semibold text-slate-800 flex items-center gap-1.5 mt-0.5">
                  {persona.internetCasa ? (
                    <span className="text-emerald-700 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Sí dispone
                    </span>
                  ) : (
                    <span className="text-slate-500 flex items-center gap-1">
                      <XCircle className="w-3.5 h-3.5 text-slate-400" /> No dispone
                    </span>
                  )}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Equipo para Clases:</span>
                <span className="font-semibold text-slate-800 flex items-center gap-1.5 mt-0.5">
                  <Laptop className="w-3.5 h-3.5 text-slate-400" />
                  {persona.equipoClasesVirtuales || 'No especificado'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Operador Móvil:</span>
                <span className="font-semibold text-slate-800 mt-0.5 block">
                  {persona.operadorTelefonico || 'No especificado'}
                </span>
              </div>
            </div>
          </div>

          {/* Section: Inclusión y Salud */}
          {(persona.discapacidad || persona.tipoDiscapacidad) && (
            <div className="bg-purple-50/70 p-4 rounded-xl border border-purple-200 space-y-2 text-xs">
              <h4 className="font-bold text-purple-950 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <HeartHandshake className="w-3.5 h-3.5 text-purple-700" />
                Inclusión y Necesidades Especiales
              </h4>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-purple-800/80 block">Discapacidad:</span>
                  <span className="font-bold text-purple-950">
                    {persona.discapacidad ? 'Sí' : 'No'}
                  </span>
                </div>
                <div>
                  <span className="text-purple-800/80 block">Tipo de Discapacidad:</span>
                  <span className="font-bold text-purple-950">
                    {persona.tipoDiscapacidad || 'No especificado'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Section: Perfil Estudiante */}
          {(estudiante || persona.esEstudiante || persona.rolPrimario === 'ESTUDIANTE' || persona.rolPrimario === 'EGRESADO') && (
            <div className="bg-sky-50/70 p-4 rounded-xl border border-sky-200 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sky-950 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-sky-700" />
                  Perfil de Estudiante
                </h4>
                <Badge variant="primary" size="sm">{estudiante?.estado || 'Regular'}</Badge>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-[11px]">
                {(estudiante?.codigoEstudiante || persona.codigoEstudiante) && (
                  <div>
                    <span className="text-sky-800/80 block">Código Estudiante:</span>
                    <span className="font-mono font-bold text-sky-950 bg-white px-2 py-0.5 rounded border border-sky-300 inline-block mt-0.5">
                      {estudiante?.codigoEstudiante || persona.codigoEstudiante}
                    </span>
                  </div>
                )}
                <div>
                  <span className="text-sky-800/80 block">Programa Actual:</span>
                  <span className="font-bold text-sky-950">{programa?.nombre || 'No asignado'}</span>
                </div>
                <div>
                  <span className="text-sky-800/80 block">Cohorte / Ingreso:</span>
                  <span className="font-semibold text-sky-950">
                    {estudiante?.periodoIngreso || '2025-I'} ({estudiante?.anioIngreso || 2025})
                  </span>
                </div>
                <div>
                  <span className="text-sky-800/80 block">I.E. de Procedencia:</span>
                  <span className="font-semibold text-sky-950">
                    {persona.ieProcedencia || estudiante?.ieProcedencia || 'No registrada'}
                  </span>
                </div>
                <div>
                  <span className="text-sky-800/80 block">Lugar de Nacimiento:</span>
                  <span className="font-semibold text-sky-950">
                    {persona.lugarNacimiento || estudiante?.lugarNacimiento || [persona.distritoNacimiento, persona.provinciaNacimiento, persona.regionNacimiento, persona.paisNacimiento].filter(Boolean).join(', ') || 'No registrado'}
                  </span>
                </div>
                <div>
                  <span className="text-sky-800/80 block">Lengua Originaria:</span>
                  <span className="font-semibold text-sky-950">
                    {persona.lenguaOriginaria || estudiante?.lenguaOriginaria || 'Castellano'}
                  </span>
                </div>
                <div>
                  <span className="text-sky-800/80 block">Situación Laboral:</span>
                  <span className="font-semibold text-sky-950">
                    {(persona.trabaja ?? estudiante?.trabaja) ? `Trabaja (${persona.puestoTrabajo || estudiante?.puestoTrabajo || 'Ocupado'})` : 'No labora actualmente'}
                  </span>
                </div>
              </div>

              {estudiante && (
                <button
                  onClick={() => {
                    setSelectedEstudianteId(estudiante.id);
                    setActiveView('estudiantes');
                    onClose();
                  }}
                  className="w-full mt-2 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <FileCheck2 className="w-3.5 h-3.5" />
                  <span>Abrir Ficha Académica y Notas del Estudiante</span>
                </button>
              )}
            </div>
          )}

          {/* Section: Perfil Personal Institucional (Docente / Administrativo / Directivo) */}
          {(trabajador || persona.esTrabajador || persona.rolPrimario === 'TRABAJADOR' || persona.rolPrimario === 'DOCENTE' || persona.rolPrimario === 'ADMINISTRATIVO' || persona.rolPrimario === 'DIRECTIVO' || persona.codigoPlaza || persona.cargo) && (
            <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-emerald-950 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 text-emerald-700" />
                  Perfil del Personal ({persona.rolPrimario || 'Trabajador'})
                </h4>
                <Badge variant={(trabajador?.estado || persona.estadoTrabajador || 'Activo') === 'Activo' ? 'success' : 'warning'} size="sm">
                  {trabajador?.estado || persona.estadoTrabajador || 'Activo'}
                </Badge>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-[11px]">
                <div>
                  <span className="text-emerald-800/80 block">Código de Plaza:</span>
                  <span className="font-mono font-bold text-emerald-950">
                    {persona.codigoPlaza || trabajador?.codigoPlaza || 'S/N'}
                  </span>
                </div>
                <div>
                  <span className="text-emerald-800/80 block">Motivo de Plaza:</span>
                  <span className="font-semibold text-emerald-950">
                    {persona.motivoPlaza || trabajador?.motivoPlaza || 'Orgánica'}
                  </span>
                </div>
                <div>
                  <span className="text-emerald-800/80 block">Cargo Institucional:</span>
                  <span className="font-semibold text-emerald-950">
                    {persona.cargo || trabajador?.cargo || 'Docente'}
                  </span>
                </div>
                <div>
                  <span className="text-emerald-800/80 block">Condición Laboral:</span>
                  <span className="font-semibold text-emerald-950">
                    {persona.condicion || trabajador?.condicion || 'Nombrado'}
                  </span>
                </div>
                <div>
                  <span className="text-emerald-800/80 block">Escala / Régimen:</span>
                  <span className="font-semibold text-emerald-950">
                    {persona.escalaRegimen || trabajador?.escalaRegimen || 'Ley N° 30512'}
                  </span>
                </div>
                <div>
                  <span className="text-emerald-800/80 block">Especialidad / Título:</span>
                  <span className="font-semibold text-emerald-950">
                    {persona.tituloEspecialidad || trabajador?.tituloEspecialidad || 'Especialista Técnico'}
                  </span>
                </div>
                <div className="sm:col-span-3">
                  <span className="text-emerald-800/80 block">R.D. Nombramiento / Contrato:</span>
                  <span className="font-mono font-semibold text-emerald-950">
                    {persona.rdNombramientoContrato || trabajador?.rdNombramientoContrato || 'En trámite institucional'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Section: Perfil Apoderado */}
          {(persona.rolPrimario === 'APODERADO' || persona.estudianteAsociadoId || persona.parentesco) && (
            <div className="bg-purple-50/70 p-4 rounded-xl border border-purple-200 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-purple-950 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-purple-700" />
                  Perfil de Apoderado
                </h4>
                <Badge variant="purple" size="sm">Apoderado</Badge>
              </div>

              <div className="grid grid-cols-2 gap-2.5 text-[11px]">
                <div>
                  <span className="text-purple-800/80 block">Estudiante a Cargo:</span>
                  <span className="font-bold text-purple-950">
                    {associatedPersona
                      ? `${associatedPersona.apellidoPaterno} ${associatedPersona.apellidoMaterno}, ${associatedPersona.nombres} (DNI ${associatedPersona.numeroDocumento})`
                      : 'Estudiante vinculado'}
                  </span>
                </div>
                <div>
                  <span className="text-purple-800/80 block">Parentesco:</span>
                  <span className="font-bold text-purple-950">
                    {persona.parentesco || 'Padre / Madre / Familiar'}
                  </span>
                </div>
                <div>
                  <span className="text-purple-800/80 block">¿Es Apoderado Principal?:</span>
                  <span className="font-semibold text-purple-950">
                    {persona.esApoderadoPrincipal ? 'Sí' : 'No'}
                  </span>
                </div>
                <div>
                  <span className="text-purple-800/80 block">¿Vive con el Estudiante?:</span>
                  <span className="font-semibold text-purple-950">
                    {persona.viveConEstudiante ? 'Sí' : 'No'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Section: Perfil Egresado */}
          {(persona.rolPrimario === 'EGRESADO' || persona.fechaEgreso || persona.numeroRegistroTitulo) && (
            <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-amber-950 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-700" />
                  Perfil de Egresado
                </h4>
                <Badge variant="warning" size="sm">Egresado</Badge>
              </div>

              <div className="grid grid-cols-2 gap-2.5 text-[11px]">
                <div>
                  <span className="text-amber-800/80 block">Programa de Egreso:</span>
                  <span className="font-bold text-amber-950">
                    {egresadoPrograma?.nombre || 'Programa Profesional'}
                  </span>
                </div>
                <div>
                  <span className="text-amber-800/80 block">Fecha de Egreso:</span>
                  <span className="font-semibold text-amber-950 font-mono">
                    {persona.fechaEgreso || '2024-12-20'}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-amber-800/80 block">N° de Registro de Título / Acta:</span>
                  <span className="font-bold text-amber-950 font-mono">
                    {persona.numeroRegistroTitulo || 'TIT-2024-0091'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Section: Observaciones */}
          {persona.observaciones && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5 text-xs">
              <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-600" />
                Observaciones
              </h4>
              <p className="text-slate-700 leading-relaxed italic">{persona.observaciones}</p>
            </div>
          )}

          {/* Treasury / Payments History */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Receipt className="w-4 h-4 text-slate-600" />
              Historial de Pagos y Recibos ({pagosPersona.length})
            </h4>

            {pagosPersona.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No registra pagos en el sistema de tesorería.</p>
            ) : (
              <div className="space-y-2">
                {pagosPersona.map((pago) => (
                  <div
                    key={pago.id}
                    className="p-2.5 rounded-lg border border-slate-200 bg-white flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-mono font-bold text-slate-900">{pago.numeroRecibo}</div>
                      <div className="text-[11px] text-slate-500">{pago.conceptoNombre}</div>
                      <div className="text-[10px] text-slate-400">{pago.fechaEmision} • {pago.metodoPago}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-slate-900 font-mono">S/ {pago.monto.toFixed(2)}</div>
                      <Badge variant={pago.estado === 'Emitido' ? 'success' : 'danger'} size="sm">
                        {pago.estado}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            onClick={() => onEdit(persona)}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Editar Información</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Cerrar Ficha
          </button>
        </div>
      </div>
    </div>
  );
};
