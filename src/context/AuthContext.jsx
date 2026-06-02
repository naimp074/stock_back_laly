import React, { createContext, useContext, useEffect, useState } from 'react';
import api, { setToken, removeToken } from '../lib/apiClient';

const AuthContext = createContext(undefined);

const STORAGE_KEY_USUARIO = 'usuario_actual';
// En producción (Vercel), usar rutas relativas
// En desarrollo, usar la URL del backend local
const API_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.PROD ? '/api' : 'http://localhost:3000/api');
const USE_BACKEND_AUTH = true; // Cambiar a false para usar solo localStorage
const AUTH_TIMEOUT_MS = 10000;

async function fetchWithTimeout(url, options = {}, timeout = AUTH_TIMEOUT_MS) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    if (error.name === 'AbortError') {
      throw new Error('El servidor tardó demasiado en responder. Verificá que el backend esté corriendo.');
    }
    throw error;
  }
}

function guardarSesion(data) {
  setToken(data.token);

  const usuarioData = {
    id: data.data.id || data.data._id,
    email: data.data.email,
    nombre: data.data.nombre,
    rol: data.data.rol
  };

  localStorage.setItem(STORAGE_KEY_USUARIO, JSON.stringify(usuarioData));
  return usuarioData;
}

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    // Cargar usuario desde localStorage al iniciar
    const usuarioGuardado = localStorage.getItem(STORAGE_KEY_USUARIO);
    const token = localStorage.getItem('auth_token');
    
    if (usuarioGuardado && token) {
      try {
        const usuarioData = JSON.parse(usuarioGuardado);
        setUsuario(usuarioData);
        
        // Verificar token con el backend si está disponible
        if (USE_BACKEND_AUTH) {
          verificarToken(token);
        }
      } catch (e) {
        console.error('Error cargando usuario:', e);
        removeToken();
        localStorage.removeItem(STORAGE_KEY_USUARIO);
      }
    }
    setCargando(false);
  }, []);

  async function verificarToken(token) {
    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setUsuario({
            id: data.data._id || data.data.id,
            email: data.data.email,
            nombre: data.data.nombre,
            rol: data.data.rol
          });
        }
      } else {
        // Token inválido, limpiar
        removeToken();
        localStorage.removeItem(STORAGE_KEY_USUARIO);
        setUsuario(null);
      }
    } catch (error) {
      console.warn('Error verificando token, usando datos locales:', error);
    }
  }

  async function login(email, password) {
    if (password.length < 6) {
      throw new Error('La contraseña debe tener al menos 6 caracteres');
    }

    try {
      if (USE_BACKEND_AUTH) {
        const response = await fetchWithTimeout(`${API_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });

        let data;
        try {
          data = await response.json();
        } catch {
          throw new Error('El servidor respondió de forma inválida. Verificá que el backend esté corriendo.');
        }

        if (response.ok && data.success) {
          const usuarioData = guardarSesion(data);
          setUsuario(usuarioData);
          return usuarioData;
        }

        // Usuario nuevo: el backend devuelve 401, intentar registro automático
        if (response.status === 401) {
          try {
            return await registrar(email, password);
          } catch (regError) {
            if (regError.message?.includes('ya existe')) {
              throw new Error('Contraseña incorrecta');
            }
            throw regError;
          }
        }

        throw new Error(data.message || 'Error al iniciar sesión');
      }

      // Modo local (solo si USE_BACKEND_AUTH = false)
      const usuarios = JSON.parse(localStorage.getItem('usuarios_registrados') || '[]');
      const usuarioEncontrado = usuarios.find(u => u.email === email && u.password === password);

      if (!usuarioEncontrado) {
        const nuevoUsuario = {
          id: `user-${Date.now()}`,
          email,
          password
        };
        usuarios.push(nuevoUsuario);
        localStorage.setItem('usuarios_registrados', JSON.stringify(usuarios));

        const usuarioParaGuardar = { id: nuevoUsuario.id, email: nuevoUsuario.email };
        localStorage.setItem(STORAGE_KEY_USUARIO, JSON.stringify(usuarioParaGuardar));
        setUsuario(usuarioParaGuardar);
        return usuarioParaGuardar;
      }

      const usuarioParaGuardar = { id: usuarioEncontrado.id, email: usuarioEncontrado.email };
      localStorage.setItem(STORAGE_KEY_USUARIO, JSON.stringify(usuarioParaGuardar));
      setUsuario(usuarioParaGuardar);
      return usuarioParaGuardar;
    } catch (error) {
      if (error.name === 'TypeError' || error.message?.includes('Failed to fetch')) {
        throw new Error('No se pudo conectar con el servidor. Verificá que el backend esté corriendo en http://localhost:3000');
      }
      throw error;
    }
  }

  async function registrar(email, password, nombre = null) {
    if (USE_BACKEND_AUTH) {
      const response = await fetchWithTimeout(`${API_URL}/auth/registro`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          nombre: nombre || email.split('@')[0]
        })
      });

      let data;
      try {
        data = await response.json();
      } catch {
        throw new Error('El servidor respondió de forma inválida. Verificá que el backend esté corriendo.');
      }

      if (response.ok && data.success) {
        const usuarioData = guardarSesion(data);
        setUsuario(usuarioData);
        return usuarioData;
      }

      throw new Error(data.message || 'Error al registrar usuario');
    }
  }

  async function logout() {
    removeToken();
    localStorage.removeItem(STORAGE_KEY_USUARIO);
    setUsuario(null);
  }

  const value = { usuario, login, logout, cargando, registrar };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}

// Export default opcional (por si en algún lugar importan default)
export default AuthProvider;
