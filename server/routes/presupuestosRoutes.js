import express from 'express';
import {
  obtenerPresupuestos,
  obtenerPresupuesto,
  crearPresupuesto,
  actualizarPresupuesto,
  eliminarPresupuesto,
  obtenerSiguienteNumeroPresupuesto
} from '../controllers/presupuestosController.js';
import { proteger } from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(proteger);

router.route('/')
  .get(obtenerPresupuestos)
  .post(crearPresupuesto);

router.route('/siguiente-numero')
  .get(obtenerSiguienteNumeroPresupuesto);

router.route('/:id')
  .get(obtenerPresupuesto)
  .put(actualizarPresupuesto)
  .delete(eliminarPresupuesto);

export default router;







