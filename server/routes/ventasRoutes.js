import express from 'express';
import {
  obtenerVentas,
  obtenerVenta,
  crearVenta,
  actualizarVenta,
  eliminarVenta,
  obtenerSiguienteNumeroFactura
} from '../controllers/ventasController.js';
import { proteger } from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(proteger);

router.route('/')
  .get(obtenerVentas)
  .post(crearVenta);

router.route('/siguiente-numero')
  .get(obtenerSiguienteNumeroFactura);

router.route('/:id')
  .get(obtenerVenta)
  .put(actualizarVenta)
  .delete(eliminarVenta);

export default router;

