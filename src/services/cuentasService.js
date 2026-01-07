import api, { verificarConexion } from '../lib/apiClient';
import { getData, saveData, createItem, updateItemById, deleteItemById, generarId } from './localStorageService';
import { obtenerYActualizarNumeroFactura } from './facturaGlobalService';
import { crearVenta } from './ventasService';

const STORAGE_KEY_CUENTAS = 'cuentas_corrientes';
const STORAGE_KEY_MOVIMIENTOS = 'pagos_corrientes';
const USE_BACKEND = true; // Cambiar a false para usar localStorage como fallback

/**
 * Normalizar cuenta del backend (convierte _id a id)
 */
function normalizarCuenta(cuenta) {
  if (!cuenta) return null;
  const { _id, ...rest } = cuenta;
  return {
    ...rest,
    id: _id || cuenta.id,
    created_at: cuenta.createdAt || cuenta.created_at
  };
}

/**
 * Normalizar array de cuentas
 */
function normalizarCuentas(cuentas) {
  return cuentas.map(normalizarCuenta);
}

/**
 * Normalizar movimiento del backend
 */
function normalizarMovimiento(movimiento) {
  if (!movimiento) return null;
  const { _id, ...rest } = movimiento;
  return {
    ...rest,
    id: _id || movimiento.id,
    fecha: movimiento.createdAt || movimiento.fecha
  };
}

/**
 * Normalizar array de movimientos
 */
function normalizarMovimientos(movimientos) {
  return movimientos.map(normalizarMovimiento);
}

/** CUENTAS */
export async function listarCuentas() {
  try {
    if (USE_BACKEND) {
      const conectado = await verificarConexion();
      if (conectado) {
        const response = await api.get('/cuentas-corrientes');
        return normalizarCuentas(response.data || []);
      }
    }
  } catch (error) {
    console.warn('Error al obtener cuentas del backend, usando localStorage:', error);
  }

  // Fallback a localStorage
  const cuentas = getData(STORAGE_KEY_CUENTAS);
  return cuentas.sort((a, b) => {
    const fechaA = new Date(a.created_at || 0);
    const fechaB = new Date(b.created_at || 0);
    return fechaB - fechaA;
  });
}

export async function crearCuenta({ cliente }) {
  try {
    if (USE_BACKEND) {
      const conectado = await verificarConexion();
      if (conectado) {
        const response = await api.post('/cuentas-corrientes', { cliente });
        return normalizarCuenta(response.data);
      }
    }
  } catch (error) {
    console.warn('Error al crear cuenta en backend, usando localStorage:', error);
  }

  // Fallback a localStorage
  return createItem(STORAGE_KEY_CUENTAS, {
    cliente,
    created_at: new Date().toISOString()
  });
}

/** MOVIMIENTOS */
export async function listarMovimientos(cuenta_id, limit = 100) {
  try {
    if (USE_BACKEND) {
      const conectado = await verificarConexion();
      if (conectado) {
        const response = await api.get(`/cuentas-corrientes/${cuenta_id}/movimientos?limit=${limit}`);
        return normalizarMovimientos(response.data || []);
      }
    }
  } catch (error) {
    console.warn('Error al obtener movimientos del backend, usando localStorage:', error);
  }

  // Fallback a localStorage
  const movimientos = getData(STORAGE_KEY_MOVIMIENTOS);
  return movimientos
    .filter(m => m.cuenta_id === cuenta_id)
    .sort((a, b) => {
      const fechaA = new Date(a.fecha || 0);
      const fechaB = new Date(b.fecha || 0);
      return fechaB - fechaA;
    })
    .slice(0, limit);
}

