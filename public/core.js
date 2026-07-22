// ==========================================
//  C🌍in - Core (lógica, cálculos, persistencia)
// ==========================================

// ----- Constantes -----
const STORAGE_KEY = 'coin_productos';
const LOTES_KEY = 'coin_lotes';
const ASIENTOS_KEY = 'coin_asientos';
const SONDEO_KEY = 'coin_sondeos';

// ----- Estado global -----
let productos = [];
let lotes = [];
let asientos = [];
let sondeos = [];

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
  let precioVenta = 0, margenGanancia = 0;
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
    default: throw new Error('Modo no válido');
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
  return parseFloat((er.reduce((a, b) => a + b, 0) / er.length).toFixed(2));
}

function calcularIndicePrioridad(costoUnitario, rotacionMensual, engagementPromedio, tasaConversion, frecuenciaVentas) {
  const costoNorm = Math.max(0, 1 - (costoUnitario / 50));
  const rotacionNorm = Math.min(1, rotacionMensual / 10);
  const engagementNorm = Math.min(1, engagementPromedio / 10);
  const conversionNorm = Math.min(1, tasaConversion / 50);
  let frecuenciaNorm = 0;
  if (frecuenciaVentas > 0 && frecuenciaVentas < 30) frecuenciaNorm = Math.max(0, 1 - (frecuenciaVentas / 15));
  else if (frecuenciaVentas === 0) frecuenciaNorm = 0;
  else frecuenciaNorm = 0.2;
  
  const puntaje = (costoNorm * -0.25) + (rotacionNorm * 0.35) + (engagementNorm * 0.15) + (conversionNorm * 0.1) + (frecuenciaNorm * 0.15);
  const indice = Math.max(0, Math.min(100, (puntaje + 0.5) * 100));
  return {
    indice: parseFloat(indice.toFixed(1)),
    recomendacion: indice > 70 ? '🟢 TRAER MÁS' : (indice > 40 ? '🟡 MANTENER / OPTIMIZAR' : '🔴 DEJAR DE TRAER')
  };
}

// ==========================================
//  ESTACIONALIDAD
// ==========================================
function inicializarEstacionalidad() {
  const meses = {};
  for (let i = 1; i <= 12; i++) meses[i] = { ventas: 0, preguntas: 0, interacciones: 0 };
  return meses;
}

function actualizarEstacionalidad(objeto, tipo, cantidad, fecha) {
  const mes = new Date(fecha).getMonth() + 1;
  if (!objeto.estacionalidad) objeto.estacionalidad = inicializarEstacionalidad();
  if (!objeto.estacionalidad[mes]) objeto.estacionalidad[mes] = { ventas: 0, preguntas: 0, interacciones: 0 };
  if (tipo === 'venta') objeto.estacionalidad[mes].ventas += cantidad;
  else if (tipo === 'pregunta') objeto.estacionalidad[mes].preguntas += cantidad;
  else if (tipo === 'interaccion') objeto.estacionalidad[mes].interacciones += cantidad;
  return objeto;
}

function obtenerRecomendacionMes(objeto) {
  if (!objeto.estacionalidad) return { mejor: null, peor: null, mensaje: 'Sin datos' };
  const meses = Object.entries(objeto.estacionalidad);
  if (meses.length === 0) return { mejor: null, peor: null, mensaje: 'Sin datos' };
  const puntajes = meses.map(([mes, datos]) => {
    const total = (datos.ventas || 0) * 3 + (datos.preguntas || 0) * 2 + (datos.interacciones || 0) * 1;
    return { mes: parseInt(mes), total };
  });
  puntajes.sort((a, b) => b.total - a.total);
  const mejor = puntajes[0];
  const peor = puntajes[puntajes.length - 1];
  if (mejor.total === 0) return { mejor: null, peor: null, mensaje: 'Sin actividad' };
  const mesesNombres = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  return {
    mejor: { mes: mejor.mes, nombre: mesesNombres[mejor.mes - 1], puntaje: mejor.total },
    peor: { mes: peor.mes, nombre: mesesNombres[peor.mes - 1], puntaje: peor.total },
    mensaje: `📈 Mejor: ${mesesNombres[mejor.mes - 1]} (${mejor.total} pts)`
  };
}

