const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../../data.json');

// Inicializar archivo si no existe
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify({ productos: [] }, null, 2));
}

function leerProductos() {
  const data = fs.readFileSync(DATA_FILE, 'utf8');
  return JSON.parse(data).productos || [];
}

function guardarProductos(productos) {
  fs.writeFileSync(DATA_FILE, JSON.stringify({ productos }, null, 2));
}

function encontrarProducto(id) {
  const productos = leerProductos();
  return productos.find(p => p._id === id);
}

function agregarProducto(nuevoProducto) {
  const productos = leerProductos();
  // Generar un ID simple (timestamp + random)
  nuevoProducto._id = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  productos.unshift(nuevoProducto);
  guardarProductos(productos);
  return nuevoProducto;
}

function actualizarProducto(id, datos) {
  const productos = leerProductos();
  const index = productos.findIndex(p => p._id === id);
  if (index === -1) return null;
  productos[index] = { ...productos[index], ...datos };
  guardarProductos(productos);
  return productos[index];
}

module.exports = {
  leerProductos,
  guardarProductos,
  encontrarProducto,
  agregarProducto,
  actualizarProducto
};
