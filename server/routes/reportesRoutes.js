import express from 'express';
import {
  obtenerEstadisticas,
  obtenerVentasPorPeriodo,
  obtenerProductosMasVendidos
} from '../controllers/reportesController.js';
import { proteger } from '../middleware/auth.js';
import { autorizar } from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas de reportes requieren autenticación y rol de admin
router.use(proteger);
router.use(autorizar('admin'));

router.get('/estadisticas', obtenerEstadisticas);
router.get('/ventas', obtenerVentasPorPeriodo);
router.get('/productos-mas-vendidos', obtenerProductosMasVendidos);

export default router;








