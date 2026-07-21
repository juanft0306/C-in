// ==========================================
//  C🌍in - UI (DOM, eventos, renderizado)
// ==========================================

// ----- Variables globales -----
let loteForm, productosBody, addProductoBtn, addGastoBtn, gastosWrapper;
let productList, productCount;
let gastoIndex = 0;
let productoRowIndex = 0;
let filtroActual = 'todos';
let currentTab = 'registro';

// ==========================================
//  MENÚ HAMBURGUESA (animado)
// ==========================================
function toggleMenu() {
  const hamburger = document.getElementById('hamburgerBtn');
  const nav = document.getElementById('tabsNav');
  if (hamburger && nav) {
    hamburger.classList.toggle('active');
    nav.classList.toggle('open');
  }
}

function closeMenu() {
  const hamburger = document.getElementById('hamburgerBtn');
  const nav = document.getElementById('tabsNav');
  if (hamburger && nav) {
    hamburger.classList.remove('active');
    nav.classList.remove('open');
  }
}

// ==========================================
//  NAVEGACIÓN ENTRE PANTALLAS
// ==========================================
function cambiarPantalla(tab) {
  currentTab = tab;
  
  // Actualizar tabs
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });

  // Mapeo de pestañas a archivos HTML
  const archivos = {
    registro: 'registro.html',
    recomendaciones: 'recomendaciones.html',
    inventario: 'inventario.html',
    contabilidad: 'contabilidad.html'
  };

  const archivo = archivos[tab] || 'registro.html';
  
  fetch(archivo)
    .then(response => {
      if (!response.ok) throw new Error(`No se pudo cargar ${archivo}`);
      return response.text();
    })
    .then(html => {
      document.getElementById('mainContainer').innerHTML = html;
      
      // Inicializar la UI según la pestaña
      switch (tab) {
        case 'registro':
          inicializarRegistro();
          break;
        case 'recomendaciones':
          inicializarRecomendaciones();
          break;
        case 'inventario':
          inicializarInventario();
          break;
        case 'contabilidad':
          inicializarContabilidad();
          break;
      }
      // Cerrar menú al cambiar de pestaña (móvil)
      closeMenu();
    })
    .catch(error => {
      document.getElementById('mainContainer').innerHTML = `
        <div style="text-align:center; padding:40px; color:#e74c3c;">
          <i class="fas fa-exclamation-triangle" style="font-size:2rem;"></i>
          <p>Error al cargar ${archivo}: ${error.message}</p>
          <p>Verifica que el archivo exista en la carpeta public.</p>
        </div>
      `;
      console.error(error);
    });
}

// ==========================================
//  GASTOS EXTRA - DINÁMICOS
// ==========================================
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
  items.forEach((item) => {
    const btn = item.querySelector('.btn-remove-gasto');
    if (btn) {
      btn.style.display = items.length > 1 ? 'inline-flex' : 'none';
    }
  });
}

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

