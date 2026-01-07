# 🚀 Guía de Integración Completa - Frontend y Backend

Esta guía explica cómo configurar y ejecutar el proyecto completo con frontend y backend integrados.

## 📋 Estructura del Proyecto

```
back-stock/
├── server/              # Backend (Node.js + Express + MongoDB)
│   ├── config/          # Configuración de base de datos
│   ├── controllers/     # Controladores de la API
│   ├── models/          # Modelos de MongoDB
│   ├── routes/          # Rutas de la API
│   ├── middleware/      # Middleware (autenticación, etc.)
│   └── server.js        # Archivo principal del servidor
├── src/                 # Frontend (React + Vite)
│   ├── components/      # Componentes React
│   ├── context/         # Context API (AuthContext)
│   ├── features/        # Páginas principales
│   ├── lib/             # Utilidades (apiClient)
│   ├── services/        # Servicios de API
│   └── utils/           # Utilidades generales
└── package.json         # Dependencias del frontend
```

---

## 🔧 Paso 1: Configurar el Backend

### 1.1. Navegar a la carpeta del backend

```bash
cd c:\Users\Usuario\Desktop\copia\back-stock\server
```

### 1.2. Instalar dependencias

```bash
npm install
```

### 1.3. Crear archivo `.env` en `server/`

Copia el archivo `config/env.example.txt` como `.env` y configura:

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/stock-db
# O si usas MongoDB Atlas:
# MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/stock-db

JWT_SECRET=tu_secreto_super_seguro_aqui
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

### 1.4. Iniciar MongoDB

Asegúrate de que MongoDB esté corriendo:

```bash
# Si MongoDB está instalado localmente:
mongod

# O si usas MongoDB como servicio de Windows, simplemente verifica que esté corriendo
```

### 1.5. Iniciar el backend

```bash
npm run dev
```

El servidor debería iniciar en `http://localhost:3000`

### 1.6. Verificar que funciona

Abre tu navegador o Postman y visita: `http://localhost:3000/api/health`

Deberías ver:
```json
{
  "success": true,
  "message": "API funcionando correctamente",
  "timestamp": "..."
}
```

---

## 🎨 Paso 2: Configurar el Frontend

### 2.1. Navegar a la carpeta raíz del proyecto

```bash
cd c:\Users\Usuario\Desktop\copia\back-stock
```

### 2.2. Instalar dependencias del frontend

```bash
npm install
```

### 2.3. Crear archivo `.env` en la raíz del proyecto

Crea un archivo `.env` con:

```env
VITE_API_URL=http://localhost:3000/api
```

**Nota:** Si el archivo `.env` está bloqueado por `.gitignore`, puedes crear manualmente el archivo `.env` en la raíz del proyecto.

### 2.4. Iniciar el frontend

```bash
npm run dev
```

El frontend debería iniciar en `http://localhost:5173`

---

## 🧪 Paso 3: Probar la Integración

### 3.1. Abrir la aplicación

1. Abre tu navegador en `http://localhost:5173`
2. Deberías ver la página de login

### 3.2. Crear un usuario

1. Ingresa cualquier email y contraseña
2. El sistema creará automáticamente el usuario en el backend
3. Serás redirigido al dashboard

### 3.3. Probar funcionalidades

- **Productos**: Agrega un producto → Debe guardarse en MongoDB
- **Ventas**: Crea una venta → Debe guardarse y descontar stock automáticamente
- **Cuentas Corrientes**: Crea una cuenta corriente → Debe guardarse en MongoDB
- **Notas de Crédito**: Crea una nota de crédito → Debe guardarse y devolver stock automáticamente
- **Presupuestos**: Crea un presupuesto → Debe guardarse sin descontar stock

---

## 📡 Probar con Postman

### Configuración Inicial

1. **Crear una colección** en Postman llamada "Stock API"

2. **Configurar Variable de Entorno**:
   - Crea un entorno llamado "Local"
   - Agrega variable `base_url` = `http://localhost:3000/api`
   - Agrega variable `token` = (se llenará después del login)

### Endpoints Principales

#### 1. Health Check (No requiere autenticación)
```
GET {{base_url}}/health
```

#### 2. Registrar Usuario
```
POST {{base_url}}/auth/registro
Body (JSON):
{
  "nombre": "Juan Pérez",
  "email": "juan@example.com",
  "password": "123456",
  "rol": "empleado"
}
```

#### 3. Login
```
POST {{base_url}}/auth/login
Body (JSON):
{
  "email": "juan@example.com",
  "password": "123456"
}
```

**Importante:** Copia el `token` del response y guárdalo en la variable `token` del entorno.

#### 4. Obtener Usuario Actual
```
GET {{base_url}}/auth/me
Headers:
  Authorization: Bearer {{token}}
```

#### 5. Crear Producto
```
POST {{base_url}}/productos
Headers:
  Authorization: Bearer {{token}}
Body (JSON):
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

#### 6. Listar Productos
```
GET {{base_url}}/productos
Headers:
  Authorization: Bearer {{token}}
```

#### 7. Crear Venta
```
POST {{base_url}}/ventas
Headers:
  Authorization: Bearer {{token}}
Body (JSON):
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

