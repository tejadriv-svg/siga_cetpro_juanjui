# DICCIONARIO OFICIAL DE TABLAS Y COLUMNAS - POSTGRESQL

Este documento contiene la totalidad de tablas y columnas exactas de la base de datos para la preparación y validación de archivos Excel.

---

## GRUPO 1: INFRAESTRUCTURA Y ORGANIZACIÓN INSTITUCIONAL

### 1. `cetpros`
- `id` (uuid, PK, autogenerado)
- `nombre` (varchar, OBLIGATORIO)
- `codigo_modular` (varchar, OBLIGATORIO, ÚNICO)
- `codigo_local` (varchar)
- `telefono_fijo` (varchar)
- `ruc` (varchar)
- `cuenta_corriente_bn` (varchar)
- `tipo_gestion` (varchar)
- `ugel` (varchar)
- `dre_gre` (varchar)
- `direccion` (text)
- `logo_url` (text)

### 2. `sedes`
- `id` (uuid, PK, autogenerado)
- `cetpro_id` (uuid, FK cetpros, OBLIGATORIO)
- `codigo` (varchar, OBLIGATORIO)
- `nombre` (varchar, OBLIGATORIO)
- `direccion` (text)

### 3. `aulas`
- `id` (uuid, PK, autogenerado)
- `sede_id` (uuid, FK sedes, OBLIGATORIO)
- `codigo` (varchar, OBLIGATORIO)
- `nombre` (varchar, OBLIGATORIO)
- `tipo_ambiente` (varchar)
- `capacidad` (integer)

---

## GRUPO 2: CATÁLOGO FORMATIVO Y PLANES DE ESTUDIO

### 4. `sectores_economicos`
- `id` (uuid, PK, autogenerado)
- `codigo` (varchar, OBLIGATORIO, ÚNICO)
- `nombre` (varchar, OBLIGATORIO)
- `descripcion` (text)

### 5. `familias_productivas`
- `id` (uuid, PK, autogenerado)
- `sector_economico_id` (uuid, FK sectores_economicos, OBLIGATORIO)
- `codigo` (varchar, OBLIGATORIO)
- `nombre` (varchar, OBLIGATORIO)
- `descripcion` (text)

### 6. `actividades_economicas`
- `id` (uuid, PK, autogenerado)
- `familia_productiva_id` (uuid, FK familias_productivas, OBLIGATORIO)
- `codigo` (varchar, OBLIGATORIO)
- `nombre` (varchar, OBLIGATORIO)
- `descripcion` (text)

### 7. `niveles_formativos`
- `id` (uuid, PK, autogenerado)
- `codigo` (varchar, OBLIGATORIO, ÚNICO)
- `nombre` (varchar, OBLIGATORIO)
- `descripcion` (text)

### 8. `programas`
- `id` (uuid, PK, autogenerado)
- `codigo` (varchar, OBLIGATORIO, ÚNICO)
- `nombre` (varchar, OBLIGATORIO)
- `nivel_formativo_id` (uuid, FK niveles_formativos, OBLIGATORIO)
- `actividad_economica_id` (uuid, FK actividades_economicas)
- `descripcion` (text)
- `duracion_horas_referencial` (integer)
- `creditos` (numeric)

### 9. `planes_estudios`
- `id` (uuid, PK, autogenerado)
- `programa_id` (uuid, FK programas, OBLIGATORIO)
- `codigo` (varchar, OBLIGATORIO)
- `version` (integer, OBLIGATORIO, default 1)
- `nombre` (varchar, OBLIGATORIO)
- `fecha_inicio` (date, OBLIGATORIO)
- `resolucion_aprobacion` (varchar)
- `observaciones` (text)
- `estado` (varchar, OBLIGATORIO, default 'ACTIVO')

### 10. `modulos`
- `id` (uuid, PK, autogenerado)
- `programa_id` (uuid, FK programas, OBLIGATORIO)
- `codigo` (varchar, OBLIGATORIO)
- `nombre` (varchar, OBLIGATORIO)
- `descripcion` (text)
- `orden` (integer, OBLIGATORIO, default 1)
- `horas` (integer)
- `creditos` (numeric)
- `estado` (varchar, OBLIGATORIO, default 'ACTIVO')

### 11. `tipos_unidades`
- `id` (uuid, PK, autogenerado)
- `codigo` (varchar, OBLIGATORIO, ÚNICO)
- `nombre` (varchar, OBLIGATORIO)
- `descripcion` (text)

