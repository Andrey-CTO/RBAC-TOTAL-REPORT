import { LegacyActionMapping, PermissionDefinition } from '../types/catalog';
import { legacyRawData } from './legacy-data';

// Helper for generating standard definitions
function createDef(code: string, label: string, description: string, module: string, resource: string, action: string, risk: 'LOW'|'MEDIUM'|'HIGH'|'CRITICAL' = 'LOW', admitsFormat = false): PermissionDefinition {
  return {
    id: `PERM-${code.toUpperCase().replace(/\./g, '-')}`,
    code, label, description, module, resource, action,
    compatibleProcesses: ['PROC-DEFAULT'],
    applicableDimensions: admitsFormat ? ['ENTITY', 'FORMAT'] : ['ENTITY'],
    admitsFormat, riskLevel: risk, version: 1, status: 'ACTIVE', origin: 'LEGACY'
  };
}

// 1. Normalización de Permisos Clave
export const catalogPermissions: PermissionDefinition[] = [
  // Usuarios
  createDef('user.read', 'Consultar Usuarios', 'Permite ver listado y detalles de usuarios', 'Seguridad', 'Usuario', 'read', 'LOW'),
  createDef('user.create', 'Invitar/Crear Usuario', 'Permite crear nuevos usuarios o invitar', 'Seguridad', 'Usuario', 'create', 'MEDIUM'),
  createDef('user.update', 'Editar Usuario', 'Permite editar datos de usuarios', 'Seguridad', 'Usuario', 'update', 'MEDIUM'),
  createDef('user.suspend', 'Suspender Usuario', 'Desactiva temporalmente el acceso', 'Seguridad', 'Usuario', 'suspend', 'HIGH'),
  
  // Fuentes (15/100 consolidado)
  createDef('source.create', 'Crear Fuente de Datos', 'Permite crear fuentes globales o específicas (cubre 15 y 100)', 'Configuración', 'Fuente', 'create', 'MEDIUM', true),
  
  // Catálogos: Ciudades (46/128 consolidado)
  createDef('catalog.city.delete', 'Eliminar Ciudad', 'Permite eliminar ciudades del catálogo (cubre 46 y 128)', 'Parámetros', 'Catálogo Ciudad', 'delete', 'HIGH'),
  
  // Tipo Identificación (85/127 y 86/133)
  createDef('catalog.idtype.create', 'Crear Tipo Identificación', 'Cubre 85 y 127', 'Parámetros', 'Catálogo Tipo ID', 'create', 'MEDIUM'),
  createDef('catalog.idtype.delete', 'Eliminar Tipo Identificación', 'Cubre 86 y 133', 'Parámetros', 'Catálogo Tipo ID', 'delete', 'HIGH'),
  
  // Validación (102/218)
  createDef('validation.configure', 'Configurar Validación', 'Acceso a la vista de configuración', 'Formatos', 'Validación', 'configure', 'MEDIUM', true),
  createDef('validation.execute', 'Ejecutar Validación', 'Ejecución real de la validación', 'Formatos', 'Validación', 'execute', 'HIGH', true),
  
  // Auditoría (7/8 - ahora de sistema, solo lectura para usuarios)
  createDef('audit.read', 'Consultar Auditoría', 'Permite buscar y visualizar eventos', 'Seguridad', 'Auditoría', 'read', 'LOW'),
  createDef('audit.export', 'Exportar Auditoría', 'Permite exportar eventos a archivo', 'Seguridad', 'Auditoría', 'export', 'MEDIUM'),
  
  // Aprobaciones y Datos (240/254/256)
  createDef('data.reopen', 'Reabrir Aprobados', 'Solicitar o ejecutar reapertura de datos cerrados', 'Operación', 'Datos', 'reopen', 'CRITICAL', true),
  createDef('data.adjust', 'Modificar Aprobados', 'Cambiar valores de formato generado', 'Operación', 'Datos', 'adjust', 'CRITICAL', true),
  
  // Firmas (89/150/231)
  createDef('signature.request', 'Solicitar Firma', 'Pedir firma a usuarios habilitados', 'Transmisión', 'Firma', 'request', 'MEDIUM', true),
  createDef('signature.sign', 'Firmar Formato', 'Ejecutar firma (requiere habilitación criptográfica)', 'Transmisión', 'Firma', 'sign', 'CRITICAL', true),
  
  // Transmisión
  createDef('transmission.generate', 'Generar Archivo', 'Crear archivo estructurado (requiere MURIC y/o 458)', 'Transmisión', 'Archivo', 'generate', 'HIGH', true),
  createDef('transmission.send', 'Enviar', 'Transmitir al ente de control', 'Transmisión', 'Transmisión', 'send', 'CRITICAL', true),

  // Analítica
  createDef('analytics.dashboard.read', 'Consultar Tablero', 'Ver tableros analíticos', 'Analítica', 'Tablero', 'read', 'LOW', true),
  createDef('analytics.export', 'Exportar Datos', 'Exportar resultados analíticos', 'Analítica', 'Dataset', 'export', 'MEDIUM', true),
  createDef('analytics.schedule', 'Programar Entrega', 'Programar entrega de reportes', 'Analítica', 'Reporte', 'schedule', 'MEDIUM', true),

  // Informes Financieros y Plantillas
  createDef('report.read', 'Consultar Informes', 'Ver informes y plantillas', 'Informes', 'Plantilla', 'read', 'LOW', false),
  createDef('report.edit', 'Editar Informes', 'Modificar informes y plantillas', 'Informes', 'Plantilla', 'update', 'MEDIUM', false),

  // TAX y Terceros
  createDef('tax.admin', 'Administrar TAX', 'Configurar carga y rangos TAX', 'Impuestos', 'TAX 1019', 'admin', 'HIGH', false),
  createDef('thirdparty.admin', 'Administrar Terceros', 'Gestión de terceros', 'Configuración', 'Tercero', 'admin', 'MEDIUM', false),

  // P&L y Legados
  createDef('legacy.pandl', 'Acceso P&L', 'Reporte de Pérdidas y Ganancias', 'Informes', 'P&L', 'read', 'MEDIUM', false),
];

