# 🔄 Cómo Borrar y Recrear el Admin desde Postman

Guía simple para eliminar el usuario admin y crear uno nuevo con una contraseña diferente.

## ⚠️ IMPORTANTE

**Si eliminas el único admin, necesitarás crear uno nuevo para poder gestionar usuarios.**

---

## 📋 Paso a Paso

### Paso 1: Obtener Token de Admin

Primero necesitas estar logueado como admin:

**Request:**
```
POST https://stock-back-laly.vercel.app/api/auth/login
```

**Body (raw JSON):**
```json
{
  "email": "admin@example.com",
  "password": "tu_password_actual"
}
```

**Respuesta:** Copia el `token` de la respuesta.

---

### Paso 2: Obtener ID del Admin

Necesitas el ID del usuario admin que quieres eliminar:

**Request:**
```
GET https://stock-back-laly.vercel.app/api/auth/usuarios
```

**Headers:**
```
Authorization: Bearer {tu_token}
```

**Respuesta:** Busca el usuario con `"rol": "admin"` y copia su `_id`.

Ejemplo:
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",  ← Copia este ID
      "nombre": "Administrador",
      "email": "admin@example.com",
      "rol": "admin"
    }
  ]
}
```

---

### Paso 3: Eliminar el Admin

**Request:**
```
DELETE https://stock-back-laly.vercel.app/api/auth/usuarios/{id_del_admin}
```

**Headers:**
```
Authorization: Bearer {tu_token}
```

**Ejemplo completo:**
```
DELETE https://stock-back-laly.vercel.app/api/auth/usuarios/507f1f77bcf86cd799439011
```

**Respuesta exitosa:**
```json
{
  "success": true,
  "message": "Usuario eliminado correctamente",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "nombre": "Administrador",
    "email": "admin@example.com",
    "rol": "admin"
  }
}
```

---

### Paso 4: Crear Nuevo Admin

Ahora crea un nuevo usuario admin con la contraseña que quieras:

**Request:**
```
POST https://stock-back-laly.vercel.app/api/auth/registro
```

**Body (raw JSON):**
```json
{
  "nombre": "Administrador",
  "email": "admin@example.com",
  "password": "nueva_password123",
  "rol": "admin"
}
```

**Respuesta exitosa:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "data": {
    "id": "...",
    "nombre": "Administrador",
    "email": "admin@example.com",
    "rol": "admin"
  }
}
```

---

## 📝 Ejemplo Completo en Postman

### 1. Login (obtener token)
- **Método:** `POST`
- **URL:** `https://stock-back-laly.vercel.app/api/auth/login`
- **Body:**
```json
{
  "email": "admin@example.com",
  "password": "password_actual"
}
```
- **Copia el token**

### 2. Listar usuarios (obtener ID)
- **Método:** `GET`
- **URL:** `https://stock-back-laly.vercel.app/api/auth/usuarios`
- **Headers:** `Authorization: Bearer {token}`
- **Copia el `_id` del admin**

### 3. Eliminar admin
- **Método:** `DELETE`
- **URL:** `https://stock-back-laly.vercel.app/api/auth/usuarios/{id_admin}`
- **Headers:** `Authorization: Bearer {token}`

### 4. Crear nuevo admin
- **Método:** `POST`
- **URL:** `https://stock-back-laly.vercel.app/api/auth/registro`
- **Body:**
```json
{
  "nombre": "Administrador",
  "email": "admin@example.com",
  "password": "nueva_password_segura123",
  "rol": "admin"
}
```

---

## ⚠️ Notas Importantes

1. **No puedes eliminarte a ti mismo** - Si eres el único admin, necesitarás usar otro método (ver abajo)

2. **Si eres el único admin** y quieres cambiar tu contraseña:
   - Usa el endpoint `/api/auth/usuarios/{id}/password` (si está disponible)
   - O crea otro admin primero, luego elimina el anterior

3. **El email puede ser el mismo** - Puedes crear un nuevo admin con el mismo email después de eliminar el anterior

4. **La contraseña debe tener mínimo 6 caracteres**

---

## 🔄 Alternativa: Si eres el único admin

Si eres el único admin y no puedes eliminarte a ti mismo:

### Opción A: Crear otro admin primero
1. Crea un nuevo admin con otro email
2. Luego elimina el admin anterior usando el nuevo admin

### Opción B: Cambiar contraseña directamente
Usa el endpoint para cambiar contraseña (si está disponible):
```
PUT https://stock-back-laly.vercel.app/api/auth/usuarios/{tu_id}/password
Headers: Authorization: Bearer {tu_token}
Body: {
  "password": "nueva_password123"
}
```

---

## ✅ Verificación

Después de crear el nuevo admin, prueba iniciar sesión:

```
POST https://stock-back-laly.vercel.app/api/auth/login
Body: {
  "email": "admin@example.com",
  "password": "nueva_password123"
}
```

Deberías recibir un token y poder acceder al sistema.

---

## 🆘 Solución de Problemas

### Error 400: "No puedes eliminar tu propio usuario"
- Crea otro admin primero con otro email
- Luego elimina el admin anterior

### Error 404: "Usuario no encontrado"
- Verifica que el ID sea correcto
- Usa `GET /api/auth/usuarios` para obtener los IDs válidos

### Error 401: "No autorizado"
- Verifica que el token sea correcto
- Asegúrate de que el header sea `Authorization: Bearer {token}`

### Error 403: "No tiene acceso"
- Solo los usuarios con rol `admin` pueden eliminar usuarios
- Verifica que tu usuario tenga rol `admin`
