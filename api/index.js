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
      let responseCompleted = false;
      let responseStarted = false;
      
      // Función para resolver la Promise de forma segura
      const safeResolve = (source) => {
        if (!responseCompleted) {
          responseCompleted = true;
          console.log(`✅ [Vercel] Promise resuelto desde: ${source}`);
          // Usar setImmediate para asegurar que todos los I/O pendientes se completen
          setImmediate(() => {
            resolve();
          });
        }
      };
      
      // Verificación periódica como respaldo adicional
      // Esto verifica cada 100ms si los headers se enviaron
      const checkInterval = setInterval(() => {
        if (res.headersSent && !responseCompleted) {
          console.log(`✅ [Vercel] Headers enviados detectados por verificación periódica`);
          clearInterval(checkInterval);
          safeResolve('periodic check');
        }
      }, 100);
      
      // Función wrapper para limpiar el intervalo cuando se resuelve
      const safeResolveWithCleanup = (source) => {
        clearInterval(checkInterval);
        safeResolve(source);
      };
      
      // Interceptar res.end - este es el punto crítico donde Express termina la respuesta
      const originalEnd = res.end.bind(res);
      res.end = function(...args) {
        console.log(`📤 [Vercel] res.end llamado`);
        const result = originalEnd.apply(this, args);
        
        // En Vercel serverless, después de res.end() la respuesta está enviada
        // Usar setImmediate para resolver después de que todos los I/O pendientes se completen
        setImmediate(() => {
          safeResolveWithCleanup('res.end');
        });
        
        return result;
      };
      
      // Interceptar res.json - Express usa esto frecuentemente
      const originalJson = res.json.bind(res);
      res.json = function(data) {
        if (!responseStarted) {
          responseStarted = true;
          console.log(`📤 [Vercel] res.json llamado con:`, typeof data === 'object' ? JSON.stringify(data).substring(0, 100) : data);
        }
        const result = originalJson.apply(this, arguments);
        // res.json internamente llama a res.end, pero como respaldo adicional
        // verificamos después de que los I/O pendientes se completen
        setImmediate(() => {
          if (res.headersSent && !responseCompleted) {
            safeResolveWithCleanup('res.json');
          }
        });
        return result;
      };
      
      // Interceptar res.send - otro método común de Express
      const originalSend = res.send.bind(res);
      res.send = function(data) {
        if (!responseStarted) {
          responseStarted = true;
          console.log(`📤 [Vercel] res.send llamado`);
        }
        const result = originalSend.apply(this, arguments);
        // res.send también llama a res.end internamente
        setImmediate(() => {
          if (res.headersSent && !responseCompleted) {
            safeResolveWithCleanup('res.send');
          }
        });
        return result;
      };
      
      // Interceptar res.status para logging
      const originalStatus = res.status.bind(res);
      res.status = function(code) {
        console.log(`📤 [Vercel] res.status(${code}) llamado`);
        return originalStatus.apply(this, arguments);
      };
      
      // Usar eventos nativos como respaldo adicional
      // Estos eventos pueden no estar disponibles en el objeto res de Vercel,
      // pero los registramos por si acaso
      if (typeof res.once === 'function') {
        res.once('finish', () => {
          console.log(`✅ [Vercel] Evento 'finish' disparado`);
          safeResolveWithCleanup('event:finish');
        });
        
        res.once('close', () => {
          console.log(`✅ [Vercel] Evento 'close' disparado`);
          safeResolveWithCleanup('event:close');
        });
      }
      
      // Manejar errores de Express
      const onError = (error) => {
        console.error('❌ [Vercel] Error en Express:', error);
        if (!responseCompleted && !res.headersSent) {
          try {
            res.status(500).json({
              success: false,
              message: 'Error interno del servidor',
              error: error.message
            });
          } catch (e) {
            // Si no podemos enviar respuesta, al menos resolver el Promise
            safeResolveWithCleanup('error handler');
          }
        } else if (!responseCompleted) {
          safeResolveWithCleanup('error handler (headers already sent)');
        }
      };
      
      // Ejecutar Express
      console.log(`🚀 [Vercel] Ejecutando Express para ${req.method} ${requestUrl}`);
      
      try {
        expressApp(req, res);
      } catch (error) {
        onError(error);
      }
      
      // Timeout de seguridad (10 segundos - aumentado para dar más tiempo)
      setTimeout(() => {
        clearInterval(checkInterval); // Limpiar el intervalo de verificación
        if (!responseCompleted) {
          console.warn('⚠️ [Vercel] Timeout: Express no completó la respuesta en 10 segundos');
          console.warn('URL solicitada:', requestUrl);
          console.warn('Method:', req.method);
          console.warn('Headers sent:', res.headersSent);
          console.warn('Response started:', responseStarted);
          
          if (!res.headersSent) {
            try {
              sendJSON(504, {
                success: false,
                message: 'Timeout: El servidor tardó demasiado en responder',
                url: requestUrl
              });
            } catch (e) {
              console.error('Error enviando respuesta de timeout:', e);
            }
          }
          
          safeResolveWithCleanup('timeout');
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
