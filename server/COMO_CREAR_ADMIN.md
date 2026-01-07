# 👤 Cómo Crear un Usuario Admin

Hay **3 formas** de crear un usuario admin en el sistema:

---

## 🚀 Método 1: Script Automático (RECOMENDADO)

El backend incluye un script que crea un admin automáticamente.

### Paso 1: Navegar a la carpeta del servidor
```bash
cd c:\Users\Usuario\Desktop\copia\back-stock\server
```

### Paso 2: Ejecutar el script
```bash
npm run crear-admin
```

Esto creará un admin con:
- **Email**: `admin@example.com`
- **Password**: `admin123`
- **Nombre**: `Administrador`

### Paso 3: Personalizar (Opcional)
Si quieres personalizar los datos, puedes pasar parámetros:
```bash
npm run crear-admin -- email@tudominio.com contraseña123 "Tu Nombre"
```

O ejecutar directamente:
```bash
node scripts/crearAdmin.js email@tudominio.com contraseña123 "Tu Nombre"
```

**Ejemplo:**
```bash
node scripts/crearAdmin.js admin@miempresa.com Admin2024 "Juan Admin"
```

---

## 🔧 Método 2: Desde Postman o el Frontend

### Opción A: Registrar usuario normal y luego cambiar el rol

1. **Registrar un usuario normal** (desde el frontend o Postman):
```http
POST http://localhost:3000/api/auth/registro
Content-Type: application/json

{
  "nombre": "Admin Usuario",
  "email": "admin@example.com",
  "password": "admin123"
}
```

2. **Iniciar sesión** para obtener el token:
```http
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "admin123"
}
```

3. **Obtener el ID del usuario** (necesitas ser admin o usar MongoDB):
```http
GET http://localhost:3000/api/auth/usuarios
Authorization: Bearer {token_de_admin_existente}
```

4. **Cambiar el rol a admin** (necesitas ser admin primero):
```http
PUT http://localhost:3000/api/auth/usuarios/{id_del_usuario}/rol
Authorization: Bearer {token_de_admin_existente}
Content-Type: application/json

{
  "rol": "admin"
}
```

**⚠️ Problema**: Este método requiere que ya tengas un admin para cambiar roles. Si es el primer usuario, usa el Método 1 o 3.

---

## 🗄️ Método 3: Directamente en MongoDB

Si tienes acceso a MongoDB (MongoDB Compass, mongo shell, etc.):

### Paso 1: Conectar a MongoDB
```bash
mongosh mongodb://localhost:27017/stock-db
```

### Paso 2: Crear el usuario admin
```javascript
use stock-db

db.usuarios.insertOne({
  nombre: "Administrador",
  email: "admin@example.com",
  password: "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy", // Hash de "admin123"
  rol: "admin",
  activo: true,
  createdAt: new Date(),
  updatedAt: new Date()
})
```

**⚠️ Nota**: El hash de la contraseña es complicado de generar manualmente. Es mejor usar el script del Método 1.

---

## ✅ Verificar que Funcionó

Después de crear el admin, prueba iniciar sesión:

### Desde Postman:
```http
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "admin123"
}
```

### Desde el Frontend:
1. Abre `http://localhost:5173`
2. Inicia sesión con el email y contraseña del admin
3. Deberías poder acceder a todas las funcionalidades, incluyendo reportes

### Verificar el rol:
```http
GET http://localhost:3000/api/auth/me
Authorization: Bearer {tu_token}
```

La respuesta debería incluir `"rol": "admin"`

---

## 🔐 Credenciales por Defecto (Script)

Si usas el script sin parámetros, las credenciales son:

- **Email**: `admin@example.com`
- **Password**: `admin123`
- **Nombre**: `Administrador`

**⚠️ IMPORTANTE**: Cambia estas credenciales en producción.

---

## 🛠️ Solución de Problemas

### Error: "Ya existe un usuario con ese email"
- El usuario ya existe. Usa otro email o elimina el usuario existente desde MongoDB.

### Error: "Cannot find module"
- Asegúrate de estar en la carpeta `server/` y haber ejecutado `npm install`.

### Error: "MongoDB connection failed"
- Verifica que MongoDB esté corriendo.
- Verifica la variable `MONGODB_URI` en el archivo `.env`.

---

## 📝 Notas Importantes

1. **Primer Admin**: Si es el primer usuario del sistema, usa el Método 1 (script).

2. **Seguridad**: 
   - Las contraseñas se hashean automáticamente con bcrypt
   - Cambia las credenciales por defecto en producción
   - No compartas las credenciales de admin

3. **Permisos**:
   - Los admins pueden ver reportes y gestionar usuarios
   - Los empleados NO pueden ver reportes ni cambiar roles

4. **Múltiples Admins**: Puedes crear tantos admins como necesites usando el script.






