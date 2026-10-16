import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  RolSistema,
  PermisoModulo,
  PermisoAccion,
  ROLE_PERMISSIONS_MATRIX,
  InstitucionInfo,
  Persona,
  Estudiante,
  Trabajador,
  ProgramaEstudio,
  ModuloFormativo,
  UnidadDidactica,
  Seccion,
  Sede,
  Aula,
  Turno,
  PeriodoClases,
  PeriodoAcademico,
  PeriodoLectivo,
  Horario,
  Matricula,
  NotaUnidad,
  NotaEFSRT,
  ConceptoPago,
  ReciboPago,
  CursoLibre,
  InscripcionCursoLibre,
  BienPatrimonial,
  DocumentoOficial,
  UsuarioSistema,
  AuditoriaLog,
  MetaPrograma,
  AsistenciaEstudiante,
  EstadoAsistencia,
  AsistenciaTrabajador,
  ResumenMensualTrabajador,
  EgresadoDetallado,
  CertificadoModularDetallado,
  AptoCertificadoModular,
  CertificadoEstudioDetallado,
  TituloDetallado,
  AptoTitulacion,
} from '../types';
import {
  INSTITUCION_ACTUAL,
  PROGRAMAS_SEED,
  MODULOS_SEED,
  UNIDADES_SEED,
  PERSONAS_SEED,
  TRABAJADORS_SEED,
  ESTUDIANTES_SEED,
  SECCIONES_SEED,
  MATRICULAS_SEED,
  NOTAS_UNIDADES_SEED,
  NOTAS_EFSRT_SEED,
  CONCEPTOS_PAGO_SEED,
  RECIBOS_SEED,
  CURSOS_LIBRES_SEED,
  INSCRIPCIONES_CURSOS_SEED,
  BIENES_PATRIMONIALES_SEED,
  DOCUMENTOS_SEED,
  USUARIOS_SEED,
  AUDITORIA_SEED,
  METAS_PROGRAMAS_SEED,
} from '../data/initialData';
import { normalizeSexo } from '../utils/genero';

export type ViewType =
  | 'dashboard'
  | 'explorer'
  | 'importador'
  | 'padron'
  | 'estudiantes'
  | 'calificaciones'
  | 'tesoreria'
  | 'programas'
  | 'trabajadores'
  | 'asistencia-personal'
  | 'certificados'
  | 'formacion-continua'
  | 'inventario'
  | 'acervo'
  | 'documentos'
  | 'egresados'
  | 'reportes'
  | 'horarios'
  | 'auditoria'
  | 'configuracion';

export interface ToastMessage {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
}

