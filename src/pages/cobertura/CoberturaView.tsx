import { useState, useMemo } from 'react';
import { useStore } from '../../lib/store';
import { ProductCode, Permission, Role } from '../../types/rbac';
import { Badge, Button } from '../../components/ui/Shared';
import { 
  Layers, Search, Filter, Shield, Users, Building2, 
  CheckCircle2, ArrowRight, ExternalLink, Info, Check, Eye
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { resolveEffectivePermissions } from '../../lib/rbac-engine';

const PRODUCT_NAMES: Record<ProductCode, string> = {
  TOTAL_REPORT: 'TÓTAL REPORT®',
  TOTAL_SUPERVISION: 'TÓTAL SUPERVISIÓN®',
  TAX_REPORT: 'TAX REPORT',
  TOTALIA: 'TOTALiA',
  SECURITY_RBAC: 'Seguridad / RBAC'
};

export function CoberturaView() {
  const store = useStore();
  const [selectedProduct, setSelectedProduct] = useState<string>('ALL');
  const [selectedFunctionality, setSelectedFunctionality] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedActionId, setSelectedActionId] = useState<string | null>(null);

  // Funcionalidades únicas según el producto seleccionado
  const availableFunctionalities = useMemo(() => {
    const perms = selectedProduct === 'ALL' 
      ? store.permissions 
      : store.permissions.filter(p => p.product === selectedProduct);
    return Array.from(new Set(perms.map(p => p.functionality))).sort();
  }, [store.permissions, selectedProduct]);

  // Permisos filtrados
  const filteredPermissions = useMemo(() => {
    return store.permissions.filter(p => {
      const matchesProduct = selectedProduct === 'ALL' || p.product === selectedProduct;
      const matchesFunc = selectedFunctionality === 'ALL' || p.functionality === selectedFunctionality;
      const matchesSearch = p.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            p.resource.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesProduct && matchesFunc && matchesSearch;
    });
  }, [store.permissions, selectedProduct, selectedFunctionality, searchTerm]);

  // Cálculo de cobertura para cada permiso
  const coverageData = useMemo(() => {
    return filteredPermissions.map(perm => {
      // 1. Roles que contienen este permiso
      const rolesWithPerm: { role: Role; formatMode: string; formatIds: string[] }[] = [];
      store.roles.forEach(role => {
        const rp = role.permissions.find(p => p.permissionId === perm.id);
        if (rp) {
          rolesWithPerm.push({
            role,
            formatMode: rp.formatScope?.mode || 'NOT_APPLICABLE',
            formatIds: rp.formatScope?.formatIds || []
          });
        }
      });

      // 2. Usuarios efectivos que tienen autorización para este permiso
      const authorizedUsers: {
        user: typeof store.users[0];
        sourceRoleNames: string[];
        formatMode: string;
        formatIds: string[];
      }[] = [];

      store.users.filter(u => u.status === 'ACTIVE').forEach(user => {
        const effective = resolveEffectivePermissions(user.id, user);
        const matches = effective.filter(e => e.permission.id === perm.id);
        if (matches.length > 0) {
          const sourceRoles = Array.from(new Set(matches.map(m => m.sourceRole)));
          const isAll = matches.some(m => m.formatScopeMode === 'ALL');
          const allFormats = Array.from(new Set(matches.flatMap(m => m.formatIds)));

          authorizedUsers.push({
            user,
            sourceRoleNames: sourceRoles,
            formatMode: isAll ? 'ALL' : allFormats.length > 0 ? 'SELECTED' : 'NOT_APPLICABLE',
            formatIds: allFormats
          });
        }
      });

      // Alcance consolidado para la acción
      let consolidatedScope = 'No configurado';
      if (rolesWithPerm.length > 0 || authorizedUsers.length > 0) {
        if (!perm.admitsFormat) {
          consolidatedScope = 'General (Sin formato)';
        } else {
          const hasAll = rolesWithPerm.some(r => r.formatMode === 'ALL') || authorizedUsers.some(u => u.formatMode === 'ALL');
          if (hasAll) {
            consolidatedScope = 'Todos los Formatos';
          } else {
            const fids = Array.from(new Set([
              ...rolesWithPerm.flatMap(r => r.formatIds),
              ...authorizedUsers.flatMap(u => u.formatIds)
            ]));
            consolidatedScope = fids.length > 0 ? fids.join(', ') : 'Todos los Formatos';
          }
        }
      }

      return {
        permission: perm,
        roles: rolesWithPerm,
        rolesCount: rolesWithPerm.length,
        users: authorizedUsers,
        usersCount: authorizedUsers.length,
        scopeLabel: consolidatedScope
      };
    });
  }, [filteredPermissions, store.roles, store.users]);

  const activeActionCoverage = coverageData.find(c => c.permission.id === selectedActionId);

  return (
    <div className="space-y-6 max-w-7xl mx-auto h-full flex flex-col pb-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900">Cobertura Funcional</h2>
            <Badge variant="neutral" className="font-mono">
              {coverageData.length} Acciones
            </Badge>
          </div>
          <p className="text-slate-500 mt-1 text-sm">
            Mapa de seguridad: consulte con precisión qué roles y usuarios tienen autorización para ejecutar cada acción del catálogo
          </p>
        </div>
      </header>

      {/* Panel Principal */}
      <div className="flex-1 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
        {/* Barra de Filtros */}
        <div className="p-4 border-b border-slate-200 flex flex-col lg:flex-row gap-3 justify-between bg-slate-50/70">
          <div className="relative w-full lg:w-80 shrink-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Buscar acción por nombre, código o recurso..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-2 w-full text-sm border border-slate-200 rounded-lg focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none bg-white" 
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select 
              value={selectedProduct}
              onChange={e => {
                setSelectedProduct(e.target.value);
                setSelectedFunctionality('ALL');
              }}
              className="px-3 py-2 text-xs font-medium border border-slate-200 rounded-lg focus:border-brand-primary outline-none bg-white"
            >
              <option value="ALL">Todos los productos</option>
              <option value="TOTAL_REPORT">TÓTAL REPORT®</option>
              <option value="TOTAL_SUPERVISION">TÓTAL SUPERVISIÓN®</option>
              <option value="TAX_REPORT">TAX REPORT</option>
              <option value="TOTALIA">TOTALiA</option>
              <option value="SECURITY_RBAC">Seguridad / RBAC</option>
            </select>

            <select 
              value={selectedFunctionality}
              onChange={e => setSelectedFunctionality(e.target.value)}
              className="px-3 py-2 text-xs font-medium border border-slate-200 rounded-lg focus:border-brand-primary outline-none bg-white"
            >
              <option value="ALL">Todas las funcionalidades</option>
              {availableFunctionalities.map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>

            {(searchTerm || selectedProduct !== 'ALL' || selectedFunctionality !== 'ALL') && (
              <button 
                onClick={() => { setSearchTerm(''); setSelectedProduct('ALL'); setSelectedFunctionality('ALL'); }}
                className="text-xs text-brand-primary hover:underline px-2 py-1 font-medium"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>

        {/* Tabla de Cobertura */}
        <div className="overflow-auto flex-1">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-white text-slate-600 sticky top-0 z-10 border-b border-slate-200 shadow-sm text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5 font-bold">Acción / Código</th>
                <th className="px-6 py-3.5 font-bold">Producto</th>
                <th className="px-6 py-3.5 font-bold">Funcionalidad</th>
                <th className="px-6 py-3.5 font-bold text-center">Roles</th>
                <th className="px-6 py-3.5 font-bold text-center">Usuarios</th>
                <th className="px-6 py-3.5 font-bold">Alcance de Formato</th>
                <th className="px-6 py-3.5 font-bold w-20 text-center">Detalle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {coverageData.map(item => {
                const isSelected = selectedActionId === item.permission.id;

                return (
                  <tr 
                    key={item.permission.id} 
                    className={cn(
                      "hover:bg-slate-50/80 transition-colors",
                      isSelected && "bg-brand-primary/5"
                    )}
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-bold text-slate-900">{item.permission.label}</p>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                          <span className="font-mono font-semibold text-slate-600">{item.permission.code}</span>
                          <span className="text-slate-300">•</span>
                          <span className="truncate max-w-xs">{item.permission.description}</span>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-1 rounded border border-slate-200">
                        {PRODUCT_NAMES[item.permission.product]}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <span className="text-xs font-medium text-slate-600">
                        {item.permission.functionality}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-center">
                      <span className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold",
                        item.rolesCount > 0 ? "bg-blue-50 text-brand-primary border border-blue-200" : "bg-slate-100 text-slate-400"
                      )}>
                        {item.rolesCount} {item.rolesCount === 1 ? 'Rol' : 'Roles'}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-center">
                      <span className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold",
                        item.usersCount > 0 ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-400"
                      )}>
                        {item.usersCount} {item.usersCount === 1 ? 'Usuario' : 'Usuarios'}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <span className={cn(
                        "text-xs px-2 py-1 rounded font-medium",
                        item.scopeLabel === 'Todos los Formatos' ? "bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold" :
                        item.scopeLabel.includes('FMT-') || item.scopeLabel.includes('MURIC') || item.scopeLabel.includes('458') ? "bg-amber-50 text-amber-800 border border-amber-200 font-mono" :
                        "bg-slate-100 text-slate-500"
                      )}>
                        {item.scopeLabel}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-center">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setSelectedActionId(isSelected ? null : item.permission.id)}
                        className={cn(
                          "px-2.5 py-1 text-xs",
                          isSelected ? "bg-brand-primary text-white hover:bg-brand-primary/90" : "text-slate-600"
                        )}
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" />
                        {isSelected ? 'Cerrar' : 'Ver'}
                      </Button>
                    </td>
                  </tr>
                );
              })}

              {coverageData.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    No se encontraron acciones en el catálogo para los filtros seleccionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Detalle Expandido Modal / Panel Inferior de la Acción Seleccionada */}
        {activeActionCoverage && (
          <div className="border-t border-slate-200 bg-slate-50/90 p-5 shrink-0 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>Desglose de Cobertura: {activeActionCoverage.permission.label}</span>
                  <span className="text-xs font-mono px-2 py-0.5 bg-white border border-slate-200 text-slate-600 rounded">
                    {activeActionCoverage.permission.code}
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {activeActionCoverage.permission.description} • Producto: {PRODUCT_NAMES[activeActionCoverage.permission.product]}
                </p>
              </div>
              <Button variant="secondary" size="sm" onClick={() => setSelectedActionId(null)}>
                Cerrar Panel
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Roles Autorizados */}
              <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-brand-primary" />
                    Roles con este permiso ({activeActionCoverage.roles.length})
                  </span>
                </div>
                <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
                  {activeActionCoverage.roles.map(r => (
                    <div key={r.role.id} className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-100 text-xs">
                      <div>
                        <Link to={`/roles/${r.role.id}`} className="font-bold text-brand-primary hover:underline flex items-center gap-1">
                          {r.role.name}
                          <ExternalLink className="w-3 h-3 text-slate-400" />
                        </Link>
                        <span className="font-mono text-[11px] text-slate-500">{r.role.code}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700 font-medium">
                        Alcance: {r.formatMode === 'ALL' ? 'Todos' : r.formatIds.length > 0 ? r.formatIds.join(', ') : 'General'}
                      </span>
                    </div>
                  ))}
                  {activeActionCoverage.roles.length === 0 && (
                    <p className="text-xs text-slate-400 italic py-2">Ningún rol contiene esta acción configurada actualmente.</p>
                  )}
                </div>
              </div>

              {/* Usuarios Autorizados */}
              <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-emerald-600" />
                    Usuarios con autorización efectiva ({activeActionCoverage.users.length})
                  </span>
                </div>
                <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
                  {activeActionCoverage.users.map(u => (
                    <div key={u.user.id} className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-100 text-xs">
                      <div>
                        <Link to={`/usuarios/${u.user.id}`} className="font-bold text-slate-900 hover:text-brand-primary flex items-center gap-1">
                          {u.user.name} ({u.user.identity})
                          <ExternalLink className="w-3 h-3 text-slate-400" />
                        </Link>
                        <span className="text-[11px] text-slate-500">
                          Origen: {u.sourceRoleNames.join(', ')}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 font-medium">
                        {u.formatMode === 'ALL' ? 'Todos' : u.formatIds.length > 0 ? u.formatIds.join(', ') : 'General'}
                      </span>
                    </div>
                  ))}
                  {activeActionCoverage.users.length === 0 && (
                    <p className="text-xs text-slate-400 italic py-2">Ningún usuario activo cuenta con autorización para esta acción.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
