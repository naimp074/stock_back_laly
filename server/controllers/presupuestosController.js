import Presupuesto from '../models/Presupuesto.js';

// @desc    Obtener todos los presupuestos
// @route   GET /api/presupuestos
// @access  Private
export const obtenerPresupuestos = async (req, res) => {
  try {
    const user_id = req.user_id;
    const { limit = 50 } = req.query;

    const presupuestos = await Presupuesto.find({ user_id })
      .sort({ fecha: -1 })
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      count: presupuestos.length,
      data: presupuestos
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener presupuestos',
      error: error.message
    });
  }
};

// @desc    Obtener un presupuesto por ID
// @route   GET /api/presupuestos/:id
// @access  Private
export const obtenerPresupuesto = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user_id;

    const presupuesto = await Presupuesto.findOne({ _id: id, user_id });

    if (!presupuesto) {
      return res.status(404).json({
        success: false,
        message: 'Presupuesto no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      data: presupuesto
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener presupuesto',
      error: error.message
    });
  }
};

// @desc    Crear un nuevo presupuesto (NO descuenta stock)
// @route   POST /api/presupuestos
// @access  Private
export const crearPresupuesto = async (req, res) => {
  try {
    const user_id = req.user_id;
    const { cliente, items, numeroPresupuesto, direccionCliente, ...presupuestoData } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere al menos un item en el presupuesto'
      });
    }

    // Calcular total
    const total = items.reduce(
      (acc, it) => acc + Number(it.precio_venta || 0) * Number(it.cantidad || 0),
      0
    );

    // Crear el presupuesto (NO descuenta stock)
    const presupuesto = await Presupuesto.create({
      cliente: cliente || null,
      direccion_cliente: direccionCliente || null,
      total,
      items: items.map(item => ({
        producto_id: item.id,
        nombre: item.nombre,
        precio_venta: Number(item.precio_venta || 0),
        cantidad: Number(item.cantidad || 0)
      })),
      numero_presupuesto: numeroPresupuesto || null,
      fecha: new Date(),
      tipo: 'presupuesto',
      ...presupuestoData,
      user_id
    });

    res.status(201).json({
      success: true,
      data: presupuesto
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al crear presupuesto',
      error: error.message
    });
  }
};

// @desc    Actualizar un presupuesto
// @route   PUT /api/presupuestos/:id
// @access  Private
export const actualizarPresupuesto = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user_id;
    const { ...presupuestoData } = req.body;

    const presupuesto = await Presupuesto.findOneAndUpdate(
      { _id: id, user_id },
      presupuestoData,
      { new: true, runValidators: true }
    );

    if (!presupuesto) {
      return res.status(404).json({
        success: false,
        message: 'Presupuesto no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      data: presupuesto
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al actualizar presupuesto',
      error: error.message
    });
  }
};

// @desc    Eliminar un presupuesto
// @route   DELETE /api/presupuestos/:id
// @access  Private
export const eliminarPresupuesto = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user_id;

    const presupuesto = await Presupuesto.findOneAndDelete({ _id: id, user_id });

    if (!presupuesto) {
      return res.status(404).json({
        success: false,
        message: 'Presupuesto no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Presupuesto eliminado correctamente',
      data: presupuesto
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al eliminar presupuesto',
      error: error.message
    });
  }
};

// @desc    Obtener siguiente número de presupuesto
// @route   GET /api/presupuestos/siguiente-numero
// @access  Private
export const obtenerSiguienteNumeroPresupuesto = async (req, res) => {
  try {
    const user_id = req.user_id;

    const ultimoPresupuesto = await Presupuesto.findOne({ 
      user_id, 
      numero_presupuesto: { $ne: null } 
    })
      .sort({ numero_presupuesto: -1 })
      .select('numero_presupuesto');

    const siguienteNumero = ultimoPresupuesto && ultimoPresupuesto.numero_presupuesto 
      ? ultimoPresupuesto.numero_presupuesto + 1 
      : 1;

    res.status(200).json({
      success: true,
      data: { siguiente_numero: siguienteNumero }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener siguiente número de presupuesto',
      error: error.message
    });
  }
};









