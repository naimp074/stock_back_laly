import Venta from '../models/Venta.js';
import Producto from '../models/Producto.js';
import NotaCredito from '../models/NotaCredito.js';
import CuentaCorriente from '../models/CuentaCorriente.js';
import PagoCorriente from '../models/PagoCorriente.js';

// @desc    Obtener estadísticas generales (solo admin)
// @route   GET /api/reportes/estadisticas
// @access  Private/Admin
export const obtenerEstadisticas = async (req, res) => {
  try {
    const userId = req.user_id;


    const hoy = new Date();
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const inicioAnio = new Date(hoy.getFullYear(), 0, 1);
    const hace7 = new Date(hoy);
    hace7.setDate(hace7.getDate() - 7);
    const hace30 = new Date(hoy);
    hace30.setDate(hace30.getDate() - 30);

    // Ventas
    const todasLasVentas = await Venta.find({ user_id: userId });
    const ventasHoy = todasLasVentas.filter(v => {
      const fecha = new Date(v.fecha);
      return fecha.toDateString() === hoy.toDateString();
    });
    const ventasMes = todasLasVentas.filter(v => new Date(v.fecha) >= inicioMes);
    const ventasAnio = todasLasVentas.filter(v => new Date(v.fecha) >= inicioAnio);

    const totalVentasHoy = ventasHoy.reduce((acc, v) => acc + Number(v.total || 0), 0);
    const totalVentasMes = ventasMes.reduce((acc, v) => acc + Number(v.total || 0), 0);
    const totalVentasAnio = ventasAnio.reduce((acc, v) => acc + Number(v.total || 0), 0);

    // Productos
    const productos = await Producto.find({ user_id: userId });
    const productosBajoStock = productos.filter(p => p.cantidad <= p.stock_minimo);
    const totalProductos = productos.length;
    const valorInventario = productos.reduce((acc, p) => {
      return acc + (Number(p.cantidad || 0) * Number(p.precio_costo || 0));
    }, 0);

    // Notas de crédito
    const notasCredito = await NotaCredito.find({ user_id: userId });
    const notasMes = notasCredito.filter(n => new Date(n.fecha) >= inicioMes);
    const totalNotasMes = notasMes.reduce((acc, n) => acc + Number(n.total || 0), 0);

    // Cuentas corrientes
    const cuentasCorrientes = await CuentaCorriente.find({ user_id: userId });
    const totalDeuda = cuentasCorrientes.reduce((acc, c) => {
      return acc + Math.max(0, Number(c.saldo || 0));
    }, 0);

    res.status(200).json({
      success: true,
      data: {
        ventas: {
          hoy: {
            cantidad: ventasHoy.length,
            total: totalVentasHoy
          },
          mes: {
            cantidad: ventasMes.length,
            total: totalVentasMes
          },
          anio: {
            cantidad: ventasAnio.length,
            total: totalVentasAnio
          }
        },
        productos: {
          total: totalProductos,
          bajoStock: productosBajoStock.length,
          valorInventario
        },
        notasCredito: {
          mes: {
            cantidad: notasMes.length,
            total: totalNotasMes
          }
        },
        cuentasCorrientes: {
          totalClientes: cuentasCorrientes.length,
          totalDeuda
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas',
      error: error.message
    });
  }
};

// @desc    Obtener ventas por período (solo admin)
// @route   GET /api/reportes/ventas
// @access  Private/Admin
export const obtenerVentasPorPeriodo = async (req, res) => {
  try {
    const userId = req.user_id;
    const { inicio, fin } = req.query;


    const filtro = { user_id: userId };
    
    if (inicio && fin) {
      filtro.fecha = {
        $gte: new Date(inicio),
        $lte: new Date(fin)
      };
    }

    const ventas = await Venta.find(filtro).sort({ fecha: -1 });

    res.status(200).json({
      success: true,
      count: ventas.length,
      data: ventas
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener ventas',
      error: error.message
    });
  }
};

// @desc    Obtener productos más vendidos (solo admin)
// @route   GET /api/reportes/productos-mas-vendidos
// @access  Private/Admin
export const obtenerProductosMasVendidos = async (req, res) => {
  try {
    const userId = req.user_id;
    const { limite = 10 } = req.query;


    const ventas = await Venta.find({ user_id: userId });
    const productosVendidos = {};

    ventas.forEach(venta => {
      if (venta.items && Array.isArray(venta.items)) {
        venta.items.forEach(item => {
          if (item.id && item.nombre) {
            if (!productosVendidos[item.id]) {
              productosVendidos[item.id] = {
                id: item.id,
                nombre: item.nombre,
                cantidad: 0,
                total: 0
              };
            }
            productosVendidos[item.id].cantidad += Number(item.cantidad || 0);
            productosVendidos[item.id].total += Number(item.precio_venta || 0) * Number(item.cantidad || 0);
          }
        });
      }
    });

    const productosArray = Object.values(productosVendidos)
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, Number(limite));

    res.status(200).json({
      success: true,
      count: productosArray.length,
      data: productosArray
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener productos más vendidos',
      error: error.message
    });
  }
};

