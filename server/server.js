import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/database.js';

// Importar rutas
import authRoutes from './routes/authRoutes.js';
import productosRoutes from './routes/productosRoutes.js';
import ventasRoutes from './routes/ventasRoutes.js';
import presupuestosRoutes from './routes/presupuestosRoutes.js';
import arcaRoutes from './routes/arcaRoutes.js';
import cuentasCorrientesRoutes from './routes/cuentasCorrientesRoutes.js';
import notasCreditoRoutes from './routes/notasCreditoRoutes.js';
import reportesRoutes from './routes/reportesRoutes.js';

// Cargar variables de entorno
dotenv.config();

// Conectar a MongoDB
connectDB();

// Crear aplicación Express
const app = express();

// Middleware
// En Vercel, permitir el origen del dominio de Vercel
const allowedOrigins = process.env.CORS_ORIGINS?.split(',') || 
  (process.env.VERCEL_URL 
    ? [`https://${process.env.VERCEL_URL}`, `https://${process.env.VERCEL_URL.replace('https://', '')}`]
    : ['http://localhost:5173', 'http://localhost:3000']);

app.use(cors({
  origin: function (origin, callback) {
    // Permitir requests sin origen (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Permitir cualquier origen en desarrollo o si está en la lista
    if (process.env.NODE_ENV !== 'production' || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // Temporalmente permitir todos en producción
    }
  },
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware de logging (opcional, para desarrollo)
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/ventas', ventasRoutes);
app.use('/api/presupuestos', presupuestosRoutes);
app.use('/api/arca', arcaRoutes);
app.use('/api/cuentas-corrientes', cuentasCorrientesRoutes);
app.use('/api/notas-credito', notasCreditoRoutes);
app.use('/api/reportes', reportesRoutes);

// Ruta de prueba
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

// Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada'
  });
});

// Manejo de errores
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Iniciar servidor solo si no estamos en modo serverless (Vercel)
// Vercel establece VERCEL=1 cuando ejecuta serverless functions
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
  });
}

export default app;

