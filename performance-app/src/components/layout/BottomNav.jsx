import { NavLink } from 'react-router-dom';
import { ClipboardList, LayoutDashboard, AlertTriangle, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/registro', icon: ClipboardList, label: 'Registro' },
  { to: '/incidencias', icon: AlertTriangle, label: 'Incidencias' },
];

export function BottomNav() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass border-t border-slate-800">
      <div className="flex items-center justify-around py-2 px-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200',
                isActive
                  ? 'text-brand-400 bg-brand-500/10'
                  : 'text-slate-500 hover:text-slate-300'
              )
            }
          >
            <item.icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
