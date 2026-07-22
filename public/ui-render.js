// ==========================================
//  C🌍in - UI Render (pantallas)
// ==========================================

// ==========================================
//  REGISTRO
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
    productosData.forEach(p => { valorTotalLote += p.precio * p.cantidad; });

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
        p.precio, p.cantidad, flete, gastosExtra, valorTotalLote, valorProducto
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
        preguntasRegistradas: [],
        competidores: [],
        estacionalidad: window.inicializarEstacionalidad()
      };
      nuevosProductos.push(producto);
    });

    // Guardar lote y productos
    window.guardarLote({ id: loteId, fecha: fechaLlegada, flete, gastosExtra, productos: nuevosProductos.map(p => p.id) });
    window.productos = window.productos.concat(nuevosProductos);
    window.guardarProductos();

    // Asiento contable
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

    // ===== ACTUALIZAR TODAS LAS VISTAS =====
    // Esperamos un momento para que los datos se guarden en localStorage
    setTimeout(() => {
      // Forzar actualización de Recomendaciones e Inventario si están activas
      const currentTab = document.querySelector('.tab-btn.active')?.dataset.tab || 'registro';
      
      console.log(`📌 Actualizando vista: ${currentTab}`);
      
      if (currentTab === 'recomendaciones' && typeof renderizarRecomendaciones === 'function') {
        renderizarRecomendaciones();
        console.log('✅ Recomendaciones actualizadas');
      } else if (currentTab === 'inventario' && typeof renderizarInventario === 'function') {
        renderizarInventario();
        console.log('✅ Inventario actualizado');
      } else if (currentTab === 'contabilidad') {
        actualizarContabilidadSiActiva();
        console.log('✅ Contabilidad actualizada');
      } else {
        // Si estamos en Registro o en otra pestaña, igualmente actualizamos
        // Recomendaciones e Inventario en segundo plano para que cuando el usuario cambie,
        // ya estén actualizados.
        if (typeof renderizarRecomendaciones === 'function') {
          renderizarRecomendaciones();
          console.log('✅ Recomendaciones actualizadas en segundo plano');
        }
        if (typeof renderizarInventario === 'function') {
          renderizarInventario();
          console.log('✅ Inventario actualizado en segundo plano');
        }
        // También actualizar contabilidad
        actualizarContabilidadSiActiva();
      }
    }, 200); // Pequeño delay para asegurar que localStorage se haya actualizado
  });

  addGastoBtn.addEventListener('click', () => agregarGasto());
  addProductoBtn.addEventListener('click', () => agregarFilaProducto());
}

