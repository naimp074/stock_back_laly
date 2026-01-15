/**
 * Controlador para integración con AFIP SDK
 * API de Facturación Electrónica Argentina
 * 
 * Documentación oficial: https://afipsdk.com
 * SDK: @afipsdk/afip.js
 */

import Afip from '@afipsdk/afip.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Variables de entorno para AFIP SDK
const AFIP_CUIT = process.env.AFIP_CUIT;
const AFIP_CERT_PATH = process.env.AFIP_CERT_PATH || path.join(__dirname, '../cert.pem');
const AFIP_KEY_PATH = process.env.AFIP_KEY_PATH || path.join(__dirname, '../key.pem');
const AFIP_PRODUCTION = process.env.AFIP_PRODUCTION === 'true' || false; // false = homologación, true = producción

// Instancia de AFIP (se inicializa cuando se necesita)
let afipInstance = null;

/**
 * Verificar si AFIP está configurado (función interna)
 */
function checkAfipConfig() {
  if (!AFIP_CUIT) {
    throw new Error('AFIP_CUIT no está configurado. Verifica la variable de entorno AFIP_CUIT');
  }
  
  // Verificar que existan los certificados si se especificaron rutas personalizadas
  if (AFIP_CERT_PATH && !fs.existsSync(AFIP_CERT_PATH)) {
    throw new Error(`Certificado AFIP no encontrado en: ${AFIP_CERT_PATH}`);
  }
  
  if (AFIP_KEY_PATH && !fs.existsSync(AFIP_KEY_PATH)) {
    throw new Error(`Clave privada AFIP no encontrada en: ${AFIP_KEY_PATH}`);
  }
}

/**
 * Obtener instancia de AFIP (singleton)
 */
function getAfipInstance() {
  if (!afipInstance) {
    checkAfipConfig();
    
    // Configuración para AFIP SDK
    const afipConfig = {
      CUIT: parseInt(AFIP_CUIT.replace(/\D/g, '')),
      production: AFIP_PRODUCTION,
      cert: AFIP_CERT_PATH,
      key: AFIP_KEY_PATH
    };
    
    afipInstance = new Afip(afipConfig);
  }
  
  return afipInstance;
}

/**
 * Mapear tipo de comprobante del formato interno al formato AFIP
 */
function mapearTipoComprobante(tipoComprobante) {
  const tipos = {
    'FACTURA_A': 1,      // Factura A
    'FACTURA_B': 6,      // Factura B
    'FACTURA_C': 11,     // Factura C
    'NOTA_CREDITO_A': 3,  // Nota de Crédito A
    'NOTA_CREDITO_B': 8, // Nota de Crédito B
    'NOTA_CREDITO_C': 13,// Nota de Crédito C
    'NOTA_DEBITO_A': 2,  // Nota de Débito A
    'NOTA_DEBITO_B': 7,  // Nota de Débito B
    'NOTA_DEBITO_C': 12  // Nota de Débito C
  };
  
  return tipos[tipoComprobante] || 6; // Por defecto Factura B
}

/**
 * Mapear tipo de documento del formato interno al formato AFIP
 */
function mapearTipoDocumento(cuit, condicionIva) {
  // Si es consumidor final o no tiene CUIT válido
  if (!cuit || cuit === '20111111111' || condicionIva === 'CONSUMIDOR_FINAL') {
    return 99; // Sin identificar / Consumidor Final
  }
  
  // Si tiene CUIT, asumimos que es CUIT (tipo 80)
  return 80; // CUIT
}

/**
 * Calcular totales de la factura
 */
function calcularTotales(items) {
  let impNeto = 0;
  let impIVA = 0;
  const ivas = [];
  
  items.forEach(item => {
    const cantidad = Number(item.cantidad) || 1;
    const precioUnitario = Number(item.precio_unitario || item.precio_venta || 0);
    const alicuotaIva = Number(item.alicuota_iva || 21);
    
    const baseImp = cantidad * precioUnitario;
    const importeIva = baseImp * (alicuotaIva / 100);
    
    impNeto += baseImp;
    impIVA += importeIva;
    
    // Agregar al array de IVAs
    const idIva = alicuotaIva === 21 ? 5 : alicuotaIva === 10.5 ? 4 : alicuotaIva === 0 ? 3 : 5;
    ivas.push({
      Id: idIva,
      BaseImp: baseImp,
      Importe: importeIva
    });
  });
  
  return {
    impNeto: Math.round(impNeto * 100) / 100,
    impIVA: Math.round(impIVA * 100) / 100,
    impTotal: Math.round((impNeto + impIVA) * 100) / 100,
    ivas: ivas
  };
}

/**
 * Obtener último número de comprobante autorizado
 */
async function obtenerUltimoNumeroComprobante(afip, puntoVenta, tipoComprobante) {
  try {
    const ultimoComprobante = await afip.ElectronicBilling.getLastVoucherAuthorized({
      PtoVta: puntoVenta,
      CbteTipo: tipoComprobante
    });
    
    return ultimoComprobante.CbteNro || 0;
  } catch (error) {
    console.error('Error al obtener último comprobante:', error);
    return 0; // Si falla, empezamos desde 1
  }
}

/**
 * @desc    Crear un comprobante usando AFIP SDK
 * @route   POST /api/arca/comprobantes
 * @access  Private
 */
