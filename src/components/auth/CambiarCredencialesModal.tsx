import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';
import { UsuarioSistema } from '../../types';
import { KeyRound, User, Lock, Eye, EyeOff, ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react';

interface CambiarCredencialesModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUser?: UsuarioSistema;
}

export const CambiarCredencialesModal: React.FC<CambiarCredencialesModalProps> = ({
  isOpen,
  onClose,
  targetUser,
}) => {
  const { currentUser, refreshData, addToast } = useApp();
  const activeUser = targetUser || currentUser;

  const [username, setUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen && activeUser) {
      setUsername(activeUser.username || '');
      setNewPassword('');
      setConfirmPassword('');
      setError(null);
      setSuccess(false);
    }
  }, [isOpen, activeUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      setError('El nombre de usuario no puede estar vacío.');
      return;
    }

    if (newPassword && newPassword.length < 4) {
      setError('La nueva contraseña debe tener al menos 4 caracteres.');
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden. Verifíquelas e intente nuevamente.');
      return;
    }

    if (trimmedUsername === activeUser.username && !newPassword) {
      setError('No ha realizado ninguna modificación en el usuario ni en la contraseña.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/admin/usuarios/${activeUser.id}/credenciales`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: trimmedUsername,
          password: newPassword ? newPassword : undefined,
          operatorUserId: currentUser.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al actualizar las credenciales');
      }

      setSuccess(true);
      addToast(
        'Credenciales Actualizadas',
        `Las credenciales de ${activeUser.nombreCompleto} fueron actualizadas con éxito. Evento registrado en Auditoría.`,
        'success'
      );

      await refreshData();

      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error inesperado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Cambiar Usuario y Contraseña"
      subtitle="Actualización segura de credenciales de acceso institucional"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* User Card */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex items-center gap-3">
          {activeUser.avatar ? (
            <img
              src={activeUser.avatar}
              alt={activeUser.nombreCompleto}
              className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-sm shrink-0">
              {activeUser.nombreCompleto.charAt(0)}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold text-slate-900 truncate">
              {activeUser.nombreCompleto}
            </div>
            <div className="text-[11px] text-slate-500 font-mono truncate">
              Usuario actual: <span className="font-bold text-slate-700">{activeUser.username || activeUser.email}</span>
            </div>
            <div className="mt-0.5 inline-block">
              <span className="px-1.5 py-0.2 bg-blue-600 text-white rounded text-[9px] font-bold uppercase tracking-wider">
                {activeUser.rolNombre || activeUser.rol}
              </span>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-rose-700 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-emerald-700 text-xs">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>¡Credenciales actualizadas y auditadas exitosamente!</span>
          </div>
        )}

        {/* Username Field */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Nombre de Usuario
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Ej. 16682317 o nombre.apellido"
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
          <p className="text-[10px] text-slate-400 mt-1">
            Por defecto es su número de DNI. Puede personalizarlo con letras o números.
          </p>
        </div>

        {/* New Password Field */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Nueva Contraseña
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Dejar en blanco si no desea cambiarla"
              className="w-full pl-9 pr-9 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
            >
              {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">
            Mínimo 4 caracteres. Inicialmente su contraseña es su número de DNI.
          </p>
        </div>

        {/* Confirm Password Field */}
        {newPassword && (
          <div className="animate-fadeIn">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Confirmar Nueva Contraseña
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required={!!newPassword}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita la nueva contraseña"
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>
        )}

        {/* Security Audit Notice */}
        <div className="p-3 bg-amber-50/70 border border-amber-200/70 rounded-xl text-[11px] text-amber-800 flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="leading-tight">
            <strong>Control Institucional:</strong> Cada modificación queda registrada en la tabla de <strong>Auditoría</strong> del sistema con fecha, dirección IP y credenciales modificadas para total supervisión del Administrador y Dirección.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading || success}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <KeyRound className="w-3.5 h-3.5" />
                Actualizar Credenciales
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};
