import express from 'express';
import {
  obtenerProductos,
  obtenerProducto,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
  importarProductos
} from '../controllers/productosController.js';
import { proteger } from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(proteger);

router.route('/')
  .get(obtenerProductos)
  .post(crearProducto);

router.route('/importar')
  .post(importarProductos);

router.route('/:id')
  .get(obtenerProducto)
  .put(actualizarProducto)
  .delete(eliminarProducto);

export default router;

