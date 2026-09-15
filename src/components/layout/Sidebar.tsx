import { LayoutDashboard, Users, Shield, Key, Layers, Package, History } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { cn } from '../../lib/utils';

const menuItems = [
  { icon: LayoutDashboard, label: 'Resumen', path: '/' },
  { icon: Users, label: 'Usuarios', path: '/usuarios' },
  { icon: Shield, label: 'Roles', path: '/roles' },
  { icon: Key, label: 'Accesos', path: '/accesos' },
  { icon: Layers, label: 'Cobertura', path: '/cobertura' },
  { icon: Package, label: 'Productos', path: '/productos' },
  { icon: History, label: 'Auditoría', path: '/auditoria' },
];

export function Sidebar() {
  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="w-24 bg-white border-r border-slate-200 flex flex-col items-center py-6 shrink-0 h-full overflow-y-auto hidden md:flex">
        <nav className="flex flex-col gap-2 w-full px-2">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => cn(
                "flex flex-col items-center justify-center p-3 rounded-xl transition-colors duration-200 gap-2",
                isActive 
                  ? "bg-brand-primary/10 text-brand-primary font-semibold" 
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              <item.icon className="w-6 h-6" />
              <span className="text-[10px] tracking-wide">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Mobile Bottom Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-30 flex items-center justify-around py-2 px-1 shadow-lg">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => cn(
              "flex flex-col items-center justify-center p-1.5 rounded-lg transition-colors gap-1 flex-1",
              isActive 
                ? "text-brand-primary font-bold" 
                : "text-slate-400 hover:text-slate-700"
            )}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-[9px] truncate max-w-[50px]">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </>
  );
}
