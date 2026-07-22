// ==========================================
//  C🌍in - UI Acciones (modales, acciones rápidas)
// ==========================================

// ==========================================
//  VENTA (producto)
// ==========================================
window.mostrarModalVenta = function(id) {
  const prod = window.productos.find(p => p.id === id);
  if (!prod) return alert('Producto no encontrado');
  
  const modalHTML = `
    <div class="modal-overlay" id="modalVenta">
      <div class="modal-content">
        <div class="modal-header">
          <h3><i class="fas fa-shopping-cart" style="color: var(--gold);"></i> Registrar venta</h3>
          <button class="modal-close" onclick="cerrarModal('modalVenta')">&times;</button>
        </div>
        <div class="modal-body">
          <p style="color: var(--text-secondary); margin-bottom: 16px;">
            Producto: <strong>${prod.nombre}</strong> (SKU: ${prod.sku})
          </p>
          <div style="display: flex; gap: 12px; align-items: center; margin-bottom: 12px;">
            <label style="color: var(--text-secondary); font-weight: 500;">Cantidad:</label>
            <input type="number" id="inputVentaCantidad" value="1" min="1" step="1" 
                   style="flex:1; background: var(--glass-bg); border: 1px solid var(--border-color); border-radius: 10px; padding: 10px 14px; color: var(--text-primary); font-size: 1rem;" />
          </div>
          <div style="background: var(--glass-bg); padding: 12px; border-radius: 8px; margin: 12px 0; border: 1px solid var(--border-color);">
            <div style="display: flex; justify-content: space-between;">
              <span style="color: var(--text-secondary);">Precio unitario:</span>
              <span style="font-weight: 600;">${window.formatearUSD(prod.precioVentaSugerido)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-top: 4px;">
              <span style="color: var(--text-secondary);">Total:</span>
              <span style="font-weight: 700; color: var(--gold);" id="totalVentaDisplay">${window.formatearUSD(prod.precioVentaSugerido)}</span>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" onclick="cerrarModal('modalVenta')">Cancelar</button>
          <button class="btn btn-primary" onclick="window.confirmarVenta('${id}')">
            <i class="fas fa-check"></i> Confirmar
          </button>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  
  const input = document.getElementById('inputVentaCantidad');
  if (input) {
    input.addEventListener('input', function() {
      const cantidad = parseInt(this.value) || 1;
      const total = cantidad * prod.precioVentaSugerido;
      document.getElementById('totalVentaDisplay').textContent = window.formatearUSD(total);
    });
  }
};

window.confirmarVenta = function(id) {
  const prod = window.productos.find(p => p.id === id);
  if (!prod) return alert('Producto no encontrado');
  
  const input = document.getElementById('inputVentaCantidad');
  const cantidad = parseInt(input?.value) || 1;
  if (cantidad < 1) return alert('Ingresa una cantidad válida');
  
  const registro = { cantidad: cantidad, fecha: new Date().toISOString() };
  if (!Array.isArray(prod.ventasRegistradas)) prod.ventasRegistradas = [];
  prod.ventasRegistradas.push(registro);
  prod.totalVendido = (prod.totalVendido || 0) + cantidad;
  
  window.actualizarEstacionalidad(prod, 'venta', cantidad, new Date().toISOString());
  window.guardarProductos();

  // Asientos contables
  const ingreso = cantidad * prod.precioVentaSugerido;
  const costo = cantidad * prod.costoUnitarioTotal;
  window.agregarAsiento({
    id: window.generarId(),
    fecha: new Date().toISOString(),
    descripcion: `Venta de ${cantidad} unidades de ${prod.nombre} (SKU: ${prod.sku})`,
    tipo: 'venta',
    movimientos: [
      { cuenta: 'Banco', debe: ingreso, haber: 0 },
      { cuenta: 'Ventas', debe: 0, haber: ingreso }
    ],
    referencia: prod.id
  });
  window.agregarAsiento({
    id: window.generarId(),
    fecha: new Date().toISOString(),
    descripcion: `Costo de venta de ${cantidad} unidades de ${prod.nombre}`,
    tipo: 'costo',
    movimientos: [
      { cuenta: 'Costo de Ventas', debe: costo, haber: 0 },
      { cuenta: 'Inventario', debe: 0, haber: costo }
    ],
    referencia: prod.id
  });

  cerrarModal('modalVenta');
  renderizarRecomendaciones();
  actualizarContabilidadSiActiva();
  alert(`✅ Venta registrada. Total vendido: ${prod.totalVendido} unidades.`);
};

// ==========================================
//  PREGUNTA (producto)
// ==========================================
window.mostrarModalPregunta = function(id) {
  const prod = window.productos.find(p => p.id === id);
  if (!prod) return alert('Producto no encontrado');
  
  const modalHTML = `
    <div class="modal-overlay" id="modalPregunta">
      <div class="modal-content">
        <div class="modal-header">
          <h3><i class="fas fa-question-circle" style="color: var(--gold);"></i> Registrar preguntas</h3>
          <button class="modal-close" onclick="cerrarModal('modalPregunta')">&times;</button>
        </div>
        <div class="modal-body">
          <p style="color: var(--text-secondary); margin-bottom: 16px;">
            Producto: <strong>${prod.nombre}</strong> (SKU: ${prod.sku})
          </p>
          <div style="display: flex; gap: 12px; align-items: center;">
            <label style="color: var(--text-secondary); font-weight: 500;">Cantidad de preguntas:</label>
            <input type="number" id="inputPreguntaCantidad" value="1" min="1" step="1" 
                   style="flex:1; background: var(--glass-bg); border: 1px solid var(--border-color); border-radius: 10px; padding: 10px 14px; color: var(--text-primary); font-size: 1rem;" />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" onclick="cerrarModal('modalPregunta')">Cancelar</button>
          <button class="btn btn-primary" onclick="window.confirmarPregunta('${id}')">
            <i class="fas fa-check"></i> Registrar
          </button>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHTML);
};

