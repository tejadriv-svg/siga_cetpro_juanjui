import ExcelJS from 'exceljs';
import { TituloDetallado, InstitucionInfo } from '../types';
import { comparePersonasAlphabetical } from './sortPersonas';

export async function exportarTitulosUgelExcel(
  titulos: TituloDetallado[],
  institucion: InstitucionInfo
) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'SIGA CETPRO JuanjuÃ­';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('PadrÃ³n Oficial de TÃ­tulos', {
    pageSetup: { orientation: 'landscape', paperSize: 9 } // A4
  });

  // 1. TÃ­tulo institucional
  worksheet.mergeCells('A1:AC1');
  const title1 = worksheet.getCell('A1');
  title1.value = 'MINISTERIO DE EDUCACIÃ“N â€¢ DIRECCIÃ“N REGIONAL DE EDUCACIÃ“N SAN MARTÃN â€¢ UGEL MARISCAL CÃCERES';
  title1.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF1E293B' } };
  title1.alignment = { horizontal: 'center', vertical: 'middle' };

  worksheet.mergeCells('A2:AC2');
  const title2 = worksheet.getCell('A2');
  title2.value = `${institucion.nombre.toUpperCase()} â€¢ CÃ“DIGO MODULAR: ${institucion.codigoModular}`;
  title2.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FF0F172A' } };
  title2.alignment = { horizontal: 'center', vertical: 'middle' };

  worksheet.mergeCells('A3:AC3');
  const title3 = worksheet.getCell('A3');
  title3.value = 'PADRÃ“N OFICIAL DE TÃTULOS A NOMBRE DE LA NACIÃ“N (R.V.M. NÂ° 188-2020-MINEDU - ANEXOS 5A Y 5B)';
  title3.font = { name: 'Calibri', size: 12, bold: true, color: { argb: 'FF0284C7' } };
  title3.alignment = { horizontal: 'center', vertical: 'middle' };

  worksheet.mergeCells('A4:AC4');
  const title4 = worksheet.getCell('A4');
  title4.value = `Reporte generado el: ${new Date().toLocaleDateString('es-PE')} a las ${new Date().toLocaleTimeString('es-PE')} â€¢ Total TÃ­tulos Registrados: ${titulos.length}`;
  title4.font = { name: 'Calibri', size: 9, italic: true, color: { argb: 'FF64748B' } };
  title4.alignment = { horizontal: 'center', vertical: 'middle' };

  worksheet.addRow([]); // Fila 5 vacÃ­a

  // 2. Encabezados de tabla (Fila 6)
  const headers = [
    'NÂ°',
    'CÃ“DIGO TÃTULO',
    'REG. NACIONAL MINEDU',
    'ACTA SUSTENTACIÃ“N',
    'DNI / DOC',
    'APELLIDO PATERNO',
    'APELLIDO MATERNO',
    'NOMBRES',
    'CÃ“D. ESTUDIANTE',
    'CÃ“D. EGRESADO',
    'PROGRAMA DE ESTUDIO',
    'NIVEL FORMATIVO',
    'DENOMINACIÃ“N DEL TÃTULO OFICIAL',
    'MODALIDAD DE TITULACIÃ“N',
    'PROYECTO / SUSTENTACIÃ“N',
    'FECHA SUSTENTACIÃ“N',
    'CALIFICACIÃ“N',
    'CALIFICACIÃ“N (LETRAS)',
    'RESULTADO SUSTENTACIÃ“N',
    'JURADO EVALUADOR (PRESIDENTE / SECRETARIO / VOCAL)',
    'HORAS TOTALES',
    'CRÃ‰DITOS TOTALES',
    'RESOLUCIÃ“N DIRECTORAL',
    'LIBRO / TOMO / FOLIO',
    'ESTADO TÃTULO',
    'FECHA EMISIÃ“N',
    'FECHA VISADO UGEL',
    'FECHA ENTREGA',
    'HASH SEGURIDAD'
  ];

  const headerRow = worksheet.addRow(headers);
  headerRow.height = 30;

  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E3A8A' } // Azul marino institucional
    };
    cell.font = {
      name: 'Calibri',
      size: 10,
      bold: true,
      color: { argb: 'FFFFFFFF' }
    };
    cell.alignment = {
      horizontal: 'center',
      vertical: 'middle',
      wrapText: true
    };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      bottom: { style: 'medium', color: { argb: 'FF0F172A' } },
      right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
    };
  });

  // 3. Filas de datos ordenadas alfabéticamente (Paterno, Materno, Nombres)
  const sortedTitulos = [...titulos].sort((a, b) => comparePersonasAlphabetical(
    { apellidoPaterno: a.personaApellidoPaterno, apellidoMaterno: a.personaApellidoMaterno, nombres: a.personaNombres },
    { apellidoPaterno: b.personaApellidoPaterno, apellidoMaterno: b.personaApellidoMaterno, nombres: b.personaNombres }
  ));

  sortedTitulos.forEach((t, index) => {
    const jurado = (t.juradoCalificador || {}) as any;
    const juradoStr = [
      jurado.presidente?.nombre ? `Pres: ${jurado.presidente.nombre}` : '',
      jurado.secretario?.nombre ? `Sec: ${jurado.secretario.nombre}` : '',
      jurado.vocal?.nombre ? `Voc: ${jurado.vocal.nombre}` : ''
    ].filter(Boolean).join(' | ');

    const modalidadLabel = t.modalidadTitulacion === 'TRABAJO_APLICACION_PROFESIONAL'
      ? 'Trabajo de AplicaciÃ³n Profesional'
      : t.modalidadTitulacion === 'EXAMEN_SUFICIENCIA_PROFESIONAL'
      ? 'Examen de Suficiencia Profesional'
      : (t.modalidadTitulacion || 'No especificado');

    const resultadoLabel = t.resultadoSustentacion === 'APROBADO_UNANIMIDAD'
      ? 'Aprobado por Unanimidad'
      : t.resultadoSustentacion === 'APROBADO_MAYORIA'
      ? 'Aprobado por MayorÃ­a'
      : (t.resultadoSustentacion || 'Pendiente');

    const row = worksheet.addRow([
      index + 1,
      t.codigoTitulo || t.numeroTitulo || 'S/N',
      t.codigoRegistroNacional || 'PENDIENTE',
      t.numeroActaSustentacion || 'PENDIENTE',
      t.personaDni || '',
      (t.personaApellidoPaterno || '').toUpperCase(),
      (t.personaApellidoMaterno || '').toUpperCase(),
      (t.personaNombres || '').toUpperCase(),
      t.estudianteCodigo || '',
      t.codigoEgresado || '',
      t.programaNombre || '',
      t.nivelFormativo || '',
      t.denominacionTitulo || '',
      modalidadLabel,
      t.tituloProyecto || 'EvaluaciÃ³n de competencias profesionales',
      t.fechaSustentacion || '',
      t.calificacion != null ? Number(t.calificacion).toFixed(1) : '',
      t.calificacionLetras || '',
      resultadoLabel,
      juradoStr,
      t.totalHorasAcumuladas || 0,
      t.totalCreditosAcumulados || 0,
      t.resolucionDirectoral || '',
      `${t.libroRegistro || ''} - ${t.tomoFolio || ''}`.trim(),
      t.estado || 'EMITIDO',
      t.fechaEmision || '',
      t.fechaVisadoUgel || '',
      t.fechaEntrega || '',
      t.hashSeguridad || ''
    ]);

    row.height = 24;

    row.eachCell((cell, colNumber) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
      };
      cell.font = { name: 'Calibri', size: 9.5 };

      // Alternar color de fondo suave
      if (index % 2 === 1) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF8FAFC' }
        };
      }

      // Alineaciones
      if ([1, 2, 3, 4, 5, 9, 10, 16, 21, 22, 25, 26, 27, 28, 29].includes(colNumber)) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      } else if ([17].includes(colNumber)) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        const cal = Number(cell.value) || 0;
        cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: cal >= 13 ? 'FF047857' : 'FFB91C1C' } };
      } else {
        cell.alignment = { horizontal: 'left', vertical: 'middle' };
      }

      // Destacar estado
      if (colNumber === 25) {
        cell.font = { name: 'Calibri', size: 9, bold: true };
      }
    });
  });

  // Ajustar anchos de columnas
  worksheet.columns = [
    { width: 5 },  // NÂ°
    { width: 16 }, // CÃ³digo TÃ­tulo
    { width: 22 }, // Reg. Nacional MINEDU
    { width: 20 }, // Acta SustentaciÃ³n
    { width: 13 }, // DNI
    { width: 18 }, // Apellido Pat
    { width: 18 }, // Apellido Mat
    { width: 22 }, // Nombres
    { width: 14 }, // CÃ³d Estudiante
    { width: 15 }, // CÃ³d Egresado
    { width: 30 }, // Programa
    { width: 16 }, // Nivel Formativo
    { width: 36 }, // DenominaciÃ³n TÃ­tulo
    { width: 28 }, // Modalidad
    { width: 35 }, // Proyecto
    { width: 14 }, // Fecha SustentaciÃ³n
    { width: 12 }, // CalificaciÃ³n
    { width: 18 }, // CalificaciÃ³n Letras
    { width: 22 }, // Resultado
    { width: 45 }, // Jurado
    { width: 12 }, // Horas
    { width: 12 }, // CrÃ©ditos
    { width: 26 }, // RD
    { width: 28 }, // Libro / Tomo / Folio
    { width: 15 }, // Estado
    { width: 14 }, // EmisiÃ³n
    { width: 14 }, // Visado UGEL
    { width: 14 }, // Entrega
    { width: 16 }  // Hash
  ];

  // Generar y descargar archivo en el navegador
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `Padron_Oficial_Titulos_UGEL_${new Date().toISOString().split('T')[0]}.xlsx`;
  anchor.click();
  window.URL.revokeObjectURL(url);
}

