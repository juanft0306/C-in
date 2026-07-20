// ==========================================
//  C🌍in - Frontend con localStorage y lotes
// ==========================================

// ----- Constantes -----
const STORAGE_KEY = 'coin_productos';
const LOTES_KEY = 'coin_lotes';

// ----- Estado global -----
let productos = [];
let lotes = [];

// ----- DOM References -----
const loteForm = document.getElementById('loteForm');
const productosBody = document.getElementById('productosBody');
const addProductoBtn = document.getElementById('addProductoBtn');
const addGastoBtn = document.getElementById('addGastoBtn');
const gastosWrapper = document.getElementById('gastosWrapper');
const productList = document.getElementById('productList');
const productCount = document.getElementById('productCount');
const btnRefresh = document.getElementById('btnRefresh');

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
//  GENERACIÓN AUTOMÁTICA DE SKU
//  Formato: Letra mayúscula + 3 dígitos (ej: A001)
// ==========================================
function generarSKU(nombre, skusExistentes) {
  if (!nombre || nombre.trim() === '') return '';
  const letra = nombre.trim().charAt(0).toUpperCase();
  // Filtrar SKUs que empiezan con esa letra y tienen 4 caracteres (letra + 3 dígitos)
  const skusConLetra = skusExistentes.filter(sku => sku.startsWith(letra) && sku.length === 4);
  // Extraer los números y encontrar el máximo
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
//  GASTOS EXTRA - DINÁMICOS
// ==========================================
let gastoIndex = 0;

function agregarGasto(concepto = '', monto = '') {
  gastoIndex++;
  const div = document.createElement('div');
  div.className = 'gasto-item';
  div.dataset.index = gastoIndex;
  div.innerHTML = `
    <input type="text" class="gasto-concepto" placeholder="Concepto" value="${concepto}" />
    <input type="number" step="0.01" class="gasto-monto" placeholder="Monto" value="${monto}" />
    <button type="button" class="btn-remove-gasto"><i class="fas fa-trash"></i></button>
  `;
  const removeBtn = div.querySelector('.btn-remove-gasto');
  removeBtn.addEventListener('click', () => {
    div.remove();
    actualizarVisibilidadEliminarGasto();
  });
  gastosWrapper.appendChild(div);
  actualizarVisibilidadEliminarGasto();
}

function actualizarVisibilidadEliminarGasto() {
  const items = gastosWrapper.querySelectorAll('.gasto-item');
  items.forEach((item, idx) => {
    const btn = item.querySelector('.btn-remove-gasto');
    if (btn) {
      btn.style.display = items.length > 1 ? 'inline-flex' : 'none';
    }
  });
}

addGastoBtn.addEventListener('click', () => agregarGasto());
// Inicializar con un gasto vacío
agregarGasto();

function obtenerGastos() {
  const items = gastosWrapper.querySelectorAll('.gasto-item');
  const gastos = [];
  items.forEach(item => {
    const concepto = item.querySelector('.gasto-concepto').value.trim();
    const monto = parseFloat(item.querySelector('.gasto-monto').value) || 0;
    if (concepto || monto > 0) {
      gastos.push({ concepto: concepto || 'Gasto extra', monto });
    }
  });
  return gastos;
}

// ==========================================
//  PRODUCTOS DINÁMICOS EN EL FORMULARIO
// ==========================================
let productoRowIndex = 0;

function agregarFilaProducto(nombre = '', sku = '', precio = '', cantidad = '', atributo = '') {
  productoRowIndex++;
  const tr = document.createElement('tr');
  tr.dataset.index = productoRowIndex;
  tr.innerHTML = `
    <td><input type="text" class="prod-nombre" placeholder="Ej: Cargador" value="${nombre}" required /></td>
    <td><input type="text" class="prod-sku" placeholder="A001" value="${sku}" /></td>
    <td><input type="number" step="0.01" class="prod-precio" placeholder="1.20" value="${precio}" required /></td>
    <td><input type="number" step="1" class="prod-cantidad" placeholder="100" value="${cantidad}" required /></td>
    <td><input type="text" class="prod-atributo" placeholder="Color/Tamaño" value="${atributo}" /></td>
    <td><button type="button" class="btn-remove-fila"><i class="fas fa-trash"></i></button></td>
  `;
  const removeBtn = tr.querySelector('.btn-remove-fila');
  removeBtn.addEventListener('click', () => {
    tr.remove();
  });
  productosBody.appendChild(tr);
}

addProductoBtn.addEventListener('click', () => agregarFilaProducto());

// Agregar 2 filas iniciales vacías
agregarFilaProducto();
agregarFilaProducto();

function obtenerProductosFormulario() {
  const rows = productosBody.querySelectorAll('tr');
  const productosArray = [];
  // Recoger todos los SKUs ya existentes en localStorage y los que ya hemos procesado en este lote
  const skusGlobales = productos.map(p => p.sku).filter(s => s && s.length === 4);
  const skusEnLote = [];
  rows.forEach(tr => {
    const skuInput = tr.querySelector('.prod-sku');
    if (skuInput) {
      const sku = skuInput.value.trim().toUpperCase();
      if (sku) skusEnLote.push(sku);
    }
  });
  const skusExistentes = [...skusGlobales, ...skusEnLote];

  rows.forEach(tr => {
    const nombre = tr.querySelector('.prod-nombre').value.trim();
    const skuInput = tr.querySelector('.prod-sku');
    let sku = skuInput.value.trim().toUpperCase();
    const precio = parseFloat(tr.querySelector('.prod-precio').value);
    const cantidad = parseInt(tr.querySelector('.prod-cantidad').value);
    const atributo = tr.querySelector('.prod-atributo').value.trim();

    // Si el SKU está vacío o es solo el placeholder, generarlo automáticamente
    if (!sku || sku === '') {
      if (nombre) {
        sku = generarSKU(nombre, skusExistentes);
        // Actualizar el campo visual para que el usuario vea el SKU generado
        skuInput.value = sku;
      } else {
        // Si no hay nombre, no se puede generar SKU
        sku = '';
      }
    }

    // Validar que el SKU tenga el formato correcto (opcional, pero lo dejamos)
    if (sku && !/^[A-Z]\d{3}$/.test(sku)) {
      // Si no cumple el formato, lo dejamos como está, pero podría avisar
      console.warn(`SKU ${sku} no tiene el formato esperado (Letra + 3 dígitos)`);
    }

    if (nombre && sku && !isNaN(precio) && precio > 0 && !isNaN(cantidad) && cantidad > 0) {
      productosArray.push({ nombre, sku, precio, cantidad, atributo });
      // Agregar este SKU a los existentes para evitar duplicados en el mismo lote
      skusExistentes.push(sku);
    }
  });
  return productosArray;
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
  productCount.textContent = productos.length + ' productos';
}

function guardarLote(loteData) {
  lotes.push(loteData);
  localStorage.setItem(LOTES_KEY, JSON.stringify(lotes));
}

// ==========================================
//  RENDERIZAR LISTA DE PRODUCTOS
// ==========================================
function renderizarProductos() {
  if (productos.length === 0) {
    productList.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-box-open"></i>
        <p>No hay productos aún. Crea tu primer lote arriba.</p>
      </div>
    `;
    productCount.textContent = '0 productos';
    return;
  }

  let html = '';
  productos.forEach(p => {
    const dias = Math.max(1, (Date.now() - new Date(p.fechaLlegada).getTime()) / (1000 * 60 * 60 * 24));
    const rotacionMensual = (p.totalVendido || 0) / dias * 30;
    const engagement = calcularEngagementPromedio(p.interacciones || {});
    const preguntas = p.preguntasRegistradas || 1;
    const tasaConversion = ((p.totalVendido || 0) / preguntas) * 100;
    const prioridad = calcularIndicePrioridad(p.costoUnitarioTotal, rotacionMensual, engagement, tasaConversion);
    const precioData = calcularPrecioVenta(p.costoUnitarioTotal, 'porcentaje', p.margenGanancia || 40);

    const emoji = getEmojiRecomendacion(prioridad.recomendacion);
    const colorPrioridad = prioridad.indice > 70 ? '#2ecc71' : (prioridad.indice > 40 ? '#f1c40f' : '#e74c3c');

    html += `
      <div class="product-item" data-id="${p.id}">
        <div class="product-header">
          <h3>
            ${emoji} ${p.nombre}
            <span class="sku">SKU: ${p.sku}</span>
            ${p.atributo ? `<span style="font-size:0.8rem;color:var(--text-secondary);">(${p.atributo})</span>` : ''}
          </h3>
          <span class="recomendacion" style="color:${colorPrioridad};">
            ${prioridad.recomendacion} (${prioridad.indice} pts)
          </span>
        </div>
        <div class="metric"><span class="label">💰 Costo unitario</span><span class="value">${formatearUSD(p.costoUnitarioTotal)}</span></div>
        <div class="metric"><span class="label">🏷️ Precio venta</span><span class="value">${formatearUSD(precioData.precioVenta)} <span class="small">(${p.margenGanancia}% margen)</span></span></div>
        <div class="metric"><span class="label">📦 Rotación mensual</span><span class="value">${rotacionMensual.toFixed(1)} <span class="small">und/mes</span></span></div>
        <div class="metric"><span class="label">📱 Engagement promedio</span><span class="value">${engagement.toFixed(2)}%</span></div>
        <div class="metric"><span class="label">🗣️ Tasa conversión</span><span class="value">${tasaConversion.toFixed(1)}%</span></div>
        <div class="metric"><span class="label">📊 Prioridad</span><span class="value" style="color:${colorPrioridad};">${prioridad.indice}/100</span></div>
        <div class="product-actions">
          <button class="btn-small" onclick="registrarVenta('${p.id}')"><i class="fas fa-shopping-cart"></i> Vender</button>
          <button class="btn-small" onclick="registrarPregunta('${p.id}')"><i class="fas fa-question-circle"></i> Preguntaron</button>
          <button class="btn-small" onclick="actualizarRedes('${p.id}')"><i class="fas fa-share-alt"></i> Redes</button>
          <button class="btn-small" onclick="eliminarProducto('${p.id}')" style="color:#e74c3c;"><i class="fas fa-trash"></i></button>
        </div>
      </div>
    `;
  });

  productList.innerHTML = html;
  productCount.textContent = productos.length + ' productos';
}

// ==========================================
//  ACCIONES RÁPIDAS (ventas, preguntas, redes, eliminar)
// ==========================================
window.registrarVenta = function(id) {
  const cantidad = prompt('¿Cuántas unidades se vendieron?', '1');
  if (cantidad === null) return;
  const prod = productos.find(p => p.id === id);
  if (!prod) return alert('Producto no encontrado');
  const cant = parseInt(cantidad) || 1;
  prod.totalVendido = (prod.totalVendido || 0) + cant;
  prod.ventasRegistradas = prod.ventasRegistradas || [];
  prod.ventasRegistradas.push({ cantidad: cant, fecha: new Date().toISOString() });
  guardarProductos();
  renderizarProductos();
  alert(`✅ Venta registrada. Total vendido: ${prod.totalVendido} unidades.`);
};

window.registrarPregunta = function(id) {
  const cantidad = prompt('¿Cuántas preguntas recibiste?', '1');
  if (cantidad === null) return;
  const prod = productos.find(p => p.id === id);
  if (!prod) return alert('Producto no encontrado');
  const cant = parseInt(cantidad) || 1;
  prod.preguntasRegistradas = (prod.preguntasRegistradas || 0) + cant;
  guardarProductos();
  renderizarProductos();
  alert(`✅ Preguntas registradas. Total: ${prod.preguntasRegistradas}.`);
};

window.actualizarRedes = function(id) {
  const prod = productos.find(p => p.id === id);
  if (!prod) return alert('Producto no encontrado');
  const datos = prod.interacciones || { instagram: {}, tiktok: {}, marketplace: {} };
  const instaLikes = prompt('Instagram - Likes:', datos.instagram?.likes || 0);
  if (instaLikes === null) return;
  const instaCom = prompt('Instagram - Comentarios:', datos.instagram?.comentarios || 0);
  const instaShare = prompt('Instagram - Compartidos:', datos.instagram?.compartidos || 0);
  const instaAlc = prompt('Instagram - Alcance:', datos.instagram?.alcance || 100);

  const ttkLikes = prompt('TikTok - Likes:', datos.tiktok?.likes || 0);
  const ttkCom = prompt('TikTok - Comentarios:', datos.tiktok?.comentarios || 0);
  const ttkShare = prompt('TikTok - Compartidos:', datos.tiktok?.compartidos || 0);
  const ttkAlc = prompt('TikTok - Alcance:', datos.tiktok?.alcance || 100);

  const mktLikes = prompt('Marketplace - Likes:', datos.marketplace?.likes || 0);
  const mktCom = prompt('Marketplace - Comentarios:', datos.marketplace?.comentarios || 0);
  const mktShare = prompt('Marketplace - Compartidos:', datos.marketplace?.compartidos || 0);
  const mktAlc = prompt('Marketplace - Alcance:', datos.marketplace?.alcance || 100);

  prod.interacciones = {
    instagram: { likes: parseInt(instaLikes)||0, comentarios: parseInt(instaCom)||0, compartidos: parseInt(instaShare)||0, alcance: parseInt(instaAlc)||100 },
    tiktok: { likes: parseInt(ttkLikes)||0, comentarios: parseInt(ttkCom)||0, compartidos: parseInt(ttkShare)||0, alcance: parseInt(ttkAlc)||100 },
    marketplace: { likes: parseInt(mktLikes)||0, comentarios: parseInt(mktCom)||0, compartidos: parseInt(mktShare)||0, alcance: parseInt(mktAlc)||100 }
  };
  guardarProductos();
  renderizarProductos();
  alert('✅ Métricas de redes actualizadas correctamente.');
};

window.eliminarProducto = function(id) {
  if (!confirm('¿Seguro que deseas eliminar este producto?')) return;
  productos = productos.filter(p => p.id !== id);
  guardarProductos();
  renderizarProductos();
};

// ==========================================
//  ENVIAR FORMULARIO (guardar lote)
// ==========================================
loteForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const flete = parseFloat(document.getElementById('flete').value) || 0;
  const gastosExtra = obtenerGastos();
  const productosData = obtenerProductosFormulario();

  if (productosData.length === 0) {
    alert('⚠️ Debes agregar al menos un producto válido.');
    return;
  }

  const modoPrecio = document.getElementById('modoPrecio').value;
  const valorPrecio = parseFloat(document.getElementById('valorPrecio').value) || 0;

  // Calcular valor total del lote
  let valorTotalLote = 0;
  productosData.forEach(p => {
    valorTotalLote += p.precio * p.cantidad;
  });

  if (valorTotalLote === 0) {
    alert('⚠️ El valor total del lote no puede ser cero.');
    return;
  }

  // Crear productos individuales
  const nuevosProductos = [];
  const loteId = generarId();
  const fechaLlegada = new Date().toISOString();

  productosData.forEach(p => {
    const valorProducto = p.precio * p.cantidad;
    const costoUnitario = calcularCostoUnitario(
      p.precio,
      p.cantidad,
      flete,
      gastosExtra,
      valorTotalLote,
      valorProducto
    );
    const precioData = calcularPrecioVenta(costoUnitario, modoPrecio, valorPrecio);

    const producto = {
      id: generarId(),
      loteId: loteId,
      nombre: p.nombre,
      sku: p.sku,
      atributo: p.atributo || '',
      precioUnitarioChina: p.precio,
      cantidadImportada: p.cantidad,
      fleteInternacional: flete,
      gastosExtra: gastosExtra,
      costoUnitarioTotal: costoUnitario,
      precioVentaSugerido: precioData.precioVenta,
      margenGanancia: precioData.margenGanancia,
      fechaLlegada: fechaLlegada,
      interacciones: { instagram: {}, tiktok: {}, marketplace: {} },
      ventasRegistradas: [],
      totalVendido: 0,
      preguntasRegistradas: 0
    };
    nuevosProductos.push(producto);
  });

  // Guardar lote (opcional, para referencia)
  guardarLote({
    id: loteId,
    fecha: fechaLlegada,
    flete,
    gastosExtra,
    productos: nuevosProductos.map(p => p.id)
  });

  // Agregar a la lista global
  productos = productos.concat(nuevosProductos);
  guardarProductos();
  renderizarProductos();

  // Resetear formulario (mantener solo 2 filas de productos vacías)
  productosBody.innerHTML = '';
  agregarFilaProducto();
  agregarFilaProducto();
  document.getElementById('flete').value = '0';
  gastosWrapper.innerHTML = '';
  agregarGasto();
  document.getElementById('modoPrecio').value = 'porcentaje';
  document.getElementById('valorPrecio').value = '40';

  alert(`✅ Lote guardado con ${nuevosProductos.length} productos.`);
});

// =========================
