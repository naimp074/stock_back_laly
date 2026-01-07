import Usuario from '../models/Usuario.js';
import connectDB from '../config/database.js';
import dotenv from 'dotenv';

dotenv.config();

const crearAdmin = async () => {
  try {
    await connectDB();
    
    const email = process.argv[2] || 'admin@example.com';
    const password = process.argv[3] || 'admin123';
    const nombre = process.argv[4] || 'Administrador';

    // Verificar si ya existe
    const existe = await Usuario.findOne({ email });
    if (existe) {
      console.log('❌ Ya existe un usuario con ese email');
      process.exit(1);
    }

    const admin = await Usuario.create({
      nombre,
      email,
      password,
      rol: 'admin'
    });
    
    console.log('✅ Admin creado exitosamente:');
    console.log('   Email:', admin.email);
    console.log('   Nombre:', admin.nombre);
    console.log('   Rol:', admin.rol);
    console.log('\n💡 Ahora puedes iniciar sesión con estas credenciales');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

crearAdmin();