window.confirmarPregunta = function(id) {
  const prod = window.productos.find(p => p.id === id);
  if (!prod) return alert('Producto no encontrado');
  
  const input = document.getElementById('inputPreguntaCantidad');
  const cantidad = parseInt(input?.value) || 1;
  if (cantidad < 1) return alert('Ingresa una cantidad válida');
  
  if (!Array.isArray(prod.preguntasRegistradas)) prod.preguntasRegistradas = [];
  prod.preguntasRegistradas.push({ cantidad: cantidad, fecha: new Date().toISOString() });
  window.actualizarEstacionalidad(prod, 'pregunta', cantidad, new Date().toISOString());
  window.guardarProductos();
  
  cerrarModal('modalPregunta');
  renderizarRecomendaciones();
  alert(`✅ Preguntas registradas. Total: ${prod.preguntasRegistradas.reduce((s, r) => s + r.cantidad, 0)}.`);
};

// ==========================================
//  REDES (producto) - MODAL MEJORADO
// ==========================================
window.mostrarModalRedes = function(id) {
  const prod = window.productos.find(p => p.id === id);
  if (!prod) return alert('Producto no encontrado');
  const datos = prod.interacciones || { instagram: {}, tiktok: {}, marketplace: {} };
  
  const modalHTML = `
    <div class="modal-overlay" id="modalRedes">
      <div class="modal-content" style="max-width:650px;">
        <div class="modal-header">
          <h3><i class="fas fa-share-alt" style="color:var(--gold);"></i> Redes sociales - ${prod.nombre}</h3>
          <button class="modal-close" onclick="cerrarModal('modalRedes')">&times;</button>
        </div>
        <div class="modal-body">
          <p style="color:var(--text-secondary);margin-bottom:12px;font-size:0.9rem;">
            📊 Actualiza las métricas de cada plataforma. Los campos <strong>Alcance</strong> son obligatorios para calcular el engagement.
          </p>
          
          <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px;">
            ${['instagram', 'tiktok', 'marketplace'].map(plataforma => {
              const nombre = plataforma.charAt(0).toUpperCase() + plataforma.slice(1);
              const data = datos[plataforma] || {};
              return `
                <div style="background:var(--glass-bg);padding:12px;border-radius:10px;border:1px solid var(--border-color);">
                  <h4 style="text-align:center;color:var(--gold);font-size:0.85rem;margin-bottom:8px;border-bottom:1px solid var(--border-color);padding-bottom:6px;">
                    ${plataforma === 'instagram' ? '📸' : plataforma === 'tiktok' ? '🎵' : '🛒'} ${nombre}
                  </h4>
                  <div style="display:flex;flex-direction:column;gap:6px;">
                    <div style="display:flex;align-items:center;gap:6px;">
                      <span style="font-size:0.7rem;color:var(--text-secondary);min-width:65px;">❤️ Likes:</span>
                      <input type="number" id="redes_${plataforma}_likes" placeholder="0" value="${data.likes || 0}" 
                             style="flex:1;background:var(--bg-input);border:1px solid var(--border-color);border-radius:6px;padding:4px 8px;color:var(--text-primary);font-size:0.8rem;" />
                    </div>
                    <div style="display:flex;align-items:center;gap:6px;">
                      <span style="font-size:0.7rem;color:var(--text-secondary);min-width:65px;">💬 Comentarios:</span>
                      <input type="number" id="redes_${plataforma}_com" placeholder="0" value="${data.comentarios || 0}" 
                             style="flex:1;background:var(--bg-input);border:1px solid var(--border-color);border-radius:6px;padding:4px 8px;color:var(--text-primary);font-size:0.8rem;" />
                    </div>
                    <div style="display:flex;align-items:center;gap:6px;">
                      <span style="font-size:0.7rem;color:var(--text-secondary);min-width:65px;">🔄 Compartidos:</span>
                      <input type="number" id="redes_${plataforma}_share" placeholder="0" value="${data.compartidos || 0}" 
                             style="flex:1;background:var(--bg-input);border:1px solid var(--border-color);border-radius:6px;padding:4px 8px;color:var(--text-primary);font-size:0.8rem;" />
                    </div>
                    <div style="display:flex;align-items:center;gap:6px;border-top:1px solid var(--border-color);padding-top:6px;margin-top:2px;">
                      <span style="font-size:0.7rem;color:var(--gold);min-width:65px;font-weight:600;">👁️ Alcance:</span>
                      <input type="number" id="redes_${plataforma}_alc" placeholder="100" value="${data.alcance || 100}" 
                             style="flex:1;background:var(--bg-input);border:1px solid var(--border-color);border-radius:6px;padding:4px 8px;color:var(--text-primary);font-size:0.8rem;border-color:var(--gold);" />
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
          
          <div style="margin-top:12px;padding:8px 12px;background:rgba(247,201,72,0.1);border-radius:8px;border:1px solid var(--gold);font-size:0.75rem;color:var(--text-secondary);text-align:center;">
            ℹ️ El engagement se calcula como: (Likes + Comentarios + Compartidos) / Alcance × 100
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" onclick="cerrarModal('modalRedes')">Cancelar</button>
          <button class="btn btn-primary" onclick="window.confirmarRedes('${id}')"><i class="fas fa-save"></i> Guardar</button>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHTML);
};

