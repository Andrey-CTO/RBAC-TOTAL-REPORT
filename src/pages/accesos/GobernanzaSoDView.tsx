import { useState, FormEvent } from 'react';
import { useStore } from '../../lib/store';
import { Badge, Button } from '../../components/ui/Shared';
import { 
  ShieldAlert, 
  Users, 
  CalendarClock, 
  Plus, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  Lock, 
  Trash2, 
  X,
  FileCheck,
  UserCheck,
  Scale
} from 'lucide-react';
import { Delegation } from '../../types/rbac';

export function GobernanzaSoDView() {
  const { sodRules, delegations, users, roles, addDelegation, revokeDelegation, logAudit } = useStore();
  const [activeTab, setActiveTab] = useState<'SOD_MATRIX' | 'DELEGATIONS'>('SOD_MATRIX');

  // Modal New Delegation
  const [isDelegationModalOpen, setIsDelegationModalOpen] = useState(false);
  const [delegatorId, setDelegatorId] = useState(users[2]?.id || '');
  const [delegateId, setDelegateId] = useState(users[4]?.id || '');
  const [scopeRole, setScopeRole] = useState('ROL-SIGN (Firma Formato 458)');
  const [startDate, setStartDate] = useState('2026-09-08');
  const [endDate, setEndDate] = useState('2026-09-22');
  const [justification, setJustification] = useState('');

  // Evaluate users with toxic combinations (SoD violations)
  const evaluatedViolations = users.map(u => {
    const hasPrep = u.roles?.includes('ROL-PREP');
    const hasApprov = u.roles?.includes('ROL-APPROV');
    const hasSign = u.roles?.includes('ROL-SIGN');
    const hasAdmin = u.roles?.includes('ROL-ID-ADMIN');

    const conflicts: string[] = [];
    if (hasPrep && hasApprov) conflicts.push('Conflicto Crítico: Preparador y Aprobador simultáneo (SOD-001)');
    if (hasSign && hasPrep) conflicts.push('Conflicto Alto: Preparador y Firmante en mismo expediente (SOD-002)');
    if (hasAdmin && (hasPrep || hasSign || hasApprov)) conflicts.push('Conflicto Crítico: Administrador con perfil operativo (SOD-003)');

    return {
      user: u,
      conflicts,
      hasConflict: conflicts.length > 0
    };
  });

  const handleCreateDelegation = (e: FormEvent) => {
    e.preventDefault();
    if (!justification.trim()) {
      alert('La justificación formal es obligatoria para toda delegación temporal.');
      return;
    }

    const delegator = users.find(u => u.id === delegatorId);
    const delegate = users.find(u => u.id === delegateId);

    if (delegatorId === delegateId) {
      alert('El delegante y el delegado no pueden ser la misma persona.');
      return;
    }

    const newDel: Delegation = {
      id: `DEL-${Date.now().toString().slice(-4)}`,
      delegatorId,
      delegatorName: delegator?.name || 'Desconocido',
      delegateId,
      delegateName: delegate?.name || 'Desconocido',
      scopeRole: scopeRole,
      startDate,
      endDate,
      status: 'ACTIVE',
      justification
    };

    addDelegation(newDel);
    setIsDelegationModalOpen(false);
    setJustification('');
  };

  return (
    <div className="h-full flex flex-col space-y-6 overflow-auto pb-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <Scale className="w-6 h-6 text-brand-primary" />
            <h3 className="text-xl font-bold text-slate-900">Segregación de Funciones (SoD) y Delegaciones</h3>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            Prevención de conflictos de interés tóxicos y control estricto de suplencias temporales con caducidad automática
          </p>
        </div>
        {activeTab === 'DELEGATIONS' && (
          <Button onClick={() => setIsDelegationModalOpen(true)} className="gap-2 bg-brand-primary hover:bg-brand-primary-hover text-white text-xs">
            <Plus className="w-4 h-4" /> Nueva Delegación Temporal
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 bg-white px-4 rounded-xl shadow-sm">
        <button
          onClick={() => setActiveTab('SOD_MATRIX')}
          className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'SOD_MATRIX' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          <ShieldAlert className="w-4 h-4" /> Matriz SoD e Incompatibilidades Tóxicas
        </button>
        <button
          onClick={() => setActiveTab('DELEGATIONS')}
          className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'DELEGATIONS' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          <CalendarClock className="w-4 h-4" /> Registro de Delegaciones y Suplencias
        </button>
      </div>

      {/* Tab 1: SoD Matrix */}
      {activeTab === 'SOD_MATRIX' && (
        <div className="space-y-6">
          {/* Rules definitions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {sodRules.map(rule => (
              <div key={rule.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-2 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-slate-500">{rule.code}</span>
                    <Badge variant={rule.riskLevel === 'CRITICAL' ? 'danger' : 'warning'}>
                      Riesgo {rule.riskLevel}
                    </Badge>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm mt-1">{rule.name}</h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{rule.description}</p>
                </div>
                <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400 font-mono">
                  Base Legal: {rule.regulatoryCitation}
                </div>
              </div>
            ))}
          </div>

          {/* Audit of Current Users against SoD Rules */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-brand-primary" /> Diagnóstico de Segregación en Identidades Activas
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">Auditoría continua sobre combinaciones de roles asignados a cada colaborador</p>
              </div>
              <Badge variant="neutral">Inspección Continua</Badge>
            </div>

            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3 font-bold">Colaborador / Identidad</th>
                  <th className="px-5 py-3 font-bold">Roles Asignados</th>
                  <th className="px-5 py-3 font-bold">Diagnóstico de Segregación</th>
                  <th className="px-5 py-3 font-bold text-center">Estado SoD</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {evaluatedViolations.map(({ user, conflicts, hasConflict }) => (
                  <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-bold text-slate-900">{user.name}</p>
                      <p className="text-[11px] text-slate-400 font-mono">{user.identity} • {user.email}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex gap-1.5 flex-wrap">
                        {user.roles && user.roles.length > 0 ? (
                          user.roles.map(r => (
                            <span key={r} className="font-mono text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                              {r}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400 text-xs">Sin roles</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      {hasConflict ? (
                        <div className="space-y-1">
                          {conflicts.map((c, i) => (
                            <div key={i} className="text-rose-700 font-semibold flex items-center gap-1.5">
                              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                              <span>{c}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-emerald-700 font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          Segregación Conforme (Sin conflictos tóxicos)
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <Badge variant={hasConflict ? 'danger' : 'success'}>
                        {hasConflict ? 'Conflicto Detectado' : 'Aprobado'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Delegations */}
      {activeTab === 'DELEGATIONS' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3 font-bold">Código</th>
                  <th className="px-5 py-3 font-bold">Delegante Titular</th>
                  <th className="px-5 py-3 font-bold">Delegado Suplente</th>
                  <th className="px-5 py-3 font-bold">Atribución Transferida</th>
                  <th className="px-4 py-3 font-bold">Vigencia</th>
                  <th className="px-4 py-3 font-bold text-center">Estado</th>
                  <th className="px-5 py-3 font-bold text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {delegations.map(del => (
                  <tr key={del.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5 font-mono font-bold text-slate-800">{del.id}</td>
                    <td className="px-5 py-3.5">
                      <p className="font-bold text-slate-900">{del.delegatorName}</p>
                      <p className="text-[11px] text-slate-400 font-mono">{del.delegatorId}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-bold text-brand-primary">{del.delegateName}</p>
                      <p className="text-[11px] text-slate-400 font-mono">{del.delegateId}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-xs font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {del.scopeRole}
                      </span>
                      <p className="text-[11px] text-slate-500 mt-1 max-w-xs truncate" title={del.justification}>
                        {del.justification}
                      </p>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 font-mono text-[11px]">
                      {del.startDate} al {del.endDate}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <Badge variant={del.status === 'ACTIVE' ? 'success' : del.status === 'EXPIRED' ? 'neutral' : 'danger'}>
                        {del.status === 'ACTIVE' ? 'Vigente' : del.status === 'EXPIRED' ? 'Expirada' : 'Revocada'}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      {del.status === 'ACTIVE' && (
                        <Button
                          onClick={() => {
                            if (confirm(`¿Confirma la revocación formal de la delegación ${del.id}?`)) {
                              revokeDelegation(del.id);
                            }
                          }}
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-rose-600 hover:bg-rose-50"
                        >
                          Revocar
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Nueva Delegación */}
      {isDelegationModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <CalendarClock className="w-5 h-5 text-brand-primary" /> Registrar Delegación Temporal
              </h3>
              <button onClick={() => setIsDelegationModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDelegation} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Delegante Titular</label>
                <select
                  value={delegatorId}
                  onChange={(e) => setDelegatorId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none bg-white"
                >
                  {users.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.identity}) - {u.roles?.join(', ') || 'Sin rol'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Delegado Suplente</label>
                <select
                  value={delegateId}
                  onChange={(e) => setDelegateId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg outline-none bg-white"
                >
                  {users.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.identity}) - {u.roles?.join(', ') || 'Sin rol'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Atribución / Rol Delegado</label>
                <input
                  type="text"
                  required
                  value={scopeRole}
                  onChange={(e) => setScopeRole(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Fecha Inicio</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs font-mono border border-slate-300 rounded-lg outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Fecha Caducidad</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs font-mono border border-slate-300 rounded-lg outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Justificación Formal Obligatoria</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Ej: Cobertura por incapacidad temporal avalada por RRHH y Oficial de Cumplimiento."
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <Button type="button" variant="secondary" onClick={() => setIsDelegationModalOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-brand-primary hover:bg-brand-primary-hover text-white">
                  Autorizar Delegación
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
