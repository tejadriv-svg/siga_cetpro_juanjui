import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Lock,
  User,
  ShieldCheck,
  GraduationCap,
  Award,
  BookOpen,
  Wallet,
  ArrowRight,
  Eye,
  EyeOff,
  Sparkles,
  Building2,
  AlertCircle,
  KeyRound,
} from 'lucide-react';
import { RolSistema } from '../../types';

export const LoginView: React.FC = () => {
  const { institucion, login } = useApp();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!username.trim()) {
      setErrorMessage('Por favor ingresa tu DNI o nombre de usuario.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await login(username.trim(), password);
      if (!res.success) {
        setErrorMessage(res.message || 'Credenciales incorrectas. Verifica tu DNI/usuario y contraseña.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al comunicarse con el servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 flex flex-col justify-between p-4 sm:p-6 lg:p-8 relative overflow-hidden selection:bg-blue-600 selection:text-white">
      {/* Decorative ambient background glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-600/15 blur-[140px] pointer-events-none" />

      {/* Top Header Bar */}
      <header className="relative z-10 flex items-center justify-between max-w-6xl mx-auto w-full pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 p-1 flex items-center justify-center shadow-lg overflow-hidden">
            {institucion.logoUrl && !institucion.logoUrl.includes('\\') ? (
              <img
                src={institucion.logoUrl}
                alt="Logo CETPRO Juanjuí"
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-black text-sm">
                CJ
              </div>
            )}
          </div>
          <div>
            <h1 className="text-white font-bold text-sm sm:text-base tracking-tight leading-tight">
              CETPRO Juanjuí
            </h1>
            <p className="text-slate-400 text-xs font-medium">
              DRE San Martín • UGEL Mariscal Cáceres • Cód. 0533836
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[11px] font-medium flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Sistema Operativo
          </span>
          <span className="px-2.5 py-1 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30 text-[11px] font-mono">
            RVM 188-2020-MINEDU
          </span>
        </div>
      </header>

      {/* Main Center Content: Split Grid */}
      <main className="relative z-10 max-w-6xl mx-auto w-full my-auto py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Col: Institutional Welcome & Direct Role Access */}
        <div className="lg:col-span-7 space-y-6 text-white">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs text-blue-300 font-medium">
              <Building2 className="w-3.5 h-3.5" />
              <span>Plataforma Oficial de Gestión Académica y Administrativa</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Bienvenido al <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-300">SIGA</span> CETPRO Juanjuí
            </h2>
            <p className="text-slate-300 text-sm sm:text-base max-w-xl leading-relaxed">
              Gestione nóminas de matrícula, evaluación por competencias, emisión de certificados oficiales con código QR y control de caja institucional.
            </p>
          </div>

          {/* Institutional Highlights and Security Notice */}
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm">
                <div className="flex items-center gap-2.5 text-blue-300 font-semibold text-xs mb-1">
                  <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>Acceso Institucional Seguro</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Autenticación obligatoria con DNI y clave personal para cada directivo, docente y estudiante.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm">
                <div className="flex items-center gap-2.5 text-indigo-300 font-semibold text-xs mb-1">
                  <BookOpen className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>R.V.M. 188-2020-MINEDU</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Nóminas oficiales, evaluación por competencias C1, C2, C3 y actas con sellado digital.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm">
                <div className="flex items-center gap-2.5 text-emerald-300 font-semibold text-xs mb-1">
                  <Award className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Certificación y Titulación QR</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Emisión de certificados modulares, de estudios y títulos con código QR verificable a nivel nacional.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm">
                <div className="flex items-center gap-2.5 text-cyan-300 font-semibold text-xs mb-1">
                  <Wallet className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Caja y Trazabilidad</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Control de ingresos TUPA, emisión de recibos y registro de auditoría de cada operación.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-blue-950/60 border border-blue-500/20 flex items-start gap-2.5 text-xs text-blue-200">
              <AlertCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <span>
                <strong>Atención:</strong> Si olvidó su contraseña o es nuevo usuario, solicite la habilitación de su cuenta a la <strong>Dirección o Secretaría Académica</strong>.
              </span>
            </div>
          </div>
        </div>

        {/* Right Col: Standard Credential Form */}
        <div className="lg:col-span-5 w-full">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/90 p-6 sm:p-8 backdrop-blur-xl">
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center mx-auto mb-3 shadow-xs">
                <KeyRound className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                Iniciar Sesión con Credenciales
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Ingresa con tu DNI o usuario y contraseña asignada
              </p>
            </div>

            {errorMessage && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-fadeIn">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span className="leading-snug">{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  DNI o Nombre de Usuario
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Ej: 16682317"
                    className="w-full pl-9.5 pr-3 py-2.5 text-xs text-slate-900 placeholder-slate-400 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                    autoComplete="username"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Contraseña
                  </label>
                  <span className="text-[10px] text-slate-400">
                    Por defecto su DNI
                  </span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9.5 pr-10 py-2.5 text-xs text-slate-900 placeholder-slate-400 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Verificando...</span>
                  </>
                ) : (
                  <>
                    <span>Acceder al Sistema</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-5 pt-4 border-t border-slate-100 text-center">
              <p className="text-[11px] text-slate-500">
                ¿Problemas para acceder? Comunícate con la{' '}
                <span className="font-semibold text-slate-700">Dirección o Secretaría Académica</span>.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Institutional Footer */}
      <footer className="relative z-10 max-w-6xl mx-auto w-full pt-4 border-t border-white/10 text-center sm:flex sm:items-center sm:justify-between text-xs text-slate-400">
        <div>
          <span className="font-semibold text-slate-300">{institucion.nombre || 'CETPRO Juanjuí'}</span> • {institucion.direccion || 'Jr. Huallaga N° 311'}, {institucion.distrito || 'Juanjuí'}, {institucion.region || 'San Martín'}
        </div>
        <div className="mt-2 sm:mt-0 font-mono text-[11px] text-slate-400">
          SIGA v2.5.0 • Licenciamiento Institucional MINEDU
        </div>
      </footer>
    </div>
  );
};
