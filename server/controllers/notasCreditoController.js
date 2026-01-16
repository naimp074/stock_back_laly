import NotaCredito from '../models/NotaCredito.js';
import Producto from '../models/Producto.js';
import Venta from '../models/Venta.js';

// @desc    Obtener todas las notas de crédito
// @route   GET /api/notas-credito
// @access  Private
export const obtenerNotasCredito = async (req, res) => {
  try {
    const { limit = 50 } = req.query;

    // Todos los usuarios ven todas las notas de crédito
    const notas = await NotaCredito.find({})
      .sort({ fecha: -1 })
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      count: notas.length,
      data: notas
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener notas de crédito',
      error: error.message
    });
  }
};

// @desc    Obtener una nota de crédito por ID
// @route   GET /api/notas-credito/:id
// @access  Private
export const obtenerNotaCredito = async (req, res) => {
  try {
    const { id } = req.params;

    // Todos los usuarios pueden ver cualquier nota de crédito
    const nota = await NotaCredito.findById(id);

    if (!nota) {
      return res.status(404).json({
        success: false,
        message: 'Nota de crédito no encontrada'
      });
    }

    res.status(200).json({
      success: true,
      data: nota
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener nota de crédito',
      error: error.message
    });
  }
};

// @desc    Crear una nueva nota de crédito y devolver stock
// @route   POST /api/notas-credito
// @access  Private
export const crearNotaCredito = async (req, res) => {
  try {
    const user_id = req.user_id;
    const { 
      cliente, 
      motivo, 
      items, 
      total, 
      numero_factura_original,
      observaciones,
      venta_original_id
    } = req.body;

    if (!motivo) {
      return res.status(400).json({
        success: false,
        message: 'El motivo es requerido'
      });
    }

    // Generar número de nota de crédito (buscar en todas las notas)
    const ultimaNota = await NotaCredito.findOne({})
      .sort({ numero_nota: -1 })
      .select('numero_nota');
    
    const numeroNota = ultimaNota && ultimaNota.numero_nota 
      ? ultimaNota.numero_nota + 1 
      : 1;

    // Crear la nota de crédito
    const nota = await NotaCredito.create({
      cliente: cliente || 'Consumidor Final',
      motivo,
      items: items || [],
      total: Number(total || 0),
      numero_factura_original: numero_factura_original || null,
      numero_nota: numeroNota,
      observaciones: observaciones || null,
      venta_original_id: venta_original_id || null,
      fecha: new Date(),
      user_id
    });

    // Devolver stock de productos si hay items (buscar en todos los productos, sin filtrar por user_id)
    if (items && Array.isArray(items) && items.length > 0) {
      for (const item of items) {
        if (!item.id || !item.cantidad) continue;

        const producto = await Producto.findById(item.id);

        if (producto) {
          const stockActual = Number(producto.cantidad || 0);
          const cantidadDevolver = Number(item.cantidad || 0);
          const nuevoStock = stockActual + cantidadDevolver;

          await Producto.findByIdAndUpdate(producto._id, {
            cantidad: nuevoStock
          });
        }
      }
    }

    res.status(201).json({
      success: true,
      data: nota
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al crear nota de crédito',
      error: error.message
    });
  }
};

// @desc    Actualizar una nota de crédito
// @route   PUT /api/notas-credito/:id
// @access  Private
export const actualizarNotaCredito = async (req, res) => {
  try {
    const { id } = req.params;
    const { ...notaData } = req.body;

    // Todos los usuarios pueden actualizar cualquier nota de crédito
    const nota = await NotaCredito.findByIdAndUpdate(
      id,
      notaData,
      { new: true, runValidators: true }
    );

    if (!nota) {
      return res.status(404).json({
        success: false,
        message: 'Nota de crédito no encontrada'
      });
    }

    res.status(200).json({
      success: true,
      data: nota
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al actualizar nota de crédito',
      error: error.message
    });
  }
};

// @desc    Eliminar una nota de crédito
// @route   DELETE /api/notas-credito/:id
// @access  Private
export const eliminarNotaCredito = async (req, res) => {
  try {
    const { id } = req.params;

    // Todos los usuarios pueden eliminar cualquier nota de crédito
    const nota = await NotaCredito.findByIdAndDelete(id);

    if (!nota) {
      return res.status(404).json({
        success: false,
        message: 'Nota de crédito no encontrada'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Nota de crédito eliminada correctamente',
      data: nota
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al eliminar nota de crédito',
      error: error.message
    });
  }
};

// @desc    Obtener ventas disponibles para nota de crédito
// @route   GET /api/notas-credito/ventas-disponibles
// @access  Private
export const obtenerVentasParaNotaCredito = async (req, res) => {
  try {
    const { limit = 100 } = req.query;

    // Obtener todas las ventas (sin filtrar por usuario)
    const todasLasVentas = await Venta.find({})
      .sort({ fecha: -1 })
      .limit(Number(limit));

    // Obtener notas de crédito existentes para filtrar ventas ya procesadas (sin filtrar por usuario)
    const notasCredito = await NotaCredito.find({});
    const ventasConNotaCredito = new Set(
      notasCredito
        .map(nota => nota.venta_original_id?.toString())
        .filter(id => id != null)
    );

    // Filtrar solo ventas que no tengan nota de crédito
    const ventasFiltradas = todasLasVentas.filter(venta => {
      return !ventasConNotaCredito.has(venta._id.toString());
    });

    res.status(200).json({
      success: true,
      count: ventasFiltradas.length,
      data: ventasFiltradas
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener ventas disponibles',
      error: error.message
    });
  }
};

// @desc    Obtener estadísticas de notas de crédito
// @route   GET /api/notas-credito/estadisticas
// @access  Private
export const obtenerEstadisticasNotasCredito = async (req, res) => {
  try {
    // Todos los usuarios ven estadísticas de todas las notas de crédito
    const notas = await NotaCredito.find({});

    const hoy = new Date();
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const hace7 = new Date(hoy);
    hace7.setDate(hace7.getDate() - 7);

    let totalHoy = 0;
    let totalSemana = 0;
    let totalMes = 0;
    let totalGeneral = 0;

    for (const nota of notas) {
      const fecha = new Date(nota.fecha);
      const monto = Number(nota.total || 0);

      totalGeneral += monto;

      if (fecha.toDateString() === hoy.toDateString()) {
        totalHoy += monto;
      }

      if (fecha >= hace7) {
        totalSemana += monto;
      }

      if (fecha >= inicioMes) {
        totalMes += monto;
      }
    }

    res.status(200).json({
      success: true,
      data: {
        totalHoy,
        totalSemana,
        totalMes,
        totalGeneral,
        cantidad: notas.length
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