/** tipo: 'cargo' (debe) o 'pago' (haber) */
export async function registrarMovimiento({ cuenta_id, tipo, monto, concepto, factura, descuento, items }) {
  // Obtener el número de factura global automáticamente si no se pasa uno
  let numeroFactura = factura;
  if (!numeroFactura) {
    numeroFactura = await obtenerYActualizarNumeroFactura();
  }

  try {
    if (USE_BACKEND) {
      const conectado = await verificarConexion();
      if (conectado) {
        const movimientoParaBackend = {
          tipo,
          monto: Number(monto || 0),
          concepto: concepto || null,
          descuento: descuento || 0,
          items: items || null,
          numeroFactura: numeroFactura
        };

        const response = await api.post(`/cuentas-corrientes/${cuenta_id}/movimientos`, movimientoParaBackend);
        // El backend ya maneja el registro en ventas si es un pago
        return normalizarMovimiento(response.data);
      }
    }
  } catch (error) {
    console.warn('Error al registrar movimiento en backend, usando localStorage:', error);
  }

  // Fallback a localStorage
  const montoReal = descuento 
    ? Number(monto) - (Number(monto) * Number(descuento)) / 100
    : Number(monto);

  const movimiento = createItem(STORAGE_KEY_MOVIMIENTOS, {
    cuenta_id,
    tipo,
    monto: Number(monto || 0),
    concepto: concepto || null,
    factura: numeroFactura,
    numero_factura: numeroFactura,
    descuento: descuento || 0,
    items: items || null,
    fecha: new Date().toISOString()
  });

  // Si es un pago, también registrar como ingreso en ventas para reportes
  if (tipo === 'pago') {
    try {
      await registrarIngresoCuentaCorriente({
        monto: montoReal,
        concepto: concepto || 'Pago cuenta corriente',
        factura: numeroFactura,
        cuenta_id: cuenta_id
      });
    } catch (error) {
      console.error('Error al registrar ingreso de cuenta corriente:', error);
    }
  }

  return movimiento;
}

/** Registrar ingreso de cuenta corriente para reportes */
async function registrarIngresoCuentaCorriente({ monto, concepto, factura, cuenta_id }) {
  try {
    // Crear una "venta" especial para el ingreso de cuenta corriente
    await crearVenta({
      cliente: `Cuenta Corriente - ${concepto}`,
      items: [{
        id: 'cuenta-corriente',
        nombre: concepto || 'Pago cuenta corriente',
        precio_venta: monto,
        cantidad: 1
      }],
      numeroFactura: factura
    });
  } catch (error) {
    console.error('Error en registrarIngresoCuentaCorriente:', error);
    throw error;
  }
}

/** Saldos calculados por cliente */
export async function obtenerSaldosPorCuenta() {
  try {
    if (USE_BACKEND) {
      const conectado = await verificarConexion();
      if (conectado) {
        const response = await api.get('/cuentas-corrientes');
        // El backend ya calcula los saldos
        return normalizarCuentas(response.data || []);
      }
    }
  } catch (error) {
    console.warn('Error al obtener saldos del backend, usando localStorage:', error);
  }

  // Fallback a localStorage
  const cuentas = await listarCuentas();
  const movimientos = getData(STORAGE_KEY_MOVIMIENTOS);

  const saldos = {};
  for (const m of movimientos || []) {
    const sign = m.tipo === 'pago' ? -1 : 1; // cargo suma, pago resta
    saldos[m.cuenta_id] = (saldos[m.cuenta_id] || 0) + sign * Number(m.monto || 0);
  }

  return cuentas.map(c => ({
    ...c,
    saldo: Number(saldos[c.id] || 0),
  }));
}

/** Función de prueba para verificar pagos de cuenta corriente en ventas */
export async function verificarPagosEnVentas() {
  try {
    const ventas = getData('ventas');
    return ventas
      .filter(v => v.cliente && v.cliente.includes('Cuenta Corriente'))
      .sort((a, b) => {
        const fechaA = new Date(a.fecha || 0);
        const fechaB = new Date(b.fecha || 0);
        return fechaB - fechaA;
      });
  } catch (error) {
    console.error('Error verificando pagos en ventas:', error);
    return [];
  }
}

/** Función de prueba para insertar un pago de cuenta corriente manualmente */
export async function insertarPagoPrueba() {
  try {
    await crearVenta({
      cliente: 'Cuenta Corriente - Prueba',
      items: [{
        id: 'cuenta-corriente-prueba',
        nombre: 'Pago de prueba',
        precio_venta: 100,
        cantidad: 1
      }],
      numeroFactura: await obtenerYActualizarNumeroFactura()
    });
  } catch (error) {
    console.error('Error en insertarPagoPrueba:', error);
    throw error;
  }
}

/** Actualizar nombre de cuenta corriente */
export async function actualizarNombreCuenta(cuentaId, nuevoNombre) {
  try {
    if (USE_BACKEND) {
      const conectado = await verificarConexion();
      if (conectado) {
        const response = await api.put(`/cuentas-corrientes/${cuentaId}`, { cliente: nuevoNombre });
        return normalizarCuenta(response.data);
      }
    }
  } catch (error) {
    console.warn('Error al actualizar cuenta en backend, usando localStorage:', error);
  }

  // Fallback a localStorage
  return updateItemById(STORAGE_KEY_CUENTAS, cuentaId, { cliente: nuevoNombre });
}

