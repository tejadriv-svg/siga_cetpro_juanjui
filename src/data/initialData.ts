import {
  InstitucionInfo,
  Persona,
  Estudiante,
  Trabajador,
  ProgramaEstudio,
  ModuloFormativo,
  UnidadDidactica,
  Seccion,
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
} from '../types';

export const INSTITUCION_ACTUAL: InstitucionInfo = {
  nombre: 'CETPRO Juanjuí',
  tipoGestion: 'Pública',
  codigoModular: '0533836',
  codigoLocal: '477262',
  ruc: '20531285566',
  dre: 'Dirección Regional de Educación de San Martín',
  ugel: 'UGEL Mariscal Cáceres',
  direccion: 'Jr. Huallaga N° 311',
  distrito: 'Juanjuí',
  provincia: 'Mariscal Cáceres',
  region: 'San Martín',
  telefono: '(042) 546-218',
  correo: 'contacto@cetprojuanjui.edu.pe',
  director: 'Edinson Raul Tejada Rivera',
  secretarioAcademico: '',
  logoUrl: '/cetpro-logo.svg',
};

export const PROGRAMAS_SEED: ProgramaEstudio[] = [
  {
    id: 'prog-mecanica',
    codigo: 'G2145-1-001',
    nombre: 'Mecánica de motos y vehículos afines',
    nivelFormativo: 'Auxiliar Técnico',
    totalHoras: 950,
    totalCreditos: 40,
    resolucionAutorizacion: 'R.D. N° 0589-2020-DRE-SM',
    descripcion: 'Mantenimiento preventivo y correctivo de motores, sistemas de inyección, frenos y transmisión de mototaxis y motocicletas.',
    icono: 'Wrench',
    color: 'blue',
    tallerResponsable: 'Taller de Mecánica de Motos',
    modulosCount: 2,
    archivoUrl: '/programas/Mecanica_de_Motos.pdf',
    estado: 'ACTIVO',
  },
  {
    id: 'prog-peluqueria',
    codigo: 'S3496-1-001',
    nombre: 'Peluquería y barbería',
    nivelFormativo: 'Auxiliar Técnico',
    totalHoras: 950,
    totalCreditos: 40,
    resolucionAutorizacion: 'R.D. N° 0290-2022-DRE-SM',
    descripcion: 'Cortes clásicos y modernos (fade, degrade), colorimetría, peinados, tratamientos capilares y perfilado de barba.',
    icono: 'Scissors',
    color: 'violet',
    tallerResponsable: 'Taller de Peluquería y Barbería',
    modulosCount: 2,
    archivoUrl: '/programas/Peluqueria_y_Barberia.pdf',
    estado: 'ACTIVO',
  },
  {
    id: 'prog-prendas',
    codigo: 'C0714-2-001',
    nombre: 'Fabricación de prendas de vestir',
    nivelFormativo: 'Técnico',
    totalHoras: 2000,
    totalCreditos: 80,
    resolucionAutorizacion: 'R.D. N° 0488-2021-DRE-SM',
    descripcion: 'Patronaje industrial, corte en serie, operatividad de máquinas industriales y confección de prendas.',
    icono: 'Shirt',
    color: 'rose',
    tallerResponsable: 'Taller de Confección Textil',
    modulosCount: 4,
    archivoUrl: '/programas/Fabricacion_de_Prendas.pdf',
    estado: 'ACTIVO',
  },
  {
    id: 'prog-soporte-ti',
    codigo: 'J2662-1-001',
    nombre: 'Soporte técnico y operaciones de centros de cómputo',
    nivelFormativo: 'Auxiliar Técnico',
    totalHoras: 950,
    totalCreditos: 40,
    resolucionAutorizacion: 'R.D. N° 0312-2022-DRE-SM',
    descripcion: 'Mantenimiento de hardware, configuración de sistemas operativos, soporte a usuarios y centros de cómputo.',
    icono: 'Cpu',
    color: 'indigo',
    tallerResponsable: 'Laboratorio de Soporte TI',
    modulosCount: 2,
    archivoUrl: '/programas/Soporte_Tecnico_TI.pdf',
    estado: 'ACTIVO',
  },
  {
    id: 'prog-costura',
    codigo: 'C0714-1-004',
    nombre: 'Costura y acabados',
    nivelFormativo: 'Auxiliar Técnico',
    totalHoras: 950,
    totalCreditos: 40,
    resolucionAutorizacion: 'R.D. N° 0412-2021-DRE-SM',
    descripcion: 'Técnicas de confección, costura recta, remallado y acabados de prendas de vestir.',
    icono: 'Sparkles',
    color: 'pink',
    tallerResponsable: 'Taller de Costura y Acabados',
    modulosCount: 2,
    archivoUrl: '/programas/Costura_y_Acabados.pdf',
    estado: 'ACTIVO',
  },
  {
    id: 'prog-cocina',
    codigo: 'I2556-2-001',
    nombre: 'Cocina',
    nivelFormativo: 'Técnico',
    totalHoras: 2000,
    totalCreditos: 80,
    resolucionAutorizacion: 'R.D. N° 0345-2021-DRE-SM',
    descripcion: 'Artes culinarias, cocina regional y nacional, panadería, pastelería y manipulación de alimentos y bebidas.',
    icono: 'UtensilsCrossed',
    color: 'orange',
    tallerResponsable: 'Taller de Gastronomía y Cocina',
    modulosCount: 4,
    archivoUrl: '/programas/Cocina.pdf',
    estado: 'ACTIVO',
  },
  {
    id: 'prog-estilismo',
    codigo: 'S3496-2-001',
    nombre: 'Estilismo',
    nivelFormativo: 'Técnico',
    totalHoras: 2000,
    totalCreditos: 80,
    resolucionAutorizacion: 'R.D. N° 0295-2022-DRE-SM',
    descripcion: 'Peluquería integral, maquillaje de belleza y caracterización, manicure, pedicure y estética capilar.',
    icono: 'Sparkles',
    color: 'fuchsia',
    tallerResponsable: 'Taller de Estilismo y Cosmetología',
    modulosCount: 4,
    archivoUrl: '/programas/Estilismo.pdf',
    estado: 'ACTIVO',
  },
  {
    id: 'prog-apoyo-admin',
    codigo: 'M2982-1-002',
    nombre: 'Apoyo administrativo',
    nivelFormativo: 'Auxiliar Técnico',
    totalHoras: 950,
    totalCreditos: 40,
    resolucionAutorizacion: 'R.D. N° 0180-2023-DRE-SM',
    descripcion: 'Redacción y trámite documentario, procesamiento y archivo documentario, atención al usuario.',
    icono: 'FileSpreadsheet',
    color: 'amber',
    tallerResponsable: 'Aula de Gestión Administrativa',
    modulosCount: 2,
    estado: 'ACTIVO',
  },
  {
    id: 'prog-plataformas-ti',
    codigo: 'J2662-2-002',
    nombre: 'Plataformas y servicios TI',
    nivelFormativo: 'Técnico',
    totalHoras: 2000,
    totalCreditos: 80,
    resolucionAutorizacion: 'R.D. N° 0410-2023-DRE-SM',
    descripcion: 'Desarrollo de sistemas, bases de datos, producción de servicios TI y gobierno electrónico.',
    icono: 'Layers',
    color: 'teal',
    tallerResponsable: 'Laboratorio de Plataformas TI',
    modulosCount: 4,
    estado: 'ACTIVO',
  },
  {
    id: 'prog-redes',
    codigo: 'J2662-2-001',
    nombre: 'Redes y comunicaciones',
    nivelFormativo: 'Técnico',
    totalHoras: 2000,
    totalCreditos: 80,
    resolucionAutorizacion: 'R.D. N° 0415-2023-DRE-SM',
    descripcion: 'Infraestructura TI, diseño, conexión, implementación y configuración de redes de sistemas de información.',
    icono: 'Wifi',
    color: 'sky',
    tallerResponsable: 'Laboratorio de Redes y Comunicaciones',
    modulosCount: 4,
    estado: 'ACTIVO',
  },
];

