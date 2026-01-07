import mongoose from 'mongoose';

const ventaSchema = new mongoose.Schema({
  numero_factura: {
    type: Number,
    default: null
  },
  fecha: {
    type: Date,
    default: Date.now
  },
  cliente: {
    type: String,
    default: null
  },
  total: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  subtotal: {
    type: Number,
    default: 0,
    min: 0
  },
  impuestos: {
    type: Number,
    default: 0,
    min: 0
  },
  descuento: {
    type: Number,
    default: 0,
    min: 0
  },
  items: {
    type: [{
      id: String,
      nombre: String,
      precio_venta: Number,
      cantidad: Number,
      subtotal: Number
    }],
    default: []
  },
  tipo: {
    type: String,
    enum: ['venta', 'cuenta_corriente'],
    default: 'venta'
  },
  estado: {
    type: String,
    enum: ['pendiente', 'completada', 'cancelada'],
    default: 'completada'
  },
  metodo_pago: {
    type: String,
    enum: ['efectivo', 'tarjeta', 'transferencia', 'cheque'],
    default: 'efectivo'
  },
  observaciones: {
    type: String,
    default: null
  },
  // Campos para integración con Arca (facturación electrónica)
  arca_cae: {
    type: String,
    default: null
  },
  arca_numero: {
    type: String,
    default: null
  },
  arca_pdf_url: {
    type: String,
    default: null
  },
  user_id: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Índices
ventaSchema.index({ user_id: 1 });
ventaSchema.index({ fecha: -1 });
ventaSchema.index({ cliente: 1 });
ventaSchema.index({ tipo: 1 });
ventaSchema.index({ estado: 1 });
ventaSchema.index({ numero_factura: 1 });

const Venta = mongoose.model('Venta', ventaSchema);

export default Venta;








