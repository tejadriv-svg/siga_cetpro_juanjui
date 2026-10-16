import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { MetodoPago, ReciboPago, TipoBeneficioArancelario } from '../../types';
import { Modal } from '../common/Modal';
import { AmortizarCuotaModal } from './AmortizarCuotaModal';
import { Search, Wallet, UserCheck, DollarSign, Printer, Check, X, FileText, HeartHandshake, Tag, ShieldCheck, RotateCcw, Calendar, BookOpen, Clock, AlertCircle, Sparkles, CreditCard } from 'lucide-react';

interface NuevoCobroModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPersonaId?: string;
  initialSearchTerm?: string;
  onReciboCreated?: (recibo: ReciboPago, shouldPrint?: boolean) => void;
}

export const NuevoCobroModal: React.FC<NuevoCobroModalProps> = ({
  isOpen,
  onClose,
  initialPersonaId,
  initialSearchTerm,
  onReciboCreated
}) => {
  const {
    personas,
    conceptosPago,
    recibos,
    addRecibo,
    periodoActivo,
    matriculas,
    estudiantes,
    programas,
    modulos,
    secciones,
    turnos,
    periodosAcademicos
  } = useApp();

  const [personaId, setPersonaId] = useState(initialPersonaId || personas[0]?.id || '');
  const [matriculaId, setMatriculaId] = useState<string>('');
  const [pagoPadreId, setPagoPadreId] = useState<string | null>(null);
  const [reciboPadreAmortizando, setReciboPadreAmortizando] = useState<ReciboPago | null>(null);
  const [reciboParaAmortizar, setReciboParaAmortizar] = useState<ReciboPago | null>(null);
  const [glosaDetalle, setGlosaDetalle] = useState<string>('');
  const [fechaPago, setFechaPago] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [conceptoId, setConceptoId] = useState(conceptosPago[0]?.id || '');
  const [numeroRecibo, setNumeroRecibo] = useState('');
  const [montoTotal, setMontoTotal] = useState(conceptosPago[0]?.montoFijo || 50);
  const [monto, setMonto] = useState(conceptosPago[0]?.montoFijo || 50);
  const [esFraccionado, setEsFraccionado] = useState(false);
  const [totalCuotas, setTotalCuotas] = useState(2);
  const [numeroCuota, setNumeroCuota] = useState(1);
  const [fechaVencimiento, setFechaVencimiento] = useState('');
  const [metodoPago, setMetodoPago] = useState<MetodoPago>('Efectivo');
  const [numeroOperacion, setNumeroOperacion] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isManualMonto, setIsManualMonto] = useState(false);

  // Referencias para evitar re-inicializaciones por sincronización en segundo plano
  const prevIsOpenRef = useRef(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const loadedConditionPersonaIdRef = useRef<string | null>(null);

  // Estados para Condición Arancelaria y Beneficios
  const [beneficioTipo, setBeneficioTipo] = useState<TipoBeneficioArancelario>('REGULAR');
  const [beneficioNombre, setBeneficioNombre] = useState('');
  const [documentoSustento, setDocumentoSustento] = useState('');
  const [tipoCalculoConvenio, setTipoCalculoConvenio] = useState<'MONTO' | 'PORCENTAJE'>('MONTO');
  const [montoPactadoConvenio, setMontoPactadoConvenio] = useState<number>(20);
  const [porcentajeDescuentoConvenio, setPorcentajeDescuentoConvenio] = useState<number>(50);

  // Tarifa referencial base del concepto TUPA seleccionado
  const baseConceptoTarifa = useMemo(() => {
    const found = conceptosPago.find((c) => c.id === conceptoId);
    return found?.montoSugerido ?? (found as any)?.montoFijo ?? 50;
  }, [conceptoId, conceptosPago]);

  // Cálculo transparente del beneficio y monto final a cobrar
  const calculoBeneficio = useMemo(() => {
    const base = baseConceptoTarifa;
    let desc = 0;
    let porc = 0;
    let final = base;

    if (beneficioTipo === 'EXONERADO' || beneficioTipo === 'BECA_COMPLETA') {
      desc = base;
      porc = 100;
      final = 0;
    } else if (beneficioTipo === 'SEMIBECA') {
      desc = Math.round((base * 0.5) * 100) / 100;
      porc = 50;
      final = Math.max(0, base - desc);
    } else if (beneficioTipo === 'CONVENIO' || beneficioTipo === 'CASO_SOCIAL') {
      if (tipoCalculoConvenio === 'MONTO') {
        const pactado = Math.min(base, Math.max(0, montoPactadoConvenio));
        final = pactado;
        desc = Math.max(0, base - pactado);
        porc = base > 0 ? Math.round((desc / base) * 100) : 0;
      } else {
        const p = Math.min(100, Math.max(0, porcentajeDescuentoConvenio));
        desc = Math.round((base * (p / 100)) * 100) / 100;
        porc = p;
        final = Math.max(0, base - desc);
      }
    }

    return {
      montoOriginal: base,
      montoDescuento: desc,
      porcentajeDescuento: porc,
      montoFinal: final
    };
  }, [baseConceptoTarifa, beneficioTipo, tipoCalculoConvenio, montoPactadoConvenio, porcentajeDescuentoConvenio]);

  // Cerrar sugerencias al hacer clic fuera del buscador
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    if (isSearchOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSearchOpen]);

  // Estudiante y Matrículas vinculadas
  const activeEstudiante = useMemo(() => {
    return estudiantes.find((e) => e.personaId === personaId);
  }, [estudiantes, personaId]);

  const matriculasDisponibles = useMemo(() => {
    if (!activeEstudiante) return [];
    return matriculas
      .filter((m) => m.estudianteId === activeEstudiante.id)
      .map((m) => {
        const sec = secciones.find((s) => s.id === m.seccionId);
        const mod = modulos.find((mo) => mo.id === m.moduloId);
        const prog = programas.find((p) => p.id === mod?.programaId);
        const tur = turnos.find((t) => t.id === sec?.turnoId);
        const pa = periodosAcademicos.find((p) => p.id === m.periodoAcademicoId);
        const turnoText = (tur?.nombre || '').toLowerCase();
        const secText = (sec?.nombre || '').toLowerCase();
        const esFinDeSemana = turnoText.includes('sáb') || turnoText.includes('sab') ||
                              turnoText.includes('dom') || secText.includes('sáb') ||
                              secText.includes('sab') || secText.includes('dom') ||
                              secText.includes('fin de semana');
        return {
          matricula: m,
          seccion: sec,
          modulo: mod,
          programa: prog,
          turno: tur,
          periodo: pa,
          esFinDeSemana
        };
      });
  }, [activeEstudiante, matriculas, secciones, modulos, programas, turnos, periodosAcademicos]);

  const selectedMatriculaInfo = useMemo(() => {
    return matriculasDisponibles.find((md) => md.matricula.id === matriculaId);
  }, [matriculasDisponibles, matriculaId]);

  // Inicialización única al abrir el modal (no se reinicia por polling/sincronización de fondo)
  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      setIsSubmitting(false);
      setIsManualMonto(false);
      setNumeroRecibo('');
      setNumeroOperacion('');
      setObservaciones('');
      setGlosaDetalle('');
      setFechaPago(new Date().toISOString().split('T')[0]);
      setEsFraccionado(false);
      setPagoPadreId(null);
      setReciboPadreAmortizando(null);
      setReciboParaAmortizar(null);

      if (initialSearchTerm) {
        setSearchTerm(initialSearchTerm);
      } else {
        setSearchTerm('');
      }

      const targetPersonaId = initialPersonaId || (personas.length > 0 ? personas[0].id : '');
      setPersonaId(targetPersonaId);
      loadedConditionPersonaIdRef.current = null; // Fuerza carga de beneficio para la persona seleccionada

      if (conceptosPago.length > 0) {
        setConceptoId(conceptosPago[0].id);
      }
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, initialPersonaId, initialSearchTerm]);

  // Detección automática de matrícula y condición arancelaria al cambiar de persona
  useEffect(() => {
    if (!isOpen || !personaId) return;
    if (loadedConditionPersonaIdRef.current === personaId) return;

    loadedConditionPersonaIdRef.current = personaId;
    const est = estudiantes.find((e) => e.personaId === personaId);
    if (!est) {
      setMatriculaId('');
      setBeneficioTipo('REGULAR');
      setBeneficioNombre('');
      setDocumentoSustento('');
      return;
    }

    const mats = matriculas.filter((m) => m.estudianteId === est.id);
    if (mats.length === 0) {
      setMatriculaId('');
      setBeneficioTipo('REGULAR');
      setBeneficioNombre('');
      setDocumentoSustento('');
      return;
    }

    // Tomar la matrícula más reciente
    const activeMat = mats[0];
    setMatriculaId(activeMat.id);

    // Si la sección o turno es de Fin de Semana, sugerir la tasa de mantenimiento fin de semana
    const activeSec = secciones.find((s) => s.id === activeMat.seccionId);
    const activeTur = turnos.find((t) => t.id === activeSec?.turnoId);
    const isWeekend = (activeTur?.nombre || '').toLowerCase().includes('sáb') ||
                      (activeTur?.nombre || '').toLowerCase().includes('sab') ||
                      (activeTur?.nombre || '').toLowerCase().includes('dom') ||
                      (activeSec?.nombre || '').toLowerCase().includes('sáb') ||
                      (activeSec?.nombre || '').toLowerCase().includes('sab') ||
                      (activeSec?.nombre || '').toLowerCase().includes('dom');

    if (isWeekend) {
      const weekendConcept = conceptosPago.find((c) =>
        c.codigo === 'PAGO_MANTO_FIN_SEMANA' ||
        (c.nombre || '').toLowerCase().includes('fin de semana')
      );
      if (weekendConcept) {
        setConceptoId(weekendConcept.id);
      }
    }

    if (activeMat && activeMat.condicionArancelaria && activeMat.condicionArancelaria !== 'REGULAR') {
      setBeneficioTipo(activeMat.condicionArancelaria);
      if (activeMat.convenioNombre) setBeneficioNombre(activeMat.convenioNombre);
      if (activeMat.resolucionSustento) setDocumentoSustento(activeMat.resolucionSustento);
      if (activeMat.montoPactado !== undefined && activeMat.montoPactado >= 0) {
        setTipoCalculoConvenio('MONTO');
        setMontoPactadoConvenio(activeMat.montoPactado);
      }
    } else {
      setBeneficioTipo('REGULAR');
      setBeneficioNombre('');
      setDocumentoSustento('');
    }
  }, [isOpen, personaId, estudiantes, matriculas, secciones, turnos, conceptosPago]);

  // Actualizar monto total y cuotas cuando cambie el cálculo o fraccionamiento,
  // respetando si el usuario ingresó manualmente un monto específico o si está amortizando un compromiso padre
  useEffect(() => {
    if (pagoPadreId) return; // Si estamos amortizando un compromiso existente, preservar sus montos
    const finalAmount = calculoBeneficio.montoFinal;
    if (!isManualMonto) {
      setMontoTotal(finalAmount);
      if (!esFraccionado) {
        setMonto(finalAmount);
      } else {
        setMonto(Math.round((finalAmount / totalCuotas) * 100) / 100);
      }
    }
  }, [calculoBeneficio.montoFinal, esFraccionado, totalCuotas, isManualMonto, pagoPadreId]);

  const filteredPersonas = useMemo(() => {
    if (!searchTerm.trim()) return personas.slice(0, 30);
    const s = searchTerm.toLowerCase().trim();
    return personas.filter((p) => {
      const doc = (p.numeroDocumento || '').toLowerCase();
      const fullName = `${p.nombres || ''} ${p.apellidoPaterno || ''} ${p.apellidoMaterno || ''}`.toLowerCase();
      return doc.includes(s) || fullName.includes(s);
    }).slice(0, 30);
  }, [personas, searchTerm]);

  // Compromisos con saldo pendiente que ya tiene este estudiante (recibos raíces con deuda)
  const compromisosPendientes = useMemo(() => {
    if (!personaId) return [];
    return recibos.filter(
      (r) =>
        r.personaId === personaId &&
        !r.pagoPadreId &&
        Number(r.montoPendiente || 0) > 0 &&
        r.estado !== 'Anulado'
    );
  }, [recibos, personaId]);

  const activarModoAmortizacion = (padre: ReciboPago) => {
    const rootPadre = padre.pagoPadreId ? (recibos.find((r) => r.id === padre.pagoPadreId) || padre) : padre;
    const pagosCadena = recibos.filter(
      (r) => (r.id === rootPadre.id || r.pagoPadreId === rootPadre.id) && r.estado !== 'Anulado'
    );
    const maxCuota = Math.max(...pagosCadena.map((r) => Number(r.numeroCuota || 1)), 1);
    const nextCuota = maxCuota + 1;
    const tc = Math.max(nextCuota, Number(rootPadre.totalCuotas || 2));

    setPagoPadreId(rootPadre.id);
    setReciboPadreAmortizando(rootPadre);
    setConceptoId(rootPadre.conceptoId);
    if (rootPadre.matriculaId) setMatriculaId(rootPadre.matriculaId);
    setEsFraccionado(true);
    const totalComp = Number(rootPadre.montoTotal || (Number(rootPadre.monto) + Number(rootPadre.montoPendiente)));
    setMontoTotal(totalComp);
    const pend = Number(rootPadre.montoPendiente || 0);
    setNumeroCuota(nextCuota);
    setTotalCuotas(tc);
    setMonto(pend);
    setIsManualMonto(true);
    if (rootPadre.glosaDetalle) setGlosaDetalle(rootPadre.glosaDetalle);
    setObservaciones(`Amortización Cuota ${nextCuota} de ${tc} (Compromiso ${rootPadre.numeroRecibo})`);
  };

  const cancelarModoAmortizacion = () => {
    setPagoPadreId(null);
    setReciboPadreAmortizando(null);
    setObservaciones('');
    setIsManualMonto(false);
    setNumeroCuota(1);
    setTotalCuotas(2);
    setMontoTotal(baseConceptoTarifa);
    setMonto(baseConceptoTarifa);
  };

  const selectPersona = (id: string) => {
    setPersonaId(id);
    setIsSearchOpen(false);
    setIsManualMonto(false);
    setPagoPadreId(null);
    setReciboPadreAmortizando(null);
    loadedConditionPersonaIdRef.current = null; // Carga condición del nuevo estudiante
  };

  const selectedPersona = useMemo(() => {
    return personas.find((p) => p.id === personaId);
  }, [personas, personaId]);

  const handleConceptoChange = (id: string) => {
    setConceptoId(id);
    setIsManualMonto(false);
  };

  const handleBeneficioChange = (tipo: TipoBeneficioArancelario) => {
    setBeneficioTipo(tipo);
    setIsManualMonto(false);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      setIsSearchOpen(false);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      if (filteredPersonas.length > 0) {
        selectPersona(filteredPersonas[0].id);
      }
    }
  };

  const handleFraccionadoToggle = (checked: boolean) => {
    setEsFraccionado(checked);
    setIsManualMonto(false);
    if (checked) {
      const cuotaMonto = Math.round((montoTotal / totalCuotas) * 100) / 100;
      setMonto(cuotaMonto);
      const nextMonth = new Date();
      nextMonth.setDate(nextMonth.getDate() + 30);
      setFechaVencimiento(nextMonth.toISOString().split('T')[0]);
    } else {
      setMonto(montoTotal);
      setFechaVencimiento('');
    }
  };

  const saldoBasePendiente = pagoPadreId && reciboPadreAmortizando
    ? Number(reciboPadreAmortizando.montoPendiente || 0)
    : montoTotal;

  const montoPendienteCalculado = esFraccionado
    ? Math.max(0, saldoBasePendiente - monto)
    : 0;

  const handleSave = async (shouldPrint: boolean) => {
    const esExoneradoOBeca = beneficioTipo === 'EXONERADO' || beneficioTipo === 'BECA_COMPLETA' || (monto === 0 && beneficioTipo !== 'REGULAR');
    if (!personaId || !conceptoId || isSubmitting) return;
    if (monto < 0) return;
    if (monto === 0 && !esExoneradoOBeca) {
      alert('Para emitir un comprobante por S/ 0.00 debe seleccionar una Condición de Beneficio (Exoneración o Beca).');
      return;
    }

    const conc = conceptosPago.find((c) => c.id === conceptoId);
    if (!conc) return;

    try {
      setIsSubmitting(true);
      const estadoFinal = esFraccionado && montoPendienteCalculado > 0 ? 'Pendiente' : 'Pagado';

      const nuevoRecibo = await addRecibo({
        personaId,
        matriculaId: matriculaId || undefined,
        conceptoId,
        conceptoNombre: conc.nombre || (conc as any).concepto || conc.codigo,
        pagoPadreId: pagoPadreId || undefined,
        monto,
        montoTotal: esFraccionado ? montoTotal : monto,
        montoPendiente: montoPendienteCalculado,
        numeroCuota: esFraccionado ? numeroCuota : 1,
        totalCuotas: esFraccionado ? totalCuotas : 1,
        fechaVencimiento: esFraccionado && fechaVencimiento ? fechaVencimiento : undefined,
        numeroRecibo: numeroRecibo.trim() || undefined,
        metodoPago,
        estado: estadoFinal,
        numeroOperacion: numeroOperacion ? numeroOperacion : undefined,
        observaciones: observaciones ? observaciones : undefined,
        beneficioTipo: beneficioTipo !== 'REGULAR' ? beneficioTipo : undefined,
        beneficioNombre: beneficioTipo !== 'REGULAR' && beneficioNombre.trim() ? beneficioNombre.trim() : undefined,
        montoOriginal: beneficioTipo !== 'REGULAR' ? calculoBeneficio.montoOriginal : undefined,
        montoDescuento: beneficioTipo !== 'REGULAR' ? calculoBeneficio.montoDescuento : undefined,
        porcentajeDescuento: beneficioTipo !== 'REGULAR' ? calculoBeneficio.porcentajeDescuento : undefined,
        documentoSustento: beneficioTipo !== 'REGULAR' && documentoSustento.trim() ? documentoSustento.trim() : undefined,
        fechaPago: fechaPago || undefined,
        glosaDetalle: glosaDetalle.trim() || undefined,
        programaNombre: selectedMatriculaInfo?.programa?.nombre,
        moduloNombre: selectedMatriculaInfo?.modulo?.nombre,
        periodoCodigo: selectedMatriculaInfo?.periodo?.codigo,
      });

      if (onReciboCreated) {
        onReciboCreated(nuevoRecibo, shouldPrint);
      } else {
        onClose();
      }
    } catch (error) {
      console.error('Error al registrar cobro:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Bloquear el envío automático involuntario con Enter para evitar que la ventana se cierre de golpe
  };

  const handleFormKeyDown = (e: React.KeyboardEvent) => {
    // Permitir atajo intencional con Ctrl+Enter o Cmd+Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSave(true);
    }
  };

  return (
    <>
      <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Nuevo Cobro en Ventanilla (Caja Institucional)"
      subtitle="Registro oficial de ingresos y emisión de comprobantes del CETPRO Juanjuí"
      maxWidth="xl"
      actions={
        <div className="flex items-center justify-between w-full">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
          >
            Cancelar
          </button>

          <div className="flex items-center gap-2">
            {(() => {
              const esExoneradoOBeca = beneficioTipo === 'EXONERADO' || beneficioTipo === 'BECA_COMPLETA' || (monto === 0 && beneficioTipo !== 'REGULAR');
              const isButtonDisabled = isSubmitting || !personaId || monto < 0 || (monto === 0 && !esExoneradoOBeca);

              return (
                <>
                  <button
                    type="button"
                    disabled={isButtonDisabled}
                    onClick={() => handleSave(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    title="Registra el cobro en caja y actualiza la lista sin abrir el comprobante"
                  >
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>{isSubmitting ? 'Guardando...' : 'Guardar Pago'}</span>
                  </button>

                  <button
                    type="button"
                    disabled={isButtonDisabled}
                    onClick={() => handleSave(true)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    title="Registra el cobro en caja y abre inmediatamente el comprobante oficial para imprimir (Atajo: Ctrl + Enter)"
                  >
                    <Printer className="w-4 h-4" />
                    <span>{isSubmitting ? 'Guardando...' : 'Guardar e Imprimir Recibo'}</span>
                    <span className="text-[10px] text-emerald-200 font-mono hidden sm:inline ml-0.5">(Ctrl+↵)</span>
                  </button>
                </>
              );
            })()}
          </div>
        </div>
      }
    >
      <form id="cobro-form" onSubmit={handleSubmit} onKeyDown={handleFormKeyDown} className="space-y-4 text-xs">
        {/* Step 1: Select Person with Smart Search */}
        <div className="space-y-2">
          <label className="block font-bold text-slate-900 uppercase tracking-wider text-[11px]">
            1. Contribuyente / Estudiante
          </label>

          {/* Search Input Container */}
          <div ref={searchContainerRef} className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por DNI o apellidos y nombres..."
              value={searchTerm}
              onFocus={() => setIsSearchOpen(true)}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setIsSearchOpen(true);
              }}
              onKeyDown={handleSearchKeyDown}
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setIsSearchOpen(false);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Quick Select Autocomplete Results if user is searching */}
            {isSearchOpen && searchTerm.trim() && (
              <div className="max-h-44 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg p-1 space-y-0.5 z-30 absolute top-full left-0 right-0 mt-1">
                {filteredPersonas.length === 0 ? (
                  <div className="p-3 text-center text-slate-400 text-xs">
                    No se encontraron estudiantes con ese DNI o nombre
                  </div>
                ) : (
                  filteredPersonas.map((p) => {
                    const isSelected = p.id === personaId;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => selectPersona(p.id)}
                        className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between text-xs transition-colors cursor-pointer ${
                          isSelected ? 'bg-emerald-50 text-emerald-900 font-bold border border-emerald-200' : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                            {p.numeroDocumento}
                          </span>
                          <span>{p.apellidoPaterno} {p.apellidoMaterno}, {p.nombres}</span>
                        </div>
                        {isSelected && <span className="text-[10px] text-emerald-600 font-bold">Seleccionado</span>}
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* Active Selected Student Card */}
          {selectedPersona ? (
            <div className="space-y-2">
              <div className="p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-xs leading-tight">
                      {selectedPersona.apellidoPaterno} {selectedPersona.apellidoMaterno}, {selectedPersona.nombres}
                    </div>
                    <div className="text-[11px] text-emerald-800 font-mono mt-0.5">
                      DNI: <span className="font-bold">{selectedPersona.numeroDocumento}</span>
                    </div>
                  </div>
                </div>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-md">
                  Titular del Recibo
                </span>
              </div>

              {/* Matrícula y Programa/Módulo Vinculado */}
              {activeEstudiante && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                      <span>Programa y Módulo Formativo Vinculado</span>
                    </label>
                    {selectedMatriculaInfo?.esFinDeSemana && (
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-800 border border-amber-300 rounded text-[10px] font-bold flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-600" />
                        Turno Fin de Semana
                      </span>
                    )}
                  </div>

                  {matriculasDisponibles.length > 0 ? (
                    <div className="space-y-1.5">
                      <select
                        value={matriculaId}
                        onChange={(e) => {
                          const newMatId = e.target.value;
                          setMatriculaId(newMatId);
                          const mInfo = matriculasDisponibles.find((md) => md.matricula.id === newMatId);
                          if (mInfo?.esFinDeSemana) {
                            const weekendConcept = conceptosPago.find((c) =>
                              c.codigo === 'PAGO_MANTO_FIN_SEMANA' ||
                              (c.nombre || '').toLowerCase().includes('fin de semana')
                            );
                            if (weekendConcept) setConceptoId(weekendConcept.id);
                          }
                        }}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {matriculasDisponibles.map((md) => (
                          <option key={md.matricula.id} value={md.matricula.id}>
                            {md.programa?.nombre || 'Programa'} — {md.modulo?.nombre || 'Módulo'} ({md.turno?.nombre || md.seccion?.nombre || 'Sección'}) [Ciclo {md.periodo?.codigo || ''}]
                          </option>
                        ))}
                        <option value="">-- Sin matrícula vinculada (Trámite Libre / Público General) --</option>
                      </select>

                      {selectedMatriculaInfo?.esFinDeSemana && (
                        <div className="p-2 bg-amber-50/90 border border-amber-200 rounded-lg text-[11px] text-amber-900 flex items-start gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                          <span>
                            <strong>Detección de Turno Especial:</strong> Matrícula en fin de semana (sábado/domingo). Se ha sugerido automáticamente la tasa de <em>Mantenimiento de Equipos para Fin de Semana</em>.
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-500 italic">
                      El titular no cuenta con matrículas activas en el periodo. El cobro se registrará como trámite o servicio independiente.
                    </div>
                  )}
                </div>
              )}

              {/* Alerta Interactiva de Deuda / Compromiso Pendiente */}
              {compromisosPendientes.length > 0 && (
                <div className="p-3.5 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-xl space-y-2 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span className="font-black text-amber-950 text-xs">
                        ¡Compromiso con saldo pendiente detectado!
                      </span>
                    </div>
                    <span className="px-2 py-0.5 bg-amber-200 text-amber-900 rounded-full text-[10px] font-extrabold uppercase">
                      {compromisosPendientes.length} {compromisosPendientes.length === 1 ? 'Saldo Pendiente' : 'Saldos Pendientes'}
                    </span>
                  </div>

                  <div className="text-[11px] text-amber-900 leading-snug">
                    Este estudiante registra un pago fraccionado anterior que aún no ha sido cancelado en su totalidad. Puedes continuar con la siguiente cuota vinculada o desvincular para cobrar otro concepto:
                  </div>

                  <div className="space-y-1.5 pt-1">
                    {compromisosPendientes.map((cp) => {
                      const esElSeleccionado = pagoPadreId === cp.id;
                      const pagosCadena = recibos.filter(
                        (r) => (r.id === cp.id || r.pagoPadreId === cp.id) && r.estado !== 'Anulado'
                      );
                      const maxCuota = Math.max(...pagosCadena.map((r) => Number(r.numeroCuota || 1)), 1);
                      const proxCuota = maxCuota + 1;
                      const totCuotas = Math.max(proxCuota, Number(cp.totalCuotas || 2));
                      const saldoPend = Number(cp.montoPendiente || 0);
                      const montoComp = Number(cp.montoTotal || (Number(cp.monto) + saldoPend));

                      return (
                        <div
                          key={cp.id}
                          className={`p-2.5 rounded-xl border text-xs transition-all ${
                            esElSeleccionado
                              ? 'bg-emerald-50/90 border-emerald-400 ring-2 ring-emerald-300 shadow-xs'
                              : 'bg-white border-amber-200 hover:border-amber-300'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="space-y-0.5">
                              <div className="font-bold text-slate-900 flex items-center gap-1.5 flex-wrap">
                                <span className="text-emerald-800">{cp.conceptoNombre}</span>
                                <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                  Recibo N° {cp.numeroRecibo}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-600 flex flex-wrap gap-x-3 gap-y-0.5">
                                <span>Compromiso Total: <strong className="font-mono text-slate-900">S/ {montoComp.toFixed(2)}</strong></span>
                                <span>Cuota previa: <strong className="font-mono text-slate-700">{maxCuota} de {totCuotas}</strong></span>
                                <span className="text-amber-800 font-bold">
                                  Saldo por pagar: <strong className="font-mono text-amber-900">S/ {saldoPend.toFixed(2)}</strong>
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                              <button
                                type="button"
                                onClick={() => setReciboParaAmortizar(cp)}
                                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer transition-all hover:scale-[1.02]"
                                title="Abrir ventana directa para registrar el pago de esta cuota"
                              >
                                <CreditCard className="w-3.5 h-3.5" />
                                <span>Cobrar Cuota {proxCuota} (Amortizar)</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-2 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs">
              Selecciona o busca un estudiante para asociar el pago.
            </div>
          )}
        </div>

        {/* Step 2: Concept, Receipt Number & Amount */}
        <div className="space-y-3 pt-2 border-t border-slate-100">
          <label className="block font-bold text-slate-900 uppercase tracking-wider text-[11px]">
            2. Concepto, N° Comprobante y Arancel
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1">
              <label className="block font-semibold text-slate-700 mb-1">Concepto Institucional</label>
              <select
                value={conceptoId}
                onChange={(e) => handleConceptoChange(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {conceptosPago.map((c) => {
                  const nombreConcepto = c.nombre || (c as any).concepto || c.codigo;
                  const tarifa = c.montoSugerido !== undefined ? c.montoSugerido : ((c as any).montoFijo || 0);
                  return (
                    <option key={c.id} value={c.id}>
                      {c.codigo}: {nombreConcepto} — {tarifa > 0 ? `S/ ${tarifa.toFixed(2)}` : 'Monto Libre'}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-semibold text-slate-700">
                  Fecha de Pago (Física)
                </label>
                {fechaPago === new Date().toISOString().split('T')[0] ? (
                  <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 text-[9px] font-bold rounded">
                    Hoy (Sugerido)
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setFechaPago(new Date().toISOString().split('T')[0])}
                    className="text-[10px] text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                  >
                    Hoy
                  </button>
                )}
              </div>
              <input
                type="date"
                required
                value={fechaPago}
                onChange={(e) => setFechaPago(e.target.value)}
                title="Fecha real del recibo físico en archivo o de la ventanilla"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                N° Recibo / Talonario
                <span className="text-slate-400 font-normal text-[10px] ml-1">(Opcional)</span>
              </label>
              <input
                type="text"
                placeholder="Ej. 010706 (Auto si vacío)"
                value={numeroRecibo}
                onChange={(e) => setNumeroRecibo(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Glosa o detalle específico para conceptos abiertos o cursos */}
          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <label className="block text-[11px] font-semibold text-slate-700">
              Detalle / Glosa Específica del Concepto:
              <span className="text-slate-400 font-normal ml-1">(Opcional: detalle de curso libre, servicio técnico, trámite o taller)</span>
            </label>
            <input
              type="text"
              placeholder="Ej. Taller Libre de Soldadura / Mantenimiento de Computadoras / Duplicado de Carné"
              value={glosaDetalle}
              onChange={(e) => setGlosaDetalle(e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Condición Arancelaria y Beneficios Institucionales */}
          <div className="p-3.5 bg-gradient-to-r from-sky-50 to-indigo-50/50 border border-sky-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HeartHandshake className="w-4 h-4 text-sky-600" />
                <span className="font-bold text-xs text-sky-950">
                  Condición Arancelaria / Beneficio Institucional
                </span>
              </div>
              {beneficioTipo !== 'REGULAR' && (
                <span className="px-2 py-0.5 bg-sky-600 text-white text-[10px] font-extrabold rounded-md shadow-2xs">
                  BENEFICIO ACTIVO
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Tipo de Condición:
                </label>
                <select
                  value={beneficioTipo}
                  onChange={(e) => handleBeneficioChange(e.target.value as TipoBeneficioArancelario)}
                  className="w-full px-2.5 py-1.5 bg-white border border-sky-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="REGULAR">Ordinario (Tarifa TUPA 100%)</option>
                  <option value="CONVENIO">Convenio Institucional</option>
                  <option value="BECA_COMPLETA">Beca Completa (100% Gratuidad)</option>
                  <option value="SEMIBECA">Semibeca (50% Descuento)</option>
                  <option value="EXONERADO">Exoneración Total (CONADIS / Ley)</option>
                  <option value="CASO_SOCIAL">Caso Social Acreditado</option>
                </select>
              </div>

              {beneficioTipo !== 'REGULAR' ? (
                <>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Institución / Convenio:
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Convenio CRFA Huallabamba"
                      value={beneficioNombre}
                      onChange={(e) => setBeneficioNombre(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-sky-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      R.D. o Documento de Sustento:
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. R.D. N° 045-2026-CETPRO-J"
                      value={documentoSustento}
                      onChange={(e) => setDocumentoSustento(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-sky-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </>
              ) : (
                <div className="sm:col-span-2 flex items-center text-slate-500 text-xs italic pt-4">
                  Aplica la tarifa oficial estándar según el TUPA institucional.
                </div>
              )}
            </div>

            {/* Ajustes específicos para Convenio o Caso Social */}
            {(beneficioTipo === 'CONVENIO' || beneficioTipo === 'CASO_SOCIAL') && (
              <div className="pt-2 border-t border-sky-200/60 grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Modalidad de Cálculo de la Tarifa de Convenio:
                  </label>
                  <div className="flex items-center gap-4 text-xs">
                    <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-800">
                      <input
                        type="radio"
                        name="tipoCalculoConvenio"
                        checked={tipoCalculoConvenio === 'MONTO'}
                        onChange={() => setTipoCalculoConvenio('MONTO')}
                        className="text-sky-600"
                      />
                      <span>Monto fijo acordado (S/)</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-800">
                      <input
                        type="radio"
                        name="tipoCalculoConvenio"
                        checked={tipoCalculoConvenio === 'PORCENTAJE'}
                        onChange={() => setTipoCalculoConvenio('PORCENTAJE')}
                        className="text-sky-600"
                      />
                      <span>Porcentaje de Descuento (%)</span>
                    </label>
                  </div>
                </div>

                <div>
                  {tipoCalculoConvenio === 'MONTO' ? (
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Tarifa especial acordada para este módulo (S/):
                      </label>
                      <input
                        type="number"
                        step="0.50"
                        min="0"
                        max={calculoBeneficio.montoOriginal}
                        value={montoPactadoConvenio}
                        onChange={(e) => setMontoPactadoConvenio(parseFloat(e.target.value) || 0)}
                        className="w-full px-2.5 py-1.5 bg-white border border-sky-300 rounded-lg text-xs font-mono font-bold focus:outline-none"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Porcentaje de Descuento a aplicar (%):
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={porcentajeDescuentoConvenio}
                        onChange={(e) => setPorcentajeDescuentoConvenio(parseInt(e.target.value) || 0)}
                        className="w-full px-2.5 py-1.5 bg-white border border-sky-300 rounded-lg text-xs font-mono font-bold focus:outline-none"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Desglose visual del arancel y subvención */}
            {beneficioTipo !== 'REGULAR' && (
              <div className="p-2 bg-white/80 border border-sky-200 rounded-lg flex flex-wrap items-center justify-between gap-2 text-xs font-medium text-slate-700">
                <div>
                  Tarifa TUPA Base: <strong className="font-mono text-slate-900">S/ {calculoBeneficio.montoOriginal.toFixed(2)}</strong>
                </div>
                <div className="text-rose-700">
                  Subvención / Descuento: <strong className="font-mono">- S/ {calculoBeneficio.montoDescuento.toFixed(2)} ({calculoBeneficio.porcentajeDescuento}%)</strong>
                </div>
                <div className="text-emerald-800">
                  Total a Cobrar: <strong className="font-mono text-sm font-black text-emerald-900">S/ {calculoBeneficio.montoFinal.toFixed(2)}</strong> {calculoBeneficio.montoFinal === 0 && <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">GRATUIDAD</span>}
                </div>
              </div>
            )}
          </div>

          {/* Cuotas / Fraccionamiento */}
          {reciboPadreAmortizando ? (
            <div className="p-3 bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-300 rounded-xl space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-700" />
                  <span className="font-extrabold text-xs text-emerald-950">
                    Amortizando Cuota {numeroCuota} de {totalCuotas} (Compromiso N° {reciboPadreAmortizando.numeroRecibo})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={cancelarModoAmortizacion}
                  className="px-2 py-0.5 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 rounded text-[10px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                  title="Desvincular del compromiso anterior y cobrar de forma independiente"
                >
                  <X className="w-3 h-3" />
                  <span>Desvincular</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-white/80 p-2.5 rounded-lg border border-emerald-200 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 font-medium block">Compromiso Total Acordado:</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">S/ {montoTotal.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-medium block">Saldo Pendiente Anterior:</span>
                  <span className="font-mono font-bold text-amber-800 text-sm">S/ {saldoBasePendiente.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-medium block">Saldo Restante tras este Abono:</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`font-mono font-black text-sm ${montoPendienteCalculado > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                      S/ {montoPendienteCalculado.toFixed(2)}
                    </span>
                    {montoPendienteCalculado <= 0 && (
                      <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1 py-0.5 rounded font-extrabold">CANCELADO</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Accesos rápidos de abono para la cuota */}
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <span className="text-[10px] text-slate-600 font-medium">Abono rápido sugerido:</span>
                {[
                  { label: 'S/ 50', val: 50 },
                  { label: 'S/ 70', val: 70 },
                  { label: 'S/ 100', val: 100 },
                  { label: 'S/ 150', val: 150 },
                  { label: `Saldo Total (S/ ${saldoBasePendiente.toFixed(2)})`, val: saldoBasePendiente },
                ]
                  .filter((chip) => chip.val <= saldoBasePendiente)
                  .map((chip) => (
                    <button
                      key={chip.label}
                      type="button"
                      onClick={() => {
                        setIsManualMonto(true);
                        setMonto(chip.val);
                      }}
                      className="px-2 py-0.5 bg-white hover:bg-emerald-50 text-emerald-900 border border-emerald-200 rounded text-[10px] font-mono font-semibold cursor-pointer transition-colors shadow-2xs"
                    >
                      {chip.label}
                    </button>
                  ))}
              </div>
            </div>
          ) : (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="font-semibold text-slate-800 text-xs flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={esFraccionado}
                      onChange={(e) => handleFraccionadoToggle(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <span>Habilitar Pago Fraccionado / En Cuotas</span>
                  </label>
                  <p className="text-[10px] text-slate-500 ml-6">
                    Permite amortizar o pagar una cuota parcial dejando un saldo pendiente registrado.
                  </p>
                </div>
                {esFraccionado && (
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-800 border border-amber-200 rounded text-[10px] font-bold">
                    MODO CUOTAS
                  </span>
                )}
              </div>

              {esFraccionado && (
                <div className="pt-2 border-t border-slate-200 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Monto Total Comprometido (S/)</label>
                      <input
                        type="number"
                        step="0.50"
                        min="1"
                        required
                        value={montoTotal}
                        onChange={(e) => {
                          const tot = parseFloat(e.target.value) || 0;
                          setMontoTotal(tot);
                          if (!isManualMonto) {
                            setMonto(Math.round((tot / totalCuotas) * 100) / 100);
                          }
                        }}
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-mono font-bold text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">N° Cuota a Cancelar</label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min={1}
                          max={totalCuotas}
                          value={numeroCuota}
                          onChange={(e) => setNumeroCuota(parseInt(e.target.value) || 1)}
                          className="w-16 px-2 py-1.5 bg-white border border-slate-200 rounded-lg font-mono text-center text-xs font-bold focus:outline-none"
                        />
                        <span className="text-slate-400 text-xs">de</span>
                        <input
                          type="number"
                          min={2}
                          max={12}
                          value={totalCuotas}
                          onChange={(e) => {
                            const tc = parseInt(e.target.value) || 2;
                            setTotalCuotas(tc);
                            if (!isManualMonto) {
                              setMonto(Math.round((montoTotal / tc) * 100) / 100);
                            }
                          }}
                          className="w-16 px-2 py-1.5 bg-white border border-slate-200 rounded-lg font-mono text-center text-xs font-bold focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">Vencimiento Siguiente Cuota</label>
                      <input
                        type="date"
                        value={fechaVencimiento}
                        onChange={(e) => setFechaVencimiento(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-mono text-xs focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Accesos rápidos de abono flexible y asimétrico */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] text-slate-500 font-medium">Abono rápido sugerido:</span>
                    {[
                      { label: '50%', val: Math.round((montoTotal * 0.5) * 100) / 100 },
                      { label: 'S/ 50', val: 50 },
                      { label: 'S/ 70', val: 70 },
                      { label: 'S/ 100', val: 100 },
                      { label: 'S/ 150', val: 150 },
                      { label: 'Total (100%)', val: montoTotal },
                    ].map((chip) => (
                      <button
                        key={chip.label}
                        type="button"
                        onClick={() => {
                          setIsManualMonto(true);
                          setMonto(chip.val);
                        }}
                        className="px-2 py-0.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded text-[10px] font-mono font-semibold cursor-pointer transition-colors shadow-2xs"
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-semibold text-slate-700">
                  {esFraccionado ? `Monto a Cancelar en esta Cuota (${numeroCuota}/${totalCuotas}) (S/)` : 'Monto a Cobrar (S/)'}
                </label>
                {isManualMonto && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsManualMonto(false);
                      const finalAmount = calculoBeneficio.montoFinal;
                      if (!esFraccionado) {
                        setMonto(finalAmount);
                      } else {
                        setMonto(Math.round((finalAmount / totalCuotas) * 100) / 100);
                      }
                    }}
                    className="text-[10px] text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer"
                    title="Restablecer al monto oficial calculado automáticamente"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Restablecer calculado</span>
                  </button>
                )}
              </div>
              <input
                type="number"
                step="0.50"
                min="0"
                required
                value={monto}
                onChange={(e) => {
                  setIsManualMonto(true);
                  setMonto(parseFloat(e.target.value) || 0);
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              {monto === 0 && beneficioTipo !== 'REGULAR' && (
                <div className="mt-1 text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  <span>Emisión por Gratuidad / Exoneración Oficial (S/ 0.00)</span>
                </div>
              )}
              {esFraccionado && (
                <div className="mt-1 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Saldo Pendiente restante:</span>
                  <span className={`font-mono font-bold ${montoPendienteCalculado > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                    S/ {montoPendienteCalculado.toFixed(2)}
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Método de Pago</label>
              <select
                value={metodoPago}
                onChange={(e) => setMetodoPago(e.target.value as MetodoPago)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              >
                <option value="Efectivo">Efectivo (Ventanilla)</option>
                <option value="Yape / Plin">Yape / Plin (Billetera Digital)</option>
                <option value="Banco de la Nación">Depósito Banco de la Nación</option>
              </select>
            </div>
          </div>

          {metodoPago !== 'Efectivo' && (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                N° de Operación / Código de Transferencia
              </label>
              <input
                type="text"
                placeholder="Ej. OP-98412356"
                value={numeroOperacion}
                onChange={(e) => setNumeroOperacion(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Observaciones / Glosa</label>
            <input
              type="text"
              placeholder="Ej. Pago de matrícula módulo regular, o detalle del trámite"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
      </form>
    </Modal>

    {reciboParaAmortizar && (
      <AmortizarCuotaModal
        isOpen={!!reciboParaAmortizar}
        onClose={() => setReciboParaAmortizar(null)}
        reciboPadre={reciboParaAmortizar}
        onReciboCreated={(nuevo, shouldPrint) => {
          setReciboParaAmortizar(null);
          onClose();
          if (onReciboCreated) {
            onReciboCreated(nuevo, shouldPrint);
          }
        }}
      />
    )}
  </>
  );
};
