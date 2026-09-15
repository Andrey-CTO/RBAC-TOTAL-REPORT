import { useState, useMemo, useEffect, useRef } from 'react';
import { useStore } from '../../lib/store';
import { useToast } from '../../context/ToastContext';
import { Badge, Button } from '../../components/ui/Shared';
import { 
  Cpu, 
  ShieldCheck, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  ChevronRight, 
  User as UserIcon, 
  Building2, 
  Layers, 
  FileCode2,
  Sparkles,
  Search,
  Play,
  RotateCcw,
  Check,
  X,
  SlidersHorizontal,
  Clock,
  Briefcase,
  Key,
  Shield,
  Filter,
  Loader2,
  CheckCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ProductCode, User } from '../../types/rbac';

const EVALUATION_STEPS = [
  { step: 1, title: 'Estado de Identidad', desc: 'Validando estado, vigencia y tipo de cuenta de la identidad...', progress: 20 },
  { step: 2, title: 'Jurisdicción de Entidad', desc: 'Comprobando asignación y límites jurisdiccionales en la entidad...', progress: 40 },
  { step: 3, title: 'Suscripción de Producto', desc: 'Verificando licenciamiento activo del producto contratado...', progress: 60 },
  { step: 4, title: 'Concesión RBAC y Excepciones', desc: 'Auditando matriz de roles asignados y permisos directos autorizados...', progress: 80 },
  { step: 5, title: 'Alcance de Formato Regulatorio', desc: 'Evaluando restricciones por formato y alcances operativos...', progress: 95 },
  { step: 6, title: 'Dictamen Final Determinista', desc: 'Consolidando veredicto de política bajo modelo Zero-Trust...', progress: 100 },
];

