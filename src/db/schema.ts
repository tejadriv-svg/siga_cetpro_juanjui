import { pgTable, index, foreignKey, unique, uuid, date, text, varchar, uniqueIndex, boolean, check, integer, time, timestamp, jsonb, bigint, numeric, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const estadoActInact = pgEnum("estado_act_inact", ['Activo', 'Inactivo'])
export const estadoConservacion = pgEnum("estado_conservacion", ['OPERATIVO', 'MANTENIMIENTO', 'BAJA'])
export const tipoArchivo = pgEnum("tipo_archivo", ['RESOLUCION', 'FICHA_MATRICULA', 'MEMO', 'OFICIO', 'CERTIFICADO', 'TITULO', 'CONSTANCIA', 'CONVENIO', 'ACTA', 'SOLICITUD', 'PATRIMONIAL', 'OTRO'])
export const tipoDiscapacidadEnum = pgEnum("tipo_discapacidad_enum", ['Intelectual leve', 'Intelectual moderada', 'Intelectual severa', 'Auditiva hipoacusia', 'Auditiva sordera', 'Visual baja visión', 'Visual ceguera', 'Físico Motora', 'Trastorno del espectro autista', 'Sordo ceguera', 'Multidiscapacidad', 'Otra discapacidad'])
export const tipoDoc = pgEnum("tipo_doc", ['DNI', 'CE', 'PAS', 'RUC'])
export const tipoEstadoCivil = pgEnum("tipo_estado_civil", ['Soltero(a)', 'Casado(a)', 'Conviviente', 'Divorciado(a)', 'Viudo(a)', 'Juntadito(a)'])
export const tipoGenero = pgEnum("tipo_genero", ['H', 'M'])
export const tipoMovimientoInv = pgEnum("tipo_movimiento_inv", ['INGRESO', 'ASIGNACION', 'TRASLADO', 'MANTENIMIENTO', 'BAJA'])
export const tipoNivelEducativo = pgEnum("tipo_nivel_educativo", ['Superior universitaria', 'Superior pedagógica', 'Superior tecnológica', 'Superior técnica', 'Secundaria completa', 'Secundaria incompleta', 'Primaria completa', 'Primaria incompleta', 'Sin educación formal'])
export const tipoOperadorTelefonicoEnum = pgEnum("tipo_operador_telefonico_enum", ['Movistar', 'Claro', 'Entel', 'Bitel', 'Otro'])
export const tipoRegistroMinedu = pgEnum("tipo_registro_minedu", ['NOMINA_MATRICULA', 'ACTA_EVALUACION', 'CONSOLIDADO_NOTAS'])
export const tipoTramiteAdmin = pgEnum("tipo_tramite_admin", ['OFICIO', 'MEMORANDUM', 'INFORME', 'CARTA_MULTIPLE'])
export const tipoUnidad = pgEnum("tipo_unidad", ['Técnica', 'Empleabilidad'])


export const asistenciasEstudiantes = pgTable("asistencias_estudiantes", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	matriculaId: uuid("matricula_id").notNull(),
	unidadId: uuid("unidad_id"),
	seccionId: uuid("seccion_id"),
	fecha: date().notNull(),
	estadoAsistenciaId: uuid("estado_asistencia_id").notNull(),
	observacion: text(),
	usuarioId: uuid("usuario_id"),
}, (table) => [
	index("idx_asistencias_estudiantes_matricula_fecha").using("btree", table.matriculaId.asc().nullsLast().op("uuid_ops"), table.fecha.asc().nullsLast().op("date_ops")),
	index("idx_asistencias_estudiantes_seccion_fecha").using("btree", table.seccionId.asc().nullsLast().op("uuid_ops"), table.fecha.asc().nullsLast().op("date_ops")),
	index("idx_asistencias_estudiantes_matricula_unidad").using("btree", table.matriculaId.asc().nullsLast().op("uuid_ops"), table.unidadId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.estadoAsistenciaId],
			foreignColumns: [estadosAsistencias.id],
			name: "asistencias_estudiantes_estado_asistencia_id_fkey"
		}),
	foreignKey({
			columns: [table.matriculaId],
			foreignColumns: [matriculas.id],
			name: "asistencias_estudiantes_matricula_id_fkey"
		}),
	foreignKey({
			columns: [table.unidadId],
			foreignColumns: [unidadesDidacticas.id],
			name: "asistencias_estudiantes_unidad_id_fkey"
		}),
	foreignKey({
			columns: [table.seccionId],
			foreignColumns: [secciones.id],
			name: "asistencias_estudiantes_seccion_id_fkey"
		}),
	unique("asistencias_estudiantes_unique").on(table.matriculaId, table.unidadId, table.fecha),
]);

export const actividadesEconomicas = pgTable("actividades_economicas", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	familiaProductivaId: uuid("familia_productiva_id").notNull(),
	codigo: varchar({ length: 30 }).notNull(),
	nombre: varchar({ length: 200 }).notNull(),
	descripcion: text(),
}, (table) => [
	index("idx_actividades_familia").using("btree", table.familiaProductivaId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.familiaProductivaId],
			foreignColumns: [familiasProductivas.id],
			name: "actividades_economicas_familia_productiva_id_fkey"
		}),
	unique("actividades_economicas_codigo_key").on(table.codigo),
]);

export const apoderadosEstudiantes = pgTable("apoderados_estudiantes", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	estudianteId: uuid("estudiante_id").notNull(),
	personaId: uuid("persona_id").notNull(),
	parentesco: varchar({ length: 100 }).notNull(),
	esApoderadoPrincipal: boolean("es_apoderado_principal").default(false).notNull(),
	viveConEstudiante: boolean("vive_con_estudiante"),
}, (table) => [
	uniqueIndex("uq_apoderado_activo").using("btree", table.estudianteId.asc().nullsLast().op("uuid_ops"), table.personaId.asc().nullsLast().op("uuid_ops")),
	uniqueIndex("uq_apoderado_principal_activo").using("btree", table.estudianteId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.estudianteId],
			foreignColumns: [estudiantes.id],
			name: "apoderados_estudiantes_estudiante_id_fkey"
		}),
	foreignKey({
			columns: [table.personaId],
			foreignColumns: [personas.id],
			name: "apoderados_estudiantes_persona_id_fkey"
		}),
]);

export const asignacionesTrabajadores = pgTable("asignaciones_trabajadores", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	trabajadorId: uuid("trabajador_id").notNull(),
	seccionId: uuid("seccion_id").notNull(),
	unidadId: uuid("unidad_id"),
	periodoClasesId: uuid("periodo_clases_id").notNull(),
	horasAsignadas: integer("horas_asignadas"),
}, (table) => [
	index("idx_asignaciones_trabajador_periodo").using("btree", table.trabajadorId.asc().nullsLast().op("uuid_ops"), table.periodoClasesId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.periodoClasesId],
			foreignColumns: [periodosClases.id],
			name: "asignaciones_trabajadores_periodo_clases_id_fkey"
		}),
	foreignKey({
			columns: [table.seccionId],
			foreignColumns: [secciones.id],
			name: "asignaciones_trabajadores_seccion_id_fkey"
		}),
	foreignKey({
			columns: [table.trabajadorId],
			foreignColumns: [trabajadores.id],
			name: "asignaciones_trabajadores_trabajador_id_fkey"
		}),
	foreignKey({
			columns: [table.unidadId],
			foreignColumns: [unidadesDidacticas.id],
			name: "asignaciones_trabajadores_unidad_id_fkey"
		}),
	check("asignaciones_trabajadores_horas_check", sql`(horas_asignadas IS NULL) OR (horas_asignadas > 0)`),
]);

export const asistenciasTrabajadores = pgTable("asistencias_trabajadores", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	trabajadorId: uuid("trabajador_id").notNull(),
	fecha: date().notNull(),
	horaEntrada: time("hora_entrada"),
	horaSalida: time("hora_salida"),
	estadoAsistencia: varchar("estado_asistencia", { length: 50 }).default('PRESENTE'),
	observacion: text(),
	usuarioId: uuid("usuario_id"),
	minutosTardanza: integer("minutos_tardanza").default(0).notNull(),
	tipoRegistro: varchar("tipo_registro", { length: 30 }).default('MANUAL').notNull(),
}, (table) => [
	index("idx_asistencias_trabajadores_fecha").using("btree", table.fecha.asc().nullsLast().op("date_ops")),
	index("idx_asistencias_trabajadores_trabajador_fecha").using("btree", table.trabajadorId.asc().nullsLast().op("uuid_ops"), table.fecha.asc().nullsLast().op("date_ops")),
	foreignKey({
			columns: [table.trabajadorId],
			foreignColumns: [trabajadores.id],
			name: "asistencias_trabajadores_trabajador_id_fkey"
		}),
	foreignKey({
			columns: [table.usuarioId],
			foreignColumns: [usuarios.id],
			name: "asistencias_trabajadores_usuario_id_fkey"
		}),
	unique("asistencias_trabajadores_unique").on(table.trabajadorId, table.fecha),
]);

