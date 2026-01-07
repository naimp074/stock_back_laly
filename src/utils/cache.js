/**
 * Sistema de caché simple para datos que no cambian frecuentemente
 * Usa localStorage con timestamps para invalidar caché después de cierto tiempo
 */

const CACHE_PREFIX = 'app_cache_';
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutos por defecto

/**
 * Obtener datos del caché
 * @param {string} key - Clave del caché
 * @param {number} ttl - Tiempo de vida en milisegundos (opcional)
 * @returns {any|null} - Datos cacheados o null si expiró/no existe
 */
export function getCache(key, ttl = DEFAULT_TTL) {
  try {
    const cached = localStorage.getItem(`${CACHE_PREFIX}${key}`);
    if (!cached) return null;

    const { data, timestamp } = JSON.parse(cached);
    const now = Date.now();
    
    // Verificar si el caché expiró
    if (now - timestamp > ttl) {
      localStorage.removeItem(`${CACHE_PREFIX}${key}`);
      return null;
    }

    return data;
  } catch (error) {
    console.warn('Error leyendo caché:', error);
    return null;
  }
}

/**
 * Guardar datos en el caché
 * @param {string} key - Clave del caché
 * @param {any} data - Datos a guardar
 */
export function setCache(key, data) {
  try {
    const cacheData = {
      data,
      timestamp: Date.now()
    };
    localStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(cacheData));
  } catch (error) {
    console.warn('Error guardando caché:', error);
    // Si el localStorage está lleno, limpiar cachés antiguos
    if (error.name === 'QuotaExceededError') {
      clearOldCache();
    }
  }
}

/**
 * Invalidar un caché específico
 * @param {string} key - Clave del caché a invalidar
 */
export function invalidateCache(key) {
  try {
    localStorage.removeItem(`${CACHE_PREFIX}${key}`);
  } catch (error) {
    console.warn('Error invalidando caché:', error);
  }
}

/**
 * Limpiar todos los cachés
 */
export function clearAllCache() {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(CACHE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.warn('Error limpiando caché:', error);
  }
}

/**
 * Limpiar cachés antiguos (más de 1 hora)
 */
function clearOldCache() {
  try {
    const keys = Object.keys(localStorage);
    const oneHour = 60 * 60 * 1000;
    const now = Date.now();
    
    keys.forEach(key => {
      if (key.startsWith(CACHE_PREFIX)) {
        try {
          const cached = localStorage.getItem(key);
          if (cached) {
            const { timestamp } = JSON.parse(cached);
            if (now - timestamp > oneHour) {
              localStorage.removeItem(key);
            }
          }
        } catch (e) {
          // Si hay error parseando, eliminar la clave
          localStorage.removeItem(key);
        }
      }
    });
  } catch (error) {
    console.warn('Error limpiando cachés antiguos:', error);
  }
}



