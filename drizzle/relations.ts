import { relations } from "drizzle-orm/relations";
import { estadosAsistencias, asistenciasEstudiantes, matriculas, unidadesDidacticas, familiasProductivas, actividadesEconomicas, estudiantes, apoderadosEstudiantes, personas, periodosClases, asignacionesTrabajadores, secciones, trabajadores, asistenciasTrabajadores, usuarios, auditorias, competencias, capacidades, documentos, certificadosModulares, modulos, tiposDocumentosArchivos, efsrt, egresados, planesEstudios, programas, sectoresEconomicos, horarios, aulas, notasEfsrt, modulosCompetencias, periodosAcademicos, sedes, conceptosPagos, pagos, metodosPagos, cetpros, periodosLectivos, notasUnidades, personasRoles, rolesPersonas, nivelesFormativos, permisos, rolesPermisos, rolesSistemas, reingresos, turnos, retiros, traslados, unidadesCapacidades, usuariosRoles, certificadosEstudios, titulos, tramitesAdministrativos, bienesPatrimoniales, movimientosInventarios, documentosOficiales, tiposUnidades } from "./schema";

export const asistenciasEstudiantesRelations = relations(asistenciasEstudiantes, ({one}) => ({
	estadosAsistencia: one(estadosAsistencias, {
		fields: [asistenciasEstudiantes.estadoAsistenciaId],
		references: [estadosAsistencias.id]
	}),
	matricula: one(matriculas, {
		fields: [asistenciasEstudiantes.matriculaId],
		references: [matriculas.id]
	}),
	unidadesDidactica: one(unidadesDidacticas, {
		fields: [asistenciasEstudiantes.unidadId],
		references: [unidadesDidacticas.id]
	}),
}));

export const estadosAsistenciasRelations = relations(estadosAsistencias, ({many}) => ({
	asistenciasEstudiantes: many(asistenciasEstudiantes),
}));

export const matriculasRelations = relations(matriculas, ({one, many}) => ({
	asistenciasEstudiantes: many(asistenciasEstudiantes),
	certificadosModulares: many(certificadosModulares),
	egresados: many(egresados),
	notasEfsrts: many(notasEfsrt),
	estudiante: one(estudiantes, {
		fields: [matriculas.estudianteId],
		references: [estudiantes.id]
	}),
	modulo: one(modulos, {
		fields: [matriculas.moduloId],
		references: [modulos.id]
	}),
	periodosAcademico: one(periodosAcademicos, {
		fields: [matriculas.periodoAcademicoId],
		references: [periodosAcademicos.id]
	}),
	seccione: one(secciones, {
		fields: [matriculas.seccionId],
		references: [secciones.id]
	}),
	sede: one(sedes, {
		fields: [matriculas.sedeId],
		references: [sedes.id]
	}),
	pagos: many(pagos),
	notasUnidades: many(notasUnidades),
	reingresos_matriculaAnteriorId: many(reingresos, {
		relationName: "reingresos_matriculaAnteriorId_matriculas_id"
	}),
	reingresos_nuevaMatriculaId: many(reingresos, {
		relationName: "reingresos_nuevaMatriculaId_matriculas_id"
	}),
	retiros: many(retiros),
	traslados: many(traslados),
}));

export const unidadesDidacticasRelations = relations(unidadesDidacticas, ({one, many}) => ({
	asistenciasEstudiantes: many(asistenciasEstudiantes),
	asignacionesTrabajadores: many(asignacionesTrabajadores),
	notasUnidades: many(notasUnidades),
	unidadesCapacidades: many(unidadesCapacidades),
	modulo: one(modulos, {
		fields: [unidadesDidacticas.moduloId],
		references: [modulos.id]
	}),
	tiposUnidade: one(tiposUnidades, {
		fields: [unidadesDidacticas.tipoUnidadId],
		references: [tiposUnidades.id]
	}),
}));

export const actividadesEconomicasRelations = relations(actividadesEconomicas, ({one, many}) => ({
	familiasProductiva: one(familiasProductivas, {
		fields: [actividadesEconomicas.familiaProductivaId],
		references: [familiasProductivas.id]
	}),
	programas: many(programas),
}));

