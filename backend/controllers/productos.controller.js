const { 
  calcularCostoUnitario, 
  calcularPrecioVenta,
  calcularEngagementPromedio,
  calcularIndicePrioridad 
} = require('../utils/costos');

const db = require('../utils/db');

// 1. Crear producto
const crearProducto = async (req, res) => {
  try {
    const { 
      nombre, descripcion, sku,
      precioUnitarioChina, cantidadImportada, fleteInternacional, gastosExtra,
      modoPrecio, valorPrecio
    } = req.body;

    const costoData = calcularCostoUnitario(
      precioUnitarioChina, 
      cantidadImportada, 
      fleteInternacional || 0, 
      gastosExtra || []
    );

    const precioData = calcularPrecioVenta(
      costoData.costoUnitario,
      modoPrecio || 'porcentaje',
      valorPrecio || 40
    );

    const nuevoProducto = {
      nombre,
      descripcion: descripcion || '',
      sku,
      precioUnitarioChina,
      cantidadImportada,
      fleteInternacional: fleteInternacional || 0,
      gastosExtra: gastosExtra || [],
      costoUnitarioTotal: costoData.costoUnitario,
      precioVentaSugerido: precioData.precioVenta,
      margenGanancia: precioData.margenGanancia,
      // Inicializar métricas
      interacciones: {
        instagram: { likes: 0, comentarios: 0, compartidos: 0, alcance: 0 },
        tiktok: { likes: 0, comentarios: 0, compartidos: 0, alcance: 0 },
        marketplace: { likes: 0, comentarios: 0, compartidos: 0, alcance: 0 }
      },
      engagementPromedio: 0,
      fechaLlegada: new Date().toISOString(),
      ventasRegistradas: [],
      totalVendido: 0,
      preguntasRegistradas: 0,
      createdAt: new Date().toISOString()
    };

    const guardado = db.agregarProducto(nuevoProducto);

    res.status(201).json({
      success: true,
      message: 'Producto creado con éxito',
      data: {
        producto: guardado,
        costeo: costoData,
        precio: precioData
      }
    });

  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// 2. Obtener todos los productos con análisis
const obtenerProductos = async (req, res) => {
  try {
    const productos = db.leerProductos();

    const productosEnriquecidos = productos.map(p => {
      const totalVendido = p.totalVendido || 0;
      const diasDesdeLlegada = Math.max(1, (Date.now() - new Date(p.fechaLlegada).getTime()) / (1000 * 60 * 60 * 24));
      const rotacionMensual = (totalVendido / diasDesdeLlegada) * 30;
      
      const engagement = calcularEngagementPromedio(
        p.interacciones?.instagram || {},
        p.interacciones?.tiktok || {},
        p.interacciones?.marketplace || {}
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
        ...p,
        rotacionMensual: parseFloat(rotacionMensual.toFixed(2)),
        engagementPromedio: engagement,
        tasaConversion: parseFloat(tasaConversion.toFixed(2)),
        prioridad,
        precioActual: calcularPrecioVenta(p.costoUnitarioTotal, 'porcentaje', p.margenGanancia || 40)
      };
    });

    res.json({ success: true, data: productosEnriquecidos });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Actualizar redes sociales
const actualizarRedes = async (req, res) => {
  try {
    const { id } = req.params;
    const { instagram, tiktok, marketplace } = req.body;

    const producto = db.encontrarProducto(id);
    if (!producto) {
      return res.status(404).json({ success: false, message: 'Producto no encontrado' });
    }

    producto.interacciones = { instagram, tiktok, marketplace };
    const engagement = calcularEngagementPromedio(instagram, tiktok, marketplace);
    producto.engagementPromedio = engagement;

    const actualizado = db.actualizarProducto(id, producto);
    res.json({ success: true, data: actualizado });

  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// 4. Registrar venta
const registrarVenta = async (req, res) => {
  try {
    const { id } = req.params;
    const { cantidad } = req.body;

    const producto = db.encontrarProducto(id);
    if (!producto) {
      return res.status(404).json({ success: false, message: 'Producto no encontrado' });
    }

    if (!producto.ventasRegistradas) producto.ventasRegistradas = [];
    producto.ventasRegistradas.push({ cantidad, fecha: new Date().toISOString() });
    producto.totalVendido = (producto.totalVendido || 0) + cantidad;

    db.actualizarProducto(id, producto);
    res.json({ success: true, message: 'Venta registrada', totalVendido: producto.totalVendido });

  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// 5. Registrar pregunta
const registrarPregunta = async (req, res) => {
  try {
    const { id } = req.params;
    const { cantidad = 1 } = req.body;

    const producto = db.encontrarProducto(id);
    if (!producto) {
      return res.status(404).json({ success: false, message: 'Producto no encontrado' });
    }

    producto.preguntasRegistradas = (producto.preguntasRegistradas || 0) + cantidad;
    db.actualizarProducto(id, producto);

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
