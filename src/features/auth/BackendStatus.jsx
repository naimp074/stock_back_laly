import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Card, Alert, Badge, Button, Spinner, Table } from 'react-bootstrap';

const API_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.PROD ? '/api' : 'http://localhost:3000/api');

export default function BackendStatus() {
  const navigate = useNavigate();
  const [estado, setEstado] = useState({
    backend: { estado: 'verificando', mensaje: '', tiempo: null },
    endpoints: []
  });
  const [verificando, setVerificando] = useState(true);

  useEffect(() => {
    verificarBackend();
  }, []);

  // Función helper para hacer fetch con timeout
  async function fetchWithTimeout(url, options = {}, timeout = 5000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(id);
      return response;
    } catch (error) {
      clearTimeout(id);
      if (error.name === 'AbortError') {
        throw new Error('Timeout: La petición tardó demasiado');
      }
      throw error;
    }
  }

  async function verificarBackend() {
    setVerificando(true);
    const inicio = Date.now();
    
    // Verificar health check
    try {
      const healthUrl = import.meta.env.PROD ? '/api/health' : 'http://localhost:3000/api/health';
      const healthResponse = await fetchWithTimeout(healthUrl, {}, 5000);
      const healthData = await healthResponse.json();
      const tiempo = Date.now() - inicio;
      
      if (healthResponse.ok && healthData.success) {
        setEstado(prev => ({
          ...prev,
          backend: {
            estado: 'funcionando',
            mensaje: 'Backend conectado correctamente',
            tiempo: tiempo
          }
        }));
      } else {
        setEstado(prev => ({
          ...prev,
          backend: {
            estado: 'error',
            mensaje: 'Backend responde pero con error',
            tiempo: tiempo
          }
        }));
      }
    } catch (error) {
      const tiempo = Date.now() - inicio;
      setEstado(prev => ({
        ...prev,
        backend: {
          estado: 'error',
          mensaje: `Error de conexión: ${error.message}`,
          tiempo: tiempo
        }
      }));
    }

    // Verificar endpoints principales
    try {
      await verificarEndpoints();
    } catch (error) {
      console.error('Error verificando endpoints:', error);
    } finally {
      setVerificando(false);
    }
  }

  async function verificarEndpoints() {
    const endpoints = [
      { nombre: 'Health Check', url: '/health', metodo: 'GET', requiereAuth: false },
      { nombre: 'Login', url: '/auth/login', metodo: 'POST', requiereAuth: false },
      { nombre: 'Registro', url: '/auth/registro', metodo: 'POST', requiereAuth: false },
      { nombre: 'Productos', url: '/productos', metodo: 'GET', requiereAuth: true },
      { nombre: 'Ventas', url: '/ventas', metodo: 'GET', requiereAuth: true },
      { nombre: 'Cuentas Corrientes', url: '/cuentas-corrientes', metodo: 'GET', requiereAuth: true },
      { nombre: 'Notas de Crédito', url: '/notas-credito', metodo: 'GET', requiereAuth: true },
      { nombre: 'Reportes', url: '/reportes/estadisticas', metodo: 'GET', requiereAuth: true },
    ];

    // Usar Promise.allSettled para que no falle todo si uno falla
    const resultados = await Promise.allSettled(
      endpoints.map(async (endpoint) => {
        const inicio = Date.now(); // Definir inicio antes del try para que esté disponible en el catch
        try {
          const url = `${API_URL}${endpoint.url}`;
          
          let response;
          if (endpoint.metodo === 'GET') {
            response = await fetchWithTimeout(url, {
              method: endpoint.metodo,
              headers: endpoint.requiereAuth ? {
                'Authorization': 'Bearer test-token'
              } : {}
            }, 5000);
          } else {
            // Para POST, solo verificamos que el endpoint existe (401 o 400 es OK, significa que el endpoint funciona)
            response = await fetchWithTimeout(url, {
              method: endpoint.metodo,
              headers: {
                'Content-Type': 'application/json',
                ...(endpoint.requiereAuth ? { 'Authorization': 'Bearer test-token' } : {})
              },
              body: endpoint.url.includes('login') || endpoint.url.includes('registro') 
                ? JSON.stringify({ email: 'test@test.com', password: 'test' })
                : '{}'
            }, 5000);
          }
          
          const tiempo = Date.now() - inicio;
          const status = response.status;
          
          // Consideramos que funciona si:
          // - 200-299: OK
          // - 400-499: El endpoint existe pero hay error de validación/auth (normal)
          // - 500: Error del servidor pero el endpoint existe
          const funciona = status < 500;
          const necesitaAuth = status === 401 && endpoint.requiereAuth;
          
          return {
            ...endpoint,
            estado: funciona ? (necesitaAuth ? 'requiere-auth' : 'funcionando') : 'error',
            status: status,
            tiempo: tiempo,
            mensaje: necesitaAuth 
              ? 'Requiere autenticación (normal)' 
              : funciona 
                ? 'Funcionando correctamente' 
                : `Error ${status}`
          };
        } catch (error) {
          const tiempo = Date.now() - inicio;
          return {
            ...endpoint,
            estado: 'error',
            status: 0,
            tiempo: tiempo,
            mensaje: error.message.includes('Timeout') 
              ? 'Timeout: Tardó demasiado en responder' 
              : `Error: ${error.message}`
          };
        }
      })
    );

    // Procesar resultados de Promise.allSettled
    const resultadosProcesados = resultados.map((resultado, idx) => {
      if (resultado.status === 'fulfilled') {
        return resultado.value;
      } else {
        // Si falló, retornar un resultado de error
        return {
          ...endpoints[idx],
          estado: 'error',
          status: 0,
          tiempo: 0,
          mensaje: `Error: ${resultado.reason?.message || 'Error desconocido'}`
        };
      }
    });

    setEstado(prev => ({
      ...prev,
      endpoints: resultadosProcesados
    }));
  }

  const getBadgeVariant = (estado) => {
    switch (estado) {
      case 'funcionando': return 'success';
      case 'requiere-auth': return 'warning';
      case 'error': return 'danger';
      default: return 'secondary';
    }
  };

  const getBadgeText = (estado) => {
    switch (estado) {
      case 'funcionando': return '✓ Funcionando';
      case 'requiere-auth': return '🔒 Requiere Auth';
      case 'error': return '✗ Error';
      default: return 'Verificando...';
    }
  };

  return (
    <Container className="py-5 px-3" style={{ maxWidth: 1000 }}>
      <Card className="p-4 shadow-sm">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="mb-0">Estado del Backend</h2>
          <Button 
            variant="outline-primary" 
            onClick={verificarBackend}
            disabled={verificando}
            size="sm"
          >
            {verificando ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Verificando...
              </>
            ) : (
              '🔄 Verificar Nuevamente'
            )}
          </Button>
        </div>

        {/* Estado General del Backend */}
        <Alert 
          variant={
            estado.backend.estado === 'funcionando' ? 'success' :
            estado.backend.estado === 'error' ? 'danger' : 'warning'
          }
          className="mb-4"
        >
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <strong>Estado del Backend:</strong>{' '}
              {estado.backend.estado === 'funcionando' ? '✅ Funcionando' :
               estado.backend.estado === 'error' ? '❌ No disponible' : '⏳ Verificando...'}
              <br />
              <small className="text-muted">{estado.backend.mensaje}</small>
            </div>
            {estado.backend.tiempo && (
              <Badge bg="secondary">
                {estado.backend.tiempo}ms
              </Badge>
            )}
          </div>
        </Alert>

        {/* Tabla de Endpoints */}
        <h4 className="mb-3">Endpoints de Postman</h4>
        <div className="table-responsive">
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>Endpoint</th>
                <th>Método</th>
                <th>Estado</th>
                <th>Status Code</th>
                <th>Tiempo</th>
                <th>Mensaje</th>
              </tr>
            </thead>
            <tbody>
              {estado.endpoints.map((endpoint, idx) => (
                <tr key={idx}>
                  <td>
                    <code>{endpoint.url}</code>
                  </td>
                  <td>
                    <Badge bg="info">{endpoint.metodo}</Badge>
                  </td>
                  <td>
                    <Badge bg={getBadgeVariant(endpoint.estado)}>
                      {getBadgeText(endpoint.estado)}
                    </Badge>
                  </td>
                  <td>
                    {endpoint.status > 0 ? (
                      <Badge bg={endpoint.status < 400 ? 'success' : endpoint.status < 500 ? 'warning' : 'danger'}>
                        {endpoint.status}
                      </Badge>
                    ) : (
                      <span className="text-muted">-</span>
                    )}
                  </td>
                  <td>
                    {endpoint.tiempo > 0 ? `${endpoint.tiempo}ms` : '-'}
                  </td>
                  <td>
                    <small className="text-muted">{endpoint.mensaje}</small>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>

        {/* Información de Postman */}
        <Alert variant="info" className="mt-4">
          <h5>📋 Cómo usar en Postman:</h5>
          <ul className="mb-0">
            <li><strong>Base URL:</strong> <code>{import.meta.env.PROD ? 'https://tu-proyecto.vercel.app/api' : 'http://localhost:3000/api'}</code></li>
            <li><strong>Autenticación:</strong> Los endpoints marcados con "Requiere Auth" necesitan un token JWT en el header: <code>Authorization: Bearer &lt;token&gt;</code></li>
            <li><strong>Obtener token:</strong> Primero haz login en <code>POST /api/auth/login</code> con email y password</li>
            <li>Ver documentación completa en <code>ENDPOINTS_POSTMAN.md</code></li>
          </ul>
        </Alert>

        {/* Botones de acción */}
        <div className="mt-4 text-center d-flex gap-2 justify-content-center">
          <Button 
            variant="primary" 
            size="lg"
            onClick={() => navigate('/login')}
          >
            Ir al Login
          </Button>
          {estado.backend.estado === 'error' && (
            <Button 
              variant="outline-secondary" 
              size="lg"
              onClick={() => window.open('https://github.com/naimp074/stock_back_laly', '_blank')}
            >
              Ver Documentación
            </Button>
          )}
        </div>
      </Card>
    </Container>
  );
}
