import mongoose from 'mongoose';

const notaCreditoSchema = new mongoose.Schema({
  cliente: {
    type: String,
    required: true,
    default: 'Consumidor Final'
  },
  motivo: {
    type: String,
    required: true
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
  total: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  numero_factura_original: {
    type: Number,
    default: null
  },
  numero_nota: {
    type: Number,
    required: true
  },
  observaciones: {
    type: String,
    default: null
  },
  venta_original_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Venta',
    default: null
  },
  fecha: {
    type: Date,
    default: Date.now
  },
  user_id: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Índices
notaCreditoSchema.index({ user_id: 1 });
notaCreditoSchema.index({ fecha: -1 });
notaCreditoSchema.index({ numero_nota: 1 });
notaCreditoSchema.index({ venta_original_id: 1 });

const NotaCredito = mongoose.model('NotaCredito', notaCreditoSchema);

export default NotaCredito;








