import { User, Role, AccessRequest, Permission } from '../types/rbac';
import { legacyRawData } from './legacy-data';

// 1. Transformación completa de las 265 Acciones Base Reconciliadas de TÓTAL REPORT®
const basePermissions: Permission[] = legacyRawData.map((item) => ({
  id: `PERM-BASE-${item.id}`,
  legacyId: item.id,
  code: `BASE_${item.id.toString().padStart(3, '0')}`,
  label: item.name,
  description: item.desc,
  product: item.product,
  functionality: item.functionality,
  module: item.module,
  resource: item.resource,
  action: item.action,
  admitsFormat: item.admitsFormat,
  origin: 'BASE',
  catalogStatus: 'CATALOGED',
  originalName: item.name,
  originalDescription: item.desc
}));

// 2. Extensiones del Ecosistema (Nuevas capacidades de TÓTAL SUPERVISIÓN®, TOTALiA, Analítica, Firmas y Seguridad)
const extensionPermissions: Permission[] = [
  // TÓTAL SUPERVISIÓN®
  {
    id: 'PERM-SUP-MONITOR',
    code: 'SUP_MONITOR',
    label: 'Monitoreo de Procesos y Alertas Regulatorias',
    description: 'Monitoreo preventivo y seguimiento de estados de transmisión en tiempo real',
    product: 'TOTAL_SUPERVISION',
    functionality: 'Supervisión',
    module: 'Supervisión',
    resource: 'Alertas',
    action: 'READ',
    admitsFormat: false,
    origin: 'EXTENDED',
    catalogStatus: 'EXTENDED'
  },
  {
    id: 'PERM-SUP-CONSOLIDATE',
    code: 'SUP_CONSOLIDATE',
    label: 'Consolidación de Entidades Supervisadas',
    description: 'Consolidar información entre entidades filiales y matrices del grupo financiero',
    product: 'TOTAL_SUPERVISION',
    functionality: 'Supervisión',
    module: 'Supervisión',
    resource: 'Consolidación',
    action: 'EXECUTE',
    admitsFormat: true,
    origin: 'EXTENDED',
    catalogStatus: 'EXTENDED'
  },
  {
    id: 'PERM-SUP-DASHBOARD',
    code: 'SUP_DASHBOARD',
    label: 'Tablero Ejecutivo de Supervisión y Riesgos',
    description: 'Consultar métricas, semáforos y KPIs consolidados de cumplimiento normativo',
    product: 'TOTAL_SUPERVISION',
    functionality: 'Supervisión',
    module: 'Supervisión',
    resource: 'Tablero',
    action: 'READ',
    admitsFormat: false,
    origin: 'EXTENDED',
    catalogStatus: 'EXTENDED'
  },
  {
    id: 'PERM-SUP-RULES',
    code: 'SUP_RULES',
    label: 'Motor de Reglas de Supervisión Continua',
    description: 'Definir reglas automáticas de detección temprana de inconsistencias regulatorias',
    product: 'TOTAL_SUPERVISION',
    functionality: 'Supervisión',
    module: 'Supervisión',
    resource: 'ReglasSupervisión',
    action: 'CONFIG',
    admitsFormat: true,
    origin: 'EXTENDED',
    catalogStatus: 'EXTENDED'
  },
  {
    id: 'PERM-SUP-REPORTS',
    code: 'SUP_REPORTS',
    label: 'Emisión de Dictámenes de Supervisión',
    description: 'Generación formal de informes de auditoría y dictámenes para juntas directivas',
    product: 'TOTAL_SUPERVISION',
    functionality: 'Supervisión',
    module: 'Supervisión',
    resource: 'Dictámenes',
    action: 'GENERATE',
    admitsFormat: false,
    origin: 'EXTENDED',
    catalogStatus: 'EXTENDED'
  },
  {
    id: 'PERM-SUP-AUDIT',
    code: 'SUP_AUDIT',
    label: 'Auditoría Cruzada de Supervisión',
    description: 'Inspección forense de trazabilidad de cambios en todos los formatos del grupo',
    product: 'TOTAL_SUPERVISION',
    functionality: 'Supervisión',
    module: 'Supervisión',
    resource: 'AuditoríaCruzada',
    action: 'READ',
    admitsFormat: false,
    origin: 'EXTENDED',
    catalogStatus: 'EXTENDED'
  },

  // TOTALiA (Inteligencia Artificial y Modelos Cognitivos)
  {
    id: 'PERM-TOTALIA-ASSIST',
    code: 'TOTALIA_ASSIST',
    label: 'Asistente Cognitivo IA Regulatorio',
    description: 'Consultas en lenguaje natural sobre circulares externas, taxonomías y validaciones',
    product: 'TOTALIA',
    functionality: 'TOTALiA',
    module: 'Inteligencia',
    resource: 'Asistente',
    action: 'QUERY',
    admitsFormat: false,
    origin: 'EXTENDED',
    catalogStatus: 'EXTENDED'
  },
  {
    id: 'PERM-TOTALIA-ANOMALY',
    code: 'TOTALIA_ANOMALY',
    label: 'Detección Inteligente de Anomalías y Desviaciones',
    description: 'Detección automatizada con modelos estadísticos de desviaciones contables y de saldo',
    product: 'TOTALIA',
    functionality: 'TOTALiA',
    module: 'Inteligencia',
    resource: 'Anomalías',
    action: 'ANALYZE',
    admitsFormat: true,
    origin: 'EXTENDED',
    catalogStatus: 'EXTENDED'
  },
  {
    id: 'PERM-TOTALIA-EXPLAIN',
    code: 'TOTALIA_EXPLAIN',
    label: 'Explicabilidad Regulatoria Automatizada',
    description: 'Generación asistida de memorandos de variación y justificaciones para el ente de control',
    product: 'TOTALIA',
    functionality: 'TOTALiA',
    module: 'Inteligencia',
    resource: 'Explicabilidad',
    action: 'GENERATE',
    admitsFormat: false,
    origin: 'EXTENDED',
    catalogStatus: 'EXTENDED'
  },
  {
    id: 'PERM-TOTALIA-QUERY',
    code: 'TOTALIA_QUERY',
    label: 'Consultas Avanzadas en Lenguaje Natural',
    description: 'Interrogación directa a bases de datos regulatorias mediante prompts contextuales',
    product: 'TOTALIA',
    functionality: 'TOTALiA',
    module: 'Inteligencia',
    resource: 'Prompting',
    action: 'EXECUTE',
    admitsFormat: true,
    origin: 'EXTENDED',
    catalogStatus: 'EXTENDED'
  },

  // Analítica Avanzada de Negocio y Análisis de Información
  {
    id: 'PERM-ANL-BUILD',
    code: 'ANL_BUILD',
    label: 'Construcción de Análisis de Información',
    description: 'Creación, diseño y construcción de tableros analíticos, consultas y modelos de análisis de información',
    product: 'TOTAL_REPORT',
    functionality: 'Analítica',
    module: 'Analítica',
    resource: 'AnálisisInformación',
    action: 'CREATE',
    admitsFormat: true,
    origin: 'EXTENDED',
    catalogStatus: 'EXTENDED'
  },
  {
    id: 'PERM-ANL-EDIT',
    code: 'ANL_EDIT',
    label: 'Edición de Análisis de Información',
    description: 'Modificación, ajuste de parámetros, recalibración de variables y edición de análisis de información existentes',
    product: 'TOTAL_REPORT',
    functionality: 'Analítica',
    module: 'Analítica',
    resource: 'AnálisisInformación',
    action: 'UPDATE',
    admitsFormat: true,
    origin: 'EXTENDED',
    catalogStatus: 'EXTENDED'
  },
  {
    id: 'PERM-ANL-DELETE',
    code: 'ANL_DELETE',
    label: 'Eliminación de Análisis de Información',
    description: 'Eliminación, descarte y depuración definitiva de consultas, modelos y análisis de información',
    product: 'TOTAL_REPORT',
    functionality: 'Analítica',
    module: 'Analítica',
    resource: 'AnálisisInformación',
    action: 'DELETE',
    admitsFormat: true,
    origin: 'EXTENDED',
    catalogStatus: 'EXTENDED'
  },
  {
    id: 'PERM-ANL-ASSIGN',
    code: 'ANL_ASSIGN',
    label: 'Asignación de Análisis de Información',
    description: 'Asignación, delegación, publicación y distribución de tableros y análisis de información a usuarios o dependencias',
    product: 'TOTAL_REPORT',
    functionality: 'Analítica',
    module: 'Analítica',
    resource: 'AnálisisInformación',
    action: 'ASSIGN',
    admitsFormat: true,
    origin: 'EXTENDED',
    catalogStatus: 'EXTENDED'
  },
  {
    id: 'PERM-ANL-DASHBOARD',
    code: 'ANL_DASHBOARD',
    label: 'Tableros de Analítica y Tendencias Financieras',
    description: 'Visualización de tableros BI con series de tiempo y ratios financieros',
    product: 'TOTAL_REPORT',
    functionality: 'Analítica',
    module: 'Analítica',
    resource: 'Tablero',
    action: 'READ',
    admitsFormat: false,
    origin: 'EXTENDED',
    catalogStatus: 'EXTENDED'
  },
  {
    id: 'PERM-ANL-EXPORT',
    code: 'ANL_EXPORT',
    label: 'Exportación de Datasets Analíticos',
    description: 'Descarga de cubos de datos y datasets transformados en formatos abiertos',
    product: 'TOTAL_REPORT',
    functionality: 'Analítica',
    module: 'Analítica',
    resource: 'Dataset',
    action: 'EXPORT',
    admitsFormat: true,
    origin: 'EXTENDED',
    catalogStatus: 'EXTENDED'
  },
  {
    id: 'PERM-ANL-SCHEDULE',
    code: 'ANL_SCHEDULE',
    label: 'Programación de Reportes Analíticos',
    description: 'Automatización de envíos programados de reportes a buzones corporativos',
    product: 'TOTAL_REPORT',
    functionality: 'Analítica',
    module: 'Analítica',
    resource: 'Programación',
    action: 'CONFIG',
    admitsFormat: false,
    origin: 'EXTENDED',
    catalogStatus: 'EXTENDED'
  },
  {
    id: 'PERM-ANL-ADVANCED',
    code: 'ANL_ADVANCED',
    label: 'Modelado Predictivo de Cierre Regulatorio',
    description: 'Proyecciones de cierre de balances y cumplimiento con estimación de provisiones',
    product: 'TOTAL_REPORT',
    functionality: 'Analítica',
    module: 'Analítica',
    resource: 'Modelado',
    action: 'EXECUTE',
    admitsFormat: true,
    origin: 'EXTENDED',
    catalogStatus: 'EXTENDED'
  },

  // Firmas Criptográficas Avanzadas
  {
    id: 'PERM-SIG-ADVANCED',
    code: 'SIG_ADVANCED',
    label: 'Firma Criptográfica con HSM / Token Físico',
    description: 'Estampado de firma digital mediante integración con módulos de seguridad hardware (HSM)',
    product: 'TOTAL_REPORT',
    functionality: 'Firmas',
    module: 'Firmas',
    resource: 'HSM',
    action: 'EXECUTE',
    admitsFormat: true,
    origin: 'EXTENDED',
    catalogStatus: 'EXTENDED'
  },
  {
    id: 'PERM-SIG-MULTISIGN',
    code: 'SIG_MULTISIGN',
    label: 'Flujo Mancomunado de Firmas Múltiples',
    description: 'Configuración y orquestación de firmas mancomunadas obligatorias por formato',
    product: 'TOTAL_REPORT',
    functionality: 'Firmas',
    module: 'Firmas',
    resource: 'Multifirma',
    action: 'CONFIG',
    admitsFormat: true,
    origin: 'EXTENDED',
    catalogStatus: 'EXTENDED'
  },

  // Extensiones de Gobierno y Seguridad RBAC
  {
    id: 'PERM-SEC-USER-ACCESS',
    legacyId: 4,
    code: 'SEC_USER_ACCESS',
    label: 'Acceso a Usuarios (Directorio RBAC)',
    description: 'Visualizar directorio unificado de identidades, detalles y estados de asignación',
    product: 'SECURITY_RBAC',
    functionality: 'Seguridad',
    module: 'Administración',
    resource: 'Usuarios',
    action: 'READ',
    admitsFormat: false,
    origin: 'EXTENDED',
    catalogStatus: 'EXTENDED'
  },
  {
    id: 'PERM-SEC-USER-CREATE',
    legacyId: 1,
    code: 'SEC_USER_CREATE',
    label: 'Crear Usuarios (Directorio RBAC)',
    description: 'Crear nuevas identidades y credenciales de acceso en el gobierno de seguridad',
    product: 'SECURITY_RBAC',
    functionality: 'Seguridad',
    module: 'Administración',
    resource: 'Usuarios',
    action: 'CREATE',
    admitsFormat: false,
    origin: 'EXTENDED',
    catalogStatus: 'EXTENDED'
  },
  {
    id: 'PERM-SEC-USER-UPDATE',
    legacyId: 3,
    code: 'SEC_USER_UPDATE',
    label: 'Actualizar Usuarios (Directorio RBAC)',
    description: 'Modificar datos de usuario, productos asignados y entidades vinculadas',
    product: 'SECURITY_RBAC',
    functionality: 'Seguridad',
    module: 'Administración',
    resource: 'Usuarios',
    action: 'UPDATE',
    admitsFormat: false,
    origin: 'EXTENDED',
    catalogStatus: 'EXTENDED'
  },
  {
    id: 'PERM-SEC-USER-DELETE',
    legacyId: 2,
    code: 'SEC_USER_DELETE',
    label: 'Eliminar Usuarios (Directorio RBAC)',
    description: 'Eliminar usuarios que no sean administradores únicos del sistema',
    product: 'SECURITY_RBAC',
    functionality: 'Seguridad',
    module: 'Administración',
    resource: 'Usuarios',
    action: 'DELETE',
    admitsFormat: false,
    origin: 'EXTENDED',
    catalogStatus: 'EXTENDED'
  },
  {
    id: 'PERM-SEC-USER-ADMIN',
    legacyId: 145,
    code: 'SEC_USER_ADMIN',
    label: 'Administrador Usuarios (Gobierno Integral)',
    description: 'Control de ciclo de vida completo de usuarios y asignación de privilegios',
    product: 'SECURITY_RBAC',
    functionality: 'Seguridad',
    module: 'Administración',
    resource: 'Usuarios',
    action: 'ADMIN',
    admitsFormat: false,
    origin: 'EXTENDED',
    catalogStatus: 'EXTENDED'
  },
  {
    id: 'PERM-SEC-ROLE-ACCESS',
    legacyId: 117,
    code: 'SEC_ROLE_ACCESS',
    label: 'Acceso a Roles (Gobierno RBAC)',
    description: 'Visualizar catálogo consolidado de roles y alcance de facultades',
    product: 'SECURITY_RBAC',
    functionality: 'Seguridad',
    module: 'Administración',
    resource: 'Roles',
    action: 'READ',
    admitsFormat: false,
    origin: 'EXTENDED',
    catalogStatus: 'EXTENDED'
  },
  {
    id: 'PERM-SEC-ROLE-CREATE',
    legacyId: 114,
    code: 'SEC_ROLE_CREATE',
    label: 'Crear Roles (Gobierno RBAC)',
    description: 'Crear nuevos roles y paquetes de permisos en el modelo RBAC',
    product: 'SECURITY_RBAC',
    functionality: 'Seguridad',
    module: 'Administración',
    resource: 'Roles',
    action: 'CREATE',
    admitsFormat: false,
    origin: 'EXTENDED',
    catalogStatus: 'EXTENDED'
  },
  {
    id: 'PERM-SEC-ROLE-UPDATE',
    legacyId: 115,
    code: 'SEC_ROLE_UPDATE',
    label: 'Actualizar Roles (Gobierno RBAC)',
    description: 'Modificar configuración, permisos asignados y alcances por formatos',
    product: 'SECURITY_RBAC',
    functionality: 'Seguridad',
    module: 'Administración',
    resource: 'Roles',
    action: 'UPDATE',
    admitsFormat: false,
    origin: 'EXTENDED',
    catalogStatus: 'EXTENDED'
  },
  {
    id: 'PERM-SEC-ROLE-DELETE',
    legacyId: 116,
    code: 'SEC_ROLE_DELETE',
    label: 'Eliminar Roles (Gobierno RBAC)',
    description: 'Eliminar roles sin usuarios asociados ni dependencias activas',
    product: 'SECURITY_RBAC',
    functionality: 'Seguridad',
    module: 'Administración',
    resource: 'Roles',
    action: 'DELETE',
    admitsFormat: false,
    origin: 'EXTENDED',
    catalogStatus: 'EXTENDED'
  },
  {
    id: 'PERM-SEC-ROLE-ADMIN',
    legacyId: 173,
    code: 'SEC_ROLE_ADMIN',
    label: 'Administrador Roles (Gobierno RBAC)',
    description: 'Administración integral de roles, versionamiento y publicación',
    product: 'SECURITY_RBAC',
    functionality: 'Seguridad',
    module: 'Administración',
    resource: 'Roles',
    action: 'ADMIN',
    admitsFormat: false,
    origin: 'EXTENDED',
    catalogStatus: 'EXTENDED'
  },
  {
    id: 'PERM-SEC-ROLE-COPY',
    legacyId: 118,
    code: 'SEC_ROLE_COPY',
    label: 'Copiar Configuración Roles (Gobierno RBAC)',
    description: 'Duplicar configuraciones de roles existentes con nuevos identificadores',
    product: 'SECURITY_RBAC',
    functionality: 'Seguridad',
    module: 'Administración',
    resource: 'Roles',
    action: 'COPY',
    admitsFormat: false,
    origin: 'EXTENDED',
    catalogStatus: 'EXTENDED'
  },
  {
    id: 'PERM-SEC-ADMIN',
    legacyId: 158,
    code: 'SEC_ADMIN',
    label: 'Administrador de Seguridad (Gobierno Central)',
    description: 'Gobierno y administración central de seguridad, políticas y SoD',
    product: 'SECURITY_RBAC',
    functionality: 'Seguridad',
    module: 'Administración',
    resource: 'Seguridad',
    action: 'ADMIN',
    admitsFormat: false,
    origin: 'EXTENDED',
    catalogStatus: 'EXTENDED'
  },
  {
    id: 'PERM-SEC-AUDIT-ACCESS',
    legacyId: 9,
    code: 'SEC_AUDIT_ACCESS',
    label: 'Acceso Auditoría (Visor Forense)',
    description: 'Visualizar registros forenses, trazas de eventos y bitácoras del sistema',
    product: 'SECURITY_RBAC',
    functionality: 'Seguridad',
    module: 'Cumplimiento',
    resource: 'Auditoría',
    action: 'READ',
    admitsFormat: false,
    origin: 'EXTENDED',
    catalogStatus: 'EXTENDED'
  },
  {
    id: 'PERM-SEC-AUDIT-ADMIN',
    legacyId: 146,
    code: 'SEC_AUDIT_ADMIN',
    label: 'Administrador Auditorias (Exportación y Políticas)',
    description: 'Gestión, exportación y políticas de retención de bitácoras de auditoría',
    product: 'SECURITY_RBAC',
    functionality: 'Seguridad',
    module: 'Cumplimiento',
    resource: 'Auditoría',
    action: 'ADMIN',
    admitsFormat: false,
    origin: 'EXTENDED',
    catalogStatus: 'EXTENDED'
  }
];

