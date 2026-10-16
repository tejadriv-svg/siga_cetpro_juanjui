import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';
import { Seccion } from '../../types';

interface NuevaSeccionModalProps {
  isOpen: boolean;
  onClose: () => void;
  seccionToEdit?: Seccion | null;
}

export const NuevaSeccionModal: React.FC<NuevaSeccionModalProps> = ({ isOpen, onClose, seccionToEdit }) => {
  const {
    programas,
    modulos,
    trabajadores,
    personas,
    sedes,
    aulas,
    turnos,
    periodosClases,
    addSeccion,
    updateSeccion
  } = useApp();
  
  const [programaId, setProgramaId] = useState(programas[0]?.id || '');
  const [moduloId, setModuloId] = useState('');
  const [codigo, setCodigo] = useState('');
  const [nombre, setNombre] = useState('Sección A');
  const [sedeId, setSedeId] = useState('');
  const [aulaId, setAulaId] = useState('');
  const [turnoId, setTurnoId] = useState('');
  const [periodoClasesId, setPeriodoClasesId] = useState('');
  const [modalidadEducativa, setModalidadEducativa] = useState('Presencial');
  const [vacantes, setVacantes] = useState(30);
  const [trabajadorId, setTrabajadorId] = useState('');
  const [estado, setEstado] = useState('ACTIVO');

  useEffect(() => {
    if (sedes.length > 0 && !sedeId) setSedeId(sedes[0].id);
    if (turnos.length > 0 && !turnoId) setTurnoId(turnos[0].id);
    if (periodosClases.length > 0 && !periodoClasesId) setPeriodoClasesId(periodosClases[0].id);
  }, [sedes, turnos, periodosClases, sedeId, turnoId, periodoClasesId]);

  useEffect(() => {
    if (seccionToEdit) {
      const mod = modulos.find(m => m.id === seccionToEdit.moduloId);
      if (mod) setProgramaId(mod.programaId);
      setModuloId(seccionToEdit.moduloId);
      setCodigo(seccionToEdit.codigo || '');
      setNombre(seccionToEdit.nombre);
      setSedeId(seccionToEdit.sedeId || (sedes[0]?.id || ''));
      setAulaId(seccionToEdit.aulaId || '');
      setTurnoId(seccionToEdit.turnoId || (turnos[0]?.id || ''));
      setPeriodoClasesId(seccionToEdit.periodoClasesId || (periodosClases[0]?.id || ''));
      setModalidadEducativa(seccionToEdit.modalidadEducativa || 'Presencial');
      setVacantes(seccionToEdit.vacantes || seccionToEdit.capacidad || 30);
      setTrabajadorId(seccionToEdit.trabajadorId || '');
      setEstado(seccionToEdit.estado || 'ACTIVO');
    } else {
      setProgramaId(programas[0]?.id || '');
      setModuloId('');
      setCodigo('');
      setNombre('Sección A');
      setSedeId(sedes[0]?.id || '');
      setAulaId(aulas[0]?.id || '');
      setTurnoId(turnos[0]?.id || '');
      setPeriodoClasesId(periodosClases[0]?.id || '');
      setModalidadEducativa('Presencial');
      setVacantes(30);
      setTrabajadorId('');
      setEstado('ACTIVO');
    }
  }, [seccionToEdit, isOpen, modulos, programas, sedes, turnos, periodosClases, aulas]);

  const modulosDelPrograma = modulos.filter(m => m.programaId === programaId);
  const docentes = trabajadores.filter(t => t.cargo?.toLowerCase().includes('docente') || t.cargo === 'Docente' || t.cargo?.toLowerCase().includes('profesor') || true);
  const aulasFiltradas = sedeId ? aulas.filter(a => a.sedeId === sedeId) : aulas;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!moduloId) return;
    
    const selectedTurno = turnos.find(t => t.id === turnoId);
    const selectedAula = aulas.find(a => a.id === aulaId);
    const selectedSede = sedes.find(s => s.id === sedeId);

    if (seccionToEdit) {
      await updateSeccion({
        ...seccionToEdit,
        codigo: codigo || seccionToEdit.codigo,
        moduloId,
        planEstudioId: modulos.find(m => m.id === moduloId)?.planEstudioId,
        sedeId,
        aulaId,
        turnoId,
        periodoClasesId,
        modalidadEducativa,
        trabajadorId,
        nombre,
        turno: (selectedTurno?.nombre as any) || seccionToEdit.turno || 'Mañana',
        aula: selectedAula?.nombre || seccionToEdit.aula || 'Aula Taller',
        sedeNombre: selectedSede?.nombre || '',
        vacantes,
        capacidad: vacantes,
        estado: estado as any,
      });
    } else {
      await addSeccion({
        codigo: codigo || `SEC-${Math.floor(1000 + Math.random() * 9000)}`,
        moduloId,
        planEstudioId: modulos.find(m => m.id === moduloId)?.planEstudioId,
        sedeId,
        aulaId,
        turnoId,
        periodoClasesId,
        modalidadEducativa,
        trabajadorId,
        periodoAcademico: '2026-2',
        nombre,
        turno: (selectedTurno?.nombre as any) || 'Mañana',
        aula: selectedAula?.nombre || 'Aula Taller',
        sedeNombre: selectedSede?.nombre || '',
        vacantes,
        capacidad: vacantes,
        matriculados: 0,
        estado: estado as any,
      });
    }
    
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={seccionToEdit ? "Editar Sección Académica" : "Aperturar Nueva Sección Académica"}
      subtitle={seccionToEdit ? "Modificar los parámetros y asignaciones de la sección" : "Registrar una nueva sección con aula, turno, sede y docente"}
      actions={
        <>
          <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer">Cancelar</button>
          <button type="submit" form="nueva-seccion-form" className="px-4 py-2 bg-sky-600 hover:bg-sky-700 transition-colors text-white text-xs font-semibold rounded-xl cursor-pointer">
            {seccionToEdit ? "Guardar Cambios" : "Aperturar Sección"}
          </button>
        </>
      }
    >
      <form id="nueva-seccion-form" onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-500 font-semibold mb-1">Programa de Estudios</label>
            <select
              value={programaId}
              onChange={e => {
                setProgramaId(e.target.value);
                const firstMod = modulos.find(m => m.programaId === e.target.value);
                if (firstMod) setModuloId(firstMod.id);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-sky-500"
            >
              {programas.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
          </div>
          
          <div>
            <label className="block text-slate-500 font-semibold mb-1">Módulo Formativo *</label>
            <select
              required
              value={moduloId}
              onChange={e => setModuloId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-sky-500"
            >
              <option value="">Seleccione un módulo</option>
              {modulosDelPrograma.map(m => <option key={m.id} value={m.id}>{m.codigo} - {m.nombre}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-slate-500 font-semibold mb-1">Código de Sección</label>
            <input
              type="text"
              placeholder="Ej. SEC-2026-01"
              value={codigo}
              onChange={e => setCodigo(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-sky-500"
            />
          </div>
          <div>
            <label className="block text-slate-500 font-semibold mb-1">Nombre / Identificador *</label>
            <input
              required
              type="text"
              placeholder="Ej. Sección A"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-sky-500"
            />
          </div>
          <div>
            <label className="block text-slate-500 font-semibold mb-1">Modalidad</label>
            <select
              value={modalidadEducativa}
              onChange={e => setModalidadEducativa(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-sky-500"
            >
              <option value="Presencial">Presencial</option>
              <option value="Semipresencial">Semipresencial</option>
              <option value="A Distancia">A Distancia</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-slate-500 font-semibold mb-1">Sede / Filial</label>
            <select
              value={sedeId}
              onChange={e => {
                setSedeId(e.target.value);
                const matchingAulas = aulas.filter(a => a.sedeId === e.target.value);
                if (matchingAulas.length > 0) setAulaId(matchingAulas[0].id);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-sky-500"
            >
              {sedes.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-slate-500 font-semibold mb-1">Aula / Taller</label>
            <select
              value={aulaId}
              onChange={e => setAulaId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-sky-500"
            >
              <option value="">Seleccione aula/taller</option>
              {aulasFiltradas.map(a => <option key={a.id} value={a.id}>{a.codigo} - {a.nombre} ({a.tipoAmbiente})</option>)}
            </select>
          </div>

          <div>
            <label className="block text-slate-500 font-semibold mb-1">Turno</label>
            <select
              value={turnoId}
              onChange={e => setTurnoId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-sky-500"
            >
              {turnos.map(t => (
                <option key={t.id} value={t.id}>
                  {t.nombre} {t.horaInicioReferencial ? `(${t.horaInicioReferencial} - ${t.horaFinReferencial})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-slate-500 font-semibold mb-1">Periodo de Clases</label>
            <select
              value={periodoClasesId}
              onChange={e => setPeriodoClasesId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-sky-500"
            >
              {periodosClases.map(pc => <option key={pc.id} value={pc.id}>{pc.codigo} - {pc.nombre}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-slate-500 font-semibold mb-1">Vacantes / Capacidad</label>
            <input
              type="number"
              min="1"
              max="100"
              value={vacantes}
              onChange={e => setVacantes(Number(e.target.value))}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="block text-slate-500 font-semibold mb-1">Estado de Sección</label>
            <select
              value={estado.toLowerCase() === 'inactivo' ? 'Inactivo' : 'Activo'}
              onChange={e => setEstado(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-sky-500 font-medium"
            >
              <option value="Activo">Activo (Disponible)</option>
              <option value="Inactivo">Inactivo (Cerrada)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-slate-500 font-semibold mb-1">Docente Responsable Asignado</label>
          <select
            value={trabajadorId}
            onChange={e => setTrabajadorId(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-sky-500"
          >
            <option value="">-- Sin docente asignado --</option>
            {docentes.map(d => {
              const p = personas.find(x => x.id === d.personaId);
              return (
                <option key={d.id} value={d.id}>
                  {p ? `${p.apellidoPaterno} ${p.apellidoMaterno}, ${p.nombres} (DNI: ${p.numeroDocumento})` : `Trabajador: ${d.codigoTrabajador}`} - {d.cargo || 'Docente'}
                </option>
              );
            })}
          </select>
        </div>
      </form>
    </Modal>
  );
};