export const familiasProductivasRelations = relations(familiasProductivas, ({one, many}) => ({
	actividadesEconomicas: many(actividadesEconomicas),
	sectoresEconomico: one(sectoresEconomicos, {
		fields: [familiasProductivas.sectorEconomicoId],
		references: [sectoresEconomicos.id]
	}),
}));

export const apoderadosEstudiantesRelations = relations(apoderadosEstudiantes, ({one}) => ({
	estudiante: one(estudiantes, {
		fields: [apoderadosEstudiantes.estudianteId],
		references: [estudiantes.id]
	}),
	persona: one(personas, {
		fields: [apoderadosEstudiantes.personaId],
		references: [personas.id]
	}),
}));

export const estudiantesRelations = relations(estudiantes, ({one, many}) => ({
	apoderadosEstudiantes: many(apoderadosEstudiantes),
	certificadosModulares: many(certificadosModulares),
	persona: one(personas, {
		fields: [estudiantes.personaId],
		references: [personas.id]
	}),
	matriculas: many(matriculas),
	reingresos: many(reingresos),
	certificadosEstudios: many(certificadosEstudios),
	titulos: many(titulos),
}));

export const personasRelations = relations(personas, ({many}) => ({
	apoderadosEstudiantes: many(apoderadosEstudiantes),
	estudiantes: many(estudiantes),
	personasRoles: many(personasRoles),
	trabajadores: many(trabajadores),
	usuarios: many(usuarios),
	bienesPatrimoniales: many(bienesPatrimoniales),
}));

export const asignacionesTrabajadoresRelations = relations(asignacionesTrabajadores, ({one, many}) => ({
	periodosClase: one(periodosClases, {
		fields: [asignacionesTrabajadores.periodoClasesId],
		references: [periodosClases.id]
	}),
	seccione: one(secciones, {
		fields: [asignacionesTrabajadores.seccionId],
		references: [secciones.id]
	}),
	trabajadore: one(trabajadores, {
		fields: [asignacionesTrabajadores.trabajadorId],
		references: [trabajadores.id]
	}),
	unidadesDidactica: one(unidadesDidacticas, {
		fields: [asignacionesTrabajadores.unidadId],
		references: [unidadesDidacticas.id]
	}),
	horarios: many(horarios),
}));

export const periodosClasesRelations = relations(periodosClases, ({one, many}) => ({
	asignacionesTrabajadores: many(asignacionesTrabajadores),
	periodosAcademico: one(periodosAcademicos, {
		fields: [periodosClases.periodoAcademicoId],
		references: [periodosAcademicos.id]
	}),
	secciones: many(secciones),
}));

export const seccionesRelations = relations(secciones, ({one, many}) => ({
	asignacionesTrabajadores: many(asignacionesTrabajadores),
	horarios: many(horarios),
	matriculas: many(matriculas),
	aula: one(aulas, {
		fields: [secciones.aulaId],
		references: [aulas.id]
	}),
	modulo: one(modulos, {
		fields: [secciones.moduloId],
		references: [modulos.id]
	}),
	periodosClase: one(periodosClases, {
		fields: [secciones.periodoClasesId],
		references: [periodosClases.id]
	}),
	planesEstudio: one(planesEstudios, {
		fields: [secciones.planEstudioId],
		references: [planesEstudios.id]
	}),
	sede: one(sedes, {
		fields: [secciones.sedeId],
		references: [sedes.id]
	}),
	turno: one(turnos, {
		fields: [secciones.turnoId],
		references: [turnos.id]
	}),
	traslados: many(traslados),
	documentosOficiales: many(documentosOficiales),
}));

export const trabajadoresRelations = relations(trabajadores, ({one, many}) => ({
	asignacionesTrabajadores: many(asignacionesTrabajadores),
	asistenciasTrabajadores: many(asistenciasTrabajadores),
	persona: one(personas, {
		fields: [trabajadores.personaId],
		references: [personas.id]
	}),
}));

export const asistenciasTrabajadoresRelations = relations(asistenciasTrabajadores, ({one}) => ({
	trabajadore: one(trabajadores, {
		fields: [asistenciasTrabajadores.trabajadorId],
		references: [trabajadores.id]
	}),
	usuario: one(usuarios, {
		fields: [asistenciasTrabajadores.usuarioId],
		references: [usuarios.id]
	}),
}));

