# Endpoints del Backend - Documentación para Postman

## Base URL
```
http://localhost:3000/api
```

## Autenticación
Todos los endpoints (excepto registro y login) requieren un token JWT en el header:
```
Authorization: Bearer <token>
```

---

## 🔐 Autenticación (`/api/auth`)

### POST `/api/auth/registro`
Registrar nuevo usuario
- **Body:**
```json
{
  "nombre": "Juan Pérez",
  "email": "juan@example.com",
  "password": "123456",
  "rol": "empleado" // opcional, por defecto "empleado"
}
```

### POST `/api/auth/login`
Iniciar sesión
- **Body:**
```json
{
  "email": "juan@example.com",
  "password": "123456"
}
```
- **Response:** Devuelve `token` que debes usar en los demás endpoints

### GET `/api/auth/me`
Obtener usuario actual (requiere token)

### PUT `/api/auth/perfil`
Actualizar perfil (requiere token)
- **Body:**
```json
{
  "nombre": "Juan Pérez Actualizado",
  "email": "nuevo@example.com",
  "password": "nueva123456" // opcional
}
```

### GET `/api/auth/usuarios`
Obtener todos los usuarios (solo admin)

### PUT `/api/auth/usuarios/:id/rol`
Actualizar rol de usuario (solo admin)
- **Body:**
```json
{
  "rol": "admin" // o "empleado"
}
```

---

## 📦 Productos (`/api/productos`)

**Todas las rutas requieren autenticación**

### GET `/api/productos`
Obtener todos los productos

### GET `/api/productos/:id`
Obtener un producto por ID

### POST `/api/productos`
Crear nuevo producto
- **Body:**
```json
{
  "nombre": "Producto Ejemplo",
  "precio_costo": 100,
  "precio_venta": 150,
  "cantidad": 50,
  "unidad": "unidad",
  "proveedor": "Proveedor XYZ",
  "telefono": "123456789",
  "categoria": "Categoría A",
  "stock_minimo": 10
}
```

### PUT `/api/productos/:id`
Actualizar producto
- **Body:** Mismos campos que crear, todos opcionales

### DELETE `/api/productos/:id`
Eliminar producto

### POST `/api/productos/importar`
Importar productos masivamente
- **Body:**
```json
{
  "productos": [
    {
      "nombre": "Producto 1",
      "precio_costo": 100,
      "precio_venta": 150,
      "cantidad": 10
    },
    {
      "nombre": "Producto 2",
      "precio_costo": 200,
      "precio_venta": 250,
      "cantidad": 20
    }
  ]
}
```

---

## 💰 Ventas (`/api/ventas`)

**Todas las rutas requieren autenticación**

### GET `/api/ventas`
Obtener todas las ventas
- **Query params:** `limit` (opcional, default: 50)

### GET `/api/ventas/:id`
Obtener una venta por ID

### POST `/api/ventas`
Crear nueva venta (descuenta stock automáticamente)
- **Body:**
```json
{
  "cliente": "Cliente Ejemplo",
  "numeroFactura": 1,
  "items": [
    {
      "id": "producto_id_aqui",
      "nombre": "Producto",
      "precio_venta": 150,
      "cantidad": 2
    }
  ]
}
```

### PUT `/api/ventas/:id`
Actualizar venta

### DELETE `/api/ventas/:id`
Eliminar venta

### GET `/api/ventas/siguiente-numero`
Obtener siguiente número de factura disponible

---

## 💳 Cuentas Corrientes (`/api/cuentas-corrientes`)

**Todas las rutas requieren autenticación**

### GET `/api/cuentas-corrientes`
Obtener todas las cuentas corrientes

### GET `/api/cuentas-corrientes/:id`
Obtener una cuenta corriente por ID

### POST `/api/cuentas-corrientes`
Crear nueva cuenta corriente
- **Body:**
```json
{
  "cliente": "Cliente Ejemplo",
  "telefono": "123456789",
  "direccion": "Dirección ejemplo"
}
```

