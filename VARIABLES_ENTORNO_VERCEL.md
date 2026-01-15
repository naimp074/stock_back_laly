# 🔐 Variables de Entorno para Vercel

## ⚠️ IMPORTANTE: No subir archivos .env al repositorio

Los archivos `.env` **NUNCA** deben subirse a Git. Están protegidos por `.gitignore`.

## 📋 Variables que debes configurar en Vercel

Cuando despliegues en Vercel, necesitas agregar estas variables de entorno en el dashboard de Vercel:

### 1. MONGODB_URI (OBLIGATORIA)

**Descripción**: Connection string de tu base de datos MongoDB

**Valor de ejemplo para desarrollo local:**
```
mongodb://localhost:27017/stock-db
```

**Valor para producción (MongoDB Atlas):**
```
mongodb+srv://usuario:password@cluster.mongodb.net/stock-db
```

**Cómo obtenerlo:**
1. Ve a [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Inicia sesión o crea una cuenta gratuita
3. Crea un cluster (gratis)
4. Ve a "Connect" → "Connect your application"
5. Copia el connection string
6. Reemplaza `<password>` con tu contraseña de MongoDB
7. Reemplaza `<dbname>` con `stock-db` (o el nombre que prefieras)

**⚠️ IMPORTANTE**: 
- En MongoDB Atlas, asegúrate de agregar `0.0.0.0/0` en "Network Access" para permitir conexiones desde Vercel
- O agrega específicamente las IPs de Vercel

---

### 2. JWT_SECRET (OBLIGATORIA)

**Descripción**: Secreto para firmar y verificar tokens JWT

**Valor de ejemplo:**
```
mi_secreto_super_seguro_123456789
```

**Cómo generar uno seguro:**
```bash
# En PowerShell:
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))

# O simplemente usa una cadena larga y aleatoria
```

**⚠️ IMPORTANTE**: 
- Debe ser una cadena larga y aleatoria
- No uses el mismo secreto en desarrollo y producción
- Mantén este secreto privado

---

### 3. CORS_ORIGINS (OPCIONAL)

**Descripción**: Orígenes permitidos para CORS (separados por comas)

**Valor de ejemplo:**
```
https://tu-proyecto.vercel.app,https://www.tu-dominio.com
```

**Nota**: Si no la configuras, el código manejará automáticamente el dominio de Vercel.

---

### 4. NODE_ENV (OPCIONAL - Se configura automáticamente)

**Descripción**: Entorno de ejecución

**Valor:**
```
production
```

**Nota**: Vercel normalmente configura esto automáticamente, pero puedes agregarlo manualmente si es necesario.

---

## 🔧 Cómo configurar en Vercel

### Opción 1: Desde el Dashboard

1. Ve a tu proyecto en [Vercel Dashboard](https://vercel.com/dashboard)
2. Haz clic en tu proyecto
3. Ve a **Settings** → **Environment Variables**
4. Agrega cada variable:
   - **Name**: `MONGODB_URI`
   - **Value**: Tu connection string
   - **Environment**: Selecciona `Production`, `Preview`, y `Development` (o solo Production)
5. Repite para `JWT_SECRET` y `CORS_ORIGINS` si es necesario
6. Haz clic en **Save**

### Opción 2: Desde la CLI

```bash
# Instalar Vercel CLI si no lo tienes
npm i -g vercel

# Configurar variables
vercel env add MONGODB_URI
vercel env add JWT_SECRET
vercel env add CORS_ORIGINS  # Opcional
```

---

## ✅ Checklist antes de desplegar

- [ ] Tienes una cuenta en MongoDB Atlas (o MongoDB configurado)
- [ ] Tienes el connection string de MongoDB
- [ ] Has generado un JWT_SECRET seguro
- [ ] Has agregado las variables en Vercel Dashboard
- [ ] Has verificado que `.env` está en `.gitignore` (ya está configurado)
- [ ] Has probado localmente que todo funciona

---

## 🧪 Verificar que las variables están configuradas

Después de desplegar, puedes verificar que las variables están funcionando:

1. Ve a `https://tu-proyecto.vercel.app/api/health`
2. Deberías ver una respuesta JSON exitosa
3. Si hay errores de conexión a MongoDB, verifica `MONGODB_URI`
4. Si hay errores de autenticación, verifica `JWT_SECRET`

---

## 🔄 Actualizar variables después del despliegue

Si necesitas cambiar una variable:

1. Ve a Vercel Dashboard → Settings → Environment Variables
2. Edita la variable
3. Haz clic en **Save**
4. Vercel automáticamente redesplegará con las nuevas variables

---

## 📝 Notas importantes

1. **Nunca subas archivos .env a Git** - Ya están protegidos por `.gitignore`
2. **Usa diferentes valores para desarrollo y producción**
3. **MongoDB Atlas es gratuito** para empezar (hasta 512MB)
4. **Las variables son sensibles** - No las compartas públicamente
5. **Vercel encripta las variables** automáticamente

---

## 🆘 Problemas comunes

### Error: "MongoDB connection failed"
- Verifica que `MONGODB_URI` esté correctamente configurada
- Verifica que tu IP esté en la whitelist de MongoDB Atlas
- Usa `0.0.0.0/0` para permitir todas las IPs (solo para desarrollo/testing)

### Error: "JWT verification failed"
- Verifica que `JWT_SECRET` esté configurada
- Asegúrate de usar el mismo secreto en todas las instancias

### Error: "CORS error"
- Verifica que `CORS_ORIGINS` incluya tu dominio de Vercel
- O deja que se maneje automáticamente (ya está configurado en el código)

---

¡Todo listo! 🎉
