// ==========================================
//  C🌍in - Frontend JavaScript
//  API base (detecta automáticamente)
// ==========================================

const API_URL = window.location.origin + '/api/productos';

// ----- DOM References -----
const productForm = document.getElementById('productForm');
const productList = document.getElementById('productList');
const productCount = document.getElementById('productCount');
const gastosWrapper = document.getElementById('gastosWrapper');
const addGastoBtn = document.getElementById('addGastoBtn');
const btnRefresh = document.getElementById('btnRefresh');

// ----- Estado -----
let productos = [];

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
  // Mostrar botón de eliminar si hay más de 1
  const removeBtn = div.querySelector('.btn-remove-gasto');
  removeBtn.addEventListener('click', () => {
    div.remove();
    actualizarVisibilidadEliminar();
  });
  gastosWrapper.appendChild(div);
  actualizarVisibilidadEliminar();
}

function actualizarVisibilidadEliminar() {
  const items = gastosWrapper.querySelectorAll('.gasto-item');
  items.forEach((item, idx) => {
    const btn = item.querySelector('.btn-remove-gasto');
    if (btn) {
      btn.style.display = items.length > 1 ? 'inline-flex' : 'none';
    }
  });
}

addGastoBtn.addEventListener('click', () => agregarGasto());

// Inicializar con 1 gasto vacío (pero ocultamos el botón de eliminar)
agregarGasto();
// Eliminar el primer gasto si se agregó vacío (lo dejamos pero oculto el botón)
// Ya se oculta con la función.

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
//  CARGAR PRODUCTOS
// ==========================================
async function cargarProductos() {
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error('Error al cargar productos');
    const data = await res.json();
    productos = data.data || [];
    renderizarProductos();
    productCount.textContent = productos.length + ' productos';
  } catch (error) {
    console.error('Error:', error);
    productList.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-exclamation-triangle"></i>
        <p>Error al cargar: ${error.message}. ¿El servidor está corriendo?</p>
      </div>
    `;
  }
}

// ==========================================
//  RENDERIZAR PRODUCTOS
// ==========================================
function renderizarProductos() {
  if (productos.length === 0) {
    productList.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-box-open"></i>
        <p>No hay productos aún. Crea tu primer producto arriba.</p>
      </div>
    `;
    return;
  }

  let html = '';
  productos.forEach(p => {
    const prioridad = p.prioridad || { indice: 0, recomendacion: '⚪ SIN DATOS' };
    const recomendacion = prioridad.recomendacion || 'Sin datos';
    const emoji = getEmojiRecomendacion(recomendacion);
    const rotacion = p.rotacionMensual || 0;
    const engagement = p.engagementPromedio || 0;
    const conversion = p.tasaConversion || 0;
    const margen = p.margenGanancia || 0;
    const precioVenta = p.precioActual?.precioVenta || p.precioVentaSugerido || 0;
    const costo = p.costoUnitarioTotal || 0;

    html += `
      <div class="product-item" data-id="${p._id}">
        <div class="product-header">
          <h3>
            ${emoji} ${p.nombre}
            <span class="sku">SKU: ${p.sku}</span>
          </h3>
          <span class="recomendacion" style="color: ${prioridad.indice > 70 ? '#2ecc71' : prioridad.indice > 40 ? '#f1c40f' : '#e74c3c'};">
            ${recomendacion} (${prioridad.indice || 0} pts)
          </span>
        </div>

        <div class="metric">
          <span class="label">💰 Costo unitario</span>
          <span class="value">${formatearUSD(costo)}</span>
        </div>
        <div class="metric">
          <span class="label">🏷️ Precio venta</span>
          <span class="value">${formatearUSD(precioVenta)} <span class="small">(${margen}% margen)</span></span>
        </div>

        <div class="metric">
          <span class="label">📦 Rotación mensual</span>
          <span class="value">${rotacion.toFixed(1)} <span class="small">und/mes</span></span>
        </div>
        <div class="metric">
          <span class="label">📱 Engagement promedio</span>
          <span class="value">${engagement.toFixed(2)}%</span>
        </div>

        <div class="metric">
          <span class="label">🗣️ Tasa conversión</span>
          <span class="value">${conversion.toFixed(1)}%</span>
        </div>
        <div class="metric">
          <span class="label">📊 Prioridad</span>
          <span class="value" style="color: ${prioridad.indice > 70 ? '#2ecc71' : prioridad.indice > 40 ? '#f1c40f' : '#e74c3c'};">
            ${prioridad.indice || 0}/100
          </span>
        </div>

        <div class="product-actions">
          <button class="btn-small" onclick="registrarVenta('${p._id}')">
            <i class="fas fa-shopping-cart"></i> Vender
          </button>
          <button class="btn-small" onclick="registrarPregunta('${p._id}')">
            <i class="fas fa-question-circle"></i> Preguntaron
          </button>
          <button class="btn-small" onclick="actualizarRedes('${p._id}')">
            <i class="fas fa-share-alt"></i> Actualizar redes
          </button>
        </div>
      </div>
    `;
  });

  productList.innerHTML = html;
}

