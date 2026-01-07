# Backend API - Sistema de Gestión de Stock

Backend desarrollado con Node.js, Express y MongoDB para el sistema de gestión de stock.

## 🚀 Instalación

1. Instalar dependencias:
```bash
npm install
```

2. Configurar variables de entorno:
Crea un archivo `.env` en la carpeta `server/` con las siguientes variables:

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/stock-db
JWT_SECRET=tu_secreto_super_seguro_aqui
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

3. Asegúrate de tener MongoDB corriendo en tu sistema.

## 📦 Scripts

- `npm start` - Inicia el servidor en modo producción
- `npm run dev` - Inicia el servidor en modo desarrollo con nodemon

## 📡 Endpoints de la API

**⚠️ IMPORTANTE**: Todas las rutas (excepto `/api/auth/*` y `/api/health`) requieren autenticación con token JWT en el header:
```
Authorization: Bearer {tu_token}
```

### Productos
- `GET /api/productos` - Obtener todos los productos (requiere auth)
- `GET /api/productos/:id` - Obtener un producto (requiere auth)
- `POST /api/productos` - Crear un producto (requiere auth)
- `PUT /api/productos/:id` - Actualizar un producto (requiere auth)
- `DELETE /api/productos/:id` - Eliminar un producto (requiere auth)
- `POST /api/productos/importar` - Importación masiva de productos

### Ventas
- `GET /api/ventas?limit=50` - Obtener todas las ventas (requiere auth)
- `GET /api/ventas/:id` - Obtener una venta (requiere auth)
- `POST /api/ventas` - Crear una venta (descuenta stock automáticamente, requiere auth)
- `PUT /api/ventas/:id` - Actualizar una venta (requiere auth)
- `DELETE /api/ventas/:id` - Eliminar una venta (requiere auth)
- `GET /api/ventas/siguiente-numero` - Obtener siguiente número de factura (requiere auth)

### Cuentas Corrientes
- `GET /api/cuentas-corrientes` - Obtener todas las cuentas (requiere auth)
- `GET /api/cuentas-corrientes/:id` - Obtener una cuenta (requiere auth)
- `POST /api/cuentas-corrientes` - Crear una cuenta (requiere auth)
- `PUT /api/cuentas-corrientes/:id` - Actualizar una cuenta (requiere auth)
- `DELETE /api/cuentas-corrientes/:id` - Eliminar una cuenta (requiere auth)

### Movimientos de Cuenta Corriente
- `GET /api/cuentas-corrientes/:id/movimientos?limit=100` - Obtener movimientos (requiere auth)
- `POST /api/cuentas-corrientes/:id/movimientos` - Registrar movimiento (cargo/pago, requiere auth)
- `PUT /api/cuentas-corrientes/movimientos/:id` - Actualizar movimiento (requiere auth)
- `DELETE /api/cuentas-corrientes/movimientos/:id` - Eliminar movimiento (requiere auth)

### Notas de Crédito
- `GET /api/notas-credito?limit=50` - Obtener todas las notas (requiere auth)
- `GET /api/notas-credito/:id` - Obtener una nota (requiere auth)
- `POST /api/notas-credito` - Crear una nota (devuelve stock automáticamente, requiere auth)
- `PUT /api/notas-credito/:id` - Actualizar una nota (requiere auth)
- `DELETE /api/notas-credito/:id` - Eliminar una nota (requiere auth)
- `GET /api/notas-credito/ventas-disponibles` - Obtener ventas disponibles (requiere auth)
- `GET /api/notas-credito/estadisticas` - Obtener estadísticas (requiere auth)

### Reportes (Solo Admin)
- `GET /api/reportes/estadisticas` - Estadísticas generales (requiere auth + admin)
- `GET /api/reportes/ventas?inicio=2024-01-01&fin=2024-01-31` - Ventas por período (requiere auth + admin)
- `GET /api/reportes/productos-mas-vendidos?limite=10` - Productos más vendidos (requiere auth + admin)

### Health Check
- `GET /api/health` - Verificar estado del servidor

## 🔐 Autenticación y Roles

El sistema ahora incluye autenticación JWT con dos roles:

- **Admin**: Acceso completo, incluyendo reportes y gráficos
- **Empleado**: Acceso a operaciones básicas, sin acceso a reportes

### Crear Primer Admin

```bash
npm run crear-admin
# O con parámetros personalizados:
npm run crear-admin -- admin@tudominio.com password123 "Nombre Admin"
```

### Endpoints de Autenticación

- `POST /api/auth/registro` - Registrar nuevo usuario
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/auth/me` - Obtener usuario actual
- `PUT /api/auth/perfil` - Actualizar perfil
- `GET /api/auth/usuarios` - Listar usuarios (solo admin)
- `PUT /api/auth/usuarios/:id/rol` - Cambiar rol (solo admin)

Ver `AUTENTICACION_ROLES.md` para más detalles.

## 📝 Notas

- Todos los endpoints requieren `user_id` para filtrar datos por usuario
- Las ventas automáticamente descuentan el stock de los productos
- Las notas de crédito automáticamente devuelven el stock de los productos
- Los movimientos de cuenta corriente actualizan automáticamente el saldo de la cuenta

