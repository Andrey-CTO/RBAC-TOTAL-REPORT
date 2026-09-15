import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useStore } from '../../lib/store';
import { Badge, Button, ErrorState } from '../../components/ui/Shared';
import { 
  ArrowLeft, Shield, Save, Trash2, X, AlertCircle, Users, Check,
  Layers, CheckSquare, Square, Info
} from 'lucide-react';
import { Role, ProductCode, Permission, FormatScope } from '../../types/rbac';
import { cn } from '../../lib/utils';

const PRODUCT_OPTIONS: { id: ProductCode; label: string; desc: string }[] = [
  { id: 'TOTAL_REPORT', label: 'TÓTAL REPORT®', desc: 'Generación, validación y transmisión regulatoria' },
  { id: 'TOTAL_SUPERVISION', label: 'TÓTAL SUPERVISIÓN®', desc: 'Monitoreo preventivo y supervisión multi-entidad' },
  { id: 'TAX_REPORT', label: 'TAX REPORT', desc: 'Medios magnéticos y declaraciones tributarias' },
  { id: 'TOTALIA', label: 'TOTALiA', desc: 'Inteligencia artificial y asistencia regulatoria' },
  { id: 'SECURITY_RBAC', label: 'Seguridad / RBAC', desc: 'Administración de usuarios, roles y auditoría' },
];