window.confirmarRedes = function(id) {
  const prod = window.productos.find(p => p.id === id);
  if (!prod) return alert('Producto no encontrado');
  
  const getVal = (id) => parseInt(document.getElementById(id)?.value) || 0;
  const getPlataforma = (plataforma) => ({
    likes: getVal(`redes_${plataforma}_likes`),
    comentarios: getVal(`redes_${plataforma}_com`),
    compartidos: getVal(`redes_${plataforma}_share`),
    alcance: getVal(`redes_${plataforma}_alc`) || 100
  });
  
  const totalInteracciones = ['instagram','tiktok','marketplace'].reduce((sum, p) => {
    const data = getPlataforma(p);
    return sum + data.likes + data.comentarios + data.compartidos;
  }, 0);
  
  prod.interacciones = {
    instagram: getPlataforma('instagram'),
    tiktok: getPlataforma('tiktok'),
    marketplace: getPlataforma('marketplace')
  };
  window.actualizarEstacionalidad(prod, 'interaccion', totalInteracciones, new Date().toISOString());
  window.guardarProductos();
  cerrarModal('modalRedes');
  renderizarRecomendaciones();
  alert('✅ Métricas de redes actualizadas.');
};

// ==========================================
//  COMPETENCIA
// ==========================================
window.mostrarModalCompetencia = function(id) {
  const prod = window.productos.find(p => p.id === id);
  if (!prod) return alert('Producto no encontrado');
  const competidoresList = prod.competidores || [];
  const listaHTML = competidoresList.length > 0 ? `
    <div style="margin:12px 0;max-height:150px;overflow-y:auto;">
      ${competidoresList.map((c, idx) => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid var(--border-color);">
          <span><strong>${c.nombre}</strong> ${window.formatearUSD(c.precio)} ${c.plataforma ? `(${c.plataforma})` : ''}</span>
          <button class="btn-small" onclick="window.eliminarCompetidor('${id}',${idx})" style="color:#e74c3c;"><i class="fas fa-trash"></i></button>
        </div>
      `).join('')}
    </div>
  ` : '<p style="color:var(--text-secondary);font-size:0.9rem;">No hay competidores.</p>';
  
  const modalHTML = `
    <div class="modal-overlay" id="modalCompetencia">
      <div class="modal-content" style="max-width:500px;">
        <div class="modal-header">
          <h3><i class="fas fa-store" style="color:var(--gold);"></i> Competencia</h3>
          <button class="modal-close" onclick="cerrarModal('modalCompetencia')">&times;</button>
        </div>
        <div class="modal-body">
          <p style="color:var(--text-secondary);margin-bottom:12px;">Producto: <strong>${prod.nombre}</strong> (SKU: ${prod.sku})</p>
          <div style="background:var(--glass-bg);padding:12px;border-radius:8px;margin-bottom:12px;border:1px solid var(--border-color);">
            <h4 style="margin-bottom:8px;">📊 Competidores registrados</h4>
            ${listaHTML}
          </div>
          <h4 style="margin:12px 0 8px;">➕ Agregar competidor</h4>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
            <input type="text" id="inputCompNombre" placeholder="Nombre" style="background:var(--glass-bg);border:1px solid var(--border-color);border-radius:8px;padding:8px 12px;color:var(--text-primary);" />
            <input type="number" id="inputCompPrecio" placeholder="Precio (USD)" step="0.01" style="background:var(--glass-bg);border:1px solid var(--border-color);border-radius:8px;padding:8px 12px;color:var(--text-primary);" />
            <input type="text" id="inputCompPlataforma" placeholder="Plataforma (opcional)" style="grid-column:1/-1;background:var(--glass-bg);border:1px solid var(--border-color);border-radius:8px;padding:8px 12px;color:var(--text-primary);" />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" onclick="cerrarModal('modalCompetencia')">Cerrar</button>
          <button class="btn btn-primary" onclick="window.agregarCompetidor('${id}')"><i class="fas fa-plus"></i> Agregar</button>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHTML);
};

