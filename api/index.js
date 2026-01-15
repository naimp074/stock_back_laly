/**
 * Serverless Function para Vercel
 * Wrapper del servidor Express para funcionar como función serverless
 */

import app from '../server/server.js';

export default async function handler(req, res) {
  // Vercel pasa las rutas con /api ya incluido, pero Express espera /api
  // Ajustar la ruta si es necesario
  return app(req, res);
}
