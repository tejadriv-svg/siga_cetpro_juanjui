import ExcelJS from 'exceljs';
import { CertificadoModularDetallado, InstitucionInfo } from '../types';
import { comparePersonasAlphabetical } from './sortPersonas';

export async function exportarCertificadosUgelExcel(
  certificados: CertificadoModularDetallado[],
  institucion: InstitucionInfo
) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'SIGA CETPRO Juanjuí';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Padrón Certificados Modulares', {
    pageSetup: { orientation: 'landscape', paperSize: 9 } // A4
  });

  // 1. Título institucional
  worksheet.mergeCells('A1:S1');
  const title1 = worksheet.getCell('A1');
  title1.value = 'MINISTERIO DE EDUCACIÓN • DIRECCIÓN REGIONAL DE EDUCACIÓN SAN MARTÍN • UGEL MARISCAL CÁCERES';
  title1.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF1E293B' } };
  title1.alignment = { horizontal: 'center', vertical: 'middle' };

  worksheet.mergeCells('A2:S2');
  const title2 = worksheet.getCell('A2');
  title2.value = `${institucion.nombre.toUpperCase()} • CÓDIGO MODULAR: ${institucion.codigoModular}`;
  title2.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FF0F172A' } };
  title2.alignment = { horizontal: 'center', vertical: 'middle' };

  worksheet.mergeCells('A3:S3');
  const title3 = worksheet.getCell('A3');
  title3.value = 'PADRÓN OFICIAL DE CERTIFICADOS MODULARES EMITIDOS (R.V.M. N° 188-2020-MINEDU)';
  title3.font = { name: 'Calibri', size: 12, bold: true, color: { argb: 'FF0284C7' } };
  title3.alignment = { horizontal: 'center', vertical: 'middle' };

  worksheet.mergeCells('A4:S4');
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
    'TIPO DOC',
    'N° DOCUMENTO',
    'APELLIDO PATERNO',
    'APELLIDO MATERNO',
    'NOMBRES',
    'CÓD. ESTUDIANTE',
    'PROGRAMA DE ESTUDIO',
    'NIVEL FORMATIVO',
    'MÓDULO FORMATIVO',
    'HORAS',
    'CRÉDITOS',
    'PROM. UDs',
    'NOTA EFSRT',
    'PROM. FINAL',
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
      fgColor: { argb: 'FF0F766E' } // Teal oscuro elegante
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
      bottom: { style: 'medium', color: { argb: 'FF042F2E' } },
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
      'DNI',
      c.personaDni || '---',
      c.personaApellidoPaterno || '',
      c.personaApellidoMaterno || '',
      c.personaNombres || '',
      c.estudianteCodigo || '---',
      c.programaNombre || '---',
      c.nivelFormativo || 'Técnico',
      c.moduloNombre || '---',
      c.horasModulo || 0,
      c.creditosModulo ? Number(c.creditosModulo) : 0,
      c.promedioUnidades ? Number(c.promedioUnidades) : 0,
      c.notaEfsrt ? Number(c.notaEfsrt) : 0,
      c.promedioFinal ? Number(c.promedioFinal) : 0,
      c.estado,
      c.fechaEmision,
      c.fechaEntrega || 'Pendiente',
      c.tomoFolio || '---',
      c.resolucionDirectoral || '---',
      c.hashSeguridad || '---'
    ]);

    row.height = 20;

    // Colores alternados
    const isEven = idx % 2 === 0;
    const bgArgb = isEven ? 'FFFFFFFF' : 'FFF8FAFC';

    row.eachCell((cell, colNumber) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: bgArgb }
      };
      cell.font = { name: 'Calibri', size: 9 };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
      };

      // Alineación por tipo de columna
      if ([1, 4, 5, 9, 13, 14, 15, 16, 17, 18, 19, 20, 23].includes(colNumber)) {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      } else {
        cell.alignment = { horizontal: 'left', vertical: 'middle' };
      }

      // Destacar promedio final
      if (colNumber === 17) {
        const val = Number(cell.value) || 0;
        cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: val >= 13 ? 'FF047857' : 'FFB91C1C' } };
      }

      // Destacar estado
      if (colNumber === 18) {
        cell.font = { name: 'Calibri', size: 9, bold: true };
      }
    });
  });

  // Ajustar anchos de columnas
  worksheet.columns = [
    { width: 5 },  // N°
    { width: 16 }, // Código
    { width: 22 }, // Registro
    { width: 10 }, // Tipo doc
    { width: 13 }, // DNI
    { width: 18 }, // Apellido Pat
    { width: 18 }, // Apellido Mat
    { width: 22 }, // Nombres
    { width: 14 }, // Cód Estudiante
    { width: 28 }, // Programa
    { width: 15 }, // Nivel
    { width: 35 }, // Módulo
    { width: 10 }, // Horas
    { width: 11 }, // Créditos
    { width: 12 }, // Prom UDs
    { width: 12 }, // Nota EFSRT
    { width: 13 }, // Prom Final
    { width: 14 }, // Estado
    { width: 14 }, // Emisión
    { width: 14 }, // Entrega
    { width: 26 }, // Tomo/Folio
    { width: 26 }, // RD
    { width: 16 }  // Hash
  ];

  // Generar y descargar archivo en el navegador
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `Padron_Certificados_Modulares_UGEL_${new Date().toISOString().split('T')[0]}.xlsx`;
  anchor.click();
  window.URL.revokeObjectURL(url);
}
