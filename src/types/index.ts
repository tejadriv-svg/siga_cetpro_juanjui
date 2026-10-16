export type RolSistema =
  | 'DIRECTOR'
  | 'ADMINISTRADOR'
  | 'SECRETARIO_ACADEMICO'
  | 'DOCENTE'
  | 'TRABAJADOR'
  | 'TESORERO'
  | 'COORDINADOR_TALLER'
  | 'ESTUDIANTE';

export type PermisoModulo =
  | 'ACERVO'
  | 'CERTIFICACION'
  | 'DASHBOARD'
  | 'EVALUACION'
  | 'HORARIOS'
  | 'INVENTARIO'
  | 'MATRICULA'
  | 'PADRON'
  | 'PROGRAMAS'
  | 'SISTEMA'
  | 'TESORERIA';

export type PermisoAccion =
  | 'VER'
  | 'REGISTRAR'
  | 'GESTIONAR'
  | 'EMITIR'
  | 'TITULOS'
  | 'ASISTENCIA'
  | 'CERRAR'
  | 'MOVER'
  | 'BAJA'
  | 'CREAR'
  | 'EDITAR'
  | 'ANULAR'
  | 'EXPORTAR'
  | 'ELIMINAR'
  | 'USUARIOS'
  | 'INSTITUCION'
  | 'AUDITORIA'
  | 'COBRAR'
  | 'REPORTES';

export interface PermisoSistema {
  id: string;
  codigo: string;
  nombre: string;
  modulo: PermisoModulo;
  accion: PermisoAccion;
  descripcion?: string;
}

export const ROLE_PERMISSIONS_MATRIX: Record<RolSistema, string[]> = {
  DIRECTOR: [
    'ACERVO:VER', 'ACERVO:REGISTRAR', 'ACERVO:GESTIONAR',
    'CERTIFICACION:VER', 'CERTIFICACION:EMITIR', 'CERTIFICACION:TITULOS',
    'DASHBOARD:VER',
    'EVALUACION:VER', 'EVALUACION:REGISTRAR', 'EVALUACION:ASISTENCIA', 'EVALUACION:CERRAR',
    'HORARIOS:VER', 'HORARIOS:GESTIONAR',
    'INVENTARIO:VER', 'INVENTARIO:REGISTRAR', 'INVENTARIO:MOVER', 'INVENTARIO:BAJA',
    'MATRICULA:VER', 'MATRICULA:CREAR', 'MATRICULA:EDITAR', 'MATRICULA:ANULAR', 'MATRICULA:EXPORTAR',
    'PADRON:VER', 'PADRON:CREAR', 'PADRON:EDITAR', 'PADRON:ELIMINAR',
    'PROGRAMAS:VER', 'PROGRAMAS:GESTIONAR',
    'SISTEMA:USUARIOS', 'SISTEMA:INSTITUCION', 'SISTEMA:AUDITORIA',
    'TESORERIA:VER', 'TESORERIA:COBRAR', 'TESORERIA:ANULAR', 'TESORERIA:REPORTES'
  ],
  ADMINISTRADOR: [
    'ACERVO:VER', 'ACERVO:REGISTRAR', 'ACERVO:GESTIONAR',
    'CERTIFICACION:VER', 'CERTIFICACION:EMITIR', 'CERTIFICACION:TITULOS',
    'DASHBOARD:VER',
    'EVALUACION:VER', 'EVALUACION:REGISTRAR', 'EVALUACION:ASISTENCIA', 'EVALUACION:CERRAR',
    'HORARIOS:VER', 'HORARIOS:GESTIONAR',
    'INVENTARIO:VER', 'INVENTARIO:REGISTRAR', 'INVENTARIO:MOVER', 'INVENTARIO:BAJA',
    'MATRICULA:VER', 'MATRICULA:CREAR', 'MATRICULA:EDITAR', 'MATRICULA:ANULAR', 'MATRICULA:EXPORTAR',
    'PADRON:VER', 'PADRON:CREAR', 'PADRON:EDITAR', 'PADRON:ELIMINAR',
    'PROGRAMAS:VER', 'PROGRAMAS:GESTIONAR',
    'SISTEMA:USUARIOS', 'SISTEMA:INSTITUCION', 'SISTEMA:AUDITORIA',
    'TESORERIA:VER', 'TESORERIA:COBRAR', 'TESORERIA:ANULAR', 'TESORERIA:REPORTES'
  ],
  SECRETARIO_ACADEMICO: [
    'ACERVO:VER', 'ACERVO:REGISTRAR', 'ACERVO:GESTIONAR',
    'CERTIFICACION:VER', 'CERTIFICACION:EMITIR', 'CERTIFICACION:TITULOS',
    'DASHBOARD:VER',
    'EVALUACION:VER', 'EVALUACION:CERRAR',
    'HORARIOS:VER', 'HORARIOS:GESTIONAR',
    'MATRICULA:VER', 'MATRICULA:CREAR', 'MATRICULA:EDITAR', 'MATRICULA:ANULAR', 'MATRICULA:EXPORTAR',
    'PADRON:VER', 'PADRON:CREAR', 'PADRON:EDITAR',
    'PROGRAMAS:VER',
    'TESORERIA:VER', 'TESORERIA:COBRAR', 'TESORERIA:ANULAR', 'TESORERIA:REPORTES'
  ],
  DOCENTE: [
    'DASHBOARD:VER',
    'EVALUACION:VER', 'EVALUACION:REGISTRAR', 'EVALUACION:ASISTENCIA',
    'HORARIOS:VER', 'HORARIOS:GESTIONAR',
    'MATRICULA:VER',
    'PADRON:VER',
    'PROGRAMAS:VER'
  ],
  TRABAJADOR: [
    'DASHBOARD:VER',
    'EVALUACION:VER', 'EVALUACION:REGISTRAR', 'EVALUACION:ASISTENCIA',
    'HORARIOS:VER', 'HORARIOS:GESTIONAR',
    'MATRICULA:VER',
    'PADRON:VER',
    'PROGRAMAS:VER'
  ],
  TESORERO: [
    'DASHBOARD:VER',
    'MATRICULA:VER',
    'PADRON:VER',
    'TESORERIA:VER', 'TESORERIA:COBRAR', 'TESORERIA:ANULAR', 'TESORERIA:REPORTES'
  ],
  COORDINADOR_TALLER: [
    'DASHBOARD:VER',
    'EVALUACION:VER',
    'HORARIOS:VER',
    'INVENTARIO:VER', 'INVENTARIO:REGISTRAR', 'INVENTARIO:MOVER', 'INVENTARIO:BAJA',
    'MATRICULA:VER', 'MATRICULA:CREAR', 'MATRICULA:EDITAR',
    'PROGRAMAS:VER'
  ],
  ESTUDIANTE: [
    'DASHBOARD:VER',
    'EVALUACION:VER',
    'HORARIOS:VER',
    'MATRICULA:VER',
    'PROGRAMAS:VER'
  ]
};