### 12. `unidades` (Unidades Didácticas)
- `id` (uuid, PK, autogenerado)
- `modulo_id` (uuid, FK modulos, OBLIGATORIO)
- `codigo` (varchar, OBLIGATORIO)
- `nombre` (varchar, OBLIGATORIO)
- `descripcion` (text, sumilla o contenido curricular)
- `tipo_unidad_id` (uuid, FK tipos_unidades)
- `creditos` (numeric)
- `horas` (integer)
- `orden` (integer, OBLIGATORIO)

### 13. `competencias`
- `id` (uuid, PK, autogenerado)
- `codigo` (varchar, OBLIGATORIO)
- `nombre` (text, OBLIGATORIO)
- `descripcion` (text)
- `tipo_unidad_id` (uuid, FK tipos_unidades)

### 14. `capacidades`
- `id` (uuid, PK, autogenerado)
- `competencia_id` (uuid, FK competencias, OBLIGATORIO)
- `codigo` (varchar, OBLIGATORIO)
- `nombre` (text, OBLIGATORIO)
- `descripcion` (text)
- `orden` (integer, OBLIGATORIO, default 1)

### 15. `unidades_capacidades`
- `id` (uuid, PK, autogenerado)
- `unidad_id` (uuid, FK unidades, OBLIGATORIO)
- `capacidad_id` (uuid, FK capacidades, OBLIGATORIO)
- `orden` (integer, OBLIGATORIO, default 1)

### 16. `modulos_competencias`
- `id` (uuid, PK, autogenerado)
- `modulo_id` (uuid, FK modulos, OBLIGATORIO)
- `competencia_id` (uuid, FK competencias, OBLIGATORIO)
- `orden` (integer, OBLIGATORIO, default 1)

### 17. `efsrt` (Experiencias Formativas en Situaciones Reales de Trabajo)
- `id` (uuid, PK, autogenerado)
- `modulo_id` (uuid, FK modulos, OBLIGATORIO)
- `codigo` (varchar, OBLIGATORIO)
- `nombre` (varchar, OBLIGATORIO)
- `descripcion` (text)
- `creditos` (numeric)
- `horas` (integer)
- `orden` (integer, OBLIGATORIO, default 1)

---

## GRUPO 3: CALENDARIO, TURNOS Y SECCIONES

### 18. `periodos_lectivos`
- `id` (uuid, PK, autogenerado)
- `cetpro_id` (uuid, FK cetpros, OBLIGATORIO)
- `codigo` (varchar, OBLIGATORIO)
- `nombre` (varchar, OBLIGATORIO)
- `fecha_inicio` (date, OBLIGATORIO)
- `fecha_fin` (date, OBLIGATORIO)

### 19. `periodos_academicos`
- `id` (uuid, PK, autogenerado)
- `periodo_lectivo_id` (uuid, FK periodos_lectivos, OBLIGATORIO)
- `codigo` (varchar, OBLIGATORIO)
- `nombre` (varchar, OBLIGATORIO)
- `fecha_inicio` (date, OBLIGATORIO)
- `fecha_fin` (date, OBLIGATORIO)

### 20. `periodos_clases`
- `id` (uuid, PK, autogenerado)
- `periodo_academico_id` (uuid, FK periodos_academicos, OBLIGATORIO)
- `codigo` (varchar, OBLIGATORIO)
- `nombre` (varchar, OBLIGATORIO)
- `fecha_inicio` (date, OBLIGATORIO)
- `fecha_fin` (date, OBLIGATORIO)

### 21. `turnos`
- `id` (uuid, PK, autogenerado)
- `codigo` (varchar, OBLIGATORIO, ÚNICO)
- `nombre` (varchar, OBLIGATORIO)
- `hora_inicio_referencial` (time)
- `hora_fin_referencial` (time)

### 22. `secciones`
- `id` (uuid, PK, autogenerado)
- `codigo` (varchar, OBLIGATORIO)
- `nombre` (varchar, OBLIGATORIO)
- `periodo_clases_id` (uuid, FK periodos_clases, OBLIGATORIO)
- `plan_estudio_id` (uuid, FK planes_estudios, OBLIGATORIO)
- `sede_id` (uuid, FK sedes, OBLIGATORIO)
- `aula_id` (uuid, FK aulas)
- `turno_id` (uuid, FK turnos)
- `capacidad` (integer)
- `estado` (varchar, OBLIGATORIO, default 'ACTIVO')

---

## GRUPO 4: PADRÓN DE PERSONAS Y ROLES

