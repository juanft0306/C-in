const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Servir archivos estáticos desde 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Todas las rutas no encontradas devuelven index.html (para SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 C🌍in corriendo en http://localhost:${PORT}`);
  console.log('📦 Datos guardados en localStorage del navegador.');
});
