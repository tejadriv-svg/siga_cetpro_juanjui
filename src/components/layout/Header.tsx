import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Bell,
  ChevronDown,
  UserCheck,
  Sparkles,
  Menu,
  Database,
  UploadCloud,
  Search,
  Zap,
  HelpCircle,
  MessageSquare,
  Copy,
  Check,
  Building,
  GraduationCap,
  ShieldCheck,
  UserPlus,
  Award,
  ClipboardCheck,
  Camera,
  Image as ImageIcon,
  RefreshCw,
  KeyRound,
  LogOut,
  Wallet,
} from 'lucide-react';
import { NuevaPersonaModal } from '../padron/NuevaPersonaModal';
import { NuevaMatriculaModal } from '../estudiantes/NuevaMatriculaModal';
import { FichaMatriculaPrint } from '../estudiantes/FichaMatriculaPrint';
import { NuevoCobroModal } from '../tesoreria/NuevoCobroModal';
import { NuevoCertificadoModal } from '../certificados/NuevoCertificadoModal';
import { CambiarCredencialesModal } from '../auth/CambiarCredencialesModal';
import { Modal } from '../common/Modal';
import { ImageUploadField } from '../common/ImageUploadField';
import { formatPeriodoDisplay, isSamePeriodo, normalizePeriodo } from '../../utils/normalizePeriodo';

