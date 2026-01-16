import express from 'express';
import {
  registrar,
  login,
  obtenerUsuarioActual,
  actualizarPerfil,
  obtenerUsuarios,
  actualizarRolUsuario,
  cambiarPasswordUsuario
} from '../controllers/authController.js';
import { proteger } from '../middleware/auth.js';
import { autorizar } from '../middleware/auth.js';

const router = express.Router();

// Rutas públicas
router.post('/registro', registrar);
router.post('/login', login);

// Rutas protegidas
router.get('/me', proteger, obtenerUsuarioActual);
router.put('/perfil', proteger, actualizarPerfil);

// Rutas solo para admin
router.get('/usuarios', proteger, autorizar('admin'), obtenerUsuarios);
router.put('/usuarios/:id/rol', proteger, autorizar('admin'), actualizarRolUsuario);
router.put('/usuarios/:id/password', proteger, autorizar('admin'), cambiarPasswordUsuario);

export default router;








