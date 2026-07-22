// ==========================================
//  C🌍in - UI Base (navegación, menú, utilidades)
// ==========================================

// ----- Variables globales -----
let currentTab = 'registro';
let gastoIndex = 0;
let productoRowIndex = 0;
let filtroActual = 'todos';

// ----- Referencias DOM (se actualizan al cargar) -----
let loteForm, productosBody, addProductoBtn, addGastoBtn, gastosWrapper;
let productList, productCount;

// ==========================================
//  MENÚ HAMBURGUESA
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
  
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });

  const archivos = {
    registro: 'registro.html',
    recomendaciones: 'recomendaciones.html',
    inventario: 'inventario.html',
    contabilidad: 'contabilidad.html',
    sondeo: 'sondeo.html',
    estacionalidad: 'estacionalidad.html'
  };

  const archivo = archivos[tab] || 'registro.html';
  
  fetch(archivo)
    .then(response => {
      if (!response.ok) throw new Error(`No se pudo cargar ${archivo}`);
      return response.text();
    })
    .then(html => {
      document.getElementById('mainContainer').innerHTML = html;
      
      // Inicializar según la pestaña
      switch (tab) {
        case 'registro': if (typeof inicializarRegistro === 'function') inicializarRegistro(); break;
        case 'recomendaciones': if (typeof inicializarRecomendaciones === 'function') inicializarRecomendaciones(); break;
        case 'inventario': if (typeof inicializarInventario === 'function') inicializarInventario(); break;
        case 'contabilidad': if (typeof inicializarContabilidad === 'function') inicializarContabilidad(); break;
        case 'sondeo': if (typeof inicializarSondeo === 'function') inicializarSondeo(); break;
        case 'estacionalidad': if (typeof inicializarEstacionalidadPantalla === 'function') inicializarEstacionalidadPantalla(); break;
      }
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
//  CERRAR MODALES (global)
// ==========================================
function cerrarModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.remove();
}

// ==========================================
//  INICIALIZACIÓN GENERAL
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
  // Cargar datos desde localStorage
  window.cargarDatos();

  // Generar asientos iniciales si no existen
  if (window.asientos.length === 0) {
    window.generarAsientosIniciales();
  }

  // Migrar estacionalidad si hay datos
  if (window.productos.length > 0 || window.sondeos.length > 0) {
    window.migrarEstacionalidad();
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
    // Disparar renderizado según pestaña
    if (currentTab === 'recomendaciones' && typeof renderizarRecomendaciones === 'function') renderizarRecomendaciones();
    else if (currentTab === 'inventario' && typeof renderizarInventario === 'function') renderizarInventario();
    else if (currentTab === 'contabilidad' && typeof renderizarContabilidad === 'function') {
      const contabActiva = document.querySelector('.contab-tab.active')?.dataset.contab || 'diario';
      renderizarContabilidad(contabActiva);
    }
    else if (currentTab === 'sondeo' && typeof renderizarSondeos === 'function') renderizarSondeos();
    else if (currentTab === 'estacionalidad' && typeof renderizarEstacionalidad === 'function') renderizarEstacionalidad();
    alert('✅ Datos actualizados desde localStorage.');
  });

  // ==========================================
  //  BOTÓN PARA BORRAR TODOS LOS DATOS
  // ==========================================
  const btnBorrar = document.getElementById('btnBorrarDatos');
  if (btnBorrar) {
    btnBorrar.addEventListener('click', function() {
      // Primera confirmación
      const confirmacion = confirm(
        '⚠️ ¿ESTÁS SEGURO DE BORRAR TODOS LOS DATOS?\n\n' +
        'Se eliminarán permanentemente:\n' +
        '• Todos los productos registrados\n' +
        '• Todos los lotes importados\n' +
        '• Todos los asientos contables\n' +
        '• Todos los sondeos y su historial\n' +
        '• Todas las métricas de redes sociales\n' +
        '• Todas las ventas y preguntas registradas\n\n' +
        '¡Esta acción NO se puede deshacer!'
      );
      
      if (!confirmacion) return;
      
      // Segunda confirmación (por seguridad)
      const segundaConfirmacion = confirm(
        '🔴 ÚLTIMA OPORTUNIDAD\n\n' +
        '¿Realmente deseas eliminar TODOS los datos de la aplicación?'
      );
      
      if (!segundaConfirmacion) return;
      
      try {
        // Borrar todas las claves de localStorage que empiecen con 'coin_'
        const keys = Object.keys(localStorage);
        const coinKeys = keys.filter(key => key.startsWith('coin_'));
        
        coinKeys.forEach(key => {
          localStorage.removeItem(key);
          console.log(`🗑️ Eliminada clave: ${key}`);
        });
        
        // También limpiar las variables globales
        window.productos = [];
        window.lotes = [];
        window.asientos = [];
        window.sondeos = [];
        
        // Mostrar mensaje de éxito
        alert('✅ Todos los datos han sido eliminados correctamente.\n\nLa página se recargará para aplicar los cambios.');
        
        // Recargar la página
        location.reload();
        
      } catch (error) {
        console.error('❌ Error al borrar datos:', error);
        alert('❌ Ocurrió un error al borrar los datos. Revisa la consola para más detalles.');
      }
    });
  }

  // Cargar la primera pantalla (registro)
  cambiarPantalla('registro');
});

// ==========================================
//  UTILIDADES DE GASTOS Y PRODUCTOS
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
