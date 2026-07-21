// ==========================================
//  C🌍in - Core (lógica, cálculos, persistencia)
// ==========================================

// ----- Constantes -----
const STORAGE_KEY = 'coin_productos';
const LOTES_KEY = 'coin_lotes';
const ASIENTOS_KEY = 'coin_asientos';

// ----- Estado global (compartido con ui.js) -----
let productos = [];
let lotes = [];
let asientos = [];

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
  const storedAsientos = localStorage.getItem(ASIENTOS_KEY);
  if (storedAsientos) {
    asientos = JSON.parse(storedAsientos);
  } else {
    asientos = [];
  }
}

function guardarProductos() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(productos));
}

function guardarLote(loteData) {
  lotes.push(loteData);
  localStorage.setItem(LOTES_KEY, JSON.stringify(lotes));
}

function guardarAsientos() {
  localStorage.setItem(ASIENTOS_KEY, JSON.stringify(asientos));
}

function agregarAsiento(asiento) {
  asientos.push(asiento);
  guardarAsientos();
}

// ==========================================
//  GENERAR ASIENTOS INICIALES DESDE PRODUCTOS
// ==========================================
function generarAsientosIniciales() {
  if (asientos.length > 0) return; // Ya existen asientos

  const productosLocal = productos || [];
  if (productosLocal.length === 0) return;

  // Agrupar por lote
  const lotesMap = {};
  productosLocal.forEach(p => {
    if (!lotesMap[p.loteId]) {
      lotesMap[p.loteId] = {
        fecha: p.fechaLlegada,
        productos: [],
        flete: p.fleteInternacional || 0,
        gastosExtra: p.gastosExtra || []
      };
    }
    lotesMap[p.loteId].productos.push(p);
  });

  for (const [loteId, lote] of Object.entries(lotesMap)) {
    const totalProductos = lote.productos.length;
    const valorLote = lote.productos.reduce((sum, p) => sum + (p.precioUnitarioChina * p.cantidadImportada), 0);
    const totalGastosExtra = lote.gastosExtra.reduce((sum, g) => sum + g.monto, 0);
    const flete = lote.flete;

    // Asiento de compra
    const asientoCompra = {
      id: generarId(),
      fecha: lote.fecha,
      descripcion: `Compra de lote ${loteId} - ${totalProductos} productos`,
      tipo: 'compra',
      movimientos: [
        { cuenta: 'Inventario', debe: valorLote + flete + totalGastosExtra, haber: 0 },
        { cuenta: 'Banco', debe: 0, haber: valorLote },
        { cuenta: 'Gastos de Envío', debe: flete, haber: 0 },
        { cuenta: 'Gastos Administrativos', debe: totalGastosExtra, haber: 0 }
      ],
      referencia: loteId,
      productos: lote.productos.map(p => p.id)
    };
    agregarAsiento(asientoCompra);

    // Generar asientos de ventas si hay ventas registradas
    lote.productos.forEach(p => {
      if (p.totalVendido && p.totalVendido > 0) {
        const ingreso = p.totalVendido * p.precioVentaSugerido;
        const costo = p.totalVendido * p.costoUnitarioTotal;
        const asientoVenta = {
          id: generarId(),
          fecha: new Date().toISOString(),
          descripcion: `Venta de ${p.totalVendido} unidades de ${p.nombre} (SKU: ${p.sku})`,
          tipo: 'venta',
          movimientos: [
            { cuenta: 'Banco', debe: ingreso, haber: 0 },
            { cuenta: 'Ventas', debe: 0, haber: ingreso }
          ],
          referencia: p.id
        };
        agregarAsiento(asientoVenta);

        const asientoCosto = {
          id: generarId(),
          fecha: new Date().toISOString(),
          descripcion: `Costo de venta de ${p.totalVendido} unidades de ${p.nombre}`,
          tipo: 'costo',
          movimientos: [
            { cuenta: 'Costo de Ventas', debe: costo, haber: 0 },
            { cuenta: 'Inventario', debe: 0, haber: costo }
          ],
          referencia: p.id
        };
        agregarAsiento(asientoCosto);
      }
    });
  }
}

// Exportar al ámbito global para ui.js
window.productos = productos;
window.lotes = lotes;
window.asientos = asientos;
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
window.agregarAsiento = agregarAsiento;
window.guardarAsientos = guardarAsientos;
window.generarAsientosIniciales = generarAsientosIniciales;
