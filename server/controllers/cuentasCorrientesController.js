import CuentaCorriente from '../models/CuentaCorriente.js';
import PagoCorriente from '../models/PagoCorriente.js';
import Venta from '../models/Venta.js';

// @desc    Obtener todas las cuentas corrientes
// @route   GET /api/cuentas-corrientes
// @access  Private
export const obtenerCuentas = async (req, res) => {
  try {
    // Todos los usuarios ven todas las cuentas corrientes
    const cuentas = await CuentaCorriente.find({})
      .sort({ createdAt: -1 });

    // Calcular saldos
    const cuentasConSaldos = await Promise.all(
      cuentas.map(async (cuenta) => {
        const movimientos = await PagoCorriente.find({ cuenta_id: cuenta._id });
        const saldo = movimientos.reduce((acc, m) => {
          const sign = m.tipo === 'pago' ? -1 : 1;
          return acc + sign * Number(m.monto_real || m.monto || 0);
        }, 0);

        // Actualizar saldo en la cuenta
        await CuentaCorriente.findByIdAndUpdate(cuenta._id, { saldo });

        return {
          ...cuenta.toObject(),
          saldo
        };
      })
    );

    res.status(200).json({
      success: true,
      count: cuentasConSaldos.length,
      data: cuentasConSaldos
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener cuentas corrientes',
      error: error.message
    });
  }
};

// @desc    Obtener una cuenta corriente por ID
// @route   GET /api/cuentas-corrientes/:id
// @access  Private
export const obtenerCuenta = async (req, res) => {
  try {
    const { id } = req.params;

    // Todos los usuarios pueden ver cualquier cuenta corriente
    const cuenta = await CuentaCorriente.findById(id);

    if (!cuenta) {
      return res.status(404).json({
        success: false,
        message: 'Cuenta corriente no encontrada'
      });
    }

    // Calcular saldo actual
    const movimientos = await PagoCorriente.find({ cuenta_id: cuenta._id });
    const saldo = movimientos.reduce((acc, m) => {
      const sign = m.tipo === 'pago' ? -1 : 1;
      return acc + sign * Number(m.monto_real || m.monto || 0);
    }, 0);

    res.status(200).json({
      success: true,
      data: {
        ...cuenta.toObject(),
        saldo
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener cuenta corriente',
      error: error.message
    });
  }
};

// @desc    Crear una nueva cuenta corriente
// @route   POST /api/cuentas-corrientes
// @access  Private
export const crearCuenta = async (req, res) => {
  try {
    const user_id = req.user_id;
    const { cliente, ...cuentaData } = req.body;

    if (!cliente) {
      return res.status(400).json({
        success: false,
        message: 'El nombre del cliente es requerido'
      });
    }

    const cuenta = await CuentaCorriente.create({
      cliente,
      ...cuentaData,
      user_id
    });

    res.status(201).json({
      success: true,
      data: cuenta
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al crear cuenta corriente',
      error: error.message
    });
  }
};

// @desc    Actualizar una cuenta corriente
// @route   PUT /api/cuentas-corrientes/:id
// @access  Private
export const actualizarCuenta = async (req, res) => {
  try {
    const { id } = req.params;
    const { ...cuentaData } = req.body;

    // Todos los usuarios pueden actualizar cualquier cuenta corriente
    const cuenta = await CuentaCorriente.findByIdAndUpdate(
      id,
      cuentaData,
      { new: true, runValidators: true }
    );

    if (!cuenta) {
      return res.status(404).json({
        success: false,
        message: 'Cuenta corriente no encontrada'
      });
    }

    res.status(200).json({
      success: true,
      data: cuenta
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al actualizar cuenta corriente',
      error: error.message
    });
  }
};

// @desc    Eliminar una cuenta corriente
// @route   DELETE /api/cuentas-corrientes/:id
// @access  Private
export const eliminarCuenta = async (req, res) => {
  try {
    const { id } = req.params;

    // Todos los usuarios pueden eliminar cualquier cuenta corriente
    const cuenta = await CuentaCorriente.findByIdAndDelete(id);

    if (!cuenta) {
      return res.status(404).json({
        success: false,
        message: 'Cuenta corriente no encontrada'
      });
    }

    // Eliminar también los movimientos asociados
    await PagoCorriente.deleteMany({ cuenta_id: id });

    res.status(200).json({
      success: true,
      message: 'Cuenta corriente eliminada correctamente',
      data: cuenta
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al eliminar cuenta corriente',
      error: error.message
    });
  }
};

// ============================================
// MOVIMIENTOS (PAGOS CORRIENTES)
// ============================================

// @desc    Obtener movimientos de una cuenta
// @route   GET /api/cuentas-corrientes/:id/movimientos
// @access  Private
export const obtenerMovimientos = async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 100 } = req.query;

    // Verificar que la cuenta existe (sin filtrar por usuario)
    const cuenta = await CuentaCorriente.findById(id);
    if (!cuenta) {
      return res.status(404).json({
        success: false,
        message: 'Cuenta corriente no encontrada'
      });
    }

    // Todos los usuarios pueden ver los movimientos de cualquier cuenta
    const movimientos = await PagoCorriente.find({ cuenta_id: id })
      .sort({ fecha: -1 })
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      count: movimientos.length,
      data: movimientos
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener movimientos',
      error: error.message
    });
  }
};

