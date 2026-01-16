import Producto from '../models/Producto.js';

// @desc    Obtener todos los productos
// @route   GET /api/productos
// @access  Private
export const obtenerProductos = async (req, res) => {
  try {
    // Todos los usuarios ven todos los productos
    const productos = await Producto.find({})
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: productos.length,
      data: productos
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener productos',
      error: error.message
    });
  }
};

// @desc    Obtener un producto por ID
// @route   GET /api/productos/:id
// @access  Private
export const obtenerProducto = async (req, res) => {
  try {
    const { id } = req.params;

    // Todos los usuarios pueden ver cualquier producto
    const producto = await Producto.findById(id);

    if (!producto) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      data: producto
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener producto',
      error: error.message
    });
  }
};

// @desc    Crear un nuevo producto
// @route   POST /api/productos
// @access  Private
export const crearProducto = async (req, res) => {
  try {
    const user_id = req.user_id;
    const { ...productoData } = req.body;

    // Validar campos requeridos
    if (!productoData.nombre) {
      return res.status(400).json({
        success: false,
        message: 'El nombre del producto es requerido'
      });
    }

    const producto = await Producto.create({
      ...productoData,
      user_id,
      unidad: productoData.unidad || 'unidad'
    });

    res.status(201).json({
      success: true,
      data: producto
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al crear producto',
      error: error.message
    });
  }
};

// @desc    Actualizar un producto
// @route   PUT /api/productos/:id
// @access  Private
export const actualizarProducto = async (req, res) => {
  try {
    const { id } = req.params;
    const { ...productoData } = req.body;

    // Todos los usuarios pueden actualizar cualquier producto
    const producto = await Producto.findByIdAndUpdate(
      id,
      productoData,
      { new: true, runValidators: true }
    );

    if (!producto) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      data: producto
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al actualizar producto',
      error: error.message
    });
  }
};

// @desc    Eliminar un producto
// @route   DELETE /api/productos/:id
// @access  Private
export const eliminarProducto = async (req, res) => {
  try {
    const { id } = req.params;

    // Todos los usuarios pueden eliminar cualquier producto
    const producto = await Producto.findByIdAndDelete(id);

    if (!producto) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Producto eliminado correctamente',
      data: producto
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al eliminar producto',
      error: error.message
    });
  }
};

// @desc    Importación masiva de productos
// @route   POST /api/productos/importar
// @access  Private
export const importarProductos = async (req, res) => {
  try {
    const user_id = req.user_id;
    const { productos } = req.body;

    if (!productos || !Array.isArray(productos) || productos.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere un array de productos'
      });
    }

    const productosAInsertar = productos.map((p) => ({
      nombre: (p.nombre || '').trim(),
      precio_costo: Number(p.precio_costo ?? p.costo ?? 0),
      precio_venta: Number(p.precio_venta ?? p.venta ?? 0),
      cantidad: Number(p.cantidad ?? 0),
      unidad: p.unidad || 'unidad',
      proveedor: p.proveedor || null,
      telefono: p.telefono || null,
      imagen: p.imagen || null,
      categoria: p.categoria || null,
      user_id
    }));

    const productosCreados = await Producto.insertMany(productosAInsertar);

    res.status(201).json({
      success: true,
      count: productosCreados.length,
      data: productosCreados
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al importar productos',
      error: error.message
    });
  }
};

