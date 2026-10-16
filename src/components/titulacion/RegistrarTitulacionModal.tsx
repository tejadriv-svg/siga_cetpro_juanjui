import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { AptoTitulacion, TituloDetallado } from '../../types';
import { Modal } from '../common/Modal';
import { 
  Award, 
  GraduationCap, 
  Users, 
  Calendar, 
  Clock, 
  FileText, 
  BookOpen, 
  CheckCircle2, 
  Search, 
  Save, 
  AlertCircle 
} from 'lucide-react';

interface RegistrarTitulacionModalProps {
  isOpen: boolean;
  onClose: () => void;
  tituloEditar?: TituloDetallado | null;
  egresadoPreseleccionado?: AptoTitulacion | null;
}

function numeroALetras(n: number): string {
  const round = Math.round(n);
  const mapa: { [key: number]: string } = {
    0: 'CERO',
    1: 'UNO',
    2: 'DOS',
    3: 'TRES',
    4: 'CUATRO',
    5: 'CINCO',
    6: 'SEIS',
    7: 'SIETE',
    8: 'OCHO',
    9: 'NUEVE',
    10: 'DIEZ',
    11: 'ONCE',
    12: 'DOCE',
    13: 'TRECE',
    14: 'CATORCE',
    15: 'QUINCE',
    16: 'DIECISÃ‰IS',
    17: 'DIECISIETE',
    18: 'DIECIOCHO',
    19: 'DIECINUEVE',
    20: 'VEINTE',
  };
  return mapa[round] || round.toString();
}