// ==========================================
//  RECOMENDACIONES
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
  const productos = window.productos || [];
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
        <p>${productos.length === 0 ? 'No hay productos aún. Ve a "Registro" para crear tu primer lote.' : 'No hay productos con este filtro.'}</p>
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
    
    // Punto de equilibrio
    const costoTotalInvertido = p.costoUnitarioTotal * p.cantidadImportada;
    const margenUnitario = p.precioVentaSugerido - p.costoUnitarioTotal;
    let puntoEquilibrio = 0, estadoInversion = '', textoEquilibrio = '';
    if (margenUnitario > 0) {
      puntoEquilibrio = Math.ceil(costoTotalInvertido / margenUnitario);
      const vendido = p.totalVendido || 0;
      if (vendido >= puntoEquilibrio) {
        estadoInversion = '✅ Inversión recuperada';
        textoEquilibrio = `(${vendido}/${puntoEquilibrio} vendidas)`;
      } else {
        const faltan = puntoEquilibrio - vendido;
        estadoInversion = `❌ Faltan ${faltan} ventas`;
        textoEquilibrio = `(${vendido}/${puntoEquilibrio} vendidas)`;
      }
    } else {
      puntoEquilibrio = Infinity;
      estadoInversion = '⚠️ Margen negativo';
      textoEquilibrio = 'No se puede recuperar';
    }

    // Frecuencia de ventas
    const totalVentas = p.ventasRegistradas || [];
    let frecuenciaVentas = 0, ultimaVenta = null;
    if (totalVentas.length > 1) {
      const fechas = totalVentas.map(v => new Date(v.fecha)).sort((a, b) => a - b);
      let sumaDiferencia = 0;
      for (let i = 1; i < fechas.length; i++) {
        sumaDiferencia += (fechas[i] - fechas[i-1]) / (1000 * 60 * 60 * 24);
      }
      frecuenciaVentas = sumaDiferencia / (fechas.length - 1);
      ultimaVenta = fechas[fechas.length - 1];
    } else if (totalVentas.length === 1) {
      frecuenciaVentas = 0;
      ultimaVenta = new Date(totalVentas[0].fecha);
    }

    // Competencia
    const competidores = p.competidores || [];
    let precioPromCompetencia = 0, cantidadCompetidores = competidores.length, esCompetitivo = false, recomendacionPrecio = '';
    if (cantidadCompetidores > 0) {
      const sumaPrecios = competidores.reduce((sum, c) => sum + c.precio, 0);
      precioPromCompetencia = sumaPrecios / cantidadCompetidores;
      const diferenciaPrecio = p.precioVentaSugerido - precioPromCompetencia;
      esCompetitivo = p.precioVentaSugerido <= precioPromCompetencia * 1.05;
      recomendacionPrecio = esCompetitivo ? '✅ Precio competitivo' : `⚠️ ${Math.round((diferenciaPrecio / precioPromCompetencia) * 100)}% más caro`;
    } else {
      recomendacionPrecio = '📊 Sin competidores';
    }

    // Estacionalidad
    const estacionalidad = window.obtenerRecomendacionMes(p);
    let htmlEstacionalidad = '';
    if (estacionalidad.mejor) {
      htmlEstacionalidad = `
        <div style="grid-column: 1 / -1; background: var(--glass-bg); padding: 4px 12px; border-radius: 8px; border: 1px solid var(--border-color); margin-top: 4px;">
          <span style="font-size: 0.7rem; color: var(--text-secondary);">📅 Mejor mes: <strong style="color: var(--gold);">${estacionalidad.mejor.nombre}</strong> (${estacionalidad.mejor.puntaje} pts) · Peor: ${estacionalidad.peor.nombre}</span>
        </div>
      `;
    }

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
        <div class="metric"><span class="label">📱 Engagement</span><span class="value">${window.calcularEngagementPromedio(p.interacciones || {}).toFixed(2)}%</span></div>
        <div class="metric"><span class="label">🗣️ Conversión</span><span class="value">${calcularTasaConversion(p).toFixed(1)}%</span></div>
        <div class="metric"><span class="label">📊 Prioridad</span><span class="value" style="color:${colorPrioridad};">${prioridad.indice}/100</span></div>
        <div class="metric" style="grid-column: 1 / -1; background: var(--glass-bg); padding: 8px 12px; border-radius: 8px; margin-top: 4px; border: 1px solid var(--border-color);">
          <span class="label">⏱️ Frecuencia de ventas</span>
          <span class="value" style="font-size: 0.95rem;">
            ${totalVentas.length === 0 ? 'Sin ventas aún' : 
              frecuenciaVentas === 0 ? 'Primera venta registrada' :
              `Cada ${frecuenciaVentas.toFixed(1)} días en promedio`}
            <span class="small" style="display: block; font-size: 0.8rem; color: var(--text-secondary);">
              ${totalVentas.length} venta(s) registrada(s) 
              ${ultimaVenta ? `· Última: ${ultimaVenta.toLocaleDateString('es-ES')}` : ''}
            </span>
          </span>
        </div>
        <div class="metric" style="grid-column: 1 / -1; background: var(--glass-bg); padding: 8px 12px; border-radius: 8px; margin-top: 4px; border: 1px solid var(--border-color);">
          <span class="label">🎯 Punto de equilibrio</span>
          <span class="value" style="font-size: 0.95rem;">
            ${puntoEquilibrio === Infinity ? '⚠️ No calculable' : `${puntoEquilibrio} unidades`}
            <span class="small" style="display: block; font-size: 0.8rem; color: ${estadoInversion.includes('recuperada') ? '#2ecc71' : '#e74c3c'};">
              ${estadoInversion} ${textoEquilibrio}
            </span>
          </span>
        </div>
        <div class="metric" style="grid-column: 1 / -1; background: var(--glass-bg); padding: 8px 12px; border-radius: 8px; margin-top: 4px; border: 1px solid var(--border-color);">
          <span class="label">🏪 Competencia (${cantidadCompetidores} registrados)</span>
          <span class="value" style="font-size: 0.9rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap;">
            <span>
              Promedio: ${cantidadCompetidores > 0 ? window.formatearUSD(precioPromCompetencia) : 'Sin datos'}
              ${cantidadCompetidores > 0 ? `<span style="color: ${esCompetitivo ? '#2ecc71' : '#e74c3c'}; font-size: 0.8rem;"> ${recomendacionPrecio}</span>` : ''}
            </span>
            <button class="btn btn-small" onclick="window.mostrarModalCompetencia('${p.id}')">
              <i class="fas fa-plus"></i> Agregar
            </button>
          </span>
          ${competidores.length > 0 ? `
            <div style="margin-top: 6px; font-size: 0.75rem; color: var(--text-secondary);">
              ${competidores.slice(-3).map(c => `${c.nombre}: ${window.formatearUSD(c.precio)} (${c.plataforma || 'N/A'})`).join(' • ')}
              ${competidores.length > 3 ? `... +${competidores.length - 3} más` : ''}
            </div>
          ` : ''}
        </div>
        ${htmlEstacionalidad}
        <div class="product-actions">
          <button class="btn-small" onclick="window.mostrarModalVenta('${p.id}')"><i class="fas fa-shopping-cart"></i> Vender</button>
          <button class="btn-small" onclick="window.mostrarModalPregunta('${p.id}')"><i class="fas fa-question-circle"></i> Preguntaron</button>
          <button class="btn-small" onclick="window.mostrarModalRedes('${p.id}')"><i class="fas fa-share-alt"></i> Redes</button>
          <button class="btn-small" onclick="window.eliminarProducto('${p.id}')" style="color:#e74c3c;"><i class="fas fa-trash"></i></button>
        </div>
      </div>
    `;
  });

  productList.innerHTML = html;
  if (productCount) productCount.textContent = productosFiltrados.length + ' productos';
}

function calcularRotacion(p) {
  const dias = Math.max(1, (Date.now() - new Date(p.fechaLlegada).getTime()) / (1000 * 60 * 60 * 24));
  return (p.totalVendido || 0) / dias * 30;
}

function calcularTasaConversion(p) {
  const totalPreguntas = Array.isArray(p.preguntasRegistradas) 
    ? p.preguntasRegistradas.reduce((s, r) => s + r.cantidad, 0) 
    : (p.preguntasRegistradas || 0);
  return totalPreguntas > 0 ? ((p.totalVendido || 0) / totalPreguntas) * 100 : 0;
}

function calcularFrecuenciaVentas(p) {
  const ventas = Array.isArray(p.ventasRegistradas) ? p.ventasRegistradas : [];
  if (ventas.length < 2) return 0;
  const fechas = ventas.map(v => new Date(v.fecha)).sort((a, b) => a - b);
  let sumaDiferencia = 0;
  for (let i = 1; i < fechas.length; i++) {
    sumaDiferencia += (fechas[i] - fechas[i-1]) / (1000 * 60 * 60 * 24);
  }
  return sumaDiferencia / (fechas.length - 1);
}

function calcularPrioridad(p) {
  const rotacion = calcularRotacion(p);
  const engagement = window.calcularEngagementPromedio(p.interacciones || {});
  const tasaConversion = calcularTasaConversion(p);
  const frecuencia = calcularFrecuenciaVentas(p);
  return window.calcularIndicePrioridad(p.costoUnitarioTotal, rotacion, engagement, tasaConversion, frecuencia);
}

// ==========================================
//  INVENTARIO
// ==========================================
function inicializarInventario() {
  const inventarioContainer = document.getElementById('inventarioContainer');
  if (!inventarioContainer) {
    console.error('❌ Error: No se encontró inventarioContainer');
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

  const productos = window.productos || [];
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

  let stockTotal = 0, valorTotalInventario = 0;
  Object.values(inventarioPorSKU).forEach(grupo => {
    grupo.lotes.forEach(lote => {
      stockTotal += lote.stock;
      valorTotalInventario += lote.stock * lote.costoUnitario;
    });
  });

  if (stockCount) stockCount.textContent = stockTotal + ' unidades';
  if (valorTotal) valorTotal.textContent = window.formatearUSD(valorTotalInventario);
  if (totalProductos) totalProductos.textContent = Object.keys(inventarioPorSKU).length;

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
          <div class="table-wrapper">
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
      </div>
    `;
  });

  inventarioContainer.innerHTML = html;
}

