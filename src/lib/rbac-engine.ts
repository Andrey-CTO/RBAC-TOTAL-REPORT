import { dataStore } from './store';
import { Permission, User } from '../types/rbac';

export interface EffectivePermission {
  permission: Permission;
  sourceRole: string;
  sourceEntity: string;
  formatScopeMode: 'ALL' | 'SELECTED' | 'NOT_APPLICABLE';
  formatIds: string[];
  isDirect?: boolean;
}

/**
 * Motor determinista de autorización del ecosistema TÓTAL.
 * Resuelve permisos efectivos cruzando el usuario, sus roles asignados,
 * permisos directos (excepciones), entidades autorizadas y alcances de formatos.
 */
export function resolveEffectivePermissions(userId: string, targetUser?: User): EffectivePermission[] {
  const user = targetUser || dataStore.users.find(u => u.id === userId);
  if (!user || user.status !== 'ACTIVE') return [];

  const effectiveList: EffectivePermission[] = [];
  const assignedRoleIds = user.roles || [];

  // Entidades asociadas al usuario
  const userEntityNames = user.entities.map(eid => {
    const ent = dataStore.entities.find(e => e.id === eid);
    return ent ? ent.name : eid;
  }).join(', ') || 'Sin entidades';

  // 1. Permisos derivados de roles
  assignedRoleIds.forEach(roleId => {
    const role = dataStore.roles.find(r => r.id === roleId);
    if (!role) return;

    role.permissions.forEach(rp => {
      const permDef = dataStore.permissions.find(p => p.id === rp.permissionId);
      if (!permDef) return;

      // Si el usuario tiene restringidos sus productos, solo se evalúan los autorizados
      if (user.products && user.products.length > 0 && !user.products.includes(permDef.product)) {
        return;
      }

      let mode: 'ALL' | 'SELECTED' | 'NOT_APPLICABLE' = 'NOT_APPLICABLE';
      let formats: string[] = [];

      if (permDef.admitsFormat) {
        if (rp.formatScope && rp.formatScope.mode === 'SELECTED' && rp.formatScope.formatIds.length > 0) {
          mode = 'SELECTED';
          formats = rp.formatScope.formatIds;
        } else {
          // Si admite formato y no tiene seleccionados específicos, o modo es ALL -> Todos los formatos
          mode = 'ALL';
          formats = [];
        }
      }

      effectiveList.push({
        permission: permDef,
        sourceRole: role.name,
        sourceEntity: userEntityNames,
        formatScopeMode: mode,
        formatIds: formats,
        isDirect: false,
      });
    });
  });

  // 2. Permisos asignados directamente al usuario (excepciones o privilegios individuales)
  if (user.directPermissions && user.directPermissions.length > 0) {
    user.directPermissions.forEach(dp => {
      const permDef = dataStore.permissions.find(p => p.id === dp.permissionId);
      if (!permDef) return;

      if (user.products && user.products.length > 0 && !user.products.includes(permDef.product)) {
        return;
      }

      let mode: 'ALL' | 'SELECTED' | 'NOT_APPLICABLE' = 'NOT_APPLICABLE';
      let formats: string[] = [];

      if (permDef.admitsFormat) {
        if (dp.formatScope && dp.formatScope.mode === 'SELECTED' && dp.formatScope.formatIds.length > 0) {
          mode = 'SELECTED';
          formats = dp.formatScope.formatIds;
        } else {
          mode = 'ALL';
          formats = [];
        }
      }

      effectiveList.push({
        permission: permDef,
        sourceRole: 'Asignación Directa (Excepción)',
        sourceEntity: userEntityNames,
        formatScopeMode: mode,
        formatIds: formats,
        isDirect: true,
      });
    });
  }

  return effectiveList;
}

/**
 * Verifica si un usuario tiene autorización para ejecutar una acción específica
 */
export function hasUserPermission(
  userId: string,
  permissionCode: string,
  context?: { formatId?: string; entityId?: string }
): boolean {
  const perms = resolveEffectivePermissions(userId);
  const matched = perms.filter(p => p.permission.code === permissionCode);
  if (matched.length === 0) return false;

  if (context?.formatId) {
    return matched.some(m => {
      if (m.formatScopeMode === 'ALL') return true;
      if (m.formatScopeMode === 'SELECTED') return m.formatIds.includes(context.formatId!);
      return true;
    });
  }

  return true;
}
