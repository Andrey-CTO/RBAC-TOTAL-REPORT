import { useState, useMemo, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Badge, Button } from '../../components/ui/Shared';
import { 
  ArrowLeft, UserCircle, Shield, Key, AlertCircle, Save, X, 
  Trash2, Check, Building2, Package, ChevronRight, ChevronLeft, 
  Search, Sparkles, Filter, CheckCircle2, SlidersHorizontal
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useStore } from '../../lib/store';
import { useToast } from '../../context/ToastContext';
import { User, ProductCode, RolePermission } from '../../types/rbac';
import { resolveEffectivePermissions } from '../../lib/rbac-engine';

const PRODUCT_OPTIONS: { id: ProductCode; label: string; desc: string }[] = [
  { id: 'TOTAL_REPORT', label: 'TÓTAL REPORT®', desc: 'Generación y transmisión regulatoria' },
  { id: 'TOTAL_SUPERVISION', label: 'TÓTAL SUPERVISIÓN®', desc: 'Monitoreo preventivo y supervisión' },
  { id: 'TAX_REPORT', label: 'TAX REPORT', desc: 'Información exógena y tributaria' },
  { id: 'TOTALIA', label: 'TOTALiA', desc: 'Asistencia regulatoria inteligente' },
  { id: 'SECURITY_RBAC', label: 'Seguridad / RBAC', desc: 'Administración de usuarios y accesos' },
];

type TabKey = 'GENERAL' | 'ENTITIES_PRODUCTS' | 'ROLES' | 'DIRECT_PERMS' | 'EFFECTIVE';

const STEPS: { key: TabKey; label: string; stepNumber: number; icon: any }[] = [
  { key: 'GENERAL', label: '1. Identidad', stepNumber: 1, icon: UserCircle },
  { key: 'ENTITIES_PRODUCTS', label: '2. Entidades & Productos', stepNumber: 2, icon: Package },
  { key: 'ROLES', label: '3. Roles Asignados', stepNumber: 3, icon: Shield },
  { key: 'DIRECT_PERMS', label: '4. Permisos Directos', stepNumber: 4, icon: Key },
  { key: 'EFFECTIVE', label: '5. Acceso Efectivo', stepNumber: 5, icon: Sparkles },
];

