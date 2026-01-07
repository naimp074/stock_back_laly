import express from 'express';
import {
  obtenerNotasCredito,
  obtenerNotaCredito,
  crearNotaCredito,
  actualizarNotaCredito,
  eliminarNotaCredito,
  obtenerVentasParaNotaCredito,
  obtenerEstadisticasNotasCredito
} from '../controllers/notasCreditoController.js';
import { proteger } from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(proteger);

router.route('/')
  .get(obtenerNotasCredito)
  .post(crearNotaCredito);

router.route('/ventas-disponibles')
  .get(obtenerVentasParaNotaCredito);

router.route('/estadisticas')
  .get(obtenerEstadisticasNotasCredito);

router.route('/:id')
  .get(obtenerNotaCredito)
  .put(actualizarNotaCredito)
  .delete(eliminarNotaCredito);

export default router;

