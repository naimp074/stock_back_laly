import express from 'express';
import {
  obtenerCuentas,
  obtenerCuenta,
  crearCuenta,
  actualizarCuenta,
  eliminarCuenta,
  obtenerMovimientos,
  registrarMovimiento,
  actualizarMovimiento,
  eliminarMovimiento
} from '../controllers/cuentasCorrientesController.js';
import { proteger } from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(proteger);

// Rutas para cuentas corrientes
router.route('/')
  .get(obtenerCuentas)
  .post(crearCuenta);

router.route('/:id')
  .get(obtenerCuenta)
  .put(actualizarCuenta)
  .delete(eliminarCuenta);

// Rutas para movimientos
router.route('/:id/movimientos')
  .get(obtenerMovimientos)
  .post(registrarMovimiento);

router.route('/movimientos/:id')
  .put(actualizarMovimiento)
  .delete(eliminarMovimiento);

export default router;