export interface InstitucionInfo {
  nombre: string;
  tipoGestion: string;
  codigoModular: string;
  codigoLocal: string;
  ruc: string;
  dre: string;
  ugel: string;
  direccion: string;
  distrito: string;
  provincia: string;
  region: string;
  telefono: string;
  correo: string;
  director: string;
  secretarioAcademico: string;
  cuentaBancariaBN?: string;
  logoUrl?: string;
}

export type TipoDocumento = 'DNI' | 'Carnet de Extranjería' | 'Pasaporte';
export type Genero = 'H' | 'M' | 'F'; // Keeping F temporarily just in case

export type OperadorTelefonico = 'Movistar' | 'Claro' | 'Entel' | 'Bitel' | 'Otro';

export const OPERADORES_TELEFONICOS: OperadorTelefonico[] = [
  'Movistar',
  'Claro',
  'Entel',
  'Bitel',
  'Otro'
];

export type TipoDiscapacidad =
  | 'Intelectual leve'
  | 'Intelectual moderada'
  | 'Intelectual severa'
  | 'Auditiva hipoacusia'
  | 'Auditiva sordera'
  | 'Visual baja visión'
  | 'Visual ceguera'
  | 'Físico Motora'
  | 'Trastorno del espectro autista'
  | 'Sordo ceguera'
  | 'Multidiscapacidad'
  | 'Otra discapacidad';

export const TIPOS_DISCAPACIDAD: TipoDiscapacidad[] = [
  'Intelectual leve',
  'Intelectual moderada',
  'Intelectual severa',
  'Auditiva hipoacusia',
  'Auditiva sordera',
  'Visual baja visión',
  'Visual ceguera',
  'Físico Motora',
  'Trastorno del espectro autista',
  'Sordo ceguera',
  'Multidiscapacidad',
  'Otra discapacidad'
];

export type RolPersona =
  | 'ESTUDIANTE'
  | 'DOCENTE'
  | 'ADMINISTRATIVO'
  | 'DIRECTIVO'
  | 'APODERADO'
  | 'EGRESADO'
  | 'TRABAJADOR';

export const ROLES_PERSONA = [
  { codigo: 'ESTUDIANTE', label: 'Estudiante' },
  { codigo: 'DOCENTE', label: 'Docente' },
  { codigo: 'ADMINISTRATIVO', label: 'Administrativo' },
  { codigo: 'DIRECTIVO', label: 'Directivo' },
  { codigo: 'APODERADO', label: 'Apoderado' },
  { codigo: 'EGRESADO', label: 'Egresado' },
] as const;

export interface Persona {
  id: string;
  tipoDocumento: TipoDocumento;
  numeroDocumento: string;
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  fechaNacimiento: string;
  sexo: Genero;
  genero?: Genero | string;
  telefono: string;
  correo: string;
  direccion: string;
  nivelEducativo?: string;
  cargaFamiliar?: number;
  internetCasa?: boolean;
  equipoClasesVirtuales?: string;
  operadorTelefonico?: OperadorTelefonico | string;
  discapacidad?: boolean;
  tipoDiscapacidad?: TipoDiscapacidad | string;
  fotoUrl?: string;
  observaciones?: string;
  esEstudiante: boolean;
  esTrabajador: boolean;
  rolPrimario?: RolPersona;
  createdAt: string;
  // Estudiante fields
  codigoEstudiante?: string;
  trabaja?: boolean;
  ieProcedencia?: string;
  puestoTrabajo?: string;
  lugarNacimiento?: string;
  distritoNacimiento?: string;
  provinciaNacimiento?: string;
  regionNacimiento?: string;
  paisNacimiento?: string;
  telefonoContacto?: string;
  lenguaOriginaria?: string;
  // Apoderado fields
  estudianteAsociadoId?: string;
  parentesco?: string;
  esApoderadoPrincipal?: boolean;
  viveConEstudiante?: boolean;

