import api, { verificarConexion } from '../lib/apiClient';
import { getData, saveData, createItem, generarId } from './localStorageService';

const STORAGE_KEY = 'presupuestos';
const USE_BACKEND = true; // Cambiar a false para usar localStorage como fallback

/**
 * Normalizar presupuesto del backend (convierte _id a id)
 */
function normalizarPresupuesto(presupuesto) {
  if (!presupuesto) return null;
  const { _id, ...rest } = presupuesto;
  return {
    ...rest,
    id: _id || presupuesto.id,
    fecha: presupuesto.createdAt || presupuesto.fecha,
    numeroPresupuesto: presupuesto.numero_presupuesto || presupuesto.numeroPresupuesto
  };
}

/**
 * Normalizar array de presupuestos
 */
function normalizarPresupuestos(presupuestos) {
  return presupuestos.map(normalizarPresupuesto);
}

/** Listar presupuestos (últimos primero) */
export async function listarPresupuestos(limit = 50) {
  try {
    if (USE_BACKEND) {
      const conectado = await verificarConexion();
      if (conectado) {
        const response = await api.get(`/presupuestos?limit=${limit}`);
        return normalizarPresupuestos(response.data || []);
      }
    }
  } catch (error) {
    console.warn('Error al obtener presupuestos del backend, usando localStorage:', error);
  }

  // Fallback a localStorage
  const presupuestos = getData(STORAGE_KEY);
  return presupuestos
    .sort((a, b) => {
      const fechaA = new Date(a.fecha || 0);
      const fechaB = new Date(b.fecha || 0);
      return fechaB - fechaA;
    })
    .slice(0, limit);
}

/** Crear presupuesto SIN descontar stock */
export async function crearPresupuesto({ cliente, items, numeroPresupuesto, direccionCliente }) {
  // items: [{ id, nombre, precio_venta, cantidad }]
  const total = (items || []).reduce(
    (acc, it) => acc + Number(it.precio_venta || 0) * Number(it.cantidad || 0),
    0
  );

  try {
    if (USE_BACKEND) {
      const conectado = await verificarConexion();
      if (conectado) {
        // Preparar datos para el backend
        const presupuestoParaBackend = {
          cliente: cliente || null,
          direccionCliente: direccionCliente || null,
          total: Number(total),
          items: items.map(item => ({
            id: item.id,
            nombre: item.nombre,
            precio_venta: Number(item.precio_venta || 0),
            cantidad: Number(item.cantidad || 0)
          })),
          numeroPresupuesto: numeroPresupuesto || null
        };

        const response = await api.post('/presupuestos', presupuestoParaBackend);
        // IMPORTANTE: NO descontamos stock aquí
        return normalizarPresupuesto(response.data);
      }
    }
  } catch (error) {
    console.warn('Error al crear presupuesto en backend, usando localStorage:', error);
  }

  // Fallback a localStorage
  // IMPORTANTE: NO descontamos stock aquí, solo guardamos el presupuesto
  const presupuesto = createItem(STORAGE_KEY, {
    cliente: cliente || null,
    direccion_cliente: direccionCliente || null,
    total,
    items,
    numero_presupuesto: numeroPresupuesto,
    fecha: new Date().toISOString(),
    tipo: 'presupuesto'
  });

  return presupuesto;
}

/** Obtener siguiente número de presupuesto */
export async function obtenerSiguienteNumeroPresupuesto() {
  try {
    if (USE_BACKEND) {
      const conectado = await verificarConexion();
      if (conectado) {
        const response = await api.get('/presupuestos/siguiente-numero');
        return response.data?.siguiente_numero || 1;
      }
    }
  } catch (error) {
    console.warn('Error al obtener siguiente número de presupuesto del backend:', error);
  }

  // Fallback: usar localStorage
  const presupuestos = await listarPresupuestos(1000);
  const numerosPresupuesto = presupuestos
    .map(p => p.numero_presupuesto || p.numeroPresupuesto)
    .filter(n => n && Number.isInteger(Number(n)));
  
  if (numerosPresupuesto.length > 0) {
    return Math.max(...numerosPresupuesto.map(n => Number(n))) + 1;
  }

  const numeroLocalStorage = Number(localStorage.getItem('numeroPresupuesto') || 0);
  return numeroLocalStorage > 0 ? numeroLocalStorage + 1 : 1;
}






