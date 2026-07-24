import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { profilesApi } from '@/lib/api';
import { Activity, Mail, Lock, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const [devUsers, setDevUsers] = useState([]);

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const data = await profilesApi.getAll();
        setDevUsers(data);
      } catch (err) {
        console.error('Failed to fetch profiles:', err);
      }
    };
    fetchProfiles();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await profilesApi.login(email, password);
      await login(user);
      navigate('/registro');
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (user) => {
    setLoading(true);
    await login(user);
    navigate('/registro');
  };

  return (
    <div className="min-h-screen bg-surface-0 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-brand-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-500/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 mb-4 shadow-xl shadow-brand-500/20">
            <Activity className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Performance App</h1>
          <p className="text-slate-400 mt-1">Control de Producción Envasado</p>
        </div>

        {/* Login Form */}
        <div className="glass rounded-2xl p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  className="w-full rounded-xl bg-surface-2 border border-slate-700 pl-10 pr-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl bg-surface-2 border border-slate-700 pl-10 pr-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500 transition-all"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white font-semibold py-3 rounded-xl transition-all duration-200 active:scale-[0.98] shadow-lg shadow-brand-500/25 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Iniciar Sesión
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Quick login for dev (Admin only) */}
        {devUsers.filter(u => u.role === 'admin').length > 0 && (
          <div className="mt-6">
            <p className="text-xs text-slate-500 text-center mb-3 uppercase tracking-wider">Acceso rápido (Administrador)</p>
            <div className="flex justify-center">
              {devUsers.filter(u => u.role === 'admin').map((user) => (
                <button
                  key={user.email}
                  onClick={() => quickLogin(user)}
                  className="glass-light w-full rounded-xl px-4 py-2.5 text-center hover:bg-surface-2 transition-all duration-200 group"
                >
                  <p className="text-xs font-medium text-slate-300 group-hover:text-white transition-colors truncate">
                    {user.full_name}
                  </p>
                  <p className="text-[10px] text-slate-500 capitalize">{user.role}</p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