  // Egresado fields
  matriculaId?: string;
  programaId?: string;
  planEstudioId?: string;
  fechaEgreso?: string;
  numeroRegistroTitulo?: string;
  observacionesEgresado?: string;

  // Trabajador fields
  codigoPlaza?: string;
  motivoPlaza?: string;
  cargo?: string;
  condicion?: string;
  escalaRegimen?: string;
  tituloEspecialidad?: string;
  rdNombramientoContrato?: string;
  estado?: string;
}

export type EstadoEstudiante = 'Regular' | 'Egresado' | 'Titulado' | 'Retirado' | 'Reserva' | 'Trasladado';

export interface Estudiante {
  id: string;
  personaId: string;
  codigoEstudiante?: string;
  trabaja?: boolean;
  puestoTrabajo?: string;
  lugarNacimiento?: string;
  distritoNacimiento?: string;
  provinciaNacimiento?: string;
  regionNacimiento?: string;
  paisNacimiento?: string;
  telefonoContacto?: string;
  lenguaOriginaria?: string;
  
  // Legacy fields (optional for compatibility if needed elsewhere temporarily)
  programaId?: string;
  anioIngreso?: number;
  periodoIngreso?: string;
  contactoEmergencia?: {
    nombre: string;
    parentesco: string;
    telefono: string;
  };
  observaciones?: string;
}

export interface Trabajador {
  id: string;
  personaId: string;
  codigoPlaza?: string;
  motivoPlaza?: string;
  cargo?: string;
  condicion?: string;
  escalaRegimen?: string;
  tituloEspecialidad?: string;
  rdNombramientoContrato?: string;
  estado?: string;
}

export type NivelFormativo = 'Auxiliar Técnico' | 'Técnico';

export interface ProgramaEstudio {
  id: string;
  codigo: string;
  nombre: string;
  nivelFormativo: NivelFormativo;
  totalHoras: number;
  totalCreditos: number;
  resolucionAutorizacion: string;
  descripcion: string;
  icono: string;
  color: string;
  tallerResponsable: string;
  modulosCount: number;
  archivoUrl?: string | null;
  estado?: string;
}

export interface ModuloFormativo {
  id: string;
  programaId: string;
  codigo: string;
  nombre: string;
  descripcion?: string;
  orden: number;
  horas: number;
  creditos: number;
  totalHoras?: number;
  totalCreditos?: number;
  horasTeoria?: number;
  horasPractica?: number;
  horasEFSRT?: number;
  creditosEFSRT?: number;
}

export interface UnidadDidactica {
  id: string;
  moduloId: string;
  codigo: string;
  nombre: string;
  descripcion?: string;
  tipo: 'Específica' | 'Empleabilidad';
  horas: number;
  creditos: number;
  semestre: string;
  orden?: number;
}

export interface SeccionUnidad {
  id: string;
  seccionId: string;
  unidadId: string;
  docenteId?: string | null;
  fechaInicio: string;
  fechaFin: string;
  horas?: number;
  creditos?: number;
  estado: 'PROGRAMADA' | 'EN_CURSO' | 'FINALIZADA';
  observaciones?: string | null;
  fechaRegistro?: string;
  fechaActualizacion?: string;
  // Campos decorativos para interfaz
  unidad?: UnidadDidactica;
  docenteNombre?: string;
}

export interface Sede {
  id: string;
  codigo: string;
  nombre: string;
  direccion?: string;
  departamento?: string;
  provincia?: string;
  distrito?: string;
}

export interface Aula {
  id: string;
  sedeId: string;
  codigo: string;
  nombre: string;
  tipoAmbiente: string;
  capacidad: number;
}

export interface PeriodoLectivo {
  id: string;
  cetproId: string;
  codigo: string;
  nombre: string;
  fechaInicio: string;
  fechaFin: string;
  estado?: string;
}

export interface Turno {
  id: string;
  codigo: string;
  nombre: string;
  horaInicioReferencial?: string;
  horaFinReferencial?: string;
  estado?: string;
}

export interface Horario {
  id: string;
  seccionId: string;
  asignacionDocenteId?: string | null;
  aulaId?: string | null;
  diaSemana: number; // 1: Lunes, 2: Martes, 3: Miércoles, 4: Jueves, 5: Viernes, 6: Sábado, 7: Domingo
  horaInicio: string;
  horaFin: string;
  aulaNombre?: string;
}

export interface PeriodoClases {
  id: string;
  periodoAcademicoId: string;
  codigo: string;
  nombre: string;
  fechaInicio: string;
  fechaFin: string;
}

export interface PeriodoAcademico {
  id: string;
  periodoLectivoId?: string;
  codigo: string;
  nombre: string;
  fechaInicio: string;
  fechaFin: string;
  estado?: string;
}