function obtenerProductosFormulario() {
  const rows = productosBody.querySelectorAll('tr');
  const productosArray = [];
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
//  PANTALLA DE REGISTRO
// ==========================================
function inicializarRegistro() {
  loteForm = document.getElementById('loteForm');
  productosBody = document.getElementById('productosBody');
  addProductoBtn = document.getElementById('addProductoBtn');
  addGastoBtn = document.getElementById('addGastoBtn');
  gastosWrapper = document.getElementById('gastosWrapper');

  if (!loteForm || !productosBody) {
    console.error('❌ Error: No se encontraron elementos en registro.html');
    return;
  }

  productosBody.innerHTML = '';
  productoRowIndex = 0;
  agregarFilaProducto();
  agregarFilaProducto();

  gastosWrapper.innerHTML = '';
  gastoIndex = 0;
  agregarGasto();

  configurarEventosRegistro();
  console.log('✅ Pantalla de registro inicializada');
}

function configurarEventosRegistro() {
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

    // Generar asientos contables
    const valorLoteTotal = productosData.reduce((sum, p) => sum + (p.precio * p.cantidad), 0);
    const totalGastosExtra = gastosExtra.reduce((sum, g) => sum + g.monto, 0);
    const asientoCompra = {
      id: window.generarId(),
      fecha: fechaLlegada,
      descripcion: `Compra de lote ${loteId} - ${nuevosProductos.length} productos`,
      tipo: 'compra',
      movimientos: [
        { cuenta: 'Inventario', debe: valorLoteTotal + flete + totalGastosExtra, haber: 0 },
        { cuenta: 'Banco', debe: 0, haber: valorLoteTotal },
        { cuenta: 'Gastos de Envío', debe: flete, haber: 0 },
        { cuenta: 'Gastos Administrativos', debe: totalGastosExtra, haber: 0 }
      ],
      referencia: loteId,
      productos: nuevosProductos.map(p => p.id)
    };
    window.agregarAsiento(asientoCompra);

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

  addGastoBtn.addEventListener('click', () => agregarGasto());
  addProductoBtn.addEventListener('click', () => agregarFilaProducto());
}

// ==========================================
//  PANTALLA DE RECOMENDACIONES
// ==========================================
function inicializarRecomendaciones() {
  productList = document.getElementById('productList');
  productCount = document.getElementById('productCount');

  if (!productList) {
    console.error('❌ Error: No se encontraron elementos en recomendaciones.html');
    return;
  }

  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      filtroActual = this.dataset.filter;
      renderizarRecomendaciones();
    });
  });

  renderizarRecomendaciones();
  console.log('✅ Pantalla de recomendaciones inicializada');
}

