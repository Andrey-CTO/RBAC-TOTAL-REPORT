import { useSyncExternalStore } from 'react';
import { User, Role, Permission, AuditLog, AccessRequest, SoDRule, Delegation } from '../types/rbac';
import { mockUsers, mockRoles, mockPermissions, mockEntities, mockFormats, mockEnvironments, mockAuditLogs, mockRequests, mockSoDRules, mockDelegations } from './mock-data';

class DataStore {
  users: User[] = [...mockUsers];
  roles: Role[] = [...mockRoles];
  permissions: Permission[] = [...mockPermissions];
  entities = [...mockEntities];
  formats = [...mockFormats];
  environments = [...mockEnvironments];
  auditLogs: AuditLog[] = [...mockAuditLogs];
  requests: AccessRequest[] = [...mockRequests];
  sodRules: SoDRule[] = [...mockSoDRules];
  delegations: Delegation[] = [...mockDelegations];
  
  private listeners = new Set<() => void>();
  private notificationListeners = new Set<(n: { title: string; message: string; type?: 'success' | 'error' | 'warning' | 'info' }) => void>();

  constructor() {
    this.load();
  }

  onNotification(listener: (n: { title: string; message: string; type?: 'success' | 'error' | 'warning' | 'info' }) => void) {
    this.notificationListeners.add(listener);
    return () => this.notificationListeners.delete(listener);
  }

  notifyUser(notification: { title: string; message: string; type?: 'success' | 'error' | 'warning' | 'info' }) {
    this.notificationListeners.forEach(l => l(notification));
  }

  private load() {
    try {
      const saved = localStorage.getItem('total_rbac_store_v5') || localStorage.getItem('total_rbac_store_v4') || localStorage.getItem('total_rbac_store_v3');
      if (saved) {
        const data = JSON.parse(saved);
        if (data.users && data.users.length > 0) {
          // Normalize and guarantee Andrey Ramírez is in users list
          let userList = data.users.map((u: User) => {
            if (u.id === 'u7' || u.identity === 'EMP-007' || u.email === 'admin@total.demo' || u.email === 'aramirez@jwproject.com.co' || u.name === 'Admin Delegado' || u.name === 'Alejandro Ramírez') {
              return {
                ...u,
                id: 'u7',
                identity: 'EMP-007',
                name: 'Andrey Ramírez',
                email: 'aramirez@jwproject.com.co',
                type: 'HUMAN',
                status: 'ACTIVE',
                entities: u.entities && u.entities.length > 0 ? u.entities : ['ENT-1', 'ENT-2', 'ENT-3'],
                products: ['TOTAL_REPORT', 'TOTAL_SUPERVISION', 'TAX_REPORT', 'TOTALIA', 'SECURITY_RBAC'],
                roles: u.roles && u.roles.length > 0 ? u.roles : ['ROL-ID-ADMIN']
              };
            }
            return u;
          });

          const hasAndrey = userList.some((u: User) => u.name === 'Andrey Ramírez' || u.email === 'aramirez@jwproject.com.co');
          if (!hasAndrey) {
            userList.push({
              id: 'u7',
              identity: 'EMP-007',
              name: 'Andrey Ramírez',
              email: 'aramirez@jwproject.com.co',
              type: 'HUMAN',
              status: 'ACTIVE',
              entities: ['ENT-1', 'ENT-2', 'ENT-3'],
              products: ['TOTAL_REPORT', 'TOTAL_SUPERVISION', 'TAX_REPORT', 'TOTALIA', 'SECURITY_RBAC'],
              roles: ['ROL-ID-ADMIN']
            });
          }
          this.users = userList;
        }
        if (data.roles && data.roles.length > 0) this.roles = data.roles;
        if (data.auditLogs && data.auditLogs.length > 0) {
          this.auditLogs = data.auditLogs.map((a: AuditLog) => {
            if (a.actorName === 'Admin Delegado' || a.actorName === 'Alejandro Ramírez') {
              return { ...a, actorName: 'Andrey Ramírez' };
            }
            return a;
          });
        }
        if (data.requests && data.requests.length > 0) this.requests = data.requests;
        if (data.sodRules && data.sodRules.length > 0) this.sodRules = data.sodRules;
        if (data.delegations && data.delegations.length > 0) this.delegations = data.delegations;
      }
      // Always ensure permissions catalogue is up to date with the canonical definitions
      this.permissions = [...mockPermissions];
      this.save();
    } catch (e) {
      console.error('Error loading store from localStorage', e);
    }
  }