#### 8. Crear Cuenta Corriente
```
POST {{base_url}}/cuentas-corrientes
Headers:
  Authorization: Bearer {{token}}
Body (JSON):
{
  "cliente": "Cliente Ejemplo",
  "telefono": "123456789",
  "direccion": "Dirección ejemplo"
}
```

#### 9. Registrar Movimiento en Cuenta Corriente
```
POST {{base_url}}/cuentas-corrientes/:id/movimientos
Headers:
  Authorization: Bearer {{token}}
Body (JSON):
{
  "tipo": "cargo",
  "monto": 1000,
  "concepto": "Venta a cuenta corriente",
  "descuento": 10,
  "items": [
    {
      "id": "producto_id",
      "nombre": "Producto",
      "precio_venta": 100,
      "cantidad": 1
    }
  ],
  "numeroFactura": 1
}
```

#### 10. Crear Nota de Crédito
```
POST {{base_url}}/notas-credito
Headers:
  Authorization: Bearer {{token}}
Body (JSON):
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
  "observaciones": "Observaciones adicionales"
}
```

Para más endpoints, consulta `ENDPOINTS_POSTMAN.md`

---

## 🔐 Autenticación

El sistema usa **JWT (JSON Web Tokens)**:

1. Al hacer login, el backend devuelve un token
2. El token se guarda automáticamente en localStorage del frontend
3. Todas las peticiones incluyen el token en el header `Authorization: Bearer <token>`
4. El backend valida el token y obtiene el `user_id` automáticamente

---

## 🛠️ Scripts Disponibles

### Backend (en `server/`)
```bash
npm run dev      # Iniciar en modo desarrollo (con nodemon)
npm start        # Iniciar servidor
npm run prod     # Iniciar en modo producción
npm run crear-admin  # Crear usuario administrador
```

### Frontend (en raíz)
```bash
npm run dev      # Iniciar servidor de desarrollo
npm run build    # Construir para producción
npm run preview  # Previsualizar build de producción
npm run lint     # Ejecutar linter
```

### Ambos (en raíz)
```bash
npm start        # Iniciar solo el backend
npm run start:server  # Iniciar solo el backend
npm run start:prod    # Iniciar backend en producción
```

---

## ⚠️ Solución de Problemas

### Error: "Cannot connect to backend"

**Causa**: El backend no está corriendo o la URL es incorrecta.

**Solución**:
1. Verifica que el backend esté corriendo: `http://localhost:3000/api/health`
2. Verifica la variable `VITE_API_URL` en `.env` del frontend
3. Reinicia el servidor de desarrollo del frontend

### Error: "Token no válido"

**Causa**: El token expiró o es inválido.

**Solución**:
1. Cierra sesión y vuelve a iniciar sesión
2. Verifica que el token se esté guardando en localStorage
3. Verifica que el header `Authorization` se esté enviando correctamente

### Error: "MongoDB connection failed"

**Causa**: MongoDB no está corriendo o la URI es incorrecta.

**Solución**:
1. Verifica que MongoDB esté corriendo
2. Verifica la variable `MONGODB_URI` en el `.env` del backend
3. Si usas Atlas, verifica que tu IP esté en la whitelist

### Los datos no se guardan en MongoDB

**Causa**: El backend no está disponible y está usando localStorage.

**Solución**:
1. Verifica que el backend esté corriendo
2. Revisa la consola del navegador para ver errores
3. Verifica los logs del backend

### Error de CORS

**Causa**: El frontend está intentando conectarse desde un puerto diferente.

**Solución**:
1. Verifica que `CORS_ORIGINS` en el `.env` del backend incluya el puerto del frontend
2. Si el frontend corre en un puerto diferente a 5173, agrégalo a `CORS_ORIGINS`

---

## 📝 Notas Importantes

1. **Datos existentes**: Los datos en localStorage NO se migran automáticamente a MongoDB. Necesitarás importarlos manualmente o crear un script de migración.

2. **Primera vez**: Al iniciar sesión por primera vez, se creará automáticamente un usuario en el backend.

3. **CORS**: El backend está configurado para aceptar peticiones desde `http://localhost:5173`. Si cambias el puerto del frontend, actualiza `CORS_ORIGINS` en el `.env` del backend.

4. **MongoDB**: Asegúrate de que MongoDB esté corriendo antes de iniciar el backend.

5. **Fallback**: Si el backend no está disponible, la aplicación seguirá funcionando con localStorage. Esto es útil para desarrollo pero en producción deberías asegurarte de que el backend siempre esté disponible.

---

## 🎯 Próximos Pasos

1. ✅ Backend configurado y funcionando
2. ✅ Frontend conectado al backend
3. ✅ Autenticación JWT implementada
4. ✅ Todos los servicios integrados
5. ⏳ Implementar sincronización de datos offline (opcional)
6. ⏳ Agregar migración automática de datos de localStorage a MongoDB (opcional)
7. ⏳ Implementar refresh token para tokens JWT (opcional)

---

## 📚 Documentación Adicional

- `ENDPOINTS_POSTMAN.md` - Documentación completa de endpoints para Postman
- `server/README.md` - Documentación del backend
- `server/CONFIGURACION_MONGODB.md` - Configuración de MongoDB
- `server/AUTENTICACION_ROLES.md` - Sistema de autenticación y roles




