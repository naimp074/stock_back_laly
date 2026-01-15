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
    
    const originalUrl = req.url || req.path || '/';
    console.log(`📥 [Vercel] Request original:`, {
      url: req.url,
      path: req.path,
      originalUrl: req.originalUrl,
      method: req.method
    });
    
    // Vercel pasa la ruta completa con /api, pero Express también espera /api
    // Necesitamos mantener la ruta tal como está si ya tiene /api
    // O agregarlo si no lo tiene
    let finalUrl = originalUrl;
    if (!originalUrl.startsWith('/api')) {
      finalUrl = `/api${originalUrl === '/' ? '' : originalUrl}`;
    }
    
    // Actualizar todas las propiedades de URL en req
    req.url = finalUrl;
    req.originalUrl = finalUrl;
    if (req.path !== undefined) {
      req.path = finalUrl;
    }
    
    console.log(`📥 [Vercel] URL final para Express: ${finalUrl}`);
    
    // Guardar finalUrl para usarla en el callback
    const requestUrl = finalUrl;
    
    // Ejecutar Express
    // Usar Promise para manejar la respuesta asíncrona
    return new Promise((resolve) => {
      let responseSent = false;
      
      // Interceptar res.end para saber cuándo termina - ESTE ES EL MOMENTO CRÍTICO
      const originalEnd = res.end.bind(res);
      res.end = function(...args) {
        console.log(`📤 [Vercel] res.end llamado - respuesta completa`);
        if (!responseSent) {
          responseSent = true;
          try {
            originalEnd.apply(this, args);
          } finally {
            // Resolver el Promise DESPUÉS de que se envíe la respuesta
            process.nextTick(() => {
              console.log(`✅ [Vercel] Promise resuelto - respuesta enviada`);
              resolve();
            });
          }
        } else {
          resolve();
        }
      };
      
      // Interceptar res.json - debe asegurar que res.end se llame
      const originalJson = res.json.bind(res);
      res.json = function(data) {
        console.log(`📤 [Vercel] res.json llamado con:`, typeof data === 'object' ? JSON.stringify(data).substring(0, 100) : data);
        if (!responseSent) {
          responseSent = true;
          try {
            const result = originalJson(data);
            // res.json internamente llama a res.end, así que el Promise se resolverá ahí
            return result;
          } catch (err) {
            console.error('Error en res.json:', err);
            // Si hay error, asegurar que res.end se llame para resolver el Promise
            if (!res.headersSent) {
              try {
                res.status(500).end();
              } catch (e) {
                // Si falla, resolver el Promise de todas formas
                process.nextTick(() => resolve());
              }
            }
            throw err;
          }
        }
        return this;
      };
      
      // Interceptar res.send también
      const originalSend = res.send.bind(res);
      res.send = function(data) {
        console.log(`📤 [Vercel] res.send llamado`);
        if (!responseSent) {
          responseSent = true;
          try {
            const result = originalSend(data);
            // res.send también llama a res.end internamente
            return result;
          } catch (err) {
            console.error('Error en res.send:', err);
            // Si hay error, asegurar que res.end se llame
            if (!res.headersSent) {
              try {
                res.status(500).end();
              } catch (e) {
                process.nextTick(() => resolve());
              }
            }
            throw err;
          }
        }
        return this;
      };
      
      // Interceptar res.status también para logging
      const originalStatus = res.status.bind(res);
      res.status = function(code) {
        console.log(`📤 [Vercel] res.status(${code}) llamado`);
        return originalStatus(code);
      };
      
      // Ejecutar Express
      console.log(`🚀 [Vercel] Ejecutando Express para ${req.method} ${requestUrl}`);
      expressApp(req, res);
      
      // Verificar después de un tiempo si Express respondió
      // Si no respondió, enviar un error
      setTimeout(() => {
        if (!responseSent) {
          console.warn('⚠️ [Vercel] Express no envió respuesta después de 3 segundos');
          console.warn('URL solicitada:', requestUrl);
          console.warn('Method:', req.method);
          console.warn('Headers sent:', res.headersSent);
          sendJSON(504, {
            success: false,
            message: 'Timeout: Express no respondió',
            url: requestUrl,
            hint: 'Verifica los logs en Vercel para más detalles'
          });
          resolve();
        }
      }, 3000);
      
      // Timeout de seguridad (reducido a 4 segundos para que coincida con el frontend)
      setTimeout(() => {
        if (!responseSent) {
          console.warn('⚠️ [Vercel] Timeout: Express no respondió en 4 segundos');
          sendJSON(504, {
            success: false,
            message: 'Timeout: El servidor tardó demasiado en responder',
            url: requestUrl,
            hint: 'Verifica los logs en Vercel para ver qué está pasando'
          });
          resolve();
        }
      }, 4000);
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
