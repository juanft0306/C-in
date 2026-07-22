// ==========================================
//  C🌍in - UI Acciones (modales, acciones rápidas)
// ==========================================

// ==========================================
//  VENTA (producto)
// ==========================================
window.mostrarModalVenta = function(id) {
  const prod = window.productos.find(p => p.id === id);
  if (!prod) return alert('Producto no encontrado');
  // ... (código del modal)
};

window.confirmarVenta = function(id) {
  // ... (registra venta, actualiza estacionalidad, asientos)
};

// ==========================================
//  PREGUNTA (producto)
// ==========================================
window.mostrarModalPregunta = function(id) { /* ... */ };
window.confirmarPregunta = function(id) { /* ... */ };

// ==========================================
//  REDES (producto)
// ==========================================
window.mostrarModalRedes = function(id) { /* ... */ };
window.confirmarRedes = function(id) { /* ... */ };

// ==========================================
//  COMPETENCIA (producto)
// ==========================================
window.mostrarModalCompetencia = function(id) { /* ... */ };
window.agregarCompetidor = function(id) { /* ... */ };
window.eliminarCompetidor = function(id, index) { /* ... */ };

// ==========================================
//  ELIMINAR PRODUCTO
// ==========================================
window.eliminarProducto = function(id) {
  if (!confirm('¿Seguro que deseas eliminar este producto?')) return;
  window.productos = window.productos.filter(p => p.id !== id);
  window.guardarProductos();
  const currentTab = document.querySelector('.tab-btn.active')?.dataset.tab || 'registro';
  if (currentTab === 'recomendaciones') renderizarRecomendaciones();
  else if (currentTab === 'inventario') renderizarInventario();
  else if (currentTab === 'contabilidad') renderizarContabilidad(document.querySelector('.contab-tab.active')?.dataset.contab || 'diario');
  alert('✅ Producto eliminado.');
};

// ==========================================
//  SONDEO: REDES, PREGUNTAS, REGISTRO DIARIO, IMPORTAR, ELIMINAR
// ==========================================
window.mostrarModalSondeoRedes = function(id) { /* ... */ };
window.confirmarSondeoRedes = function(id) { /* ... */ };
window.registrarPreguntaSondeo = function(id) { /* ... */ };
window.mostrarModalRegistroDiario = function(id) { /* ... */ };
window.confirmarRegistroDiario = function(id) { /* ... */ };
window.moverSondeoAProducto = function(id) { /* ... */ };
window.eliminarSondeo = function(id) { /* ... */ };

// ==========================================
//  ESTACIONALIDAD: FILTROS
// ==========================================
window.filtroEstacionalidad = 'todos';
window.filtrarEstacionalidad = function(tipo) {
  window.filtroEstacionalidad = tipo;
  renderizarEstacionalidad();
};