function migrarEstacionalidad() {
  productos.forEach(p => {
    if (!p.estacionalidad) p.estacionalidad = inicializarEstacionalidad();
    if (Array.isArray(p.ventasRegistradas)) {
      p.ventasRegistradas.forEach(v => actualizarEstacionalidad(p, 'venta', v.cantidad, v.fecha));
    }
    if (Array.isArray(p.preguntasRegistradas)) {
      p.preguntasRegistradas.forEach(preg => actualizarEstacionalidad(p, 'pregunta', preg.cantidad, preg.fecha));
    }
  });
  guardarProductos();
  sondeos.forEach(s => {
    if (!s.estacionalidad) s.estacionalidad = inicializarEstacionalidad();
    if (Array.isArray(s.historial)) {
      s.historial.forEach(dia => {
        if (dia.preguntas > 0) actualizarEstacionalidad(s, 'pregunta', dia.preguntas, dia.fecha);
        if (dia.vistas > 0) actualizarEstacionalidad(s, 'interaccion', dia.vistas, dia.fecha);
      });
    }
  });
  guardarSondeos();
}

// ==========================================
//  PERSISTENCIA
// ==========================================
function cargarDatos() {
  try {
    productos = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    productos = productos.map(p => {
      if (!Array.isArray(p.ventasRegistradas)) {
        if (typeof p.ventasRegistradas === 'number') {
          const total = p.ventasRegistradas;
          p.ventasRegistradas = total > 0 ? [{ cantidad: total, fecha: p.fechaLlegada || new Date().toISOString() }] : [];
        } else p.ventasRegistradas = [];
      }
      if (!Array.isArray(p.preguntasRegistradas)) {
        if (typeof p.preguntasRegistradas === 'number') {
          const total = p.preguntasRegistradas;
          p.preguntasRegistradas = total > 0 ? [{ cantidad: total, fecha: new Date().toISOString() }] : [];
        } else p.preguntasRegistradas = [];
      }
      if (p.totalVendido === undefined) p.totalVendido = p.ventasRegistradas.reduce((sum, v) => sum + v.cantidad, 0);
      if (!Array.isArray(p.competidores)) p.competidores = [];
      if (!p.estacionalidad) p.estacionalidad = inicializarEstacionalidad();
      return p;
    });
    lotes = JSON.parse(localStorage.getItem(LOTES_KEY) || '[]');
    asientos = JSON.parse(localStorage.getItem(ASIENTOS_KEY) || '[]');
    sondeos = JSON.parse(localStorage.getItem(SONDEO_KEY) || '[]');
    sondeos = sondeos.map(s => {
      if (!s.historial) s.historial = [];
      if (!s.estacionalidad) s.estacionalidad = inicializarEstacionalidad();
      return s;
    });
    window.productos = productos; window.lotes = lotes; window.asientos = asientos; window.sondeos = sondeos;
    console.log(`✅ Datos cargados: ${productos.length} productos, ${sondeos.length} sondeos, ${asientos.length} asientos`);
  } catch (e) {
    console.error('❌ Error al cargar datos:', e);
    productos = []; lotes = []; asientos = []; sondeos = [];
    window.productos = productos; window.lotes = lotes; window.asientos = asientos; window.sondeos = sondeos;
  }
}

function guardarProductos() { localStorage.setItem(STORAGE_KEY, JSON.stringify(productos)); window.productos = productos; }
function guardarLote(loteData) { lotes.push(loteData); localStorage.setItem(LOTES_KEY, JSON.stringify(lotes)); window.lotes = lotes; }
function guardarAsientos() { localStorage.setItem(ASIENTOS_KEY, JSON.stringify(asientos)); window.asientos = asientos; }
function agregarAsiento(asiento) { asientos.push(asiento); guardarAsientos(); window.asientos = asientos; }
function guardarSondeos() { localStorage.setItem(SONDEO_KEY, JSON.stringify(sondeos)); window.sondeos = sondeos; }
function agregarSondeo(sondeo) { sondeos.push(sondeo); guardarSondeos(); }
function agregarRegistroSondeo(id, vistas, preguntas) {
  const sondeo = sondeos.find(s => s.id === id);
  if (!sondeo) return false;
  const hoy = new Date().toISOString().split('T')[0];
  const existe = sondeo.historial.find(r => r.fecha === hoy);
  if (existe) { existe.vistas = vistas; existe.preguntas = preguntas; }
  else { sondeo.historial.push({ fecha: hoy, vistas: vistas || 0, preguntas: preguntas || 0 }); }
  guardarSondeos();
  return true;
}

