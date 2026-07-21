const express = require('express');
const path = require('path');
const http = require('http');

const app = express();
const PORT = process.env.PORT || 3000;

// --- Configuración del autoping ---
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;
const PING_INTERVAL = process.env.PING_INTERVAL || 10 * 60 * 1000;
const AUTO_PING_ENABLED = process.env.AUTO_PING_ENABLED !== 'false';

// --- Servir archivos estáticos ---
app.use(express.static(path.join(__dirname, 'public')));

// --- Endpoint de salud para pings ---
app.get('/ping', (req, res) => {
  res.status(200).send('OK');
});

// --- Rutas de la API (ejemplo) ---
// app.use('/api', require('./api'));

// --- Catch-all para SPA ---
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- Iniciar servidor ---
const server = app.listen(PORT, () => {
  console.log(`🚀 C🌍in corriendo en http://localhost:${PORT}`);
  console.log(`📦 Datos guardados en localStorage del navegador.`);
  
  if (AUTO_PING_ENABLED) {
    console.log(`🔄 Autoping activado (cada ${PING_INTERVAL / 1000 / 60} minutos)`);
    iniciarAutoPing();
  } else {
    console.log(`⏸️ Autoping desactivado por variable de entorno`);
  }
});

// --- Función de autoping ---
function iniciarAutoPing() {
  function pingSelf() {
    const url = `${BASE_URL}/ping`;
    const startTime = Date.now();
    
    const request = http.get(url, (res) => {
      const duration = Date.now() - startTime;
      const date = new Date().toLocaleString('es-VE');
      console.log(`[${date}] ✅ Auto-ping - Código: ${res.statusCode} - ${duration}ms`);
      res.resume(); // Consumir respuesta
    });
    
    request.on('error', (err) => {
      const date = new Date().toLocaleString('es-VE');
      console.error(`[${date}] ❌ Auto-ping falló: ${err.message}`);
    });
    
    request.end();
  }

  // Primer ping después de 5 segundos (para que el servidor esté listo)
  setTimeout(pingSelf, 5000);
  // Pings periódicos
  setInterval(pingSelf, PING_INTERVAL);
}
