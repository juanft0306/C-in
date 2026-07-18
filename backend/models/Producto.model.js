const mongoose = require('mongoose');

const ProductoSchema = new mongoose.Schema({
  // Datos básicos
  nombre: { type: String, required: true },
  descripcion: String,
  sku: { type: String, unique: true, required: true }, // Código propio

  // Costos (origen China)
  precioUnitarioChina: { type: Number, required: true }, // USD
  cantidadImportada: { type: Number, required: true },
  fleteInternacional: { type: Number, default: 0 }, // USD
  gastosExtra: [
    {
      concepto: String,
      monto: { type: Number, default: 0 }
    }
  ],
  costoUnitarioTotal: { type: Number, required: true }, // Calculado automáticamente

  // Precios de venta
  precioVentaSugerido: Number,
  margenGanancia: Number, // Porcentaje (ej: 40)

  // Métricas de redes sociales (se actualizarán después)
  interacciones: {
    instagram: { likes: 0, comentarios: 0, compartidos: 0, alcance: 0 },
    tiktok: { likes: 0, comentarios: 0, compartidos: 0, alcance: 0 },
    marketplace: { likes: 0, comentarios: 0, compartidos: 0, alcance: 0 }
  },
  engagementPromedio: { type: Number, default: 0 }, // Se calcula

  // Métricas de ventas (para rotación)
  fechaLlegada: { type: Date, default: Date.now },
  ventasRegistradas: [
    {
      cantidad: Number,
      fecha: { type: Date, default: Date.now }
    }
  ],
  totalVendido: { type: Number, default: 0 },
  preguntasRegistradas: { type: Number, default: 0 }, // Cuántas veces preguntaron

  // Fecha de creación
  createdAt: { type: Date, default: Date.now }
});

// Calcular la rotación mensual (método virtual o estático, lo harémos en el controller)
module.exports = mongoose.model('Producto', ProductoSchema);
