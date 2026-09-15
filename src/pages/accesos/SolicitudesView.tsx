import React, { useState } from 'react';
import { useStore } from '../../lib/store';
import { Badge, Button, SidePanel } from '../../components/ui/Shared';
import { Search, Filter, CheckCircle, XCircle, Clock, ClipboardList, Info, Plus, CheckCircle2, AlertCircle, Shield } from 'lucide-react';
import { AccessRequest } from '../../types/rbac';

export function SolicitudesView() {
  const { requests, users, roles, entities, environments, approveRequest, rejectRequest, addRequest } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [selectedRequest, setSelectedRequest] = useState<AccessRequest | null>(null);
  const [isNewRequestOpen, setIsNewRequestOpen] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // New Request form
  const [newUserId, setNewUserId] = useState(users[0]?.id || '');
  const [newRoleId, setNewRoleId] = useState(roles[0]?.id || '');
  const [newEntityId, setNewEntityId] = useState(entities[0]?.id || '');
  const [newEnvId, setNewEnvId] = useState(environments[0]?.id || '');
  const [newJustification, setNewJustification] = useState('');

  // Rejection modal/reason
  const [rejectReason, setRejectReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  const filteredRequests = requests.filter(req => {
    const user = users.find(u => u.id === req.userId);
    const role = roles.find(r => r.id === req.roleId);
    
    const matchesSearch = 
      (user?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
      (user?.identity || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (role?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.id.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesStatus = statusFilter === 'ALL' || req.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleApprove = (requestId: string) => {
    const res = approveRequest(requestId);
    if (res.success) {
      setFeedback({ type: 'success', message: 'Solicitud aprobada con éxito. El rol ha sido asignado al usuario.' });
      setSelectedRequest(null);
    } else {
      setFeedback({ type: 'error', message: res.message || 'Error al aprobar solicitud.' });
    }
    setTimeout(() => setFeedback(null), 5000);
  };

  const handleReject = (requestId: string) => {
    const reason = rejectReason.trim() || 'No cumple con las directrices de autorización de accesos.';
    const res = rejectRequest(requestId, reason);
    if (res.success) {
      setFeedback({ type: 'success', message: 'Solicitud rechazada formalmente y auditada.' });
      setSelectedRequest(null);
      setIsRejecting(false);
      setRejectReason('');
    } else {
      setFeedback({ type: 'error', message: res.message || 'Error al rechazar solicitud.' });
    }
    setTimeout(() => setFeedback(null), 5000);
  };

  const handleCreateRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserId || !newRoleId || !newJustification.trim()) return;

    const newReq: AccessRequest = {
      id: `REQ-${Date.now().toString().slice(-4)}`,
      userId: newUserId,
      roleId: newRoleId,
      entityId: newEntityId || entities[0]?.id || 'ENT-1',
      environmentId: newEnvId || environments[0]?.id || 'ENV-PROD',
      status: 'PENDING',
      requestDate: new Date().toISOString(),
      requestedBy: newUserId,
      justification: newJustification.trim()
    };

    addRequest(newReq);
    setIsNewRequestOpen(false);
    setNewJustification('');
    setFeedback({ type: 'success', message: `Solicitud ${newReq.id} creada y enrutada para aprobación.` });
    setTimeout(() => setFeedback(null), 4000);
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div className="flex flex-wrap gap-2">
          <Button 
            variant={statusFilter === 'PENDING' ? 'primary' : 'secondary'} 
            onClick={() => setStatusFilter('PENDING')}
            className="text-xs md:text-sm"
          >
            Pendientes ({requests.filter(r => r.status === 'PENDING').length})
          </Button>
          <Button 
            variant={statusFilter === 'APPROVED' ? 'primary' : 'secondary'} 
            onClick={() => setStatusFilter('APPROVED')}
            className="text-xs md:text-sm bg-white"
          >
            Aprobadas ({requests.filter(r => r.status === 'APPROVED').length})
          </Button>
          <Button 
            variant={statusFilter === 'REJECTED' ? 'primary' : 'secondary'} 
            onClick={() => setStatusFilter('REJECTED')}
            className="text-xs md:text-sm bg-white"
          >
            Rechazadas ({requests.filter(r => r.status === 'REJECTED').length})
          </Button>
          <Button 
            variant={statusFilter === 'ALL' ? 'primary' : 'secondary'} 
            onClick={() => setStatusFilter('ALL')}
            className="text-xs md:text-sm bg-white"
          >
            Todas ({requests.length})
          </Button>
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Buscar solicitud..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-sm border border-slate-200 rounded-md focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none w-full" 
            />
          </div>
          <Button onClick={() => setIsNewRequestOpen(true)} className="gap-1.5 shrink-0 bg-brand-primary hover:bg-brand-primary-hover text-white text-xs md:text-sm">
            <Plus className="w-4 h-4" /> Nueva Solicitud
          </Button>
        </div>
      </div>

      {feedback && (
        <div className={`p-4 rounded-xl flex items-center gap-2.5 text-sm ${feedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          {feedback.type === 'success' ? <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" /> : <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />}
          <span>{feedback.message}</span>
        </div>
      )}

      <div className="flex-1 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-auto flex-1 relative">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-500 sticky top-0 border-b border-slate-200 z-10">
              <tr>
                <th className="px-6 py-3 font-medium">ID Solicitud</th>
                <th className="px-6 py-3 font-medium">Usuario / Identidad</th>
                <th className="px-6 py-3 font-medium">Rol Solicitado</th>
                <th className="px-6 py-3 font-medium">Contexto</th>
                <th className="px-6 py-3 font-medium text-center">Estado</th>
                <th className="px-6 py-3 font-medium">Fecha</th>
                <th className="px-6 py-3 font-medium w-16 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRequests.map(req => {
                const user = users.find(u => u.id === req.userId);
                const role = roles.find(r => r.id === req.roleId);
                const entity = entities.find(e => e.id === req.entityId);
                
                return (
                  <tr key={req.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4 font-mono font-medium text-slate-700">{req.id}</td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900">{user?.name || req.userId}</p>
                      <p className="text-xs text-slate-500">{user?.identity}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-brand-primary" />
                        <p className="font-semibold text-slate-800">{role?.name || req.roleId}</p>
                      </div>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">{role?.code || ''}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-medium bg-slate-100 text-slate-700 px-2 py-1 rounded">
                        {entity?.name || req.entityId}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Badge variant={req.status === 'APPROVED' ? 'success' : req.status === 'REJECTED' ? 'danger' : 'warning'}>
                        {req.status === 'APPROVED' ? 'Aprobada' : req.status === 'REJECTED' ? 'Rechazada' : 'Pendiente'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs">
                      {new Date(req.requestDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Button variant="ghost" size="sm" onClick={() => { setSelectedRequest(req); setIsRejecting(false); }}>
                        Revisar
                      </Button>
                    </td>
                  </tr>
                );
              })}
              {filteredRequests.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    <ClipboardList className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                    No hay solicitudes que coincidan con los filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Panel Revisión de Solicitud */}
      <SidePanel
        isOpen={!!selectedRequest}
        onClose={() => setSelectedRequest(null)}
        title="Revisión de Solicitud de Acceso"
      >
        {selectedRequest && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <span className="font-mono text-slate-500 text-sm">ID: {selectedRequest.id}</span>
              <Badge variant={selectedRequest.status === 'APPROVED' ? 'success' : selectedRequest.status === 'REJECTED' ? 'danger' : 'warning'}>
                {selectedRequest.status === 'APPROVED' ? 'Aprobada' : selectedRequest.status === 'REJECTED' ? 'Rechazada' : 'Pendiente'}
              </Badge>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Usuario Solicitante</h4>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                  <p className="font-bold text-slate-900">{users.find(u => u.id === selectedRequest.userId)?.name}</p>
                  <p className="text-sm text-slate-500">
                    {users.find(u => u.id === selectedRequest.userId)?.identity} • {users.find(u => u.id === selectedRequest.userId)?.email}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Rol Solicitado</h4>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2">
                  <div>
                    <span className="text-xs text-slate-500">Rol:</span>
                    <p className="font-semibold text-slate-900">
                      {roles.find(r => r.id === selectedRequest.roleId)?.name} ({roles.find(r => r.id === selectedRequest.roleId)?.code})
                    </p>
                  </div>
                  <div className="flex gap-4">
                    <div>
                      <span className="text-xs text-slate-500">Entidad:</span>
                      <p className="text-sm font-medium text-slate-800">{entities.find(e => e.id === selectedRequest.entityId)?.name}</p>
                    </div>
                    <div>
                      <span className="text-xs text-slate-500">Ambiente:</span>
                      <p className="text-sm font-medium text-slate-800">{environments.find(e => e.id === selectedRequest.environmentId)?.name}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Justificación</h4>
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm text-blue-950">
                  {selectedRequest.justification}
                </div>
              </div>
            </div>

            {selectedRequest.status === 'PENDING' && !isRejecting && (
              <div className="pt-4 border-t border-slate-200 flex gap-3">
                <Button 
                  onClick={() => handleApprove(selectedRequest.id)}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                >
                  <CheckCircle className="w-4 h-4" /> Aprobar Rol
                </Button>
                <Button 
                  variant="secondary" 
                  onClick={() => setIsRejecting(true)}
                  className="flex-1 text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200 gap-2"
                >
                  <XCircle className="w-4 h-4" /> Rechazar...
                </Button>
              </div>
            )}

            {selectedRequest.status === 'PENDING' && isRejecting && (
              <div className="pt-4 border-t border-slate-200 space-y-3 bg-red-50/50 p-3 rounded-lg border border-red-100">
                <h5 className="text-xs font-bold text-red-700 uppercase">Motivo del Rechazo</h5>
                <textarea
                  rows={2}
                  placeholder="Ingrese el argumento para rechazar esta solicitud..."
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  className="w-full text-sm p-2 border border-red-200 rounded-md outline-none focus:ring-1 focus:ring-red-500 bg-white"
                />
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={() => setIsRejecting(false)} className="flex-1">
                    Cancelar
                  </Button>
                  <Button 
                    size="sm"
                    onClick={() => handleReject(selectedRequest.id)}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  >
                    Confirmar Rechazo
                  </Button>
                </div>
              </div>
            )}
            
            {selectedRequest.status !== 'PENDING' && (
              <div className="pt-4 border-t border-slate-200">
                <div className="flex items-center gap-2 text-slate-500 text-sm">
                  <Info className="w-4 h-4 text-slate-400" />
                  <span>Esta solicitud ya fue procesada y se encuentra registrada en los libros de auditoría.</span>
                </div>
              </div>
            )}
          </div>
        )}
      </SidePanel>

      {/* Modal Nueva Solicitud */}
      <SidePanel
        isOpen={isNewRequestOpen}
        onClose={() => setIsNewRequestOpen(false)}
        title="Radicar Nueva Solicitud de Rol"
      >
        <form onSubmit={handleCreateRequest} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Usuario Solicitante *
            </label>
            <select
              value={newUserId}
              onChange={e => setNewUserId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-1 focus:ring-brand-primary outline-none"
            >
              {users.map(u => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.identity}) - {u.type === 'HUMAN' ? 'Humano' : 'Servicio'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Rol Requerido *
            </label>
            <select
              value={newRoleId}
              onChange={e => setNewRoleId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-1 focus:ring-brand-primary outline-none"
            >
              {roles.map(r => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.code}) - {r.status}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Entidad Objetivo
              </label>
              <select
                value={newEntityId}
                onChange={e => setNewEntityId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-1 focus:ring-brand-primary outline-none"
              >
                {entities.map(e => (
                  <option key={e.id} value={e.id}>{e.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Ambiente
              </label>
              <select
                value={newEnvId}
                onChange={e => setNewEnvId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-1 focus:ring-brand-primary outline-none"
              >
                {environments.map(env => (
                  <option key={env.id} value={env.id}>{env.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Justificación de Negocio *
            </label>
            <textarea
              required
              rows={3}
              placeholder="Indique motivo operativo o regulatorio para requerir este rol..."
              value={newJustification}
              onChange={e => setNewJustification(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-1 focus:ring-brand-primary outline-none"
            />
          </div>

          <div className="pt-4 border-t border-slate-200 flex gap-3">
            <Button type="button" variant="secondary" onClick={() => setIsNewRequestOpen(false)} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" className="flex-1 bg-brand-primary hover:bg-brand-primary-hover text-white gap-2">
              <CheckCircle2 className="w-4 h-4" /> Radicar Solicitud
            </Button>
          </div>
        </form>
      </SidePanel>
    </div>
  );
}
