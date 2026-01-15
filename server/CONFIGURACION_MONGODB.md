# Configuración de MongoDB

## Archivo .env

Crea un archivo `.env` en la carpeta `server/` con el siguiente contenido:

```env
# Puerto del servidor
PORT=3000

# MongoDB Connection String
MONGODB_URI=mongodb+srv://naimpaz274_db_user:xsjmqJw4s0tT2mDA@cluster0.c4xqe3a.mongodb.net/?appName=Cluster0

# JWT Secret (cambiar en producción)
JWT_SECRET=tu_secreto_super_seguro_aqui_cambiar_en_produccion

# CORS Origins (separados por comas)
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

## Notas importantes:

1. **MONGODB_URI**: Ya está configurado con tus credenciales de MongoDB Atlas
2. **JWT_SECRET**: Cambia este valor por uno seguro en producción
3. **CORS_ORIGINS**: Ajusta según los orígenes desde donde se conectará el frontend

## Instalación y ejecución:

```bash
cd server
npm install
npm start
```

El servidor se ejecutará en `http://localhost:3000`









