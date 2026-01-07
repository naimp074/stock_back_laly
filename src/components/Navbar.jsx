import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Navbar as BsNavbar, Nav, Container, Button, Badge } from "react-bootstrap";

const Navbar = () => {
  const { usuario, logout } = useAuth();

  return (
    <BsNavbar bg="dark" variant="dark" expand="md" fixed="top" className="shadow">
      <Container fluid>
        {/* Logo */}
        <BsNavbar.Brand as={Link} to="/" className="fw-bold text-info text-truncate">
          📦 Mi POS
        </BsNavbar.Brand>

        {/* Botón hamburguesa */}
        <BsNavbar.Toggle aria-controls="navbarResponsive" />

        <BsNavbar.Collapse id="navbarResponsive">
          {/* Navegación */}
          <Nav className="me-auto nav-links-desktop">
            <Nav.Link as={Link} to="/stock" className="nav-link-custom">
              📦 Stock
            </Nav.Link>
            <Nav.Link as={Link} to="/ventas" className="nav-link-custom">
              💰 Ventas
            </Nav.Link>
            <Nav.Link as={Link} to="/presupuestos" className="nav-link-custom">
              📋 Presupuestos
            </Nav.Link>
            {(usuario?.rol === 'admin' || usuario?.rol === 'administrador') && (
              <Nav.Link as={Link} to="/reportes" className="nav-link-custom">
                📊 Reportes
              </Nav.Link>
            )}
            <Nav.Link as={Link} to="/cuentacorriente" className="nav-link-custom">
              💳 Cuenta Corriente
            </Nav.Link>
            <Nav.Link as={Link} to="/notas-credito" className="nav-link-custom">
              📦 Notas de Crédito
            </Nav.Link>
            <Nav.Link as={Link} to="/prueba-arca" className="nav-link-custom">
              🧪 Prueba Arca
            </Nav.Link>
          </Nav>

          {/* Usuario y logout */}
          <div className="d-flex flex-column flex-md-row align-items-center gap-2 mt-3 mt-md-0 ms-md-3">
            {usuario && (
              <div className="d-flex align-items-center gap-2 user-info-container">
                <div className="d-flex align-items-center gap-2 px-2 px-md-3 py-2 rounded user-badge">
                  <span className="user-icon">👤</span>
                  <div className="d-flex flex-column">
                    <span className="text-white fw-semibold username-text">
                      {usuario.nombre || usuario.email || 'Usuario'}
                    </span>
                    <Badge 
                      bg={(usuario.rol === 'admin' || usuario.rol === 'administrador') ? 'danger' : 'info'} 
                      className="mt-1 role-badge"
                    >
                      {(usuario.rol === 'admin' || usuario.rol === 'administrador') ? '👑 Admin' : '👤 Empleado'}
                    </Badge>
                  </div>
                </div>
              </div>
            )}
            <Button
              variant="outline-danger"
              size="sm"
              className="logout-btn"
              onClick={logout}
            >
              Salir
            </Button>
          </div>
        </BsNavbar.Collapse>
      </Container>

      {/* Estilos extras */}
      <style>{`
        .nav-link-custom {
          position: relative;
          transition: color 0.2s ease-in-out;
          padding: 0.5rem 1rem !important;
          white-space: nowrap;
        }
        .nav-link-custom:hover {
          color: #0dcaf0 !important;
        }
        .nav-link-custom::after {
          content: '';
          position: absolute;
          width: 0;
          height: 2px;
          display: block;
          margin-top: 5px;
          left: 0;
          background: #0dcaf0;
          transition: width 0.3s;
        }
        .nav-link-custom:hover::after {
          width: 100%;
        }
        
        /* Estilos para desktop */
        @media (min-width: 768px) {
          .nav-links-desktop {
            text-align: left !important;
            align-items: center;
          }
          
          .nav-links-desktop .nav-link {
            text-align: left;
          }
          
          .user-info-container {
            width: auto;
            justify-content: flex-start;
          }
          
          .user-badge {
            background-color: rgba(255, 255, 255, 0.1) !important;
            min-width: fit-content;
          }
          
          .user-icon {
            font-size: 1.2rem;
          }
          
          .username-text {
            font-size: 0.9rem;
            line-height: 1.2;
          }
          
          .role-badge {
            font-size: 0.7rem;
            font-weight: normal;
          }
          
          .logout-btn {
            width: auto;
            min-width: 80px;
          }
        }
        
        /* Estilos para móvil */
        @media (max-width: 767px) {
          .nav-links-desktop {
            text-align: center;
          }
          
          .user-info-container {
            width: 100%;
            justify-content: center;
          }
          
          .logout-btn {
            width: 100%;
          }
        }
      `}</style>
    </BsNavbar>
  );
};

export default Navbar;
