import express from 'express';
import {
  crearFacturaArca,
  obtenerEstadoComprobante,
  verificarConfiguracion
} from '../controllers/arcaController.js';
import { proteger } from '../middleware/auth.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(proteger);

// Verificar configuración
router.get('/config', verificarConfiguracion);

// Crear factura electrónica
router.post('/comprobantes', crearFacturaArca);

// Obtener estado de comprobante
router.get('/comprobantes/:puntoVenta/:numeroComprobante/:tipoComprobante', obtenerEstadoComprobante);

export default router;