### 23. `personas`
- `id` (uuid, PK, autogenerado)
- `tipo_documento` (varchar, OBLIGATORIO, default 'DNI')
- `numero_documento` (varchar, OBLIGATORIO, ÚNICO)
- `apellido_paterno` (varchar, OBLIGATORIO)
- `apellido_materno` (varchar)
- `nombres` (varchar, OBLIGATORIO)
- `fecha_registro` (timestamptz, OBLIGATORIO, default CURRENT_TIMESTAMP)
- `fecha_nacimiento` (date)
- `genero` (varchar)
- `direccion_actual` (text)
- `telefono` (varchar)
- `email` (varchar)
- `nivel_educativo` (varchar)
- `estado_civil` (varchar)
- `carga_familiar` (integer)
- `internet_casa` (boolean)
- `equipo_clases_virtuales` (varchar, 150)
- `operador_telefonico` (varchar, 50)
- `discapacidad` (boolean)
- `tipo_discapacidad` (varchar)
- `foto_url` (text)
- `observaciones` (text)

### 24. `roles_personas`
- `id` (uuid, PK, autogenerado)
- `codigo` (varchar, OBLIGATORIO, ÚNICO)
- `nombre` (varchar, OBLIGATORIO)
- `descripcion` (text)

### 25. `personas_roles`
- `id` (uuid, PK, autogenerado)
- `persona_id` (uuid, FK personas, OBLIGATORIO)
- `rol_persona_id` (uuid, FK roles_personas, OBLIGATORIO)

### 26. `estudiantes`
- `id` (uuid, PK, autogenerado)
- `persona_id` (uuid, FK personas, OBLIGATORIO, ÚNICO)
- `lugar_nacimiento` (varchar)
- `distrito_nacimiento` (varchar)
- `provincia_nacimiento` (varchar)
- `region_nacimiento` (varchar)
- `pais_nacimiento` (varchar, default 'Perú')
- `telefono_contacto` (varchar)
- `lengua_originaria` (varchar)
- `trabaja` (boolean)
- `puesto_trabajo` (varchar)
- `estado` (varchar, OBLIGATORIO, default 'ACTIVO')

### 27. `trabajadores`
- `id` (uuid, PK, autogenerado)
- `persona_id` (uuid, FK personas, OBLIGATORIO)
- `codigo_plaza` (varchar)
- `motivo_plaza` (varchar)
- `cargo` (varchar)
- `estado` (varchar, OBLIGATORIO, default 'ACTIVO')
- `condicion` (varchar)
- `escala_regimen` (varchar)
- `titulo_especialidad` (varchar)
- `rd_nombramiento_contrato` (varchar)

### 28. `apoderados_estudiantes`
- `id` (uuid, PK, autogenerado)
- `estudiante_id` (uuid, FK estudiantes, OBLIGATORIO)
- `persona_id` (uuid, FK personas, OBLIGATORIO)
- `parentesco` (varchar, OBLIGATORIO)
- `es_apoderado_principal` (boolean, OBLIGATORIO, default false)
- `vive_con_estudiante` (boolean)

---

## GRUPO 5: ADMISIÓN, MATRÍCULAS Y TRÁMITES

### 30. `matriculas`
- `id` (uuid, PK, autogenerado)
- `numero_matricula` (varchar, OBLIGATORIO, ÚNICO)
- `estudiante_id` (uuid, FK estudiantes, OBLIGATORIO)
- `cetpro_id` (uuid, FK cetpros, OBLIGATORIO)
- `sede_id` (uuid, FK sedes, OBLIGATORIO)
- `periodo_lectivo_id` (uuid, FK periodos_lectivos, OBLIGATORIO)
- `periodo_academico_id` (uuid, FK periodos_academicos, OBLIGATORIO)
- `programa_id` (uuid, FK programas, OBLIGATORIO)
- `plan_estudio_id` (uuid, FK planes_estudios, OBLIGATORIO)
- `fecha_matricula` (date, OBLIGATORIO, default CURRENT_DATE)
- `estado_matricula` (varchar, OBLIGATORIO, default 'ACTIVA')
- `formacion` (varchar)
- `tipo_plan_estudio` (varchar)
- `modalidad_educativa` (varchar)
- `condicion` (varchar)
- `oportunidad_tecnica` (varchar)
- `ie_procedencia` (varchar)
- `observaciones` (text)

