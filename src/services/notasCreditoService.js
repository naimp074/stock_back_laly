import api, { verificarConexion } from '../lib/apiClient';
import { getData, saveData, createItem, updateItemById, deleteItemById, generarId } from './localStorageService';
import { listarProductos, actualizarProducto } from './productosService';
import { listarVentas } from './ventasService';
import { getCache, setCache, invalidateCache } from '../utils/cache';

const STORAGE_KEY = 'notas_credito';
const USE_BACKEND = true; // Cambiar a false para usar localStorage como fallback
const CACHE_KEY_NOTAS = 'notas_credito_list';
const CACHE_KEY_STATS = 'notas_credito_stats';
const CACHE_TTL = 2 * 60 * 1000; // 2 minutos

/**
 * Normalizar nota de crédito del backend (convierte _id a id)
 */
function normalizarNotaCredito(nota) {
  if (!nota) return null;
  const { _id, ...rest } = nota;
  return {
    ...rest,
    id: _id || nota.id,
    fecha: nota.createdAt || nota.fecha
  };
}

/**
 * Normalizar array de notas de crédito
 */
function normalizarNotasCredito(notas) {
  return notas.map(normalizarNotaCredito);
}

/** Listar notas de crédito (últimas primero) */
export async function listarNotasCredito(limit = 50, useCache = true) {
  // Intentar obtener del caché primero
  const cacheKey = `${CACHE_KEY_NOTAS}_${limit}`;
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
        const response = await api.get(`/notas-credito?limit=${limit}`);
        const notas = normalizarNotasCredito(response.data || []);
        // Guardar en caché
        setCache(cacheKey, notas);
        return notas;
      }
    }
  } catch (error) {
    console.warn('Error al obtener notas de crédito del backend, usando localStorage:', error);
  }

  // Fallback a localStorage
  try {
    const notas = getData(STORAGE_KEY);
    const sorted = notas
      .sort((a, b) => {
        const fechaA = new Date(a.fecha || 0);
        const fechaB = new Date(b.fecha || 0);
        return fechaB - fechaA;
      })
      .slice(0, limit);
    
    // Guardar en caché también para localStorage
    setCache(cacheKey, sorted);
    return sorted;
  } catch (error) {
    console.error('Error en listarNotasCredito:', error);
    return [];
  }
}

/** Crear nota de crédito */
export async function crearNotaCredito({ 
  cliente, 
  motivo, 
  items, 
  total, 
  numero_factura_original,
  observaciones,
  venta_original_id = null
}) {
  try {
    if (USE_BACKEND) {
      const conectado = await verificarConexion();
      if (conectado) {
        const notaParaBackend = {
          cliente: cliente || 'Consumidor Final',
          motivo,
          items: items || [],
          total: Number(total || 0),
          numero_factura_original: numero_factura_original || null,
          observaciones: observaciones || null,
          venta_original_id: venta_original_id || null
        };

        const response = await api.post('/notas-credito', notaParaBackend);
        // El backend ya devuelve el stock automáticamente
        const nuevaNota = normalizarNotaCredito(response.data);
        // Invalidar caché después de crear
        invalidateCache(CACHE_KEY_NOTAS);
        invalidateCache(CACHE_KEY_STATS);
        return nuevaNota;
      }
    }
  } catch (error) {
    console.warn('Error al crear nota de crédito en backend, usando localStorage:', error);
  }

  // Fallback a localStorage
  try {
    // Generar número de nota de crédito
    const numeroNota = await generarNumeroNotaCredito();

    // Preparar datos para insertar
    const notaData = {
      cliente: cliente || 'Consumidor Final',
      motivo,
      items: items || [],
      total: Number(total || 0),
      numero_factura_original: numero_factura_original || null,
      numero_nota: numeroNota,
      observaciones: observaciones || null,
      venta_original_id: venta_original_id || null,
      fecha: new Date().toISOString()
    };

    // Crear la nota de crédito
    const nota = createItem(STORAGE_KEY, notaData);

    // Si hay items, devolver el stock
    if (items && items.length > 0) {
      await devolverStock(items);
    }

    return nota;
  } catch (error) {
    console.error('Error en crearNotaCredito:', error);
    throw error;
  }
}

/** Devolver stock de productos */
async function devolverStock(items) {
  try {
    const productos = await listarProductos();
    
    for (const item of items) {
      if (!item.id || !item.cantidad) continue;
      
      const producto = productos.find(p => p.id === item.id);
      if (!producto) continue;
      
      // Calcular nuevo stock
      const stockActual = Number(producto.cantidad || 0);
      const cantidadDevolver = Number(item.cantidad || 0);
      const nuevoStock = stockActual + cantidadDevolver;
      
      // Actualizar el stock
      await actualizarProducto(producto.id, {
        ...producto,
        cantidad: nuevoStock
      });
    }
  } catch (error) {
    console.error('Error en devolverStock:', error);
    throw error;
  }
}

