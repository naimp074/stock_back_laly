/**
 * Serverless Function para Vercel
 * Wrapper del servidor Express para funcionar como función serverless
 */

// Cache para la app de Express
let app = null;
let appPromise = null;

// Función para cargar la app de forma segura
async function loadApp() {
  // Si ya está cargada, retornarla
  if (app) return app;
  
  // Si ya hay una carga en progreso, esperar a que termine
  if (appPromise) return appPromise;
  
  // Iniciar carga
  appPromise = (async () => {
    try {
      console.log('🔄 [Vercel] Cargando aplicación Express...');
      const serverModule = await import('../server/server.js');
      app = serverModule.default;
      console.log('✅ [Vercel] App Express cargada correctamente');
      return app;
    } catch (error) {
      console.error('❌ [Vercel] Error cargando app Express:', error);
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      throw error;
    } finally {
      appPromise = null;
    }
  })();
  
  return appPromise;
}

export default async function handler(req, res) {
  // Función helper para enviar JSON
  const sendJSON = (status, data) => {
    if (!res.headersSent) {
      res.setHeader('Content-Type', 'application/json');
      res.status(status).json(data);
    }
  };

  try {
    // Endpoint de diagnóstico directo (sin Express)
    // Útil para verificar que la función serverless funciona
    if (req.url === '/api/diagnostico' || req.url === '/diagnostico') {
      return sendJSON(200, {
        success: true,
        message: 'Función serverless funcionando',
        timestamp: new Date().toISOString(),
        variables: {
          MONGODB_URI: process.env.MONGODB_URI ? '✅ configurada' : '❌ NO configurada',
          JWT_SECRET: process.env.JWT_SECRET ? '✅ configurada' : '❌ NO configurada',
          NODE_ENV: process.env.NODE_ENV || 'no configurado',
          VERCEL: process.env.VERCEL ? '✅ sí' : '❌ no'
        },
        url: req.url,
        method: req.method
      });
    }

    // Cargar la app de Express
    const expressApp = await loadApp();
    
    if (!expressApp) {
      return sendJSON(500, {
        success: false,
        message: 'Error: No se pudo cargar la aplicación Express',
        diagnostico: 'Prueba /api/diagnostico para ver el estado de las variables'
      });
    }

    // En Vercel, cuando se hace rewrite de /api/(.*) a /api/index.js,
    // la ruta que llega puede ser "/api/health" o solo "/health"
    // Necesitamos normalizar para Express
    
    const originalUrl = req.url || '/';
    console.log(`📥 [Vercel] ${req.method} ${originalUrl}`);
    
    // Si la URL no empieza con /api, agregarlo
    // Express espera rutas que empiecen con /api
    if (!originalUrl.startsWith('/api')) {
      req.url = `/api${originalUrl === '/' ? '' : originalUrl}`;
      req.originalUrl = `/api${originalUrl === '/' ? '' : originalUrl}`;
      if (req.path !== undefined) {
        req.path = `/api${originalUrl === '/' ? '' : originalUrl}`;
      }
    }
    
    // Ejecutar Express
    // Usar Promise para manejar la respuesta asíncrona
    return new Promise((resolve) => {
      let responseSent = false;
      
      // Interceptar res.end para saber cuándo termina
      const originalEnd = res.end.bind(res);
      res.end = function(...args) {
        if (!responseSent) {
          responseSent = true;
          originalEnd.apply(this, args);
        }
        resolve();
      };
      
      // Interceptar res.json
      const originalJson = res.json.bind(res);
      res.json = function(data) {
        if (!responseSent) {
          responseSent = true;
          return originalJson(data);
        }
      };
      
      // Ejecutar Express
      expressApp(req, res, (err) => {
        if (err) {
          console.error('❌ [Vercel] Error en Express:', err);
          if (!responseSent) {
            sendJSON(500, {
              success: false,
              message: 'Error procesando request en Express',
              error: process.env.VERCEL_ENV !== 'production' ? err.message : undefined
            });
            resolve();
          }
        }
      });
      
      // Timeout de seguridad
      setTimeout(() => {
        if (!responseSent) {
          console.warn('⚠️ [Vercel] Timeout: Express no respondió');
          sendJSON(504, {
            success: false,
            message: 'Timeout: El servidor tardó demasiado en responder'
          });
          resolve();
        }
      }, 10000);
    });
    
  } catch (error) {
    console.error('❌ [Vercel] Error en función serverless:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    sendJSON(500, {
      success: false,
      message: 'Error interno del servidor',
      error: process.env.VERCEL_ENV !== 'production' ? error.message : undefined,
      diagnostico: 'Prueba /api/diagnostico para ver el estado de las variables',
      ...(process.env.VERCEL_ENV !== 'production' && { 
        stack: error.stack,
        name: error.name
      })
    });
  }
}
