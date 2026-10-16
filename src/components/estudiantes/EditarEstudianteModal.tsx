import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Estudiante, Persona, Genero, TipoDocumento, OPERADORES_TELEFONICOS, TIPOS_DISCAPACIDAD } from '../../types';
import { normalizeSexo } from '../../utils/genero';
import { Modal } from '../common/Modal';
import { ImageUploadField } from '../common/ImageUploadField';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  GraduationCap,
  Wifi,
  Laptop,
  HeartHandshake,
  AlertCircle,
  FileText,
  Calendar,
  Save,
  Users,
} from 'lucide-react';

interface EditarEstudianteModalProps {
  isOpen: boolean;
  onClose: () => void;
  estudiante: Estudiante;
  persona: Persona;
}

export const EditarEstudianteModal: React.FC<EditarEstudianteModalProps> = ({
  isOpen,
  onClose,
  estudiante,
  persona,
}) => {
  const { updateEstudiante, updatePersona, personas, vincularApoderado } = useApp();

  const [formData, setFormData] = useState({
    // Persona fields
    tipoDocumento: 'DNI' as TipoDocumento,
    numeroDocumento: '',
    nombres: '',
    apellidoPaterno: '',
    apellidoMaterno: '',
    fechaNacimiento: '',
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

    // Estudiante fields
    telefonoContacto: '',
    trabaja: false,
    puestoTrabajo: '',
    ieProcedencia: '',
    lugarNacimiento: '',
    distritoNacimiento: '',
    provinciaNacimiento: '',
    regionNacimiento: '',
    paisNacimiento: '',
    lenguaOriginaria: '',
    estado: 'Regular' as any,
    periodoIngreso: '2025-I',
    anioIngreso: 2025,

    // Apoderado fields
    apoderadoDni: '',
    apoderadoNombres: '',
    apoderadoTelefono: '',
    apoderadoParentesco: 'Madre',
    esApoderadoPrincipal: true,
    viveConEstudiante: true,
    apoderadoEstado: 'ACTIVO',
    mostrarApoderado: false,
  });

  useEffect(() => {
    if (estudiante && persona) {
      // Find existing apoderado
      const apodPersona = personas.find(
        (p) => p.estudianteAsociadoId === estudiante.id || (p.apoderadoId && (p as any).estudianteId === estudiante.id)
      );

      // Check age & NNEE
      let isMinor = false;
      if (persona.fechaNacimiento) {
        const birthDate = new Date(persona.fechaNacimiento);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
        isMinor = age < 18;
      }
      const isNNEE = Boolean(persona.discapacidad || persona.tipoDiscapacidad);

      setFormData({
        // Persona
        tipoDocumento: persona.tipoDocumento || 'DNI',
        numeroDocumento: persona.numeroDocumento || '',
        nombres: persona.nombres || '',
        apellidoPaterno: persona.apellidoPaterno || '',
        apellidoMaterno: persona.apellidoMaterno || '',
        fechaNacimiento: persona.fechaNacimiento || '',
        sexo: normalizeSexo(persona.sexo || (persona as any).genero),
        telefono: persona.telefono || '',
        correo: persona.correo || (persona as any).email || '',
        direccion: persona.direccion || (persona as any).direccionActual || '',
        nivelEducativo: persona.nivelEducativo || 'Secundaria completa',
        estadoCivil: persona.estadoCivil || 'Soltero(a)',
        cargaFamiliar: persona.cargaFamiliar || 0,
        internetCasa: persona.internetCasa || false,
        equipoClasesVirtuales: persona.equipoClasesVirtuales || '',
        operadorTelefonico: persona.operadorTelefonico || '',
        discapacidad: persona.discapacidad || false,
        tipoDiscapacidad: persona.tipoDiscapacidad || '',
        fotoUrl: persona.fotoUrl || (persona as any).foto_url || '',
        observaciones: persona.observaciones || '',

        // Estudiante
        telefonoContacto: estudiante.telefonoContacto || persona.telefonoContacto || persona.telefono || '',
        trabaja: estudiante.trabaja ?? persona.trabaja ?? false,
        puestoTrabajo: estudiante.puestoTrabajo || persona.puestoTrabajo || '',
        ieProcedencia: estudiante.ieProcedencia || persona.ieProcedencia || '',
        lugarNacimiento: estudiante.lugarNacimiento || persona.lugarNacimiento || '',
        distritoNacimiento: estudiante.distritoNacimiento || persona.distritoNacimiento || '',
        provinciaNacimiento: estudiante.provinciaNacimiento || persona.provinciaNacimiento || '',
        regionNacimiento: estudiante.regionNacimiento || persona.regionNacimiento || '',
        paisNacimiento: estudiante.paisNacimiento || persona.paisNacimiento || 'Perú',
        lenguaOriginaria: estudiante.lenguaOriginaria || persona.lenguaOriginaria || 'Castellano',
        estado: estudiante.estado || 'Regular',
        periodoIngreso: estudiante.periodoIngreso || '2025-I',
        anioIngreso: estudiante.anioIngreso || 2025,

        // Apoderado
        apoderadoDni: apodPersona?.numeroDocumento || '',
        apoderadoNombres: apodPersona ? `${apodPersona.apellidoPaterno || ''} ${apodPersona.apellidoMaterno || ''} ${apodPersona.nombres || ''}`.trim() : (estudiante.contactoEmergencia?.nombre || ''),
        apoderadoTelefono: apodPersona?.telefono || estudiante.contactoEmergencia?.telefono || '',
        apoderadoParentesco: apodPersona?.parentesco || estudiante.contactoEmergencia?.parentesco || 'Madre',
        esApoderadoPrincipal: apodPersona?.esApoderadoPrincipal !== undefined ? apodPersona.esApoderadoPrincipal : true,
        viveConEstudiante: apodPersona?.viveConEstudiante !== undefined ? apodPersona.viveConEstudiante : true,
        apoderadoEstado: 'ACTIVO',
        mostrarApoderado: isMinor || isNNEE || Boolean(apodPersona) || Boolean(estudiante.contactoEmergencia),
      });
    }
  }, [estudiante, persona, personas, isOpen]);

  const handleApoderadoDniChange = (dniVal: string) => {
    setFormData(prev => {
      const updated = { ...prev, apoderadoDni: dniVal };
      if (dniVal.length >= 8) {
        const matched = personas.find(p => p.numeroDocumento === dniVal.trim());
        if (matched) {
          updated.apoderadoNombres = `${matched.apellidoPaterno || ''} ${matched.apellidoMaterno || ''} ${matched.nombres || ''}`.trim();
          if (matched.telefono) updated.apoderadoTelefono = matched.telefono;
          if (matched.parentesco) updated.apoderadoParentesco = matched.parentesco;
        }
      }
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Update Persona
    await updatePersona({
      ...persona,
      tipoDocumento: formData.tipoDocumento,
      numeroDocumento: formData.numeroDocumento,
      nombres: formData.nombres,
      apellidoPaterno: formData.apellidoPaterno,
      apellidoMaterno: formData.apellidoMaterno,
      fechaNacimiento: formData.fechaNacimiento,
      sexo: normalizeSexo(formData.sexo),
      genero: normalizeSexo(formData.sexo),
      telefono: formData.telefono,
      correo: formData.correo,
      direccion: formData.direccion,
      nivelEducativo: formData.nivelEducativo,
      estadoCivil: formData.estadoCivil,
      cargaFamiliar: formData.cargaFamiliar,
      internetCasa: formData.internetCasa,
      equipoClasesVirtuales: formData.equipoClasesVirtuales,
      operadorTelefonico: formData.operadorTelefonico,
      discapacidad: formData.discapacidad,
      tipoDiscapacidad: formData.tipoDiscapacidad,
      fotoUrl: formData.fotoUrl,
      observaciones: formData.observaciones,
      // synced student fields
      trabaja: formData.trabaja,
      puestoTrabajo: formData.puestoTrabajo,
      ieProcedencia: formData.ieProcedencia,
      lugarNacimiento: formData.lugarNacimiento,
      distritoNacimiento: formData.distritoNacimiento,
      provinciaNacimiento: formData.provinciaNacimiento,
      regionNacimiento: formData.regionNacimiento,
      paisNacimiento: formData.paisNacimiento,
      telefonoContacto: formData.telefonoContacto,
      lenguaOriginaria: formData.lenguaOriginaria,
    });

    // Update Estudiante
    await updateEstudiante({
      ...estudiante,
      telefonoContacto: formData.telefonoContacto,
      trabaja: formData.trabaja,
      puestoTrabajo: formData.puestoTrabajo,
      ieProcedencia: formData.ieProcedencia,
      lugarNacimiento: formData.lugarNacimiento,
      distritoNacimiento: formData.distritoNacimiento,
      provinciaNacimiento: formData.provinciaNacimiento,
      regionNacimiento: formData.regionNacimiento,
      paisNacimiento: formData.paisNacimiento,
      lenguaOriginaria: formData.lenguaOriginaria,
      estado: formData.estado,
      periodoIngreso: formData.periodoIngreso,
      anioIngreso: formData.anioIngreso,
    });

    // Update or link Apoderado if specified
    if (formData.apoderadoDni.trim()) {
      await vincularApoderado({
        estudianteId: estudiante.id,
        dni: formData.apoderadoDni.trim(),
        nombres: formData.apoderadoNombres.trim() || 'Apoderado / Tutor',
        telefono: formData.apoderadoTelefono.trim(),
        parentesco: formData.apoderadoParentesco,
        esApoderadoPrincipal: formData.esApoderadoPrincipal,
        viveConEstudiante: formData.viveConEstudiante,
        estado: formData.apoderadoEstado,
      });
    }

    onClose();
  };

  if (!estudiante || !persona) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Actualizar Ficha Integral del Estudiante"
      subtitle={`Ficha de Matrícula y Datos Personales: ${persona.nombres} ${persona.apellidoPaterno}`}
      maxWidth="4xl"
      actions={
        <>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="editar-estudiante-form"
            className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            Guardar Ficha Completa
          </button>
        </>
      }
    >
      <form id="editar-estudiante-form" onSubmit={handleSubmit} className="space-y-5 text-xs">
        {/* Section 1: Identificación y Filiación */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
          <h3 className="font-bold text-slate-900 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-sky-600" />
            1. Filiación e Identidad Personal
          </h3>

          {/* FOTO DE PERFIL / AVATAR */}
          <ImageUploadField
            label="Fotografía de Perfil (Columna foto_url)"
            sublabel="Foto para ficha de matrícula y carnet del estudiante."
            value={formData.fotoUrl || ''}
            onChange={(newFoto) => setFormData({ ...formData, fotoUrl: newFoto })}
            aspectRatio="square"
            previewSize="sm"
            placeholderText="https://ejemplo.com/fotos/16682317.jpg o enlace..."
            helperText="Puedes subir una imagen desde tu equipo o ingresar un enlace web."
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tipo de Documento</label>
              <select
                value={formData.tipoDocumento}
                onChange={(e) => setFormData({ ...formData, tipoDocumento: e.target.value as TipoDocumento })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
              >
                <option value="DNI">DNI (Documento Nacional)</option>
                <option value="CE">Carné de Extranjería (CE)</option>
                <option value="PASAPORTE">Pasaporte</option>
                <option value="PTP">Permiso Temporal (PTP)</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Número de Documento</label>
              <input
                type="text"
                required
                value={formData.numeroDocumento}
                onChange={(e) => setFormData({ ...formData, numeroDocumento: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nombres</label>
              <input
                type="text"
                required
                value={formData.nombres}
                onChange={(e) => setFormData({ ...formData, nombres: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Apellido Paterno</label>
              <input
                type="text"
                required
                value={formData.apellidoPaterno}
                onChange={(e) => setFormData({ ...formData, apellidoPaterno: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Apellido Materno</label>
              <input
                type="text"
                value={formData.apellidoMaterno}
                onChange={(e) => setFormData({ ...formData, apellidoMaterno: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Fecha de Nacimiento</label>
              <input
                type="date"
                value={formData.fechaNacimiento}
                onChange={(e) => setFormData({ ...formData, fechaNacimiento: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Sexo</label>
              <select
                value={normalizeSexo(formData.sexo)}
                onChange={(e) => setFormData({ ...formData, sexo: normalizeSexo(e.target.value) })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
              >
                <option value="H">Hombre (H)</option>
                <option value="M">Mujer (M)</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Estado Civil</label>
              <select
                value={formData.estadoCivil}
                onChange={(e) => setFormData({ ...formData, estadoCivil: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
              >
                <option value="Soltero(a)">Soltero(a)</option>
                <option value="Casado(a)">Casado(a)</option>
                <option value="Conviviente">Conviviente</option>
                <option value="Divorciado(a)">Divorciado(a)</option>
                <option value="Viudo(a)">Viudo(a)</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nivel Educativo Previo</label>
              <select
                value={formData.nivelEducativo}
                onChange={(e) => setFormData({ ...formData, nivelEducativo: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
              >
                <option value="Primaria Incompleta">Primaria Incompleta</option>
                <option value="Primaria Completa">Primaria Completa</option>
                <option value="Secundaria Incompleta">Secundaria Incompleta</option>
                <option value="Secundaria completa">Secundaria Completa</option>
                <option value="Superior Técnico">Superior Técnico</option>
                <option value="Superior Universitario">Superior Universitario</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Contacto y Residencia */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
          <h3 className="font-bold text-slate-900 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-sky-600" />
            2. Contacto y Residencia Actual
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Teléfono Celular (Principal)</label>
              <input
                type="tel"
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                placeholder="987654321"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Teléfono de Contacto (Directo/Familiar)</label>
              <input
                type="tel"
                value={formData.telefonoContacto}
                onChange={(e) => setFormData({ ...formData, telefonoContacto: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                placeholder="999888777"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Correo Electrónico</label>
              <input
                type="email"
                value={formData.correo}
                onChange={(e) => setFormData({ ...formData, correo: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                placeholder="estudiante@correo.com"
              />
            </div>
            <div className="sm:col-span-3">
              <label className="block font-semibold text-slate-700 mb-1">Dirección Domiciliaria Actual</label>
              <input
                type="text"
                value={formData.direccion}
                onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                placeholder="Av. Los Maestros 123, Urb. San Martín"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Nacimiento y Procedencia */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
          <h3 className="font-bold text-slate-900 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-sky-600" />
            3. Lugar de Nacimiento e I.E. de Procedencia
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">País de Nacimiento</label>
              <input
                type="text"
                value={formData.paisNacimiento}
                onChange={(e) => setFormData({ ...formData, paisNacimiento: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                placeholder="Perú"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Región / Departamento</label>
              <input
                type="text"
                value={formData.regionNacimiento}
                onChange={(e) => setFormData({ ...formData, regionNacimiento: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                placeholder="Lima"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Provincia</label>
              <input
                type="text"
                value={formData.provinciaNacimiento}
                onChange={(e) => setFormData({ ...formData, provinciaNacimiento: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                placeholder="Lima"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Distrito de Nacimiento</label>
              <input
                type="text"
                value={formData.distritoNacimiento}
                onChange={(e) => setFormData({ ...formData, distritoNacimiento: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                placeholder="San Martín de Porres"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Lengua Originaria / Materna</label>
              <input
                type="text"
                value={formData.lenguaOriginaria}
                onChange={(e) => setFormData({ ...formData, lenguaOriginaria: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                placeholder="Castellano, Quechua, Aimara..."
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">I.E. de Procedencia (Colegio)</label>
              <input
                type="text"
                value={formData.ieProcedencia}
                onChange={(e) => setFormData({ ...formData, ieProcedencia: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                placeholder="I.E. N° 1088 La Florida"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Datos Laborales y Conectividad */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
          <h3 className="font-bold text-slate-900 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
            <Briefcase className="w-3.5 h-3.5 text-sky-600" />
            4. Situación Laboral y Conectividad Tecnológica
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">¿Actualmente trabaja?</label>
              <div className="flex gap-4 pt-1">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="trabaja"
                    checked={formData.trabaja === true}
                    onChange={() => setFormData({ ...formData, trabaja: true })}
                  />
                  <span>Sí</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="trabaja"
                    checked={formData.trabaja === false}
                    onChange={() => setFormData({ ...formData, trabaja: false, puestoTrabajo: '' })}
                  />
                  <span>No</span>
                </label>
              </div>
            </div>

            {formData.trabaja && (
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Puesto u Ocupación</label>
                <input
                  type="text"
                  value={formData.puestoTrabajo}
                  onChange={(e) => setFormData({ ...formData, puestoTrabajo: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  placeholder="Auxiliar, Vendedor, Independiente..."
                />
              </div>
            )}

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Carga Familiar (Personas a cargo)</label>
              <input
                type="number"
                min={0}
                max={20}
                value={formData.cargaFamiliar}
                onChange={(e) => setFormData({ ...formData, cargaFamiliar: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">¿Tiene Internet en Casa?</label>
              <div className="flex gap-4 pt-1">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="internetCasa"
                    checked={formData.internetCasa === true}
                    onChange={() => setFormData({ ...formData, internetCasa: true })}
                  />
                  <span>Sí</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
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

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Dispositivo para Clases Virtuales</label>
              <select
                value={formData.equipoClasesVirtuales}
                onChange={(e) => setFormData({ ...formData, equipoClasesVirtuales: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
              >
                <option value="">Seleccione equipo...</option>
                <option value="Laptop">Laptop personal</option>
                <option value="Computadora de escritorio (PC)">Computadora de escritorio (PC)</option>
                <option value="Teléfono Smartphone">Teléfono Smartphone</option>
                <option value="Tablet">Tablet</option>
                <option value="No dispone">No dispone de equipo</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Operador Telefónico Principal</label>
              <select
                value={formData.operadorTelefonico}
                onChange={(e) => setFormData({ ...formData, operadorTelefonico: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
              >
                <option value="">-- Seleccionar operador --</option>
                {OPERADORES_TELEFONICOS.map((op) => (
                  <option key={op} value={op}>{op}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Section 5: Inclusión, Salud y Estado Académico */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
          <h3 className="font-bold text-slate-900 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
            <HeartHandshake className="w-3.5 h-3.5 text-sky-600" />
            5. Inclusión, Salud y Estado Académico
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">¿Presenta alguna Discapacidad?</label>
              <div className="flex gap-4 pt-1">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="discapacidad"
                    checked={formData.discapacidad === true}
                    onChange={() => setFormData({
                      ...formData,
                      discapacidad: true,
                      tipoDiscapacidad: formData.tipoDiscapacidad || 'Otra discapacidad'
                    })}
                  />
                  <span>Sí</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="discapacidad"
                    checked={formData.discapacidad === false}
                    onChange={() => setFormData({ ...formData, discapacidad: false, tipoDiscapacidad: '' })}
                  />
                  <span>No</span>
                </label>
              </div>
            </div>

            {formData.discapacidad && (
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tipo de Discapacidad</label>
                <select
                  value={formData.tipoDiscapacidad}
                  onChange={(e) => setFormData({ ...formData, tipoDiscapacidad: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                >
                  <option value="">-- Seleccionar tipo --</option>
                  {TIPOS_DISCAPACIDAD.map((tipo) => (
                    <option key={tipo} value={tipo}>{tipo}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Condición / Estado del Alumno</label>
              <select
                value={formData.estado}
                onChange={(e) => setFormData({ ...formData, estado: e.target.value as any })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
              >
                <option value="Regular">Regular</option>
                <option value="Reserva">Reserva de Matrícula</option>
                <option value="Retirado">Retirado</option>
                <option value="Egresado">Egresado</option>
                <option value="Titulado">Titulado</option>
                <option value="Trasladado">Trasladado</option>
              </select>
            </div>

            <div className="sm:col-span-3">
              <label className="block font-semibold text-slate-700 mb-1">Observaciones / Anotaciones Institucionales</label>
              <textarea
                rows={2}
                value={formData.observaciones}
                onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                placeholder="Anotaciones sobre matrícula, exoneraciones, requerimientos..."
              />
            </div>
          </div>
        </div>

        {/* Section 6: Datos de Apoderado / Tutor Legal */}
        <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-purple-950 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-purple-700" />
              6. Datos de Apoderado / Tutor Legal (Menor de Edad / NNEE)
            </h3>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, mostrarApoderado: !formData.mostrarApoderado })}
              className="text-[11px] text-purple-700 font-semibold hover:underline"
            >
              {formData.mostrarApoderado ? 'Ocultar campos' : 'Mostrar / Modificar datos'}
            </button>
          </div>

          {formData.mostrarApoderado && (
            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-purple-900 mb-1">DNI del Apoderado</label>
                  <input
                    type="text"
                    value={formData.apoderadoDni}
                    onChange={(e) => handleApoderadoDniChange(e.target.value)}
                    placeholder="8 dígitos"
                    className="w-full px-3 py-2 bg-white border border-purple-200 rounded-lg text-xs font-mono focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-purple-900 mb-1">Nombres y Apellidos Completos</label>
                  <input
                    type="text"
                    value={formData.apoderadoNombres}
                    onChange={(e) => setFormData({ ...formData, apoderadoNombres: e.target.value })}
                    placeholder="Nombres y apellidos"
                    className="w-full px-3 py-2 bg-white border border-purple-200 rounded-lg text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-purple-900 mb-1">Teléfono / Celular</label>
                  <input
                    type="text"
                    value={formData.apoderadoTelefono}
                    onChange={(e) => setFormData({ ...formData, apoderadoTelefono: e.target.value })}
                    placeholder="987654321"
                    className="w-full px-3 py-2 bg-white border border-purple-200 rounded-lg text-xs font-mono focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-purple-900 mb-1">Parentesco</label>
                  <select
                    value={formData.apoderadoParentesco}
                    onChange={(e) => setFormData({ ...formData, apoderadoParentesco: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-purple-200 rounded-lg text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  >
                    <option value="Madre">Madre</option>
                    <option value="Padre">Padre</option>
                    <option value="Tutor(a) Legal">Tutor(a) Legal</option>
                    <option value="Abuelo(a)">Abuelo(a)</option>
                    <option value="Hermano(a)">Hermano(a)</option>
                    <option value="Tío(a)">Tío(a)</option>
                    <option value="Apoderado(a)">Apoderado(a)</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-purple-900 mb-1">Estado</label>
                  <select
                    value={formData.apoderadoEstado}
                    onChange={(e) => setFormData({ ...formData, apoderadoEstado: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-purple-200 rounded-lg text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  >
                    <option value="ACTIVO">ACTIVO</option>
                    <option value="INACTIVO">INACTIVO</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <label className="flex items-center gap-2.5 p-2 bg-white/80 border border-purple-200/80 rounded-xl cursor-pointer hover:bg-white transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.esApoderadoPrincipal}
                    onChange={(e) => setFormData({ ...formData, esApoderadoPrincipal: e.target.checked })}
                    className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                  />
                  <div>
                    <span className="font-bold text-purple-950 block text-[11px]">Es Apoderado Principal</span>
                    <span className="text-[10px] text-purple-700/80 block">Contacto directo y responsable legal prioritario</span>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 p-2 bg-white/80 border border-purple-200/80 rounded-xl cursor-pointer hover:bg-white transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.viveConEstudiante}
                    onChange={(e) => setFormData({ ...formData, viveConEstudiante: e.target.checked })}
                    className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                  />
                  <div>
                    <span className="font-bold text-purple-950 block text-[11px]">Vive con el Estudiante</span>
                    <span className="text-[10px] text-purple-700/80 block">Comparte el mismo domicilio de residencia</span>
                  </div>
                </label>
              </div>
            </div>
          )}
        </div>
      </form>
    </Modal>
  );
};