// Catálogo Consolidado de Permisos (Base 265 + Extensiones del Ecosistema)
export const mockPermissions: Permission[] = [
  ...basePermissions,
  ...extensionPermissions
];

export const mockEntities = [
  { id: 'ENT-1', name: 'Banco Ficticio S.A.' },
  { id: 'ENT-2', name: 'Financiera Demo S.A.' }
];

export const mockEnvironments = [
  { id: 'ENV-PROD', name: 'Producción' },
  { id: 'ENV-TEST', name: 'Pruebas' }
];

export const mockFormats = [
  { id: 'FMT-458', name: 'Formato 458' },
  { id: 'FMT-MURIC', name: 'MURIC' },
  { id: 'FMT-1019', name: 'Formato 1019' },
  { id: 'FMT-FUTURO', name: 'Formato Futuro 2027' }
];

// Roles Oficiales Asignados con referencias directas al Catálogo Consolidado
export const mockRoles: Role[] = [
  {
    id: 'ROL-ID-ADMIN',
    code: 'ID_ADMIN',
    name: 'Administrador de Seguridad',
    description: 'Gestión completa de identidades, usuarios, roles y auditoría RBAC',
    owner: 'Seguridad IT',
    version: 2,
    status: 'PUBLISHED',
    products: ['SECURITY_RBAC'],
    permissions: [
      { permissionId: 'PERM-BASE-1', formatScope: { mode: 'NOT_APPLICABLE', formatIds: [] } },
      { permissionId: 'PERM-BASE-2', formatScope: { mode: 'NOT_APPLICABLE', formatIds: [] } },
      { permissionId: 'PERM-BASE-3', formatScope: { mode: 'NOT_APPLICABLE', formatIds: [] } },
      { permissionId: 'PERM-BASE-4', formatScope: { mode: 'NOT_APPLICABLE', formatIds: [] } },
      { permissionId: 'PERM-BASE-7', formatScope: { mode: 'NOT_APPLICABLE', formatIds: [] } },
      { permissionId: 'PERM-BASE-8', formatScope: { mode: 'NOT_APPLICABLE', formatIds: [] } },
      { permissionId: 'PERM-BASE-9', formatScope: { mode: 'NOT_APPLICABLE', formatIds: [] } },
      { permissionId: 'PERM-BASE-114', formatScope: { mode: 'NOT_APPLICABLE', formatIds: [] } },
      { permissionId: 'PERM-BASE-115', formatScope: { mode: 'NOT_APPLICABLE', formatIds: [] } },
      { permissionId: 'PERM-BASE-116', formatScope: { mode: 'NOT_APPLICABLE', formatIds: [] } },
      { permissionId: 'PERM-BASE-117', formatScope: { mode: 'NOT_APPLICABLE', formatIds: [] } },
      { permissionId: 'PERM-BASE-118', formatScope: { mode: 'NOT_APPLICABLE', formatIds: [] } },
      { permissionId: 'PERM-BASE-145', formatScope: { mode: 'NOT_APPLICABLE', formatIds: [] } },
      { permissionId: 'PERM-BASE-146', formatScope: { mode: 'NOT_APPLICABLE', formatIds: [] } },
      { permissionId: 'PERM-BASE-158', formatScope: { mode: 'NOT_APPLICABLE', formatIds: [] } },
      { permissionId: 'PERM-BASE-173', formatScope: { mode: 'NOT_APPLICABLE', formatIds: [] } },
      { permissionId: 'PERM-SEC-USER-ACCESS', formatScope: { mode: 'NOT_APPLICABLE', formatIds: [] } },
      { permissionId: 'PERM-SEC-ROLE-ACCESS', formatScope: { mode: 'NOT_APPLICABLE', formatIds: [] } },
      { permissionId: 'PERM-SEC-ADMIN', formatScope: { mode: 'NOT_APPLICABLE', formatIds: [] } },
    ]
  },
  {
    id: 'ROL-PREP',
    code: 'DATA_PREP',
    name: 'Preparador de Datos',
    description: 'Configura fuentes, ejecuta validaciones y genera datos regulatorios',
    owner: 'Operaciones',
    version: 1,
    status: 'PUBLISHED',
    products: ['TOTAL_REPORT'],
    permissions: [
      { permissionId: 'PERM-BASE-125', formatScope: { mode: 'NOT_APPLICABLE', formatIds: [] } }, // Acceso Fuentes de Datos
      { permissionId: 'PERM-BASE-15', formatScope: { mode: 'NOT_APPLICABLE', formatIds: [] } },  // Crear FuentesDatos
      { permissionId: 'PERM-BASE-11', formatScope: { mode: 'ALL', formatIds: [] } },             // Generar datos
      { permissionId: 'PERM-BASE-12', formatScope: { mode: 'ALL', formatIds: [] } },             // Acceso a Datos Generados
      { permissionId: 'PERM-BASE-102', formatScope: { mode: 'ALL', formatIds: [] } },            // Validar formato
      { permissionId: 'PERM-BASE-36', formatScope: { mode: 'ALL', formatIds: [] } },             // Validar Datos Formatos
      { permissionId: 'PERM-BASE-13', formatScope: { mode: 'ALL', formatIds: [] } }              // Generar Transmisión
    ]
  },
  {
    id: 'ROL-APPROV',
    code: 'DATA_APRV',
    name: 'Revisor y Aprobador',
    description: 'Aprueba expedientes de transmisión y autoriza ajustes manuales',
    owner: 'Operaciones',
    version: 1,
    status: 'PUBLISHED',
    products: ['TOTAL_REPORT'],
    permissions: [
      { permissionId: 'PERM-BASE-102', formatScope: { mode: 'ALL', formatIds: [] } },            // Validar formato
      { permissionId: 'PERM-BASE-254', formatScope: { mode: 'ALL', formatIds: [] } },            // ModificarDatosGenerados
      { permissionId: 'PERM-BASE-39', formatScope: { mode: 'ALL', formatIds: [] } },             // Aprobar Formatos
      { permissionId: 'PERM-BASE-40', formatScope: { mode: 'ALL', formatIds: [] } },             // Aprobación Datos Formatos
      { permissionId: 'PERM-BASE-41', formatScope: { mode: 'ALL', formatIds: [] } }              // Aprobar Transmisión
    ]
  },
  {
    id: 'ROL-SIGN',
    code: 'SIGNER',
    name: 'Firmante Autorizado',
    description: 'Firma electrónica y digitalmente formatos y transmisiones',
    owner: 'Representación Legal',
    version: 1,
    status: 'PUBLISHED',
    products: ['TOTAL_REPORT'],
    permissions: [
      { permissionId: 'PERM-BASE-89', formatScope: { mode: 'ALL', formatIds: [] } },             // Acceder Firma Formato
      { permissionId: 'PERM-BASE-231', formatScope: { mode: 'ALL', formatIds: [] } },            // Firmar formato Firma Formato
      { permissionId: 'PERM-BASE-233', formatScope: { mode: 'ALL', formatIds: [] } },            // Verificación de Firma Criptográfica
      { permissionId: 'PERM-SIG-ADVANCED', formatScope: { mode: 'ALL', formatIds: [] } }
    ]
  },
  {
    id: 'ROL-AUDIT',
    code: 'AUDITOR',
    name: 'Auditor de Sistema',
    description: 'Consulta y exportación de trazabilidad y eventos de seguridad',
    owner: 'Cumplimiento',
    version: 1,
    status: 'PUBLISHED',
    products: ['SECURITY_RBAC', 'TOTAL_REPORT'],
    permissions: [
      { permissionId: 'PERM-BASE-9', formatScope: { mode: 'NOT_APPLICABLE', formatIds: [] } },   // Acceso Auditoría
      { permissionId: 'PERM-BASE-146', formatScope: { mode: 'NOT_APPLICABLE', formatIds: [] } }, // Administrador Auditorias
      { permissionId: 'PERM-BASE-221', formatScope: { mode: 'NOT_APPLICABLE', formatIds: [] } }, // Consulta de Bitácora Operativa
      { permissionId: 'PERM-SEC-AUDIT-ACCESS', formatScope: { mode: 'NOT_APPLICABLE', formatIds: [] } },
      { permissionId: 'PERM-SEC-AUDIT-ADMIN', formatScope: { mode: 'NOT_APPLICABLE', formatIds: [] } }
    ]
  },
  {
    id: 'ROL-SUPERVISOR',
    code: 'SUPERVISOR',
    name: 'Supervisor de Cumplimiento Consolidado',
    description: 'Supervisión continua, detección de anomalías con IA y consolidación',
    owner: 'Vicepresidencia de Riesgos',
    version: 1,
    status: 'PUBLISHED',
    products: ['TOTAL_SUPERVISION', 'TOTALIA', 'TOTAL_REPORT'],
    permissions: [
      { permissionId: 'PERM-SUP-MONITOR', formatScope: { mode: 'NOT_APPLICABLE', formatIds: [] } },
      { permissionId: 'PERM-SUP-CONSOLIDATE', formatScope: { mode: 'ALL', formatIds: [] } },
      { permissionId: 'PERM-SUP-DASHBOARD', formatScope: { mode: 'NOT_APPLICABLE', formatIds: [] } },
      { permissionId: 'PERM-TOTALIA-ASSIST', formatScope: { mode: 'NOT_APPLICABLE', formatIds: [] } },
      { permissionId: 'PERM-TOTALIA-ANOMALY', formatScope: { mode: 'ALL', formatIds: [] } },
      { permissionId: 'PERM-ANL-DASHBOARD', formatScope: { mode: 'NOT_APPLICABLE', formatIds: [] } }
    ]
  },
  {
    id: 'ROL-TAX-SPEC',
    code: 'TAX_SPEC',
    name: 'Especialista Tributario (TAX 1019 / Medios)',
    description: 'Administración de información exógena, Formato 1019 y cruces tributarios',
    owner: 'Gerencia de Impuestos',
    version: 1,
    status: 'PUBLISHED',
    products: ['TAX_REPORT'],
    permissions: [
      { permissionId: 'PERM-BASE-197', formatScope: { mode: 'NOT_APPLICABLE', formatIds: [] } }, // Administración de Medios Magneticos (TAX)
      { permissionId: 'PERM-BASE-198', formatScope: { mode: 'NOT_APPLICABLE', formatIds: [] } }, // Generación de Cargue
      { permissionId: 'PERM-BASE-202', formatScope: { mode: 'NOT_APPLICABLE', formatIds: [] } }, // Administración CuentaExogena1019
      { permissionId: 'PERM-BASE-204', formatScope: { mode: 'NOT_APPLICABLE', formatIds: [] } }, // Administración SegmentoTitulares1019
      { permissionId: 'PERM-BASE-207', formatScope: { mode: 'NOT_APPLICABLE', formatIds: [] } }, // Administración Terceros
      { permissionId: 'PERM-BASE-210', formatScope: { mode: 'NOT_APPLICABLE', formatIds: [] } }  // Administrador Medios Magneticos (TAX)
    ]
  }
];

