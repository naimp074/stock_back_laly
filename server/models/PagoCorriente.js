import mongoose from 'mongoose';

const pagoCorrienteSchema = new mongoose.Schema({
  cuenta_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CuentaCorriente',
    required: true
  },
  tipo: {
    type: String,
    enum: ['cargo', 'pago'],
    required: true,
    default: 'cargo'
  },
  monto: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  descuento: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  monto_real: {
    type: Number,
    default: 0
  },
  concepto: {
    type: String,
    default: null
  },
  factura: {
    type: String,
    default: null
  },
  numero_factura: {
    type: Number,
    default: null
  },
  items: {
    type: [{
      id: String,
      nombre: String,
      precio_venta: Number,
      cantidad: Number
    }],
    default: null
  },
  fecha: {
    type: Date,
    default: Date.now
  },
  observaciones: {
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

// Calcular monto_real antes de guardar
pagoCorrienteSchema.pre('save', function(next) {
  if (this.descuento && this.descuento > 0) {
    this.monto_real = this.monto - (this.monto * this.descuento / 100);
  } else {
    this.monto_real = this.monto;
  }
  next();
});

// Índices
pagoCorrienteSchema.index({ cuenta_id: 1 });
pagoCorrienteSchema.index({ user_id: 1 });
pagoCorrienteSchema.index({ fecha: -1 });
pagoCorrienteSchema.index({ tipo: 1 });

const PagoCorriente = mongoose.model('PagoCorriente', pagoCorrienteSchema);

export default PagoCorriente;








