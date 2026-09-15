import { useState } from 'react';
import { Badge, Button } from '../../components/ui/Shared';
import { Search, Plus, Shield, Copy, Eye, Users, AlertCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../../lib/store';
import { ProductCode, Role } from '../../types/rbac';

export function RolesList() {
  const store = useStore();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [productFilter, setProductFilter] = useState<string>('ALL');

  const filteredRoles = store.roles.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          r.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          r.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
    const matchesProduct = productFilter === 'ALL' || r.products.includes(productFilter as ProductCode);
    return matchesSearch && matchesStatus && matchesProduct;
  });

  const handleDuplicate = (role: Role) => {
    const newRole: Role = {
      ...role,
      id: `ROL-${Date.now()}`,
      code: `${role.code}_COPIA`,
      name: `${role.name} (Copia)`,
      version: 1,
      status: 'DRAFT',
      permissions: JSON.parse(JSON.stringify(role.permissions))
    };
    store.addRole(newRole);
    navigate(`/roles/${newRole.id}`);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto h-full flex flex-col pb-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 shrink-0">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900">Catálogo de Roles</h2>
          <p className="text-slate-500 mt-1 text-sm">
            Conjuntos reutilizables y versionados de autorizaciones por producto y alcance de formato
          </p>
        </div>
        <Button className="gap-2 shrink-0 bg-brand-primary text-white hover:bg-brand-primary/90" onClick={() => navigate('/roles/nuevo')}>
          <Plus className="w-4 h-4" /> Nuevo Rol
        </Button>
      </header>

      <div className="flex-1 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
        {/* Barra de Filtros */}
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-3 justify-between bg-slate-50/70">
          <div className="relative w-full sm:w-80 shrink-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Buscar rol por nombre, código o descripción..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-2 w-full text-sm border border-slate-200 rounded-lg focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none bg-white" 
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select 
              value={productFilter}
              onChange={e => setProductFilter(e.target.value)}
              className="px-3 py-2 text-xs font-medium border border-slate-200 rounded-lg focus:border-brand-primary outline-none bg-white"
            >
              <option value="ALL">Todos los productos</option>
              <option value="TOTAL_REPORT">TÓTAL REPORT®</option>
              <option value="TOTAL_SUPERVISION">TÓTAL SUPERVISIÓN®</option>
              <option value="TAX_REPORT">TAX REPORT</option>
              <option value="TOTALIA">TOTALiA</option>
              <option value="SECURITY_RBAC">Seguridad / RBAC</option>
            </select>

            <select 
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs font-medium border border-slate-200 rounded-lg focus:border-brand-primary outline-none bg-white"
            >
              <option value="ALL">Todos los estados</option>
              <option value="PUBLISHED">Publicados</option>
              <option value="DRAFT">Borrador</option>
              <option value="RETIRED">Retirados</option>
            </select>

            {(searchTerm || statusFilter !== 'ALL' || productFilter !== 'ALL') && (
              <button 
                onClick={() => { setSearchTerm(''); setStatusFilter('ALL'); setProductFilter('ALL'); }}
                className="text-xs text-brand-primary hover:underline px-2 py-1 font-medium"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>

        {/* Tabla */}
        <div className="overflow-auto flex-1">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-white text-slate-600 sticky top-0 z-10 border-b border-slate-200 shadow-sm text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5 font-bold">Nombre / Código</th>
                <th className="px-6 py-3.5 font-bold text-center">Versión</th>
                <th className="px-6 py-3.5 font-bold text-center">Estado</th>
                <th className="px-6 py-3.5 font-bold">Productos Habilitados</th>
                <th className="px-6 py-3.5 font-bold text-center">Acciones</th>
                <th className="px-6 py-3.5 font-bold text-center">Usuarios Asoc.</th>
                <th className="px-6 py-3.5 font-bold w-24 text-center">Gestión</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRoles.map(role => {
                const usersCount = store.getUsersForRole(role.id).length;

                return (
                  <tr key={role.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
                          <Shield className="w-5 h-5 text-slate-500" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{role.name}</p>
                          <div className="flex items-center gap-2 text-xs mt-0.5">
                            <span className="font-mono text-slate-500 font-semibold">{role.code}</span>
                            <span className="text-slate-300">•</span>
                            <span className="text-slate-500 truncate max-w-xs">{role.description}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center justify-center px-2 py-0.5 rounded font-mono text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        v{role.version}.0
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Badge variant={role.status === 'PUBLISHED' ? 'success' : role.status === 'DRAFT' ? 'warning' : 'danger'}>
                        {role.status === 'PUBLISHED' ? 'Publicado' : role.status === 'DRAFT' ? 'Borrador' : 'Retirado'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {role.products.map(p => (
                          <span key={p} className="text-[10px] font-bold bg-brand-primary/10 text-brand-primary px-2 py-0.5 rounded border border-brand-primary/20">
                            {p}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center font-semibold text-slate-700">
                      {role.permissions.length}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={usersCount > 0 ? "inline-flex items-center gap-1 font-bold text-xs text-brand-primary bg-brand-primary/10 px-2.5 py-1 rounded-full" : "text-xs text-slate-400"}>
                        <Users className="w-3 h-3" /> {usersCount}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <Link to={`/roles/${role.id}`}>
                          <Button variant="secondary" size="sm" className="h-8 px-2.5 text-xs font-semibold" title="Ver / Configurar Rol">
                            Configurar
                          </Button>
                        </Link>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 text-slate-400 hover:text-slate-700" 
                          onClick={() => handleDuplicate(role)}
                          title="Duplicar como nuevo rol borrador"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredRoles.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-14 text-center text-slate-500">
                    <Shield className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-800 text-sm">No se encontraron roles</p>
                    <p className="text-xs text-slate-400 mt-1">Cree un nuevo rol o ajuste los términos de búsqueda.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>Total: {filteredRoles.length} roles catalogados</span>
          <span className="text-slate-400">Control de acceso basado en roles versionados</span>
        </div>
      </div>
    </div>
  );
}