export const mockUsers: User[] = [
  { id: 'u1', identity: 'EMP-001', name: 'Ana Preparadora', email: 'ana@total.demo', type: 'HUMAN', status: 'ACTIVE', entities: ['ENT-1', 'ENT-2'], products: ['TOTAL_REPORT', 'SECURITY_RBAC'], roles: ['ROL-PREP'] },
  { id: 'u2', identity: 'EMP-002', name: 'Carlos Aprobador', email: 'carlos@total.demo', type: 'HUMAN', status: 'ACTIVE', entities: ['ENT-1'], products: ['TOTAL_REPORT'], roles: ['ROL-APPROV'] },
  { id: 'u3', identity: 'EMP-003', name: 'Laura Firmante', email: 'laura@total.demo', type: 'HUMAN', status: 'ACTIVE', entities: ['ENT-1'], products: ['TOTAL_REPORT'], roles: ['ROL-SIGN'] },
  { id: 'u4', identity: 'EMP-004', name: 'Pedro Operador', email: 'pedro@total.demo', type: 'HUMAN', status: 'ACTIVE', entities: ['ENT-2'], products: ['TOTAL_REPORT', 'TAX_REPORT'], roles: ['ROL-PREP', 'ROL-TAX-SPEC'] },
  { id: 'u5', identity: 'EMP-005', name: 'Sofía Analista', email: 'sofia@total.demo', type: 'HUMAN', status: 'ACTIVE', entities: ['ENT-1', 'ENT-2'], products: ['TOTAL_REPORT', 'SECURITY_RBAC', 'TOTAL_SUPERVISION', 'TOTALIA'], roles: ['ROL-APPROV', 'ROL-SIGN', 'ROL-SUPERVISOR'] },
  { id: 'u6', identity: 'EMP-006', name: 'Diego Auditor', email: 'diego@total.demo', type: 'HUMAN', status: 'ACTIVE', entities: ['ENT-1', 'ENT-2'], products: ['TOTAL_REPORT', 'SECURITY_RBAC'], roles: ['ROL-AUDIT'] },
  { id: 'u7', identity: 'EMP-007', name: 'Andrey Ramírez', email: 'aramirez@jwproject.com.co', type: 'HUMAN', status: 'ACTIVE', entities: ['ENT-1', 'ENT-2', 'ENT-3'], products: ['TOTAL_REPORT', 'TOTAL_SUPERVISION', 'TAX_REPORT', 'TOTALIA', 'SECURITY_RBAC'], roles: ['ROL-ID-ADMIN'] },
  { id: 'u8', identity: 'SVC-001', name: 'Servicio Extracción', email: 'svc_extract@total.demo', type: 'SERVICE', status: 'ACTIVE', entities: ['ENT-1', 'ENT-2'], products: ['TOTAL_REPORT'], roles: ['ROL-PREP'] },
];

