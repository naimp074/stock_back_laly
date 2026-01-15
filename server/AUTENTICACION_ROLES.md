# 🔐 Sistema de Autenticación y Roles

## 📋 Roles Disponibles

### Admin
- ✅ Acceso completo a todas las funcionalidades
- ✅ Puede ver reportes y gráficos
- ✅ Puede gestionar usuarios (cambiar roles)
- ✅ Acceso a todas las rutas

### Empleado
- ✅ Puede gestionar productos (stock) - ver y cargar productos
- ✅ Puede gestionar ventas - crear, ver, editar y eliminar ventas
- ✅ Puede gestionar presupuestos - crear, ver, editar y eliminar presupuestos
- ✅ Puede gestionar cuentas corrientes - ver y gestionar cuentas corrientes
- ✅ Puede gestionar notas de crédito - crear, ver, editar y eliminar notas de crédito
- ✅ Puede usar prueba arca - acceder a funcionalidades de prueba arca
- ✅ **Todos los roles ven el mismo stock, ventas, presupuestos, cuentas corrientes, notas de crédito y prueba arca**
- ❌ **NO puede ver reportes ni gráficos**
- ❌ No puede gestionar usuarios

**Nota importante**: Todos los roles (admin y empleado) tienen acceso completo a las mismas funcionalidades de stock, ventas, presupuestos, cuentas corrientes, notas de crédito y prueba arca. La única diferencia es que solo el admin puede ver reportes y gestionar usuarios.

## 🚀 Endpoints de Autenticación

### Registro de Usuario
```http
POST /api/auth/registro
Content-Type: application/json

{
  "nombre": "Juan Pérez",
  "email": "juan@example.com",
  "password": "password123",
  "rol": "empleado"  // Opcional, por defecto es "empleado"
}
```

**Respuesta:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "nombre": "Juan Pérez",
    "email": "juan@example.com",
    "rol": "empleado"
  }
}
```

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "juan@example.com",
  "password": "password123"
}
```

**Respuesta:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "nombre": "Juan Pérez",
    "email": "juan@example.com",
    "rol": "empleado"
  }
}
```

### Obtener Usuario Actual
```http
GET /api/auth/me
Authorization: Bearer {token}
```

### Actualizar Perfil
```http
PUT /api/auth/perfil
Authorization: Bearer {token}
Content-Type: application/json

{
  "nombre": "Juan Pérez Actualizado",
  "email": "nuevo@example.com",
  "password": "nuevapassword123"  // Opcional
}
```

### Gestionar Usuarios (Solo Admin)
```http
GET /api/auth/usuarios
Authorization: Bearer {token_admin}
```

### Cambiar Rol de Usuario (Solo Admin)
```http
PUT /api/auth/usuarios/:id/rol
Authorization: Bearer {token_admin}
Content-Type: application/json

{
  "rol": "admin"  // o "empleado"
}
```

## 📊 Endpoints de Reportes (Solo Admin)

Todos los endpoints de reportes requieren autenticación y rol de admin:

### Estadísticas Generales
```http
GET /api/reportes/estadisticas
Authorization: Bearer {token_admin}
```

### Ventas por Período
```http
GET /api/reportes/ventas?inicio=2024-01-01&fin=2024-01-31
Authorization: Bearer {token_admin}
```

### Productos Más Vendidos
```http
GET /api/reportes/productos-mas-vendidos?limite=10
Authorization: Bearer {token_admin}
```

## 🔒 Uso del Token

Todas las rutas protegidas requieren el token JWT en el header:

```http
Authorization: Bearer {tu_token_aqui}
```

**Ejemplo con fetch:**
```javascript
const response = await fetch('http://localhost:3000/api/productos', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

## 📝 Notas Importantes

1. **Primer Usuario Admin**: Para crear el primer usuario admin, puedes:
   - Registrarte normalmente y luego usar MongoDB Compass o un script para cambiar el rol a "admin"
   - O crear un script de inicialización que cree un admin por defecto

2. **Seguridad**: 
   - Las contraseñas se hashean automáticamente con bcrypt
   - Los tokens expiran en 30 días
   - El token debe incluirse en todas las peticiones protegidas

3. **Rutas Protegidas**: 
   - Todas las rutas de productos (stock), ventas, presupuestos, cuentas corrientes, notas de crédito y prueba arca requieren solo autenticación (cualquier rol autenticado puede acceder)
   - Las rutas de reportes requieren además rol de admin
   - Las rutas de gestión de usuarios requieren rol de admin

4. **Igualdad de Acceso**: 
   - Todos los roles (admin y empleado) tienen acceso completo a las mismas funcionalidades de stock, ventas, presupuestos, cuentas corrientes, notas de crédito y prueba arca
   - Todos pueden ver y cargar el mismo stock
   - Todos pueden crear, editar y eliminar ventas, presupuestos, cuentas corrientes y notas de crédito
   - La única diferencia es que solo el admin puede ver reportes y gestionar usuarios

5. **Empleados y Reportes**: 
   - Si un empleado intenta acceder a `/api/reportes/*`, recibirá un error 403 (Forbidden)

## 🛠️ Crear Primer Admin Manualmente

Si necesitas crear el primer admin, puedes usar MongoDB Compass o este script:

```javascript
// En MongoDB Compass o en un script Node.js
db.usuarios.insertOne({
  nombre: "Admin",
  email: "admin@example.com",
  password: "$2a$10$...", // Hash bcrypt de tu password
  rol: "admin",
  activo: true,
  createdAt: new Date(),
  updatedAt: new Date()
});
```

O mejor aún, crea un script de inicialización en `server/scripts/crearAdmin.js`:

```javascript
import Usuario from '../models/Usuario.js';
import connectDB from '../config/database.js';
import dotenv from 'dotenv';

dotenv.config();
connectDB();

const crearAdmin = async () => {
  try {
    const admin = await Usuario.create({
      nombre: 'Administrador',
      email: 'admin@example.com',
      password: 'admin123', // Se hasheará automáticamente
      rol: 'admin'
    });
    
    console.log('✅ Admin creado:', admin);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

crearAdmin();
```