export const auditorias = pgTable("auditorias", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	usuarioId: uuid("usuario_id"),
	fechaHora: timestamp("fecha_hora", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	accion: varchar({ length: 50 }).notNull(),
	tabla: varchar({ length: 150 }).notNull(),
	registroId: uuid("registro_id"),
	datosAnteriores: jsonb("datos_anteriores"),
	datosNuevos: jsonb("datos_nuevos"),
	ip: varchar({ length: 64 }),
	userAgent: text("user_agent"),
}, (table) => [
	index("idx_auditoria_usuario_fecha").using("btree", table.usuarioId.asc().nullsLast().op("timestamptz_ops"), table.fechaHora.asc().nullsLast().op("timestamptz_ops")),
	index("idx_auditorias_fecha_hora").using("btree", table.fechaHora.desc().nullsLast()),
	index("idx_auditorias_tabla").using("btree", table.tabla.asc().nullsLast()),
	index("idx_auditorias_accion").using("btree", table.accion.asc().nullsLast()),
	index("idx_auditorias_registro_id").using("btree", table.registroId.asc().nullsLast()),
	index("idx_auditorias_tabla_fecha").using("btree", table.tabla.asc().nullsLast(), table.fechaHora.desc().nullsLast()),
	foreignKey({
			columns: [table.usuarioId],
			foreignColumns: [usuarios.id],
			name: "auditoria_usuario_id_fkey"
		}).onDelete("set null"),
]);

export const capacidades = pgTable("capacidades", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	competenciaId: uuid("competencia_id").notNull(),
	codigo: varchar({ length: 50 }).notNull(),
	nombre: text().notNull(),
	descripcion: text(),
	orden: integer().default(1).notNull(),
}, (table) => [
	index("idx_capacidades_competencia").using("btree", table.competenciaId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.competenciaId],
			foreignColumns: [competencias.id],
			name: "capacidades_competencia_id_fkey"
		}),
	unique("capacidades_codigo_key").on(table.codigo),
	check("capacidades_orden_check", sql`orden > 0`),
]);

export const certificadosModulares = pgTable("certificados_modulares", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	estudianteId: uuid("estudiante_id").notNull(),
	moduloId: uuid("modulo_id").notNull(),
	programaId: uuid("programa_id"),
	matriculaId: uuid("matricula_id"),
	numeroCertificado: varchar("numero_certificado", { length: 100 }).notNull(),
	codigoCertificado: varchar("codigo_certificado", { length: 50 }),
	fechaEmision: date("fecha_emision").default(sql`CURRENT_DATE`).notNull(),
	horasModulo: integer("horas_modulo"),
	creditosModulo: numeric("creditos_modulo", { precision: 5, scale: 2 }),
	promedioUnidades: numeric("promedio_unidades", { precision: 4, scale: 2 }),
	notaEfsrt: numeric("nota_efsrt", { precision: 4, scale: 2 }),
	promedioFinal: numeric("promedio_final", { precision: 4, scale: 2 }),
	detalleCalificaciones: jsonb("detalle_calificaciones"),
	resolucionDirectoral: varchar("resolucion_directoral", { length: 120 }),
	tomoFolio: varchar("tomo_folio", { length: 100 }),
	codigoVerificacionQr: text("codigo_verificacion_qr"),
	hashSeguridad: varchar("hash_seguridad", { length: 64 }),
	estado: varchar("estado", { length: 30 }).default('EMITIDO').notNull(),
	fechaEntrega: date("fecha_entrega"),
	documentoId: uuid("documento_id"),
	observaciones: text(),
	usuarioId: uuid("usuario_id"),
	fechaRegistro: timestamp("fecha_registro", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	fechaActualizacion: timestamp("fecha_actualizacion", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	index("idx_cert_mod_estudiante").using("btree", table.estudianteId.asc().nullsLast()),
	index("idx_cert_mod_modulo").using("btree", table.moduloId.asc().nullsLast()),
	index("idx_cert_mod_programa").using("btree", table.programaId.asc().nullsLast()),
	index("idx_cert_mod_estado").using("btree", table.estado.asc().nullsLast()),
	foreignKey({
			columns: [table.documentoId],
			foreignColumns: [documentos.id],
			name: "certificados_modulares_documento_id_fkey"
		}),
	foreignKey({
			columns: [table.estudianteId],
			foreignColumns: [estudiantes.id],
			name: "certificados_modulares_estudiante_id_fkey"
		}),
	foreignKey({
			columns: [table.matriculaId],
			foreignColumns: [matriculas.id],
			name: "certificados_modulares_matricula_id_fkey"
		}),
	foreignKey({
			columns: [table.moduloId],
			foreignColumns: [modulos.id],
			name: "certificados_modulares_modulo_id_fkey"
		}),
	foreignKey({
			columns: [table.programaId],
			foreignColumns: [programas.id],
			name: "certificados_modulares_programa_id_fkey"
		}),
	foreignKey({
			columns: [table.usuarioId],
			foreignColumns: [usuarios.id],
			name: "certificados_modulares_usuario_id_fkey"
		}),
	unique("certificados_modulares_numero_key").on(table.numeroCertificado),
	unique("certificados_modulares_estudiante_modulo_key").on(table.estudianteId, table.moduloId),
]);

export const documentos = pgTable("documentos", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	tipoDocumentoId: uuid("tipo_documento_id").notNull(),
	numeroDocumento: varchar("numero_documento", { length: 100 }).unique(),
	titulo: varchar("titulo", { length: 255 }),
	entidadEmisora: varchar("entidad_emisora", { length: 200 }).default('CENTRO DE EDUCACIÓN TÉCNICO PRODUCTIVA JUANJUÍ'),
	destinatario: varchar("destinatario", { length: 255 }),
	fechaEmision: date("fecha_emision").default(sql`CURRENT_DATE`),
	estado: varchar("estado", { length: 30 }).default('EMITIDO'),
	tomoFolio: varchar("tomo_folio", { length: 100 }),
	codigoVerificacionQr: text("codigo_verificacion_qr"),
	estudianteId: uuid("estudiante_id"),
	trabajadorId: uuid("trabajador_id"),
	programaId: uuid("programa_id"),
	moduloId: uuid("modulo_id"),
	periodoAcademicoId: uuid("periodo_academico_id"),
	confidencialidad: varchar("confidencialidad", { length: 20 }).default('PUBLICO'),
	nombreArchivo: varchar("nombre_archivo", { length: 250 }),
	rutaStorage: text("ruta_storage"),
	mimeType: varchar("mime_type", { length: 100 }),
	tamanoBytes: bigint("tamano_bytes", { mode: "number" }),
	hashArchivo: varchar("hash_archivo", { length: 128 }),
	fechaCarga: timestamp("fecha_carga", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	fechaActualizacion: timestamp("fecha_actualizacion", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	usuarioId: uuid("usuario_id"),
	observaciones: text(),
}, (table) => [
	index("idx_documentos_numero").using("btree", table.numeroDocumento.asc().nullsLast()),
	index("idx_documentos_estudiante").using("btree", table.estudianteId.asc().nullsLast()),
	index("idx_documentos_fecha_emision").using("btree", table.fechaEmision.asc().nullsLast()),
	index("idx_documentos_estado").using("btree", table.estado.asc().nullsLast()),
	index("idx_documentos_tipo_fecha").using("btree", table.tipoDocumentoId.asc().nullsLast(), table.fechaCarga.asc().nullsLast()),
	foreignKey({
			columns: [table.tipoDocumentoId],
			foreignColumns: [tiposDocumentosArchivos.id],
			name: "documentos_tipo_documento_id_fkey"
		}),
	foreignKey({
			columns: [table.usuarioId],
			foreignColumns: [usuarios.id],
			name: "documentos_usuario_id_fkey"
		}),
]);

export const efsrt = pgTable("efsrt", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	moduloId: uuid("modulo_id").notNull(),
	codigo: varchar({ length: 50 }).notNull(),
	nombre: varchar({ length: 250 }).notNull(),
	descripcion: text(),
	creditos: numeric({ precision: 8, scale:  2 }),
	horas: integer(),
	orden: integer().default(1).notNull(),
}, (table) => [
	index("idx_efsrt_modulo").using("btree", table.moduloId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.moduloId],
			foreignColumns: [modulos.id],
			name: "efsrt_modulo_id_fkey"
		}),
	unique("efsrt_codigo_key").on(table.codigo),
	check("efsrt_creditos_check", sql`(creditos IS NULL) OR (creditos >= (0)::numeric)`),
	check("efsrt_horas_check", sql`(horas IS NULL) OR (horas >= 0)`),
	check("efsrt_orden_check", sql`orden > 0`),
]);