export const RegistrarTitulacionModal: React.FC<RegistrarTitulacionModalProps> = ({
  isOpen,
  onClose,
  tituloEditar,
  egresadoPreseleccionado
}) => {
  const { aptosTitulacion, emitirTitulo, updateTitulo, trabajadores } = useApp();

  const [egresadoId, setEgresadoId] = useState<string>('');
  const [filtroBusqueda, setFiltroBusqueda] = useState<string>('');
  
  // Datos acadÃ©micos
  const [denominacionTitulo, setDenominacionTitulo] = useState<string>('');
  const [modalidadTitulacion, setModalidadTitulacion] = useState<'TRABAJO_APLICACION_PROFESIONAL' | 'EXAMEN_SUFICIENCIA_PROFESIONAL'>('TRABAJO_APLICACION_PROFESIONAL');
  const [tituloProyecto, setTituloProyecto] = useState<string>('');
  const [fechaSustentacion, setFechaSustentacion] = useState<string>(new Date().toISOString().split('T')[0]);
  const [horaSustentacion, setHoraSustentacion] = useState<string>('10:00 AM');
  const [calificacion, setCalificacion] = useState<number>(17);
  const [resultadoSustentacion, setResultadoSustentacion] = useState<'APROBADO_UNANIMIDAD' | 'APROBADO_MAYORIA'>('APROBADO_UNANIMIDAD');

  // Jurado Calificador
  const [presNombre, setPresNombre] = useState<string>('Lic. Carlos Silva Ramos');
  const [presDni, setPresDni] = useState<string>('01234567');
  const [presCargo, setPresCargo] = useState<string>('Docente Formador Principal');

  const [secNombre, setSecNombre] = useState<string>('Lic. Ana Torres Pezo');
  const [secDni, setSecDni] = useState<string>('02345678');
  const [secCargo, setSecCargo] = useState<string>('Docente de Especialidad');

  const [vocNombre, setVocNombre] = useState<string>('Lic. Marcos RÃ­os del Castillo');
  const [vocDni, setVocDni] = useState<string>('03456789');
  const [vocCargo, setVocCargo] = useState<string>('Docente Evaluador');

  // Registro Institucional
  const [resolucionDirectoral, setResolucionDirectoral] = useState<string>('RD NÂ° 0180-2026-DRE-SM');
  const [libroRegistro, setLibroRegistro] = useState<string>('Libro Oficial de TÃ­tulos 2026');
  const [tomoFolio, setTomoFolio] = useState<string>('Libro 2026, Tomo 01, Folio 01');
  const [estado, setEstado] = useState<string>('REGISTRADO');
  const [observaciones, setObservaciones] = useState<string>('TÃ­tulo Oficial expedido conforme a la R.V.M. NÂ° 188-2020-MINEDU');

  const [loading, setLoading] = useState<boolean>(false);

  // Inicializar o cargar si es ediciÃ³n
  useEffect(() => {
    if (tituloEditar) {
      setEgresadoId(tituloEditar.egresadoId || '');
      setDenominacionTitulo(tituloEditar.denominacionTitulo || '');
      setModalidadTitulacion((tituloEditar.modalidadTitulacion as any) || 'TRABAJO_APLICACION_PROFESIONAL');
      setTituloProyecto(tituloEditar.tituloProyecto || '');
      setFechaSustentacion(tituloEditar.fechaSustentacion || new Date().toISOString().split('T')[0]);
      setHoraSustentacion(tituloEditar.horaSustentacion || '10:00 AM');
      setCalificacion(tituloEditar.calificacion != null ? Number(tituloEditar.calificacion) : 17);
      setResultadoSustentacion((tituloEditar.resultadoSustentacion as any) || 'APROBADO_UNANIMIDAD');
      setResolucionDirectoral(tituloEditar.resolucionDirectoral || 'RD NÂ° 0180-2026-DRE-SM');
      setLibroRegistro(tituloEditar.libroRegistro || 'Libro Oficial de TÃ­tulos 2026');
      setTomoFolio(tituloEditar.tomoFolio || 'Libro 2026, Tomo 01, Folio 01');
      setEstado(tituloEditar.estado || 'REGISTRADO');
      setObservaciones(tituloEditar.observaciones || '');

      if (tituloEditar.juradoCalificador) {
        const j = tituloEditar.juradoCalificador;
        if (j.presidente) {
          setPresNombre(j.presidente.nombre || '');
          setPresDni(j.presidente.dni || '');
          setPresCargo(j.presidente.cargo || '');
        }
        if (j.secretario) {
          setSecNombre(j.secretario.nombre || '');
          setSecDni(j.secretario.dni || '');
          setSecCargo(j.secretario.cargo || '');
        }
        if (j.vocal) {
          setVocNombre(j.vocal.nombre || '');
          setVocDni(j.vocal.dni || '');
          setVocCargo(j.vocal.cargo || '');
        }
      }
    } else if (egresadoPreseleccionado) {
      setEgresadoId(egresadoPreseleccionado.egresado_id);
      actualizarCamposEgresado(egresadoPreseleccionado);
    }
  }, [tituloEditar, egresadoPreseleccionado]);

  const actualizarCamposEgresado = (egr: AptoTitulacion) => {
    const esTecnico = (egr.nivel_formativo || '').toLowerCase().includes('tÃ©cnico') && !(egr.nivel_formativo || '').toLowerCase().includes('auxiliar');
    const denominacionAuto = esTecnico
      ? `TÃ‰CNICO EN ${(egr.programa_nombre || '').toUpperCase()}`
      : `AUXILIAR TÃ‰CNICO EN ${(egr.programa_nombre || '').toUpperCase()}`;
    
    setDenominacionTitulo(denominacionAuto);
    setTituloProyecto(`ImplementaciÃ³n y AplicaciÃ³n PrÃ¡ctica en ${egr.programa_nombre || 'Especialidad TÃ©cnica'}`);
  };

  const handleSelectEgresado = (id: string) => {
    setEgresadoId(id);
    const encontrado = aptosTitulacion.find(a => a.egresado_id === id);
    if (encontrado) {
      actualizarCamposEgresado(encontrado);
    }
  };

  const egresadoSeleccionado = aptosTitulacion.find(a => a.egresado_id === egresadoId);

  // Filtrar egresados aptos
  const egresadosFiltrados = aptosTitulacion.filter(a => {
    // Si no estamos editando, mostrar preferentemente los no titulados o el seleccionado
    if (!tituloEditar && a.ya_titulado && a.egresado_id !== egresadoId) return false;

    if (!filtroBusqueda.trim()) return true;
    const term = filtroBusqueda.toLowerCase();
    const nombreCompleto = `${a.persona_apellido_paterno} ${a.persona_apellido_materno} ${a.persona_nombres}`.toLowerCase();
    return (
      nombreCompleto.includes(term) ||
      (a.persona_dni || '').includes(term) ||
      (a.programa_nombre || '').toLowerCase().includes(term) ||
      (a.codigo_egresado || '').toLowerCase().includes(term)
    );
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!egresadoId && !tituloEditar) {
      alert('Por favor seleccione un egresado apto.');
      return;
    }

    setLoading(true);
    try {
      const payload: any = {
        egresadoId,
        denominacionTitulo,
        modalidadTitulacion,
        tituloProyecto,
        fechaSustentacion,
        horaSustentacion,
        calificacion: Number(calificacion),
        calificacionLetras: numeroALetras(Number(calificacion)),
        resultadoSustentacion,
        juradoCalificador: {
          presidente: { nombre: presNombre, cargo: presCargo, dni: presDni },
          secretario: { nombre: secNombre, cargo: secCargo, dni: secDni },
          vocal: { nombre: vocNombre, cargo: vocCargo, dni: vocDni }
        },
        resolucionDirectoral,
        libroRegistro,
        tomoFolio,
        estado,
        observaciones
      };

      if (tituloEditar) {
        const ok = await updateTitulo(tituloEditar.id, payload);
        if (ok) onClose();
      } else {
        const creado = await emitirTitulo(payload);
        if (creado) onClose();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      size="xl"
    >
      <form onSubmit={handleSubmit} className="flex flex-col h-full">
        {/* Cabecera del modal */}
        <div className="bg-slate-900 text-white px-6 py-4 rounded-t-lg flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base md:text-lg font-bold text-white tracking-wide">
                {tituloEditar ? 'Editar Registro de TÃ­tulo Oficial' : 'Registrar SustentaciÃ³n y EmisiÃ³n de TÃ­tulo'}
              </h3>
              <p className="text-xs text-slate-300">
                Conforme a la R.V.M. NÂ° 188-2020-MINEDU (Anexo 5A TÃ©cnico / Anexo 5B Auxiliar TÃ©cnico)
              </p>
            </div>
          </div>
        </div>

        {/* Cuerpo del formulario */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
          
          {/* 1. SelecciÃ³n de Egresado Apto */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-slate-800 border-b border-slate-100 pb-2">
              <GraduationCap className="w-5 h-5 text-amber-600" />
              <h4 className="text-sm font-bold uppercase tracking-wider">
                1. Egresado(a) Candidato(a) a TitulaciÃ³n
              </h4>
            </div>

            {!tituloEditar ? (
              <div className="space-y-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={filtroBusqueda}
                    onChange={(e) => setFiltroBusqueda(e.target.value)}
                    placeholder="Buscar egresado por DNI, nombres o programa..."
                    className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>

                <div className="max-h-44 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100">
                  {egresadosFiltrados.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400">
                      No se encontraron egresados aptos pendientes de titulaciÃ³n.
                    </div>
                  ) : (
                    egresadosFiltrados.map((egr) => {
                      const isSelected = egresadoId === egr.egresado_id;
                      return (
                        <div
                          key={egr.egresado_id}
                          onClick={() => handleSelectEgresado(egr.egresado_id)}
                          className={`p-3 text-xs cursor-pointer transition-colors flex items-center justify-between ${
                            isSelected ? 'bg-amber-50 border-l-4 border-amber-600 font-semibold' : 'hover:bg-slate-50'
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900">
                                {egr.persona_apellido_paterno} {egr.persona_apellido_materno}, {egr.persona_nombres}
                              </span>
                              <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700 font-mono">
                                DNI {egr.persona_dni}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              {egr.programa_nombre} â€¢ Nivel: <strong>{egr.nivel_formativo}</strong> â€¢ {egr.total_creditos_aprobados} crÃ©ditos ({egr.total_horas_acumuladas} hrs)
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-medium">
                              APTO PARA TITULAR
                            </span>
                            {isSelected && <CheckCircle2 className="w-4 h-4 text-amber-600" />}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            ) : (
              <div className="p-3 bg-slate-100 rounded-lg border border-slate-200 text-xs">
                <span className="text-slate-500 block">Graduando(a):</span>
                <span className="font-bold text-slate-900 text-sm">
                  {tituloEditar.personaApellidoPaterno} {tituloEditar.personaApellidoMaterno}, {tituloEditar.personaNombres}
                </span>
                <div className="text-slate-600 mt-1">
                  DNI: {tituloEditar.personaDni} â€¢ Programa: {tituloEditar.programaNombre} ({tituloEditar.nivelFormativo})
                </div>
              </div>
            )}

            {egresadoSeleccionado && (
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg text-xs space-y-1 text-amber-950">
                <div className="font-bold">Resumen de Requisitos AcadÃ©micos Cumplidos:</div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px] pt-1">
                  <div>CÃ³d Egresado: <strong>{egresadoSeleccionado.codigo_egresado}</strong></div>
                  <div>Nivel Formativo: <strong>{egresadoSeleccionado.nivel_formativo}</strong></div>
                  <div>CrÃ©ditos Aprobados: <strong>{egresadoSeleccionado.total_creditos_aprobados}</strong></div>
                  <div>Horas Acumuladas: <strong>{egresadoSeleccionado.total_horas_acumuladas} hrs</strong></div>
                </div>
              </div>
            )}
          </div>

          {/* 2. Modalidad y SustentaciÃ³n */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-slate-800 border-b border-slate-100 pb-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <h4 className="text-sm font-bold uppercase tracking-wider">
                2. Modalidad y Datos de la SustentaciÃ³n
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1 md:col-span-2">
                <label className="font-bold text-slate-700">DenominaciÃ³n Oficial del TÃ­tulo</label>
                <input
                  type="text"
                  required
                  value={denominacionTitulo}
                  onChange={(e) => setDenominacionTitulo(e.target.value)}
                  placeholder="Ej: TÃ‰CNICO EN ESTILISMO / AUXILIAR TÃ‰CNICO EN PELUQUERÃA Y BARBERÃA"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 uppercase font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Modalidad de TitulaciÃ³n</label>
                <select
                  value={modalidadTitulacion}
                  onChange={(e) => setModalidadTitulacion(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 bg-white"
                >
                  <option value="TRABAJO_APLICACION_PROFESIONAL">Trabajo de AplicaciÃ³n Profesional</option>
                  <option value="EXAMEN_SUFICIENCIA_PROFESIONAL">Examen de Suficiencia Profesional</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Dictamen Final del Jurado</label>
                <select
                  value={resultadoSustentacion}
                  onChange={(e) => setResultadoSustentacion(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 bg-white"
                >
                  <option value="APROBADO_UNANIMIDAD">Aprobado por Unanimidad</option>
                  <option value="APROBADO_MAYORIA">Aprobado por MayorÃ­a</option>
                </select>
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="font-bold text-slate-700">TÃ­tulo del Proyecto / Tema Evaluado</label>
                <input
                  type="text"
                  required
                  value={tituloProyecto}
                  onChange={(e) => setTituloProyecto(e.target.value)}
                  placeholder="Ej: ImplementaciÃ³n y GestiÃ³n de Procesos TÃ©cnicos..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Fecha de SustentaciÃ³n</label>
                <input
                  type="date"
                  required
                  value={fechaSustentacion}
                  onChange={(e) => setFechaSustentacion(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Hora de SustentaciÃ³n</label>
                <input
                  type="text"
                  value={horaSustentacion}
                  onChange={(e) => setHoraSustentacion(e.target.value)}
                  placeholder="10:00 AM"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">CalificaciÃ³n Vigesimal (0 - 20)</label>
                <input
                  type="number"
                  step="0.1"
                  min="13"
                  max="20"
                  required
                  value={calificacion}
                  onChange={(e) => setCalificacion(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 font-mono font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">CalificaciÃ³n en Letras (AutomÃ¡tico)</label>
                <input
                  type="text"
                  readOnly
                  value={numeroALetras(calificacion)}
                  className="w-full px-3 py-2 border border-slate-200 bg-slate-100 rounded-lg font-bold text-slate-700"
                />
              </div>
            </div>
          </div>

          {/* 3. Jurado Calificador */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-slate-800 border-b border-slate-100 pb-2">
              <Users className="w-5 h-5 text-emerald-600" />
              <h4 className="text-sm font-bold uppercase tracking-wider">
                3. Jurado Calificador Oficial
              </h4>
            </div>

            <div className="space-y-3 text-xs">
              {/* Presidente */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                <span className="font-bold text-blue-900 block">PRESIDENTE(A) DEL JURADO</span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <input
                    type="text"
                    required
                    value={presNombre}
                    onChange={(e) => setPresNombre(e.target.value)}
                    placeholder="Nombres y Apellidos"
                    className="px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                  />
                  <input
                    type="text"
                    value={presCargo}
                    onChange={(e) => setPresCargo(e.target.value)}
                    placeholder="Cargo (ej: Docente Formador)"
                    className="px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                  />
                  <input
                    type="text"
                    value={presDni}
                    onChange={(e) => setPresDni(e.target.value)}
                    placeholder="DNI"
                    className="px-2.5 py-1.5 border border-slate-300 rounded bg-white font-mono"
                  />
                </div>
              </div>

              {/* Secretario */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                <span className="font-bold text-blue-900 block">SECRETARIO(A) DEL JURADO</span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <input
                    type="text"
                    required
                    value={secNombre}
                    onChange={(e) => setSecNombre(e.target.value)}
                    placeholder="Nombres y Apellidos"
                    className="px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                  />
                  <input
                    type="text"
                    value={secCargo}
                    onChange={(e) => setSecCargo(e.target.value)}
                    placeholder="Cargo (ej: Docente de Especialidad)"
                    className="px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                  />
                  <input
                    type="text"
                    value={secDni}
                    onChange={(e) => setSecDni(e.target.value)}
                    placeholder="DNI"
                    className="px-2.5 py-1.5 border border-slate-300 rounded bg-white font-mono"
                  />
                </div>
              </div>

              {/* Vocal */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                <span className="font-bold text-blue-900 block">VOCAL DEL JURADO</span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <input
                    type="text"
                    required
                    value={vocNombre}
                    onChange={(e) => setVocNombre(e.target.value)}
                    placeholder="Nombres y Apellidos"
                    className="px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                  />
                  <input
                    type="text"
                    value={vocCargo}
                    onChange={(e) => setVocCargo(e.target.value)}
                    placeholder="Cargo (ej: Docente Evaluador)"
                    className="px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                  />
                  <input
                    type="text"
                    value={vocDni}
                    onChange={(e) => setVocDni(e.target.value)}
                    placeholder="DNI"
                    className="px-2.5 py-1.5 border border-slate-300 rounded bg-white font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 4. Registro Institucional */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-slate-800 border-b border-slate-100 pb-2">
              <BookOpen className="w-5 h-5 text-indigo-600" />
              <h4 className="text-sm font-bold uppercase tracking-wider">
                4. Registro Institucional y Estado Oficial
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">ResoluciÃ³n Directoral</label>
                <input
                  type="text"
                  required
                  value={resolucionDirectoral}
                  onChange={(e) => setResolucionDirectoral(e.target.value)}
                  placeholder="RD NÂ° 0180-2026-DRE-SM"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Libro de Registro Oficial</label>
                <input
                  type="text"
                  required
                  value={libroRegistro}
                  onChange={(e) => setLibroRegistro(e.target.value)}
                  placeholder="Libro Oficial de TÃ­tulos 2026"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Tomo y Folio</label>
                <input
                  type="text"
                  required
                  value={tomoFolio}
                  onChange={(e) => setTomoFolio(e.target.value)}
                  placeholder="Libro 2026, Tomo 01, Folio 01"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Estado del TrÃ¡mite</label>
                <select
                  value={estado}
                  onChange={(e) => setEstado(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 bg-white font-semibold"
                >
                  <option value="REGISTRADO">REGISTRADO</option>
                  <option value="EN_TRAMITE_UGEL">EN TRÃMITE UGEL</option>
                  <option value="EMITIDO">EMITIDO</option>
                  <option value="ENTREGADO">ENTREGADO</option>
                  <option value="BORRADOR">BORRADOR</option>
                </select>
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="font-bold text-slate-700">Observaciones Normativas</label>
                <textarea
                  rows={2}
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 text-xs"
                />
              </div>
            </div>
          </div>

        </div>

        {/* Barra inferior de acciones */}
        <div className="bg-slate-100 px-6 py-4 rounded-b-lg flex items-center justify-between border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-all"
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 rounded-lg shadow-sm flex items-center gap-2 transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {loading ? 'Guardando...' : (tituloEditar ? 'Actualizar TÃ­tulo' : 'Registrar y Emitir TÃ­tulo Oficial')}
          </button>
        </div>
      </form>
    </Modal>
  );
};

