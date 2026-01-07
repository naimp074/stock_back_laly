import mongoose from 'mongoose';

const cuentaCorrienteSchema = new mongoose.Schema({
  cliente: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    default: null
  },
  telefono: {
    type: String,
    default: null
  },
  direccion: {
    type: String,
    default: null
  },
  documento: {
    type: String,
    default: null
  },
  limite_credito: {
    type: Number,
    default: 0,
    min: 0
  },
  saldo: {
    type: Number,
    default: 0
  },
  activo: {
    type: Boolean,
    default: true
  },
  user_id: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Índices
cuentaCorrienteSchema.index({ user_id: 1 });
cuentaCorrienteSchema.index({ cliente: 1 });
cuentaCorrienteSchema.index({ activo: 1 });

const CuentaCorriente = mongoose.model('CuentaCorriente', cuentaCorrienteSchema);

export default CuentaCorriente;