export const egresados = pgTable("egresados", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	estudianteId: uuid("estudiante_id").notNull(),
	programaId: uuid("programa_id").notNull(),
	planEstudioId: uuid("plan_estudio_id").notNull(),
	matriculaId: uuid("matricula_id"),
	codigoEgresado: varchar("codigo_egresado", { length: 50 }),
	fechaEgreso: date("fecha_egreso").notNull(),
	estadoTramite: varchar("estado_tramite", { length: 40 }).default('EGRESADO').notNull(),
	totalCreditosAprobados: numeric("total_creditos_aprobados", { precision: 6, scale: 2 }),
	totalHorasAcumuladas: integer("total_horas_acumuladas"),
	resolucionDirectoral: varchar("resolucion_directoral", { length: 120 }),
	tomoFolio: varchar("tomo_folio", { length: 100 }),
	codigoVerificacionQr: text("codigo_verificacion_qr"),
	hashSeguridad: varchar("hash_seguridad", { length: 64 }),
	modalidadTitulacion: varchar("modalidad_titulacion", { length: 50 }),
	fechaSustentacion: date("fecha_sustentacion"),
	calificacionTitulacion: numeric("calificacion_titulacion", { precision: 4, scale: 2 }),
	resultadoSustentacion: varchar("resultado_sustentacion", { length: 30 }),
	juradoCalificador: text("jurado_calificador"),
	numeroTitulo: varchar("numero_titulo", { length: 100 }),
	numeroRegistroTitulo: varchar("numero_registro_titulo", { length: 100 }),
	fechaEmisionTitulo: date("fecha_emision_titulo"),
	situacionLaboral: varchar("situacion_laboral", { length: 50 }).default('BUSCANDO_EMPLEO').notNull(),
	empresaActual: varchar("empresa_actual", { length: 200 }),
	rucEmpresa: varchar("ruc_empresa", { length: 20 }),
	cargoActual: varchar("cargo_actual", { length: 150 }),
	ingresoMensualAprox: varchar("ingreso_mensual_aprox", { length: 50 }),
	telefonoActual: varchar("telefono_actual", { length: 50 }),
	emailActual: varchar("email_actual", { length: 150 }),
	fechaActualizacionLaboral: date("fecha_actualizacion_laboral"),
	observaciones: text(),
	usuarioId: uuid("usuario_id"),
	fechaRegistro: timestamp("fecha_registro", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	fechaActualizacion: timestamp("fecha_actualizacion", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	index("idx_egresados_estudiante").using("btree", table.estudianteId.asc().nullsLast().op("uuid_ops")),
	index("idx_egresados_programa").using("btree", table.programaId.asc().nullsLast().op("uuid_ops")),
	index("idx_egresados_estado").using("btree", table.estadoTramite.asc().nullsLast().op("text_ops")),
	index("idx_egresados_situacion_laboral").using("btree", table.situacionLaboral.asc().nullsLast().op("text_ops")),
	index("idx_egresados_fecha_egreso").using("btree", table.fechaEgreso.asc().nullsLast().op("date_ops")),
	foreignKey({
		columns: [table.estudianteId],
		foreignColumns: [estudiantes.id],
		name: "egresados_estudiante_id_fkey"
	}),
	foreignKey({
		columns: [table.matriculaId],
		foreignColumns: [matriculas.id],
		name: "egresados_matricula_id_fkey"
	}),
	foreignKey({
		columns: [table.planEstudioId],
		foreignColumns: [planesEstudios.id],
		name: "egresados_plan_estudio_id_fkey"
	}),
	foreignKey({
		columns: [table.programaId],
		foreignColumns: [programas.id],
		name: "egresados_programa_id_fkey"
	}),
	unique("egresados_estudiante_programa_key").on(table.estudianteId, table.programaId),
	unique("egresados_codigo_key").on(table.codigoEgresado),
]);

export const competencias = pgTable("competencias", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	codigo: varchar({ length: 50 }).notNull(),
	nombre: text().notNull(),
	descripcion: text(),
	tipoCompetencia: varchar("tipo_competencia"),
}, (table) => [
	unique("competencias_codigo_key").on(table.codigo),
]);

export const estadosAsistencias = pgTable("estados_asistencias", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	codigo: varchar({ length: 30 }).notNull(),
	nombre: varchar({ length: 100 }).notNull(),
	afectaPorcentaje: boolean("afecta_porcentaje").default(true).notNull(),
}, (table) => [
	unique("estados_asistencia_codigo_key").on(table.codigo),
]);

export const estudiantes = pgTable("estudiantes", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	personaId: uuid("persona_id").notNull(),
	codigoEstudiante: varchar("codigo_estudiante", { length: 10 }),
	trabaja: boolean(),
	ieProcedencia: varchar("ie_procedencia", { length: 200 }),
	puestoTrabajo: varchar("puesto_trabajo", { length: 150 }),
	lugarNacimiento: varchar("lugar_nacimiento", { length: 150 }),
	distritoNacimiento: varchar("distrito_nacimiento", { length: 100 }),
	provinciaNacimiento: varchar("provincia_nacimiento", { length: 100 }),
	regionNacimiento: varchar("region_nacimiento", { length: 100 }),
	paisNacimiento: varchar("pais_nacimiento", { length: 100 }),
	telefonoContacto: varchar("telefono_contacto", { length: 50 }),
	lenguaOriginaria: varchar("lengua_originaria", { length: 150 }),
}, (table) => [
	foreignKey({
			columns: [table.personaId],
			foreignColumns: [personas.id],
			name: "estudiantes_persona_id_fkey"
		}),
	unique("estudiantes_persona_id_key").on(table.personaId),
	unique("estudiantes_codigo_estudiante_key").on(table.codigoEstudiante),
]);

export const familiasProductivas = pgTable("familias_productivas", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	sectorEconomicoId: uuid("sector_economico_id").notNull(),
	codigo: varchar({ length: 30 }).notNull(),
	nombre: varchar({ length: 150 }).notNull(),
	descripcion: text(),
}, (table) => [
	index("idx_familias_sector").using("btree", table.sectorEconomicoId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.sectorEconomicoId],
			foreignColumns: [sectoresEconomicos.id],
			name: "familias_productivas_sector_economico_id_fkey"
		}),
	unique("familias_productivas_codigo_key").on(table.codigo),
]);

export const horarios = pgTable("horarios", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	seccionId: uuid("seccion_id").notNull(),
	asignacionDocenteId: uuid("asignacion_docente_id"),
	aulaId: uuid("aula_id"),
	diaSemana: integer("dia_semana").notNull(),
	horaInicio: time("hora_inicio").notNull(),
	horaFin: time("hora_fin").notNull(),
}, (table) => [
	index("idx_horarios_seccion").using("btree", table.seccionId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.asignacionDocenteId],
			foreignColumns: [asignacionesTrabajadores.id],
			name: "horarios_asignacion_docente_id_fkey"
		}),
	foreignKey({
			columns: [table.aulaId],
			foreignColumns: [aulas.id],
			name: "horarios_aula_id_fkey"
		}),
	foreignKey({
			columns: [table.seccionId],
			foreignColumns: [secciones.id],
			name: "horarios_seccion_id_fkey"
		}),
	check("horarios_dia_check", sql`(dia_semana >= 1) AND (dia_semana <= 7)`),
	check("horarios_horas_check", sql`hora_fin > hora_inicio`),
]);

export const notasEfsrt = pgTable("notas_efsrt", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	matriculaId: uuid("matricula_id").notNull(),
	estudianteId: uuid("estudiante_id"),
	efsrtId: uuid("efsrt_id").notNull(),
	dominioOperativo: numeric("dominio_operativo", { precision: 5, scale: 2 }).default('0'),
	usoEquipos: numeric("uso_equipos", { precision: 5, scale: 2 }).default('0'),
	seguridadHigiene: numeric("seguridad_higiene", { precision: 5, scale: 2 }).default('0'),
	puntualidadAsistencia: numeric("puntualidad_asistencia", { precision: 5, scale: 2 }).default('0'),
	trabajoEquipo: numeric("trabajo_equipo", { precision: 5, scale: 2 }).default('0'),
	iniciativaAdaptabilidad: numeric("iniciativa_adaptabilidad", { precision: 5, scale: 2 }).default('0'),
	nota: numeric({ precision: 5, scale: 2 }),
	modalidad: varchar({ length: 50 }).default('EMPRESA').notNull(),
	empresaRuc: varchar("empresa_ruc", { length: 20 }),
	empresaNombre: varchar("empresa_nombre", { length: 200 }),
	empresaDireccion: varchar("empresa_direccion", { length: 250 }),
	supervisorEmpresa: varchar("supervisor_empresa", { length: 200 }),
	supervisorEmpresaCargo: varchar("supervisor_empresa_cargo", { length: 150 }),
	docenteSupervisorId: uuid("docente_supervisor_id"),
	horasCompletadas: integer("horas_completadas").default(0),
	fechaInicio: date("fecha_inicio"),
	fechaTermino: date("fecha_termino"),
	numeroConstancia: varchar("numero_constancia", { length: 100 }),
	archivoConstanciaUrl: text("archivo_constancia_url"),
	estado: varchar({ length: 30 }).default('EN_EJECUCION'),
	conclusionDescriptiva: text("conclusion_descriptiva"),
	bloqueado: boolean().default(false).notNull(),
	fechaCierre: timestamp("fecha_cierre", { withTimezone: true, mode: 'string' }),
	fechaRegistro: timestamp("fecha_registro", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	fechaActualizacion: timestamp("fecha_actualizacion", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	usuarioId: uuid("usuario_id"),
}, (table) => [
	index("idx_notas_efsrt_matricula").using("btree", table.matriculaId.asc().nullsLast().op("uuid_ops")),
	index("idx_notas_efsrt_estudiante").using("btree", table.estudianteId.asc().nullsLast().op("uuid_ops")),
	index("idx_notas_efsrt_efsrt_id").using("btree", table.efsrtId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
		columns: [table.estudianteId],
		foreignColumns: [estudiantes.id],
		name: "notas_efsrt_estudiante_id_fkey"
	}),
	foreignKey({
		columns: [table.efsrtId],
		foreignColumns: [efsrt.id],
		name: "notas_efsrt_efsrt_id_fkey"
	}),
	foreignKey({
		columns: [table.matriculaId],
		foreignColumns: [matriculas.id],
		name: "notas_efsrt_matricula_id_fkey"
	}),
	unique("notas_efsrt_unique").on(table.matriculaId, table.efsrtId),
	check("notas_efsrt_nota_check", sql`(nota IS NULL) OR ((nota >= (0)::numeric) AND (nota <= (20)::numeric))`),
	check("notas_efsrt_dominio_operativo_check", sql`(dominio_operativo IS NULL) OR ((dominio_operativo >= (0)::numeric) AND (dominio_operativo <= (20)::numeric))`),
	check("notas_efsrt_uso_equipos_check", sql`(uso_equipos IS NULL) OR ((uso_equipos >= (0)::numeric) AND (uso_equipos <= (20)::numeric))`),
	check("notas_efsrt_seguridad_higiene_check", sql`(seguridad_higiene IS NULL) OR ((seguridad_higiene >= (0)::numeric) AND (seguridad_higiene <= (20)::numeric))`),
	check("notas_efsrt_puntualidad_asistencia_check", sql`(puntualidad_asistencia IS NULL) OR ((puntualidad_asistencia >= (0)::numeric) AND (puntualidad_asistencia <= (20)::numeric))`),
	check("notas_efsrt_trabajo_equipo_check", sql`(trabajo_equipo IS NULL) OR ((trabajo_equipo >= (0)::numeric) AND (trabajo_equipo <= (20)::numeric))`),
	check("notas_efsrt_iniciativa_adaptabilidad_check", sql`(iniciativa_adaptabilidad IS NULL) OR ((iniciativa_adaptabilidad >= (0)::numeric) AND (iniciativa_adaptabilidad <= (20)::numeric))`),
]);