export interface Seccion {
  id: string;
  codigo?: string;
  moduloId: string;
  planEstudioId?: string;
  periodoClasesId?: string;
  sedeId?: string;
  aulaId?: string;
  turnoId?: string;
  modalidadEducativa?: string;
  trabajadorId: string;
  periodoAcademico: string;
  nombre: string; // ej. "Sección A"
  turno: 'Mañana' | 'Tarde' | 'Noche' | string;
  aula: string;
  sedeNombre?: string;
  vacantes: number;
  capacidad?: number;
  matriculados: number;
  estado?: 'Activo' | 'Inactivo' | 'ACTIVO' | 'INACTIVO' | string;
}

export type TipoMatricula = 'Regular' | 'Extemporánea' | 'Reingreso' | 'Convalidación';

export type TipoBeneficioArancelario =
  | 'REGULAR'
  | 'CONVENIO'
  | 'BECA_COMPLETA'
  | 'SEMIBECA'
  | 'EXONERADO'
  | 'CASO_SOCIAL';

export interface Matricula {
  id: string;
  codigoMatricula: string;
  estudianteId: string;
  programaId?: string;
  condicion?: string;
  moduloId: string;
  seccionId: string;
  sedeId?: string;
  periodoAcademicoId?: string;
  periodoAcademico: string;
  tipo: TipoMatricula;
  fechaMatricula: string;
  reciboPagoId?: string;
  estadoMatricula?: string;
  formacion?: string;
  oportunidadTecnica?: string;
  condicionArancelaria?: TipoBeneficioArancelario;
  convenioNombre?: string;
  resolucionSustento?: string;
  montoPactado?: number;
  porcentajeDescuento?: number;
}

export type TipoRetiro = 'VOLUNTARIO' | 'POR_INASISTENCIAS' | 'RESERVA';

export interface Retiro {
  id: string;
  matriculaId: string;
  fechaRetiro: string;
  motivo: string;
  tipoRetiro: TipoRetiro | string;
  numeroDocumentoSustento?: string;
  documentoId?: string;
  observaciones?: string;
  usuarioId?: string;
}

export type TipoTraslado = 'INTERNO_SECCION' | 'INTERNO_PROGRAMA' | 'EXTERNO_SALIDA' | 'EXTERNO_INGRESO';
export type EstadoTraslado = 'SOLICITADO' | 'APROBADO' | 'RECHAZADO';

export interface Traslado {
  id: string;
  matriculaOrigenId: string;
  tipoTraslado: TipoTraslado | string;
  sedeDestinoId?: string;
  programaDestinoId?: string;
  planEstudioDestinoId?: string;
  moduloDestinoId?: string;
  seccionDestinoId?: string;
  institucionDestino?: string;
  institucionOrigen?: string;
  estado: EstadoTraslado | string;
  matriculaDestinoId?: string;
  resolucionDirectoral?: string;
  fechaSolicitud: string;
  fechaAprobacion?: string;
  motivo?: string;
  observaciones?: string;
  usuarioId?: string;
}

export interface Reingreso {
  id: string;
  estudianteId: string;
  matriculaAnteriorId?: string;
  nuevaMatriculaId: string;
  fecha: string;
  motivo?: string;
  observaciones?: string;
  usuarioId?: string;
  periodoAcademicoReingresoId?: string;
  resolucionNumero?: string;
  requiereConvalidacion?: boolean;
}

export type EstadoNotaUnidad = 'PENDIENTE' | 'APROBADO' | 'DESAPROBADO' | 'RECUPERACION' | 'CONVALIDADO' | 'RETIRADO' | 'Activa';

export interface NotaUnidad {
  id: string;
  matriculaId: string;
  estudianteId: string;
  unidadDidacticaId: string;
  c1?: number; // Capacidad 1 (0-20)
  c2?: number; // Capacidad 2
  c3?: number; // Capacidad 3
  i1: number; // Capacidad 1 (0-20) - compatibilidad
  i2: number; // Capacidad 2 - compatibilidad
  i3: number; // Capacidad 3 - compatibilidad
  promedioFinal: number; // >= 13 Aprobado (MINEDU)
  recuperacion?: number;
  estado?: EstadoNotaUnidad | string;
  criteriosDetalle?: any;
  conclusionDescriptiva?: string;
  observaciones?: string;
  bloqueado?: boolean;
  fechaCierre?: string | null;
  fechaRegistro: string;
  fechaActualizacion?: string;
  usuarioId?: string | null;
}

export type ModalidadEFSRT = 'EMPRESA' | 'PROYECTO_CETPRO' | 'COMUNIDAD' | 'CONVALIDACION';
export type EstadoNotaEFSRT = 'APROBADO' | 'DESAPROBADO' | 'EN_EJECUCION';