export const usuariosRelations = relations(usuarios, ({one, many}) => ({
	asistenciasTrabajadores: many(asistenciasTrabajadores),
	auditorias: many(auditorias),
	documentos: many(documentos),
	pagos: many(pagos),
	reingresos: many(reingresos),
	retiros: many(retiros),
	traslados: many(traslados),
	usuariosRoles: many(usuariosRoles),
	persona: one(personas, {
		fields: [usuarios.personaId],
		references: [personas.id]
	}),
	movimientosInventarios: many(movimientosInventarios),
}));

export const auditoriasRelations = relations(auditorias, ({one}) => ({
	usuario: one(usuarios, {
		fields: [auditorias.usuarioId],
		references: [usuarios.id]
	}),
}));

export const capacidadesRelations = relations(capacidades, ({one, many}) => ({
	competencia: one(competencias, {
		fields: [capacidades.competenciaId],
		references: [competencias.id]
	}),
	unidadesCapacidades: many(unidadesCapacidades),
}));

export const competenciasRelations = relations(competencias, ({many}) => ({
	capacidades: many(capacidades),
	modulosCompetencias: many(modulosCompetencias),
}));

export const certificadosModularesRelations = relations(certificadosModulares, ({one}) => ({
	documento: one(documentos, {
		fields: [certificadosModulares.documentoId],
		references: [documentos.id]
	}),
	estudiante: one(estudiantes, {
		fields: [certificadosModulares.estudianteId],
		references: [estudiantes.id]
	}),
	matricula: one(matriculas, {
		fields: [certificadosModulares.matriculaId],
		references: [matriculas.id]
	}),
	modulo: one(modulos, {
		fields: [certificadosModulares.moduloId],
		references: [modulos.id]
	}),
}));

export const documentosRelations = relations(documentos, ({one, many}) => ({
	certificadosModulares: many(certificadosModulares),
	tiposDocumentosArchivo: one(tiposDocumentosArchivos, {
		fields: [documentos.tipoDocumentoId],
		references: [tiposDocumentosArchivos.id]
	}),
	usuario: one(usuarios, {
		fields: [documentos.usuarioId],
		references: [usuarios.id]
	}),
	retiros: many(retiros),
	certificadosEstudios: many(certificadosEstudios),
	titulos: many(titulos),
	tramitesAdministrativos: many(tramitesAdministrativos),
	bienesPatrimoniales: many(bienesPatrimoniales),
	documentosOficiales: many(documentosOficiales),
}));

export const modulosRelations = relations(modulos, ({one, many}) => ({
	certificadosModulares: many(certificadosModulares),
	efsrts: many(efsrt),
	modulosCompetencias: many(modulosCompetencias),
	matriculas: many(matriculas),
	planesEstudio: one(planesEstudios, {
		fields: [modulos.planEstudioId],
		references: [planesEstudios.id]
	}),
	programa: one(programas, {
		fields: [modulos.programaId],
		references: [programas.id]
	}),
	secciones: many(secciones),
	traslados: many(traslados),
	unidadesDidacticas: many(unidadesDidacticas),
}));

export const tiposDocumentosArchivosRelations = relations(tiposDocumentosArchivos, ({many}) => ({
	documentos: many(documentos),
}));

export const efsrtRelations = relations(efsrt, ({one, many}) => ({
	modulo: one(modulos, {
		fields: [efsrt.moduloId],
		references: [modulos.id]
	}),
	notasEfsrts: many(notasEfsrt),
}));

export const egresadosRelations = relations(egresados, ({one, many}) => ({
	matricula: one(matriculas, {
		fields: [egresados.matriculaId],
		references: [matriculas.id]
	}),
	planesEstudio: one(planesEstudios, {
		fields: [egresados.planEstudioId],
		references: [planesEstudios.id]
	}),
	programa: one(programas, {
		fields: [egresados.programaId],
		references: [programas.id]
	}),
	titulos: many(titulos),
}));

export const planesEstudiosRelations = relations(planesEstudios, ({one, many}) => ({
	egresados: many(egresados),
	modulos: many(modulos),
	programa: one(programas, {
		fields: [planesEstudios.programaId],
		references: [programas.id]
	}),
	secciones: many(secciones),
	traslados: many(traslados),
	certificadosEstudios: many(certificadosEstudios),
	titulos: many(titulos),
}));