export const modulosCompetencias = pgTable("modulos_competencias", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	moduloId: uuid("modulo_id").notNull(),
	competenciaId: uuid("competencia_id").notNull(),
	orden: integer().default(1).notNull(),
}, (table) => [
	index("idx_modulo_competencias_modulo").using("btree", table.moduloId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.competenciaId],
			foreignColumns: [competencias.id],
			name: "modulo_competencias_competencia_id_fkey"
		}),
	foreignKey({
			columns: [table.moduloId],
			foreignColumns: [modulos.id],
			name: "modulo_competencias_modulo_id_fkey"
		}),
	unique("modulo_competencias_unique").on(table.moduloId, table.competenciaId),
	check("modulo_competencias_orden_check", sql`orden > 0`),
]);

export const matriculas = pgTable("matriculas", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	codigoMatricula: varchar("codigo_matricula", { length: 50 }).notNull(),
	estudianteId: uuid("estudiante_id").notNull(),
	sedeId: uuid("sede_id").notNull(),
	periodoAcademicoId: uuid("periodo_academico_id").notNull(),
	moduloId: uuid("modulo_id").notNull(),
	seccionId: uuid("seccion_id"),
	fechaMatricula: date("fecha_matricula").default(sql`CURRENT_DATE`).notNull(),
	estadoMatricula: varchar("estado_matricula", { length: 30 }).default('ACTIVA').notNull(),
	condicion: varchar({ length: 30 }).notNull(),
	formacion: varchar({ length: 100 }),
	oportunidadTecnica: varchar("oportunidad_tecnica", { length: 100 }),
	observaciones: text(),
}, (table) => [
	uniqueIndex("uq_matricula_activa_estudiante_periodo_modulo").using("btree", table.estudianteId.asc().nullsLast().op("uuid_ops"), table.periodoAcademicoId.asc().nullsLast().op("uuid_ops"), table.moduloId.asc().nullsLast().op("uuid_ops")).where(sql`((estado_matricula)::text = 'ACTIVA'::text)`),
	uniqueIndex("uq_matricula_codigo").using("btree", table.codigoMatricula.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.estudianteId],
			foreignColumns: [estudiantes.id],
			name: "matriculas_estudiante_id_fkey"
		}),
	foreignKey({
			columns: [table.moduloId],
			foreignColumns: [modulos.id],
			name: "matriculas_modulo_id_fkey"
		}),
	foreignKey({
			columns: [table.periodoAcademicoId],
			foreignColumns: [periodosAcademicos.id],
			name: "matriculas_periodo_academico_id_fkey"
		}),
	foreignKey({
			columns: [table.seccionId],
			foreignColumns: [secciones.id],
			name: "matriculas_seccion_id_fkey"
		}),
	foreignKey({
			columns: [table.sedeId],
			foreignColumns: [sedes.id],
			name: "matriculas_sede_id_fkey"
		}),
]);

export const modulos = pgTable("modulos", {
	programaId: uuid("programa_id").notNull(),
	planEstudioId: uuid("plan_estudio_id").notNull(),
	id: uuid().defaultRandom().primaryKey().notNull(),
	codigo: varchar({ length: 50 }).notNull(),
	nombre: varchar({ length: 250 }).notNull(),
	descripcion: text(),
	orden: integer().default(1).notNull(),
	creditos: numeric({ precision: 8, scale:  2 }),
	horas: integer(),
	estado: estadoActInact().default('Activo'),
}, (table) => [
	index("idx_modulos_plan").using("btree", table.planEstudioId.asc().nullsLast().op("uuid_ops")),
	index("idx_modulos_programa").using("btree", table.programaId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.planEstudioId],
			foreignColumns: [planesEstudios.id],
			name: "modulos_plan_estudio_id_fkey"
		}),
	foreignKey({
			columns: [table.programaId],
			foreignColumns: [programas.id],
			name: "modulos_programa_id_fkey"
		}),
	unique("modulos_codigo_key").on(table.codigo),
	check("modulos_creditos_check", sql`(creditos IS NULL) OR (creditos >= (0)::numeric)`),
	check("modulos_horas_check", sql`(horas IS NULL) OR (horas >= 0)`),
	check("modulos_orden_check", sql`orden > 0`),
]);

export const pagos = pgTable("pagos", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	matriculaId: uuid("matricula_id"),
	conceptoPagoId: uuid("concepto_pago_id").notNull(),
	metodoPagoId: uuid("metodo_pago_id"),
	fechaPago: date("fecha_pago").default(sql`CURRENT_DATE`).notNull(),
	numeroRecibo: varchar("numero_recibo", { length: 100 }),
	monto: numeric({ precision: 10, scale:  2 }).notNull(),
	montoTotal: numeric("monto_total", { precision: 10, scale: 2 }).notNull(),
	montoPendiente: numeric("monto_pendiente", { precision: 10, scale: 2 }).default('0.00').notNull(),
	numeroCuota: integer("numero_cuota").default(1).notNull(),
	totalCuotas: integer("total_cuotas").default(1).notNull(),
	fechaVencimiento: date("fecha_vencimiento"),
	pagoPadreId: uuid("pago_padre_id"),
	motivoAnulacion: text("motivo_anulacion"),
	estado: varchar({ length: 30 }).default('Emitido').notNull(),
	observaciones: text(),
	usuarioId: uuid("usuario_id"),
}, (table) => [
	index("idx_pagos_matricula_fecha").using("btree", table.matriculaId.asc().nullsLast().op("date_ops"), table.fechaPago.asc().nullsLast().op("date_ops")),
	index("idx_pagos_pago_padre").using("btree", table.pagoPadreId.asc().nullsLast()),
	index("idx_pagos_estado").using("btree", table.estado.asc().nullsLast()),
	foreignKey({
			columns: [table.conceptoPagoId],
			foreignColumns: [conceptosPagos.id],
			name: "pagos_concepto_pago_id_fkey"
		}),
	foreignKey({
			columns: [table.matriculaId],
			foreignColumns: [matriculas.id],
			name: "pagos_matricula_id_fkey"
		}),
	foreignKey({
			columns: [table.metodoPagoId],
			foreignColumns: [metodosPagos.id],
			name: "pagos_metodo_pago_id_fkey"
		}),
	foreignKey({
			columns: [table.usuarioId],
			foreignColumns: [usuarios.id],
			name: "pagos_usuario_id_fkey"
		}),
	foreignKey({
			columns: [table.pagoPadreId],
			foreignColumns: [table.id],
			name: "pagos_pago_padre_id_fkey"
		}),
	check("pagos_monto_check", sql`monto >= (0)::numeric`),
	check("pagos_estado_check", sql`estado IN ('Pendiente', 'Emitido', 'Pagado', 'Anulado')`),
]);

export const periodosLectivos = pgTable("periodos_lectivos", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	codigo: varchar({ length: 50 }).notNull(),
	nombre: varchar({ length: 100 }).notNull(),
	fechaInicio: date("fecha_inicio").notNull(),
	fechaFin: date("fecha_fin").notNull(),
	cetproId: uuid("cetpro_id").notNull(),
	estado: varchar({ length: 30 }).default('ACTIVO').notNull(),
}, (table) => [
	foreignKey({
			columns: [table.cetproId],
			foreignColumns: [cetpros.id],
			name: "periodos_lectivos_cetpro_id_fkey"
		}),
	unique("periodos_lectivos_codigo_key").on(table.codigo),
	check("periodos_lectivos_fechas_check", sql`fecha_fin >= fecha_inicio`),
]);