/** Generar número de nota de crédito */
async function generarNumeroNotaCredito() {
  try {
    if (USE_BACKEND) {
      const conectado = await verificarConexion();
      if (conectado) {
        // El backend genera el número automáticamente, pero podemos obtenerlo de la última nota
        const notas = await listarNotasCredito(1);
        if (notas.length > 0 && notas[0].numero_nota) {
          return notas[0].numero_nota + 1;
        }
      }
    }
  } catch (error) {
    console.warn('Error obteniendo número de nota del backend:', error);
  }

  // Fallback a localStorage
  try {
    const notas = getData(STORAGE_KEY);
    const ultimoNumero = notas.length > 0 
      ? Math.max(...notas.map(n => Number(n.numero_nota || 0)))
      : 0;
    return ultimoNumero + 1;
  } catch (error) {
    console.error('Error generando número de nota de crédito:', error);
    return Date.now();
  }
}

/** Obtener nota de crédito por ID */
export async function obtenerNotaCredito(id) {
  try {
    if (USE_BACKEND) {
      const conectado = await verificarConexion();
      if (conectado) {
        const response = await api.get(`/notas-credito/${id}`);
        return normalizarNotaCredito(response.data);
      }
    }
  } catch (error) {
    console.warn('Error al obtener nota de crédito del backend, usando localStorage:', error);
  }

  // Fallback a localStorage
  const notas = getData(STORAGE_KEY);
  return notas.find(n => n.id === id) || null;
}

/** Actualizar nota de crédito */
export async function actualizarNotaCredito(id, datos) {
  try {
    if (USE_BACKEND) {
      const conectado = await verificarConexion();
      if (conectado) {
        const response = await api.put(`/notas-credito/${id}`, datos);
        return normalizarNotaCredito(response.data);
      }
    }
  } catch (error) {
    console.warn('Error al actualizar nota de crédito en backend, usando localStorage:', error);
  }

  // Fallback a localStorage
  return updateItemById(STORAGE_KEY, id, datos);
}

/** Eliminar nota de crédito */
export async function eliminarNotaCredito(id) {
  try {
    if (USE_BACKEND) {
      const conectado = await verificarConexion();
      if (conectado) {
        await api.delete(`/notas-credito/${id}`);
        return { success: true };
      }
    }
  } catch (error) {
    console.warn('Error al eliminar nota de crédito en backend, usando localStorage:', error);
  }

  // Fallback a localStorage
  return deleteItemById(STORAGE_KEY, id);
}

/** Obtener ventas disponibles para nota de crédito */
export async function obtenerVentasParaNotaCredito(limit = 100) {
  try {
    if (USE_BACKEND) {
      const conectado = await verificarConexion();
      if (conectado) {
        const response = await api.get(`/notas-credito/ventas-disponibles?limit=${limit}`);
        // Normalizar las ventas
        const ventas = response.data || [];
        return ventas.map(v => {
          const { _id, ...rest } = v;
          return {
            ...rest,
            id: _id || v.id
          };
        });
      }
    }
  } catch (error) {
    console.warn('Error al obtener ventas disponibles del backend, usando localStorage:', error);
  }

  // Fallback a localStorage
  try {
    // Obtener todas las ventas
    const todasLasVentas = await listarVentas(limit);
    
    // Obtener notas de crédito existentes para filtrar ventas ya procesadas
    const notasCredito = getData(STORAGE_KEY);
    const ventasConNotaCredito = new Set(
      notasCredito
        .map(nota => nota.venta_original_id)
        .filter(id => id != null)
    );
    
    // Filtrar solo ventas que no tengan nota de crédito
    const ventasFiltradas = todasLasVentas.filter(venta => {
      return !ventasConNotaCredito.has(venta.id);
    });
    
    return ventasFiltradas;
  } catch (error) {
    console.error('Error obteniendo ventas para nota de crédito:', error);
    return [];
  }
}

/** Obtener estadísticas de notas de crédito */
export async function obtenerEstadisticasNotasCredito(useCache = true) {
  // Intentar obtener del caché primero
  if (useCache) {
    const cached = getCache(CACHE_KEY_STATS, CACHE_TTL);
    if (cached) {
      return cached;
    }
  }

  try {
    if (USE_BACKEND) {
      const conectado = await verificarConexion();
      if (conectado) {
        const response = await api.get('/notas-credito/estadisticas');
        const stats = response.data || {
          totalHoy: 0,
          totalSemana: 0,
          totalMes: 0,
          totalGeneral: 0,
          cantidad: 0
        };
        // Guardar en caché
        setCache(CACHE_KEY_STATS, stats);
        return stats;
      }
    }
  } catch (error) {
    console.warn('Error al obtener estadísticas del backend, usando localStorage:', error);
  }

  // Fallback a localStorage
  try {
    const notas = getData(STORAGE_KEY);
    
    const hoy = new Date();
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const hace7 = new Date(hoy);
    hace7.setDate(hace7.getDate() - 7);
    
    let totalHoy = 0;
    let totalSemana = 0;
    let totalMes = 0;
    let totalGeneral = 0;
    
    for (const nota of notas || []) {
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
    
    const stats = {
      totalHoy,
      totalSemana,
      totalMes,
      totalGeneral,
      cantidad: notas?.length || 0
    };
    
    // Guardar en caché también para localStorage
    setCache(CACHE_KEY_STATS, stats);
    return stats;
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    return {
      totalHoy: 0,
      totalSemana: 0,
      totalMes: 0,
      totalGeneral: 0,
      cantidad: 0
    };
  }
}
