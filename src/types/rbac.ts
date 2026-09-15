export type FormatMode = 'ALL' | 'SELECTED' | 'NOT_APPLICABLE';

export interface FormatScope {
  mode: FormatMode;
  formatIds: string[];
}

export interface RolePermission {
  permissionId: string;
  formatScope: FormatScope;
}

export type ProductCode = 'TOTAL_REPORT' | 'TOTAL_SUPERVISION' | 'TAX_REPORT' | 'TOTALIA' | 'SECURITY_RBAC';
export type PermissionOrigin = 'BASE' | 'EXTENDED';
export type CatalogStatus = 'CATALOGED' | 'EXTENDED' | 'REVIEW_REQUIRED';

export interface User {
  id: string;
  identity: string;
  name: string;
  email: string;
  type: 'HUMAN' | 'SERVICE';
  status: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';
  entities: string[];
  products: ProductCode[];
  roles: string[]; // List of Role IDs assigned directly
  directPermissions?: RolePermission[]; // Optional explicit individual exceptions
}

export interface Permission {
  id: string;
  legacyId?: number;
  code: string;
  label: string;
  description: string;
  product: ProductCode;
  functionality: string; // Functional category (Seguridad, Usuarios, Roles, Fuentes, Generación, Validación, Transmisión, etc.)
  module: string;
  resource: string;
  action: string;
  admitsFormat: boolean;
  origin: PermissionOrigin;
  catalogStatus: CatalogStatus;
  originalName?: string;
  originalDescription?: string;
}

export interface Role {
  id: string;
  code: string;
  name: string;
  description: string;
  owner: string;
  version: number;
  status: 'DRAFT' | 'PUBLISHED' | 'RETIRED';
  products: ProductCode[];
  permissions: RolePermission[];
  updatedAt?: string;
}

export interface AccessRequest {
  id: string;
  userId: string;
  roleId: string;
  entityId: string;
  environmentId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requestDate: string;
  requestedBy: string;
  justification: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  action: string;
  targetResource: string;
  targetId?: string;
  module: string;
  status: 'SUCCESS' | 'DENIED' | 'FAILED';
  ipAddress: string;
  details: string;
}

export interface SoDRule {
  id: string;
  code: string;
  name: string;
  description: string;
  riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  incompatibleActions: string[]; // e.g. ['Preparar/Generar Formato', 'Firmar Formato']
  regulatoryCitation: string;
}

export interface Delegation {
  id: string;
  delegatorId: string;
  delegatorName: string;
  delegateId: string;
  delegateName: string;
  scopeRole: string;
  startDate: string;
  endDate: string;
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED';
  justification: string;
}
