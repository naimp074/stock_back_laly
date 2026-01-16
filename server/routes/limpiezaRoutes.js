import express from 'express';
import {
  eliminarTodosLosProductos,
  eliminarTodasLasVentas,
  eliminarTodosLosPresupuestos,
  eliminarTodasLasCuentasCorrientes,
  eliminarTodasLasNotasCredito,
  eliminarTodo,
  obtenerEstadisticasDatos
} from '../controllers/limpiezaController.js';
import { proteger } from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(proteger);

// Endpoints individuales
router.delete('/productos', eliminarTodosLosProductos);
router.delete('/ventas', eliminarTodasLasVentas);
router.delete('/presupuestos', eliminarTodosLosPresupuestos);
router.delete('/cuentas-corrientes', eliminarTodasLasCuentasCorrientes);
router.delete('/notas-credito', eliminarTodasLasNotasCredito);

// Endpoint para eliminar todo
router.delete('/todo', eliminarTodo);

// Endpoint para ver estadísticas antes de eliminar
router.get('/estadisticas', obtenerEstadisticasDatos);

export default router;
