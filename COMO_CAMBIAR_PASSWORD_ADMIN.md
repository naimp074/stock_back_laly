# 🔐 Cómo Cambiar la Contraseña del Admin

Este documento explica las diferentes formas de cambiar la contraseña del admin (o cualquier usuario) desde Postman.

## 📋 Opciones Disponibles

Hay **2 formas** de cambiar la contraseña:

1. **Cambiar tu propia contraseña** (cualquier usuario autenticado)
2. **Cambiar la contraseña de cualquier usuario** (solo admin)

---

## 🔄 Opción 1: Cambiar Tu Propia Contraseña

Si eres el admin y quieres cambiar tu propia contraseña:

### Endpoint
```
PUT /api/auth/perfil
```

### Pasos en Postman

1. **Obtener tu token de autenticación:**
   - Método: `POST`
   - URL: `https://stock-back-laly.vercel.app/api/auth/login`
   - Body (raw JSON):
   ```json
   {
     "email": "admin@example.com",
     "password": "tu_password_actual"
   }
   ```
   - Copia el `token` de la respuesta

2. **Cambiar la contraseña:**
   - Método: `PUT`
   - URL: `https://stock-back-laly.vercel.app/api/auth/perfil`
   - Headers:
     - `Authorization`: `Bearer {tu_token}`
     - `Content-Type`: `application/json`
   - Body (raw JSON):
   ```json
   {
     "password": "nueva_password123"
   }
   ```

### Respuesta Exitosa
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "nombre": "Administrador",
    "email": "admin@example.com",
    "rol": "admin",
    "activo": true,
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

---

## 👑 Opción 2: Admin Cambia Contraseña de Cualquier Usuario

Si eres admin y quieres cambiar la contraseña de otro usuario (incluido otro admin):

### Endpoint
```
PUT /api/auth/usuarios/:id/password
```

### Pasos en Postman

1. **Obtener token de admin:**
   - Método: `POST`
   - URL: `https://stock-back-laly.vercel.app/api/auth/login`
   - Body (raw JSON):
   ```json
   {
     "email": "admin@example.com",
     "password": "tu_password_admin"
   }
   ```
   - Copia el `token` de la respuesta

2. **Obtener ID del usuario al que quieres cambiar la contraseña:**
   - Método: `GET`
   - URL: `https://stock-back-laly.vercel.app/api/auth/usuarios`
   - Headers:
     - `Authorization`: `Bearer {tu_token_admin}`
   - Busca el `_id` del usuario en la respuesta

3. **Cambiar la contraseña:**
   - Método: `PUT`
   - URL: `https://stock-back-laly.vercel.app/api/auth/usuarios/{id_usuario}/password`
   - Reemplaza `{id_usuario}` con el ID que copiaste
   - Headers:
     - `Authorization`: `Bearer {tu_token_admin}`
     - `Content-Type`: `application/json`
   - Body (raw JSON):
   ```json
   {
     "password": "nueva_password123"
   }
   ```

### Ejemplo Completo

Si el ID del admin es `507f1f77bcf86cd799439011`:

**URL:**
```
PUT https://stock-back-laly.vercel.app/api/auth/usuarios/507f1f77bcf86cd799439011/password
```

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

**Body:**
```json
{
  "password": "nueva_password_segura123"
}
```

### Respuesta Exitosa
```json
{
  "success": true,
  "message": "Contraseña actualizada correctamente",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "nombre": "Administrador",
    "email": "admin@example.com",
    "rol": "admin",
    "activo": true,
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

---

## 📝 Requisitos de Contraseña

- **Mínimo 6 caracteres**
- Puede contener letras, números y caracteres especiales
- Se hashea automáticamente con bcrypt antes de guardarse

---

## 🔍 Encontrar el ID del Admin

Si no sabes el ID del admin, puedes obtenerlo así:

1. **Método:** `GET`
2. **URL:** `https://stock-back-laly.vercel.app/api/auth/usuarios`
3. **Headers:**
   - `Authorization`: `Bearer {tu_token_admin}`
4. **Respuesta:** Busca el usuario con `"rol": "admin"` y copia su `_id`

Ejemplo de respuesta:
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "nombre": "Administrador",
      "email": "admin@example.com",
      "rol": "admin",
      "activo": true
    },
    {
      "_id": "507f1f77bcf86cd799439012",
      "nombre": "Empleado",
      "email": "empleado@example.com",
      "rol": "empleado",
      "activo": true
    }
  ]
}
```

---

## ⚠️ Notas Importantes

- **La contraseña se hashea automáticamente** - No necesitas hashearla manualmente
- **Solo admin puede cambiar contraseñas de otros usuarios** - Para cambiar tu propia contraseña, usa `/api/auth/perfil`
- **Los cambios son permanentes** - Asegúrate de recordar la nueva contraseña
- **Requiere autenticación** - Debes estar logueado para usar estos endpoints

---

## 🆘 Solución de Problemas

### Error 401 (No autorizado)
- Verifica que el token esté correcto
- Asegúrate de que el header sea `Authorization: Bearer {token}`

### Error 403 (Prohibido)
- Solo los usuarios con rol `admin` pueden cambiar contraseñas de otros usuarios
- Para cambiar tu propia contraseña, usa `/api/auth/perfil`

### Error 404 (Usuario no encontrado)
- Verifica que el ID del usuario sea correcto
- Usa `GET /api/auth/usuarios` para obtener los IDs válidos

### Error 400 (Contraseña inválida)
- La contraseña debe tener al menos 6 caracteres
- Verifica que el campo `password` esté en el body

---

## 📋 Checklist Rápido

### Para cambiar tu propia contraseña:
- [ ] Obtener token con `POST /api/auth/login`
- [ ] Usar `PUT /api/auth/perfil` con el token
- [ ] Enviar `{"password": "nueva_password"}` en el body

### Para cambiar contraseña de otro usuario (admin):
- [ ] Obtener token de admin con `POST /api/auth/login`
- [ ] Obtener ID del usuario con `GET /api/auth/usuarios`
- [ ] Usar `PUT /api/auth/usuarios/{id}/password` con el token de admin
- [ ] Enviar `{"password": "nueva_password"}` en el body
