// Tipos base para el catálogo de permisos y el mapeo Legacy

export type EquivalenceClass = 
  | 'DIRECT_EQUIVALENCE_PROPOSED' 
  | 'SPLIT' 
  | 'CANDIDATE_CONSOLIDATION' 
  | 'NAVIGATION_ACCESS' 
  | 'ROLE_PACKAGE' 
  | 'WITHDRAWAL_WITH_REPLACEMENT';

export type ReviewStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

export interface LegacyActionMapping {
  legacyId: number;
  originalName: string;
  originalDescription: string;
  sheet: string;
  row: number;
  destinationPermissions: string[]; // IDs de PermissionDefinition
  equivalence: EquivalenceClass;
  evidence?: string;
  status: ReviewStatus;
  observation?: string;
}

export type PermissionOrigin = 'LEGACY' | 'EXTENSION';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface PermissionDefinition {
  id: string; // ej. PERM-USR-001
  code: string; // código estable ej. user.create
  label: string;
  description: string;
  module: string;
  resource: string;
  action: string; // ej. create, read, update, delete, approve, transmit
  compatibleProcesses: string[]; // IDs de procesos
  applicableDimensions: string[]; // ej. ['FORMAT', 'ENTITY', 'ENVIRONMENT']
  admitsFormat: boolean;
  riskLevel: RiskLevel;
  conditions?: string[];
  informativeDependencies?: string[]; // IDs de otros permisos sugeridos
  version: number;
  status: 'DRAFT' | 'ACTIVE' | 'DEPRECATED';
  origin: PermissionOrigin;
}