export const MODULOS_SEED: ModuloFormativo[] = [];

export const UNIDADES_SEED: UnidadDidactica[] = [];

export const PERSONAS_SEED: Persona[] = [
  // Director Institucional
  {
    id: '5c396f7c-fcc2-4ee0-a805-7a075eae5937',
    tipoDocumento: 'DNI',
    numeroDocumento: '16682317',
    nombres: 'Edinson Raul',
    apellidoPaterno: 'Tejada',
    apellidoMaterno: 'Rivera',
    fechaNacimiento: '1978-04-12',
    sexo: 'M',
    telefono: '942881234',
    correo: 'tejadriv@gmail.com',
    direccion: 'Jr. Triunfo N° 450, Juanjuí',
    esEstudiante: false,
    esTrabajador: true,
    cargo: 'Director',
    condicion: 'Designado',
    tituloEspecialidad: 'Lic. en educacion / Computacion e Informatica',
    createdAt: '2023-01-10',
  },
];

export const TRABAJADORS_SEED: Trabajador[] = [
  {
    id: 'doc-director',
    personaId: '5c396f7c-fcc2-4ee0-a805-7a075eae5937',
    codigoPlaza: 'PLZ-DIR-001',
    condicion: 'Designado',
    cargo: 'Director',
    tituloEspecialidad: 'Lic. en educacion / Computacion e Informatica',
  },
];