window.agregarCompetidor = function(id) {
  const prod = window.productos.find(p => p.id === id);
  if (!prod) return alert('Producto no encontrado');
  const nombre = document.getElementById('inputCompNombre')?.value.trim();
  const precio = parseFloat(document.getElementById('inputCompPrecio')?.value);
  const plataforma = document.getElementById('inputCompPlataforma')?.value.trim() || '';
  if (!nombre) return alert('⚠️ Ingresa el nombre.');
  if (!precio || precio <= 0) return alert('⚠️ Ingresa un precio válido.');
  if (!prod.competidores) prod.competidores = [];
  prod.competidores.push({ nombre, precio, plataforma, fecha: new Date().toISOString() });
  window.guardarProductos();
  cerrarModal('modalCompetencia');
  renderizarRecomendaciones();
  alert(`✅ Competidor "${nombre}" agregado.`);
};

window.eliminarCompetidor = function(id, index) {
  if (!confirm('¿Eliminar este competidor?')) return;
  const prod = window.productos.find(p => p.id === id);
  if (!prod) return;
  prod.competidores.splice(index, 1);
  window.guardarProductos();
  renderizarRecomendaciones();
  if (document.getElementById('modalCompetencia')) {
    cerrarModal('modalCompetencia');
    window.mostrarModalCompetencia(id);
  }
};

