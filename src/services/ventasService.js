import api, { verificarConexion } from '../lib/apiClient';
import { getData, saveData, createItem, generarId } from './localStorageService';
import { listarProductos } from './productosService';
import { getCache, setCache, invalidateCache } from '../utils/cache';

const STORAGE_KEY = 'ventas';
const USE_BACKEND = true; // Cambiar a false para usar localStorage como fallback
const CACHE_KEY_VENTAS = 'ventas_list';
const CACHE_TTL = 2 * 60 * 1000; // 2 minutos

/**
 * Normalizar venta del backend (convierte _id a id)
 */
function normalizarVenta(venta) {
  if (!venta) return null;
  const { _id, ...rest } = venta;
  return {
    ...rest,
    id: _id || venta.id,
    fecha: venta.createdAt || venta.fecha,
    numeroFactura: venta.numero_factura || venta.numeroFactura
  };
}

/**
 * Normalizar array de ventas
 */
function normalizarVentas(ventas) {
  return ventas.map(normalizarVenta);
}

/** Listar ventas (últimas primero) */
export async function listarVentas(limit = 50, useCache = true) {
  // Intentar obtener del caché primero
  const cacheKey = `${CACHE_KEY_VENTAS}_${limit}`;
  if (useCache) {
    const cached = getCache(cacheKey, CACHE_TTL);
    if (cached) {
      return cached;
    }
  }

  try {
    if (USE_BACKEND) {
      const conectado = await verificarConexion();
      if (conectado) {
        const response = await api.get(`/ventas?limit=${limit}`);
        const ventas = normalizarVentas(response.data || []);
        // Guardar en caché
        setCache(cacheKey, ventas);
        return ventas;
      }
    }
  } catch (error) {
    console.warn('Error al obtener ventas del backend, usando localStorage:', error);
  }

  // Fallback a localStorage
  const ventas = getData(STORAGE_KEY);
  const sorted = ventas
    .sort((a, b) => {
      const fechaA = new Date(a.fecha || 0);
      const fechaB = new Date(b.fecha || 0);
      return fechaB - fechaA;
    })
    .slice(0, limit);
  
  // Guardar en caché también para localStorage
  setCache(cacheKey, sorted);
  return sorted;
}

/** Crear venta y descontar stock en productos */
export async function crearVenta({ cliente, items, numeroFactura }) {
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
        const ventaParaBackend = {
          cliente: cliente || null,
          items: items.map(item => ({
            id: item.id,
            nombre: item.nombre,
            precio_venta: Number(item.precio_venta || 0),
            cantidad: Number(item.cantidad || 0)
          })),
          numeroFactura: numeroFactura || null
        };

        const response = await api.post('/ventas', ventaParaBackend);
        // El backend ya descuenta el stock automáticamente
        const nuevaVenta = normalizarVenta(response.data);
        // Invalidar caché después de crear
        invalidateCache(CACHE_KEY_VENTAS);
        return nuevaVenta;
      }
    }
  } catch (error) {
    console.warn('Error al crear venta en backend, usando localStorage:', error);
  }

  // Fallback a localStorage
  // 1) Crear venta
  const venta = createItem(STORAGE_KEY, {
    cliente: cliente || null,
    total,
    items,
    numero_factura: numeroFactura,
    fecha: new Date().toISOString()
  });

  // 2) Descontar stock para cada producto (optimizado: actualizar todos de una vez)
  const productos = await listarProductos(false); // No usar caché para obtener datos actualizados
  const productosData = getData('productos');
  const productosActualizados = productosData.map(producto => {
    const itemVenta = items.find(it => it.id === producto.id);
    if (!itemVenta) return producto;
    
    const cantVendida = Number(itemVenta.cantidad || 0);
    const nuevaCantidad = Math.max(0, Number(producto.cantidad || 0) - cantVendida);
    
    return {
      ...producto,
      cantidad: nuevaCantidad
    };
  });
  
  // Guardar todos los productos actualizados de una vez
  saveData('productos', productosActualizados);
  // Invalidar caché de productos después de actualizar stock
  invalidateCache('productos_list');

  return venta;
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
    console.warn('Error al obtener siguiente número de factura del backend:', error);
  }

  // Fallback: usar localStorage
  const ventas = await listarVentas(1000);
  const numerosFactura = ventas
    .map(v => v.numero_factura || v.numeroFactura)
    .filter(n => n && Number.isInteger(Number(n)));
  
  if (numerosFactura.length > 0) {
    return Math.max(...numerosFactura.map(n => Number(n))) + 1;
  }

  const numeroLocalStorage = Number(localStorage.getItem('numeroFactura') || 0);
  return numeroLocalStorage > 0 ? numeroLocalStorage + 1 : 1;
}
