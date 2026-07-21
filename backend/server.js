const express = require('express');
const path = require('path');
const http = require('http');

const app = express();
const PORT = process.env.PORT || 3000;

// ==========================================
//  CONFIGURACIÓN DE RUTAS (flexible)
// ==========================================
// Detecta si server.js está en backend/ o en la raíz
const isInBackend = __dirname.includes('backend');
const publicPath = isInBackend ? path.join(__dirname, '../public') : path.join(__dirname, 'public');

console.log(`📁 Sirviendo archivos desde: ${publicPath}`);

// ==========================================
//  CONFIGURACIÓN DEL AUTOPING
// ==========================================
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;
const PING_INTERVAL = process.env.PING_INTERVAL || 10 * 60 * 1000; // 10 minutos
const AUTO_PING_ENABLED = process.env.AUTO_PING_ENABLED !== 'false';

// ==========================================
//  MIDDLEWARES
// ==========================================
// Servir archivos estáticos desde 'public'
app.use(express.static(publicPath));

// ==========================================
//  ENDPOINT DE SALUD (para pings)
// ==========================================
app.get('/ping', (req, res) => {
  res.status(200).send('OK');
});

// ==========================================
//  RUTAS DE LA API (si las tienes)
// ==========================================
// Ejemplo: app.use('/api', require('./api'));

// ==========================================
//  CATCH-ALL PARA SPA (Single Page Application)
// ==========================================
app.get('*', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

// ==========================================
//  INICIAR SERVIDOR
// ==========================================
const server = app.listen(PORT, () => {
  console.log(`🚀 C🌍in corriendo en http://localhost:${PORT}`);
  console.log(`📁 Sirviendo desde: ${publicPath}`);
  console.log(`📦 Datos guardados en localStorage del navegador.`);
  
  if (AUTO_PING_ENABLED) {
    console.log(`🔄 Autoping activado (cada ${PING_INTERVAL / 1000 / 60} minutos)`);
    iniciarAutoPing();
  } else {
    console.log(`⏸️ Autoping desactivado por variable de entorno`);
  }
});

// ==========================================
//  FUNCIÓN DE AUTOPING
// ==========================================
function iniciarAutoPing() {
  function pingSelf() {
    const url = `${BASE_URL}/ping`;
    const startTime = Date.now();
    
    const request = http.get(url, (res) => {
      const duration = Date.now() - startTime;
      const date = new Date().toLocaleString('es-VE');
      console.log(`[${date}] ✅ Auto-ping - Código: ${res.statusCode} - ${duration}ms`);
      res.resume(); // Consumir respuesta para liberar memoria
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

// ==========================================
//  MANEJO DE ERRORES NO CAPTURADOS
// ==========================================
process.on('uncaughtException', (err) => {
  console.error('❌ Error no capturado:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promesa rechazada sin manejar:', reason);
});
