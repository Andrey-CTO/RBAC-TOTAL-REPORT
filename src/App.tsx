import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { ToastProvider } from './context/ToastContext';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { AccesosLayout } from './pages/accesos/AccesosLayout';
import { CatalogoView } from './pages/accesos/CatalogoView';
import { SolicitudesView } from './pages/accesos/SolicitudesView';
import { EvaluadorPoliticasView } from './pages/accesos/EvaluadorPoliticasView';
import { GobernanzaSoDView } from './pages/accesos/GobernanzaSoDView';
import { AccessReviewView } from './pages/accesos/AccessReviewView';
import { UsuariosList } from './pages/usuarios/UsuariosList';
import { UsuarioDetail } from './pages/usuarios/UsuarioDetail';
import { RolesList } from './pages/roles/RolesList';
import { RoleDetail } from './pages/roles/RoleDetail';
import { CoberturaView } from './pages/cobertura/CoberturaView';
import { ProductosView } from './pages/productos/ProductosView';
import { AuditoriaView } from './pages/auditoria/AuditoriaView';

export default function App() {
  return (
    <AppProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              {/* 1. Resumen */}
              <Route index element={<Dashboard />} />
              
              {/* 2. Usuarios */}
              <Route path="usuarios">
                <Route index element={<UsuariosList />} />
                <Route path=":id" element={<UsuarioDetail />} />
              </Route>

              {/* 3. Roles */}
              <Route path="roles">
                <Route index element={<RolesList />} />
                <Route path=":id" element={<RoleDetail />} />
              </Route>

              {/* Redirección automática de Perfiles a Roles */}
              <Route path="perfiles" element={<Navigate to="/roles" replace />} />
              <Route path="perfiles/*" element={<Navigate to="/roles" replace />} />

              {/* 4. Accesos y Políticas */}
              <Route path="accesos" element={<AccesosLayout />}>
                <Route index element={<Navigate to="catalogo" replace />} />
                <Route path="catalogo" element={<CatalogoView />} />
                <Route path="solicitudes" element={<SolicitudesView />} />
                <Route path="evaluador" element={<EvaluadorPoliticasView />} />
                <Route path="gobernanza" element={<GobernanzaSoDView />} />
                <Route path="revision" element={<AccessReviewView />} />
                <Route path="simulador" element={<Navigate to="/accesos/evaluador" replace />} />
              </Route>

              {/* 5. Cobertura Funcional */}
              <Route path="cobertura" element={<CoberturaView />} />
              <Route path="operaciones/*" element={<Navigate to="/cobertura" replace />} />

              {/* 6. Cobertura de Productos */}
              <Route path="productos" element={<ProductosView />} />
              <Route path="ecosistema/*" element={<Navigate to="/productos" replace />} />

              {/* 7. Auditoría */}
              <Route path="auditoria">
                <Route index element={<AuditoriaView />} />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AppProvider>
  );
}