function renderizarRecomendaciones() {
  const productos = window.productos;
  if (!productList) return;

  let productosFiltrados = productos;
  if (filtroActual === 'traer-mas') {
    productosFiltrados = productos.filter(p => {
      const prioridad = calcularPrioridad(p);
      return prioridad.recomendacion.includes('TRAER MÁS');
    });
  } else if (filtroActual === 'mantener') {
    productosFiltrados = productos.filter(p => {
      const prioridad = calcularPrioridad(p);
      return prioridad.recomendacion.includes('MANTENER');
    });
  } else if (filtroActual === 'dejar') {
    productosFiltrados = productos.filter(p => {
      const prioridad = calcularPrioridad(p);
      return prioridad.recomendacion.includes('DEJAR');
    });
  }

  if (productosFiltrados.length === 0) {
    productList.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-box-open"></i>
        <p>${productos.length === 0 ? 'No hay productos aún. Ve a la pestaña "Registro" para crear tu primer lote.' : 'No hay productos con este filtro.'}</p>
      </div>
    `;
    if (productCount) productCount.textContent = '0 productos';
    return;
  }

  let html = '';
  productosFiltrados.forEach(p => {
    const prioridad = calcularPrioridad(p);
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
        <div class="metric"><span class="label">📦 Rotación mensual</span><span class="value">${calcularRotacion(p).toFixed(1)} <span class="small">und/mes</span></span></div>
        <div class="metric"><span class="label">📱 Engagement promedio</span><span class="value">${window.calcularEngagementPromedio(p.interacciones || {}).toFixed(2)}%</span></div>
        <div class="metric"><span class="label">🗣️ Tasa conversión</span><span class="value">${calcularTasaConversion(p).toFixed(1)}%</span></div>
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
  if (productCount) productCount.textContent = productosFiltrados.length + ' productos';
}

// ==========================================
//  PANTALLA DE INVENTARIO
// ==========================================
function inicializarInventario() {
  const inventarioContainer = document.getElementById('inventarioContainer');
  const stockCount = document.getElementById('stockCount');
  const valorTotal = document.getElementById('valorTotal');
  const totalProductos = document.getElementById('totalProductos');

  if (!inventarioContainer) {
    console.error('❌ Error: No se encontraron elementos en inventario.html');
    return;
  }

  renderizarInventario();
  console.log('✅ Pantalla de inventario inicializada');
}

function renderizarInventario() {
  const inventarioContainer = document.getElementById('inventarioContainer');
  const stockCount = document.getElementById('stockCount');
  const valorTotal = document.getElementById('valorTotal');
  const totalProductos = document.getElementById('totalProductos');

  if (!inventarioContainer) return;

  const productos = window.productos;
  if (productos.length === 0) {
    inventarioContainer.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-boxes"></i>
        <p>No hay productos en el inventario.</p>
      </div>
    `;
    if (stockCount) stockCount.textContent = '0 unidades';
    if (valorTotal) valorTotal.textContent = '$0.00';
    if (totalProductos) totalProductos.textContent = '0';
    return;
  }

  // Agrupar por SKU
  const inventarioPorSKU = {};
  productos.forEach(p => {
    const sku = p.sku;
    if (!inventarioPorSKU[sku]) {
      inventarioPorSKU[sku] = {
        sku: sku,
        nombre: p.nombre,
        atributo: p.atributo || '',
        lotes: [],
        cantidadTotal: 0,
        costoTotal: 0
      };
    }
    const grupo = inventarioPorSKU[sku];
    grupo.lotes.push({
      id: p.id,
      loteId: p.loteId,
      cantidad: p.cantidadImportada,
      vendido: p.totalVendido || 0,
      stock: p.cantidadImportada - (p.totalVendido || 0),
      costoUnitario: p.costoUnitarioTotal,
      precioVenta: p.precioVentaSugerido,
      fechaLlegada: p.fechaLlegada
    });
    grupo.cantidadTotal += p.cantidadImportada;
    grupo.costoTotal += p.cantidadImportada * p.costoUnitarioTotal;
    if (p.atributo && !grupo.nombre.includes(p.atributo)) {
      grupo.nombre = p.nombre + ' (' + p.atributo + ')';
    }
  });

  // Calcular stock total y valor total
  let stockTotal = 0;
  let valorTotalInventario = 0;
  Object.values(inventarioPorSKU).forEach(grupo => {
    grupo.lotes.forEach(lote => {
      stockTotal += lote.stock;
      valorTotalInventario += lote.stock * lote.costoUnitario;
    });
  });

  if (stockCount) stockCount.textContent = stockTotal + ' unidades';
  if (valorTotal) valorTotal.textContent = window.formatearUSD(valorTotalInventario);
  if (totalProductos) totalProductos.textContent = Object.keys(inventarioPorSKU).length;

  // Generar HTML
  let html = '';
  Object.values(inventarioPorSKU).forEach(grupo => {
    const stockSKU = grupo.lotes.reduce((sum, l) => sum + l.stock, 0);
    const costoPromedio = grupo.costoTotal / grupo.cantidadTotal;

    html += `
      <div class="inventario-item">
        <div class="inventario-header">
          <h3>
            <span class="sku-badge">${grupo.sku}</span>
            ${grupo.nombre}
          </h3>
          <div class="inventario-resumen">
            <span class="badge">Stock: ${stockSKU} und</span>
            <span class="badge">Costo prom: ${window.formatearUSD(costoPromedio)}</span>
            <span class="badge">Valor: ${window.formatearUSD(stockSKU * costoPromedio)}</span>
          </div>
        </div>
        <div class="inventario-lotes">
          <table class="lotes-table">
            <thead>
              <tr>
                <th>Lote</th>
                <th>Fecha</th>
                <th>Comprados</th>
                <th>Vendidos</th>
                <th>Stock</th>
                <th>Costo unit.</th>
                <th>Valor stock</th>
              </tr>
            </thead>
            <tbody>
    `;

    grupo.lotes.forEach(lote => {
      const valorStock = lote.stock * lote.costoUnitario;
      const fecha = new Date(lote.fechaLlegada).toLocaleDateString('es-ES');
      html += `
        <tr>
          <td><span class="lote-id">${lote.loteId.substring(0, 8)}</span></td>
          <td>${fecha}</td>
          <td>${lote.cantidad}</td>
          <td>${lote.vendido}</td>
          <td><strong>${lote.stock}</strong></td>
          <td>${window.formatearUSD(lote.costoUnitario)}</td>
          <td>${window.formatearUSD(valorStock)}</td>
        </tr>
      `;
    });

    html += `
            </tbody>
          </table>
        </div>
      </div>
    `;
  });

  inventarioContainer.innerHTML = html;
}

