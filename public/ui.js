// ==========================================
//  C🌍in - UI (DOM, eventos, renderizado)
// ==========================================

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
  // Recoger SKUs existentes en localStorage y en el lote actual
  const skusGlobales = window.productos.map(p => p.sku).filter(s => s && s.length === 4);
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

    if (!sku || sku === '') {
      if (nombre) {
        sku = window.generarSKU(nombre, skusExistentes);
        skuInput.value = sku;
      } else {
        sku = '';
      }
    }

    if (nombre && sku && !isNaN(precio) && precio > 0 && !isNaN(cantidad) && cantidad > 0) {
      productosArray.push({ nombre, sku, precio, cantidad, atributo });
      skusExistentes.push(sku);
    }
  });
  return productosArray;
}

// ==========================================
//  RENDERIZAR LISTA DE PRODUCTOS
// ==========================================
function renderizarProductos() {
  const productos = window.productos;
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
    const engagement = window.calcularEngagementPromedio(p.interacciones || {});
    const preguntas = p.preguntasRegistradas || 1;
    const tasaConversion = ((p.totalVendido || 0) / preguntas) * 100;
    const prioridad = window.calcularIndicePrioridad(p.costoUnitarioTotal, rotacionMensual, engagement, tasaConversion);
    const precioData = window.calcularPrecioVenta(p.costoUnitarioTotal, 'porcentaje', p.margenGanancia || 40);

    const emoji = window.getEmojiRecomendacion(prioridad.recomendacion);
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
        <div class="metric"><span class="label">💰 Costo unitario</span><span class="value">${window.formatearUSD(p.costoUnitarioTotal)}</span></div>
        <div class="metric"><span class="label">🏷️ Precio venta</span><span class="value">${window.formatearUSD(precioData.precioVenta)} <span class="small">(${p.margenGanancia}% margen)</span></span></div>
        <div class="metric"><span class="label">📦 Rotación mensual</span><span class="value">${rotacionMensual.toFixed(1)} <span class="small">und/mes</span></span></div>
        <div class="metric"><span class="label">📱 Engagement promedio</span><span class="value">${engagement.toFixed(2)}%</span></div>
        <div class="metric"><span class="label">🗣️ Tasa conversión</span><span class="value">${tasaConversion.toFixed(1)}%</span></div>
        <div class="metric"><span class="label">📊 Prioridad</span><span class="value" style="color:${colorPrioridad};">${prioridad.indice}/100</span></div>
        <div class="product-actions">
          <button class="btn-small" onclick="window.registrarVenta('${p.id}')"><i class="fas fa-shopping-cart"></i> Vender</button>
          <button class="btn-small" onclick="window.registrarPregunta('${p.id}')"><i class="fas fa-question-circle"></i> Preguntaron</button>
          <button class="btn-small" onclick="window.actualizarRedes('${p.id}')"><i class="fas fa-share-alt"></i> Redes</button>
          <button class="btn-small" onclick="window.eliminarProducto('${p.id}')" style="color:#e74c3c;"><i class="fas fa-trash"></i></button>
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
  const prod = window.productos.find(p => p.id === id);
  if (!prod) return alert('Producto no encontrado');
  const cant = parseInt(cantidad) || 1;
  prod.totalVendido = (prod.totalVendido || 0) + cant;
  prod.ventasRegistradas = prod.ventasRegistradas || [];
  prod.ventasRegistradas.push({ cantidad: cant, fecha: new Date().toISOString() });
  window.guardarProductos();
  renderizarProductos();
  alert(`✅ Venta registrada. Total vendido: ${prod.totalVendido} unidades.`);
};

window.registrarPregunta = function(id) {
  const cantidad = prompt('¿Cuántas preguntas recibiste?', '1');
  if (cantidad === null) return;
  const prod = window.productos.find(p => p.id === id);
  if (!prod) return alert('Producto no encontrado');
  const cant = parseInt(cantidad) || 1;
  prod.preguntasRegistradas = (prod.preguntasRegistradas || 0) + cant;
  window.guardarProductos();
  renderizarProductos();
  alert(`✅ Preguntas registradas. Total: ${prod.preguntasRegistradas}.`);
};

window.actualizarRedes = function(id) {
  const prod = window.productos.find(p => p.id === id);
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
  window.guardarProductos();
  renderizarProductos();
  alert('✅ Métricas de redes actualizadas correctamente.');
};

window.eliminarProducto = function(id) {
  if (!confirm('¿Seguro que deseas eliminar este producto?')) return;
  window.productos = window.productos.filter(p => p.id !== id);
  window.guardarProductos();
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

  let valorTotalLote = 0;
  productosData.forEach(p => {
    valorTotalLote += p.precio * p.cantidad;
  });

  if (valorTotalLote === 0) {
    alert('⚠️ El valor total del lote no puede ser cero.');
    return;
  }

  const nuevosProductos = [];
  const loteId = window.generarId();
  const fechaLlegada = new Date().toISOString();

  productosData.forEach(p => {
    const valorProducto = p.precio * p.cantidad;
    const costoUnitario = window.calcularCostoUnitario(
      p.precio,
      p.cantidad,
      flete,
      gastosExtra,
      valorTotalLote,
      valorProducto
    );
    const precioData = window.calcularPrecioVenta(costoUnitario, modoPrecio, valorPrecio);

    const producto = {
      id: window.generarId(),
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

  window.guardarLote({
    id: loteId,
    fecha: fechaLlegada,
    flete,
    gastosExtra,
    productos: nuevosProductos.map(p => p.id)
  });

  window.productos = window.productos.concat(nuevosProductos);
  window.guardarProductos();
  renderizarProductos();

  // Resetear formulario
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

// ==========================================
//  REFRESCAR
// ==========================================
btnRefresh.addEventListener('click', () => {
  window.cargarDatos();
  renderizarProductos();
});

// ==========================================
//  INICIO
// ==========================================
window.cargarDatos();
renderizarProductos();