export const mockRequests: AccessRequest[] = [
  { id: 'REQ-1001', userId: 'u4', roleId: 'ROL-PREP', entityId: 'ENT-2', environmentId: 'ENV-PROD', status: 'PENDING', requestDate: '2026-09-07T10:30:00Z', requestedBy: 'u4', justification: 'Necesario para la nueva campaña de transmisión de fin de mes.' },
  { id: 'REQ-1002', userId: 'u5', roleId: 'ROL-SIGN', entityId: 'ENT-1', environmentId: 'ENV-PROD', status: 'APPROVED', requestDate: '2026-09-05T14:15:00Z', requestedBy: 'u1', justification: 'Reemplazo temporal por vacaciones de Laura Firmante.' },
  { id: 'REQ-1003', userId: 'u2', roleId: 'ROL-AUDIT', entityId: 'ENT-1', environmentId: 'ENV-PROD', status: 'REJECTED', requestDate: '2026-09-02T09:00:00Z', requestedBy: 'u2', justification: 'Solicito permisos de auditoría para revisar logs.' },
];

export const mockAuditLogs: any[] = [
  { id: 'AUD-2026-1001', timestamp: '2026-09-07T10:15:22Z', actorId: 'EMP-007', actorName: 'Andrey Ramírez', action: 'CREATE_USER', targetResource: 'Usuario', targetId: 'EMP-005', module: 'Seguridad', status: 'SUCCESS', ipAddress: '192.168.1.45', details: 'Usuario creado con roles y productos configurados.' },
  { id: 'AUD-2026-1002', timestamp: '2026-09-07T10:30:00Z', actorId: 'EMP-001', actorName: 'Ana Preparadora', action: 'SIGN_DOCUMENT', targetResource: 'Firma', targetId: 'FMT-458', module: 'Transmisión', status: 'SUCCESS', ipAddress: '10.0.5.112', details: 'Firma criptográfica aplicada al lote EXP-2026-09-001.' },
  { id: 'AUD-2026-1003', timestamp: '2026-09-07T11:05:12Z', actorId: 'EMP-004', actorName: 'Pedro Operador', action: 'READ_DASHBOARD', targetResource: 'Tablero', targetId: 'Analítica Consolidada', module: 'Analítica', status: 'DENIED', ipAddress: '172.16.0.8', details: 'Acceso denegado: carece de permisos para consultar el recurso.' },
  { id: 'AUD-2026-1004', timestamp: '2026-09-07T14:20:45Z', actorId: 'EMP-002', actorName: 'Carlos Aprobador', action: 'APPROVE_REQUEST', targetResource: 'Solicitud', targetId: 'REQ-1002', module: 'Seguridad', status: 'SUCCESS', ipAddress: '10.0.5.99', details: 'Solicitud aprobada con justificación: "Reemplazo temporal".' },
  { id: 'AUD-2026-1005', timestamp: '2026-09-07T15:45:00Z', actorId: 'SVC-001', actorName: 'Servicio Extracción', action: 'GENERATE_FILE', targetResource: 'Archivo', targetId: 'TX-2026-001', module: 'Transmisión', status: 'SUCCESS', ipAddress: 'Internal-Job', details: 'Generación automática de formato regulatorio iniciada.' }
];

