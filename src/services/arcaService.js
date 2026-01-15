/**
 * Servicio para integración con AFIP SDK
 * API de Facturación Electrónica Argentina
 * 
 * Documentación: https://afipsdk.com
 * SDK: @afipsdk/afip.js
 * 
 * NOTA: Este servicio usa el backend para mayor seguridad.
 * Los certificados y credenciales de AFIP están configurados en el servidor.
 */

import api from '../lib/apiClient';

/**
 * Crear una factura electrónica usando AFIP SDK
 * @param {Object} datosFactura - Datos de la factura
 * @param {string} datosFactura.cliente - Nombre del cliente
 * @param {string} datosFactura.cuit - CUIT del cliente (11 dígitos)
 * @param {string} datosFactura.direccion - Dirección del cliente
 * @param {Array} datosFactura.items - Array de items [{descripcion, cantidad, precio_unitario, alicuota_iva}]
 * @param {number} datosFactura.numeroFactura - Número de factura interno (opcional, se genera automáticamente si no se especifica)
 * @param {string} datosFactura.tipoComprobante - Tipo: 'FACTURA_A', 'FACTURA_B', 'FACTURA_C', 'NOTA_CREDITO_A', etc.
 * @param {number} datosFactura.puntoVenta - Punto de venta (por defecto 1)
 * @returns {Promise<Object>} Respuesta de AFIP con el comprobante generado (CAE, número, etc.)
 */
export async function crearFacturaArca(datosFactura) {
  try {
    // Preparar los datos para enviar al backend
    const datosParaBackend = {
      cliente: datosFactura.cliente || 'Consumidor Final',
      cuit: datosFactura.cuit || '20111111111',
      direccion: datosFactura.direccion || '',
      email: datosFactura.email || '',
      telefono: datosFactura.telefono || '',
      items: datosFactura.items || [],
      numeroFactura: datosFactura.numeroFactura || null,
      tipoComprobante: datosFactura.tipoComprobante || 'FACTURA_B',
      puntoVenta: datosFactura.puntoVenta || 1,
      fecha: datosFactura.fecha || new Date().toISOString().split('T')[0],
      fechaVencimiento: datosFactura.fechaVencimiento || null,
      observaciones: datosFactura.observaciones || `Factura Nº ${datosFactura.numeroFactura || ''}`,
      condicionIva: datosFactura.condicionIva || 'CONSUMIDOR_FINAL'
    };

    // Llamar al backend que se encarga de comunicarse con AFIP SDK
    const response = await api.post('/arca/comprobantes', datosParaBackend);

    if (!response.success) {
      throw new Error(response.message || 'Error al crear factura en AFIP');
    }

    // Retornar en el formato esperado por el código existente
    return {
      success: true,
      comprobante: response.data.comprobante,
      cae: response.data.cae,
      numero_comprobante: response.data.numero_comprobante,
      punto_venta: response.data.punto_venta,
      fecha_vencimiento_cae: response.data.fecha_vencimiento_cae || response.data.cae_fch_vto,
      pdf_url: response.data.pdf_url, // Puede ser null si AFIP no proporciona URL directa
      qr_url: response.data.qr_url // Puede ser null si AFIP no proporciona QR directo
    };

  } catch (error) {
    console.error('Error al crear factura en AFIP:', error);
    throw error;
  }
}

/**
 * Obtener el estado de un comprobante en AFIP
 * @param {number} puntoVenta - Punto de venta
 * @param {number} numeroComprobante - Número de comprobante
 * @param {string} tipoComprobante - Tipo de comprobante ('FACTURA_A', 'FACTURA_B', etc.)
 * @returns {Promise<Object>} Estado del comprobante desde AFIP
 */
export async function obtenerEstadoComprobante(puntoVenta, numeroComprobante, tipoComprobante) {
  try {
    // Llamar al backend que se encarga de comunicarse con AFIP SDK
    const response = await api.get(`/arca/comprobantes/${puntoVenta}/${numeroComprobante}/${tipoComprobante}`);

    if (!response.success) {
      throw new Error(response.message || 'Error al obtener estado del comprobante');
    }

    return response.data;
  } catch (error) {
    console.error('Error al obtener estado del comprobante:', error);
    throw error;
  }
}

/**
 * Descargar el PDF de un comprobante
 * @param {string} pdfUrl - URL del PDF (si está disponible)
 * @returns {Promise<Blob>} Archivo PDF
 * 
 * NOTA: AFIP SDK no proporciona URLs directas de PDF.
 * Deberás generar el PDF localmente usando los datos del comprobante.
 */
export async function descargarPDFComprobante(pdfUrl) {
  try {
    if (!pdfUrl) {
      throw new Error('URL del PDF no disponible. AFIP SDK no proporciona URLs directas.');
    }
    
    // Descargar directamente desde la URL si está disponible
    const respuesta = await fetch(pdfUrl);

    if (!respuesta.ok) {
      throw new Error('Error al descargar PDF');
    }

    return await respuesta.blob();
  } catch (error) {
    console.error('Error al descargar PDF:', error);
    throw error;
  }
}

/**
 * Verificar si AFIP SDK está configurado en el backend
 * @returns {Promise<Object>} Estado de la configuración (CUIT, certificados, ambiente)
 */
export async function verificarConfiguracionArca() {
  try {
    const response = await api.get('/arca/config');
    return response.data;
  } catch (error) {
    console.error('Error al verificar configuración de AFIP:', error);
    throw error;
  }
}

/**
 * Convertir una venta local a formato AFIP
 * @param {Object} venta - Venta del sistema local
 * @param {Object} opciones - Opciones adicionales
 * @returns {Object} Datos formateados para AFIP SDK
 */
export function convertirVentaAArca(venta, opciones = {}) {
  return {
    cliente: venta.cliente || 'Consumidor Final',
    cuit: opciones.cuit || '20111111111',
    direccion: venta.direccionCliente || opciones.direccion || '',
    email: opciones.email || '',
    telefono: opciones.telefono || '',
    items: (venta.items || []).map(item => ({
      descripcion: item.nombre,
      cantidad: Number(item.cantidad) || 1,
      precio_unitario: Number(item.precio_venta) || 0,
      alicuota_iva: opciones.alicuotaIva || 21,
      unidad_medida: 'UNIDAD'
    })),
    numeroFactura: venta.numero_factura || venta.numeroFactura,
    tipoComprobante: opciones.tipoComprobante || 'FACTURA_B',
    puntoVenta: opciones.puntoVenta || 1,
    fecha: venta.fecha ? new Date(venta.fecha).toISOString().split('T')[0] : undefined,
    observaciones: opciones.observaciones || `Factura Nº ${venta.numero_factura || venta.numeroFactura}`
  };
}
