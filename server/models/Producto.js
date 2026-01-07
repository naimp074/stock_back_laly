import mongoose from 'mongoose';

const productoSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  sku: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  descripcion: {
    type: String,
    default: ''
  },
  precio_costo: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  precio_venta: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  cantidad: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  stock_minimo: {
    type: Number,
    default: 5,
    min: 0
  },
  unidad: {
    type: String,
    default: 'unidad'
  },
  proveedor: {
    type: String,
    default: null
  },
  telefono: {
    type: String,
    default: null
  },
  email: {
    type: String,
    default: null
  },
  direccion: {
    type: String,
    default: null
  },
  imagen: {
    type: String,
    default: null
  },
  categoria: {
    type: String,
    default: null
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
productoSchema.index({ user_id: 1 });
productoSchema.index({ nombre: 1 });
productoSchema.index({ sku: 1 });
productoSchema.index({ activo: 1 });

const Producto = mongoose.model('Producto', productoSchema);

export default Producto;