export interface NotaEFSRT {
  id: string;
  matriculaId?: string;
  estudianteId: string;
  moduloId: string;
  efsrtId?: string;
  modalidad?: ModalidadEFSRT;
  empresaRuc?: string;
  empresaNombre?: string;
  empresaDireccion?: string;
  supervisorEmpresa?: string;
  supervisorEmpresaCargo?: string;
  trabajadorSupervisorId?: string;
  docenteSupervisorId?: string;
  horasCompletadas: number;
  dominioOperativo?: number;
  usoEquipos?: number;
  seguridadHigiene?: number;
  resolucionProblemas?: number;
  puntualidadAsistencia?: number;
  trabajoEquipo?: number;
  comunicacionAsertiva?: number;
  iniciativaAdaptabilidad?: number;
  notaVigesimal: number; // 0-20 (>=13 aprobado)
  fechaInicio?: string;
  fechaTermino?: string;
  numeroConstancia?: string;
  archivoConstanciaUrl?: string;
  constanciaUrl?: string;
  bloqueado?: boolean;
  fechaCierre?: string | null;
  fechaRegistro?: string;
  fechaActualizacion?: string;
  usuarioId?: string | null;
  estado?: EstadoNotaEFSRT | string;
}

export type CodigoEstadoAsistencia = 'PRES' | 'TARD' | 'FALT' | 'JUST';

export interface EstadoAsistencia {
  id: string;
  codigo: CodigoEstadoAsistencia | string;
  nombre: string;
  afectaPorcentaje: boolean;
}

export interface AsistenciaEstudiante {
  id: string;
  matriculaId: string;
  unidadId?: string;
  seccionId?: string;
  fecha: string; // YYYY-MM-DD
  estadoAsistenciaId: string;
  codigoEstado?: CodigoEstadoAsistencia | string;
  observacion?: string;
  usuarioId?: string;
}

export type EstadoAsistenciaTrabajador =
  | 'PRESENTE'
  | 'TARDANZA'
  | 'FALTA_INJUSTIFICADA'
  | 'FALTA_JUSTIFICADA'
  | 'PERMISO'
  | 'LICENCIA'
  | 'COMISION';

export type TipoRegistroAsistencia = 'MANUAL' | 'SISTEMA_DNI' | 'BIOMETRICO';

export interface AsistenciaTrabajador {
  id: string;
  trabajadorId: string;
  fecha: string; // YYYY-MM-DD
  horaEntrada?: string | null; // HH:mm:ss
  horaSalida?: string | null; // HH:mm:ss
  estadoAsistencia: EstadoAsistenciaTrabajador | string;
  observacion?: string | null;
  usuarioId?: string | null;
  minutosTardanza: number;
  tipoRegistro: TipoRegistroAsistencia | string;
  // Campos enriquecidos para vista
  nombres?: string;
  apellidoPaterno?: string;
  apellidoMaterno?: string;
  numeroDocumento?: string;
  cargo?: string;
  condicion?: string;
}

export interface ResumenMensualTrabajador {
  trabajadorId: string;
  nombres: string;
  apellidos: string;
  numeroDocumento: string;
  cargo: string;
  condicion: string;
  diasLaborados: number;
  tardanzas: number;
  minutosTardanza: number;
  faltasInjustificadas: number;
  faltasJustificadas: number;
  permisos: number;
  licencias: number;
  comisiones: number;
}

export type MetodoPago = 'Efectivo' | 'Yape / Plin' | 'Banco de la Nación';
export type EstadoPago = 'Pendiente' | 'Emitido' | 'Pagado' | 'Anulado';

export interface ConceptoPago {
  id: string;
  codigo: string;
  nombre: string;
  montoSugerido: number;
  montoFijo?: number;
  esMontoLibre?: boolean;
  estado?: 'Activo' | 'Inactivo';
  descripcion?: string;
  categoria: 'Matrícula' | 'Certificación' | 'Constancias' | 'Talleres' | 'Otros';
  aplicaMora: boolean;
}

export interface ReciboPago {
  id: string;
  numeroRecibo: string; // ej. REC-2025-00142
  personaId: string;
  matriculaId?: string;
  conceptoId: string;
  conceptoNombre: string;
  monto: number; // Monto cancelado en esta transacción
  montoTotal?: number; // Monto total del concepto
  montoPendiente?: number; // Saldo deudor pendiente
  numeroCuota?: number; // Ej: Cuota 1
  totalCuotas?: number; // Ej: de 2 cuotas
  fechaVencimiento?: string; // Fecha límite para siguiente cuota
  pagoPadreId?: string; // ID del compromiso/primer pago de la serie
  metodoPago: MetodoPago;
  numeroOperacion?: string;
  fechaEmision: string;
  horaEmision: string;
  fechaPago?: string;
  cajeroNombre: string;
  estado: EstadoPago;
  observaciones?: string;
  motivoAnulacion?: string;
  beneficioTipo?: TipoBeneficioArancelario;
  beneficioNombre?: string;
  montoOriginal?: number;
  montoDescuento?: number;
  porcentajeDescuento?: number;
  documentoSustento?: string;
  programaNombre?: string;
  moduloNombre?: string;
  periodoCodigo?: string;
  glosaDetalle?: string;
}

export interface CursoLibre {
  id: string;
  codigo: string;
  nombre: string;
  areaPrograma: string;
  trabajadorNombre: string;
  horas: number;
  costo: number;
  fechaInicio: string;
  fechaFin: string;
  horario: string;
  vacantes: number;
  inscritos: number;
  descripcion: string;
  requisitos: string;
}

