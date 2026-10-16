import React, { useState, useEffect } from 'react';
import { Save, AlertCircle, RefreshCw, HeartHandshake } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Matricula, TipoBeneficioArancelario } from '../../types';
import { Modal } from '../common/Modal';

interface EditarMatriculaModalProps {
  matricula: Matricula;
  estudiante: any;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const EditarMatriculaModal: React.FC<EditarMatriculaModalProps> = ({
  matricula,
  estudiante,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const {
    secciones,
    modulos,
    periodosAcademicos,
    sedes,
    personas,
    recibos,
    conceptosPago,
    addRecibo,
    updateMatricula,
  } = useApp();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [codigoMatricula, setCodigoMatricula] = useState('');
  const [periodoAcademicoId, setPeriodoAcademicoId] = useState('');
  const [moduloId, setModuloId] = useState('');
  const [seccionId, setSeccionId] = useState('');
  const [sedeId, setSedeId] = useState('');
  const [fechaMatricula, setFechaMatricula] = useState('');
  const [condicion, setCondicion] = useState('Nuevo');
  const [formacion, setFormacion] = useState('Presencial');
  const [oportunidadTecnica, setOportunidadTecnica] = useState('1');
  const [estadoMatricula, setEstadoMatricula] = useState('Activo');
  const [condicionArancelaria, setCondicionArancelaria] = useState<TipoBeneficioArancelario>('REGULAR');
  const [convenioNombre, setConvenioNombre] = useState('');
  const [resolucionSustento, setResolucionSustento] = useState('');
  const [montoPactado, setMontoPactado] = useState('');

  // Resolver datos del estudiante/persona
  const persona = estudiante?.persona || personas.find(p => p.id === estudiante?.personaId);
  const nombreEstudiante = persona
    ? `${persona.apellidoPaterno || ''} ${persona.apellidoMaterno || ''}, ${persona.nombres || ''}`.trim()
    : 'Estudiante';
  const dniEstudiante = persona?.numeroDocumento || persona?.dni || '';

  useEffect(() => {
    if (!isOpen || !matricula) return;

    setCodigoMatricula(matricula.codigoMatricula || '');
    
    // Si no tiene periodoAcademicoId directo pero tiene periodoAcademico en texto, buscar coincidencia
    let pId = matricula.periodoAcademicoId || '';
    if (!pId && matricula.periodoAcademico && periodosAcademicos.length > 0) {
      const match = periodosAcademicos.find(
        (p) =>
          p.codigo === matricula.periodoAcademico ||
          p.codigo === `PER-ACA-${matricula.periodoAcademico}` ||
          p.nombre?.includes(matricula.periodoAcademico)
      );
      if (match) pId = match.id;
    }
    setPeriodoAcademicoId(pId);

    setModuloId(matricula.moduloId || '');
    setSeccionId(matricula.seccionId || '');
    setSedeId(matricula.sedeId || '');
    
    const rawDate = matricula.fechaMatricula || '';
    setFechaMatricula(rawDate ? rawDate.substring(0, 10) : '');
    
    setCondicion(matricula.condicion || 'Nuevo');
    setFormacion(matricula.formacion || 'Presencial');
    setOportunidadTecnica(String(matricula.oportunidadTecnica ?? '1'));
    
    setCondicionArancelaria(matricula.condicionArancelaria || 'REGULAR');
    setConvenioNombre(matricula.convenioNombre || '');
    setResolucionSustento(matricula.resolucionSustento || '');
    setMontoPactado(matricula.montoPactado !== undefined ? String(matricula.montoPactado) : '');

    // Normalizar estado
    const st = (matricula.estadoMatricula || 'Activo').toUpperCase();
    if (st === 'ACTIVA' || st === 'ACTIVO') {
      setEstadoMatricula('Activo');
    } else if (st === 'INACTIVA' || st === 'INACTIVO') {
      setEstadoMatricula('Inactivo');
    } else {
      setEstadoMatricula(matricula.estadoMatricula || 'Activo');
    }
    
    setError(null);
  }, [isOpen, matricula, periodosAcademicos]);

  if (!isOpen || !matricula) return null;

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await updateMatricula(matricula.id, {
        codigoMatricula,
        periodoAcademicoId: periodoAcademicoId || undefined,
        moduloId,
        seccionId: seccionId || undefined,
        sedeId: sedeId || undefined,
        fechaMatricula: fechaMatricula || undefined,
        condicion,
        formacion,
        oportunidadTecnica: oportunidadTecnica || '1',
        estadoMatricula,
        condicionArancelaria,
        convenioNombre: condicionArancelaria !== 'REGULAR' && convenioNombre.trim() ? convenioNombre.trim() : undefined,
        resolucionSustento: condicionArancelaria !== 'REGULAR' && resolucionSustento.trim() ? resolucionSustento.trim() : undefined,
        montoPactado: condicionArancelaria !== 'REGULAR' && montoPactado ? Number(montoPactado) : undefined,
      });

      // Si pasa a Exonerado o Beca Completa y no tiene aún recibo emitido para esta matrícula, generar el Recibo de Gratuidad Oficial S/ 0.00
      if ((condicionArancelaria === 'EXONERADO' || condicionArancelaria === 'BECA_COMPLETA') && persona) {
        const codMat = codigoMatricula || matricula.codigoMatricula;
        const yaTieneRecibo = matricula.reciboPagoId || recibos.some(r => r.personaId === persona.id && r.observaciones?.includes(codMat));
        if (!yaTieneRecibo) {
          const concMat = conceptosPago.find(c => c.nombre.toLowerCase().includes('matrícula') || c.codigo === 'CP-MAT') || conceptosPago[0];
          const baseTarifa = concMat?.monto || 50;
          const recGratuito = await addRecibo({
            personaId: persona.id,
            conceptoId: concMat?.id || 'cp-1',
            conceptoNombre: concMat?.nombre || 'Derecho de Matrícula Modular',
            monto: 0,
            metodoPago: 'Efectivo',
            estado: 'Emitido',
            beneficioTipo: condicionArancelaria,
            beneficioNombre: convenioNombre.trim() || (condicionArancelaria === 'EXONERADO' ? 'CONADIS / Discapacidad' : 'Beca 100%'),
            montoOriginal: baseTarifa,
            montoDescuento: baseTarifa,
            porcentajeDescuento: 100,
            documentoSustento: resolucionSustento.trim() || undefined,
            observaciones: `Gratuidad Oficial de Matrícula ${codMat}`,
          });
          if (recGratuito) {
            await updateMatricula(matricula.id, { reciboPagoId: recGratuito.id }).catch(() => {});
          }
        }
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error al actualizar matrícula:', err);
      setError(err.message || 'Error al guardar los cambios en la matrícula');
    } finally {
      setLoading(false);
    }
  };

  // Filtrar secciones por módulo seleccionado
  const filteredSecciones = secciones.filter((s) => {
    if (moduloId && s.moduloId !== moduloId) return false;
    return true;
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Editar Registro de Matrícula"
      subtitle={`Estudiante: ${nombreEstudiante} ${dniEstudiante ? `(DNI: ${dniEstudiante})` : ''}`}
      maxWidth="2xl"
      zIndex="z-[80]"
      actions={
        <>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => handleSubmit()}
            disabled={loading}
            className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
          >
            {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>Guardar Cambios</span>
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-700">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Código de Matrícula */}
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Código de Matrícula
            </label>
            <input
              type="text"
              value={codigoMatricula}
              onChange={(e) => setCodigoMatricula(e.target.value)}
              placeholder="Ej. 47794662-S3496-1-001-M1-2025-1"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-sky-500 focus:border-sky-500 font-mono bg-slate-50"
            />
          </div>

          {/* Módulo */}
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Módulo Formativo
            </label>
            <select
              value={moduloId}
              onChange={(e) => setModuloId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-sky-500 focus:border-sky-500 cursor-pointer"
            >
              <option value="">-- Seleccionar Módulo --</option>
              {modulos.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.codigo ? `[${m.codigo}] ` : ''}{m.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Sección Asignada */}
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Sección Asignada
            </label>
            <select
              value={seccionId}
              onChange={(e) => setSeccionId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-sky-500 focus:border-sky-500 cursor-pointer"
            >
              <option value="">-- Sin Sección Asignada --</option>
              {filteredSecciones.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.codigo || s.nombre} - Turno: {s.turno || 'N/A'} - Aula: {s.aula || 'N/A'}
                </option>
              ))}
            </select>
          </div>

          {/* Periodo Académico */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Periodo Académico
            </label>
            <select
              value={periodoAcademicoId}
              onChange={(e) => setPeriodoAcademicoId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-sky-500 focus:border-sky-500 cursor-pointer"
            >
              <option value="">-- Seleccionar Periodo --</option>
              {(periodosAcademicos || []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre} ({p.codigo || p.id.substring(0, 8)})
                </option>
              ))}
            </select>
          </div>

          {/* Sede */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Sede
            </label>
            <select
              value={sedeId}
              onChange={(e) => setSedeId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-sky-500 focus:border-sky-500 cursor-pointer"
            >
              <option value="">-- Seleccionar Sede --</option>
              {sedes.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Fecha Matrícula */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Fecha de Matrícula
            </label>
            <input
              type="date"
              value={fechaMatricula}
              onChange={(e) => setFechaMatricula(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
            />
          </div>

          {/* Estado de Matrícula */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Estado de Matrícula
            </label>
            <select
              value={estadoMatricula}
              onChange={(e) => setEstadoMatricula(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-sky-500 focus:border-sky-500 font-semibold cursor-pointer"
            >
              <option value="Activo">Activo</option>
              <option value="Inactivo">Inactivo</option>
              <option value="Retirado">Retirado</option>
              <option value="Reserva">Reserva</option>
              <option value="Completado">Completado</option>
            </select>
          </div>

          {/* Condición */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Condición de Ingreso / Matrícula
            </label>
            <select
              value={condicion}
              onChange={(e) => setCondicion(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-sky-500 focus:border-sky-500 cursor-pointer"
            >
              <option value="Nuevo">Nuevo</option>
              <option value="Ingresante">Ingresante</option>
              <option value="Continuo">Continuo</option>
              <option value="Regular">Regular</option>
              <option value="Reingreso">Reingreso</option>
              <option value="Reingresante">Reingresante</option>
              <option value="Traslado">Traslado</option>
              <option value="Gratuito">Gratuito</option>
              <option value="Exonerado">Exonerado</option>
            </select>
          </div>

          {/* Formación */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Formación
            </label>
            <select
              value={formacion}
              onChange={(e) => setFormacion(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-sky-500 focus:border-sky-500 cursor-pointer"
            >
              <option value="Presencial">Presencial</option>
              <option value="Semipresencial">Semipresencial</option>
              <option value="A distancia">A distancia</option>
              <option value="Dual">Dual</option>
            </select>
          </div>

          {/* Oportunidad Técnica */}
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Oportunidad Técnica (1 - 5)
            </label>
            <input
              type="number"
              min="1"
              max="5"
              value={oportunidadTecnica}
              onChange={(e) => setOportunidadTecnica(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
            />
          </div>

          {/* Condición Arancelaria y Beneficios */}
          <div className="md:col-span-2 p-3 bg-sky-50/70 border border-sky-200 rounded-xl space-y-2 mt-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-xs text-sky-900">
                <HeartHandshake className="w-4 h-4 text-sky-600" />
                <span>Condición Arancelaria y Beneficios (Convenios / Exoneraciones / Becas)</span>
              </div>
              {condicionArancelaria !== 'REGULAR' && (
                <span className="text-[10px] font-bold px-2 py-0.5 bg-sky-200 text-sky-800 rounded-md uppercase">
                  {condicionArancelaria === 'EXONERADO' ? 'Exoneración CONADIS / Ley' : 'Beneficio Activo'}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Condición Arancelaria:
                </label>
                <select
                  value={condicionArancelaria}
                  onChange={(e) => {
                    const val = e.target.value as TipoBeneficioArancelario;
                    setCondicionArancelaria(val);
                    if (val === 'EXONERADO' && !convenioNombre) {
                      setConvenioNombre('CONADIS / Discapacidad');
                    }
                  }}
                  className="w-full px-2.5 py-1.5 bg-white border border-sky-200 rounded-lg text-xs font-semibold focus:outline-none"
                >
                  <option value="REGULAR">Regular (Tarifa Ordinaria 100%)</option>
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
                      {condicionArancelaria === 'EXONERADO'
                        ? 'Tipo / Motivo de Exoneración:'
                        : 'Convenio / Entidad Aliada:'}
                    </label>
                    <input
                      type="text"
                      placeholder={
                        condicionArancelaria === 'EXONERADO'
                          ? 'Ej. CONADIS / Ley N° 29973'
                          : 'Ej. Convenio CRFA Huallabamba, Municipalidad...'
                      }
                      value={convenioNombre}
                      onChange={(e) => setConvenioNombre(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-sky-200 rounded-lg text-xs focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      {condicionArancelaria === 'EXONERADO'
                        ? 'Carné CONADIS o R.D. de Sustento:'
                        : 'R.D. o Documento de Sustento:'}
                    </label>
                    <input
                      type="text"
                      placeholder={
                        condicionArancelaria === 'EXONERADO'
                          ? 'Ej. Carné CONADIS N° 123456 / R.D. 045-2026'
                          : 'Ej. R.D. N° 045-2026-CETPRO-J'
                      }
                      value={resolucionSustento}
                      onChange={(e) => setResolucionSustento(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-sky-200 rounded-lg text-xs focus:outline-none"
                    />
                  </div>

                  {condicionArancelaria === 'CONVENIO' && (
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Tarifa Pactada en S/ (Opcional):
                      </label>
                      <input
                        type="number"
                        step="0.50"
                        placeholder="Ej. 20.00"
                        value={montoPactado}
                        onChange={(e) => setMontoPactado(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-sky-200 rounded-lg text-xs focus:outline-none"
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
};