export const programasRelations = relations(programas, ({one, many}) => ({
	egresados: many(egresados),
	modulos: many(modulos),
	planesEstudios: many(planesEstudios),
	actividadesEconomica: one(actividadesEconomicas, {
		fields: [programas.actividadEconomicaId],
		references: [actividadesEconomicas.id]
	}),
	nivelesFormativo: one(nivelesFormativos, {
		fields: [programas.nivelFormativoId],
		references: [nivelesFormativos.id]
	}),
	traslados: many(traslados),
	certificadosEstudios: many(certificadosEstudios),
	titulos: many(titulos),
}));

export const sectoresEconomicosRelations = relations(sectoresEconomicos, ({many}) => ({
	familiasProductivas: many(familiasProductivas),
}));

export const horariosRelations = relations(horarios, ({one}) => ({
	asignacionesTrabajadore: one(asignacionesTrabajadores, {
		fields: [horarios.asignacionDocenteId],
		references: [asignacionesTrabajadores.id]
	}),
	aula: one(aulas, {
		fields: [horarios.aulaId],
		references: [aulas.id]
	}),
	seccione: one(secciones, {
		fields: [horarios.seccionId],
		references: [secciones.id]
	}),
}));

export const aulasRelations = relations(aulas, ({one, many}) => ({
	horarios: many(horarios),
	secciones: many(secciones),
	sede: one(sedes, {
		fields: [aulas.sedeId],
		references: [sedes.id]
	}),
	bienesPatrimoniales: many(bienesPatrimoniales),
	movimientosInventarios_destinoAulaId: many(movimientosInventarios, {
		relationName: "movimientosInventarios_destinoAulaId_aulas_id"
	}),
	movimientosInventarios_origenAulaId: many(movimientosInventarios, {
		relationName: "movimientosInventarios_origenAulaId_aulas_id"
	}),
}));

export const notasEfsrtRelations = relations(notasEfsrt, ({one}) => ({
	efsrt: one(efsrt, {
		fields: [notasEfsrt.efsrtId],
		references: [efsrt.id]
	}),
	matricula: one(matriculas, {
		fields: [notasEfsrt.matriculaId],
		references: [matriculas.id]
	}),
}));

export const modulosCompetenciasRelations = relations(modulosCompetencias, ({one}) => ({
	competencia: one(competencias, {
		fields: [modulosCompetencias.competenciaId],
		references: [competencias.id]
	}),
	modulo: one(modulos, {
		fields: [modulosCompetencias.moduloId],
		references: [modulos.id]
	}),
}));

export const periodosAcademicosRelations = relations(periodosAcademicos, ({one, many}) => ({
	matriculas: many(matriculas),
	periodosClases: many(periodosClases),
	periodosLectivo: one(periodosLectivos, {
		fields: [periodosAcademicos.periodoLectivoId],
		references: [periodosLectivos.id]
	}),
	documentosOficiales: many(documentosOficiales),
}));

export const sedesRelations = relations(sedes, ({one, many}) => ({
	matriculas: many(matriculas),
	secciones: many(secciones),
	traslados: many(traslados),
	aulas: many(aulas),
	cetpro: one(cetpros, {
		fields: [sedes.cetproId],
		references: [cetpros.id]
	}),
}));

export const pagosRelations = relations(pagos, ({one}) => ({
	conceptosPago: one(conceptosPagos, {
		fields: [pagos.conceptoPagoId],
		references: [conceptosPagos.id]
	}),
	matricula: one(matriculas, {
		fields: [pagos.matriculaId],
		references: [matriculas.id]
	}),
	metodosPago: one(metodosPagos, {
		fields: [pagos.metodoPagoId],
		references: [metodosPagos.id]
	}),
	usuario: one(usuarios, {
		fields: [pagos.usuarioId],
		references: [usuarios.id]
	}),
}));

export const conceptosPagosRelations = relations(conceptosPagos, ({many}) => ({
	pagos: many(pagos),
}));

export const metodosPagosRelations = relations(metodosPagos, ({many}) => ({
	pagos: many(pagos),
}));

