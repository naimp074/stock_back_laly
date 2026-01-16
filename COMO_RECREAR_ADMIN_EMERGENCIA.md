# 🚨 Cómo Recrear el Admin en Caso de Emergencia

Si no puedes iniciar sesión y necesitas recrear el admin, sigue estos pasos.

---

## 🔄 Solución Rápida: Borrar y Recrear Admin

### Paso 1: Eliminar el Admin Actual

**Request:**
```
DELETE https://stock-back-laly.vercel.app/api/auth/emergencia/eliminar-usuario
```

**Body (raw JSON):**
```json
{
  "email": "placam20@gmail.com",
  "clave_emergencia": "EMERGENCY_RESET_2024"
}
```

**Respuesta exitosa:**
```json
{
  "success": true,
  "message": "Usuario eliminado correctamente",
  "data": {
    "email": "placam20@gmail.com",
    "nombre": "admin",
    "rol": "admin"
  }
}
```

### Paso 2: Crear Nuevo Admin

**Request:**
```
POST https://stock-back-laly.vercel.app/api/auth/recrear-admin
```

**Body (raw JSON):**
```json
{
  "email": "placam20@gmail.com",
  "password": "nueva_password123",
  "nombre": "Administrador"
}
```

**Respuesta exitosa:**
```json
{
  "success": true,
  "message": "Admin recreado correctamente",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "data": {
    "id": "...",
    "nombre": "Administrador",
    "email": "placam20@gmail.com",
    "rol": "admin"
  }
}
```

---

## 📝 Ejemplo Completo en Postman

### Paso 1: Eliminar Admin

1. **Método:** `DELETE`
2. **URL:** `https://stock-back-laly.vercel.app/api/auth/emergencia/eliminar-usuario`
3. **Body (raw JSON):**
```json
{
  "email": "placam20@gmail.com",
  "clave_emergencia": "EMERGENCY_RESET_2024"
}
```

### Paso 2: Crear Nuevo Admin

1. **Método:** `POST`
2. **URL:** `https://stock-back-laly.vercel.app/api/auth/recrear-admin`
3. **Body (raw JSON):**
```json
{
  "email": "placam20@gmail.com",
  "password": "nueva_password_segura123",
  "nombre": "Administrador"
}
```

### Paso 3: Verificar Login

1. **Método:** `POST`
2. **URL:** `https://stock-back-laly.vercel.app/api/auth/login`
3. **Body:**
```json
{
  "email": "placam20@gmail.com",
  "password": "nueva_password_segura123"
}
```

---

## ⚠️ IMPORTANTE

- **Clave de emergencia:** `EMERGENCY_RESET_2024` (por defecto)
- Puedes cambiar esta clave configurando la variable de entorno `EMERGENCY_KEY` en Vercel
- Este endpoint es público, úsalo solo en emergencias

---

## 🔄 Opción Alternativa: Recrear Admin Directamente

Este endpoint crea un nuevo admin o actualiza uno existente si no hay admins activos:

**Request:**
```
POST https://stock-back-laly.vercel.app/api/auth/recrear-admin
```

**Body (raw JSON):**
```json
{
  "email": "placam20@gmail.com",
  "password": "nueva_password123",
  "nombre": "Administrador"
}
```

**Respuesta exitosa:**
```json
{
  "success": true,
  "message": "Admin recreado correctamente",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "data": {
    "id": "...",
    "nombre": "Administrador",
    "email": "placam20@gmail.com",
    "rol": "admin"
  }
}
```

**Notas:**
- Si el email ya existe, lo actualiza a admin y cambia la contraseña
- Si no existe, crea un nuevo admin
- Solo funciona si NO hay ningún admin activo

---

## 🗑️ Opción 2: Borrar Admin Manualmente desde MongoDB

Si tienes acceso a MongoDB, puedes borrar el admin directamente:

1. Conecta a tu base de datos MongoDB
2. Busca la colección `usuarios`
3. Encuentra el documento con `email: "placam20@gmail.com"`
4. Elimínalo o cambia `activo: false` y `rol: "empleado"`
5. Luego usa el endpoint `/api/auth/recrear-admin` para crear uno nuevo

---

## 📝 Ejemplo Completo en Postman

### Paso 1: Recrear Admin

1. **Método:** `POST`
2. **URL:** `https://stock-back-laly.vercel.app/api/auth/recrear-admin`
3. **Body (raw JSON):**
```json
{
  "email": "placam20@gmail.com",
  "password": "nueva_password_segura123",
  "nombre": "Administrador"
}
```

4. **Respuesta:** Deberías recibir un token y los datos del admin

### Paso 2: Verificar Login

1. **Método:** `POST`
2. **URL:** `https://stock-back-laly.vercel.app/api/auth/login`
3. **Body:**
```json
{
  "email": "placam20@gmail.com",
  "password": "nueva_password_segura123"
}
```

---

## 🔍 Si el Endpoint No Funciona

Si recibes el error "Ya existe un admin activo", necesitas:

### Opción A: Desactivar el admin desde MongoDB

1. Conecta a MongoDB
2. Ejecuta:
```javascript
db.usuarios.updateOne(
  { email: "placam20@gmail.com" },
  { $set: { activo: false, rol: "empleado" } }
)
```

3. Luego usa `/api/auth/recrear-admin`

### Opción B: Eliminar todos los usuarios desde MongoDB

⚠️ **CUIDADO**: Esto elimina TODOS los usuarios

```javascript
db.usuarios.deleteMany({})
```

Luego usa `/api/auth/recrear-admin` para crear el admin.

---

## ✅ Verificación

Después de recrear el admin, prueba iniciar sesión:

```
POST https://stock-back-laly.vercel.app/api/auth/login
Body: {
  "email": "placam20@gmail.com",
  "password": "nueva_password_segura123"
}
```

Deberías recibir un token y poder acceder al sistema.

---

## 🆘 Solución de Problemas

### Error 403: "Ya existe un admin activo"
- Necesitas desactivar o eliminar el admin existente primero
- Usa MongoDB o espera a que el código de detección de texto plano funcione

### Error 400: "Email y contraseña son requeridos"
- Verifica que el body tenga `email` y `password`

### Error 400: "La contraseña debe tener al menos 6 caracteres"
- Usa una contraseña de al menos 6 caracteres

---

## 📋 Checklist Rápido

- [ ] Intentar login con contraseña en texto plano (si el fix ya está desplegado)
- [ ] Si no funciona, usar `POST /api/auth/recrear-admin`
- [ ] Verificar login con la nueva contraseña
- [ ] Si sigue sin funcionar, desactivar admin desde MongoDB y luego recrear
