import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { ShieldCheck, ClipboardList, Cpu, Scale, UserCheck } from 'lucide-react';

const tabs = [
  { label: 'Catálogo de Permisos', path: '/accesos/catalogo', icon: ShieldCheck },
  { label: 'Solicitudes', path: '/accesos/solicitudes', icon: ClipboardList },
  { label: 'Evaluador de Políticas', path: '/accesos/evaluador', icon: Cpu },
  { label: 'Gobernanza y SoD', path: '/accesos/gobernanza', icon: Scale },
  { label: 'Revisión de Accesos', path: '/accesos/revision', icon: UserCheck },
];

export function AccesosLayout() {
  const location = useLocation();

  return (
    <div className="space-y-6 max-w-7xl mx-auto flex flex-col min-h-full pb-8">
      <header>
        <h2 className="text-2xl md:text-3xl font-bold text-slate-900">Accesos y Políticas</h2>
        <p className="text-slate-500 mt-1 text-sm">Gestión del inventario de acciones y revisión de impacto</p>
      </header>

      <div className="border-b border-slate-200">
        <nav className="flex space-x-8 overflow-x-auto" aria-label="Tabs">
          {tabs.map((tab) => {
            const isActive = location.pathname.startsWith(tab.path);
            return (
              <NavLink
                key={tab.path}
                to={tab.path}
                className={cn(
                  "group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap",
                  isActive
                    ? "border-brand-primary text-brand-primary"
                    : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                )}
              >
                <tab.icon className={cn(
                  "mr-2 h-5 w-5",
                  isActive ? "text-brand-primary" : "text-slate-400 group-hover:text-slate-500"
                )} />
                {tab.label}
              </NavLink>
            )
          })}
        </nav>
      </div>

      <div className="flex-1 w-full">
        <Outlet />
      </div>
    </div>
  );
}
