// src/services/productosService.js
import api, { verificarConexion } from '../lib/apiClient';
import { getData, saveData, createItem, updateItemById, deleteItemById, generarId } from './localStorageService';
import { getCache, setCache, invalidateCache } from '../utils/cache';

const STORAGE_KEY = 'productos';
const USE_BACKEND = true; // Cambiar a false para usar localStorage como fallback
const CACHE_KEY_PRODUCTOS = 'productos_list';
const CACHE_TTL = 2 * 60 * 1000; // 2 minutos para productos (cambian frecuentemente)

/**
 * Normalizar producto del backend (convierte _id a id)
 */
function normalizarProducto(producto) {
  if (!producto) return null;
  const { _id, ...rest } = producto;
  return {
    ...rest,
    id: _id || producto.id,
    created_at: producto.createdAt || producto.created_at
  };
}

/**
 * Normalizar array de productos
 */
function normalizarProductos(productos) {
  return productos.map(normalizarProducto);
}

/** LISTAR productos */
export async function listarProductos(useCache = true) {
  // Intentar obtener del caché primero
  if (useCache) {
    const cached = getCache(CACHE_KEY_PRODUCTOS, CACHE_TTL);
    if (cached) {
      return cached;
    }
  }

  try {
    if (USE_BACKEND) {
      const conectado = await verificarConexion();
      if (conectado) {
        const response = await api.get('/productos');
        const productos = normalizarProductos(response.data || []);
        // Guardar en caché
        setCache(CACHE_KEY_PRODUCTOS, productos);
        return productos;
      }
    }
  } catch (error) {
    console.warn('Error al obtener productos del backend, usando localStorage:', error);
  }

  // Fallback a localStorage
  const productos = getData(STORAGE_KEY);
  const sorted = productos.sort((a, b) => {
    const fechaA = new Date(a.created_at || 0);
    const fechaB = new Date(b.created_at || 0);
    return fechaB - fechaA;
  });
  
  // Guardar en caché también para localStorage
  setCache(CACHE_KEY_PRODUCTOS, sorted);
  return sorted;
}

/** CREAR producto */
export async function crearProducto(producto) {
  try {
    if (USE_BACKEND) {
      const conectado = await verificarConexion();
      if (conectado) {
        const productoParaBackend = {
          ...producto,
          unidad: producto.unidad || 'unidad',
          precio_costo: Number(producto.precio_costo || 0),
          precio_venta: Number(producto.precio_venta || 0),
          cantidad: Number(producto.cantidad || 0),
          stock_minimo: Number(producto.stock_minimo || 5),
          activo: producto.activo !== undefined ? producto.activo : true
        };
        
        const response = await api.post('/productos', productoParaBackend);
        const nuevoProducto = normalizarProducto(response.data);
        // Invalidar caché después de crear
        invalidateCache(CACHE_KEY_PRODUCTOS);
        return nuevoProducto;
      }
    }
  } catch (error) {
    console.warn('Error al crear producto en backend, usando localStorage:', error);
  }

  // Fallback a localStorage
  const nuevoProducto = {
    ...producto,
    unidad: producto.unidad || 'unidad',
    created_at: new Date().toISOString()
  };
  const resultado = createItem(STORAGE_KEY, nuevoProducto);
  // Invalidar caché después de crear
  invalidateCache(CACHE_KEY_PRODUCTOS);
  return resultado;
}

/** ACTUALIZAR producto */
export async function actualizarProducto(id, producto) {
  try {
    if (USE_BACKEND) {
      const conectado = await verificarConexion();
      if (conectado) {
        const productoParaBackend = {
          ...producto,
          precio_costo: Number(producto.precio_costo || 0),
          precio_venta: Number(producto.precio_venta || 0),
          cantidad: Number(producto.cantidad || 0),
          stock_minimo: Number(producto.stock_minimo || 5)
        };
        
        // Eliminar id del body (no se envía)
        delete productoParaBackend.id;
        
        const response = await api.put(`/productos/${id}`, productoParaBackend);
        const actualizado = normalizarProducto(response.data);
        // Invalidar caché después de actualizar
        invalidateCache(CACHE_KEY_PRODUCTOS);
        return actualizado;
      }
    }
  } catch (error) {
    console.warn('Error al actualizar producto en backend, usando localStorage:', error);
  }

  // Fallback a localStorage
  const toUpdate = { ...producto };
  delete toUpdate.id;
  const resultado = updateItemById(STORAGE_KEY, id, toUpdate);
  // Invalidar caché después de actualizar
  invalidateCache(CACHE_KEY_PRODUCTOS);
  return resultado;
}

/** ELIMINAR producto por id */
export async function eliminarProducto(id) {
  try {
    if (USE_BACKEND) {
      const conectado = await verificarConexion();
      if (conectado) {
        await api.delete(`/productos/${id}`);
        // Invalidar caché después de eliminar
        invalidateCache(CACHE_KEY_PRODUCTOS);
        return { success: true };
      }
    }
  } catch (error) {
    console.warn('Error al eliminar producto en backend, usando localStorage:', error);
  }

  // Fallback a localStorage
  const resultado = deleteItemById(STORAGE_KEY, id);
  // Invalidar caché después de eliminar
  invalidateCache(CACHE_KEY_PRODUCTOS);
  return resultado;
}

/** IMPORTACIÓN MASIVA desde Excel */
export async function guardarProductosMasivo(productos) {
  try {
    if (USE_BACKEND) {
      const conectado = await verificarConexion();
      if (conectado) {
        const productosParaBackend = productos.map((p) => ({
          nombre: (p.nombre || '').trim(),
          precio_costo: Number(p.precio_costo ?? p.costo ?? 0),
          precio_venta: Number(p.precio_venta ?? p.venta ?? 0),
          cantidad: Number(p.cantidad ?? 0),
          unidad: p.unidad || 'unidad',
          proveedor: p.proveedor || null,
          telefono: p.telefono || null,
          imagen: p.imagen || null,
          stock_minimo: Number(p.stock_minimo || 5),
          activo: true
        }));

        const response = await api.post('/productos/importar', { productos: productosParaBackend });
        const productosImportados = normalizarProductos(response.data || []);
        // Invalidar caché después de importar
        invalidateCache(CACHE_KEY_PRODUCTOS);
        return productosImportados;
      }
    }
  } catch (error) {
    console.warn('Error al importar productos en backend, usando localStorage:', error);
  }

  // Fallback a localStorage
  const productosData = getData(STORAGE_KEY);
  
  const aInsertar = productos.map((p) => ({
    nombre: (p.nombre || '').trim(),
    precio_costo: Number(p.precio_costo ?? p.costo ?? 0),
    precio_venta: Number(p.precio_venta ?? p.venta ?? 0),
    cantidad: Number(p.cantidad ?? 0),
    unidad: p.unidad || 'unidad',
    proveedor: p.proveedor || null,
    telefono: p.telefono || null,
    imagen: p.imagen || null,
    created_at: new Date().toISOString()
  }));

  if (aInsertar.length === 0) return [];

  const productosConId = aInsertar.map(p => ({
    ...p,
    id: generarId()
  }));

  const nuevosProductos = [...productosData, ...productosConId];
  saveData(STORAGE_KEY, nuevosProductos);
  
  // Invalidar caché después de importar
  invalidateCache(CACHE_KEY_PRODUCTOS);
  
  return productosConId;
}

/* Alias opcional para compatibilidad si en algún lado importabas guardarProducto */
export { crearProducto as guardarProducto };