export function UsuarioDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const store = useStore();
  const toast = useToast();
  
  const isNew = id === 'nuevo';
  const existingUser = store.users.find(u => u.id === id);
  const initializedIdRef = useRef<string | null>(null);
  
  const [formData, setFormData] = useState<Partial<User>>({
    id: '',
    identity: '',
    name: '',
    email: '',
    type: 'HUMAN',
    status: 'ACTIVE',
    entities: [],
    products: [],
    roles: [],
    directPermissions: []
  });
  
  const [activeTab, setActiveTab] = useState<TabKey>('GENERAL');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [directSearch, setDirectSearch] = useState('');
  const [directCategoryFilter, setDirectCategoryFilter] = useState<string>('ALL');

  // Inicializar estado una sola vez al cargar o cambiar de ID
  useEffect(() => {
    if (initializedIdRef.current === id) return;
    initializedIdRef.current = id || null;

    if (isNew) {
      setFormData({
        id: `u-${Date.now()}`,
        identity: '',
        name: '',
        email: '',
        type: 'HUMAN',
        status: 'ACTIVE',
        entities: ['ENT-1'],
        products: ['TOTAL_REPORT'],
        roles: ['ROL-PREP'],
        directPermissions: []
      });
    } else if (existingUser) {
      setFormData(JSON.parse(JSON.stringify(existingUser)));
    }
  }, [id, existingUser, isNew]);

  if (!isNew && !existingUser && initializedIdRef.current === id) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4 py-16">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <h2 className="text-xl font-bold text-slate-900">Usuario no encontrado</h2>
        <p className="text-sm text-slate-500">El identificador especificado no corresponde a ningún usuario activo.</p>
        <Link to="/usuarios"><Button variant="secondary">Volver al listado de usuarios</Button></Link>
      </div>
    );
  }

  // Cálculo en vivo de permisos efectivos con el estado actual del formulario
  const effectivePermissions = useMemo(() => {
    if (!formData.id) return [];
    return resolveEffectivePermissions(formData.id, formData as User);
  }, [formData]);

  const currentStepIndex = STEPS.findIndex(s => s.key === activeTab);

  const validateForm = () => {
    if (!formData.name?.trim()) {
      toast.showToast({
        type: 'warning',
        title: 'Campo Requerido',
        message: 'Por favor ingrese el nombre completo del usuario.'
      });
      setActiveTab('GENERAL');
      return false;
    }
    if (!formData.identity?.trim()) {
      toast.showToast({
        type: 'warning',
        title: 'Campo Requerido',
        message: 'Por favor ingrese el identificador o cédula/ID de empleado.'
      });
      setActiveTab('GENERAL');
      return false;
    }
    if (!formData.email?.trim() || !formData.email.includes('@')) {
      toast.showToast({
        type: 'warning',
        title: 'Correo Inválido',
        message: 'Por favor ingrese una dirección de correo institucional válida.'
      });
      setActiveTab('GENERAL');
      return false;
    }
    return true;
  };

  const handleSave = (redirectToList = false) => {
    if (!validateForm()) return;

    if (isNew) {
      const newUser = { ...formData } as User;
      store.addUser(newUser);
      if (redirectToList) {
        navigate('/usuarios');
      } else {
        // Permanecer en la edición del nuevo usuario sin reiniciar
        navigate(`/usuarios/${newUser.id}`, { replace: true });
        toast.showToast({
          type: 'success',
          title: 'Progreso Guardado',
          message: `Usuario "${newUser.name}" registrado exitosamente. Puede continuar configurando roles y permisos directos.`
        });
      }
    } else {
      store.updateUser(formData as User);
      if (redirectToList) {
        navigate('/usuarios');
      } else {
        toast.showToast({
          type: 'success',
          title: 'Cambios Guardados',
          message: `Se actualizaron las configuraciones del usuario "${formData.name}".`
        });
      }
    }
  };

  const handleNextStep = () => {
    if (currentStepIndex < STEPS.length - 1) {
      setActiveTab(STEPS[currentStepIndex + 1].key);
    }
  };

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      setActiveTab(STEPS[currentStepIndex - 1].key);
    }
  };

  const handleDelete = () => {
    if (!formData.id) return;
    setErrorMessage(null);
    const res = store.deleteUser(formData.id);
    if (!res.success) {
      setErrorMessage(res.message || 'No se puede eliminar el usuario.');
      return;
    }
    navigate('/usuarios');
  };

  const toggleEntity = (entId: string) => {
    const current = formData.entities || [];
    const isRemoving = current.includes(entId);
    const next = isRemoving ? current.filter(e => e !== entId) : [...current, entId];
    const entName = store.entities.find(e => e.id === entId)?.name || entId;

    setFormData(prev => ({ ...prev, entities: next }));

    toast.showToast({
      type: isRemoving ? 'info' : 'success',
      title: isRemoving ? 'Entidad Desvinculada' : 'Entidad Vinculada',
      message: isRemoving ? `Se retiró el acceso a la entidad "${entName}".` : `Se concedió acceso a la entidad "${entName}".`
    });
  };

  const toggleProduct = (prodId: ProductCode) => {
    const current = formData.products || [];
    const isRemoving = current.includes(prodId);
    const next = isRemoving ? current.filter(p => p !== prodId) : [...current, prodId];
    const prodLabel = PRODUCT_OPTIONS.find(p => p.id === prodId)?.label || prodId;

    setFormData(prev => ({ ...prev, products: next }));

    toast.showToast({
      type: isRemoving ? 'info' : 'success',
      title: isRemoving ? 'Producto Deshabilitado' : 'Producto Habilitado',
      message: isRemoving ? `Se deshabilitó el producto "${prodLabel}".` : `Se habilitó el producto "${prodLabel}".`
    });
  };

  const toggleRole = (roleId: string) => {
    const current = formData.roles || [];
    const isRemoving = current.includes(roleId);
    const next = isRemoving ? current.filter(r => r !== roleId) : [...current, roleId];
    const roleName = store.roles.find(r => r.id === roleId)?.name || roleId;

    setFormData(prev => ({ ...prev, roles: next }));

    toast.showToast({
      type: isRemoving ? 'info' : 'success',
      title: isRemoving ? 'Rol Desvinculado' : 'Rol Asignado',
      message: isRemoving ? `Se retiró el rol "${roleName}" del usuario.` : `Se asignó el rol "${roleName}" al usuario.`
    });
  };

  const toggleDirectPermission = (permId: string) => {
    const permDef = store.permissions.find(p => p.id === permId);
    const current = formData.directPermissions || [];
    const exists = current.some(p => p.permissionId === permId);

    if (exists) {
      setFormData(prev => ({
        ...prev,
        directPermissions: (prev.directPermissions || []).filter(p => p.permissionId !== permId)
      }));
      toast.showToast({
        type: 'info',
        title: 'Excepción de Permiso Revocada',
        message: `Se retiró el permiso directo "${permDef?.label || permId}".`
      });
    } else {
      const newPerm: RolePermission = {
        permissionId: permId,
        formatScope: {
          mode: permDef?.admitsFormat ? 'ALL' : 'NOT_APPLICABLE',
          formatIds: []
        }
      };
      setFormData(prev => ({
        ...prev,
        directPermissions: [...(prev.directPermissions || []), newPerm]
      }));
      toast.showToast({
        type: 'success',
        title: 'Permiso Directo Concedido',
        message: `Se asignó como excepción directa la acción "${permDef?.label || permId}".`
      });
    }
  };

  const updateDirectScope = (permId: string, mode: 'ALL' | 'SELECTED', formatIds: string[]) => {
    setFormData(prev => {
      const current = prev.directPermissions || [];
      const updated = current.map(p => {
        if (p.permissionId === permId) {
          return { ...p, formatScope: { mode, formatIds } };
        }
        return p;
      });
      return { ...prev, directPermissions: updated };
    });
  };

  // Filtrado de permisos directos
  const filteredDirectPermissions = store.permissions.filter(p => {
    const matchSearch = p.label.toLowerCase().includes(directSearch.toLowerCase()) ||
      p.code.toLowerCase().includes(directSearch.toLowerCase()) ||
      p.module.toLowerCase().includes(directSearch.toLowerCase()) ||
      p.description.toLowerCase().includes(directSearch.toLowerCase());

    let matchCategory = true;
    if (directCategoryFilter === 'ANALITICA') {
      matchCategory = p.module === 'Analítica' || p.functionality === 'Analítica' || p.resource === 'AnálisisInformación' || p.code.startsWith('ANL_');
    } else if (directCategoryFilter === 'TOTAL_REPORT') {
      matchCategory = p.product === 'TOTAL_REPORT';
    } else if (directCategoryFilter === 'TOTAL_SUPERVISION') {
      matchCategory = p.product === 'TOTAL_SUPERVISION';
    } else if (directCategoryFilter === 'TOTALIA') {
      matchCategory = p.product === 'TOTALIA';
    } else if (directCategoryFilter === 'SECURITY_RBAC') {
      matchCategory = p.product === 'SECURITY_RBAC';
    }

    return matchSearch && matchCategory;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto flex flex-col pb-12">
      {/* Header con acciones principales */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 pt-2 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <Link to="/usuarios" className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold text-slate-900">
                {isNew ? 'Nuevo Usuario del Sistema' : formData.name || 'Editar Usuario'}
              </h2>
              <Badge variant={formData.status === 'ACTIVE' ? 'success' : formData.status === 'SUSPENDED' ? 'warning' : 'neutral'}>
                {formData.status === 'ACTIVE' ? 'Activo' : formData.status === 'SUSPENDED' ? 'Suspendido' : 'Inactivo'}
              </Badge>
              <Badge variant={formData.type === 'HUMAN' ? 'neutral' : 'info'}>
                {formData.type === 'HUMAN' ? 'Humano' : 'Servicio API'}
              </Badge>
            </div>
            <p className="text-slate-500 text-xs mt-1">
              {isNew 
                ? 'Flujo de creación guiada de usuario: complete identidad, entidades, roles y permisos directos.' 
                : `${formData.identity || 'Sin ID'} • ${formData.email || 'Sin correo'} • Modo de Edición`}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!isNew && (
            <Button
              variant="secondary"
              onClick={handleDelete}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
            >
              <Trash2 className="w-4 h-4 mr-1.5" /> Eliminar
            </Button>
          )}
          <Button variant="secondary" onClick={() => navigate('/usuarios')}>
            <X className="w-4 h-4 mr-1.5" /> Salir
          </Button>
          <Button 
            variant="secondary" 
            onClick={() => handleSave(false)}
            className="border-brand-primary/30 text-brand-primary hover:bg-brand-primary/5"
          >
            <Save className="w-4 h-4 mr-1.5" /> Guardar y Continuar Editando
          </Button>
          <Button onClick={() => handleSave(true)} className="bg-brand-primary text-white hover:bg-brand-primary/90">
            <CheckCircle2 className="w-4 h-4 mr-1.5" /> Guardar y Finalizar
          </Button>
        </div>
      </header>

      {/* Error message banner */}
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-start gap-3 text-red-800">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-sm">Operación bloqueada</p>
            <p className="text-xs text-red-700 mt-0.5">{errorMessage}</p>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-red-400 hover:text-red-700 text-sm font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Wizard Step Bar / Navigation Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 bg-slate-100/80 p-1.5 rounded-xl border border-slate-200">
        {STEPS.map((step) => {
          const Icon = step.icon;
          const isActive = activeTab === step.key;
          return (
            <button
              key={step.key}
              type="button"
              onClick={() => setActiveTab(step.key)}
              className={cn(
                "px-3 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center sm:justify-start gap-2 text-left",
                isActive 
                  ? "bg-white text-brand-primary shadow-sm border border-slate-200/80" 
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
              )}
            >
              <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold",
                isActive ? "bg-brand-primary text-white" : "bg-slate-200 text-slate-600"
              )}>
                {step.stepNumber}
              </div>
              <span className="truncate">{step.label.replace(/^\d+\.\s*/, '')}</span>
            </button>
          );
        })}
      </div>

      {/* Main Step Container */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex-1 flex flex-col justify-between">
        {/* Step 1: GENERAL */}
        {activeTab === 'GENERAL' && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                Paso 1: Información Básica e Identidad
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Defina los datos personales, identificación de empleado, tipo de cuenta y estado operativo.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  placeholder="Ej: Ana María Gómez"
                  value={formData.name || ''}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Identificador de Empleado / ID *</label>
                <input
                  type="text"
                  placeholder="Ej: EMP-009"
                  value={formData.identity || ''}
                  onChange={e => setFormData({ ...formData, identity: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm font-mono focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Correo Institucional *</label>
                <input
                  type="email"
                  placeholder="usuario@total.com"
                  value={formData.email || ''}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tipo de Usuario</label>
                  <select
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm bg-white focus:border-brand-primary outline-none"
                  >
                    <option value="HUMAN">Humano</option>
                    <option value="SERVICE">Servicio / API</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Estado de Acceso</label>
                  <select
                    value={formData.status}
                    onChange={e => {
                      const newStatus = e.target.value as any;
                      setFormData({ ...formData, status: newStatus });
                      toast.showToast({
                        type: newStatus === 'ACTIVE' ? 'success' : 'warning',
                        title: 'Estado de Usuario Actualizado',
                        message: `El usuario quedó en estado ${newStatus === 'ACTIVE' ? 'Activo' : newStatus === 'SUSPENDED' ? 'Suspendido' : 'Inactivo'}.`
                      });
                    }}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm bg-white focus:border-brand-primary outline-none font-medium"
                  >
                    <option value="ACTIVE">Activo</option>
                    <option value="SUSPENDED">Suspendido</option>
                    <option value="INACTIVE">Inactivo</option>
                  </select>
                </div>
              </div>
            </div>

            {formData.status !== 'ACTIVE' && (
              <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-lg flex items-center gap-2.5 text-amber-800 text-xs mt-4">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                <span>
                  <strong>Atención:</strong> Un usuario con estado {formData.status === 'SUSPENDED' ? 'Suspendido' : 'Inactivo'} no tendrá acceso operativo a ninguna funcionalidad ni permisos efectivos en el sistema.
                </span>
              </div>
            )}
          </div>
        )}

        {/* Step 2: ENTITIES & PRODUCTS */}
        {activeTab === 'ENTITIES_PRODUCTS' && (
          <div className="space-y-8">
            <div>
              <div className="border-b border-slate-100 pb-3 mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Paso 2: Entidades Financieras y Productos del Ecosistema
                  </h3>
                  <p className="text-xs text-slate-500">
                    Seleccione las entidades autorizadas y los productos habilitados para este usuario.
                  </p>
                </div>
                <Badge variant="info">
                  {formData.entities?.length || 0} Entidades • {formData.products?.length || 0} Productos
                </Badge>
              </div>

              {/* Entidades */}
              <div className="mb-6">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
                  1. Entidades Financieras Autorizadas
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {store.entities.map(ent => {
                    const isChecked = formData.entities?.includes(ent.id);
                    return (
                      <div
                        key={ent.id}
                        onClick={() => toggleEntity(ent.id)}
                        className={cn(
                          "p-3.5 border rounded-xl cursor-pointer transition-all flex items-center gap-3 select-none",
                          isChecked ? "border-brand-primary bg-brand-primary/5 shadow-sm" : "border-slate-200 hover:border-slate-300 bg-slate-50/50"
                        )}
                      >
                        <div className={cn(
                          "w-5 h-5 rounded border flex items-center justify-center transition-colors",
                          isChecked ? "bg-brand-primary border-brand-primary text-white" : "bg-white border-slate-300"
                        )}>
                          {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-sm text-slate-900">{ent.name}</p>
                          <p className="text-[11px] font-mono text-slate-500">{ent.id}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Productos */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
                  2. Productos Habilitados
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {PRODUCT_OPTIONS.map(prod => {
                    const isChecked = formData.products?.includes(prod.id);
                    return (
                      <div
                        key={prod.id}
                        onClick={() => toggleProduct(prod.id)}
                        className={cn(
                          "p-3.5 border rounded-xl cursor-pointer transition-all flex items-start gap-3 select-none",
                          isChecked ? "border-brand-primary bg-brand-primary/5 shadow-sm" : "border-slate-200 hover:border-slate-300 bg-slate-50/50"
                        )}
                      >
                        <div className={cn(
                          "w-5 h-5 mt-0.5 rounded border flex items-center justify-center transition-colors",
                          isChecked ? "bg-brand-primary border-brand-primary text-white" : "bg-white border-slate-300"
                        )}>
                          {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                        <div>
                          <h4 className={cn("text-sm font-bold", isChecked ? "text-brand-primary" : "text-slate-800")}>
                            {prod.label}
                          </h4>
                          <p className="text-xs text-slate-500 mt-0.5">{prod.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: ROLES */}
        {activeTab === 'ROLES' && (
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Paso 3: Roles del Sistema Asignados
                </h3>
                <p className="text-xs text-slate-500">
                  Marque los roles que desea conceder a este usuario. Sus permisos se consolidarán automáticamente.
                </p>
              </div>
              <Badge variant="info">
                {formData.roles?.length || 0} Roles Asignados
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {store.roles.map(role => {
                const isSelected = formData.roles?.includes(role.id);
                return (
                  <div
                    key={role.id}
                    onClick={() => toggleRole(role.id)}
                    className={cn(
                      "p-4 border rounded-xl cursor-pointer transition-all flex items-start gap-3.5 select-none",
                      isSelected ? "border-brand-primary bg-brand-primary/5 shadow-sm" : "border-slate-200 hover:border-slate-300 bg-slate-50/30"
                    )}
                  >
                    <div className={cn(
                      "w-5 h-5 mt-0.5 rounded border flex items-center justify-center transition-colors",
                      isSelected ? "bg-brand-primary border-brand-primary text-white" : "bg-white border-slate-300"
                    )}>
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-bold text-slate-900">{role.name}</span>
                        <Badge variant={role.status === 'PUBLISHED' ? 'success' : 'neutral'} className="text-[10px]">
                          {role.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{role.description}</p>
                      <div className="flex flex-wrap gap-1.5 mt-2.5">
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border">
                          {role.code}
                        </span>
                        {role.products.map(p => (
                          <span key={p} className="text-[10px] px-1.5 py-0.5 rounded bg-brand-primary/10 text-brand-primary font-medium">
                            {p}
                          </span>
                        ))}
                        <span className="text-[10px] text-slate-400 self-center">
                          {role.permissions.length} acciones
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 4: DIRECT_PERMS */}
        {activeTab === 'DIRECT_PERMS' && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Key className="w-4 h-4 text-amber-600" /> Paso 4: Permisos Directos y Excepciones Individuales
                </h3>
                <p className="text-xs text-slate-500">
                  Asigne facultades operativas directas al usuario sin necesidad de crear un nuevo rol (incluyendo construcción, edición, eliminación y asignación de análisis de información).
                </p>
              </div>
              <Badge variant="warning" className="self-start sm:self-auto">
                {formData.directPermissions?.length || 0} Excepciones Asignadas
              </Badge>
            </div>

            {/* Quick Category Chips & Search Bar */}
            <div className="space-y-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="relative flex-1 w-full">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Buscar por nombre, código o módulo (ej: Análisis, Construcción, Edición)..."
                    value={directSearch}
                    onChange={e => setDirectSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                  />
                </div>
              </div>

              {/* Filtros por Categoría / Funcionalidad */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] font-semibold text-slate-500 mr-1 flex items-center gap-1">
                  <SlidersHorizontal className="w-3 h-3" /> Filtrar por:
                </span>
                <button
                  type="button"
                  onClick={() => setDirectCategoryFilter('ALL')}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors border",
                    directCategoryFilter === 'ALL' 
                      ? "bg-brand-primary text-white border-brand-primary" 
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                  )}
                >
                  Todos ({store.permissions.length})
                </button>
                <button
                  type="button"
                  onClick={() => setDirectCategoryFilter('ANALITICA')}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-xs font-bold transition-colors border flex items-center gap-1",
                    directCategoryFilter === 'ANALITICA' 
                      ? "bg-emerald-700 text-white border-emerald-700 shadow-xs" 
                      : "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                  )}
                >
                  <Sparkles className="w-3 h-3" /> Análisis de Información & Analítica
                </button>
                <button
                  type="button"
                  onClick={() => setDirectCategoryFilter('TOTAL_REPORT')}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors border",
                    directCategoryFilter === 'TOTAL_REPORT' 
                      ? "bg-brand-primary text-white border-brand-primary" 
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                  )}
                >
                  TÓTAL REPORT®
                </button>
                <button
                  type="button"
                  onClick={() => setDirectCategoryFilter('TOTAL_SUPERVISION')}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors border",
                    directCategoryFilter === 'TOTAL_SUPERVISION' 
                      ? "bg-brand-primary text-white border-brand-primary" 
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                  )}
                >
                  TÓTAL SUPERVISIÓN®
                </button>
                <button
                  type="button"
                  onClick={() => setDirectCategoryFilter('TOTALIA')}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors border",
                    directCategoryFilter === 'TOTALIA' 
                      ? "bg-brand-primary text-white border-brand-primary" 
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                  )}
                >
                  TOTALiA
                </button>
                <button
                  type="button"
                  onClick={() => setDirectCategoryFilter('SECURITY_RBAC')}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors border",
                    directCategoryFilter === 'SECURITY_RBAC' 
                      ? "bg-brand-primary text-white border-brand-primary" 
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                  )}
                >
                  Seguridad / RBAC
                </button>
              </div>
            </div>

            {/* Listado de Permisos Directos */}
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {filteredDirectPermissions.length === 0 ? (
                <div className="text-center py-10 border border-dashed rounded-xl text-slate-500">
                  <Key className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="font-semibold text-sm">No se encontraron acciones con los filtros actuales</p>
                  <button 
                    type="button"
                    onClick={() => { setDirectSearch(''); setDirectCategoryFilter('ALL'); }}
                    className="text-xs text-brand-primary hover:underline mt-1 font-medium"
                  >
                    Restablecer filtros
                  </button>
                </div>
              ) : (
                filteredDirectPermissions.map(perm => {
                  const directEntry = formData.directPermissions?.find(dp => dp.permissionId === perm.id);
                  const isAssigned = !!directEntry;
                  const isAnaliticaAction = perm.resource === 'AnálisisInformación' || perm.module === 'Analítica';

                  return (
                    <div
                      key={perm.id}
                      className={cn(
                        "p-4 border rounded-xl transition-all space-y-3",
                        isAssigned 
                          ? "border-amber-300 bg-amber-50/40 shadow-xs" 
                          : isAnaliticaAction 
                            ? "border-emerald-200 bg-emerald-50/20 hover:border-emerald-300"
                            : "border-slate-200 bg-white hover:border-slate-300"
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <button
                            type="button"
                            onClick={() => toggleDirectPermission(perm.id)}
                            className={cn(
                              "w-5 h-5 mt-0.5 rounded border flex items-center justify-center transition-colors shrink-0",
                              isAssigned ? "bg-amber-600 border-amber-600 text-white" : "border-slate-300 bg-white hover:border-slate-400"
                            )}
                          >
                            {isAssigned && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </button>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-sm text-slate-900">{perm.label}</span>
                              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border">
                                {perm.code}
                              </span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-primary/10 text-brand-primary font-medium">
                                {perm.product}
                              </span>
                              {isAnaliticaAction && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                                  Análisis de Información
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-600 mt-1">{perm.description}</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              Módulo: <strong>{perm.module}</strong> • Recurso: <strong>{perm.resource}</strong> • Acción: <strong>{perm.action}</strong>
                            </p>
                          </div>
                        </div>

                        <div>
                          {isAssigned ? (
                            <button
                              type="button"
                              onClick={() => toggleDirectPermission(perm.id)}
                              className="text-xs font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 px-3 py-1 rounded-full transition-colors"
                            >
                              ✓ Concedido (Revocar)
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => toggleDirectPermission(perm.id)}
                              className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                            >
                              + Asignar Excepción
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Alcance de formatos si aplica */}
                      {isAssigned && perm.admitsFormat && (
                        <div className="pl-8 pt-2 border-t border-amber-200/60 flex flex-col sm:flex-row sm:items-center gap-3 text-xs">
                          <span className="font-semibold text-slate-700">Alcance de Formato:</span>
                          <div className="flex items-center gap-4">
                            <label className="flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="radio"
                                name={`direct-fmt-${perm.id}`}
                                checked={directEntry.formatScope?.mode === 'ALL'}
                                onChange={() => updateDirectScope(perm.id, 'ALL', [])}
                                className="text-amber-600 focus:ring-amber-500"
                              />
                              <span className="text-slate-800 font-medium">Todos los Formatos</span>
                            </label>
                            <label className="flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="radio"
                                name={`direct-fmt-${perm.id}`}
                                checked={directEntry.formatScope?.mode === 'SELECTED'}
                                onChange={() => updateDirectScope(perm.id, 'SELECTED', directEntry.formatScope?.formatIds?.length ? directEntry.formatScope.formatIds : ['FMT-458'])}
                                className="text-amber-600 focus:ring-amber-500"
                              />
                              <span className="text-slate-800 font-medium">Formatos Específicos</span>
                            </label>
                          </div>

                          {directEntry.formatScope?.mode === 'SELECTED' && (
                            <div className="flex flex-wrap items-center gap-1.5 pl-2">
                              {store.formats.map(fmt => {
                                const isFmtChecked = (directEntry.formatScope?.formatIds || []).includes(fmt.id);
                                return (
                                  <button
                                    type="button"
                                    key={fmt.id}
                                    onClick={() => {
                                      const currentFmts = directEntry.formatScope?.formatIds || [];
                                      const nextFmts = isFmtChecked
                                        ? currentFmts.filter(f => f !== fmt.id)
                                        : [...currentFmts, fmt.id];
                                      updateDirectScope(perm.id, 'SELECTED', nextFmts);
                                    }}
                                    className={cn(
                                      "px-2 py-0.5 rounded text-[10px] font-bold border transition-colors",
                                      isFmtChecked 
                                        ? "bg-amber-600 text-white border-amber-600" 
                                        : "bg-white text-slate-600 border-slate-300 hover:border-slate-400"
                                    )}
                                  >
                                    {fmt.name}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Step 5: EFFECTIVE */}
        {activeTab === 'EFFECTIVE' && (
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-brand-primary" /> Paso 5: Resumen de Acceso y Permisos Efectivos
                </h3>
                <p className="text-xs text-slate-500">
                  Consolidación en tiempo real de todos los permisos que este usuario tendrá habilitados en el ecosistema.
                </p>
              </div>
              <Badge variant={effectivePermissions.length > 0 ? "success" : "warning"}>
                {effectivePermissions.length} {effectivePermissions.length === 1 ? 'Acción Habilitada' : 'Acciones Habilitadas'}
              </Badge>
            </div>

            {effectivePermissions.length > 0 ? (
              <div className="overflow-x-auto border border-slate-200 rounded-lg max-h-[460px] overflow-y-auto">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 sticky top-0 z-10 shadow-xs">
                    <tr>
                      <th className="px-4 py-3">Acción / Código</th>
                      <th className="px-4 py-3">Producto & Funcionalidad</th>
                      <th className="px-4 py-3">Alcance por Formato</th>
                      <th className="px-4 py-3">Entidades Autorizadas</th>
                      <th className="px-4 py-3">Origen del Privilegio</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {effectivePermissions.map((ep, idx) => (
                      <tr key={`${ep.permission.id}-${idx}`} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-bold text-slate-900">{ep.permission.label}</p>
                          <p className="text-[10px] font-mono text-slate-400">{ep.permission.code}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-medium text-brand-primary">{ep.permission.product}</span>
                          <span className="text-slate-400 mx-1">•</span>
                          <span className="text-slate-600">{ep.permission.functionality}</span>
                        </td>
                        <td className="px-4 py-3">
                          {ep.formatScopeMode === 'NOT_APPLICABLE' ? (
                            <span className="text-slate-400 italic">No aplica</span>
                          ) : ep.formatScopeMode === 'ALL' ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                              Todos los Formatos
                            </span>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {ep.formatIds.map(fid => {
                                const fmt = store.formats.find(f => f.id === fid);
                                return (
                                  <span key={fid} className="px-2 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-700 font-bold text-[10px]">
                                    {fmt?.name || fid}
                                  </span>
                                );
                              })}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {ep.sourceEntity}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-600">
                          {ep.isDirect ? (
                            <span className="inline-flex items-center gap-1 text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-[11px] font-bold">
                              <Key className="w-3 h-3 text-amber-600" /> {ep.sourceRole}
                            </span>
                          ) : (
                            <span className="text-slate-700 font-medium">
                              {ep.sourceRole}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 border border-dashed rounded-lg text-slate-500">
                <Shield className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="font-semibold text-sm text-slate-800">Sin permisos operativos activos</p>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                  {formData.status !== 'ACTIVE'
                    ? 'El usuario se encuentra suspendido o inactivo, por lo cual sus permisos han sido revocados temporalmente.'
                    : 'Asigne al menos un rol o permiso directo y asegúrese de que los productos correspondientes estén habilitados.'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Step Navigation Footer */}
        <div className="mt-8 pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={handlePrevStep}
            disabled={currentStepIndex === 0}
            className="w-full sm:w-auto"
          >
            <ChevronLeft className="w-4 h-4 mr-1" /> Paso Anterior
          </Button>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={() => handleSave(false)}
              className="w-full sm:w-auto"
            >
              <Save className="w-4 h-4 mr-1.5" /> Guardar Progreso
            </Button>

            {currentStepIndex < STEPS.length - 1 ? (
              <Button
                type="button"
                onClick={handleNextStep}
                className="bg-brand-primary text-white hover:bg-brand-primary/90 w-full sm:w-auto"
              >
                Continuar al Paso {currentStepIndex + 2} <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={() => handleSave(true)}
                className="bg-emerald-600 text-white hover:bg-emerald-700 w-full sm:w-auto font-bold"
              >
                <CheckCircle2 className="w-4 h-4 mr-1.5" /> Finalizar y Guardar Usuario
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
