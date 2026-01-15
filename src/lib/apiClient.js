/**
 * Cliente API para conectar con el backend
 * Maneja todas las peticiones HTTP al backend con autenticación JWT
 */

// En producción (Vercel), usar rutas relativas
// En desarrollo, usar la URL del backend local
const API_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.PROD ? '/api' : 'http://localhost:3000/api');

/**
 * Obtener el token JWT del usuario actual
 */
function getToken() {
  try {
    const token = localStorage.getItem('auth_token');
    return token;
  } catch (e) {
    return null;
  }
}

/**
 * Guardar token JWT
 */
export function setToken(token) {
  localStorage.setItem('auth_token', token);
}

/**
 * Eliminar token JWT
 */
export function removeToken() {
  localStorage.removeItem('auth_token');
}

/**
 * Realizar petición HTTP al backend con autenticación JWT
 */
async function request(endpoint, options = {}) {
  const token = getToken();
  
  let url = `${API_URL}${endpoint}`;
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  // Agregar token JWT al header si existe
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      // Si el token es inválido o expiró, limpiarlo
      if (response.status === 401) {
        removeToken();
        // Redirigir al login si estamos en el navegador
        if (typeof window !== 'undefined') {
          window.location.href = '/';
        }
      }
      throw new Error(data.message || `Error ${response.status}: ${response.statusText}`);
    }

    return data;
  } catch (error) {
    console.error('Error en petición API:', error);
    throw error;
  }
}

/**
 * Métodos HTTP helpers
 */
export const api = {
  get: (endpoint) => request(endpoint, { method: 'GET' }),
  
  post: (endpoint, body) => request(endpoint, {
    method: 'POST',
    body: JSON.stringify(body),
  }),
  
  put: (endpoint, body) => request(endpoint, {
    method: 'PUT',
    body: JSON.stringify(body),
  }),
  
  delete: (endpoint) => request(endpoint, { method: 'DELETE' }),
};

/**
 * Verificar conexión con el backend
 */
export async function verificarConexion() {
  try {
    const response = await fetch(`${API_URL.replace('/api', '')}/api/health`);
    const data = await response.json();
    return data.success === true;
  } catch (error) {
    console.warn('Backend no disponible:', error);
    return false;
  }
}

export default api;