// ==========================================
//  PANTALLA DE CONTABILIDAD
// ==========================================
function inicializarContabilidad() {
  const container = document.getElementById('contabilidadContainer');
  if (!container) {
    console.error('❌ Error: No se encontró contabilidadContainer');
    return;
  }

  // Configurar tabs internos
  document.querySelectorAll('.contab-tab').forEach(btn => {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.contab-tab').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      renderizarContabilidad(this.dataset.contab);
    });
  });

  // Si no hay asientos, generarlos desde productos
  if (window.asientos.length === 0) {
    window.generarAsientosIniciales();
  }

  renderizarContabilidad('diario');
  console.log('✅ Pantalla de contabilidad inicializada');
}

function renderizarContabilidad(vista) {
  const container = document.getElementById('contabilidadContainer');
  if (!container) return;

  switch (vista) {
    case 'diario':
      renderizarLibroDiario(container);
      break;
    case 'mayor':
      renderizarLibroMayor(container);
      break;
    case 'resultados':
      renderizarBalanceResultados(container);
      break;
    case 'general':
      renderizarBalanceGeneral(container);
      break;
    default:
      container.innerHTML = `<p>Vista no encontrada</p>`;
  }
}

function renderizarLibroDiario(container) {
  const asientos = window.asientos || [];
  if (asientos.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-book"></i>
        <p>No hay asientos contables registrados.</p>
      </div>
    `;
    document.getElementById('asientosCount').textContent = '0 asientos';
    return;
  }

  let html = `
    <h3 style="margin-bottom:16px;">📖 Libro Diario</h3>
    <div style="overflow-x:auto;">
      <table class="contabilidad-table">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Descripción</th>
            <th>Cuenta</th>
            <th>Debe</th>
            <th>Haber</th>
          </tr>
        </thead>
        <tbody>
  `;

  asientos.forEach(asiento => {
    const fecha = new Date(asiento.fecha).toLocaleDateString('es-ES');
    asiento.movimientos.forEach((mov, idx) => {
      html += `
        <tr>
          ${idx === 0 ? `<td rowspan="${asiento.movimientos.length}">${fecha}</td>` : ''}
          ${idx === 0 ? `<td rowspan="${asiento.movimientos.length}">${asiento.descripcion}</td>` : ''}
          <td>${mov.cuenta}</td>
          <td>${mov.debe > 0 ? window.formatearUSD(mov.debe) : ''}</td>
          <td>${mov.haber > 0 ? window.formatearUSD(mov.haber) : ''}</td>
        </tr>
      `;
    });
  });

  html += `
        </tbody>
      </table>
    </div>
  `;

  container.innerHTML = html;
  document.getElementById('asientosCount').textContent = asientos.length + ' asientos';
}

function renderizarLibroMayor(container) {
  const asientos = window.asientos || [];
  if (asientos.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-chart-bar"></i>
        <p>No hay movimientos para mostrar en el libro mayor.</p>
      </div>
    `;
    return;
  }

  const cuentas = {};
  asientos.forEach(asiento => {
    asiento.movimientos.forEach(mov => {
      if (!cuentas[mov.cuenta]) {
        cuentas[mov.cuenta] = { debe: 0, haber: 0, saldo: 0 };
      }
      cuentas[mov.cuenta].debe += mov.debe;
      cuentas[mov.cuenta].haber += mov.haber;
      cuentas[mov.cuenta].saldo = cuentas[mov.cuenta].debe - cuentas[mov.cuenta].haber;
    });
  });

  let html = `
    <h3 style="margin-bottom:16px;">📊 Libro Mayor (Cuentas T)</h3>
    <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap:16px;">
  `;

  for (const [cuenta, data] of Object.entries(cuentas)) {
    const esDeudora = data.saldo >= 0;
    html += `
      <div class="cuenta-t">
        <h4 style="text-align:center; border-bottom:2px solid var(--gold); padding-bottom:6px; margin-bottom:10px;">
          ${cuenta}
        </h4>
        <div style="display:flex; justify-content:space-between; font-size:0.9rem; padding:4px 8px;">
          <span><strong>Debe:</strong> ${window.formatearUSD(data.debe)}</span>
          <span><strong>Haber:</strong> ${window.formatearUSD(data.haber)}</span>
        </div>
        <div style="text-align:center; margin-top:8px; padding:6px; background:${esDeudora ? 'rgba(46, 204, 113, 0.2)' : 'rgba(231, 76, 60, 0.2)'}; border-radius:6px;">
          <strong>Saldo:</strong> ${esDeudora ? 'Deudor' : 'Acreedor'} ${window.formatearUSD(Math.abs(data.saldo))}
        </div>
      </div>
    `;
  }

  html += `</div>`;
  container.innerHTML = html;
}