// ==========================================
//  ELIMINAR PRODUCTO
// ==========================================
window.eliminarProducto = function(id) {
  console.log(`🗑️ Intentando eliminar producto ID: ${id}`);
  if (!confirm('¿Eliminar este producto permanentemente?')) return;
  
  const prod = window.productos.find(p => p.id === id);
  if (prod) console.log(`Eliminando: ${prod.nombre} (SKU: ${prod.sku})`);
  
  window.productos = window.productos.filter(p => p.id !== id);
  console.log(`Productos restantes: ${window.productos.length}`);
  window.guardarProductos();
  
  const currentTab = document.querySelector('.tab-btn.active')?.dataset.tab || 'registro';
  if (currentTab === 'recomendaciones') renderizarRecomendaciones();
  else if (currentTab === 'inventario') renderizarInventario();
  else if (currentTab === 'contabilidad') {
    const contabActiva = document.querySelector('.contab-tab.active')?.dataset.contab || 'diario';
    renderizarContabilidad(contabActiva);
  }
  alert('✅ Producto eliminado correctamente.');
};

// ==========================================
//  SONDEO: REDES
// ==========================================
window.mostrarModalSondeoRedes = function(id) {
  const sondeo = window.sondeos.find(s => s.id === id);
  if (!sondeo) return alert('Sondeo no encontrado');
  const datos = sondeo.interacciones || { instagram: {}, tiktok: {}, marketplace: {} };
  
  const modalHTML = `
    <div class="modal-overlay" id="modalSondeoRedes">
      <div class="modal-content" style="max-width:650px;">
        <div class="modal-header">
          <h3><i class="fas fa-share-alt" style="color:var(--gold);"></i> Redes sociales - ${sondeo.nombre}</h3>
          <button class="modal-close" onclick="cerrarModal('modalSondeoRedes')">&times;</button>
        </div>
        <div class="modal-body">
          <p style="color:var(--text-secondary);margin-bottom:12px;font-size:0.9rem;">
            📊 Registra las métricas de cada plataforma para medir el interés del mercado.
          </p>
          
          <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px;">
            ${['instagram', 'tiktok', 'marketplace'].map(plataforma => {
              const nombre = plataforma.charAt(0).toUpperCase() + plataforma.slice(1);
              const data = datos[plataforma] || {};
              return `
                <div style="background:var(--glass-bg);padding:12px;border-radius:10px;border:1px solid var(--border-color);">
                  <h4 style="text-align:center;color:var(--gold);font-size:0.85rem;margin-bottom:8px;border-bottom:1px solid var(--border-color);padding-bottom:6px;">
                    ${plataforma === 'instagram' ? '📸' : plataforma === 'tiktok' ? '🎵' : '🛒'} ${nombre}
                  </h4>
                  <div style="display:flex;flex-direction:column;gap:6px;">
                    <div style="display:flex;align-items:center;gap:6px;">
                      <span style="font-size:0.7rem;color:var(--text-secondary);min-width:65px;">❤️ Likes:</span>
                      <input type="number" id="sondeoredes_${plataforma}_likes" placeholder="0" value="${data.likes || 0}" 
                             style="flex:1;background:var(--bg-input);border:1px solid var(--border-color);border-radius:6px;padding:4px 8px;color:var(--text-primary);font-size:0.8rem;" />
                    </div>
                    <div style="display:flex;align-items:center;gap:6px;">
                      <span style="font-size:0.7rem;color:var(--text-secondary);min-width:65px;">💬 Comentarios:</span>
                      <input type="number" id="sondeoredes_${plataforma}_com" placeholder="0" value="${data.comentarios || 0}" 
                             style="flex:1;background:var(--bg-input);border:1px solid var(--border-color);border-radius:6px;padding:4px 8px;color:var(--text-primary);font-size:0.8rem;" />
                    </div>
                    <div style="display:flex;align-items:center;gap:6px;">
                      <span style="font-size:0.7rem;color:var(--text-secondary);min-width:65px;">🔄 Compartidos:</span>
                      <input type="number" id="sondeoredes_${plataforma}_share" placeholder="0" value="${data.compartidos || 0}" 
                             style="flex:1;background:var(--bg-input);border:1px solid var(--border-color);border-radius:6px;padding:4px 8px;color:var(--text-primary);font-size:0.8rem;" />
                    </div>
                    <div style="display:flex;align-items:center;gap:6px;border-top:1px solid var(--border-color);padding-top:6px;margin-top:2px;">
                      <span style="font-size:0.7rem;color:var(--gold);min-width:65px;font-weight:600;">👁️ Alcance:</span>
                      <input type="number" id="sondeoredes_${plataforma}_alc" placeholder="100" value="${data.alcance || 100}" 
                             style="flex:1;background:var(--bg-input);border:1px solid var(--border-color);border-radius:6px;padding:4px 8px;color:var(--text-primary);font-size:0.8rem;border-color:var(--gold);" />
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
          
          <div style="margin-top:12px;padding:8px 12px;background:rgba(247,201,72,0.1);border-radius:8px;border:1px solid var(--gold);font-size:0.75rem;color:var(--text-secondary);text-align:center;">
            ℹ️ El engagement se calcula como: (Likes + Comentarios + Compartidos) / Alcance × 100
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" onclick="cerrarModal('modalSondeoRedes')">Cancelar</button>
          <button class="btn btn-primary" onclick="window.confirmarSondeoRedes('${id}')"><i class="fas fa-save"></i> Guardar</button>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHTML);
};

