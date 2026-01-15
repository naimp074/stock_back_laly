/**
 * Serverless Function para Vercel
 * Wrapper del servidor Express para funcionar como función serverless
 */

import app from '../server/server.js';

export default async function handler(req, res) {
  try {
    // En Vercel, cuando se hace rewrite de /api/(.*) a /api/index.js,
    // la ruta que llega puede ser solo la parte después de /api (ej: /health)
    // Necesitamos asegurarnos de que Express reciba la ruta completa con /api
    
    const originalUrl = req.url || '/';
    
    // Si la URL no empieza con /api, agregarlo
    // Esto maneja el caso donde Vercel pasa /health en lugar de /api/health
    if (!originalUrl.startsWith('/api')) {
      req.url = `/api${originalUrl === '/' ? '' : originalUrl}`;
    }
    
    // Ejecutar la app de Express directamente
    // Express manejará las rutas y enviará la respuesta
    app(req, res);
  } catch (error) {
    console.error('Error en función serverless:', error);
    
    // Asegurarse de enviar una respuesta JSON incluso si hay error
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}