export const notasUnidades = pgTable("notas_unidades", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	matriculaId: uuid("matricula_id").notNull(),
	estudianteId: uuid("estudiante_id"),
	unidadId: uuid("unidad_id").notNull(),
	c1: numeric({ precision: 5, scale: 2 }),
	c2: numeric({ precision: 5, scale: 2 }),
	c3: numeric({ precision: 5, scale: 2 }),
	nota: numeric({ precision: 5, scale:  2 }),
	recuperacion: numeric({ precision: 5, scale:  2 }),
	criteriosDetalle: jsonb("criterios_detalle"),
	estado: varchar({ length: 30 }),
	conclusionDescriptiva: text("conclusion_descriptiva"),
	fechaRegistro: timestamp("fecha_registro", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	fechaActualizacion: timestamp("fecha_actualizacion", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	bloqueado: boolean().default(false).notNull(),
	fechaCierre: timestamp("fecha_cierre", { withTimezone: true, mode: 'string' }),
	usuarioId: uuid("usuario_id"),
}, (table) => [
	index("idx_notas_unidades_matricula").using("btree", table.matriculaId.asc().nullsLast().op("uuid_ops")),
	index("idx_notas_unidades_unidad").using("btree", table.unidadId.asc().nullsLast().op("uuid_ops")),
	index("idx_notas_unidades_estudiante").using("btree", table.estudianteId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.matriculaId],
			foreignColumns: [matriculas.id],
			name: "notas_unidades_matricula_id_fkey"
		}),
	foreignKey({
			columns: [table.estudianteId],
			foreignColumns: [estudiantes.id],
			name: "notas_unidades_estudiante_id_fkey"
		}),
	foreignKey({
			columns: [table.unidadId],
			foreignColumns: [unidadesDidacticas.id],
			name: "notas_unidades_unidad_id_fkey"
		}),
	unique("notas_unidades_unique").on(table.matriculaId, table.unidadId),
	check("notas_unidades_nota_check", sql`(nota IS NULL) OR ((nota >= (0)::numeric) AND (nota <= (20)::numeric))`),
	check("notas_unidades_c1_check", sql`(c1 IS NULL) OR ((c1 >= (0)::numeric) AND (c1 <= (20)::numeric))`),
	check("notas_unidades_c2_check", sql`(c2 IS NULL) OR ((c2 >= (0)::numeric) AND (c2 <= (20)::numeric))`),
	check("notas_unidades_c3_check", sql`(c3 IS NULL) OR ((c3 >= (0)::numeric) AND (c3 <= (20)::numeric))`),
	check("notas_unidades_recuperacion_check", sql`(recuperacion IS NULL) OR ((recuperacion >= (0)::numeric) AND (recuperacion <= (20)::numeric))`),
]);

export const planesEstudios = pgTable("planes_estudios", {
	programaId: uuid("programa_id").notNull(),
	tipoPlanEstudio: varchar("tipo_plan_estudio", { length: 100 }),
	id: uuid().defaultRandom().primaryKey().notNull(),
	codigo: varchar({ length: 50 }).notNull(),
	version: integer().default(1).notNull(),
	nombre: varchar({ length: 200 }).notNull(),
	fechaInicio: date("fecha_inicio").notNull(),
	observaciones: text(),
	resolucionAprobacionUrl: varchar("resolucion_aprobacion_url", { length: 500 }),
	estado: estadoActInact().default('Activo'),
	archivoPlanUrl: varchar("archivo_plan_url"),
}, (table) => [
	index("idx_planes_programa").using("btree", table.programaId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.programaId],
			foreignColumns: [programas.id],
			name: "planes_estudio_programa_id_fkey"
		}),
	unique("planes_estudio_programa_version_key").on(table.programaId, table.version),
	unique("planes_estudio_codigo_key").on(table.codigo),
	check("planes_estudio_version_check", sql`version > 0`),
]);

export const personasRoles = pgTable("personas_roles", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	personaId: uuid("persona_id").notNull(),
	rolPersonaId: uuid("rol_persona_id").notNull(),
}, (table) => [
	index("idx_persona_roles_persona").using("btree", table.personaId.asc().nullsLast().op("uuid_ops")),
	index("idx_persona_roles_rol").using("btree", table.rolPersonaId.asc().nullsLast().op("uuid_ops")),
	uniqueIndex("uq_persona_roles_activo").using("btree", table.personaId.asc().nullsLast().op("uuid_ops"), table.rolPersonaId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.personaId],
			foreignColumns: [personas.id],
			name: "persona_roles_persona_id_fkey"
		}),
	foreignKey({
			columns: [table.rolPersonaId],
			foreignColumns: [rolesPersonas.id],
			name: "persona_roles_rol_persona_id_fkey"
		}),
]);

export const periodosClases = pgTable("periodos_clases", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	periodoAcademicoId: uuid("periodo_academico_id").notNull(),
	codigo: varchar({ length: 50 }).notNull(),
	nombre: varchar({ length: 100 }).notNull(),
	fechaInicio: date("fecha_inicio").notNull(),
	fechaFin: date("fecha_fin").notNull(),
}, (table) => [
	index("idx_periodos_clases_academico").using("btree", table.periodoAcademicoId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.periodoAcademicoId],
			foreignColumns: [periodosAcademicos.id],
			name: "periodos_clases_periodo_academico_id_fkey"
		}),
	unique("periodos_clases_codigo_key").on(table.codigo),
	check("periodos_clases_fechas_check", sql`fecha_fin >= fecha_inicio`),
]);

export const programas = pgTable("programas", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	codigo: varchar({ length: 50 }).notNull(),
	nombre: varchar({ length: 250 }).notNull(),
	nivelFormativoId: uuid("nivel_formativo_id").notNull(),
	actividadEconomicaId: uuid("actividad_economica_id"),
	descripcion: text(),
	duracionHorasReferencial: integer("duracion_horas_referencial"),
	creditos: numeric({ precision: 8, scale:  2 }),
	tituloEmitido: varchar("titulo_emitido"),
	estado: estadoActInact().default('Activo'),
}, (table) => [
	index("idx_programas_actividad").using("btree", table.actividadEconomicaId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.actividadEconomicaId],
			foreignColumns: [actividadesEconomicas.id],
			name: "programas_actividad_economica_id_fkey"
		}),
	foreignKey({
			columns: [table.nivelFormativoId],
			foreignColumns: [nivelesFormativos.id],
			name: "programas_nivel_formativo_id_fkey"
		}),
	unique("programas_codigo_key").on(table.codigo),
	check("programas_duracion_check", sql`(duracion_horas_referencial IS NULL) OR (duracion_horas_referencial > 0)`),
]);

export const periodosAcademicos = pgTable("periodos_academicos", {
	periodoLectivoId: uuid("periodo_lectivo_id").notNull(),
	id: uuid().defaultRandom().primaryKey().notNull(),
	codigo: varchar({ length: 50 }).notNull(),
	nombre: varchar({ length: 100 }).notNull(),
	fechaInicio: date("fecha_inicio").notNull(),
	fechaFin: date("fecha_fin").notNull(),
	estado: varchar({ length: 30 }).default('ACTIVO').notNull(),
}, (table) => [
	index("idx_periodos_academicos_lectivo").using("btree", table.periodoLectivoId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.periodoLectivoId],
			foreignColumns: [periodosLectivos.id],
			name: "periodos_academicos_periodo_lectivo_id_fkey"
		}),
	unique("periodos_academicos_codigo_key").on(table.codigo),
	check("periodos_academicos_fechas_check", sql`fecha_fin >= fecha_inicio`),
]);

export const permisos = pgTable("permisos", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	codigo: varchar({ length: 100 }).notNull(),
	nombre: varchar({ length: 150 }).notNull(),
	modulo: varchar({ length: 100 }),
	accion: varchar({ length: 100 }),
	descripcion: text(),
	estado: varchar({ length: 30 }).default('ACTIVO').notNull(),
}, (table) => [
	unique("permisos_codigo_key").on(table.codigo),
]);

export const rolesPermisos = pgTable("roles_permisos", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	rolSistemaId: uuid("rol_sistema_id").notNull(),
	permisoId: uuid("permiso_id").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.permisoId],
			foreignColumns: [permisos.id],
			name: "rol_permisos_permiso_id_fkey"
		}),
	foreignKey({
			columns: [table.rolSistemaId],
			foreignColumns: [rolesSistemas.id],
			name: "rol_permisos_rol_sistema_id_fkey"
		}),
	unique("rol_permisos_unique").on(table.rolSistemaId, table.permisoId),
]);



export const rolesPersonas = pgTable("roles_personas", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	codigo: varchar({ length: 30 }).notNull(),
	nombre: varchar({ length: 100 }).notNull(),
	descripcion: text(),
	estado: varchar({ length: 30 }).default('ACTIVO').notNull(),
}, (table) => [
	unique("roles_persona_codigo_key").on(table.codigo),
]);

export const tiposUnidades = pgTable("tipos_unidades", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	codigo: varchar({ length: 30 }).notNull(),
	nombre: tipoUnidad().notNull(),
	descripcion: text(),
}, (table) => [
	unique("tipos_unidad_codigo_key").on(table.codigo),
]);

export const sectoresEconomicos = pgTable("sectores_economicos", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	codigo: varchar({ length: 30 }).notNull(),
	nombre: varchar({ length: 150 }).notNull(),
	descripcion: text(),
}, (table) => [
	unique("sectores_economicos_codigo_key").on(table.codigo),
]);

export const secciones = pgTable("secciones", {
	planEstudioId: uuid("plan_estudio_id").notNull(),
	modalidadEducativa: varchar("modalidad_educativa", { length: 100 }),
	id: uuid().defaultRandom().primaryKey().notNull(),
	codigo: varchar({ length: 50 }).notNull(),
	nombre: varchar({ length: 150 }).notNull(),
	moduloId: uuid("modulo_id").notNull(),
	periodoClasesId: uuid("periodo_clases_id").notNull(),
	sedeId: uuid("sede_id").notNull(),
	aulaId: uuid("aula_id"),
	turnoId: uuid("turno_id"),
	capacidad: integer(),
	estado: varchar({ length: 30 }).default('ACTIVO').notNull(),
}, (table) => [
	index("idx_secciones_modulo").using("btree", table.moduloId.asc().nullsLast().op("uuid_ops")),
	index("idx_secciones_periodo").using("btree", table.periodoClasesId.asc().nullsLast().op("uuid_ops")),
	index("idx_secciones_sede").using("btree", table.sedeId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.aulaId],
			foreignColumns: [aulas.id],
			name: "secciones_aula_id_fkey"
		}),
	foreignKey({
			columns: [table.moduloId],
			foreignColumns: [modulos.id],
			name: "secciones_modulo_id_fkey"
		}),
	foreignKey({
			columns: [table.periodoClasesId],
			foreignColumns: [periodosClases.id],
			name: "secciones_periodo_clases_id_fkey"
		}),
	foreignKey({
			columns: [table.planEstudioId],
			foreignColumns: [planesEstudios.id],
			name: "secciones_plan_estudio_id_fkey"
		}),
	foreignKey({
			columns: [table.sedeId],
			foreignColumns: [sedes.id],
			name: "secciones_sede_id_fkey"
		}),
	foreignKey({
			columns: [table.turnoId],
			foreignColumns: [turnos.id],
			name: "secciones_turno_id_fkey"
		}),
	unique("secciones_codigo_key").on(table.codigo),
	check("secciones_capacidad_check", sql`(capacidad IS NULL) OR (capacidad > 0)`),
]);

