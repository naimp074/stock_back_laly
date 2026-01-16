import Venta from '../models/Venta.js';
import Producto from '../models/Producto.js';

// @desc    Obtener todas las ventas
// @route   GET /api/ventas
// @access  Private
export const obtenerVentas = async (req, res) => {
  try {
    const { limit = 50 } = req.query;

    // Todos los usuarios ven todas las ventas
    const ventas = await Venta.find({})
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

    // Todos los usuarios pueden ver cualquier venta
    const venta = await Venta.findById(id);

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

    // Descontar stock de productos (buscar en todos los productos, sin filtrar por user_id)
    for (const item of items) {
      if (!item.id) continue;

      const producto = await Producto.findById(item.id);

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
    const { ...ventaData } = req.body;

    // Todos los usuarios pueden actualizar cualquier venta
    const venta = await Venta.findByIdAndUpdate(
      id,
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

    // Todos los usuarios pueden eliminar cualquier venta
    const venta = await Venta.findByIdAndDelete(id);

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
    // Buscar en todas las ventas para obtener el siguiente número global
    const ultimaVenta = await Venta.findOne({ 
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

