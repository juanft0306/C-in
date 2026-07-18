/**
 * Calcula el costo unitario real considerando todos los gastos
 */
const calcularCostoUnitario = (precioUnitarioChina, cantidad, fleteInternacional, gastosExtra = []) => {
  const totalGastosExtra = gastosExtra.reduce((sum, g) => sum + g.monto, 0);
  const costoTotal = (precioUnitarioChina * cantidad) + fleteInternacional + totalGastosExtra;
  const costoUnitario = costoTotal / cantidad;
  
  return {
    costoUnitario: parseFloat(costoUnitario.toFixed(4)),
    costoTotal: parseFloat(costoTotal.toFixed(2)),
    detalle: {
      precioBase: precioUnitarioChina * cantidad,
      flete: fleteInternacional,
      gastosExtra: totalGastosExtra,
      desgloseGastos: gastosExtra
    }
  };
};

/**
 * Calcula el precio de venta según el modo elegido
 * Modo: 'porcentaje' | 'gananciaFija' | 'precioMercado'
 */
const calcularPrecioVenta = (costoUnitario, modo, valor) => {
  let precioVenta = 0;
  let margenGanancia = 0;

  switch (modo) {
    case 'porcentaje':
      // Ej: valor = 40 (quiere ganar 40%)
      precioVenta = costoUnitario / (1 - (valor / 100));
      margenGanancia = valor;
      break;
    case 'gananciaFija':
      // Ej: valor = 5 (quiere ganar $5 por unidad)
      precioVenta = costoUnitario + valor;
      margenGanancia = ((precioVenta - costoUnitario) / precioVenta) * 100;
      break;
    case 'precioMercado':
      // Ej: valor = 10 (lo ve a $10 en el mercado)
      precioVenta = valor;
      margenGanancia = ((precioVenta - costoUnitario) / precioVenta) * 100;
      break;
    default:
      throw new Error('Modo de cálculo no válido');
  }

  return {
    precioVenta: parseFloat(precioVenta.toFixed(2)),
    margenGanancia: parseFloat(margenGanancia.toFixed(2)),
    gananciaUnitaria: parseFloat((precioVenta - costoUnitario).toFixed(2))
  };
};

/**
 * Calcula el Engagement Rate promedio de las 3 plataformas
 */
const calcularEngagementPromedio = (instagram, tiktok, marketplace) => {
  const calcularER = (data) => {
    if (!data.alcance || data.alcance === 0) return 0;
    const interacciones = data.likes + data.comentarios + data.compartidos;
    return (interacciones / data.alcance) * 100;
  };

  const erInsta = calcularER(instagram);
  const erTikTok = calcularER(tiktok);
  const erMarket = calcularER(marketplace);

  const promedio = (erInsta + erTikTok + erMarket) / 3;
  return parseFloat(promedio.toFixed(2));
};

/**
 * Calcula el índice de prioridad (el recomendador)
 */
const calcularIndicePrioridad = (costoUnitario, rotacionMensual, engagementPromedio, tasaConversion) => {
  // Normalizamos costos: entre más caro, menos prioridad (inversa)
  // Asumimos que un costo de $50 es "caro" y $1 es "barato"
  const costoNormalizado = Math.max(0, 1 - (costoUnitario / 50));
  
  // Rotación: si vende 10 unidades/mes es excelente
  const rotacionNormalizada = Math.min(1, rotacionMensual / 10);
  
  // Engagement: si tiene 10% de ER es excelente
  const engagementNormalizado = Math.min(1, engagementPromedio / 10);
  
  // Tasa de conversión: si convierte el 50% de preguntas en ventas
  const conversionNormalizada = Math.min(1, tasaConversion / 50);

  // Fórmula ponderada (ajusta los pesos según tu experiencia)
  const puntaje = (costoNormalizado * -0.3) + (rotacionNormalizada * 0.4) + (engagementNormalizado * 0.2) + (conversionNormalizada * 0.1);
  
  // Escalamos a 0-100
  const indice = Math.max(0, Math.min(100, (puntaje + 0.5) * 100));
  
  return {
    indice: parseFloat(indice.toFixed(1)),
    recomendacion: indice > 70 ? '🟢 TRAER MÁS' : (indice > 40 ? '🟡 MANTENER / OPTIMIZAR' : '🔴 DEJAR DE TRAER'),
    metricas: {
      costoNormalizado,
      rotacionNormalizada,
      engagementNormalizado,
      conversionNormalizada
    }
  };
};

module.exports = {
  calcularCostoUnitario,
  calcularPrecioVenta,
  calcularEngagementPromedio,
  calcularIndicePrioridad
};
