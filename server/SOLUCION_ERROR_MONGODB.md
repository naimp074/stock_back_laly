# 🔧 Solución: Error de Conexión a MongoDB

## Problema
El servidor inicia pero se cierra porque no puede conectar a MongoDB:
```
❌ Error conectando a MongoDB: Could not connect to any servers in your MongoDB Atlas cluster...
```

## ✅ Soluciones

### Opción 1: Usar MongoDB Local (Recomendado para Desarrollo)

1. **Instala MongoDB localmente**:
   - Descarga desde: https://www.mongodb.com/try/download/community
   - O usa MongoDB con Docker

2. **Configura el archivo `.env`**:
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/stock-db
JWT_SECRET=tu_secreto_super_seguro_aqui
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

3. **Inicia MongoDB**:
```bash
# Windows (si instalaste MongoDB como servicio, debería iniciar automáticamente)
# O ejecuta manualmente:
mongod
```

4. **Inicia el servidor**:
```bash
npm start
```

---

### Opción 2: Usar MongoDB Atlas (Requiere Configuración)

Si quieres usar MongoDB Atlas (cloud):

1. **Agrega tu IP a la whitelist**:
   - Ve a: https://cloud.mongodb.com/
   - Entra a tu cluster
   - Ve a "Network Access"
   - Haz clic en "Add IP Address"
   - Agrega `0.0.0.0/0` (permite todas las IPs) o tu IP específica
   - Guarda los cambios

2. **Verifica el archivo `.env`**:
```env
PORT=3000
MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/stock-db
JWT_SECRET=tu_secreto_super_seguro_aqui
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

3. **Inicia el servidor**:
```bash
npm start
```

---

### Opción 3: Modificar el Código para No Salir en Error

Si quieres que el servidor siga corriendo aunque MongoDB falle (solo para desarrollo):

Edita `server/config/database.js`:

```javascript
import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/stock-db', {
      // Opciones de conexión
    });

    console.log(`✅ MongoDB conectado: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ Error conectando a MongoDB: ${error.message}`);
    console.warn('⚠️  El servidor continuará sin MongoDB (modo desarrollo)');
    // Comentar esta línea para que no salga:
    // process.exit(1);
  }
};

export default connectDB;
```

**⚠️ NO recomendado para producción** - Solo para desarrollo cuando MongoDB no está disponible.

---

## 🚀 Verificar que Funciona

Después de configurar MongoDB, verifica:

1. **El servidor inicia sin errores**:
```bash
npm start
```

Deberías ver:
```
✅ MongoDB conectado: localhost:27017
🚀 Servidor corriendo en puerto 3000
```

2. **Prueba el health check**:
```bash
curl http://localhost:3000/api/health
```

O abre en el navegador: `http://localhost:3000/api/health`

---

## 📝 Notas

- **MongoDB Local**: Más rápido para desarrollo, no requiere internet
- **MongoDB Atlas**: Mejor para producción, requiere configuración de red
- El archivo `.env` ya está creado con la configuración de Atlas
- Puedes cambiarlo a local editando `MONGODB_URI`






