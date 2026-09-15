import { useState, useMemo } from 'react';
import { useStore } from '../../lib/store';
import { ProductCode } from '../../types/rbac';
import { Badge, Button } from '../../components/ui/Shared';
import { 
  Package, Users, Shield, Layers, ArrowRight, 
  CheckCircle2, Building2, Search, ExternalLink, ShieldCheck, FileSpreadsheet
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';

interface ProductInfo {
  code: ProductCode;
  name: string;
  category: string;
  description: string;
}

const PRODUCTS: ProductInfo[] = [
  {
    code: 'TOTAL_REPORT',
    name: 'TÓTAL REPORT®',
    category: 'Regulación & Transmisión',
    description: 'Generación, validación, firma y transmisión oficial de formatos y expedientes regulatorios.'
  },
  {
    code: 'TOTAL_SUPERVISION',
    name: 'TÓTAL SUPERVISIÓN®',
    category: 'Supervisión Continua',
    description: 'Monitoreo preventivo, trazabilidad multi-entidad y analítica de cumplimiento institucional.'
  },
  {
    code: 'TAX_REPORT',
    name: 'TAX REPORT',
    category: 'Información Tributaria',
    description: 'Gestión de información exógena, conciliación de medios magnéticos y liquidación DIAN.'
  },
  {
    code: 'TOTALIA',
    name: 'TOTALiA',
    category: 'Asistencia Inteligente',
    description: 'Asistencia regulatoria inteligente y gobernanza automatizada de procesos de reporte.'
  },
  {
    code: 'SECURITY_RBAC',
    name: 'Seguridad / RBAC',
    category: 'Gobierno de Identidades',
    description: 'Administración centralizada de identidades, roles, privilegios y auditoría inmutable.'
  }
];

export function ProductosView() {
  const store = useStore();
  const [selectedProductCode, setSelectedProductCode] = useState<ProductCode>('TOTAL_REPORT');
  const [searchTerm, setSearchTerm] = useState('');

  // Estadísticas consolidadas por producto calculadas en vivo
  const productsStats = useMemo(() => {
    return PRODUCTS.map(prod => {
      // 1. Usuarios con este producto habilitado
      const usersWithProd = store.users.filter(u => u.products && u.products.includes(prod.code));
      
      // 2. Roles con este producto habilitado
      const rolesWithProd = store.roles.filter(r => r.products && r.products.includes(prod.code));
      
      // 3. Permisos del catálogo para este producto
      const permsForProd = store.permissions.filter(p => p.product === prod.code);
      
      // 4. Funcionalidades únicas
      const functionalities = Array.from(new Set(permsForProd.map(p => p.functionality)));

      return {
        ...prod,
        usersCount: usersWithProd.length,
        users: usersWithProd,
        rolesCount: rolesWithProd.length,
        roles: rolesWithProd,
        functionalitiesCount: functionalities.length,
        functionalities,
        permissionsCount: permsForProd.length,
        permissions: permsForProd
      };
    });
  }, [store.users, store.roles, store.permissions]);

  const activeProduct = productsStats.find(p => p.code === selectedProductCode) || productsStats[0];

  // Filtrado de permisos para el producto activo
  const filteredActivePermissions = useMemo(() => {
    return activeProduct.permissions.filter(p => 
      p.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.functionality.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [activeProduct.permissions, searchTerm]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto h-full flex flex-col pb-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900">Cobertura de Productos</h2>
            <Badge variant="neutral" className="font-mono">
              5 Productos Gobernados
            </Badge>
          </div>
          <p className="text-slate-500 mt-1 text-sm">
            Supervisión del ecosistema: distribución de identidades, roles asignados y capacidades funcionales por producto
          </p>
        </div>
      </header>

      {/* Grid de Productos con Métricas en Vivo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 shrink-0">
        {productsStats.map(prod => {
          const isSelected = prod.code === selectedProductCode;

          return (
            <button
              key={prod.code}
              onClick={() => setSelectedProductCode(prod.code)}
              className={cn(
                "p-4 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col justify-between",
                isSelected 
                  ? "bg-white border-brand-primary ring-2 ring-brand-primary/20 shadow-sm" 
                  : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
              )}
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{prod.category}</span>
                  {isSelected && <span className="w-2 h-2 rounded-full bg-brand-primary animate-pulse" />}
                </div>
                <h3 className="font-bold text-slate-900 text-sm">{prod.name}</h3>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 text-xs">
                <div>
                  <span className="text-[11px] text-slate-400 block">Usuarios</span>
                  <span className="font-bold text-slate-800">{prod.usersCount}</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">Roles</span>
                  <span className="font-bold text-slate-800">{prod.rolesCount}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Detalle del Producto Activo */}
      <div className="flex-1 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
        {/* Banner Superior del Producto */}
        <div className="p-5 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-slate-900">{activeProduct.name}</h3>
              <Badge variant="neutral" className="text-xs">
                {activeProduct.category}
              </Badge>
            </div>
            <p className="text-slate-500 text-xs mt-1 max-w-2xl">
              {activeProduct.description}
            </p>
          </div>

          <div className="flex items-center gap-4 shrink-0 text-xs">
            <div className="text-right">
              <span className="text-slate-400 block text-[11px]">Acciones en Catálogo</span>
              <span className="font-bold text-slate-900 text-sm">{activeProduct.permissionsCount}</span>
            </div>
            <div className="text-right">
              <span className="text-slate-400 block text-[11px]">Funcionalidades</span>
              <span className="font-bold text-slate-900 text-sm">{activeProduct.functionalitiesCount}</span>
            </div>
          </div>
        </div>

        {/* Cuerpo Dividido en Secciones de Gobernanza */}
        <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna 1: Roles Asignados a este Producto */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-brand-primary" />
                Roles Habilitados ({activeProduct.rolesCount})
              </h4>
              <Link to="/roles/nuevo" className="text-xs text-brand-primary hover:underline font-semibold">
                + Nuevo Rol
              </Link>
            </div>

            <div className="space-y-2">
              {activeProduct.roles.map(role => {
                const assignedUsers = store.getUsersForRole(role.id);

                return (
                  <div key={role.id} className="p-3 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors bg-white">
                    <div className="flex items-center justify-between">
                      <Link to={`/roles/${role.id}`} className="font-bold text-sm text-slate-900 hover:text-brand-primary flex items-center gap-1">
                        {role.name}
                        <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                      </Link>
                      <Badge variant={role.status === 'PUBLISHED' ? 'success' : 'warning'} className="text-[10px]">
                        {role.status === 'PUBLISHED' ? 'Publicado' : 'Borrador'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
                      <span className="font-mono font-semibold">{role.code}</span>
                      <span>{assignedUsers.length} usuario(s)</span>
                    </div>
                  </div>
                );
              })}

              {activeProduct.roles.length === 0 && (
                <div className="p-4 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-lg">
                  Ningún rol tiene habilitado este producto actualmente.
                </div>
              )}
            </div>
          </div>

          {/* Columna 2: Usuarios con Acceso Directo */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-4 h-4 text-emerald-600" />
                Usuarios con Acceso ({activeProduct.usersCount})
              </h4>
              <Link to="/usuarios/nuevo" className="text-xs text-brand-primary hover:underline font-semibold">
                + Nuevo Usuario
              </Link>
            </div>

            <div className="space-y-2">
              {activeProduct.users.map(user => (
                <div key={user.id} className="p-3 rounded-lg border border-slate-200 hover:border-slate-300 transition-colors bg-white">
                  <div className="flex items-center justify-between">
                    <Link to={`/usuarios/${user.id}`} className="font-bold text-sm text-slate-900 hover:text-brand-primary flex items-center gap-1">
                      {user.name}
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                    </Link>
                    <Badge variant={user.status === 'ACTIVE' ? 'success' : 'neutral'} className="text-[10px]">
                      {user.status === 'ACTIVE' ? 'Activo' : user.status}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
                    <span className="font-mono">{user.identity}</span>
                    <span className="truncate max-w-[140px]">{(user.roles || []).length} rol(es) asignados</span>
                  </div>
                </div>
              ))}

              {activeProduct.users.length === 0 && (
                <div className="p-4 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-lg">
                  Ningún usuario activo tiene asignado este producto.
                </div>
              )}
            </div>
          </div>

          {/* Columna 3: Catálogo de Funcionalidades y Acciones */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-slate-700" />
                Funcionalidades ({activeProduct.functionalitiesCount})
              </h4>
            </div>

            <div className="space-y-3">
              {activeProduct.functionalities.map(func => {
                const permsInFunc = activeProduct.permissions.filter(p => p.functionality === func);

                return (
                  <div key={func} className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900">{func}</span>
                      <span className="text-[11px] font-semibold text-slate-500">{permsInFunc.length} acciones</span>
                    </div>

                    <div className="space-y-1">
                      {permsInFunc.map(p => (
                        <div key={p.id} className="flex items-center justify-between text-xs py-1 px-2 rounded bg-white border border-slate-100">
                          <span className="text-slate-800 font-medium truncate max-w-[180px]" title={p.label}>
                            {p.label}
                          </span>
                          <span className="font-mono text-[10px] text-slate-400">{p.code}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
