/**
 * Serverless Function para Vercel
 * Wrapper del servidor Express para funcionar como función serverless
 */

// Intentar cargar la app de Express
let app = null;
let loadError = null;

// Función para cargar la app de forma segura
async function loadApp() {
  if (app) return { app, error: null };
  if (loadError) return { app: null, error: loadError };
  
  try {
    console.log('🔄 Cargando aplicación Express...');
    const serverModule = await import('../server/server.js');
    app = serverModule.default;
    console.log('✅ App Express cargada correctamente');
    return { app, error: null };
  } catch (error) {
    console.error('❌ Error cargando app Express:', error);
    console.error('Error stack:', error.stack);
    loadError = error;
    return { app: null, error };
  }
}

export default async function handler(req, res) {
  // Función helper para enviar JSON de forma segura
  const sendJSON = (status, data) => {
    try {
      if (!res.headersSent) {
        res.setHeader('Content-Type', 'application/json');
        res.status(status).json(data);
      }
    } catch (err) {
      console.error('Error enviando respuesta:', err);
    }
  };

  try {
    // Cargar la app si no está cargada
    const { app: expressApp, error: loadErr } = await loadApp();
    
    // Si hay error cargando la app, devolver información útil
    if (loadErr) {
      console.error('Error de carga:', loadErr.message);
      return sendJSON(500, {
        success: false,
        message: 'Error inicializando servidor',
        error: process.env.VERCEL_ENV !== 'production' ? loadErr.message : undefined,
        hint: 'Verifica los logs en Vercel para más detalles. Asegúrate de que MONGODB_URI y JWT_SECRET estén configuradas.'
      });
    }
    
    if (!expressApp) {
      return sendJSON(500, {
        success: false,
        message: 'Error: No se pudo cargar la aplicación Express'
      });
    }

    // Normalizar la URL para Express
    // En Vercel, cuando se hace rewrite de /api/(.*) a /api/index.js,
    // la ruta puede venir como "/api/health" o solo "/health"
    const originalUrl = req.url || req.path || '/';
    
    // Log para debugging
    console.log(`📥 ${req.method} ${originalUrl}`);
    
    // Si la URL no empieza con /api, agregarlo
    // Express espera rutas que empiecen con /api
    if (!originalUrl.startsWith('/api')) {
      req.url = `/api${originalUrl === '/' ? '' : originalUrl}`;
      if (req.path) {
        req.path = `/api${originalUrl === '/' ? '' : originalUrl}`;
      }
    }
    
    // Ejecutar Express
    // Express manejará las rutas y enviará la respuesta
    expressApp(req, res);
    
  } catch (error) {
    console.error('❌ Error en función serverless:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    // Asegurarse de enviar una respuesta JSON incluso si hay error
    sendJSON(500, {
      success: false,
      message: 'Error interno del servidor',
      error: process.env.VERCEL_ENV !== 'production' 
        ? error.message 
        : undefined,
      ...(process.env.VERCEL_ENV !== 'production' && { 
        stack: error.stack,
        name: error.name
      })
    });
  }
}
