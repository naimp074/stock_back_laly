import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import Usuario from '../models/Usuario.js';

// Generar JWT Token
const generarToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// @desc    Registrar nuevo usuario
// @route   POST /api/auth/registro
// @access  Public
export const registrar = async (req, res) => {
  try {
    const { nombre, email, password, rol } = req.body;

    // Validaciones
    if (!nombre || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Por favor completa todos los campos requeridos'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña debe tener al menos 6 caracteres'
      });
    }

    // Verificar si el usuario ya existe
    const usuarioExiste = await Usuario.findOne({ email });

    if (usuarioExiste) {
      return res.status(400).json({
        success: false,
        message: 'El usuario ya existe'
      });
    }

    // Crear usuario
    const usuario = await Usuario.create({
      nombre,
      email,
      password,
      rol: rol || 'empleado' // Por defecto empleado, solo admin puede crear otros admins
    });

    // Generar token
    const token = generarToken(usuario._id);

    res.status(201).json({
      success: true,
      token,
      data: {
        id: usuario._id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al registrar usuario',
      error: error.message
    });
  }
};

// @desc    Iniciar sesión
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validaciones
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Por favor ingresa email y contraseña'
      });
    }

    // Verificar usuario y password
    const usuario = await Usuario.findOne({ email }).select('+password');

    if (!usuario) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    if (!usuario.activo) {
      return res.status(401).json({
        success: false,
        message: 'Usuario inactivo'
      });
    }

    // Intentar comparar password
    let passwordCorrecto = false;
    
    // Verificar si la contraseña está hasheada (empieza con $2a$ o $2b$)
    const passwordEstaHasheada = usuario.password && usuario.password.startsWith('$2');
    
    if (passwordEstaHasheada) {
      // Contraseña hasheada, usar comparación normal
      passwordCorrecto = await usuario.compararPassword(password);
    } else {
      // Contraseña en texto plano (bug anterior), comparar directamente
      passwordCorrecto = usuario.password === password;
      
      // Si coincide, re-hashear la contraseña automáticamente
      if (passwordCorrecto) {
        const salt = await bcrypt.genSalt(10);
        usuario.password = await bcrypt.hash(password, salt);
        await usuario.save();
      }
    }

    if (!passwordCorrecto) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    // Generar token
    const token = generarToken(usuario._id);

    res.status(200).json({
      success: true,
      token,
      data: {
        id: usuario._id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al iniciar sesión',
      error: error.message
    });
  }
};

// @desc    Obtener usuario actual
// @route   GET /api/auth/me
// @access  Private
export const obtenerUsuarioActual = async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.usuario._id);

    res.status(200).json({
      success: true,
      data: usuario
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener usuario',
      error: error.message
    });
  }
};

// @desc    Actualizar usuario
// @route   PUT /api/auth/perfil
// @access  Private
export const actualizarPerfil = async (req, res) => {
  try {
    const { nombre, email, password } = req.body;
    
    // Obtener el usuario actual
    const usuario = await Usuario.findById(req.usuario._id);
    
    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Actualizar campos
    if (nombre) usuario.nombre = nombre;
    if (email) usuario.email = email;
    
    // Si hay password, hashearlo antes de guardar
    if (password) {
      const salt = await bcrypt.genSalt(10);
      usuario.password = await bcrypt.hash(password, salt);
    }

    // Guardar usando save() para que se ejecuten los hooks
    await usuario.save();

    // Ocultar password en la respuesta
    usuario.password = undefined;

    res.status(200).json({
      success: true,
      data: usuario
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al actualizar perfil',
      error: error.message
    });
  }
};

// @desc    Obtener todos los usuarios (solo admin)
// @route   GET /api/auth/usuarios
// @access  Private/Admin
export const obtenerUsuarios = async (req, res) => {
  try {
    const usuarios = await Usuario.find().select('-password');

    res.status(200).json({
      success: true,
      count: usuarios.length,
      data: usuarios
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener usuarios',
      error: error.message
    });
  }
};

// @desc    Actualizar rol de usuario (solo admin)
// @route   PUT /api/auth/usuarios/:id/rol
// @access  Private/Admin
export const actualizarRolUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { rol } = req.body;

    if (!rol || !['admin', 'empleado'].includes(rol)) {
      return res.status(400).json({
        success: false,
        message: 'Rol inválido. Debe ser "admin" o "empleado"'
      });
    }

    const usuario = await Usuario.findByIdAndUpdate(
      id,
      { rol },
      { new: true, runValidators: true }
    ).select('-password');

    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      data: usuario
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al actualizar rol',
      error: error.message
    });
  }
};

// @desc    Cambiar contraseña de usuario (solo admin)
// @route   PUT /api/auth/usuarios/:id/password
// @access  Private/Admin
export const cambiarPasswordUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña es requerida'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña debe tener al menos 6 caracteres'
      });
    }

    // Obtener el usuario
    const usuario = await Usuario.findById(id);

    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Hashear la contraseña antes de guardar
    const salt = await bcrypt.genSalt(10);
    usuario.password = await bcrypt.hash(password, salt);

    // Guardar usando save() para que se ejecuten los hooks
    await usuario.save();

    // Ocultar password en la respuesta
    usuario.password = undefined;

    res.status(200).json({
      success: true,
      message: 'Contraseña actualizada correctamente',
      data: usuario
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al cambiar contraseña',
      error: error.message
    });
  }
};

// @desc    Eliminar usuario (solo admin)
// @route   DELETE /api/auth/usuarios/:id
// @access  Private/Admin
export const eliminarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioActual = req.usuario;

    // No permitir que un usuario se elimine a sí mismo
    if (usuarioActual._id.toString() === id) {
      return res.status(400).json({
        success: false,
        message: 'No puedes eliminar tu propio usuario'
      });
    }

    const usuario = await Usuario.findByIdAndDelete(id);

    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Usuario eliminado correctamente',
      data: {
        id: usuario._id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al eliminar usuario',
      error: error.message
    });
  }
};








