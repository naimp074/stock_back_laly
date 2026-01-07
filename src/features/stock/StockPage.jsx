// src/features/stock/StockPage.jsx
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Container, Card, Form, Button, Table, Image, Pagination, Badge, InputGroup, Row, Col, Alert } from 'react-bootstrap';
import * as XLSX from 'xlsx';
import Swal from 'sweetalert2';

import {
  listarProductos,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
  guardarProductosMasivo,
} from '../../services/productosService';

const StockPage = () => {
  const [productos, setProductos] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [filtroStockBajo, setFiltroStockBajo] = useState(false);
  const [filtroProveedor, setFiltroProveedor] = useState('');
  const [ordenarPor, setOrdenarPor] = useState('nombre'); // nombre, precio_venta, cantidad, fecha
  const [ordenAscendente, setOrdenAscendente] = useState(true);
  
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editId, setEditId] = useState(null);
  const [nuevoProducto, setNuevoProducto] = useState({
    nombre: '',
    costo: '',
    venta: '',
    cantidad: '',
    stock_minimo: '5',
    unidad: 'unidad',
    proveedor: '',
    telefono: '',
    imagen: '',
    codigo_barras: '',
    categoria: '',
  });
  const [cargando, setCargando] = useState(true);
  const [guardandoProducto, setGuardandoProducto] = useState(false);
  const [paginaActual, setPaginaActual] = useState(1);
  const [productosPorPagina, setProductosPorPagina] = useState(10);
  
  // Obtener lista única de proveedores
  const proveedores = useMemo(() => {
    const provs = [...new Set(productos.map(p => p.proveedor).filter(Boolean))];
    return provs.sort();
  }, [productos]);

  // Filtrar y ordenar productos
  const productosFiltrados = useMemo(() => {
    let filtrados = [...productos];
    
    // Búsqueda por texto
    const q = busqueda.trim().toLowerCase();
    if (q) {
      filtrados = filtrados.filter(p => 
        (p?.nombre || '').toLowerCase().includes(q) ||
        (p?.proveedor || '').toLowerCase().includes(q) ||
        (p?.codigo_barras || '').toLowerCase().includes(q) ||
        (p?.categoria || '').toLowerCase().includes(q)
      );
    }
    
    // Filtro de stock bajo
    if (filtroStockBajo) {
      const stockMinimo = Number(nuevoProducto.stock_minimo || 5);
      filtrados = filtrados.filter(p => Number(p.cantidad || 0) <= stockMinimo);
    }
    
    // Filtro por proveedor
    if (filtroProveedor) {
      filtrados = filtrados.filter(p => p.proveedor === filtroProveedor);
    }
    
    // Ordenar
    filtrados.sort((a, b) => {
      let valorA, valorB;
      
      switch (ordenarPor) {
        case 'precio_venta':
          valorA = Number(a.precio_venta || 0);
          valorB = Number(b.precio_venta || 0);
          break;
        case 'cantidad':
          valorA = Number(a.cantidad || 0);
          valorB = Number(b.cantidad || 0);
          break;
        case 'fecha':
          valorA = new Date(a.created_at || 0).getTime();
          valorB = new Date(b.created_at || 0).getTime();
          break;
        default: // nombre
          valorA = (a.nombre || '').toLowerCase();
          valorB = (b.nombre || '').toLowerCase();
      }
      
      if (typeof valorA === 'string') {
        return ordenAscendente 
          ? valorA.localeCompare(valorB, 'es', { sensitivity: 'base' })
          : valorB.localeCompare(valorA, 'es', { sensitivity: 'base' });
      }
      
      return ordenAscendente ? valorA - valorB : valorB - valorA;
    });
    
    return filtrados;
  }, [productos, busqueda, filtroStockBajo, filtroProveedor, ordenarPor, ordenAscendente, nuevoProducto.stock_minimo]);

  // Calcular índices para paginación
  const indiceUltimo = paginaActual * productosPorPagina;
  const indicePrimero = indiceUltimo - productosPorPagina;
  const productosPagina = productosFiltrados.slice(indicePrimero, indiceUltimo);
  const totalPaginas = Math.ceil(productosFiltrados.length / productosPorPagina);

  // Resetear a página 1 cuando cambia la búsqueda
  useEffect(() => {
    setPaginaActual(1);
  }, [busqueda]);

  // Cargar desde localStorage al montar
  useEffect(() => {
    (async () => {
      try {
        setCargando(true);
        const data = await listarProductos();
        setProductos(data);
      } catch (e) {
        console.error('Error cargando productos:', e.message || e);
        Swal.fire('❌ Error', e.message || 'No se pudieron cargar los productos', 'error');
      } finally {
        setCargando(false);
      }
    })();
  }, []);

  // Calcular margen de ganancia
  const calcularMargen = useCallback((costo, venta) => {
    if (!costo || !venta || costo === 0) return { porcentaje: 0, monto: 0 };
    const monto = venta - costo;
    const porcentaje = ((monto / costo) * 100).toFixed(2);
    return { porcentaje: Number(porcentaje), monto };
  }, []);

  // Obtener color según stock
  const getStockColor = useCallback((cantidad, stockMinimo = 5) => {
    const cant = Number(cantidad || 0);
    const min = Number(stockMinimo || 5);
    if (cant === 0) return 'danger';
    if (cant <= min) return 'warning';
    return 'success';
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNuevoProducto({
      ...nuevoProducto,
      [name]: value,
    });
    
    // Validar que precio venta sea mayor que costo
    if (name === 'venta' || name === 'costo') {
      const costo = name === 'costo' ? Number(value || 0) : Number(nuevoProducto.costo || 0);
      const venta = name === 'venta' ? Number(value || 0) : Number(nuevoProducto.venta || 0);
      if (venta > 0 && costo > 0 && venta < costo) {
        // Mostrar advertencia pero no bloquear
        console.warn('El precio de venta es menor que el costo');
      }
    }
  };

  const handleGuardarProducto = async (e) => {
    e.preventDefault();
    
    // Prevenir doble ejecución
    if (guardandoProducto) {
      return;
    }

    try {
      // Validaciones
      if (!nuevoProducto.nombre.trim()) {
        Swal.fire('⚠️ Error', 'El nombre del producto es obligatorio', 'warning');
        return;
      }

      setGuardandoProducto(true);
      
      const costo = Number(nuevoProducto.costo || 0);
      const venta = Number(nuevoProducto.venta || 0);
      
      if (venta > 0 && costo > 0 && venta < costo) {
        const { value: confirmar } = await Swal.fire({
          title: '⚠️ Advertencia',
          text: 'El precio de venta es menor que el costo. ¿Deseas continuar?',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: 'Sí, continuar',
          cancelButtonText: 'Cancelar'
        });
        if (!confirmar) return;
      }

      const payload = {
        nombre: (nuevoProducto.nombre || '').trim(),
        precio_costo: costo,
        precio_venta: venta,
        cantidad: Number(nuevoProducto.cantidad || 0),
        stock_minimo: Number(nuevoProducto.stock_minimo || 5),
        unidad: nuevoProducto.unidad || 'unidad',
        proveedor: nuevoProducto.proveedor || null,
        telefono: nuevoProducto.telefono || null,
        imagen: nuevoProducto.imagen || null,
        codigo_barras: nuevoProducto.codigo_barras || null,
        categoria: nuevoProducto.categoria || null,
      };

      let guardado;

      if (editId !== null) {
        guardado = await actualizarProducto(editId, payload);
        // Actualizar solo el producto modificado sin reordenar toda la lista
        setProductos(prev => prev.map(p => p.id === editId ? guardado : p));
        Swal.fire('✅ Actualizado', 'El producto fue editado con éxito', 'success');
      } else {
        guardado = await crearProducto(payload); // no manda id → Postgres genera
        // Agregar al inicio sin reordenar toda la lista
        setProductos(prev => [guardado, ...prev]);
        Swal.fire('✅ Guardado', 'El producto fue agregado con éxito', 'success');
      }

      setEditId(null);
      setNuevoProducto({
        nombre: '',
        costo: '',
        venta: '',
        cantidad: '',
        stock_minimo: '5',
        unidad: 'unidad',
        proveedor: '',
        telefono: '',
        imagen: '',
        codigo_barras: '',
        categoria: '',
      });
      setMostrarFormulario(false);
    } catch (error) {
      console.error(error);
      Swal.fire('❌ Error', error.message || 'No se pudo guardar', 'error');
    } finally {
      setGuardandoProducto(false);
    }
  };

  const handleExcelUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(new Uint8Array(data), { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const sheet = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

      const productosExcel = sheet.map((row) => ({
        nombre: row.Nombre || row.Producto || row.nombre || '',
        precio_costo: Number(row.Costo ?? row.costo ?? 0),
        precio_venta: Number(row.Venta ?? row.venta ?? 0),
        cantidad: Number(row.Cantidad ?? row.cantidad ?? 0),
        proveedor: row.Proveedor ?? row.proveedor ?? null,
        telefono: row.Telefono ?? row.telefono ?? null,
        imagen: row.Imagen ?? row.imagen ?? null,
      }));

      const guardados = await guardarProductosMasivo(productosExcel);

      const merged = [...guardados, ...productos].sort((a, b) =>
        (a.nombre || '').localeCompare(b.nombre || '', 'es', { sensitivity: 'base' })
      );
      setProductos(merged);

      Swal.fire('📂 Importado', 'Productos cargados desde Excel', 'success');
    } catch (error) {
      console.error(error);
      Swal.fire('❌ Error', error.message || 'No se pudo importar el Excel', 'error');
    } finally {
      e.target.value = '';
    }
  };

  const handleEliminar = (id) => {
    Swal.fire({
      title: '¿Estás seguro?',
      text: 'No podrás revertir esta acción',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          if (!id) throw new Error('No se encontró el ID del producto');
          await eliminarProducto(id);

          const productosActualizados = productos.filter(p => p.id !== id);
          setProductos(productosActualizados);
          
          // Si se eliminó el último producto de la última página, volver a la página anterior
          const productosFiltradosActualizados = productosActualizados.filter(p => {
            const q = busqueda.trim().toLowerCase();
            if (!q) return true;
            return (
              (p?.nombre || '').toLowerCase().includes(q) ||
              (p?.proveedor || '').toLowerCase().includes(q)
            );
          });
          const nuevaTotalPaginas = Math.ceil(productosFiltradosActualizados.length / productosPorPagina);
          if (paginaActual > nuevaTotalPaginas && nuevaTotalPaginas > 0) {
            setPaginaActual(nuevaTotalPaginas);
          }
          
          Swal.fire('🗑️ Eliminado', 'El producto fue eliminado', 'success');
        } catch (error) {
          console.error(error);
          Swal.fire('❌ Error', error.message || 'No se pudo eliminar', 'error');
        }
      }
    });
  };

  const handleEditar = (id) => {
    const p = productos.find(prod => prod.id === id);
    if (!p) {
      Swal.fire('❌ Error', 'No se encontró el producto', 'error');
      return;
    }
    setNuevoProducto({
      nombre: p?.nombre || '',
      costo: p?.precio_costo ?? '',
      venta: p?.precio_venta ?? '',
      cantidad: p?.cantidad ?? '',
      stock_minimo: p?.stock_minimo ?? '5',
      unidad: p?.unidad || 'unidad',
      proveedor: p?.proveedor ?? '',
      telefono: p?.telefono ?? '',
      imagen: p?.imagen ?? '',
      codigo_barras: p?.codigo_barras ?? '',
      categoria: p?.categoria ?? '',
    });
    setEditId(id);
    setMostrarFormulario(true);
  };

  const handleDuplicar = async (id) => {
    const p = productos.find(prod => prod.id === id);
    if (!p) {
      Swal.fire('❌ Error', 'No se encontró el producto', 'error');
      return;
    }
    
    const { value: nombreNuevo } = await Swal.fire({
      title: 'Duplicar Producto',
      text: 'Ingresa un nombre para el producto duplicado',
      input: 'text',
      inputValue: `${p.nombre} (Copia)`,
      showCancelButton: true,
      confirmButtonText: 'Duplicar',
      cancelButtonText: 'Cancelar',
      inputValidator: (value) => {
        if (!value) {
          return 'Debes ingresar un nombre';
        }
      }
    });

    if (!nombreNuevo) return;

    try {
      const payload = {
        nombre: nombreNuevo.trim(),
        precio_costo: Number(p.precio_costo || 0),
        precio_venta: Number(p.precio_venta || 0),
        cantidad: 0, // Stock en 0 para el duplicado
        stock_minimo: Number(p.stock_minimo || 5),
        unidad: p.unidad || 'unidad',
        proveedor: p.proveedor || null,
        telefono: p.telefono || null,
        imagen: p.imagen || null,
        codigo_barras: p.codigo_barras || null,
        categoria: p.categoria || null,
      };

      const guardado = await crearProducto(payload);
      setProductos(
        [guardado, ...productos].sort((a, b) =>
          (a.nombre || '').localeCompare(b.nombre || '', 'es', { sensitivity: 'base' })
        )
      );
      Swal.fire('✅ Duplicado', 'El producto fue duplicado con éxito', 'success');
    } catch (error) {
      console.error(error);
      Swal.fire('❌ Error', error.message || 'No se pudo duplicar', 'error');
    }
  };

  const handleAjusteStock = async (id, cantidadActual) => {
    const { value: nuevaCantidad } = await Swal.fire({
      title: 'Ajustar Stock',
      text: `Cantidad actual: ${cantidadActual}`,
      input: 'number',
      inputValue: cantidadActual,
      showCancelButton: true,
      confirmButtonText: 'Actualizar',
      cancelButtonText: 'Cancelar',
      inputValidator: (value) => {
        if (value === '' || value === null) {
          return 'Debes ingresar una cantidad';
        }
        if (Number(value) < 0) {
          return 'La cantidad no puede ser negativa';
        }
      }
    });

    if (nuevaCantidad === undefined) return;

    try {
      const p = productos.find(prod => prod.id === id);
      if (!p) throw new Error('Producto no encontrado');

      const payload = {
        nombre: p.nombre,
        precio_costo: Number(p.precio_costo || 0),
        precio_venta: Number(p.precio_venta || 0),
        cantidad: Number(nuevaCantidad),
        stock_minimo: Number(p.stock_minimo || 5),
        unidad: p.unidad || 'unidad',
        proveedor: p.proveedor || null,
        telefono: p.telefono || null,
        imagen: p.imagen || null,
        codigo_barras: p.codigo_barras || null,
        categoria: p.categoria || null,
      };

      const actualizado = await actualizarProducto(id, payload);
      setProductos(prev => prev.map(p => p.id === id ? actualizado : p));
      Swal.fire('✅ Actualizado', 'El stock fue actualizado', 'success');
    } catch (error) {
      console.error(error);
      Swal.fire('❌ Error', error.message || 'No se pudo actualizar', 'error');
    }
  };

  const handleExportarExcel = () => {
    const datosExportar = productosFiltrados.map(p => ({
      'Nombre': p.nombre,
      'Código Barras': p.codigo_barras || '',
      'Categoría': p.categoria || '',
      'Precio Costo': Number(p.precio_costo || 0),
      'Precio Venta': Number(p.precio_venta || 0),
      'Cantidad': Number(p.cantidad || 0),
      'Stock Mínimo': Number(p.stock_minimo || 5),
      'Unidad': p.unidad || 'unidad',
      'Proveedor': p.proveedor || '',
      'Teléfono': p.telefono || '',
      'Imagen': p.imagen || '',
    }));

    const ws = XLSX.utils.json_to_sheet(datosExportar);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Productos');
    XLSX.writeFile(wb, `productos_${new Date().toISOString().split('T')[0]}.xlsx`);
    Swal.fire('✅ Exportado', 'Los productos fueron exportados a Excel', 'success');
  };

  // Estadísticas rápidas
  const productosStockBajo = useMemo(() => {
    const min = Number(nuevoProducto.stock_minimo || 5);
    return productos.filter(p => Number(p.cantidad || 0) <= min);
  }, [productos, nuevoProducto.stock_minimo]);

  return (
    <Container fluid className="px-2 px-md-3">
      <Card className="p-2 p-md-3 shadow">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h1 className="h3 h-md-2 mb-0">Gestión de Stock</h1>
          <div className="d-flex gap-2">
            {!mostrarFormulario && (
              <>
                <Button variant="outline-primary" size="sm" onClick={handleExportarExcel}>
                  📥 Exportar Excel
                </Button>
                <Button
                  variant="success"
                  onClick={() => setMostrarFormulario(true)}
                >
                  ➕ Cargar Producto
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Alertas de stock bajo */}
        {productosStockBajo.length > 0 && (
          <Alert variant="warning" className="mb-3">
            <Alert.Heading>⚠️ Stock Bajo</Alert.Heading>
            <p className="mb-0">
              Tienes <strong>{productosStockBajo.length}</strong> producto(s) con stock bajo o agotado.
            </p>
          </Alert>
        )}

        {/* Filtros avanzados */}
        <Card className="mb-3 p-3" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <Row className="g-2">
            <Col md={4}>
              <Form.Label>Buscar producto</Form.Label>
              <Form.Control
                type="text"
                placeholder="Nombre, proveedor, código o categoría"
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
              />
            </Col>
            <Col md={2}>
              <Form.Label>Ordenar por</Form.Label>
              <Form.Select
                value={ordenarPor}
                onChange={e => setOrdenarPor(e.target.value)}
              >
                <option value="nombre">Nombre</option>
                <option value="precio_venta">Precio Venta</option>
                <option value="cantidad">Stock</option>
                <option value="fecha">Fecha</option>
              </Form.Select>
            </Col>
            <Col md={1}>
              <Form.Label>&nbsp;</Form.Label>
              <Form.Select
                value={ordenAscendente ? 'asc' : 'desc'}
                onChange={e => setOrdenAscendente(e.target.value === 'asc')}
              >
                <option value="asc">↑ Asc</option>
                <option value="desc">↓ Desc</option>
              </Form.Select>
            </Col>
            <Col md={2}>
              <Form.Label>Filtros</Form.Label>
              <Form.Check
                type="checkbox"
                label="Solo stock bajo"
                checked={filtroStockBajo}
                onChange={e => setFiltroStockBajo(e.target.checked)}
              />
            </Col>
            <Col md={3}>
              <Form.Label>Proveedor</Form.Label>
              <Form.Select
                value={filtroProveedor}
                onChange={e => setFiltroProveedor(e.target.value)}
              >
                <option value="">Todos los proveedores</option>
                {proveedores.map(prov => (
                  <option key={prov} value={prov}>{prov}</option>
                ))}
              </Form.Select>
            </Col>
          </Row>
          <div className="mt-2 text-muted small">
            Mostrando {productosFiltrados.length} de {productos.length} productos
          </div>
        </Card>

        {!mostrarFormulario && (
          <div className="mb-3">
            <Form.Label>Productos por página</Form.Label>
            <Form.Select
              value={productosPorPagina}
              onChange={e => {
                setProductosPorPagina(Number(e.target.value));
                setPaginaActual(1);
              }}
              style={{ width: 'auto' }}
            >
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </Form.Select>
          </div>
        )}

        {mostrarFormulario && (
          <Card className="mb-3 p-3" style={{ backgroundColor: 'var(--bg-secondary)' }}>
            <Form onSubmit={handleGuardarProducto}>
              <h5 className="mb-3">{editId !== null ? '✏️ Editar Producto' : '➕ Nuevo Producto'}</h5>
              
              {/* Cálculo de margen */}
              {nuevoProducto.costo && nuevoProducto.venta && Number(nuevoProducto.costo) > 0 && Number(nuevoProducto.venta) > 0 && (
                <Alert variant={Number(nuevoProducto.venta) >= Number(nuevoProducto.costo) ? 'success' : 'warning'} className="mb-3">
                  <strong>Margen de ganancia:</strong> {
                    calcularMargen(Number(nuevoProducto.costo), Number(nuevoProducto.venta)).porcentaje
                  }% (${calcularMargen(Number(nuevoProducto.costo), Number(nuevoProducto.venta)).monto.toFixed(2)})
                  {Number(nuevoProducto.venta) < Number(nuevoProducto.costo) && (
                    <div className="mt-1 small">⚠️ El precio de venta es menor que el costo</div>
                  )}
                </Alert>
              )}

              <Row className="g-2">
                <Form.Group className="mb-2 col-12 col-md-6">
                  <Form.Label>Nombre del Producto <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    name="nombre"
                    value={nuevoProducto.nombre}
                    onChange={handleChange}
                    required
                  />
                </Form.Group>
                <Form.Group className="mb-2 col-12 col-md-3">
                  <Form.Label>Código de Barras</Form.Label>
                  <Form.Control
                    type="text"
                    name="codigo_barras"
                    value={nuevoProducto.codigo_barras}
                    onChange={handleChange}
                    placeholder="Opcional"
                  />
                </Form.Group>
                <Form.Group className="mb-2 col-12 col-md-3">
                  <Form.Label>Categoría</Form.Label>
                  <Form.Control
                    type="text"
                    name="categoria"
                    value={nuevoProducto.categoria}
                    onChange={handleChange}
                    placeholder="Opcional"
                  />
                </Form.Group>
                <Form.Group className="mb-2 col-12 col-md-4">
                  <Form.Label>Precio Costo</Form.Label>
                  <InputGroup>
                    <InputGroup.Text>$</InputGroup.Text>
                    <Form.Control
                      type="number"
                      step="0.01"
                      name="costo"
                      value={nuevoProducto.costo}
                      onChange={handleChange}
                      min="0"
                    />
                  </InputGroup>
                </Form.Group>
                <Form.Group className="mb-2 col-12 col-md-4">
                  <Form.Label>Precio Venta</Form.Label>
                  <InputGroup>
                    <InputGroup.Text>$</InputGroup.Text>
                    <Form.Control
                      type="number"
                      step="0.01"
                      name="venta"
                      value={nuevoProducto.venta}
                      onChange={handleChange}
                      min="0"
                    />
                  </InputGroup>
                </Form.Group>
                <Form.Group className="mb-2 col-12 col-md-4">
                  <Form.Label>Cantidad</Form.Label>
                  <Form.Control
                    type="number"
                    name="cantidad"
                    value={nuevoProducto.cantidad}
                    onChange={handleChange}
                    min="0"
                  />
                </Form.Group>
                <Form.Group className="mb-2 col-12 col-md-3">
                  <Form.Label>Stock Mínimo</Form.Label>
                  <Form.Control
                    type="number"
                    name="stock_minimo"
                    value={nuevoProducto.stock_minimo}
                    onChange={handleChange}
                    min="0"
                  />
                  <Form.Text className="text-muted">Alerta cuando el stock llegue a este nivel</Form.Text>
                </Form.Group>
                <Form.Group className="mb-2 col-12 col-md-3">
                  <Form.Label>Unidad</Form.Label>
                  <Form.Select
                    name="unidad"
                    value={nuevoProducto.unidad}
                    onChange={handleChange}
                  >
                    <option value="unidad">Unidad</option>
                    <option value="kg">Kilogramo (kg)</option>
                    <option value="L">Litro (L)</option>
                    <option value="m">Metro (m)</option>
                    <option value="cm">Centímetro (cm)</option>
                    <option value="m²">Metro cuadrado (m²)</option>
                    <option value="m³">Metro cúbico (m³)</option>
                    <option value="g">Gramo (g)</option>
                    <option value="ml">Mililitro (ml)</option>
                    <option value="caja">Caja</option>
                    <option value="paquete">Paquete</option>
                    <option value="docena">Docena</option>
                    <option value="par">Par</option>
                  </Form.Select>
                </Form.Group>
                <Form.Group className="mb-2 col-12 col-md-3">
                  <Form.Label>Proveedor</Form.Label>
                  <Form.Control
                    type="text"
                    name="proveedor"
                    value={nuevoProducto.proveedor}
                    onChange={handleChange}
                    list="proveedores-list"
                  />
                  <datalist id="proveedores-list">
                    {proveedores.map(prov => (
                      <option key={prov} value={prov} />
                    ))}
                  </datalist>
                </Form.Group>
                <Form.Group className="mb-2 col-12 col-md-3">
                  <Form.Label>Teléfono</Form.Label>
                  <Form.Control
                    type="text"
                    name="telefono"
                    value={nuevoProducto.telefono}
                    onChange={handleChange}
                    placeholder="Teléfono del proveedor"
                  />
                </Form.Group>
                <Form.Group className="mb-2 col-12">
                  <Form.Label>URL de la Imagen</Form.Label>
                  <Form.Control
                    type="url"
                    name="imagen"
                    placeholder="https://ejemplo.com/imagen.jpg"
                    value={nuevoProducto.imagen || ''}
                    onChange={handleChange}
                  />
                </Form.Group>
                {nuevoProducto.imagen && (
                  <div className="mb-2 col-12">
                    <Form.Label>Vista Previa</Form.Label>
                    <div>
                      <Image src={nuevoProducto.imagen} thumbnail width={150} onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'block';
                      }} />
                      <div style={{ display: 'none', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}>
                        ⚠️ No se pudo cargar la imagen
                      </div>
                    </div>
                  </div>
                )}
                <div className="col-12 d-flex flex-column flex-md-row gap-2">
                  <Button type="submit" variant="primary" className="w-100 w-md-auto" disabled={guardandoProducto}>
                    {guardandoProducto ? '⏳ Guardando...' : (editId !== null ? '💾 Actualizar Producto' : '💾 Guardar Producto')}
                  </Button>
                  <Button
                    variant="secondary"
                    className="w-100 w-md-auto"
                    onClick={() => {
                      setMostrarFormulario(false);
                      setEditId(null);
                      setNuevoProducto({
                        nombre: '',
                        costo: '',
                        venta: '',
                        cantidad: '',
                        stock_minimo: '5',
                        unidad: 'unidad',
                        proveedor: '',
                        telefono: '',
                        imagen: '',
                        codigo_barras: '',
                        categoria: '',
                      });
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </Row>
            </Form>
          </Card>
        )}

        <Form.Group controlId="formFile" className="mb-3">
          <Form.Label>Cargar Excel</Form.Label>
          <Form.Control
            type="file"
            accept=".xlsx, .xls"
            onChange={handleExcelUpload}
          />
        </Form.Group>

        <div className="table-responsive">
          {cargando ? (
            <div className="text-center p-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Cargando...</span>
              </div>
              <p className="mt-2">Cargando productos...</p>
            </div>
          ) : (
            <Table striped bordered hover>
              <thead>
                <tr>
                  <th style={{ width: '80px' }}>Imagen</th>
                  <th>Nombre</th>
                  <th>Código</th>
                  <th>Categoría</th>
                  <th className="text-end">Precio Costo</th>
                  <th className="text-end">Precio Venta</th>
                  <th className="text-end">Margen</th>
                  <th className="text-center">Stock</th>
                  <th>Unidad</th>
                  <th>Proveedor</th>
                  <th className="text-center" style={{ width: '200px' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {productosPagina.length > 0 ? (
                  productosPagina.map((prod, index) => {
                    const stockMinimo = Number(prod.stock_minimo || nuevoProducto.stock_minimo || 5);
                    const cantidad = Number(prod.cantidad || 0);
                    const stockColor = getStockColor(cantidad, stockMinimo);
                    const margen = calcularMargen(Number(prod.precio_costo || 0), Number(prod.precio_venta || 0));
                    
                    return (
                      <tr key={prod.id || index}>
                        <td>
                          {prod.imagen ? (
                            <Image 
                              src={prod.imagen} 
                              thumbnail 
                              width={60} 
                              height={60}
                              style={{ objectFit: 'cover' }}
                              onError={(e) => {
                                e.target.style.display = 'none';
                                if (!e.target.nextElementSibling) {
                                  const span = document.createElement('span');
                                  span.textContent = '❌';
                                  span.className = 'text-muted';
                                  e.target.parentElement.appendChild(span);
                                }
                              }}
                            />
                          ) : (
                            <span className="text-muted">📦</span>
                          )}
                        </td>
                        <td>
                          <strong>{prod.nombre}</strong>
                          {cantidad <= stockMinimo && (
                            <Badge bg="warning" className="ms-2" text="dark">
                              ⚠️ Stock bajo
                            </Badge>
                          )}
                        </td>
                        <td>
                          <small className="text-muted">{prod.codigo_barras || '—'}</small>
                        </td>
                        <td>
                          <small>{prod.categoria || '—'}</small>
                        </td>
                        <td className="text-end">
                          ${Number(prod.precio_costo || 0).toFixed(2)}
                        </td>
                        <td className="text-end">
                          <strong>${Number(prod.precio_venta || 0).toFixed(2)}</strong>
                        </td>
                        <td className="text-end">
                          {margen.porcentaje > 0 ? (
                            <span className="text-success">
                              {margen.porcentaje.toFixed(1)}%
                            </span>
                          ) : (
                            <span className="text-danger">
                              {margen.porcentaje.toFixed(1)}%
                            </span>
                          )}
                        </td>
                        <td className="text-center">
                          <Badge 
                            bg={stockColor} 
                            style={{ cursor: 'pointer' }}
                            onClick={() => handleAjusteStock(prod.id, cantidad)}
                            title="Click para ajustar stock"
                          >
                            {cantidad} {prod.unidad || 'unidad'}
                          </Badge>
                          {cantidad <= stockMinimo && (
                            <div className="small text-muted mt-1">
                              Mín: {stockMinimo}
                            </div>
                          )}
                        </td>
                        <td>
                          <small>{prod.unidad || 'unidad'}</small>
                        </td>
                        <td>
                          <small>{prod.proveedor || '—'}</small>
                        </td>
                        <td>
                          <div className="d-flex flex-column flex-md-row gap-1">
                            <Button
                              variant="warning"
                              size="sm"
                              className="w-100 w-md-auto"
                              onClick={() => handleEditar(prod.id)}
                              title="Editar producto"
                            >
                              ✏️
                            </Button>
                            <Button
                              variant="info"
                              size="sm"
                              className="w-100 w-md-auto"
                              onClick={() => handleDuplicar(prod.id)}
                              title="Duplicar producto"
                            >
                              📋
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              className="w-100 w-md-auto"
                              onClick={() => handleAjusteStock(prod.id, cantidad)}
                              title="Ajustar stock"
                            >
                              📊
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              className="w-100 w-md-auto"
                              onClick={() => handleEliminar(prod.id)}
                              title="Eliminar producto"
                            >
                              🗑️
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="11" className="text-center p-4">
                      {productos.length === 0 ? (
                        <div>
                          <p className="mb-2">📦 No hay productos aún</p>
                          <Button variant="success" onClick={() => setMostrarFormulario(true)}>
                            Agregar primer producto
                          </Button>
                        </div>
                      ) : (
                        <div>
                          <p className="mb-2">🔍 No se encontraron productos con los filtros aplicados</p>
                          <Button variant="outline-secondary" onClick={() => {
                            setBusqueda('');
                            setFiltroStockBajo(false);
                            setFiltroProveedor('');
                          }}>
                            Limpiar filtros
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          )}
        </div>

        {/* Paginación */}
        {!cargando && productosFiltrados.length > productosPorPagina && (
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
                // Mostrar solo algunas páginas alrededor de la actual
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
        {!cargando && productosFiltrados.length > 0 && (
          <div className="text-center mt-2 text-muted">
            Mostrando {indicePrimero + 1} - {Math.min(indiceUltimo, productosFiltrados.length)} de {productosFiltrados.length} productos
          </div>
        )}
      </Card>
    </Container>
  );
};

export default StockPage;
