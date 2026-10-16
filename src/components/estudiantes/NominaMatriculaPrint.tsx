import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Printer, X, FileText } from 'lucide-react';
import { comparePersonasAlphabetical } from '../../utils/sortPersonas';
import { normalizeSexo } from '../../utils/genero';

interface NominaMatriculaPrintProps {
  isOpen: boolean;
  onClose: () => void;
  seccionId: string;
}

export const NominaMatriculaPrint: React.FC<NominaMatriculaPrintProps> = ({
  isOpen,
  onClose,
  seccionId,
}) => {
  const {
    institucion,
    secciones,
    modulos,
    programas,
    periodosClases,
    periodosAcademicos,
    periodosLectivos,
    matriculas,
    estudiantes,
    personas,
    unidades,
    sedes,
  } = useApp();

  const [isPrinting, setIsPrinting] = useState(false);

  if (!isOpen || !seccionId) return null;

  // Resolve section and parent entities
  const seccion = secciones.find(s => s.id === seccionId);
  const modulo = seccion ? modulos.find(m => m.id === seccion.moduloId) : undefined;
  const programa = modulo 
    ? programas.find(p => p.id === modulo.programaId)
    : (seccion ? programas.find(p => p.id === seccion.planEstudioId) : undefined);

  const periodoClase = seccion?.periodoClasesId
    ? periodosClases.find(pc => pc.id === seccion.periodoClasesId)
    : periodosClases[0];

  const periodoAcademico = periodoClase?.periodoAcademicoId
    ? periodosAcademicos.find(pa => pa.id === periodoClase.periodoAcademicoId)
    : periodosAcademicos[0];

  const anioLectivo = periodoAcademico?.periodoLectivoId
    ? periodosLectivos.find(pl => pl.id === periodoAcademico.periodoLectivoId)
    : periodosLectivos[0];

  const anioDisplay = anioLectivo?.codigo || new Date().getFullYear().toString();

  // Filter students enrolled in this section
  const matriculasSeccion = matriculas.filter(m => {
    if (m.seccionId !== seccion?.id) return false;
    const st = (m.estadoMatricula || '').toUpperCase();
    return st !== 'ANULADA' && st !== 'RETIRADO' && st !== 'INACTIVA';
  });

  // Calculate number of UDs and total credits for this module
  const unidadesModulo = unidades.filter(u => u.moduloId === modulo?.id);
  const numUD = unidadesModulo.length > 0 ? unidadesModulo.length : 6;
  const numCreditos = modulo?.creditos 
    || modulo?.totalCreditos 
    || (unidadesModulo.length > 0 ? unidadesModulo.reduce((acc, u) => acc + (u.creditos || 0), 0) : 21);

  // Formatter: tipo oración en minúsculas (primera mayúscula, resto en minúsculas)
  const formatSentenceCase = (text?: string) => {
    if (!text) return '---';
    const trimmed = text.trim();
    if (!trimmed) return '---';
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
  };

  // Name formatter: APELLIDO PATERNO MATERNO en mayúsculas, seguido de coma y nombres propios
  const formatNombreCompleto = (persona?: any) => {
    if (!persona) return '---';
    const pat = (persona.apellidoPaterno || '').trim().toUpperCase();
    const mat = (persona.apellidoMaterno || '').trim().toUpperCase();
    const apellidos = [pat, mat].filter(Boolean).join(' ');

    const formatNombrePropio = (str: string) => {
      return str
        .toLowerCase()
        .split(' ')
        .filter(Boolean)
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
    };

    const nombres = formatNombrePropio(persona.nombres || '');
    return apellidos ? `${apellidos}, ${nombres}` : nombres;
  };

  // Format date DD/MM/YYYY
  const formatDMA = (isoDate?: string) => {
    if (!isoDate) return '';
    const parts = isoDate.split('T')[0].split('-');
    if (parts.length === 3) {
      return `${parts[2].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[0]}`;
    }
    return isoDate;
  };

  // Format Periodo de clases (e.g. "Del 11 de agosto hasta el 19 de diciembre")
  const formatPeriodoClases = (inicio?: string, fin?: string) => {
    if (!inicio || !fin) return '---';
    const meses = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'setiembre', 'octubre', 'noviembre', 'diciembre'
    ];
    const parseDate = (dStr: string) => {
      const parts = dStr.split('T')[0].split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        return { day, monthName: meses[month] || '', year };
      }
      return null;
    };
    const d1 = parseDate(inicio);
    const d2 = parseDate(fin);
    if (d1 && d2) {
      return `Del ${d1.day} de ${d1.monthName} hasta el ${d2.day} de ${d2.monthName}`;
    }
    return `Del ${inicio} hasta el ${fin}`;
  };

  // Build mapped student array: EN CÓDIGO DE MATRÍCULA VA EL NÚMERO DE DNI
  const estudiantesList = matriculasSeccion
    .map(mat => {
      const est = estudiantes.find(e => e.id === mat.estudianteId);
      const per = est ? personas.find(p => p.id === est.personaId) : null;
      
      let cond = 'G';
      if (mat.condicion) {
        const c = mat.condicion.toUpperCase().trim();
        if (c.startsWith('P')) cond = 'P';
        else if (c.startsWith('B')) cond = 'B';
      }

      // En la columna "Código Matrícula" va el número de DNI
      const dniVal = per?.numeroDocumento || est?.codigoEstudiante || '';

      return {
        matricula: mat,
        estudiante: est,
        persona: per,
        dni: dniVal,
        nombreFormateado: formatNombreCompleto(per),
        sexo: normalizeSexo(per?.sexo || (per as any)?.genero),
        fechaNacimiento: formatDMA(per?.fechaNacimiento),
        condicion: cond,
      };
    })
    .sort((a, b) => comparePersonasAlphabetical(a.persona, b.persona));

  // Summary counts
  const countHombres = estudiantesList.filter(e => e.sexo === 'H').length;
  const countMujeres = estudiantesList.filter(e => e.sexo === 'M').length;
  const totalAlumnos = estudiantesList.length;

  const countGratuitos = estudiantesList.filter(e => e.condicion === 'G').length;
  const countPagantes = estudiantesList.filter(e => e.condicion === 'P').length;
  const countBecarios = estudiantesList.filter(e => e.condicion === 'B').length;

  // Date at bottom left: "Fecha: 21 de abril del 2025"
  const getFechaPie = () => {
    const d = new Date();
    const meses = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'setiembre', 'octubre', 'noviembre', 'diciembre'
    ];
    return `Fecha: ${d.getDate()} de ${meses[d.getMonth()]} del ${d.getFullYear()}`;
  };

  // Generate 40 fixed rows
  const TOTAL_FILAS = 40;
  const rows = Array.from({ length: TOTAL_FILAS }, (_, i) => {
    const student = estudiantesList[i];
    const rowNum = (i + 1).toString().padStart(2, '0');
    const isClosureRow = i === estudiantesList.length;
    return {
      index: i,
      rowNum,
      student,
      isClosureRow,
    };
  });

  const logoMineduUrl = '/logos/LogoMinedu.png';
  const logoCetproUrl = '/logos/LogoCetpro.png';

  // Formateo exacto de la sección: letra un guion y la sede correspondiente de la sección
  const getSeccionTexto = () => {
    if (!seccion) return '---';
    if (seccion.nombre && seccion.nombre.includes('-')) {
      return seccion.nombre.replace(/secci[oó]n/gi, '').trim();
    }
    const letra = (seccion.nombre || 'A').replace(/secci[oó]n/gi, '').trim() || 'A';
    const sedeObj = sedes.find(s => s.id === seccion.sedeId);
    const sedeNom = seccion.sedeNombre || sedeObj?.nombre || institucion.distrito || 'Juanjui';
    return `${letra} - ${sedeNom}`;
  };

  const seccionTexto = getSeccionTexto();

  // Alturas calibradas:
  const ROW_H_TITLE = '7.7mm';    // Fila de título (DATOS DEL CENTRO...) igualada a 7.7mm
  const ROW_H_META = '4.5mm';     // Altura estándar de filas superiores
  const ROW_H_RES = '7.7mm';      // Fila de resoluciones (7.7mm, texto 6.8pt)
  const ROW_H_MOD = '7.7mm';      // Fila de módulo formativo igualada a resoluciones (7.7mm)
  const ROW_H_EST = '3.6mm';      // Altura para las 40 filas de estudiantes

  // Isolated clean print generator fitting strictly into 1 single A4 sheet
  const generatePrintableHtml = () => {
    const studentRowsHtml = rows.map(({ rowNum, student, isClosureRow }) => {
      if (student) {
        return `
          <tr style="height: ${ROW_H_EST};">
            <td style="border: 1px solid #000; text-align: center; font-family: monospace; font-size: 6.4pt; padding: 0; vertical-align: middle;">${rowNum}</td>
            <td style="border: 1px solid #000; text-align: center; font-family: monospace; font-size: 6.4pt; padding: 0; vertical-align: middle;">${student.dni}</td>
            <td style="border: 1px solid #000; text-align: left; font-size: 6.7pt; padding: 0 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; vertical-align: middle;">${student.nombreFormateado}</td>
            <td style="border: 1px solid #000; text-align: center; font-weight: bold; font-size: 6.6pt; padding: 0; vertical-align: middle;">${student.sexo}</td>
            <td style="border: 1px solid #000; text-align: center; font-family: monospace; font-size: 6.4pt; padding: 0; vertical-align: middle;">${student.fechaNacimiento}</td>
            <td style="border: 1px solid #000; text-align: center; font-weight: bold; font-size: 6.6pt; padding: 0; vertical-align: middle;">${student.condicion}</td>
            <td style="border: 1px solid #000; text-align: center; font-family: monospace; font-size: 6.4pt; padding: 0; vertical-align: middle;">${numUD}</td>
            <td style="border: 1px solid #000; text-align: center; font-family: monospace; font-size: 6.4pt; padding: 0; vertical-align: middle;">${numCreditos}</td>
          </tr>
        `;
      } else if (isClosureRow) {
        return `
          <tr style="height: ${ROW_H_EST};">
            <td style="border: 1px solid #000; text-align: center; font-family: monospace; font-size: 6.4pt; padding: 0; vertical-align: middle;">${rowNum}</td>
            <td colspan="7" style="border: 1px solid #000; padding: 0; vertical-align: middle; position: relative;">
              <div style="width: 100%; height: 2px; background-color: #dc2626; margin: 0;"></div>
            </td>
          </tr>
        `;
      } else {
        return `
          <tr style="height: ${ROW_H_EST};">
            <td style="border: 1px solid #000; text-align: center; font-family: monospace; font-size: 6.4pt; padding: 0; vertical-align: middle;">${rowNum}</td>
            <td style="border: 1px solid #000; padding: 0; vertical-align: middle;">&nbsp;</td>
            <td style="border: 1px solid #000; padding: 0; vertical-align: middle;">&nbsp;</td>
            <td style="border: 1px solid #000; padding: 0; vertical-align: middle;">&nbsp;</td>
            <td style="border: 1px solid #000; padding: 0; vertical-align: middle;">&nbsp;</td>
            <td style="border: 1px solid #000; padding: 0; vertical-align: middle;">&nbsp;</td>
            <td style="border: 1px solid #000; padding: 0; vertical-align: middle;">&nbsp;</td>
            <td style="border: 1px solid #000; padding: 0; vertical-align: middle;">&nbsp;</td>
          </tr>
        `;
      }
    }).join('');

    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Nomina_Matricula_Modular_${anioDisplay}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 7mm 10mm 5mm 15mm; /* Margen A4 óptimo */
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      background: #fff;
      color: #000;
      font-family: Arial, Helvetica, sans-serif;
      font-size: 6.5pt;
      line-height: 1.1;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      table-layout: fixed;
    }
    .page-layout {
      width: 100%;
      height: 100%;
      max-height: 284mm;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      page-break-inside: avoid;
      page-break-after: avoid;
    }
    .header-box {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2mm;
    }
    .meta-table td {
      border: 1px solid #000;
      padding: 0 4px;
      font-size: 6.8pt;
      height: ${ROW_H_META};
      line-height: 1.1;
      vertical-align: middle;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .meta-table td.multiline {
      white-space: normal;
      line-height: 1.15;
    }
    .lbl {
      font-weight: bold;
    }
    .val {
      font-weight: normal;
    }
    .students-table th {
      border: 1px solid #000;
      background-color: #fff;
      font-size: 6pt;
      padding: 1px;
      font-weight: bold;
      text-align: center;
      line-height: 1.08;
      vertical-align: middle;
      height: 6.5mm;
    }
    .signatures-box {
      display: flex;
      justify-content: space-between;
      text-align: center;
      margin-top: 2.5mm;
      margin-bottom: 0.5mm;
      padding: 0 4mm;
    }
  </style>
</head>
<body>
  <div class="page-layout">
    <div class="top-content">
      <!-- 1. Encabezado Oficial con Logos aumentados un 50% y Título Exclusivo 2025 -->
      <div class="header-box">
        <div style="width: 140px; text-align: left;">
          <img src="${logoMineduUrl}" alt="MINEDU" style="height: 42px; max-width: 140px; object-fit: contain;" />
        </div>
        <div style="flex: 1; text-align: center; padding: 0 4px;">
          <div style="font-family: Arial, Helvetica, sans-serif; font-weight: bold; font-size: 9.5pt; text-transform: uppercase; line-height: 1.1; letter-spacing: 0.2px;">
            NÓMINA DE MATRÍCULA MODULAR ${anioDisplay}
          </div>
          <div style="font-family: Arial, Helvetica, sans-serif; font-weight: bold; font-size: 8pt; text-transform: uppercase; line-height: 1.1; margin-top: 2px;">
            EDUCACIÓN TÉCNICO-PRODUCTIVA
          </div>
        </div>
        <div style="width: 140px; text-align: right;">
          <img src="${logoCetproUrl}" alt="CETPRO" style="height: 43.5px; max-width: 140px; object-fit: contain;" />
        </div>
      </div>

      <!-- 2. Tabla de Metadatos Oficial con Etiquetas en Negrita -->
      <table class="meta-table" style="margin-bottom: 2mm;">
        <colgroup>
          <col style="width: 25%;" />
          <col style="width: 25%;" />
          <col style="width: 27%;" />
          <col style="width: 23%;" />
        </colgroup>
        <tbody>
          <!-- Fila de título igualada a 7.7mm -->
          <tr style="height: ${ROW_H_TITLE};">
            <td colspan="4" style="height: ${ROW_H_TITLE}; font-weight: bold; font-size: 7.5pt; padding: 0 4px; text-align: left; vertical-align: middle;">
              DATOS DEL CENTRO DE EDUCACIÓN TÉCNICO-PRODUCTIVA
            </td>
          </tr>
          <tr style="height: ${ROW_H_META};">
            <td class="lbl">Nombre del CETPRO:</td>
            <td class="val">${institucion.nombre || 'Juanjui'}</td>
            <td class="lbl">DRE/GRE:</td>
            <td class="val">${institucion.dre || 'San Martín'}</td>
          </tr>
          <tr style="height: ${ROW_H_META};">
            <td class="lbl">Código modular:</td>
            <td class="val">${institucion.codigoModular || '0533836'}</td>
            <td class="lbl">UGEL:</td>
            <td class="val">${institucion.ugel || 'Mariscal Cáceres'}</td>
          </tr>
          <!-- Fila de Resoluciones (7.7mm) con letra del mismo tamaño que las demás (6.8pt) -->
          <tr style="height: ${ROW_H_RES};">
            <td class="lbl multiline" style="height: ${ROW_H_RES}; font-size: 6.8pt; line-height: 1.15; vertical-align: middle;">
              Resolución de creación o autorización:
            </td>
            <td class="val multiline" style="height: ${ROW_H_RES}; font-size: 6.8pt; line-height: 1.15; vertical-align: middle;">
              ${institucion.resolucionAutorizacion || 'R.D.R. Nº 02352 del 04-08-1971'}
            </td>
            <td class="lbl multiline" style="height: ${ROW_H_RES}; font-size: 6.8pt; line-height: 1.15; vertical-align: middle;">
              Resolución de autorización del programa de estudios:
            </td>
            <td class="val multiline" style="height: ${ROW_H_RES}; font-size: 6.8pt; line-height: 1.15; vertical-align: middle;">
              ${programa?.resolucionAutorizacion || 'R.D.N°003221-2024-GRSM/DRE/UGEL-MC'}
            </td>
          </tr>
          <tr style="height: ${ROW_H_META};">
            <td class="lbl">Departamento:</td>
            <td class="val">${institucion.region || institucion.departamento || 'San Martín'}</td>
            <td class="lbl">Provincia:</td>
            <td class="val">${institucion.provincia || 'Mariscal Cáceres'}</td>
          </tr>
          <tr style="height: ${ROW_H_META};">
            <td class="lbl">Distrito:</td>
            <td class="val">${institucion.distrito || 'Juanjui'}</td>
            <td class="lbl">Tipo de Gestión:</td>
            <td class="val">${institucion.tipoGestion || 'Pública'}</td>
          </tr>
          <tr style="height: ${ROW_H_META};">
            <td class="lbl">Dirección:</td>
            <td class="val">${institucion.direccion || 'Jiron Huallaga Nº 311'}</td>
            <td class="lbl">Periodo lectivo:</td>
            <td class="val">${anioDisplay}</td>
          </tr>
          <tr style="height: ${ROW_H_META};">
            <td class="lbl">Programa de estudios:</td>
            <td class="val">${programa?.nombre || 'ESTILISMO'}</td>
            <td class="lbl">Periodo académico:</td>
            <td class="val">${periodoAcademico?.codigo || seccion?.periodoAcademico || '2025-2'}</td>
          </tr>
          <!-- Fila de Módulo formativo igualada a 7.7mm con texto en tipo oración -->
          <tr style="height: ${ROW_H_MOD};">
            <td class="lbl" style="height: ${ROW_H_MOD}; vertical-align: middle;">
              Módulo formativo:
            </td>
            <td class="val multiline" style="height: ${ROW_H_MOD}; font-size: 6.8pt; line-height: 1.15; vertical-align: middle;">
              ${formatSentenceCase(modulo?.nombre || 'Manicure y pedicure')}
            </td>
            <td class="lbl" style="height: ${ROW_H_MOD}; vertical-align: middle;">
              Periodo de clases:
            </td>
            <td class="val multiline" style="height: ${ROW_H_MOD}; font-size: 6.6pt; line-height: 1.15; vertical-align: middle;">
              ${formatPeriodoClases(periodoClase?.fechaInicio, periodoClase?.fechaFin)}
            </td>
          </tr>
          <tr style="height: ${ROW_H_META};">
            <td class="lbl">Nivel formativo:</td>
            <td class="val">${programa?.nivelFormativo || 'Técnico'}</td>
            <td class="lbl">Formación¹:</td>
            <td class="val">${seccion?.formacion || ''}</td>
          </tr>
          <tr style="height: ${ROW_H_META};">
            <td class="lbl">Tipo de plan de estudios:</td>
            <td class="val">Modular</td>
            <td class="lbl">Modalidad del servicio educativo:</td>
            <td class="val">${seccion?.modalidadEducativa || 'Presencial'}</td>
          </tr>
          <tr style="height: ${ROW_H_META};">
            <td class="lbl">Turno:</td>
            <td class="val">${seccion?.turno || 'Tarde'}</td>
            <td class="lbl">Sección:</td>
            <td class="val">${seccionTexto}</td>
          </tr>
        </tbody>
      </table>

      <!-- 3. Tabla Principal de 40 Estudiantes (Filas de 3.6mm) -->
      <table class="students-table" style="margin-bottom: 1.5mm;">
        <colgroup>
          <col style="width: 4%;" />
          <col style="width: 13%;" />
          <col style="width: 41%;" />
          <col style="width: 6%;" />
          <col style="width: 12%;" />
          <col style="width: 8%;" />
          <col style="width: 8%;" />
          <col style="width: 8%;" />
        </colgroup>
        <thead>
          <tr>
            <th>Nº</th>
            <th>Código Matrícula²</th>
            <th>Apellidos y Nombres<br/>(Orden Alfabético)</th>
            <th>Sexo<br/>H-M</th>
            <th>Fecha de<br/>nacimiento</th>
            <th>Condición³</th>
            <th>N° de<br/>Unidades<br/>Didácticas⁴</th>
            <th>N° de créditos⁵</th>
          </tr>
        </thead>
        <tbody>
          ${studentRowsHtml}
        </tbody>
      </table>

      <!-- 4. Notas al Pie (Legenda Oficial 1 a 5) -->
      <div style="font-size: 5pt; line-height: 1.25; margin-bottom: 2mm; color: #000;">
        <div>1 Indicar solo en el caso de que sea Dual o en Alternancia, caso contrario dejar la celda en blanco.</div>
        <div>2 DNI/Carnet de extranjeria o pasaporte.</div>
        <div>3 La condición puede ser: Gratuito, Pagante o Becado</div>
        <div>4 N° de unidades didácticas: Indicar el número de UD en las que se ha matriculado el/la estudiante, según la Ficha de Registro de Matrícula (Anexo N°1- LAG).</div>
        <div>5 N° de créditos: Indicar el número total de créditos de las UD en las que se ha matriculado el/la estudiante.</div>
      </div>

      <!-- 5. Cuadros de Resumen -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; font-size: 6.2pt;">
        <div>
          <table style="width: 140px; text-align: center; border: 1px solid #000;">
            <thead>
              <tr style="height: 3.5mm; font-weight: bold;">
                <td style="border: 1px solid #000; padding: 0 2px; vertical-align: middle;">Hombres</td>
                <td style="border: 1px solid #000; padding: 0 2px; vertical-align: middle;">Mujeres</td>
                <td style="border: 1px solid #000; padding: 0 2px; vertical-align: middle;">Total</td>
              </tr>
            </thead>
            <tbody>
              <tr style="height: 3.5mm; font-family: monospace;">
                <td style="border: 1px solid #000; padding: 0 2px; vertical-align: middle;">${countHombres}</td>
                <td style="border: 1px solid #000; padding: 0 2px; vertical-align: middle;">${countMujeres}</td>
                <td style="border: 1px solid #000; padding: 0 2px; vertical-align: middle;">${totalAlumnos}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div>
          <table style="width: 200px; text-align: center; border: 1px solid #000;">
            <thead>
              <tr style="height: 3.5mm; font-weight: bold;">
                <td style="border: 1px solid #000; padding: 0 2px; vertical-align: middle;">Gratuitos</td>
                <td style="border: 1px solid #000; padding: 0 2px; vertical-align: middle;">Pagantes</td>
                <td style="border: 1px solid #000; padding: 0 2px; vertical-align: middle;">Becados</td>
              </tr>
            </thead>
            <tbody>
              <tr style="height: 3.5mm; font-family: monospace;">
                <td style="border: 1px solid #000; padding: 0 2px; vertical-align: middle;">${countGratuitos}</td>
                <td style="border: 1px solid #000; padding: 0 2px; vertical-align: middle;">${countPagantes}</td>
                <td style="border: 1px solid #000; padding: 0 2px; vertical-align: middle;">${countBecarios}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 6. Fecha -->
      <div style="text-align: left; font-size: 6.4pt; font-family: Arial, Helvetica, sans-serif; margin-top: 2mm;">
        ${getFechaPie()}
      </div>
    </div>

    <!-- 7. Tres Firmas Oficiales: Director(a), Coordinador(a) y Docente al límite inferior en gris al 30% -->
    <div class="signatures-box">
      <div style="width: 145px;">
        <div style="border-top: 1px solid #b3b3b3; width: 130px; margin: 0 auto 2px auto;"></div>
        <div style="font-size: 7pt; font-weight: bold; color: #666;">Director(a)</div>
        <div style="font-size: 5.6pt; color: #888;">Sello, firma y post firma</div>
      </div>

      <div style="width: 145px;">
        <div style="border-top: 1px solid #b3b3b3; width: 130px; margin: 0 auto 2px auto;"></div>
        <div style="font-size: 7pt; font-weight: bold; color: #666;">Coordinador(a) Académico</div>
        <div style="font-size: 5.6pt; color: #888;">Sello, firma y post firma</div>
      </div>

      <div style="width: 145px;">
        <div style="border-top: 1px solid #b3b3b3; width: 130px; margin: 0 auto 2px auto;"></div>
        <div style="font-size: 7pt; font-weight: bold; color: #666;">Docente</div>
        <div style="font-size: 5.6pt; color: #888;">Sello, firma y post firma</div>
      </div>
    </div>
  </div>
</body>
</html>`;
  };

  // Direct clean printing via isolated invisible iframe
  const handlePrint = () => {
    setIsPrinting(true);
    const html = generatePrintableHtml();

    const oldIframe = document.getElementById('siga-nomina-print-iframe');
    if (oldIframe) {
      oldIframe.remove();
    }

    const iframe = document.createElement('iframe');
    iframe.id = 'siga-nomina-print-iframe';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.visibility = 'hidden';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (!doc) {
      window.print();
      setIsPrinting(false);
      return;
    }

    doc.open();
    doc.write(html);
    doc.close();

    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (err) {
        console.error('Error invoking iframe print:', err);
        window.print();
      } finally {
        setTimeout(() => {
          setIsPrinting(false);
        }, 800);
      }
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/80 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-5xl my-auto flex flex-col max-h-[96vh] overflow-hidden">
        
        {/* Modal Action Header (Excluded from Print) */}
        <div className="px-6 py-3.5 bg-slate-900 text-white flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 border border-rose-400/30 flex items-center justify-center text-rose-400">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold tracking-tight text-white">
                  Nómina Oficial de Matrícula MINEDU 2025 (A4)
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/30 text-rose-200 border border-rose-400/30 font-mono">
                  MINEDU 2025
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {programa?.nombre || 'Programa'} — {modulo?.nombre || 'Módulo'} ({seccion?.nombre || 'Sección'}) • {totalAlumnos} alumnos
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              disabled={isPrinting}
              className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <Printer className="w-4 h-4" />
              <span>{isPrinting ? 'Abriendo Impresión...' : 'Imprimir Nómina Limpia'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Document Container / Scroll Area */}
        <div className="overflow-y-auto p-4 sm:p-6 bg-slate-200 flex justify-center print:p-0 print:bg-white">
          
          {/* Exact A4 Sheet Preview matching nomina_2025.pdf 1:1 with optimized row heights and logos */}
          <div
            id="nomina-matricula-print-sheet"
            className="bg-white text-black font-sans shadow-xl border border-slate-300 flex flex-col justify-between"
            style={{
              width: '210mm',
              minHeight: '297mm',
              maxHeight: '297mm',
              paddingTop: '7mm',
              paddingLeft: '15mm',
              paddingRight: '10mm',
              paddingBottom: '5mm',
              boxSizing: 'border-box',
              fontSize: '6.5pt',
              lineHeight: 1.1,
            }}
          >
            <div>
              {/* 1. Header with Logos (+50% size) and Clean 2025 Title */}
              <div className="flex items-center justify-between mb-2">
                <div className="w-36 flex items-center justify-start">
                  <img
                    src={logoMineduUrl}
                    alt="Ministerio de Educación"
                    style={{ height: '42px', maxWidth: '140px', objectFit: 'contain' }}
                    crossOrigin="anonymous"
                  />
                </div>

                <div className="text-center flex-1 px-2">
                  <h1 className="font-sans font-bold text-[9.5pt] tracking-tight text-black uppercase leading-tight">
                    NÓMINA DE MATRÍCULA MODULAR {anioDisplay}
                  </h1>
                  <h2 className="font-sans font-bold text-[8pt] text-black uppercase tracking-tight mt-0.5">
                    EDUCACIÓN TÉCNICO-PRODUCTIVA
                  </h2>
                </div>

                <div className="w-36 flex items-center justify-end">
                  <img
                    src={logoCetproUrl}
                    alt="Logo CETPRO"
                    style={{ height: '43.5px', maxWidth: '140px', objectFit: 'contain' }}
                    crossOrigin="anonymous"
                  />
                </div>
              </div>

              {/* 2. Top Metadata Table with Labels in Bold */}
              <table className="w-full border-collapse border border-black text-[6.8pt] mb-2 text-black" style={{ tableLayout: 'fixed' }}>
                <colgroup>
                  <col style={{ width: '25%' }} />
                  <col style={{ width: '25%' }} />
                  <col style={{ width: '27%' }} />
                  <col style={{ width: '23%' }} />
                </colgroup>
                <tbody>
                  {/* Fila de título igualada a 7.7mm */}
                  <tr style={{ height: ROW_H_TITLE }}>
                    <td colSpan={4} className="border border-black px-2 font-bold text-[7.5pt] text-left align-middle truncate" style={{ height: ROW_H_TITLE }}>
                      DATOS DEL CENTRO DE EDUCACIÓN TÉCNICO-PRODUCTIVA
                    </td>
                  </tr>
                  <tr style={{ height: ROW_H_META }}>
                    <td className="border border-black px-2 align-middle font-bold truncate">Nombre del CETPRO:</td>
                    <td className="border border-black px-2 align-middle truncate">{institucion.nombre || 'Juanjui'}</td>
                    <td className="border border-black px-2 align-middle font-bold truncate">DRE/GRE:</td>
                    <td className="border border-black px-2 align-middle truncate">{institucion.dre || 'San Martín'}</td>
                  </tr>
                  <tr style={{ height: ROW_H_META }}>
                    <td className="border border-black px-2 align-middle font-bold truncate">Código modular:</td>
                    <td className="border border-black px-2 align-middle truncate">{institucion.codigoModular || '0533836'}</td>
                    <td className="border border-black px-2 align-middle font-bold truncate">UGEL:</td>
                    <td className="border border-black px-2 align-middle truncate">{institucion.ugel || 'Mariscal Cáceres'}</td>
                  </tr>
                  {/* Fila de Resoluciones (7.7mm) */}
                  <tr style={{ height: ROW_H_RES }}>
                    <td className="border border-black px-2 align-middle font-bold text-[6.8pt] leading-tight" style={{ height: ROW_H_RES }}>
                      Resolución de creación o autorización:
                    </td>
                    <td className="border border-black px-2 align-middle text-[6.8pt] leading-tight" style={{ height: ROW_H_RES }}>
                      {institucion.resolucionAutorizacion || 'R.D.R. Nº 02352 del 04-08-1971'}
                    </td>
                    <td className="border border-black px-2 align-middle font-bold text-[6.8pt] leading-tight" style={{ height: ROW_H_RES }}>
                      Resolución de autorización del programa de estudios:
                    </td>
                    <td className="border border-black px-2 align-middle text-[6.8pt] leading-tight" style={{ height: ROW_H_RES }}>
                      {programa?.resolucionAutorizacion || 'R.D.N°003221-2024-GRSM/DRE/UGEL-MC'}
                    </td>
                  </tr>
                  <tr style={{ height: ROW_H_META }}>
                    <td className="border border-black px-2 align-middle font-bold truncate">Departamento:</td>
                    <td className="border border-black px-2 align-middle truncate">{institucion.region || institucion.departamento || 'San Martín'}</td>
                    <td className="border border-black px-2 align-middle font-bold truncate">Provincia:</td>
                    <td className="border border-black px-2 align-middle truncate">{institucion.provincia || 'Mariscal Cáceres'}</td>
                  </tr>
                  <tr style={{ height: ROW_H_META }}>
                    <td className="border border-black px-2 align-middle font-bold truncate">Distrito:</td>
                    <td className="border border-black px-2 align-middle truncate">{institucion.distrito || 'Juanjui'}</td>
                    <td className="border border-black px-2 align-middle font-bold truncate">Tipo de Gestión:</td>
                    <td className="border border-black px-2 align-middle truncate">{institucion.tipoGestion || 'Pública'}</td>
                  </tr>
                  <tr style={{ height: ROW_H_META }}>
                    <td className="border border-black px-2 align-middle font-bold truncate">Dirección:</td>
                    <td className="border border-black px-2 align-middle truncate">{institucion.direccion || 'Jiron Huallaga Nº 311'}</td>
                    <td className="border border-black px-2 align-middle font-bold truncate">Periodo lectivo:</td>
                    <td className="border border-black px-2 align-middle truncate">{anioDisplay}</td>
                  </tr>
                  <tr style={{ height: ROW_H_META }}>
                    <td className="border border-black px-2 align-middle font-bold truncate">Programa de estudios:</td>
                    <td className="border border-black px-2 align-middle truncate">{programa?.nombre || 'ESTILISMO'}</td>
                    <td className="border border-black px-2 align-middle font-bold truncate">Periodo académico:</td>
                    <td className="border border-black px-2 align-middle truncate">{periodoAcademico?.codigo || seccion?.periodoAcademico || '2025-2'}</td>
                  </tr>
                  {/* Fila de Módulo formativo igualada a 7.7mm con nombre en tipo oración */}
                  <tr style={{ height: ROW_H_MOD }}>
                    <td className="border border-black px-2 align-middle font-bold" style={{ height: ROW_H_MOD }}>
                      Módulo formativo:
                    </td>
                    <td className="border border-black px-2 align-middle text-[6.8pt] leading-snug" style={{ height: ROW_H_MOD }}>
                      {formatSentenceCase(modulo?.nombre || 'Manicure y pedicure')}
                    </td>
                    <td className="border border-black px-2 align-middle font-bold" style={{ height: ROW_H_MOD }}>
                      Periodo de clases:
                    </td>
                    <td className="border border-black px-2 align-middle text-[6.6pt] leading-snug" style={{ height: ROW_H_MOD }}>
                      {formatPeriodoClases(periodoClase?.fechaInicio, periodoClase?.fechaFin)}
                    </td>
                  </tr>
                  <tr style={{ height: ROW_H_META }}>
                    <td className="border border-black px-2 align-middle font-bold truncate">Nivel formativo:</td>
                    <td className="border border-black px-2 align-middle truncate">{programa?.nivelFormativo || 'Técnico'}</td>
                    <td className="border border-black px-2 align-middle font-bold truncate">Formación¹:</td>
                    <td className="border border-black px-2 align-middle truncate">{seccion?.formacion || ''}</td>
                  </tr>
                  <tr style={{ height: ROW_H_META }}>
                    <td className="border border-black px-2 align-middle font-bold truncate">Tipo de plan de estudios:</td>
                    <td className="border border-black px-2 align-middle truncate">Modular</td>
                    <td className="border border-black px-2 align-middle font-bold truncate">Modalidad del servicio educativo:</td>
                    <td className="border border-black px-2 align-middle truncate">{seccion?.modalidadEducativa || 'Presencial'}</td>
                  </tr>
                  <tr style={{ height: ROW_H_META }}>
                    <td className="border border-black px-2 align-middle font-bold truncate">Turno:</td>
                    <td className="border border-black px-2 align-middle truncate">{seccion?.turno || 'Tarde'}</td>
                    <td className="border border-black px-2 align-middle font-bold truncate">Sección:</td>
                    <td className="border border-black px-2 align-middle truncate">{seccionTexto}</td>
                  </tr>
                </tbody>
              </table>

              {/* 3. Tabla Principal de 40 Estudiantes (3.6mm) */}
              <table className="w-full border-collapse border border-black text-[6.5pt] text-black mb-1.5" style={{ tableLayout: 'fixed' }}>
                <colgroup>
                  <col style={{ width: '4%' }} />
                  <col style={{ width: '13%' }} />
                  <col style={{ width: '41%' }} />
                  <col style={{ width: '6%' }} />
                  <col style={{ width: '12%' }} />
                  <col style={{ width: '8%' }} />
                  <col style={{ width: '8%' }} />
                  <col style={{ width: '8%' }} />
                </colgroup>
                <thead>
                  <tr className="bg-white text-center font-bold" style={{ height: '6.5mm' }}>
                    <th className="border border-black py-0.5 px-0.5 align-middle text-[6pt]">Nº</th>
                    <th className="border border-black py-0.5 px-1 align-middle text-[6pt]">Código Matrícula²</th>
                    <th className="border border-black py-0.5 px-1 text-center align-middle text-[6pt]">
                      Apellidos y Nombres<br/>(Orden Alfabético)
                    </th>
                    <th className="border border-black py-0.5 px-0.5 align-middle text-[6pt]">Sexo<br/>H-M</th>
                    <th className="border border-black py-0.5 px-1 align-middle text-[6pt]">Fecha de<br/>nacimiento</th>
                    <th className="border border-black py-0.5 px-0.5 align-middle text-[6pt]">Condición³</th>
                    <th className="border border-black py-0.5 px-0.5 align-middle text-[6pt]">N° de<br/>Unidades<br/>Didácticas⁴</th>
                    <th className="border border-black py-0.5 px-0.5 align-middle text-[6pt]">N° de créditos⁵</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(({ index, rowNum, student, isClosureRow }) => {
                    return (
                      <tr
                        key={index}
                        style={{ height: ROW_H_EST }}
                        className="leading-none"
                      >
                        <td className="border border-black px-0.5 text-center font-mono text-[6.4pt] py-0 align-middle">
                          {rowNum}
                        </td>

                        {student ? (
                          <>
                            <td className="border border-black px-1 text-center font-mono text-[6.4pt] py-0 align-middle">
                              {student.dni}
                            </td>
                            <td className="border border-black px-1 text-left text-[6.7pt] py-0 truncate align-middle">
                              {student.nombreFormateado}
                            </td>
                            <td className="border border-black px-0.5 text-center font-bold text-[6.6pt] py-0 align-middle">
                              {student.sexo}
                            </td>
                            <td className="border border-black px-1 text-center font-mono text-[6.4pt] py-0 align-middle">
                              {student.fechaNacimiento}
                            </td>
                            <td className="border border-black px-0.5 text-center font-bold text-[6.6pt] py-0 align-middle">
                              {student.condicion}
                            </td>
                            <td className="border border-black px-0.5 text-center font-mono text-[6.4pt] py-0 align-middle">
                              {numUD}
                            </td>
                            <td className="border border-black px-0.5 text-center font-mono text-[6.4pt] py-0 align-middle">
                              {numCreditos}
                            </td>
                          </>
                        ) : isClosureRow ? (
                          <>
                            <td
                              colSpan={7}
                              className="border border-black px-0 py-0 relative align-middle"
                              style={{ height: ROW_H_EST }}
                            >
                              <div
                                style={{
                                  width: '100%',
                                  height: '2px',
                                  backgroundColor: '#dc2626',
                                  margin: 0,
                                }}
                              />
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="border border-black px-1 py-0 align-middle">&nbsp;</td>
                            <td className="border border-black px-1 py-0 align-middle">&nbsp;</td>
                            <td className="border border-black px-0.5 py-0 align-middle">&nbsp;</td>
                            <td className="border border-black px-1 py-0 align-middle">&nbsp;</td>
                            <td className="border border-black px-0.5 py-0 align-middle">&nbsp;</td>
                            <td className="border border-black px-0.5 py-0 align-middle">&nbsp;</td>
                            <td className="border border-black px-0.5 py-0 align-middle">&nbsp;</td>
                          </>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* 4. Notas al Pie (Legenda 1 a 5) */}
              <div className="text-[5pt] text-black leading-tight mb-1.5">
                <div>1 Indicar solo en el caso de que sea Dual o en Alternancia, caso contrario dejar la celda en blanco.</div>
                <div>2 DNI/Carnet de extranjeria o pasaporte.</div>
                <div>3 La condición puede ser: Gratuito, Pagante o Becado</div>
                <div>4 N° de unidades didácticas: Indicar el número de UD en las que se ha matriculado el/la estudiante, según la Ficha de Registro de Matrícula (Anexo N°1- LAG).</div>
                <div>5 N° de créditos: Indicar el número total de créditos de las UD en las que se ha matriculado el/la estudiante.</div>
              </div>

              {/* 5. Cuadros de Resumen */}
              <div className="flex items-start justify-between text-[6.2pt]">
                <div>
                  <table className="border-collapse border border-black text-center text-[6.2pt] w-36" style={{ tableLayout: 'fixed' }}>
                    <thead>
                      <tr className="font-bold" style={{ height: '3.5mm' }}>
                        <td className="border border-black px-1 align-middle">Hombres</td>
                        <td className="border border-black px-1 align-middle">Mujeres</td>
                        <td className="border border-black px-1 align-middle">Total</td>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ height: '3.5mm' }}>
                        <td className="border border-black font-mono align-middle">{countHombres}</td>
                        <td className="border border-black font-mono align-middle">{countMujeres}</td>
                        <td className="border border-black font-mono align-middle">{totalAlumnos}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div>
                  <table className="border-collapse border border-black text-center text-[6.2pt] w-52" style={{ tableLayout: 'fixed' }}>
                    <thead>
                      <tr className="font-bold" style={{ height: '3.5mm' }}>
                        <td className="border border-black px-1 align-middle">Gratuitos</td>
                        <td className="border border-black px-1 align-middle">Pagantes</td>
                        <td className="border border-black px-1 align-middle">Becados</td>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ height: '3.5mm' }}>
                        <td className="border border-black font-mono align-middle">{countGratuitos}</td>
                        <td className="border border-black font-mono align-middle">{countPagantes}</td>
                        <td className="border border-black font-mono align-middle">{countBecarios}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 6. Fecha */}
              <div className="text-left text-[6.4pt] font-sans mt-1.5">
                {getFechaPie()}
              </div>
            </div>

            {/* 7. Signatures Footer (3 firmas oficiales en gris al 30%) */}
            <div className="mt-1 flex justify-between text-center text-[6.5pt] mb-1 px-3">
              <div className="w-36">
                <div className="border-t border-slate-300 w-28 mx-auto mb-1"></div>
                <div className="text-[7pt] font-semibold text-slate-600">Director(a)</div>
                <div className="font-normal text-[5.6pt] text-slate-400">Sello, firma y post firma</div>
              </div>

              <div className="w-36">
                <div className="border-t border-slate-300 w-28 mx-auto mb-1"></div>
                <div className="text-[7pt] font-semibold text-slate-600">Coordinador(a) Académico</div>
                <div className="font-normal text-[5.6pt] text-slate-400">Sello, firma y post firma</div>
              </div>

              <div className="w-36">
                <div className="border-t border-slate-300 w-28 mx-auto mb-1"></div>
                <div className="text-[7pt] font-semibold text-slate-600">Docente</div>
                <div className="font-normal text-[5.6pt] text-slate-400">Sello, firma y post firma</div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
