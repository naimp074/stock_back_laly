# 🔧 Solución para Error 500 en Vercel

Si estás viendo errores 500 en todos los endpoints, sigue estos pasos:

## ✅ Paso 1: Verificar Variables de Entorno en Vercel

**Esto es CRÍTICO - Sin estas variables, el backend NO funcionará.**

1. Ve a tu proyecto en [Vercel Dashboard](https://vercel.com/dashboard)
2. Haz clic en tu proyecto
3. Ve a **Settings** → **Environment Variables**
4. Verifica que tengas estas variables configuradas:

### Variables OBLIGATORIAS:

- **`MONGODB_URI`**
  - Valor: Tu connection string de MongoDB Atlas
  - Ejemplo: `mongodb+srv://usuario:password@cluster.mongodb.net/stock-db`
  - **Environment**: Selecciona `Production`, `Preview`, y `Development`

- **`JWT_SECRET`**
  - Valor: Cualquier cadena larga y aleatoria
  - Ejemplo: `mi_secreto_super_seguro_123456789`
  - **Environment**: Selecciona `Production`, `Preview`, y `Development`

### Variables Opcionales (pero recomendadas):

- **`NODE_ENV`**
  - Valor: `production`
  - **Environment**: `Production` solamente

- **`CORS_ORIGINS`**
  - Valor: Tu dominio de Vercel (se maneja automáticamente, pero puedes especificarlo)
  - Ejemplo: `https://tu-proyecto.vercel.app`

## ✅ Paso 2: Verificar MongoDB Atlas

1. Ve a [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Verifica que tu cluster esté **activo** (no pausado)
3. Ve a **Network Access**
4. Asegúrate de tener una regla que permita conexiones:
   - Para desarrollo/testing: `0.0.0.0/0` (permite todas las IPs)
   - Para producción: Agrega las IPs específicas de Vercel

## ✅ Paso 3: Redesplegar después de agregar variables

**IMPORTANTE**: Después de agregar o modificar variables de entorno:

1. Ve a **Deployments** en Vercel
2. Haz clic en los tres puntos (⋯) del último deployment
3. Selecciona **Redeploy**
4. O simplemente haz un nuevo commit y push (Vercel redesplegará automáticamente)

## ✅ Paso 4: Verificar los Logs

1. Ve a **Deployments** → Tu último deployment
2. Haz clic en **Functions** o **Logs**
3. Busca errores relacionados con:
   - `MONGODB_URI`
   - `Error conectando a MongoDB`
   - `Cannot find module`
   - Cualquier error de importación

## 🔍 Diagnóstico Rápido

### Si ves este error en los logs:
```
Error conectando a MongoDB: ...
```
**Solución**: Verifica `MONGODB_URI` en las variables de entorno

### Si ves este error:
```
Cannot find module '...'
```
**Solución**: Verifica que todas las dependencias estén en `package.json` y que el build haya completado correctamente

### Si ves este error:
```
A server error occurred
```
**Solución**: 
1. Verifica las variables de entorno
2. Revisa los logs completos en Vercel
3. Asegúrate de que MongoDB Atlas esté accesible

## 📝 Checklist Completo

- [ ] `MONGODB_URI` está configurada en Vercel
- [ ] `JWT_SECRET` está configurada en Vercel
- [ ] Las variables están configuradas para `Production`, `Preview`, y `Development`
- [ ] MongoDB Atlas está activo (no pausado)
- [ ] Network Access en MongoDB permite conexiones desde Vercel (`0.0.0.0/0` o IPs específicas)
- [ ] Has redesplegado después de agregar las variables
- [ ] Has revisado los logs en Vercel para ver errores específicos

## 🆘 Si Nada Funciona

1. **Revisa los logs completos** en Vercel Dashboard → Deployments → Logs
2. **Copia el error completo** y compártelo
3. **Verifica que el build haya completado** sin errores
4. **Prueba localmente** primero:
   ```bash
   cd server
   npm install
   # Crea un archivo .env con MONGODB_URI y JWT_SECRET
   npm start
   # Prueba http://localhost:3000/api/health
   ```

## 📞 Información para Debugging

Si necesitas ayuda, comparte:
1. Los logs completos de Vercel (deploy y función)
2. Si tienes las variables de entorno configuradas
3. El estado de tu MongoDB Atlas (activo/pausado)
4. Cualquier error específico que veas

---

**Nota**: Los cambios recientes mejoran el manejo de errores, pero **las variables de entorno son esenciales** para que el backend funcione.