function renderizarBalanceResultados(container) {
  const asientos = window.asientos || [];
  if (asientos.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-chart-pie"></i>
        <p>No hay datos para calcular el balance de resultados.</p>
      </div>
    `;
    return;
  }

  let ingresos = 0;
  let gastos = 0;

  asientos.forEach(asiento => {
    asiento.movimientos.forEach(mov => {
      const cuenta = mov.cuenta;
      if (cuenta === 'Ventas') ingresos += mov.haber - mov.debe;
      else if (cuenta === 'Costo de Ventas') gastos += mov.debe - mov.haber;
      else if (cuenta.includes('Gasto')) gastos += mov.debe - mov.haber;
    });
  });

  const resultado = ingresos - gastos;

  let html = `
    <h3 style="margin-bottom:16px;">📈 Balance de Resultados</h3>
    <div style="max-width:500px; margin:0 auto;">
      <div style="display:flex; justify-content:space-between; padding:12px; border-bottom:1px solid var(--border-color);">
        <span><strong>Ingresos (Ventas)</strong></span>
        <span style="color:#2ecc71;">${window.formatearUSD(ingresos)}</span>
      </div>
      <div style="display:flex; justify-content:space-between; padding:12px; border-bottom:1px solid var(--border-color);">
        <span><strong>Gastos</strong></span>
        <span style="color:#e74c3c;">${window.formatearUSD(gastos)}</span>
      </div>
      <div style="display:flex; justify-content:space-between; padding:16px; background:var(--gold); color:#0a0e27; border-radius:8px; margin-top:12px; font-weight:bold; font-size:1.2rem;">
        <span>Resultado Neto</span>
        <span>${resultado >= 0 ? '🟢' : '🔴'} ${window.formatearUSD(resultado)}</span>
      </div>
    </div>
  `;

  container.innerHTML = html;
}

function renderizarBalanceGeneral(container) {
  const asientos = window.asientos || [];
  if (asientos.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-balance-scale"></i>
        <p>No hay datos para calcular el balance general.</p>
      </div>
    `;
    return;
  }

  let activo = 0;
  let pasivo = 0;
  let capital = 0;

  asientos.forEach(asiento => {
    asiento.movimientos.forEach(mov => {
      const cuenta = mov.cuenta;
      if (cuenta === 'Inventario' || cuenta === 'Banco') {
        activo += mov.debe - mov.haber;
      } else if (cuenta === 'Proveedores') {
        pasivo += mov.haber - mov.debe;
      } else if (cuenta === 'Capital') {
        capital += mov.haber - mov.debe;
      }
    });
  });

  if (capital === 0) {
    let ingresos = 0;
    let gastos = 0;
    asientos.forEach(asiento => {
      asiento.movimientos.forEach(mov => {
        if (mov.cuenta === 'Ventas') ingresos += mov.haber - mov.debe;
        else if (mov.cuenta === 'Costo de Ventas') gastos += mov.debe - mov.haber;
        else if (mov.cuenta.includes('Gasto')) gastos += mov.debe - mov.haber;
      });
    });
    capital = ingresos - gastos;
  }

  const totalPasivoCapital = pasivo + capital;

  let html = `
    <h3 style="margin-bottom:16px;">🏦 Balance General</h3>
    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px; max-width:600px; margin:0 auto;">
      <div style="background:var(--glass-bg); padding:16px; border-radius:12px; border:1px solid var(--border-color);">
        <h4 style="color:var(--gold);">Activos</h4>
        <div style="font-size:2rem; font-weight:bold;">${window.formatearUSD(activo)}</div>
        <div style="font-size:0.85rem; color:var(--text-secondary);">Recursos de la empresa</div>
      </div>
      <div style="background:var(--glass-bg); padding:16px; border-radius:12px; border:1px solid var(--border-color);">
        <h4 style="color:var(--gold);">Pasivo + Capital</h4>
        <div style="font-size:2rem; font-weight:bold;">${window.formatearUSD(totalPasivoCapital)}</div>
        <div style="font-size:0.85rem; color:var(--text-secondary);">
          Pasivo: ${window.formatearUSD(pasivo)} | Capital: ${window.formatearUSD(capital)}
        </div>
      </div>
    </div>
    <div style="text-align:center; margin-top:16px; padding:12px; background:${Math.abs(activo - totalPasivoCapital) < 0.01 ? 'rgba(46,204,113,0.2)' : 'rgba(231,76,60,0.2)'}; border-radius:8px;">
      <strong>${Math.abs(activo - totalPasivoCapital) < 0.01 ? '✅' : '⚠️'} Ecuación contable:</strong>
      Activo (${window.formatearUSD(activo)}) ${Math.abs(activo - totalPasivoCapital) < 0.01 ? '=' : '≠'} 
      Pasivo + Capital (${window.formatearUSD(totalPasivoCapital)})
    </div>
  `;

  container.innerHTML = html;
}