export function RoleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const store = useStore();
  
  const isNew = id === 'nuevo';
  const existingRole = store.roles.find(r => r.id === id);
  
  const [formData, setFormData] = useState<Partial<Role>>({
    id: '',
    code: '',
    name: '',
    description: '',
    owner: 'Administración',
    version: 1,
    status: 'DRAFT',
    products: [],
    permissions: []
  });

  const [activeTab, setActiveTab] = useState<'CONFIG' | 'USERS'>('CONFIG');
  const [selectedProduct, setSelectedProduct] = useState<ProductCode | null>(null);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isNew) {
      setFormData({
        id: `ROL-${Date.now()}`,
        code: '',
        name: '',
        description: '',
        owner: 'Seguridad & Operaciones',
        version: 1,
        status: 'PUBLISHED',
        products: ['TOTAL_REPORT'],
        permissions: []
      });
      setSelectedProduct('TOTAL_REPORT');
    } else if (existingRole) {
      setFormData(JSON.parse(JSON.stringify(existingRole)));
      if (existingRole.products && existingRole.products.length > 0) {
        setSelectedProduct(existingRole.products[0]);
      } else {
        setSelectedProduct('TOTAL_REPORT');
      }
    }
  }, [id, existingRole, isNew]);

  if (!isNew && !existingRole) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <h2 className="text-xl font-bold text-slate-900">El rol no existe o fue retirado</h2>
        <Link to="/roles"><Button variant="secondary">Volver al catálogo de roles</Button></Link>
      </div>
    );
  }

  const usersWithThisRole = !isNew && formData.id ? store.getUsersForRole(formData.id) : [];

  const handleSave = () => {
    if (!formData.name?.trim()) {
      alert('Por favor ingrese el nombre del rol.');
      return;
    }
    if (!formData.code?.trim()) {
      alert('Por favor ingrese un código identificador para el rol.');
      return;
    }

    if (isNew) {
      store.addRole(formData as Role);
    } else {
      store.updateRole(formData as Role);
    }
    navigate('/roles');
  };

  const toggleProduct = (prodId: ProductCode) => {
    const prods = formData.products || [];
    const nextProds = prods.includes(prodId) ? prods.filter(p => p !== prodId) : [...prods, prodId];
    
    // Si se desmarca el producto, opcionalmente filtramos los permisos correspondientes
    setFormData(prev => ({
      ...prev,
      products: nextProds
    }));

    if (selectedProduct === prodId && !nextProds.includes(prodId)) {
      setSelectedProduct(nextProds.length > 0 ? nextProds[0] : null);
    } else if (nextProds.includes(prodId) && !selectedProduct) {
      setSelectedProduct(prodId);
    }
  };

  const getPermissionAssignment = (permId: string) => {
    return formData.permissions?.find(p => p.permissionId === permId);
  };

  const togglePermission = (permId: string) => {
    setFormData(prev => {
      const current = prev.permissions || [];
      const exists = current.find(p => p.permissionId === permId);
      if (exists) {
        return {
          ...prev,
          permissions: current.filter(p => p.permissionId !== permId)
        };
      } else {
        const permDef = store.permissions.find(p => p.id === permId);
        const admits = permDef?.admitsFormat ?? false;
        return {
          ...prev,
          permissions: [
            ...current,
            {
              permissionId: permId,
              formatScope: {
                mode: admits ? 'ALL' : 'NOT_APPLICABLE',
                formatIds: []
              }
            }
          ]
        };
      }
    });
  };

  const setFormatScopeMode = (permId: string, mode: 'ALL' | 'SELECTED') => {
    setFormData(prev => {
      const current = prev.permissions || [];
      return {
        ...prev,
        permissions: current.map(p => {
          if (p.permissionId === permId) {
            return {
              ...p,
              formatScope: {
                mode,
                formatIds: mode === 'ALL' ? [] : p.formatScope.formatIds
              }
            };
          }
          return p;
        })
      };
    });
  };

  const toggleFormatIdForPermission = (permId: string, formatId: string) => {
    setFormData(prev => {
      const current = prev.permissions || [];
      return {
        ...prev,
        permissions: current.map(p => {
          if (p.permissionId === permId) {
            const fids = p.formatScope.formatIds || [];
            const nextFids = fids.includes(formatId) ? fids.filter(f => f !== formatId) : [...fids, formatId];
            return {
              ...p,
              formatScope: {
                mode: nextFids.length === 0 ? 'ALL' : 'SELECTED',
                formatIds: nextFids
              }
            };
          }
          return p;
        })
      };
    });
  };

  const handleDelete = () => {
    if (!formData.id) return;
    setDeleteErrorMessage(null);
    const res = store.deleteRole(formData.id);
    if (!res.success) {
      setDeleteErrorMessage(res.message || 'No se puede eliminar el rol.');
      return;
    }
    navigate('/roles');
  };

  const handleUnassignUser = (userId: string) => {
    if (!formData.id) return;
    store.removeUserFromRole(userId, formData.id);
    setDeleteErrorMessage(null);
  };

  // Permisos agrupados por funcionalidad para el producto seleccionado
  const productPermissions = store.permissions.filter(p => p.product === selectedProduct);
  const groupedPermissions = productPermissions.reduce((acc, perm) => {
    if (!acc[perm.functionality]) acc[perm.functionality] = [];
    acc[perm.functionality].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  const totalAssignedPermissions = formData.permissions?.length || 0;

  return (
    <div className="space-y-6 max-w-6xl mx-auto flex flex-col h-full pb-10 overflow-y-auto">
      {/* Top Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 pt-2 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <Link to="/roles" className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold text-slate-900">{isNew ? 'Nuevo Rol del Sistema' : formData.name}</h2>
              <Badge variant={formData.status === 'PUBLISHED' ? 'success' : formData.status === 'DRAFT' ? 'warning' : 'neutral'}>
                {formData.status === 'PUBLISHED' ? 'Publicado' : formData.status === 'DRAFT' ? 'Borrador' : 'Retirado'}
              </Badge>
              {!isNew && (
                <span className="text-xs px-2 py-0.5 font-mono bg-slate-100 text-slate-600 rounded border border-slate-200">
                  v{formData.version}.0
                </span>
              )}
            </div>
            <p className="text-slate-500 text-xs mt-1">
              {isNew ? 'Creación de conjunto reutilizable de autorizaciones' : `${formData.code} • ${totalAssignedPermissions} acciones configuradas`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isNew && (
            <Button
              variant="secondary"
              onClick={handleDelete}
              className={cn(
                "text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200",
                usersWithThisRole.length > 0 && "opacity-80"
              )}
              title={usersWithThisRole.length > 0 ? "Tiene usuarios asociados" : "Eliminar rol"}
            >
              <Trash2 className="w-4 h-4 mr-1.5" /> Eliminar Rol
            </Button>
          )}
          <Button variant="secondary" onClick={() => navigate('/roles')}>
            <X className="w-4 h-4 mr-1.5" /> Cancelar
          </Button>
          <Button onClick={handleSave} className="bg-brand-primary text-white hover:bg-brand-primary/90">
            <Save className="w-4 h-4 mr-1.5" /> Guardar Rol
          </Button>
        </div>
      </header>

      {/* Warning banner if role has assigned users (Section 19) */}
      {!isNew && usersWithThisRole.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3 text-amber-900">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-sm">Rol en uso activo</p>
            <p className="text-xs text-amber-800 mt-0.5">
              Este Rol está asociado a <strong>{usersWithThisRole.length} usuario{usersWithThisRole.length > 1 ? 's' : ''}</strong>. Modificar sus permisos o productos alterará inmediatamente sus facultades de acceso en tiempo real.
            </p>
          </div>
          <Badge variant="warning" className="text-[10px]">
            {usersWithThisRole.length} Asignaciones
          </Badge>
        </div>
      )}

      {/* Delete error notification banner */}
      {deleteErrorMessage && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-start gap-3 text-red-800">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-sm">Operación no permitida</p>
            <p className="text-xs text-red-700 mt-0.5">{deleteErrorMessage}</p>
          </div>
          <button onClick={() => setDeleteErrorMessage(null)} className="text-red-400 hover:text-red-700 text-sm font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-slate-200 flex gap-2">
        <button
          onClick={() => setActiveTab('CONFIG')}
          className={cn(
            "px-4 py-2.5 text-sm font-semibold border-b-2 transition-all flex items-center gap-2",
            activeTab === 'CONFIG'
              ? "border-brand-primary text-brand-primary bg-brand-primary/5 rounded-t-lg"
              : "border-transparent text-slate-500 hover:text-slate-800"
          )}
        >
          <Shield className="w-4 h-4" /> Configuración de Autorizaciones
        </button>
        {!isNew && (
          <button
            onClick={() => setActiveTab('USERS')}
            className={cn(
              "px-4 py-2.5 text-sm font-semibold border-b-2 transition-all flex items-center gap-2",
              activeTab === 'USERS'
                ? "border-brand-primary text-brand-primary bg-brand-primary/5 rounded-t-lg"
                : "border-transparent text-slate-500 hover:text-slate-800"
            )}
          >
            <Users className="w-4 h-4" />
            Usuarios Asociados
            <span className="text-xs px-1.5 py-0.5 rounded-full bg-slate-200 text-slate-700 font-bold">
              {usersWithThisRole.length}
            </span>
          </button>
        )}
      </div>

      {activeTab === 'CONFIG' ? (
        <div className="space-y-8">
          {/* Metadata Grid */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 mb-4">
              Identificación y Estado del Rol
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre del Rol *</label>
                <input
                  type="text"
                  placeholder="Ej: Analista Regulatorio"
                  value={formData.name || ''}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Código Identificador *</label>
                <input
                  type="text"
                  placeholder="Ej: REG_ANALYST"
                  value={formData.code || ''}
                  onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase().replace(/\s+/g, '_') })}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm font-mono uppercase focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Estado</label>
                <select
                  value={formData.status}
                  onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm bg-white focus:border-brand-primary outline-none"
                >
                  <option value="PUBLISHED">Publicado (Vigente)</option>
                  <option value="DRAFT">Borrador (En preparación)</option>
                  <option value="RETIRED">Retirado (No asignable)</option>
                </select>
              </div>
              <div className="md:col-span-3">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Descripción Funcional</label>
                <textarea
                  rows={2}
                  placeholder="Describa el propósito operativo y alcance de este rol..."
                  value={formData.description || ''}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none"
                />
              </div>
            </div>
          </div>

          {/* Habilitación de Productos */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Productos del Ecosistema TÓTAL Habilitados</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Marque los productos que este rol tiene autorización de operar. Puede ser exclusivo o compartido.
                </p>
              </div>
              <span className="text-xs font-semibold text-brand-primary">
                {formData.products?.length || 0} de {PRODUCT_OPTIONS.length} seleccionados
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {PRODUCT_OPTIONS.map(prod => {
                const isSelected = formData.products?.includes(prod.id);
                return (
                  <div
                    key={prod.id}
                    onClick={() => toggleProduct(prod.id)}
                    className={cn(
                      "p-3.5 border rounded-xl cursor-pointer transition-all flex items-start gap-3 select-none",
                      isSelected
                        ? "border-brand-primary bg-brand-primary/5 shadow-sm"
                        : "border-slate-200 hover:border-slate-300 bg-slate-50/50"
                    )}
                  >
                    <div className="mt-0.5">
                      {isSelected ? (
                        <div className="w-5 h-5 rounded bg-brand-primary text-white flex items-center justify-center text-xs">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded border border-slate-300 bg-white" />
                      )}
                    </div>
                    <div>
                      <h4 className={cn("text-sm font-bold", isSelected ? "text-brand-primary" : "text-slate-800")}>
                        {prod.label}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{prod.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Permisos por Funcionalidad y Acción */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h3 className="text-base font-bold text-slate-900">Configuración de Funcionalidades y Acciones</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Estructura: Producto → Funcionalidad → Acción → Alcance por Formato
              </p>
            </div>

            {/* Selector de Producto para configuración */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-500 mr-2 uppercase tracking-wider">Ver Producto:</span>
              {formData.products?.length === 0 ? (
                <p className="text-xs text-amber-600 bg-amber-50 px-3 py-1 rounded-md border border-amber-200">
                  Habilite al menos un producto arriba para desplegar sus funcionalidades.
                </p>
              ) : (
                formData.products?.map(prodId => {
                  const prodObj = PRODUCT_OPTIONS.find(p => p.id === prodId);
                  const isCur = selectedProduct === prodId;
                  const countForProd = formData.permissions?.filter(p => {
                    const pdef = store.permissions.find(pd => pd.id === p.permissionId);
                    return pdef?.product === prodId;
                  }).length || 0;

                  return (
                    <button
                      key={prodId}
                      onClick={() => setSelectedProduct(prodId)}
                      className={cn(
                        "px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 border",
                        isCur
                          ? "bg-brand-primary text-white border-brand-primary shadow-sm"
                          : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                      )}
                    >
                      <span>{prodObj?.label}</span>
                      <span className={cn(
                        "px-1.5 py-0.2 rounded-full text-[10px]",
                        isCur ? "bg-white/20 text-white" : "bg-slate-300 text-slate-700"
                      )}>
                        {countForProd}
                      </span>
                    </button>
                  );
                })
              )}
            </div>

            {/* Árbol de Funcionalidades del Producto Activo */}
            {selectedProduct && (
              <div className="space-y-6 pt-2">
                {Object.keys(groupedPermissions).length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-sm border border-dashed rounded-lg">
                    No hay acciones catalogadas para este producto.
                  </div>
                ) : (
                  Object.entries(groupedPermissions).map(([funcName, rawPerms]) => {
                    const perms = rawPerms as Permission[];
                    return (
                    <div key={funcName} className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/40">
                      <div className="bg-slate-100/80 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Layers className="w-4 h-4 text-brand-primary" />
                          <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                            {funcName}
                          </h4>
                        </div>
                        <span className="text-xs text-slate-500">
                          {perms.filter(p => getPermissionAssignment(p.id)).length} de {perms.length} activas
                        </span>
                      </div>

                      <div className="p-4 grid grid-cols-1 gap-4">
                        {perms.map(p => {
                          const assignment = getPermissionAssignment(p.id);
                          const isAssigned = !!assignment;

                          return (
                            <div
                              key={p.id}
                              className={cn(
                                "border rounded-lg p-4 transition-all bg-white",
                                isAssigned ? "border-brand-primary shadow-sm" : "border-slate-200 hover:border-slate-300"
                              )}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <label className="flex items-start gap-3 cursor-pointer flex-1 select-none">
                                  <input
                                    type="checkbox"
                                    checked={isAssigned}
                                    onChange={() => togglePermission(p.id)}
                                    className="w-4 h-4 mt-1 text-brand-primary rounded focus:ring-brand-primary"
                                  />
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-bold text-slate-900">{p.label}</span>
                                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200">
                                        {p.code}
                                      </span>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-0.5">{p.description}</p>
                                  </div>
                                </label>

                                {p.admitsFormat && (
                                  <Badge variant="info" className="text-[10px] shrink-0">
                                    Admite Formato
                                  </Badge>
                                )}
                              </div>

                              {/* Alcance de Formato (si aplica y está asignado) */}
                              {isAssigned && p.admitsFormat && (
                                <div className="mt-3 pt-3 border-t border-slate-100 ml-7 space-y-2 bg-slate-50/70 p-3 rounded-md border">
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                    <span className="text-xs font-bold text-slate-700">
                                      Alcance por Formato de la Acción:
                                    </span>
                                    <div className="flex items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => setFormatScopeMode(p.id, 'ALL')}
                                        className={cn(
                                          "px-2.5 py-1 text-xs rounded font-medium transition-colors border",
                                          assignment.formatScope.mode === 'ALL'
                                            ? "bg-brand-primary text-white border-brand-primary font-bold"
                                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                                        )}
                                      >
                                        Todos los Formatos
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setFormatScopeMode(p.id, 'SELECTED')}
                                        className={cn(
                                          "px-2.5 py-1 text-xs rounded font-medium transition-colors border",
                                          assignment.formatScope.mode === 'SELECTED'
                                            ? "bg-brand-primary text-white border-brand-primary font-bold"
                                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                                        )}
                                      >
                                        Formatos Específicos
                                      </button>
                                    </div>
                                  </div>

                                  {/* Si está en modo SELECTED, mostramos los checkboxes de formatos */}
                                  {assignment.formatScope.mode === 'SELECTED' && (
                                    <div className="pt-2 border-t border-slate-200/60">
                                      <p className="text-[11px] text-slate-500 mb-2">
                                        Seleccione los formatos permitidos (si no selecciona ninguno, aplicará a todos):
                                      </p>
                                      <div className="flex flex-wrap gap-2">
                                        {store.formats.map(fmt => {
                                          const isFmtChecked = assignment.formatScope.formatIds.includes(fmt.id);
                                          return (
                                            <button
                                              key={fmt.id}
                                              type="button"
                                              onClick={() => toggleFormatIdForPermission(p.id, fmt.id)}
                                              className={cn(
                                                "px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1.5 transition-all",
                                                isFmtChecked
                                                  ? "bg-emerald-50 text-emerald-800 border-emerald-300 font-bold"
                                                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                                              )}
                                            >
                                              {isFmtChecked && <Check className="w-3 h-3 text-emerald-600" />}
                                              {fmt.name}
                                            </button>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Pestaña Usuarios Asociados */
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">Usuarios con este Rol Asignado</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Regla de integridad: Un rol no puede ser eliminado mientras mantenga usuarios vinculados.
              </p>
            </div>
            <Badge variant={usersWithThisRole.length > 0 ? "warning" : "success"}>
              {usersWithThisRole.length} {usersWithThisRole.length === 1 ? 'Usuario' : 'Usuarios'}
            </Badge>
          </div>

          {usersWithThisRole.length > 0 ? (
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
              {usersWithThisRole.map(u => (
                <div key={u.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div>
                    <p className="font-bold text-sm text-slate-900">{u.name}</p>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                      <span className="font-mono">{u.identity}</span>
                      <span>•</span>
                      <span>{u.email}</span>
                      <span>•</span>
                      <Badge variant={u.status === 'ACTIVE' ? 'success' : 'neutral'} className="text-[10px]">
                        {u.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link to={`/usuarios/${u.id}`}>
                      <Button variant="secondary" size="sm" className="text-xs">
                        Ver Usuario
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleUnassignUser(u.id)}
                      className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                      title="Desvincular este rol del usuario"
                    >
                      Desvincular
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 border border-dashed rounded-lg text-slate-500">
              <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="font-medium text-sm text-slate-800">No hay usuarios asociados a este rol</p>
              <p className="text-xs text-slate-400 mt-1">Este rol es candidato seguro para ser eliminado o reconfigurado.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
