import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { Persona, TipoDocumento, Genero, EstadoEstudiante, OPERADORES_TELEFONICOS, TIPOS_DISCAPACIDAD, ROLES_PERSONA, RolPersona } from '../../types';
import { normalizeSexo } from '../../utils/genero';
import { Modal } from '../common/Modal';
import { ImageUploadField } from '../common/ImageUploadField';
import { Camera, Image as ImageIcon, Link as LinkIcon, Upload, Trash2, CheckCircle2, User } from 'lucide-react';

interface NuevaPersonaModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Persona | null;
}

export const NuevaPersonaModal: React.FC<NuevaPersonaModalProps> = ({
  isOpen,
  onClose,
  initialData,
}) => {
  const { addPersona, updatePersona, estudiantes, trabajadores, personas, programas, planesEstudio, matriculas } = useApp();

  const [rolesAcceso, setRolesAcceso] = useState<any[]>([]);
  useEffect(() => {
    fetch('/api/admin/roles').then(res => res.json()).then(data => {
      if (data && data.rolesPersonas) {
        setRolesAcceso(data.rolesPersonas);
      }
    }).catch(console.error);
  }, []);

  const [formData, setFormData] = useState({
    tipoDocumento: 'DNI' as TipoDocumento,
    numeroDocumento: '',
    nombres: '',
    apellidoPaterno: '',
    apellidoMaterno: '',
    fechaNacimiento: '2000-01-01',
    sexo: 'M' as Genero,
    telefono: '',
    correo: '',
    direccion: '',
    nivelEducativo: '',
    estadoCivil: '',
    cargaFamiliar: 0,
    internetCasa: false,
    equipoClasesVirtuales: '',
    operadorTelefonico: '',
    discapacidad: false,
    tipoDiscapacidad: '',
    fotoUrl: '',
    observaciones: '',
    rolPrimario: 'ESTUDIANTE' as RolPersona,
    // Estudiante
    trabaja: false,
    ieProcedencia: '',
    puestoTrabajo: '',
    lugarNacimiento: '',
    distritoNacimiento: '',
    provinciaNacimiento: '',
    regionNacimiento: '',
    paisNacimiento: '',
    telefonoContacto: '',
    lenguaOriginaria: '',
    // Trabajador
    rolAccesoId: '',
    codigoPlaza: '',
    motivoPlaza: '',
    cargo: '',
    condicion: 'Contratado(a)',
    estadoTrabajador: 'Activo',
    escalaRegimen: '',
    tituloEspecialidad: '',
    rdNombramientoContrato: '',
    // Apoderado
    estudianteAsociadoId: '',
    parentesco: '',
    esApoderadoPrincipal: false,
    viveConEstudiante: false,
    // Egresado
    matriculaId: '',
    programaId: '',
    planEstudioId: '',
    fechaEgreso: '',
    numeroRegistroTitulo: ''
  });

  useEffect(() => {
    if (initialData) {
      const relEst = estudiantes.find((e) => e.personaId === initialData.id);
      const relTrab = trabajadores.find((t) => t.personaId === initialData.id);

      let rolPrimario = initialData.rolPrimario;
      if (!rolPrimario) {
        rolPrimario = (initialData.esTrabajador || relTrab ? 'DOCENTE' : 'ESTUDIANTE');
      } else if ((rolPrimario as any) === 'TRABAJADOR') {
        rolPrimario = 'DOCENTE';
      }

      setFormData({
        tipoDocumento: initialData.tipoDocumento || 'DNI',
        numeroDocumento: initialData.numeroDocumento || '',
        nombres: initialData.nombres || '',
        apellidoPaterno: initialData.apellidoPaterno || '',
        apellidoMaterno: initialData.apellidoMaterno || '',
        fechaNacimiento: initialData.fechaNacimiento || '2004-05-10',
        sexo: initialData.sexo || (initialData as any).genero || 'M',
        telefono: initialData.telefono || '',
        correo: initialData.correo || (initialData as any).email || '',
        direccion: initialData.direccion || (initialData as any).direccionActual || '',
        nivelEducativo: initialData.nivelEducativo || '',
        estadoCivil: initialData.estadoCivil || '',
        cargaFamiliar: initialData.cargaFamiliar || 0,
        internetCasa: initialData.internetCasa || false,
        equipoClasesVirtuales: initialData.equipoClasesVirtuales || '',
        operadorTelefonico: initialData.operadorTelefonico || '',
        discapacidad: initialData.discapacidad || false,
        tipoDiscapacidad: initialData.tipoDiscapacidad || '',
        fotoUrl: initialData.fotoUrl || (initialData as any).foto_url || '',
        observaciones: initialData.observaciones || '',
        estado: initialData.estado || 'ACTIVO',
        rolPrimario: rolPrimario as RolPersona,
        
        // Estudiante
        trabaja: initialData.trabaja ?? relEst?.trabaja ?? false,
        ieProcedencia: initialData.ieProcedencia || relEst?.ieProcedencia || '',
        puestoTrabajo: initialData.puestoTrabajo || relEst?.puestoTrabajo || '',
        lugarNacimiento: initialData.lugarNacimiento || relEst?.lugarNacimiento || '',
        distritoNacimiento: initialData.distritoNacimiento || relEst?.distritoNacimiento || '',
        provinciaNacimiento: initialData.provinciaNacimiento || relEst?.provinciaNacimiento || '',
        regionNacimiento: initialData.regionNacimiento || relEst?.regionNacimiento || '',
        paisNacimiento: initialData.paisNacimiento || relEst?.paisNacimiento || '',
        telefonoContacto: initialData.telefonoContacto || relEst?.telefonoContacto || '',
        lenguaOriginaria: initialData.lenguaOriginaria || relEst?.lenguaOriginaria || '',

        // Trabajador
        codigoPlaza: initialData.codigoPlaza || relTrab?.codigoPlaza || '',
        motivoPlaza: initialData.motivoPlaza || relTrab?.motivoPlaza || '',
        cargo: initialData.cargo || relTrab?.cargo || '',
        condicion: initialData.condicion || relTrab?.condicion || 'Contratado(a)',
        escalaRegimen: initialData.escalaRegimen || relTrab?.escalaRegimen || '',
        tituloEspecialidad: initialData.tituloEspecialidad || relTrab?.tituloEspecialidad || '',
        rdNombramientoContrato: initialData.rdNombramientoContrato || relTrab?.rdNombramientoContrato || '',
        estadoTrabajador: initialData.estadoTrabajador || relTrab?.estado || 'Activo',

        // Apoderado
        estudianteAsociadoId: initialData.estudianteAsociadoId || '',
        parentesco: initialData.parentesco || '',
        esApoderadoPrincipal: initialData.esApoderadoPrincipal || false,
        viveConEstudiante: initialData.viveConEstudiante || false,

        // Egresado
        matriculaId: initialData.matriculaId || '',
        programaId: initialData.programaId || '',
        planEstudioId: initialData.planEstudioId || '',
        fechaEgreso: initialData.fechaEgreso || '',
        numeroRegistroTitulo: initialData.numeroRegistroTitulo || '',
        observacionesEgresado: initialData.observacionesEgresado || ''
      });
    } else {
      setFormData({
        tipoDocumento: 'DNI',
        numeroDocumento: '',
        nombres: '',
        apellidoPaterno: '',
        apellidoMaterno: '',
        fechaNacimiento: '2004-05-10',
        sexo: 'M',
        telefono: '',
        correo: '',
        direccion: '',
        nivelEducativo: '',
        estadoCivil: 'Soltero(a)',
        cargaFamiliar: 0,
        internetCasa: false,
        equipoClasesVirtuales: '',
        operadorTelefonico: '',
        discapacidad: false,
        tipoDiscapacidad: '',
        fotoUrl: '',
        observaciones: '',
        estado: 'ACTIVO',
        rolPrimario: 'ESTUDIANTE',

        trabaja: false,
        ieProcedencia: '',
        puestoTrabajo: '',
        lugarNacimiento: '',
        distritoNacimiento: '',
        provinciaNacimiento: '',
        regionNacimiento: '',
        paisNacimiento: '',
        telefonoContacto: '',
        lenguaOriginaria: '',

        codigoPlaza: '',
        motivoPlaza: '',
        cargo: '',
        condicion: 'Contratado(a)',
        escalaRegimen: '',
        tituloEspecialidad: '',
        rdNombramientoContrato: '',
        estadoTrabajador: 'Activo',
        
        estudianteAsociadoId: '',
        parentesco: '',
        esApoderadoPrincipal: false,
        viveConEstudiante: false,

        matriculaId: '',
        programaId: '',
        planEstudioId: '',
        fechaEgreso: '',
        numeroRegistroTitulo: '',
        observacionesEgresado: ''
      });
    }
  }, [initialData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.numeroDocumento || !formData.nombres || !formData.apellidoPaterno) {
      return;
    }
    
    const isStaff = formData.rolPrimario === 'DOCENTE' || formData.rolPrimario === 'ADMINISTRATIVO' || formData.rolPrimario === 'DIRECTIVO' || (formData.rolPrimario as any) === 'TRABAJADOR';
    const isStudent = formData.rolPrimario === 'ESTUDIANTE' || formData.rolPrimario === 'EGRESADO';

    const normSex = normalizeSexo(formData.sexo);
    const dataToSave = {
      ...formData,
      sexo: normSex,
      genero: normSex,
      esEstudiante: isStudent,
      esTrabajador: isStaff
    };
    
    if (initialData) {
      await updatePersona({ ...initialData, ...dataToSave, sexo: normSex, genero: normSex });
    } else {
      await addPersona(dataToSave);
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Editar Registro de Persona' : 'Registrar Nueva Persona'}
      subtitle={initialData ? 'Modificación de ficha de datos' : 'Ingreso al padrón general de la institución'}
      maxWidth="4xl"
      actions={
        <>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="persona-form"
            className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors"
          >
            {initialData ? 'Guardar Cambios' : 'Registrar Persona'}
          </button>
        </>
      }
    >
      <form id="persona-form" onSubmit={handleSubmit} className="space-y-8 max-h-[70vh] overflow-y-auto pr-2">
        
        {/* SECCIÓN 1: DATOS PERSONALES */}
        <div className="space-y-4">
          <h3 className="font-bold text-slate-800 text-sm border-b pb-2">1. Datos Personales</h3>

          {/* FOTO DE PERFIL (CAMPO foto_url) */}
          <ImageUploadField
            label="Fotografía / Avatar (Columna foto_url)"
            sublabel="Foto del padrón de personas para carnet institucional, expediente y carnet de estudiante."
            value={formData.fotoUrl || ''}
            onChange={(newFoto) => setFormData({ ...formData, fotoUrl: newFoto })}
            aspectRatio="square"
            previewSize="md"
            placeholderText="https://ejemplo.com/fotos/16682317.jpg o enlace web..."
            helperText="Puedes subir una imagen desde tu equipo o ingresar un enlace web directo."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Estado en la Institución <span className="text-red-500">*</span></label>
              <select
                value={formData.estado}
                onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
              >
                <option value="ACTIVO">Activo</option>
                <option value="INACTIVO">Inactivo</option>
              </select>
            </div>
            <div className="hidden sm:block"></div>
            
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tipo de Documento <span className="text-red-500">*</span></label>
              <select
                value={formData.tipoDocumento}
                onChange={(e) => setFormData({ ...formData, tipoDocumento: e.target.value as TipoDocumento })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
              >
                <option value="DNI">DNI</option>
                <option value="Carnet de Extranjería">Carnet de Extranjería</option>
                <option value="Pasaporte">Pasaporte</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Número de Documento <span className="text-red-500">*</span></label>
              <input
                type="text"
                required
                placeholder="Ej. 74123698"
                value={formData.numeroDocumento}
                onChange={(e) => setFormData({ ...formData, numeroDocumento: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nombres <span className="text-red-500">*</span></label>
              <input
                type="text"
                required
                placeholder="Ej. Juan Carlos"
                value={formData.nombres}
                onChange={(e) => setFormData({ ...formData, nombres: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Apellido Paterno <span className="text-red-500">*</span></label>
              <input
                type="text"
                required
                placeholder="Ej. Pérez"
                value={formData.apellidoPaterno}
                onChange={(e) => setFormData({ ...formData, apellidoPaterno: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Apellido Materno</label>
              <input
                type="text"
                placeholder="Ej. Gómez"
                value={formData.apellidoMaterno}
                onChange={(e) => setFormData({ ...formData, apellidoMaterno: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Fecha de Nacimiento</label>
              <input
                type="date"
                value={formData.fechaNacimiento}
                onChange={(e) => setFormData({ ...formData, fechaNacimiento: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Sexo</label>
              <div className="flex gap-4 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="sexo"
                    checked={normalizeSexo(formData.sexo) === 'H'}
                    onChange={() => setFormData({ ...formData, sexo: 'H' })}
                  />
                  <span>Hombre</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="sexo"
                    checked={normalizeSexo(formData.sexo) === 'M'}
                    onChange={() => setFormData({ ...formData, sexo: 'M' })}
                  />
                  <span>Mujer</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* SECCIÓN 2: UBICACIÓN Y CONTACTO */}
        <div className="space-y-4">
          <h3 className="font-bold text-slate-800 text-sm border-b pb-2">2. Ubicación y Contacto</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Teléfono Personal</label>
              <input
                type="text"
                placeholder="Ej. 942123456"
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Correo Electrónico</label>
              <input
                type="email"
                placeholder="Ej. alumno@gmail.com"
                value={formData.correo}
                onChange={(e) => setFormData({ ...formData, correo: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Dirección Domiciliaria</label>
            <input
              type="text"
              placeholder="Ej. Jr. Huallaga N° 450, Barrio La Merced"
              value={formData.direccion}
              onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>
        </div>

        {/* SECCIÓN 3: DATOS COMPLEMENTARIOS */}
        <div className="space-y-4">
          <h3 className="font-bold text-slate-800 text-sm border-b pb-2">3. Datos Complementarios</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Estado Civil</label>
              <select
                value={formData.estadoCivil}
                onChange={(e) => setFormData({ ...formData, estadoCivil: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
              >
                <option value="">-- Seleccionar --</option>
                <option value="Soltero(a)">Soltero(a)</option>
                <option value="Casado(a)">Casado(a)</option>
                <option value="Conviviente">Conviviente</option>
                <option value="Divorciado(a)">Divorciado(a)</option>
                <option value="Viudo(a)">Viudo(a)</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Carga Familiar (Hijos)</label>
              <input
                type="number"
                min="0"
                value={formData.cargaFamiliar}
                onChange={(e) => setFormData({ ...formData, cargaFamiliar: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nivel Educativo Alcanzado</label>
              <select
                value={formData.nivelEducativo}
                onChange={(e) => setFormData({ ...formData, nivelEducativo: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
              >
                <option value="">-- Seleccionar --</option>
                <option value="Secundaria Completa">Secundaria Completa</option>
                <option value="Secundaria Incompleta">Secundaria Incompleta</option>
                <option value="Superior Técnico">Superior Técnico</option>
                <option value="Superior Tecnológico">Superior Tecnológico</option>
                <option value="Superior Pedagógico">Superior Pedagógico</option>
                <option value="Superior Universitario">Superior Universitario</option>
                <option value="Primaria">Primaria</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">¿Internet en casa?</label>
              <div className="flex gap-4 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="internetCasa"
                    checked={formData.internetCasa === true}
                    onChange={() => setFormData({ ...formData, internetCasa: true })}
                  />
                  <span>Sí</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="internetCasa"
                    checked={formData.internetCasa === false}
                    onChange={() => setFormData({ ...formData, internetCasa: false })}
                  />
                  <span>No</span>
                </label>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Operador Telefónico</label>
              <select
                value={formData.operadorTelefonico}
                onChange={(e) => setFormData({ ...formData, operadorTelefonico: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none"
              >
                <option value="">-- Seleccionar Operador --</option>
                {OPERADORES_TELEFONICOS.map((op) => (
                  <option key={op} value={op}>{op}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Equipo para Clases</label>
              <input
                type="text"
                placeholder="Ej. Celular, Laptop"
                value={formData.equipoClasesVirtuales}
                onChange={(e) => setFormData({ ...formData, equipoClasesVirtuales: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700 mb-2">
                <input
                  type="checkbox"
                  checked={formData.discapacidad}
                  onChange={(e) => {
                    const isChecked = e.target.checked;
                    setFormData({
                      ...formData,
                      discapacidad: isChecked,
                      tipoDiscapacidad: isChecked ? (formData.tipoDiscapacidad || 'Otra discapacidad') : ''
                    });
                  }}
                />
                <span>¿Presenta alguna discapacidad?</span>
              </label>
              {formData.discapacidad && (
                <div className="mt-1">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Tipo de Discapacidad</label>
                  <select
                    value={formData.tipoDiscapacidad}
                    onChange={(e) => setFormData({ ...formData, tipoDiscapacidad: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none text-xs"
                  >
                    <option value="">-- Seleccionar Tipo de Discapacidad --</option>
                    {TIPOS_DISCAPACIDAD.map((tipo) => (
                      <option key={tipo} value={tipo}>{tipo}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Observaciones Generales</label>
              <textarea
                rows={3}
                placeholder="Algún comentario adicional sobre el postulante/estudiante"
                value={formData.observaciones}
                onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none resize-none"
              />
            </div>
          </div>
        </div>

        {/* SECCIÓN 4: ROLES INSTITUCIONALES */}
        <div className="space-y-4">
          <div className="border-b pb-2 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-sm">4. Asignación de Rol Institucional</h3>
            <span className="text-[11px] text-slate-500 font-medium">Roles oficiales del CETPRO</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
            {ROLES_PERSONA.map((r) => {
              const isSelected = formData.rolPrimario === r.codigo || (r.codigo === 'DOCENTE' && (formData.rolPrimario as any) === 'TRABAJADOR');
              return (
                <label
                  key={r.codigo}
                  className={`flex items-center gap-2 cursor-pointer p-2.5 rounded-xl border transition-all ${
                    isSelected
                      ? 'bg-sky-50 border-sky-400 ring-2 ring-sky-500/20 text-sky-950 font-bold'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700 font-medium'
                  }`}
                >
                  <input
                    type="radio"
                    name="rolPrimario"
                    checked={isSelected}
                    onChange={() => {
                      const matchRole = rolesAcceso.find(ra => ra.codigo === r.codigo);
                      setFormData({
                        ...formData,
                        rolPrimario: r.codigo,
                        ...(matchRole ? { rolAccesoId: matchRole.id } : {})
                      });
                    }}
                    className="text-sky-600 focus:ring-sky-500"
                  />
                  <span className="text-xs">{r.label}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* SECCIÓN 5: DATOS ESTUDIANTE */}
        {formData.rolPrimario === 'ESTUDIANTE' && (
          <div className="space-y-4 bg-sky-50/50 p-4 rounded-xl border border-sky-100">
            <h3 className="font-bold text-sky-800 text-sm border-b border-sky-200 pb-2">5. Datos Específicos del Estudiante</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Lugar de Nacimiento</label>
                <input
                  type="text"
                  placeholder="Ej. Lima"
                  value={formData.lugarNacimiento}
                  onChange={(e) => setFormData({ ...formData, lugarNacimiento: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Distrito de Nacimiento</label>
                <input
                  type="text"
                  placeholder="Ej. Miraflores"
                  value={formData.distritoNacimiento}
                  onChange={(e) => setFormData({ ...formData, distritoNacimiento: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Provincia de Nacimiento</label>
                <input
                  type="text"
                  placeholder="Ej. Lima"
                  value={formData.provinciaNacimiento}
                  onChange={(e) => setFormData({ ...formData, provinciaNacimiento: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Región / Departamento</label>
                <input
                  type="text"
                  placeholder="Ej. Lima"
                  value={formData.regionNacimiento}
                  onChange={(e) => setFormData({ ...formData, regionNacimiento: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">País de Nacimiento</label>
                <input
                  type="text"
                  placeholder="Ej. Perú"
                  value={formData.paisNacimiento}
                  onChange={(e) => setFormData({ ...formData, paisNacimiento: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Lengua Originaria</label>
                <input
                  type="text"
                  placeholder="Ej. Quechua, Aymara, Castellano"
                  value={formData.lenguaOriginaria}
                  onChange={(e) => setFormData({ ...formData, lenguaOriginaria: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Colegio de Procedencia</label>
                <input
                  type="text"
                  placeholder="Ej. IE 60050 República de Venezuela"
                  value={formData.ieProcedencia}
                  onChange={(e) => setFormData({ ...formData, ieProcedencia: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Teléfono de Contacto/Apoderado</label>
                <input
                  type="text"
                  placeholder="Ej. 999888777"
                  value={formData.telefonoContacto}
                  onChange={(e) => setFormData({ ...formData, telefonoContacto: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>
            </div>
            
            <div className="p-3 bg-white rounded-xl border border-sky-200 mt-2">
              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700 mb-2">
                <input
                  type="checkbox"
                  checked={formData.trabaja}
                  onChange={(e) => setFormData({ ...formData, trabaja: e.target.checked })}
                />
                <span>¿Actualmente trabaja?</span>
              </label>
              {formData.trabaja && (
                <input
                  type="text"
                  placeholder="Especifique puesto de trabajo"
                  value={formData.puestoTrabajo}
                  onChange={(e) => setFormData({ ...formData, puestoTrabajo: e.target.value })}
                  className="w-full px-3 py-2 mt-1 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              )}
            </div>
          </div>
        )}

        {/* SECCIÓN 6: DATOS DEL PERSONAL (DOCENTE / ADMINISTRATIVO / DIRECTIVO) */}
        {(formData.rolPrimario === 'DOCENTE' || formData.rolPrimario === 'ADMINISTRATIVO' || formData.rolPrimario === 'DIRECTIVO' || (formData.rolPrimario as any) === 'TRABAJADOR') && (
          <div className="space-y-4 bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
            <h3 className="font-bold text-emerald-800 text-sm border-b border-emerald-200 pb-2">
              6. Datos Específicos del Personal Institucional ({formData.rolPrimario})
            </h3>
            
            <div className="bg-white p-3 rounded-lg border border-slate-200 mb-4">
              <label className="block font-bold text-slate-800 mb-1">Rol Institucional (Clasificación) <span className="text-rose-500">*</span></label>
              <p className="text-xs text-slate-500 mb-2">Define la clasificación jerárquica o académica de esta persona en el CETPRO.</p>
              <select
                value={formData.rolAccesoId}
                onChange={(e) => setFormData({ ...formData, rolAccesoId: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium"
              >
                <option value="">-- Seleccionar Rol Institucional --</option>
                {rolesAcceso.map(r => (
                  <option key={r.id} value={r.id}>{r.nombre}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Cargo Específico (Informativo)</label>
                <input
                  type="text"
                  placeholder="Ej. Docente de peluquería y barbería"
                  value={formData.cargo}
                  onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Código de Plaza</label>
                <input
                  type="text"
                  placeholder="Ej. PLZ-001"
                  value={formData.codigoPlaza}
                  onChange={(e) => setFormData({ ...formData, codigoPlaza: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Motivo de Plaza</label>
                <input
                  type="text"
                  placeholder="Ej. Reemplazo, Titular"
                  value={formData.motivoPlaza}
                  onChange={(e) => setFormData({ ...formData, motivoPlaza: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Condición Laboral</label>
                <select
                  value={formData.condicion}
                  onChange={(e) => setFormData({ ...formData, condicion: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:emerald-500 focus:outline-none"
                >
                  <option value="Nombrado(a)">Nombrado(a)</option>
                  <option value="Contratado(a)">Contratado(a)</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Escala / Régimen</label>
                <input
                  type="text"
                  placeholder="Ej. Ley 29944, 1ra Escala"
                  value={formData.escalaRegimen}
                  onChange={(e) => setFormData({ ...formData, escalaRegimen: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Título / Especialidad</label>
                <input
                  type="text"
                  placeholder="Ej. Lic. en Computación"
                  value={formData.tituloEspecialidad}
                  onChange={(e) => setFormData({ ...formData, tituloEspecialidad: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">RD Nombramiento/Contrato</label>
                <input
                  type="text"
                  placeholder="Ej. RD N° 123-2024"
                  value={formData.rdNombramientoContrato}
                  onChange={(e) => setFormData({ ...formData, rdNombramientoContrato: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Estado del Trabajador</label>
                <select
                  value={formData.estadoTrabajador}
                  onChange={(e) => setFormData({ ...formData, estadoTrabajador: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:emerald-500 focus:outline-none font-bold"
                >
                  <option value="Activo">Activo</option>
                  <option value="Licencia">Licencia</option>
                  <option value="Destacado">Destacado</option>
                  <option value="Designado">Designado</option>
                  <option value="Cesante">Cesante</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* SECCIÓN 7: DATOS APODERADO */}
        {formData.rolPrimario === 'APODERADO' && (
          <div className="space-y-4 bg-purple-50/50 p-4 rounded-xl border border-purple-100">
            <h3 className="font-bold text-purple-800 text-sm border-b border-purple-200 pb-2">7. Datos Específicos del Apoderado</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Estudiante Asociado</label>
                <select
                  value={formData.estudianteAsociadoId}
                  onChange={(e) => setFormData({ ...formData, estudianteAsociadoId: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:purple-500 focus:outline-none"
                >
                  <option value="">-- Seleccione un estudiante --</option>
                  {estudiantes.map(est => {
                    const p = personas.find(pers => pers.id === est.personaId);
                    return (
                      <option key={est.id} value={est.id}>
                        {p ? `${p.apellidoPaterno} ${p.apellidoMaterno || ''} ${p.nombres}` : est.id}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Parentesco</label>
                <input
                  type="text"
                  placeholder="Ej. Padre, Madre, Tío(a)"
                  value={formData.parentesco}
                  onChange={(e) => setFormData({ ...formData, parentesco: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:purple-500 focus:outline-none"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={formData.esApoderadoPrincipal}
                  onChange={(e) => setFormData({ ...formData, esApoderadoPrincipal: e.target.checked })}
                />
                <span>Es apoderado principal</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={formData.viveConEstudiante}
                  onChange={(e) => setFormData({ ...formData, viveConEstudiante: e.target.checked })}
                />
                <span>Vive con el estudiante</span>
              </label>
            </div>
          </div>
        )}

        {/* SECCIÓN 8: DATOS EGRESADO */}
        {formData.rolPrimario === 'EGRESADO' && (
          <div className="space-y-4 bg-amber-50/50 p-4 rounded-xl border border-amber-100">
            <h3 className="font-bold text-amber-800 text-sm border-b border-amber-200 pb-2">8. Datos Específicos del Egresado</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Programa</label>
                <select
                  value={formData.programaId}
                  onChange={(e) => setFormData({ ...formData, programaId: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:amber-500 focus:outline-none"
                >
                  <option value="">-- Seleccionar --</option>
                  {programas?.map(prog => (
                    <option key={prog.id} value={prog.id}>{prog.nombre}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Plan de Estudio</label>
                <select
                  value={formData.planEstudioId}
                  onChange={(e) => setFormData({ ...formData, planEstudioId: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:amber-500 focus:outline-none"
                >
                  <option value="">-- Seleccionar --</option>
                  {planesEstudio?.filter(pe => pe.programaId === formData.programaId).map(pe => (
                    <option key={pe.id} value={pe.id}>{pe.nombre}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Matrícula Origen</label>
                <select
                  value={formData.matriculaId}
                  onChange={(e) => setFormData({ ...formData, matriculaId: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:amber-500 focus:outline-none"
                >
                  <option value="">-- Seleccionar --</option>
                  {matriculas?.map(m => (
                    <option key={m.id} value={m.id}>{m.codigoMatricula}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Fecha de Egreso</label>
                <input
                  type="date"
                  value={formData.fechaEgreso}
                  onChange={(e) => setFormData({ ...formData, fechaEgreso: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:amber-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Número de Registro de Título</label>
                <input
                  type="text"
                  placeholder="Ej. REG-TIT-2024-001"
                  value={formData.numeroRegistroTitulo}
                  onChange={(e) => setFormData({ ...formData, numeroRegistroTitulo: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:amber-500 focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Observaciones de Egreso</label>
              <textarea
                rows={2}
                placeholder="Observaciones adicionales sobre el egreso..."
                value={formData.observacionesEgresado}
                onChange={(e) => setFormData({ ...formData, observacionesEgresado: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:amber-500 focus:outline-none resize-none"
              />
            </div>
          </div>
        )}

      </form>
    </Modal>
  );
};
