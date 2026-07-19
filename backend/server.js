require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const productosRoutes = require('./routes/productos.routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Servir frontend
app.use(express.static(path.join(__dirname, '../public')));

// Rutas API
app.use('/api/productos', productosRoutes);

// Ruta catch-all
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

// Arrancar servidor (sin base de datos)
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📁 Los datos se guardan en data.json (local)`);
});