export interface InscripcionCursoLibre {
  id: string;
  cursoId: string;
  personaId: string;
  fechaInscripcion: string;
  montoPagado: number;
  reciboId: string;
  notaFinal?: number;
  certificadoEmitido: boolean;
}

export type EstadoConservacion = 'Bueno / Operativo' | 'Regular' | 'En Mantenimiento' | 'De Baja';

export interface BienPatrimonial {
  id: string;
  codigoPatrimonial: string; // SBN code
  nombre: string;
  marca: string;
  modelo: string;
  serie: string;
  taller: string;
  ubicacion: string;
  estado: EstadoConservacion;
  fechaAdquisicion: string;
  valorEstimado: number;
  responsableNombre: string;
  ultimoMantenimiento?: string;
}

export type EstadoDocumento = 'BORRADOR' | 'EMITIDO' | 'FIRMADO' | 'ARCHIVADO' | 'ANULADO';
export type ConfidencialidadDocumento = 'PUBLICO' | 'INTERNO' | 'CONFIDENCIAL';

export type TipoDocumentoOficial =
  | 'Certificado Modular'
  | 'Constancia de Estudios'
  | 'Ficha de Matrícula'
  | 'Acta Consolidada'
  | 'Resolución Directoral'
  | 'Constancia de Egresado'
  | 'Convenio Institucional'
  | 'Proyecto Curricular (PCI)'
  | 'Plan Anual de Trabajo (PAT)'
  | 'Oficio / Memorándum';

export interface DocumentoOficial {
  id: string;
  tipoDocumentoId?: string;
  tipo: TipoDocumentoOficial;
  numeroDocumento: string; // ej. CERT-MOD-2025-0089, RD-0245-2018
  titulo?: string;
  estudianteId?: string;
  trabajadorId?: string;
  programaId?: string;
  moduloId?: string;
  periodoAcademicoId?: string;
  periodoAcademico?: string;
  fechaEmision: string;
  estado?: EstadoDocumento;
  confidencialidad?: ConfidencialidadDocumento;
  destinatario?: string;
  codigoVerificacionQR?: string;
  codigoVerificacionQr?: string;
  tomoFolio?: string;
  entidadEmisora?: string;
  archivoUrl?: string;
  nombreArchivo?: string;
  rutaStorage?: string;
  mimeType?: string;
  tamanoBytes?: number;
  hashArchivo?: string;
  observaciones?: string;
}

export interface UsuarioSistema {
  id: string;
  personaId?: string;
  username?: string;
  email: string;
  nombreCompleto: string;
  rol: RolSistema;
  rolNombre?: string;
  cargo: string;
  avatar: string;
  activo: boolean;
  ultimoAcceso: string;
}

export interface AuditoriaLog {
  id: string;
  timestamp: string;
  fecha?: string;
  usuarioId?: string;
  usuarioNombre: string;
  usuarioRol?: string;
  rol?: RolSistema;
  accion: string;
  entidad: string;
  tabla?: string;
  registroId?: string;
  detalle?: string;
  detalles?: string;
  datosAnteriores?: any;
  datosNuevos?: any;
  ip: string;
  userAgent?: string;
}

export interface MetaPrograma {
  programaNombre: string;
  nivel: NivelFormativo;
  metaMatricula: number;
  matriculadosActuales: number;
  hombres: number;
  mujeres: number;
  metaEgreso: number;
  egresadosActuales: number;
}

export interface HorarioDetalle {
  horario_id: string;
  periodo_codigo: string;
  seccion_id: string;
  seccion_codigo: string;
  seccion_nombre: string;
  modulo_nombre: string;
  turno_codigo: string;
  turno_nombre: string;
  dia_semana: number;
  dia_nombre: string;
  hora_inicio: string;
  hora_fin: string;
  minutos_sesion: number;
  horas_pedagogicas: number;
  unidad_id?: string;
  unidad_codigo?: string;
  unidad_nombre?: string;
  tipo_unidad: 'Técnica' | 'Empleabilidad';
  docente_nombre?: string;
  aula_codigo?: string;
  aula_nombre?: string;
}

// Tipos oficiales para el módulo Egresados, Titulación y Seguimiento Laboral
export type EstadoTramiteEgresado = 
  | 'EGRESADO'
  | 'EXPEDIENTADO'
  | 'EN_TRAMITE_TITULACION'
  | 'TITULADO'
  | 'OBSERVADO';

export type ModalidadTitulacion = 
  | 'TRABAJO_APLICACION_PROFESIONAL'
  | 'EXAMEN_SUFICIENCIA_PROFESIONAL'
  | 'EXPERIENCIA_LABORAL_EXTRAORDINARIA';

export type ResultadoSustentacion = 
  | 'APROBADO_UNANIMIDAD'
  | 'APROBADO_MAYORIA'
  | 'DESAPROBADO';

export type SituacionLaboralEgresado = 
  | 'TRABAJANDO_EN_ESPECIALIDAD'
  | 'TRABAJANDO_OTRA_AREA'
  | 'EMPRENDIMIENTO_PROPIO'
  | 'BUSCANDO_EMPLEO'
  | 'ESTUDIANDO_SUPERIOR'
  | 'NO_DISPONIBLE';

