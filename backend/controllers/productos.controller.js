const Producto = require('../models/Producto.model');
const { 
  calcularCostoUnitario, 
  calcularPrecioVenta,
  calcularEngagementPromedio,
  calcularIndicePrioridad 
} = require('../utils/costos');

// 1. Crear un nuevo producto (con todo el costeo)
const crearProducto = async (req, res) => {
  try {
    const { 
      nombre, descripcion, sku,
      precioUnitarioChina, cantidadImportada, fleteInternacional, gastosExtra,
      modoPrecio, valorPrecio  // modoPrecio: 'porcentaje', 'gananciaFija', 'precioMercado'
    } = req.body;

    // Calcular costo unitario
    const costoData = calcularCostoUnitario(
      precioUnitarioChina, 
      cantidadImportada, 
      fleteInternacional || 0, 
      gastosExtra || []
    );

    // Calcular precio de venta sugerido
    const precioData = calcularPrecioVenta(
      costoData.costoUnitario,
      modoPrecio || 'porcentaje',
      valorPrecio || 40  // Por defecto 40%
    );

    // Crear el documento
    const nuevoProducto = new Producto({
      nombre,
      descripcion,
      sku,
      precioUnitarioChina,
      cantidadImportada,
      fleteInternacional: fleteInternacional || 0,
      gastosExtra: gastosExtra || [],
      costoUnitarioTotal: costoData.costoUnitario,
      precioVentaSugerido: precioData.precioVenta,
      margenGanancia: precioData.margenGanancia
    });

    await nuevoProducto.save();

    res.status(201).json({
      success: true,
      message: 'Producto creado con éxito',
      data: {
        producto: nuevoProducto,
        costeo: costoData,
        precio: precioData
      }
    });

  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// 2. Obtener todos los productos (con su análisis)
const obtenerProductos = async (req, res) => {
  try {
    const productos = await Producto.find().sort({ createdAt: -1 });
    
    // Enriquecer cada producto con métricas calculadas en tiempo real
    const productosEnriquecidos = productos.map(p => {
      const totalVendido = p.totalVendido || 0;
      const diasDesdeLlegada = Math.max(1, (Date.now() - new Date(p.fechaLlegada).getTime()) / (1000 * 60 * 60 * 24));
      const rotacionMensual = (totalVendido / diasDesdeLlegada) * 30;
      
      const engagement = calcularEngagementPromedio(
        p.interacciones.instagram || {},
        p.interacciones.tiktok || {},
        p.interacciones.marketplace || {}
      );
      
      const preguntas = p.preguntasRegistradas || 1;
      const tasaConversion = (totalVendido / preguntas) * 100;
      
      const prioridad = calcularIndicePrioridad(
        p.costoUnitarioTotal,
        rotacionMensual,
        engagement,
        tasaConversion
      );

      return {
        ...p.toObject(),
        rotacionMensual: parseFloat(rotacionMensual.toFixed(2)),
        engagementPromedio: engagement,
        tasaConversion: parseFloat(tasaConversion.toFixed(2)),
        prioridad,
        // Precio de venta actual (si se recalcula)
        precioActual: calcularPrecioVenta(p.costoUnitarioTotal, 'porcentaje', p.margenGanancia || 40)
      };
    });

    res.json({ success: true, data: productosEnriquecidos });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Actualizar métricas de redes sociales de un producto
const actualizarRedes = async (req, res) => {
  try {
    const { id } = req.params;
    const { instagram, tiktok, marketplace } = req.body;

    const producto = await Producto.findByIdAndUpdate(id, {
      $set: {
        'interacciones.instagram': instagram,
        'interacciones.tiktok': tiktok,
        'interacciones.marketplace': marketplace
      }
    }, { new: true });

    if (!producto) {
      return res.status(404).json({ success: false, message: 'Producto no encontrado' });
    }

    // Recalcular engagement
    const engagement = calcularEngagementPromedio(
      instagram, tiktok, marketplace
    );
    producto.engagementPromedio = engagement;
    await producto.save();

    res.json({ success: true, data: producto });

  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// 4. Registrar una venta
const registrarVenta = async (req, res) => {
  try {
    const { id } = req.params;
    const { cantidad } = req.body;

    const producto = await Producto.findById(id);
    if (!producto) {
      return res.status(404).json({ success: false, message: 'Producto no encontrado' });
    }

    producto.ventasRegistradas.push({ cantidad, fecha: new Date() });
    producto.totalVendido = (producto.totalVendido || 0) + cantidad;
    await producto.save();

    res.json({ success: true, message: 'Venta registrada', totalVendido: producto.totalVendido });

  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// 5. Registrar preguntas (demanda)
const registrarPregunta = async (req, res) => {
  try {
    const { id } = req.params;
    const { cantidad = 1 } = req.body;

    const producto = await Producto.findById(id);
    if (!producto) {
      return res.status(404).json({ success: false, message: 'Producto no encontrado' });
    }

    producto.preguntasRegistradas = (producto.preguntasRegistradas || 0) + cantidad;
    await producto.save();

    res.json({ success: true, message: 'Preguntas registradas', totalPreguntas: producto.preguntasRegistradas });

  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  crearProducto,
  obtenerProductos,
  actualizarRedes,
  registrarVenta,
  registrarPregunta
};
