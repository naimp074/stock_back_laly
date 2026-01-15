/**
 * Serverless Function para Vercel
 * Wrapper del servidor Express para funcionar como función serverless
 */

let app = null;
let appLoading = false;

// Cargar la app de forma lazy para evitar errores en la importación
async function loadApp() {
  if (app) return app;
  if (appLoading) {
    // Esperar a que termine la carga anterior
    await new Promise(resolve => setTimeout(resolve, 100));
    return app;
  }
  
  appLoading = true;
  try {
    const serverModule = await import('../server/server.js');
    app = serverModule.default;
    console.log('✅ App Express cargada correctamente');
  } catch (error) {
    console.error('❌ Error cargando app Express:', error);
    throw error;
  } finally {
    appLoading = false;
  }
  
  return app;
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
    const expressApp = await loadApp();
    
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
    
    // Log para debugging (solo en desarrollo)
    if (process.env.NODE_ENV === 'development') {
      console.log('Request URL original:', originalUrl);
      console.log('Request method:', req.method);
    }
    
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
    console.error('Error en función serverless:', error);
    console.error('Error stack:', error.stack);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    
    // Asegurarse de enviar una respuesta JSON incluso si hay error
    sendJSON(500, {
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' || process.env.VERCEL_ENV !== 'production' 
        ? error.message 
        : undefined,
      ...(process.env.NODE_ENV === 'development' && { 
        stack: error.stack,
        name: error.name
      })
    });
  }
}
