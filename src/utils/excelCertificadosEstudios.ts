import ExcelJS from 'exceljs';
import { CertificadoEstudioDetallado, InstitucionInfo } from '../types';
import { comparePersonasAlphabetical } from './sortPersonas';

export async function exportarCertificadosEstudiosUgelExcel(
  certificados: CertificadoEstudioDetallado[],
  institucion: InstitucionInfo
) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'SIGA CETPRO Juanjuí';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Padrón Certificados Estudios', {
    pageSetup: { orientation: 'landscape', paperSize: 9 } // A4
  });

  // 1. Título institucional
  worksheet.mergeCells('A1:U1');
  const title1 = worksheet.getCell('A1');
  title1.value = 'MINISTERIO DE EDUCACIÓN • DIRECCIÓN REGIONAL DE EDUCACIÓN SAN MARTÍN • UGEL MARISCAL CÁCERES';
  title1.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF1E293B' } };
  title1.alignment = { horizontal: 'center', vertical: 'middle' };

  worksheet.mergeCells('A2:U2');
  const title2 = worksheet.getCell('A2');
  title2.value = `${institucion.nombre.toUpperCase()} • CÓDIGO MODULAR: ${institucion.codigoModular}`;
  title2.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FF0F172A' } };
  title2.alignment = { horizontal: 'center', vertical: 'middle' };

  worksheet.mergeCells('A3:U3');
  const title3 = worksheet.getCell('A3');
  title3.value = 'PADRÓN OFICIAL DE CERTIFICADOS DE ESTUDIOS EMITIDOS (R.V.M. N° 188-2020-MINEDU)';
  title3.font = { name: 'Calibri', size: 12, bold: true, color: { argb: 'FF4338CA' } };
  title3.alignment = { horizontal: 'center', vertical: 'middle' };

  worksheet.mergeCells('A4:U4');
  const title4 = worksheet.getCell('A4');
  title4.value = `Reporte generado el: ${new Date().toLocaleDateString('es-PE')} a las ${new Date().toLocaleTimeString('es-PE')} • Total Certificados: ${certificados.length}`;
  title4.font = { name: 'Calibri', size: 9, italic: true, color: { argb: 'FF64748B' } };
  title4.alignment = { horizontal: 'center', vertical: 'middle' };

  worksheet.addRow([]); // Fila 5 vacía

  // 2. Encabezados de tabla (Fila 6)
  const headers = [
    'N°',
    'CÓDIGO OFICIAL',
    'N° REGISTRO',
    'TIPO CERTIFICADO',
    'TIPO DOC',
    'N° DOCUMENTO',
    'APELLIDO PATERNO',
    'APELLIDO MATERNO',
    'NOMBRES',
    'CÓD. ESTUDIANTE',
    'PROGRAMA DE ESTUDIO',
    'NIVEL FORMATIVO',
    'TOTAL HORAS',
    'TOTAL CRÉDITOS',
    'PPA (PROMEDIO)',
    'ESTADO',
    'FECHA EMISIÓN',
    'FECHA ENTREGA',
    'LIBRO / TOMO / FOLIO',
    'R.D. AUTORIZACIÓN',
    'HASH SEGURIDAD'
  ];

  const headerRow = worksheet.addRow(headers);
  headerRow.height = 28;

  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF312E81' } // Indigo oscuro elegante
    };
    cell.font = {
      name: 'Calibri',
      size: 10,
      bold: true,
      color: { argb: 'FFFFFFFF' }
    };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      bottom: { style: 'medium', color: { argb: 'FF1E1B4B' } },
      right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
    };
  });

  // 3. Filas de datos ordenadas alfabéticamente (Paterno, Materno, Nombres)
  const sortedCertificados = [...certificados].sort((a, b) => comparePersonasAlphabetical(
    { apellidoPaterno: a.personaApellidoPaterno, apellidoMaterno: a.personaApellidoMaterno, nombres: a.personaNombres },
    { apellidoPaterno: b.personaApellidoPaterno, apellidoMaterno: b.personaApellidoMaterno, nombres: b.personaNombres }
  ));

  sortedCertificados.forEach((c, idx) => {
    const row = worksheet.addRow([
      idx + 1,
      c.codigoCertificado || 'S/C',
      c.numeroCertificado,
      c.tipoCertificado || 'COMPLETO',
      'DNI',
      c.personaDni || '-',
      (c.personaApellidoPaterno || '').toUpperCase(),
      (c.personaApellidoMaterno || '').toUpperCase(),
      (c.personaNombres || '').toUpperCase(),
      c.estudianteCodigo || '-',
      c.programaNombre || '-',
      c.nivelFormativo || 'Técnico',
      c.totalHorasAcumuladas || 0,
      c.totalCreditosAcumulados || 0,
      c.promedioPonderadoAcumulado ? Number(c.promedioPonderadoAcumulado).toFixed(2) : '0.00',
      c.estado || 'BORRADOR',
      c.fechaEmision || '-',
      c.fechaEntrega || '-',
      c.tomoFolio || '-',
      c.resolucionDirectoral || '-',
      c.hashSeguridad || '-'
    ]);

    row.height = 22;
    const isEven = idx % 2 === 0;

    row.eachCell((cell, colNumber) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: isEven ? 'FFFFFFFF' : 'FFF8FAFC' }
      };
      cell.font = { name: 'Calibri', size: 9 };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
      };

      // Alineaciones específicas
      if ([1, 2, 3, 4, 5, 6, 10, 16, 17, 18].includes(colNumber)) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      } else if ([13, 14, 15].includes(colNumber)) {
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
        if (colNumber === 15) {
          const val = Number(cell.value);
          cell.font = {
            name: 'Calibri',
            size: 9,
            bold: true,
            color: { argb: val >= 13 ? 'FF15803D' : 'FFB91C1C' }
          };
        }
      } else {
        cell.alignment = { horizontal: 'left', vertical: 'middle' };
      }

      // Estado color
      if (colNumber === 16) {
        const val = String(cell.value);
        if (val === 'ENTREGADO') {
          cell.font = { bold: true, color: { argb: 'FF166534' } }; // Verde
        } else if (val === 'FIRMADO') {
          cell.font = { bold: true, color: { argb: 'FF1E40AF' } }; // Azul
        } else if (val === 'EMITIDO') {
          cell.font = { bold: true, color: { argb: 'FF0E7490' } }; // Cyan
        } else if (val === 'ANULADO') {
          cell.font = { bold: true, color: { argb: 'FF991B1B' } }; // Rojo
        } else {
          cell.font = { italic: true, color: { argb: 'FF64748B' } }; // Gris
        }
      }

      // Tipo Certificado color
      if (colNumber === 4) {
        const val = String(cell.value);
        if (val === 'COMPLETO') {
          cell.font = { bold: true, color: { argb: 'FF4338CA' } }; // Indigo
        } else {
          cell.font = { bold: true, color: { argb: 'FFD97706' } }; // Amber
        }
      }
    });
  });

  // 4. Ancho automático de columnas
  worksheet.columns = [
    { width: 5 },  // N°
    { width: 16 }, // Código Oficial
    { width: 20 }, // N° Certificado
    { width: 16 }, // Tipo Certificado
    { width: 10 }, // Tipo Doc
    { width: 14 }, // N° Documento
    { width: 18 }, // Apellido Paterno
    { width: 18 }, // Apellido Materno
    { width: 22 }, // Nombres
    { width: 15 }, // Cód. Estudiante
    { width: 30 }, // Programa
    { width: 15 }, // Nivel Formativo
    { width: 12 }, // Total Horas
    { width: 14 }, // Total Créditos
    { width: 14 }, // PPA
    { width: 14 }, // Estado
    { width: 14 }, // Fecha Emisión
    { width: 14 }, // Fecha Entrega
    { width: 25 }, // Libro / Tomo / Folio
    { width: 24 }, // RD
    { width: 18 }, // Hash
  ];

  // 5. Resumen al pie
  const emptyRow = worksheet.addRow([]);
  emptyRow.height = 10;

  const totalCompletos = certificados.filter(c => c.tipoCertificado === 'COMPLETO').length;
  const totalParciales = certificados.filter(c => c.tipoCertificado === 'PARCIAL').length;
  const sumaPpa = certificados.reduce((acc, c) => acc + (Number(c.promedioPonderadoAcumulado) || 0), 0);
  const promGeneral = certificados.length > 0 ? (sumaPpa / certificados.length).toFixed(2) : '0.00';

  const resumenRow = worksheet.addRow([
    'RESUMEN GENERAL',
    '',
    `Total: ${certificados.length}`,
    `Completos: ${totalCompletos} | Parciales: ${totalParciales}`,
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    `Promedio PPA: ${promGeneral}`,
    '',
    '',
    '',
    '',
    '',
    ''
  ]);
  resumenRow.height = 24;
  resumenRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E7FF' }
    };
    cell.font = { name: 'Calibri', size: 9, bold: true, color: { argb: 'FF312E81' } };
    cell.alignment = { vertical: 'middle' };
  });

  // 6. Generar buffer y descargar en navegador
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const fechaStr = new Date().toISOString().split('T')[0];
  a.download = `Padron_Certificados_Estudios_UGEL_MC_${fechaStr}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}