export const mockDataSources: any[] = [
  {
    id: 'SRC-001',
    name: 'Core Bancario - Saldos y Pasivos',
    type: 'RELATIONAL',
    scope: 'SHARED',
    formats: ['FMT-458', 'FMT-MURIC'],
    status: 'ACTIVE',
    owner: 'Operaciones TI',
    host: 'core-db-prod.internal.bank',
    port: 5432,
    database: 'CORE_BANKING_PROD',
    schema: 'DBO_FINANCE',
    lastTestStatus: 'SUCCESS',
    lastTestedAt: '2026-09-07 09:12:00',
    lastSyncAt: '2026-09-07 06:00:00'
  },
  {
    id: 'SRC-002',
    name: 'Motor de Riesgo de Crédito (Calificaciones)',
    type: 'RELATIONAL',
    scope: 'EXCLUSIVE',
    formats: ['FMT-458'],
    status: 'ACTIVE',
    owner: 'Vicepresidencia de Riesgos',
    host: 'risk-engine.internal.bank',
    port: 1433,
    database: 'CREDIT_RISK_DB',
    schema: 'PROV_IFRS9',
    lastTestStatus: 'SUCCESS',
    lastTestedAt: '2026-09-07 08:30:00',
    lastSyncAt: '2026-09-07 05:45:00'
  },
  {
    id: 'SRC-003',
    name: 'Mainframe AS/400 - Contabilidad Histórica',
    type: 'AS400',
    scope: 'SHARED',
    formats: ['FMT-MURIC', 'FMT-1019'],
    status: 'ACTIVE',
    owner: 'Arquitectura Core',
    host: '10.200.4.15',
    port: 8471,
    database: 'QSYS',
    schema: 'GLDATA2026',
    lastTestStatus: 'SUCCESS',
    lastTestedAt: '2026-09-06 22:00:00',
    lastSyncAt: '2026-09-07 02:00:00'
  },
  {
    id: 'SRC-004',
    name: 'Repositorio SFTP Encriptado - Conciliaciones',
    type: 'SFTP',
    scope: 'EXCLUSIVE',
    formats: ['FMT-458'],
    status: 'ACTIVE',
    owner: 'Tesoreria',
    host: 'sftp.seguro.bank.com',
    port: 22,
    database: '/var/sftp/regulatory/incoming',
    schema: 'CLEAN_DATA',
    lastTestStatus: 'SUCCESS',
    lastTestedAt: '2026-09-07 07:10:00',
    lastSyncAt: '2026-09-07 07:15:00'
  }
];

