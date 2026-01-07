# 📚 Instrucciones para Configurar el Backend

## 🎯 Paso 1: Instalar MongoDB

### Opción A: MongoDB Local
1. Descarga MongoDB desde: https://www.mongodb.com/try/download/community
2. Instala MongoDB en tu sistema
3. Inicia el servicio de MongoDB

### Opción B: MongoDB Atlas (Cloud - Recomendado)
1. Ve a https://www.mongodb.com/cloud/atlas
2. Crea una cuenta gratuita
3. Crea un cluster gratuito
4. Obtén tu connection string (ejemplo: `mongodb+srv://usuario:password@cluster.mongodb.net/stock-db`)

## 🎯 Paso 2: Configurar el Backend

1. **Navega a la carpeta del servidor:**
```bash
cd server
```

2. **Instala las dependencias:**
```bash
npm install
```

3. **Crea el archivo `.env`:**
Crea un archivo `.env` en la carpeta `server/` con el siguiente contenido:

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/stock-db
JWT_SECRET=tu_secreto_super_seguro_aqui_cambiar_en_produccion
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

**Si usas MongoDB Atlas**, reemplaza `MONGODB_URI` con tu connection string:
```env
MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/stock-db
```

## 🎯 Paso 3: Iniciar el Backend

### Modo Desarrollo (con auto-reload):
```bash
npm run dev
```

### Modo Producción:
```bash
npm start
```

El servidor debería iniciar en `http://localhost:3000`

## 🎯 Paso 4: Probar el Backend

Abre tu navegador o usa Postman/Thunder Client y visita:
```
http://localhost:3000/api/health
```

Deberías ver:
```json
{
  "success": true,
  "message": "API funcionando correctamente",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## 🔌 Conectar el Frontend

Para conectar tu frontend React con este backend, necesitarás:

1. **Crear un archivo de configuración** en tu frontend (ejemplo: `src/config/api.js`):
```javascript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export default API_URL;
```

2. **Modificar tus servicios** para usar el backend en lugar de localStorage.

Ejemplo de cómo modificar `productosService.js`:
```javascript
import API_URL from '../config/api.js';

export async function listarProductos(userId) {
  const response = await fetch(`${API_URL}/productos?user_id=${userId}`);
  const data = await response.json();
  return data.data; // Retorna el array de productos
}

export async function crearProducto(producto, userId) {
  const response = await fetch(`${API_URL}/productos`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ...producto, user_id: userId }),
  });
  const data = await response.json();
  return data.data;
}
```

## 📋 Estructura de Respuestas de la API

Todas las respuestas exitosas siguen este formato:
```json
{
  "success": true,
  "data": { ... },
  "count": 10  // Solo en listados
}
```

Las respuestas de error:
```json
{
  "success": false,
  "message": "Mensaje de error descriptivo"
}
```

## 🔑 Nota sobre user_id

Actualmente, el backend requiere `user_id` como parámetro de consulta o en el body. Esto es temporal hasta que implementes autenticación JWT.

**Ejemplo de uso:**
- `GET /api/productos?user_id=123`
- `POST /api/productos` con body: `{ "user_id": "123", "nombre": "Producto", ... }`

## 🐛 Solución de Problemas

### Error: "Cannot connect to MongoDB"
- Verifica que MongoDB esté corriendo
- Verifica que la URI en `.env` sea correcta
- Si usas Atlas, verifica que tu IP esté en la whitelist

### Error: "Port already in use"
- Cambia el puerto en el archivo `.env`
- O cierra la aplicación que está usando el puerto 3000

### Error: "Module not found"
- Ejecuta `npm install` nuevamente en la carpeta `server/`

## 📚 Próximos Pasos

1. ✅ Backend funcionando
2. ⏭️ Conectar frontend con el backend
3. ⏭️ Implementar autenticación JWT (opcional)
4. ⏭️ Agregar validaciones adicionales
5. ⏭️ Implementar tests

## 📞 Endpoints Disponibles

Ver `server/README.md` para la documentación completa de todos los endpoints.








