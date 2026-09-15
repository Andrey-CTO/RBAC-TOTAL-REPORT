import { useState } from 'react';
import { User, ProductCode } from '../../types/rbac';
import { Badge, Button } from '../../components/ui/Shared';
import { Search, Plus, UserCircle, Shield, Building2, Filter } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { useStore } from '../../lib/store';
import { motion, AnimatePresence } from 'motion/react';

export function UsuariosList() {
  const { selectedEntity } = useAppContext();
  const { users, roles, entities } = useStore();
  const navigate = useNavigate();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'SUSPENDED' | 'INACTIVE'>('ALL');
  const [entityFilter, setEntityFilter] = useState<string>('ALL');
  const [productFilter, setProductFilter] = useState<string>('ALL');

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          u.identity.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || u.status === statusFilter;
    const matchesEntity = entityFilter === 'ALL' || u.entities.includes(entityFilter);
    const matchesProduct = productFilter === 'ALL' || u.products.includes(productFilter as ProductCode);
    return matchesSearch && matchesStatus && matchesEntity && matchesProduct;
  });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 max-w-7xl mx-auto flex flex-col pb-8"
    >
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 shrink-0">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Usuarios del Sistema</h2>
          <p className="text-slate-500 mt-1 text-xs md:text-sm">
            Gestión centralizada de identidades, entidades autorizadas, productos y roles del ecosistema TÓTAL
          </p>
        </div>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button className="gap-2 shrink-0 bg-brand-primary text-white hover:bg-brand-primary/90 text-xs font-bold" onClick={() => navigate('/usuarios/nuevo')}>
            <Plus className="w-4 h-4" /> Nuevo Usuario
          </Button>
        </motion.div>
      </header>

      <div className="flex-1 bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden flex flex-col">
        {/* Filtros */}
        <div className="p-4 border-b border-slate-200 flex flex-col lg:flex-row gap-3 justify-between bg-slate-50/70">
          <div className="relative w-full lg:w-80 shrink-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Buscar por nombre, correo o ID..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-2 w-full text-xs border border-slate-200 rounded-lg focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none bg-white" 
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select 
              value={entityFilter}
              onChange={e => setEntityFilter(e.target.value)}
              className="px-3 py-2 text-xs font-medium border border-slate-200 rounded-lg focus:border-brand-primary outline-none bg-white"
            >
              <option value="ALL">Todas las entidades</option>
              {entities.map(ent => (
                <option key={ent.id} value={ent.id}>{ent.name}</option>
              ))}
            </select>

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
              onChange={e => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 text-xs font-medium border border-slate-200 rounded-lg focus:border-brand-primary outline-none bg-white"
            >
              <option value="ALL">Todos los estados</option>
              <option value="ACTIVE">Activos</option>
              <option value="SUSPENDED">Suspendidos</option>
              <option value="INACTIVE">Inactivos</option>
            </select>

            {(searchTerm || statusFilter !== 'ALL' || entityFilter !== 'ALL' || productFilter !== 'ALL') && (
              <button 
                onClick={() => { setSearchTerm(''); setStatusFilter('ALL'); setEntityFilter('ALL'); setProductFilter('ALL'); }}
                className="text-xs text-brand-primary hover:underline px-2 py-1 font-semibold"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        </div>

        {/* Tabla */}
        <div className="overflow-auto flex-1">
          <table className="w-full text-left text-xs md:text-sm whitespace-nowrap">
            <thead className="bg-white text-slate-600 sticky top-0 z-10 border-b border-slate-200 shadow-xs text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5 font-bold">Identidad / Usuario</th>
                <th className="px-6 py-3.5 font-bold">Tipo</th>
                <th className="px-6 py-3.5 font-bold text-center">Estado</th>
                <th className="px-6 py-3.5 font-bold">Productos Habilitados</th>
                <th className="px-6 py-3.5 font-bold">Roles Asignados</th>
                <th className="px-6 py-3.5 font-bold w-16 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((user, idx) => {
                const userRoleNames = (user.roles || []).map(rid => {
                  const r = roles.find(ro => ro.id === rid);
                  return r ? r.name : rid;
                });

                return (
                  <motion.tr 
                    key={user.id} 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.02 }}
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-100 group-hover:bg-brand-primary/10 flex items-center justify-center shrink-0 border border-slate-200 transition-colors">
                          <UserCircle className="w-5 h-5 text-slate-500 group-hover:text-brand-primary transition-colors" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{user.name}</p>
                          <div className="flex items-center gap-2 text-xs mt-0.5">
                            <span className="font-mono text-slate-500 font-semibold">{user.identity}</span>
                            <span className="text-slate-300">•</span>
                            <span className="text-slate-500">{user.email}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={user.type === 'HUMAN' ? 'neutral' : 'info'} className="text-xs">
                        {user.type === 'HUMAN' ? 'Humano' : 'Servicio API'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Badge 
                        variant={user.status === 'ACTIVE' ? 'success' : user.status === 'SUSPENDED' ? 'warning' : 'danger'}
                        className="text-xs"
                      >
                        {user.status === 'ACTIVE' ? 'Activo' : user.status === 'SUSPENDED' ? 'Suspendido' : 'Inactivo'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {user.products.map(p => (
                          <span key={p} className="text-[10px] font-bold bg-brand-primary/10 text-brand-primary px-2 py-0.5 rounded border border-brand-primary/20">
                            {p}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {userRoleNames.length > 0 ? (
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {userRoleNames.map((rn, idx) => (
                            <span key={idx} className="text-[11px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                              {rn}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Sin roles</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Link to={`/usuarios/${user.id}`}>
                        <Button variant="secondary" size="sm" className="h-8 px-3 text-xs font-semibold hover:border-slate-300">
                          Gestionar
                        </Button>
                      </Link>
                    </td>
                  </motion.tr>
                );
              })}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-14 text-center text-slate-500">
                    <UserCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-800 text-sm">No se encontraron usuarios</p>
                    <p className="text-xs text-slate-400 mt-1">Pruebe ajustando los filtros o cree un nuevo usuario en el sistema.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>Mostrando {filteredUsers.length} de {users.length} usuarios registrados</span>
          <span className="text-slate-400">Persistencia activa en tiempo real</span>
        </div>
      </div>
    </motion.div>
  );
}
