import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { UploadCloud, FileSpreadsheet, CheckCircle2, AlertCircle, Trash2, ArrowRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const ImportadorView: React.FC = () => {
  const { addToast } = useApp();
  const [tipoImportacion, setTipoImportacion] = useState<'personas' | 'estudiantes' | 'trabajadores' | 'apoderados' | 'programas' | 'sectores' | 'familias' | 'actividades' | 'unidades' | 'modulos' | 'matriculas'>('personas');
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseSheet = (wb: XLSX.WorkBook, sheetName: string) => {
    try {
      const ws = wb.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(ws, { defval: "" });
      if (data.length > 0) {
        setHeaders(Object.keys(data[0] as object));
        setParsedData(data);
        addToast('Hoja Leída', `Se encontraron ${data.length} filas en la hoja "${sheetName}".`);
      } else {
        setHeaders([]);
        setParsedData([]);
        addToast('Atención', `La hoja "${sheetName}" parece estar vacía.`);
      }
    } catch (err) {
      addToast('Error', 'No se pudo interpretar la hoja seleccionada.');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        
        setWorkbook(wb);
        setSheetNames(wb.SheetNames);
        setSelectedSheet(wb.SheetNames[0]);
        
        // Parse the first sheet by default
        parseSheet(wb, wb.SheetNames[0]);
        
      } catch (err) {
        addToast('Error de Lectura', 'No se pudo leer el archivo Excel.');
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleSheetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSheet = e.target.value;
    setSelectedSheet(newSheet);
    if (workbook) {
      parseSheet(workbook, newSheet);
    }
  };

  const handleClear = () => {
    setParsedData([]);
    setHeaders([]);
    setWorkbook(null);
    setSheetNames([]);
    setSelectedSheet('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleImport = async () => {
    if (parsedData.length === 0) return;
    setIsUploading(true);

    try {
      const response = await fetch('/api/import/excel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo: tipoImportacion, data: parsedData })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.skipped && result.skipped > 0) {
          addToast('Importación Parcial', `Se importaron ${result.count} registros. Se omitieron ${result.skipped} registros. Razones: ${result.skipReasons.join(' | ')}`);
        } else {
          addToast('Importación Exitosa', `Se importaron ${result.count} registros correctamente.`);
        }
        handleClear();
        // Recargar la página para que el AppContext vuelva a traer todos los datos frescos de la BD
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        const err = await response.json();
        addToast('Error en Importación', err.error || 'Ocurrió un error al guardar los datos.');
      }
    } catch (error) {
      console.error(error); addToast('Error de Red', String(error));
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadTemplate = () => {
    let headers: string[] = [];
    let sampleRow: any[] = [];
    
    switch (tipoImportacion) {
      case 'personas':
        headers = [
          'DNI', 'NOMBRES', 'APELLIDO_PATERNO', 'APELLIDO_MATERNO', 
          'CORREO', 'TELEFONO', 'GENERO', 'FECHA_NACIMIENTO', 'DIRECCION',
          'OPERADOR_TELEFONICO', 'DISCAPACIDAD', 'TIPO_DISCAPACIDAD', 'ROL'
        ];
        sampleRow = [
          '74829103', 'JUAN CARLOS', 'PÉREZ', 'GÓMEZ', 
          'juan.perez@gmail.com', '987654321', 'M', '1998-05-14', 'Jr. Huallaga 123',
          'Claro', 'NO', '', 'ESTUDIANTE'
        ];
        break;
      case 'estudiantes':
        headers = [
          'DNI', 'NOMBRES', 'APELLIDO_PATERNO', 'APELLIDO_MATERNO', 
          'CORREO', 'TELEFONO', 'GENERO', 'FECHA_NACIMIENTO', 'DIRECCION', 'NIVEL_EDUCATIVO', 'ESTADO_CIVIL',
          'OPERADOR_TELEFONICO', 'DISCAPACIDAD', 'TIPO_DISCAPACIDAD',
          'IE_PROCEDENCIA', 'TRABAJA', 'PUESTO_TRABAJO', 'LUGAR_NACIMIENTO', 'DISTRITO_NACIMIENTO', 'PROVINCIA_NACIMIENTO', 'REGION_NACIMIENTO', 'PAIS_NACIMIENTO'
        ];
        sampleRow = [
          '74829103', 'JUAN CARLOS', 'PÉREZ', 'GÓMEZ', 
          'juan.perez@gmail.com', '987654321', 'M', '1998-05-14', 'Jr. Huallaga 123', 'Secundaria completa', 'Soltero(a)',
          'Movistar', 'NO', '',
          'I.E. José Olaya', 'NO', 'Ninguno', 'Juanjuí', 'Juanjuí', 'Mariscal Cáceres', 'San Martín', 'Perú'
        ];
        break;
      case 'trabajadores':
        headers = [
          'DNI', 'NOMBRES', 'APELLIDO_PATERNO', 'APELLIDO_MATERNO', 
          'CORREO', 'TELEFONO', 'GENERO', 'FECHA_NACIMIENTO', 'DIRECCION', 'NIVEL_EDUCATIVO', 'ESTADO_CIVIL',
          'OPERADOR_TELEFONICO', 'DISCAPACIDAD', 'TIPO_DISCAPACIDAD',
          'CARGO', 'CONDICION', 'ESCALA_REGIMEN', 'ESPECIALIDAD', 'CODIGO_PLAZA', 'MOTIVO_PLAZA', 'RD_NOMBRAMIENTO_CONTRATO', 'ESTADO', 'ROL'
        ];
        sampleRow = [
          '45829103', 'ROSA MARÍA', 'FLORES', 'VARGAS', 
          'rosa.flores@cetpro.edu.pe', '991234567', 'M', '1985-10-20', 'Jr. Los Pinos 456', 'Superior Pedagógico', 'Casado(a)',
          'Entel', 'NO', '',
          'Docente', 'Nombrado', '3ra Escala', 'Confección Textil', 'PLZ-9923', 'Orgánica', 'RD-2020-001', 'ACTIVO', 'DOCENTE'
        ];
        break;
      case 'apoderados':
        headers = [
          'DNI_ESTUDIANTE', 'DNI_APODERADO', 'NOMBRES_APODERADO', 
          'APELLIDO_PATERNO', 'APELLIDO_MATERNO', 'TELEFONO', 'CORREO', 'DIRECCION', 'PARENTESCO', 'ES_PRINCIPAL', 'VIVE_CON_ESTUDIANTE'
        ];
        sampleRow = [
          '74829103', '10982345', 'Carlos', 
          'Pérez', 'Ramos', '987112233', 'carlos.perez@gmail.com', 'Jr. Comercio 450', 'Padre', 'SI', 'SI'
        ];
        break;
      case 'programas':
        headers = ['CODIGO', 'NOMBRE', 'DESCRIPCION', 'NIVEL', 'HORAS', 'CREDITOS'];
        sampleRow = ['TEX-01', 'Confección Textil', 'Programa técnico en confección y patronaje', 'Técnico', 1020, 40];
        break;
      case 'modulos':
        headers = ['CODIGO', 'NOMBRE', 'HORAS', 'CREDITOS', 'PROGRAMA_CODIGO'];
        sampleRow = ['MOD-01', 'Corte y Confección Básica', 340, 14, 'TEX-01'];
        break;
      case 'unidades':
        headers = ['CODIGO', 'NOMBRE', 'HORAS', 'CREDITOS', 'MODULO_CODIGO'];
        sampleRow = ['UD-01', 'Patronaje Industrial', 68, 3, 'MOD-01'];
        break;
      case 'matriculas':
        headers = ['DNI', 'MODULO', 'PERIODO_ACADEMICO', 'PERIODO_LECTIVO', 'SEDE', 'SECCION', 'ESTADO', 'CONDICION', 'FORMACION', 'OPORTUNIDAD_TECNICA', 'OBSERVACIONES'];
        sampleRow = ['74829103', 'MOD-01', '2026-I', '2026', 'Sede Central', 'SEC-A', 'ACTIVA', 'GRATUITO', 'PRESENCIAL', 'NO', 'Ninguna'];
        break;
      case 'sectores':
        headers = ['CODIGO', 'NOMBRE', 'DESCRIPCION'];
        sampleRow = ['SEC-01', 'Industria Manufacturera', 'Actividades de transformación de materias primas'];
        break;
      case 'familias':
        headers = ['CODIGO', 'SECTOR_CODIGO', 'NOMBRE', 'DESCRIPCION'];
        sampleRow = ['FAM-01', 'SEC-01', 'Textil, Confección y Cuero', 'Familia de confección y calzado'];
        break;
      case 'actividades':
        headers = ['CODIGO', 'FAMILIA_CODIGO', 'NOMBRE', 'DESCRIPCION'];
        sampleRow = ['ACT-01', 'FAM-01', 'Fabricación de prendas de vestir', 'Confección de ropa para damas y caballeros'];
        break;
      default:
        headers = ['CODIGO', 'NOMBRE'];
        sampleRow = ['01', 'Ejemplo'];
    }

    const ws = XLSX.utils.aoa_to_sheet([headers, sampleRow]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Plantilla');
    XLSX.writeFile(wb, `Plantilla_${tipoImportacion}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  Importador Masivo de Datos (Excel)
                </h1>
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-[10px] font-mono font-bold uppercase">
                  SINCRONIZACIÓN
                </span>
                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-md text-[10px] font-mono font-bold uppercase">
                  .XLSX
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Carga y sincronización masiva de padrones, estudiantes, trabajadores, programas y matrículas desde archivos Excel
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">1. Seleccionar Destino</h3>
          <select 
            value={tipoImportacion} 
            onChange={(e) => {
              setTipoImportacion(e.target.value as any);
              handleClear();
            }}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="personas">1. Padrón General de Personas</option>
            <option value="estudiantes">2. Padrón de Estudiantes</option>
            <option value="trabajadores">3. Padrón de Personal (Trabajadores)</option>
            <option value="apoderados">4. Apoderados de Estudiantes</option>
            <option value="sectores">Sectores Económicos</option>
            <option value="familias">Familias Productivas</option>
            <option value="actividades">Actividades Económicas</option>
            <option value="programas">Programas de Estudio</option>
            <option value="modulos">Módulos Formativos</option>
            <option value="unidades">Unidades Didácticas</option>
            <option value="matriculas">Matrículas de Estudiantes</option>
          </select>
          
          <div className="text-[11px] text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
            {tipoImportacion === 'personas' && "Padrón General: DNI, NOMBRES, APELLIDOS, CORREO, TELEFONO, GENERO (M/F/H), OPERADOR_TELEFONICO (Movistar/Claro/Entel/Bitel/Otro), DISCAPACIDAD (SI/NO), TIPO_DISCAPACIDAD, ROL (ESTUDIANTE/DOCENTE/ADMINISTRATIVO/DIRECTIVO/APODERADO/EGRESADO)."}
            {tipoImportacion === 'estudiantes' && "Padrón de Estudiantes: Datos de persona + NIVEL_EDUCATIVO, OPERADOR_TELEFONICO, DISCAPACIDAD, TIPO_DISCAPACIDAD, IE_PROCEDENCIA, LUGAR_NACIMIENTO."}
            {tipoImportacion === 'trabajadores' && "Personal Docente/Administrativo: Datos de persona + OPERADOR_TELEFONICO, CARGO, CONDICION, ESPECIALIDAD, PLAZA, ROL (DOCENTE/ADMINISTRATIVO/DIRECTIVO)."}
            {tipoImportacion === 'apoderados' && "Apoderados: DNI_ESTUDIANTE, DNI_APODERADO, NOMBRES_APODERADO, APELLIDO_PATERNO, APELLIDO_MATERNO, TELEFONO, PARENTESCO, ES_PRINCIPAL."}
            {tipoImportacion === 'programas' && "Programas de Estudio: CODIGO, NOMBRE, DESCRIPCION, NIVEL, HORAS, CREDITOS."}
            {tipoImportacion === 'modulos' && "Módulos Formativos: CODIGO, NOMBRE, HORAS, CREDITOS, PROGRAMA_CODIGO."}
            {tipoImportacion === 'unidades' && "Unidades Didácticas: CODIGO, NOMBRE, HORAS, CREDITOS, MODULO_CODIGO."}
            {tipoImportacion === 'matriculas' && "Matrículas: DNI, MODULO, PERIODO_ACADEMICO, PERIODO_LECTIVO, SEDE, SECCION, ESTADO, CONDICION, FORMACION, OPORTUNIDAD_TECNICA, OBSERVACIONES."}
            {tipoImportacion === 'sectores' && "Sectores Económicos: CODIGO, NOMBRE, DESCRIPCION."}
            {tipoImportacion === 'familias' && "Familias Productivas: CODIGO, SECTOR_CODIGO, NOMBRE, DESCRIPCION."}
            {tipoImportacion === 'actividades' && "Actividades Económicas: CODIGO, FAMILIA_CODIGO, NOMBRE, DESCRIPCION."}
          </div>

          <button
            onClick={handleDownloadTemplate}
            className="w-full flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Descargar Plantilla Excel</span>
          </button>
        </div>

        <div className="lg:col-span-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-4">2. Subir Archivo Excel</h3>
          
          {parsedData.length === 0 ? (
            <div className="border-2 border-dashed border-slate-200 rounded-2xl p-10 flex flex-col items-center justify-center text-center hover:bg-slate-50 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-800 mb-1">Arrastra tu archivo Excel (.xlsx) aquí</p>
              <p className="text-xs text-slate-400 mb-4">o haz clic en el botón para explorar en tu equipo</p>
              
              <input 
                type="file" 
                accept=".xlsx, .xls"
                onChange={handleFileUpload}
                ref={fileInputRef}
                className="hidden" 
                id="excel-upload"
              />
              <label 
                htmlFor="excel-upload"
                className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold cursor-pointer hover:bg-blue-700 transition-colors shadow-xs flex items-center gap-1.5"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Seleccionar Archivo Excel</span>
              </label>
            </div>
          ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 p-4 rounded-xl">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                    <div>
                      <p className="text-sm font-bold text-emerald-800">Archivo listo para importar</p>
                      <p className="text-xs text-emerald-600">{parsedData.length} registros detectados</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {sheetNames.length > 1 && (
                      <select
                        value={selectedSheet}
                        onChange={handleSheetChange}
                        className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                        title="Selecciona la hoja a importar"
                      >
                        {sheetNames.map(name => (
                          <option key={name} value={name}>{name}</option>
                        ))}
                      </select>
                    )}
                    <button 
                      onClick={handleClear}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" /> Descartar
                    </button>
                    <button 
                      onClick={handleImport}
                      disabled={isUploading}
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-1 disabled:opacity-50"
                    >
                      {isUploading ? 'Importando...' : 'Iniciar Importación'} <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="bg-slate-100 px-3 py-2 border-b border-slate-200">
                    <p className="text-xs font-semibold text-slate-600">Vista Previa (Primeros 5 registros)</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs whitespace-nowrap">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          {headers.map(h => (
                            <th key={h} className="px-4 py-2 font-bold text-slate-700">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {parsedData.slice(0, 5).map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            {headers.map(h => (
                              <td key={h} className="px-4 py-2 text-slate-600">{row[h]}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
            
          </div>
        </div>

    </div>
  );
};