function generarAsientosIniciales() {
  if (asientos.length > 0) return;
  const lotesMap = {};
  productos.forEach(p => {
    if (!lotesMap[p.loteId]) lotesMap[p.loteId] = { fecha: p.fechaLlegada, productos: [], flete: p.fleteInternacional || 0, gastosExtra: p.gastosExtra || [] };
    lotesMap[p.loteId].productos.push(p);
  });
  for (const [loteId, lote] of Object.entries(lotesMap)) {
    const valorLote = lote.productos.reduce((sum, p) => sum + (p.precioUnitarioChina * p.cantidadImportada), 0);
    const totalGastosExtra = lote.gastosExtra.reduce((sum, g) => sum + g.monto, 0);
    const asiento = {
      id: generarId(), fecha: lote.fecha,
      descripcion: `Compra de lote ${loteId} - ${lote.productos.length} productos`,
      tipo: 'compra',
      movimientos: [
        { cuenta: 'Inventario', debe: valorLote + lote.flete + totalGastosExtra, haber: 0 },
        { cuenta: 'Banco', debe: 0, haber: valorLote },
        { cuenta: 'Gastos de Envío', debe: lote.flete, haber: 0 },
        { cuenta: 'Gastos Administrativos', debe: totalGastosExtra, haber: 0 }
      ],
      referencia: loteId, productos: lote.productos.map(p => p.id)
    };
    agregarAsiento(asiento);
    lote.productos.forEach(p => {
      if (p.totalVendido > 0) {
        const ingreso = p.totalVendido * p.precioVentaSugerido;
        const costo = p.totalVendido * p.costoUnitarioTotal;
        agregarAsiento({ id: generarId(), fecha: new Date().toISOString(), descripcion: `Venta de ${p.totalVendido} unidades de ${p.nombre}`, tipo: 'venta', movimientos: [{ cuenta: 'Banco', debe: ingreso, haber: 0 }, { cuenta: 'Ventas', debe: 0, haber: ingreso }], referencia: p.id });
        agregarAsiento({ id: generarId(), fecha: new Date().toISOString(), descripcion: `Costo de venta de ${p.totalVendido} unidades de ${p.nombre}`, tipo: 'costo', movimientos: [{ cuenta: 'Costo de Ventas', debe: costo, haber: 0 }, { cuenta: 'Inventario', debe: 0, haber: costo }], referencia: p.id });
      }
    });
  }
}

// ==========================================
//  EXPORTAR AL ÁMBITO GLOBAL
// ==========================================
window.productos = productos; window.lotes = lotes; window.asientos = asientos; window.sondeos = sondeos;
window.formatearUSD = formatearUSD;
window.getEmojiRecomendacion = getEmojiRecomendacion;
window.generarId = generarId;
window.generarSKU = generarSKU;
window.calcularCostoUnitario = calcularCostoUnitario;
window.calcularPrecioVenta = calcularPrecioVenta;
window.calcularEngagementPromedio = calcularEngagementPromedio;
window.calcularIndicePrioridad = calcularIndicePrioridad;
window.inicializarEstacionalidad = inicializarEstacionalidad;
window.actualizarEstacionalidad = actualizarEstacionalidad;
window.obtenerRecomendacionMes = obtenerRecomendacionMes;
window.migrarEstacionalidad = migrarEstacionalidad;
window.cargarDatos = cargarDatos;
window.guardarProductos = guardarProductos;
window.guardarLote = guardarLote;
window.agregarAsiento = agregarAsiento;
window.guardarAsientos = guardarAsientos;
window.guardarSondeos = guardarSondeos;
window.agregarSondeo = agregarSondeo;
window.agregarRegistroSondeo = agregarRegistroSondeo;
window.generarAsientosIniciales = generarAsientosIniciales;
console.log('✅ Core cargado correctamente');
