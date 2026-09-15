import { useState, useMemo } from 'react';
import { catalogPermissions } from '../../lib/catalog-data';
import { mockFormats } from '../../lib/mock-data';
import { Badge, Button, SidePanel } from '../ui/Shared';
import { Search, Filter, AlertCircle, Info, FileEdit, Trash2, ShieldAlert } from 'lucide-react';
import { cn } from '../../lib/utils';
import { PermissionDefinition } from '../../types/catalog';

interface FormatScope {
  mode: 'ALL' | 'SELECTED' | 'NOT_APPLICABLE';
  formatIds: string[];
}

interface RolePermission {
  permissionId: string;
  formatScope: FormatScope;
}

interface PermissionEditorProps {
  initialPermissions: RolePermission[];
  isReadOnly?: boolean;
  onSaveDraft?: (perms: RolePermission[]) => void;
  onReviewChanges?: (perms: RolePermission[]) => void;
}

export function PermissionEditor({ initialPermissions, isReadOnly = false, onSaveDraft, onReviewChanges }: PermissionEditorProps) {
  const [permissions, setPermissions] = useState<RolePermission[]>(initialPermissions);
  const [searchTerm, setSearchTerm] = useState('');
  const [moduleFilter, setModuleFilter] = useState<string>('ALL');
  const [editingScopeFor, setEditingScopeFor] = useState<PermissionDefinition | null>(null);
  const [isReviewing, setIsReviewing] = useState(false);

  // Computed state for the format scope side panel
  const [tempFormatIds, setTempFormatIds] = useState<string[]>([]);

  const modules = useMemo(() => Array.from(new Set(catalogPermissions.map(p => p.module))).sort(), []);

  const filteredCatalog = useMemo(() => {
    return catalogPermissions.filter(p => {
      const matchesSearch = p.label.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            p.code.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesModule = moduleFilter === 'ALL' || p.module === moduleFilter;
      return matchesSearch && matchesModule;
    });
  }, [searchTerm, moduleFilter]);

  const getRolePermission = (permId: string) => permissions.find(p => p.permissionId === permId);

  const handleTogglePermission = (def: PermissionDefinition) => {
    if (isReadOnly) return;
    
    const exists = getRolePermission(def.id);
    if (exists) {
      setPermissions(prev => prev.filter(p => p.permissionId !== def.id));
    } else {
      setPermissions(prev => [...prev, {
        permissionId: def.id,
        formatScope: def.admitsFormat ? { mode: 'ALL', formatIds: [] } : { mode: 'NOT_APPLICABLE', formatIds: [] }
      }]);
    }
  };

  const openScopeEditor = (def: PermissionDefinition) => {
    if (isReadOnly) return;
    const rp = getRolePermission(def.id);
    if (rp && rp.formatScope.mode !== 'NOT_APPLICABLE') {
      setTempFormatIds(rp.formatScope.mode === 'SELECTED' ? [...rp.formatScope.formatIds] : []);
      setEditingScopeFor(def);
    }
  };

  const toggleTempFormat = (formatId: string) => {
    setTempFormatIds(prev => 
      prev.includes(formatId) ? prev.filter(id => id !== formatId) : [...prev, formatId]
    );
  };

  const saveScope = () => {
    if (!editingScopeFor) return;
    
    setPermissions(prev => prev.map(p => {
      if (p.permissionId === editingScopeFor.id) {
        if (tempFormatIds.length === 0) {
          // Empty selection implies ALL
          return { ...p, formatScope: { mode: 'ALL', formatIds: [] } };
        } else {
          return { ...p, formatScope: { mode: 'SELECTED', formatIds: tempFormatIds } };
        }
      }
      return p;
    }));
    
    setEditingScopeFor(null);
  };

  return (
    <div className="flex flex-col h-full bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      
      {/* Editor Header */}
      <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <div className="relative w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Buscar permisos..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-sm border border-slate-200 rounded-md focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none w-full"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select 
              className="text-sm border-slate-200 rounded-md outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
              value={moduleFilter}
              onChange={e => setModuleFilter(e.target.value)}
            >
              <option value="ALL">Todos los Módulos</option>
              {modules.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>

        {!isReadOnly && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500 mr-2">{permissions.length} seleccionados</span>
            <Button variant="secondary" onClick={() => onSaveDraft && onSaveDraft(permissions)} className="gap-2 text-slate-700">
              Guardar Borrador
            </Button>
            <Button onClick={() => setIsReviewing(true)} className="bg-brand-primary hover:bg-blue-700 text-white">
              Revisar Cambios
            </Button>
          </div>
        )}
      </div>

      {/* Main Grid */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-white text-slate-500 sticky top-0 border-b border-slate-200 z-10 shadow-sm">
            <tr>
              <th className="px-6 py-3 font-medium w-12 text-center">Hab.</th>
              <th className="px-6 py-3 font-medium">Acción / Recurso</th>
              <th className="px-6 py-3 font-medium">Alcance Formatos</th>
              <th className="px-6 py-3 font-medium">Condiciones</th>
              {!isReadOnly && <th className="px-6 py-3 font-medium text-center w-24">Ajustar</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredCatalog.map(def => {
              const rp = getRolePermission(def.id);
              const isEnabled = !!rp;

              return (
                <tr key={def.id} className={cn("transition-colors group", isEnabled ? "bg-blue-50/30 hover:bg-blue-50/60" : "hover:bg-slate-50")}>
                  <td className="px-6 py-4 text-center">
                    <input 
                      type="checkbox" 
                      checked={isEnabled}
                      onChange={() => handleTogglePermission(def)}
                      disabled={isReadOnly}
                      className={cn(
                        "w-4 h-4 rounded border-slate-300 focus:ring-brand-primary cursor-pointer",
                        isEnabled ? "text-brand-primary" : "text-slate-400"
                      )}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <p className={cn("font-bold", isEnabled ? "text-blue-900" : "text-slate-700")}>{def.label}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-slate-500 font-mono">{def.code}</span>
                      <span className="text-slate-300">•</span>
                      <span className="text-xs text-slate-500">{def.module} / {def.resource}</span>
                      {def.riskLevel === 'CRITICAL' && (
                        <ShieldAlert className="w-3.5 h-3.5 text-red-500 ml-1" />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {!isEnabled ? (
                      <span className="text-slate-400 text-xs italic">No concedido</span>
                    ) : rp.formatScope.mode === 'NOT_APPLICABLE' ? (
                      <Badge variant="neutral">No Aplica</Badge>
                    ) : rp.formatScope.mode === 'ALL' ? (
                      <div className="flex items-center gap-2">
                        <Badge variant="success">Todos los formatos</Badge>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {rp.formatScope.formatIds.map(f => {
                          const fName = mockFormats.find(mf => mf.id === f)?.name || f;
                          return (
                            <span key={f} className="text-[10px] bg-blue-100 text-blue-800 border border-blue-200 px-2 py-0.5 rounded-full font-medium">
                              {fName}
                            </span>
                          );
                        })}
                        <span className="text-xs text-slate-500 ml-1">({rp.formatScope.formatIds.length} selec.)</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {/* Condiciones estáticas para demo */}
                    <span className="text-slate-400 text-xs">Sin condiciones adic.</span>
                  </td>
                  {!isReadOnly && (
                    <td className="px-6 py-4 text-center">
                      {isEnabled && def.admitsFormat && (
                        <Button variant="ghost" size="sm" onClick={() => openScopeEditor(def)} className="text-brand-primary hover:bg-blue-50">
                          <FileEdit className="w-4 h-4" />
                        </Button>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
            
            {filteredCatalog.length === 0 && (
              <tr>
                <td colSpan={isReadOnly ? 4 : 5} className="px-6 py-12 text-center text-slate-500">
                  <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                  No se encontraron permisos con esos filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Format Scope Side Panel */}
      <SidePanel 
        isOpen={!!editingScopeFor}
        onClose={() => setEditingScopeFor(null)}
        title="Editar Alcance de Formatos"
      >
        {editingScopeFor && (
          <div className="space-y-6 flex flex-col h-full">
            <div>
              <h4 className="font-bold text-slate-900">{editingScopeFor.label}</h4>
              <p className="text-sm text-slate-500 font-mono mt-1">{editingScopeFor.code}</p>
            </div>

            <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-blue-900 font-medium">Regla Irrenunciable de Formatos</p>
                <p className="text-xs text-blue-800 mt-1">
                  Si no seleccionas ningún formato (0 seleccionados), el permiso aplicará automáticamente a <strong>Todos los Formatos</strong> compatibles, incluidos los futuros. 
                  Para retirar el acceso, debes desactivar el permiso completamente en la tabla.
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-auto">
              <div className="flex items-center justify-between mb-3">
                <h5 className="font-medium text-slate-900 text-sm">Formatos Disponibles</h5>
                {tempFormatIds.length > 0 && (
                  <button 
                    className="text-xs text-slate-500 hover:text-red-600 font-medium transition-colors"
                    onClick={() => setTempFormatIds([])}
                  >
                    Limpiar selección (Restablecer a Todos)
                  </button>
                )}
              </div>
              
              <div className="space-y-2">
                {mockFormats.map(fmt => {
                  const isSelected = tempFormatIds.includes(fmt.id);
                  return (
                    <label key={fmt.id} className={cn(
                      "flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors",
                      isSelected ? "border-brand-primary bg-blue-50/30" : "border-slate-200 hover:bg-slate-50"
                    )}>
                      <input 
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleTempFormat(fmt.id)}
                        className="w-4 h-4 rounded border-slate-300 text-brand-primary focus:ring-brand-primary"
                      />
                      <div className="flex-1">
                        <span className={cn("text-sm font-medium", isSelected ? "text-blue-900" : "text-slate-700")}>{fmt.name}</span>
                        <span className="block text-xs text-slate-500 font-mono mt-0.5">{fmt.id}</span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 mt-auto">
              <div className="mb-4">
                <span className="text-sm text-slate-600">Alcance resultante: </span>
                {tempFormatIds.length === 0 ? (
                  <Badge variant="success">Todos los formatos compatibles</Badge>
                ) : (
                  <Badge variant="warning">Limitado a {tempFormatIds.length} formato(s)</Badge>
                )}
              </div>
              
              <div className="flex gap-3">
                <Button variant="secondary" className="flex-1" onClick={() => setEditingScopeFor(null)}>
                  Cancelar
                </Button>
                <Button className="flex-1" onClick={saveScope}>
                  Guardar Alcance
                </Button>
              </div>
            </div>
          </div>
        )}
      </SidePanel>

      {/* Review Changes Side Panel */}
      <SidePanel
        isOpen={isReviewing}
        onClose={() => setIsReviewing(false)}
        title="Revisión de Cambios"
      >
        <div className="space-y-6 flex flex-col h-full">
          <div className="flex-1 overflow-auto space-y-6">
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg">
              <h4 className="font-bold text-slate-900 mb-2">Resumen de la Versión</h4>
              <ul className="text-sm text-slate-600 space-y-1">
                <li>Permisos Anteriores: <span className="font-bold">{initialPermissions.length}</span></li>
                <li>Permisos Nuevos: <span className="font-bold">{permissions.length}</span></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-blue-500" /> Detalle de Diferencias
              </h4>
              <div className="space-y-3">
                {/* Simplified differences view for demo */}
                {permissions.map(p => {
                  const initial = initialPermissions.find(ip => ip.permissionId === p.permissionId);
                  const def = catalogPermissions.find(c => c.id === p.permissionId);
                  
                  if (!initial) {
                    return (
                      <div key={p.permissionId} className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg">
                        <span className="text-xs font-bold text-emerald-600 uppercase">Añadido</span>
                        <p className="font-medium text-slate-900 mt-1">{def?.label}</p>
                        <p className="text-xs text-slate-500 font-mono">{p.permissionId}</p>
                      </div>
                    );
                  }
                  
                  if (initial.formatScope.mode !== p.formatScope.mode || 
                      initial.formatScope.formatIds.join(',') !== p.formatScope.formatIds.join(',')) {
                    return (
                      <div key={p.permissionId} className="p-3 bg-amber-50 border border-amber-100 rounded-lg">
                        <span className="text-xs font-bold text-amber-600 uppercase">Alcance Modificado</span>
                        <p className="font-medium text-slate-900 mt-1">{def?.label}</p>
                        <p className="text-xs text-slate-500">De {initial.formatScope.mode} a {p.formatScope.mode}</p>
                      </div>
                    );
                  }
                  
                  return null;
                })}
                
                {initialPermissions.map(ip => {
                  const current = permissions.find(p => p.permissionId === ip.permissionId);
                  const def = catalogPermissions.find(c => c.id === ip.permissionId);
                  
                  if (!current) {
                    return (
                      <div key={ip.permissionId} className="p-3 bg-red-50 border border-red-100 rounded-lg">
                        <span className="text-xs font-bold text-red-600 uppercase">Retirado</span>
                        <p className="font-medium text-slate-900 mt-1">{def?.label}</p>
                        <p className="text-xs text-slate-500 font-mono">{ip.permissionId}</p>
                      </div>
                    );
                  }
                  return null;
                })}

                {JSON.stringify(permissions) === JSON.stringify(initialPermissions) && (
                  <p className="text-sm text-slate-500 text-center py-4">No hay cambios respecto a la versión inicial.</p>
                )}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 mt-auto flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setIsReviewing(false)}>
              Seguir Editando
            </Button>
            <Button 
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => {
                setIsReviewing(false);
                if (onReviewChanges) onReviewChanges(permissions);
              }}
            >
              Publicar / Solicitar
            </Button>
          </div>
        </div>
      </SidePanel>
    </div>
  );
}