export interface EgresadoDetallado {
  id: string;
  estudianteId: string;
  programaId: string;
  planEstudioId: string;
  matriculaId?: string;
  codigoEgresado: string;
  fechaEgreso: string;
  estadoTramite: EstadoTramiteEgresado;
  totalCreditosAprobados?: number;
  totalHorasAcumuladas?: number;
  resolucionDirectoral?: string;
  tomoFolio?: string;
  codigoVerificacionQr?: string;
  hashSeguridad?: string;

  // Titulación
  modalidadTitulacion?: ModalidadTitulacion;
  fechaSustentacion?: string;
  calificacionTitulacion?: number;
  resultadoSustentacion?: ResultadoSustentacion;
  juradoCalificador?: string;
  numeroTitulo?: string;
  numeroRegistroTitulo?: string;
  fechaEmisionTitulo?: string;

  // Inserción laboral
  situacionLaboral: SituacionLaboralEgresado;
  empresaActual?: string;
  rucEmpresa?: string;
  cargoActual?: string;
  ingresoMensualAprox?: string;
  telefonoActual?: string;
  emailActual?: string;
  fechaActualizacionLaboral?: string;

  observaciones?: string;

  // Cruces relacionales para la UI
  personaDni?: string;
  personaNombres?: string;
  personaApellidoPaterno?: string;
  personaApellidoMaterno?: string;
  personaTelefono?: string;
  personaEmail?: string;
  programaNombre?: string;
  programaCodigo?: string;
  nivelFormativo?: string;
}

// Tipos oficiales para Certificados Modulares (R.V.M. N° 188-2020-MINEDU)
export type EstadoCertificadoModular = 
  | 'BORRADOR' 
  | 'EMITIDO' 
  | 'FIRMADO' 
  | 'ENTREGADO' 
  | 'ANULADO';

export interface DetalleCalificacionModular {
  codigo: string;
  nombre: string;
  tipo: string;
  horas: number;
  creditos: number;
  nota: number;
}

export interface CertificadoModularDetallado {
  id: string;
  estudianteId: string;
  moduloId: string;
  programaId?: string;
  matriculaId?: string;
  numeroCertificado: string; // ej. CERT-MOD-2026-0001
  codigoCertificado?: string; // ej. CM-2026-0001
  fechaEmision: string;
  horasModulo?: number;
  creditosModulo?: number;
  promedioUnidades?: number;
  notaEfsrt?: number;
  promedioFinal?: number;
  detalleCalificaciones?: DetalleCalificacionModular[];
  resolucionDirectoral?: string;
  tomoFolio?: string;
  codigoVerificacionQr?: string;
  hashSeguridad?: string;
  estado: EstadoCertificadoModular;
  fechaEntrega?: string;
  documentoId?: string;
  observaciones?: string;
  usuarioId?: string;
  fechaRegistro?: string;
  fechaActualizacion?: string;

  // Cruces relacionales para la UI y Certificado Oficial
  personaDni?: string;
  personaNombres?: string;
  personaApellidoPaterno?: string;
  personaApellidoMaterno?: string;
  estudianteCodigo?: string;
  moduloNombre?: string;
  moduloCodigo?: string;
  moduloOrden?: number;
  programaNombre?: string;
  programaCodigo?: string;
  nivelFormativo?: string;
  periodoNombre?: string;
}

export interface AptoCertificadoModular {
  estudiante_id: string;
  modulo_id: string;
  programa_id: string;
  matricula_id: string;
  persona_dni: string;
  persona_nombres: string;
  persona_apellido_paterno: string;
  persona_apellido_materno: string;
  estudiante_codigo: string;
  modulo_nombre: string;
  modulo_codigo: string;
  modulo_horas: number;
  modulo_creditos: number;
  programa_nombre: string;
  programa_codigo: string;
  nivel_formativo: string;
  unidades_totales: number;
  total_unidades_cursadas: number;
  unidades_aprobadas: number;
  promedio_unidades: number;
  nota_efsrt: number;
  promedio_final: number;
  cumple_requisitos: boolean;
  ya_certificado: boolean;
  certificado_id?: string;
  codigo_certificado?: string;
  estado_certificado?: EstadoCertificadoModular;
}

// Tipos oficiales para Certificados de Estudios (R.V.M. N° 188-2020 / R.V.M. N° 277-2019)
export type TipoCertificadoEstudio = 'COMPLETO' | 'PARCIAL';

export type EstadoCertificadoEstudio = 
  | 'BORRADOR' 
  | 'EMITIDO' 
  | 'FIRMADO' 
  | 'ENTREGADO' 
  | 'ANULADO';

export interface UnidadCalificacionEstudio {
  modulo: string;
  codigo: string;
  nombre: string;
  tipo: string;
  horas: number;
  creditos: number;
  nota: number;
  condicion: 'APROBADO' | 'DESAPROBADO' | 'CONVALIDADO';
}

export interface EfsrtCalificacionEstudio {
  modulo: string;
  horas: number;
  nota: number;
  modalidad: string;
}

