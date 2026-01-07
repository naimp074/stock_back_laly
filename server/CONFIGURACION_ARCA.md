# Configuración de Arca (Facturación Electrónica)

## Variables de Entorno Necesarias

Agrega las siguientes variables a tu archivo `.env` en `c:\Users\Usuario\Desktop\copia\back-stock\server\.env`:

```env
# Configuración de Arca (TusFacturasAPP)
ARCA_API_URL=https://api.tusfacturas.app/v1
ARCA_API_KEY=tu_api_key_aqui
ARCA_API_TOKEN=tu_api_token_aqui
ARCA_USER_TOKEN=tu_user_token_aqui
```

## Cómo Obtener las Credenciales

1. **Regístrate en TusFacturasAPP**: https://tusfacturas.app
2. **Crea un punto de venta** en tu cuenta
3. **Ve a la sección API** del punto de venta
4. **Copia las credenciales**:
   - API Key
   - API Token
   - User Token

## Ejemplo de .env Completo

```env
# Puerto del servidor
PORT=3000

# MongoDB Connection String
MONGODB_URI=mongodb+srv://naimpaz274_db_user:xsjmqJw4s0tT2mDA@cluster0.c4xqe3a.mongodb.net/?appName=Cluster0

# JWT Secret
JWT_SECRET=tu_secreto_super_seguro_aqui_cambiar_en_produccion

# CORS Origins
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# Configuración de Arca (TusFacturasAPP)
ARCA_API_URL=https://api.tusfacturas.app/v1
ARCA_API_KEY=tu_api_key_aqui
ARCA_API_TOKEN=tu_api_token_aqui
ARCA_USER_TOKEN=tu_user_token_aqui
```

## Endpoints Disponibles

Una vez configurado, tendrás acceso a estos endpoints:

- `GET /api/arca/config` - Verificar configuración de Arca
- `POST /api/arca/comprobantes` - Crear factura electrónica
- `GET /api/arca/comprobantes/:puntoVenta/:numeroComprobante/:tipoComprobante` - Obtener estado de comprobante

## Notas Importantes

- ⚠️ **Nunca subas el archivo `.env` a Git**
- ✅ Las credenciales están seguras en el servidor
- ✅ El frontend ya no necesita las credenciales de Arca
- ✅ Todas las llamadas a Arca pasan por el backend

## Verificar Configuración

Puedes verificar que Arca esté configurado correctamente haciendo una petición GET a:

```
GET http://localhost:3000/api/arca/config
```

Deberías recibir una respuesta indicando si las credenciales están configuradas.






