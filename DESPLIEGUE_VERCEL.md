# 🚀 Guía de Despliegue en Vercel

Esta guía te ayudará a desplegar tu aplicación completa (frontend + backend) en Vercel.

## 📋 Requisitos Previos

1. Cuenta en [Vercel](https://vercel.com) (gratuita)
2. Cuenta en [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (gratuita) o MongoDB local
3. Repositorio en GitHub, GitLab o Bitbucket

## 🔧 Paso 1: Preparar Variables de Entorno

Antes de desplegar, necesitas configurar las siguientes variables de entorno en Vercel:

### Variables Requeridas:

1. **MONGODB_URI**: Tu connection string de MongoDB Atlas
   - Ejemplo: `mongodb+srv://usuario:password@cluster.mongodb.net/stock-db`
   - Obténlo desde MongoDB Atlas → Connect → Connect your application

2. **JWT_SECRET**: Una cadena secreta para firmar los tokens JWT
   - Genera uno seguro: `openssl rand -base64 32`
   - O usa cualquier cadena larga y aleatoria

3. **CORS_ORIGINS** (opcional): Orígenes permitidos para CORS
   - En Vercel, esto se maneja automáticamente, pero puedes especificar dominios adicionales
   - Ejemplo: `https://tu-dominio.vercel.app,https://www.tu-dominio.com`

### Variables del Frontend (opcionales):

- **VITE_API_URL**: No es necesario configurarla, se usa `/api` automáticamente en producción

## 📤 Paso 2: Desplegar en Vercel

### Opción A: Desde el Dashboard de Vercel (Recomendado)

1. **Conecta tu repositorio:**
   - Ve a [vercel.com](https://vercel.com)
   - Haz clic en "Add New Project"
   - Conecta tu repositorio de GitHub/GitLab/Bitbucket
   - Selecciona el repositorio `back-stock`

2. **Configura el proyecto:**
   - **Framework Preset**: Vite
   - **Root Directory**: `.` (raíz del proyecto)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

3. **Agrega las variables de entorno:**
   - En la sección "Environment Variables", agrega:
     - `MONGODB_URI` = tu connection string de MongoDB
     - `JWT_SECRET` = tu secreto JWT
     - `CORS_ORIGINS` = (opcional) tus dominios permitidos
     - `NODE_ENV` = `production`

4. **Despliega:**
   - Haz clic en "Deploy"
   - Espera a que termine el build
   - ¡Listo! Tu app estará disponible en `https://tu-proyecto.vercel.app`

### Opción B: Desde la CLI de Vercel

```bash
# Instalar Vercel CLI (si no lo tienes)
npm i -g vercel

# Desde la raíz del proyecto
vercel

# Seguir las instrucciones interactivas
# Cuando pregunte por variables de entorno, agrega:
# - MONGODB_URI
# - JWT_SECRET
# - CORS_ORIGINS (opcional)
```

## 🔍 Paso 3: Verificar el Despliegue

1. **Verifica el frontend:**
   - Visita `https://tu-proyecto.vercel.app`
   - Deberías ver la página de login

2. **Verifica el backend:**
   - Visita `https://tu-proyecto.vercel.app/api/health`
   - Deberías ver:
     ```json
     {
       "success": true,
       "message": "API funcionando correctamente",
       "timestamp": "..."
     }
     ```

3. **Prueba la autenticación:**
   - Intenta iniciar sesión con cualquier email/contraseña
   - Debería crear el usuario automáticamente

## 🐛 Solución de Problemas

### Error: "Cannot find module"

**Problema**: Vercel no encuentra los módulos del backend.

**Solución**: Asegúrate de que `package.json` en la raíz tenga todas las dependencias necesarias, o configura Vercel para instalar dependencias de `server/`.

### Error: "MongoDB connection failed"

**Problema**: No puede conectar a MongoDB.

**Solución**: 
- Verifica que `MONGODB_URI` esté configurada correctamente en Vercel
- Asegúrate de que tu IP esté en la whitelist de MongoDB Atlas (o permite todas las IPs: `0.0.0.0/0`)

### Error: "CORS error"

**Problema**: El frontend no puede hacer requests al backend.

**Solución**: 
- Verifica que `CORS_ORIGINS` incluya tu dominio de Vercel
- O deja que se maneje automáticamente (ya está configurado)

### Las rutas del frontend no funcionan (404)

**Problema**: Al refrescar la página o navegar directamente, aparece 404.

**Solución**: Vercel ya está configurado con `rewrites` en `vercel.json` para manejar esto automáticamente.

## 📝 Estructura de Archivos para Vercel

```
back-stock/
├── api/
│   └── index.js          # Serverless function wrapper
├── server/               # Backend Express
│   ├── server.js
│   ├── routes/
│   └── ...
├── src/                  # Frontend React
├── vercel.json          # Configuración de Vercel
├── package.json         # Dependencias del frontend
└── vite.config.js
```

## 🔄 Actualizar el Despliegue

Cada vez que hagas `git push` a tu repositorio, Vercel automáticamente:
1. Detectará los cambios
2. Ejecutará el build
3. Desplegará la nueva versión

Puedes ver el progreso en el dashboard de Vercel.

## 🌐 Dominio Personalizado

Para usar tu propio dominio:

1. Ve a tu proyecto en Vercel
2. Settings → Domains
3. Agrega tu dominio
4. Sigue las instrucciones para configurar DNS

## 📚 Recursos Adicionales

- [Documentación de Vercel](https://vercel.com/docs)
- [Vercel Serverless Functions](https://vercel.com/docs/functions)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)

## ✅ Checklist Pre-Despliegue

- [ ] MongoDB Atlas configurado y funcionando
- [ ] Variables de entorno preparadas
- [ ] Repositorio conectado a Vercel
- [ ] Build local funciona (`npm run build`)
- [ ] Health check funciona localmente (`/api/health`)
- [ ] Variables de entorno agregadas en Vercel
- [ ] Despliegue completado
- [ ] Frontend carga correctamente
- [ ] Backend responde correctamente
- [ ] Login funciona

¡Todo listo! 🎉
