import { useState, useMemo } from 'react';
import { useStore } from '../../lib/store';
import { ProductCode, Permission, Role, User } from '../../types/rbac';
import { Badge, Button, SidePanel } from '../../components/ui/Shared';
import { 
  Search, Filter, Shield, Layers, Sparkles, Building2, 
  Users, CheckCircle2, ChevronRight, FileText, Check, 
  Database, Eye, ArrowUpDown, Tag, Info, AlertCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { resolveEffectivePermissions } from '../../lib/rbac-engine';

const PRODUCT_LABELS: Record<ProductCode, { name: string; color: string; badge: 'info' | 'success' | 'warning' | 'neutral' | 'danger' }> = {
  TOTAL_REPORT: { name: 'TÓTAL REPORT®', color: 'text-sky-700 bg-sky-50 border-sky-200', badge: 'info' },
  TOTAL_SUPERVISION: { name: 'TÓTAL SUPERVISIÓN®', color: 'text-indigo-700 bg-indigo-50 border-indigo-200', badge: 'neutral' },
  TAX_REPORT: { name: 'TAX REPORT', color: 'text-amber-700 bg-amber-50 border-amber-200', badge: 'warning' },
  TOTALIA: { name: 'TOTALiA', color: 'text-purple-700 bg-purple-50 border-purple-200', badge: 'neutral' },
  SECURITY_RBAC: { name: 'Seguridad / RBAC', color: 'text-emerald-700 bg-emerald-50 border-emerald-200', badge: 'success' }
};

export function CatalogoView() {
  const store = useStore();
  const [activeTab, setActiveTab] = useState<'ALL' | 'BASE' | 'EXTENDED'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<string>('ALL');
  const [selectedFunctionality, setSelectedFunctionality] = useState<string>('ALL');
  const [selectedScope, setSelectedScope] = useState<string>('ALL');
  const [selectedPermission, setSelectedPermission] = useState<Permission | null>(null);

  // Totales para métricas de cabecera
  const stats = useMemo(() => {
    const total = store.permissions.length;
    const baseCount = store.permissions.filter(p => p.origin === 'BASE').length;
    const extendedCount = store.permissions.filter(p => p.origin === 'EXTENDED').length;
    const formatCount = store.permissions.filter(p => p.admitsFormat).length;
    const productsCount = new Set(store.permissions.map(p => p.product)).size;
    return { total, baseCount, extendedCount, formatCount, productsCount };
  }, [store.permissions]);

  // Lista única de funcionalidades para el filtro
  const functionalities = useMemo(() => {
    const list = Array.from(new Set(store.permissions.map(p => p.functionality))).sort();
    return list;
  }, [store.permissions]);

  // Filtrado de permisos
  const filteredPermissions = useMemo(() => {
    return store.permissions.filter(perm => {
      // Filtro por pestaña
      if (activeTab === 'BASE' && perm.origin !== 'BASE') return false;
      if (activeTab === 'EXTENDED' && perm.origin !== 'EXTENDED') return false;

      // Filtro por producto
      if (selectedProduct !== 'ALL' && perm.product !== selectedProduct) return false;

      // Filtro por funcionalidad
      if (selectedFunctionality !== 'ALL' && perm.functionality !== selectedFunctionality) return false;

      // Filtro por alcance
      if (selectedScope === 'FORMAT' && !perm.admitsFormat) return false;
      if (selectedScope === 'GLOBAL' && perm.admitsFormat) return false;

      // Filtro por búsqueda de texto
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const idMatch = perm.legacyId?.toString() === query || perm.id.toLowerCase().includes(query);
        const nameMatch = perm.label.toLowerCase().includes(query) || (perm.originalName && perm.originalName.toLowerCase().includes(query));
        const descMatch = perm.description.toLowerCase().includes(query) || (perm.originalDescription && perm.originalDescription.toLowerCase().includes(query));
        const codeMatch = perm.code.toLowerCase().includes(query);
        const funcMatch = perm.functionality.toLowerCase().includes(query);
        const moduleMatch = perm.module.toLowerCase().includes(query);
        const resMatch = perm.resource.toLowerCase().includes(query);

        if (!idMatch && !nameMatch && !descMatch && !codeMatch && !funcMatch && !moduleMatch && !resMatch) {
          return false;
        }
      }

      return true;
    });
  }, [store.permissions, activeTab, selectedProduct, selectedFunctionality, selectedScope, searchTerm]);

  // Cálculo de Roles y Usuarios asociados al permiso seleccionado en el SidePanel
  const permissionAssociations = useMemo(() => {
    if (!selectedPermission) return { roles: [], users: [] };

    // 1. Roles que tienen configurado este permiso
    const rolesWithPermission: { role: Role; formatMode: string; formatCount: number }[] = [];
    store.roles.forEach(role => {
      const rp = role.permissions.find(p => p.permissionId === selectedPermission.id);
      if (rp) {
        rolesWithPermission.push({
          role,
          formatMode: rp.formatScope?.mode || 'NOT_APPLICABLE',
          formatCount: rp.formatScope?.formatIds?.length || 0
        });
      }
    });

    // 2. Usuarios activos que tienen asignado este permiso de forma efectiva
    const effectiveUsers: { user: User; grantingRoles: string[]; formatMode: string }[] = [];
    store.users.filter(u => u.status === 'ACTIVE').forEach(user => {
      const eff = resolveEffectivePermissions(user.id, user);
      const match = eff.filter(e => e.permission.id === selectedPermission.id);
      if (match.length > 0) {
        const grantingRoles = Array.from(new Set(match.map(m => m.sourceRole)));
        const isAll = match.some(m => m.formatScopeMode === 'ALL');
        const formatMode = isAll ? 'Todos los Formatos' : selectedPermission.admitsFormat ? 'Formatos Específicos' : 'No Aplica (Global)';
        effectiveUsers.push({
          user,
          grantingRoles,
          formatMode
        });
      }
    });

    return {
      roles: rolesWithPermission,
      users: effectiveUsers
    };
  }, [selectedPermission, store.roles, store.users]);

  return (
    <div className="space-y-6 flex flex-col h-full">
      {/* Cabecera de Métricas del Catálogo */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Consolidado</span>
            <Database className="w-4 h-4 text-brand-primary" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{stats.total}</span>
            <span className="text-xs text-slate-500">acciones</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Catálogo Base</span>
            <span className="text-xs font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200">Reconciliado</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-sky-700">{stats.baseCount}</span>
            <span className="text-xs text-slate-500">TÓTAL REPORT®</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Extensiones</span>
            <Sparkles className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-indigo-700">{stats.extendedCount}</span>
            <span className="text-xs text-slate-500">nuevas capacidades</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Alcance Formatos</span>
            <FileText className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-700">{stats.formatCount}</span>
            <span className="text-xs text-slate-500">con segregación</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Productos</span>
            <Shield className="w-4 h-4 text-slate-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{stats.productsCount}</span>
            <span className="text-xs text-slate-500">ecosistemas</span>
          </div>
        </div>
      </div>

      {/* Controles de Navegación por Pestañas y Filtros */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          {/* Tabs */}
          <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-sm">
            <button
              onClick={() => setActiveTab('ALL')}
              className={cn(
                "px-3.5 py-1.5 font-medium rounded-md transition-all",
                activeTab === 'ALL' 
                  ? "bg-white text-slate-900 shadow-sm font-semibold" 
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              Todos los Permisos ({stats.total})
            </button>
            <button
              onClick={() => setActiveTab('BASE')}
              className={cn(
                "px-3.5 py-1.5 font-medium rounded-md transition-all flex items-center gap-1.5",
                activeTab === 'BASE' 
                  ? "bg-white text-sky-800 shadow-sm font-semibold" 
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              Catálogo Base TÓTAL REPORT® ({stats.baseCount})
            </button>
            <button
              onClick={() => setActiveTab('EXTENDED')}
              className={cn(
                "px-3.5 py-1.5 font-medium rounded-md transition-all flex items-center gap-1.5",
                activeTab === 'EXTENDED' 
                  ? "bg-white text-indigo-800 shadow-sm font-semibold" 
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              Extensiones del Ecosistema ({stats.extendedCount})
            </button>
          </div>

          {/* Buscador */}
          <div className="relative w-full lg:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por ID, nombre, descripción..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition-all"
            />
          </div>
        </div>

        {/* Filtros Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Producto</label>
            <select
              value={selectedProduct}
              onChange={e => setSelectedProduct(e.target.value)}
              className="w-full text-sm border border-slate-200 rounded-md py-1.5 px-2 bg-white text-slate-700 focus:outline-none focus:border-brand-primary"
            >
              <option value="ALL">Todos los Productos</option>
              <option value="TOTAL_REPORT">TÓTAL REPORT®</option>
              <option value="TOTAL_SUPERVISION">TÓTAL SUPERVISIÓN®</option>
              <option value="TAX_REPORT">TAX REPORT</option>
              <option value="TOTALIA">TOTALiA</option>
              <option value="SECURITY_RBAC">Seguridad / RBAC</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Funcionalidad / Dominio</label>
            <select
              value={selectedFunctionality}
              onChange={e => setSelectedFunctionality(e.target.value)}
              className="w-full text-sm border border-slate-200 rounded-md py-1.5 px-2 bg-white text-slate-700 focus:outline-none focus:border-brand-primary"
            >
              <option value="ALL">Todas las Funcionalidades ({functionalities.length})</option>
              {functionalities.map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Alcance</label>
            <select
              value={selectedScope}
              onChange={e => setSelectedScope(e.target.value)}
              className="w-full text-sm border border-slate-200 rounded-md py-1.5 px-2 bg-white text-slate-700 focus:outline-none focus:border-brand-primary"
            >
              <option value="ALL">Todos los Alcances</option>
              <option value="FORMAT">Admite Formatos Específicos</option>
              <option value="GLOBAL">General / Sin Formatos</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabla Principal del Catálogo */}
      <div className="flex-1 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col min-h-[450px]">
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center text-xs text-slate-500">
          <span>Mostrando <strong className="text-slate-900">{filteredPermissions.length}</strong> de <strong className="text-slate-900">{store.permissions.length}</strong> acciones</span>
          {filteredPermissions.length < store.permissions.length && (
            <button
              onClick={() => {
                setActiveTab('ALL');
                setSearchTerm('');
                setSelectedProduct('ALL');
                setSelectedFunctionality('ALL');
                setSelectedScope('ALL');
              }}
              className="text-brand-primary hover:underline font-medium"
            >
              Restablecer filtros
            </button>
          )}
        </div>

        <div className="overflow-auto flex-1">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50/80 backdrop-blur text-slate-500 sticky top-0 z-10 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider w-16">ID</th>
                <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider">Permiso / Acción</th>
                <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider">Producto</th>
                <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider">Funcionalidad</th>
                <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider text-center">Origen</th>
                <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider text-center">Alcance</th>
                <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider text-center">Estado</th>
                <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider text-center w-20">Detalle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPermissions.map(perm => {
                const prodInfo = PRODUCT_LABELS[perm.product] || { name: perm.product, color: 'text-slate-700 bg-slate-100 border-slate-200', badge: 'neutral' as const };
                return (
                  <tr 
                    key={perm.id} 
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    onClick={() => setSelectedPermission(perm)}
                  >
                    {/* ID */}
                    <td className="px-4 py-3.5 font-mono text-xs font-bold text-slate-600">
                      {perm.legacyId !== undefined ? (
                        <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-slate-800">
                          #{perm.legacyId}
                        </span>
                      ) : (
                        <span className="bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 text-indigo-700 text-[11px]">
                          EXT
                        </span>
                      )}
                    </td>

                    {/* Nombre y Descripción */}
                    <td className="px-4 py-3.5 max-w-md">
                      <div className="font-semibold text-slate-900 group-hover:text-brand-primary transition-colors flex items-center gap-2">
                        {perm.label}
                      </div>
                      <p className="text-xs text-slate-500 truncate mt-0.5" title={perm.description}>
                        {perm.description}
                      </p>
                    </td>

                    {/* Producto */}
                    <td className="px-4 py-3.5">
                      <span className={cn("text-xs font-medium px-2.5 py-1 rounded-md border", prodInfo.color)}>
                        {prodInfo.name}
                      </span>
                    </td>

                    {/* Funcionalidad */}
                    <td className="px-4 py-3.5">
                      <span className="text-xs font-medium text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                        {perm.functionality}
                      </span>
                    </td>

                    {/* Origen */}
                    <td className="px-4 py-3.5 text-center">
                      {perm.origin === 'BASE' ? (
                        <span className="text-xs font-medium text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-200 inline-block">
                          Base TÓTAL
                        </span>
                      ) : (
                        <span className="text-xs font-medium text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 inline-block">
                          Extensión
                        </span>
                      )}
                    </td>

                    {/* Alcance */}
                    <td className="px-4 py-3.5 text-center">
                      {perm.admitsFormat ? (
                        <Badge variant="info" className="text-xs">
                          Admite Formatos
                        </Badge>
                      ) : (
                        <Badge variant="neutral" className="text-xs">
                          General
                        </Badge>
                      )}
                    </td>

                    {/* Estado */}
                    <td className="px-4 py-3.5 text-center">
                      {perm.catalogStatus === 'CATALOGED' ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <Check className="w-3 h-3 text-emerald-600" /> Catalogada
                        </span>
                      ) : perm.catalogStatus === 'EXTENDED' ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                          <Sparkles className="w-3 h-3 text-indigo-500" /> Extendida
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          <AlertCircle className="w-3 h-3 text-amber-500" /> Revisión
                        </span>
                      )}
                    </td>

                    {/* Botón Detalle */}
                    <td className="px-4 py-3.5 text-center">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0 text-slate-400 hover:text-slate-900 group-hover:bg-slate-200/50"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPermission(perm);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                );
              })}

              {filteredPermissions.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                    <div className="max-w-md mx-auto space-y-2">
                      <Search className="w-8 h-8 text-slate-300 mx-auto" />
                      <p className="font-semibold text-slate-700">No se encontraron acciones en el catálogo</p>
                      <p className="text-xs text-slate-500">Pruebe ajustando los filtros de producto, funcionalidad o los términos de búsqueda.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Panel Lateral de Detalle con Roles y Usuarios Efectivos */}
      <SidePanel
        isOpen={!!selectedPermission}
        onClose={() => setSelectedPermission(null)}
        title="Ficha Técnica de Acción RBAC"
      >
        {selectedPermission && (
          <div className="space-y-6">
            {/* Cabecera del Permiso */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold bg-white px-2.5 py-1 rounded border border-slate-200 text-slate-800">
                  {selectedPermission.legacyId !== undefined ? `ID Oficial: #${selectedPermission.legacyId}` : `ID Interno: ${selectedPermission.id}`}
                </span>
                {selectedPermission.origin === 'BASE' ? (
                  <span className="text-xs font-semibold text-sky-700 bg-sky-100/70 px-2.5 py-0.5 rounded-full border border-sky-200">
                    Catálogo Base TÓTAL REPORT®
                  </span>
                ) : (
                  <span className="text-xs font-semibold text-indigo-700 bg-indigo-100/70 px-2.5 py-0.5 rounded-full border border-indigo-200">
                    Extensión Ecosistema
                  </span>
                )}
              </div>

              <div>
                <h2 className="text-lg font-bold text-slate-900 leading-snug">{selectedPermission.label}</h2>
                <p className="text-sm text-slate-600 mt-1">{selectedPermission.description}</p>
              </div>

              <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200/80">
                <span className={cn("text-xs font-semibold px-2.5 py-1 rounded border", PRODUCT_LABELS[selectedPermission.product]?.color)}>
                  {PRODUCT_LABELS[selectedPermission.product]?.name}
                </span>
                <span className="text-xs font-medium text-slate-700 bg-white px-2.5 py-1 rounded border border-slate-200">
                  Dominio: {selectedPermission.functionality}
                </span>
                <span className="text-xs font-medium text-slate-700 bg-white px-2.5 py-1 rounded border border-slate-200">
                  Recurso: {selectedPermission.resource}
                </span>
                <span className="text-xs font-medium text-slate-700 bg-white px-2.5 py-1 rounded border border-slate-200">
                  Acción: {selectedPermission.action}
                </span>
              </div>
            </div>

            {/* Configuración de Alcance */}
            <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-2">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-slate-400" /> Alcance y Granularidad
              </h3>
              <div className="flex items-center justify-between text-sm pt-1">
                <span className="text-slate-700">Admite Alcance por Formato</span>
                {selectedPermission.admitsFormat ? (
                  <Badge variant="info">Habilitado (Por Formatos)</Badge>
                ) : (
                  <Badge variant="neutral">No Aplica (Global a Entidad)</Badge>
                )}
              </div>
              <p className="text-xs text-slate-500 pt-1 border-t border-slate-100">
                {selectedPermission.admitsFormat 
                  ? 'Este permiso permite a los roles delimitar su ejecución sobre formatos individuales específicos (ej. FMT-458, MURIC) o de manera irrestricta sobre todos los formatos.'
                  : 'Este permiso se aplica de manera uniforme a nivel de entidad/ambiente sin requerir selección de formatos.'}
              </p>
            </div>

            {/* Roles Asociados */}
            <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-brand-primary" /> Roles que Contienen esta Acción ({permissionAssociations.roles.length})
                </h3>
              </div>

              {permissionAssociations.roles.length > 0 ? (
                <div className="space-y-2">
                  {permissionAssociations.roles.map(({ role, formatMode, formatCount }) => (
                    <div key={role.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <Link 
                            to={`/roles/${role.id}`}
                            className="font-semibold text-sm text-slate-900 hover:text-brand-primary transition-colors flex items-center gap-1"
                          >
                            {role.name}
                            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                          </Link>
                          <span className="text-[10px] font-mono bg-slate-200 px-1.5 py-0.5 rounded text-slate-700">{role.code}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Alcance asignado: <strong className="text-slate-700">{formatMode === 'ALL' ? 'Todos los Formatos' : formatMode === 'SELECTED' ? `${formatCount} Formatos Seleccionados` : 'General'}</strong>
                        </p>
                      </div>
                      <Badge variant={role.status === 'PUBLISHED' ? 'success' : 'warning'}>
                        {role.status === 'PUBLISHED' ? 'Publicado' : 'Borrador'}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-100 text-center">
                  Ningún rol tiene actualmente asignada esta acción.
                </div>
              )}
            </div>

            {/* Usuarios Efectivos */}
            <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-emerald-600" /> Usuarios Autorizados Efectivos ({permissionAssociations.users.length})
                </h3>
              </div>

              {permissionAssociations.users.length > 0 ? (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {permissionAssociations.users.map(({ user, grantingRoles, formatMode }) => (
                    <div key={user.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs">
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <Link to={`/usuarios/${user.id}`} className="font-semibold text-slate-900 hover:text-brand-primary">
                            {user.name}
                          </Link>
                          <p className="text-[11px] text-slate-500">
                            Rol: {grantingRoles.join(', ')}
                          </p>
                        </div>
                      </div>
                      <span className="text-[11px] text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                        {formatMode}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-100 text-center">
                  No hay usuarios activos con acceso efectivo a este permiso.
                </div>
              )}
            </div>
          </div>
        )}
      </SidePanel>
    </div>
  );
}