// ==========================================
//  CONTABILIDAD
// ==========================================
function inicializarContabilidad() {
  const container = document.getElementById('contabilidadContainer');
  if (!container) {
    console.error('❌ Error: No se encontró contabilidadContainer');
    return;
  }

  document.querySelectorAll('.contab-tab').forEach(btn => {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.contab-tab').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      renderizarContabilidad(this.dataset.contab);
    });
  });

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
    case 'diario': renderizarLibroDiario(container); break;
    case 'mayor': renderizarLibroMayor(container); break;
    case 'resultados': renderizarBalanceResultados(container); break;
    case 'general': renderizarBalanceGeneral(container); break;
    default: container.innerHTML = `<p>Vista no encontrada</p>`;
  }
}

function actualizarContabilidadSiActiva() {
  const currentTab = document.querySelector('.tab-btn.active')?.dataset.tab || 'registro';
  if (currentTab === 'contabilidad') {
    const contabActiva = document.querySelector('.contab-tab.active')?.dataset.contab || 'diario';
    renderizarContabilidad(contabActiva);
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
    <div class="table-wrapper">
      <table class="contabilidad-table">
        <thead><tr><th>Fecha</th><th>Descripción</th><th>Cuenta</th><th>Debe</th><th>Haber</th></tr></thead>
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
  html += `</tbody></table></div>`;
  container.innerHTML = html;
  document.getElementById('asientosCount').textContent = asientos.length + ' asientos';
}

function renderizarLibroMayor(container) {
  const asientos = window.asientos || [];
  if (asientos.length === 0) {
    container.innerHTML = `<div class="empty-state"><i class="fas fa-chart-bar"></i><p>No hay movimientos.</p></div>`;
    return;
  }

  const cuentas = {};
  asientos.forEach(asiento => {
    asiento.movimientos.forEach(mov => {
      if (!cuentas[mov.cuenta]) cuentas[mov.cuenta] = { debe: 0, haber: 0, saldo: 0 };
      cuentas[mov.cuenta].debe += mov.debe;
      cuentas[mov.cuenta].haber += mov.haber;
      cuentas[mov.cuenta].saldo = cuentas[mov.cuenta].debe - cuentas[mov.cuenta].haber;
    });
  });

  let html = `<h3 style="margin-bottom:16px;">📊 Libro Mayor</h3><div style="display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:16px;">`;
  for (const [cuenta, data] of Object.entries(cuentas)) {
    const esDeudora = data.saldo >= 0;
    html += `
      <div class="cuenta-t">
        <h4 style="text-align:center; border-bottom:2px solid var(--gold); padding-bottom:6px;">${cuenta}</h4>
        <div style="display:flex; justify-content:space-between; padding:4px 8px;">
          <span><strong>Debe:</strong> ${window.formatearUSD(data.debe)}</span>
          <span><strong>Haber:</strong> ${window.formatearUSD(data.haber)}</span>
        </div>
        <div style="text-align:center; margin-top:8px; padding:6px; background:${esDeudora ? 'rgba(46,204,113,0.2)' : 'rgba(231,76,60,0.2)'}; border-radius:6px;">
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
    container.innerHTML = `<div class="empty-state"><i class="fas fa-chart-pie"></i><p>No hay datos.</p></div>`;
    return;
  }

  let ingresos = 0, gastos = 0;
  asientos.forEach(asiento => {
    asiento.movimientos.forEach(mov => {
      if (mov.cuenta === 'Ventas') ingresos += mov.haber - mov.debe;
      else if (mov.cuenta === 'Costo de Ventas') gastos += mov.debe - mov.haber;
      else if (mov.cuenta.includes('Gasto')) gastos += mov.debe - mov.haber;
    });
  });
  const resultado = ingresos - gastos;

  container.innerHTML = `
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
}

function renderizarBalanceGeneral(container) {
  const asientos = window.asientos || [];
  if (asientos.length === 0) {
    container.innerHTML = `<div class="empty-state"><i class="fas fa-balance-scale"></i><p>No hay datos.</p></div>`;
    return;
  }

  let activo = 0, pasivo = 0, capital = 0;
  asientos.forEach(asiento => {
    asiento.movimientos.forEach(mov => {
      if (mov.cuenta === 'Inventario' || mov.cuenta === 'Banco') activo += mov.debe - mov.haber;
      else if (mov.cuenta === 'Proveedores') pasivo += mov.haber - mov.debe;
      else if (mov.cuenta === 'Capital') capital += mov.haber - mov.debe;
    });
  });
  if (capital === 0) {
    let ingresos = 0, gastos = 0;
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
  container.innerHTML = `
    <h3 style="margin-bottom:16px;">🏦 Balance General</h3>
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px; max-width:600px; margin:0 auto;">
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
}

// ==========================================
//  SONDEO
// ==========================================
function inicializarSondeo() {
  const sondeoForm = document.getElementById('sondeoForm');
  if (!sondeoForm) {
    console.error('❌ Error: No se encontró sondeoForm');
    return;
  }

  sondeoForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const nombre = document.getElementById('sondeoNombre').value.trim();
    const precio = parseFloat(document.getElementById('sondeoPrecio').value);
    const descripcion = document.getElementById('sondeoDescripcion').value.trim();
    const costos = parseFloat(document.getElementById('sondeoCostos').value) || 0;
    const competidores = parseInt(document.getElementById('sondeoCompetidores').value) || 0;

    if (!nombre || !precio || precio <= 0) {
      alert('⚠️ Nombre y precio son obligatorios.');
      return;
    }

    const nuevoSondeo = {
      id: window.generarId(),
      nombre, descripcion, precioEstimado: precio, costosEstimados: costos,
      competidores, fecha: new Date().toISOString(),
      interacciones: { instagram: {}, tiktok: {}, marketplace: {} },
      preguntas: 0,
      estado: 'evaluando',
      historial: [],
      estacionalidad: window.inicializarEstacionalidad()
    };

    window.agregarSondeo(nuevoSondeo);
    renderizarSondeos();
    sondeoForm.reset();
    document.getElementById('sondeoCostos').value = '0';
    document.getElementById('sondeoCompetidores').value = '0';
    alert(`✅ Producto "${nombre}" agregado al sondeo.`);
  });

  renderizarSondeos();
  console.log('✅ Pantalla de sondeo inicializada');
}

function renderizarSondeos() {
  const sondeoList = document.getElementById('sondeoList');
  const sondeoCount = document.getElementById('sondeoCount');
  const totalSondeo = document.getElementById('totalSondeo');
  const sondeoRecomendados = document.getElementById('sondeoRecomendados');
  const sondeoEvaluar = document.getElementById('sondeoEvaluar');
  const sondeoDescartar = document.getElementById('sondeoDescartar');

  const sondeos = window.sondeos || [];
  if (!sondeoList) return;

  if (sondeos.length === 0) {
    sondeoList.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-search"></i>
        <p>No hay productos en sondeo. Agrega uno para comenzar a validar el mercado.</p>
      </div>
    `;
    if (sondeoCount) sondeoCount.textContent = '0 productos';
    if (totalSondeo) totalSondeo.textContent = '0';
    if (sondeoRecomendados) sondeoRecomendados.textContent = '0';
    if (sondeoEvaluar) sondeoEvaluar.textContent = '0';
    if (sondeoDescartar) sondeoDescartar.textContent = '0';
    return;
  }

  let recomendados = 0, evaluar = 0, descartar = 0;
  sondeos.forEach(s => {
    const puntaje = calcularPuntajeInteres(s);
    if (puntaje.recomendacion === 'recomendado') recomendados++;
    else if (puntaje.recomendacion === 'evaluar') evaluar++;
    else descartar++;
  });

  if (sondeoCount) sondeoCount.textContent = sondeos.length + ' productos';
  if (totalSondeo) totalSondeo.textContent = sondeos.length;
  if (sondeoRecomendados) sondeoRecomendados.textContent = recomendados;
  if (sondeoEvaluar) sondeoEvaluar.textContent = evaluar;
  if (sondeoDescartar) sondeoDescartar.textContent = descartar;

  let html = '';
  sondeos.forEach(s => {
    const puntaje = calcularPuntajeInteres(s);
    const color = puntaje.recomendacion === 'recomendado' ? '#2ecc71' : 
                  (puntaje.recomendacion === 'evaluar' ? '#f1c40f' : '#e74c3c');
    const emoji = puntaje.recomendacion === 'recomendado' ? '✅' : 
                  (puntaje.recomendacion === 'evaluar' ? '⚠️' : '❌');
    const engagement = window.calcularEngagementPromedio(s.interacciones || {});
    
    const historial = s.historial || [];
    let historialHTML = '';
    if (historial.length > 0) {
      const ultimos = historial.slice(-5).reverse();
      historialHTML = `
        <div style="grid-column:1/-1; margin-top:4px; padding:8px 12px; background:var(--glass-bg); border-radius:8px; border:1px solid var(--border-color);">
          <span class="label" style="font-size:0.7rem;">📅 Historial (últimos días)</span>
          <div style="display:flex; flex-wrap:wrap; gap:8px; margin-top:4px; font-size:0.75rem;">
            ${ultimos.map(r => {
              const fecha = new Date(r.fecha + 'T00:00:00');
              const hoy = new Date();
              const esHoy = fecha.toDateString() === hoy.toDateString();
              const label = esHoy ? 'Hoy' : fecha.toLocaleDateString('es-ES', { day:'2-digit', month:'short' });
              return `<span style="background:var(--bg-input); padding:2px 10px; border-radius:30px; border:1px solid var(--border-color);">
                <strong>${label}</strong>: ${r.vistas} 👁️ · ${r.preguntas} 🗣️
              </span>`;
            }).join('')}
          </div>
        </div>
      `;
    }

    const estacionalidad = window.obtenerRecomendacionMes(s);
    let htmlEstacionalidad = '';
    if (estacionalidad.mejor) {
      htmlEstacionalidad = `
        <div style="grid-column:1/-1; background:var(--glass-bg); padding:4px 12px; border-radius:8px; border:1px solid var(--border-color); margin-top:4px;">
          <span style="font-size:0.7rem; color:var(--text-secondary);">📅 Mejor mes: <strong style="color:var(--gold);">${estacionalidad.mejor.nombre}</strong> (${estacionalidad.mejor.puntaje} pts)</span>
        </div>
      `;
    }

    html += `
      <div class="product-item sondeo-item" data-id="${s.id}" style="border-left-color: ${color};">
        <div class="product-header">
          <h3>${emoji} ${s.nombre}<span class="sku" style="font-size:0.7rem;">ID: ${s.id.substring(0,6)}</span></h3>
          <span class="recomendacion" style="color:${color};">${puntaje.recomendacion.toUpperCase()} (${puntaje.puntaje} pts)</span>
        </div>
        <div class="metric"><span class="label">💰 Precio estimado</span><span class="value">${window.formatearUSD(s.precioEstimado)}</span></div>
        <div class="metric"><span class="label">📦 Costos estimados</span><span class="value">${window.formatearUSD(s.costosEstimados)}</span></div>
        <div class="metric"><span class="label">📱 Engagement</span><span class="value">${engagement.toFixed(2)}%</span></div>
        <div class="metric"><span class="label">🗣️ Preguntas</span><span class="value">${s.preguntas}</span></div>
        <div class="metric" style="grid-column:1/-1;">
          <span class="label">🎯 Rentabilidad estimada</span>
          <span class="value" style="font-size:0.95rem;">
            ${puntaje.rentabilidad !== undefined ? window.formatearUSD(puntaje.rentabilidad) : 'No calculable'}
            <span class="small" style="display:block; font-size:0.8rem; color:${color};">${puntaje.mensaje || ''}</span>
          </span>
        </div>
        ${historialHTML}
        ${htmlEstacionalidad}
        ${s.descripcion ? `<div style="grid-column:1/-1; font-size:0.8rem; color:var(--text-secondary); border-top:1px solid var(--border-color); padding-top:8px;">📝 ${s.descripcion}</div>` : ''}
        <div class="product-actions">
          <button class="btn-small" onclick="window.mostrarModalSondeoRedes('${s.id}')"><i class="fas fa-share-alt"></i> Redes</button>
          <button class="btn-small" onclick="window.registrarPreguntaSondeo('${s.id}')"><i class="fas fa-question-circle"></i> + Pregunta</button>
          <button class="btn-small" onclick="window.mostrarModalRegistroDiario('${s.id}')" style="color:var(--electric-blue);"><i class="fas fa-calendar-plus"></i> Registrar día</button>
          <button class="btn-small" onclick="window.moverSondeoAProducto('${s.id}')" style="color:var(--gold);"><i class="fas fa-box"></i> Importar</button>
          <button class="btn-small" onclick="window.eliminarSondeo('${s.id}')" style="color:#e74c3c;"><i class="fas fa-trash"></i></button>
        </div>
      </div>
    `;
  });

  sondeoList.innerHTML = html;
}

function calcularPuntajeInteres(sondeo) {
  const engagement = window.calcularEngagementPromedio(sondeo.interacciones || {});
  const preguntas = sondeo.preguntas || 0;
  const competidores = sondeo.competidores || 0;
  
  let puntaje = 0;
  puntaje += Math.min(engagement * 3, 30);
  puntaje += Math.min(preguntas * 5, 40);
  puntaje += Math.max(0, 30 - competidores * 2);
  
  let rentabilidad = 0, mensaje = '', recomendacion = 'evaluar';
  if (sondeo.costosEstimados > 0 && sondeo.precioEstimado > 0) {
    const margen = sondeo.precioEstimado - sondeo.costosEstimados;
    rentabilidad = margen * (puntaje / 100);
    if (puntaje >= 70 && margen > 0) {
      recomendacion = 'recomendado';
      mensaje = 'Alta demanda y buen margen ✅';
    } else if (puntaje >= 40 && margen > 0) {
      recomendacion = 'evaluar';
      mensaje = 'Interés moderado, evaluar precios ⚠️';
    } else {
      recomendacion = 'descartado';
      mensaje = 'Bajo interés o margen insuficiente ❌';
    }
  } else {
    if (puntaje >= 70) {
      recomendacion = 'recomendado';
      mensaje = 'Alta demanda, estima costos ✅';
    } else if (puntaje >= 40) {
      recomendacion = 'evaluar';
      mensaje = 'Interés moderado ⚠️';
    } else {
      recomendacion = 'descartado';
      mensaje = 'Bajo interés ❌';
    }
  }
  return { puntaje: Math.min(100, Math.round(puntaje)), recomendacion, rentabilidad, mensaje };
}

// ==========================================
//  ESTACIONALIDAD (pantalla)
// ==========================================
let filtroEstacionalidad = 'todos';

function inicializarEstacionalidadPantalla() {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      filtroEstacionalidad = this.dataset.filter;
      renderizarEstacionalidad();
    });
  });
  renderizarEstacionalidad();
  console.log('✅ Pantalla de estacionalidad inicializada');
}