export const Header: React.FC = () => {
  const {
    institucion,
    updateInstitucion,
    currentUser,
    usuarios,
    switchUser,
    logout,
    periodoActivo,
    setPeriodoActivo,
    auditoriaLogs,
    estudiantes,
    setSelectedEstudianteId,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    setActiveView,
    addToast,
    periodosAcademicos,
    activarPeriodoAcademico,
    refreshData,
    refreshModularData,
    isAutoSyncing,
    hasPermission,
    userPermissions,
  } = useApp();

  const [isSyncing, setIsSyncing] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showPeriodMenu, setShowPeriodMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [logoImgError, setLogoImgError] = useState(false);
  const [showLogoModal, setShowLogoModal] = useState(false);
  const [tempLogo, setTempLogo] = useState(institucion.logoUrl || '');

  // User Switcher Tabs & State
  const [activeUserTab, setActiveUserTab] = useState<'DIRECTIVOS' | 'DOCENTES' | 'ESTUDIANTES'>('DIRECTIVOS');
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [showPermisosModal, setShowPermisosModal] = useState(false);

  const directivosUsers = usuarios.filter((u) =>
    ['DIRECTOR', 'ADMINISTRADOR', 'SECRETARIO_ACADEMICO', 'COORDINADOR_TALLER', 'TESORERO'].includes(u.rol)
  );
  const docentesUsers = usuarios.filter((u) => ['DOCENTE', 'TRABAJADOR'].includes(u.rol));
  const filteredEstudiantes = usuarios.filter((u) => {
    if (u.rol !== 'ESTUDIANTE') return false;
    if (!studentSearchQuery.trim()) return true;
    const q = studentSearchQuery.toLowerCase().trim();
    return (
      u.nombreCompleto.toLowerCase().includes(q) ||
      (u.username && u.username.toLowerCase().includes(q))
    );
  }).slice(0, 20);

  const getRoleBadgeStyle = (rol: string) => {
    switch (rol) {
      case 'DIRECTOR':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'ADMINISTRADOR':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'SECRETARIO_ACADEMICO':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'DOCENTE':
      case 'TRABAJADOR':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'TESORERO':
        return 'bg-cyan-100 text-cyan-800 border-cyan-200';
      case 'COORDINADOR_TALLER':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'ESTUDIANTE':
        return 'bg-sky-100 text-sky-800 border-sky-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const periodosAcademicosList = (periodosAcademicos && periodosAcademicos.length > 0)
    ? [...periodosAcademicos].sort((a, b) => (b.nombre || '').localeCompare(a.nombre || '')).map(p => ({
        codigo: p.codigo,
        nombre: p.nombre,
        estado: p.estado || 'Inactivo'
      }))
    : [
      { codigo: 'PER-ACA-2026-2', nombre: 'Periodo académico 2026-II', estado: 'Activo' },
      { codigo: 'PER-ACA-2026-1', nombre: 'Periodo académico 2026-I', estado: 'Inactivo' },
      { codigo: 'PER-ACA-2025-2', nombre: 'Periodo académico 2025-II', estado: 'Inactivo' },
      { codigo: 'PER-ACA-2025-1', nombre: 'Periodo académico 2025-I', estado: 'Inactivo' },
    ];

  // Quick Action Modals
  const [showRegistrarPersonaModal, setShowRegistrarPersonaModal] = useState(false);
  const [showNuevaMatriculaModal, setShowNuevaMatriculaModal] = useState(false);
  const [showNuevoCobroModal, setShowNuevoCobroModal] = useState(false);
  const [showEmitirDocumentoModal, setShowEmitirDocumentoModal] = useState(false);
  const [showCambiarCredencialesModal, setShowCambiarCredencialesModal] = useState(false);
  const [printMatriculaId, setPrintMatriculaId] = useState<string | null>(null);

  const searchableNav = [
    { title: 'Panel General', view: 'dashboard', desc: 'Resumen de indicadores y estado institucional' },
    { title: 'Registro de Personas', view: 'padron', desc: 'Directorio unificado DNI, docentes y estudiantes' },
    { title: 'Matrícula de Estudiantes', view: 'estudiantes', desc: 'Gestión de nóminas modulares y fichas' },
    { title: 'Caja y Tesorería', view: 'tesoreria', desc: 'Recaudación, recibos de pago y control de caja' },
    { title: 'Programas y Malla', view: 'programas', desc: 'Planes CNOF, perfiles y módulos formativos' },
    { title: 'Horarios de Clases', view: 'horarios', desc: 'Malla horaria semanal y turnos' },
    { title: 'Asistencia del Personal', view: 'asistencia-personal', desc: 'Kiosco DNI y parte mensual UGEL' },
    { title: 'Evaluación de Estudiantes', view: 'calificaciones', desc: 'Notas de capacidades y actas RVM 188-2020' },
    { title: 'Formación Contínua', view: 'formacion-continua', desc: 'Cursos de extensión y talleres libres' },
    { title: 'Emisión y Reportes', view: 'reportes', desc: 'Certificados oficiales QR y estadísticas UGEL' },
    { title: 'Egresados y Titulación', view: 'egresados', desc: 'Acreditación, expedientes y bolsa laboral' },
    { title: 'Inventario de Bienes', view: 'inventario', desc: 'Equipos, talleres y código patrimonial SBN' },
    { title: 'Acervo Documentario', view: 'acervo', desc: 'PEI, PAT, PCI, RI, TUPA y resoluciones' },
    { title: 'Ajustes y Catálogos', view: 'configuracion', desc: 'Parámetros institucionales, BD y seguridad' },
    { title: 'Importador Masivo Excel', view: 'importador', desc: 'Carga masiva desde plantillas .xlsx' },
    { title: 'Auditoría y Trazabilidad', view: 'auditoria', desc: 'Registro de operaciones y logs en tiempo real' },
  ];

  const canEditInstitucion = currentUser?.rol === 'DIRECTOR' || currentUser?.rol === 'ADMINISTRADOR';
  const canRegistrarPersona = hasPermission('PADRON', 'CREAR');
  const canCrearMatricula = hasPermission('MATRICULA', 'CREAR');
  const canCobrar = hasPermission('TESORERIA', 'COBRAR');
  const canEmitirDocumento = hasPermission('CERTIFICACION', 'EMITIR');

  const filteredNav = searchableNav.filter(
    (item) =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <header className="h-12 bg-white border-b border-slate-200/90 flex items-center justify-between px-3 sm:px-4 shrink-0 sticky top-0 z-30 select-none">
        {/* Left: Logo CETPRO Juanjuí + Título del Sistema + Período Activo */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {/* Mobile toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer shrink-0"
            title="Menú de Navegación"
          >
            <Menu className="w-4 h-4" />
          </button>

          {/* Logo del CETPRO Juanjuí */}
          <div className="flex items-center gap-2 shrink-0">
            <div
              onClick={() => {
                if (canEditInstitucion) {
                  setTempLogo(institucion.logoUrl || '');
                  setShowLogoModal(true);
                }
              }}
              className={`relative w-8 h-8 rounded-lg border border-slate-200/90 bg-white p-0.5 shadow-2xs flex items-center justify-center overflow-hidden shrink-0 group/logo transition-all ${
                canEditInstitucion ? 'hover:border-blue-500 cursor-pointer' : 'cursor-default'
              }`}
              title={canEditInstitucion ? 'Click para cambiar o subir el Logotipo Institucional' : 'Logotipo Oficial - CETPRO Juanjuí'}
            >
              {institucion.logoUrl && !logoImgError && !institucion.logoUrl.includes('\\') ? (
                <img
                  src={institucion.logoUrl}
                  alt="Logo CETPRO Juanjuí"
                  onError={() => setLogoImgError(true)}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 text-white flex items-center justify-center font-black text-[11px] rounded-md shadow-inner tracking-tight">
                  CJ
                </div>
              )}
              {canEditInstitucion && (
                <div className="absolute inset-0 bg-blue-900/60 text-white opacity-0 group-hover/logo:opacity-100 flex items-center justify-center transition-opacity rounded-md">
                  <Camera className="w-3.5 h-3.5" />
                </div>
              )}
            </div>

            {/* Títulos alineados verticalmente */}
            <div
              onClick={() => setActiveView('dashboard')}
              className="flex flex-col justify-center min-w-0 cursor-pointer group"
              title="Ir al Panel Principal"
            >
              <span className="text-[12px] sm:text-[13px] font-bold text-slate-900 tracking-tight leading-tight truncate group-hover:text-blue-700 transition-colors">
                Sistema de Gestión Académica y Administrativa
              </span>
              <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 leading-tight truncate">
                SIGA - CETPRO Juanjui
              </span>
            </div>
          </div>

          {/* Separador vertical */}
          <div className="h-5 w-px bg-slate-200 hidden md:block shrink-0 mx-1" />

          {/* Período Académico Actual Activo (tabla periodos_academicos) */}
          <div className="hidden md:flex items-center gap-1.5 shrink-0">
            <div className="relative">
              <button
                onClick={() => setShowPeriodMenu(!showPeriodMenu)}
                className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80 transition-colors cursor-pointer text-xs"
                title="Período Académico Activo - Click para cambiar"
              >
                <div className="flex items-center gap-1 text-[11px]">
                  <span className="text-slate-500 font-medium">Período:</span>
                  <span className="font-bold text-slate-900">
                    {formatPeriodoDisplay(periodoActivo) || periodoActivo}
                  </span>
                </div>
                <span className="flex items-center gap-1 px-1.5 py-0.2 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-mono font-bold rounded uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  ACTIVO
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {showPeriodMenu && (
                <div
                  className="absolute left-0 mt-1.5 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-fadeIn text-xs"
                  onClick={() => setShowPeriodMenu(false)}
                >
                  <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 flex items-center justify-between">
                    <span>Períodos Académicos</span>
                    <span className="text-[9px] font-mono text-slate-400">periodos_academicos</span>
                  </div>
                  {periodosAcademicosList.map((p) => {
                    const isSelected = isSamePeriodo(periodoActivo, p.codigo);
                    return (
                      <button
                        key={p.codigo}
                        onClick={() => {
                          const matchingPA = periodosAcademicos.find(pa => pa.codigo === p.codigo || isSamePeriodo(pa.codigo, p.codigo));
                          if (matchingPA) {
                            activarPeriodoAcademico(matchingPA.id);
                          } else {
                            setPeriodoActivo(p.codigo);
                          }
                        }}
                        className={`w-full text-left px-3 py-1.5 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer ${
                          isSelected ? 'font-bold text-blue-600 bg-blue-50/60' : 'text-slate-700'
                        }`}
                      >
                        <div className="flex flex-col">
                          <span className="font-medium text-xs text-slate-800">{p.nombre}</span>
                          <span className="text-[10px] font-mono text-slate-400">{p.codigo}</span>
                        </div>
                        {isSelected && (
                          <span className="px-1.5 py-0.2 bg-emerald-50 text-emerald-700 text-[9px] font-mono font-bold rounded border border-emerald-200">
                            ACTIVO
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Search, Actions, Notifications, User Profile */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Quick Search */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center gap-2 px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 border border-slate-200 rounded-md text-xs transition-colors cursor-pointer shadow-2xs"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[11px] text-slate-500">Buscar módulo o DNI...</span>
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.2 bg-white border border-slate-200 rounded text-[9px] font-mono text-slate-500 font-bold">
              ⌘K
            </kbd>
          </button>

          {/* Quick Actions: Sincronizar, Registrar Persona, Nueva Matrícula, Emitir Documento */}
          <div className="hidden sm:flex items-center gap-1.5">
            <button
              onClick={async () => {
                setIsSyncing(true);
                try {
                  const cacheKeys = [
                    'siga_personas', 'siga_estudiantes', 'siga_trabajadores',
                    'siga_matriculas', 'siga_notas_unidades', 'siga_notas_efsrt',
                    'siga_recibos', 'siga_secciones', 'siga_modulos', 'siga_unidades',
                    'siga_programas', 'siga_sedes', 'siga_aulas', 'siga_turnos'
                  ];
                  cacheKeys.forEach(k => localStorage.removeItem(k));
                  await refreshData();
                  addToast('Sincronización Completada', 'Todos los datos y secciones se han sincronizado con la base de datos.', 'success');
                } catch (e) {
                  addToast('Error', 'No se pudo sincronizar con la base de datos.', 'error');
                } finally {
                  setIsSyncing(false);
                }
              }}
              disabled={isSyncing}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium transition-all cursor-pointer shadow-2xs whitespace-nowrap disabled:opacity-50"
              title="Sincronizar todos los datos con la base de datos de Supabase/PostgreSQL"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : isAutoSyncing ? 'animate-spin text-emerald-400' : ''}`} />
              <span>{isSyncing ? 'Sincronizando...' : isAutoSyncing ? 'Auto-sincronizando...' : 'Sincronizar'}</span>
            </button>

            {canRegistrarPersona && (
              <button
                onClick={() => setShowRegistrarPersonaModal(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 rounded-lg text-xs font-medium transition-colors cursor-pointer shadow-2xs whitespace-nowrap"
                title="Registrar nueva persona en el padrón"
              >
                <UserPlus className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>Registrar Persona</span>
              </button>
            )}

            {canCrearMatricula && (
              <button
                onClick={() => setShowNuevaMatriculaModal(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 rounded-lg text-xs font-medium transition-colors cursor-pointer shadow-2xs whitespace-nowrap"
                title="Registrar nueva matrícula de estudiante"
              >
                <GraduationCap className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Nueva Matrícula</span>
              </button>
            )}

            {canCobrar && (
              <button
                onClick={() => setShowNuevoCobroModal(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 rounded-lg text-xs font-medium transition-colors cursor-pointer shadow-2xs whitespace-nowrap"
                title="Emitir nuevo recibo de pago o pensión en ventanilla de Tesorería"
              >
                <Wallet className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>+ Recibo de Caja</span>
              </button>
            )}

            {canEmitirDocumento && (
              <button
                onClick={() => setShowEmitirDocumentoModal(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 rounded-lg text-xs font-medium transition-colors cursor-pointer shadow-2xs whitespace-nowrap"
                title="Emitir documento oficial o certificado modular"
              >
                <Award className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>Emitir Documento</span>
              </button>
            )}
          </div>

          {/* Help */}
          <button
            onClick={() => addToast('Lineamientos Académicos Generales RVM N° 188-2020-MINEDU', 'info')}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
            title="Normativa y Ayuda"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {/* Notifications / Live Activity Logs */}
          <div className="relative">
            <button
              onClick={() => setShowNotifMenu(!showNotifMenu)}
              className="relative p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
              title="Notificaciones de Auditoría"
            >
              <Bell className="w-4 h-4" />
              {auditoriaLogs.length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-blue-600 rounded-full ring-2 ring-white"></span>
              )}
            </button>

            {showNotifMenu && (
              <div className="absolute right-0 mt-1.5 w-80 bg-white rounded-xl shadow-xl border border-slate-200 p-3 z-50 animate-fadeIn">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                  <h4 className="text-xs font-bold text-slate-900 tracking-tight">
                    Trazabilidad de Operaciones
                  </h4>
                  <span className="text-[10px] text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                    En Vivo
                  </span>
                </div>
                <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                  {auditoriaLogs.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400">
                      No hay registros recientes.
                    </div>
                  ) : (
                    auditoriaLogs.slice(0, 6).map((log) => (
                      <div key={log.id} className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                        <div className="flex items-center justify-between text-[11px] font-medium text-slate-700">
                          <span className="text-blue-700 font-bold">{log.usuarioNombre}</span>
                          <span className="text-slate-400 text-[10px] font-mono">{log.timestamp.split(' ')[1] || log.timestamp}</span>
                        </div>
                        <p className="text-slate-600 text-[11px] mt-0.5 leading-snug">{log.detalle}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile & Role Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-1.5 p-1 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Cambiar Usuario / Rol"
            >
              {currentUser.avatar ? (
                <img
                  src={currentUser.avatar}
                  alt={currentUser.nombreCompleto}
                  className="w-6 h-6 rounded-md bg-slate-200 border border-slate-300 object-cover shrink-0"
                />
              ) : (
                <div className="w-6 h-6 rounded-md bg-blue-600 text-white font-bold text-[11px] flex items-center justify-center shrink-0">
                  {currentUser.nombreCompleto.charAt(0)}
                </div>
              )}
              <span className="hidden xl:inline text-xs font-semibold text-slate-800 max-w-[120px] truncate">
                {currentUser.nombreCompleto.split(' ')[0]}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-1.5 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 p-3 z-50 animate-fadeIn">
                {/* Active Profile Card */}
                <div className="p-3 bg-gradient-to-br from-slate-50 to-slate-100/70 border border-slate-200/90 rounded-xl mb-2.5">
                  <div className="flex items-center gap-2.5 mb-2">
                    {currentUser.avatar ? (
                      <img src={currentUser.avatar} alt={currentUser.nombreCompleto} className="w-10 h-10 rounded-xl object-cover border border-slate-200 shadow-2xs shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-2xs">
                        {currentUser.nombreCompleto.charAt(0)}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-slate-900 truncate leading-snug">{currentUser.nombreCompleto}</div>
                      <div className="text-[11px] text-slate-500 font-mono truncate">{currentUser.email || currentUser.username}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between gap-1.5 pt-2 border-t border-slate-200/60">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${getRoleBadgeStyle(currentUser.rol)}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                      {currentUser.rolNombre || currentUser.rol}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setShowPermisosModal(true);
                        setShowUserMenu(false);
                      }}
                      className="text-[10px] font-semibold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <ShieldCheck className="w-3 h-3 text-blue-600" />
                      <span>{userPermissions.length} permisos</span>
                    </button>
                  </div>
                </div>

                {/* Account Settings Action */}
                <button
                  type="button"
                  onClick={() => {
                    setShowCambiarCredencialesModal(true);
                    setShowUserMenu(false);
                  }}
                  className="w-full mb-2.5 py-1.5 px-2.5 bg-blue-50/80 hover:bg-blue-100/80 text-blue-700 border border-blue-200/80 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>Cambiar Credenciales de Acceso</span>
                </button>

                {/* Role / User Switcher */}
                <div className="border-t border-slate-100 pt-2 mb-1.5">
                  <div className="px-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between mb-1.5">
                    <span>Alternar Perfil / Rol</span>
                    <Sparkles className="w-3 h-3 text-blue-500" />
                  </div>

                  {/* Tabs */}
                  <div className="flex rounded-lg bg-slate-100 p-0.5 mb-2 text-[11px] font-semibold">
                    <button
                      type="button"
                      onClick={() => setActiveUserTab('DIRECTIVOS')}
                      className={`flex-1 py-1 text-center rounded-md transition-all cursor-pointer ${
                        activeUserTab === 'DIRECTIVOS' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Directivos ({directivosUsers.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveUserTab('DOCENTES')}
                      className={`flex-1 py-1 text-center rounded-md transition-all cursor-pointer ${
                        activeUserTab === 'DOCENTES' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Docentes ({docentesUsers.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveUserTab('ESTUDIANTES')}
                      className={`flex-1 py-1 text-center rounded-md transition-all cursor-pointer ${
                        activeUserTab === 'ESTUDIANTES' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Alumnos
                    </button>
                  </div>

                  {/* Tab Contents */}
                  {activeUserTab === 'ESTUDIANTES' && (
                    <div className="mb-2 px-1">
                      <div className="relative">
                        <Search className="w-3 h-3 text-slate-400 absolute left-2 top-2" />
                        <input
                          type="text"
                          placeholder="Buscar estudiante por DNI o apellido..."
                          value={studentSearchQuery}
                          onChange={(e) => setStudentSearchQuery(e.target.value)}
                          className="w-full pl-6 pr-2 py-1 text-[11px] bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-1 max-h-52 overflow-y-auto pr-1 custom-scrollbar">
                    {(activeUserTab === 'DIRECTIVOS' ? directivosUsers : activeUserTab === 'DOCENTES' ? docentesUsers : filteredEstudiantes).map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => {
                          switchUser(u.id);
                          setShowUserMenu(false);
                        }}
                        className={`w-full text-left px-2 py-1.5 rounded-lg text-xs flex items-center gap-2 transition-colors cursor-pointer ${
                          currentUser.id === u.id
                            ? 'bg-blue-50 text-blue-900 font-bold border border-blue-200/80 shadow-2xs'
                            : 'hover:bg-slate-50 text-slate-700 font-medium'
                        }`}
                      >
                        {u.avatar ? (
                          <img src={u.avatar} alt={u.nombreCompleto} className="w-5 h-5 rounded-md object-cover shrink-0 border border-slate-200" />
                        ) : (
                          <div className="w-5 h-5 rounded-md bg-slate-200 text-slate-700 font-bold text-[10px] flex items-center justify-center shrink-0">
                            {u.nombreCompleto.charAt(0)}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-semibold text-[11px]">{u.nombreCompleto}</div>
                          <div className="text-[10px] text-slate-500 truncate flex items-center gap-1">
                            <span className="font-mono text-slate-400">{u.username}</span>
                            <span>•</span>
                            <span className="text-blue-600 font-medium">{u.cargo || u.rolNombre || u.rol}</span>
                          </div>
                        </div>
                        {currentUser.id === u.id && <UserCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                      </button>
                    ))}
                    {activeUserTab === 'ESTUDIANTES' && filteredEstudiantes.length === 0 && (
                      <div className="py-4 text-center text-xs text-slate-400">
                        No se encontraron estudiantes coincidentes
                      </div>
                    )}
                  </div>
                </div>

                {/* Logout Button */}
                <div className="mt-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setShowUserMenu(false);
                      logout();
                      addToast('Sesión Finalizada', 'Ha cerrado sesión correctamente.', 'info');
                    }}
                    className="w-full py-1.5 px-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/80 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    <span>Cerrar Sesión</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Global Command Palette / Search Modal */}
      {isSearchOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-start justify-center pt-20 px-4"
          onClick={() => setIsSearchOpen(false)}
        >
          <div
            className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-fadeIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3 border-b border-slate-100 flex items-center gap-2.5">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                autoFocus
                placeholder="Buscar módulo, documento o vista..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none"
              />
              <button
                onClick={() => setIsSearchOpen(false)}
                className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-[10px] font-mono font-bold"
              >
                ESC
              </button>
            </div>

            <div className="p-2 max-h-72 overflow-y-auto custom-scrollbar space-y-1">
              <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Navegación Rápida
              </div>
              {filteredNav.map((item) => (
                <button
                  key={item.view}
                  onClick={() => {
                    setActiveView(item.view as any);
                    setIsSearchOpen(false);
                  }}
                  className="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-between group cursor-pointer"
                >
                  <div>
                    <div className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                      {item.title}
                    </div>
                    <div className="text-[11px] text-slate-400">{item.desc}</div>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 group-hover:text-blue-600">
                    Abrir →
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Quick Action Modals */}
      <NuevaPersonaModal
        isOpen={showRegistrarPersonaModal}
        onClose={() => setShowRegistrarPersonaModal(false)}
      />

      <NuevaMatriculaModal
        isOpen={showNuevaMatriculaModal}
        onClose={() => setShowNuevaMatriculaModal(false)}
        onSuccess={(id) => setPrintMatriculaId(id)}
      />

      {printMatriculaId && (
        <FichaMatriculaPrint
          isOpen={!!printMatriculaId}
          onClose={() => setPrintMatriculaId(null)}
          matriculaId={printMatriculaId}
        />
      )}

      <NuevoCobroModal
        isOpen={showNuevoCobroModal}
        onClose={() => setShowNuevoCobroModal(false)}
      />

      <NuevoCertificadoModal
        isOpen={showEmitirDocumentoModal}
        onClose={() => setShowEmitirDocumentoModal(false)}
      />

      <CambiarCredencialesModal
        isOpen={showCambiarCredencialesModal}
        onClose={() => setShowCambiarCredencialesModal(false)}
      />

      {/* Modal para Actualizar Logotipo Oficial del CETPRO */}
      <Modal
        isOpen={showLogoModal}
        onClose={() => setShowLogoModal(false)}
        title="Logotipo Oficial Institucional del CETPRO Juanjuí"
        maxWidth="lg"
        actions={
          <>
            <button
              type="button"
              onClick={() => setShowLogoModal(false)}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => {
                updateInstitucion({ ...institucion, logoUrl: tempLogo });
                setLogoImgError(false);
                setShowLogoModal(false);
                addToast('Logotipo Actualizado', 'El logo oficial del CETPRO fue guardado exitosamente.');
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Guardar Logotipo
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Personaliza el logotipo oficial del CETPRO. Este símbolo se reflejará inmediatamente en la barra superior, en las nóminas, certificados modulares y fichas de matrícula oficiales.
          </p>

          <ImageUploadField
            label="Logotipo del CETPRO (Columna logo_url en tabla cetpros)"
            sublabel="Sube un archivo de imagen transparente o ingresa un enlace web."
            value={tempLogo}
            onChange={(val) => setTempLogo(val)}
            aspectRatio="square"
            previewSize="lg"
            helperText="Se admite arrastrar y soltar archivos PNG, JPG, WEBP o SVG."
          />
        </div>
      </Modal>

      {/* Modal de Permisos y Atribuciones Oficiales del Rol */}
      {showPermisosModal && (
        <Modal
          isOpen={showPermisosModal}
          onClose={() => setShowPermisosModal(false)}
          title={`Atribuciones y Permisos Oficiales: ${currentUser.rolNombre || currentUser.rol}`}
          maxWidth="2xl"
          actions={
            <button
              type="button"
              onClick={() => setShowPermisosModal(false)}
              className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Entendido
            </button>
          }
        >
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-slate-900">{currentUser.nombreCompleto}</div>
                <div className="text-xs text-slate-500">{currentUser.cargo || currentUser.rolNombre} • Usuario: {currentUser.username}</div>
              </div>
              <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider border ${getRoleBadgeStyle(currentUser.rol)}`}>
                {currentUser.rol}
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Matriz de atribuciones normativas registradas en PostgreSQL para este perfil ({userPermissions.length} permisos activos):
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
              {[
                { modulo: 'DASHBOARD', label: 'Panel General e Indicadores', icon: '📊' },
                { modulo: 'PADRON', label: 'Padrón Maestro de Personas', icon: '👥' },
                { modulo: 'MATRICULA', label: 'Matrícula de Estudiantes y Fichas', icon: '🎓' },
                { modulo: 'EVALUACION', label: 'Evaluación y Calificaciones', icon: '📝' },
                { modulo: 'CERTIFICACION', label: 'Certificados y Titulaciones', icon: '📜' },
                { modulo: 'PROGRAMAS', label: 'Programas de Estudio y Planes CNOF', icon: '📚' },
                { modulo: 'TESORERIA', label: 'Caja y Recaudación TUPA', icon: '💰' },
                { modulo: 'INVENTARIO', label: 'Inventario Patrimonial SBN', icon: '📦' },
                { modulo: 'ACERVO', label: 'Acervo Documentario y Resoluciones', icon: '📁' },
                { modulo: 'SISTEMA', label: 'Ajustes del Sistema y Auditoría', icon: '⚙️' },
              ].map((m) => {
                const modPerms = userPermissions.filter(p => p.startsWith(m.modulo + ':'));
                const hasAny = modPerms.length > 0 || currentUser.rol === 'DIRECTOR' || currentUser.rol === 'ADMINISTRADOR';
                return (
                  <div
                    key={m.modulo}
                    className={`p-2.5 rounded-xl border text-xs ${
                      hasAny ? 'bg-white border-slate-200' : 'bg-slate-50/50 border-slate-100 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <span>{m.icon}</span>
                        <span>{m.label}</span>
                      </div>
                      {hasAny ? (
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                          {modPerms.length > 0 ? `${modPerms.length} acciones` : 'Total'}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">Sin acceso</span>
                      )}
                    </div>
                    {hasAny && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {modPerms.map((p) => (
                          <span key={p} className="px-1.5 py-0.2 bg-slate-100 text-slate-700 rounded text-[9px] font-mono font-semibold">
                            {p.split(':')[1]}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};