### 33. `matriculas_detalles`
- `id` (uuid, PK, autogenerado)
- `matricula_id` (uuid, FK matriculas, OBLIGATORIO)
- `modulo_id` (uuid, FK modulos, OBLIGATORIO)
- `seccion_id` (uuid, FK secciones)
- `observaciones` (text)

### 34. `traslados`
- `id` (uuid, PK, autogenerado)
- `matricula_origen_id` (uuid, FK matriculas, OBLIGATORIO)
- `tipo_traslado` (varchar(50), OBLIGATORIO, default 'INTERNO_SECCION': INTERNO_SECCION, INTERNO_PROGRAMA, EXTERNO_SALIDA, EXTERNO_INGRESO)
- `sede_destino_id` (uuid, FK sedes)
- `programa_destino_id` (uuid, FK programas)
- `plan_estudio_destino_id` (uuid, FK planes_estudios)
- `modulo_destino_id` (uuid, FK modulos)
- `seccion_destino_id` (uuid, FK secciones)
- `institucion_destino` (varchar(255), para traslados externos hacia otra institución)
- `institucion_origen` (varchar(255), para traslados externos de ingreso)
- `estado` (varchar(50), default 'APROBADO': SOLICITADO, APROBADO, RECHAZADO)
- `matricula_destino_id` (uuid, FK matriculas, matrícula generada en destino)
- `resolucion_directoral` (varchar(100), RD formal de aprobación de traslado)
- `fecha_solicitud` (date, OBLIGATORIO, default CURRENT_DATE)
- `fecha_aprobacion` (date)
- `motivo` (text)
- `observaciones` (text)
- `usuario_id` (uuid, FK usuarios)

### 35. `reingresos`
- `id` (uuid, PK, autogenerado)
- `estudiante_id` (uuid, FK estudiantes, OBLIGATORIO)
- `matricula_anterior_id` (uuid, FK matriculas, matrícula de la que reservó/retiró)
- `nueva_matricula_id` (uuid, FK matriculas, nueva matrícula activa, OBLIGATORIO)
- `periodo_academico_reingreso_id` (uuid, FK periodos_academicos)
- `fecha` (date, OBLIGATORIO, default CURRENT_DATE)
- `resolucion_numero` (varchar(100), FUT o RD que aprueba el reingreso)
- `requiere_convalidacion` (boolean, default false)
- `motivo` (text)
- `observaciones` (text)
- `usuario_id` (uuid, FK usuarios)

### 36. `retiros`
- `id` (uuid, PK, autogenerado)
- `matricula_id` (uuid, FK matriculas, OBLIGATORIO)
- `tipo_retiro` (varchar(50), OBLIGATORIO, default 'VOLUNTARIO': VOLUNTARIO, POR_INASISTENCIAS, RESERVA)
- `numero_documento_sustento` (varchar(100), FUT, Informe Pedagógico o RD)
- `fecha_retiro` (date, OBLIGATORIO, default CURRENT_DATE)
- `motivo` (text, OBLIGATORIO)
- `documento_id` (uuid, FK documentos)
- `observaciones` (text)
- `usuario_id` (uuid, FK usuarios)

---

## GRUPO 6: ASIGNACIONES, HORARIOS, EVALUACIONES Y ASISTENCIA

### 37. `asignaciones_trabajadores`
- `id` (uuid, PK, autogenerado)
- `trabajador_id` (uuid, FK trabajadores, OBLIGATORIO)
- `seccion_id` (uuid, FK secciones, OBLIGATORIO)
- `unidad_id` (uuid, FK unidades)
- `periodo_clases_id` (uuid, FK periodos_clases, OBLIGATORIO)
- `horas_asignadas` (integer)

### 38. `horarios`
- `id` (uuid, PK, autogenerado)
- `seccion_id` (uuid, FK secciones, OBLIGATORIO)
- `asignacion_trabajador_id` (uuid, FK asignaciones_trabajadores)
- `aula_id` (uuid, FK aulas)
- `dia_semana` (integer, OBLIGATORIO: 1=Lunes .. 7=Domingo)
- `hora_inicio` (time, OBLIGATORIO)
- `hora_fin` (time, OBLIGATORIO)

### 39. `estados_asistencias`
- `id` (uuid, PK, autogenerado)
- `codigo` (varchar, OBLIGATORIO, ÚNICO: P, T, F, FJ)
- `nombre` (varchar, OBLIGATORIO: Presente, Tardanza, Falta, Falta Justificada)
- `afecta_porcentaje` (boolean, OBLIGATORIO, default true)

