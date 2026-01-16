import Producto from '../models/Producto.js';
import Venta from '../models/Venta.js';
import Presupuesto from '../models/Presupuesto.js';
import CuentaCorriente from '../models/CuentaCorriente.js';
import PagoCorriente from '../models/PagoCorriente.js';
import NotaCredito from '../models/NotaCredito.js';

// @desc    Eliminar todos los productos
// @route   DELETE /api/limpieza/productos
// @access  Private
export const eliminarTodosLosProductos = async (req, res) => {
  try {
    const resultado = await Producto.deleteMany({});
    
    res.status(200).json({
      success: true,
      message: `Se eliminaron ${resultado.deletedCount} productos`,
      deletedCount: resultado.deletedCount
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al eliminar productos',
      error: error.message
    });
  }
};

// @desc    Eliminar todas las ventas
// @route   DELETE /api/limpieza/ventas
// @access  Private
export const eliminarTodasLasVentas = async (req, res) => {
  try {
    const resultado = await Venta.deleteMany({});
    
    res.status(200).json({
      success: true,
      message: `Se eliminaron ${resultado.deletedCount} ventas`,
      deletedCount: resultado.deletedCount
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al eliminar ventas',
      error: error.message
    });
  }
};

// @desc    Eliminar todos los presupuestos
// @route   DELETE /api/limpieza/presupuestos
// @access  Private
export const eliminarTodosLosPresupuestos = async (req, res) => {
  try {
    const resultado = await Presupuesto.deleteMany({});
    
    res.status(200).json({
      success: true,
      message: `Se eliminaron ${resultado.deletedCount} presupuestos`,
      deletedCount: resultado.deletedCount
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al eliminar presupuestos',
      error: error.message
    });
  }
};

// @desc    Eliminar todas las cuentas corrientes y sus movimientos
// @route   DELETE /api/limpieza/cuentas-corrientes
// @access  Private
export const eliminarTodasLasCuentasCorrientes = async (req, res) => {
  try {
    // Primero eliminar todos los movimientos
    const movimientosEliminados = await PagoCorriente.deleteMany({});
    
    // Luego eliminar todas las cuentas
    const cuentasEliminadas = await CuentaCorriente.deleteMany({});
    
    res.status(200).json({
      success: true,
      message: `Se eliminaron ${cuentasEliminadas.deletedCount} cuentas corrientes y ${movimientosEliminados.deletedCount} movimientos`,
      deletedCount: {
        cuentas: cuentasEliminadas.deletedCount,
        movimientos: movimientosEliminados.deletedCount
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al eliminar cuentas corrientes',
      error: error.message
    });
  }
};

// @desc    Eliminar todas las notas de crédito
// @route   DELETE /api/limpieza/notas-credito
// @access  Private
export const eliminarTodasLasNotasCredito = async (req, res) => {
  try {
    const resultado = await NotaCredito.deleteMany({});
    
    res.status(200).json({
      success: true,
      message: `Se eliminaron ${resultado.deletedCount} notas de crédito`,
      deletedCount: resultado.deletedCount
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al eliminar notas de crédito',
      error: error.message
    });
  }
};

// @desc    Eliminar TODO (todas las colecciones excepto usuarios)
// @route   DELETE /api/limpieza/todo
// @access  Private
export const eliminarTodo = async (req, res) => {
  try {
    // Eliminar en paralelo para mayor velocidad
    const [
      productosResult,
      ventasResult,
      presupuestosResult,
      notasCreditoResult,
      movimientosResult,
      cuentasResult
    ] = await Promise.all([
      Producto.deleteMany({}),
      Venta.deleteMany({}),
      Presupuesto.deleteMany({}),
      NotaCredito.deleteMany({}),
      PagoCorriente.deleteMany({}),
      CuentaCorriente.deleteMany({})
    ]);
    
    const totalEliminado = 
      productosResult.deletedCount +
      ventasResult.deletedCount +
      presupuestosResult.deletedCount +
      notasCreditoResult.deletedCount +
      movimientosResult.deletedCount +
      cuentasResult.deletedCount;
    
    res.status(200).json({
      success: true,
      message: 'Todos los datos han sido eliminados correctamente',
      deletedCount: {
        productos: productosResult.deletedCount,
        ventas: ventasResult.deletedCount,
        presupuestos: presupuestosResult.deletedCount,
        notasCredito: notasCreditoResult.deletedCount,
        movimientos: movimientosResult.deletedCount,
        cuentasCorrientes: cuentasResult.deletedCount,
        total: totalEliminado
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al eliminar todos los datos',
      error: error.message
    });
  }
};

// @desc    Obtener estadísticas de datos cargados
// @route   GET /api/limpieza/estadisticas
// @access  Private
export const obtenerEstadisticasDatos = async (req, res) => {
  try {
    const [
      productosCount,
      ventasCount,
      presupuestosCount,
      notasCreditoCount,
      movimientosCount,
      cuentasCount
    ] = await Promise.all([
      Producto.countDocuments({}),
      Venta.countDocuments({}),
      Presupuesto.countDocuments({}),
      NotaCredito.countDocuments({}),
      PagoCorriente.countDocuments({}),
      CuentaCorriente.countDocuments({})
    ]);
    
    res.status(200).json({
      success: true,
      data: {
        productos: productosCount,
        ventas: ventasCount,
        presupuestos: presupuestosCount,
        notasCredito: notasCreditoCount,
        movimientos: movimientosCount,
        cuentasCorrientes: cuentasCount,
        total: productosCount + ventasCount + presupuestosCount + notasCreditoCount + movimientosCount + cuentasCount
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
