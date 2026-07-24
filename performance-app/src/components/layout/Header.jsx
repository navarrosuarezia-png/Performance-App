import { Activity, Bell, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

export function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="glass sticky top-0 z-50 px-4 md:px-6 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">Performance</h1>
              <p className="text-xs text-slate-400 -mt-0.5 hidden sm:block">Control de Producción</p>
            </div>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {[
              { to: '/registro', label: 'Registro' },
              { to: '/incidencias', label: 'Incidencias' },
            ].map(item => (
              <a 
                key={item.to}
                href={item.to}
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-surface-2 transition-all"
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>

        {/* User info */}
        <div className="flex items-center gap-3">
          <button className="relative p-2 rounded-lg hover:bg-surface-2 transition-colors">
            <Bell className="w-5 h-5 text-slate-400" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-brand-500 rounded-full animate-pulse-glow" />
          </button>

          {user && (
            <div className="flex items-center gap-2">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium">{user.full_name}</p>
                <p className="text-xs text-slate-400 capitalize">{user.role}</p>
              </div>
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
                user.role === 'admin' ? 'bg-brand-600' :
                user.role === 'supervisor' ? 'bg-purple-600' : 'bg-emerald-600'
              )}>
                {user.full_name?.charAt(0)?.toUpperCase()}
              </div>
              <button
                onClick={logout}
                className="p-2 rounded-lg hover:bg-surface-2 transition-colors text-slate-400 hover:text-red-400"
                title="Cerrar sesión"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
