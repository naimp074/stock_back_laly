import mongoose from 'mongoose';

const presupuestoSchema = new mongoose.Schema({
  numero_presupuesto: {
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
  direccion_cliente: {
    type: String,
    default: null
  },
  total: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  items: {
    type: [{
      producto_id: String,
      nombre: String,
      precio_venta: Number,
      cantidad: Number
    }],
    default: []
  },
  tipo: {
    type: String,
    enum: ['presupuesto'],
    default: 'presupuesto'
  },
  user_id: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Índices
presupuestoSchema.index({ user_id: 1 });
presupuestoSchema.index({ fecha: -1 });
presupuestoSchema.index({ cliente: 1 });
presupuestoSchema.index({ numero_presupuesto: 1 });

const Presupuesto = mongoose.model('Presupuesto', presupuestoSchema);

export default Presupuesto;