// ==========================================
//  ACCIONES RÁPIDAS (desde los botones)
// ==========================================
// Estas funciones se llaman desde el HTML (onclick)
window.registrarVenta = async function(id) {
  const cantidad = prompt('¿Cuántas unidades se vendieron?', '1');
  if (cantidad === null) return;
  try {
    const res = await fetch(`${API_URL}/${id}/venta`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cantidad: parseInt(cantidad) || 1 })
    });
    if (!res.ok) throw new Error('Error al registrar venta');
    const data = await res.json();
    alert(`✅ Venta registrada. Total vendido: ${data.totalVendido} unidades.`);
    cargarProductos();
  } catch (error) {
    alert('❌ Error: ' + error.message);
  }
};

window.registrarPregunta = async function(id) {
  const cantidad = prompt('¿Cuántas preguntas recibiste?', '1');
  if (cantidad === null) return;
  try {
    const res = await fetch(`${API_URL}/${id}/pregunta`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cantidad: parseInt(cantidad) || 1 })
    });
    if (!res.ok) throw new Error('Error al registrar preguntas');
    const data = await res.json();
    alert(`✅ Preguntas registradas. Total: ${data.totalPreguntas}.`);
    cargarProductos();
  } catch (error) {
    alert('❌ Error: ' + error.message);
  }
};

window.actualizarRedes = async function(id) {
  // Ventana simple para actualizar métricas
  const instaLikes = prompt('Instagram - Likes:', '0');
  if (instaLikes === null) return;
  const instaCom = prompt('Instagram - Comentarios:', '0');
  const instaShare = prompt('Instagram - Compartidos:', '0');
  const instaAlc = prompt('Instagram - Alcance:', '100');

  const ttkLikes = prompt('TikTok - Likes:', '0');
  const ttkCom = prompt('TikTok - Comentarios:', '0');
  const ttkShare = prompt('TikTok - Compartidos:', '0');
  const ttkAlc = prompt('TikTok - Alcance:', '100');

  const mktLikes = prompt('Marketplace - Likes:', '0');
  const mktCom = prompt('Marketplace - Comentarios:', '0');
  const mktShare = prompt('Marketplace - Compartidos:', '0');
  const mktAlc = prompt('Marketplace - Alcance:', '100');

  const body = {
    instagram: { likes: parseInt(instaLikes)||0, comentarios: parseInt(instaCom)||0, compartidos: parseInt(instaShare)||0, alcance: parseInt(instaAlc)||100 },
    tiktok: { likes: parseInt(ttkLikes)||0, comentarios: parseInt(ttkCom)||0, compartidos: parseInt(ttkShare)||0, alcance: parseInt(ttkAlc)||100 },
    marketplace: { likes: parseInt(mktLikes)||0, comentarios: parseInt(mktCom)||0, compartidos: parseInt(mktShare)||0, alcance: parseInt(mktAlc)||100 }
  };

  try {
    const res = await fetch(`${API_URL}/${id}/redes`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error('Error al actualizar redes');
    await res.json();
    alert('✅ Métricas de redes actualizadas correctamente.');
    cargarProductos();
  } catch (error) {
    alert('❌ Error: ' + error.message);
  }
};

// ==========================================
//  ENVIAR FORMULARIO (CREAR PRODUCTO)
// ==========================================
productForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const nombre = document.getElementById('nombre').value.trim();
  const sku = document.getElementById('sku').value.trim();
  const precioUnitarioChina = parseFloat(document.getElementById('precioUnitario').value) || 0;
  const cantidadImportada = parseInt(document.getElementById('cantidad').value) || 0;
  const fleteInternacional = parseFloat(document.getElementById('flete').value) || 0;
  const modoPrecio = document.getElementById('modoPrecio').value;
  const valorPrecio = parseFloat(document.getElementById('valorPrecio').value) || 0;

  const gastosExtra = obtenerGastos();

  if (!nombre || !sku || precioUnitarioChina <= 0 || cantidadImportada <= 0) {
    alert('⚠️ Completa todos los campos obligatorios (*).');
    return;
  }

  const payload = {
    nombre,
    sku,
    precioUnitarioChina,
    cantidadImportada,
    fleteInternacional,
    gastosExtra,
    modoPrecio,
    valorPrecio
  };

  try {
    const btn = productForm.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';

    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Error al crear producto');
    }

    const data = await res.json();
    alert(`✅ Producto creado con éxito!\nCosto unitario: ${formatearUSD(data.data.costeo.costoUnitario)}\nPrecio venta: ${formatearUSD(data.data.precio.precioVenta)}`);

    // Resetear formulario (excepto gastos)
    productForm.reset();
    document.getElementById('flete').value = '0';
    document.getElementById('valorPrecio').value = '40';
    // Limpiar gastos extra (dejar solo uno vacío)
    gastosWrapper.innerHTML = '';
    agregarGasto();

    cargarProductos();

  } catch (error) {
    alert('❌ Error: ' + error.message);
  } finally {
    const btn = productForm.querySelector('button[type="submit"]');
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-plus-circle"></i> Crear producto y costear';
  }
});

// ==========================================
//  REFRESCAR
// ==========================================
btnRefresh.addEventListener('click', cargarProductos);

// ==========================================
//  INICIO
// ==========================================
cargarProductos();
