// frontend/src/App.jsx
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import PanelPage from './pages/PanelPage';
import AdminPage from './pages/AdminPage';
import AdminSociosPage from './pages/AdminSociosPage';
import AdminCanjesPage from './pages/AdminCanjesPage';
import AdminDocsPage from './pages/AdminDocsPage';
import TiendaPage from './pages/TiendaPage';
import PreRegistroPage from './pages/PreRegistroPage'; // Asegúrate de que el nombre del archivo sea este
import BuzonSugerencias from './components/BuzonSugerencias';
import LibroVisitas from './components/LibroVisitas';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';

// Componente para proteger rutas
function ProtectedRoute({ children, adminOnly = false }) {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  if (adminOnly) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.rol !== 'admin') {
        return <Navigate to="/panel" replace />;
      }
    } catch (err) {
      return <Navigate to="/login" replace />;
    }
  }
  return children;
}

function App() {
  const location = useLocation();
  const hideNavbar = false;

  return (
    <>
      {!hideNavbar && <Navbar />}
      <Routes>
        {/* Rutas públicas */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/pre-registro" element={<PreRegistroPage />} />
        <Route path="/libro-visitas" element={<LibroVisitas />} />

        {/* Rutas protegidas */}
        <Route
          path="/panel"
          element={
            <ProtectedRoute>
              <PanelPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute adminOnly={true}>
              <AdminPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/socios"
          element={
            <ProtectedRoute adminOnly={true}>
              <AdminSociosPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/canjes"
          element={
            <ProtectedRoute adminOnly={true}>
              <AdminCanjesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/documentos"
          element={
            <ProtectedRoute adminOnly={true}>
              <AdminDocsPage />
            </ProtectedRoute>
          }
        />
        <Route path="/tienda" element={<TiendaPage />} />
        <Route path="/buzon-sugerencias" element={<BuzonSugerencias />} />

        {/* Redirección por defecto */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;
