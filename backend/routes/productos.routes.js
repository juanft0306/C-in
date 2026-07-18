const express = require('express');
const router = express.Router();
const {
  crearProducto,
  obtenerProductos,
  actualizarRedes,
  registrarVenta,
  registrarPregunta
} = require('../controllers/productos.controller');

// Rutas públicas (por ahora sin autenticación)
router.post('/', crearProducto);                     // Crear producto + costeo
router.get('/', obtenerProductos);                  // Listar productos con análisis
router.put('/:id/redes', actualizarRedes);          // Actualizar interacciones sociales
router.post('/:id/venta', registrarVenta);          // Registrar una venta
router.post('/:id/pregunta', registrarPregunta);    // Registrar preguntas

module.exports = router;