export const seccionesUnidades = pgTable("secciones_unidades", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	seccionId: uuid("seccion_id").notNull(),
	unidadId: uuid("unidad_id").notNull(),
	docenteId: uuid("docente_id"),
	fechaInicio: date("fecha_inicio").notNull(),
	fechaFin: date("fecha_fin").notNull(),
	horas: integer(),
	creditos: numeric({ precision: 8, scale: 2 }),
	estado: varchar({ length: 30 }).default('PROGRAMADA').notNull(),
	observaciones: text(),
	fechaRegistro: timestamp("fecha_registro", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	fechaActualizacion: timestamp("fecha_actualizacion", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	index("idx_secciones_unidades_seccion").using("btree", table.seccionId.asc().nullsLast().op("uuid_ops")),
	index("idx_secciones_unidades_unidad").using("btree", table.unidadId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
		columns: [table.seccionId],
		foreignColumns: [secciones.id],
		name: "secciones_unidades_seccion_id_fkey"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.unidadId],
		foreignColumns: [unidadesDidacticas.id],
		name: "secciones_unidades_unidad_id_fkey"
	}).onDelete("cascade"),
	foreignKey({
		columns: [table.docenteId],
		foreignColumns: [trabajadores.id],
		name: "secciones_unidades_docente_id_fkey"
	}).onDelete("set null"),
	unique("secciones_unidades_unique").on(table.seccionId, table.unidadId),
	check("secciones_unidades_fechas_check", sql`fecha_fin >= fecha_inicio`),
]);

export const retiros = pgTable("retiros", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	matriculaId: uuid("matricula_id").notNull(),
	fechaRetiro: date("fecha_retiro").default(sql`CURRENT_DATE`).notNull(),
	motivo: text().notNull(),
	documentoId: uuid("documento_id"),
	observaciones: text(),
	usuarioId: uuid("usuario_id"),
	tipoRetiro: varchar("tipo_retiro", { length: 50 }).default('VOLUNTARIO').notNull(),
	numeroDocumentoSustento: varchar("numero_documento_sustento", { length: 100 }),
}, (table) => [
	foreignKey({
			columns: [table.documentoId],
			foreignColumns: [documentos.id],
			name: "retiros_documento_id_fkey"
		}),
	foreignKey({
			columns: [table.matriculaId],
			foreignColumns: [matriculas.id],
			name: "retiros_matricula_id_fkey"
		}),
	foreignKey({
			columns: [table.usuarioId],
			foreignColumns: [usuarios.id],
			name: "retiros_usuario_id_fkey"
		}),
]);

export const rolesSistemas = pgTable("roles_sistemas", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	codigo: varchar({ length: 50 }).notNull(),
	nombre: varchar({ length: 100 }).notNull(),
	descripcion: text(),
	estado: varchar({ length: 30 }).default('ACTIVO').notNull(),
}, (table) => [
	unique("roles_sistema_codigo_key").on(table.codigo),
]);

export const traslados = pgTable("traslados", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	matriculaOrigenId: uuid("matricula_origen_id").notNull(),
	sedeDestinoId: uuid("sede_destino_id"),
	programaDestinoId: uuid("programa_destino_id"),
	planEstudioDestinoId: uuid("plan_estudio_destino_id"),
	moduloDestinoId: uuid("modulo_destino_id"),
	seccionDestinoId: uuid("seccion_destino_id"),
	fechaSolicitud: date("fecha_solicitud").default(sql`CURRENT_DATE`).notNull(),
	fechaAprobacion: date("fecha_aprobacion"),
	motivo: text(),
	observaciones: text(),
	usuarioId: uuid("usuario_id"),
	tipoTraslado: varchar("tipo_traslado", { length: 50 }).default('INTERNO_SECCION').notNull(),
	institucionDestino: varchar("institucion_destino", { length: 255 }),
	institucionOrigen: varchar("institucion_origen", { length: 255 }),
	estado: varchar("estado", { length: 50 }).default('APROBADO').notNull(),
	matriculaDestinoId: uuid("matricula_destino_id"),
	resolucionDirectoral: varchar("resolucion_directoral", { length: 100 }),
}, (table) => [
	foreignKey({
			columns: [table.matriculaOrigenId],
			foreignColumns: [matriculas.id],
			name: "traslados_matricula_origen_id_fkey"
		}),
	foreignKey({
			columns: [table.moduloDestinoId],
			foreignColumns: [modulos.id],
			name: "traslados_modulo_destino_id_fkey"
		}),
	foreignKey({
			columns: [table.planEstudioDestinoId],
			foreignColumns: [planesEstudios.id],
			name: "traslados_plan_estudio_destino_id_fkey"
		}),
	foreignKey({
			columns: [table.programaDestinoId],
			foreignColumns: [programas.id],
			name: "traslados_programa_destino_id_fkey"
		}),
	foreignKey({
			columns: [table.seccionDestinoId],
			foreignColumns: [secciones.id],
			name: "traslados_seccion_destino_id_fkey"
		}),
	foreignKey({
			columns: [table.sedeDestinoId],
			foreignColumns: [sedes.id],
			name: "traslados_sede_destino_id_fkey"
		}),
	foreignKey({
			columns: [table.usuarioId],
			foreignColumns: [usuarios.id],
			name: "traslados_usuario_id_fkey"
		}),
	foreignKey({
			columns: [table.matriculaDestinoId],
			foreignColumns: [matriculas.id],
			name: "traslados_matricula_destino_id_fkey"
		}),
	check("traslados_fechas_check", sql`(fecha_aprobacion IS NULL) OR (fecha_aprobacion >= fecha_solicitud)`),
]);

export const reingresos = pgTable("reingresos", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	estudianteId: uuid("estudiante_id").notNull(),
	matriculaAnteriorId: uuid("matricula_anterior_id"),
	nuevaMatriculaId: uuid("nueva_matricula_id").notNull(),
	fecha: date("fecha").default(sql`CURRENT_DATE`).notNull(),
	motivo: text(),
	observaciones: text(),
	usuarioId: uuid("usuario_id"),
	periodoAcademicoReingresoId: uuid("periodo_academico_reingreso_id"),
	resolucionNumero: varchar("resolucion_numero", { length: 100 }),
	requiereConvalidacion: boolean("requiere_convalidacion").default(false).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.estudianteId],
			foreignColumns: [estudiantes.id],
			name: "reingresos_estudiante_id_fkey"
		}),
	foreignKey({
			columns: [table.matriculaAnteriorId],
			foreignColumns: [matriculas.id],
			name: "reingresos_matricula_anterior_id_fkey"
		}),
	foreignKey({
			columns: [table.nuevaMatriculaId],
			foreignColumns: [matriculas.id],
			name: "reingresos_nueva_matricula_id_fkey"
		}),
	foreignKey({
			columns: [table.usuarioId],
			foreignColumns: [usuarios.id],
			name: "reingresos_usuario_id_fkey"
		}),
	foreignKey({
			columns: [table.periodoAcademicoReingresoId],
			foreignColumns: [periodosAcademicos.id],
			name: "reingresos_periodo_academico_reingreso_id_fkey"
		}),
]);

export const unidadesCapacidades = pgTable("unidades_capacidades", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	unidadId: uuid("unidad_id").notNull(),
	capacidadId: uuid("capacidad_id").notNull(),
	orden: integer().default(1).notNull(),
}, (table) => [
	index("idx_unidad_capacidades_capacidad").using("btree", table.capacidadId.asc().nullsLast().op("uuid_ops")),
	index("idx_unidad_capacidades_unidad").using("btree", table.unidadId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.capacidadId],
			foreignColumns: [capacidades.id],
			name: "unidad_capacidades_capacidad_id_fkey"
		}),
	foreignKey({
			columns: [table.unidadId],
			foreignColumns: [unidadesDidacticas.id],
			name: "unidad_capacidades_unidad_id_fkey"
		}),
	unique("unidad_capacidades_unique").on(table.unidadId, table.capacidadId),
	check("unidad_capacidades_orden_check", sql`orden > 0`),
]);

export const usuariosRoles = pgTable("usuarios_roles", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	usuarioId: uuid("usuario_id").notNull(),
	rolSistemaId: uuid("rol_sistema_id").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.rolSistemaId],
			foreignColumns: [rolesSistemas.id],
			name: "usuario_roles_rol_sistema_id_fkey"
		}),
	foreignKey({
			columns: [table.usuarioId],
			foreignColumns: [usuarios.id],
			name: "usuario_roles_usuario_id_fkey"
		}),
]);

export const trabajadores = pgTable("trabajadores", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	personaId: uuid("persona_id").notNull(),
	codigoPlaza: varchar("codigo_plaza", { length: 50 }),
	motivoPlaza: varchar("motivo_plaza", { length: 150 }),
	cargo: varchar({ length: 100 }),
	condicion: varchar({ length: 100 }),
	escalaRegimen: varchar("escala_regimen", { length: 100 }),
	tituloEspecialidad: varchar("titulo_especialidad", { length: 200 }),
	rdNombramientoContrato: varchar("rd_nombramiento_contrato", { length: 200 }),
	estado: varchar({ length: 30 }).default('ACTIVO').notNull(),
}, (table) => [
	foreignKey({
			columns: [table.personaId],
			foreignColumns: [personas.id],
			name: "trabajadores_persona_id_fkey"
		}),
	unique("trabajadores_persona_id_key").on(table.personaId),
]);