  private save() {
    try {
      localStorage.setItem('total_rbac_store_v5', JSON.stringify({
        users: this.users,
        roles: this.roles,
        permissions: this.permissions,
        auditLogs: this.auditLogs,
        requests: this.requests,
        sodRules: this.sodRules,
        delegations: this.delegations,
      }));
    } catch (e) {
      console.error('Error saving store to localStorage', e);
    }
    this.notify();
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(l => l());
  }

  // --- Audit Logger ---
  logAudit(action: string, targetResource: string, details: string, targetId?: string, actorName = 'Andrey Ramírez') {
    const newLog: AuditLog = {
      id: `AUD-${Date.now()}-${Math.floor(Math.random()*1000)}`,
      timestamp: new Date().toISOString(),
      actorId: 'EMP-007',
      actorName,
      action,
      targetResource,
      targetId,
      module: 'Seguridad / RBAC',
      status: 'SUCCESS',
      ipAddress: '192.168.1.100',
      details
    };
    this.auditLogs = [newLog, ...this.auditLogs];
    this.save();
  }

  // --- Users ---
  addUser(u: User) {
    this.users = [...this.users, u];
    this.logAudit(
      'CREATE_USER',
      'Usuario',
      `Usuario ${u.name} (${u.identity}) creado. Roles asignados: ${(u.roles || []).length}, Entidades: ${u.entities.length}, Productos: ${u.products.join(', ')}`,
      u.id
    );
    this.save();
    this.notifyUser({
      type: 'success',
      title: 'Usuario Registrado',
      message: `Se ha registrado y guardado exitosamente a "${u.name}" (${u.identity}) en el ecosistema.`
    });
  }

  updateUser(u: User) {
    const oldUser = this.users.find(x => x.id === u.id);
    this.users = this.users.map(x => x.id === u.id ? u : x);
    this.logAudit(
      'UPDATE_USER',
      'Usuario',
      `Usuario ${u.name} (${u.identity}) actualizado. Estado: ${u.status}, Roles asignados: ${(u.roles || []).length}, Entidades: ${u.entities.length}`,
      u.id
    );
    this.save();
    this.notifyUser({
      type: 'success',
      title: 'Usuario Actualizado',
      message: `Se han guardado correctamente los cambios del usuario "${u.name}".`
    });
  }

  deleteUser(id: string): { success: boolean; message?: string } {
    const target = this.users.find(u => u.id === id);
    if (!target) {
      this.notifyUser({
        type: 'error',
        title: 'Error al Eliminar',
        message: 'Usuario no encontrado en la base de datos.'
      });
      return { success: false, message: 'Usuario no encontrado.' };
    }

    // Regla de protección de administración: No permitir eliminar el último administrador válido
    const isTargetAdmin = target.products.includes('SECURITY_RBAC') || (target.roles && target.roles.includes('ROL-ID-ADMIN'));
    if (isTargetAdmin) {
      const activeAdmins = this.users.filter(u => 
        u.id !== id && 
        u.status === 'ACTIVE' && 
        (u.products.includes('SECURITY_RBAC') || (u.roles && u.roles.includes('ROL-ID-ADMIN')))
      );
      if (activeAdmins.length === 0) {
        const errorMsg = 'Acción bloqueada: No es posible eliminar al único administrador activo de Seguridad / RBAC del sistema.';
        this.notifyUser({
          type: 'warning',
          title: 'Acción Bloqueada',
          message: errorMsg
        });
        return {
          success: false,
          message: errorMsg
        };
      }
    }

    this.users = this.users.filter(x => x.id !== id);
    this.logAudit('DELETE_USER', 'Usuario', `Usuario ${target.name} (${target.identity}) eliminado permanentemente`, id);
    this.save();
    this.notifyUser({
      type: 'info',
      title: 'Usuario Eliminado',
      message: `Se ha eliminado permanentemente al usuario "${target.name}" (${target.identity}).`
    });
    return { success: true };
  }