export const ESTUDIANTES_SEED: Estudiante[] = [];

export const SECCIONES_SEED: Seccion[] = [];

export const MATRICULAS_SEED: Matricula[] = [];

export const NOTAS_UNIDADES_SEED: NotaUnidad[] = [];

export const NOTAS_EFSRT_SEED: NotaEFSRT[] = [];

export const CONCEPTOS_PAGO_SEED: ConceptoPago[] = [
  {
    id: 'cp-1',
    codigo: 'CON-MAT-01',
    nombre: 'Derecho de Matrícula Regular / Módulo',
    montoSugerido: 50.0,
    categoria: 'Matrícula',
    aplicaMora: false,
  },
  {
    id: 'cp-2',
    codigo: 'CON-MAT-02',
    nombre: 'Derecho de Matrícula Extemporánea',
    montoSugerido: 65.0,
    categoria: 'Matrícula',
    aplicaMora: true,
  },
  {
    id: 'cp-3',
    codigo: 'CON-CER-01',
    nombre: 'Emisión de Certificado Modular Oficial MINEDU',
    montoSugerido: 25.0,
    categoria: 'Certificación',
    aplicaMora: false,
  },
  {
    id: 'cp-4',
    codigo: 'CON-CON-01',
    nombre: 'Constancia de Estudios / Matrícula / Notas',
    montoSugerido: 15.0,
    categoria: 'Constancias',
    aplicaMora: false,
  },
  {
    id: 'cp-5',
    codigo: 'CON-CAR-01',
    nombre: 'Carné Estudiantil Institucional CETPRO',
    montoSugerido: 10.0,
    categoria: 'Otros',
    aplicaMora: false,
  },
  {
    id: 'cp-6',
    codigo: 'CON-TAL-01',
    nombre: 'Inscripción a Curso Libre de Formación Continua',
    montoSugerido: 100.0,
    categoria: 'Talleres',
    aplicaMora: false,
  },
  {
    id: 'cp-7',
    codigo: 'CON-TIT-01',
    nombre: 'Derecho de Trámite de Titulación Profesional',
    montoSugerido: 120.0,
    categoria: 'Certificación',
    aplicaMora: false,
  },
  {
    id: 'cp-8',
    codigo: 'CON-REC-01',
    nombre: 'Examen de Recuperación por Unidad Didáctica',
    montoSugerido: 20.0,
    categoria: 'Otros',
    aplicaMora: false,
  },
];

export const RECIBOS_SEED: ReciboPago[] = [];

export const CURSOS_LIBRES_SEED: CursoLibre[] = [];

export const INSCRIPCIONES_CURSOS_SEED: InscripcionCursoLibre[] = [];

export const BIENES_PATRIMONIALES_SEED: BienPatrimonial[] = [];

export const DOCUMENTOS_SEED: DocumentoOficial[] = [];

export const USUARIOS_SEED: UsuarioSistema[] = [
  {
    id: 'usr-1',
    email: 'tejadriv@gmail.com',
    nombreCompleto: 'Edinson Raul Tejada Rivera',
    rol: 'DIRECTOR',
    rolNombre: 'Director Institucional',
    cargo: 'Director',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    activo: true,
    ultimoAcceso: 'En línea',
  },
];

export const AUDITORIA_SEED: AuditoriaLog[] = [];

export const METAS_PROGRAMAS_SEED: MetaPrograma[] = [];