export const usuarios = pgTable("usuarios", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	personaId: uuid("persona_id").notNull(),
	username: varchar({ length: 100 }).notNull(),
	passwordHash: text("password_hash").notNull(),
	ultimoAcceso: timestamp("ultimo_acceso", { withTimezone: true, mode: 'string' }),
	activo: boolean().default(true).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.personaId],
			foreignColumns: [personas.id],
			name: "usuarios_persona_id_fkey"
		}),
	unique("usuarios_persona_id_key").on(table.personaId),
	unique("usuarios_username_key").on(table.username),
]);

export const certificadosEstudios = pgTable("certificados_estudios", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	estudianteId: uuid("estudiante_id").notNull(),
	programaId: uuid("programa_id").notNull(),
	planEstudioId: uuid("plan_estudio_id").notNull(),
	numeroCertificado: varchar("numero_certificado", { length: 100 }).notNull(),
	codigoCertificado: varchar("codigo_certificado", { length: 50 }),
	fechaEmision: date("fecha_emision").default(sql`CURRENT_DATE`).notNull(),
	tipoCertificado: varchar("tipo_certificado", { length: 30 }).default('COMPLETO').notNull(),
	totalHorasAcumuladas: integer("total_horas_acumuladas"),
	totalCreditosAcumulados: numeric("total_creditos_acumulados", { precision: 6, scale: 2 }),
	promedioPonderadoAcumulado: numeric("promedio_ponderado_acumulado", { precision: 4, scale: 2 }),
	detalleCalificaciones: jsonb("detalle_calificaciones"),
	motivoEmision: varchar("motivo_emision", { length: 50 }).default('TRAMITE_PERSONAL'),
	resolucionDirectoral: varchar("resolucion_directoral", { length: 120 }),
	tomoFolio: varchar("tomo_folio", { length: 100 }),
	codigoVerificacionQr: text("codigo_verificacion_qr"),
	hashSeguridad: varchar("hash_seguridad", { length: 64 }),
	estado: varchar("estado", { length: 30 }).default('EMITIDO').notNull(),
	fechaEntrega: date("fecha_entrega"),
	documentoId: uuid("documento_id"),
	observaciones: text(),
	usuarioId: uuid("usuario_id"),
	fechaRegistro: timestamp("fecha_registro", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	fechaActualizacion: timestamp("fecha_actualizacion", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	index("idx_cert_est_estudiante").using("btree", table.estudianteId.asc().nullsLast()),
	index("idx_cert_est_programa").using("btree", table.programaId.asc().nullsLast()),
	index("idx_cert_est_estado").using("btree", table.estado.asc().nullsLast()),
	foreignKey({
			columns: [table.documentoId],
			foreignColumns: [documentos.id],
			name: "certificados_estudios_documento_id_fkey"
		}),
	foreignKey({
			columns: [table.estudianteId],
			foreignColumns: [estudiantes.id],
			name: "certificados_estudios_estudiante_id_fkey"
		}),
	foreignKey({
			columns: [table.planEstudioId],
			foreignColumns: [planesEstudios.id],
			name: "certificados_estudios_plan_estudio_id_fkey"
		}),
	foreignKey({
			columns: [table.programaId],
			foreignColumns: [programas.id],
			name: "certificados_estudios_programa_id_fkey"
		}),
	foreignKey({
			columns: [table.usuarioId],
			foreignColumns: [usuarios.id],
			name: "certificados_estudios_usuario_id_fkey"
		}),
	unique("certificados_estudios_numero_key").on(table.numeroCertificado),
]);

export const turnos = pgTable("turnos", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	codigo: varchar({ length: 30 }).notNull(),
	nombre: varchar({ length: 100 }).notNull(),
	horaInicioReferencial: time("hora_inicio_referencial"),
	horaFinReferencial: time("hora_fin_referencial"),
	estado: estadoActInact().default('Activo'),
}, (table) => [
	unique("turnos_codigo_key").on(table.codigo),
]);

export const nivelesFormativos = pgTable("niveles_formativos", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	codigo: varchar({ length: 30 }).notNull(),
	nombre: varchar({ length: 100 }).notNull(),
	descripcion: text(),
	estado: estadoActInact().default('Activo'),
}, (table) => [
	unique("nivel_formativo_codigo_key").on(table.codigo),
]);

export const aulas = pgTable("aulas", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	sedeId: uuid("sede_id").notNull(),
	codigo: varchar({ length: 50 }).notNull(),
	nombre: varchar({ length: 150 }).notNull(),
	tipoAmbiente: varchar("tipo_ambiente", { length: 100 }),
	capacidad: integer(),
	estado: estadoActInact().default('Activo'),
}, (table) => [
	index("idx_aulas_sede_id").using("btree", table.sedeId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.sedeId],
			foreignColumns: [sedes.id],
			name: "aulas_sede_id_fkey"
		}),
	unique("aulas_codigo_key").on(table.codigo),
	check("aulas_capacidad_check", sql`(capacidad IS NULL) OR (capacidad > 0)`),
]);

export const titulos = pgTable("titulos", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	estudianteId: uuid("estudiante_id").notNull(),
	egresadoId: uuid("egresado_id").notNull(),
	programaId: uuid("programa_id").notNull(),
	planEstudioId: uuid("plan_estudio_id").notNull(),
	numeroTitulo: varchar("numero_titulo", { length: 100 }),
	codigoTitulo: varchar("codigo_titulo", { length: 50 }).unique(),
	codigoRegistroNacional: varchar("codigo_registro_nacional", { length: 100 }),
	numeroActaSustentacion: varchar("numero_acta_sustentacion", { length: 50 }),
	denominacionTitulo: varchar("denominacion_titulo", { length: 250 }),
	modalidadTitulacion: varchar("modalidad_titulacion", { length: 60 }).default('PROYECTO_APLICACION_PROFESIONAL'),
	tituloProyecto: text("titulo_proyecto"),
	fechaSustentacion: date("fecha_sustentacion"),
	horaSustentacion: varchar("hora_sustentacion", { length: 20 }).default('10:00 AM'),
	calificacion: numeric({ precision: 4, scale: 2 }),
	calificacionLetras: varchar("calificacion_letras", { length: 50 }),
	resultadoSustentacion: varchar("resultado_sustentacion", { length: 40 }).default('APROBADO_UNANIMIDAD'),
	juradoCalificador: jsonb("jurado_calificador"),
	totalHorasAcumuladas: integer("total_horas_acumuladas").default(950),
	totalCreditosAcumulados: numeric("total_creditos_acumulados", { precision: 6, scale: 2 }).default('40.00'),
	resolucionDirectoral: varchar("resolucion_directoral", { length: 120 }).default('RD N° 0180-2026-DRE-SM'),
	libroRegistro: varchar("libro_registro", { length: 100 }).default('Libro de Títulos Profesionales 2026'),
	tomoFolio: varchar("tomo_folio", { length: 100 }),
	codigoVerificacionQr: text("codigo_verificacion_qr"),
	hashSeguridad: varchar("hash_seguridad", { length: 64 }),
	estado: varchar({ length: 30 }).default('EMITIDO').notNull(),
	fechaEmision: date("fecha_emision").default(sql`CURRENT_DATE`).notNull(),
	fechaAprobacion: date("fecha_aprobacion"),
	fechaVisadoUgel: date("fecha_visado_ugel"),
	fechaEntrega: date("fecha_entrega"),
	documentoId: uuid("documento_id"),
	observaciones: text(),
	usuarioId: uuid("usuario_id"),
	fechaRegistro: timestamp("fecha_registro", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	fechaActualizacion: timestamp("fecha_actualizacion", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	index("idx_titulos_codigo").using("btree", table.codigoTitulo.asc().nullsLast()),
	index("idx_titulos_estudiante").using("btree", table.estudianteId.asc().nullsLast()),
	index("idx_titulos_egresado").using("btree", table.egresadoId.asc().nullsLast()),
	index("idx_titulos_programa").using("btree", table.programaId.asc().nullsLast()),
	index("idx_titulos_estado").using("btree", table.estado.asc().nullsLast()),
	foreignKey({
		columns: [table.documentoId],
		foreignColumns: [documentos.id],
		name: "titulaciones_documento_id_fkey"
	}).onDelete("set null"),
	foreignKey({
		columns: [table.egresadoId],
		foreignColumns: [egresados.id],
		name: "titulaciones_egresado_id_fkey"
	}),
	foreignKey({
		columns: [table.estudianteId],
		foreignColumns: [estudiantes.id],
		name: "titulaciones_estudiante_id_fkey"
	}),
	foreignKey({
		columns: [table.planEstudioId],
		foreignColumns: [planesEstudios.id],
		name: "titulaciones_plan_estudio_id_fkey"
	}),
	foreignKey({
		columns: [table.programaId],
		foreignColumns: [programas.id],
		name: "titulaciones_programa_id_fkey"
	}),
	foreignKey({
		columns: [table.usuarioId],
		foreignColumns: [usuarios.id],
		name: "titulos_usuario_id_fkey"
	}).onDelete("set null"),
	unique("titulaciones_numero_titulo_key").on(table.numeroTitulo),
]);

export const metodosPagos = pgTable("metodos_pagos", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	codigo: varchar({ length: 30 }).notNull(),
	metodo: varchar({ length: 100 }).notNull(),
	numeroOpracionRecibo: text("numero_opracion_recibo"),
	estado: estadoActInact().default('Activo'),
}, (table) => [
	unique("metodos_pago_codigo_key").on(table.codigo),
]);

