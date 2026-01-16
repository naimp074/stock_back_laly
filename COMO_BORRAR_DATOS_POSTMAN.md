# 🗑️ Cómo Borrar Todos los Datos desde Postman

Este documento explica cómo usar los endpoints de limpieza para borrar todos los datos cargados en el sistema desde Postman.

## ⚠️ ADVERTENCIA

**Estos endpoints eliminan datos permanentemente. Úsalos con precaución.**

## 🔐 Requisitos Previos

1. **Obtener tu token de autenticación:**
   - Primero debes iniciar sesión para obtener tu token JWT
   - Endpoint: `POST /api/auth/login`
   - Copia el token de la respuesta

2. **Configurar el header de autorización en Postman:**
   - Ve a la pestaña "Headers"
   - Agrega: `Authorization` con valor `Bearer {tu_token}`

## 📊 Ver Estadísticas Antes de Borrar

Antes de borrar, puedes ver cuántos registros hay en cada colección:

**Endpoint:** `GET /api/limpieza/estadisticas`

**Headers:**
```
Authorization: Bearer {tu_token}
```

**Respuesta ejemplo:**
```json
{
  "success": true,
  "data": {
    "productos": 10,
    "ventas": 5,
    "presupuestos": 3,
    "notasCredito": 2,
    "movimientos": 8,
    "cuentasCorrientes": 2,
    "total": 30
  }
}
```

## 🗑️ Endpoints de Limpieza

### 1. Eliminar TODOS los Productos

**Endpoint:** `DELETE /api/limpieza/productos`

**Headers:**
```
Authorization: Bearer {tu_token}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Se eliminaron 10 productos",
  "deletedCount": 10
}
```

### 2. Eliminar TODAS las Ventas

**Endpoint:** `DELETE /api/limpieza/ventas`

**Headers:**
```
Authorization: Bearer {tu_token}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Se eliminaron 5 ventas",
  "deletedCount": 5
}
```

### 3. Eliminar TODOS los Presupuestos

**Endpoint:** `DELETE /api/limpieza/presupuestos`

**Headers:**
```
Authorization: Bearer {tu_token}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Se eliminaron 3 presupuestos",
  "deletedCount": 3
}
```

### 4. Eliminar TODAS las Cuentas Corrientes (y sus movimientos)

**Endpoint:** `DELETE /api/limpieza/cuentas-corrientes`

**Headers:**
```
Authorization: Bearer {tu_token}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Se eliminaron 2 cuentas corrientes y 8 movimientos",
  "deletedCount": {
    "cuentas": 2,
    "movimientos": 8
  }
}
```

### 5. Eliminar TODAS las Notas de Crédito

**Endpoint:** `DELETE /api/limpieza/notas-credito`

**Headers:**
```
Authorization: Bearer {tu_token}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Se eliminaron 2 notas de crédito",
  "deletedCount": 2
}
```

### 6. ⚡ Eliminar TODO (Recomendado)

Este endpoint elimina **TODAS** las colecciones de una vez (excepto usuarios):

**Endpoint:** `DELETE /api/limpieza/todo`

**Headers:**
```
Authorization: Bearer {tu_token}
```

**Respuesta:**
```json
{
  "success": true,
  "message": "Todos los datos han sido eliminados correctamente",
  "deletedCount": {
    "productos": 10,
    "ventas": 5,
    "presupuestos": 3,
    "notasCredito": 2,
    "movimientos": 8,
    "cuentasCorrientes": 2,
    "total": 30
  }
}
```

## 📝 Ejemplo Completo en Postman

### Paso 1: Obtener Token

1. **Método:** `POST`
2. **URL:** `http://localhost:3000/api/auth/login` (o tu URL de producción)
3. **Body (raw JSON):**
```json
{
  "email": "tu_email@example.com",
  "password": "tu_password"
}
```
4. **Respuesta:** Copia el `token` del campo `data.token` o directamente `token`

### Paso 2: Configurar Variables en Postman (Opcional pero Recomendado)

1. Ve a "Variables" en Postman
2. Crea una variable `base_url` con valor: `http://localhost:3000` (o tu URL)
3. Crea una variable `token` con tu token

### Paso 3: Ver Estadísticas

1. **Método:** `GET`
2. **URL:** `{{base_url}}/api/limpieza/estadisticas`
3. **Headers:**
   - `Authorization`: `Bearer {{token}}`

### Paso 4: Borrar Todo

1. **Método:** `DELETE`
2. **URL:** `{{base_url}}/api/limpieza/todo`
3. **Headers:**
   - `Authorization`: `Bearer {{token}}`
4. **Enviar** y esperar la respuesta

## 🔄 Orden Recomendado para Borrar Individualmente

Si prefieres borrar colección por colección, hazlo en este orden:

1. **Notas de Crédito** (pueden referenciar ventas)
2. **Cuentas Corrientes** (incluye movimientos)
3. **Ventas** (pueden referenciar productos)
4. **Presupuestos** (pueden referenciar productos)
5. **Productos** (último, ya que otros pueden referenciarlos)

O simplemente usa `/api/limpieza/todo` que lo hace todo automáticamente.

## ⚠️ Notas Importantes

- **Los usuarios NO se eliminan** - Solo se eliminan productos, ventas, presupuestos, cuentas corrientes y notas de crédito
- **Los datos eliminados NO se pueden recuperar** - Asegúrate de tener un backup si es necesario
- **Requiere autenticación** - Debes estar logueado para usar estos endpoints
- **Funciona en desarrollo y producción** - Usa con cuidado en producción

## 🚀 URLs Completas

### Desarrollo Local:
- Base URL: `http://localhost:3000`

### Producción (Vercel):
- Base URL: `https://tu-dominio.vercel.app`

Ejemplo completo:
```
DELETE https://tu-dominio.vercel.app/api/limpieza/todo
```

## 📋 Checklist Rápido

- [ ] Obtener token de autenticación
- [ ] Configurar header `Authorization: Bearer {token}`
- [ ] (Opcional) Ver estadísticas con `GET /api/limpieza/estadisticas`
- [ ] Borrar todo con `DELETE /api/limpieza/todo`
- [ ] Verificar que los datos fueron eliminados

## 🆘 Solución de Problemas

### Error 401 (No autorizado)
- Verifica que el token esté correcto
- Asegúrate de que el header sea `Authorization: Bearer {token}` (con espacio después de Bearer)

### Error 404 (No encontrado)
- Verifica que la URL sea correcta
- Asegúrate de que el servidor esté corriendo

### Error 500 (Error del servidor)
- Verifica que MongoDB esté conectado
- Revisa los logs del servidor para más detalles