export const crearFacturaArca = async (req, res) => {
  try {
    checkAfipConfig();
    const afip = getAfipInstance();

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

    // Validaciones básicas
    if (!cliente) {
      return res.status(400).json({
        success: false,
        message: 'El nombre del cliente es requerido'
      });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Debe haber al menos un item en la factura'
      });
    }

    // Validar formato de CUIT
    const cuitLimpio = (cuit || '20111111111').replace(/\D/g, '');
    if (cuitLimpio.length !== 11 && cuitLimpio !== '20111111111') {
      return res.status(400).json({
        success: false,
        message: 'El CUIT debe tener 11 dígitos'
      });
    }

    // Preparar datos
    const ptoVta = puntoVenta || 1;
    const cbteTipo = mapearTipoComprobante(tipoComprobante || 'FACTURA_B');
    const docTipo = mapearTipoDocumento(cuitLimpio, condicionIva || 'CONSUMIDOR_FINAL');
    const docNro = cuitLimpio !== '20111111111' ? parseInt(cuitLimpio) : 0;
    
    // Calcular totales
    const totales = calcularTotales(items);
    
    // Obtener último número de comprobante si no se especifica
    let cbteDesde = numeroFactura;
    if (!cbteDesde) {
      const ultimoNumero = await obtenerUltimoNumeroComprobante(afip, ptoVta, cbteTipo);
      cbteDesde = ultimoNumero + 1;
    }
    const cbteHasta = cbteDesde;
    
    // Formatear fecha (YYYYMMDD)
    const fechaFormateada = fecha 
      ? fecha.replace(/-/g, '')
      : parseInt(new Date().toISOString().slice(0, 10).replace(/-/g, ''));

    // Preparar datos para AFIP
    const datosAfip = {
      CantReg: 1, // Cantidad de comprobantes a registrar
      PtoVta: ptoVta,
      CbteTipo: cbteTipo,
      Concepto: 1, // 1=Productos, 2=Servicios, 3=Productos y Servicios
      DocTipo: docTipo,
      DocNro: docNro,
      CbteDesde: cbteDesde,
      CbteHasta: cbteHasta,
      CbteFch: fechaFormateada,
      ImpTotal: totales.impTotal,
      ImpTotConc: 0, // Importe total no gravado
      ImpNeto: totales.impNeto,
      ImpOpEx: 0, // Importe exento
      ImpIVA: totales.impIVA,
      ImpTrib: 0, // Importe de tributos
      MonId: 'PES', // Moneda: Peso Argentino
      MonCotiz: 1, // Cotización de la moneda
      Iva: totales.ivas
    };

    // Crear comprobante en AFIP
    const respuestaAfip = await afip.ElectronicBilling.createVoucher(datosAfip);

    // Retornar respuesta exitosa
    res.status(201).json({
      success: true,
      data: {
        cae: respuestaAfip.CAE,
        numero_comprobante: respuestaAfip.CbteDesde,
        punto_venta: ptoVta,
        fecha_vencimiento_cae: respuestaAfip.CaeFchVto,
        cae_fch_vto: respuestaAfip.CaeFchVto,
        comprobante: respuestaAfip
      }
    });

  } catch (error) {
    console.error('Error al crear comprobante en AFIP:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error interno al crear comprobante',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      detalles: error.response || error
    });
  }
};

/**
 * @desc    Obtener el estado de un comprobante
 * @route   GET /api/arca/comprobantes/:puntoVenta/:numeroComprobante/:tipoComprobante
 * @access  Private
 */
export const obtenerEstadoComprobante = async (req, res) => {
  try {
    checkAfipConfig();
    const afip = getAfipInstance();

    const { puntoVenta, numeroComprobante, tipoComprobante } = req.params;

    if (!puntoVenta || !numeroComprobante || !tipoComprobante) {
      return res.status(400).json({
        success: false,
        message: 'Punto de venta, número de comprobante y tipo son requeridos'
      });
    }

    const cbteTipo = mapearTipoComprobante(tipoComprobante);

    // Consultar comprobante en AFIP
    const comprobante = await afip.ElectronicBilling.getVoucherInfo({
      PtoVta: parseInt(puntoVenta),
      CbteTipo: cbteTipo,
      CbteNro: parseInt(numeroComprobante)
    });

    res.status(200).json({
      success: true,
      data: comprobante
    });

  } catch (error) {
    console.error('Error al obtener estado del comprobante:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error interno al obtener estado del comprobante',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      detalles: error.response || error
    });
  }
};

/**
 * @desc    Verificar configuración de AFIP
 * @route   GET /api/arca/config
 * @access  Private
 */
export const verificarConfiguracion = async (req, res) => {
  try {
    const configurado = !!AFIP_CUIT;
    const tieneCert = fs.existsSync(AFIP_CERT_PATH);
    const tieneKey = fs.existsSync(AFIP_KEY_PATH);

    res.status(200).json({
      success: true,
      data: {
        configurado: configurado && tieneCert && tieneKey,
        tieneCuit: !!AFIP_CUIT,
        tieneCertificado: tieneCert,
        tieneClavePrivada: tieneKey,
        cuit: AFIP_CUIT ? AFIP_CUIT.replace(/\D/g, '') : null,
        ambiente: AFIP_PRODUCTION ? 'PRODUCCIÓN' : 'HOMOLOGACIÓN',
        certPath: AFIP_CERT_PATH,
        keyPath: AFIP_KEY_PATH
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error al verificar configuración',
      error: error.message
    });
  }
};
