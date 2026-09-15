import { useState, useMemo } from 'react';
import { useStore } from '../../lib/store';
import { resolveEffectivePermissions } from '../../lib/rbac-engine';
import { Badge, Button, SidePanel } from '../../components/ui/Shared';
import { 
  UserCheck, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Search, 
  Filter, 
  Download, 
  Printer, 
  Building2, 
  Clock, 
  Key, 
  User as UserIcon, 
  Shield, 
  Eye, 
  FileCheck2, 
  Sparkles,
  Calendar,
  Layers,
  ArrowRight,
  Check,
  RotateCcw
} from 'lucide-react';
import { User, RolePermission } from '../../types/rbac';
import { cn } from '../../lib/utils';

export type ReviewStatus = 'PENDING' | 'CERTIFIED' | 'REVOKED' | 'FLAGGED';

export interface UserReviewState {
  userId: string;
  status: ReviewStatus;
  reviewedBy: string;
  reviewedAt?: string;
  notes?: string;
  revokedRoles?: string[];
  revokedDirectPerms?: string[];
}

export function AccessReviewView() {
  const store = useStore();
  const { users, roles, permissions, entities, logAudit } = store;

  // Selected Campaign
  const [selectedCampaign, setSelectedCampaign] = useState<string>('CAMP-2026-S1');

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEntity, setFilterEntity] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterRisk, setFilterRisk] = useState<string>('ALL'); // ALL, HIGH, DIRECT_ONLY

  // Selected User for Detail Panel
  const [inspectingUser, setInspectingUser] = useState<User | null>(null);

  // Modal for Confirmation or Revocation
  const [reviewModalUser, setReviewModalUser] = useState<{
    user: User;
    action: 'CERTIFY' | 'REVOKE' | 'FLAG';
  } | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');

  // Local state for campaign reviews
  const [reviews, setReviews] = useState<Record<string, UserReviewState>>(() => {
    // Initial seeded reviews for demonstration
    const initial: Record<string, UserReviewState> = {};
    if (users[0]) {
      initial[users[0].id] = {
        userId: users[0].id,
        status: 'CERTIFIED',
        reviewedBy: 'Oficial de Seguridad IT',
        reviewedAt: '2026-09-05 14:30',
        notes: 'Acceso administrativo verificado y ratificado conforme al rol corporativo.'
      };
    }
    return initial;
  });

  // Calculate risk level per user
  const getUserRiskProfile = (u: User) => {
    const userRoles = roles.filter(r => (u.roles || []).includes(r.id));
    const isInactive = u.status !== 'ACTIVE';
    const hasAdminRole = userRoles.some(r => r.code === 'ID_ADMIN');
    const hasSignerRole = userRoles.some(r => r.code === 'SIGNER' || r.code === 'DATA_APRV');
    const hasDirectPerms = (u.directPermissions && u.directPermissions.length > 0);

    if (isInactive && userRoles.length > 0) {
      return {
        level: 'CRITICAL',
        label: 'Huérfano / Inactivo con Roles',
        badge: 'danger',
        desc: 'La cuenta no está activa pero aún posee roles vinculados'
      };
    }
    if (hasAdminRole || (hasSignerRole && userRoles.length > 1)) {
      return {
        level: 'HIGH',
        label: 'Privilegio Crítico',
        badge: 'warning',
        desc: 'Posee privilegios administrativos o facultades de firma / aprobación'
      };
    }
    if (hasDirectPerms) {
      return {
        level: 'MEDIUM',
        label: 'Excepción Directa',
        badge: 'info',
        desc: 'Cuenta con permisos directos asignados fuera de los roles estándar'
      };
    }
    return {
      level: 'NORMAL',
      label: 'Estándar',
      badge: 'neutral',
      desc: 'Roles operativos estándar sin excepciones individuales'
    };
  };

  // Filtered users list
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      // Search
      const search = searchTerm.toLowerCase();
      const matchesSearch = 
        u.name.toLowerCase().includes(search) ||
        u.email.toLowerCase().includes(search) ||
        u.identity.toLowerCase().includes(search);
      if (!matchesSearch) return false;

      // Entity
      if (filterEntity !== 'ALL' && !(u.entities || []).includes(filterEntity)) {
        return false;
      }

      // Review Status
      const rev = reviews[u.id];
      const status = rev ? rev.status : 'PENDING';
      if (filterStatus !== 'ALL' && status !== filterStatus) {
        return false;
      }

      // Risk
      const risk = getUserRiskProfile(u);
      if (filterRisk === 'HIGH' && risk.level !== 'HIGH' && risk.level !== 'CRITICAL') {
        return false;
      }
      if (filterRisk === 'DIRECT_ONLY' && (!u.directPermissions || u.directPermissions.length === 0)) {
        return false;
      }

      return true;
    });
  }, [users, searchTerm, filterEntity, filterStatus, filterRisk, reviews, roles]);

  // Summary Metrics
  const stats = useMemo(() => {
    const total = users.length;
    let certified = 0;
    let revoked = 0;
    let flagged = 0;
    let pending = 0;
    let criticalOrphan = 0;
    let withDirectPerms = 0;

    users.forEach(u => {
      const rev = reviews[u.id];
      if (!rev || rev.status === 'PENDING') pending++;
      else if (rev.status === 'CERTIFIED') certified++;
      else if (rev.status === 'REVOKED') revoked++;
      else if (rev.status === 'FLAGGED') flagged++;

      const risk = getUserRiskProfile(u);
      if (risk.level === 'CRITICAL') criticalOrphan++;
      if (u.directPermissions && u.directPermissions.length > 0) withDirectPerms++;
    });

    const completionRate = total > 0 ? Math.round(((total - pending) / total) * 100) : 0;

    return { total, certified, revoked, flagged, pending, completionRate, criticalOrphan, withDirectPerms };
  }, [users, reviews, roles]);

  // Execute review action
  const handleConfirmReviewAction = () => {
    if (!reviewModalUser) return;
    const { user, action } = reviewModalUser;
    const now = new Date().toISOString().replace('T', ' ').slice(0, 16);

    let nextStatus: ReviewStatus = 'CERTIFIED';
    if (action === 'REVOKE') nextStatus = 'REVOKED';
    if (action === 'FLAG') nextStatus = 'FLAGGED';

    setReviews(prev => ({
      ...prev,
      [user.id]: {
        userId: user.id,
        status: nextStatus,
        reviewedBy: 'Oficial de Seguridad / Auditor',
        reviewedAt: now,
        notes: reviewNotes || (action === 'CERTIFY' ? 'Acceso certificado periódicamente' : 'Requiere revocación o aclaración')
      }
    }));

    logAudit(
      action === 'CERTIFY' ? 'ACCESS_CERTIFIED' : action === 'REVOKE' ? 'ACCESS_REVOCATION_REQUESTED' : 'ACCESS_FLAGGED',
      'Recertificación de Accesos',
      `Campaña ${selectedCampaign}: Usuario ${user.name} marcado como ${nextStatus}. Nota: ${reviewNotes || 'Sin observaciones'}`,
      user.id
    );

    setReviewModalUser(null);
    setReviewNotes('');
  };

  // Export Certification Certificate / Audit Act
  const exportCertificationAct = () => {
    const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const headers = [
      'ID Usuario',
      'Nombre',
      'Identificación',
      'Correo',
      'Estado Cuenta',
      'Roles Asignados',
      'Permisos Directos',
      'Nivel de Riesgo',
      'Resultado Recertificación',
      'Revisado Por',
      'Fecha Revisión',
      'Notas / Justificación'
    ];

    const rows = users.map(u => {
      const rev = reviews[u.id];
      const risk = getUserRiskProfile(u);
      const userRoles = roles.filter(r => (u.roles || []).includes(r.id)).map(r => r.name).join(' | ');
      const directCount = u.directPermissions ? `${u.directPermissions.length} permisos directos` : '0';

      return [
        u.id,
        `"${u.name.replace(/"/g, '""')}"`,
        `"${u.identity}"`,
        `"${u.email}"`,
        `"${u.status}"`,
        `"${userRoles.replace(/"/g, '""')}"`,
        `"${directCount}"`,
        `"${risk.level}"`,
        `"${rev ? rev.status : 'PENDING'}"`,
        `"${rev?.reviewedBy || 'Pendiente'}"`,
        `"${rev?.reviewedAt || '-'}"`,
        `"${(rev?.notes || '').replace(/"/g, '""')}"`
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Acta_Recertificacion_Accesos_${selectedCampaign}_${timestamp.split(' ')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    logAudit(
      'EXPORT_ACCESS_REVIEW',
      'Recertificación de Accesos',
      `Exportación de Acta Oficial de Recertificación para la campaña ${selectedCampaign} (${users.length} cuentas evaluadas)`
    );
  };

  // Inspecting user effective permissions
  const inspectingEffectivePerms = useMemo(() => {
    if (!inspectingUser) return [];
    return resolveEffectivePermissions(inspectingUser.id, inspectingUser);
  }, [inspectingUser]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto h-full flex flex-col pb-10">
      {/* Header & Campaign Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-brand-primary/10 text-brand-primary">
              <UserCheck className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Campaña de Recertificación Periódica de Accesos
              </h3>
              <p className="text-xs text-slate-500">
                Auditoría formal y certificación de privilegios, roles y excepciones de identidad para cumplimiento normativo
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
            <Calendar className="w-4 h-4 text-slate-500" />
            <select
              value={selectedCampaign}
              onChange={e => setSelectedCampaign(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-800 outline-none cursor-pointer"
            >
              <option value="CAMP-2026-S1">Campaña Semestral 2026-I (Corte Regulatorio)</option>
              <option value="CAMP-CRITICAL-2026">Campaña Focalizada: Cuentas Críticas y Firmantes</option>
              <option value="CAMP-AUDIT-EXT">Campaña Extraordinaria: Revisoría Fiscal Externa</option>
            </select>
          </div>

          <Button
            variant="secondary"
            onClick={exportCertificationAct}
            className="gap-2 text-xs font-medium shrink-0"
          >
            <Download className="w-4 h-4" /> Exportar Acta Oficial
          </Button>
        </div>
      </div>

      {/* Campaign Progress Metric Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="bg-white border border-slate-200 p-3.5 rounded-xl">
          <p className="text-[11px] font-semibold text-slate-500 uppercase">Avance Campaña</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-slate-900">{stats.completionRate}%</span>
            <span className="text-xs text-slate-400">revisado</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
            <div 
              className="bg-brand-primary h-1.5 rounded-full transition-all duration-500" 
              style={{ width: `${stats.completionRate}%` }} 
            />
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-3.5 rounded-xl">
          <p className="text-[11px] font-semibold text-slate-500 uppercase">Cuentas a Evaluar</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-slate-900">{stats.total}</span>
            <span className="text-xs text-slate-400">identidades</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">{stats.pending} pendientes</p>
        </div>

        <div className="bg-white border border-slate-200 p-3.5 rounded-xl">
          <p className="text-[11px] font-semibold text-emerald-700 uppercase">Certificados</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-emerald-600">{stats.certified}</span>
            <span className="text-xs text-emerald-600 font-medium">ratificados</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Acceso ratificado</p>
        </div>

        <div className="bg-white border border-slate-200 p-3.5 rounded-xl">
          <p className="text-[11px] font-semibold text-rose-700 uppercase">Revocaciones</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-rose-600">{stats.revoked}</span>
            <span className="text-xs text-rose-600 font-medium">solicitadas</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Bajas de privilegio</p>
        </div>

        <div className="bg-white border border-slate-200 p-3.5 rounded-xl">
          <p className="text-[11px] font-semibold text-amber-700 uppercase">En Observación</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-amber-600">{stats.flagged}</span>
            <span className="text-xs text-amber-600 font-medium">cuentas</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Justificación requerida</p>
        </div>

        <div className="bg-white border border-slate-200 p-3.5 rounded-xl">
          <p className="text-[11px] font-semibold text-purple-700 uppercase">Permisos Directos</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-purple-600">{stats.withDirectPerms}</span>
            <span className="text-xs text-purple-600 font-medium">excepciones</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Asignaciones individuales</p>
        </div>
      </div>

      {/* Critical Findings Alert if Inactive Users have Roles */}
      {stats.criticalOrphan > 0 && (
        <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl flex items-center justify-between gap-3 text-rose-900 text-xs">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
            <div>
              <span className="font-bold">Hallazgo de Auditoría Crítico:</span> Se detectaron {stats.criticalOrphan} cuentas inactivas o suspendidas que conservan roles y permisos asignados.
            </div>
          </div>
          <button 
            onClick={() => { setFilterStatus('ALL'); setFilterRisk('HIGH'); }}
            className="underline font-semibold text-rose-700 hover:text-rose-900 whitespace-nowrap"
          >
            Filtrar hallazgos críticos
          </button>
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por usuario, ID o correo..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg outline-none focus:border-brand-primary"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Entity Filter */}
          <select
            value={filterEntity}
            onChange={e => setFilterEntity(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 outline-none"
          >
            <option value="ALL">Todas las Entidades</option>
            {entities.map(ent => (
              <option key={ent.id} value={ent.id}>{ent.name}</option>
            ))}
          </select>

          {/* Review Status Filter */}
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 outline-none"
          >
            <option value="ALL">Todos los Estados de Revisión</option>
            <option value="PENDING">Pendientes</option>
            <option value="CERTIFIED">Certificados</option>
            <option value="REVOKED">Revocados</option>
            <option value="FLAGGED">En Observación</option>
          </select>

          {/* Risk Filter */}
          <select
            value={filterRisk}
            onChange={e => setFilterRisk(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 outline-none"
          >
            <option value="ALL">Todos los Perfiles de Riesgo</option>
            <option value="HIGH">Solo Riesgo Alto / Crítico</option>
            <option value="DIRECT_ONLY">Solo con Permisos Directos</option>
          </select>

          {(searchTerm || filterEntity !== 'ALL' || filterStatus !== 'ALL' || filterRisk !== 'ALL') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterEntity('ALL');
                setFilterStatus('ALL');
                setFilterRisk('ALL');
              }}
              className="text-xs text-slate-500 hover:text-slate-800 underline px-1"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* Users Review Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col flex-1">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Identidad / Empleado</th>
                <th className="px-4 py-3">Estado Cuenta</th>
                <th className="px-4 py-3">Roles Corporativos</th>
                <th className="px-4 py-3">Excepciones Directas</th>
                <th className="px-4 py-3">Perfil de Riesgo</th>
                <th className="px-4 py-3">Dictamen Recertificación</th>
                <th className="px-4 py-3 text-right">Acciones de Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    No se encontraron identidades con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filteredUsers.map(user => {
                  const rev = reviews[user.id];
                  const userRoles = roles.filter(r => (user.roles || []).includes(r.id));
                  const risk = getUserRiskProfile(user);
                  const status = rev ? rev.status : 'PENDING';
                  const hasDirect = user.directPermissions && user.directPermissions.length > 0;

                  return (
                    <tr key={user.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Identity */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-slate-100 border flex items-center justify-center font-bold text-[11px] text-slate-700">
                            {user.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{user.name}</p>
                            <p className="text-[10px] text-slate-500 font-mono">
                              {user.identity} • {user.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Account Status */}
                      <td className="px-4 py-3">
                        <Badge 
                          variant={user.status === 'ACTIVE' ? 'success' : user.status === 'SUSPENDED' ? 'warning' : 'neutral'}
                          className="text-[10px]"
                        >
                          {user.status === 'ACTIVE' ? 'Activo' : user.status === 'SUSPENDED' ? 'Suspendido' : 'Inactivo'}
                        </Badge>
                      </td>

                      {/* Assigned Roles */}
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {userRoles.length === 0 ? (
                            <span className="text-slate-400 italic text-[11px]">Sin roles</span>
                          ) : (
                            userRoles.map(r => (
                              <span 
                                key={r.id}
                                className={cn(
                                  "px-2 py-0.5 rounded text-[10px] font-medium border",
                                  r.code === 'ID_ADMIN' 
                                    ? "bg-purple-50 text-purple-700 border-purple-200 font-bold" 
                                    : "bg-slate-50 text-slate-700 border-slate-200"
                                )}
                              >
                                {r.name}
                              </span>
                            ))
                          )}
                        </div>
                      </td>

                      {/* Direct Permissions */}
                      <td className="px-4 py-3">
                        {hasDirect ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-800 font-semibold text-[10px]">
                            <Key className="w-3 h-3 text-amber-600" />
                            {user.directPermissions!.length} directa{user.directPermissions!.length > 1 ? 's' : ''}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Ninguna</span>
                        )}
                      </td>

                      {/* Risk Profile */}
                      <td className="px-4 py-3">
                        <Badge 
                          variant={risk.badge as any}
                          className="text-[10px] font-semibold"
                        >
                          {risk.label}
                        </Badge>
                      </td>

                      {/* Certification Verdict */}
                      <td className="px-4 py-3">
                        {status === 'CERTIFIED' && (
                          <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-xs">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            Certificado
                          </div>
                        )}
                        {status === 'REVOKED' && (
                          <div className="flex items-center gap-1.5 text-rose-700 font-bold text-xs">
                            <XCircle className="w-4 h-4 text-rose-600" />
                            Revocación Solicitada
                          </div>
                        )}
                        {status === 'FLAGGED' && (
                          <div className="flex items-center gap-1.5 text-amber-700 font-bold text-xs">
                            <AlertTriangle className="w-4 h-4 text-amber-600" />
                            En Observación
                          </div>
                        )}
                        {status === 'PENDING' && (
                          <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                            <Clock className="w-3.5 h-3.5" />
                            Pendiente de Revisión
                          </div>
                        )}
                        {rev?.reviewedAt && (
                          <p className="text-[9px] text-slate-400 mt-0.5">{rev.reviewedAt}</p>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Inspect effective perms button */}
                          <button
                            onClick={() => setInspectingUser(user)}
                            title="Ver desglose detallado de permisos efectivos"
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Certify Button */}
                          <button
                            onClick={() => {
                              setReviewModalUser({ user, action: 'CERTIFY' });
                              setReviewNotes('');
                            }}
                            title="Certificar y Ratificar Acceso"
                            className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold border border-emerald-200 text-[11px] transition-colors flex items-center gap-1"
                          >
                            <Check className="w-3 h-3" /> Certificar
                          </button>

                          {/* Revoke Button */}
                          <button
                            onClick={() => {
                              setReviewModalUser({ user, action: 'REVOKE' });
                              setReviewNotes('');
                            }}
                            title="Solicitar Revocación de Privilegios"
                            className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold border border-rose-200 text-[11px] transition-colors flex items-center gap-1"
                          >
                            <XCircle className="w-3 h-3" /> Revocar
                          </button>

                          {/* Flag Button */}
                          <button
                            onClick={() => {
                              setReviewModalUser({ user, action: 'FLAG' });
                              setReviewNotes('');
                            }}
                            title="Marcar para Observación / Justificación"
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-amber-50 text-slate-500 hover:text-amber-700 transition-colors"
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Side Panel for Effective Permissions Inspection */}
      <SidePanel
        isOpen={!!inspectingUser}
        onClose={() => setInspectingUser(null)}
        title={`Matriz de Permisos: ${inspectingUser?.name || ''}`}
      >
        {inspectingUser && (
          <div className="space-y-6 flex flex-col h-full text-xs">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-sm">{inspectingUser.name}</span>
                <Badge variant={inspectingUser.status === 'ACTIVE' ? 'success' : 'neutral'}>
                  {inspectingUser.status}
                </Badge>
              </div>
              <p className="font-mono text-slate-500 text-[11px]">{inspectingUser.identity} • {inspectingUser.email}</p>
              <div className="flex items-center gap-2 pt-1 border-t border-slate-200 text-[10px] text-slate-600">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  {inspectingUser.entities.map(eid => entities.find(e => e.id === eid)?.name || eid).join(', ')}
                </span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 mb-3">
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                  Permisos Efectivos ({inspectingEffectivePerms.length})
                </h4>
                <span className="text-[10px] text-slate-400">Calculado en tiempo de ejecución</span>
              </div>

              {inspectingEffectivePerms.length === 0 ? (
                <div className="text-center py-8 text-slate-400 border border-dashed rounded-lg">
                  Sin permisos operativos activos.
                </div>
              ) : (
                <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                  {inspectingEffectivePerms.map((ep, idx) => (
                    <div key={`${ep.permission.id}-${idx}`} className="p-3 bg-white border border-slate-200 rounded-lg space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-slate-900">{ep.permission.label}</span>
                        <span className="font-mono text-[9px] text-slate-400">{ep.permission.code}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px]">
                        <span className="font-medium text-brand-primary">{ep.permission.product}</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-slate-600">{ep.permission.functionality}</span>
                      </div>
                      <div className="pt-1 flex items-center justify-between text-[10px] text-slate-500">
                        <span>Origen: <strong className={ep.isDirect ? 'text-amber-700' : 'text-slate-700'}>{ep.sourceRole}</strong></span>
                        {ep.formatScopeMode === 'ALL' && (
                          <span className="text-emerald-700 font-semibold">Todos los formatos</span>
                        )}
                        {ep.formatScopeMode === 'SELECTED' && (
                          <span className="text-blue-700 font-semibold">{ep.formatIds.join(', ')}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-200 mt-auto flex gap-2">
              <Button
                variant="primary"
                onClick={() => {
                  setReviewModalUser({ user: inspectingUser, action: 'CERTIFY' });
                  setInspectingUser(null);
                }}
                className="w-full gap-2 text-xs"
              >
                <Check className="w-3.5 h-3.5" /> Certificar Cuenta
              </Button>
            </div>
          </div>
        )}
      </SidePanel>

      {/* Review Action Modal */}
      {reviewModalUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                reviewModalUser.action === 'CERTIFY' ? "bg-emerald-100 text-emerald-700" :
                reviewModalUser.action === 'REVOKE' ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"
              )}>
                {reviewModalUser.action === 'CERTIFY' && <Check className="w-6 h-6 stroke-[2.5]" />}
                {reviewModalUser.action === 'REVOKE' && <XCircle className="w-6 h-6 stroke-[2.5]" />}
                {reviewModalUser.action === 'FLAG' && <AlertTriangle className="w-6 h-6 stroke-[2.5]" />}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {reviewModalUser.action === 'CERTIFY' && 'Certificar y Ratificar Privilegios'}
                  {reviewModalUser.action === 'REVOKE' && 'Solicitar Revocación de Privilegios'}
                  {reviewModalUser.action === 'FLAG' && 'Marcar en Observación'}
                </h3>
                <p className="text-xs text-slate-500">
                  Usuario: <strong className="text-slate-800">{reviewModalUser.user.name}</strong> ({reviewModalUser.user.identity})
                </p>
              </div>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
              <p>
                <strong>Campaña:</strong> {selectedCampaign}
              </p>
              <p>
                <strong>Efecto en Auditoría:</strong> Esta decisión quedará registrada de forma inmutable con su usuario, fecha y sello de tiempo para el informe de cumplimiento regulatorio.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Justificación o Dictamen de Auditoría
              </label>
              <textarea
                rows={3}
                placeholder={
                  reviewModalUser.action === 'CERTIFY'
                    ? 'Ej: Se confirma vigencia del rol operativo en el área de transmisiones.'
                    : 'Ej: El usuario fue transferido de área; ya no requiere roles de firma.'
                }
                value={reviewNotes}
                onChange={e => setReviewNotes(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2.5 text-xs outline-none focus:border-brand-primary"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setReviewModalUser(null)}
              >
                Cancelar
              </Button>
              <Button
                variant={reviewModalUser.action === 'REVOKE' ? 'primary' : 'primary'}
                size="sm"
                onClick={handleConfirmReviewAction}
                className={cn(
                  reviewModalUser.action === 'REVOKE' && "bg-rose-600 hover:bg-rose-700 border-rose-600",
                  reviewModalUser.action === 'FLAG' && "bg-amber-600 hover:bg-amber-700 border-amber-600"
                )}
              >
                Registrar Dictamen
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