// 2. Mapeos de las 265 acciones
export const legacyMappings: LegacyActionMapping[] = legacyRawData.map((raw) => {
  const mapping: LegacyActionMapping = {
    legacyId: raw.id,
    originalName: raw.name,
    originalDescription: raw.desc,
    sheet: 'Hoja1',
    row: raw.id + 1,
    destinationPermissions: [],
    equivalence: 'DIRECT_EQUIVALENCE_PROPOSED',
    status: 'PENDING'
  };

  // Casos específicos obligatorios
  if (raw.id === 1) { mapping.destinationPermissions = ['PERM-USER-CREATE']; mapping.status = 'VERIFIED'; }
  if (raw.id === 7 || raw.id === 8) {
    mapping.equivalence = 'WITHDRAWAL_WITH_REPLACEMENT';
    mapping.observation = 'La escritura de auditoría pasa a servicio de sistema. El usuario no edita el historial.';
    mapping.status = 'VERIFIED';
  }
  if (raw.id === 15 || raw.id === 100) {
    mapping.equivalence = 'CANDIDATE_CONSOLIDATION';
    mapping.destinationPermissions = ['PERM-SOURCE-CREATE'];
    mapping.observation = 'Superposición de creación de fuentes consolidada.';
    mapping.status = 'VERIFIED';
  }
  if (raw.id === 32 || raw.id === 195 || raw.id === 206) {
    mapping.equivalence = 'SPLIT';
    mapping.observation = 'Descripciones ambiguas. Requiere evidencia adicional del sistema legado para desglosar permisos.';
    mapping.status = 'PENDING';
  }
  if (raw.id >= 145 && raw.id <= 179) {
    mapping.equivalence = 'ROLE_PACKAGE';
    mapping.observation = 'Paquete de administrador. A desglosar en acciones granulares. No se otorga comodín.';
    if (raw.id === 145) mapping.destinationPermissions = ['PERM-USER-READ', 'PERM-USER-CREATE', 'PERM-USER-UPDATE', 'PERM-USER-SUSPEND'];
  }
  if (raw.id === 211) {
    mapping.equivalence = 'ROLE_PACKAGE';
    mapping.observation = 'Paquete administrador de aplicación. No se concede como acción comodín.';
    mapping.status = 'VERIFIED';
  }
  if (raw.id === 102 || raw.id === 218) {
    mapping.equivalence = 'SPLIT';
    mapping.destinationPermissions = ['PERM-VALIDATION-CONFIGURE', 'PERM-VALIDATION-EXECUTE'];
    mapping.observation = 'Se separa acceso visual de la ejecución real de validaciones.';
    mapping.status = 'VERIFIED';
  }

  // Plantillas e Informes (180-192)
  if (raw.id >= 180 && raw.id <= 192) {
    mapping.equivalence = 'CANDIDATE_CONSOLIDATION';
    mapping.destinationPermissions = ['PERM-REPORT-READ', 'PERM-REPORT-EDIT'];
    mapping.observation = 'Habilitaciones de botones (Word, PDF, Gráficos) consolidadas en edición general y lectura. Exportar requiere permiso de datos.';
    mapping.status = 'VERIFIED';
  }

  // TAX y Terceros
  if (raw.id >= 198 && raw.id <= 206) {
    mapping.equivalence = 'ROLE_PACKAGE';
    mapping.destinationPermissions = ['PERM-TAX-ADMIN'];
    mapping.observation = 'Gestión TAX 1019 consolidada.';
    mapping.status = 'PENDING';
  }
  
  if (raw.id >= 207 && raw.id <= 210) {
    mapping.equivalence = 'CANDIDATE_CONSOLIDATION';
    mapping.destinationPermissions = ['PERM-THIRDPARTY-ADMIN'];
    mapping.observation = 'Terceros consolidados en administración general.';
    mapping.status = 'PENDING';
  }

  // Legados: P&L, Otros
  if (raw.id === 260) {
    mapping.equivalence = 'DIRECT_EQUIVALENCE_PROPOSED';
    mapping.destinationPermissions = ['PERM-LEGACY-PANDL'];
    mapping.status = 'VERIFIED';
  }
  
  if (raw.id >= 261 && raw.id <= 265) {
    mapping.equivalence = 'SPLIT';
    mapping.observation = 'Pendiente de descomposición de catálogos y Gestión Otros. No se otorga como comodín.';
    mapping.status = 'PENDING';
  }
  
  return mapping;
});
