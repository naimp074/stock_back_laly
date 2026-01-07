/**
 * Controlador para integración con Arca (TusFacturasAPP)
 * API de Facturación Electrónica Argentina
 */

// Configuración de Arca desde variables de entorno
const ARCA_API_URL = process.env.ARCA_API_URL || 'https://api.tusfacturas.app/v1';
const ARCA_API_KEY = process.env.ARCA_API_KEY || '';
const ARCA_API_TOKEN = process.env.ARCA_API_TOKEN || '';
const ARCA_USER_TOKEN = process.env.ARCA_USER_TOKEN || '';

/**
 * @desc    Crear una factura electrónica en Arca
 * @route   POST /api/arca/comprobantes
 * @access  Private
 */
export const crearFacturaArca = async (req, res) => {
  try {
    // Validar que existan las credenciales
    if (!ARCA_API_KEY || !ARCA_API_TOKEN || !ARCA_USER_TOKEN) {
      return res.status(500).json({
        success: false,
        message: 'Credenciales de Arca no configuradas en el servidor. Verifica las variables de entorno.'
      });
    }

    const {
      cliente,
      cuit,
      direccion,
      email,
      telefono,
      items,
      numeroFactura,
      tipoComprobante,
      puntoVenta,
      fecha,
      fechaVencimiento,
      observaciones,
      condicionIva
    } = req.body;

    // Validar datos requeridos
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere al menos un item en la factura'
      });
    }

    // Preparar el cuerpo de la solicitud según la documentación de Arca
    const cuerpoFactura = {
      punto_venta: puntoVenta || 1,
      tipo_comprobante: tipoComprobante || 'FACTURA_B',
      cliente: {
        razon_social: cliente || 'Consumidor Final',
        cuit: cuit || '20111111111',
        condicion_iva: condicionIva || 'CONSUMIDOR_FINAL',
        domicilio: direccion || '',
        email: email || '',
        telefono: telefono || ''
      },
      items: items.map(item => ({
        descripcion: item.descripcion || item.nombre,
        cantidad: Number(item.cantidad) || 1,
        precio_unitario: Number(item.precio_unitario || item.precio_venta) || 0,
        alicuota_iva: Number(item.alicuota_iva) || 21,
        unidad_medida: item.unidad_medida || 'UNIDAD'
      })),
      fecha_emision: fecha || new Date().toISOString().split('T')[0],
      fecha_vencimiento_pago: fechaVencimiento || null,
      observaciones: observaciones || `Factura Nº ${numeroFactura || ''}`,
      numero_factura_interno: numeroFactura || null
    };

    // Realizar la petición POST a Arca
    const respuesta = await fetch(`${ARCA_API_URL}/comprobantes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': ARCA_API_KEY,
        'X-API-TOKEN': ARCA_API_TOKEN,
        'X-USER-TOKEN': ARCA_USER_TOKEN
      },
      body: JSON.stringify(cuerpoFactura)
    });

    // Verificar si la respuesta es exitosa
    if (!respuesta.ok) {
      const errorData = await respuesta.json().catch(() => ({}));
      return res.status(respuesta.status).json({
        success: false,
        message: errorData.message || `Error al crear factura en Arca: ${respuesta.status} ${respuesta.statusText}`,
        error: errorData
      });
    }

    const resultado = await respuesta.json();

    res.status(201).json({
      success: true,
      data: {
        cae: resultado.cae,
        numero_comprobante: resultado.numero_comprobante,
        punto_venta: resultado.punto_venta,
        fecha_vencimiento_cae: resultado.fecha_vencimiento_cae,
        pdf_url: resultado.pdf_url,
        qr_url: resultado.qr_url,
        comprobante: resultado
      }
    });

  } catch (error) {
    console.error('Error al crear factura en Arca:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear factura en Arca',
      error: error.message
    });
  }
};

/**
 * @desc    Obtener el estado de un comprobante en Arca
 * @route   GET /api/arca/comprobantes/:puntoVenta/:numeroComprobante/:tipoComprobante
 * @access  Private
 */
export const obtenerEstadoComprobante = async (req, res) => {
  try {
    const { puntoVenta, numeroComprobante, tipoComprobante } = req.params;

    if (!ARCA_API_KEY || !ARCA_API_TOKEN || !ARCA_USER_TOKEN) {
      return res.status(500).json({
        success: false,
        message: 'Credenciales de Arca no configuradas'
      });
    }

    const respuesta = await fetch(
      `${ARCA_API_URL}/comprobantes/${puntoVenta}/${numeroComprobante}/${tipoComprobante}`,
      {
        method: 'GET',
        headers: {
          'X-API-KEY': ARCA_API_KEY,
          'X-API-TOKEN': ARCA_API_TOKEN,
          'X-USER-TOKEN': ARCA_USER_TOKEN
        }
      }
    );

    if (!respuesta.ok) {
      return res.status(respuesta.status).json({
        success: false,
        message: `Error al obtener estado: ${respuesta.status}`
      });
    }

    const resultado = await respuesta.json();

    res.status(200).json({
      success: true,
      data: resultado
    });

  } catch (error) {
    console.error('Error al obtener estado del comprobante:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estado del comprobante',
      error: error.message
    });
  }
};

/**
 * @desc    Verificar configuración de Arca
 * @route   GET /api/arca/config
 * @access  Private
 */
export const verificarConfiguracion = async (req, res) => {
  try {
    const configurado = !!(ARCA_API_KEY && ARCA_API_TOKEN && ARCA_USER_TOKEN);

    res.status(200).json({
      success: true,
      data: {
        configurado,
        tiene_api_key: !!ARCA_API_KEY,
        tiene_api_token: !!ARCA_API_TOKEN,
        tiene_user_token: !!ARCA_USER_TOKEN,
        api_url: ARCA_API_URL
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al verificar configuración',
      error: error.message
    });
  }
};






