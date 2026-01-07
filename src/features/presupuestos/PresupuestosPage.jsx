import React, { useEffect, useMemo, useState } from 'react';
import { Container, Card, Table, Button, Form, Pagination } from 'react-bootstrap';
import Swal from 'sweetalert2';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { listarProductos } from '../../services/productosService';
import { crearPresupuesto, listarPresupuestos } from '../../services/presupuestosService';
import { agregarLogoPDF } from '../../utils/pdfHelpers';

const PresupuestosPage = () => {
  const [productos, setProductos] = useState([]);
  const [presupuestos, setPresupuestos] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [cliente, setCliente] = useState('');
  const [direccionCliente, setDireccionCliente] = useState('');
  const [carrito, setCarrito] = useState([]);
  const [cantidades, setCantidades] = useState({});
  const [cargando, setCargando] = useState(true);
  const [procesandoPresupuesto, setProcesandoPresupuesto] = useState(false);
  const [paginaActual, setPaginaActual] = useState(1);
  const [productosPorPagina] = useState(10);

  // Número de presupuesto persistente en localStorage
  const [numeroPresupuesto, setNumeroPresupuesto] = useState(() => {
    return Number(localStorage.getItem('numeroPresupuesto') || 1);
  });

  useEffect(() => {
    (async () => {
      try {
        setCargando(true);
        const [prods, pres] = await Promise.all([listarProductos(), listarPresupuestos(20)]);
        setProductos(prods);
        setPresupuestos(pres);
      } catch (e) {
        console.error(e);
        Swal.fire('❌ Error', e.message || 'No se pudieron cargar productos/presupuestos', 'error');
      } finally {
        setCargando(false);
      }
    })();
  }, []);

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return productos;
    return productos.filter(p =>
      (p?.nombre || '').toLowerCase().includes(q) ||
      (p?.proveedor || '').toLowerCase().includes(q)
    );
  }, [productos, busqueda]);

  // Calcular índices para paginación de productos
  const indiceUltimo = paginaActual * productosPorPagina;
  const indicePrimero = indiceUltimo - productosPorPagina;
  const productosPagina = filtrados.slice(indicePrimero, indiceUltimo);
  const totalPaginas = Math.ceil(filtrados.length / productosPorPagina);

  // Resetear a página 1 cuando cambia la búsqueda
  useEffect(() => {
    setPaginaActual(1);
  }, [busqueda]);

  const total = carrito.reduce(
    (acc, it) => acc + Number(it.precio_venta || 0) * Number(it.cantidad || 0),
    0
  );

  function setCantidadFila(id, val) {
    const n = Math.max(0, Number(val || 0));
    setCantidades(prev => ({ ...prev, [id]: n }));
  }

  function agregar(prod) {
    const cant = Number(cantidades[prod.id] || 0);
    if (!cant || cant <= 0) {
      Swal.fire('⚠️ Error', 'La cantidad debe ser mayor a 0', 'warning');
      return;
    }
    // IMPORTANTE: En presupuestos NO verificamos stock disponible
    // Solo mostramos el stock pero permitimos cualquier cantidad

    setCarrito(prev => {
      const i = prev.findIndex(x => x.id === prod.id);
      if (i >= 0) {
        const copy = [...prev];
        copy[i] = { ...copy[i], cantidad: Number(copy[i].cantidad) + cant };
        return copy;
      }
      return [
        ...prev,
        {
          id: prod.id,
          nombre: prod.nombre,
          precio_venta: Number(prod.precio_venta || 0),
          cantidad: cant,
        },
      ];
    });

    setCantidades(prev => ({ ...prev, [prod.id]: 0 }));
  }

  function cambiarCantidadCarrito(id, cant) {
    setCarrito(prev =>
      prev.map(it => (it.id === id ? { ...it, cantidad: Math.max(0, Number(cant || 0)) } : it))
    );
  }

  function quitarDelCarrito(id) {
    setCarrito(prev => prev.filter(it => it.id !== id));
  }

  async function confirmarPresupuesto() {
    // Prevenir doble ejecución
    if (procesandoPresupuesto) {
      return;
    }

    try {
      if (!carrito.length) {
        Swal.fire('⚠️ Carrito vacío', 'Agrega productos antes de crear el presupuesto', 'warning');
        return;
      }

      setProcesandoPresupuesto(true);

      // Crear presupuesto (NO descuenta stock)
      const presupuesto = await crearPresupuesto({ 
        cliente, 
        items: carrito, 
        numeroPresupuesto,
        direccionCliente 
      });

      // Generar factura PDF del presupuesto
      await generarPresupuestoPDF({ 
        cliente, 
        items: carrito, 
        total, 
        numeroPresupuesto, 
        direccionCliente 
      });

      // Actualizar presupuestos
      setPresupuestos(p => [presupuesto, ...p]);

      // Incrementar número de presupuesto
      const siguiente = numeroPresupuesto + 1;
      setNumeroPresupuesto(siguiente);
      localStorage.setItem('numeroPresupuesto', siguiente);

      // Resetear carrito y cliente
      setCarrito([]);
      setCliente('');
      setDireccionCliente('');
      setCantidades({});

      // Mostrar resumen
      const htmlMensaje = `
        <div class="text-center">
          <p><strong>Presupuesto Nº ${numeroPresupuesto}</strong></p>
          <p>Cliente: ${cliente || 'Consumidor Final'}</p>
          <p class="h4 text-success">Total: $${total.toFixed(2)}</p>
          <small class="text-muted mt-2 d-block">El presupuesto se ha generado correctamente. El stock NO se ha descontado.</small>
        </div>
      `;

      Swal.fire({
        title: '✅ Presupuesto creado',
        html: htmlMensaje,
        icon: 'success',
        confirmButtonText: 'Continuar'
      });

    } catch (e) {
      console.error(e);
      Swal.fire('❌ Error', e.message || 'No se pudo crear el presupuesto', 'error');
    } finally {
      setProcesandoPresupuesto(false);
    }
  }

  async function generarPresupuestoPDF({ cliente, items, total, numeroPresupuesto, direccionCliente = '' }) {
    const doc = new jsPDF();

    const fecha = new Date();
    const fechaVencimiento = new Date();
    fechaVencimiento.setDate(fechaVencimiento.getDate() + 30); // Válido por 30 días

    // Agregar logo PLACAM
    await agregarLogoPDF(doc, { x: 14, y: 5 });

    doc.setFontSize(16);
    doc.text('PRESUPUESTO', 14, 30);

    doc.setFontSize(11);
    doc.text('Cliente:', 14, 45);
    doc.text(cliente || 'Consumidor Final', 40, 45);

    // Dirección del cliente si se proporciona
    if (direccionCliente) {
      doc.text('Dirección:', 14, 51);
      doc.text(direccionCliente, 40, 51);
    }

    doc.text('Presupuesto Nº:', 140, 40);
    doc.text(`${numeroPresupuesto}`, 180, 40);

    doc.text('Fecha:', 140, 46);
    doc.text(fecha.toLocaleDateString('es-AR'), 180, 46);

    doc.text('Válido hasta:', 140, 52);
    doc.text(fechaVencimiento.toLocaleDateString('es-AR'), 180, 52);

    // Nota importante sobre presupuesto
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text('Este documento es un presupuesto y no constituye una factura de venta.', 14, 60);
    doc.text('Los precios están sujetos a confirmación al momento de la compra.', 14, 64);
    doc.setTextColor(0, 0, 0);

    // Ordenar productos alfabéticamente
    const itemsOrdenados = [...(items || [])].sort((a, b) => a.nombre.localeCompare(b.nombre));

    const cuerpo = itemsOrdenados.map((it, idx) => [
      idx + 1,
      it.nombre,
      it.cantidad,
      '—', // Impuesto
      Number(it.precio_venta || 0).toLocaleString('es-AR'),
      '0,00%', // Descuento
      (Number(it.cantidad) * Number(it.precio_venta || 0)).toLocaleString('es-AR'),
    ]);

    autoTable(doc, {
      startY: 70,
      head: [['#', 'Descripción de artículo', 'Cantidad', 'Impuesto', 'Precio', 'Descuento', 'Total']],
      body: cuerpo,
      styles: { 
        halign: 'center',
        textColor: [0, 0, 0]
      },
      headStyles: { 
        fillColor: [230, 230, 230],
        textColor: [0, 0, 0]
      },
    });

    const y = doc.lastAutoTable.finalY;

    doc.setFontSize(12);
    doc.text(`Total: $ ${Number(total).toLocaleString('es-AR')}`, 150, y + 10);

    // Nota final
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text('Este presupuesto tiene una validez de 30 días desde la fecha de emisión.', 14, y + 20);
    doc.text('Los precios pueden variar sin previo aviso.', 14, y + 25);

    doc.save(`presupuesto_${numeroPresupuesto}.pdf`);
  }

  // Función para generar presupuesto de uno existente
  async function generarPresupuestoExistente(presupuesto) {
    try {
      const numeroPresupuesto = presupuesto.numeroPresupuesto || presupuesto.numero_presupuesto || presupuesto.id;
      const fechaPresupuesto = new Date(presupuesto.fecha);
      
      await generarPresupuestoPDF({
        cliente: presupuesto.cliente,
        items: presupuesto.items || [],
        total: presupuesto.total,
        numeroPresupuesto: numeroPresupuesto,
        direccionCliente: presupuesto.direccion_cliente || presupuesto.direccionCliente || ''
      });
      
      Swal.fire('✅ Presupuesto generado', `Presupuesto Nº ${numeroPresupuesto} descargado`, 'success');
    } catch (error) {
      console.error('Error generando presupuesto:', error);
      Swal.fire('❌ Error', 'No se pudo generar el presupuesto', 'error');
    }
  }

  return (
    <Container fluid className="px-2 px-md-3">
      <Card className="p-2 p-md-3 shadow" style={{ background: '#23272b', color: '#fff', border: '1px solid #23272b' }}>
        <h1 className="h3 h-md-2 mb-3">📋 Presupuestos</h1>
        <p className="text-muted mb-3">Crea presupuestos sin descontar stock. Los clientes pueden ver los precios antes de comprar.</p>

        {/* Búsqueda y cliente */}
        <Form className="row g-3 mb-3" onSubmit={e => e.preventDefault()}>
          <div className="col-12 col-md-4">
            <Form.Label>Buscar producto</Form.Label>
            <Form.Control
              placeholder="Nombre o proveedor"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
            />
          </div>
          <div className="col-12 col-md-4">
            <Form.Label>Cliente (opcional)</Form.Label>
            <Form.Control
              placeholder="Nombre del cliente"
              value={cliente}
              onChange={e => setCliente(e.target.value)}
            />
          </div>
          <div className="col-12 col-md-4">
            <Form.Label>Dirección del cliente (opcional)</Form.Label>
            <Form.Control
              placeholder="Dirección del cliente"
              value={direccionCliente}
              onChange={e => setDireccionCliente(e.target.value)}
            />
          </div>
        </Form>

        {/* Productos */}
        <div className="table-responsive">
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>Producto</th>
                <th className="text-end">Stock Disponible</th>
                <th className="text-end">Precio Venta</th>
                <th style={{ width: 140 }} className="text-end">Cantidad</th>
                <th className="text-end">Acción</th>
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <tr><td colSpan="5">Cargando…</td></tr>
              ) : productosPagina.length ? (
                productosPagina.map((prod) => (
                  <tr key={prod.id}>
                    <td>{prod.nombre}</td>
                    <td className="text-end">{Number(prod.cantidad || 0)}</td>
                    <td className="text-end">${Number(prod.precio_venta || 0).toFixed(2)}</td>
                    <td className="text-end">
                      <Form.Control
                        type="number"
                        min={1}
                        value={cantidades[prod.id] || ''}
                        onChange={(e) => setCantidadFila(prod.id, e.target.value)}
                        placeholder="Cantidad"
                      />
                    </td>
                    <td className="text-end">
                      <Button
                        size="sm"
                        variant="success"
                        onClick={() => agregar(prod)}
                      >
                        Agregar
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="5" className="text-center">No hay productos</td></tr>
              )}
            </tbody>
          </Table>
        </div>

        {/* Paginación de productos */}
        {!cargando && filtrados.length > productosPorPagina && (
          <div className="d-flex justify-content-center mt-3">
            <Pagination>
              <Pagination.First 
                onClick={() => setPaginaActual(1)}
                disabled={paginaActual === 1}
              />
              <Pagination.Prev 
                onClick={() => setPaginaActual(prev => Math.max(1, prev - 1))}
                disabled={paginaActual === 1}
              />
              
              {[...Array(totalPaginas)].map((_, index) => {
                const numeroPagina = index + 1;
                if (
                  numeroPagina === 1 ||
                  numeroPagina === totalPaginas ||
                  (numeroPagina >= paginaActual - 1 && numeroPagina <= paginaActual + 1)
                ) {
                  return (
                    <Pagination.Item
                      key={numeroPagina}
                      active={numeroPagina === paginaActual}
                      onClick={() => setPaginaActual(numeroPagina)}
                    >
                      {numeroPagina}
                    </Pagination.Item>
                  );
                } else if (
                  numeroPagina === paginaActual - 2 ||
                  numeroPagina === paginaActual + 2
                ) {
                  return <Pagination.Ellipsis key={numeroPagina} />;
                }
                return null;
              })}
              
              <Pagination.Next 
                onClick={() => setPaginaActual(prev => Math.min(totalPaginas, prev + 1))}
                disabled={paginaActual === totalPaginas}
              />
              <Pagination.Last 
                onClick={() => setPaginaActual(totalPaginas)}
                disabled={paginaActual === totalPaginas}
              />
            </Pagination>
          </div>
        )}

        {/* Información de paginación */}
        {!cargando && filtrados.length > 0 && (
          <div className="text-center mt-2 text-muted" style={{ color: '#fff' }}>
            Mostrando {indicePrimero + 1} - {Math.min(indiceUltimo, filtrados.length)} de {filtrados.length} productos
          </div>
        )}

        {/* Carrito */}
        <h3 className="mt-4">🛒 Carrito de Presupuesto</h3>
        <div className="table-responsive mb-3">
          <Table bordered>
            <thead>
              <tr>
                <th>Producto</th>
                <th className="text-end">Precio</th>
                <th className="text-end">Cantidad</th>
                <th className="text-end">Total</th>
                <th className="text-end">Acción</th>
              </tr>
            </thead>
            <tbody>
              {carrito.length ? (
                carrito.map((it) => (
                  <tr key={it.id}>
                    <td>{it.nombre}</td>
                    <td className="text-end">${Number(it.precio_venta || 0).toFixed(2)}</td>
                    <td className="text-end" style={{ width: 120 }}>
                      <Form.Control
                        type="number"
                        min={0}
                        value={it.cantidad}
                        onChange={(e) => cambiarCantidadCarrito(it.id, e.target.value)}
                      />
                    </td>
                    <td className="text-end">
                      ${(Number(it.precio_venta || 0) * Number(it.cantidad || 0)).toFixed(2)}
                    </td>
                    <td className="text-end">
                      <Button size="sm" variant="outline-danger" onClick={() => quitarDelCarrito(it.id)}>
                        Quitar
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="5" className="text-center">Carrito vacío</td></tr>
              )}
            </tbody>
            <tfoot>
              <tr>
                <th colSpan="3" className="text-end">Total</th>
                <th className="text-end">${total.toFixed(2)}</th>
                <th className="text-end">
                  <Button variant="primary" onClick={confirmarPresupuesto} disabled={!carrito.length || procesandoPresupuesto} className="w-100 w-md-auto">
                    {procesandoPresupuesto ? '⏳ Procesando...' : 'Generar Presupuesto PDF'}
                  </Button>
                </th>
              </tr>
            </tfoot>
          </Table>
        </div>

        {/* Historial de presupuestos */}
        <h5>Últimos presupuestos</h5>
        <div className="table-responsive">
          <Table striped bordered hover size="sm">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Presupuesto Nº</th>
                <th>Cliente</th>
                <th className="text-end">Total</th>
                <th className="text-center">Acción</th>
              </tr>
            </thead>
            <tbody>
              {presupuestos.length ? (
                presupuestos.map(p => (
                  <tr key={p.id}>
                    <td>{new Date(p.fecha).toLocaleString()}</td>
                    <td>{p.numeroPresupuesto || p.numero_presupuesto || '—'}</td>
                    <td>{p.cliente || 'Consumidor Final'}</td>
                    <td className="text-end">${Number(p.total || 0).toFixed(2)}</td>
                    <td className="text-center">
                      <Button
                        size="sm"
                        variant="outline-primary"
                        onClick={() => generarPresupuestoExistente(p)}
                        title="Generar presupuesto PDF"
                      >
                        📄 Presupuesto
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="5" className="text-center">Sin presupuestos</td></tr>
              )}
            </tbody>
          </Table>
        </div>
      </Card>
    </Container>
  );
};

export default PresupuestosPage;




