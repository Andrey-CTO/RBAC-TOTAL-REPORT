import { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  UserCircle, 
  ShieldCheck, 
  ArrowLeftRight, 
  LogOut, 
  User as UserIcon, 
  Shield, 
  Building2, 
  Package, 
  Key, 
  Clock, 
  CheckCircle2, 
  ExternalLink,
  Lock,
  ChevronDown,
  X,
  AlertTriangle
} from 'lucide-react';
import { mockEntities, mockEnvironments } from '../../lib/mock-data';
import { useAppContext } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { Badge, Button } from '../ui/Shared';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';

export function Header() {
  const { 
    selectedEntity, setSelectedEntity, 
    selectedEnvironment, setSelectedEnvironment,
    productOrigin, setProductOrigin
  } = useAppContext();
  const toast = useToast();
  const navigate = useNavigate();

  // Profile dropdown and modal states
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isLoggedOut, setIsLoggedOut] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleProduct = () => {
    setProductOrigin(productOrigin === 'REPORT' ? 'SUPERVISION' : 'REPORT');
  };

  // Authenticated user session data
  const currentUser = {
    name: 'Andrey Ramírez',
    email: 'aramirez@jwproject.com.co',
    identity: 'EMP-007',
    role: 'Administrador de Seguridad RBAC & Oficial de Cumplimiento',
    roleCode: 'ROL-ID-ADMIN',
    type: 'HUMAN',
    status: 'ACTIVE',
    entities: ['ENT-001', 'ENT-002', 'ENT-003'],
    entityNames: ['Banco de Crédito y Comercio', 'Financiera del Valle', 'Fiduciaria Central'],
    products: ['TOTAL_REPORT', 'TOTAL_SUPERVISION', 'TAX_REPORT', 'TOTALIA', 'SECURITY_RBAC'],
    sessionStart: '08:30:15 AM (Hoy)',
    sessionIp: '190.24.112.45',
    mfaEnabled: true,
    securityLevel: 'Nivel 4 - Superadministrador Delegado'
  };

  const handleLogout = () => {
    setIsLogoutModalOpen(false);
    setIsProfileDropdownOpen(false);
    setIsLoggedOut(true);
    toast.showToast({
      type: 'info',
      title: 'Sesión Finalizada',
      message: 'Ha cerrado sesión correctamente. Su token de acceso ha sido invalidado.'
    });
  };

  const handleReLogin = () => {
    setIsLoggedOut(false);
    toast.showToast({
      type: 'success',
      title: 'Sesión Restaurada',
      message: 'Bienvenido de nuevo, Andrey Ramírez.'
    });
  };

  return (
    <>
      <header className="h-16 bg-brand-header text-white flex items-center justify-between px-6 shrink-0 z-30 shadow-md relative">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div 
              className="w-8 h-8 bg-brand-primary rounded-md flex items-center justify-center font-bold text-lg cursor-pointer hover:bg-brand-primary-hover transition-colors shadow-xs" 
              onClick={toggleProduct} 
              title="Alternar entre TÓTAL REPORT® y TÓTAL SUPERVISIÓN®"
            >
              T
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold leading-tight">TÓTAL {productOrigin}®</h1>
                <ArrowLeftRight 
                  className="w-3.5 h-3.5 text-slate-400 cursor-pointer hover:text-white transition-colors" 
                  onClick={toggleProduct} 
                  title="Cambiar producto"
                />
              </div>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">Usuarios y seguridad</p>
            </div>
          </div>
          
          <div className="h-6 w-px bg-slate-700 mx-2 hidden md:block"></div>
          
          <div className="hidden md:flex items-center gap-4 text-sm">
            <select 
              value={selectedEntity}
              onChange={(e) => setSelectedEntity(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 focus:outline-none focus:border-brand-primary text-slate-200 text-xs font-medium cursor-pointer"
            >
              {mockEntities.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
            <select 
              value={selectedEnvironment}
              onChange={(e) => setSelectedEnvironment(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 focus:outline-none focus:border-brand-primary text-slate-200 text-xs font-medium cursor-pointer"
            >
              {mockEnvironments.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>
        </div>
        
        <div className="flex items-center gap-4 md:gap-6">
          <div className="hidden lg:flex items-center bg-slate-800 rounded-lg px-3 py-1.5 border border-slate-700 focus-within:border-brand-primary">
            <Search className="w-4 h-4 text-slate-400 mr-2" />
            <input 
              type="text" 
              placeholder="Buscar ID/nombre/código..." 
              className="bg-transparent border-none outline-none text-xs w-48 text-white placeholder-slate-400"
            />
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-full border border-emerald-500/30 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sistema Activo</span>
            </div>

            {/* Authenticated User Menu Trigger */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-800/80 transition-colors cursor-pointer border border-transparent hover:border-slate-700 focus:outline-none"
                aria-expanded={isProfileDropdownOpen}
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-primary to-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-xs">
                  AR
                </div>
                <div className="text-left hidden md:block">
                  <p className="font-semibold text-xs text-slate-100 leading-none flex items-center gap-1">
                    {isLoggedOut ? 'Sesión Cerrada' : currentUser.name}
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  </p>
                  <p className="text-[10px] text-brand-primary font-medium mt-0.5">
                    {isLoggedOut ? 'Haga clic para ingresar' : 'Admin Delegado'}
                  </p>
                </div>
              </button>

              {/* Profile Dropdown Menu */}
              <AnimatePresence>
                {isProfileDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.18, ease: 'easeOut' }}
                    className="absolute right-0 mt-2 w-80 md:w-88 bg-white rounded-xl shadow-2xl border border-slate-200 text-slate-900 z-50 overflow-hidden"
                  >
                    {isLoggedOut ? (
                      <div className="p-5 text-center space-y-3">
                        <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
                          <AlertTriangle className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm">Sesión Cerrada</h4>
                          <p className="text-xs text-slate-500 mt-1">
                            Ha cerrado su sesión segura en TÓTAL REPORT® / SUPERVISIÓN®.
                          </p>
                        </div>
                        <Button 
                          onClick={handleReLogin}
                          className="w-full bg-brand-primary text-white text-xs font-bold py-2"
                        >
                          Iniciar Sesión Nuevamente
                        </Button>
                      </div>
                    ) : (
                      <>
                        {/* Profile Header Card */}
                        <div className="p-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-11 h-11 rounded-xl bg-brand-primary flex items-center justify-center text-white font-bold text-sm shadow-md">
                                AR
                              </div>
                              <div>
                                <h4 className="font-bold text-sm text-white">{currentUser.name}</h4>
                                <p className="text-xs text-slate-300 font-mono truncate max-w-[180px]">{currentUser.email}</p>
                              </div>
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full">
                              Activo
                            </span>
                          </div>

                          <div className="mt-3 pt-3 border-t border-slate-700/80 flex items-center justify-between text-[11px] text-slate-300">
                            <span className="flex items-center gap-1">
                              <Shield className="w-3.5 h-3.5 text-brand-primary" /> {currentUser.securityLevel}
                            </span>
                            <span className="font-mono text-slate-400">{currentUser.identity}</span>
                          </div>
                        </div>

                        {/* Profile Quick Details */}
                        <div className="p-4 space-y-3 text-xs bg-slate-50/70 border-b border-slate-100">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                              Rol Asignado
                            </span>
                            <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                              <Key className="w-3.5 h-3.5 text-brand-primary shrink-0" />
                              <span className="truncate">{currentUser.role}</span>
                            </div>
                          </div>

                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                              Entidades en Jurisdicción ({currentUser.entities.length})
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {currentUser.entityNames.map((eName, idx) => (
                                <span key={idx} className="text-[10px] bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded">
                                  {eName}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400" /> Sesión: {currentUser.sessionStart}
                            </span>
                            <span className="text-emerald-600 font-medium">MFA Habilitado</span>
                          </div>
                        </div>

                        {/* Profile Actions */}
                        <div className="p-2 bg-white space-y-1">
                          <button
                            type="button"
                            onClick={() => {
                              setIsProfileDropdownOpen(false);
                              setIsProfileModalOpen(true);
                            }}
                            className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg flex items-center justify-between transition-colors cursor-pointer"
                          >
                            <span className="flex items-center gap-2">
                              <UserIcon className="w-4 h-4 text-slate-500" />
                              Ver Ficha Completa de Perfil
                            </span>
                            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                          </button>

                          <Link
                            to="/accesos/evaluador"
                            onClick={() => setIsProfileDropdownOpen(false)}
                            className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg flex items-center gap-2 transition-colors"
                          >
                            <ShieldCheck className="w-4 h-4 text-slate-500" />
                            Evaluar mis Políticas RBAC
                          </Link>

                          <div className="pt-1 border-t border-slate-100">
                            <button
                              type="button"
                              onClick={() => {
                                setIsProfileDropdownOpen(false);
                                setIsLogoutModalOpen(true);
                              }}
                              className="w-full text-left px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
                            >
                              <LogOut className="w-4 h-4 text-rose-500" />
                              Cerrar Sesión Segura
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </div>
        </div>
      </header>

      {/* Profile Detail Modal */}
      <AnimatePresence>
        {isProfileModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden"
            >
              <div className="p-6 bg-slate-900 text-white flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-brand-primary flex items-center justify-center text-white font-bold text-xl shadow-lg">
                    AR
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{currentUser.name}</h3>
                    <p className="text-xs text-slate-300 font-mono mt-0.5">{currentUser.email}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="success" className="text-[10px]">
                        Cuenta Activa
                      </Badge>
                      <span className="text-xs text-slate-300 font-mono">{currentUser.identity}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setIsProfileModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto text-xs">
                {/* Security info */}
                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Rol de Seguridad</span>
                    <p className="font-semibold text-slate-800 mt-0.5">{currentUser.role}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Tipo de Identidad</span>
                    <p className="font-semibold text-slate-800 mt-0.5">Humano (Superadmin Delegado)</p>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">IP de Conexión</span>
                    <p className="font-mono text-slate-700 mt-0.5">{currentUser.sessionIp}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Cifrado de Sesión</span>
                    <p className="font-medium text-emerald-600 mt-0.5">TLS 1.3 / MFA Verificado</p>
                  </div>
                </div>

                {/* Products */}
                <div>
                  <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-2">
                    Productos del Ecosistema Habilitados
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {currentUser.products.map(p => (
                      <span key={p} className="bg-brand-primary/10 text-brand-primary border border-brand-primary/20 px-2.5 py-1 rounded-md font-bold text-[11px]">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Entities */}
                <div>
                  <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-2">
                    Entidades Autorizadas
                  </h4>
                  <div className="space-y-1.5">
                    {currentUser.entityNames.map((eName, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
                        <span className="font-semibold text-slate-800 flex items-center gap-2">
                          <Building2 className="w-3.5 h-3.5 text-slate-500" /> {eName}
                        </span>
                        <span className="font-mono text-[10px] text-slate-400">{currentUser.entities[idx]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
                <Button variant="secondary" onClick={() => setIsProfileModalOpen(false)}>
                  Cerrar
                </Button>
                <Button 
                  className="bg-brand-primary text-white" 
                  onClick={() => {
                    setIsProfileModalOpen(false);
                    navigate('/accesos/evaluador');
                  }}
                >
                  Auditar Mis Accesos
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {isLogoutModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4"
            >
              <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                <LogOut className="w-6 h-6" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-bold text-slate-900">¿Cerrar Sesión Segura?</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Se invalidará su token de sesión actual para el ecosistema TÓTAL REPORT® y TÓTAL SUPERVISIÓN®.
                </p>
              </div>
              <div className="flex gap-2 pt-2">
                <Button 
                  variant="secondary" 
                  className="w-1/2" 
                  onClick={() => setIsLogoutModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  className="w-1/2 bg-rose-600 hover:bg-rose-700 text-white font-bold" 
                  onClick={handleLogout}
                >
                  Cerrar Sesión
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
