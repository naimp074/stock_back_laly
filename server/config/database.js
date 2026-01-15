import mongoose from 'mongoose';

// Variable para cachear la conexión
let cachedConnection = null;

const connectDB = async () => {
  // Si ya hay una conexión, reutilizarla
  if (cachedConnection && mongoose.connection.readyState === 1) {
    return cachedConnection;
  }

  try {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/stock-db';
    
    if (!process.env.MONGODB_URI) {
      console.warn('⚠️ MONGODB_URI no configurada. Usando valor por defecto.');
    }

    const conn = await mongoose.connect(MONGODB_URI, {
      // Opciones de conexión para serverless (timeouts más cortos)
      serverSelectionTimeoutMS: 3000, // Reducido de 5000 a 3000
      socketTimeoutMS: 10000, // Reducido de 45000 a 10000
      connectTimeoutMS: 3000, // Agregar timeout de conexión
    });

    cachedConnection = conn;
    console.log(`✅ MongoDB conectado: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`❌ Error conectando a MongoDB: ${error.message}`);
    
    // En modo serverless (Vercel), no lanzar el error para permitir que Express funcione
    // Los endpoints pueden manejar la falta de conexión
    if (process.env.VERCEL) {
      console.warn('⚠️ Continuando sin MongoDB en modo serverless');
      return null; // Retornar null en lugar de lanzar error
    }
    
    // En desarrollo local, hacer exit solo si no es producción
    if (process.env.NODE_ENV !== 'production') {
      process.exit(1);
    }
    
    // En producción local, lanzar el error
    throw error;
  }
};

export default connectDB;