interface AppContextType {
  // Navigation & Auth
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  refreshData: () => Promise<void>;
  refreshModularData: (targetView?: ViewType) => Promise<void>;
  isAutoSyncing: boolean;
  currentUser: UsuarioSistema;
  switchUser: (userId: string) => void;
  isAuthenticated: boolean;
  login: (username: string, password?: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  periodoActivo: string;
  setPeriodoActivo: (periodo: string) => void;
  hasPermission: (modulo: PermisoModulo, accion: PermisoAccion) => boolean;
  canAccessView: (view: ViewType, rol?: RolSistema) => boolean;
  userPermissions: string[];

  // Selected Entities for drawers
  selectedEstudianteId: string | null;
  setSelectedEstudianteId: (id: string | null) => void;
  selectedPersonaId: string | null;
  setSelectedPersonaId: (id: string | null) => void;

  // Data Collections
  institucion: InstitucionInfo;
  updateInstitucion: (info: Partial<InstitucionInfo>) => void;
  personas: Persona[];
  estudiantes: Estudiante[];
  trabajadores: Trabajador[];
  programas: ProgramaEstudio[];
  modulos: ModuloFormativo[];
  unidades: UnidadDidactica[];
  secciones: Seccion[];
  sedes: Sede[];
  aulas: Aula[];
  turnos: Turno[];
  periodosClases: PeriodoClases[];
  periodosAcademicos: PeriodoAcademico[];
  periodosLectivos: PeriodoLectivo[];
  horarios: Horario[];
  matriculas: Matricula[];
  notasUnidades: NotaUnidad[];
  notasEFSRT: NotaEFSRT[];
  conceptosPago: ConceptoPago[];
  recibos: ReciboPago[];
  estadosAsistencias: EstadoAsistencia[];
  asistencias: AsistenciaEstudiante[];
  cursosLibres: CursoLibre[];
  inscripcionesCursos: InscripcionCursoLibre[];
  bienesPatrimoniales: BienPatrimonial[];
  documentosOficiales: DocumentoOficial[];
  usuarios: UsuarioSistema[];
  auditoriaLogs: AuditoriaLog[];
  metasProgramas: MetaPrograma[];

  // Mutations
  addPersona: (persona: Omit<Persona, 'id' | 'createdAt'>) => Promise<Persona>;
  updatePersona: (persona: Persona) => Promise<void>;
  deletePersona: (id: string) => Promise<void>;
  addEstudiante: (est: Omit<Estudiante, 'id'>, personaData?: Omit<Persona, 'id' | 'createdAt'>) => Promise<Estudiante>;
  updateEstudiante: (est: Estudiante) => Promise<void>;
  deleteEstudiante: (id: string) => Promise<void>;
  vincularApoderado: (datos: {
    estudianteId: string;
    personaId?: string;
    dni: string;
    nombres: string;
    apellidoPaterno?: string;
    apellidoMaterno?: string;
    telefono?: string;
    parentesco: string;
    esApoderadoPrincipal: boolean;
    viveConEstudiante: boolean;
  }) => Promise<void>;
  addMatricula: (mat: Omit<Matricula, 'id' | 'codigoMatricula'>, cobro?: { monto: number; metodo: string }) => Promise<Matricula>;
  updateMatricula: (matriculaId: string, updates: Partial<Matricula>) => Promise<void>;
  deleteMatricula: (matriculaId: string) => Promise<void>;
  registrarRetiro: (data: {
    matriculaId: string;
    motivo: string;
    tipoRetiro?: string;
    numeroDocumentoSustento?: string;
    fechaRetiro?: string;
    observaciones?: string;
  }) => Promise<boolean>;
  registrarTraslado: (data: {
    matriculaOrigenId: string;
    tipoTraslado?: string;
    seccionDestinoId?: string;
    moduloDestinoId?: string;
    programaDestinoId?: string;
    planEstudioDestinoId?: string;
    sedeDestinoId?: string;
    institucionDestino?: string;
    institucionOrigen?: string;
    motivo?: string;
    resolucionDirectoral?: string;
    observaciones?: string;
  }) => Promise<boolean>;
  registrarReingreso: (data: {
    estudianteId: string;
    matriculaAnteriorId?: string;
    seccionId?: string;
    moduloId: string;
    sedeId?: string;
    periodoAcademicoId?: string;
    motivo?: string;
    resolucionNumero?: string;
    requiereConvalidacion?: boolean;
    observaciones?: string;
  }) => Promise<boolean>;
  fetchMovimientosEstudiante: (estudianteId: string) => Promise<{
    retiros: any[];
    traslados: any[];
    reingresos: any[];
  }>;
  saveNotasUnidad: (notas: NotaUnidad[]) => Promise<boolean>;
  cerrarActaUnidad: (unidadId: string) => Promise<boolean>;
  desbloquearActaUnidad: (unidadId: string, motivo?: string) => Promise<boolean>;
  saveNotaEFSRT: (nota: NotaEFSRT) => Promise<void>;
  saveNotasEFSRTBatch: (notas: NotaEFSRT[]) => Promise<boolean>;
  cerrarActaEFSRT: (moduloId: string, efsrtId?: string) => Promise<boolean>;
  desbloquearActaEFSRT: (moduloId: string, efsrtId?: string, motivo?: string) => Promise<boolean>;
  saveAsistenciasBatch: (data: {
    fecha: string;
    unidadId?: string;
    seccionId?: string;
    registros: { matriculaId: string; estadoAsistenciaId: string; observacion?: string }[];
  }) => Promise<boolean>;
  fetchAsistencias: (filtros?: { seccionId?: string; unidadId?: string; fecha?: string }) => Promise<AsistenciaEstudiante[]>;
  asistenciasTrabajadores: AsistenciaTrabajador[];
  fetchAsistenciasTrabajadores: (filtros?: { fecha?: string; mes?: number; anio?: number; trabajadorId?: string }) => Promise<AsistenciaTrabajador[]>;
  saveAsistenciasTrabajadoresBatch: (data: {
    fecha: string;
    registros: Array<{
      trabajadorId: string;
      horaEntrada?: string | null;
      horaSalida?: string | null;
      estadoAsistencia?: string;
      observacion?: string | null;
      minutosTardanza?: number;
      tipoRegistro?: string;
    }>;
    usuarioId?: string;
  }) => Promise<boolean>;
  marcarAsistenciaTrabajadorDni: (dni: string) => Promise<{
    success: boolean;
    tipo?: string;
    hora?: string;
    trabajador?: any;
    message: string;
    minutosTardanza?: number;
    estadoAsistencia?: string;
  }>;
  fetchReporteMensualPersonal: (mes: number, anio: number) => Promise<ResumenMensualTrabajador[]>;
  addRecibo: (recibo: Omit<ReciboPago, 'id' | 'numeroRecibo' | 'fechaEmision' | 'horaEmision' | 'cajeroNombre'> & { numeroRecibo?: string }) => Promise<ReciboPago>;
  anularRecibo: (reciboId: string, motivo?: string) => Promise<void>;
  deleteRecibo: (reciboId: string) => Promise<void>;
  updateConceptoPago: (id: string, data: Partial<ConceptoPago>) => Promise<boolean>;
  addConceptoPago: (data: Omit<ConceptoPago, 'id'>) => Promise<ConceptoPago | null>;
  refreshConceptosPago: () => Promise<void>;
  addCursoLibre: (curso: Omit<CursoLibre, 'id' | 'codigo' | 'inscritos'>) => CursoLibre;
  updateModulo: (id: string, updates: Partial<ModuloFormativo>) => Promise<void>;
  updatePrograma: (id: string, updates: Partial<ProgramaEstudio>) => Promise<void>;
  deleteCursoLibre: (id: string) => void;
  inscribirCursoLibre: (cursoId: string, personaId: string, monto: number, metodo: string) => Promise<void>;
  addBienPatrimonial: (bien: Omit<BienPatrimonial, 'id'>) => BienPatrimonial;
  updateBienPatrimonial: (bien: BienPatrimonial) => void;
  deleteBienPatrimonial: (id: string) => void;
  emitirDocumentoOficial: (doc: Omit<DocumentoOficial, 'id' | 'numeroDocumento' | 'codigoVerificacionQR' | 'fechaEmision'>) => Promise<DocumentoOficial>;
  addDocumentoAcervo: (doc: Omit<DocumentoOficial, 'id' | 'codigoVerificacionQR'>) => Promise<DocumentoOficial>;
  updateDocumentoOficial: (doc: DocumentoOficial) => Promise<void>;
  deleteDocumentoOficial: (id: string) => Promise<void>;
  uploadDocumentoArchivo: (file: File) => Promise<any>;
  addAuditoriaLog: (accion: string, entidad: string, detalle: string, datosAnteriores?: any, datosNuevos?: any, registroId?: string) => Promise<void>;
  refreshAuditorias: (filters?: any) => Promise<void>;
  addSeccion: (seccion: Omit<Seccion, 'id'>) => Promise<Seccion>;
  updateSeccion: (seccion: Seccion) => Promise<void>;
  deleteSeccion: (id: string) => Promise<void>;
  addPeriodoLectivo: (pl: Omit<PeriodoLectivo, 'id'>) => Promise<PeriodoLectivo>;
  updatePeriodoLectivo: (pl: PeriodoLectivo) => Promise<void>;
  activarPeriodoLectivo: (id: string) => Promise<boolean>;
  deletePeriodoLectivo: (id: string) => Promise<void>;
  addPeriodoAcademico: (pa: Omit<PeriodoAcademico, 'id'>) => Promise<PeriodoAcademico>;
  updatePeriodoAcademico: (pa: PeriodoAcademico) => Promise<void>;
  activarPeriodoAcademico: (id: string) => Promise<boolean>;
  deletePeriodoAcademico: (id: string) => Promise<void>;
  addPeriodoClases: (pc: Omit<PeriodoClases, 'id'>) => Promise<PeriodoClases>;
  updatePeriodoClases: (pc: PeriodoClases) => Promise<void>;
  deletePeriodoClases: (id: string) => Promise<void>;
  addTurno: (turno: Omit<Turno, 'id'>) => Promise<Turno>;
  updateTurno: (turno: Turno) => Promise<void>;
  deleteTurno: (id: string) => Promise<void>;
  addHorario: (horario: Omit<Horario, 'id'>) => Promise<Horario>;
  deleteHorario: (id: string) => Promise<void>;
  ejecutarAperturaRapida: (data: any) => Promise<any>;
  reloadAcademicData: () => Promise<void>;

  // Egresados & Titulación
  egresados: EgresadoDetallado[];
  candidatosEgreso: any[];
  addEgresado: (data: any) => Promise<EgresadoDetallado | null>;
  updateEgresado: (id: string, data: any) => Promise<boolean>;
  registrarTitulacionEgresado: (id: string, data: any) => Promise<boolean>;
  actualizarSeguimientoLaboral: (id: string, data: any) => Promise<boolean>;
  deleteEgresado: (id: string, motivo?: string) => Promise<boolean>;
  refreshEgresados: () => Promise<void>;

  // Certificación Modular (R.V.M. N° 188-2020-MINEDU)
  certificadosModulares: CertificadoModularDetallado[];
  aptosCertificacionModular: AptoCertificadoModular[];
  emitirCertificadoModular: (data: any) => Promise<CertificadoModularDetallado | null>;
  updateCertificadoModular: (id: string, data: any) => Promise<boolean>;
  deleteCertificadoModular: (id: string) => Promise<boolean>;
  refreshCertificadosModulares: () => Promise<void>;

  // Certificados de Estudios Oficiales (R.V.M. N° 188-2020-MINEDU / R.V.M. N° 277-2019-MINEDU)
  certificadosEstudios: CertificadoEstudioDetallado[];
  emitirCertificadoEstudio: (data: any) => Promise<CertificadoEstudioDetallado | null>;
  updateCertificadoEstudio: (id: string, data: any) => Promise<boolean>;
  deleteCertificadoEstudio: (id: string) => Promise<boolean>;
  refreshCertificadosEstudios: () => Promise<void>;

  // Titulación Oficial (R.V.M. N° 188-2020-MINEDU / ANEXOS 5A y 5B)
  titulos: TituloDetallado[];
  aptosTitulacion: AptoTitulacion[];
  emitirTitulo: (data: any) => Promise<TituloDetallado | null>;
  updateTitulo: (id: string, data: any) => Promise<boolean>;
  deleteTitulo: (id: string) => Promise<boolean>;
  refreshTitulos: () => Promise<void>;

  // Global Helpers
  toasts: ToastMessage[];
  addToast: (
    titleOrOptions: string | { title?: string; message?: string; description?: string; type?: 'success' | 'info' | 'warning' | 'error' },
    message?: string,
    type?: 'success' | 'info' | 'warning' | 'error'
  ) => void;
  removeToast: (id: string) => void;
  resetToSeedData: () => void;
}

const safeStorageSet = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    // Silently ignore quota exceeded or storage unavailable errors
  }
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeView, setActiveView] = useState<ViewType>(() => {
    try {
      const saved = sessionStorage.getItem('siga_active_view') || localStorage.getItem('siga_active_view');
      if (saved && typeof saved === 'string') return saved as ViewType;
    } catch {}
    return 'dashboard';
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [periodoActivo, setPeriodoActivo] = useState<string>('2026-2');
  const [selectedEstudianteId, setSelectedEstudianteId] = useState<string | null>(null);
  const [selectedPersonaId, setSelectedPersonaId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Load from localStorage or seeds
  const [institucion, setInstitucion] = useState<InstitucionInfo>(() => {
    const saved = localStorage.getItem('siga_institucion');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.logoUrl && (parsed.logoUrl.includes('G:\\') || parsed.logoUrl.includes('C:\\') || parsed.logoUrl.includes('system_cetpro_juanjui') || parsed.logoUrl.includes('documentacion\\Fotos'))) {
          parsed.logoUrl = '/cetpro-logo.svg';
        }
        return parsed;
      } catch (e) {
        return INSTITUCION_ACTUAL;
      }
    }
    return INSTITUCION_ACTUAL;
  });

  const [usuarios, setUsuarios] = useState<UsuarioSistema[]>(() => {
    const saved = localStorage.getItem('siga_usuarios');
    return saved ? JSON.parse(saved) : USUARIOS_SEED;
  });

  const [currentUser, setCurrentUser] = useState<UsuarioSistema>(() => {
    const savedSession = localStorage.getItem('siga_session_user');
    if (savedSession) {
      try {
        return JSON.parse(savedSession);
      } catch (e) {
        // ignore
      }
    }
    const savedUsers = localStorage.getItem('siga_usuarios');
    if (savedUsers) {
      try {
        const parsed = JSON.parse(savedUsers);
        const dir = parsed.find((u: any) => u.rol === 'DIRECTOR' || u.rol === 'ADMINISTRADOR');
        if (dir) return dir;
        return parsed[0] || USUARIOS_SEED[0];
      } catch (e) {
        // ignore
      }
    }
    return USUARIOS_SEED[0];
  });

  // Role-Based Access Control (RBAC) Helpers
  const userPermissions = useMemo<string[]>(() => {
    if (!currentUser?.rol) return [];
    return ROLE_PERMISSIONS_MATRIX[currentUser.rol] || [];
  }, [currentUser?.rol]);

  const canAccessView = (view: ViewType, rol?: RolSistema): boolean => {
    const targetRol = rol || currentUser?.rol || 'DIRECTOR';
    const allowedViewsByRole: Record<string, ViewType[]> = {
      DIRECTOR: [
        'dashboard', 'padron', 'asistencia-personal', 'estudiantes', 'calificaciones',
        'egresados', 'programas', 'horarios', 'formacion-continua', 'reportes',
        'tesoreria', 'inventario', 'acervo', 'configuracion', 'auditoria'
      ],
      ADMINISTRADOR: [
        'dashboard', 'padron', 'asistencia-personal', 'estudiantes', 'calificaciones',
        'egresados', 'programas', 'horarios', 'formacion-continua', 'reportes',
        'tesoreria', 'inventario', 'acervo', 'configuracion', 'auditoria'
      ],
      SECRETARIO_ACADEMICO: [
        'dashboard', 'padron', 'asistencia-personal', 'estudiantes', 'calificaciones',
        'egresados', 'programas', 'horarios', 'formacion-continua', 'reportes', 'tesoreria', 'acervo'
      ],
      DOCENTE: [
        'dashboard', 'asistencia-personal', 'horarios', 'calificaciones',
        'programas', 'estudiantes', 'reportes'
      ],
      TRABAJADOR: [
        'dashboard', 'asistencia-personal', 'horarios', 'calificaciones',
        'programas', 'estudiantes', 'reportes'
      ],
      TESORERO: [
        'dashboard', 'tesoreria', 'estudiantes', 'reportes'
      ],
      COORDINADOR_TALLER: [
        'dashboard', 'inventario', 'asistencia-personal', 'programas',
        'horarios', 'calificaciones', 'reportes', 'estudiantes'
      ],
      ESTUDIANTE: [
        'dashboard', 'estudiantes', 'calificaciones', 'horarios'
      ],
    };
    const allowed = allowedViewsByRole[targetRol] || allowedViewsByRole.DIRECTOR;
    return allowed.includes(view);
  };

  const hasPermission = (modulo: PermisoModulo, accion: PermisoAccion): boolean => {
    if (!currentUser?.rol) return false;
    if (currentUser.rol === 'DIRECTOR' || currentUser.rol === 'ADMINISTRADOR') return true;
    const key = `${modulo}:${accion}`;
    return userPermissions.includes(key);
  };

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return !!localStorage.getItem('siga_session_user');
  });

  const [personas, setPersonas] = useState<Persona[]>(() => {
    const saved = localStorage.getItem('siga_personas');
    if (!saved) return PERSONAS_SEED;
    
    let parsed: Persona[] = JSON.parse(saved);
    
    // Normalizar Sexo a H (Hombre) y M (Mujer)
    parsed = parsed.map(p => ({
      ...p,
      sexo: normalizeSexo(p.sexo)
    }));
    safeStorageSet('siga_personas', JSON.stringify(parsed));
    
    return parsed;
  });

  const [estudiantes, setEstudiantes] = useState<Estudiante[]>(() => {
    const saved = localStorage.getItem('siga_estudiantes');
    return saved ? JSON.parse(saved) : ESTUDIANTES_SEED;
  });

  const [trabajadores, setTrabajadors] = useState<Trabajador[]>(() => {
    const saved = localStorage.getItem('siga_trabajadores');
    return saved ? JSON.parse(saved) : TRABAJADORS_SEED;
  });

  const [programas, setProgramas] = useState<ProgramaEstudio[]>(() => {
    const saved = localStorage.getItem('siga_programas');
    return saved ? JSON.parse(saved) : PROGRAMAS_SEED;
  });

  const [modulos, setModulos] = useState<ModuloFormativo[]>(() => {
    const saved = localStorage.getItem('siga_modulos');
    return saved ? JSON.parse(saved) : MODULOS_SEED;
  });

  const [unidades, setUnidades] = useState<UnidadDidactica[]>(() => {
    const saved = localStorage.getItem('siga_unidades');
    return saved ? JSON.parse(saved) : UNIDADES_SEED;
  });

  const [secciones, setSecciones] = useState<Seccion[]>(() => {
    const saved = localStorage.getItem('siga_secciones');
    return saved ? JSON.parse(saved) : SECCIONES_SEED;
  });

  const [sedes, setSedes] = useState<Sede[]>([]);
  const [aulas, setAulas] = useState<Aula[]>([]);
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [periodosClases, setPeriodosClases] = useState<PeriodoClases[]>([]);
  const [periodosAcademicos, setPeriodosAcademicos] = useState<PeriodoAcademico[]>([]);
  const [periodosLectivos, setPeriodosLectivos] = useState<PeriodoLectivo[]>([]);
  const [horarios, setHorarios] = useState<Horario[]>([]);

  const [matriculas, setMatriculas] = useState<Matricula[]>(() => {
    const saved = localStorage.getItem('siga_matriculas');
    return saved ? JSON.parse(saved) : MATRICULAS_SEED;
  });

  const [notasUnidades, setNotasUnidades] = useState<NotaUnidad[]>(() => {
    const saved = localStorage.getItem('siga_notas_unidades');
    return saved ? JSON.parse(saved) : NOTAS_UNIDADES_SEED;
  });

  const [notasEFSRT, setNotasEFSRT] = useState<NotaEFSRT[]>(() => {
    const saved = localStorage.getItem('siga_notas_efsrt');
    return saved ? JSON.parse(saved) : NOTAS_EFSRT_SEED;
  });

  const [conceptosPago, setConceptosPago] = useState<ConceptoPago[]>(() => {
    const saved = localStorage.getItem('siga_conceptos_pago');
    return saved ? JSON.parse(saved) : CONCEPTOS_PAGO_SEED;
  });

  const [recibos, setRecibos] = useState<ReciboPago[]>(() => {
    const saved = localStorage.getItem('siga_recibos');
    return saved ? JSON.parse(saved) : RECIBOS_SEED;
  });

  const [estadosAsistencias, setEstadosAsistencias] = useState<EstadoAsistencia[]>([
    { id: '8d55ecb6-c09b-4972-8668-d5c749ced3a7', codigo: 'PRES', nombre: 'Presente', afectaPorcentaje: false },
    { id: '3ce43e79-c3df-4184-842a-f136f722f384', codigo: 'FALT', nombre: 'Falta', afectaPorcentaje: true },
    { id: 'b6351888-9811-496b-83a2-39d82cf3612b', codigo: 'TARD', nombre: 'Tardanza', afectaPorcentaje: true },
    { id: '61243b6d-f05e-49a0-a40d-8b67b967e72d', codigo: 'JUST', nombre: 'Justificada', afectaPorcentaje: false },
  ]);

  const [asistencias, setAsistencias] = useState<AsistenciaEstudiante[]>([]);
  const [asistenciasTrabajadores, setAsistenciasTrabajadores] = useState<AsistenciaTrabajador[]>([]);

  const [cursosLibres, setCursosLibres] = useState<CursoLibre[]>(() => {
    const saved = localStorage.getItem('siga_cursos_libres');
    const parsed = saved ? JSON.parse(saved) : [];
    return parsed && parsed.length > 0 ? parsed : CURSOS_LIBRES_SEED;
  });

  const [inscripcionesCursos, setInscripcionesCursos] = useState<InscripcionCursoLibre[]>(() => {
    const saved = localStorage.getItem('siga_inscripciones_cursos');
    return saved ? JSON.parse(saved) : INSCRIPCIONES_CURSOS_SEED;
  });

  const [bienesPatrimoniales, setBienesPatrimoniales] = useState<BienPatrimonial[]>(() => {
    const saved = localStorage.getItem('siga_bienes');
    const parsed = saved ? JSON.parse(saved) : [];
    return parsed && parsed.length > 0 ? parsed : BIENES_PATRIMONIALES_SEED;
  });

  const [documentosOficiales, setDocumentosOficiales] = useState<DocumentoOficial[]>(() => {
    const saved = localStorage.getItem('siga_documentos');
    const parsed = saved ? JSON.parse(saved) : [];
    return parsed && parsed.length > 0 ? parsed : DOCUMENTOS_SEED;
  });

  const [auditoriaLogs, setAuditoriaLogs] = useState<AuditoriaLog[]>(() => {
    const saved = localStorage.getItem('siga_auditoria');
    return saved ? JSON.parse(saved) : AUDITORIA_SEED;
  });

  const [metasProgramas, setMetasProgramas] = useState<MetaPrograma[]>(() => {
    const saved = localStorage.getItem('siga_metas');
    return saved ? JSON.parse(saved) : METAS_PROGRAMAS_SEED;
  });

  const [egresados, setEgresados] = useState<EgresadoDetallado[]>([]);
  const [candidatosEgreso, setCandidatosEgreso] = useState<any[]>([]);
  const [certificadosModulares, setCertificadosModulares] = useState<CertificadoModularDetallado[]>([]);
  const [aptosCertificacionModular, setAptosCertificacionModular] = useState<AptoCertificadoModular[]>([]);
  const [certificadosEstudios, setCertificadosEstudios] = useState<CertificadoEstudioDetallado[]>([]);
  const [titulos, setTitulos] = useState<TituloDetallado[]>([]);
  const [aptosTitulacion, setAptosTitulacion] = useState<AptoTitulacion[]>([]);

  // One-time cleanup of legacy test data in localStorage
  useEffect(() => {
    const version = localStorage.getItem('siga_data_version');
    if (version !== 'v3_db_sync') {
      const legacyKeys = [
        'siga_personas',
        'siga_estudiantes',
        'siga_trabajadores',
        'siga_matriculas',
        'siga_notas_unidades',
        'siga_notas_efsrt',
        'siga_recibos',
        'siga_cursos_libres',
        'siga_inscripciones_cursos',
        'siga_bienes',
        'siga_documentos',
        'siga_auditoria',
        'siga_usuarios',
        'siga_secciones',
        'siga_modulos',
        'siga_unidades',
        'siga_metas',
        'siga_sedes',
        'siga_aulas',
        'siga_turnos',
        'siga_programas',
      ];
      legacyKeys.forEach((key) => localStorage.removeItem(key));
      localStorage.setItem('siga_data_version', 'v3_db_sync');
    }
  }, []);

  // Fetch real data from DB
  const refreshData = async () => {
      try {
        const [
          cetproRes, programasRes, personasRes, estudiantesRes, matriculasRes,
          tesoreriaConceptosRes, tesoreriaPagosRes, seccionesRes, modulosRes, unidadesRes,
          notasUnidadesRes, notasEFSRTRes, trabajadoresRes, usuariosRes,
          sedesRes, aulasRes, turnosRes, periodosClasesRes, periodosAcademicosRes,
          periodosLectivosRes, horariosRes,
          auditoriasRes,
          documentosRes,
          egresadosRes,
          candidatosEgresoRes,
          certificadosModularesRes,
          aptosCertificacionRes,
          certificadosEstudiosRes,
          titulosRes,
          aptosTitulacionRes
        ] = await Promise.all([
          fetch('/api/academic/cetpro'),
          fetch('/api/academic/programas'),
          fetch('/api/padron/personas'),
          fetch('/api/padron/estudiantes'),
          fetch('/api/matriculas'),
          fetch('/api/tesoreria/conceptos'),
          fetch('/api/tesoreria/pagos'),
          fetch('/api/academic/secciones'),
          fetch('/api/academic/modulos'),
          fetch('/api/academic/unidades'),
          fetch('/api/notas/unidades'),
          fetch('/api/notas/efsrt'),
          fetch('/api/padron/trabajadores'),
          fetch('/api/admin/usuarios'),
          fetch('/api/academic/sedes'),
          fetch('/api/academic/aulas'),
          fetch('/api/academic/turnos'),
          fetch('/api/academic/periodos-clases'),
          fetch('/api/academic/periodos-academicos'),
          fetch('/api/academic/periodos-lectivos'),
          fetch('/api/academic/horarios'),
          fetch('/api/admin/auditorias'),
          fetch('/api/documentos'),
          fetch('/api/egresados'),
          fetch('/api/egresados/candidatos'),
          fetch('/api/certificados-modulares'),
          fetch('/api/certificados-modulares/aptos'),
          fetch('/api/certificados-estudios'),
          fetch('/api/titulos'),
          fetch('/api/titulos/aptos')
        ]);
        
        if (cetproRes.ok) {
          const cetpro = await cetproRes.json();
          if (cetpro) {
            setInstitucion(prev => ({
              ...prev,
              nombre: cetpro.nombre || prev.nombre,
              codigoModular: cetpro.codigoModular || prev.codigoModular,
              codigoLocal: cetpro.codigoLocal || prev.codigoLocal,
              ruc: cetpro.ruc || prev.ruc,
              dre: cetpro.dreGre || prev.dre,
              ugel: cetpro.ugel || prev.ugel,
              direccion: cetpro.direccion || prev.direccion,
              distrito: cetpro.distrito || prev.distrito,
              provincia: cetpro.provincia || prev.provincia,
              region: cetpro.region || prev.region,
              telefono: cetpro.telefonoFijo || prev.telefono,
              tipoGestion: cetpro.tipoGestion || prev.tipoGestion,
              cuentaBancariaBN: cetpro.cuentaCorrienteBn || prev.cuentaBancariaBN,
              logoUrl: (cetpro.logoUrl && !cetpro.logoUrl.includes('G:\\') && !cetpro.logoUrl.includes('C:\\') && !cetpro.logoUrl.includes('system_cetpro')) 
                ? cetpro.logoUrl 
                : (prev.logoUrl || '/cetpro-logo.svg'),
            }));
          }
        }
        
        if (programasRes.ok) {
          const dbProgramas = await programasRes.json();
          if (dbProgramas && Array.isArray(dbProgramas)) {
             // Map from DB schema to frontend schema temporarily
             const mappedProgramas: ProgramaEstudio[] = dbProgramas.map((p: any) => {
               // find existing to merge icon and color if missing in db
               const existing = PROGRAMAS_SEED.find(seed => seed.codigo === p.codigo) || {} as any;
               return {
                 id: p.id,
                 codigo: p.codigo,
                 nombre: p.nombre,
                 descripcion: p.descripcion || existing.descripcion || '',
                 totalHoras: p.totalHoras || existing.totalHoras || 0,
                 totalCreditos: p.totalCreditos || existing.totalCreditos || 0,
                 resolucionAutorizacion: existing.resolucionAutorizacion || '',
                 nivelFormativo: p.nivelFormativo || existing.nivelFormativo || 'Técnico',
                 icono: existing.icono || 'Briefcase',
                 color: existing.color || 'bg-blue-100 text-blue-700',
                 tallerResponsable: existing.tallerResponsable || '',
                 modulosCount: existing.modulosCount || 0,
                 archivoUrl: p.archivoUrl || null,
                 estado: p.estado || existing.estado || 'ACTIVO',
               };
             });
             setProgramas(mappedProgramas);
          }
        }
        
        
        if (trabajadoresRes && trabajadoresRes.ok) {
          const rawTrabajadores = await trabajadoresRes.json();
          setTrabajadors(rawTrabajadores);
        }

        let fetchedEstudiantes: any[] = [];
        if (estudiantesRes.ok) {
          const rawEstudiantes = await estudiantesRes.json();
          fetchedEstudiantes = rawEstudiantes.map((e: any) => ({
            ...e,
            programaId: e.programaId || '',
            anioIngreso: e.anioIngreso || new Date().getFullYear(),
            periodoIngreso: e.periodoIngreso || '2025-I',
            historialNotas: e.historialNotas || [],
          }));
          setEstudiantes(fetchedEstudiantes);
        }

        if (personasRes.ok) {
          const fetchedPersonas = await personasRes.json();
          const mappedPersonas = fetchedPersonas.map((p: any) => ({
            ...p,
            direccion: p.direccionActual || p.direccion || '',
            correo: p.email || p.correo || '',
            esEstudiante: p.rolPrimario === 'ESTUDIANTE' || p.esEstudiante
          }));
          setPersonas(mappedPersonas);
        }

        if (matriculasRes.ok) {
          const fetchedMatriculas = await matriculasRes.json();
          setMatriculas(fetchedMatriculas);
        }

        if (tesoreriaConceptosRes.ok) {
          const fetchedConceptos = await tesoreriaConceptosRes.json();
          const normalized = fetchedConceptos.map((c: any) => ({
            id: c.id,
            codigo: c.codigo,
            nombre: c.nombre || c.concepto || c.codigo,
            concepto: c.concepto || c.nombre,
            montoSugerido: Number(c.montoSugerido !== undefined ? c.montoSugerido : (c.montoFijo || 0)),
            montoFijo: Number(c.montoFijo !== undefined ? c.montoFijo : (c.montoSugerido || 0)),
            categoria: c.categoria || 'Otros',
            aplicaMora: c.aplicaMora || false
          }));
          setConceptosPago(normalized);
          safeStorageSet('siga_conceptos_pago', JSON.stringify(normalized));
        }

        if (tesoreriaPagosRes.ok) {
          const fetchedPagos = await tesoreriaPagosRes.json();
          setRecibos(fetchedPagos);
        }

        if (seccionesRes.ok) {
          const fetchedSecciones = await seccionesRes.json();
          setSecciones(fetchedSecciones);
          safeStorageSet('siga_secciones', JSON.stringify(fetchedSecciones));
        }

        if (modulosRes.ok) {
          const fetchedModulos = await modulosRes.json();
          setModulos(fetchedModulos);
        }
        if (unidadesRes.ok) {
          const fetchedUnidadesData = await unidadesRes.json();
          setUnidades(fetchedUnidadesData);
        }


        if (sedesRes && sedesRes.ok) {
          const fetchedSedes = await sedesRes.json();
          setSedes(fetchedSedes);
        }
        if (aulasRes && aulasRes.ok) {
          const fetchedAulas = await aulasRes.json();
          setAulas(fetchedAulas);
        }
        if (turnosRes && turnosRes.ok) {
          const fetchedTurnos = await turnosRes.json();
          setTurnos(fetchedTurnos);
        }
        if (periodosClasesRes && periodosClasesRes.ok) {
          const fetchedPeriodosClases = await periodosClasesRes.json();
          setPeriodosClases(fetchedPeriodosClases);
        }
        if (periodosAcademicosRes && periodosAcademicosRes.ok) {
          const fetchedPeriodosAcademicos = await periodosAcademicosRes.json();
          setPeriodosAcademicos(fetchedPeriodosAcademicos);
          const activePa = fetchedPeriodosAcademicos.find((pa: any) => pa.estado?.toUpperCase() === 'ACTIVO');
          if (activePa) {
             setPeriodoActivo(activePa.nombre || (activePa.codigo ? activePa.codigo.replace('PER-ACA-', '') : '2026-2'));
          }
        }
        if (periodosLectivosRes && periodosLectivosRes.ok) {
          const fetchedPeriodosLectivos = await periodosLectivosRes.json();
          setPeriodosLectivos(fetchedPeriodosLectivos);
        }
        if (horariosRes && horariosRes.ok) {
          const fetchedHorarios = await horariosRes.json();
          setHorarios(fetchedHorarios);
        }

        if (notasUnidadesRes.ok) {
          const fetchedUnidades = await notasUnidadesRes.json();
          setNotasUnidades(fetchedUnidades);
        }

        if (notasEFSRTRes.ok) {
          const fetchedEfsrt = await notasEFSRTRes.json();
          setNotasEFSRT(fetchedEfsrt);
        }

        if (usuariosRes && usuariosRes.ok) {
          const dbUsuarios = await usuariosRes.json();
          if (Array.isArray(dbUsuarios) && dbUsuarios.length > 0) {
            setUsuarios(dbUsuarios);
            safeStorageSet('siga_usuarios', JSON.stringify(dbUsuarios));
            
            setCurrentUser(prev => {
              // 1. Revisar si hay un usuario de sesión guardado
              const savedSession = localStorage.getItem('siga_session_user');
              if (savedSession) {
                try {
                  const sUser = JSON.parse(savedSession);
                  const sessionMatch = dbUsuarios.find((u: any) => u.id === sUser.id || u.username === sUser.username);
                  if (sessionMatch) return sessionMatch;
                } catch (e) {
                  // ignore
                }
              }
              // 2. Si el usuario actual ya existe en la lista, mantenerlo actualizado
              if (prev && prev.id) {
                const match = dbUsuarios.find((u: any) => u.id === prev.id || u.username === prev.username);
                if (match) return match;
              }
              // 3. Si no, buscar al Director o Administrador (Edinson Raul Tejada Rivera)
              const dirMatch = dbUsuarios.find((u: any) => u.rol === 'DIRECTOR' || u.rol === 'ADMINISTRADOR');
              if (dirMatch) return dirMatch;

              return dbUsuarios[0];
            });

            // Update director info in institucion if found
            const dirUser = dbUsuarios.find((u: any) => u.rol === 'DIRECTOR' || u.rol === 'ADMINISTRADOR');
            if (dirUser) {
              setInstitucion(prev => ({
                ...prev,
                director: dirUser.nombreCompleto
              }));
            }
          }
        }

        if (auditoriasRes && auditoriasRes.ok) {
          const dbAuditorias = await auditoriasRes.json();
          if (Array.isArray(dbAuditorias)) {
            setAuditoriaLogs(dbAuditorias);
          }
        }

        if (documentosRes && documentosRes.ok) {
          const dbDocs = await documentosRes.json();
          if (Array.isArray(dbDocs)) {
            setDocumentosOficiales(dbDocs);
          }
        }

        if (egresadosRes && egresadosRes.ok) {
          const dbEgresados = await egresadosRes.json();
          if (Array.isArray(dbEgresados)) {
            setEgresados(dbEgresados);
          }
        }

        if (candidatosEgresoRes && candidatosEgresoRes.ok) {
          const dbCandidatos = await candidatosEgresoRes.json();
          if (Array.isArray(dbCandidatos)) {
            setCandidatosEgreso(dbCandidatos);
          }
        }

        if (certificadosModularesRes && certificadosModularesRes.ok) {
          const dbCms = await certificadosModularesRes.json();
          if (Array.isArray(dbCms)) {
            setCertificadosModulares(dbCms);
          }
        }

        if (aptosCertificacionRes && aptosCertificacionRes.ok) {
          const dbAptos = await aptosCertificacionRes.json();
          if (Array.isArray(dbAptos)) {
            setAptosCertificacionModular(dbAptos);
          }
        }

        if (certificadosEstudiosRes && certificadosEstudiosRes.ok) {
          const dbCes = await certificadosEstudiosRes.json();
          if (Array.isArray(dbCes)) {
            setCertificadosEstudios(dbCes);
          }
        }

        if (titulosRes && titulosRes.ok) {
          const dbTitulos = await titulosRes.json();
          if (Array.isArray(dbTitulos)) {
            setTitulos(dbTitulos);
          }
        }

        if (aptosTitulacionRes && aptosTitulacionRes.ok) {
          const dbAptosTit = await aptosTitulacionRes.json();
          if (Array.isArray(dbAptosTit)) {
            setAptosTitulacion(dbAptosTit);
          }
        }
      } catch (err) {
        console.error("Error fetching academic data:", err);
      }
    };

  // Modular Refresh Helpers for Ultra-Fast Synchronization (< 300ms)
  const isSyncingRef = React.useRef(false);
  const lastSyncTimeRef = React.useRef(Date.now());
  const [isAutoSyncing, setIsAutoSyncing] = useState<boolean>(false);

  const refreshPersonasData = async () => {
    try {
      const res = await fetch('/api/padron/personas');
      if (res.ok) {
        const fetchedPersonas = await res.json();
        setPersonas(fetchedPersonas.map((p: any) => ({
          ...p,
          direccion: p.direccionActual || p.direccion || '',
          correo: p.email || p.correo || '',
          esEstudiante: p.rolPrimario === 'ESTUDIANTE' || p.esEstudiante
        })));
      }
    } catch (e) {
      console.warn('Error en sincronización modular de personas:', e);
    }
  };

  const refreshEstudiantesData = async () => {
    try {
      const res = await fetch('/api/padron/estudiantes');
      if (res.ok) {
        const raw = await res.json();
        setEstudiantes(raw.map((e: any) => ({
          ...e,
          programaId: e.programaId || '',
          anioIngreso: e.anioIngreso || new Date().getFullYear(),
          periodoIngreso: e.periodoIngreso || '2025-I',
          historialNotas: e.historialNotas || [],
        })));
      }
    } catch (e) {
      console.warn('Error en sincronización modular de estudiantes:', e);
    }
  };

  const refreshMatriculasData = async () => {
    try {
      const res = await fetch('/api/matriculas');
      if (res.ok) {
        setMatriculas(await res.json());
      }
    } catch (e) {
      console.warn('Error en sincronización modular de matrículas:', e);
    }
  };

  const refreshNotasData = async () => {
    try {
      const [uRes, eRes] = await Promise.all([
        fetch('/api/notas/unidades'),
        fetch('/api/notas/efsrt')
      ]);
      if (uRes.ok) setNotasUnidades(await uRes.json());
      if (eRes.ok) setNotasEFSRT(await eRes.json());
    } catch (e) {
      console.warn('Error en sincronización modular de notas:', e);
    }
  };

  const refreshTesoreriaData = async () => {
    try {
      const [cRes, pRes] = await Promise.all([
        fetch('/api/tesoreria/conceptos'),
        fetch('/api/tesoreria/pagos')
      ]);
      if (cRes.ok) {
        const data = await cRes.json();
        const normalized = data.map((c: any) => ({
          id: c.id,
          codigo: c.codigo,
          nombre: c.nombre || c.concepto || c.codigo,
          concepto: c.concepto || c.nombre,
          montoSugerido: Number(c.montoSugerido !== undefined ? c.montoSugerido : (c.montoFijo || 0)),
          montoFijo: Number(c.montoFijo !== undefined ? c.montoFijo : (c.montoSugerido || 0)),
          categoria: c.categoria || 'Otros',
          aplicaMora: c.aplicaMora || false
        }));
        setConceptosPago(normalized);
        safeStorageSet('siga_conceptos_pago', JSON.stringify(normalized));
      }
      if (pRes.ok) setRecibos(await pRes.json());
    } catch (e) {
      console.warn('Error en sincronización modular de tesorería:', e);
    }
  };

  const refreshTrabajadoresData = async () => {
    try {
      const res = await fetch('/api/padron/trabajadores');
      if (res.ok) setTrabajadors(await res.json());
    } catch (e) {
      console.warn('Error en sincronización modular de trabajadores:', e);
    }
  };

  const refreshAcademicStructure = async () => {
    try {
      const [secRes, modRes, uniRes, horRes] = await Promise.all([
        fetch('/api/academic/secciones'),
        fetch('/api/academic/modulos'),
        fetch('/api/academic/unidades'),
        fetch('/api/academic/horarios')
      ]);
      if (secRes.ok) {
        const secData = await secRes.json();
        setSecciones(secData);
        safeStorageSet('siga_secciones', JSON.stringify(secData));
      }
      if (modRes.ok) setModulos(await modRes.json());
      if (uniRes.ok) setUnidades(await uniRes.json());
      if (horRes.ok) setHorarios(await horRes.json());
    } catch (e) {
      console.warn('Error en sincronización modular académica:', e);
    }
  };

  const refreshModularData = async (targetView?: ViewType) => {
    if (isSyncingRef.current) return;
    const view = targetView || activeView;
    isSyncingRef.current = true;
    setIsAutoSyncing(true);
    lastSyncTimeRef.current = Date.now();
    try {
      if (view === 'padron' || view === 'estudiantes') {
        await Promise.all([
          refreshPersonasData(),
          refreshEstudiantesData(),
          refreshMatriculasData(),
          refreshAcademicStructure()
        ]);
      } else if (view === 'calificaciones') {
        await Promise.all([
          refreshNotasData(),
          refreshMatriculasData()
        ]);
      } else if (view === 'tesoreria') {
        await Promise.all([
          refreshTesoreriaData(),
          refreshMatriculasData()
        ]);
      } else if (view === 'trabajadores' || view === 'asistencia-personal') {
        await Promise.all([
          refreshTrabajadoresData(),
          refreshPersonasData()
        ]);
      } else if (view === 'horarios' || view === 'programas') {
        await refreshAcademicStructure();
      } else if (view === 'egresados') {
        await refreshEgresados();
      } else if (view === 'certificados') {
        await refreshCertificadosModulares();
      } else {
        await Promise.all([
          refreshPersonasData(),
          refreshEstudiantesData(),
          refreshMatriculasData(),
          refreshTesoreriaData()
        ]);
      }
    } catch (err) {
      console.warn('Auto-sync modular error:', err);
    } finally {
      isSyncingRef.current = false;
      setIsAutoSyncing(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  // 1. Auto-sincronización modular inteligente al cambiar de vista
  useEffect(() => {
    refreshModularData(activeView);
  }, [activeView]);

  // 2. Auto-sincronización periódica inteligente (solo cuando NO haya modales ni formularios activos)
  useEffect(() => {
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        // No ejecutar auto-sync si el usuario tiene un modal abierto o está escribiendo en un formulario
        const isUserBusy = !!(
          document.querySelector('[role="dialog"]') ||
          document.querySelector('.fixed.inset-0') ||
          document.activeElement?.tagName === 'INPUT' ||
          document.activeElement?.tagName === 'TEXTAREA' ||
          document.activeElement?.tagName === 'SELECT'
        );
        if (!isUserBusy) {
          refreshModularData(activeView);
        }
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [activeView]);

  // Sync to localStorage safely (never throws QuotaExceededError)
  useEffect(() => {
    safeStorageSet('siga_institucion', JSON.stringify(institucion));
  }, [institucion]);
  useEffect(() => {
    safeStorageSet('siga_personas', JSON.stringify(personas));
  }, [personas]);
  useEffect(() => {
    safeStorageSet('siga_estudiantes', JSON.stringify(estudiantes));
  }, [estudiantes]);
  useEffect(() => {
    safeStorageSet('siga_matriculas', JSON.stringify(matriculas));
  }, [matriculas]);
  useEffect(() => {
    safeStorageSet('siga_notas_unidades', JSON.stringify(notasUnidades));
  }, [notasUnidades]);
  useEffect(() => {
    safeStorageSet('siga_notas_efsrt', JSON.stringify(notasEFSRT));
  }, [notasEFSRT]);
  useEffect(() => {
    safeStorageSet('siga_recibos', JSON.stringify(recibos));
  }, [recibos]);
  useEffect(() => {
    safeStorageSet('siga_cursos_libres', JSON.stringify(cursosLibres));
  }, [cursosLibres]);
  useEffect(() => {
    safeStorageSet('siga_bienes', JSON.stringify(bienesPatrimoniales));
  }, [bienesPatrimoniales]);
  useEffect(() => {
    safeStorageSet('siga_documentos', JSON.stringify(documentosOficiales));
  }, [documentosOficiales]);
  useEffect(() => {
    safeStorageSet('siga_auditoria', JSON.stringify(auditoriaLogs));
  }, [auditoriaLogs]);

  // Toast Helper
  const addToast = (
    titleOrOptions: string | { title?: string; message?: string; description?: string; type?: 'success' | 'info' | 'warning' | 'error' },
    message?: string,
    type: 'success' | 'info' | 'warning' | 'error' = 'success'
  ) => {
    let finalTitle = 'Notificación';
    let finalMessage = '';
    let finalType: 'success' | 'info' | 'warning' | 'error' = type || 'success';

    if (typeof titleOrOptions === 'object' && titleOrOptions !== null) {
      finalType = titleOrOptions.type || 'info';
      finalTitle = titleOrOptions.title || (finalType.charAt(0).toUpperCase() + finalType.slice(1));
      finalMessage = titleOrOptions.message || titleOrOptions.description || '';
    } else {
      finalTitle = String(titleOrOptions || 'Notificación');
      finalMessage = String(message || '');
      finalType = type;
    }

    const newToast: ToastMessage = {
      id: 'toast-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
      title: finalTitle,
      message: finalMessage,
      type: finalType,
    };
    setToasts((prev) => [newToast, ...prev]);
    setTimeout(() => {
      removeToast(newToast.id);
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Audit Logger con Persistencia en PostgreSQL (R.V.M. N° 188-2020-MINEDU)
  const refreshAuditorias = async (filters?: any) => {
    try {
      const params = new URLSearchParams();
      if (filters) {
        if (filters.tabla && filters.tabla !== 'ALL') params.append('tabla', filters.tabla);
        if (filters.accion && filters.accion !== 'ALL') params.append('accion', filters.accion);
        if (filters.usuarioId && filters.usuarioId !== 'ALL') params.append('usuarioId', filters.usuarioId);
        if (filters.fechaDesde) params.append('fechaDesde', filters.fechaDesde);
        if (filters.fechaHasta) params.append('fechaHasta', filters.fechaHasta);
        if (filters.busqueda) params.append('busqueda', filters.busqueda);
        if (filters.limit) params.append('limit', String(filters.limit));
      }
      const url = `/api/admin/auditorias${params.toString() ? `?${params.toString()}` : ''}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setAuditoriaLogs(data);
        }
      }
    } catch (e) {
      console.error('Error al refrescar auditorías:', e);
    }
  };

  const addAuditoriaLog = async (
    accion: string,
    entidad: string,
    detalle: string,
    datosAnteriores?: any,
    datosNuevos?: any,
    registroId?: string
  ) => {
    const tempId = 'aud-' + Date.now();
    const newLog: AuditoriaLog = {
      id: tempId,
      timestamp: new Date().toISOString(),
      fecha: new Date().toLocaleString('es-PE'),
      usuarioId: currentUser.id,
      usuarioNombre: currentUser.nombreCompleto || 'Usuario del Sistema',
      usuarioRol: currentUser.rol || 'USUARIO',
      accion: accion.toUpperCase(),
      entidad: entidad.toUpperCase(),
      tabla: entidad.toLowerCase(),
      registroId,
      detalle,
      detalles: detalle,
      datosAnteriores: datosAnteriores || null,
      datosNuevos: datosNuevos || (detalle ? { detalle } : null),
      ip: '127.0.0.1',
    };

    // Actualización optimista inmediata en UI
    setAuditoriaLogs((prev) => [newLog, ...prev]);

    // Persistencia asíncrona en PostgreSQL
    try {
      await fetch('/api/admin/auditorias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usuarioId: currentUser.id || null,
          accion: accion.toUpperCase(),
          tabla: entidad.toLowerCase(),
          registroId: registroId || null,
          datosAnteriores: datosAnteriores || null,
          datosNuevos: datosNuevos || null,
          detalle,
        }),
      });
    } catch (e) {
      console.error('Error al persistir log de auditoría en backend:', e);
    }
  };

  // Switch User & Roles
  const switchUser = (userId: string) => {
    const user = usuarios.find((u) => u.id === userId || u.username === userId || u.personaId === userId);
    if (user) {
      setCurrentUser(user);
      setIsAuthenticated(true);
      safeStorageSet('siga_session_user', JSON.stringify(user));
      safeStorageSet('siga_auth_status', 'true');

      // Auto-redireccionar si la vista actual no está permitida para el nuevo rol
      if (!canAccessView(activeView, user.rol)) {
        try {
          sessionStorage.setItem('siga_active_view', 'dashboard');
          safeStorageSet('siga_active_view', 'dashboard');
        } catch {}
        setActiveView('dashboard');
      }

      addToast('Perfil Cambiado', `Ahora estás operando como ${user.nombreCompleto} (${user.cargo || user.rolNombre || user.rol})`, 'info');
      addAuditoriaLog('CAMBIO_USUARIO_DEMO', 'usuarios', `Inicio de sesión como ${user.nombreCompleto}`);
    }
  };

  const handleSetActiveView = (view: ViewType) => {
    if (!canAccessView(view)) {
      addToast(
        'Acceso Restringido',
        `El rol "${currentUser?.rolNombre || currentUser?.rol}" no tiene permisos para acceder al módulo "${view}".`,
        'warning'
      );
      return;
    }
    try {
      sessionStorage.setItem('siga_active_view', view);
      safeStorageSet('siga_active_view', view);
    } catch {}
    setActiveView(view);
  };

  // Login
  const login = async (username: string, password?: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const cleanUser = username.trim();
      const cleanPass = password?.trim() || cleanUser;

      const localMatch = usuarios.find(u => 
        (u.username && u.username.toLowerCase() === cleanUser.toLowerCase()) || 
        (u.email && u.email.toLowerCase() === cleanUser.toLowerCase()) ||
        (u.personaId && u.personaId === cleanUser)
      );

      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: cleanUser, password: cleanPass })
      });

      if (!res.ok) {
        if (localMatch) {
          setCurrentUser(localMatch);
          setIsAuthenticated(true);
          localStorage.setItem('siga_session_user', JSON.stringify(localMatch));
          localStorage.setItem('siga_auth_status', 'true');
          addToast('Bienvenido al SIGA', `Sesión iniciada como ${localMatch.nombreCompleto}`, 'success');
          return { success: true };
        }
        const errData = await res.json().catch(() => ({ error: 'Error al iniciar sesión' }));
        return { success: false, message: errData.error || 'Credenciales no válidas' };
      }

      const data = await res.json();
      if (data.user) {
        setCurrentUser(data.user);
        setIsAuthenticated(true);
        localStorage.setItem('siga_session_user', JSON.stringify(data.user));
        localStorage.setItem('siga_auth_status', 'true');
        addToast('Bienvenido al SIGA', data.message || `Sesión iniciada como ${data.user.nombreCompleto}`, 'success');
        return { success: true };
      }
      return { success: false, message: 'Respuesta de autenticación no válida.' };
    } catch (err: any) {
      console.error('Error during login:', err);
      // Fallback local en caso de que la red falle
      const localMatch = usuarios.find(u => 
        (u.username && u.username.toLowerCase() === username.trim().toLowerCase()) || 
        (u.email && u.email.toLowerCase() === username.trim().toLowerCase())
      );
      if (localMatch) {
        setCurrentUser(localMatch);
        setIsAuthenticated(true);
        localStorage.setItem('siga_session_user', JSON.stringify(localMatch));
        localStorage.setItem('siga_auth_status', 'true');
        addToast('Sesión Iniciada', `Acceso concedido como ${localMatch.nombreCompleto}`, 'success');
        return { success: true };
      }
      return { success: false, message: err?.message || 'Error de conexión con el servidor.' };
    }
  };

  // Logout
  const logout = () => {
    try {
      localStorage.removeItem('siga_session_user');
      localStorage.removeItem('siga_auth_status');
      sessionStorage.removeItem('siga_active_view');
      localStorage.removeItem('siga_active_view');
    } catch {}
    setIsAuthenticated(false);
    // Asignar al director por defecto para el siguiente inicio
    const dir = usuarios.find(u => u.rol === 'DIRECTOR' || u.rol === 'ADMINISTRADOR') || usuarios[0] || USUARIOS_SEED[0];
    setCurrentUser(dir);
    setActiveView('dashboard');
    addToast('Sesión Cerrada', 'Has cerrado la sesión correctamente.', 'info');
  };

  const updateInstitucion = async (info: Partial<InstitucionInfo>) => {
    setInstitucion((prev) => ({ ...prev, ...info }));
    
    // Save to DB
    try {
      await fetch('/api/academic/cetpro', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(info)
      });
    } catch (err) {
      console.error('Failed to save institucion', err);
    }

    addToast('Institución Actualizada', 'Los datos institucionales se guardaron con éxito en la nube.');
    addAuditoriaLog('ACTUALIZACION_INSTITUCION', 'institucion', 'Modificación de parámetros institucionales');
  };

  const addPersona = async (personaData: Omit<Persona, 'id' | 'createdAt'>): Promise<Persona> => {
    const normSex = normalizeSexo(personaData.sexo);
    const payload = {
      ...personaData,
      sexo: normSex,
      genero: normSex
    };
    const response = await fetch('/api/padron/personas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok) {
      const errMsg = data.error || data.message || 'Error al registrar persona en la base de datos';
      addToast('Error al registrar', errMsg, 'error');
      throw new Error(errMsg);
    }

    const newPersona: Persona = {
      ...personaData,
      ...data,
      sexo: normSex,
      genero: normSex,
      direccion: data.direccionActual || personaData.direccion || '',
      correo: data.email || personaData.correo || '',
      createdAt: data.fechaRegistro || new Date().toISOString()
    };
    setPersonas((prev) => [newPersona, ...prev]);

    if (newPersona.rolPrimario === 'TRABAJADOR' || newPersona.esTrabajador) {
      fetch('/api/padron/trabajadores').then(res => res.ok && res.json()).then(trabs => {
        if (trabs && Array.isArray(trabs)) setTrabajadors(trabs);
      }).catch(console.error);
    }
    if (newPersona.rolPrimario === 'ESTUDIANTE' || newPersona.esEstudiante) {
      fetch('/api/padron/estudiantes').then(res => res.ok && res.json()).then(ests => {
        if (ests && Array.isArray(ests)) {
          setEstudiantes(ests.map((e: any) => ({
            ...e,
            programaId: e.programaId || 'prog-1',
            anioIngreso: e.anioIngreso || new Date().getFullYear(),
            periodoIngreso: e.periodoIngreso || '2025-I',
            historialNotas: [],
          })));
        }
      }).catch(console.error);
    }

    addToast('Persona Registrada', `Se registró a ${newPersona.nombres} ${newPersona.apellidoPaterno}`);
    addAuditoriaLog('CREAR_PERSONA', 'personas', `Registro de persona ${newPersona.nombres} ${newPersona.apellidoPaterno} (DNI ${newPersona.numeroDocumento})`);
    return newPersona;
  };

  const updatePersona = async (updated: Persona): Promise<void> => {
    const normSex = normalizeSexo(updated.sexo);
    const payload: Persona = {
      ...updated,
      sexo: normSex,
      genero: normSex
    };
    const response = await fetch(`/api/padron/personas/${updated.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      const errMsg = data.error || data.message || 'Error al actualizar persona en la base de datos';
      addToast('Error al actualizar', errMsg, 'error');
      throw new Error(errMsg);
    }

    setPersonas((prev) => prev.map((p) => (p.id === updated.id ? payload : p)));

    if (updated.rolPrimario === 'TRABAJADOR' || updated.esTrabajador) {
      fetch('/api/padron/trabajadores').then(res => res.ok && res.json()).then(trabs => {
        if (trabs && Array.isArray(trabs)) setTrabajadors(trabs);
      }).catch(console.error);
    }
    if (updated.rolPrimario === 'ESTUDIANTE' || updated.esEstudiante) {
      fetch('/api/padron/estudiantes').then(res => res.ok && res.json()).then(ests => {
        if (ests && Array.isArray(ests)) {
          setEstudiantes(ests.map((e: any) => ({
            ...e,
            programaId: e.programaId || 'prog-1',
            anioIngreso: e.anioIngreso || new Date().getFullYear(),
            periodoIngreso: e.periodoIngreso || '2025-I',
            historialNotas: [],
          })));
        }
      }).catch(console.error);
    }

    addToast('Persona Actualizada', `Se guardaron los datos de ${updated.nombres} ${updated.apellidoPaterno}`);
    addAuditoriaLog('EDITAR_PERSONA', 'personas', `Actualización de datos de ${updated.nombres} ${updated.apellidoPaterno}`);
  };

  const deletePersona = async (id: string): Promise<void> => {
    const response = await fetch(`/api/padron/personas/${id}`, {
      method: 'DELETE'
    });
    if (response.ok) {
      setPersonas((prev) => prev.filter((p) => p.id !== id));
      setEstudiantes((prev) => prev.filter((e) => e.personaId !== id));
      setTrabajadors((prev) => prev.filter((t) => t.personaId !== id));
      addToast('Persona Eliminada', 'El registro se eliminó exitosamente del sistema');
      addAuditoriaLog('ELIMINAR_PERSONA', 'personas', `Se eliminó el registro de la persona con ID ${id}`);
    } else {
      addToast('Error', 'No se pudo eliminar la persona', 'error');
    }
  };

  const addEstudiante = async (
    estData: Omit<Estudiante, 'id'>,
    personaData?: Omit<Persona, 'id' | 'createdAt'>
  ): Promise<Estudiante> => {
    const response = await fetch('/api/padron/estudiantes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...estData, personaData })
    });
    const data = await response.json();
    if (!response.ok) {
      const errMsg = data.error || data.message || 'Error al registrar estudiante en la base de datos';
      addToast('Error al registrar', errMsg, 'error');
      throw new Error(errMsg);
    }

    const newEst: Estudiante = {
      ...data,
      programaId: estData.programaId,
      anioIngreso: estData.anioIngreso,
      periodoIngreso: estData.periodoIngreso,
      historialNotas: (estData as any).historialNotas || [],
    };
    
    // We should also refresh the personas or mark the persona as student
    let targetPersonaId = data.personaId;
    if (personaData) {
      const newPer: Persona = {
        ...personaData,
        id: targetPersonaId,
        esEstudiante: true,
        createdAt: new Date().toISOString()
      };
      setPersonas((prev) => [newPer, ...prev]);
    } else {
      setPersonas((prev) =>
        prev.map((p) => (p.id === targetPersonaId ? { ...p, esEstudiante: true } : p))
      );
    }

    setEstudiantes((prev) => [newEst, ...prev]);
    addToast('Estudiante Registrado', `Registrado exitosamente`);
    addAuditoriaLog('CREAR_ESTUDIANTE', 'estudiantes', `Registro de estudiante ${newEst.id}`);
    return newEst;
  };

  const updateEstudiante = async (updated: Estudiante): Promise<void> => {
    const response = await fetch(`/api/padron/estudiantes/${updated.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated)
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      const errMsg = data.error || data.message || 'Error al actualizar estudiante en la base de datos';
      addToast('Error al actualizar', errMsg, 'error');
      throw new Error(errMsg);
    }
    setEstudiantes((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
    addToast('Ficha de Estudiante Guardada', `Actualizada exitosamente`);
    addAuditoriaLog('EDITAR_ESTUDIANTE', 'estudiantes', `Actualización de ficha de estudiante`);
  };

  const deleteEstudiante = async (id: string): Promise<void> => {
    const response = await fetch(`/api/padron/estudiantes/${id}`, {
      method: 'DELETE'
    });
    if (response.ok) {
      setEstudiantes((prev) => prev.filter((e) => e.id !== id));
      setMatriculas((prev) => prev.filter((m) => m.estudianteId !== id));
      addToast('Estudiante Eliminado', 'Se eliminó la ficha académica y matrículas asociadas', 'warning');
      addAuditoriaLog('ELIMINAR_ESTUDIANTE', 'estudiantes', `Eliminación de estudiante ID ${id}`);
    } else {
      addToast('Error', 'No se pudo eliminar el estudiante', 'error');
    }
  };

  const vincularApoderado = async (datos: {
    estudianteId: string;
    personaId?: string;
    dni: string;
    nombres: string;
    apellidoPaterno?: string;
    apellidoMaterno?: string;
    telefono?: string;
    parentesco: string;
    esApoderadoPrincipal: boolean;
    viveConEstudiante: boolean;
  }): Promise<void> => {
    try {
      const res = await fetch('/api/padron/apoderados', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos)
      });
      if (res.ok) {
        const padronRes = await fetch('/api/padron/personas');
        if (padronRes.ok) {
          const pList = await padronRes.json();
          if (Array.isArray(pList)) setPersonas(pList);
        }
      }
    } catch (err) {
      console.error('Error linking apoderado:', err);
    }
  };

  const addMatricula = async (
    matData: Omit<Matricula, 'id' | 'codigoMatricula'>,
    cobro?: { monto: number; metodo: string }
  ): Promise<Matricula> => {
    // API Call
    const response = await fetch('/api/matriculas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(matData)
    });
    const rawMat = await response.json();
    const newMat: Matricula = {
      ...rawMat,
      programaId: rawMat.programaId || matData.programaId,
      moduloId: rawMat.moduloId || matData.moduloId,
      periodoAcademico: rawMat.periodoAcademico || matData.periodoAcademico || periodoActivo,
    };

    let reciboId: string | undefined = undefined;

    const est = estudiantes.find((e) => e.id === matData.estudianteId);
    const persona = est ? personas.find((p) => p.id === est.personaId) : undefined;

    if (cobro && persona) {
      const rec = await addRecibo({
        personaId: persona.id,
        conceptoId: 'cp-1',
        conceptoNombre: 'Derecho de Matrícula Regular / Módulo',
        monto: cobro.monto,
        metodoPago: cobro.metodo as any,
        estado: 'Emitido',
        observaciones: `Matrícula ${newMat.codigoMatricula} - Periodo ${newMat.periodoAcademico}`,
      });
      reciboId = rec.id;
      newMat.reciboPagoId = reciboId;
    } else if (persona && (matData.condicionArancelaria === 'EXONERADO' || matData.condicionArancelaria === 'BECA_COMPLETA')) {
      // Auto-generar Recibo Oficial de Gratuidad S/ 0.00
      const concMat = conceptosPago.find(c => c.nombre.toLowerCase().includes('matrícula') || c.codigo === 'CP-MAT') || conceptosPago[0];
      const baseTarifa = concMat?.monto || 50;
      const rec = await addRecibo({
        personaId: persona.id,
        conceptoId: concMat?.id || 'cp-1',
        conceptoNombre: concMat?.nombre || 'Derecho de Matrícula Modular',
        monto: 0,
        metodoPago: 'Efectivo',
        estado: 'Emitido',
        beneficioTipo: matData.condicionArancelaria,
        beneficioNombre: matData.convenioNombre || (matData.condicionArancelaria === 'EXONERADO' ? 'CONADIS / Discapacidad' : 'Beca 100%'),
        montoOriginal: baseTarifa,
        montoDescuento: baseTarifa,
        porcentajeDescuento: 100,
        documentoSustento: matData.resolucionSustento || undefined,
        observaciones: `Gratuidad de Matrícula ${newMat.codigoMatricula} - Periodo ${newMat.periodoAcademico}`,
      });
      if (rec) {
        reciboId = rec.id;
        newMat.reciboPagoId = reciboId;
        await updateMatricula(newMat.id, { reciboPagoId: rec.id }).catch(() => {});
      }
    }

    // Update matriculas list
    setMatriculas((prev) => {
      const filtered = prev.filter(m => m.id !== newMat.id);
      return [newMat, ...filtered];
    });

    // Update student's program and active state if missing
    setEstudiantes((prev) =>
      prev.map((e) =>
        e.id === matData.estudianteId
          ? {
              ...e,
              programaId: e.programaId || newMat.programaId || matData.programaId,
              periodoIngreso: e.periodoIngreso || newMat.periodoAcademico || periodoActivo,
            }
          : e
      )
    );

    // Ensure persona has esEstudiante = true
    if (persona) {
      setPersonas((prev) =>
        prev.map((p) => (p.id === persona.id ? { ...p, esEstudiante: true } : p))
      );
    }

    // Update section matriculados count if a section was assigned
    if (matData.seccionId) {
      setSecciones((prev) =>
        prev.map((s) => (s.id === matData.seccionId ? { ...s, matriculados: (s.matriculados || 0) + 1 } : s))
      );
    }

    addToast('Matrícula Exitosa', `Se generó la matrícula oficial ${newMat.codigoMatricula}`);
    addAuditoriaLog('NUEVA_MATRICULA', 'matriculas', `Matrícula ${newMat.codigoMatricula} en Sección ${matData.seccionId}`);
    return newMat;
  };

  const updateMatricula = async (matriculaId: string, updates: Partial<Matricula>): Promise<void> => {
    const response = await fetch(`/api/matriculas/${matriculaId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (response.ok) {
      const serverUpdated = await response.json().catch(() => ({}));
      setMatriculas((prev) =>
        prev.map((m) => (m.id === matriculaId ? { ...m, ...updates, ...serverUpdated } : m))
      );
      addToast('Matrícula Actualizada', 'Se modificó la condición arancelaria y datos de la matrícula.');
      addAuditoriaLog('ACTUALIZAR_MATRICULA', 'matriculas', `Actualización de matrícula ${matriculaId}`);
    } else {
      addToast('Error', 'No se pudo actualizar la matrícula', 'error');
    }
  };

  const deleteMatricula = async (matriculaId: string): Promise<void> => {
    const targetMat = matriculas.find((m) => m.id === matriculaId);
    const response = await fetch(`/api/matriculas/${matriculaId}`, {
      method: 'DELETE'
    });
    if (response.ok) {
      setMatriculas((prev) => prev.filter((m) => m.id !== matriculaId));
      if (targetMat?.seccionId) {
        setSecciones((prev) =>
          prev.map((s) =>
            s.id === targetMat.seccionId ? { ...s, matriculados: Math.max(0, s.matriculados - 1) } : s
          )
        );
      }
      addToast('Matrícula Eliminada', 'La matrícula ha sido retirada del sistema.', 'warning');
      addAuditoriaLog('ELIMINAR_MATRICULA', 'matriculas', `Eliminación de matrícula ${targetMat?.codigoMatricula || matriculaId}`);
    } else {
      addToast('Error', 'No se pudo eliminar la matrícula', 'error');
    }
  };

  const registrarRetiro = async (data: {
    matriculaId: string;
    motivo: string;
    tipoRetiro?: string;
    numeroDocumentoSustento?: string;
    fechaRetiro?: string;
    observaciones?: string;
  }): Promise<boolean> => {
    try {
      const targetMat = matriculas.find((m) => m.id === data.matriculaId);
      const res = await fetch('/api/matriculas/retiro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al registrar retiro');
      }
      
      const nuevoEstadoMat = data.tipoRetiro === 'RESERVA' ? 'RESERVA' : 'RETIRADO';
      setMatriculas((prev) =>
        prev.map((m) => (m.id === data.matriculaId ? { ...m, estadoMatricula: nuevoEstadoMat } : m))
      );

      if (targetMat?.seccionId) {
        setSecciones((prev) =>
          prev.map((s) =>
            s.id === targetMat.seccionId ? { ...s, matriculados: Math.max(0, (s.matriculados || 1) - 1) } : s
          )
        );
      }

      if (targetMat?.estudianteId) {
        const otrasActivas = matriculas.filter(
          (m) => m.estudianteId === targetMat.estudianteId && m.id !== targetMat.id && m.estadoMatricula === 'ACTIVA'
        );
        if (otrasActivas.length === 0) {
          const nuevoEstadoEst = data.tipoRetiro === 'RESERVA' ? 'Reserva' : 'Retirado';
          setEstudiantes((prev) =>
            prev.map((e) => (e.id === targetMat.estudianteId ? { ...e, estado: nuevoEstadoEst } : e))
          );
        }
      }

      addToast(
        data.tipoRetiro === 'RESERVA' ? 'Reserva Registrada' : 'Retiro Registrado',
        `Se formalizó el retiro de la matrícula ${targetMat?.codigoMatricula || ''}`,
        'warning'
      );
      addAuditoriaLog('REGISTRAR_RETIRO', 'retiros', `Retiro de matrícula ${targetMat?.codigoMatricula || data.matriculaId}: ${data.motivo}`);
      return true;
    } catch (error: any) {
      console.error('Error registrando retiro:', error);
      addToast('Error', error.message || 'No se pudo registrar el retiro', 'error');
      return false;
    }
  };

  const registrarTraslado = async (data: {
    matriculaOrigenId: string;
    tipoTraslado?: string;
    seccionDestinoId?: string;
    moduloDestinoId?: string;
    programaDestinoId?: string;
    planEstudioDestinoId?: string;
    sedeDestinoId?: string;
    institucionDestino?: string;
    institucionOrigen?: string;
    motivo?: string;
    resolucionDirectoral?: string;
    observaciones?: string;
  }): Promise<boolean> => {
    try {
      const targetMatOrigen = matriculas.find((m) => m.id === data.matriculaOrigenId);
      const res = await fetch('/api/matriculas/traslado', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al registrar traslado');
      }
      const json = await res.json();

      // Marcar matrícula de origen como TRASLADADO
      setMatriculas((prev) =>
        prev.map((m) => (m.id === data.matriculaOrigenId ? { ...m, estadoMatricula: 'TRASLADADO' } : m))
      );

      // Si se generó nueva matrícula destino, agregarla al estado
      if (json.matriculaDestino) {
        const newMat = json.matriculaDestino;
        setMatriculas((prev) => [
          {
            id: newMat.id,
            codigoMatricula: newMat.codigoMatricula,
            estudianteId: newMat.estudianteId,
            programaId: newMat.programaId || targetMatOrigen?.programaId,
            moduloId: newMat.moduloId,
            seccionId: newMat.seccionId,
            sedeId: newMat.sedeId,
            periodoAcademicoId: newMat.periodoAcademicoId,
            periodoAcademico: targetMatOrigen?.periodoAcademico || periodoActivo,
            tipo: 'Regular',
            fechaMatricula: newMat.fechaMatricula,
            condicion: 'TRASLADO',
            estadoMatricula: 'ACTIVA',
            formacion: newMat.formacion,
            oportunidadTecnica: newMat.oportunidadTecnica
          },
          ...prev
        ]);

        if (data.seccionDestinoId) {
          setSecciones((prev) =>
            prev.map((s) => (s.id === data.seccionDestinoId ? { ...s, matriculados: (s.matriculados || 0) + 1 } : s))
          );
        }
      }

      if (targetMatOrigen?.seccionId) {
        setSecciones((prev) =>
          prev.map((s) =>
            s.id === targetMatOrigen.seccionId ? { ...s, matriculados: Math.max(0, (s.matriculados || 1) - 1) } : s
          )
        );
      }

      if (data.tipoTraslado === 'EXTERNO_SALIDA' && targetMatOrigen?.estudianteId) {
        setEstudiantes((prev) =>
          prev.map((e) => (e.id === targetMatOrigen.estudianteId ? { ...e, estado: 'Trasladado' } : e))
        );
      }

      addToast('Traslado Registrado', `Se procesó el traslado de ${targetMatOrigen?.codigoMatricula || ''}`);
      addAuditoriaLog('REGISTRAR_TRASLADO', 'traslados', `Traslado de matrícula ${targetMatOrigen?.codigoMatricula || data.matriculaOrigenId}`);
      return true;
    } catch (error: any) {
      console.error('Error registrando traslado:', error);
      addToast('Error', error.message || 'No se pudo registrar el traslado', 'error');
      return false;
    }
  };

  const registrarReingreso = async (data: {
    estudianteId: string;
    matriculaAnteriorId?: string;
    seccionId?: string;
    moduloId: string;
    sedeId?: string;
    periodoAcademicoId?: string;
    motivo?: string;
    resolucionNumero?: string;
    requiereConvalidacion?: boolean;
    observaciones?: string;
  }): Promise<boolean> => {
    try {
      const res = await fetch('/api/matriculas/reingreso', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al registrar reingreso');
      }
      const json = await res.json();
      const newMat = json.matricula;

      if (newMat) {
        setMatriculas((prev) => [
          {
            id: newMat.id,
            codigoMatricula: newMat.codigoMatricula,
            estudianteId: newMat.estudianteId,
            moduloId: newMat.moduloId,
            seccionId: newMat.seccionId,
            sedeId: newMat.sedeId,
            periodoAcademicoId: newMat.periodoAcademicoId,
            periodoAcademico: periodoActivo,
            tipo: 'Reingreso',
            fechaMatricula: newMat.fechaMatricula,
            condicion: 'REINGRESO',
            estadoMatricula: 'ACTIVA'
          },
          ...prev
        ]);

        if (data.seccionId) {
          setSecciones((prev) =>
            prev.map((s) => (s.id === data.seccionId ? { ...s, matriculados: (s.matriculados || 0) + 1 } : s))
          );
        }

        setEstudiantes((prev) =>
          prev.map((e) => (e.id === data.estudianteId ? { ...e, estado: 'Regular' } : e))
        );
      }

      addToast('Reingreso Registrado', `Se matriculó exitosamente como reingresante (${newMat?.codigoMatricula || ''})`);
      addAuditoriaLog('REGISTRAR_REINGRESO', 'reingresos', `Reingreso de estudiante ${data.estudianteId}`);
      return true;
    } catch (error: any) {
      console.error('Error registrando reingreso:', error);
      addToast('Error', error.message || 'No se pudo registrar el reingreso', 'error');
      return false;
    }
  };

  const fetchMovimientosEstudiante = async (estudianteId: string) => {
    try {
      const res = await fetch(`/api/matriculas/movimientos/${estudianteId}`);
      if (!res.ok) return { retiros: [], traslados: [], reingresos: [] };
      return await res.json();
    } catch (error) {
      console.error('Error fetching movimientos:', error);
      return { retiros: [], traslados: [], reingresos: [] };
    }
  };

  const addSeccion = async (seccion: Omit<Seccion, 'id'>) => {
    try {
      const res = await fetch('/api/academic/secciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(seccion)
      });
      if (!res.ok) throw new Error('Failed to create seccion');
      const newSeccion = await res.json();
      setSecciones(prev => [...prev, newSeccion]);
      addToast('Sección Creada', `Se aperturó la sección ${newSeccion.nombre}`);
      addAuditoriaLog('CREAR_SECCION', 'secciones', `Creación de sección ${newSeccion.nombre} - ${newSeccion.turno}`);
      return newSeccion;
    } catch (error) {
      addToast('Error', 'No se pudo crear la sección', 'error');
      throw error;
    }
  };

  const updateSeccion = async (seccion: Seccion) => {
    try {
      const res = await fetch(`/api/academic/secciones/${seccion.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(seccion)
      });
      if (!res.ok) throw new Error('Failed to update seccion');
      setSecciones(prev => prev.map(s => s.id === seccion.id ? seccion : s));
      addToast('Sección Actualizada', `Se actualizaron los datos de la sección ${seccion.nombre}`);
    } catch (error) {
      addToast('Error', 'No se pudo actualizar la sección', 'error');
      throw error;
    }
  };

  const deleteSeccion = async (id: string) => {
    try {
      const res = await fetch(`/api/academic/secciones/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete seccion');
      setSecciones(prev => prev.filter(s => s.id !== id));
      addToast('Sección Eliminada', `La sección fue eliminada correctamente.`, 'warning');
    } catch (error) {
      addToast('Error', 'No se pudo eliminar la sección', 'error');
      throw error;
    }
  };

  const addPeriodoLectivo = async (pl: Omit<PeriodoLectivo, 'id'>) => {
    try {
      const res = await fetch('/api/academic/periodos-lectivos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pl)
      });
      if (!res.ok) throw new Error('Failed to create periodo lectivo');
      const newPL = await res.json();
      setPeriodosLectivos(prev => [newPL, ...prev]);
      addToast('Año Lectivo Registrado', `Se habilitó el ${newPL.nombre}`);
      addAuditoriaLog('CREAR_PERIODO_LECTIVO', 'periodos_lectivos', `Año lectivo ${newPL.codigo}`);
      return newPL;
    } catch (error) {
      addToast('Error', 'No se pudo crear el año lectivo', 'error');
      throw error;
    }
  };

  const updatePeriodoLectivo = async (pl: PeriodoLectivo) => {
    try {
      const res = await fetch(`/api/academic/periodos-lectivos/${pl.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pl)
      });
      if (!res.ok) throw new Error('Failed to update periodo lectivo');
      const updated = await res.json();
      if (pl.estado?.toUpperCase() === 'ACTIVO') {
        setPeriodosLectivos(prev => prev.map(p => p.id === pl.id ? updated : { ...p, estado: 'INACTIVO' }));
      } else {
        setPeriodosLectivos(prev => prev.map(p => p.id === pl.id ? updated : p));
      }
      addToast('Año Lectivo Actualizado', `Parámetros guardados exitosamente.`);
    } catch (error) {
      addToast('Error', 'No se pudo actualizar el año lectivo', 'error');
      throw error;
    }
  };

  const activarPeriodoLectivo = async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/academic/periodos-lectivos/${id}/activar`, {
        method: 'PUT'
      });
      if (!res.ok) throw new Error('Error al activar año lectivo');
      const data = await res.json();
      if (data.periodos) {
        setPeriodosLectivos(data.periodos);
      } else {
        setPeriodosLectivos(prev => prev.map(p => ({
          ...p,
          estado: p.id === id ? 'ACTIVO' : 'INACTIVO'
        })));
      }
      if (data.updated) {
        addToast('Año Lectivo Activado', `El año lectivo ${data.updated.nombre} (${data.updated.codigo}) ahora está ACTIVO.`, 'success');
      }
      return true;
    } catch (error: any) {
      console.error(error);
      addToast('Error', error.message || 'No se pudo activar el año lectivo', 'error');
      return false;
    }
  };

  const deletePeriodoLectivo = async (id: string) => {
    try {
      const res = await fetch(`/api/academic/periodos-lectivos/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete periodo lectivo');
      setPeriodosLectivos(prev => prev.filter(p => p.id !== id));
      addToast('Año Lectivo Eliminado', 'Se retiró el año lectivo del catálogo.', 'warning');
    } catch (error) {
      addToast('Error', 'No se pudo eliminar el año lectivo', 'error');
      throw error;
    }
  };

  const addPeriodoAcademico = async (pa: Omit<PeriodoAcademico, 'id'>) => {
    try {
      const res = await fetch('/api/academic/periodos-academicos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pa)
      });
      if (!res.ok) throw new Error('Failed to create periodo academico');
      const newPA = await res.json();
      setPeriodosAcademicos(prev => [newPA, ...prev]);
      addToast('Periodo Académico Registrado', `Se habilitó ${newPA.nombre}`);
      return newPA;
    } catch (error) {
      addToast('Error', 'No se pudo crear el periodo académico', 'error');
      throw error;
    }
  };

  const updatePeriodoAcademico = async (pa: PeriodoAcademico) => {
    try {
      const res = await fetch(`/api/academic/periodos-academicos/${pa.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pa)
      });
      if (!res.ok) throw new Error('Failed to update periodo academico');
      const updated = await res.json();
      if (pa.estado?.toUpperCase() === 'ACTIVO') {
        const cod = updated.codigo?.replace('PER-ACA-', '') || updated.codigo || updated.nombre;
        setPeriodoActivo(cod);
        setPeriodosAcademicos(prev => prev.map(p => p.id === pa.id ? updated : { ...p, estado: 'INACTIVO' }));
      } else {
        setPeriodosAcademicos(prev => prev.map(p => p.id === pa.id ? updated : p));
      }
      addToast('Periodo Académico Actualizado', `Parámetros actualizados.`);
    } catch (error) {
      addToast('Error', 'No se pudo actualizar el periodo académico', 'error');
      throw error;
    }
  };

  const activarPeriodoAcademico = async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/academic/periodos-academicos/${id}/activar`, {
        method: 'PUT'
      });
      if (!res.ok) throw new Error('Error al activar periodo académico');
      const data = await res.json();
      if (data.periodos) {
        setPeriodosAcademicos(data.periodos);
      } else {
        setPeriodosAcademicos(prev => prev.map(p => ({
          ...p,
          estado: p.id === id ? 'ACTIVO' : 'INACTIVO'
        })));
      }
      if (data.updated) {
        const cod = data.updated.codigo?.replace('PER-ACA-', '') || data.updated.codigo || data.updated.nombre;
        setPeriodoActivo(cod);
        addToast('Periodo Activado', `El periodo académico ${data.updated.nombre} (${data.updated.codigo}) ahora está ACTIVO en todo el sistema.`, 'success');
      }
      return true;
    } catch (error: any) {
      console.error(error);
      addToast('Error', error.message || 'No se pudo activar el periodo académico', 'error');
      return false;
    }
  };

  const deletePeriodoAcademico = async (id: string) => {
    try {
      const res = await fetch(`/api/academic/periodos-academicos/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete periodo academico');
      setPeriodosAcademicos(prev => prev.filter(p => p.id !== id));
      addToast('Periodo Eliminado', 'Periodo académico eliminado.', 'warning');
    } catch (error) {
      addToast('Error', 'No se pudo eliminar el periodo académico', 'error');
      throw error;
    }
  };

  const addPeriodoClases = async (pc: Omit<PeriodoClases, 'id'>) => {
    try {
      const res = await fetch('/api/academic/periodos-clases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pc)
      });
      if (!res.ok) throw new Error('Failed to create periodo clases');
      const newPC = await res.json();
      setPeriodosClases(prev => [newPC, ...prev]);
      addToast('Periodo de Clases Registrado', `Periodo de dictado ${newPC.nombre} creado.`);
      return newPC;
    } catch (error) {
      addToast('Error', 'No se pudo crear el periodo de clases', 'error');
      throw error;
    }
  };

  const updatePeriodoClases = async (pc: PeriodoClases) => {
    try {
      const res = await fetch(`/api/academic/periodos-clases/${pc.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pc)
      });
      if (!res.ok) throw new Error('Failed to update periodo clases');
      const updated = await res.json();
      setPeriodosClases(prev => prev.map(p => p.id === pc.id ? updated : p));
      addToast('Periodo de Clases Actualizado', `Fechas de clases actualizadas.`);
    } catch (error) {
      addToast('Error', 'No se pudo actualizar el periodo de clases', 'error');
      throw error;
    }
  };

  const deletePeriodoClases = async (id: string) => {
    try {
      const res = await fetch(`/api/academic/periodos-clases/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete periodo clases');
      setPeriodosClases(prev => prev.filter(p => p.id !== id));
      addToast('Periodo de Clases Eliminado', 'Registro retirado.', 'warning');
    } catch (error) {
      addToast('Error', 'No se pudo eliminar el periodo de clases', 'error');
      throw error;
    }
  };

  const addTurno = async (turno: Omit<Turno, 'id'>) => {
    try {
      const res = await fetch('/api/academic/turnos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(turno)
      });
      if (!res.ok) throw new Error('Failed to create turno');
      const newT = await res.json();
      setTurnos(prev => [...prev, newT]);
      addToast('Turno Registrado', `Se habilitó el turno ${newT.nombre}`);
      return newT;
    } catch (error) {
      addToast('Error', 'No se pudo registrar el turno', 'error');
      throw error;
    }
  };

  const updateTurno = async (turno: Turno) => {
    try {
      const res = await fetch(`/api/academic/turnos/${turno.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(turno)
      });
      if (!res.ok) throw new Error('Failed to update turno');
      const updated = await res.json();
      setTurnos(prev => prev.map(t => t.id === turno.id ? updated : t));
      addToast('Turno Actualizado', `Horario de turno ${turno.nombre} guardado.`);
    } catch (error) {
      addToast('Error', 'No se pudo actualizar el turno', 'error');
      throw error;
    }
  };

  const deleteTurno = async (id: string) => {
    try {
      const res = await fetch(`/api/academic/turnos/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete turno');
      setTurnos(prev => prev.filter(t => t.id !== id));
      addToast('Turno Eliminado', 'El turno ha sido retirado.', 'warning');
    } catch (error) {
      addToast('Error', 'No se pudo eliminar el turno', 'error');
      throw error;
    }
  };

  const addHorario = async (horario: Omit<Horario, 'id'>) => {
    try {
      const res = await fetch('/api/academic/horarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(horario)
      });
      if (!res.ok) throw new Error('Failed to create horario');
      const newH = await res.json();
      setHorarios(prev => [...prev, newH]);
      addToast('Horario Asignado', `Bloque de clase programado.`);
      return newH;
    } catch (error) {
      addToast('Error', 'No se pudo guardar el horario', 'error');
      throw error;
    }
  };

  const deleteHorario = async (id: string) => {
    try {
      const res = await fetch(`/api/academic/horarios/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete horario');
      setHorarios(prev => prev.filter(h => h.id !== id));
      addToast('Horario Eliminado', 'Bloque horario retirado.', 'warning');
    } catch (error) {
      addToast('Error', 'No se pudo eliminar el horario', 'error');
      throw error;
    }
  };

  const reloadAcademicData = async () => {
    await refreshData();
  };

  const ejecutarAperturaRapida = async (data: any) => {
    try {
      const res = await fetch('/api/academic/apertura-rapida', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Error en apertura rápida');
      }
      const result = await res.json();
      await refreshData();
      addToast('Apertura Completada con Éxito', `Se inicializó el periodo y se aperturaron ${result.totalSeccionesCreadas} secciones.`, 'success');
      return result;
    } catch (error: any) {
      addToast('Error en Apertura Rápida', error.message || 'No se pudo procesar la apertura', 'error');
      throw error;
    }
  };

  const saveNotasUnidad = async (notasNuevas: NotaUnidad[]): Promise<boolean> => {
    try {
      const response = await fetch('/api/notas/unidades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notasNuevas.map(n => ({
          ...n,
          usuarioId: currentUser?.id
        })))
      });
      const data = await response.json();
      if (!response.ok) {
        addToast('Error al Guardar', data.error || 'No se pudieron guardar las calificaciones.', 'error');
        return false;
      }

      // Refresh notas from server
      const refreshed = await fetch('/api/notas/unidades');
      if (refreshed.ok) {
        const list = await refreshed.json();
        setNotasUnidades(list);
      }
      addToast('Calificaciones Guardadas', `Se registraron ${notasNuevas.length} notas con éxito.`, 'success');
      return true;
    } catch (err: any) {
      console.error(err);
      addToast('Error', err.message || 'No se pudieron guardar las calificaciones.', 'error');
      return false;
    }
  };

  const cerrarActaUnidad = async (unidadId: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/notas/unidades/cerrar-acta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unidadId,
          usuarioId: currentUser?.id
        })
      });
      const data = await response.json();
      if (!response.ok) {
        addToast('Error al Cerrar Acta', data.error || 'No se pudo cerrar el acta', 'error');
        return false;
      }

      // Refresh notas from server
      const refreshed = await fetch('/api/notas/unidades');
      if (refreshed.ok) {
        const list = await refreshed.json();
        setNotasUnidades(list);
      }
      addToast('Acta Sellada y Bloqueada', data.message || 'El acta oficial ha sido cerrada con éxito.', 'success');
      return true;
    } catch (err: any) {
      console.error(err);
      addToast('Error', err.message || 'Error de conexión al cerrar acta', 'error');
      return false;
    }
  };

  const desbloquearActaUnidad = async (unidadId: string, motivo?: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/notas/unidades/desbloquear-acta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unidadId,
          usuarioId: currentUser?.id,
          motivo
        })
      });
      const data = await response.json();
      if (!response.ok) {
        addToast('Error al Desbloquear', data.error || 'No se pudo desbloquear el acta', 'error');
        return false;
      }

      // Refresh notas from server
      const refreshed = await fetch('/api/notas/unidades');
      if (refreshed.ok) {
        const list = await refreshed.json();
        setNotasUnidades(list);
      }
      addToast('Acta Reabierta', data.message || 'El acta ha sido desbloqueada para rectificación.', 'info');
      return true;
    } catch (err: any) {
      console.error(err);
      addToast('Error', err.message || 'Error al desbloquear acta', 'error');
      return false;
    }
  };

  const saveNotaEFSRT = async (nota: NotaEFSRT) => {
    await saveNotasEFSRTBatch([nota]);
  };

  const saveNotasEFSRTBatch = async (notas: NotaEFSRT[]): Promise<boolean> => {
    try {
      const response = await fetch('/api/notas/efsrt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registros: notas,
          usuarioId: currentUser?.id
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Error al guardar evaluaciones EFSRT');
      }

      const refreshed = await fetch('/api/notas/efsrt');
      if (refreshed.ok) {
        const list = await refreshed.json();
        setNotasEFSRT(list);
      }

      addToast('EFSRT Guardado', `Se guardaron ${notas.length} evaluaciones de prácticas preprofesionales.`, 'success');
      return true;
    } catch (err: any) {
      console.error(err);
      addToast('Error al Guardar EFSRT', err.message || 'No se pudo guardar la evaluación de prácticas.', 'error');
      return false;
    }
  };

  const cerrarActaEFSRT = async (moduloId: string, efsrtId?: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/notas/efsrt/cerrar-acta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moduloId,
          efsrtId,
          usuarioId: currentUser?.id
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Error al cerrar registro EFSRT');
      }

      const refreshed = await fetch('/api/notas/efsrt');
      if (refreshed.ok) {
        const list = await refreshed.json();
        setNotasEFSRT(list);
      }

      addToast('Registro EFSRT Sellado', data.message || 'Evaluación EFSRT sellada oficialmente.', 'success');
      return true;
    } catch (err: any) {
      console.error(err);
      addToast('Error', err.message || 'Error al cerrar evaluación EFSRT', 'error');
      return false;
    }
  };

  const desbloquearActaEFSRT = async (moduloId: string, efsrtId?: string, motivo?: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/notas/efsrt/desbloquear-acta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moduloId,
          efsrtId,
          motivo: motivo || 'Rectificación solicitada',
          usuarioId: currentUser?.id
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Error al desbloquear registro EFSRT');
      }

      const refreshed = await fetch('/api/notas/efsrt');
      if (refreshed.ok) {
        const list = await refreshed.json();
        setNotasEFSRT(list);
      }

      addToast('Registro EFSRT Reabierto', data.message || 'El registro ha sido desbloqueado para rectificación.', 'info');
      return true;
    } catch (err: any) {
      console.error(err);
      addToast('Error', err.message || 'Error al desbloquear registro EFSRT', 'error');
      return false;
    }
  };

  const fetchAsistencias = async (filtros?: { seccionId?: string; unidadId?: string; fecha?: string }): Promise<AsistenciaEstudiante[]> => {
    try {
      const params = new URLSearchParams();
      if (filtros?.seccionId) params.append('seccionId', filtros.seccionId);
      if (filtros?.unidadId) params.append('unidadId', filtros.unidadId);
      if (filtros?.fecha) params.append('fecha', filtros.fecha);

      const res = await fetch(`/api/notas/asistencias?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setAsistencias(data);
        return data;
      }
      return [];
    } catch (error) {
      console.error('Error fetching asistencias:', error);
      return [];
    }
  };

  const saveAsistenciasBatch = async (data: {
    fecha: string;
    unidadId?: string;
    seccionId?: string;
    registros: { matriculaId: string; estadoAsistenciaId: string; observacion?: string }[];
  }): Promise<boolean> => {
    try {
      const res = await fetch('/api/notas/asistencias/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          usuarioId: currentUser?.id
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al guardar asistencia');
      }

      await fetchAsistencias({
        seccionId: data.seccionId,
        unidadId: data.unidadId,
        fecha: data.fecha
      });

      addToast('Asistencia Guardada', `Se registró la asistencia de ${data.registros.length} estudiantes con éxito.`, 'success');
      addAuditoriaLog('REGISTRO_ASISTENCIA', 'asistencias_estudiantes', `Asistencia fecha ${data.fecha} (${data.registros.length} alumnos)`);
      return true;
    } catch (error: any) {
      console.error('Error in saveAsistenciasBatch:', error);
      addToast('Error al Guardar', error.message || 'No se pudo procesar la asistencia', 'error');
      return false;
    }
  };

  const fetchAsistenciasTrabajadores = async (filtros?: { fecha?: string; mes?: number; anio?: number; trabajadorId?: string }): Promise<AsistenciaTrabajador[]> => {
    try {
      const params = new URLSearchParams();
      if (filtros?.fecha) params.append('fecha', filtros.fecha);
      if (filtros?.mes) params.append('mes', filtros.mes.toString());
      if (filtros?.anio) params.append('anio', filtros.anio.toString());
      if (filtros?.trabajadorId) params.append('trabajadorId', filtros.trabajadorId);

      const res = await fetch(`/api/personal/asistencias?${params.toString()}`);
      if (!res.ok) throw new Error('Error al consultar asistencias de personal');
      const data = await res.json();
      setAsistenciasTrabajadores(data);
      return data;
    } catch (error) {
      console.error('Error fetching asistencias trabajadores:', error);
      return [];
    }
  };

  const saveAsistenciasTrabajadoresBatch = async (data: {
    fecha: string;
    registros: Array<{
      trabajadorId: string;
      horaEntrada?: string | null;
      horaSalida?: string | null;
      estadoAsistencia?: string;
      observacion?: string | null;
      minutosTardanza?: number;
      tipoRegistro?: string;
    }>;
    usuarioId?: string;
  }): Promise<boolean> => {
    try {
      const res = await fetch('/api/personal/asistencias/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          usuarioId: currentUser?.id
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al guardar asistencia de personal');
      }

      await fetchAsistenciasTrabajadores({ fecha: data.fecha });
      addToast('Asistencia de Personal Guardada', `Se registró la asistencia de ${data.registros.length} trabajadores con éxito.`, 'success');
      addAuditoriaLog('REGISTRO_ASISTENCIA_PERSONAL', 'asistencias_trabajadores', `Fecha ${data.fecha} (${data.registros.length} trabajadores)`);
      return true;
    } catch (error: any) {
      console.error('Error saving batch asistencias trabajadores:', error);
      addToast('Error al Guardar', error.message || 'No se pudo guardar la asistencia del personal', 'error');
      return false;
    }
  };

  const marcarAsistenciaTrabajadorDni = async (dni: string): Promise<{
    success: boolean;
    tipo?: string;
    hora?: string;
    trabajador?: any;
    message: string;
    minutosTardanza?: number;
    estadoAsistencia?: string;
  }> => {
    try {
      const res = await fetch('/api/personal/asistencias/marcar-dni', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dni,
          usuarioId: currentUser?.id
        })
      });

      let data: any = {};
      try {
        data = await res.json();
      } catch (e) {
        console.warn('No se pudo parsear la respuesta como JSON:', e);
      }

      if (!res.ok) {
        return {
          success: false,
          message: data?.message || `Error en el servidor (Código ${res.status})`
        };
      }

      const today = new Date().toISOString().split('T')[0];
      fetchAsistenciasTrabajadores({ fecha: today });

      return data;
    } catch (error: any) {
      console.error('Error in marcarAsistenciaTrabajadorDni:', error);
      return {
        success: false,
        message: error.message || 'Error de conexión con el servidor'
      };
    }
  };

  const fetchReporteMensualPersonal = async (mes: number, anio: number): Promise<ResumenMensualTrabajador[]> => {
    try {
      const res = await fetch(`/api/personal/asistencias/reporte-mensual?mes=${mes}&anio=${anio}`);
      if (!res.ok) throw new Error('Error al obtener reporte mensual');
      return await res.json();
    } catch (error) {
      console.error('Error fetching reporte mensual:', error);
      return [];
    }
  };

  const addRecibo = async (
    recData: Omit<ReciboPago, 'id' | 'numeroRecibo' | 'fechaEmision' | 'horaEmision' | 'cajeroNombre'> & { numeroRecibo?: string }
  ): Promise<ReciboPago> => {
    const response = await fetch('/api/tesoreria/pagos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(recData)
    });
    const newRecibo = await response.json();

    setRecibos((prev) => {
      let next = [newRecibo, ...prev.filter(r => r.id !== newRecibo.id)];
      // Si este cobro amortiza un recibo padre anterior, actualizamos el saldo del padre
      if (newRecibo.pagoPadreId) {
        next = next.map(r => {
          if (r.id === newRecibo.pagoPadreId) {
            const currentPending = Number(r.montoPendiente || 0);
            const updatedPending = Math.max(0, currentPending - Number(newRecibo.monto));
            return {
              ...r,
              montoPendiente: updatedPending,
              estado: updatedPending <= 0 ? 'Pagado' : 'Pendiente'
            };
          }
          return r;
        });
      }
      safeStorageSet('siga_recibos', JSON.stringify(next));
      return next;
    });
    addToast('Recibo Registrado', `${newRecibo.numeroRecibo} por S/ ${newRecibo.monto.toFixed(2)} registrado correctamente en caja.`);
    addAuditoriaLog('EMISION_RECIBO', 'pagos', `Recibo ${newRecibo.numeroRecibo} (${newRecibo.conceptoNombre}) por S/ ${newRecibo.monto.toFixed(2)}`);
    return newRecibo;
  };

  const anularRecibo = async (reciboId: string, motivo?: string): Promise<void> => {
    const response = await fetch(`/api/tesoreria/pagos/${reciboId}/anular`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ motivo })
    });
    
    if (response.ok) {
      const updated = await response.json();
      setRecibos((prev) =>
        prev.map((r) =>
          r.id === reciboId
            ? {
                ...r,
                estado: 'Anulado',
                observaciones: updated.observaciones,
              }
            : r
        )
      );
      addToast('Recibo Anulado', 'El recibo ha sido marcado como ANULADO.', 'warning');
      addAuditoriaLog('ANULAR_RECIBO', 'pagos', `Anulación de recibo ${reciboId}: ${motivo || 'Sin motivo especificado'}`);
    }
  };

  const deleteRecibo = async (reciboId: string): Promise<void> => {
    const response = await fetch(`/api/tesoreria/pagos/${reciboId}`, {
      method: 'DELETE'
    });
    if (response.ok) {
      setRecibos((prev) => prev.filter((r) => r.id !== reciboId));
      addToast('Pago Eliminado', 'El registro de pago ha sido eliminado.', 'warning');
      addAuditoriaLog('ELIMINAR_PAGO', 'pagos', `Eliminación de recibo ID ${reciboId}`);
    } else {
      addToast('Error', 'No se pudo eliminar el recibo', 'error');
    }
  };

  const refreshConceptosPago = async (): Promise<void> => {
    try {
      const res = await fetch('/api/tesoreria/conceptos');
      if (res.ok) {
        const data = await res.json();
        setConceptosPago(data);
        safeStorageSet('siga_conceptos_pago', JSON.stringify(data));
      }
    } catch (e) {
      console.warn('Error al refrescar conceptos de pago:', e);
    }
  };

  const updateConceptoPago = async (id: string, data: Partial<ConceptoPago>): Promise<boolean> => {
    try {
      const response = await fetch(`/api/tesoreria/conceptos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (response.ok) {
        const updated = await response.json();
        setConceptosPago((prev) =>
          prev.map((c) => (c.id === id ? { ...c, ...updated } : c))
        );
        addToast('Tarifa Actualizada', `El arancel "${updated.nombre || updated.concepto}" ha sido actualizado.`);
        addAuditoriaLog('ACTUALIZAR_TARIFA', 'conceptos_pagos', `Modificación de tarifa arancelaria: ${updated.nombre || updated.concepto}`);
        return true;
      }
      return false;
    } catch (e) {
      console.error('Error updating concepto:', e);
      addToast('Error', 'No se pudo actualizar la tarifa', 'error');
      return false;
    }
  };

  const addConceptoPago = async (data: Omit<ConceptoPago, 'id'>): Promise<ConceptoPago | null> => {
    try {
      const response = await fetch('/api/tesoreria/conceptos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (response.ok) {
        const created = await response.json();
        setConceptosPago((prev) => [...prev, created]);
        addToast('Tarifa Creada', `Nuevo concepto arancelario "${created.nombre || created.concepto}" agregado.`);
        addAuditoriaLog('CREAR_TARIFA', 'conceptos_pagos', `Creación de tarifa arancelaria: ${created.nombre || created.concepto}`);
        return created;
      }
      return null;
    } catch (e) {
      console.error('Error adding concepto:', e);
      addToast('Error', 'No se pudo crear la tarifa', 'error');
      return null;
    }
  };

  const addCursoLibre = (cursoData: Omit<CursoLibre, 'id' | 'codigo' | 'inscritos'>): CursoLibre => {
    const nextCod = (cursosLibres.length + 1).toString().padStart(2, '0');
    const codigo = `CUR-EXT-${nextCod}`;
    const newCurso: CursoLibre = {
      ...cursoData,
      id: 'cur-' + (cursosLibres.length + 1),
      codigo,
      inscritos: 0,
    };
    setCursosLibres((prev) => [newCurso, ...prev]);
    addToast('Curso Creado', `Taller "${newCurso.nombre}" aperturado.`);
    addAuditoriaLog('CREAR_CURSO_LIBRE', 'cursos_libres', `Apertura de taller libre ${newCurso.nombre}`);
    return newCurso;
  };

  const inscribirCursoLibre = async (cursoId: string, personaId: string, monto: number, metodo: string) => {
    const curso = cursosLibres.find((c) => c.id === cursoId);
    const persona = personas.find((p) => p.id === personaId);
    if (!curso || !persona) return;

    const recibo = await addRecibo({
      personaId,
      conceptoId: 'cp-6',
      conceptoNombre: `Inscripción: ${curso.nombre}`,
      monto,
      metodoPago: metodo as any,
      estado: 'Emitido',
      observaciones: `Curso de Extensión ${curso.codigo}`,
    });

    const newInscripcion: InscripcionCursoLibre = {
      id: 'insc-' + (inscripcionesCursos.length + 1),
      cursoId,
      personaId,
      fechaInscripcion: new Date().toISOString().split('T')[0],
      montoPagado: monto,
      reciboId: recibo.id,
      certificadoEmitido: false,
    };

    setInscripcionesCursos((prev) => [newInscripcion, ...prev]);
    setCursosLibres((prev) =>
      prev.map((c) => (c.id === cursoId ? { ...c, inscritos: c.inscritos + 1 } : c))
    );

    addToast('Inscripción Registrada', `${persona.nombres} ${persona.apellidoPaterno} inscrito al curso.`);
    addAuditoriaLog('INSCRIPCION_CURSO', 'inscripciones_cursos', `Inscripción de ${persona.nombres} al curso ${curso.nombre}`);
  };

  const addBienPatrimonial = (bienData: Omit<BienPatrimonial, 'id'>): BienPatrimonial => {
    const newBien: BienPatrimonial = {
      ...bienData,
      id: 'bien-' + (bienesPatrimoniales.length + 1),
    };
    setBienesPatrimoniales((prev) => [newBien, ...prev]);
    addToast('Bien Registrado', `Código Patrimonial: ${newBien.codigoPatrimonial}`);
    addAuditoriaLog('REGISTRAR_BIEN_PATRIMONIAL', 'inventario', `Ingreso de equipo ${newBien.nombre} a ${newBien.taller}`);
    return newBien;
  };

  const updateBienPatrimonial = (updated: BienPatrimonial) => {
    setBienesPatrimoniales((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
    addToast('Patrimonio Actualizado', `Ficha del bien ${updated.codigoPatrimonial} guardada.`);
    addAuditoriaLog('ACTUALIZAR_BIEN', 'inventario', `Actualización de estado en ${updated.codigoPatrimonial}`);
  };

  const emitirDocumentoOficial = async (
    docData: Omit<DocumentoOficial, 'id' | 'numeroDocumento' | 'codigoVerificacionQR' | 'fechaEmision'>
  ): Promise<DocumentoOficial> => {
    try {
      const res = await fetch('/api/documentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...docData,
          usuarioId: currentUser?.id
        })
      });
      if (res.ok) {
        const newDoc: DocumentoOficial = await res.json();
        setDocumentosOficiales(prev => [newDoc, ...prev]);

        // Transición Automática de Estados del Estudiante
        if (docData.estudianteId) {
          setEstudiantes(prev => prev.map(est => {
            if (est.id === docData.estudianteId) {
              if (docData.tipo === 'Constancia de Egresado' || (docData.titulo?.toLowerCase().includes('egresado'))) {
                return { ...est };
              }
              if (docData.tipo === 'Resolución Directoral' && (docData.titulo?.toLowerCase().includes('títul') || docData.titulo?.toLowerCase().includes('titul'))) {
                return { ...est };
              }
            }
            return est;
          }));
        }

        addToast('Documento Emitido', `Documento Oficial ${newDoc.numeroDocumento} generado con QR y guardado.`);
        return newDoc;
      }
    } catch (e) {
      console.error('Error al emitir documento oficial:', e);
    }

    const prefix =
      docData.tipo === 'Certificado Modular'
        ? 'CERT-MOD'
        : docData.tipo === 'Constancia de Estudios'
        ? 'CONST-EST'
        : docData.tipo === 'Ficha de Matrícula'
        ? 'FICHA-MAT'
        : 'DOC-OF';

    const nextSeq = (documentosOficiales.length + 1).toString().padStart(4, '0');
    const numeroDocumento = `${prefix}-2026-${nextSeq}`;
    const fechaEmision = new Date().toISOString().split('T')[0];
    const hash = Math.random().toString(36).substring(2, 10);
    const codigoVerificacionQR = `https://siga.cetprojuanjui.edu.pe/validar?doc=${numeroDocumento}&hash=${hash}`;

    const newDoc: DocumentoOficial = {
      ...docData,
      id: 'doc-of-' + Date.now(),
      numeroDocumento,
      fechaEmision,
      codigoVerificacionQR,
    };

    setDocumentosOficiales((prev) => [newDoc, ...prev]);
    return newDoc;
  };

  const updatePrograma = async (id: string, updates: Partial<ProgramaEstudio>) => {
    setProgramas(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    
    if (updates.estado === 'INACTIVO') {
      setModulos(prev => {
        const next = prev.map(m => m.programaId === id ? { ...m, estado: 'INACTIVO' } : m);
        const affectedModulos = next.filter(m => m.programaId === id).map(m => m.id);
        setTimeout(() => {
          setSecciones(prevSec => prevSec.map(s => affectedModulos.includes(s.moduloId) ? { ...s, estado: 'INACTIVO' } : s));
        }, 0);
        return next;
      });
    }

    try {
      await fetch(`/api/academic/programas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
    } catch (error) {
      console.error('Failed to update programa:', error);
    }
  };

  const updateModulo = async (id: string, updates: Partial<ModuloFormativo>) => {
    setModulos(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
    try {
      await fetch('/api/academic/modulos/' + id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
    } catch(e) {}
  };

  const deleteCursoLibre = (id: string) => {
    setCursosLibres((prev) => prev.filter((c) => c.id !== id));
    addToast('Taller Eliminado', 'El curso de formación continua ha sido eliminado.', 'warning');
    addAuditoriaLog('ELIMINAR_CURSO_LIBRE', 'cursos_libres', `Eliminación de taller ID ${id}`);
  };

  const deleteBienPatrimonial = (id: string) => {
    setBienesPatrimoniales((prev) => prev.filter((b) => b.id !== id));
    addToast('Bien Eliminado', 'El registro de inventario ha sido eliminado.', 'warning');
    addAuditoriaLog('ELIMINAR_BIEN', 'inventario', `Eliminación de bien patrimonial ID ${id}`);
  };

  const addDocumentoAcervo = async (
    docData: Omit<DocumentoOficial, 'id' | 'codigoVerificacionQR'>
  ): Promise<DocumentoOficial> => {
    try {
      const res = await fetch('/api/documentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...docData,
          usuarioId: currentUser?.id
        })
      });
      if (res.ok) {
        const newDoc: DocumentoOficial = await res.json();
        setDocumentosOficiales(prev => [newDoc, ...prev]);
        addToast('Documento Registrado', `${newDoc.numeroDocumento} guardado en el acervo institucional.`, 'success');
        return newDoc;
      }
    } catch (e) {
      console.error('Error al registrar documento en acervo:', e);
    }

    const hash = Math.random().toString(36).substring(2, 10);
    const codigoVerificacionQR = `https://siga.cetprojuanjui.edu.pe/validar?doc=${encodeURIComponent(docData.numeroDocumento)}&hash=${hash}`;
    const newDoc: DocumentoOficial = {
      ...docData,
      id: 'doc-acervo-' + Date.now(),
      codigoVerificacionQR,
    };
    setDocumentosOficiales((prev) => [newDoc, ...prev]);
    addToast('Documento Registrado', `${newDoc.numeroDocumento} guardado.`);
    return newDoc;
  };

  const updateDocumentoOficial = async (updated: DocumentoOficial) => {
    setDocumentosOficiales((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
    try {
      await fetch(`/api/documentos/${updated.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...updated,
          usuarioId: currentUser?.id
        })
      });
      addToast('Documento Actualizado', `${updated.numeroDocumento} actualizado correctamente.`);
    } catch (e) {
      console.error('Error al actualizar documento:', e);
    }
  };

  const deleteDocumentoOficial = async (id: string) => {
    const docToDelete = documentosOficiales.find((d) => d.id === id);
    setDocumentosOficiales((prev) => prev.filter((d) => d.id !== id));
    try {
      await fetch(`/api/documentos/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuarioId: currentUser?.id })
      });
      addToast('Documento Eliminado', `El documento ${docToDelete?.numeroDocumento || ''} ha sido retirado del archivo.`, 'warning');
    } catch (e) {
      console.error('Error al eliminar documento:', e);
    }
  };

  const uploadDocumentoArchivo = async (file: File) => {
    const formData = new FormData();
    formData.append('archivo', file);
    const res = await fetch('/api/documentos/upload', {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Error al subir archivo');
    }
    return await res.json();
  };

  const refreshEgresados = async () => {
    try {
      const [r1, r2] = await Promise.all([
        fetch('/api/egresados'),
        fetch('/api/egresados/candidatos')
      ]);
      if (r1.ok) {
        const data = await r1.json();
        setEgresados(data);
      }
      if (r2.ok) {
        const candData = await r2.json();
        setCandidatosEgreso(candData);
      }
    } catch (e) {
      console.error('Error al refrescar egresados:', e);
    }
  };

  const addEgresado = async (data: any): Promise<EgresadoDetallado | null> => {
    try {
      const res = await fetch('/api/egresados', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          usuarioId: currentUser?.id
        })
      });
      if (res.ok) {
        const newEgr: EgresadoDetallado = await res.json();
        await refreshEgresados();
        addToast('Egresado Registrado', `Egresado ${newEgr.codigoEgresado} registrado oficialmente.`, 'success');
        return newEgr;
      } else {
        const err = await res.json();
        addToast('Error', err.error || 'No se pudo registrar egresado', 'error');
      }
    } catch (e: any) {
      console.error('Error al agregar egresado:', e);
      addToast('Error', e.message || 'Error de conexión', 'error');
    }
    return null;
  };

  const updateEgresado = async (id: string, data: any): Promise<boolean> => {
    try {
      const res = await fetch(`/api/egresados/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, usuarioId: currentUser?.id })
      });
      if (res.ok) {
        await refreshEgresados();
        addToast('Egresado Actualizado', 'Los datos del egresado se actualizaron correctamente.', 'success');
        return true;
      }
    } catch (e) {
      console.error('Error al actualizar egresado:', e);
    }
    return false;
  };

  const registrarTitulacionEgresado = async (id: string, data: any): Promise<boolean> => {
    try {
      const res = await fetch(`/api/egresados/${id}/titulacion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, usuarioId: currentUser?.id })
      });
      if (res.ok) {
        await refreshEgresados();
        addToast('Título Registrado', 'Sustentación y Título oficial registrados con éxito.', 'success');
        return true;
      } else {
        const err = await res.json();
        addToast('Error', err.error || 'Error al registrar titulación', 'error');
      }
    } catch (e: any) {
      console.error('Error al registrar titulación:', e);
    }
    return false;
  };

  const actualizarSeguimientoLaboral = async (id: string, data: any): Promise<boolean> => {
    try {
      const res = await fetch(`/api/egresados/${id}/seguimiento`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        await refreshEgresados();
        addToast('Seguimiento Laboral', 'Estado de inserción laboral actualizado.', 'success');
        return true;
      }
    } catch (e) {
      console.error('Error al actualizar seguimiento:', e);
    }
    return false;
  };

  const deleteEgresado = async (id: string, motivo?: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/egresados/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ motivo, usuarioId: currentUser?.id })
      });
      if (res.ok) {
        await refreshEgresados();
        addToast('Registro Eliminado', 'El egresado fue removido del padrón.', 'info');
        return true;
      }
    } catch (e) {
      console.error('Error al eliminar egresado:', e);
    }
    return false;
  };

  const refreshCertificadosModulares = async () => {
    try {
      const [r1, r2] = await Promise.all([
        fetch('/api/certificados-modulares'),
        fetch('/api/certificados-modulares/aptos')
      ]);
      if (r1.ok) {
        const data = await r1.json();
        setCertificadosModulares(data);
      }
      if (r2.ok) {
        const aptos = await r2.json();
        setAptosCertificacionModular(aptos);
      }
    } catch (e) {
      console.error('Error al refrescar certificados modulares:', e);
    }
  };

  const emitirCertificadoModular = async (data: any): Promise<CertificadoModularDetallado | null> => {
    try {
      const res = await fetch('/api/certificados-modulares', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          usuarioId: currentUser?.id,
        }),
      });
      if (res.ok) {
        const newCert: CertificadoModularDetallado = await res.json();
        await refreshCertificadosModulares();
        addToast('Certificado Emitido', `Certificado ${newCert.codigoCertificado || newCert.numeroCertificado} generado exitosamente.`, 'success');
        return newCert;
      } else {
        const err = await res.json();
        addToast('Error', err.error || 'No se pudo emitir el certificado modular', 'error');
        return null;
      }
    } catch (e: any) {
      console.error('Error al emitir certificado modular:', e);
      addToast('Error', e.message || 'Error de conexión', 'error');
      return null;
    }
  };

  const updateCertificadoModular = async (id: string, data: any): Promise<boolean> => {
    try {
      const res = await fetch(`/api/certificados-modulares/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          usuarioId: currentUser?.id,
        }),
      });
      if (res.ok) {
        await refreshCertificadosModulares();
        addToast('Certificado Actualizado', 'Los datos del certificado modular se actualizaron correctamente.', 'success');
        return true;
      } else {
        const err = await res.json();
        addToast('Error', err.error || 'Error al actualizar certificado modular', 'error');
        return false;
      }
    } catch (e: any) {
      console.error('Error al actualizar certificado modular:', e);
      addToast('Error', e.message || 'Error de conexión', 'error');
      return false;
    }
  };

  const deleteCertificadoModular = async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/certificados-modulares/${id}?usuarioId=${currentUser?.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        await refreshCertificadosModulares();
        addToast('Certificado Eliminado', 'El certificado modular ha sido retirado.', 'warning');
        return true;
      } else {
        const err = await res.json();
        addToast('Error', err.error || 'No se pudo eliminar el certificado', 'error');
        return false;
      }
    } catch (e: any) {
      console.error('Error al eliminar certificado modular:', e);
      addToast('Error', e.message || 'Error de conexión', 'error');
      return false;
    }
  };

  const refreshCertificadosEstudios = async () => {
    try {
      const res = await fetch('/api/certificados-estudios');
      if (res.ok) {
        const data = await res.json();
        setCertificadosEstudios(data);
      }
    } catch (e) {
      console.error('Error al refrescar certificados de estudios:', e);
    }
  };

  const emitirCertificadoEstudio = async (data: any): Promise<CertificadoEstudioDetallado | null> => {
    try {
      const res = await fetch('/api/certificados-estudios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          usuarioId: currentUser?.id,
        }),
      });
      if (res.ok) {
        const newCert: CertificadoEstudioDetallado = await res.json();
        await refreshCertificadosEstudios();
        addToast('Certificado de Estudios Emitido', `Certificado ${newCert.codigoCertificado || newCert.numeroCertificado} generado exitosamente.`, 'success');
        return newCert;
      } else {
        const err = await res.json();
        addToast('Error', err.error || 'No se pudo emitir el certificado de estudios', 'error');
        return null;
      }
    } catch (e: any) {
      console.error('Error al emitir certificado de estudios:', e);
      addToast('Error', e.message || 'Error de conexión', 'error');
      return null;
    }
  };

  const updateCertificadoEstudio = async (id: string, data: any): Promise<boolean> => {
    try {
      const res = await fetch(`/api/certificados-estudios/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          usuarioId: currentUser?.id,
        }),
      });
      if (res.ok) {
        await refreshCertificadosEstudios();
        addToast('Certificado de Estudios Actualizado', 'Los datos se actualizaron correctamente.', 'success');
        return true;
      } else {
        const err = await res.json();
        addToast('Error', err.error || 'Error al actualizar certificado de estudios', 'error');
        return false;
      }
    } catch (e: any) {
      console.error('Error al actualizar certificado de estudios:', e);
      addToast('Error', e.message || 'Error de conexión', 'error');
      return false;
    }
  };

  const deleteCertificadoEstudio = async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/certificados-estudios/${id}?usuarioId=${currentUser?.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        await refreshCertificadosEstudios();
        addToast('Certificado de Estudios Eliminado', 'El certificado oficial ha sido retirado.', 'warning');
        return true;
      } else {
        const err = await res.json();
        addToast('Error', err.error || 'No se pudo eliminar el certificado de estudios', 'error');
        return false;
      }
    } catch (e: any) {
      console.error('Error al eliminar certificado de estudios:', e);
      addToast('Error', e.message || 'Error de conexión', 'error');
      return false;
    }
  };

  // --- MÓDULO TITULACIONES OFICIALES (R.V.M. N° 188-2020-MINEDU / ANEXOS 5A y 5B) ---
  const refreshTitulos = async () => {
    try {
      const [resTit, resAptos] = await Promise.all([
        fetch('/api/titulos'),
        fetch('/api/titulos/aptos')
      ]);
      if (resTit.ok) {
        const dataTit = await resTit.json();
        setTitulos(dataTit);
      }
      if (resAptos.ok) {
        const dataAptos = await resAptos.json();
        setAptosTitulacion(dataAptos);
      }
    } catch (e) {
      console.error('Error al refrescar títulos oficiales:', e);
    }
  };

  const emitirTitulo = async (data: any): Promise<TituloDetallado | null> => {
    try {
      const payload = {
        ...data,
        usuarioId: currentUser?.id
      };
      const res = await fetch('/api/titulos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const nuevo = await res.json();
        await refreshTitulos();
        await refreshEgresados();
        addToast('Título Registrado con Éxito', `Código asignado: ${nuevo.codigoTitulo}. Se emitió el acta de sustentación y título oficial.`, 'success');
        return nuevo;
      } else {
        const err = await res.json();
        addToast('Error al Emitir Título', err.error || 'No se pudo emitir el título oficial', 'error');
        return null;
      }
    } catch (e: any) {
      console.error('Error al emitir título:', e);
      addToast('Error', e.message || 'Error de conexión', 'error');
      return null;
    }
  };

  const updateTitulo = async (id: string, data: any): Promise<boolean> => {
    try {
      const payload = {
        ...data,
        usuarioId: currentUser?.id
      };
      const res = await fetch(`/api/titulos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        await refreshTitulos();
        addToast('Título Actualizado', 'Los datos del título oficial se actualizaron correctamente.', 'success');
        return true;
      } else {
        const err = await res.json();
        addToast('Error', err.error || 'Error al actualizar título', 'error');
        return false;
      }
    } catch (e: any) {
      console.error('Error al actualizar título:', e);
      addToast('Error', e.message || 'Error de conexión', 'error');
      return false;
    }
  };

  const deleteTitulo = async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/titulos/${id}?usuarioId=${currentUser?.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        await refreshTitulos();
        await refreshEgresados();
        addToast('Título Eliminado', 'El título oficial ha sido retirado y el estado del egresado restaurado.', 'warning');
        return true;
      } else {
        const err = await res.json();
        addToast('Error', err.error || 'No se pudo eliminar el título', 'error');
        return false;
      }
    } catch (e: any) {
      console.error('Error al eliminar título:', e);
      addToast('Error', e.message || 'Error de conexión', 'error');
      return false;
    }
  };

  const resetToSeedData = () => {
    localStorage.clear();
    setInstitucion(INSTITUCION_ACTUAL);
    setPersonas(PERSONAS_SEED);
    setEstudiantes(ESTUDIANTES_SEED);
    setTrabajadors(TRABAJADORS_SEED);
    setProgramas(PROGRAMAS_SEED);
    setModulos(MODULOS_SEED);
    setUnidades(UNIDADES_SEED);
    setSecciones(SECCIONES_SEED);
    setMatriculas(MATRICULAS_SEED);
    setNotasUnidades(NOTAS_UNIDADES_SEED);
    setNotasEFSRT(NOTAS_EFSRT_SEED);
    setConceptosPago(CONCEPTOS_PAGO_SEED);
    setRecibos(RECIBOS_SEED);
    setCursosLibres(CURSOS_LIBRES_SEED);
    setInscripcionesCursos(INSCRIPCIONES_CURSOS_SEED);
    setBienesPatrimoniales(BIENES_PATRIMONIALES_SEED);
    setDocumentosOficiales(DOCUMENTOS_SEED);
    setUsuarios(USUARIOS_SEED);
    setAuditoriaLogs(AUDITORIA_SEED);
    setMetasProgramas(METAS_PROGRAMAS_SEED);
    addToast('Datos Restaurados', 'Se han restaurado los datos iniciales de demostración.', 'info');
  };

  return (
    <AppContext.Provider
      value={{
        activeView,
        setActiveView: handleSetActiveView,
        isMobileMenuOpen,
        setIsMobileMenuOpen,
        refreshData,
        refreshModularData,
        isAutoSyncing,
        currentUser,
        switchUser,
        isAuthenticated,
        login,
        logout,
        periodoActivo,
        setPeriodoActivo,
        hasPermission,
        canAccessView,
        userPermissions,
        selectedEstudianteId,
        setSelectedEstudianteId,
        selectedPersonaId,
        setSelectedPersonaId,
        institucion,
        updateInstitucion,
        personas,
        estudiantes,
        trabajadores,
        programas,
        modulos,
        unidades,
        secciones,
        sedes,
        aulas,
        turnos,
        periodosClases,
        periodosAcademicos,
        periodosLectivos,
        horarios,
        matriculas,
        notasUnidades,
        notasEFSRT,
        conceptosPago,
        recibos,
        estadosAsistencias,
        asistencias,
        cursosLibres,
        inscripcionesCursos,
        bienesPatrimoniales,
        documentosOficiales,
        usuarios,
        auditoriaLogs,
        metasProgramas,
        addPersona,
        updatePersona,
        deletePersona,
        addEstudiante,
        updateEstudiante,
        deleteEstudiante,
        vincularApoderado,
        addMatricula,
        updateMatricula,
        deleteMatricula,
        registrarRetiro,
        registrarTraslado,
        registrarReingreso,
        fetchMovimientosEstudiante,
        addSeccion,
        updateSeccion,
        deleteSeccion,
        addPeriodoLectivo,
        updatePeriodoLectivo,
        activarPeriodoLectivo,
        deletePeriodoLectivo,
        addPeriodoAcademico,
        updatePeriodoAcademico,
        activarPeriodoAcademico,
        deletePeriodoAcademico,
        addPeriodoClases,
        updatePeriodoClases,
        deletePeriodoClases,
        addTurno,
        updateTurno,
        deleteTurno,
        addHorario,
        deleteHorario,
        ejecutarAperturaRapida,
        reloadAcademicData,
        saveNotasUnidad,
        cerrarActaUnidad,
        desbloquearActaUnidad,
        saveNotaEFSRT,
        saveNotasEFSRTBatch,
        cerrarActaEFSRT,
        desbloquearActaEFSRT,
        saveAsistenciasBatch,
        fetchAsistencias,
        asistenciasTrabajadores,
        fetchAsistenciasTrabajadores,
        saveAsistenciasTrabajadoresBatch,
        marcarAsistenciaTrabajadorDni,
        fetchReporteMensualPersonal,
        addRecibo,
        anularRecibo,
        deleteRecibo,
        updateConceptoPago,
        addConceptoPago,
        refreshConceptosPago,
        addCursoLibre,
        updateModulo,
        updatePrograma,
        deleteCursoLibre,
        inscribirCursoLibre,
        addBienPatrimonial,
        updateBienPatrimonial,
        deleteBienPatrimonial,
        emitirDocumentoOficial,
        addDocumentoAcervo,
        updateDocumentoOficial,
        deleteDocumentoOficial,
        uploadDocumentoArchivo,
        addAuditoriaLog,
        refreshAuditorias,
        egresados,
        candidatosEgreso,
        addEgresado,
        updateEgresado,
        registrarTitulacionEgresado,
        actualizarSeguimientoLaboral,
        deleteEgresado,
        refreshEgresados,
        certificadosModulares,
        aptosCertificacionModular,
        emitirCertificadoModular,
        updateCertificadoModular,
        deleteCertificadoModular,
        refreshCertificadosModulares,
        certificadosEstudios,
        emitirCertificadoEstudio,
        updateCertificadoEstudio,
        deleteCertificadoEstudio,
        refreshCertificadosEstudios,
        titulos,
        aptosTitulacion,
        emitirTitulo,
        updateTitulo,
        deleteTitulo,
        refreshTitulos,
        toasts,
        addToast,
        removeToast,
        resetToSeedData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