export const periodosLectivosRelations = relations(periodosLectivos, ({one, many}) => ({
	cetpro: one(cetpros, {
		fields: [periodosLectivos.cetproId],
		references: [cetpros.id]
	}),
	periodosAcademicos: many(periodosAcademicos),
}));

export const cetprosRelations = relations(cetpros, ({many}) => ({
	periodosLectivos: many(periodosLectivos),
	sedes: many(sedes),
}));

export const notasUnidadesRelations = relations(notasUnidades, ({one}) => ({
	matricula: one(matriculas, {
		fields: [notasUnidades.matriculaId],
		references: [matriculas.id]
	}),
	unidadesDidactica: one(unidadesDidacticas, {
		fields: [notasUnidades.unidadId],
		references: [unidadesDidacticas.id]
	}),
}));

export const personasRolesRelations = relations(personasRoles, ({one}) => ({
	persona: one(personas, {
		fields: [personasRoles.personaId],
		references: [personas.id]
	}),
	rolesPersona: one(rolesPersonas, {
		fields: [personasRoles.rolPersonaId],
		references: [rolesPersonas.id]
	}),
}));

export const rolesPersonasRelations = relations(rolesPersonas, ({many}) => ({
	personasRoles: many(personasRoles),
}));

export const nivelesFormativosRelations = relations(nivelesFormativos, ({many}) => ({
	programas: many(programas),
}));

export const rolesPermisosRelations = relations(rolesPermisos, ({one}) => ({
	permiso: one(permisos, {
		fields: [rolesPermisos.permisoId],
		references: [permisos.id]
	}),
	rolesSistema: one(rolesSistemas, {
		fields: [rolesPermisos.rolSistemaId],
		references: [rolesSistemas.id]
	}),
}));

export const permisosRelations = relations(permisos, ({many}) => ({
	rolesPermisos: many(rolesPermisos),
}));

export const rolesSistemasRelations = relations(rolesSistemas, ({many}) => ({
	rolesPermisos: many(rolesPermisos),
	usuariosRoles: many(usuariosRoles),
}));

export const reingresosRelations = relations(reingresos, ({one}) => ({
	estudiante: one(estudiantes, {
		fields: [reingresos.estudianteId],
		references: [estudiantes.id]
	}),
	matricula_matriculaAnteriorId: one(matriculas, {
		fields: [reingresos.matriculaAnteriorId],
		references: [matriculas.id],
		relationName: "reingresos_matriculaAnteriorId_matriculas_id"
	}),
	matricula_nuevaMatriculaId: one(matriculas, {
		fields: [reingresos.nuevaMatriculaId],
		references: [matriculas.id],
		relationName: "reingresos_nuevaMatriculaId_matriculas_id"
	}),
	usuario: one(usuarios, {
		fields: [reingresos.usuarioId],
		references: [usuarios.id]
	}),
}));

export const turnosRelations = relations(turnos, ({many}) => ({
	secciones: many(secciones),
}));

export const retirosRelations = relations(retiros, ({one}) => ({
	documento: one(documentos, {
		fields: [retiros.documentoId],
		references: [documentos.id]
	}),
	matricula: one(matriculas, {
		fields: [retiros.matriculaId],
		references: [matriculas.id]
	}),
	usuario: one(usuarios, {
		fields: [retiros.usuarioId],
		references: [usuarios.id]
	}),
}));

export const trasladosRelations = relations(traslados, ({one}) => ({
	matricula: one(matriculas, {
		fields: [traslados.matriculaOrigenId],
		references: [matriculas.id]
	}),
	modulo: one(modulos, {
		fields: [traslados.moduloDestinoId],
		references: [modulos.id]
	}),
	planesEstudio: one(planesEstudios, {
		fields: [traslados.planEstudioDestinoId],
		references: [planesEstudios.id]
	}),
	programa: one(programas, {
		fields: [traslados.programaDestinoId],
		references: [programas.id]
	}),
	seccione: one(secciones, {
		fields: [traslados.seccionDestinoId],
		references: [secciones.id]
	}),
	sede: one(sedes, {
		fields: [traslados.sedeDestinoId],
		references: [sedes.id]
	}),
	usuario: one(usuarios, {
		fields: [traslados.usuarioId],
		references: [usuarios.id]
	}),
}));