export interface DetalleCalificacionesEstudio {
  unidades: UnidadCalificacionEstudio[];
  efsrt: EfsrtCalificacionEstudio[];
}

export interface CertificadoEstudioDetallado {
  id: string;
  estudianteId: string;
  programaId: string;
  planEstudioId: string;
  numeroCertificado: string; // ej. CERT-EST-2026-0001
  codigoCertificado?: string; // ej. CE-2026-0001
  fechaEmision: string;
  tipoCertificado: TipoCertificadoEstudio;
  totalHorasAcumuladas?: number;
  totalCreditosAcumulados?: number;
  promedioPonderadoAcumulado?: number;
  detalleCalificaciones?: DetalleCalificacionesEstudio;
  motivoEmision?: string;
  resolucionDirectoral?: string;
  tomoFolio?: string;
  codigoVerificacionQr?: string;
  hashSeguridad?: string;
  estado: EstadoCertificadoEstudio;
  fechaEntrega?: string;
  documentoId?: string;
  observaciones?: string;
  usuarioId?: string;
  fechaRegistro?: string;
  fechaActualizacion?: string;

  // Relaciones
  personaDni?: string;
  personaNombres?: string;
  personaApellidoPaterno?: string;
  personaApellidoMaterno?: string;
  estudianteCodigo?: string;
  programaNombre?: string;
  programaCodigo?: string;
  nivelFormativo?: string;
  planEstudioNombre?: string;
}

// -------------------------------------------------------------
// Tipos oficiales para Titulación Profesional (R.V.M. N° 188-2020-MINEDU / ANEXOS 5A y 5B)
// -------------------------------------------------------------
export type EstadoTitulo = 
  | 'EN_TRAMITE' 
  | 'SUSTENTADO' 
  | 'EMITIDO' 
  | 'FIRMADO_CETPRO' 
  | 'VISADO_UGEL' 
  | 'REGISTRADO_MINEDU' 
  | 'ENTREGADO' 
  | 'ANULADO';

export type ModalidadTitulacionOficial = 
  | 'PROYECTO_APLICACION_PROFESIONAL' 
  | 'TRABAJO_APLICACION_PROFESIONAL'
  | 'EXAMEN_SUFICIENCIA_PROFESIONAL';

export type ResultadoSustentacionOficial = 
  | 'APROBADO_UNANIMIDAD' 
  | 'APROBADO_MAYORIA' 
  | 'DESAPROBADO';

export interface JuradoMiembro {
  nombre: string;
  dni: string;
  cargo: string;
  rol?: 'PRESIDENTE' | 'SECRETARIO' | 'VOCAL';
}

export interface JuradoCalificadorTitulacion {
  presidente: JuradoMiembro;
  secretario: JuradoMiembro;
  vocal: JuradoMiembro;
}

export interface TituloDetallado {
  id: string;
  estudianteId: string;
  egresadoId: string;
  programaId: string;
  planEstudioId: string;
  numeroTitulo?: string;
  codigoTitulo?: string; // ej. TIT-2026-0001
  codigoRegistroNacional?: string; // ej. MINEDU-TIT-2026-0001
  numeroActaSustentacion?: string; // ej. ACT-TIT-2026-0001
  denominacionTitulo: string; // ej. "TÉCNICO EN ESTILISMO"
  modalidadTitulacion: ModalidadTitulacionOficial;
  tituloProyecto?: string;
  fechaSustentacion?: string;
  horaSustentacion?: string;
  calificacion?: number;
  calificacionLetras?: string;
  resultadoSustentacion?: ResultadoSustentacionOficial;
  juradoCalificador?: JuradoCalificadorTitulacion;
  totalHorasAcumuladas?: number;
  totalCreditosAcumulados?: number;
  resolucionDirectoral?: string;
  libroRegistro?: string;
  tomoFolio?: string;
  codigoVerificacionQr?: string;
  hashSeguridad?: string;
  estado: EstadoTitulo;
  fechaEmision: string;
  fechaAprobacion?: string;
  fechaVisadoUgel?: string;
  fechaEntrega?: string;
  documentoId?: string;
  observaciones?: string;
  usuarioId?: string;
  fechaRegistro?: string;
  fechaActualizacion?: string;

  // Relaciones expandidas
  personaDni?: string;
  personaNombres?: string;
  personaApellidoPaterno?: string;
  personaApellidoMaterno?: string;
  estudianteCodigo?: string;
  codigoEgresado?: string;
  fechaEgreso?: string;
  programaNombre?: string;
  programaCodigo?: string;
  nivelFormativo?: string;
  planEstudioNombre?: string;
}

export interface AptoTitulacion {
  egresado_id: string;
  estudiante_id: string;
  programa_id: string;
  plan_estudio_id: string;
  persona_dni: string;
  persona_nombres: string;
  persona_apellido_paterno: string;
  persona_apellido_materno: string;
  estudiante_codigo: string;
  codigo_egresado: string;
  fecha_egreso: string;
  programa_nombre: string;
  programa_codigo: string;
  nivel_formativo: string;
  total_creditos_aprobados: number;
  total_horas_acumuladas: number;
  ya_titulado: boolean;
  titulo_id?: string;
  codigo_titulo?: string;
  estado_titulo?: EstadoTitulo;
}