export const tramitesAdministrativos = pgTable("tramites_administrativos", {
	tramiteId: uuid("tramite_id").defaultRandom().primaryKey().notNull(),
	tipoTramite: tipoTramiteAdmin("tipo_tramite").notNull(),
	numeracion: text().notNull(),
	asunto: text(),
	destinatario: text(),
	fechaEmision: date("fecha_emision").default(sql`CURRENT_DATE`),
	documentoId: uuid("documento_id"),
}, (table) => [
	foreignKey({
			columns: [table.documentoId],
			foreignColumns: [documentos.id],
			name: "tramites_administrativos_documento_id_fkey"
		}).onDelete("set null"),
]);

export const bienesPatrimoniales = pgTable("bienes_patrimoniales", {
	bienId: uuid("bien_id").defaultRandom().primaryKey().notNull(),
	codigoPatrimonial: text("codigo_patrimonial").notNull(),
	descripcion: text().notNull(),
	marcaSerie: text("marca_serie"),
	aulaId: uuid("aula_id"),
	custodioId: uuid("custodio_id"),
	estado: estadoConservacion().default('OPERATIVO'),
	documentoIngresoId: uuid("documento_ingreso_id"),
}, (table) => [
	foreignKey({
			columns: [table.aulaId],
			foreignColumns: [aulas.id],
			name: "bienes_patrimoniales_aula_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.custodioId],
			foreignColumns: [personas.id],
			name: "bienes_patrimoniales_custodio_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.documentoIngresoId],
			foreignColumns: [documentos.id],
			name: "bienes_patrimoniales_documento_ingreso_id_fkey"
		}).onDelete("set null"),
	unique("bienes_patrimoniales_codigo_patrimonial_key").on(table.codigoPatrimonial),
]);

export const movimientosInventarios = pgTable("movimientos_inventarios", {
	movimientoId: uuid("movimiento_id").defaultRandom().primaryKey().notNull(),
	bienId: uuid("bien_id"),
	tipo: tipoMovimientoInv().notNull(),
	fechaMovimiento: timestamp("fecha_movimiento", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	origenAulaId: uuid("origen_aula_id"),
	destinoAulaId: uuid("destino_aula_id"),
	observacion: text(),
	usuarioId: uuid("usuario_id"),
}, (table) => [
	foreignKey({
			columns: [table.bienId],
			foreignColumns: [bienesPatrimoniales.bienId],
			name: "movimientos_inventario_bien_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.destinoAulaId],
			foreignColumns: [aulas.id],
			name: "movimientos_inventario_destino_aula_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.origenAulaId],
			foreignColumns: [aulas.id],
			name: "movimientos_inventario_origen_aula_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.usuarioId],
			foreignColumns: [usuarios.id],
			name: "movimientos_inventario_usuario_id_fkey"
		}).onDelete("restrict"),
]);

export const documentosOficiales = pgTable("documentos_oficiales", {
	registroId: uuid("registro_id").defaultRandom().primaryKey().notNull(),
	tipoRegistro: tipoRegistroMinedu("tipo_registro").notNull(),
	periodoAcademicoId: uuid("periodo_academico_id"),
	seccionId: uuid("seccion_id"),
	fechaCierre: timestamp("fecha_cierre", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	documentoId: uuid("documento_id"),
}, (table) => [
	foreignKey({
			columns: [table.documentoId],
			foreignColumns: [documentos.id],
			name: "registros_oficiales_minedu_documento_id_fkey"
		}).onDelete("restrict"),
	foreignKey({
			columns: [table.periodoAcademicoId],
			foreignColumns: [periodosAcademicos.id],
			name: "registros_oficiales_minedu_periodo_academico_id_fkey"
		}).onDelete("restrict"),
	foreignKey({
			columns: [table.seccionId],
			foreignColumns: [secciones.id],
			name: "registros_oficiales_minedu_seccion_id_fkey"
		}).onDelete("restrict"),
]);

export const cetpros = pgTable("cetpros", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	nombre: varchar({ length: 200 }).notNull(),
	codigoModular: varchar("codigo_modular", { length: 50 }).notNull(),
	codigoLocal: varchar("codigo_local", { length: 50 }),
	telefonoFijo: varchar("telefono_fijo", { length: 50 }),
	ruc: varchar({ length: 20 }),
	cuentaCorrienteBn: varchar("cuenta_corriente_bn", { length: 50 }),
	tipoGestion: varchar("tipo_gestion", { length: 100 }),
	ugel: varchar({ length: 150 }),
	dreGre: varchar("dre_gre", { length: 150 }),
	direccion: text(),
	distrito: varchar({ length: 100 }),
	provincia: varchar({ length: 100 }),
	region: varchar({ length: 100 }),
	cueentaBancariaRecaudacion: text("cueenta_bancaria_recaudacion"),
	estado: estadoActInact().default('Activo'),
}, (table) => [
	unique("cetpros_codigo_modular_key").on(table.codigoModular),
	unique("cetpros_cueenta_bancaria_recaudacion_key").on(table.cueentaBancariaRecaudacion),
]);

export const tiposDocumentosArchivos = pgTable("tipos_documentos_archivos", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	codigo: varchar({ length: 30 }).notNull(),
	nombre: varchar({ length: 150 }).notNull(),
	tipoArchivo: tipoArchivo("tipo_archivo"),
}, (table) => [
	unique("tipos_documento_codigo_key").on(table.codigo),
]);

export const sedes = pgTable("sedes", {
	cetproId: uuid("cetpro_id").notNull(),
	id: uuid().defaultRandom().primaryKey().notNull(),
	codigo: varchar({ length: 50 }).notNull(),
	nombre: varchar({ length: 150 }).notNull(),
	direccion: text(),
	distrito: varchar({ length: 100 }),
	provincia: varchar({ length: 100 }),
	region: varchar({ length: 100 }),
	esPrincipal: boolean("es_principal").default(true),
	estado: estadoActInact().default('Activo'),
}, (table) => [
	index("idx_sedes_cetpro_id").using("btree", table.cetproId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.cetproId],
			foreignColumns: [cetpros.id],
			name: "sedes_cetpro_id_fkey"
		}),
	unique("sedes_codigo_key").on(table.codigo),
]);

export const conceptosPagos = pgTable("conceptos_pagos", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	codigo: varchar({ length: 30 }).notNull(),
	concepto: text(),
	montoReferencial: numeric("monto_referencial", { precision: 10, scale:  2 }),
	estado: estadoActInact().default('Activo'),
}, (table) => [
	unique("conceptos_pago_codigo_key").on(table.codigo),
	check("conceptos_pago_monto_check", sql`(monto_referencial IS NULL) OR (monto_referencial >= (0)::numeric)`),
]);

export const personas = pgTable("personas", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	numeroDocumento: varchar("numero_documento", { length: 30 }).notNull(),
	apellidoPaterno: varchar("apellido_paterno", { length: 100 }).notNull(),
	apellidoMaterno: varchar("apellido_materno", { length: 100 }),
	nombres: varchar({ length: 150 }).notNull(),
	fechaRegistro: timestamp("fecha_registro", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	fechaNacimiento: date("fecha_nacimiento"),
	genero: tipoGenero(),
	direccionActual: text("direccion_actual"),
	telefono: varchar({ length: 50 }),
	email: varchar({ length: 150 }),
	nivelEducativo: tipoNivelEducativo("nivel_educativo"),
	estadoCivil: tipoEstadoCivil("estado_civil"),
	cargaFamiliar: integer("carga_familiar"),
	internetCasa: boolean("internet_casa"),
	equipoClasesVirtuales: varchar("equipo_clases_virtuales", { length: 150 }),
	operadorTelefonico: tipoOperadorTelefonicoEnum("operador_telefonico"),
	discapacidad: boolean(),
	tipoDiscapacidad: tipoDiscapacidadEnum("tipo_discapacidad"),
	fotoUrl: text("foto_url"),
	observaciones: text(),
	tipoDocumento: tipoDoc("tipo_documento").default('DNI'),
}, (table) => [
	unique("personas_numero_documento_key").on(table.numeroDocumento),
	check("personas_carga_familiar_check", sql`(carga_familiar IS NULL) OR (carga_familiar >= 0)`),
]);

export const unidadesDidacticas = pgTable("unidades_didacticas", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	moduloId: uuid("modulo_id").notNull(),
	codigo: varchar({ length: 50 }).notNull(),
	nombre: varchar({ length: 250 }).notNull(),
	descripcion: text(),
	tipoUnidadId: uuid("tipo_unidad_id"),
	creditos: numeric({ precision: 8, scale:  2 }),
	horas: integer(),
	orden: integer().notNull(),
}, (table) => [
	index("idx_unidades_modulo").using("btree", table.moduloId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.moduloId],
			foreignColumns: [modulos.id],
			name: "unidades_modulo_id_fkey"
		}),
	foreignKey({
			columns: [table.tipoUnidadId],
			foreignColumns: [tiposUnidades.id],
			name: "unidades_tipo_unidad_id_fkey"
		}),
	unique("unidades_codigo_key").on(table.codigo),
	check("unidades_creditos_check", sql`(creditos IS NULL) OR (creditos >= (0)::numeric)`),
	check("unidades_horas_check", sql`(horas IS NULL) OR (horas >= 0)`),
	check("unidades_orden_check", sql`orden > 0`),
]);
