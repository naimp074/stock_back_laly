import jwt from 'jsonwebtoken';
import Usuario from '../models/Usuario.js';

// Middleware para verificar token JWT
export const proteger = async (req, res, next) => {
  try {
    let token;

    // Verificar si el token viene en el header Authorization
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No autorizado, no se proporcionó token'
      });
    }

    try {
      // Verificar token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Obtener usuario del token (sin password)
      req.usuario = await Usuario.findById(decoded.id).select('-password');
      
      if (!req.usuario || !req.usuario.activo) {
        return res.status(401).json({
          success: false,
          message: 'Usuario no encontrado o inactivo'
        });
      }

      // Agregar user_id al request para compatibilidad con código existente
      req.user_id = req.usuario._id.toString();
      
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Token no válido'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error en autenticación',
      error: error.message
    });
  }
};

// Middleware para verificar roles
export const autorizar = (...roles) => {
  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({
        success: false,
        message: 'No autorizado'
      });
    }

    if (!roles.includes(req.usuario.rol)) {
      return res.status(403).json({
        success: false,
        message: `Usuario con rol '${req.usuario.rol}' no tiene acceso a este recurso`
      });
    }

    next();
  };
};








