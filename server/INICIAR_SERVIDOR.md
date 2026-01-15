# 🚀 Cómo Iniciar el Backend

## Pasos Rápidos

### 1. Verificar que MongoDB esté corriendo

Abre una terminal y verifica:
```bash
# Si MongoDB está instalado como servicio de Windows, debería estar corriendo automáticamente
# Si no, inicia MongoDB manualmente
```

### 2. Crear archivo .env

En la carpeta `server/`, crea un archivo llamado `.env` con este contenido:

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/stock-db
JWT_SECRET=tu_secreto_super_seguro_aqui_cambiar_en_produccion
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

### 3. Instalar dependencias (si no lo has hecho)

```bash
cd c:\Users\Usuario\Desktop\copia\back-stock\server
npm install
```

### 4. Iniciar el servidor

```bash
npm run dev
```

Deberías ver:
```
🚀 Servidor corriendo en puerto 3000
📍 Health check: http://localhost:3000/api/health
✅ MongoDB conectado: ...
```

### 5. Probar en Postman

Ahora intenta de nuevo tu POST request:
- URL: `http://localhost:3000/api/auth/registro`
- Method: POST
- Body (JSON):
```json
{
  "nombre": "Nombre Usuario",
  "email": "usuario@example.com",
  "password": "contraseña123",
  "rol": "empleado"
}
```

## Solución de Problemas

### Error: "MongoDB connection failed"
- Verifica que MongoDB esté corriendo
- Verifica la URI en el archivo `.env`

### Error: "Port 3000 already in use"
- Cierra otros procesos que usen el puerto 3000
- O cambia el puerto en el `.env` a otro (ej: 3001)

### El servidor no inicia
- Verifica que Node.js esté instalado: `node --version`
- Verifica que las dependencias estén instaladas: `npm install`





