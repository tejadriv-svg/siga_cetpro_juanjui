import React, { useState, useEffect } from 'react';
import { useApp, ViewType } from '../../context/AppContext';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Award,
  BookOpen,
  Sparkles,
  FileCheck2,
  Wallet,
  Boxes,
  FolderArchive,
  Settings,
  ChevronRight,
  Clock,
  UserCheck,
  X,
  Pin,
  PinOff,
  ShieldCheck,
} from 'lucide-react';

interface NavItem {
  id: ViewType;
  label: string;
  sublabel: string;
  shortcut: string;
  icon: React.ReactNode;
  badge?: string | number;
  badgeColor?: string;
}

interface NavSection {
  id: string;
  title: string;
  items: NavItem[];
}

export const Sidebar: React.FC = () => {
  const {
    activeView,
    setActiveView,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    currentUser,
    matriculas,
    recibos,
    personas,
    cursosLibres,
    bienesPatrimoniales,
    documentosOficiales,
    egresados,
  } = useApp();

  // Expanded state: either pinned permanently or hovered dynamically
  const [isHovered, setIsHovered] = useState(false);
  const [isPinned, setIsPinned] = useState<boolean>(() => {
    try {
      return localStorage.getItem('siga_sidebar_pinned') === 'true';
    } catch {
      return false;
    }
  });

  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);
  const [hoverPosition, setHoverPosition] = useState<{ top: number } | null>(null);

  const togglePin = () => {
    setIsPinned((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('siga_sidebar_pinned', String(next));
      } catch {}
      return next;
    });
  };

  const handleNavClick = (viewId: ViewType) => {
    setActiveView(viewId);
    setIsMobileMenuOpen(false);
  };

  const totalRecaudado = recibos
    .filter((r) => r.estado === 'Emitido')
    .reduce((acc, r) => acc + r.monto, 0);

  // Organización lógica por ciclo operativo institucional
  const navSections: NavSection[] = [
    {
      id: 'atencion-registro',
      title: 'Atención y Registro',
      items: [
        {
          id: 'dashboard',
          label: 'Panel General',
          sublabel: 'Resumen e Indicadores',
          shortcut: 'H',
          icon: <LayoutDashboard className="w-4 h-4" />,
        },
        {
          id: 'padron',
          label: 'Registro de Personas',
          sublabel: 'Directorio unificado DNI',
          shortcut: 'P',
          icon: <Users className="w-4 h-4" />,
          badge: personas.length > 0 ? personas.length : undefined,
        },
        {
          id: 'estudiantes',
          label: 'Matrícula de Estudiantes',
          sublabel: 'Nóminas y Fichas modulares',
          shortcut: 'M',
          icon: <GraduationCap className="w-4 h-4" />,
          badge: matriculas.length > 0 ? matriculas.length : undefined,
        },
        {
          id: 'tesoreria',
          label: 'Caja y Tesorería',
          sublabel: 'Recaudación y Recibos TUPA',
          shortcut: 'T',
          icon: <Wallet className="w-4 h-4" />,
          badge: `S/ ${totalRecaudado.toFixed(0)}`,
          badgeColor: 'bg-blue-50 text-blue-700 border border-blue-200',
        },
      ],
    },
    {
      id: 'gestion-formativa',
      title: 'Gestión Formativa',
      items: [
        {
          id: 'programas',
          label: 'Programas y Malla',
          sublabel: 'Planes CNOF y Módulos',
          shortcut: 'F',
          icon: <BookOpen className="w-4 h-4" />,
        },
        {
          id: 'horarios',
          label: 'Horarios de Clases',
          sublabel: 'Malla semanal y carga lectiva',
          shortcut: 'K',
          icon: <Clock className="w-4 h-4" />,
        },
        {
          id: 'asistencia-personal',
          label: 'Asistencia del Personal',
          sublabel: 'Kiosco DNI y Parte UGEL',
          shortcut: 'U',
          icon: <UserCheck className="w-4 h-4" />,
        },
        {
          id: 'calificaciones',
          label: 'Evaluación de Estudiantes',
          sublabel: 'Competencias, Notas y EFSRT',
          shortcut: 'E',
          icon: <Award className="w-4 h-4" />,
        },
        {
          id: 'formacion-continua',
          label: 'Formación Contínua',
          sublabel: 'Cursos y Talleres Libres',
          shortcut: 'C',
          icon: <Sparkles className="w-4 h-4" />,
          badge: cursosLibres.length > 0 ? cursosLibres.length : undefined,
          badgeColor: 'bg-amber-50 text-amber-700 border border-amber-200',
        },
      ],
    },
    {
      id: 'certificacion-egreso',
      title: 'Certificación y Egreso',
      items: [
        {
          id: 'reportes',
          label: 'Emisión y Reportes',
          sublabel: 'Certificados, Actas y Metas UGEL',
          shortcut: 'R',
          icon: <FileCheck2 className="w-4 h-4" />,
        },
        {
          id: 'egresados',
          label: 'Egresados y Titulación',
          sublabel: 'Acreditación, Títulos y Empleo',
          shortcut: 'G',
          icon: <GraduationCap className="w-4 h-4" />,
          badge: egresados.length > 0 ? egresados.length : undefined,
          badgeColor: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
        },
      ],
    },
    {
      id: 'institucional-sistema',
      title: 'Institucional y Sistema',
      items: [
        {
          id: 'inventario',
          label: 'Inventario de Bienes',
          sublabel: 'Equipos y Talleres SBN',
          shortcut: 'I',
          icon: <Boxes className="w-4 h-4" />,
          badge: bienesPatrimoniales.length > 0 ? bienesPatrimoniales.length : undefined,
        },
        {
          id: 'acervo',
          label: 'Acervo Documentario',
          sublabel: 'Resoluciones, Convenios y PCI',
          shortcut: 'A',
          icon: <FolderArchive className="w-4 h-4" />,
          badge: documentosOficiales.length > 0 ? documentosOficiales.length : undefined,
        },
        {
          id: 'configuracion',
          label: 'Ajustes y Catálogos',
          sublabel: 'Institución, BD y Logs',
          shortcut: 'S',
          icon: <Settings className="w-4 h-4" />,
        },
      ],
    },
  ];

  const allowedViewsByRole: Record<string, ViewType[]> = {
    DIRECTOR: [
      'dashboard', 'padron', 'estudiantes', 'tesoreria',
      'programas', 'horarios', 'asistencia-personal', 'calificaciones', 'formacion-continua',
      'reportes', 'egresados',
      'inventario', 'acervo', 'configuracion'
    ],
    ADMINISTRADOR: [
      'dashboard', 'padron', 'estudiantes', 'tesoreria',
      'programas', 'horarios', 'asistencia-personal', 'calificaciones', 'formacion-continua',
      'reportes', 'egresados',
      'inventario', 'acervo', 'configuracion'
    ],
    SECRETARIO_ACADEMICO: [
      'dashboard', 'padron', 'estudiantes', 'tesoreria',
      'programas', 'horarios', 'asistencia-personal', 'calificaciones', 'formacion-continua',
      'reportes', 'egresados', 'acervo'
    ],
    DOCENTE: [
      'dashboard', 'horarios', 'asistencia-personal', 'calificaciones',
      'programas', 'estudiantes', 'reportes'
    ],
    TRABAJADOR: [
      'dashboard', 'horarios', 'asistencia-personal', 'calificaciones',
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

  const allowedViews = allowedViewsByRole[currentUser?.rol] || allowedViewsByRole.DIRECTOR;

  // Filtrar secciones e ítems según permisos del usuario
  const visibleSections = navSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => allowedViews.includes(item.id)),
    }))
    .filter((section) => section.items.length > 0);

  const visibleNavItems = visibleSections.flatMap((s) => s.items);
  const hoveredItem = visibleNavItems.find((n) => n.id === hoveredItemId);

  // Expanded if pinned or mouse is currently hovering the sidebar
  const isExpanded = isPinned || isHovered;

  // Supabase-style Keyboard Navigation (e.g. G then H -> Dashboard, G then M -> Matriculas)
  useEffect(() => {
    let lastKey = '';
    let timeoutId: NodeJS.Timeout | null = null;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore completely if any modal or dialog is currently open in the document
      if (
        document.querySelector('[role="dialog"]') ||
        document.querySelector('.fixed.inset-0')
      ) {
        return;
      }

      // Ignore if user is currently typing in an input, textarea, select or contenteditable element
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.closest('form') ||
          target.isContentEditable)
      ) {
        return;
      }

      const key = e.key.toUpperCase();

      if (lastKey === 'G') {
        const matched = visibleNavItems.find((item) => item.shortcut.toUpperCase() === key);
        if (matched) {
          e.preventDefault();
          handleNavClick(matched.id);
        }
        lastKey = '';
        if (timeoutId) clearTimeout(timeoutId);
        return;
      }

      if (key === 'G') {
        lastKey = 'G';
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          lastKey = '';
        }, 1500);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [visibleNavItems]);

  return (
    <>
      {/* Desktop Layout Placeholder: solo se renderiza cuando está desfijado para dar el margen compacto inicial (w-14) sin duplicar espacio cuando se fija */}
      {!isPinned && (
        <div className="hidden md:block shrink-0 w-14" />
      )}

      {/* Desktop Supabase-style Auto-expanding Sidebar */}
      <aside
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          setHoveredItemId(null);
          setHoverPosition(null);
        }}
        className={`hidden md:flex flex-col justify-between h-full bg-white border-r border-slate-200/90 select-none z-40 transition-all duration-300 ease-in-out ${
          isPinned
            ? 'w-64 relative shrink-0'
            : isExpanded
            ? 'w-64 absolute left-0 top-0 bottom-0 shadow-2xl ring-1 ring-slate-900/10'
            : 'w-14 absolute left-0 top-0 bottom-0'
        }`}
      >
        {/* Header indicator when expanded vs compact */}
        <div className="border-b border-slate-100 flex items-center justify-between px-3 py-2.5 min-h-[44px]">
          {isExpanded ? (
            <>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                <span className="text-[11px] font-bold tracking-wider uppercase text-slate-500">
                  Menú del Sistema
                </span>
              </div>
              <button
                onClick={togglePin}
                className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                title={isPinned ? 'Desfijar menú (auto-ocultar al salir)' : 'Fijar menú siempre abierto'}
              >
                {isPinned ? (
                  <Pin className="w-3.5 h-3.5 fill-blue-600 text-blue-600" />
                ) : (
                  <Pin className="w-3.5 h-3.5" />
                )}
              </button>
            </>
          ) : (
            <div className="w-full flex justify-center">
              <div className="w-2 h-2 rounded-full bg-slate-300" />
            </div>
          )}
        </div>

        {/* Scrollable Navigation Items agrupados por sección */}
        <div className="flex-1 overflow-y-auto custom-scrollbar py-2 px-2 space-y-3">
          {visibleSections.map((section, sectionIdx) => (
            <div key={section.id} className="space-y-1">
              {/* Encabezado o separador de sección */}
              {isExpanded ? (
                <div className="px-2.5 pt-1 pb-1 flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                    {section.title}
                  </span>
                </div>
              ) : (
                sectionIdx > 0 && <div className="border-t border-slate-100 my-1.5 mx-1" />
              )}

              {/* Ítems de la sección */}
              {section.items.map((item) => {
                const isActive = activeView === item.id;
                return (
                  <div key={item.id} className="relative w-full">
                    <button
                      onClick={() => handleNavClick(item.id)}
                      onMouseEnter={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setHoveredItemId(item.id);
                        setHoverPosition({ top: rect.top });
                      }}
                      className={`w-full flex items-center rounded-xl text-xs transition-colors cursor-pointer group relative ${
                        isExpanded ? 'px-3 py-2 gap-3 justify-start' : 'px-0 py-2.5 justify-center'
                      } ${
                        isActive
                          ? 'bg-blue-50 text-blue-700 font-semibold shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 font-medium'
                      }`}
                    >
                      {/* Active Indicator Bar */}
                      {isActive && (
                        <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-blue-600 rounded-r-full" />
                      )}

                      {/* Icon */}
                      <div
                        className={`flex items-center justify-center shrink-0 transition-transform ${
                          isActive ? 'text-blue-600 scale-105' : 'text-slate-400 group-hover:text-slate-700'
                        }`}
                      >
                        {item.icon}
                      </div>

                      {/* Expanded mode labels for all menus simultaneously */}
                      {isExpanded && (
                        <div className="flex-1 flex items-center justify-between min-w-0 text-left animate-fadeIn">
                          <div className="truncate pr-1">
                            <div
                              className={`text-xs truncate ${
                                isActive ? 'font-bold text-blue-900' : 'font-semibold text-slate-800'
                              }`}
                            >
                              {item.label}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate leading-tight">
                              {item.sublabel}
                            </div>
                          </div>
                          {item.badge !== undefined && (
                            <span
                              className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold shrink-0 ${
                                item.badgeColor || 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </div>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Bottom Rail Controls: Pin/Expand Toggle & User Card */}
        <div className="p-2 border-t border-slate-100 flex flex-col gap-1.5 bg-slate-50/50">
          {isExpanded && currentUser && (
            <div className="w-full px-2.5 py-2 bg-white border border-slate-200/80 rounded-xl flex items-center gap-2.5 shadow-2xs">
              {currentUser.avatar ? (
                <img
                  src={currentUser.avatar}
                  alt={currentUser.nombreCompleto}
                  className="w-7 h-7 rounded-lg object-cover border border-slate-200 shrink-0"
                />
              ) : (
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                  {currentUser.nombreCompleto?.charAt(0) || 'U'}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-slate-800 truncate">
                  {currentUser.nombreCompleto?.split(' ')[0]}
                </div>
                <div className="text-[9px] font-bold text-blue-600 uppercase tracking-tight truncate">
                  {currentUser.rolNombre || currentUser.rol}
                </div>
              </div>
            </div>
          )}

          <button
            onClick={togglePin}
            className={`w-full flex items-center ${
              isExpanded ? 'justify-between px-2.5 py-2' : 'justify-center p-2'
            } rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 transition-colors text-xs cursor-pointer font-medium`}
            title={
              isPinned
                ? 'Desfijar barra lateral (se ocultará automáticamente)'
                : 'Fijar barra lateral expandida'
            }
          >
            {isExpanded ? (
              <>
                <div className="flex items-center gap-2">
                  {isPinned ? (
                    <PinOff className="w-3.5 h-3.5 text-blue-600" />
                  ) : (
                    <Pin className="w-3.5 h-3.5 text-slate-400" />
                  )}
                  <span className="text-[11px] font-medium text-slate-600">
                    {isPinned ? 'Fijado permanentemente' : 'Fijar menú abierto'}
                  </span>
                </div>
                <ChevronRight
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                    isPinned ? 'rotate-180' : ''
                  }`}
                />
              </>
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400" />
            )}
          </button>
        </div>
      </aside>

      {/* Floating Supabase-style Keyboard Shortcut Hint */}
      {hoveredItem && hoverPosition && (
        <div
          className="fixed z-50 pointer-events-none animate-fadeIn transition-all duration-75"
          style={{
            top: `${hoverPosition.top + 4}px`,
            left: isExpanded ? '268px' : '64px',
          }}
        >
          <div className="bg-slate-900/95 text-white backdrop-blur-md border border-slate-800 rounded-lg shadow-xl px-2.5 py-1.5 flex items-center gap-3 text-xs">
            <span className="font-medium text-slate-200">
              Ir a {hoveredItem.label}
            </span>
            <div className="flex items-center gap-1 shrink-0">
              <kbd className="px-1.5 py-0.5 bg-slate-800 text-slate-300 border border-slate-700 rounded text-[10px] font-mono font-bold shadow-2xs">
                G
              </kbd>
              <span className="text-[10px] text-slate-400 font-sans">then</span>
              <kbd className="px-1.5 py-0.5 bg-slate-800 text-slate-300 border border-slate-700 rounded text-[10px] font-mono font-bold shadow-2xs">
                {hoveredItem.shortcut}
              </kbd>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Menu Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="relative w-64 max-w-[85vw] h-full bg-white border-r border-slate-200 shadow-2xl z-10 animate-fadeIn flex flex-col justify-between">
            <div>
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    CJ
                  </div>
                  <div>
                    <span className="font-bold text-xs text-slate-900 block">CETPRO Juanjuí</span>
                    <span className="text-[10px] text-slate-400 font-mono">Cód: 0533836</span>
                  </div>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-2 space-y-3 overflow-y-auto max-h-[calc(100vh-8rem)] custom-scrollbar">
                {visibleSections.map((section) => (
                  <div key={section.id} className="space-y-1">
                    <div className="px-2 pt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                      {section.title}
                    </div>
                    {section.items.map((item) => {
                      const isActive = activeView === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleNavClick(item.id)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer ${
                            isActive
                              ? 'bg-blue-50 text-blue-700 font-bold border border-blue-200/60'
                              : 'text-slate-600 hover:bg-slate-50 font-medium'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className={isActive ? 'text-blue-600' : 'text-slate-400'}>
                              {item.icon}
                            </span>
                            <div className="text-left truncate">
                              <div className="truncate font-semibold">{item.label}</div>
                              <div className="text-[10px] text-slate-400 truncate">{item.sublabel}</div>
                            </div>
                          </div>
                          {item.badge && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold bg-slate-100 text-slate-600">
                              {item.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 border-t border-slate-100 text-[11px] text-slate-500">
              CETPRO Juanjuí • MINEDU RVM 188
            </div>
          </div>
        </div>
      )}
    </>
  );
};
