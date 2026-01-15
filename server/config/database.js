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
      // Opciones de conexión para serverless
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    cachedConnection = conn;
    console.log(`✅ MongoDB conectado: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`❌ Error conectando a MongoDB: ${error.message}`);
    
    // En modo serverless (Vercel), no hacer exit para permitir que la función continúe
    // Solo hacer exit en desarrollo local
    if (!process.env.VERCEL && process.env.NODE_ENV !== 'production') {
      process.exit(1);
    }
    
    // En producción/serverless, lanzar el error pero no matar el proceso
    throw error;
  }
};

export default connectDB;








