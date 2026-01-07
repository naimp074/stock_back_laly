import { useState } from 'react';
import { Container, Card, Form, Button, Alert, Table, Badge } from 'react-bootstrap';
import { crearFacturaArca, obtenerEstadoComprobante } from '../../services/arcaService';
import Swal from 'sweetalert2';

export default function PruebaArcaPage() {
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState('');

  // Datos del formulario
  const [cliente, setCliente] = useState('Cliente de Prueba');
  const [cuit, setCuit] = useState('20111111111');
  const [direccion, setDireccion] = useState('Av. Corrientes 1234, CABA');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [numeroFactura, setNumeroFactura] = useState(999);
  const [tipoComprobante, setTipoComprobante] = useState('FACTURA_B');
  const [puntoVenta, setPuntoVenta] = useState(1);

  // Items de prueba
  const [items, setItems] = useState([
    { descripcion: 'Producto de Prueba 1', cantidad: 2, precio_unitario: 1000, alicuota_iva: 21 },
    { descripcion: 'Producto de Prueba 2', cantidad: 1, precio_unitario: 500, alicuota_iva: 21 }
  ]);

  // Verificar configuración
  const verificarConfiguracion = () => {
    const apiKey = import.meta.env.VITE_ARCA_API_KEY;
    const apiToken = import.meta.env.VITE_ARCA_API_TOKEN;
    const userToken = import.meta.env.VITE_ARCA_USER_TOKEN;

    if (!apiKey || !apiToken || !userToken) {
      return {
        configurado: false,
        mensaje: '⚠️ Las credenciales de Arca no están configuradas. Agrega las variables de entorno en tu archivo .env'
      };
    }

    return {
      configurado: true,
      mensaje: '✅ Credenciales configuradas correctamente'
    };
  };

  const config = verificarConfiguracion();

  // Agregar nuevo item
  const agregarItem = () => {
    setItems([...items, { descripcion: '', cantidad: 1, precio_unitario: 0, alicuota_iva: 21 }]);
  };

  // Eliminar item
  const eliminarItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  // Actualizar item
  const actualizarItem = (index, campo, valor) => {
    const nuevosItems = [...items];
    nuevosItems[index][campo] = valor;
    setItems(nuevosItems);
  };

  // Calcular total
  const calcularTotal = () => {
    return items.reduce((total, item) => {
      const subtotal = Number(item.cantidad) * Number(item.precio_unitario);
      const iva = subtotal * (Number(item.alicuota_iva) / 100);
      return total + subtotal + iva;
    }, 0);
  };

  // Probar creación de factura
  const probarCrearFactura = async () => {
    setLoading(true);
    setError('');
    setResultado(null);

    try {
      // Validar items
      if (items.length === 0) {
        throw new Error('Debes agregar al menos un item');
      }

      for (const item of items) {
        if (!item.descripcion || !item.cantidad || !item.precio_unitario) {
          throw new Error('Completa todos los campos de los items');
        }
      }

      // Preparar datos
      const datosFactura = {
        cliente,
        cuit,
        direccion,
        email,
        telefono,
        items: items.map(item => ({
          descripcion: item.descripcion,
          cantidad: Number(item.cantidad),
          precio_unitario: Number(item.precio_unitario),
          alicuota_iva: Number(item.alicuota_iva)
        })),
        numeroFactura,
        tipoComprobante,
        puntoVenta
      };

      // Crear factura
      const resultado = await crearFacturaArca(datosFactura);
      setResultado(resultado);

      // Mostrar éxito
      Swal.fire({
        title: '✅ Factura creada exitosamente',
        html: `
          <div class="text-start">
            <p><strong>CAE:</strong> ${resultado.cae}</p>
            <p><strong>Número de Comprobante:</strong> ${resultado.numero_comprobante}</p>
            <p><strong>Punto de Venta:</strong> ${resultado.punto_venta}</p>
            <p><strong>Vencimiento CAE:</strong> ${resultado.fecha_vencimiento_cae || 'N/A'}</p>
          </div>
        `,
        icon: 'success',
        confirmButtonText: 'Ver Detalles'
      });

    } catch (err) {
      const mensajeError = err.message || 'Error desconocido al crear la factura';
      setError(mensajeError);
      
      Swal.fire({
        title: '❌ Error',
        text: mensajeError,
        icon: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Descargar PDF
  const descargarPDF = () => {
    if (resultado?.pdf_url) {
      window.open(resultado.pdf_url, '_blank');
    }
  };

  // Ver estado del comprobante
  const verEstado = async () => {
    if (!resultado) return;

    try {
      setLoading(true);
      const estado = await obtenerEstadoComprobante(
        resultado.punto_venta,
        resultado.numero_comprobante,
        tipoComprobante
      );

      Swal.fire({
        title: 'Estado del Comprobante',
        html: `
          <div class="text-start">
            <pre style="text-align: left; white-space: pre-wrap;">${JSON.stringify(estado, null, 2)}</pre>
          </div>
        `,
        icon: 'info',
        width: '80%'
      });
    } catch (err) {
      Swal.fire({
        title: 'Error',
        text: err.message || 'No se pudo obtener el estado',
        icon: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <h2 className="mb-4">🧪 Prueba de Integración con Arca</h2>

      {/* Alerta de configuración */}
      <Alert variant={config.configurado ? 'success' : 'warning'} className="mb-4">
        <strong>{config.mensaje}</strong>
        {!config.configurado && (
          <div className="mt-2">
            <small>
              Variables necesarias: VITE_ARCA_API_KEY, VITE_ARCA_API_TOKEN, VITE_ARCA_USER_TOKEN
            </small>
          </div>
        )}
      </Alert>

      <div className="row">
        {/* Formulario */}
        <div className="col-lg-6 mb-4">
          <Card>
            <Card.Header>
              <h5>Datos de la Factura</h5>
            </Card.Header>
            <Card.Body>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Cliente *</Form.Label>
                  <Form.Control
                    type="text"
                    value={cliente}
                    onChange={(e) => setCliente(e.target.value)}
                    placeholder="Nombre del cliente"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>CUIT (11 dígitos)</Form.Label>
                  <Form.Control
                    type="text"
                    value={cuit}
                    onChange={(e) => setCuit(e.target.value.replace(/\D/g, '').slice(0, 11))}
                    placeholder="20111111111"
                    maxLength={11}
                  />
                  <Form.Text className="text-muted">
                    Para consumidor final usa: 20111111111
                  </Form.Text>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Dirección</Form.Label>
                  <Form.Control
                    type="text"
                    value={direccion}
                    onChange={(e) => setDireccion(e.target.value)}
                    placeholder="Dirección del cliente"
                  />
                </Form.Group>

                <div className="row">
                  <Form.Group className="mb-3 col-md-6">
                    <Form.Label>Email</Form.Label>
                    <Form.Control
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="email@ejemplo.com"
                    />
                  </Form.Group>

                  <Form.Group className="mb-3 col-md-6">
                    <Form.Label>Teléfono</Form.Label>
                    <Form.Control
                      type="text"
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      placeholder="11 1234-5678"
                    />
                  </Form.Group>
                </div>

                <div className="row">
                  <Form.Group className="mb-3 col-md-6">
                    <Form.Label>Número de Factura</Form.Label>
                    <Form.Control
                      type="number"
                      value={numeroFactura}
                      onChange={(e) => setNumeroFactura(Number(e.target.value))}
                    />
                  </Form.Group>

                  <Form.Group className="mb-3 col-md-6">
                    <Form.Label>Tipo de Comprobante</Form.Label>
                    <Form.Select
                      value={tipoComprobante}
                      onChange={(e) => setTipoComprobante(e.target.value)}
                    >
                      <option value="FACTURA_A">Factura A</option>
                      <option value="FACTURA_B">Factura B (Consumidor Final)</option>
                      <option value="FACTURA_C">Factura C</option>
                    </Form.Select>
                  </Form.Group>
                </div>

                <Form.Group className="mb-3">
                  <Form.Label>Punto de Venta</Form.Label>
                  <Form.Control
                    type="number"
                    value={puntoVenta}
                    onChange={(e) => setPuntoVenta(Number(e.target.value))}
                    min={1}
                  />
                </Form.Group>
              </Form>
            </Card.Body>
          </Card>
        </div>

        {/* Items */}
        <div className="col-lg-6 mb-4">
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5>Items de la Factura</h5>
              <Button size="sm" variant="success" onClick={agregarItem}>
                + Agregar Item
              </Button>
            </Card.Header>
            <Card.Body>
              {items.length === 0 ? (
                <Alert variant="info">No hay items. Haz clic en "Agregar Item" para comenzar.</Alert>
              ) : (
                <div className="table-responsive">
                  <Table striped bordered hover size="sm">
                    <thead>
                      <tr>
                        <th>Descripción</th>
                        <th style={{ width: '80px' }}>Cant.</th>
                        <th style={{ width: '100px' }}>Precio</th>
                        <th style={{ width: '80px' }}>IVA %</th>
                        <th style={{ width: '50px' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, index) => (
                        <tr key={index}>
                          <td>
                            <Form.Control
                              size="sm"
                              value={item.descripcion}
                              onChange={(e) => actualizarItem(index, 'descripcion', e.target.value)}
                              placeholder="Descripción"
                            />
                          </td>
                          <td>
                            <Form.Control
                              size="sm"
                              type="number"
                              value={item.cantidad}
                              onChange={(e) => actualizarItem(index, 'cantidad', Number(e.target.value))}
                              min={1}
                            />
                          </td>
                          <td>
                            <Form.Control
                              size="sm"
                              type="number"
                              value={item.precio_unitario}
                              onChange={(e) => actualizarItem(index, 'precio_unitario', Number(e.target.value))}
                              min={0}
                              step="0.01"
                            />
                          </td>
                          <td>
                            <Form.Control
                              size="sm"
                              type="number"
                              value={item.alicuota_iva}
                              onChange={(e) => actualizarItem(index, 'alicuota_iva', Number(e.target.value))}
                              min={0}
                              max={100}
                            />
                          </td>
                          <td>
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => eliminarItem(index)}
                            >
                              ×
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}

              <div className="mt-3 text-end">
                <strong>Total: ${calcularTotal().toFixed(2)}</strong>
              </div>
            </Card.Body>
          </Card>
        </div>
      </div>

      {/* Botón de prueba */}
      <div className="text-center mb-4">
        <Button
          variant="primary"
          size="lg"
          onClick={probarCrearFactura}
          disabled={loading || !config.configurado || items.length === 0}
        >
          {loading ? '⏳ Creando factura...' : '🚀 Crear Factura en Arca'}
        </Button>
      </div>

      {/* Error */}
      {error && (
        <Alert variant="danger" className="mb-4">
          <strong>Error:</strong> {error}
        </Alert>
      )}

      {/* Resultado */}
      {resultado && (
        <Card className="mb-4">
          <Card.Header>
            <h5>✅ Resultado de la Prueba</h5>
          </Card.Header>
          <Card.Body>
            <div className="row">
              <div className="col-md-6">
                <p><strong>CAE:</strong> <Badge bg="success">{resultado.cae}</Badge></p>
                <p><strong>Número de Comprobante:</strong> {resultado.numero_comprobante}</p>
                <p><strong>Punto de Venta:</strong> {resultado.punto_venta}</p>
                <p><strong>Vencimiento CAE:</strong> {resultado.fecha_vencimiento_cae || 'N/A'}</p>
              </div>
              <div className="col-md-6">
                <div className="d-grid gap-2">
                  {resultado.pdf_url && (
                    <Button variant="success" onClick={descargarPDF}>
                      📄 Ver/Descargar PDF
                    </Button>
                  )}
                  <Button variant="info" onClick={verEstado}>
                    🔍 Ver Estado del Comprobante
                  </Button>
                </div>
              </div>
            </div>

            <hr />

            <details>
              <summary style={{ cursor: 'pointer', userSelect: 'none' }}>Ver respuesta completa (JSON)</summary>
              <pre className="mt-3 p-3 bg-light rounded" style={{ maxHeight: '300px', overflow: 'auto' }}>
                {JSON.stringify(resultado.comprobante || resultado, null, 2)}
              </pre>
            </details>
          </Card.Body>
        </Card>
      )}

      {/* Instrucciones */}
      <Card className="mt-4">
        <Card.Header>
          <h5>📖 Instrucciones</h5>
        </Card.Header>
        <Card.Body>
          <ol>
            <li>Configura las variables de entorno en tu archivo <code>.env</code></li>
            <li>Completa los datos del cliente y los items</li>
            <li>Haz clic en "Crear Factura en Arca"</li>
            <li>Si todo está bien configurado, verás el CAE y podrás descargar el PDF</li>
            <li>Verifica en tu panel de TusFacturasAPP que la factura se haya creado</li>
          </ol>
        </Card.Body>
      </Card>
    </Container>
  );
}

