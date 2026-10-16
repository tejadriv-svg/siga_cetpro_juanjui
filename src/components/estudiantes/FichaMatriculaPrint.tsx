import React, { useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';
import { Printer, ExternalLink, Download, CheckCircle2 } from 'lucide-react';

const LOGO_MINEDU_URL = "/logos/LogoMinedu.png";
const LOGO_CETPRO_URL = "/logos/LogoCetpro.png";

interface FichaMatriculaPrintProps {
  isOpen: boolean;
  onClose: () => void;
  matriculaId: string;
  zIndex?: string;
}

export const FichaMatriculaPrint: React.FC<FichaMatriculaPrintProps> = ({ isOpen, onClose, matriculaId, zIndex }) => {
  const {
    matriculas,
    estudiantes,
    personas,
    programas,
    modulos,
    unidades,
    institucion,
    periodosClases,
    periodosAcademicos,
    periodosLectivos,
    secciones,
    sedes,
  } = useApp();

  const printAreaRef = useRef<HTMLDivElement>(null);
  const [printStatus, setPrintStatus] = useState<'idle' | 'printing'>('idle');

  // Robust data resolution
  const matricula =
    matriculas.find(m => m.id === matriculaId || m.codigoMatricula === matriculaId) ||
    matriculas.filter(m => m.estudianteId === matriculaId)[0];

  const codigoMatricula = matricula?.codigoMatricula || (matricula as any)?.codigo || '---';

  const estudiante = matricula
    ? estudiantes.find(e => e.id === matricula.estudianteId || e.personaId === matricula.estudianteId)
    : estudiantes.find(e => e.id === matriculaId);

  const persona =
    estudiante
      ? personas.find(p => p.id === estudiante.personaId)
      : personas.find(p => p.id === matricula?.estudianteId || p.id === matriculaId);

  const rawFotoUrl = persona?.fotoUrl || (persona as any)?.foto_url || (estudiante as any)?.fotoUrl || (estudiante as any)?.foto_url;
  const fotoEstudianteUrl = rawFotoUrl && !rawFotoUrl.includes('\\') && (rawFotoUrl.startsWith('/') || rawFotoUrl.startsWith('http://') || rawFotoUrl.startsWith('https://') || rawFotoUrl.startsWith('data:image/'))
    ? rawFotoUrl
    : null;

  const modulo = matricula
    ? modulos.find(m => m.id === matricula.moduloId)
    : undefined;

  const programa =
    matricula
      ? (programas.find(p => p.id === matricula.programaId || p.codigo === matricula.programaId) ||
         (modulo ? programas.find(p => p.id === modulo.programaId || p.codigo === modulo.programaId) : undefined) ||
         (estudiante ? programas.find(p => p.id === estudiante.programaId || p.codigo === estudiante.programaId) : undefined))
      : (estudiante ? programas.find(p => p.id === estudiante.programaId || p.codigo === estudiante.programaId) : undefined);

  const seccion = matricula?.seccionId
    ? secciones.find(s => s.id === matricula.seccionId)
    : undefined;

  const periodoClase = seccion?.periodoClasesId
    ? periodosClases.find(pc => pc.id === seccion.periodoClasesId)
    : periodosClases[0];

  const periodoAcademico = periodoClase?.periodoAcademicoId
    ? periodosAcademicos.find(pa => pa.id === periodoClase.periodoAcademicoId)
    : periodosAcademicos.find(pa => pa.codigo === matricula?.periodoAcademico) || periodosAcademicos[0];

  const anioLectivo = periodoAcademico?.periodoLectivoId
    ? periodosLectivos.find(pl => pl.id === periodoAcademico.periodoLectivoId)
    : periodosLectivos[0];

  const anioDisplay = anioLectivo?.codigo || new Date().getFullYear().toString();
  const periodoStr = periodoAcademico?.codigo || matricula?.periodoAcademico || `${anioDisplay}-1`;

  const getSeccionTexto = () => {
    if (!seccion) return '---';
    if (seccion.nombre && seccion.nombre.includes('-')) {
      return seccion.nombre.replace(/secci[oó]n/gi, '').trim();
    }
    const letra = (seccion.nombre || 'A').replace(/secci[oó]n/gi, '').trim() || 'A';
    const sedeObj = sedes?.find(s => s.id === seccion.sedeId);
    const sedeNom = seccion.sedeNombre || sedeObj?.nombre || institucion.distrito || 'Juanjui';
    return `${letra} - ${sedeNom}`;
  };

  const formatDMA = (isoDate?: string) => {
    if (!isoDate) return '';
    const parts = isoDate.split('T')[0].split('-');
    if (parts.length === 3) {
      return `${parts[2].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[0]}`;
    }
    return isoDate;
  };

  const parseUnidadInfo = (u: any) => {
    const cod = (u.codigo || '').toUpperCase();
    const nom = (u.nombre || '').toUpperCase();

    // Coincidencia explícita de UDT (ej: C0714-1-004-M1-UDT3, UDT-1, UDT 2, etc.)
    const udtMatch = cod.match(/UDT\s*[-_.]?\s*(\d+)/i) || nom.match(/UDT\s*[-_.]?\s*(\d+)/i);
    // Coincidencia explícita de UDE (ej: C0714-1-004-M2-UDE1, UDE-2, UDE 1, etc.)
    const udeMatch = cod.match(/UDE\s*[-_.]?\s*(\d+)/i) || nom.match(/UDE\s*[-_.]?\s*(\d+)/i);

    let tipoCat: 'UDT' | 'UDE' = 'UDT';
    let numero: number = 999;
    let codigoDisplay = '';

    if (udtMatch) {
      tipoCat = 'UDT';
      numero = parseInt(udtMatch[1], 10);
      codigoDisplay = `UDT ${numero}`;
    } else if (udeMatch) {
      tipoCat = 'UDE';
      numero = parseInt(udeMatch[1], 10);
      codigoDisplay = `UDE ${numero}`;
    } else {
      // Si no dice UDT ni UDE explícito, clasificar por campo tipo
      const isEmp = u.tipo === 'Empleabilidad' || nom.includes('EMPLEABILIDAD');
      tipoCat = isEmp ? 'UDE' : 'UDT';
      const numMatch = cod.match(/\d+/) || nom.match(/\d+/);
      numero = numMatch ? parseInt(numMatch[0], 10) : (Number(u.orden) || 999);
      codigoDisplay = numero !== 999 ? `${tipoCat} ${numero}` : tipoCat;
    }

    // Limpieza de prefijo redundante en el nombre de la unidad si existiese
    const nombreLimpio = (u.nombre || '')
      .replace(/^(UDT|UDE|UD)\s*[-_.]?\s*\d+[:\s-]*/i, '')
      .replace(/^\d+[\s.-]+/, '')
      .trim();

    return {
      ...u,
      tipoCat,
      numero,
      codigoDisplay,
      nombreFinal: nombreLimpio || u.nombre,
      tipoDisplay: tipoCat === 'UDE' ? 'Para la Empleabilidad' : 'Específica',
    };
  };

  const unidadesModulo = modulo ? unidades.filter(u => u.moduloId === modulo.id) : [];
  const parsedUnidades = unidadesModulo.map(parseUnidadInfo);

  // Separar en Técnicas/Específicas (UDT) y Empleabilidad (UDE)
  const udtItems = parsedUnidades.filter(u => u.tipoCat === 'UDT');
  const udeItems = parsedUnidades.filter(u => u.tipoCat === 'UDE');

  // Ordenar cada grupo estrictamente según su número real (1, 2, 3, etc.)
  const sortedUdt = [...udtItems].sort((a, b) => {
    if (a.numero !== b.numero) return a.numero - b.numero;
    return (a.nombreFinal || '').localeCompare(b.nombreFinal || '');
  });

  const sortedUde = [...udeItems].sort((a, b) => {
    if (a.numero !== b.numero) return a.numero - b.numero;
    return (a.nombreFinal || '').localeCompare(b.nombreFinal || '');
  });

  // Lista final: Siempre primero UDT ordenadas por su número real, y luego UDE ordenadas por su número real
  const unidadesList = [...sortedUdt, ...sortedUde].map((u, idx) => ({
    ...u,
    index: idx + 1,
  }));

  const totalCreditos = unidadesList.reduce((sum, u) => sum + (Number(u.creditos) || 0), 0);
  const totalHoras = unidadesList.reduce((sum, u) => sum + (Number(u.horas) || 0), 0);

  const calculateAge = (dob?: string) => {
    if (!dob) return '---';
    const diff = Date.now() - new Date(dob).getTime();
    if (isNaN(diff)) return '---';
    const age = new Date(diff);
    return Math.abs(age.getUTCFullYear() - 1970).toString();
  };

  const edad = calculateAge(persona?.fechaNacimiento);
  const fechaInicioFinStr = periodoClase?.fechaInicio && periodoClase?.fechaFin
    ? `${formatDMA(periodoClase.fechaInicio)} al ${formatDMA(periodoClase.fechaFin)}`
    : 'Según Calendario Académico';

  const formatNombreCompleto = (p?: any) => {
    if (!p) return '---';
    const pat = (p.apellidoPaterno || '').trim().toUpperCase();
    const mat = (p.apellidoMaterno || '').trim().toUpperCase();
    const apellidos = [pat, mat].filter(Boolean).join(' ');
    const nombres = (p.nombres || '').trim();
    return apellidos ? `${apellidos}, ${nombres}` : nombres;
  };

  const seccionTexto = getSeccionTexto();

  // Generate self-contained standalone HTML for isolated printing
  const generatePrintableHtml = () => {
    const nombreCetpro = (institucion.nombre || 'CETPRO JUANJUÍ').toUpperCase();
    const dre = (institucion.dre || 'SAN MARTÍN').toUpperCase();
    const ugel = (institucion.ugel || 'MARISCAL CÁCERES').toUpperCase();
    const codigoModular = institucion.codigoModular || '0533836';
    const departamento = (institucion.region || institucion.departamento || 'SAN MARTÍN').toUpperCase();
    const provincia = (institucion.provincia || 'MARISCAL CÁCERES').toUpperCase();
    const distrito = (institucion.distrito || 'JUANJUÍ').toUpperCase();
    const tipoGestion = (institucion.tipoGestion || 'Pública').toUpperCase() + ' DIRECTA';

    const progNombre = (programa?.nombre || 'PROGRAMA DE ESTUDIOS').toUpperCase();
    const modNombre = (modulo?.nombre || 'MÓDULO FORMATIVO').toUpperCase();
    const estNombres = persona
      ? `${persona.apellidoPaterno || ''} ${persona.apellidoMaterno || ''}, ${persona.nombres || ''}`.trim().toUpperCase()
      : '---';
    const dni = persona?.numeroDocumento || '---';
    const nivel = (programa?.nivelFormativo || 'Técnico').toUpperCase();
    const modalidad = (seccion?.modalidadEducativa || 'Presencial').toUpperCase();
    const gradoInstruccion = (persona?.nivelEducativo || 'Secundaria Completa').toUpperCase();

    const rowsHtml = unidadesList.length > 0
      ? unidadesList.map((u) => `
        <tr>
          <td style="border: 1px solid #000; padding: 3px 4px; text-align: center;">${u.index}</td>
          <td style="border: 1px solid #000; padding: 3px 6px; text-align: left; text-transform: uppercase;"><strong>${u.codigoDisplay}</strong> - ${u.nombreFinal}</td>
          <td style="border: 1px solid #000; padding: 3px 4px; text-align: center;">${u.creditos || 0}</td>
          <td style="border: 1px solid #000; padding: 3px 4px; text-align: center;">${u.horas || 0}</td>
          <td style="border: 1px solid #000; padding: 3px 4px; text-align: center;">${u.tipoDisplay}</td>
        </tr>
      `).join('')
      : `
        <tr>
          <td style="border: 1px solid #000; padding: 4px; text-align: center;">1</td>
          <td style="border: 1px solid #000; padding: 4px 6px; text-align: left;">UNIDADES FORMATIVAS SEGÚN PLAN DE ESTUDIOS</td>
          <td style="border: 1px solid #000; padding: 4px; text-align: center;">-</td>
          <td style="border: 1px solid #000; padding: 4px; text-align: center;">-</td>
          <td style="border: 1px solid #000; padding: 4px; text-align: center;">Regular</td>
        </tr>
      `;

    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Ficha de Matrícula - ${dni} - ${estNombres}</title>
  <style>
    @page {
      size: A4 landscape;
      margin: 20mm 10mm 10mm 10mm; /* Superior 2cm, izquierdo, derecho e inferior 1cm */
    }
    * {
      box-sizing: border-box;
      font-family: Arial, Helvetica, sans-serif;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    body {
      margin: 0;
      padding: 0;
      background: #ffffff;
      color: #000000;
      font-size: 8pt;
      line-height: 1.2;
    }
    .sheet {
      width: 100%;
      max-width: 1050px;
      margin: 0 auto;
      background: #fff;
    }
    .header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
      border-bottom: 2px solid #000;
      padding-bottom: 4px;
    }
    .header-title {
      text-align: center;
      flex: 1;
    }
    .header-title h1 {
      margin: 0;
      font-size: 13pt;
      font-weight: bold;
      letter-spacing: 0.5px;
    }
    .header-title h2 {
      margin: 1px 0 0 0;
      font-size: 11pt;
      font-weight: bold;
    }
    .grid-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 6px;
      font-size: 7.8pt;
    }
    .grid-table td {
      border: 1px solid #000;
      padding: 1.5px 5px;
      vertical-align: middle;
      height: 4mm;
    }
    .grid-table td.label {
      background-color: #f3f4f6;
      font-weight: bold;
      width: 16%;
    }
    .grid-table td.value {
      width: 34%;
    }
    .section-title {
      text-align: center;
      font-size: 8.2pt;
      font-weight: bold;
      margin: 4px 0 2px 0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 5px;
      font-size: 7.5pt;
    }
    .data-table th {
      border: 1px solid #000;
      background-color: #f3f4f6;
      padding: 2.5px 4px;
      font-weight: bold;
      text-align: center;
      height: 4.2mm;
    }
    .data-table td {
      height: 3.8mm;
    }
    .two-col-row {
      display: flex;
      gap: 10px;
      margin-bottom: 4px;
    }
    .col-half {
      flex: 1;
    }
    .signatures {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-top: 14px;
      margin-bottom: 4px;
      padding: 0 25px;
    }
    .sign-box {
      width: 28%;
      text-align: center;
    }
    .sign-line {
      border-top: 1px solid #b3b3b3;
      padding-top: 3px;
      font-size: 7pt;
      font-weight: bold;
      color: #666;
    }
    .sign-sub {
      font-size: 5.6pt;
      color: #888;
      font-weight: normal;
    }
    .footnote {
      font-size: 6.8pt;
      color: #555;
      margin-top: 3px;
      border-top: 1px dotted #aaa;
      padding-top: 2px;
    }
    @media print {
      body {
        margin: 0;
        padding: 0;
      }
      .no-print {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  <div class="sheet">
    <!-- Header con Logos Oficiales Supabase y Foto del Estudiante (+80% tamaño) -->
    <div class="header-row">
      <div style="width: 220px; display: flex; align-items: center; justify-content: flex-start;">
        <img src="${LOGO_MINEDU_URL}" alt="MINEDU" style="height: 68px; max-width: 220px; object-fit: contain;" />
      </div>
      <div class="header-title">
        <h1>FICHA DE REGISTRO DE MATRÍCULA</h1>
        <h2>AÑO LECTIVO ${anioDisplay}</h2>
        <div style="font-size: 8.5pt; font-weight: bold; margin-top: 2px; color: #333;">CÓDIGO DE MATRÍCULA: ${codigoMatricula}</div>
      </div>
      <div style="width: 260px; display: flex; align-items: center; justify-content: flex-end; gap: 12px;">
        <!-- Foto del estudiante (colocada entre el texto central y el logo del CETPRO) -->
        <div style="width: 68px; height: 86px; border: 1px solid #000; background-color: #f9fafb; display: flex; flex-direction: column; align-items: center; justify-content: center; overflow: hidden; box-sizing: border-box; flex-shrink: 0; border-radius: 1px;">
          ${fotoEstudianteUrl ? `
            <img src="${fotoEstudianteUrl}" alt="Foto" style="width: 100%; height: 100%; object-fit: cover;" />
          ` : `
            <div style="font-size: 7pt; font-weight: bold; color: #555; text-align: center; line-height: 1.2;">
              <span style="letter-spacing: 0.5px;">FOTO</span><br/>
              <span style="font-size: 5.8pt; color: #777;">CARNÉ</span>
            </div>
          `}
        </div>
        <!-- Logo CETPRO al extremo derecho -->
        <img src="${LOGO_CETPRO_URL}" alt="CETPRO" style="height: 72px; max-width: 170px; object-fit: contain;" />
      </div>
    </div>

    <!-- Institutional and Student Details Grid Table (Formato Horizontal) -->
    <table class="grid-table">
      <colgroup>
        <col style="width: 16%;" />
        <col style="width: 34%;" />
        <col style="width: 16%;" />
        <col style="width: 34%;" />
      </colgroup>
      <tr>
        <td class="label">Nombre del CETPRO:</td>
        <td class="value"><strong>${nombreCetpro}</strong></td>
        <td class="label">DRE/GRE:</td>
        <td class="value">${dre}</td>
      </tr>
      <tr>
        <td class="label">Código modular:</td>
        <td class="value"><strong>${codigoModular}</strong></td>
        <td class="label">UGEL:</td>
        <td class="value">${ugel}</td>
      </tr>
      <tr>
        <td class="label">Departamento:</td>
        <td class="value">${departamento}</td>
        <td class="label">Tipo de Gestión:</td>
        <td class="value">${tipoGestion}</td>
      </tr>
      <tr>
        <td class="label">Provincia:</td>
        <td class="value">${provincia}</td>
        <td class="label">Periodo lectivo:</td>
        <td class="value"><strong>${anioDisplay}</strong></td>
      </tr>
      <tr>
        <td class="label">Distrito:</td>
        <td class="value">${distrito}</td>
        <td class="label">Periodo académico:</td>
        <td class="value"><strong>${periodoStr}</strong></td>
      </tr>
      <tr>
        <td class="label">Programa de estudios:</td>
        <td class="value" colspan="3"><strong>${progNombre}</strong></td>
      </tr>
      <tr>
        <td class="label">Módulo Formativo:</td>
        <td class="value" colspan="3"><strong>${modNombre}</strong></td>
      </tr>
      <tr>
        <td class="label">Turno y Sección:</td>
        <td class="value"><strong>${seccion?.turno || 'Mañana'}</strong></td>
        <td class="label">Sección / Sede:</td>
        <td class="value"><strong>${seccionTexto}</strong></td>
      </tr>
      <tr>
        <td class="label">Apellidos y Nombres:</td>
        <td class="value" colspan="3"><strong>${estNombres}</strong></td>
      </tr>
      <tr>
        <td class="label">Nivel Formativo / Ciclo:</td>
        <td class="value">${nivel}</td>
        <td class="label">N° Doc. de Identidad (DNI):</td>
        <td class="value"><strong>${dni}</strong></td>
      </tr>
      <tr>
        <td class="label">Modalidad Educativa:</td>
        <td class="value">${modalidad}</td>
        <td class="label">Grado de Instrucción:</td>
        <td class="value">${gradoInstruccion}</td>
      </tr>
      <tr>
        <td class="label">Modelo Educativo:</td>
        <td class="value">CETPRO</td>
        <td class="label">Edad del estudiante:</td>
        <td class="value">${edad} años</td>
      </tr>
      <tr>
        <td class="label">Inicio y término de clases:</td>
        <td class="value">${fechaInicioFinStr}</td>
        <td class="label">Condición / Tipo:</td>
        <td class="value">${matricula?.condicion || 'Ingresante'} / ${matricula?.tipo || 'Regular'}</td>
      </tr>
    </table>

    <!-- 1. Unidades Didácticas -->
    <div class="section-title">I. UNIDADES DIDÁCTICAS</div>
    <table class="data-table">
      <thead>
        <tr>
          <th style="width: 28px;">N°</th>
          <th style="text-align: left; padding-left: 6px;">UNIDAD DIDÁCTICA</th>
          <th style="width: 75px;">CRÉDITOS</th>
          <th style="width: 65px;">HORAS</th>
          <th style="width: 140px;">OBSERVACIONES¹</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
        <tr style="font-weight: bold; background-color: #f9fafb;">
          <td colspan="2" style="border: 1px solid #000; padding: 2.5px 6px; text-align: right;">TOTAL CRÉDITOS Y HORAS:</td>
          <td style="border: 1px solid #000; padding: 2.5px; text-align: center;">${totalCreditos}</td>
          <td style="border: 1px solid #000; padding: 2.5px; text-align: center;">${totalHoras}</td>
          <td style="border: 1px solid #000; padding: 2.5px;"></td>
        </tr>
      </tbody>
    </table>

    <!-- 2 & 3. Subsanación y EFSRT en columnas lado a lado para formato horizontal -->
    <div class="two-col-row">
      <div class="col-half">
        <div class="section-title">II. UNIDADES DIDÁCTICAS DE SUBSANACIÓN</div>
        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 25px;">N°</th>
              <th style="text-align: left; padding-left: 6px;">UNIDAD DIDÁCTICA</th>
              <th style="width: 55px;">CRÉD.</th>
              <th style="width: 50px;">HORAS</th>
              <th style="width: 70px;">OBSERVACIONES</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="border: 1px solid #000; padding: 2px; text-align: center;">-</td>
              <td style="border: 1px solid #000; padding: 2px 6px; color: #666; font-size: 7.2pt;">Sin unidades de subsanación registradas</td>
              <td style="border: 1px solid #000; padding: 2px; text-align: center;">-</td>
              <td style="border: 1px solid #000; padding: 2px; text-align: center;">-</td>
              <td style="border: 1px solid #000; padding: 2px;"></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="col-half">
        <div class="section-title">III. EXPERIENCIAS FORMATIVAS (EFSRT)</div>
        <table class="data-table">
          <thead>
            <tr>
              <th style="text-align: left; padding-left: 6px;">EN EL CETPRO / CENTRO LABORAL O EMPRESA</th>
              <th style="width: 55px;">CRÉD.</th>
              <th style="width: 50px;">HORAS</th>
              <th style="width: 70px;">OBSERVACIONES</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="border: 1px solid #000; padding: 2px 6px; font-size: 7.2pt;">Desarrollo de prácticas pre-profesionales / módulo según programa</td>
              <td style="border: 1px solid #000; padding: 2px; text-align: center;">-</td>
              <td style="border: 1px solid #000; padding: 2px; text-align: center;">-</td>
              <td style="border: 1px solid #000; padding: 2px;"></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Signatures -->
    <div class="signatures">
      <div class="sign-box">
        <div style="height: 30px;"></div>
        <div class="sign-line">Director(a)</div>
        <div class="sign-sub">Sello, firma y post firma</div>
      </div>
      <div class="sign-box">
        <div style="height: 30px;"></div>
        <div class="sign-line">Coordinador(a) Académico</div>
        <div class="sign-sub">Sello, firma y post firma</div>
      </div>
      <div class="sign-box">
        <div style="height: 30px;"></div>
        <div class="sign-line">Estudiante</div>
        <div class="sign-sub">Firma y DNI: ${dni}</div>
      </div>
    </div>

    <!-- Footnote -->
    <div class="footnote">
      ¹ Se hace referencia a situaciones específicas del estudiante como PIR, Transitabilidad, MOT, Discapacidad / NNEE y otros según R.V.M. N° 188-2020-MINEDU y modificatorias.
    </div>
  </div>
</body>
</html>`;
  };

  const handleDirectPrint = () => {
    setPrintStatus('printing');
    const html = generatePrintableHtml();

    // 1. Remove old iframe if present
    const oldIframe = document.getElementById('siga-ficha-print-iframe');
    if (oldIframe) {
      oldIframe.remove();
    }

    // 2. Create isolated print iframe
    const iframe = document.createElement('iframe');
    iframe.id = 'siga-ficha-print-iframe';
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
      setPrintStatus('idle');
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
        // Fallback: open clean popup window
        handleOpenNewTab();
      } finally {
        setTimeout(() => {
          setPrintStatus('idle');
        }, 1000);
      }
    }, 450);
  };

  const handleOpenNewTab = () => {
    const html = generatePrintableHtml();
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
      }, 500);
    } else {
      // Fallback window.print
      window.print();
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Ficha Oficial de Registro de Matrícula (Formato Horizontal A4)"
      subtitle={`Estudiante: ${persona ? `${persona.apellidoPaterno} ${persona.apellidoMaterno}, ${persona.nombres}` : 'Estudiante'} • DNI: ${persona?.numeroDocumento || '---'}`}
      maxWidth="6xl"
      zIndex={zIndex}
      actions={
        <div className="flex items-center justify-between w-full gap-2">
          <div className="text-xs text-slate-500 hidden sm:flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Formato horizontal oficial MINEDU R.V.M. 188-2020</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer transition-colors"
            >
              Cerrar
            </button>
            <button
              type="button"
              onClick={handleOpenNewTab}
              className="px-3.5 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Abrir en pestaña nueva e imprimir"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Abrir en Pestaña</span>
            </button>
            <button
              type="button"
              onClick={handleDirectPrint}
              disabled={printStatus === 'printing'}
              className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-98 rounded-xl flex items-center gap-2 shadow-sm cursor-pointer transition-all disabled:opacity-50"
            >
              <Printer className="w-4 h-4" />
              <span>{printStatus === 'printing' ? 'Preparando Impresión...' : 'Imprimir Ficha Horizontal'}</span>
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Quick Action Hint Banner */}
        <div className="bg-blue-50 border border-blue-200 p-3 rounded-2xl flex items-center justify-between gap-3 text-xs text-blue-900">
          <div className="flex items-center gap-2">
            <Printer className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              Vista previa configurada en <strong>formato horizontal (Landscape) A4</strong> con márgenes oficiales (sup: 2cm, izq/der/inf: 1cm). Más espacio para módulos y nombres.
            </span>
          </div>
          <button
            onClick={handleDirectPrint}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shrink-0 flex items-center gap-1 cursor-pointer transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            Imprimir Ahora
          </button>
        </div>

        {/* On-screen Preview Container (Horizontal A4) */}
        <div className="bg-slate-100 p-4 rounded-2xl border border-slate-200 overflow-x-auto">
          <div
            ref={printAreaRef}
            className="bg-white text-black p-6 sm:p-8 mx-auto max-w-[1050px] shadow-sm border border-slate-300 font-sans text-xs"
          >
            {/* Header con Logos Oficiales Supabase y Foto del Estudiante (+80% tamaño) */}
            <div className="flex justify-between items-center mb-3 border-b-2 border-black pb-2.5">
              <div className="w-[220px] flex items-center shrink-0">
                <img
                  src={LOGO_MINEDU_URL}
                  alt="MINEDU"
                  style={{ height: '68px', maxWidth: '220px', objectFit: 'contain' }}
                />
              </div>
              <div className="text-center flex-1 px-3">
                <h1 className="text-base font-bold tracking-wide uppercase">FICHA DE REGISTRO DE MATRÍCULA</h1>
                <h2 className="text-sm font-bold">AÑO LECTIVO {anioDisplay}</h2>
                <div className="text-[10px] font-bold text-slate-700 mt-0.5">
                  CÓDIGO DE MATRÍCULA: {codigoMatricula}
                </div>
              </div>
              <div className="w-[260px] flex items-center justify-end gap-3 shrink-0">
                {/* Foto entre el texto y el logo */}
                <div className="w-[68px] h-[86px] border border-black bg-slate-50 flex flex-col items-center justify-center overflow-hidden shrink-0 rounded-[1px] shadow-2xs">
                  {fotoEstudianteUrl ? (
                    <img
                      src={fotoEstudianteUrl}
                      alt="Foto del Estudiante"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-[8px] font-bold text-slate-500 text-center leading-tight">
                      <span className="tracking-wide">FOTO</span>
                      <span className="block text-[6.5px] text-slate-400">CARNÉ</span>
                    </div>
                  )}
                </div>
                {/* Logo CETPRO al extremo derecho */}
                <img
                  src={LOGO_CETPRO_URL}
                  alt="CETPRO"
                  style={{ height: '72px', maxWidth: '170px', objectFit: 'contain' }}
                />
              </div>
            </div>

            {/* Info Table (Formato Horizontal con amplio espacio para módulos y nombres) */}
            <div className="border border-black text-[10.5px] mb-3">
              <div className="flex border-b border-black">
                <div className="w-[16%] p-1 bg-slate-100 border-r border-black font-bold">Nombre del CETPRO:</div>
                <div className="w-[34%] p-1 border-r border-black font-semibold uppercase">{institucion.nombre || 'CETPRO JUANJUÍ'}</div>
                <div className="w-[16%] p-1 bg-slate-100 border-r border-black font-bold">DRE/GRE:</div>
                <div className="w-[34%] p-1 uppercase">{institucion.dre || 'SAN MARTÍN'}</div>
              </div>
              <div className="flex border-b border-black">
                <div className="w-[16%] p-1 bg-slate-100 border-r border-black font-bold">Código modular:</div>
                <div className="w-[34%] p-1 border-r border-black font-mono font-bold">{institucion.codigoModular || '0533836'}</div>
                <div className="w-[16%] p-1 bg-slate-100 border-r border-black font-bold">UGEL:</div>
                <div className="w-[34%] p-1 uppercase">{institucion.ugel || 'MARISCAL CÁCERES'}</div>
              </div>
              <div className="flex border-b border-black">
                <div className="w-[16%] p-1 bg-slate-100 border-r border-black font-bold">Departamento:</div>
                <div className="w-[34%] p-1 border-r border-black">{institucion.region || institucion.departamento || 'San Martín'}</div>
                <div className="w-[16%] p-1 bg-slate-100 border-r border-black font-bold">Tipo de Gestión:</div>
                <div className="w-[34%] p-1">{institucion.tipoGestion || 'Pública'} Directa</div>
              </div>
              <div className="flex border-b border-black">
                <div className="w-[16%] p-1 bg-slate-100 border-r border-black font-bold">Provincia:</div>
                <div className="w-[34%] p-1 border-r border-black">{institucion.provincia || 'Mariscal Cáceres'}</div>
                <div className="w-[16%] p-1 bg-slate-100 border-r border-black font-bold">Periodo lectivo:</div>
                <div className="w-[34%] p-1 font-bold">{anioDisplay}</div>
              </div>
              <div className="flex border-b border-black">
                <div className="w-[16%] p-1 bg-slate-100 border-r border-black font-bold">Distrito:</div>
                <div className="w-[34%] p-1 border-r border-black">{institucion.distrito || 'Juanjuí'}</div>
                <div className="w-[16%] p-1 bg-slate-100 border-r border-black font-bold">Periodo académico:</div>
                <div className="w-[34%] p-1 font-bold">{periodoStr}</div>
              </div>
              <div className="flex border-b border-black">
                <div className="w-[16%] p-1 bg-slate-100 border-r border-black font-bold">Programa de estudios:</div>
                <div className="w-[84%] p-1 uppercase font-bold text-slate-900">{programa?.nombre || '---'}</div>
              </div>
              <div className="flex border-b border-black">
                <div className="w-[16%] p-1 bg-slate-100 border-r border-black font-bold">Módulo formativo:</div>
                <div className="w-[84%] p-1 uppercase font-semibold text-slate-800">{modulo?.nombre || '---'}</div>
              </div>
              <div className="flex border-b border-black">
                <div className="w-[16%] p-1 bg-slate-100 border-r border-black font-bold">Turno y Sección:</div>
                <div className="w-[34%] p-1 border-r border-black font-bold">{seccion?.turno || 'Mañana'}</div>
                <div className="w-[16%] p-1 bg-slate-100 border-r border-black font-bold">Sección / Sede:</div>
                <div className="w-[34%] p-1 font-bold">{seccionTexto}</div>
              </div>
              <div className="flex border-b border-black">
                <div className="w-[16%] p-1 bg-slate-100 border-r border-black font-bold">Apellidos y Nombres:</div>
                <div className="w-[84%] p-1 font-bold uppercase text-slate-950">
                  {persona ? `${persona.apellidoPaterno || ''} ${persona.apellidoMaterno || ''}, ${persona.nombres || ''}` : '---'}
                </div>
              </div>
              <div className="flex border-b border-black">
                <div className="w-[16%] p-1 bg-slate-100 border-r border-black font-bold">Nivel Formativo / Ciclo:</div>
                <div className="w-[34%] p-1 border-r border-black">{programa?.nivelFormativo || 'Técnico'}</div>
                <div className="w-[16%] p-1 bg-slate-100 border-r border-black font-bold">N° Doc. de Identidad:</div>
                <div className="w-[34%] p-1 font-bold font-mono">{persona?.numeroDocumento || '---'}</div>
              </div>
              <div className="flex border-b border-black">
                <div className="w-[16%] p-1 bg-slate-100 border-r border-black font-bold">Modalidad del servicio:</div>
                <div className="w-[34%] p-1 border-r border-black">{seccion?.modalidadEducativa || 'Presencial'}</div>
                <div className="w-[16%] p-1 bg-slate-100 border-r border-black font-bold">Grado de instrucción:</div>
                <div className="w-[34%] p-1">{persona?.nivelEducativo || 'Secundaria Completa'}</div>
              </div>
              <div className="flex border-b border-black">
                <div className="w-[16%] p-1 bg-slate-100 border-r border-black font-bold">Modelo Educativo:</div>
                <div className="w-[34%] p-1 border-r border-black">CETPRO</div>
                <div className="w-[16%] p-1 bg-slate-100 border-r border-black font-bold">Edad del estudiante:</div>
                <div className="w-[34%] p-1">{edad} años</div>
              </div>
              <div className="flex">
                <div className="w-[16%] p-1 bg-slate-100 border-r border-black font-bold">Inicio y término:</div>
                <div className="w-[34%] p-1 border-r border-black">{fechaInicioFinStr}</div>
                <div className="w-[16%] p-1 bg-slate-100 border-r border-black font-bold">Condición / Tipo:</div>
                <div className="w-[34%] p-1 font-medium">{matricula?.condicion || 'Ingresante'} / {matricula?.tipo || 'Regular'}</div>
              </div>
            </div>

            {/* I. Unidades Didácticas */}
            <h3 className="text-center font-bold text-[11px] mb-1 uppercase tracking-wide">I. UNIDADES DIDÁCTICAS</h3>
            <table className="w-full text-[10px] border border-black border-collapse text-center mb-3">
              <thead className="bg-slate-100">
                <tr>
                  <th className="border border-black p-1 w-8">N°</th>
                  <th className="border border-black p-1 text-left pl-2">UNIDAD DIDÁCTICA</th>
                  <th className="border border-black p-1 w-20">CRÉDITOS</th>
                  <th className="border border-black p-1 w-20">HORAS</th>
                  <th className="border border-black p-1 w-36">OBSERVACIONES¹</th>
                </tr>
              </thead>
              <tbody>
                {unidadesList.map((u) => (
                  <tr key={u.id || `${u.codigoDisplay}-${u.index}`}>
                    <td className="border border-black p-0.5">{u.index}</td>
                    <td className="border border-black p-0.5 text-left pl-2 uppercase">
                      <span className="font-bold">{u.codigoDisplay}</span> - {u.nombreFinal}
                    </td>
                    <td className="border border-black p-0.5">{u.creditos}</td>
                    <td className="border border-black p-0.5">{u.horas}</td>
                    <td className="border border-black p-0.5 text-[9px]">
                      {u.tipoDisplay}
                    </td>
                  </tr>
                ))}
                {unidadesList.length === 0 && (
                  <tr>
                    <td className="border border-black p-1">1</td>
                    <td className="border border-black p-1 text-left pl-2">Unidades Didácticas del Módulo</td>
                    <td className="border border-black p-1">-</td>
                    <td className="border border-black p-1">-</td>
                    <td className="border border-black p-1">Regular</td>
                  </tr>
                )}
                <tr className="font-bold bg-slate-50">
                  <td colSpan={2} className="border border-black p-1 text-right pr-2">TOTAL:</td>
                  <td className="border border-black p-1">{totalCreditos}</td>
                  <td className="border border-black p-1">{totalHoras}</td>
                  <td className="border border-black p-1"></td>
                </tr>
              </tbody>
            </table>

            {/* II & III Side by side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <div>
                <h3 className="text-center font-bold text-[10.5px] mb-1 uppercase tracking-wide">II. UNIDADES DIDÁCTICAS DE SUBSANACIÓN</h3>
                <table className="w-full text-[9.5px] border border-black border-collapse text-center">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="border border-black p-1 w-7">N°</th>
                      <th className="border border-black p-1 text-left pl-1.5">UNIDAD DIDÁCTICA</th>
                      <th className="border border-black p-1 w-12">CRÉD.</th>
                      <th className="border border-black p-1 w-12">HORAS</th>
                      <th className="border border-black p-1 w-16">OBS.</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-black p-1">-</td>
                      <td className="border border-black p-1 text-left pl-1.5 text-slate-400">Sin unidades de subsanación</td>
                      <td className="border border-black p-1">-</td>
                      <td className="border border-black p-1">-</td>
                      <td className="border border-black p-1"></td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div>
                <h3 className="text-center font-bold text-[10.5px] mb-1 uppercase tracking-wide">III. EXPERIENCIAS FORMATIVAS (EFSRT)</h3>
                <table className="w-full text-[9.5px] border border-black border-collapse text-center">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="border border-black p-1 text-left pl-1.5">EN EL CETPRO / CENTRO LABORAL O EMPRESA</th>
                      <th className="border border-black p-1 w-12">CRÉD.</th>
                      <th className="border border-black p-1 w-12">HORAS</th>
                      <th className="border border-black p-1 w-16">OBS.</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-black p-1 text-left pl-1.5">Desarrollo de prácticas pre-profesionales / módulo según programa</td>
                      <td className="border border-black p-1">-</td>
                      <td className="border border-black p-1">-</td>
                      <td className="border border-black p-1"></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Signatures */}
            <div className="flex justify-between items-end px-6 text-center mt-6 mb-2">
              <div className="w-[28%] px-2">
                <div className="border-t border-slate-300 pt-1">
                  <div className="text-[7pt] font-semibold text-slate-600">Director(a)</div>
                  <div className="text-[5.6pt] text-slate-400">Sello, firma, post firma</div>
                </div>
              </div>
              <div className="w-[28%] px-2">
                <div className="border-t border-slate-300 pt-1">
                  <div className="text-[7pt] font-semibold text-slate-600">Coordinador(a) Académico</div>
                  <div className="text-[5.6pt] text-slate-400">Sello, firma, post firma</div>
                </div>
              </div>
              <div className="w-[28%] px-2">
                <div className="border-t border-slate-300 pt-1">
                  <div className="text-[7pt] font-semibold text-slate-600">Estudiante</div>
                  <div className="text-[5.6pt] text-slate-400">Firma y DNI: {persona?.numeroDocumento || '---'}</div>
                </div>
              </div>
            </div>

            {/* Footnote */}
            <div className="text-[9px] text-slate-500 mt-2 text-left border-t border-dotted border-slate-300 pt-1">
              ¹ Se hace referencia a situaciones específicas del estudiante como PIR, Transitabilidad, MOT, Discapacidad y otros según R.V.M. N° 188-2020-MINEDU.
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
