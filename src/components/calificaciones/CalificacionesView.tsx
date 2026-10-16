import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { NotaUnidad, NotaEFSRT, AsistenciaEstudiante, ModalidadEFSRT, Estudiante, Persona } from '../../types';
import { Badge } from '../common/Badge';
import { ActaEvaluacionPrint } from './ActaEvaluacionPrint';
import { FichaEFSRTPrint } from './FichaEFSRTPrint';
import { HabilitarUnidadModal } from './HabilitarUnidadModal';
import { AsignarHorarioUnidadModal } from './AsignarHorarioUnidadModal';
import { useReactToPrint } from 'react-to-print';
import * as XLSX from 'xlsx';
import { compareMatriculasByPersona } from '../../utils/sortPersonas';
import {
  Award,
  GraduationCap,
  Save,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  FileCheck2,
  Lock,
  Unlock,
  Printer,
  Sparkles,
  Calendar,
  UserCheck,
  Users,
  Clock,
  FileDown,
  ShieldCheck,
  ShieldAlert,
  Building2,
  ExternalLink,
  Briefcase,
  FileText,
} from 'lucide-react';

interface AsistenciaDiaItem {
  estadoAsistenciaId: string;
  observacion: string;
}

export const CalificacionesView: React.FC = () => {
  const {
    programas,
    modulos,
    unidades,
    secciones,
    estudiantes,
    personas,
    matriculas,
    notasUnidades,
    notasEFSRT,
    saveNotasUnidad,
    cerrarActaUnidad,
    desbloquearActaUnidad,
    saveNotaEFSRT,
    saveNotasEFSRTBatch,
    cerrarActaEFSRT,
    desbloquearActaEFSRT,
    periodoActivo,
    institucion,
    currentUser,
    addToast,
    estadosAsistencias,
    fetchAsistencias,
    saveAsistenciasBatch,
    trabajadores,
    setActiveView,
  } = useApp();

  const isDocenteRole = currentUser?.rol === 'DOCENTE' || currentUser?.rol === 'TRABAJADOR';
  const isEstudianteRole = currentUser?.rol === 'ESTUDIANTE';
  const canUnlockActa = currentUser?.rol === 'DIRECTOR' || currentUser?.rol === 'ADMINISTRADOR';
  const canCerrarActa = currentUser?.rol === 'DIRECTOR' || currentUser?.rol === 'ADMINISTRADOR' || currentUser?.rol === 'SECRETARIO_ACADEMICO';

  const currentTrabajador = isDocenteRole ? trabajadores.find((t) => t.personaId === currentUser?.personaId) : null;
  const docenteSecciones = React.useMemo(() => {
    if (!currentTrabajador) return [];
    return secciones.filter((s) => s.trabajadorId === currentTrabajador.id);
  }, [currentTrabajador, secciones]);

  const docenteModuloIds = React.useMemo(() => {
    return new Set(docenteSecciones.map((s) => s.moduloId));
  }, [docenteSecciones]);

  const docenteModulos = React.useMemo(() => {
    return modulos.filter((m) => docenteModuloIds.has(m.id));
  }, [modulos, docenteModuloIds]);

  const docenteProgramaIds = React.useMemo(() => {
    return new Set(docenteModulos.map((m) => m.programaId));
  }, [docenteModulos]);

  const programasActivos = programas.filter(p => p.estado !== 'Desactivado' && p.estado !== 'INACTIVO' && p.estado !== 'Inactivo' && p.estado?.toUpperCase() !== 'DESACTIVADO');

  const programasVisibles = React.useMemo(() => {
    if (isDocenteRole && docenteSecciones.length > 0) {
      const list = programasActivos.filter((p) => docenteProgramaIds.has(p.id));
      return list.length > 0 ? list : programasActivos;
    }
    return programasActivos;
  }, [isDocenteRole, docenteSecciones, programasActivos, docenteProgramaIds]);

  const [selectedProgramaId, setSelectedProgramaId] = useState(programasVisibles[0]?.id || '');
  const [selectedModuloId, setSelectedModuloId] = useState(modulos[0]?.id || '');
  const [selectedUnidadId, setSelectedUnidadId] = useState(unidades[0]?.id || '');
  const [activeSubTab, setActiveSubTab] = useState<'unidades' | 'efsrt' | 'consolidado' | 'asistencias'>('unidades');

  // Si es docente y tiene asignaciones, preseleccionar su primera sección automáticamente
  React.useEffect(() => {
    if (isDocenteRole && docenteSecciones.length > 0) {
      const primeraSec = docenteSecciones[0];
      const mod = modulos.find((m) => m.id === primeraSec.moduloId);
      if (mod) {
        setSelectedProgramaId(mod.programaId);
        setSelectedModuloId(mod.id);
        setSelectedSeccionId(primeraSec.id);
      }
    }
  }, [isDocenteRole, docenteSecciones.length]);

  // Estados para Asistencias
  const [fechaAsistencia, setFechaAsistencia] = useState<string>(new Date().toISOString().split('T')[0]);
  const [asistenciasDia, setAsistenciasDia] = useState<Record<string, AsistenciaDiaItem>>({});
  const [asistenciasUnidad, setAsistenciasUnidad] = useState<AsistenciaEstudiante[]>([]);
  const [loadingAsistencias, setLoadingAsistencias] = useState(false);
  const [savingAsistencias, setSavingAsistencias] = useState(false);

  // Filter modules & units scoped by docente assignment
  const modulosDisponibles = React.useMemo(() => {
    const list = modulos.filter((m) => m.programaId === selectedProgramaId && (true || !m.estado));
    if (isDocenteRole && docenteSecciones.length > 0) {
      const scoped = list.filter((m) => docenteModuloIds.has(m.id));
      return scoped.length > 0 ? scoped : list;
    }
    return list;
  }, [modulos, selectedProgramaId, isDocenteRole, docenteSecciones, docenteModuloIds]);

  const seccionesDisponibles = React.useMemo(() => {
    const list = secciones.filter((s) => s.moduloId === selectedModuloId);
    if (isDocenteRole && docenteSecciones.length > 0) {
      const scoped = list.filter((s) => s.trabajadorId === currentTrabajador?.id);
      return scoped.length > 0 ? scoped : list;
    }
    return list;
  }, [secciones, selectedModuloId, isDocenteRole, docenteSecciones, currentTrabajador]);

  const unidadesDisponibles = unidades
    .filter((u) => u.moduloId === selectedModuloId)
    .sort((a, b) => {
      const aIsEmpleabilidad = a.tipo === 'Empleabilidad' || a.codigo?.includes('UDE');
      const bIsEmpleabilidad = b.tipo === 'Empleabilidad' || b.codigo?.includes('UDE');
      if (aIsEmpleabilidad && !bIsEmpleabilidad) return 1;
      if (!aIsEmpleabilidad && bIsEmpleabilidad) return -1;
      return (a.codigo || '').localeCompare(b.codigo || '');
    });

  const [selectedSeccionId, setSelectedSeccionId] = useState(seccionesDisponibles[0]?.id || '');

  // Efecto para actualizar la sección cuando cambia el módulo
  React.useEffect(() => {
    const sec = seccionesDisponibles;
    if (sec.length > 0 && !sec.find(s => s.id === selectedSeccionId)) {
      setSelectedSeccionId(sec[0].id);
    } else if (sec.length === 0) {
      setSelectedSeccionId('');
    }
  }, [selectedModuloId, seccionesDisponibles]);

  // Get enrolled students for this module/program/seccion, sorted alphabetically (Paterno, Materno, Nombres)
  const matriculasDelModulo = React.useMemo(() => {
    return matriculas
      .filter(
        (m) => m.programaId === selectedProgramaId && m.moduloId === selectedModuloId && (!selectedSeccionId || m.seccionId === selectedSeccionId)
      )
      .sort((a, b) => compareMatriculasByPersona(a, b, personas, estudiantes));
  }, [matriculas, selectedProgramaId, selectedModuloId, selectedSeccionId, personas, estudiantes]);

  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: 'Acta de Evaluación - CETPRO Juanjuí'
  });

  
  // Local state for live grade matrix editing
  const [editingNotas, setEditingNotas] = useState<{ [key: string]: NotaUnidad }>({});
  const [editingEFSRT, setEditingEFSRT] = useState<{ [key: string]: NotaEFSRT }>({});

  // Control de Bloqueo / Cierre de Acta de Unidades
  const [isLockModalOpen, setIsLockModalOpen] = useState(false);
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false);
  const [motivoDesbloqueo, setMotivoDesbloqueo] = useState('');
  const [isProcessingLock, setIsProcessingLock] = useState(false);

  // Estados para EFSRT Modal de Empresa, Bloqueo e Impresión Individual
  const [editingEFSRTModalData, setEditingEFSRTModalData] = useState<NotaEFSRT | null>(null);
  const [isEFSRTModalOpen, setIsEFSRTModalOpen] = useState(false);
  const [isLockEFSRTModalOpen, setIsLockEFSRTModalOpen] = useState(false);
  const [isUnlockEFSRTModalOpen, setIsUnlockEFSRTModalOpen] = useState(false);
  const [motivoDesbloqueoEFSRT, setMotivoDesbloqueoEFSRT] = useState('');
  const [isProcessingEFSRTLock, setIsProcessingEFSRTLock] = useState(false);

  // Impresión individual de Ficha EFSRT
  const [studentToPrintEFSRT, setStudentToPrintEFSRT] = useState<{ est: Estudiante; per: Persona; nota: NotaEFSRT } | null>(null);
  const printEFSRTRef = useRef<HTMLDivElement>(null);
  const handlePrintEFSRTDoc = useReactToPrint({
    contentRef: printEFSRTRef,
    documentTitle: 'Ficha de Evaluación EFSRT - CETPRO Juanjuí'
  });

  // Estados para Habilitar y Horario de la Unidad seleccionada
  const [isHabilitarModalOpen, setIsHabilitarModalOpen] = useState(false);
  const [isHorarioModalOpen, setIsHorarioModalOpen] = useState(false);
  const [seccionUnidadData, setSeccionUnidadData] = useState<any>(null);
  const [horariosUnidadList, setHorariosUnidadList] = useState<any[]>([]);
  const [loadingSeccionUnidad, setLoadingSeccionUnidad] = useState(false);

  const fetchSeccionUnidadData = React.useCallback(async () => {
    if (!selectedSeccionId || !selectedUnidadId) {
      setSeccionUnidadData(null);
      setHorariosUnidadList([]);
      return;
    }
    setLoadingSeccionUnidad(true);
    try {
      // 1. Obtener datos de la unidad en la sección (secciones_unidades)
      const resUnidades = await fetch(`/api/academic/secciones/${selectedSeccionId}/unidades`);
      if (resUnidades.ok) {
        const json = await resUnidades.json();
        const found = (json.unidades || []).find((u: any) => u.unidad_id === selectedUnidadId);
        setSeccionUnidadData(found || null);
      }

      // 2. Obtener horarios de esta sección y unidad
      const resHorarios = await fetch(`/api/academic/horarios?seccionId=${selectedSeccionId}&unidadId=${selectedUnidadId}`);
      if (resHorarios.ok) {
        const hJson = await resHorarios.json();
        setHorariosUnidadList(hJson || []);
      }
    } catch (e) {
      console.error('Error fetching seccion unidad data:', e);
    } finally {
      setLoadingSeccionUnidad(false);
    }
  }, [selectedSeccionId, selectedUnidadId]);

  React.useEffect(() => {
    fetchSeccionUnidadData();
  }, [fetchSeccionUnidadData]);

  // Determinar si EFSRT del módulo seleccionado está cerrado/bloqueado
  const efsrtDelModulo = notasEFSRT.filter(n => n.moduloId === selectedModuloId);
  const isEFSRTBloqueada = Boolean(
    efsrtDelModulo.length > 0 && efsrtDelModulo.every(n => n.bloqueado)
  );

  // Determinar si la unidad seleccionada está cerrada/bloqueada
  const notasUnidadSeleccionada = notasUnidades.filter(
    (n) => n.unidadDidacticaId === selectedUnidadId
  );
  const isActaBloqueada = Boolean(
    notasUnidadSeleccionada.length > 0 && notasUnidadSeleccionada.some((n) => n.bloqueado)
  );
  const fechaCierreActa = notasUnidadSeleccionada.find((n) => n.fechaCierre)?.fechaCierre;
  const esDirectivo = currentUser?.rol === 'DIRECTOR' || currentUser?.rol === 'ADMINISTRADOR';

  // Initialize or retrieve grades
  const getNotaForStudent = (estudianteId: string, matriculaId: string): NotaUnidad => {
    const key = `${matriculaId}-${selectedUnidadId}`;
    if (editingNotas[key]) return editingNotas[key];

    const existing = notasUnidades.find(
      (n) => (n.estudianteId === estudianteId || n.matriculaId === matriculaId) && n.unidadDidacticaId === selectedUnidadId
    );

    if (existing) {
      const c1Val = existing.c1 !== undefined ? existing.c1 : (existing.i1 ?? 0);
      const c2Val = existing.c2 !== undefined ? existing.c2 : (existing.i2 ?? 0);
      const c3Val = existing.c3 !== undefined ? existing.c3 : (existing.i3 ?? 0);
      return {
        ...existing,
        c1: c1Val,
        c2: c2Val,
        c3: c3Val,
        i1: c1Val,
        i2: c2Val,
        i3: c3Val,
        promedioFinal: existing.promedioFinal ?? 0,
        estado: existing.estado || (existing.promedioFinal >= 13 ? 'APROBADO' : (existing.promedioFinal > 0 ? 'DESAPROBADO' : 'PENDIENTE'))
      };
    }

    return {
      id: `not-temp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      matriculaId,
      estudianteId,
      unidadDidacticaId: selectedUnidadId,
      c1: 0,
      c2: 0,
      c3: 0,
      i1: 0,
      i2: 0,
      i3: 0,
      promedioFinal: 0,
      estado: 'PENDIENTE',
      bloqueado: false,
      fechaRegistro: new Date().toISOString().split('T')[0],
    };
  };

  const handleGradeChange = (
    matriculaId: string,
    estudianteId: string,
    field: 'c1' | 'c2' | 'c3' | 'i1' | 'i2' | 'i3' | 'recuperacion',
    value: number
  ) => {
    if (isActaBloqueada) {
      addToast('Acta Bloqueada', 'El acta se encuentra cerrada. Solicite reapertura formal para modificar notas.', 'warning');
      return;
    }

    const current = getNotaForStudent(estudianteId, matriculaId);
    const clamped = Math.max(0, Math.min(20, isNaN(value) ? 0 : value));

    const updated = {
      ...current,
      [field]: clamped,
    };

    // Sincronizar c1/i1, c2/i2, c3/i3
    if (field === 'c1' || field === 'i1') { updated.c1 = clamped; updated.i1 = clamped; }
    if (field === 'c2' || field === 'i2') { updated.c2 = clamped; updated.i2 = clamped; }
    if (field === 'c3' || field === 'i3') { updated.c3 = clamped; updated.i3 = clamped; }

    // Calcular promedio según RVM 188-2020:
    const c1 = updated.c1 ?? updated.i1 ?? 0;
    const c2 = updated.c2 ?? updated.i2 ?? 0;
    const c3 = updated.c3 ?? updated.i3 ?? 0;
    const baseProm = Math.round((c1 + c2 + c3) / 3);

    let finalProm = baseProm;
    if (updated.recuperacion !== undefined && updated.recuperacion !== null && updated.recuperacion > baseProm) {
      finalProm = updated.recuperacion;
    }

    updated.promedioFinal = finalProm;
    if (finalProm >= 13) {
      updated.estado = 'APROBADO';
    } else if (baseProm >= 10 && (!updated.recuperacion || updated.recuperacion === 0)) {
      updated.estado = 'RECUPERACION';
    } else if (finalProm > 0) {
      updated.estado = 'DESAPROBADO';
    } else {
      updated.estado = 'PENDIENTE';
    }

    const key = `${matriculaId}-${selectedUnidadId}`;
    setEditingNotas((prev) => ({ ...prev, [key]: updated }));
  };

  // Cierre y Reapertura de Acta Oficial
  const handleCerrarActaConfirm = async () => {
    if (!selectedUnidadId) return;
    setIsProcessingLock(true);
    await cerrarActaUnidad(selectedUnidadId);
    setIsProcessingLock(false);
    setIsLockModalOpen(false);
  };

  const handleReabrirActaConfirm = async () => {
    if (!selectedUnidadId) return;
    setIsProcessingLock(true);
    await desbloquearActaUnidad(selectedUnidadId, motivoDesbloqueo);
    setIsProcessingLock(false);
    setIsUnlockModalOpen(false);
    setMotivoDesbloqueo('');
  };

  // Exportar Acta Oficial UGEL a Excel (.xlsx)
  const handleExportarExcelUGEL = () => {
    if (!selectedModulo || !selectedPrograma) {
      addToast('Error', 'Seleccione un programa y módulo válido', 'error');
      return;
    }

    const udtDisponibles = unidadesDisponibles.filter(u => !(u.tipo === 'Empleabilidad' || u.codigo?.includes('UDE')));
    const udeDisponibles = unidadesDisponibles.filter(u => u.tipo === 'Empleabilidad' || u.codigo?.includes('UDE'));
    const seccionObj = secciones.find(s => s.id === selectedSeccionId);

    const headerRows = [
      ["GOBIERNO REGIONAL DE SAN MARTÍN - DIRECCIÓN REGIONAL DE EDUCACIÓN DE SAN MARTÍN"],
      ["UNIDAD DE GESTIÓN EDUCATIVA LOCAL DE MARISCAL CÁCERES - JUANJUÍ"],
      ["CENTRO DE EDUCACIÓN TÉCNICO PRODUCTIVA 'JUANJUÍ'"],
      ["ACTA OFICIAL CONSOLIDADA DE EVALUACIÓN MODULAR (RVM 188-2020-MINEDU)"],
      [],
      ["PROGRAMA DE ESTUDIOS:", selectedPrograma.nombre, "", "NIVEL FORMATIVO:", selectedPrograma.nivelFormativo || "Técnico"],
      ["MÓDULO FORMATIVO:", selectedModulo.nombre, "", "PERIODO ACADÉMICO:", periodoActivo],
      ["SECCIÓN:", seccionObj?.nombre || "Única", "", "TURNO:", seccionObj?.turno || "Tarde"],
      ["FECHA DE EMISIÓN:", new Date().toLocaleDateString('es-PE'), "", "ESTADO:", isActaBloqueada ? "ACTA CERRADA Y SELLADA" : "EN PROCESO DE REGISTRO"],
      []
    ];

    const colHeaders = ["N°", "N° DOCUMENTO (DNI)", "APELLIDOS Y NOMBRES"];
    udtDisponibles.forEach((u, i) => colHeaders.push(u.codigo ? u.codigo.slice(-6) : `UDT-${i+1}`));
    udeDisponibles.forEach((u, i) => colHeaders.push(u.codigo ? u.codigo.slice(-6) : `UDE-${i+1}`));
    colHeaders.push("EFSRT", "PROMEDIO MODULAR", "SITUACIÓN FINAL");

    const rowsData: any[][] = [];
    matriculasDelModulo.forEach((mat, idx) => {
      const est = estudiantes.find(e => e.id === mat.estudianteId);
      const per = est ? personas.find(p => p.id === est.personaId) : undefined;
      const nombreCompleto = per ? `${per.apellidoPaterno} ${per.apellidoMaterno || ''}, ${per.nombres}`.trim() : "Estudiante";
      const dni = per?.numeroDocumento || "";

      const notasUdtVals = udtDisponibles.map(u => {
        const nu = notasUnidades.find(n => (n.estudianteId === mat.estudianteId || n.matriculaId === mat.id) && n.unidadDidacticaId === u.id);
        return nu ? nu.promedioFinal : 0;
      });
      const notasUdeVals = udeDisponibles.map(u => {
        const nu = notasUnidades.find(n => (n.estudianteId === mat.estudianteId || n.matriculaId === mat.id) && n.unidadDidacticaId === u.id);
        return nu ? nu.promedioFinal : 0;
      });
      const efsrt = notasEFSRT.find(ef => ef.estudianteId === mat.estudianteId && ef.moduloId === selectedModulo.id);
      const notaEfsrt = efsrt ? efsrt.notaVigesimal : 0;

      const todasNotas = [...notasUdtVals, ...notasUdeVals];
      const sum = todasNotas.reduce((a, b) => a + b, 0);
      const promModular = todasNotas.length > 0 ? Math.round(sum / todasNotas.length) : 0;

      const hasAny = todasNotas.some(n => n > 0) || notaEfsrt > 0;
      const isApp = udtDisponibles.every((_, i) => notasUdtVals[i] >= 13) &&
                    udeDisponibles.every((_, i) => notasUdeVals[i] >= 13) &&
                    notaEfsrt >= 13 && hasAny && unidadesDisponibles.length > 0;

      let situacion = "SIN EVALUAR";
      if (hasAny) {
        if (isApp) situacion = "APROBADO";
        else if (todasNotas.some(n => n >= 10 && n < 13)) situacion = "RECUPERACIÓN";
        else situacion = "DESAPROBADO";
      }

      rowsData.push([
        idx + 1,
        dni,
        nombreCompleto,
        ...notasUdtVals.map(n => n > 0 ? n : "--"),
        ...notasUdeVals.map(n => n > 0 ? n : "--"),
        notaEfsrt > 0 ? notaEfsrt : "--",
        promModular > 0 ? promModular : "--",
        situacion
      ]);
    });

    const allAoa = [
      ...headerRows,
      colHeaders,
      ...rowsData,
      [],
      [],
      ["", "____________________________________", "", "", "____________________________________"],
      ["", "DOCENTE RESPONSABLE DE MÓDULO", "", "", institucion?.director || "DIRECTOR(A) GENERAL CETPRO"],
      ["", "Firma y Sello", "", "", "Firma y Sello de Dirección"]
    ];

    const ws = XLSX.utils.aoa_to_sheet(allAoa);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Acta Modular Oficial");
    const fileName = `Acta_Oficial_${selectedModulo.codigo || 'MOD'}_${periodoActivo}.xlsx`;
    XLSX.writeFile(wb, fileName);
    addToast('Excel Generado', `Se descargó ${fileName} con formato oficial para UGEL.`, 'success');
  };
  
  // ==========================================
  // LÓGICA Y HANDLERS DE EFSRT (PRÁCTICAS PREPROFESIONALES)
  // ==========================================

  const getNotaEFSRTForStudent = (estudianteId: string, matriculaId: string): NotaEFSRT => {
    const key = `${matriculaId}-${selectedModuloId}`;
    if (editingEFSRT[key]) return editingEFSRT[key];

    const existing = notasEFSRT.find(
      (n) => (n.estudianteId === estudianteId || n.matriculaId === matriculaId) && n.moduloId === selectedModuloId
    );
    if (existing) {
      const notaVig = existing.notaVigesimal || 0;
      return {
        ...existing,
        estudianteId,
        matriculaId,
        moduloId: selectedModuloId,
        horasCompletadas: existing.horasCompletadas || 120,
        modalidad: existing.modalidad || 'EMPRESA',
        dominioOperativo: existing.dominioOperativo || 0,
        usoEquipos: existing.usoEquipos || 0,
        seguridadHigiene: existing.seguridadHigiene || 0,
        puntualidadAsistencia: existing.puntualidadAsistencia || 0,
        trabajoEquipo: existing.trabajoEquipo || 0,
        iniciativaAdaptabilidad: existing.iniciativaAdaptabilidad || 0,
        notaVigesimal: notaVig,
        estado: existing.estado || (notaVig >= 13 ? 'APROBADO' : (notaVig > 0 ? 'DESAPROBADO' : 'EN_EJECUCION')),
        bloqueado: Boolean(existing.bloqueado)
      };
    }

    return {
      id: `efsrt-temp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      estudianteId,
      matriculaId,
      moduloId: selectedModuloId,
      modalidad: 'EMPRESA',
      empresaRuc: '',
      empresaNombre: '',
      empresaDireccion: '',
      supervisorEmpresa: '',
      supervisorEmpresaCargo: '',
      trabajadorSupervisorId: '',
      horasCompletadas: 120,
      dominioOperativo: 0,
      usoEquipos: 0,
      seguridadHigiene: 0,
      resolucionProblemas: 0,
      puntualidadAsistencia: 0,
      trabajoEquipo: 0,
      comunicacionAsertiva: 0,
      iniciativaAdaptabilidad: 0,
      notaVigesimal: 0,
      fechaInicio: new Date().toISOString().split('T')[0],
      fechaTermino: new Date().toISOString().split('T')[0],
      bloqueado: false,
      estado: 'EN_EJECUCION',
    };
  };

  const handleEFSRTGradeChange = (
    matriculaId: string,
    estudianteId: string,
    field: keyof NotaEFSRT,
    value: number
  ) => {
    if (isEFSRTBloqueada) {
      addToast('Registro Bloqueado', 'El registro de EFSRT se encuentra cerrado oficialmente.', 'warning');
      return;
    }

    const current = getNotaEFSRTForStudent(estudianteId, matriculaId);
    const clamped = Math.max(0, Math.min(20, isNaN(value) ? 0 : value));
    
    const updated = {
      ...current,
      [field]: clamped,
    };

    // Recalcular promedio vigesimal redondeado (RVM 188-2020)
    const ind = [
      updated.dominioOperativo || 0,
      updated.usoEquipos || 0,
      updated.seguridadHigiene || 0,
      updated.puntualidadAsistencia || 0,
      updated.trabajoEquipo || 0,
      updated.iniciativaAdaptabilidad || 0
    ];
    
    const sum = ind.reduce((a, b) => a + b, 0);
    const prom = sum > 0 ? Math.round(sum / 6) : 0;
    updated.notaVigesimal = prom;
    updated.estado = prom >= 13 ? 'APROBADO' : prom > 0 ? 'DESAPROBADO' : 'EN_EJECUCION';

    const key = `${matriculaId}-${selectedModuloId}`;
    setEditingEFSRT((prev) => ({ ...prev, [key]: updated }));
  };

  const handleOpenEFSRTModal = (estudianteId: string, matriculaId: string) => {
    const cur = getNotaEFSRTForStudent(estudianteId, matriculaId);
    setEditingEFSRTModalData({ ...cur });
    setIsEFSRTModalOpen(true);
  };

  const handleSaveEFSRTModalDetails = async (modalData: NotaEFSRT) => {
    if (!modalData) return;
    const key = `${modalData.matriculaId}-${selectedModuloId}`;
    setEditingEFSRT((prev) => ({ ...prev, [key]: modalData }));
    setIsEFSRTModalOpen(false);

    // Guardar inmediatamente
    await saveNotasEFSRTBatch([modalData]);
    setEditingEFSRTModalData(null);
  };

  const handleSaveAllEFSRT = async () => {
    if (isEFSRTBloqueada) {
      addToast('Registro Bloqueado', 'El registro de EFSRT se encuentra cerrado oficialmente.', 'warning');
      return;
    }
    const listToSave = Object.values(editingEFSRT);
    if (listToSave.length > 0) {
      const ok = await saveNotasEFSRTBatch(listToSave);
      if (ok) {
        setEditingEFSRT({});
      }
    } else {
      addToast('Sin Cambios', 'No hay modificaciones pendientes en EFSRT.', 'info');
    }
  };

  // Cierre y Reapertura de EFSRT
  const handleCerrarEFSRTConfirm = async () => {
    if (!selectedModuloId) return;
    setIsProcessingEFSRTLock(true);
    await cerrarActaEFSRT(selectedModuloId);
    setIsProcessingEFSRTLock(false);
    setIsLockEFSRTModalOpen(false);
  };

  const handleReabrirEFSRTConfirm = async () => {
    if (!selectedModuloId) return;
    setIsProcessingEFSRTLock(true);
    await desbloquearActaEFSRT(selectedModuloId, undefined, motivoDesbloqueoEFSRT);
    setIsProcessingEFSRTLock(false);
    setIsUnlockEFSRTModalOpen(false);
    setMotivoDesbloqueoEFSRT('');
  };

  // Exportar Padrón de EFSRT a Excel UGEL (.xlsx)
  const handleExportarExcelEFSRTUGEL = () => {
    if (!selectedModulo || !selectedPrograma) {
      addToast('Error', 'Seleccione un programa y módulo válido', 'error');
      return;
    }

    const headerRows = [
      ["GOBIERNO REGIONAL DE SAN MARTÍN - DIRECCIÓN REGIONAL DE EDUCACIÓN DE SAN MARTÍN"],
      ["UNIDAD DE GESTIÓN EDUCATIVA LOCAL DE MARISCAL CÁCERES - JUANJUÍ"],
      ["CENTRO DE EDUCACIÓN TÉCNICO PRODUCTIVA 'JUANJUÍ'"],
      ["PADRÓN OFICIAL DE EXPERIENCIAS FORMATIVAS EN SITUACIONES REALES DE TRABAJO (EFSRT)"],
      [],
      ["PROGRAMA DE ESTUDIOS:", selectedPrograma.nombre, "", "NIVEL FORMATIVO:", selectedPrograma.nivelFormativo || "Técnico"],
      ["MÓDULO FORMATIVO:", selectedModulo.nombre, "", "PERIODO ACADÉMICO:", periodoActivo],
      ["HORAS OBLIGATORIAS:", "120 Horas", "", "ESTADO:", isEFSRTBloqueada ? "REGISTRO SELLADO" : "EN PROCESO"],
      []
    ];

    const colHeaders = [
      "N°", "DNI", "APELLIDOS Y NOMBRES", "MODALIDAD",
      "EMPRESA / CENTRO LABORAL", "RUC", "SUPERVISOR DE EMPRESA", "HORAS",
      "DOMINIO OPERATIVO", "USO EQUIPOS", "SEGURIDAD", "PUNTUALIDAD", "TRABAJO EQUIPO", "INICIATIVA",
      "PROMEDIO EFSRT", "SITUACIÓN"
    ];

    const rowsData: any[] = [];
    matriculasDelModulo.forEach((mat, idx) => {
      const est = estudiantes.find((e) => e.id === mat.estudianteId);
      const per = est ? personas.find((p) => p.id === est.personaId) : undefined;
      const nota = getNotaEFSRTForStudent(mat.estudianteId, mat.id);

      rowsData.push([
        idx + 1,
        per?.numeroDocumento || '---',
        per ? `${per.apellidoPaterno} ${per.apellidoMaterno || ''}, ${per.nombres}` : 'Estudiante',
        nota.modalidad || 'EMPRESA',
        nota.empresaNombre || '---',
        nota.empresaRuc || '---',
        nota.supervisorEmpresa || '---',
        nota.horasCompletadas || 120,
        nota.dominioOperativo || 0,
        nota.usoEquipos || 0,
        nota.seguridadHigiene || 0,
        nota.puntualidadAsistencia || 0,
        nota.trabajoEquipo || 0,
        nota.iniciativaAdaptabilidad || 0,
        nota.notaVigesimal || 0,
        nota.estado || (nota.notaVigesimal >= 13 ? 'APROBADO' : 'DESAPROBADO')
      ]);
    });

    const allAoa = [
      ...headerRows,
      colHeaders,
      ...rowsData,
      [],
      [],
      ["", "____________________________________", "", "", "____________________________________"],
      ["", "DOCENTE ASESOR DE PRÁCTICAS", "", "", institucion?.director || "DIRECTOR(A) GENERAL CETPRO"],
      ["", "Firma y Sello", "", "", "Firma y Sello de Dirección"]
    ];

    const ws = XLSX.utils.aoa_to_sheet(allAoa);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Padrón EFSRT UGEL");
    const fileName = `EFSRT_Oficial_${selectedModulo.codigo || 'MOD'}_${periodoActivo}.xlsx`;
    XLSX.writeFile(wb, fileName);
    addToast('Excel EFSRT Generado', `Se descargó ${fileName} con formato oficial para UGEL.`, 'success');
  };

  // Impresión individual de Ficha EFSRT
  const handlePrintIndividualEFSRT = (estudianteId: string, matriculaId: string) => {
    const est = estudiantes.find(e => e.id === estudianteId);
    const per = est ? personas.find(p => p.id === est.personaId) : undefined;
    const nota = getNotaEFSRTForStudent(estudianteId, matriculaId);

    if (est && per && nota) {
      setStudentToPrintEFSRT({ est, per, nota });
      setTimeout(() => {
        handlePrintEFSRTDoc();
      }, 150);
    } else {
      addToast('Error', 'No se encontraron datos completos del estudiante para imprimir.', 'error');
    }
  };

  const handleSaveAll = async () => {
    const listToSave = Object.values(editingNotas);
    if (listToSave.length > 0) {
      await saveNotasUnidad(listToSave);
      setEditingNotas({});
    } else {
      addToast('Todo Actualizado', 'No hay cambios pendientes de calificaciones.', 'info');
    }
  };

  // Estados y contadores para asistencias
  const presEstado = estadosAsistencias.find(e => e.codigo === 'PRES');
  const tardEstado = estadosAsistencias.find(e => e.codigo === 'TARD');
  const faltEstado = estadosAsistencias.find(e => e.codigo === 'FALT');
  const justEstado = estadosAsistencias.find(e => e.codigo === 'JUST');

  const countPres = (Object.values(asistenciasDia) as AsistenciaDiaItem[]).filter(v => v.estadoAsistenciaId === presEstado?.id).length;
  const countTard = (Object.values(asistenciasDia) as AsistenciaDiaItem[]).filter(v => v.estadoAsistenciaId === tardEstado?.id).length;
  const countFalt = (Object.values(asistenciasDia) as AsistenciaDiaItem[]).filter(v => v.estadoAsistenciaId === faltEstado?.id).length;
  const countJust = (Object.values(asistenciasDia) as AsistenciaDiaItem[]).filter(v => v.estadoAsistenciaId === justEstado?.id).length;

  // Cargar asistencias cuando cambia módulo, sección, unidad o fecha
  React.useEffect(() => {
    if (activeSubTab === 'asistencias' && selectedUnidadId) {
      setLoadingAsistencias(true);
      fetchAsistencias({ seccionId: selectedSeccionId || undefined, unidadId: selectedUnidadId })
        .then((allUnitAsistencias) => {
          setAsistenciasUnidad(allUnitAsistencias || []);
          const diaRecords = (allUnitAsistencias || []).filter(a => a.fecha === fechaAsistencia);
          const map: { [matriculaId: string]: { estadoAsistenciaId: string; observacion: string } } = {};
          diaRecords.forEach(a => {
            map[a.matriculaId] = {
              estadoAsistenciaId: a.estadoAsistenciaId,
              observacion: a.observacion || ''
            };
          });
          setAsistenciasDia(map);
        })
        .catch((err) => {
          console.error('Error cargando asistencias:', err);
        })
        .finally(() => setLoadingAsistencias(false));
    }
  }, [activeSubTab, selectedSeccionId, selectedUnidadId, fechaAsistencia]);

  const handleSetEstadoAsistencia = (matriculaId: string, estadoAsistenciaId: string) => {
    setAsistenciasDia(prev => ({
      ...prev,
      [matriculaId]: {
        estadoAsistenciaId,
        observacion: prev[matriculaId]?.observacion || ''
      }
    }));
  };

  const handleSetObservacionAsistencia = (matriculaId: string, observacion: string) => {
    setAsistenciasDia(prev => ({
      ...prev,
      [matriculaId]: {
        estadoAsistenciaId: prev[matriculaId]?.estadoAsistenciaId || presEstado?.id || '',
        observacion
      }
    }));
  };

  const handleMarcarTodosPresente = () => {
    if (!presEstado) return;
    setAsistenciasDia(prev => {
      const updated = { ...prev };
      matriculasDelModulo.forEach(m => {
        updated[m.id] = {
          estadoAsistenciaId: presEstado.id,
          observacion: updated[m.id]?.observacion || ''
        };
      });
      return updated;
    });
    addToast('Marcado rápido', 'Se asignó Presente (P) a todos los alumnos.', 'info');
  };

  const handleSaveAsistencias = async () => {
    const registros = (Object.entries(asistenciasDia) as [string, AsistenciaDiaItem][])
      .filter(([_, data]) => !!data.estadoAsistenciaId)
      .map(([matriculaId, data]) => ({
        matriculaId,
        estadoAsistenciaId: data.estadoAsistenciaId,
        observacion: data.observacion
      }));

    if (registros.length === 0) {
      addToast('Sin registros', 'Marque la asistencia de al menos un estudiante antes de guardar.', 'info');
      return;
    }

    setSavingAsistencias(true);
    const ok = await saveAsistenciasBatch({
      fecha: fechaAsistencia,
      unidadId: selectedUnidadId || undefined,
      seccionId: selectedSeccionId || undefined,
      registros
    });
    setSavingAsistencias(false);

    if (ok) {
      if (selectedUnidadId) {
        fetchAsistencias({ seccionId: selectedSeccionId || undefined, unidadId: selectedUnidadId })
          .then(res => setAsistenciasUnidad(res || []));
      }
    }
  };

  const selectedUnidad = unidades.find((u) => u.id === selectedUnidadId);

  const isEmpleabilidad = selectedUnidad?.tipo === 'Empleabilidad' || selectedUnidad?.codigo?.includes('UDE');
  const prefix = isEmpleabilidad ? 'UDE' : 'UDT';
  const unidadesDelMismoTipo = unidadesDisponibles.filter(u => 
    (u.tipo === 'Empleabilidad' || u.codigo?.includes('UDE')) === isEmpleabilidad
  );
  const orderIndex = unidadesDelMismoTipo.findIndex(u => u.id === selectedUnidad?.id) + 1;
  const lastFour = selectedUnidad?.codigo ? selectedUnidad.codigo.slice(-4) : `${prefix}${orderIndex}`;
  const dynamicPromedioLabel = `Promedio ${lastFour}`;

  const selectedModulo = modulos.find((m) => m.id === selectedModuloId);
  const selectedPrograma = programas.find((p) => p.id === selectedProgramaId);
  const selectedSeccion = secciones.find((s) => s.id === selectedSeccionId) || null;

  const udtGlobal = unidadesDisponibles.filter(u => !(u.tipo === 'Empleabilidad' || u.codigo?.includes('UDE')));
  const udeGlobal = unidadesDisponibles.filter(u => u.tipo === 'Empleabilidad' || u.codigo?.includes('UDE'));

  const miEstudiante = isEstudianteRole ? estudiantes.find((e) => e.personaId === currentUser?.personaId) : null;
  const misMatriculas = miEstudiante ? matriculas.filter((m) => m.estudianteId === miEstudiante.id) : [];

  if (isEstudianteRole) {
    return (
      <div className="space-y-6">
        {/* Banner de Bienvenida del Estudiante */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-sky-600 text-white flex items-center justify-center font-bold text-base shadow-xs shrink-0">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                    Récord de Calificaciones del Estudiante
                  </h1>
                  <span className="px-2 py-0.5 bg-sky-50 text-sky-700 border border-sky-200 rounded-md text-[10px] font-mono font-bold uppercase">
                    PORTAL ESTUDIANTIL
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {currentUser.nombreCompleto} • DNI: {currentUser.username} • Periodo Activo: {periodoActivo}
                </p>
              </div>
            </div>
            <button
              onClick={() => window.print()}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>Imprimir Boleta</span>
            </button>
          </div>
        </div>

        {/* Listado de Módulos y Unidades Didácticas del Alumno */}
        {misMatriculas.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center">
            <Award className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-700">Sin Matrículas Registradas</h3>
            <p className="text-xs text-slate-400 mt-1">No se registran matrículas activas en el sistema para este periodo.</p>
          </div>
        ) : (
          misMatriculas.map((mat) => {
            const prog = programas.find((p) => p.id === mat.programaId || p.codigo === mat.programaId);
            const mod = modulos.find((m) => m.id === mat.moduloId);
            const sec = secciones.find((s) => s.id === mat.seccionId);
            const unitList = unidades.filter((u) => u.moduloId === mat.moduloId);
            const efsrtNota = getNotaEFSRTForStudent(miEstudiante?.id || '', mat.id);

            return (
              <div key={mat.id} className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="text-xs font-mono font-bold text-blue-600">{prog?.nombre || 'Programa de Estudio'}</div>
                    <div className="text-base font-bold text-slate-900 mt-0.5">{mod?.nombre || 'Módulo Formativo'}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Sección: {sec?.nombre || 'Única'} • Turno: {sec?.turno || '---'} • Código Matrícula: {mat.codigoMatricula}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold font-mono">
                      EFSRT: {efsrtNota.notaVigesimal ? `${efsrtNota.notaVigesimal} (${efsrtNota.estado})` : 'En Ejecución'}
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 text-[11px] font-bold">
                        <th className="p-3">Código</th>
                        <th className="p-3">Unidad Didáctica</th>
                        <th className="p-3">Tipo</th>
                        <th className="p-3 text-center">Horas</th>
                        <th className="p-3 text-center">Créditos</th>
                        <th className="p-3 text-center">C1</th>
                        <th className="p-3 text-center">C2</th>
                        <th className="p-3 text-center">C3</th>
                        <th className="p-3 text-center">Promedio</th>
                        <th className="p-3 text-center">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {unitList.map((ud) => {
                        const nota = notasUnidades.find((n) => n.matriculaId === mat.id && n.unidadDidacticaId === ud.id);
                        const prom = nota?.promedioFinal ?? 0;
                        const isApproved = prom >= 13;
                        return (
                          <tr key={ud.id} className="hover:bg-slate-50/50">
                            <td className="p-3 font-mono text-slate-500">{ud.codigo}</td>
                            <td className="p-3 font-bold text-slate-900">{ud.nombre}</td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-medium">
                                {ud.tipo}
                              </span>
                            </td>
                            <td className="p-3 text-center font-mono">{ud.horas}h</td>
                            <td className="p-3 text-center font-mono">{ud.creditos}</td>
                            <td className="p-3 text-center font-mono">{nota?.c1 ?? nota?.i1 ?? '-'}</td>
                            <td className="p-3 text-center font-mono">{nota?.c2 ?? nota?.i2 ?? '-'}</td>
                            <td className="p-3 text-center font-mono">{nota?.c3 ?? nota?.i3 ?? '-'}</td>
                            <td className="p-3 text-center font-mono font-bold">
                              <span className={`px-2 py-0.5 rounded ${prom > 0 ? (isApproved ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700') : 'text-slate-400'}`}>
                                {prom > 0 ? prom : '---'}
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              {prom > 0 ? (
                                <Badge variant={isApproved ? 'success' : 'danger'} size="sm">
                                  {isApproved ? 'Aprobado' : 'Desaprobado'}
                                </Badge>
                              ) : (
                                <Badge variant="warning" size="sm">
                                  En Curso
                                </Badge>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  Matriz de Calificaciones y Evaluación
                </h1>
                <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-md text-[10px] font-mono font-bold uppercase">
                  RVM 188-2020
                </span>
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-[10px] font-mono font-bold uppercase">
                  MIN. APROBATORIA: 13
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Registro de capacidades, escala vigesimal (0-20), recuperación pedagógica y EFSRT
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Botón Exportar Excel Oficial UGEL (Unidades / Consolidado) */}
            {(activeSubTab === 'unidades' || activeSubTab === 'consolidado') && (
              <button
                type="button"
                onClick={handleExportarExcelUGEL}
                className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 rounded-xl text-xs font-bold shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
                title="Descargar matriz en formato oficial XLSX para supervisión de UGEL"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Exportar Acta UGEL (.xlsx)</span>
              </button>
            )}

            {/* Botón Exportar Padrón EFSRT a Excel UGEL */}
            {activeSubTab === 'efsrt' && (
              <button
                type="button"
                onClick={handleExportarExcelEFSRTUGEL}
                className="px-3.5 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-300 rounded-xl text-xs font-bold shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
                title="Descargar padrón oficial de prácticas EFSRT para supervisión de UGEL"
              >
                <FileSpreadsheet className="w-4 h-4 text-purple-600" />
                <span>Exportar Padrón EFSRT (.xlsx)</span>
              </button>
            )}

            {activeSubTab === 'unidades' && (
              <>
                {/* Botón Cierre / Apertura Oficial de Acta */}
                {isActaBloqueada ? (
                  canUnlockActa ? (
                    <button
                      type="button"
                      onClick={() => setIsUnlockModalOpen(true)}
                      className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-xl text-xs font-bold shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
                      title="Acta sellada. Haga clic para solicitar reapertura con justificación"
                    >
                      <Lock className="w-4 h-4 text-amber-600" />
                      <span>Acta Cerrada 🔒 (Reabrir)</span>
                    </button>
                  ) : (
                    <div className="px-3 py-1.5 bg-slate-100 text-slate-600 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-slate-500" />
                      <span>Acta Sellada</span>
                    </div>
                  )
                ) : canCerrarActa ? (
                  <button
                    type="button"
                    onClick={() => setIsLockModalOpen(true)}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
                    title="Cerrar y sellar acta oficialmente para evitar alteraciones posteriores"
                  >
                    <ShieldCheck className="w-4 h-4 text-slate-600" />
                    <span>Cerrar y Sellar Acta</span>
                  </button>
                ) : null}
              </>
            )}

            {activeSubTab === 'efsrt' && (
              <>
                {/* Botón Cierre / Apertura Oficial de EFSRT */}
                {isEFSRTBloqueada ? (
                  canUnlockActa ? (
                    <button
                      type="button"
                      onClick={() => setIsUnlockEFSRTModalOpen(true)}
                      className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-xl text-xs font-bold shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
                      title="Registro EFSRT sellado. Haga clic para solicitar reapertura formal"
                    >
                      <Lock className="w-4 h-4 text-amber-600" />
                      <span>EFSRT Sellada 🔒 (Reabrir)</span>
                    </button>
                  ) : (
                    <div className="px-3 py-1.5 bg-slate-100 text-slate-600 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-slate-500" />
                      <span>EFSRT Sellada</span>
                    </div>
                  )
                ) : canCerrarActa ? (
                  <button
                    type="button"
                    onClick={() => setIsLockEFSRTModalOpen(true)}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
                    title="Cerrar y sellar las evaluaciones de EFSRT del módulo formativo"
                  >
                    <ShieldCheck className="w-4 h-4 text-slate-600" />
                    <span>Cerrar y Sellar EFSRT</span>
                  </button>
                ) : null}
              </>
            )}

            {activeSubTab === 'asistencias' ? (
              <button
                onClick={handleSaveAsistencias}
                disabled={savingAsistencias}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{savingAsistencias ? 'Guardando...' : 'Guardar Asistencias'}</span>
              </button>
            ) : activeSubTab === 'consolidado' ? (
              <button
                onClick={() => handlePrint()}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Acta Oficial</span>
              </button>
            ) : (
              <button
                onClick={activeSubTab === 'efsrt' ? handleSaveAllEFSRT : handleSaveAll}
                disabled={(activeSubTab === 'unidades' && isActaBloqueada) || (activeSubTab === 'efsrt' && isEFSRTBloqueada)}
                className={`px-4 py-2 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                  ((activeSubTab === 'unidades' && isActaBloqueada) || (activeSubTab === 'efsrt' && isEFSRTBloqueada))
                    ? 'bg-slate-400 cursor-not-allowed opacity-60'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                <Save className="w-4 h-4" />
                <span>
                  {activeSubTab === 'efsrt' 
                    ? (isEFSRTBloqueada ? 'EFSRT Bloqueada' : 'Guardar EFSRT') 
                    : isActaBloqueada ? 'Acta Bloqueada' : 'Guardar Calificaciones'}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Selectors Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">
              Programa de Estudio
            </label>
            <select
              value={selectedProgramaId}
              onChange={(e) => {
                setSelectedProgramaId(e.target.value);
                const firstMod = modulos.find((m) => m.programaId === e.target.value);
                if (firstMod) {
                  setSelectedModuloId(firstMod.id);
                  const firstUd = unidades.find((u) => u.moduloId === firstMod.id);
                  if (firstUd) setSelectedUnidadId(firstUd.id);
                }
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:bg-white focus:outline-none"
            >
              {programasVisibles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre} ({p.nivelFormativo})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">
              Módulo Formativo
            </label>
            <select
              value={selectedModuloId}
              onChange={(e) => {
                setSelectedModuloId(e.target.value);
                const firstUd = unidades.find((u) => u.moduloId === e.target.value);
                if (firstUd) setSelectedUnidadId(firstUd.id);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:bg-white focus:outline-none"
            >
              {modulosDisponibles.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.codigo}: {m.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">
              Sección / Turno
            </label>
            <select
              value={selectedSeccionId}
              onChange={(e) => setSelectedSeccionId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:bg-white focus:outline-none"
            >
              <option value="">Todas las secciones</option>
              {seccionesDisponibles.map((s) => (
                <option key={s.id} value={s.id}>
                  Sección {s.nombre} - {s.turno}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">
              Unidad Didáctica
            </label>
            <select
              value={selectedUnidadId}
              onChange={(e) => setSelectedUnidadId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:bg-white focus:outline-none"
              disabled={activeSubTab !== 'unidades' && activeSubTab !== 'asistencias'}
            >
              {unidadesDisponibles.length === 0 ? (
                <option value="">No hay unidades cargadas</option>
              ) : (
                unidadesDisponibles.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.codigo}: {u.nombre}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        {/* Sub-tab navigation between UD evaluation, EFSRT, Asistencias, and Consolidado */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 flex-wrap">
          <button
            onClick={() => setActiveSubTab('unidades')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'unidades'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Evaluación de Unidad Didáctica (Indicadores IE1, IE2, IE3)
          </button>
          <button
            onClick={() => setActiveSubTab('efsrt')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'efsrt'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Experiencias Formativas (EFSRT)
          </button>
          <button
            onClick={() => setActiveSubTab('asistencias')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'asistencias'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Control de Asistencias</span>
          </button>
          <button
            onClick={() => setActiveSubTab('consolidado')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'consolidado'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Acta de Consolidado Modular
          </button>
        </div>
      </div>

      {/* Barra Operativa de la Unidad Didáctica: Estado, Fechas y Horarios */}
      {selectedSeccion && selectedUnidad && (
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-4 text-white shadow-xs border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-black bg-blue-500/20 text-blue-300 border border-blue-400/30 px-2 py-0.5 rounded-md">
                {selectedUnidad.codigo}
              </span>
              <span className="text-sm font-bold text-white">
                {selectedUnidad.nombre}
              </span>
              {/* Badge Estado */}
              {seccionUnidadData?.estado === 'FINALIZADA' ? (
                <span className="px-2 py-0.5 bg-slate-200/20 text-slate-300 border border-slate-400/30 rounded-full text-[10px] font-bold">
                  🔵 Finalizada
                </span>
              ) : seccionUnidadData?.estado === 'EN_CURSO' ? (
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-full text-[10px] font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  🟢 En Curso / Habilitada
                </span>
              ) : (
                <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-400/30 rounded-full text-[10px] font-bold">
                  ⚪ Programada
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                <span>Fechas de Dictado:</span>
                <span className="font-mono font-semibold text-white">
                  {seccionUnidadData?.fecha_inicio 
                    ? `${seccionUnidadData.fecha_inicio.substring(0, 10)} al ${seccionUnidadData.fecha_fin?.substring(0, 10) || '---'}` 
                    : 'Por programar'}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                <span>Horario Semanal:</span>
                {horariosUnidadList.length > 0 ? (
                  <div className="flex items-center gap-1 flex-wrap">
                    {horariosUnidadList.map((h: any) => (
                      <span key={h.horario_id} className="bg-white/10 px-1.5 py-0.5 rounded font-mono text-[10px] text-blue-200">
                        {h.dia_nombre?.substring(0, 3)} {h.hora_inicio?.substring(0, 5)}-{h.hora_fin?.substring(0, 5)}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-slate-400 italic text-[11px]">Sin horario específico</span>
                )}
              </div>

              <div className="text-slate-400 text-[11px]">
                Sección: <strong className="text-white">{selectedSeccion.nombre}</strong> ({selectedSeccion.turno})
              </div>
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="flex items-center gap-2 self-start md:self-auto shrink-0 flex-wrap">
            <button
              type="button"
              onClick={() => setIsHabilitarModalOpen(true)}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              title="Habilitar unidad didáctica y definir fechas operativas de inicio y fin"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>⚡ Habilitar / Configurar Fechas</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveView('horarios')}
              className="px-3.5 py-2 bg-white/15 hover:bg-white/25 text-white border border-white/20 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer group"
              title="Ir al módulo central de Horarios de Clases para gestionar o consultar la malla horaria oficial"
            >
              <Clock className="w-3.5 h-3.5 text-sky-300 group-hover:scale-110 transition-transform" />
              <span>⏰ Ver en Horarios</span>
              <ExternalLink className="w-3 h-3 text-sky-200 opacity-70" />
            </button>
          </div>
        </div>
      )}

      {/* Evaluation Table */}
      {activeSubTab === 'unidades' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Banner de Estado de Acta Bloqueada */}
          {isActaBloqueada && (
            <div className="p-3.5 bg-amber-50 border-b border-amber-200 text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold flex items-center gap-2">
                    <span>Acta de Evaluación Cerrada y Sellada Oficialmente</span>
                    <span className="px-1.5 py-0.5 bg-amber-200 text-amber-900 rounded text-[10px] font-mono font-bold">SOLO LECTURA</span>
                  </div>
                  <div className="text-[11px] text-amber-700">
                    Las calificaciones están protegidas contra alteraciones. Para rectificaciones solicite la reapertura formal.
                  </div>
                </div>
              </div>
              {canUnlockActa ? (
                <button
                  type="button"
                  onClick={() => setIsUnlockModalOpen(true)}
                  className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 rounded-lg font-bold text-xs transition-all cursor-pointer shrink-0 self-start sm:self-auto"
                >
                  Reabrir Acta Oficial
                </button>
              ) : (
                <span className="text-[11px] text-amber-800 font-semibold italic">
                  Comuníquese con Dirección o Secretaría para solicitar reapertura.
                </span>
              )}
            </div>
          )}

          <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="font-bold text-slate-900 text-xs">
                {selectedUnidad?.nombre || 'Unidad Didáctica Seleccionada'}
              </div>
              <div className="text-[11px] text-slate-500">
                Semestre I • {selectedUnidad?.horas} Horas • {selectedUnidad?.creditos} Créditos • Periodo {periodoActivo}
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs flex-wrap">
              <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
                <span className="w-2 h-2 rounded-full bg-emerald-500" /> Aprobado: 13 a 20
              </span>
              <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-[11px]">
                <span className="w-2 h-2 rounded-full bg-amber-500" /> Recuperación: 10 a 12
              </span>
              <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 text-[11px]">
                <span className="w-2 h-2 rounded-full bg-rose-500" /> Desaprobado: 0 a 9
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">N°</th>
                  <th className="px-4 py-3">DNI / Estudiante</th>
                  <th className="px-4 py-3 text-center">C1 / IE1: Teórico / Conceptual</th>
                  <th className="px-4 py-3 text-center">C2 / IE2: Procedimental / Taller</th>
                  <th className="px-4 py-3 text-center">C3 / IE3: Actitudinal / Empleabilidad</th>
                  <th className="px-4 py-3 text-center">Recup.</th>
                  <th className="px-4 py-3 text-center">{dynamicPromedioLabel}</th>
                  <th className="px-4 py-3 text-right">Resultado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {matriculasDelModulo.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-6 text-center text-slate-400 italic">
                      No hay estudiantes matriculados en este módulo para el periodo activo.
                    </td>
                  </tr>
                ) : (
                  matriculasDelModulo.map((mat, idx) => {
                    const est = estudiantes.find((e) => e.id === mat.estudianteId);
                    const per = est ? personas.find((p) => p.id === est.personaId) : undefined;
                    const nota = getNotaForStudent(mat.estudianteId, mat.id);
                    const isApproved = nota.promedioFinal >= 13;

                    return (
                      <tr key={mat.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3 font-mono text-slate-400">{idx + 1}</td>
                        <td className="px-4 py-3">
                          <div className="font-bold text-slate-900">
                            {per ? `${per.apellidoPaterno} ${per.apellidoMaterno}, ${per.nombres}` : 'Estudiante'}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            DNI: {per?.numeroDocumento}
                          </div>
                        </td>

                        {/* C1 input */}
                        <td className="px-4 py-3 text-center">
                          <input
                            type="number"
                            min={0}
                            max={20}
                            disabled={isActaBloqueada}
                            value={nota.c1 ?? nota.i1 ?? 0}
                            onChange={(e) =>
                              handleGradeChange(mat.id, mat.estudianteId, 'c1', parseInt(e.target.value, 10))
                            }
                            className={`w-14 px-2 py-1 border rounded-lg text-center font-mono font-bold focus:outline-none ${
                              isActaBloqueada
                                ? 'bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200'
                                : 'bg-white text-slate-800 border-slate-200 focus:ring-2 focus:ring-sky-500'
                            }`}
                          />
                        </td>

                        {/* C2 input */}
                        <td className="px-4 py-3 text-center">
                          <input
                            type="number"
                            min={0}
                            max={20}
                            disabled={isActaBloqueada}
                            value={nota.c2 ?? nota.i2 ?? 0}
                            onChange={(e) =>
                              handleGradeChange(mat.id, mat.estudianteId, 'c2', parseInt(e.target.value, 10))
                            }
                            className={`w-14 px-2 py-1 border rounded-lg text-center font-mono font-bold focus:outline-none ${
                              isActaBloqueada
                                ? 'bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200'
                                : 'bg-white text-slate-800 border-slate-200 focus:ring-2 focus:ring-sky-500'
                            }`}
                          />
                        </td>

                        {/* C3 input */}
                        <td className="px-4 py-3 text-center">
                          <input
                            type="number"
                            min={0}
                            max={20}
                            disabled={isActaBloqueada}
                            value={nota.c3 ?? nota.i3 ?? 0}
                            onChange={(e) =>
                              handleGradeChange(mat.id, mat.estudianteId, 'c3', parseInt(e.target.value, 10))
                            }
                            className={`w-14 px-2 py-1 border rounded-lg text-center font-mono font-bold focus:outline-none ${
                              isActaBloqueada
                                ? 'bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200'
                                : 'bg-white text-slate-800 border-slate-200 focus:ring-2 focus:ring-sky-500'
                            }`}
                          />
                        </td>

                        {/* Recuperacion input */}
                        <td className="px-4 py-3 text-center">
                          <input
                            type="number"
                            min={0}
                            max={20}
                            disabled={isActaBloqueada}
                            placeholder="--"
                            value={nota.recuperacion || ''}
                            onChange={(e) =>
                              handleGradeChange(
                                mat.id,
                                mat.estudianteId,
                                'recuperacion',
                                parseInt(e.target.value, 10)
                              )
                            }
                            className={`w-14 px-2 py-1 border rounded-lg text-center font-mono focus:outline-none ${
                              isActaBloqueada
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed border-slate-200'
                                : 'bg-white text-slate-600 border-slate-200 focus:ring-2 focus:ring-amber-500'
                            }`}
                          />
                        </td>

                        {/* Promedio Final */}
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`inline-block w-10 py-1 rounded font-mono font-bold text-sm ${
                              isApproved
                                ? 'bg-emerald-100 text-emerald-800'
                                : (nota.promedioFinal > 0 && nota.promedioFinal >= 10)
                                ? 'bg-amber-100 text-amber-800'
                                : nota.promedioFinal > 0
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-slate-100 text-slate-400'
                            }`}
                          >
                            {nota.promedioFinal > 0 ? nota.promedioFinal.toString().padStart(2, '0') : '--'}
                          </span>
                        </td>

                        {/* Result Badge */}
                        <td className="px-4 py-3 text-right">
                          {nota.estado === 'APROBADO' ? (
                            <Badge variant="success" size="sm" dot>
                              Aprobado
                            </Badge>
                          ) : nota.estado === 'RECUPERACION' ? (
                            <Badge variant="warning" size="sm" dot>
                              Recuperación
                            </Badge>
                          ) : nota.estado === 'DESAPROBADO' ? (
                            <Badge variant="danger" size="sm" dot>
                              Desaprobado
                            </Badge>
                          ) : (
                            <span className="text-[11px] font-medium text-slate-400">
                              Pendiente
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Consolidado Tab */}
      {activeSubTab === 'consolidado' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Consolidado de Notas - {modulos.find(m => m.id === selectedModuloId)?.nombre || 'Módulo'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Promedios finales por cada Unidad Didáctica, nota de EFSRT y promedio final del Módulo.
              </p>
            </div>
            <button
              onClick={() => handlePrint()}
              className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Acta</span>
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-600 text-[11px] uppercase tracking-wider border-b border-slate-200">
                  <th className="px-4 py-2 font-semibold">N°</th>
                  <th className="px-4 py-2 font-semibold">Estudiante</th>
                  {udtGlobal.map((u, i) => (
                    <th title={u.nombre} key={'udt'+i} className="px-2 py-2 font-semibold text-center w-12 text-slate-700">
                      {u.codigo ? u.codigo.slice(-4) : `UDT${i+1}`}
                    </th>
                  ))}
                  {udeGlobal.map((u, i) => (
                    <th title={u.nombre} key={'ude'+i} className="px-2 py-2 font-semibold text-center w-12 text-slate-700">
                      {u.codigo ? u.codigo.slice(-4) : `UDE${i+1}`}
                    </th>
                  ))}
                  <th className="px-2 py-2 font-semibold text-center w-16 text-indigo-700">EFSRT</th>
                  <th className="px-4 py-2 font-semibold text-right">Resultado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {matriculasDelModulo.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="px-4 py-8 text-center text-slate-500">
                      No hay estudiantes matriculados en este módulo.
                    </td>
                  </tr>
                ) : (
                  matriculasDelModulo.map((mat, idx) => {
                    const est = estudiantes.find((e) => e.id === mat.estudianteId);
                    const per = est ? personas.find((p) => p.id === est.personaId) : undefined;
                    
                    // Recopilar notas de unidades
                    const udtDisponibles = unidadesDisponibles.filter(u => !(u.tipo === 'Empleabilidad' || u.codigo?.includes('UDE')));
                    const udeDisponibles = unidadesDisponibles.filter(u => u.tipo === 'Empleabilidad' || u.codigo?.includes('UDE'));
                    
                    const notasUdt = udtDisponibles.map(u => {
                      const nu = notasUnidades.find(n => n.estudianteId === mat.estudianteId && n.unidadDidacticaId === u.id);
                      return nu ? nu.promedioFinal : 0;
                    });
                    const notasUde = udeDisponibles.map(u => {
                      const nu = notasUnidades.find(n => n.estudianteId === mat.estudianteId && n.unidadDidacticaId === u.id);
                      return nu ? nu.promedioFinal : 0;
                    });
                    
                    const todasLasNotasUds = [...notasUdt, ...notasUde];
                    
                    // Nota EFSRT
                    const efsrt = notasEFSRT.find(ef => ef.estudianteId === mat.estudianteId && ef.moduloId === selectedModuloId);
                    const notaEfsrt = efsrt ? efsrt.notaVigesimal : 0;
                    
                    const hasAnyGrade = todasLasNotasUds.some(nu => nu > 0) || notaEfsrt > 0;
                    
                    // Aprobación: para las unidades que existen, la nota debe ser >= 13. Además EFSRT >= 13.
                    const isApproved = udtDisponibles.every((_, i) => notasUdt[i] >= 13) && 
                                       udeDisponibles.every((_, i) => notasUde[i] >= 13) && 
                                       notaEfsrt >= 13 && hasAnyGrade && unidadesDisponibles.length > 0;

                    return (
                      <tr key={mat.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-2 font-mono text-slate-400">{idx + 1}</td>
                        <td className="px-4 py-2 font-bold text-slate-800">
                          {per ? `${per.apellidoPaterno} ${per.apellidoMaterno}, ${per.nombres}` : '---'}
                        </td>
                        {notasUdt.map((nu, i) => (
                          <td key={`udt-${i}`} className={`px-2 py-2 text-center font-mono ${nu >= 13 ? 'text-slate-700' : nu > 0 ? 'text-rose-600' : 'text-slate-300'}`}>
                            {nu > 0 ? nu.toString().padStart(2, '0') : '--'}
                          </td>
                        ))}
                        {notasUde.map((nu, i) => (
                          <td key={`ude-${i}`} className={`px-2 py-2 text-center font-mono ${nu >= 13 ? 'text-slate-700' : nu > 0 ? 'text-rose-600' : 'text-slate-300'}`}>
                            {nu > 0 ? nu.toString().padStart(2, '0') : '--'}
                          </td>
                        ))}
                        <td className={`px-2 py-2 text-center font-mono font-bold ${notaEfsrt >= 13 ? 'text-indigo-600' : notaEfsrt > 0 ? 'text-rose-600' : 'text-slate-300'}`}>
                          {notaEfsrt > 0 ? notaEfsrt.toString().padStart(2, '0') : '--'}
                        </td>
                        <td className="px-4 py-2 text-right">
                          {hasAnyGrade ? (
                            <Badge variant={isApproved ? 'success' : 'danger'} size="sm">
                              {isApproved ? 'Aprobado' : 'Desaprobado'}
                            </Badge>
                          ) : (
                            <span className="text-[10px] text-slate-400">Incompleto</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* EFSRT Tab */}
      {activeSubTab === 'efsrt' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Banner de Estado de EFSRT Bloqueada */}
          {isEFSRTBloqueada && (
            <div className="p-3.5 bg-amber-50 border-b border-amber-200 text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold flex items-center gap-2">
                    <span>Padrón de EFSRT Cerrado y Sellado Oficialmente</span>
                    <span className="px-1.5 py-0.5 bg-amber-200 text-amber-900 rounded text-[10px] font-mono font-bold">SOLO LECTURA</span>
                  </div>
                  <div className="text-[11px] text-amber-700">
                    Las evaluaciones de prácticas están protegidas bajo normativa R.V.M. 188-2020-MINEDU. Para rectificaciones solicite la reapertura formal.
                  </div>
                </div>
              </div>
              {canUnlockActa ? (
                <button
                  type="button"
                  onClick={() => setIsUnlockEFSRTModalOpen(true)}
                  className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 rounded-lg font-bold text-xs transition-all cursor-pointer shrink-0 self-start sm:self-auto flex items-center gap-1.5"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Reabrir Registro EFSRT</span>
                </button>
              ) : (
                <span className="text-[11px] text-amber-800 font-semibold italic">
                  Comuníquese con Dirección o Secretaría para solicitar reapertura.
                </span>
              )}
            </div>
          )}

          <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Experiencias Formativas en Situaciones Reales de Trabajo (EFSRT)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Prácticas preprofesionales en empresas productivas. Evaluadas con 6 criterios e indicadores (Mínimo aprobatorio: 13, sin examen de recuperación).
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded font-semibold text-xs">
                Módulo: {selectedModulo?.nombre || 'Seleccionado'}
              </span>
              <Badge variant="purple" size="md">RVM 188-2020</Badge>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px] border-collapse">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 tracking-tight">
                <tr>
                  <th className="px-2 py-3 w-8">N°</th>
                  <th className="px-2 py-3 min-w-[150px]">Estudiante</th>
                  <th className="px-2 py-3 min-w-[130px]">Centro de Prácticas</th>
                  <th className="px-1 py-3 text-center" title="1. Dominio Operativo / Procedimental">Dom. Operativo</th>
                  <th className="px-1 py-3 text-center" title="2. Uso y Mantenimiento de Equipos">Uso Equipos</th>
                  <th className="px-1 py-3 text-center" title="3. Seguridad e Higiene Laboral">Seguridad</th>
                  <th className="px-1 py-3 text-center" title="4. Puntualidad y Asistencia">Puntualidad</th>
                  <th className="px-1 py-3 text-center" title="5. Trabajo en Equipo">Trab. Equipo</th>
                  <th className="px-1 py-3 text-center" title="6. Iniciativa y Adaptabilidad">Iniciativa</th>
                  <th className="px-2 py-3 text-center font-bold">Prom. EFSRT</th>
                  <th className="px-2 py-3 text-center">Estado</th>
                  <th className="px-2 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {matriculasDelModulo.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="p-6 text-center text-slate-400 italic">
                      No hay estudiantes matriculados en este módulo.
                    </td>
                  </tr>
                ) : (
                  matriculasDelModulo.map((mat, idx) => {
                    const est = estudiantes.find((e) => e.id === mat.estudianteId);
                    const per = est ? personas.find((p) => p.id === est.personaId) : undefined;
                    const nota = getNotaEFSRTForStudent(mat.estudianteId, mat.id);
                    const isApproved = nota.notaVigesimal >= 13;
                    
                    return (
                      <tr key={mat.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-2 py-2 font-mono text-slate-400 text-xs">{idx + 1}</td>
                        <td className="px-2 py-2">
                          <div className="font-bold text-slate-900 text-xs truncate max-w-[180px]">
                            {per ? `${per.apellidoPaterno} ${per.apellidoMaterno}, ${per.nombres}` : 'Estudiante'}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            DNI: {per?.numeroDocumento || '---'}
                          </div>
                        </td>
                        <td className="px-2 py-2">
                          <button
                            type="button"
                            onClick={() => handleOpenEFSRTModal(mat.estudianteId, mat.id)}
                            className="text-left group cursor-pointer"
                            title="Ver / editar datos de la empresa y supervisor"
                          >
                            <div className="font-semibold text-xs text-indigo-600 group-hover:text-indigo-800 flex items-center gap-1">
                              <Building2 className="w-3 h-3 shrink-0" />
                              <span className="truncate max-w-[120px]">
                                {nota.empresaNombre || 'Sin asignar'}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400 flex items-center gap-1">
                              <span>{nota.modalidad || 'EMPRESA'}</span>
                              <span>•</span>
                              <span>{nota.horasCompletadas || 120}h</span>
                            </div>
                          </button>
                        </td>
                        {[
                          { key: 'dominioOperativo', label: 'Dom. Operativo' },
                          { key: 'usoEquipos', label: 'Uso Equipos' },
                          { key: 'seguridadHigiene', label: 'Seguridad' },
                          { key: 'puntualidadAsistencia', label: 'Puntualidad' },
                          { key: 'trabajoEquipo', label: 'Trab. Equipo' },
                          { key: 'iniciativaAdaptabilidad', label: 'Iniciativa' },
                        ].map(({ key }) => (
                           <td key={key} className="px-1 py-2 text-center">
                             <input
                               type="number"
                               min={0}
                               max={20}
                               disabled={isEFSRTBloqueada}
                               value={nota[key as keyof NotaEFSRT] || ''}
                               onChange={(e) =>
                                 handleEFSRTGradeChange(mat.id, mat.estudianteId, key as keyof NotaEFSRT, parseInt(e.target.value, 10))
                               }
                               className={`w-10 px-1 py-1 rounded text-center font-mono font-bold text-xs focus:outline-none ${
                                 isEFSRTBloqueada
                                   ? 'bg-slate-100 text-slate-500 cursor-not-allowed border border-slate-200'
                                   : 'bg-white border border-slate-200 text-slate-800 focus:ring-2 focus:ring-sky-500'
                               }`}
                             />
                           </td>
                        ))}
                        
                        <td className="px-2 py-2 text-center">
                          <span
                            className={`inline-block w-8 py-1 rounded font-mono font-bold text-xs ${
                              isApproved
                                ? 'bg-emerald-100 text-emerald-800'
                                : nota.notaVigesimal > 0
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {nota.notaVigesimal > 0 ? nota.notaVigesimal.toString().padStart(2, '0') : '--'}
                          </span>
                        </td>
                        <td className="px-2 py-2 text-center">
                          <Badge variant={isApproved ? 'success' : nota.notaVigesimal > 0 ? 'danger' : 'neutral'} size="sm" dot>
                            {isApproved ? 'Aprobado' : nota.notaVigesimal > 0 ? 'Desaprobado' : 'En Ejecución'}
                          </Badge>
                        </td>
                        <td className="px-2 py-2 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEFSRTModal(mat.estudianteId, mat.id)}
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                              title="Configurar Empresa y Supervisor"
                            >
                              <Building2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handlePrintIndividualEFSRT(mat.estudianteId, mat.id)}
                              className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                              title="Imprimir Ficha Oficial de Evaluación y Acreditación de EFSRT"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Attendance Tab */}
      {activeSubTab === 'asistencias' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Header & Date controls bar */}
          <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg">
                  <Calendar className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Control Diario de Asistencia - {selectedUnidad?.nombre || 'Unidad Didáctica'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Registre la asistencia de los estudiantes por sesión. La norma MINEDU establece DPI con ≥ 30% de inasistencias.
                  </p>
                </div>
              </div>
            </div>

            {/* Date picker & Quick actions */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 border border-slate-200 rounded-xl shadow-2xs text-xs">
                <span className="text-slate-500 font-semibold text-[11px]">Fecha:</span>
                <input
                  type="date"
                  value={fechaAsistencia}
                  onChange={(e) => setFechaAsistencia(e.target.value)}
                  className="font-medium text-slate-800 focus:outline-none bg-transparent cursor-pointer"
                />
                <button
                  type="button"
                  onClick={() => setFechaAsistencia(new Date().toISOString().split('T')[0])}
                  className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-[10px] font-bold cursor-pointer"
                  title="Seleccionar hoy"
                >
                  Hoy
                </button>
              </div>

              <button
                type="button"
                onClick={handleMarcarTodosPresente}
                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                title="Marcar 'Presente' a todos los estudiantes de la sección"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Marcar Todos Presente</span>
              </button>

              <button
                type="button"
                onClick={handleSaveAsistencias}
                disabled={savingAsistencias}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{savingAsistencias ? 'Guardando...' : 'Guardar'}</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="px-4 py-2.5 bg-slate-50/40 border-b border-slate-100 flex items-center gap-4 text-xs flex-wrap">
            <span className="text-slate-500 font-medium">
              Sesión del día <strong className="text-slate-700">{fechaAsistencia}</strong>:
            </span>
            <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
              Total: {matriculasDelModulo.length}
            </span>
            <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              P: {countPres}
            </span>
            <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              T: {countTard}
            </span>
            <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              F: {countFalt}
            </span>
            <span className="inline-flex items-center gap-1 text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
              J: {countJust}
            </span>
            {loadingAsistencias && (
              <span className="text-indigo-600 animate-pulse text-[11px] font-medium ml-auto">
                Cargando datos de asistencia...
              </span>
            )}
          </div>

          {/* Attendance Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 w-12 text-center">N°</th>
                  <th className="px-4 py-3 min-w-[220px]">DNI / Estudiante</th>
                  <th className="px-4 py-3 text-center min-w-[200px]">Estado de Asistencia</th>
                  <th className="px-4 py-3 min-w-[240px]">Observación</th>
                  <th className="px-4 py-3 text-center w-36">Historial Unidad</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {matriculasDelModulo.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                      No hay estudiantes matriculados en este módulo/sección.
                    </td>
                  </tr>
                ) : (
                  matriculasDelModulo.map((mat, index) => {
                    const est = estudiantes.find((e) => e.id === mat.estudianteId);
                    const per = personas.find((p) => p.id === est?.personaId);
                    const nombre = per ? `${per.apellidoPaterno} ${per.apellidoMaterno || ''}, ${per.nombres}` : 'Estudiante';
                    const currentAsistencia = asistenciasDia[mat.id];
                    const currentEstadoId = currentAsistencia?.estadoAsistenciaId;
                    const observacion = currentAsistencia?.observacion || '';

                    // History metrics for this student in this unit
                    const studentHistory = asistenciasUnidad.filter(a => a.matriculaId === mat.id);
                    const totalSesionesHist = studentHistory.length;
                    const totalFaltasHist = studentHistory.filter(a => a.codigoEstado === 'FALT' || (!a.codigoEstado && a.estadoAsistenciaId === faltEstado?.id)).length;
                    const pctInasist = totalSesionesHist > 0 ? Math.round((totalFaltasHist / totalSesionesHist) * 100) : 0;
                    const isDpi = pctInasist >= 30;
                    const isAlerta = pctInasist >= 20 && !isDpi;

                    return (
                      <tr key={mat.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-2.5 text-center font-mono text-slate-400">
                          {(index + 1).toString().padStart(2, '0')}
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="font-semibold text-slate-800">{nombre}</div>
                          <div className="text-[11px] text-slate-400 font-mono">DNI: {per?.numeroDocumento || '---'}</div>
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* P button */}
                            <button
                              type="button"
                              onClick={() => handleSetEstadoAsistencia(mat.id, presEstado?.id || '')}
                              className={`w-8 h-8 rounded-lg font-bold text-xs transition-all flex items-center justify-center cursor-pointer ${
                                currentEstadoId === presEstado?.id
                                  ? 'bg-emerald-600 text-white shadow-xs scale-105'
                                  : 'bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50'
                              }`}
                              title="Presente"
                            >
                              P
                            </button>

                            {/* T button */}
                            <button
                              type="button"
                              onClick={() => handleSetEstadoAsistencia(mat.id, tardEstado?.id || '')}
                              className={`w-8 h-8 rounded-lg font-bold text-xs transition-all flex items-center justify-center cursor-pointer ${
                                currentEstadoId === tardEstado?.id
                                  ? 'bg-amber-500 text-white shadow-xs scale-105'
                                  : 'bg-white text-amber-700 border border-amber-200 hover:bg-amber-50'
                              }`}
                              title="Tardanza"
                            >
                              T
                            </button>

                            {/* F button */}
                            <button
                              type="button"
                              onClick={() => handleSetEstadoAsistencia(mat.id, faltEstado?.id || '')}
                              className={`w-8 h-8 rounded-lg font-bold text-xs transition-all flex items-center justify-center cursor-pointer ${
                                currentEstadoId === faltEstado?.id
                                  ? 'bg-rose-600 text-white shadow-xs scale-105'
                                  : 'bg-white text-rose-700 border border-rose-200 hover:bg-rose-50'
                              }`}
                              title="Falta"
                            >
                              F
                            </button>

                            {/* J button */}
                            <button
                              type="button"
                              onClick={() => handleSetEstadoAsistencia(mat.id, justEstado?.id || '')}
                              className={`w-8 h-8 rounded-lg font-bold text-xs transition-all flex items-center justify-center cursor-pointer ${
                                currentEstadoId === justEstado?.id
                                  ? 'bg-sky-600 text-white shadow-xs scale-105'
                                  : 'bg-white text-sky-700 border border-sky-200 hover:bg-sky-50'
                              }`}
                              title="Justificada"
                            >
                              J
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-2.5">
                          <input
                            type="text"
                            placeholder="Observación o motivo..."
                            value={observacion}
                            onChange={(e) => handleSetObservacionAsistencia(mat.id, e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          {totalSesionesHist === 0 ? (
                            <span className="text-slate-400 text-[11px]">Sin sesiones</span>
                          ) : isDpi ? (
                            <Badge variant="danger" size="sm" dot>
                              DPI {pctInasist}% ({totalFaltasHist}/{totalSesionesHist})
                            </Badge>
                          ) : isAlerta ? (
                            <Badge variant="warning" size="sm" dot>
                              Alerta {pctInasist}% ({totalFaltasHist}/{totalSesionesHist})
                            </Badge>
                          ) : (
                            <Badge variant="success" size="sm">
                              {100 - pctInasist}% Asist. ({totalFaltasHist} F)
                            </Badge>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Modal: Confirmación de Cierre y Sellado de Acta */}
      {isLockModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-amber-600">
              <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Cerrar y Sellar Acta Oficial
                </h3>
                <p className="text-xs text-slate-500">
                  Bloqueo de seguridad RVM 188-2020-MINEDU
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Al cerrar el acta, las calificaciones de la unidad didáctica quedarán <strong className="text-slate-900">selladas e inmutables</strong>. Se generará un sello de auditoría con la fecha, hora y usuario responsable. Ninguna nota podrá ser editada sin reapertura autorizada.
            </p>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1 font-mono">
              <div><strong>Unidad:</strong> {selectedUnidad?.codigo} - {selectedUnidad?.nombre}</div>
              <div><strong>Estudiantes:</strong> {matriculasDelModulo.length} matriculados</div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsLockModalOpen(false)}
                disabled={isProcessingLock}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleCerrarActaConfirm}
                disabled={isProcessingLock}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Lock className="w-4 h-4" />
                <span>{isProcessingLock ? 'Sellando...' : 'Confirmar y Sellar Acta'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Reapertura de Acta con Motivo Auditado */}
      {isUnlockModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-indigo-600">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                <Unlock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Reapertura de Acta Oficial
                </h3>
                <p className="text-xs text-slate-500">
                  Registro de rectificación auditado
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Para desbloquear la matriz y rectificar notas, ingrese el motivo o documento que sustenta la apertura (ej. Memorándum de Dirección o Solicitud de Rectificación docente):
            </p>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Motivo / Sustento de Reapertura *
              </label>
              <textarea
                value={motivoDesbloqueo}
                onChange={(e) => setMotivoDesbloqueo(e.target.value)}
                placeholder="Ej: Rectificación de nota de recuperación autorizada según Memorándum N° 012-2026..."
                rows={3}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsUnlockModalOpen(false);
                  setMotivoDesbloqueo('');
                }}
                disabled={isProcessingLock}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleReabrirActaConfirm}
                disabled={isProcessingLock || !motivoDesbloqueo.trim()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Unlock className="w-4 h-4" />
                <span>{isProcessingLock ? 'Procesando...' : 'Reabrir Acta'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Editar Datos de Empresa y Práctica EFSRT */}
      {isEFSRTModalOpen && editingEFSRTModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3 text-indigo-600 border-b border-slate-100 pb-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Centro de Prácticas y Empresa (EFSRT)
                </h3>
                <p className="text-xs text-slate-500">
                  {(() => {
                    const est = estudiantes.find(e => e.id === editingEFSRTModalData.estudianteId);
                    const per = est ? personas.find(p => p.id === est.personaId) : undefined;
                    return per ? `${per.apellidoPaterno} ${per.apellidoMaterno}, ${per.nombres}` : 'Estudiante';
                  })()}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Modalidad de EFSRT *
                </label>
                <select
                  value={editingEFSRTModalData.modalidad || 'EMPRESA'}
                  disabled={isEFSRTBloqueada}
                  onChange={(e) => setEditingEFSRTModalData({
                    ...editingEFSRTModalData,
                    modalidad: e.target.value as ModalidadEFSRT
                  })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:bg-white focus:outline-none"
                >
                  <option value="EMPRESA">En Empresa / Centro Laboral (Convenio)</option>
                  <option value="PROYECTO_CETPRO">Proyecto Productivo en el CETPRO</option>
                  <option value="COMUNIDAD">Servicio a la Comunidad / Proyecto Social</option>
                  <option value="CONVALIDACION">Convalidación por Experiencia Laboral</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Razón Social / Nombre de la Empresa o Proyecto *
                </label>
                <input
                  type="text"
                  disabled={isEFSRTBloqueada}
                  value={editingEFSRTModalData.empresaNombre || ''}
                  onChange={(e) => setEditingEFSRTModalData({
                    ...editingEFSRTModalData,
                    empresaNombre: e.target.value
                  })}
                  placeholder="Ej: Inversiones El Sol S.A.C. / Taller Automotriz Central"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  RUC de la Empresa
                </label>
                <input
                  type="text"
                  maxLength={11}
                  disabled={isEFSRTBloqueada}
                  value={editingEFSRTModalData.empresaRuc || ''}
                  onChange={(e) => setEditingEFSRTModalData({
                    ...editingEFSRTModalData,
                    empresaRuc: e.target.value.replace(/\D/g, '')
                  })}
                  placeholder="Ej: 20493829101"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Horas Completadas *
                </label>
                <input
                  type="number"
                  min={0}
                  max={500}
                  disabled={isEFSRTBloqueada}
                  value={editingEFSRTModalData.horasCompletadas || 120}
                  onChange={(e) => setEditingEFSRTModalData({
                    ...editingEFSRTModalData,
                    horasCompletadas: parseInt(e.target.value, 10) || 0
                  })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:bg-white focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Dirección de la Empresa / Lugar de Práctica
                </label>
                <input
                  type="text"
                  disabled={isEFSRTBloqueada}
                  value={editingEFSRTModalData.empresaDireccion || ''}
                  onChange={(e) => setEditingEFSRTModalData({
                    ...editingEFSRTModalData,
                    empresaDireccion: e.target.value
                  })}
                  placeholder="Ej: Jr. Miguel Grau N° 450, Juanjuí"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Supervisor de la Empresa
                </label>
                <input
                  type="text"
                  disabled={isEFSRTBloqueada}
                  value={editingEFSRTModalData.supervisorEmpresa || ''}
                  onChange={(e) => setEditingEFSRTModalData({
                    ...editingEFSRTModalData,
                    supervisorEmpresa: e.target.value
                  })}
                  placeholder="Ej: Ing. Carlos Pérez Ramos"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Cargo del Supervisor
                </label>
                <input
                  type="text"
                  disabled={isEFSRTBloqueada}
                  value={editingEFSRTModalData.supervisorEmpresaCargo || ''}
                  onChange={(e) => setEditingEFSRTModalData({
                    ...editingEFSRTModalData,
                    supervisorEmpresaCargo: e.target.value
                  })}
                  placeholder="Ej: Jefe de Producción / Gerente"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Fecha de Inicio
                </label>
                <input
                  type="date"
                  disabled={isEFSRTBloqueada}
                  value={editingEFSRTModalData.fechaInicio || ''}
                  onChange={(e) => setEditingEFSRTModalData({
                    ...editingEFSRTModalData,
                    fechaInicio: e.target.value
                  })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Fecha de Término
                </label>
                <input
                  type="date"
                  disabled={isEFSRTBloqueada}
                  value={editingEFSRTModalData.fechaTermino || ''}
                  onChange={(e) => setEditingEFSRTModalData({
                    ...editingEFSRTModalData,
                    fechaTermino: e.target.value
                  })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  N° de Constancia de Prácticas
                </label>
                <input
                  type="text"
                  disabled={isEFSRTBloqueada}
                  value={editingEFSRTModalData.numeroConstancia || ''}
                  onChange={(e) => setEditingEFSRTModalData({
                    ...editingEFSRTModalData,
                    numeroConstancia: e.target.value
                  })}
                  placeholder="Ej: CONST-EFSRT-2026-0045"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setIsEFSRTModalOpen(false);
                  setEditingEFSRTModalData(null);
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleSaveEFSRTModalDetails(editingEFSRTModalData)}
                disabled={isEFSRTBloqueada}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>Guardar Datos de Práctica</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Confirmación de Cierre y Sellado de EFSRT */}
      {isLockEFSRTModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-purple-600">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Cerrar y Sellar EFSRT Oficial
                </h3>
                <p className="text-xs text-slate-500">
                  Acreditación de Prácticas RVM 188-2020-MINEDU
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Al cerrar y sellar el padrón de EFSRT, las calificaciones de prácticas y datos empresariales de este módulo quedarán <strong className="text-slate-900">sellados e inmutables</strong> para su inclusión en la certificación modular oficial.
            </p>

            <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-200 text-xs text-purple-900 space-y-1">
              <div><strong>Módulo:</strong> {selectedModulo?.codigo} - {selectedModulo?.nombre}</div>
              <div><strong>Estudiantes Evaluados:</strong> {matriculasDelModulo.length} matriculados</div>
              <div className="text-[11px] text-purple-700 pt-1">
                Nota: La normativa MINEDU establece que las prácticas EFSRT requieren nota mínima de 13 y no cuentan con examen de recuperación.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsLockEFSRTModalOpen(false)}
                disabled={isProcessingEFSRTLock}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleCerrarEFSRTConfirm}
                disabled={isProcessingEFSRTLock}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Lock className="w-4 h-4" />
                <span>{isProcessingEFSRTLock ? 'Sellando...' : 'Confirmar y Sellar EFSRT'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Reapertura de EFSRT con Motivo Auditado */}
      {isUnlockEFSRTModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-purple-600">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center shrink-0">
                <Unlock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Reapertura de EFSRT Oficial
                </h3>
                <p className="text-xs text-slate-500">
                  Registro de rectificación auditado
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Para desbloquear el registro de EFSRT y rectificar calificaciones o datos de empresa, ingrese el motivo o documento que sustenta la apertura:
            </p>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                Motivo / Sustento de Reapertura *
              </label>
              <textarea
                value={motivoDesbloqueoEFSRT}
                onChange={(e) => setMotivoDesbloqueoEFSRT(e.target.value)}
                placeholder="Ej: Rectificación de horas o calificación de empresa según informe N° 004-2026 de supervisión..."
                rows={3}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsUnlockEFSRTModalOpen(false);
                  setMotivoDesbloqueoEFSRT('');
                }}
                disabled={isProcessingEFSRTLock}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleReabrirEFSRTConfirm}
                disabled={isProcessingEFSRTLock || !motivoDesbloqueoEFSRT.trim()}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Unlock className="w-4 h-4" />
                <span>{isProcessingEFSRTLock ? 'Procesando...' : 'Reabrir EFSRT'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden print component */}
      <div className="hidden">
        {selectedPrograma && selectedModulo && (
          <ActaEvaluacionPrint
            ref={printRef}
            institucion={institucion}
            programa={selectedPrograma}
            modulo={selectedModulo}
            seccion={secciones.find(s => s.id === selectedSeccionId)}
            periodo={periodoActivo}
            matriculas={matriculasDelModulo}
            estudiantes={estudiantes}
            personas={personas}
            notasUnidades={notasUnidades}
            notasEFSRT={notasEFSRT}
            unidades={unidadesDisponibles}
          />
        )}
        {studentToPrintEFSRT && selectedModulo && selectedPrograma && (
          <FichaEFSRTPrint
            ref={printEFSRTRef}
            institucion={institucion}
            programa={selectedPrograma}
            modulo={selectedModulo}
            periodo={periodoActivo}
            estudiante={studentToPrintEFSRT.est}
            persona={studentToPrintEFSRT.per}
            notaEFSRT={studentToPrintEFSRT.nota}
          />
        )}
      </div>

      {/* Modal Habilitar / Programar Fechas de la Unidad Didáctica */}
      {isHabilitarModalOpen && selectedSeccion && selectedUnidad && (
        <HabilitarUnidadModal
          isOpen={isHabilitarModalOpen}
          onClose={() => setIsHabilitarModalOpen(false)}
          seccion={selectedSeccion}
          unidad={selectedUnidad}
          initialData={{
            fechaInicio: seccionUnidadData?.fecha_inicio?.substring(0, 10),
            fechaFin: seccionUnidadData?.fecha_fin?.substring(0, 10),
            estado: seccionUnidadData?.estado || 'EN_CURSO',
            docenteId: seccionUnidadData?.docente_id || selectedSeccion.trabajadorId,
            horas: seccionUnidadData?.horas || selectedUnidad.horas,
            creditos: seccionUnidadData?.creditos || selectedUnidad.creditos,
            observaciones: seccionUnidadData?.observaciones || '',
          }}
          onSuccess={fetchSeccionUnidadData}
        />
      )}

      {/* Modal Asignar Horario a la Unidad Didáctica */}
      {isHorarioModalOpen && selectedSeccion && selectedUnidad && (
        <AsignarHorarioUnidadModal
          isOpen={isHorarioModalOpen}
          onClose={() => setIsHorarioModalOpen(false)}
          seccion={selectedSeccion}
          unidad={selectedUnidad}
          onSuccess={fetchSeccionUnidadData}
        />
      )}
    </div>
  );
};