export function EvaluadorPoliticasView() {
  const { users, roles, permissions, entities, environments, formats } = useStore();
  const toast = useToast();

  // Selected parameters for evaluation
  const [selectedUserId, setSelectedUserId] = useState<string>(users[0]?.id || '');
  const [selectedEntityId, setSelectedEntityId] = useState<string>(entities[0]?.id || '');
  const [selectedEnvId, setSelectedEnvId] = useState<string>(environments[0]?.id || '');
  const [selectedProduct, setSelectedProduct] = useState<ProductCode>('TOTAL_REPORT');
  const [selectedPermId, setSelectedPermId] = useState<string>('PERM-TX-SEND');
  const [selectedFormatId, setSelectedFormatId] = useState<string>('FMT-458');

  // Search filter for identity
  const [userSearch, setUserSearch] = useState('');
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  // Search filter for permissions
  const [permSearch, setPermSearch] = useState('');

  // Evaluation execution state & multi-step progress
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evalStepIndex, setEvalStepIndex] = useState<number>(0);
  const [evalProgress, setEvalProgress] = useState<number>(100);
  const [completedSteps, setCompletedSteps] = useState<number[]>([1, 2, 3, 4, 5, 6]);
  const [lastEvaluatedAt, setLastEvaluatedAt] = useState<string>(new Date().toLocaleTimeString());
  const [evaluationRunCount, setEvaluationRunCount] = useState(1);

  const evalTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Active target user
  const currentUser = useMemo(() => users.find(u => u.id === selectedUserId) || users[0], [users, selectedUserId]);

  // Filtered users for search
  const filteredUsers = useMemo(() => {
    if (!userSearch.trim()) return users;
    const term = userSearch.toLowerCase();
    return users.filter(u => 
      u.name.toLowerCase().includes(term) ||
      u.identity.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term) ||
      (u.roles || []).some(rId => {
        const rName = roles.find(r => r.id === rId)?.name || '';
        return rName.toLowerCase().includes(term);
      })
    );
  }, [users, userSearch, roles]);

  // Permissions filtered by product and search
  const availablePermissions = useMemo(() => {
    return permissions.filter(p => p.product === selectedProduct);
  }, [permissions, selectedProduct]);

  const filteredPermissions = useMemo(() => {
    if (!permSearch.trim()) return availablePermissions;
    const term = permSearch.toLowerCase();
    return availablePermissions.filter(p => 
      p.label.toLowerCase().includes(term) ||
      p.code.toLowerCase().includes(term) ||
      p.module.toLowerCase().includes(term) ||
      p.description.toLowerCase().includes(term)
    );
  }, [availablePermissions, permSearch]);

  // Current permission selection
  const currentPerm = useMemo(() => {
    return permissions.find(p => p.id === selectedPermId) || availablePermissions[0] || permissions[0];
  }, [permissions, selectedPermId, availablePermissions]);

  // Policy Evaluation Engine
  const evaluationResult = useMemo(() => {
    if (!currentUser || !currentPerm) {
      return {
        allowed: false,
        reason: 'Parámetros insuficientes para la evaluación de políticas.',
        grantingRole: null,
        checks: []
      };
    }

    // Step 1: User Account State
    const isUserActive = currentUser.status === 'ACTIVE';
    const check1 = {
      title: '1. Estado de la Identidad',
      pass: isUserActive,
      detail: isUserActive 
        ? `Cuenta activa (${currentUser.type === 'HUMAN' ? 'Humano' : 'Servicio API'})` 
        : `Cuenta en estado ${currentUser.status}. Todo acceso se revoca de inmediato.`
    };

    // Step 2: Entity Jurisdiction
    const hasEntity = (currentUser.entities || []).includes(selectedEntityId);
    const entityObj = entities.find(e => e.id === selectedEntityId);
    const check2 = {
      title: '2. Jurisdicción de Entidad',
      pass: hasEntity,
      detail: hasEntity 
        ? `Entidad ${entityObj?.name || selectedEntityId} asignada en el perfil del usuario.` 
        : `El usuario no tiene asignada la entidad ${entityObj?.name || selectedEntityId}.`
    };

    // Step 3: Product Enabled
    const hasProduct = (currentUser.products || []).includes(currentPerm.product);
    const check3 = {
      title: '3. Habilitación de Producto',
      pass: hasProduct,
      detail: hasProduct 
        ? `Producto ${currentPerm.product} activo en los servicios contratados de la cuenta.` 
        : `La cuenta no tiene habilitado el producto ${currentPerm.product}.`
    };

    // Step 4: Role / Direct Grant
    const userRoleIds = currentUser.roles || [];
    const matchingRoles = roles.filter(r => userRoleIds.includes(r.id));
    
    let grantingRole = null;
    let formatScope = null;
    let isDirectGrant = false;

    for (const role of matchingRoles) {
      const grant = role.permissions.find(p => p.permissionId === currentPerm.id);
      if (grant) {
        grantingRole = role;
        formatScope = grant.formatScope;
        break;
      }
    }

    if (!grantingRole && currentUser.directPermissions) {
      const directGrant = currentUser.directPermissions.find(p => p.permissionId === currentPerm.id);
      if (directGrant) {
        isDirectGrant = true;
        formatScope = directGrant.formatScope;
      }
    }

    const check4 = {
      title: '4. Concesión de Permiso',
      pass: !!grantingRole || isDirectGrant,
      detail: grantingRole 
        ? `Otorgado por el rol "${grantingRole.name}" (v${grantingRole.version}).` 
        : isDirectGrant
        ? `Otorgado como asignación directa (excepción individual autorizada para el usuario).`
        : `Ningún rol ni asignación directa confiere el permiso "${currentPerm.label}".`
    };

    // Step 5: Format Scope Constraint
    let formatAllowed = true;
    let formatReason = 'Formato autorizado sin restricciones.';

    if (!currentPerm.admitsFormat) {
      formatAllowed = true;
      formatReason = 'Esta acción no discrimina por formato (aplica de manera transversal al módulo).';
    } else if ((grantingRole || isDirectGrant) && formatScope) {
      if (formatScope.mode === 'ALL') {
        formatAllowed = true;
        formatReason = grantingRole 
          ? `El rol "${grantingRole.name}" concede acceso a TODOS los formatos.`
          : `La asignación directa concede acceso a TODOS los formatos.`;
      } else if (formatScope.mode === 'SELECTED') {
        const hasFmt = (formatScope.formatIds || []).includes(selectedFormatId);
        if (!hasFmt) {
          formatAllowed = false;
          formatReason = `Restringe la acción exclusivamente a [${(formatScope.formatIds || []).join(', ')}]. El formato ${selectedFormatId} no está autorizado.`;
        } else {
          formatAllowed = true;
          formatReason = `El formato ${selectedFormatId} se encuentra dentro de la lista explícita autorizada.`;
        }
      }
    }

    const check5 = {
      title: '5. Alcance de Formato Operativo',
      pass: formatAllowed,
      detail: formatReason
    };

    const checks = [check1, check2, check3, check4, check5];
    const overallAllowed = checks.every(c => c.pass);

    let mainReason = '';
    if (overallAllowed) {
      mainReason = `El usuario "${currentUser.name}" cumple con todas las directrices de seguridad y políticas RBAC para ejecutar "${currentPerm.label}" sobre la entidad y formato seleccionados.`;
    } else {
      const failed = checks.filter(c => !c.pass);
      mainReason = `Operación denegada por falla en ${failed.length} regla(s) de política: ${failed.map(f => f.title).join(', ')}.`;
    }

    return {
      allowed: overallAllowed,
      reason: mainReason,
      grantingRole,
      checks
    };
  }, [currentUser, currentPerm, selectedEntityId, selectedFormatId, entities, roles]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (evalTimerRef.current) clearInterval(evalTimerRef.current);
    };
  }, []);

  // Multi-step animated evaluation trigger
  const handleExecuteEvaluation = () => {
    if (isEvaluating) return;
    setIsEvaluating(true);
    setEvalStepIndex(0);
    setEvalProgress(10);
    setCompletedSteps([]);

    let currentStep = 0;
    const stepInterval = 280; // Smooth 280ms per step

    evalTimerRef.current = setInterval(() => {
      currentStep += 1;
      
      if (currentStep < EVALUATION_STEPS.length) {
        setEvalStepIndex(currentStep);
        setEvalProgress(EVALUATION_STEPS[currentStep].progress);
        setCompletedSteps(prev => [...prev, currentStep]);
      } else {
        if (evalTimerRef.current) clearInterval(evalTimerRef.current);
        setEvalStepIndex(EVALUATION_STEPS.length - 1);
        setEvalProgress(100);
        setCompletedSteps([1, 2, 3, 4, 5, 6]);
        setIsEvaluating(false);
        setLastEvaluatedAt(new Date().toLocaleTimeString());
        setEvaluationRunCount(prev => prev + 1);

        const allowed = evaluationResult.allowed;
        toast.showToast({
          type: allowed ? 'success' : 'warning',
          title: allowed ? 'Evaluación: Acceso Permitido' : 'Evaluación: Acceso Denegado',
          message: allowed 
            ? `La identidad "${currentUser?.name}" cumple con todas las políticas para "${currentPerm?.label}".`
            : `Operación bloqueada por directrices RBAC para "${currentUser?.name}".`
        });
      }
    }, stepInterval);
  };

  // Critical Operations Matrix for Current User
  const criticalCapabilities = useMemo(() => {
    if (!currentUser) return [];

    const criticalPermCodes = [
      { code: 'SIG_EXEC', name: 'Firmar Formato Regulatorio', permId: 'PERM-SIGNATURE-SIGN', prod: 'TOTAL_REPORT' as ProductCode },
      { code: 'TX_SEND', name: 'Transmitir / Enviar a Superfinanciera', permId: 'PERM-TX-SEND', prod: 'TOTAL_REPORT' as ProductCode },
      { code: 'TX_GENERATE', name: 'Generar Lote de Transmisión', permId: 'PERM-TX-GENERATE', prod: 'TOTAL_REPORT' as ProductCode },
      { code: 'VAL_EXEC', name: 'Ejecutar Validación de Integridad', permId: 'PERM-VALIDATION-EXEC', prod: 'TOTAL_REPORT' as ProductCode },
      { code: 'DATA_ADJUST', name: 'Modificar Datos Generados', permId: 'PERM-DATA-ADJUST', prod: 'TOTAL_REPORT' as ProductCode },
      { code: 'FORMAT_CONFIG', name: 'Configuración / Desbloqueo de Formatos', permId: 'PERM-FORMAT-CONFIG', prod: 'TOTAL_REPORT' as ProductCode },
      { code: 'SUP_CONSOLIDATE', name: 'Consolidación Entidades (Supervisión)', permId: 'PERM-SUP-CONSOLIDATE', prod: 'TOTAL_SUPERVISION' as ProductCode },
      { code: 'TAX_MAGNETIC', name: 'Liquidar Medios Magnéticos (DIAN)', permId: 'PERM-TAX-MAGNETIC', prod: 'TAX_REPORT' as ProductCode },
      { code: 'ROLE_ADMIN', name: 'Administrar Seguridad / RBAC', permId: 'PERM-ROLE-ADMIN', prod: 'SECURITY_RBAC' as ProductCode },
    ];

    const isUserActive = currentUser.status === 'ACTIVE';
    const userRoleIds = currentUser.roles || [];
    const userRoles = roles.filter(r => userRoleIds.includes(r.id));

    return criticalPermCodes.map(item => {
      if (!isUserActive) {
        return { ...item, allowed: false, reason: `Usuario ${currentUser.status}` };
      }
      if (!currentUser.products.includes(item.prod)) {
        return { ...item, allowed: false, reason: `Producto ${item.prod} no contratado` };
      }

      let grantRoleName: string | null = null;
      let scopeNote = '';

      for (const r of userRoles) {
        const g = r.permissions.find(p => p.permissionId === item.permId);
        if (g) {
          grantRoleName = r.name;
          scopeNote = g.formatScope.mode === 'SELECTED' ? `Solo [${g.formatScope.formatIds.join(', ')}]` : 'Todos los formatos';
          break;
        }
      }

      if (grantRoleName) {
        return { ...item, allowed: true, grantingRole: grantRoleName, scopeNote };
      } else {
        return { ...item, allowed: false, reason: 'Sin rol con este privilegio' };
      }
    });
  }, [currentUser, roles]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 max-w-7xl mx-auto w-full pb-10"
    >
      {/* Header with Title & Action */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-brand-primary/10 text-brand-primary">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900">Motor de Evaluación de Accesos y Políticas</h2>
              <p className="text-slate-500 text-xs md:text-sm mt-0.5">
                Motor de decisión determinista para auditar y verificar si una identidad puede ejecutar una acción en tiempo real
              </p>
            </div>
          </div>
        </div>

        {/* Global Action Bar */}
        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={handleExecuteEvaluation}
              disabled={isEvaluating}
              className="bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-bold px-4 py-2.5 shadow-sm shadow-brand-primary/20 flex items-center gap-2"
            >
              {isEvaluating ? (
                <RotateCcw className="w-4 h-4 animate-spin text-white" />
              ) : (
                <Play className="w-4 h-4 fill-white text-white" />
              )}
              <span>{isEvaluating ? 'Evaluando Políticas en Proceso...' : 'Ejecutar Evaluación de Políticas'}</span>
            </Button>
          </motion.div>
        </div>
      </header>

      {/* Real-time Evaluation Progress Bar Card (Active when evaluating or completed) */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className={`p-1.5 rounded-lg ${isEvaluating ? 'bg-amber-100 text-amber-700 animate-pulse' : 'bg-emerald-100 text-emerald-700'}`}>
              {isEvaluating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCheck className="w-4 h-4" />}
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 block">
                {isEvaluating ? 'Ejecutando Secuencia de Verificación de Políticas...' : 'Estado de la Evaluación'}
              </span>
              <p className="text-[11px] text-slate-500">
                {isEvaluating 
                  ? EVALUATION_STEPS[evalStepIndex]?.desc || 'Analizando parámetros de seguridad...' 
                  : `Evaluación determinista completada al 100% • Última ejecución: ${lastEvaluatedAt}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <span className="text-xs font-mono font-bold text-brand-primary bg-brand-primary/10 px-2.5 py-1 rounded-full border border-brand-primary/20">
              {evalProgress}%
            </span>
          </div>
        </div>

        {/* Animated Progress Bar */}
        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200">
          <motion.div 
            className="h-full bg-gradient-to-r from-brand-primary via-blue-500 to-emerald-500 rounded-full"
            initial={{ width: '0%' }}
            animate={{ width: `${evalProgress}%` }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          />
        </div>

        {/* Multi-step checkpoints list */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-1">
          {EVALUATION_STEPS.map((s, idx) => {
            const isDone = completedSteps.includes(s.step) && (!isEvaluating || evalStepIndex >= idx);
            const isCurrent = isEvaluating && evalStepIndex === idx;

            return (
              <div 
                key={s.step} 
                className={`p-2 rounded-lg border text-[11px] transition-all ${
                  isCurrent 
                    ? 'bg-amber-50 border-amber-300 text-amber-900 ring-1 ring-amber-400 font-bold'
                    : isDone
                    ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900 font-medium'
                    : 'bg-slate-50 border-slate-200 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <span className="font-mono text-[9px] uppercase">Paso {s.step}</span>
                  {isDone ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  ) : isCurrent ? (
                    <Loader2 className="w-3.5 h-3.5 text-amber-600 animate-spin shrink-0" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                  )}
                </div>
                <p className="truncate text-[10px] leading-tight font-semibold">{s.title}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Parameter Selection + Diagnostic Decision Output */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Parameter Selection (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <UserIcon className="w-4 h-4 text-brand-primary" /> Parámetros de Evaluación y Contexto
            </h3>
            <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-medium flex items-center gap-1 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              En Vivo
            </span>
          </div>

          {/* 1. User Selector with Instant Search / Autocomplete */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                1. Identidad a Evaluar
              </label>
              <span className="text-[11px] text-slate-400">
                {users.length} usuarios en el sistema
              </span>
            </div>

            {/* Quick search input for users */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar por nombre, cédula o rol..."
                value={userSearch}
                onChange={e => {
                  setUserSearch(e.target.value);
                  setIsUserDropdownOpen(true);
                }}
                onFocus={() => setIsUserDropdownOpen(true)}
                className="w-full pl-9 pr-8 py-2 text-xs border border-slate-300 rounded-lg focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none bg-slate-50/50"
              />
              {userSearch && (
                <button
                  type="button"
                  onClick={() => {
                    setUserSearch('');
                    setIsUserDropdownOpen(false);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Dropdown list if user is searching */}
            <AnimatePresence>
              {isUserDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="relative z-20"
                >
                  <div className="absolute top-1 left-0 right-0 max-h-48 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-lg divide-y divide-slate-100 p-1">
                    {filteredUsers.length === 0 ? (
                      <div className="p-3 text-center text-xs text-slate-400">
                        No se encontraron usuarios con "{userSearch}"
                      </div>
                    ) : (
                      filteredUsers.map(u => {
                        const isSelected = u.id === selectedUserId;
                        return (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => {
                              setSelectedUserId(u.id);
                              setIsUserDropdownOpen(false);
                              setUserSearch('');
                            }}
                            className={`w-full text-left p-2 rounded-md text-xs flex items-center justify-between transition-colors ${
                              isSelected ? 'bg-brand-primary/10 text-brand-primary font-bold' : 'hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <div className="truncate pr-2">
                              <p className="font-semibold text-slate-900">{u.name}</p>
                              <p className="text-[10px] text-slate-400 font-mono">{u.identity} • {u.type}</p>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <Badge variant={u.status === 'ACTIVE' ? 'success' : 'danger'} className="text-[9px]">
                                {u.status}
                              </Badge>
                              {isSelected && <Check className="w-3.5 h-3.5 text-brand-primary" />}
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Native select as backup */}
            <select
              value={selectedUserId}
              onChange={e => {
                setSelectedUserId(e.target.value);
                setIsUserDropdownOpen(false);
              }}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-brand-primary outline-none bg-white font-medium mt-1"
            >
              {users.map(u => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.identity}) — {u.status === 'ACTIVE' ? 'Activo' : u.status}
                </option>
              ))}
            </select>

            {/* Current user badge strip */}
            {currentUser && (
              <motion.div 
                key={currentUser.id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex flex-wrap items-center justify-between gap-2"
              >
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-slate-700">Estado:</span>
                  <Badge variant={currentUser.status === 'ACTIVE' ? 'success' : 'danger'} className="text-[10px]">
                    {currentUser.status}
                  </Badge>
                  <span className="text-slate-300">•</span>
                  <span>{currentUser.type === 'HUMAN' ? 'Humano' : 'Servicio API'}</span>
                </div>
                <div className="text-[11px] text-slate-500 font-medium">
                  <strong>{currentUser.roles?.length || 0}</strong> roles • <strong>{currentUser.entities?.length || 0}</strong> entidades
                </div>
              </motion.div>
            )}
          </div>

          {/* 2 & 3. Entity & Environment */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                2. Entidad
              </label>
              <select
                value={selectedEntityId}
                onChange={e => setSelectedEntityId(e.target.value)}
                className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-brand-primary outline-none bg-white font-medium"
              >
                {entities.map(e => (
                  <option key={e.id} value={e.id}>{e.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                3. Ambiente
              </label>
              <select
                value={selectedEnvId}
                onChange={e => setSelectedEnvId(e.target.value)}
                className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-brand-primary outline-none bg-white font-medium"
              >
                {environments.map(env => (
                  <option key={env.id} value={env.id}>{env.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 4. Product Selection */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                4. Producto del Ecosistema
              </label>
              <select
                value={selectedProduct}
                onChange={e => {
                  const prod = e.target.value as ProductCode;
                  setSelectedProduct(prod);
                  const firstPermInProd = permissions.find(p => p.product === prod);
                  if (firstPermInProd) setSelectedPermId(firstPermInProd.id);
                }}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-brand-primary outline-none font-bold text-slate-800 bg-white"
              >
                <option value="TOTAL_REPORT">TÓTAL REPORT®</option>
                <option value="TOTAL_SUPERVISION">TÓTAL SUPERVISIÓN®</option>
                <option value="TAX_REPORT">TAX REPORT</option>
                <option value="TOTALIA">TOTALiA (IA Regulatoria)</option>
                <option value="SECURITY_RBAC">Seguridad / RBAC</option>
              </select>
            </div>

            {/* 5. Action / Permission */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  5. Acción / Permiso a Ejecutar
                </label>
                <span className="text-[10px] text-slate-400 font-mono">
                  {filteredPermissions.length} acciones
                </span>
              </div>

              {/* Permission filter box */}
              <div className="relative mb-1.5">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filtrar acciones del producto..."
                  value={permSearch}
                  onChange={e => setPermSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md outline-none focus:border-brand-primary"
                />
              </div>

              <select
                value={selectedPermId}
                onChange={e => setSelectedPermId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-brand-primary outline-none bg-white font-medium"
              >
                {filteredPermissions.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.label} ({p.code})
                  </option>
                ))}
              </select>
              {currentPerm && (
                <p className="text-[11px] text-slate-500 mt-1 italic leading-relaxed">
                  {currentPerm.description}
                </p>
              )}
            </div>

            {/* 6. Regulatory Format Scope */}
            {currentPerm?.admitsFormat && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="pt-2 border-t border-slate-100"
              >
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  6. Formato Regulatorio Objetivo
                </label>
                <select
                  value={selectedFormatId}
                  onChange={e => setSelectedFormatId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-brand-primary outline-none font-mono bg-white"
                >
                  {formats.map(f => (
                    <option key={f.id} value={f.id}>{f.name} ({f.id})</option>
                  ))}
                </select>
              </motion.div>
            )}
          </div>

          {/* Trigger Evaluation Button in Parameter Box */}
          <div className="pt-3 border-t border-slate-100">
            <motion.button
              type="button"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={handleExecuteEvaluation}
              disabled={isEvaluating}
              className="w-full py-2.5 px-4 rounded-lg bg-brand-primary text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs hover:bg-brand-primary-hover transition-colors"
            >
              {isEvaluating ? (
                <RotateCcw className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              <span>{isEvaluating ? 'Procesando Evaluación...' : 'Evaluar con Parámetros Seleccionados'}</span>
            </motion.button>
          </div>
        </div>

        {/* Right Column: Decision Outcome & Diagnostic Pipeline (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Main Verdict Card with Motion */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`${currentUser?.id}-${currentPerm?.id}-${selectedEntityId}-${selectedFormatId}-${evaluationRunCount}`}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className={`rounded-xl border p-6 shadow-sm relative overflow-hidden transition-all ${
                evaluationResult.allowed 
                  ? 'bg-emerald-50/80 border-emerald-300' 
                  : 'bg-rose-50/80 border-rose-300'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <motion.div 
                    initial={{ rotate: -10, scale: 0.8 }}
                    animate={{ rotate: 0, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                      evaluationResult.allowed 
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200' 
                        : 'bg-rose-600 text-white shadow-md shadow-rose-200'
                    }`}
                  >
                    {evaluationResult.allowed ? (
                      <ShieldCheck className="w-7 h-7 stroke-[2.5]" />
                    ) : (
                      <ShieldAlert className="w-7 h-7 stroke-[2.5]" />
                    )}
                  </motion.div>
                  <div>
                    <span className={`inline-block text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                      evaluationResult.allowed ? 'bg-emerald-200 text-emerald-900' : 'bg-rose-200 text-rose-900'
                    }`}>
                      Resultado de Evaluación
                    </span>
                    <h3 className={`text-2xl font-black mt-0.5 tracking-tight ${
                      evaluationResult.allowed ? 'text-emerald-950' : 'text-rose-950'
                    }`}>
                      {evaluationResult.allowed ? 'ACCESO PERMITIDO' : 'ACCESO DENEGADO'}
                    </h3>
                  </div>
                </div>
                
                <div className="text-right hidden sm:block">
                  <div className="flex items-center justify-end gap-1 text-[11px] text-slate-500 font-mono">
                    <Clock className="w-3 h-3" /> {lastEvaluatedAt}
                  </div>
                  <p className="text-xs font-semibold text-slate-700 mt-0.5">Strict Least Privilege (Zero-Trust)</p>
                </div>
              </div>

              <p className={`mt-4 text-xs md:text-sm leading-relaxed ${
                evaluationResult.allowed ? 'text-emerald-900' : 'text-rose-900 font-medium'
              }`}>
                {evaluationResult.reason}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Diagnostic 5-Step Pipeline with Motion */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Desglose de Puntos de Verificación de Política (5/5)
              </h4>
              <span className="text-[11px] font-semibold text-slate-400">
                Auditoría Determinista
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {evaluationResult.checks.map((check, idx) => (
                <motion.div 
                  key={idx} 
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05, duration: 0.2 }}
                  className="py-2.5 flex items-start gap-3"
                >
                  <div className="mt-0.5 shrink-0">
                    {check.pass ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-rose-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className={`text-xs md:text-sm font-semibold ${check.pass ? 'text-slate-800' : 'text-rose-900'}`}>
                        {check.title}
                      </p>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        check.pass ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {check.pass ? 'Cumplido' : 'Falla'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{check.detail}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Bottom Section: Matriz Rápida de Capacidades Críticas with Motion */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.3 }}
        className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand-primary" />
              Matriz Rápida de Capacidades Críticas para "{currentUser?.name}"
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Inspección preventiva de las 9 operaciones regulatorias de alto impacto en el ecosistema TÓTAL
            </p>
          </div>
          <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded font-medium">
            Entidad contextual: {entities.find(e => e.id === selectedEntityId)?.name}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs md:text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase">
              <tr>
                <th className="px-4 py-2.5">Operación / Capacidad Crítica</th>
                <th className="px-4 py-2.5">Módulo</th>
                <th className="px-4 py-2.5 text-center">Veredicto</th>
                <th className="px-4 py-2.5">Rol Concesionario / Motivo</th>
                <th className="px-4 py-2.5">Alcance de Formato</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {criticalCapabilities.map((cap, cIdx) => (
                <motion.tr 
                  key={cap.code} 
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: cIdx * 0.03 }}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <span className="font-semibold text-slate-900">{cap.name}</span>
                    <span className="text-xs font-mono text-slate-400 ml-2">[{cap.code}]</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {cap.prod}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant={cap.allowed ? 'success' : 'danger'}>
                      {cap.allowed ? 'Permitido' : 'Denegado'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {cap.allowed ? (
                      <span className="font-medium text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {cap.grantingRole}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">{cap.reason}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600 font-mono">
                    {cap.scopeNote || '—'}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

    </motion.div>
  );
}
