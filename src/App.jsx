import { Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import BackendStatus from "./features/auth/BackendStatus";
import Login from "./features/auth/Login";
import { useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Container from "react-bootstrap/Container";

// Componente para proteger rutas que requieren rol de admin
const ProtectedAdminRoute = ({ children }) => {
  const { usuario } = useAuth();
  const esAdmin = usuario?.rol === 'admin' || usuario?.rol === 'administrador';
  
  if (!esAdmin) {
    return <Navigate to="/stock" replace />;
  }
  
  return children;
};

// Lazy loading de componentes para mejor rendimiento inicial
const StockPage = lazy(() => import("./features/stock/StockPage"));
const VentasPage = lazy(() => import("./features/ventas/VentasPage"));
const PresupuestosPage = lazy(() => import("./features/presupuestos/PresupuestosPage"));
const ReportesPage = lazy(() => import("./features/reportes/ReportesPage"));
const NotasCreditoPage = lazy(() => import("./features/notas-credito/NotasCreditoPage"));
const PruebaArcaPage = lazy(() => import("./features/arca/PruebaArcaPage"));
const CuentaCorriente = lazy(() => import("./cuenta-corriente/Cuenta-corriente"));

// Componente de carga
const LoadingFallback = () => (
  <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
    <div className="text-center">
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Cargando...</span>
      </div>
      <p className="mt-2">Cargando...</p>
    </div>
  </div>
);

function App() {
  const { usuario } = useAuth();

  return (
    <>
      {usuario && <Navbar />}
      <Container fluid className={usuario ? "px-2 px-md-3 px-lg-4 main-content" : ""}>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            {!usuario ? (
              <>
                <Route path="/" element={<BackendStatus />} />
                <Route path="/login" element={<Login />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </>
            ) : (
              <>
                <Route path="/" element={<Navigate to="/stock" />} />
                <Route path="/stock" element={<StockPage />} />
                <Route path="/ventas" element={<VentasPage />} />
                <Route path="/presupuestos" element={<PresupuestosPage />} />
                <Route path="/cuentacorriente" element={<CuentaCorriente />} />
                <Route 
                  path="/reportes" 
                  element={
                    <ProtectedAdminRoute>
                      <ReportesPage />
                    </ProtectedAdminRoute>
                  } 
                />
                <Route path="/notas-credito" element={<NotasCreditoPage />} />
                <Route path="/prueba-arca" element={<PruebaArcaPage />} />
              </>
            )}
          </Routes>
        </Suspense>
      </Container>
    </>
  );
}

export default App;