### PUT `/api/cuentas-corrientes/:id`
Actualizar cuenta corriente

### DELETE `/api/cuentas-corrientes/:id`
Eliminar cuenta corriente

### GET `/api/cuentas-corrientes/:id/movimientos`
Obtener movimientos de una cuenta
- **Query params:** `limit` (opcional, default: 100)

### POST `/api/cuentas-corrientes/:id/movimientos`
Registrar movimiento (cargo o pago)
- **Body:**
```json
{
  "tipo": "cargo", // o "pago"
  "monto": 1000,
  "concepto": "Venta a cuenta corriente",
  "descuento": 10, // opcional, porcentaje
  "items": [ // opcional
    {
      "id": "producto_id",
      "nombre": "Producto",
      "precio_venta": 100,
      "cantidad": 1
    }
  ],
  "numeroFactura": 1 // opcional
}
```

### PUT `/api/cuentas-corrientes/movimientos/:id`
Actualizar movimiento

### DELETE `/api/cuentas-corrientes/movimientos/:id`
Eliminar movimiento

---

## 📄 Notas de Crédito (`/api/notas-credito`)

**Todas las rutas requieren autenticación**

### GET `/api/notas-credito`
Obtener todas las notas de crédito
- **Query params:** `limit` (opcional, default: 50)

### GET `/api/notas-credito/:id`
Obtener una nota de crédito por ID

### POST `/api/notas-credito`
Crear nueva nota de crédito (devuelve stock automáticamente)
- **Body:**
```json
{
  "cliente": "Cliente Ejemplo",
  "motivo": "Devolución por defecto",
  "items": [
    {
      "id": "producto_id_aqui",
      "nombre": "Producto",
      "precio_venta": 150,
      "cantidad": 1
    }
  ],
  "total": 150,
  "numero_factura_original": 1,
  "observaciones": "Observaciones adicionales",
  "venta_original_id": "venta_id_aqui" // opcional
}
```

### PUT `/api/notas-credito/:id`
Actualizar nota de crédito

### DELETE `/api/notas-credito/:id`
Eliminar nota de crédito

### GET `/api/notas-credito/ventas-disponibles`
Obtener ventas disponibles para crear nota de crédito
- **Query params:** `limit` (opcional, default: 100)

### GET `/api/notas-credito/estadisticas`
Obtener estadísticas de notas de crédito

---

## 📊 Reportes (`/api/reportes`)

**Todas las rutas requieren autenticación y rol admin**

### GET `/api/reportes/estadisticas`
Obtener estadísticas generales

### GET `/api/reportes/ventas`
Obtener ventas por período
- **Query params:** 
  - `inicio` (opcional, formato fecha)
  - `fin` (opcional, formato fecha)

### GET `/api/reportes/productos-mas-vendidos`
Obtener productos más vendidos
- **Query params:** `limite` (opcional, default: 10)

---

## 🔍 Health Check

### GET `/api/health`
Verificar que el servidor esté funcionando
- **No requiere autenticación**

---

## ⚠️ Notas Importantes

1. **Autenticación:** Después de hacer login, copia el `token` del response y úsalo en el header `Authorization: Bearer <token>` para todos los demás endpoints.

2. **Variables de Entorno:** El servidor necesita un archivo `.env` en la carpeta `server/` con:
   ```
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/stock-db
   JWT_SECRET=tu_secreto_super_seguro_aqui
   CORS_ORIGINS=http://localhost:5173,http://localhost:3000
   ```

3. **MongoDB:** Asegúrate de que MongoDB esté corriendo antes de iniciar el servidor.

4. **Errores comunes:**
   - 401: No autorizado (falta token o token inválido)
   - 403: Prohibido (no tienes permisos de admin)
   - 404: Recurso no encontrado
   - 500: Error del servidor