window.confirmarSondeoRedes = function(id) {
  const sondeo = window.sondeos.find(s => s.id === id);
  if (!sondeo) return alert('Sondeo no encontrado');
  const getVal = (id) => parseInt(document.getElementById(id)?.value) || 0;
  ['instagram','tiktok','marketplace'].forEach(p => {
    sondeo.interacciones[p] = {
      likes: getVal(`sondeoredes_${p}_likes`),
      comentarios: getVal(`sondeoredes_${p}_com`),
      compartidos: getVal(`sondeoredes_${p}_share`),
      alcance: getVal(`sondeoredes_${p}_alc`) || 100
    };
  });
  window.guardarSondeos();
  cerrarModal('modalSondeoRedes');
  renderizarSondeos();
  alert('✅ Métricas actualizadas.');
};

// ==========================================
//  SONDEO: PREGUNTAS
// ==========================================
window.registrarPreguntaSondeo = function(id) {
  const sondeo = window.sondeos.find(s => s.id === id);
  if (!sondeo) return alert('Sondeo no encontrado');
  const cantidad = prompt('¿Cuántas preguntas recibiste?', '1');
  if (cantidad === null) return;
  sondeo.preguntas = (sondeo.preguntas || 0) + parseInt(cantidad) || 1;
  window.guardarSondeos();
  renderizarSondeos();
  alert(`✅ Preguntas registradas. Total: ${sondeo.preguntas}`);
};

