import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import { Printer, Download, Users, Trash2, Eye, AlertTriangle, User, FileText } from 'lucide-react';
import { Matricula } from '../../types';
import { FichaMatriculaPrint } from './FichaMatriculaPrint';
import { NominaMatriculaPrint } from './NominaMatriculaPrint';
import { comparePersonasAlphabetical } from '../../utils/sortPersonas';

interface NominaSeccionModalProps {
  seccionId: string | null;
  onClose: () => void;
}

export const NominaSeccionModal: React.FC<NominaSeccionModalProps> = ({ seccionId, onClose }) => {
  const {
    secciones,
    modulos,
    programas,
    matriculas,
    estudiantes,
    personas,
    deleteMatricula,
    setSelectedEstudianteId,
  } = useApp();

  const [matriculaToDelete, setMatriculaToDelete] = useState<Matricula | null>(null);
  const [selectedMatriculaIdToPrint, setSelectedMatriculaIdToPrint] = useState<string | null>(null);
  const [isNominaOficialOpen, setIsNominaOficialOpen] = useState(false);

  if (!seccionId) return null;

  const seccion = secciones.find((s) => s.id === seccionId);
  if (!seccion) return null;

  const modulo = modulos.find((m) => m.id === seccion.moduloId);
  const programa = programas.find((p) => p.id === modulo?.programaId);

  const matriculadosEnSeccion = matriculas
    .filter((m) => {
      if (m.seccionId !== seccion.id) return false;
      if (!m.estadoMatricula) return true;
      const st = m.estadoMatricula.toUpperCase();
      return st === 'MATRICULADO' || st === 'REGULAR' || st === 'ACTIVA' || st === 'ACTIVO' || st === 'PROCESO' || st === 'CERTIFICADO';
    })
    .sort((a, b) => new Date(a.fechaMatricula).getTime() - new Date(b.fechaMatricula).getTime());

  // Mapear con datos de la persona
  const nominaData = matriculadosEnSeccion
    .map((mat) => {
      const est = estudiantes.find((e) => e.id === mat.estudianteId);
      const persona = est ? personas.find((p) => p.id === est.personaId) : null;
      return {
        matricula: mat,
        estudiante: est,
        persona: persona,
      };
    })
    .sort((a, b) => comparePersonasAlphabetical(a.persona, b.persona));

  const handleConfirmDelete = async () => {
    if (!matriculaToDelete) return;
    await deleteMatricula(matriculaToDelete.id);
    setMatriculaToDelete(null);
  };

  return (
    <>
      <Modal
        isOpen={!!seccionId}
        onClose={onClose}
        title="Nómina de Matriculados"
        subtitle={`${programa?.nombre || 'Programa'} / ${modulo?.nombre || 'Módulo'} - ${seccion.nombre}`}
        maxWidth="4xl"
        actions={
          <>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cerrar
            </button>
            <button
              type="button"
              onClick={() => setIsNominaOficialOpen(true)}
              className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
              title="Generar formato oficial MINEDU A4"
            >
              <FileText className="w-4 h-4" />
              <span>Nómina Oficial MINEDU (A4)</span>
            </button>
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Rápido</span>
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Vacantes y Ocupación:</span>
              <span className="font-bold text-slate-900 font-mono text-sm">
                {matriculadosEnSeccion.length} / {seccion.vacantes || 30} Alumnos Inscritos
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Turno:</span>
              <span className="font-semibold text-slate-800">{seccion.turno || 'Regular'}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">Aula / Taller:</span>
              <span className="font-semibold text-slate-800">{seccion.aula || 'Principal'}</span>
            </div>
          </div>

          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-4 py-3 w-12 text-center">N°</th>
                    <th className="px-4 py-3">Código / DNI</th>
                    <th className="px-4 py-3">Apellidos y Nombres</th>
                    <th className="px-4 py-3">Condición</th>
                    <th className="px-4 py-3">Fecha Matrícula</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {nominaData.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-slate-500 font-medium">
                        No hay estudiantes matriculados en esta sección.
                      </td>
                    </tr>
                  ) : (
                    nominaData.map((row, index) => (
                      <tr key={row.matricula.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-3 text-center text-slate-400 font-medium font-mono">{index + 1}</td>
                        <td className="px-4 py-3 font-mono text-slate-700 font-bold">
                          {row.persona?.numeroDocumento || row.matricula.codigoMatricula}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => {
                              if (row.estudiante) setSelectedEstudianteId(row.estudiante.id);
                            }}
                            className="font-bold text-slate-900 hover:text-blue-600 transition-colors text-left cursor-pointer"
                            title="Ver expediente del estudiante"
                          >
                            {row.persona?.apellidoPaterno} {row.persona?.apellidoMaterno}, {row.persona?.nombres}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="neutral" size="sm">
                            {row.matricula.tipo || row.matricula.condicion || 'Regular'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">{row.matricula.fechaMatricula}</td>
                        <td className="px-4 py-3">
                          <Badge variant="success" size="sm" dot>
                            {row.matricula.estado}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setSelectedMatriculaIdToPrint(row.matricula.id)}
                              className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                              title="Ver Ficha Oficial de Matrícula"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {row.estudiante && (
                              <button
                                type="button"
                                onClick={() => setSelectedEstudianteId(row.estudiante!.id)}
                                className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                                title="Ver Expediente / Perfil del Estudiante"
                              >
                                <User className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setMatriculaToDelete(row.matricula)}
                              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Retirar matrícula de la sección"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </Modal>

      {/* Confirmation Modal to Delete Enrollment */}
      {matriculaToDelete && (
        <Modal
          isOpen={!!matriculaToDelete}
          onClose={() => setMatriculaToDelete(null)}
          title="Retirar Matrícula de la Sección"
          subtitle="Confirmar desvinculación"
          maxWidth="md"
          zIndex="z-[60]"
          actions={
            <>
              <button
                type="button"
                onClick={() => setMatriculaToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Retirar Matrícula</span>
              </button>
            </>
          }
        >
          <div className="space-y-3 text-xs text-slate-700">
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-rose-900">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-xs">¿Deseas retirar a este estudiante de la sección?</p>
                <p className="text-[11px] text-rose-700 mt-0.5">
                  Se liberará una vacante en la sección <strong>{seccion.nombre}</strong>.
                </p>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Ficha Oficial de Matrícula (Vista e Impresión) */}
      {selectedMatriculaIdToPrint && (
        <FichaMatriculaPrint
          isOpen={!!selectedMatriculaIdToPrint}
          onClose={() => setSelectedMatriculaIdToPrint(null)}
          matriculaId={selectedMatriculaIdToPrint}
          zIndex="z-[60]"
        />
      )}

      {/* Nómina Oficial de Matrícula MINEDU (A4) */}
      {isNominaOficialOpen && (
        <NominaMatriculaPrint
          isOpen={isNominaOficialOpen}
          onClose={() => setIsNominaOficialOpen(false)}
          seccionId={seccionId}
        />
      )}
    </>
  );
};
