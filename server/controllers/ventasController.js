import Venta from '../models/Venta.js';
import Producto from '../models/Producto.js';

// @desc    Obtener todas las ventas
// @route   GET /api/ventas
// @access  Private
export const obtenerVentas = async (req, res) => {
  try {
    const user_id = req.user_id;
    const { limit = 50 } = req.query;

    const ventas = await Venta.find({ user_id })
      .sort({ fecha: -1 })
      .limit(Number(limit));

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

// @desc    Obtener una venta por ID
// @route   GET /api/ventas/:id
// @access  Private
export const obtenerVenta = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user_id;

    const venta = await Venta.findOne({ _id: id, user_id });

    if (!venta) {
      return res.status(404).json({
        success: false,
        message: 'Venta no encontrada'
      });
    }

    res.status(200).json({
      success: true,
      data: venta
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener venta',
      error: error.message
    });
  }
};

// @desc    Crear una nueva venta y descontar stock
// @route   POST /api/ventas
// @access  Private
export const crearVenta = async (req, res) => {
  try {
    const user_id = req.user_id;
    const { cliente, items, numeroFactura, ...ventaData } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere al menos un item en la venta'
      });
    }

    // Calcular total
    const total = items.reduce(
      (acc, it) => acc + Number(it.precio_venta || 0) * Number(it.cantidad || 0),
      0
    );

    // Crear la venta
    const venta = await Venta.create({
      cliente: cliente || null,
      total,
      items,
      numero_factura: numeroFactura || null,
      fecha: new Date(),
      ...ventaData,
      user_id
    });

    // Descontar stock de productos
    for (const item of items) {
      if (!item.id) continue;

      const producto = await Producto.findOne({ 
        _id: item.id, 
        user_id 
      });

      if (producto) {
        const cantVendida = Number(item.cantidad || 0);
        const nuevaCantidad = Math.max(0, Number(producto.cantidad || 0) - cantVendida);
        
        await Producto.findByIdAndUpdate(producto._id, {
          cantidad: nuevaCantidad
        });
      }
    }

    res.status(201).json({
      success: true,
      data: venta
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al crear venta',
      error: error.message
    });
  }
};

// @desc    Actualizar una venta
// @route   PUT /api/ventas/:id
// @access  Private
export const actualizarVenta = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user_id;
    const { ...ventaData } = req.body;

    const venta = await Venta.findOneAndUpdate(
      { _id: id, user_id },
      ventaData,
      { new: true, runValidators: true }
    );

    if (!venta) {
      return res.status(404).json({
        success: false,
        message: 'Venta no encontrada'
      });
    }

    res.status(200).json({
      success: true,
      data: venta
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al actualizar venta',
      error: error.message
    });
  }
};

// @desc    Eliminar una venta
// @route   DELETE /api/ventas/:id
// @access  Private
export const eliminarVenta = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user_id;

    const venta = await Venta.findOneAndDelete({ _id: id, user_id });

    if (!venta) {
      return res.status(404).json({
        success: false,
        message: 'Venta no encontrada'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Venta eliminada correctamente',
      data: venta
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al eliminar venta',
      error: error.message
    });
  }
};

// @desc    Obtener siguiente número de factura
// @route   GET /api/ventas/siguiente-numero
// @access  Private
export const obtenerSiguienteNumeroFactura = async (req, res) => {
  try {
    const user_id = req.user_id;

    const ultimaVenta = await Venta.findOne({ 
      user_id, 
      numero_factura: { $ne: null } 
    })
      .sort({ numero_factura: -1 })
      .select('numero_factura');

    const siguienteNumero = ultimaVenta && ultimaVenta.numero_factura 
      ? ultimaVenta.numero_factura + 1 
      : 1;

    res.status(200).json({
      success: true,
      data: { siguiente_numero: siguienteNumero }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener siguiente número de factura',
      error: error.message
    });
  }
};