export const mockSoDRules: any[] = [
  {
    id: 'SOD-001',
    code: 'SOD-PREP-APPROV',
    name: 'Segregación Preparador vs Aprobador',
    description: 'La misma identidad no puede preparar la data y simultáneamente autorizar el expediente para despacho regulatorio.',
    riskLevel: 'CRITICAL',
    incompatibleActions: ['Generar/Ajustar Datos (PERM-BASE-11 / PERM-BASE-254)', 'Aprobar Transmisión (PERM-BASE-41)'],
    regulatoryCitation: 'Circular Básica Jurídica SFC - Sistema de Control Interno (SCI)'
  },
  {
    id: 'SOD-002',
    code: 'SOD-SIGN-TRANSMIT',
    name: 'Independencia de Firma Legal y Despacho Tecnológico',
    description: 'El apoderado legal que estampa la firma digital vinculante no debe ejecutar el envío del paquete de red.',
    riskLevel: 'HIGH',
    incompatibleActions: ['Firmar Formato (PERM-BASE-231)', 'Transmitir al Ente (PERM-BASE-13)'],
    regulatoryCitation: 'Ley 527 de Comercio Electrónico y Decreto Único 1074'
  },
  {
    id: 'SOD-003',
    code: 'SOD-ADMIN-OPERATOR',
    name: 'Incompatibilidad Administrador RBAC y Operador Transaccional',
    description: 'Los administradores de identidades y roles no pueden ostentar permisos operativos de generación o firma de formatos.',
    riskLevel: 'CRITICAL',
    incompatibleActions: ['Administrar Roles (PERM-BASE-173)', 'Firmar Formato (PERM-BASE-231)'],
    regulatoryCitation: 'Norma ISO/IEC 27001 Control A.9.2.3 y Sox Section 404'
  }
];