// @desc    Registrar un movimiento (cargo o pago)
// @route   POST /api/cuentas-corrientes/:id/movimientos
// @access  Private
export const registrarMovimiento = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user_id;
    const { tipo, monto, concepto, factura, descuento, items, numeroFactura } = req.body;

    if (!tipo || !['cargo', 'pago'].includes(tipo)) {
      return res.status(400).json({
        success: false,
        message: 'Tipo debe ser "cargo" o "pago"'
      });
    }

    if (!monto || monto <= 0) {
      return res.status(400).json({
        success: false,
        message: 'El monto debe ser mayor a 0'
      });
    }

    // Verificar que la cuenta existe (sin filtrar por usuario)
    const cuenta = await CuentaCorriente.findById(id);
    if (!cuenta) {
      return res.status(404).json({
        success: false,
        message: 'Cuenta corriente no encontrada'
      });
    }

    // Obtener siguiente número de factura si no se proporciona (buscar en todas las ventas)
    let numeroFacturaFinal = numeroFactura || factura;
    if (!numeroFacturaFinal) {
      const ultimaVenta = await Venta.findOne({ 
        numero_factura: { $ne: null } 
      })
        .sort({ numero_factura: -1 })
        .select('numero_factura');
      
      numeroFacturaFinal = ultimaVenta && ultimaVenta.numero_factura 
        ? ultimaVenta.numero_factura + 1 
        : 1;
    }

    // Crear movimiento
    const movimiento = await PagoCorriente.create({
      cuenta_id: id,
      tipo,
      monto: Number(monto),
      descuento: descuento || 0,
      concepto: concepto || null,
      factura: factura || null,
      numero_factura: numeroFacturaFinal,
      items: items || null,
      fecha: new Date(),
      user_id
    });

    // Si es un pago, también registrar como ingreso en ventas para reportes
    if (tipo === 'pago') {
      const montoReal = descuento 
        ? Number(monto) - (Number(monto) * Number(descuento)) / 100
        : Number(monto);

      await Venta.create({
        cliente: `Cuenta Corriente - ${concepto || 'Pago cuenta corriente'}`,
        items: [{
          id: 'cuenta-corriente',
          nombre: concepto || 'Pago cuenta corriente',
          precio_venta: montoReal,
          cantidad: 1
        }],
        total: montoReal,
        numero_factura: numeroFacturaFinal,
        tipo: 'cuenta_corriente',
        user_id
      });
    }

    // Actualizar saldo de la cuenta
    const movimientos = await PagoCorriente.find({ cuenta_id: id });
    const saldo = movimientos.reduce((acc, m) => {
      const sign = m.tipo === 'pago' ? -1 : 1;
      return acc + sign * Number(m.monto_real || m.monto || 0);
    }, 0);
    await CuentaCorriente.findByIdAndUpdate(id, { saldo });

    res.status(201).json({
      success: true,
      data: movimiento
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al registrar movimiento',
      error: error.message
    });
  }
};

// @desc    Actualizar un movimiento
// @route   PUT /api/cuentas-corrientes/movimientos/:id
// @access  Private
export const actualizarMovimiento = async (req, res) => {
  try {
    const { id } = req.params;
    const { ...movimientoData } = req.body;

    // Todos los usuarios pueden actualizar cualquier movimiento
    const movimiento = await PagoCorriente.findByIdAndUpdate(
      id,
      movimientoData,
      { new: true, runValidators: true }
    );

    if (!movimiento) {
      return res.status(404).json({
        success: false,
        message: 'Movimiento no encontrado'
      });
    }

    // Actualizar saldo de la cuenta
    const movimientos = await PagoCorriente.find({ cuenta_id: movimiento.cuenta_id });
    const saldo = movimientos.reduce((acc, m) => {
      const sign = m.tipo === 'pago' ? -1 : 1;
      return acc + sign * Number(m.monto_real || m.monto || 0);
    }, 0);
    await CuentaCorriente.findByIdAndUpdate(movimiento.cuenta_id, { saldo });

    res.status(200).json({
      success: true,
      data: movimiento
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al actualizar movimiento',
      error: error.message
    });
  }
};

// @desc    Eliminar un movimiento
// @route   DELETE /api/cuentas-corrientes/movimientos/:id
// @access  Private
export const eliminarMovimiento = async (req, res) => {
  try {
    const { id } = req.params;

    // Todos los usuarios pueden eliminar cualquier movimiento
    const movimiento = await PagoCorriente.findById(id);
    if (!movimiento) {
      return res.status(404).json({
        success: false,
        message: 'Movimiento no encontrado'
      });
    }

    const cuentaId = movimiento.cuenta_id;
    await PagoCorriente.findByIdAndDelete(id);

    // Actualizar saldo de la cuenta
    const movimientos = await PagoCorriente.find({ cuenta_id: cuentaId });
    const saldo = movimientos.reduce((acc, m) => {
      const sign = m.tipo === 'pago' ? -1 : 1;
      return acc + sign * Number(m.monto_real || m.monto || 0);
    }, 0);
    await CuentaCorriente.findByIdAndUpdate(cuentaId, { saldo });

    res.status(200).json({
      success: true,
      message: 'Movimiento eliminado correctamente',
      data: movimiento
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al eliminar movimiento',
      error: error.message
    });
  }
};