  // --- Roles ---
  addRole(r: Role) {
    const roleWithDate = {
      ...r,
      updatedAt: new Date().toISOString()
    };
    this.roles = [...this.roles, roleWithDate];
    this.logAudit(
      'CREATE_ROLE',
      'Rol',
      `Rol ${r.name} (${r.code}) creado con ${r.permissions.length} acciones configuradas para productos: ${r.products.join(', ')}`,
      r.id
    );
    this.save();
    this.notifyUser({
      type: 'success',
      title: 'Rol Creado',
      message: `Se ha creado exitosamente el rol "${r.name}" (${r.code}) con ${r.permissions.length} acciones asignadas.`
    });
  }

  updateRole(r: Role) {
    const usersCount = this.getUsersForRole(r.id).length;
    const roleWithDate = {
      ...r,
      updatedAt: new Date().toISOString()
    };
    this.roles = this.roles.map(x => x.id === r.id ? roleWithDate : x);
    this.logAudit(
      'UPDATE_ROLE',
      'Rol',
      `Rol ${r.name} (${r.code}) modificado. ${r.permissions.length} acciones configuradas. Impacto en ${usersCount} usuario(s) asociado(s).`,
      r.id
    );
    this.save();
    this.notifyUser({
      type: 'success',
      title: 'Rol Actualizado',
      message: `Se guardaron los cambios del rol "${r.name}". Impacto aplicado sobre ${usersCount} usuario(s).`
    });
  }

  deleteRole(id: string): { success: boolean; message?: string } {
    const role = this.roles.find(r => r.id === id);
    if (!role) {
      this.notifyUser({
        type: 'error',
        title: 'Error al Eliminar Rol',
        message: 'Rol no encontrado en el catálogo.'
      });
      return { success: false, message: 'Rol no encontrado.' };
    }

    // Regla obligatoria (Sección 31): Un Rol puede eliminarse únicamente cuando NO tenga usuarios asociados
    const usersWithRole = this.getUsersForRole(id);
    if (usersWithRole.length > 0) {
      const msg = `No es posible eliminar este Rol porque tiene ${usersWithRole.length} usuario${usersWithRole.length > 1 ? 's' : ''} asociado${usersWithRole.length > 1 ? 's' : ''}. Retire o reasigne previamente estas asignaciones.`;
      this.notifyUser({
        type: 'warning',
        title: 'Operación no permitida',
        message: msg
      });
      return {
        success: false,
        message: msg
      };
    }

    // Regla de protección: No eliminar rol administrativo indispensable
    if (role.code === 'ID_ADMIN') {
      const msg = 'Este rol es un rol administrativo central del sistema y no puede ser eliminado.';
      this.notifyUser({
        type: 'warning',
        title: 'Rol Protegido',
        message: msg
      });
      return {
        success: false,
        message: msg
      };
    }

    this.roles = this.roles.filter(x => x.id !== id);
    this.logAudit('DELETE_ROLE', 'Rol', `Rol ${role.name} (${role.code}) eliminado del catálogo`, id);
    this.save();
    this.notifyUser({
      type: 'info',
      title: 'Rol Eliminado',
      message: `El rol "${role.name}" (${role.code}) fue eliminado del catálogo.`
    });
    return { success: true };
  }

