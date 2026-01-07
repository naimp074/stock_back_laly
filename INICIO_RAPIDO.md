# 🚀 Inicio Rápido - Sistema de Gestión de Stock

## ⚡ Inicio en 5 Pasos

### 1. Configurar Backend

```bash
cd server
npm install
```

Crea archivo `server/.env`:
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/stock-db
JWT_SECRET=tu_secreto_super_seguro_aqui
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

### 2. Iniciar Backend

```bash
cd server
npm run dev
```

Verifica: http://localhost:3000/api/health

### 3. Configurar Frontend

```bash
# Desde la raíz del proyecto
npm install
```

Crea archivo `.env` en la raíz:
```env
VITE_API_URL=http://localhost:3000/api
```

### 4. Iniciar Frontend

```bash
# Desde la raíz del proyecto
npm run dev
```

Abre: http://localhost:5173

### 5. Probar

1. Inicia sesión con cualquier email/contraseña (se creará automáticamente)
2. Agrega un producto
3. Crea una venta
4. ¡Listo! Todo funciona con MongoDB

---

## 📋 Comandos Útiles

### Backend
```bash
cd server
npm run dev      # Desarrollo (con auto-reload)
npm start        # Producción
npm run crear-admin  # Crear usuario admin
```

### Frontend
```bash
npm run dev      # Desarrollo
npm run build    # Build para producción
npm run preview  # Previsualizar build
```

---

## 🧪 Probar con Postman

1. **Login**: `POST http://localhost:3000/api/auth/login`
   ```json
   {
     "email": "test@example.com",
     "password": "123456"
   }
   ```

2. **Copiar token** del response

3. **Usar token** en header:
   ```
   Authorization: Bearer {tu_token}
   ```

4. **Probar endpoints**:
   - `GET /api/productos` - Listar productos
   - `POST /api/productos` - Crear producto
   - `GET /api/ventas` - Listar ventas
   - `POST /api/ventas` - Crear venta

Ver `ENDPOINTS_POSTMAN.md` para más detalles.

---

## ⚠️ Requisitos

- Node.js (v18 o superior)
- MongoDB (local o Atlas)
- npm o yarn

---

## 📚 Documentación Completa

- `INTEGRACION_COMPLETA.md` - Guía completa de integración
- `ENDPOINTS_POSTMAN.md` - Todos los endpoints de la API
- `server/README.md` - Documentación del backend

---

## 🐛 Problemas Comunes

### Backend no inicia
- Verifica que MongoDB esté corriendo
- Verifica el archivo `.env` en `server/`

### Frontend no se conecta
- Verifica que el backend esté corriendo en puerto 3000
- Verifica el archivo `.env` en la raíz

### Error de CORS
- Verifica que `CORS_ORIGINS` en `server/.env` incluya `http://localhost:5173`

---

## ✅ Checklist de Verificación

- [ ] MongoDB corriendo
- [ ] Backend iniciado (puerto 3000)
- [ ] Frontend iniciado (puerto 5173)
- [ ] Archivo `.env` en `server/` configurado
- [ ] Archivo `.env` en raíz configurado
- [ ] Health check funciona: http://localhost:3000/api/health
- [ ] Frontend carga: http://localhost:5173
- [ ] Login funciona
- [ ] Productos se guardan en MongoDB

---

¡Todo listo! 🎉