/** Eliminar movimiento de cuenta corriente */
export async function eliminarMovimiento(movimientoId) {
  try {
    if (USE_BACKEND) {
      const conectado = await verificarConexion();
      if (conectado) {
        await api.delete(`/cuentas-corrientes/movimientos/${movimientoId}`);
        return { success: true };
      }
    }
  } catch (error) {
    console.warn('Error al eliminar movimiento en backend, usando localStorage:', error);
  }

  // Fallback a localStorage
  return deleteItemById(STORAGE_KEY_MOVIMIENTOS, movimientoId);
}

/** Actualizar movimiento de cuenta corriente */
export async function actualizarMovimiento(movimientoId, datos) {
  try {
    if (USE_BACKEND) {
      const conectado = await verificarConexion();
      if (conectado) {
        const response = await api.put(`/cuentas-corrientes/movimientos/${movimientoId}`, datos);
        return normalizarMovimiento(response.data);
      }
    }
  } catch (error) {
    console.warn('Error al actualizar movimiento en backend, usando localStorage:', error);
  }

  // Fallback a localStorage
  return updateItemById(STORAGE_KEY_MOVIMIENTOS, movimientoId, datos);
}

/** Obtener clientes que terminaron de pagar (saldo = 0) */
export async function obtenerClientesPagados() {
  try {
    const cuentas = await obtenerSaldosPorCuenta();
    return cuentas.filter(c => Math.abs(Number(c.saldo || 0)) < 0.01); // Tolerancia para decimales
  } catch (error) {
    console.error('Error obteniendo clientes pagados:', error);
    return [];
  }
}

/** Obtener siguiente número de factura */
export async function obtenerSiguienteNumeroFactura() {
  try {
    if (USE_BACKEND) {
      const conectado = await verificarConexion();
      if (conectado) {
        const response = await api.get('/ventas/siguiente-numero');
        return response.data?.siguiente_numero || 1;
      }
    }
  } catch (error) {
    console.warn('Error obteniendo siguiente número de factura del backend:', error);
  }

  // Fallback a localStorage
  try {
    const ventas = getData('ventas');
    let ultimoNumeroVentas = 0;
    if (ventas.length > 0) {
      const numerosFactura = ventas
        .map(v => v.numero_factura)
        .filter(n => n != null && n !== '')
        .map(n => Number(n))
        .filter(n => !isNaN(n));
      if (numerosFactura.length > 0) {
        ultimoNumeroVentas = Math.max(...numerosFactura);
      }
    }

    const movimientos = getData(STORAGE_KEY_MOVIMIENTOS);
    let ultimoNumeroCC = 0;
    if (movimientos.length > 0) {
      const numerosFactura = movimientos
        .map(m => m.numero_factura)
        .filter(n => n != null && n !== '')
        .map(n => Number(n))
        .filter(n => !isNaN(n));
      if (numerosFactura.length > 0) {
        ultimoNumeroCC = Math.max(...numerosFactura);
      }
    }

    const numeroLocalStorage = Number(localStorage.getItem('numeroFactura') || 0);
    
    const ultimoNumero = Math.max(ultimoNumeroVentas, ultimoNumeroCC, numeroLocalStorage);
    return ultimoNumero + 1;
  } catch (error) {
    console.error('Error obteniendo siguiente número de factura:', error);
    return Date.now();
  }
}

/** Generar factura para cliente pagado */
export async function generarFacturaClientePagado(cuentaId, numeroFactura) {
  try {
    // Obtener movimientos de la cuenta
    const movimientos = await listarMovimientos(cuentaId, 1000);
    
    if (!movimientos || movimientos.length === 0) {
      throw new Error('No se encontraron movimientos para esta cuenta');
    }

    // Obtener información de la cuenta
    const cuentas = await listarCuentas();
    const cuenta = cuentas.find(c => c.id === cuentaId);
    
    if (!cuenta) {
      throw new Error('Cuenta no encontrada');
    }

    // Actualizar TODOS los movimientos de cargo con el número de factura
    const movimientosCargo = movimientos.filter(m => m.tipo === 'cargo');
    for (const movimiento of movimientosCargo) {
      await actualizarMovimiento(movimiento.id, {
        numero_factura: numeroFactura
      });
    }

    return {
      cliente: cuenta.cliente,
      movimientos,
      numeroFactura,
      total: movimientos.reduce((acc, m) => {
        const sign = m.tipo === 'pago' ? -1 : 1;
        const montoReal = m.descuento
          ? Number(m.monto) - (Number(m.monto) * Number(m.descuento)) / 100
          : Number(m.monto);
        return acc + sign * montoReal;
      }, 0)
    };
  } catch (error) {
    console.error('Error generando factura para cliente pagado:', error);
    throw error;
  }
}