// ==========================================
//  FUNCIONES DE CÁLCULO PARA RECOMENDACIONES E INVENTARIO
// ==========================================
function calcularRotacion(p) {
  const dias = Math.max(1, (Date.now() - new Date(p.fechaLlegada).getTime()) / (1000 * 60 * 60 * 24));
  return (p.totalVendido || 0) / dias * 30;
}

function calcularTasaConversion(p) {
  const preguntas = p.preguntasRegistradas || 1;
  return ((p.totalVendido || 0) / preguntas) * 100;
}

function calcularPrioridad(p) {
  const rotacion = calcularRotacion(p);
  const engagement = window.calcularEngagementPromedio(p.interacciones || {});
  const tasaConversion = calcularTasaConversion(p);
  return window.calcularIndicePrioridad(p.costoUnitarioTotal, rotacion, engagement, tasaConversion);
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

  // Asientos contables de venta
  const ingreso = cant * prod.precioVentaSugerido;
  const costo = cant * prod.costoUnitarioTotal;
  const asientoVenta = {
    id: window.generarId(),
    fecha: new Date().toISOString(),
    descripcion: `Venta de ${cant} unidades de ${prod.nombre} (SKU: ${prod.sku})`,
    tipo: 'venta',
    movimientos: [
      { cuenta: 'Banco', debe: ingreso, haber: 0 },
      { cuenta: 'Ventas', debe: 0, haber: ingreso }
    ],
    referencia: prod.id
  };
  window.agregarAsiento(asientoVenta);

  const asientoCosto = {
    id: window.generarId(),
    fecha: new Date().toISOString(),
    descripcion: `Costo de venta de ${cant} unidades de ${prod.nombre}`,
    tipo: 'costo',
    movimientos: [
      { cuenta: 'Costo de Ventas', debe: costo, haber: 0 },
      { cuenta: 'Inventario', debe: 0, haber: costo }
    ],
    referencia: prod.id
  };
  window.agregarAsiento(asientoCosto);

  const currentTab = document.querySelector('.tab-btn.active')?.dataset.tab || 'registro';
  if (currentTab === 'recomendaciones') renderizarRecomendaciones();
  else if (currentTab === 'inventario') renderizarInventario();
  else if (currentTab === 'contabilidad') renderizarContabilidad(document.querySelector('.contab-tab.active')?.dataset.contab || 'diario');

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

  const currentTab = document.querySelector('.tab-btn.active')?.dataset.tab || 'registro';
  if (currentTab === 'recomendaciones') renderizarRecomendaciones();
  else if (currentTab === 'inventario') renderizarInventario();
  else if (currentTab === 'contabilidad') renderizarContabilidad(document.querySelector('.contab-tab.active')?.dataset.contab || 'diario');

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

  const currentTab = document.querySelector('.tab-btn.active')?.dataset.tab || 'registro';
  if (currentTab === 'recomendaciones') renderizarRecomendaciones();
  else if (currentTab === 'inventario') renderizarInventario();
  else if (currentTab === 'contabilidad') renderizarContabilidad(document.querySelector('.contab-tab.active')?.dataset.contab || 'diario');

  alert('✅ Métricas de redes actualizadas correctamente.');
};