// ==========================================
//  SONDEO: REGISTRO DIARIO
// ==========================================
window.mostrarModalRegistroDiario = function(id) {
  const sondeo = window.sondeos.find(s => s.id === id);
  if (!sondeo) return alert('Sondeo no encontrado');
  const hoy = new Date().toISOString().split('T')[0];
  const registroHoy = sondeo.historial?.find(r => r.fecha === hoy);
  
  const modalHTML = `
    <div class="modal-overlay" id="modalRegistroDiario">
      <div class="modal-content" style="max-width:450px;">
        <div class="modal-header">
          <h3><i class="fas fa-calendar-day" style="color:var(--gold);"></i> Registrar día</h3>
          <button class="modal-close" onclick="cerrarModal('modalRegistroDiario')">&times;</button>
        </div>
        <div class="modal-body">
          <p style="color:var(--text-secondary);margin-bottom:12px;">Producto: <strong>${sondeo.nombre}</strong></p>
          <p style="color:var(--text-secondary);margin-bottom:12px;">Fecha: <strong>${new Date().toLocaleDateString('es-ES')}</strong></p>
          <div style="display:flex;flex-direction:column;gap:12px;">
            <div>
              <label style="color:var(--text-secondary);font-weight:500;">👁️ Vistas (alcance)</label>
              <input type="number" id="inputDiarioVistas" value="${registroHoy?.vistas||0}" min="0" step="1" style="width:100%;background:var(--glass-bg);border:1px solid var(--border-color);border-radius:10px;padding:10px 14px;color:var(--text-primary);font-size:1rem;margin-top:4px;" />
            </div>
            <div>
              <label style="color:var(--text-secondary);font-weight:500;">🗣️ Preguntas</label>
              <input type="number" id="inputDiarioPreguntas" value="${registroHoy?.preguntas||0}" min="0" step="1" style="width:100%;background:var(--glass-bg);border:1px solid var(--border-color);border-radius:10px;padding:10px 14px;color:var(--text-primary);font-size:1rem;margin-top:4px;" />
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" onclick="cerrarModal('modalRegistroDiario')">Cancelar</button>
          <button class="btn btn-primary" onclick="window.confirmarRegistroDiario('${id}')"><i class="fas fa-save"></i> Guardar día</button>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHTML);
};

window.confirmarRegistroDiario = function(id) {
  const sondeo = window.sondeos.find(s => s.id === id);
  if (!sondeo) return alert('Sondeo no encontrado');
  const vistas = parseInt(document.getElementById('inputDiarioVistas')?.value) || 0;
  const preguntas = parseInt(document.getElementById('inputDiarioPreguntas')?.value) || 0;
  if (vistas < 0 || preguntas < 0) return alert('⚠️ Los valores no pueden ser negativos.');
  const resultado = window.agregarRegistroSondeo(id, vistas, preguntas);
  if (!resultado) return alert('❌ Error al guardar.');
  cerrarModal('modalRegistroDiario');
  renderizarSondeos();
  alert(`✅ Registro guardado.\nVistas: ${vistas}\nPreguntas: ${preguntas}`);
};

// ==========================================
//  SONDEO: IMPORTAR A PRODUCTO
// ==========================================
window.moverSondeoAProducto = function(id) {
  const sondeo = window.sondeos.find(s => s.id === id);
  if (!sondeo) return alert('Sondeo no encontrado');
  if (!confirm(`¿Importar "${sondeo.nombre}" al registro?`)) return;
  
  const nuevoProducto = {
    id: window.generarId(),
    loteId: window.generarId(),
    nombre: sondeo.nombre,
    sku: window.generarSKU(sondeo.nombre, window.productos.map(p => p.sku)),
    atributo: '',
    precioUnitarioChina: Math.round(sondeo.costosEstimados * 0.7 * 100) / 100 || 0.01,
    cantidadImportada: 50,
    fleteInternacional: 0,
    gastosExtra: [],
    costoUnitarioTotal: sondeo.costosEstimados || 0.01,
    precioVentaSugerido: sondeo.precioEstimado,
    margenGanancia: 40,
    fechaLlegada: new Date().toISOString(),
    interacciones: sondeo.interacciones || { instagram: {}, tiktok: {}, marketplace: {} },
    ventasRegistradas: [],
    totalVendido: 0,
    preguntasRegistradas: sondeo.preguntas > 0 ? [{ cantidad: sondeo.preguntas, fecha: new Date().toISOString() }] : [],
    competidores: [],
    estacionalidad: sondeo.estacionalidad || window.inicializarEstacionalidad()
  };
  
  window.productos.push(nuevoProducto);
  window.guardarProductos();
  window.sondeos = window.sondeos.filter(s => s.id !== id);
  window.guardarSondeos();
  renderizarSondeos();
  alert(`✅ "${sondeo.nombre}" importado al registro de productos.`);
};

// ==========================================
//  SONDEO: ELIMINAR
// ==========================================
window.eliminarSondeo = function(id) {
  console.log(`🗑️ Intentando eliminar sondeo ID: ${id}`);
  if (!confirm('¿Eliminar este producto del sondeo?')) return;
  
  const sondeo = window.sondeos.find(s => s.id === id);
  if (sondeo) console.log(`Eliminando sondeo: ${sondeo.nombre}`);
  
  window.sondeos = window.sondeos.filter(s => s.id !== id);
  console.log(`Sondeos restantes: ${window.sondeos.length}`);
  window.guardarSondeos();
  renderizarSondeos();
  alert('✅ Producto eliminado del sondeo.');
};

// ==========================================
//  ESTACIONALIDAD: FILTROS (global)
// ==========================================
window.filtroEstacionalidad = 'todos';
window.filtrarEstacionalidad = function(tipo) {
  window.filtroEstacionalidad = tipo;
  renderizarEstacionalidad();
};