function renderizarEstacionalidad() {
  const container = document.getElementById('estacionalidadList');
  const count = document.getElementById('estacionalidadCount');
  const prodConDatos = document.getElementById('estProdConDatos');
  const sondeosConDatos = document.getElementById('estSondeosConDatos');
  const mesPopular = document.getElementById('estMesPopular');

  if (!container) return;

  // Recolectar todos los objetos con estacionalidad
  let items = [];
  if (filtroEstacionalidad === 'todos' || filtroEstacionalidad === 'productos') {
    items = items.concat((window.productos || []).map(p => ({ ...p, tipo: 'producto' })));
  }
  if (filtroEstacionalidad === 'todos' || filtroEstacionalidad === 'sondeos') {
    items = items.concat((window.sondeos || []).map(s => ({ ...s, tipo: 'sondeo' })));
  }

  // Filtrar los que tienen datos de estacionalidad
  const conDatos = items.filter(item => {
    const est = item.estacionalidad || {};
    return Object.values(est).some(m => m.ventas > 0 || m.preguntas > 0 || m.interacciones > 0);
  });

  if (prodConDatos) prodConDatos.textContent = items.filter(i => i.tipo === 'producto' && conDatos.includes(i)).length;
  if (sondeosConDatos) sondeosConDatos.textContent = items.filter(i => i.tipo === 'sondeo' && conDatos.includes(i)).length;
  if (count) count.textContent = conDatos.length + ' elementos';

  // Calcular mes más popular global
  const globalMeses = {};
  conDatos.forEach(item => {
    if (item.estacionalidad) {
      Object.entries(item.estacionalidad).forEach(([mes, datos]) => {
        if (!globalMeses[mes]) globalMeses[mes] = 0;
        globalMeses[mes] += (datos.ventas || 0) * 3 + (datos.preguntas || 0) * 2 + (datos.interacciones || 0);
      });
    }
  });
  const sortedMeses = Object.entries(globalMeses).sort((a, b) => b[1] - a[1]);
  const mesesNombres = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  if (mesPopular && sortedMeses.length > 0) {
    mesPopular.textContent = `${mesesNombres[parseInt(sortedMeses[0][0]) - 1]} (${sortedMeses[0][1]} pts)`;
  } else {
    mesPopular.textContent = '-';
  }

  if (conDatos.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-calendar"></i>
        <p>No hay datos de estacionalidad. Registra ventas, preguntas o interacciones para empezar.</p>
      </div>
    `;
    return;
  }

  let html = '';
  conDatos.forEach(item => {
    const est = window.obtenerRecomendacionMes(item);
    const tipoEmoji = item.tipo === 'producto' ? '📦' : '🔍';
    const nombre = item.nombre || 'Sin nombre';
    
    // Mini gráfico de barras
    let barras = '';
    if (item.estacionalidad) {
      const max = Math.max(...Object.values(item.estacionalidad).map(m => (m.ventas || 0) * 3 + (m.preguntas || 0) * 2 + (m.interacciones || 0) || 1));
      barras = Object.entries(item.estacionalidad).map(([mes, datos]) => {
        const total = (datos.ventas || 0) * 3 + (datos.preguntas || 0) * 2 + (datos.interacciones || 0);
        const altura = Math.max(4, (total / max) * 40);
        const esMejor = est.mejor && parseInt(mes) === est.mejor.mes;
        return `<div style="flex:1; display:flex; flex-direction:column; align-items:center; gap:2px;">
          <div style="background:${esMejor ? 'var(--gold)' : 'var(--border-color)'}; width:100%; height:${altura}px; border-radius:4px 4px 0 0; transition:0.3s;"></div>
          <span style="font-size:0.5rem; color:var(--text-secondary);">${mes}</span>
        </div>`;
      }).join('');
    }

    html += `
      <div class="inventario-item" style="border-left:4px solid ${est.mejor ? 'var(--gold)' : 'var(--border-color)'};">
        <div class="inventario-header">
          <h3>${tipoEmoji} ${nombre} <span style="font-size:0.7rem;color:var(--text-secondary);">(${item.tipo})</span></h3>
          <span class="badge">${est.mejor ? `Mejor: ${est.mejor.nombre}` : 'Sin datos'}</span>
        </div>
        <div style="display:flex; gap:16px; flex-wrap:wrap; font-size:0.85rem; margin-bottom:8px;">
          <span>🟢 Mejor mes: <strong>${est.mejor ? est.mejor.nombre : 'N/A'}</strong> (${est.mejor ? est.mejor.puntaje : 0} pts)</span>
          <span>🔴 Peor mes: <strong>${est.peor ? est.peor.nombre : 'N/A'}</strong> (${est.peor ? est.peor.puntaje : 0} pts)</span>
        </div>
        <div style="display:flex; gap:4px; align-items:flex-end; height:50px; padding-top:6px; border-top:1px solid var(--border-color);">
          ${barras}
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}
