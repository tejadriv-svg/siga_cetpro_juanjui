import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { TipoMatricula, MetodoPago, TipoBeneficioArancelario } from '../../types';
import { Modal } from '../common/Modal';
import { GraduationCap, Wallet, UserCheck, Search, AlertCircle, Users, HeartHandshake, CheckCircle2, RotateCcw } from 'lucide-react';

interface NuevaMatriculaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (matriculaId: string) => void;
  initialPersonaId?: string;
}

export const NuevaMatriculaModal: React.FC<NuevaMatriculaModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialPersonaId,
}) => {
  const {
    estudiantes,
    personas,
    matriculas,
    programas,
    modulos,
    secciones,
    sedes,
    periodosAcademicos,
    periodoActivo,
    addMatricula,
    addEstudiante,
    vincularApoderado,
    registrarReingreso,
  } = useApp();

  const [personaId, setPersonaId] = useState(initialPersonaId || '');
  const [programaId, setProgramaId] = useState(programas[0]?.id || '');
  const [moduloId, setModuloId] = useState('');
  const [seccionId, setSeccionId] = useState('');
  const [sedeId, setSedeId] = useState(sedes[0]?.id || '');
  const [periodoAcademicoId, setPeriodoAcademicoId] = useState('');
  const [condicion, setCondicion] = useState('Ingresante');
  const [formacion, setFormacion] = useState('Técnica');
  const [oportunidadTecnica, setOportunidadTecnica] = useState('');
  const [estadoMatricula, setEstadoMatricula] = useState('ACTIVO');
  const [condicionArancelaria, setCondicionArancelaria] = useState<TipoBeneficioArancelario>('REGULAR');
  const [convenioNombre, setConvenioNombre] = useState('');
  const [resolucionSustento, setResolucionSustento] = useState('');
  const [montoPactado, setMontoPactado] = useState('');

  // Apoderado form state
  const [apoderadoDni, setApoderadoDni] = useState('');
  const [apoderadoNombres, setApoderadoNombres] = useState('');
  const [apoderadoTelefono, setApoderadoTelefono] = useState('');
  const [apoderadoParentesco, setApoderadoParentesco] = useState('Madre');
  const [esApoderadoPrincipal, setEsApoderadoPrincipal] = useState(true);
  const [viveConEstudiante, setViveConEstudiante] = useState(true);
  const [apoderadoEstado, setApoderadoEstado] = useState('ACTIVO');
  const [forzarMostrarApoderado, setForzarMostrarApoderado] = useState(false);

  const [esMenorEdad, setEsMenorEdad] = useState(false);
  const [tieneNNEE, setTieneNNEE] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Reingreso states
  const [matriculaAnteriorId, setMatriculaAnteriorId] = useState('');
  const [motivoReingreso, setMotivoReingreso] = useState('');
  const [resolucionReingreso, setResolucionReingreso] = useState('');

  // Sincronización automática de programaId, sedeId y periodoAcademicoId cuando cargan
  useEffect(() => {
    if (programas.length > 0 && (!programaId || !programas.some((p) => p.id === programaId))) {
      setProgramaId(programas[0].id);
    }
  }, [programas, programaId]);

  useEffect(() => {
    if (sedes.length > 0 && (!sedeId || !sedes.some((s) => s.id === sedeId))) {
      setSedeId(sedes[0].id);
    }
  }, [sedes, sedeId]);

  useEffect(() => {
    if (periodosAcademicos.length > 0 && (!periodoAcademicoId || !periodosAcademicos.some((pa) => pa.id === periodoAcademicoId))) {
      const activePa = periodosAcademicos.find(
        (pa) => pa.estado?.toUpperCase() === 'ACTIVO' || pa.codigo === periodoActivo || pa.nombre?.includes(periodoActivo)
      ) || periodosAcademicos[0];
      if (activePa) setPeriodoAcademicoId(activePa.id);
    }
  }, [periodosAcademicos, periodoAcademicoId, periodoActivo]);

  // 1. Filtrado de persona
  useEffect(() => {
    if (isOpen) {
      if (initialPersonaId) {
        setPersonaId(initialPersonaId);
      } else if (!personaId && personas.length > 0) {
        setPersonaId(personas[0].id);
      }
    }
  }, [isOpen, personas, personaId, initialPersonaId]);

  const selectedPersona = personas.find((p) => p.id === personaId);

  // Determinar si necesita apoderado (Menor de 18 años o NNEE / Discapacidad)
  useEffect(() => {
    if (selectedPersona?.fechaNacimiento) {
      const birthDate = new Date(selectedPersona.fechaNacimiento);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      setEsMenorEdad(age < 18);
    } else {
      setEsMenorEdad(false);
    }

    const nnee = Boolean(selectedPersona?.discapacidad || selectedPersona?.tipoDiscapacidad);
    setTieneNNEE(nnee);

    // Pre-fill existing apoderado if student already has one linked
    const student = estudiantes.find((e) => e.personaId === selectedPersona?.id);
    if (student) {
      const existingApod = personas.find(
        (p) => p.estudianteAsociadoId === student.id || (p.apoderadoId && (p as any).estudianteId === student.id)
      );
      if (existingApod) {
        setApoderadoDni(existingApod.numeroDocumento || '');
        setApoderadoNombres(`${existingApod.apellidoPaterno || ''} ${existingApod.apellidoMaterno || ''} ${existingApod.nombres || ''}`.trim());
        setApoderadoTelefono(existingApod.telefono || '');
        if (existingApod.parentesco) setApoderadoParentesco(existingApod.parentesco);
        if (existingApod.esApoderadoPrincipal !== undefined) setEsApoderadoPrincipal(existingApod.esApoderadoPrincipal);
        if (existingApod.viveConEstudiante !== undefined) setViveConEstudiante(existingApod.viveConEstudiante);
      }
    }
  }, [selectedPersona, estudiantes, personas]);

  const targetStudent = useMemo(() => {
    return estudiantes.find((e) => e.personaId === personaId);
  }, [estudiantes, personaId]);

  const studentMatriculas = useMemo(() => {
    if (!targetStudent) return [];
    return matriculas.filter((m) => m.estudianteId === targetStudent.id);
  }, [matriculas, targetStudent]);

  const prevRetiradaOInactiva = useMemo(() => {
    return studentMatriculas.find(
      (m) => m.estadoMatricula === 'RETIRADO' || m.estadoMatricula === 'RESERVA' || m.estadoMatricula === 'INACTIVA'
    );
  }, [studentMatriculas]);

  // Si el estudiante tiene retiro previo o condición de retiro, auto-sugerir Reingresante
  useEffect(() => {
    if (prevRetiradaOInactiva || targetStudent?.estado === 'Retirado' || targetStudent?.estado === 'Reserva') {
      setCondicion('Reingresante');
      if (prevRetiradaOInactiva) {
        setMatriculaAnteriorId(prevRetiradaOInactiva.id);
      } else if (studentMatriculas.length > 0) {
        setMatriculaAnteriorId(studentMatriculas[0].id);
      }
    }
  }, [prevRetiradaOInactiva, targetStudent, studentMatriculas]);

  // Auto-detectar programa de estudios al seleccionar un estudiante
  useEffect(() => {
    if (!personaId) return;
    let detectedProgId = targetStudent?.programaId;
    if (!detectedProgId && studentMatriculas.length > 0) {
      const sorted = [...studentMatriculas].sort((a, b) => (b.fechaMatricula || '').localeCompare(a.fechaMatricula || ''));
      const lastMod = modulos.find(m => m.id === sorted[0]?.moduloId);
      if (lastMod?.programaId) detectedProgId = lastMod.programaId;
    }
    if (detectedProgId && programas.some(p => p.id === detectedProgId)) {
      setProgramaId(detectedProgId);
    }
  }, [personaId, targetStudent, studentMatriculas, modulos, programas]);

  const necesitaApoderado = esMenorEdad || tieneNNEE || forzarMostrarApoderado;

  // Auto-detect apoderado info when DNI is entered
  const handleApoderadoDniChange = (dniVal: string) => {
    setApoderadoDni(dniVal);
    if (dniVal.length >= 8) {
      const matched = personas.find((p) => p.numeroDocumento === dniVal.trim());
      if (matched) {
        setApoderadoNombres(`${matched.apellidoPaterno || ''} ${matched.apellidoMaterno || ''} ${matched.nombres || ''}`.trim());
        if (matched.telefono) setApoderadoTelefono(matched.telefono);
        if (matched.parentesco) setApoderadoParentesco(matched.parentesco);
      }
    }
  };

  // 2. Selectores académicos - Sin exclusiones artificiales por 'Inactivo'
  const modulosDisponibles = useMemo(() => {
    if (!programaId) return [];
    return modulos
      .filter((m) => m.programaId === programaId)
      .sort((a, b) => (a.orden || 0) - (b.orden || 0));
  }, [modulos, programaId]);

  useEffect(() => {
    if (modulosDisponibles.length > 0 && !modulosDisponibles.some((m) => m.id === moduloId)) {
      setModuloId(modulosDisponibles[0].id);
    } else if (modulosDisponibles.length === 0) {
      setModuloId('');
    }
  }, [modulosDisponibles, moduloId]);

  const seccionesDisponibles = useMemo(() => {
    if (!moduloId) return [];
    let list = secciones.filter((s) => s.moduloId === moduloId);
    if (sedeId) {
      const bySede = list.filter((s) => s.sedeId === sedeId);
      if (bySede.length > 0) list = bySede;
    }
    return list;
  }, [secciones, moduloId, sedeId]);

  useEffect(() => {
    if (seccionesDisponibles.length > 0 && !seccionesDisponibles.some((s) => s.id === seccionId)) {
      setSeccionId(seccionesDisponibles[0].id);
    } else if (seccionesDisponibles.length === 0) {
      setSeccionId('');
    }
  }, [seccionesDisponibles, seccionId]);

  const filteredPersonas = useMemo(() => {
    if (!searchTerm) return personas.slice(0, 50);
    const s = searchTerm.toLowerCase().trim();
    return personas.filter((p) => {
      return (
        (p.numeroDocumento || '').includes(s) ||
        `${p.nombres || ''} ${p.apellidoPaterno || ''} ${p.apellidoMaterno || ''}`.toLowerCase().includes(s)
      );
    }).slice(0, 50);
  }, [personas, searchTerm]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!personaId || !programaId || !moduloId) return;
    
    const selectedEst = estudiantes.find((e) => e.personaId === personaId);
    let targetEstudianteId = selectedEst?.id;

    if (!targetEstudianteId) {
      // Registrar al estudiante si aún no existe
      const nuevoEstudiante = await addEstudiante({
        personaId,
        programaId,
        periodoIngreso: periodoActivo,
        anioIngreso: new Date().getFullYear(),
        estado: 'Regular',
      });
      targetEstudianteId = nuevoEstudiante.id;
    }

    const selectedPa = periodosAcademicos.find((pa) => pa.id === periodoAcademicoId);
    const resolvedPeriodoCode = selectedPa?.codigo?.replace('PER-ACA-', '') || selectedPa?.nombre || periodoActivo;

    let createdMatriculaId = '';
    if (condicion === 'Reingresante' || condicion === 'Reingreso') {
      await registrarReingreso({
        estudianteId: targetEstudianteId,
        matriculaAnteriorId: matriculaAnteriorId || undefined,
        seccionId: seccionId || undefined,
        moduloId,
        sedeId: sedeId || undefined,
        periodoAcademicoId: periodoAcademicoId || undefined,
        motivo: motivoReingreso.trim() || 'Reanudación de estudios',
        resolucionNumero: resolucionReingreso.trim() || undefined,
        observaciones: oportunidadTecnica.trim() || undefined,
      });
    } else {
      const nuevaMatricula = await addMatricula(
        {
          estudianteId: targetEstudianteId,
          programaId,
          moduloId,
          sedeId: sedeId || undefined,
          seccionId: seccionId || undefined,
          periodoAcademico: resolvedPeriodoCode,
          periodoAcademicoId: periodoAcademicoId || undefined,
          tipo: 'Regular',
          condicion: condicion,
          formacion: formacion,
          oportunidadTecnica: oportunidadTecnica,
          condicionArancelaria,
          convenioNombre: condicionArancelaria !== 'REGULAR' && convenioNombre.trim() ? convenioNombre.trim() : undefined,
          resolucionSustento: condicionArancelaria !== 'REGULAR' && resolucionSustento.trim() ? resolucionSustento.trim() : undefined,
          montoPactado: condicionArancelaria !== 'REGULAR' && montoPactado ? Number(montoPactado) : undefined,
          fechaMatricula: new Date().toISOString().split('T')[0],
          estadoMatricula: estadoMatricula,
        }
      );
      if (nuevaMatricula) {
        createdMatriculaId = nuevaMatricula.id;
      }
    }
    
    // Si se especificó apoderado, guardarlo y vincularlo formalmente
    if (targetEstudianteId && apoderadoDni.trim()) {
      await vincularApoderado({
        estudianteId: targetEstudianteId,
        dni: apoderadoDni.trim(),
        nombres: apoderadoNombres.trim() || 'Apoderado / Tutor',
        telefono: apoderadoTelefono.trim(),
        parentesco: apoderadoParentesco,
        esApoderadoPrincipal: esApoderadoPrincipal,
        viveConEstudiante: viveConEstudiante,
        estado: apoderadoEstado,
      });
    }
    
    if (onSuccess && createdMatriculaId) {
      onSuccess(createdMatriculaId);
    }
    
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Nueva Matrícula - Periodo ${periodoActivo}`}
      subtitle="Proceso de matrícula para Programas de Estudios"
      maxWidth="2xl"
      actions={
        <>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="matricula-form"
            className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors"
          >
            Confirmar Matrícula
          </button>
        </>
      }
    >
      <form id="matricula-form" onSubmit={handleSubmit} className="space-y-5 text-xs">
        
        {/* Step 1: Student Selection */}
        <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
          <label className="block font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-sky-600" /> 1. Seleccionar Persona
          </label>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por DNI o nombres..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
          <select
            value={personaId}
            onChange={(e) => setPersonaId(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-sky-500"
            size={4}
          >
            {filteredPersonas.map((p) => (
              <option key={p.id} value={p.id} className="py-1 border-b border-slate-50">
                {p.numeroDocumento} - {p.apellidoPaterno} {p.apellidoMaterno}, {p.nombres}
              </option>
            ))}
          </select>
          {selectedPersona && (
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <div className="text-[11px] text-slate-600 font-mono flex items-center gap-2">
                <span>Nacimiento: {selectedPersona.fechaNacimiento || 'No registrado'}</span>
                {esMenorEdad && (
                  <span className="text-amber-700 font-bold bg-amber-100 border border-amber-200 px-1.5 py-0.5 rounded text-[10px]">
                    (Menor de 18 años)
                  </span>
                )}
                {tieneNNEE && (
                  <span className="text-purple-700 font-bold bg-purple-100 border border-purple-200 px-1.5 py-0.5 rounded text-[10px] flex items-center gap-1">
                    <HeartHandshake className="w-3 h-3" /> NNEE: {selectedPersona.tipoDiscapacidad || 'Discapacidad registrada'}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setForzarMostrarApoderado(!forzarMostrarApoderado)}
                className="text-[11px] text-sky-700 font-semibold hover:underline"
              >
                {necesitaApoderado ? 'Ocultar datos de apoderado' : '+ Agregar apoderado / tutor'}
              </button>
            </div>
          )}
        </div>

        {/* Step 2: Selección Académica */}
        <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200">
          <label className="block font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-indigo-600" /> 2. Asignación Académica Oficial
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-500 font-semibold mb-1">Período Académico *</label>
              <select
                value={periodoAcademicoId}
                onChange={(e) => setPeriodoAcademicoId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none font-semibold text-slate-800"
              >
                {periodosAcademicos.map((pa) => (
                  <option key={pa.id} value={pa.id}>
                    {pa.codigo} - {pa.nombre} {pa.estado === 'ACTIVO' ? ' (ACTIVO)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-500 font-semibold mb-1">Sede Institucional *</label>
              <select
                value={sedeId}
                onChange={(e) => setSedeId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
              >
                {sedes.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nombre} ({s.distrito || s.codigo})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-500 font-semibold mb-1">Programa de Estudios *</label>
              <select
                value={programaId}
                onChange={(e) => setProgramaId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none font-medium"
              >
                {programas.map((p) => (
                  <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-500 font-semibold mb-1">Módulo Formativo *</label>
              <select
                value={moduloId}
                onChange={(e) => setModuloId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none font-medium text-slate-900"
                disabled={modulosDisponibles.length === 0}
              >
                {modulosDisponibles.length === 0 && <option value="">Sin módulos en este programa</option>}
                {modulosDisponibles.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.codigo} - {m.nombre} ({m.horas || 0} hrs / {m.creditos || 0} créditos)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-500 font-semibold mb-1">Sección (Turno)</label>
              <select
                value={seccionId}
                onChange={(e) => setSeccionId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
              >
                <option value="">-- Sin asignar / General --</option>
                {seccionesDisponibles.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.codigo || s.nombre} ({s.turno})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-500 font-semibold mb-1">Condición</label>
              <select
                value={condicion}
                onChange={(e) => setCondicion(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
              >
                <option value="Ingresante">Ingresante</option>
                <option value="Reingresante">Reingresante</option>
                <option value="Regular">Regular</option>
                <option value="Traslado">Traslado Interno</option>
                <option value="Gratuito">Gratuito</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-500 font-semibold mb-1">Formación</label>
              <select
                value={formacion}
                onChange={(e) => setFormacion(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
              >
                <option value="Básica">Básica</option>
                <option value="Técnica">Técnica</option>
                <option value="Profesional">Profesional</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-500 font-semibold mb-1">Estado de Matrícula</label>
              <select
                value={estadoMatricula}
                onChange={(e) => setEstadoMatricula(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none font-bold text-slate-800"
              >
                <option value="ACTIVO">Activo (En curso)</option>
                <option value="PROCESO">Proceso (Pre-matrícula)</option>
                <option value="RESERVA">Reserva de Matrícula</option>
                <option value="RETIRADO">Retirado / Baja</option>
                <option value="CERTIFICADO">Certificado / Culminado</option>
              </select>
            </div>

            <div className="sm:col-span-2 md:col-span-3">
              <label className="block text-slate-500 font-semibold mb-1">Oportunidad Técnica / Observaciones</label>
              <input
                type="text"
                placeholder="Detalles u observaciones de la matrícula..."
                value={oportunidadTecnica}
                onChange={(e) => setOportunidadTecnica(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
              />
            </div>

            {/* Beneficio Arancelario / Convenio / Beca */}
            <div className="sm:col-span-2 md:col-span-3 p-3.5 bg-sky-50/70 border border-sky-200 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-xs text-sky-900">
                  <HeartHandshake className="w-4 h-4 text-sky-600" />
                  <span>Condición Arancelaria y Beneficios Institucionales (Opcional)</span>
                </div>
                {condicionArancelaria !== 'REGULAR' && (
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-sky-200 text-sky-800 rounded-md uppercase">
                    Beneficio Activo
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Condición Arancelaria:
                  </label>
                  <select
                    value={condicionArancelaria}
                    onChange={(e) => setCondicionArancelaria(e.target.value as TipoBeneficioArancelario)}
                    className="w-full px-2.5 py-1.5 bg-white border border-sky-200 rounded-lg text-xs font-semibold focus:outline-none"
                  >
                    <option value="REGULAR">Regular (Tarifa Ordinaria TUPA 100%)</option>
                    <option value="CONVENIO">Convenio Institucional</option>
                    <option value="BECA_COMPLETA">Beca Completa (100% Gratuidad)</option>
                    <option value="SEMIBECA">Semibeca (50% Descuento)</option>
                    <option value="EXONERADO">Exoneración Total (CONADIS / Ley)</option>
                    <option value="CASO_SOCIAL">Caso Social Acreditado</option>
                  </select>
                </div>

                {condicionArancelaria !== 'REGULAR' && (
                  <>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Convenio / Entidad Aliada:
                      </label>
                      <input
                        type="text"
                        placeholder="Ej. Convenio CRFA Huallabamba, Municipalidad..."
                        value={convenioNombre}
                        onChange={(e) => setConvenioNombre(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-sky-200 rounded-lg text-xs focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        R.D. o Documento de Sustento:
                      </label>
                      <input
                        type="text"
                        placeholder="Ej. R.D. N° 045-2026-CETPRO-J"
                        value={resolucionSustento}
                        onChange={(e) => setResolucionSustento(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-sky-200 rounded-lg text-xs focus:outline-none"
                      />
                    </div>

                    {condicionArancelaria === 'CONVENIO' && (
                      <div className="sm:col-span-2 md:col-span-3">
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Tarifa Pactada en S/ para este Módulo (Opcional):
                        </label>
                        <input
                          type="number"
                          step="0.50"
                          placeholder="Ej. 20.00 (dejar vacío si se define en caja al momento de cobrar)"
                          value={montoPactado}
                          onChange={(e) => setMontoPactado(e.target.value)}
                          className="w-full max-w-xs px-2.5 py-1.5 bg-white border border-sky-200 rounded-lg text-xs focus:outline-none"
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Panel de Reingreso Formal */}
            {(condicion === 'Reingresante' || condicion === 'Reingreso' || prevRetiradaOInactiva) && (
              <div className="sm:col-span-2 md:col-span-3 p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl space-y-2.5 text-amber-950">
                <div className="flex items-center gap-2 font-bold text-xs text-amber-900">
                  <RotateCcw className="w-4 h-4 text-amber-600" />
                  <span>Trámite de Reingreso Académico Formal (MINEDU)</span>
                </div>
                <p className="text-[11px] text-amber-800">
                  El sistema detectó antecedentes para este estudiante. Al matricularlo como Reingresante se registrará formalmente en la tabla de reingresos vinculando su historial con esta nueva matrícula.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-amber-800 mb-1">
                      Matrícula Anterior a Vincular
                    </label>
                    <select
                      value={matriculaAnteriorId}
                      onChange={(e) => setMatriculaAnteriorId(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-semibold focus:outline-none"
                    >
                      <option value="">-- Sin vincular específica --</option>
                      {studentMatriculas.map((sm) => (
                        <option key={sm.id} value={sm.id}>
                          {sm.codigoMatricula} ({sm.periodoAcademico}) - {sm.estadoMatricula || 'ACTIVA'}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-amber-800 mb-1">
                      Resolución / FUT de Reingreso
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. FUT N° 102-2026, RD-050"
                      value={resolucionReingreso}
                      onChange={(e) => setResolucionReingreso(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-amber-300 rounded-lg text-xs focus:outline-none"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] uppercase font-bold text-amber-800 mb-1">
                      Motivo de Reanudación de Estudios
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Reanudación tras reserva de matrícula por viaje temporal..."
                      value={motivoReingreso}
                      onChange={(e) => setMotivoReingreso(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-amber-300 rounded-lg text-xs focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Step 3: Subformulario de Apoderado / Tutor Legal */}
        {necesitaApoderado && (
          <div className="space-y-4 bg-purple-50/70 p-4 rounded-xl border border-purple-200">
            <div className="flex items-center justify-between border-b border-purple-200 pb-2">
              <label className="block font-bold text-purple-950 uppercase tracking-wider text-[11px] flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-700" />
                3. Subformulario de Apoderado / Tutor Legal
              </label>
              <span className="text-[10px] text-purple-700 bg-purple-100 font-medium px-2 py-0.5 rounded-full">
                {esMenorEdad ? 'Requerido para Menor de Edad' : tieneNNEE ? 'Requerido por NNEE / Discapacidad' : 'Registro de Tutor'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-purple-900 font-semibold mb-1">DNI / Documento Apoderado *</label>
                <input
                  type="text"
                  placeholder="8 dígitos de DNI"
                  value={apoderadoDni}
                  onChange={(e) => handleApoderadoDniChange(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-purple-200 rounded-xl font-mono text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-purple-900 font-semibold mb-1">Nombres y Apellidos Completos *</label>
                <input
                  type="text"
                  placeholder="Apellidos y nombres del apoderado"
                  value={apoderadoNombres}
                  onChange={(e) => setApoderadoNombres(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-purple-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-purple-900 font-semibold mb-1">Teléfono / Celular</label>
                <input
                  type="text"
                  placeholder="Ej. 987654321"
                  value={apoderadoTelefono}
                  onChange={(e) => setApoderadoTelefono(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-purple-200 rounded-xl font-mono text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-purple-900 font-semibold mb-1">Parentesco *</label>
                <select
                  value={apoderadoParentesco}
                  onChange={(e) => setApoderadoParentesco(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-purple-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="Madre">Madre</option>
                  <option value="Padre">Padre</option>
                  <option value="Tutor(a) Legal">Tutor(a) Legal</option>
                  <option value="Abuelo(a)">Abuelo(a)</option>
                  <option value="Hermano(a)">Hermano(a)</option>
                  <option value="Tío(a)">Tío(a)</option>
                  <option value="Apoderado(a)">Apoderado(a)</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
              <div>
                <label className="block text-purple-900 font-semibold mb-1">Estado del Apoderado</label>
                <select
                  value={apoderadoEstado}
                  onChange={(e) => setApoderadoEstado(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-purple-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="ACTIVO">ACTIVO</option>
                  <option value="INACTIVO">INACTIVO</option>
                </select>
              </div>
            </div>

            {/* Checkboxes: es_apoderado_principal y vive_con_estudiante */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <label className="flex items-center gap-2.5 p-2 bg-white/80 border border-purple-200/80 rounded-xl cursor-pointer hover:bg-white transition-colors">
                <input
                  type="checkbox"
                  checked={esApoderadoPrincipal}
                  onChange={(e) => setEsApoderadoPrincipal(e.target.checked)}
                  className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                />
                <div>
                  <span className="font-bold text-purple-950 block text-[11px]">Es Apoderado Principal</span>
                  <span className="text-[10px] text-purple-700/80 block">Contacto directo y responsable legal prioritario</span>
                </div>
              </label>

              <label className="flex items-center gap-2.5 p-2 bg-white/80 border border-purple-200/80 rounded-xl cursor-pointer hover:bg-white transition-colors">
                <input
                  type="checkbox"
                  checked={viveConEstudiante}
                  onChange={(e) => setViveConEstudiante(e.target.checked)}
                  className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                />
                <div>
                  <span className="font-bold text-purple-950 block text-[11px]">Vive con el Estudiante</span>
                  <span className="text-[10px] text-purple-700/80 block">Comparte el mismo domicilio de residencia</span>
                </div>
              </label>
            </div>
          </div>
        )}

      </form>
    </Modal>
  );
};
