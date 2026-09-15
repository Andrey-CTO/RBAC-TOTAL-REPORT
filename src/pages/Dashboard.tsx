import { useAppContext } from '../context/AppContext';
import { useStore } from '../lib/store';
import { Badge, Button } from '../components/ui/Shared';
import { Link } from 'react-router-dom';
import { 
  Users, 
  Shield, 
  Cpu, 
  ArrowRight, 
  Activity, 
  Package, 
  Layers, 
  Key, 
  Lock,
  Sparkles
} from 'lucide-react';
import { ReactNode } from 'react';
import { motion } from 'motion/react';

export function Dashboard() {
  const { selectedEntity } = useAppContext();
  const { users, roles, auditLogs, entities, permissions } = useStore();
  
  const currentEntityName = entities.find(e => e.id === selectedEntity)?.name || selectedEntity;

  // 1. Métricas de Usuarios (Sección 44)
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.status === 'ACTIVE').length;
  const inactiveUsers = users.filter(u => u.status !== 'ACTIVE').length;
  const usersWithoutRoles = users.filter(u => !u.roles || u.roles.length === 0).length;

  // 2. Métricas de Roles (Sección 44)
  const totalRoles = roles.length;
  const publishedRoles = roles.filter(r => r.status === 'PUBLISHED').length;
  const draftRoles = roles.filter(r => r.status !== 'PUBLISHED').length;
  const rolesWithoutUsers = roles.filter(r => {
    const assigned = users.filter(u => u.roles && u.roles.includes(r.id));
    return assigned.length === 0;
  }).length;

  // 3. Métricas de Productos (Sección 44)
  const productUserCounts = {
    TOTAL_REPORT: users.filter(u => u.products.includes('TOTAL_REPORT')).length,
    TOTAL_SUPERVISION: users.filter(u => u.products.includes('TOTAL_SUPERVISION')).length,
    TAX_REPORT: users.filter(u => u.products.includes('TAX_REPORT')).length,
    TOTALIA: users.filter(u => u.products.includes('TOTALIA')).length,
    SECURITY_RBAC: users.filter(u => u.products.includes('SECURITY_RBAC')).length,
  };

  // 4. Métricas de Permisos y Gobernanza (Sección 44)
  const assignedActionsTotal = roles.reduce((acc, r) => acc + (r.permissions?.length || 0), 0);
  const globalScopeCount = roles.reduce((acc, r) => {
    return acc + (r.permissions || []).filter(p => p.formatScope?.mode === 'ALL').length;
  }, 0);
  const restrictedScopeCount = roles.reduce((acc, r) => {
    return acc + (r.permissions || []).filter(p => p.formatScope?.mode === 'SELECTED').length;
  }, 0);
  const adminUsersCount = users.filter(u => u.products.includes('SECURITY_RBAC') || (u.roles && u.roles.includes('ROL-ID-ADMIN'))).length;

  const recentLogs = auditLogs.slice(0, 6);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="space-y-8 max-w-7xl mx-auto pb-10"
    >
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Resumen de Seguridad RBAC</h2>
          <p className="text-slate-500 mt-1 text-xs md:text-sm">
            Gobernanza centralizada de identidades, roles, privilegios y cobertura del ecosistema TÓTAL
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link to="/cobertura">
            <Button variant="secondary" className="gap-2 text-xs font-semibold text-slate-700 hover:border-slate-300">
              <Layers className="w-4 h-4 text-brand-primary" /> Cobertura Funcional
            </Button>
          </Link>
          <Link to="/accesos/evaluador">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button className="gap-2 bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-bold shadow-xs">
                <Cpu className="w-4 h-4" /> Evaluador de Políticas
              </Button>
            </motion.div>
          </Link>
        </div>
      </header>
      
      {/* 4 Tarjetas Métricas Principales de Seguridad con Animación Stagger */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Link to="/usuarios" className="block group">
          <DashboardCard 
            index={0}
            title="Usuarios" 
            value={totalUsers.toString()} 
            subtitle={`${activeUsers} activos • ${inactiveUsers} inactivos • ${usersWithoutRoles} sin rol`} 
            icon={<Users className="w-5 h-5 text-brand-primary" />}
            tag={usersWithoutRoles > 0 ? `${usersWithoutRoles} sin rol` : undefined}
            tagVariant="warning"
          />
        </Link>

        <Link to="/roles" className="block group">
          <DashboardCard 
            index={1}
            title="Roles" 
            value={totalRoles.toString()} 
            subtitle={`${publishedRoles} publicados • ${draftRoles} borradores • ${rolesWithoutUsers} sin usuarios`} 
            icon={<Shield className="w-5 h-5 text-emerald-600" />}
            tag={rolesWithoutUsers > 0 ? `${rolesWithoutUsers} sin asignar` : undefined}
            tagVariant="neutral"
          />
        </Link>

        <Link to="/productos" className="block group">
          <DashboardCard 
            index={2}
            title="Productos Gobernados" 
            value="5" 
            subtitle="TÓTAL REPORT, SUPERVISIÓN, TAX, TOTALiA, RBAC" 
            icon={<Package className="w-5 h-5 text-blue-600" />}
          />
        </Link>
        
        <Link to="/cobertura" className="block group">
          <DashboardCard 
            index={3}
            title="Acciones en Catálogo" 
            value={permissions.length.toString()} 
            subtitle={`${globalScopeCount} alcances globales • ${restrictedScopeCount} restringidos`} 
            icon={<Key className="w-5 h-5 text-purple-600" />}
          />
        </Link>
      </div>

      {/* Grid de Cobertura por Producto */}
      <motion.div 
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.35 }}
        className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-brand-primary" />
              Distribución de Usuarios por Producto
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Identidades con acceso habilitado a cada producto del ecosistema
            </p>
          </div>
          <Link to="/productos" className="text-xs text-brand-primary hover:underline font-semibold flex items-center gap-1 group">
            <span>Ver cobertura detallada</span> 
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
          {[
            { label: 'TÓTAL REPORT®', count: productUserCounts.TOTAL_REPORT, desc: 'usuarios habilitados', bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-900' },
            { label: 'TÓTAL SUPERVISIÓN®', count: productUserCounts.TOTAL_SUPERVISION, desc: 'usuarios habilitados', bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-900' },
            { label: 'TAX REPORT', count: productUserCounts.TAX_REPORT, desc: 'usuarios habilitados', bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-900' },
            { label: 'TOTALiA', count: productUserCounts.TOTALIA, desc: 'usuarios habilitados', bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-900' },
            { label: 'Seguridad / RBAC', count: productUserCounts.SECURITY_RBAC, desc: 'administradores', bg: 'bg-blue-50/60', border: 'border-blue-200', text: 'text-brand-primary' },
          ].map((item, idx) => (
            <motion.div 
              key={item.label}
              whileHover={{ y: -2, transition: { duration: 0.15 } }}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15 + idx * 0.04 }}
              className={`p-4 rounded-xl border ${item.bg} ${item.border} transition-shadow hover:shadow-xs`}
            >
              <span className={`text-xs font-bold block uppercase tracking-wider ${item.text === 'text-brand-primary' ? 'text-brand-primary' : 'text-slate-500'}`}>
                {item.label}
              </span>
              <span className={`text-2xl font-black block mt-1 ${item.text}`}>
                {item.count}
              </span>
              <span className="text-[11px] text-slate-400 font-medium">{item.desc}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Grid Inferior: Auditoría y Controles de Seguridad */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Izquierda: Registro de Auditoría Reciente */}
        <motion.div 
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.35 }}
          className="lg:col-span-2 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-slate-500" />
              Auditoría Reciente de Modificaciones de Seguridad
            </h3>
            <span className="text-xs text-slate-400">Trazabilidad inmutable</span>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="divide-y divide-slate-100">
              {recentLogs.map((log, idx) => {
                const isSuccess = log.status === 'SUCCESS';
                return (
                  <motion.div 
                    key={log.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.25 + idx * 0.03 }}
                    className="p-4 flex items-center justify-between hover:bg-slate-50/80 transition-colors text-xs"
                  >
                    <div className="pr-4 space-y-1">
                      <p className="font-semibold text-slate-900">
                        {log.action} <span className="font-normal text-slate-500">— {log.targetResource} {log.targetId ? `(${log.targetId})` : ''}</span>
                      </p>
                      <p className="text-slate-500 truncate max-w-md">{log.details}</p>
                      <p className="text-[11px] text-slate-400">
                        Por <strong>{log.actorName}</strong> • {new Date(log.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <Badge variant={isSuccess ? 'success' : 'danger'} className="text-[10px]">
                      {log.status}
                    </Badge>
                  </motion.div>
                );
              })}
              {recentLogs.length === 0 && (
                <div className="p-8 text-center text-slate-400 text-sm">
                  Sin registros de auditoría registrados.
                </div>
              )}
            </div>
            <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
              <Link to="/auditoria" className="text-xs text-brand-primary hover:text-brand-primary-hover font-semibold inline-flex items-center gap-1.5 group">
                <span>Ver toda la bitácora de auditoría</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Derecha: Indicadores de Gobernanza y Permisos */}
        <motion.div 
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.35 }}
          className="space-y-4"
        >
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Lock className="w-5 h-5 text-slate-500" />
            Gobernanza y Autoprotección
          </h3>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                Protección Activa
              </span>
              <h4 className="text-sm font-bold text-slate-900 mt-2">Gobernanza de Administración</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                El sistema resguarda a los {adminUsersCount} administradores de Seguridad / RBAC activos contra eliminación accidental o bloqueo del ecosistema.
              </p>
            </div>

            <div className="space-y-2.5 pt-2 border-t border-slate-100 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Acciones configuradas en roles</span>
                <span className="font-bold text-slate-900">{assignedActionsTotal}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Alcances globales (Todos los formatos)</span>
                <span className="font-bold text-emerald-600">{globalScopeCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Alcances específicos por formato</span>
                <span className="font-bold text-amber-600">{restrictedScopeCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Catálogo canónico normalizado</span>
                <span className="font-bold text-brand-primary">{permissions.length} acciones</span>
              </div>
            </div>

            <div className="pt-2">
              <Link to="/accesos/evaluador">
                <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                  <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs py-2">
                    Abrir Evaluador de Políticas
                  </Button>
                </motion.div>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

function DashboardCard({
  index = 0,
  title, 
  value, 
  subtitle, 
  icon,
  tag,
  tagVariant = 'neutral'
}: {
  index?: number;
  title: string; 
  value: string; 
  subtitle: string; 
  icon: ReactNode;
  tag?: string;
  tagVariant?: 'neutral' | 'warning' | 'success';
}) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      whileHover={{ y: -3, transition: { duration: 0.18 } }}
      className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-all group-hover:border-brand-primary/40 h-full flex flex-col justify-between"
    >
      <div>
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">{title}</h3>
          <div className="p-2 bg-slate-50 group-hover:bg-brand-primary/5 rounded-lg border border-slate-100 transition-colors">
            {icon}
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <p className="text-3xl font-black text-slate-900 tracking-tight">{value}</p>
          {tag && (
            <Badge variant={tagVariant} className="text-[10px]">
              {tag}
            </Badge>
          )}
        </div>
      </div>
      <p className="text-xs text-slate-400 mt-3 pt-2 border-t border-slate-50">{subtitle}</p>
    </motion.div>
  );
}
