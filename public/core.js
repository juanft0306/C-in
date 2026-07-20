// ==========================================
//  C🌍in - Core (lógica, cálculos, persistencia)
// ==========================================

// ----- Constantes -----
const STORAGE_KEY = 'coin_productos';
const LOTES_KEY = 'coin_lotes';

// ----- Estado global (compartido con ui.js) -----
let productos = [];
let lotes = [];

// ==========================================
//  UTILIDADES
// ==========================================
function formatearUSD(valor) {
  return '$' + Number(valor).toFixed(2);
}

function getEmojiRecomendacion(recomendacion) {
  if (recomendacion.includes('TRAER MÁS')) return '🟢';
  if (recomendacion.includes('MANTENER')) return '🟡';
  if (recomendacion.includes('DEJAR')) return '🔴';
  return '⚪';
}

function generarId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// ==========================================
//  GENERACIÓN AUTOMÁTICA DE SKU (Formato: A001)
// ==========================================
function generarSKU(nombre, skusExistentes) {
  if (!nombre || nombre.trim() === '') return '';
  const letra = nombre.trim().charAt(0).toUpperCase();
  const skusConLetra = skusExistentes.filter(sku => sku.startsWith(letra) && sku.length === 4);
  let maxNumero = 0;
  skusConLetra.forEach(sku => {
    const num = parseInt(sku.substring(1), 10);
    if (!isNaN(num) && num > maxNumero) maxNumero = num;
  });
  const nuevoNumero = maxNumero + 1;
  const numeroFormateado = String(nuevoNumero).padStart(3, '0');
  return letra + numeroFormateado;
}

// ==========================================
//  CÁLCULO DE COSTOS Y PRECIOS
// ==========================================
function calcularCostoUnitario(precioUnitarioChina, cantidad, flete, gastosExtra, valorTotalLote, valorProducto) {
  const totalGastosExtra = gastosExtra.reduce((sum, g) => sum + g.monto, 0);
  const gastosComunes = flete + totalGastosExtra;
  const proporcion = valorTotalLote > 0 ? valorProducto / valorTotalLote : 0;
  const costoTotalProducto = valorProducto + (gastosComunes * proporcion);
  return costoTotalProducto / cantidad;
}

function calcularPrecioVenta(costoUnitario, modo, valor) {
  let precioVenta = 0;
  let margenGanancia = 0;

  switch (modo) {
    case 'porcentaje':
      precioVenta = costoUnitario / (1 - (valor / 100));
      margenGanancia = valor;
      break;
    case 'gananciaFija':
      precioVenta = costoUnitario + valor;
      margenGanancia = ((precioVenta - costoUnitario) / precioVenta) * 100;
      break;
    case 'precioMercado':
      precioVenta = valor;
      margenGanancia = ((precioVenta - costoUnitario) / precioVenta) * 100;
      break;
    default:
      throw new Error('Modo no válido');
  }
  return {
    precioVenta: parseFloat(precioVenta.toFixed(2)),
    margenGanancia: parseFloat(margenGanancia.toFixed(2)),
    gananciaUnitaria: parseFloat((precioVenta - costoUnitario).toFixed(2))
  };
}

function calcularEngagementPromedio(interacciones) {
  const { instagram, tiktok, marketplace } = interacciones;
  const calcularER = (data) => {
    if (!data.alcance || data.alcance === 0) return 0;
    const total = data.likes + data.comentarios + data.compartidos;
    return (total / data.alcance) * 100;
  };
  const er = [instagram, tiktok, marketplace].map(calcularER);
  const promedio = er.reduce((a, b) => a + b, 0) / er.length;
  return parseFloat(promedio.toFixed(2));
}

function calcularIndicePrioridad(costoUnitario, rotacionMensual, engagementPromedio, tasaConversion) {
  const costoNorm = Math.max(0, 1 - (costoUnitario / 50));
  const rotacionNorm = Math.min(1, rotacionMensual / 10);
  const engagementNorm = Math.min(1, engagementPromedio / 10);
  const conversionNorm = Math.min(1, tasaConversion / 50);
  const puntaje = (costoNorm * -0.3) + (rotacionNorm * 0.4) + (engagementNorm * 0.2) + (conversionNorm * 0.1);
  const indice = Math.max(0, Math.min(100, (puntaje + 0.5) * 100));
  return {
    indice: parseFloat(indice.toFixed(1)),
    recomendacion: indice > 70 ? '🟢 TRAER MÁS' : (indice > 40 ? '🟡 MANTENER / OPTIMIZAR' : '🔴 DEJAR DE TRAER')
  };
}

// ==========================================
//  PERSISTENCIA EN LOCALSTORAGE
// ==========================================
function cargarDatos() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    productos = JSON.parse(stored);
  } else {
    productos = [];
  }
  const storedLotes = localStorage.getItem(LOTES_KEY);
  if (storedLotes) {
    lotes = JSON.parse(storedLotes);
  } else {
    lotes = [];
  }
}

function guardarProductos() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(productos));
}

function guardarLote(loteData) {
  lotes.push(loteData);
  localStorage.setItem(LOTES_KEY, JSON.stringify(lotes));
}

// Exportar al ámbito global para que ui.js pueda acceder
window.productos = productos;
window.lotes = lotes;
window.formatearUSD = formatearUSD;
window.getEmojiRecomendacion = getEmojiRecomendacion;
window.generarId = generarId;
window.generarSKU = generarSKU;
window.calcularCostoUnitario = calcularCostoUnitario;
window.calcularPrecioVenta = calcularPrecioVenta;
window.calcularEngagementPromedio = calcularEngagementPromedio;
window.calcularIndicePrioridad = calcularIndicePrioridad;
window.cargarDatos = cargarDatos;
window.guardarProductos = guardarProductos;
window.guardarLote = guardarLote;