  duplicateRole(roleId: string, newCode?: string, newName?: string): Role | null {
    const original = this.roles.find(r => r.id === roleId);
    if (!original) return null;

    const newRole: Role = {
      ...original,
      id: `ROL-${Date.now()}`,
      code: newCode || `${original.code}_COPIA`,
      name: newName || `${original.name} (Copia)`,
      version: 1,
      status: 'DRAFT',
      permissions: JSON.parse(JSON.stringify(original.permissions)),
      updatedAt: new Date().toISOString()
    };

    this.roles = [...this.roles, newRole];
    this.logAudit(
      'COPY_ROLE',
      'Rol',
      `Rol copiado desde ${original.name} (${original.code}) -> Nuevo Rol ${newRole.name} (${newRole.code}) con ${newRole.permissions.length} acciones heredadas`,
      newRole.id
    );
    this.save();
    this.notifyUser({
      type: 'success',
      title: 'Rol Duplicado',
      message: `Se ha creado el nuevo rol borrador "${newRole.name}" clonando ${newRole.permissions.length} acciones de "${original.name}".`
    });
    return newRole;
  }

  // Consultar qué usuarios tienen este rol
  getUsersForRole(roleId: string): User[] {
    return this.users.filter(u => u.roles && u.roles.includes(roleId));
  }

  // Asociar o desasociar usuarios a roles
  assignUserToRole(userId: string, roleId: string) {
    const role = this.roles.find(r => r.id === roleId);
    const user = this.users.find(u => u.id === userId);
    this.users = this.users.map(u => {
      if (u.id === userId) {
        const currentRoles = u.roles || [];
        if (!currentRoles.includes(roleId)) {
          return { ...u, roles: [...currentRoles, roleId] };
        }
      }
      return u;
    });
    this.logAudit('ASSIGN_ROLE', 'Usuario / Rol', `Rol ${role?.name || roleId} asignado al usuario ${userId}`, userId);
    this.save();
    this.notifyUser({
      type: 'success',
      title: 'Rol Asignado a Usuario',
      message: `El rol "${role?.name || roleId}" fue asignado a ${user?.name || userId}.`
    });
  }

  removeUserFromRole(userId: string, roleId: string) {
    const role = this.roles.find(r => r.id === roleId);
    const user = this.users.find(u => u.id === userId);
    this.users = this.users.map(u => {
      if (u.id === userId) {
        const currentRoles = u.roles || [];
        return { ...u, roles: currentRoles.filter(r => r !== roleId) };
      }
      return u;
    });
    this.logAudit('UNASSIGN_ROLE', 'Usuario / Rol', `Rol ${role?.name || roleId} retirado del usuario ${userId}`, userId);
    this.save();
    this.notifyUser({
      type: 'info',
      title: 'Rol Desvinculado',
      message: `El rol "${role?.name || roleId}" fue retirado de ${user?.name || userId}.`
    });
  }

  // --- Requests & Approvals ---
  addRequest(req: AccessRequest) {
    this.requests = [req, ...this.requests];
    this.logAudit('CREATE_ACCESS_REQUEST', 'Solicitud', `Solicitud ${req.id} radicada para rol ${req.roleId} por usuario ${req.userId}`, req.id);
    this.save();
    this.notifyUser({
      type: 'success',
      title: 'Solicitud Radicada',
      message: `La solicitud ${req.id} ha sido radicada formalmente para revisión y aprobación.`
    });
  }