export const mockDelegations: any[] = [
  {
    id: 'DEL-2026-01',
    delegatorId: 'u3',
    delegatorName: 'Laura Firmante',
    delegateId: 'u5',
    delegateName: 'Sofía Analista',
    scopeRole: 'ROL-SIGN',
    startDate: '2026-09-01',
    endDate: '2026-09-15',
    status: 'ACTIVE',
    justification: 'Cobertura por incapacidad médica y licencia temporal con aval de Revisoría Fiscal.'
  },
  {
    id: 'DEL-2026-02',
    delegatorId: 'u2',
    delegatorName: 'Carlos Aprobador',
    delegateId: 'u1',
    delegateName: 'Ana Preparadora',
    scopeRole: 'ROL-APPROV',
    startDate: '2026-08-01',
    endDate: '2026-08-10',
    status: 'EXPIRED',
    justification: 'Período de receso laboral estival 2026.'
  }
];

export const mockTaxThirdParties: any[] = [
  {
    id: 'TAX-TP-001',
    nit: '900.123.456',
    dv: '8',
    name: 'SERVICIOS TECNOLÓGICOS DEL VALLE S.A.S.',
    personType: 'JURIDICA',
    city: 'Cali (Valle del Cauca)',
    country: 'Colombia',
    accumulatedWithholding: 4850000,
    baseAmount: 138571428,
    taxRatePercent: 3.5,
    status: 'CONCILIATED'
  },
  {
    id: 'TAX-TP-002',
    nit: '860.987.654',
    dv: '3',
    name: 'LOGÍSTICA Y TRANSPORTES ANDINOS S.A.',
    personType: 'JURIDICA',
    city: 'Bogotá D.C.',
    country: 'Colombia',
    accumulatedWithholding: 18900000,
    baseAmount: 756000000,
    taxRatePercent: 2.5,
    status: 'CONCILIATED'
  },
  {
    id: 'TAX-TP-003',
    nit: '79.456.789',
    dv: '1',
    name: 'GUSTAVO ADOLFO JARAMILLO OROZCO',
    personType: 'NATURAL',
    city: 'Medellín (Antioquia)',
    country: 'Colombia',
    accumulatedWithholding: 2450000,
    baseAmount: 24500000,
    taxRatePercent: 10.0,
    status: 'DISCREPANCY'
  },
  {
    id: 'TAX-TP-004',
    nit: '901.445.882',
    dv: '7',
    name: 'INVERSIONES AGROFORESTALES DEL CARIBE S.A.S.',
    personType: 'JURIDICA',
    city: 'Barranquilla (Atlántico)',
    country: 'Colombia',
    accumulatedWithholding: 8200000,
    baseAmount: 205000000,
    taxRatePercent: 4.0,
    status: 'CONCILIATED'
  }
];