export const unidadesCapacidadesRelations = relations(unidadesCapacidades, ({one}) => ({
	capacidade: one(capacidades, {
		fields: [unidadesCapacidades.capacidadId],
		references: [capacidades.id]
	}),
	unidadesDidactica: one(unidadesDidacticas, {
		fields: [unidadesCapacidades.unidadId],
		references: [unidadesDidacticas.id]
	}),
}));

export const usuariosRolesRelations = relations(usuariosRoles, ({one}) => ({
	rolesSistema: one(rolesSistemas, {
		fields: [usuariosRoles.rolSistemaId],
		references: [rolesSistemas.id]
	}),
	usuario: one(usuarios, {
		fields: [usuariosRoles.usuarioId],
		references: [usuarios.id]
	}),
}));

export const certificadosEstudiosRelations = relations(certificadosEstudios, ({one}) => ({
	documento: one(documentos, {
		fields: [certificadosEstudios.documentoId],
		references: [documentos.id]
	}),
	estudiante: one(estudiantes, {
		fields: [certificadosEstudios.estudianteId],
		references: [estudiantes.id]
	}),
	planesEstudio: one(planesEstudios, {
		fields: [certificadosEstudios.planEstudioId],
		references: [planesEstudios.id]
	}),
	programa: one(programas, {
		fields: [certificadosEstudios.programaId],
		references: [programas.id]
	}),
}));

export const titulosRelations = relations(titulos, ({one}) => ({
	documento: one(documentos, {
		fields: [titulos.documentoId],
		references: [documentos.id]
	}),
	egresado: one(egresados, {
		fields: [titulos.egresadoId],
		references: [egresados.id]
	}),
	estudiante: one(estudiantes, {
		fields: [titulos.estudianteId],
		references: [estudiantes.id]
	}),
	planesEstudio: one(planesEstudios, {
		fields: [titulos.planEstudioId],
		references: [planesEstudios.id]
	}),
	programa: one(programas, {
		fields: [titulos.programaId],
		references: [programas.id]
	}),
}));

export const tramitesAdministrativosRelations = relations(tramitesAdministrativos, ({one}) => ({
	documento: one(documentos, {
		fields: [tramitesAdministrativos.documentoId],
		references: [documentos.id]
	}),
}));

export const bienesPatrimonialesRelations = relations(bienesPatrimoniales, ({one, many}) => ({
	aula: one(aulas, {
		fields: [bienesPatrimoniales.aulaId],
		references: [aulas.id]
	}),
	persona: one(personas, {
		fields: [bienesPatrimoniales.custodioId],
		references: [personas.id]
	}),
	documento: one(documentos, {
		fields: [bienesPatrimoniales.documentoIngresoId],
		references: [documentos.id]
	}),
	movimientosInventarios: many(movimientosInventarios),
}));

export const movimientosInventariosRelations = relations(movimientosInventarios, ({one}) => ({
	bienesPatrimoniale: one(bienesPatrimoniales, {
		fields: [movimientosInventarios.bienId],
		references: [bienesPatrimoniales.bienId]
	}),
	aula_destinoAulaId: one(aulas, {
		fields: [movimientosInventarios.destinoAulaId],
		references: [aulas.id],
		relationName: "movimientosInventarios_destinoAulaId_aulas_id"
	}),
	aula_origenAulaId: one(aulas, {
		fields: [movimientosInventarios.origenAulaId],
		references: [aulas.id],
		relationName: "movimientosInventarios_origenAulaId_aulas_id"
	}),
	usuario: one(usuarios, {
		fields: [movimientosInventarios.usuarioId],
		references: [usuarios.id]
	}),
}));

export const documentosOficialesRelations = relations(documentosOficiales, ({one}) => ({
	documento: one(documentos, {
		fields: [documentosOficiales.documentoId],
		references: [documentos.id]
	}),
	periodosAcademico: one(periodosAcademicos, {
		fields: [documentosOficiales.periodoAcademicoId],
		references: [periodosAcademicos.id]
	}),
	seccione: one(secciones, {
		fields: [documentosOficiales.seccionId],
		references: [secciones.id]
	}),
}));

export const tiposUnidadesRelations = relations(tiposUnidades, ({many}) => ({
	unidadesDidacticas: many(unidadesDidacticas),
}));