window.eliminarProducto = function(id) {
  if (!confirm('¿Seguro que deseas eliminar este producto?')) return;
  window.productos = window.productos.filter(p => p.id !== id);
  window.guardarProductos();

  const currentTab = document.querySelector('.tab-btn.active')?.dataset.tab || 'registro';
  if (currentTab === 'recomendaciones') renderizarRecomendaciones();
  else if (currentTab === 'inventario') renderizarInventario();
  else if (currentTab === 'contabilidad') renderizarContabilidad(document.querySelector('.contab-tab.active')?.dataset.contab || 'diario');
};

// ==========================================
//  INICIALIZACIÓN GENERAL
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
  // Cargar datos
  window.cargarDatos();

  // Si no hay asientos, generarlos desde productos
  if (window.asientos.length === 0) {
    window.generarAsientosIniciales();
  }

  // Configurar navegación por tabs
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      cambiarPantalla(this.dataset.tab);
    });
  });

  // Menú hamburguesa
  const hamburger = document.getElementById('hamburgerBtn');
  if (hamburger) {
    hamburger.addEventListener('click', toggleMenu);
  }

  // Cerrar menú al hacer clic en una pestaña (móvil)
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', closeMenu);
  });

  // Botón refrescar (header)
  document.getElementById('btnRefresh').addEventListener('click', () => {
    window.cargarDatos();
    const currentTab = document.querySelector('.tab-btn.active')?.dataset.tab || 'registro';
    if (currentTab === 'recomendaciones') renderizarRecomendaciones();
    else if (currentTab === 'inventario') renderizarInventario();
    else if (currentTab === 'contabilidad') renderizarContabilidad(document.querySelector('.contab-tab.active')?.dataset.contab || 'diario');
    alert('✅ Datos actualizados desde localStorage.');
  });

  // Cargar la primera pantalla (registro)
  cambiarPantalla('registro');
});
