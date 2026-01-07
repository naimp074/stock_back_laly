import React, { createContext, useContext, useEffect, useState } from 'react';
import api, { setToken, removeToken } from '../lib/apiClient';

const AuthContext = createContext(undefined);

const STORAGE_KEY_USUARIO = 'usuario_actual';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const USE_BACKEND_AUTH = true; // Cambiar a false para usar solo localStorage

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
    try {
      if (USE_BACKEND_AUTH) {
        // Intentar login con el backend
        try {
          const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
          });

          const data = await response.json();

          if (response.ok && data.success) {
            // Guardar token
            setToken(data.token);
            
            // Guardar datos del usuario
            const usuarioData = {
              id: data.data.id || data.data._id,
              email: data.data.email,
              nombre: data.data.nombre,
              rol: data.data.rol
            };
            
            localStorage.setItem(STORAGE_KEY_USUARIO, JSON.stringify(usuarioData));
            setUsuario(usuarioData);
            return usuarioData;
          } else {
            // Si el usuario no existe, intentar registrarlo
            if (data.message && data.message.includes('no existe') || response.status === 401) {
              return await registrar(email, password);
            }
            throw new Error(data.message || 'Error al iniciar sesión');
          }
        } catch (error) {
          console.warn('Error conectando con backend, usando modo local:', error);
          // Fallback a modo local
        }
      }
      
      // Modo local (fallback)
      const usuarios = JSON.parse(localStorage.getItem('usuarios_registrados') || '[]');
      const usuarioEncontrado = usuarios.find(u => u.email === email && u.password === password);
      
      if (!usuarioEncontrado) {
        // Crear usuario nuevo
        const nuevoUsuario = {
          id: `user-${Date.now()}`,
          email: email,
          password: password
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
      throw error;
    }
  }

  async function registrar(email, password, nombre = null) {
    try {
      if (USE_BACKEND_AUTH) {
        const response = await fetch(`${API_URL}/auth/registro`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email,
            password,
            nombre: nombre || email.split('@')[0]
          })
        });

        const data = await response.json();

        if (response.ok && data.success) {
          setToken(data.token);
          
          const usuarioData = {
            id: data.data.id || data.data._id,
            email: data.data.email,
            nombre: data.data.nombre,
            rol: data.data.rol
          };
          
          localStorage.setItem(STORAGE_KEY_USUARIO, JSON.stringify(usuarioData));
          setUsuario(usuarioData);
          return usuarioData;
        } else {
          throw new Error(data.message || 'Error al registrar usuario');
        }
      }
    } catch (error) {
      console.error('Error registrando usuario:', error);
      throw error;
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