### 40. `asistencias_estudiantes`
- `id` (uuid, PK, autogenerado)
- `matricula_detalle_id` (uuid, FK matriculas_detalles, OBLIGATORIO)
- `unidad_id` (uuid, FK unidades)
- `fecha` (date, OBLIGATORIO)
- `estado_asistencia_id` (uuid, FK estados_asistencias, OBLIGATORIO)
- `observacion` (text)
- `usuario_id` (uuid, FK usuarios)

### 41. `asistencias_trabajadores`
- `id` (uuid, PK, autogenerado)
- `trabajador_id` (uuid, FK administrativos, OBLIGATORIO)
- `fecha` (date, OBLIGATORIO)
- `hora_entrada` (time)
- `hora_salida` (time)
- `estado_asistencia` (varchar)
- `observacion` (text)
- `usuario_id` (uuid, FK usuarios)

### 42. `notas_unidades`
- `id` (uuid, PK, autogenerado)
- `matricula_detalle_id` (uuid, FK matriculas_detalles, OBLIGATORIO)
- `unidad_id` (uuid, FK unidades, OBLIGATORIO)
- `nota` (numeric, escala 0 a 20)
- `conclusion_descriptiva` (text)
- `fecha_registro` (timestamptz, OBLIGATORIO, default CURRENT_TIMESTAMP)
- `usuario_id` (uuid, FK usuarios)

### 43. `notas_efsrt`
- `id` (uuid, PK, autogenerado)
- `matricula_detalle_id` (uuid, FK matriculas_detalles, OBLIGATORIO)
- `efsrt_id` (uuid, FK efsrt, OBLIGATORIO)
- `nota` (numeric, escala 0 a 20)
- `conclusion_descriptiva` (text)
- `fecha_registro` (timestamptz, OBLIGATORIO, default CURRENT_TIMESTAMP)
- `usuario_id` (uuid, FK usuarios)

---

## GRUPO 7: CERTIFICACIÓN, EGRESADOS Y TITULACIÓN

### 44. `certificados_modulares`
- `id` (uuid, PK, autogenerado)
- `estudiante_id` (uuid, FK estudiantes, OBLIGATORIO)
- `modulo_id` (uuid, FK modulos, OBLIGATORIO)
- `matricula_detalle_id` (uuid, FK matriculas_detalles, OBLIGATORIO)
- `numero_certificado` (varchar, OBLIGATORIO)
- `fecha_emision` (date, OBLIGATORIO, default CURRENT_DATE)
- `documento_id` (uuid, FK documentos)

### 45. `certificados_estudios`
- `id` (uuid, PK, autogenerado)
- `estudiante_id` (uuid, FK estudiantes, OBLIGATORIO)
- `programa_id` (uuid, FK programas, OBLIGATORIO)
- `plan_estudio_id` (uuid, FK planes_estudios, OBLIGATORIO)
- `numero_certificado` (varchar, OBLIGATORIO)
- `fecha_emision` (date, OBLIGATORIO, default CURRENT_DATE)
- `documento_id` (uuid, FK documentos)

### 46. `egresados`
- `id` (uuid, PK, autogenerado)
- `matricula_id` (uuid, FK matriculas, OBLIGATORIO)
- `programa_id` (uuid, FK programas, OBLIGATORIO)
- `plan_estudio_id` (uuid, FK planes_estudios, OBLIGATORIO)
- `fecha_egreso` (date, OBLIGATORIO)
- `numero_registro_titulo` (varchar)
- `observaciones` (text)

### 47. `titulaciones`
- `id` (uuid, PK, autogenerado)
- `estudiante_id` (uuid, FK estudiantes, OBLIGATORIO)
- `programa_id` (uuid, FK programas, OBLIGATORIO)
- `plan_estudio_id` (uuid, FK planes_estudios, OBLIGATORIO)
- `egresado_id` (uuid, FK egresados, OBLIGATORIO)
- `fecha_aprobacion` (date)
- `numero_titulo` (varchar)
- `documento_id` (uuid, FK documentos)
- `observaciones` (text)

---

## GRUPO 8: CAJA, PAGOS Y TESORERÍA

### 48. `conceptos_pagos`
- `id` (uuid, PK, autogenerado)
- `codigo` (varchar, OBLIGATORIO, ÚNICO)
- `nombre` (varchar, OBLIGATORIO)
- `descripcion` (text)
- `monto_referencial` (numeric)

