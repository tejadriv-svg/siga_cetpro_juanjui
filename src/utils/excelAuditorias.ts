import ExcelJS from 'exceljs';
import { AuditoriaLog, InstitucionInfo } from '../types';

export async function exportarAuditoriasExcel(
  logs: AuditoriaLog[],
  institucion: InstitucionInfo
) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'SIGA CETPRO JuanjuÃ­';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Logs de AuditorÃ­a', {
    pageSetup: { orientation: 'landscape', paperSize: 9 } // A4 Horizontal
  });

  // 1. TÃ­tulo institucional
  worksheet.mergeCells('A1:H1');
  const title1 = worksheet.getCell('A1');
  title1.value = 'MINISTERIO DE EDUCACIÃ“N â€¢ DIRECCIÃ“N REGIONAL DE EDUCACIÃ“N SAN MARTÃN â€¢ UGEL MARISCAL CÃCERES';
  title1.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF334155' } };
  title1.alignment = { horizontal: 'center', vertical: 'middle' };

  worksheet.mergeCells('A2:H2');
  const title2 = worksheet.getCell('A2');
  title2.value = `${institucion.nombre.toUpperCase()} â€¢ CÃ“DIGO MODULAR: ${institucion.codigoModular}`;
  title2.font = { name: 'Calibri', size: 13, bold: true, color: { argb: 'FF0F172A' } };
  title2.alignment = { horizontal: 'center', vertical: 'middle' };

  worksheet.mergeCells('A3:H3');
  const title3 = worksheet.getCell('A3');
  title3.value = 'REGISTRO OFICIAL DE AUDITORÃA, SEGURIDAD Y TRAZABILIDAD INSTITUCIONAL';
  title3.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF0284C7' } };
  title3.alignment = { horizontal: 'center', vertical: 'middle' };

  worksheet.mergeCells('A4:H4');
  const title4 = worksheet.getCell('A4');
  title4.value = `Reporte generado el: ${new Date().toLocaleDateString('es-PE')} a las ${new Date().toLocaleTimeString('es-PE')} â€¢ Total Eventos Auditados: ${logs.length}`;
  title4.font = { name: 'Calibri', size: 9, italic: true, color: { argb: 'FF64748B' } };
  title4.alignment = { horizontal: 'center', vertical: 'middle' };

  worksheet.addRow([]); // Fila 5 vacÃ­a

  // 2. Encabezados de tabla (Fila 6)
  const headers = [
    'NÂ°',
    'FECHA Y HORA',
    'USUARIO RESPONSABLE',
    'ROL SISTEMA',
    'ACCIÃ“N EJECUTADA',
    'MÃ“DULO / TABLA',
    'DETALLE DE LA OPERACIÃ“N',
    'DIRECCIÃ“N IP'
  ];

  const headerRow = worksheet.addRow(headers);
  headerRow.height = 26;

  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E293B' } // Slate oscuro
    };
    cell.font = {
      name: 'Calibri',
      size: 9.5,
      bold: true,
      color: { argb: 'FFFFFFFF' }
    };
    cell.alignment = {
      horizontal: 'center',
      vertical: 'middle'
    };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF94A3B8' } },
      left: { style: 'thin', color: { argb: 'FF94A3B8' } },
      bottom: { style: 'medium', color: { argb: 'FF0F172A' } },
      right: { style: 'thin', color: { argb: 'FF94A3B8' } }
    };
  });

  // 3. Filas de datos
  logs.forEach((log, index) => {
    const row = worksheet.addRow([
      index + 1,
      log.fecha || (log.timestamp ? new Date(log.timestamp).toLocaleString('es-PE') : '-'),
      log.usuarioNombre || 'Sistema',
      log.usuarioRol || log.rol || 'USUARIO',
      log.accion,
      log.entidad || log.tabla || '-',
      log.detalles || log.detalle || 'OperaciÃ³n registrada en sistema',
      log.ip || '127.0.0.1'
    ]);

    row.height = 22;

    row.eachCell((cell, colNumber) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
      };
      cell.font = { name: 'Calibri', size: 9 };

      if (index % 2 === 1) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF8FAFC' }
        };
      }

      // Alineaciones
      if ([1, 2, 4, 8].includes(colNumber)) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      } else if (colNumber === 5) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.font = { name: 'Calibri', size: 9, bold: true };
      } else {
        cell.alignment = { horizontal: 'left', vertical: 'middle' };
      }
    });
  });

  worksheet.columns = [
    { width: 6 },  // NÂ°
    { width: 22 }, // Fecha
    { width: 30 }, // Usuario
    { width: 16 }, // Rol
    { width: 28 }, // AcciÃ³n
    { width: 24 }, // Entidad
    { width: 55 }, // Detalle
    { width: 16 }  // IP
  ];

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `Padron_Auditoria_SIGA_${new Date().toISOString().split('T')[0]}.xlsx`;
  anchor.click();
  window.URL.revokeObjectURL(url);
}