  approveRequest(requestId: string, approvedBy = 'Admin Delegado'): { success: boolean; message?: string } {
    const req = this.requests.find(r => r.id === requestId);
    if (!req) return { success: false, message: 'Solicitud no encontrada.' };
    if (req.status !== 'PENDING') return { success: false, message: 'La solicitud ya fue procesada previamente.' };

    const role = this.roles.find(r => r.id === req.roleId);
    if (!role) return { success: false, message: 'El rol solicitado ya no existe en el catálogo.' };

    // Actualizar solicitud
    this.requests = this.requests.map(r => r.id === requestId ? { ...r, status: 'APPROVED' } : r);

    // Asignar rol directamente al usuario y garantizar entidad
    const user = this.users.find(u => u.id === req.userId);
    if (user) {
      const currentRoles = user.roles || [];
      const updatedRoles = Array.from(new Set([...currentRoles, req.roleId]));
      
      const currentEntities = user.entities || [];
      const updatedEntities = Array.from(new Set([...currentEntities, req.entityId]));

      this.users = this.users.map(u => u.id === req.userId ? {
        ...u,
        roles: updatedRoles,
        entities: updatedEntities
      } : u);
    }

    this.logAudit('APPROVE_ACCESS_REQUEST', 'Solicitud', `Solicitud ${req.id} aprobada por ${approvedBy}. Rol ${role.name} asignado al usuario ${req.userId}`, req.id);
    this.save();
    this.notifyUser({
      type: 'success',
      title: 'Solicitud Aprobada',
      message: `Se ha concedido el rol "${role.name}" a ${user?.name || req.userId}.`
    });
    return { success: true };
  }

  rejectRequest(requestId: string, reason = 'No cumple con las políticas de acceso', rejectedBy = 'Admin Delegado'): { success: boolean; message?: string } {
    const req = this.requests.find(r => r.id === requestId);
    if (!req) return { success: false, message: 'Solicitud no encontrada.' };
    if (req.status !== 'PENDING') return { success: false, message: 'La solicitud ya fue procesada previamente.' };

    this.requests = this.requests.map(r => r.id === requestId ? { ...r, status: 'REJECTED' } : r);
    this.logAudit('REJECT_ACCESS_REQUEST', 'Solicitud', `Solicitud ${req.id} rechazada por ${rejectedBy}. Motivo: ${reason}`, req.id);
    this.save();
    this.notifyUser({
      type: 'info',
      title: 'Solicitud Rechazada',
      message: `La solicitud ${req.id} fue denegada. Motivo: ${reason}`
    });
    return { success: true };
  }

  // --- Delegations ---
  addDelegation(del: Delegation) {
    this.delegations = [del, ...this.delegations];
    this.logAudit('CREATE_DELEGATION', 'Delegación Temporal', `Delegación conferida a ${del.delegateName} para ${del.scopeRole}`, del.id);
    this.save();
    this.notifyUser({
      type: 'success',
      title: 'Delegación Registrada',
      message: `Se ha otorgado delegación temporal a ${del.delegateName}.`
    });
  }

  revokeDelegation(id: string) {
    const del = this.delegations.find(d => d.id === id);
    if (del) {
      this.delegations = this.delegations.map(d => d.id === id ? { ...d, status: 'REVOKED' } : d);
      this.logAudit('REVOKE_DELEGATION', 'Delegación Temporal', `Delegación ${id} revocada formalmente`, id);
      this.save();
      this.notifyUser({
        type: 'warning',
        title: 'Delegación Revocada',
        message: `La delegación de ${del.delegateName} ha sido revocada.`
      });
    }
  }

  resetToDefaults() {
    localStorage.removeItem('total_rbac_store_v4');
    localStorage.removeItem('total_rbac_store_v3');
    this.users = [...mockUsers];
    this.roles = [...mockRoles];
    this.permissions = [...mockPermissions];
    this.auditLogs = [...mockAuditLogs];
    this.requests = [...mockRequests];
    this.sodRules = [...mockSoDRules];
    this.delegations = [...mockDelegations];
    this.notify();
    this.notifyUser({
      type: 'info',
      title: 'Sistema Reestablecido',
      message: 'Los datos iniciales de prueba y catálogo han sido recargados.'
    });
  }
}

export const dataStore = new DataStore();

export function useStore() {
  return useSyncExternalStore(
    dataStore.subscribe.bind(dataStore),
    () => dataStore
  );
}