### 49. `metodos_pagos`
- `id` (uuid, PK, autogenerado)
- `codigo` (varchar, OBLIGATORIO, ÚNICO)
- `nombre` (varchar, OBLIGATORIO)

### 50. `pagos`
- `id` (uuid, PK, autogenerado)
- `matricula_id` (uuid, FK matriculas, OBLIGATORIO)
- `concepto_pago_id` (uuid, FK conceptos_pagos, OBLIGATORIO)
- `metodo_pago_id` (uuid, FK metodos_pagos)
- `fecha_pago` (date, OBLIGATORIO, default CURRENT_DATE)
- `numero_recibo` (varchar)
- `monto` (numeric, OBLIGATORIO) — Monto efectivamente cancelado en la transacción
- `monto_total` (numeric, OBLIGATORIO) — Monto total del concepto o arancel
- `monto_pendiente` (numeric, OBLIGATORIO, default 0.00) — Saldo deudor restante tras el pago
- `numero_cuota` (integer, OBLIGATORIO, default 1) — Número de cuota/fracción
- `total_cuotas` (integer, OBLIGATORIO, default 1) — Cantidad total de cuotas acordadas
- `fecha_vencimiento` (date, nullable) — Fecha límite para la siguiente cuota o saldo
- `pago_padre_id` (uuid, FK reflexiva a pagos, nullable) — ID del pago inicial/compromiso de la serie
- `estado` (varchar, OBLIGATORIO, CHECK IN ('Pendiente', 'Emitido', 'Pagado', 'Anulado'))
- `motivo_anulacion` (text, nullable) — Razón administrativa de la anulación
- `observaciones` (text)
- `usuario_id` (uuid, FK usuarios)

---

## GRUPO 9: GESTIÓN DOCUMENTAL, USUARIOS Y AUDITORÍA

### 51. `tipos_documentos`
- `id` (uuid, PK, autogenerado)
- `codigo` (varchar, OBLIGATORIO, ÚNICO)
- `nombre` (varchar, OBLIGATORIO)
- `categoria` (varchar)
- `extension_permitida` (varchar)

### 52. `documentos`
- `id` (uuid, PK, autogenerado)
- `tipo_documento_id` (uuid, FK tipos_documentos, OBLIGATORIO)
- `nombre_archivo` (varchar, OBLIGATORIO)
- `ruta_storage` (text, OBLIGATORIO)
- `mime_type` (varchar)
- `tamano_bytes` (bigint)
- `hash_archivo` (varchar)
- `fecha_carga` (timestamptz, OBLIGATORIO, default CURRENT_TIMESTAMP)
- `usuario_id` (uuid, FK usuarios)
- `observaciones` (text)

### 53. `usuarios`
- `id` (uuid, PK, autogenerado)
- `persona_id` (uuid, FK personas, OBLIGATORIO, ÚNICO)
- `username` (varchar, OBLIGATORIO, ÚNICO)
- `password_hash` (text, OBLIGATORIO)
- `ultimo_acceso` (timestamptz)

### 54. `roles_sistemas`
- `id` (uuid, PK, autogenerado)
- `codigo` (varchar, OBLIGATORIO, ÚNICO)
- `nombre` (varchar, OBLIGATORIO)
- `descripcion` (text)

### 55. `usuarios_roles`
- `id` (uuid, PK, autogenerado)
- `usuario_id` (uuid, FK usuarios, OBLIGATORIO)
- `rol_sistema_id` (uuid, FK roles_sistemas, OBLIGATORIO)

### 56. `permisos`
- `id` (uuid, PK, autogenerado)
- `codigo` (varchar, OBLIGATORIO, ÚNICO)
- `nombre` (varchar, OBLIGATORIO)
- `modulo` (varchar)
- `accion` (varchar)
- `descripcion` (text)

### 57. `roles_permisos`
- `id` (uuid, PK, autogenerado)
- `rol_sistema_id` (uuid, FK roles_sistemas, OBLIGATORIO)
- `permiso_id` (uuid, FK permisos, OBLIGATORIO)

### 58. `auditorias`
- `id` (uuid, PK, autogenerado)
- `usuario_id` (uuid, FK usuarios)
- `fecha_hora` (timestamptz, OBLIGATORIO, default CURRENT_TIMESTAMP)
- `accion` (varchar, OBLIGATORIO)
- `tabla` (varchar, OBLIGATORIO)
- `registro_id` (uuid)
- `datos_anteriores` (jsonb)
- `datos_nuevos` (jsonb)
- `ip` (varchar)
- `user_agent` (text)
