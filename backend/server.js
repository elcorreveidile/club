// backend/server.js
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from './src/config/db.js';
import authRoutes from './src/routes/authRoutes.js';
import socioRoutes from './src/routes/socioRoutes.js'; 
import compraRoutes from './src/routes/compraRoutes.js'; 
import puntoRoutes from './src/routes/puntoRoutes.js';
import productoRoutes from './src/routes/productoRoutes.js';
import canjeRoutes from './src/routes/canjeRoutes.js';
import sugerenciaRoutes from './src/routes/sugerenciaRoutes.js';
import libroVisitasRoutes from './src/routes/libroVisitasRoutes.js';
import preRegistroRoutes from './src/routes/preRegistroRoutes.js';
import documentoRoutes from './src/routes/documentoRoutes.js';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- CONFIGURACIÓN DE CORS (PARA DESARROLLO) ---
// Permite peticiones desde el origen del frontend de Vite
app.use(cors({
  origin: 'http://localhost:5173', // Especificamos el origen exacto
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Middleware para parsear JSON (aumentamos límite para base64 de archivos)
app.use(express.json({ limit: '10mb' }));

// Servir archivos subidos (imágenes y documentos) de forma protegida por ruta
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- MIDDLEWARE DE DEPURACIÓN (PARA SABER SI LLEGAN LAS PETICIONES) ---
// Este middleware se ejecutará para CADA petición que reciba el servidor
// y nos mostrará en la terminal qué método y qué ruta se está pidiendo.
app.use((req, res, next) => {
  console.log(`📨 Petición recibida: ${req.method} ${req.path}`);
  next(); // Importante: llama a next() para que continúe con las rutas
});


// --- RUTAS ---
// Ruta de prueba
app.get('/', (req, res) => {
  res.status(200).json({ message: '¡API del Club de Fumadores funcionando!' });
});

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/socios', socioRoutes);
app.use('/api/compras-fisicas', compraRoutes);
app.use('/api/puntos', puntoRoutes);
app.use('/api/productos', productoRoutes);
app.use('/api/canjes', canjeRoutes);
app.use('/api/sugerencias', sugerenciaRoutes);
app.use('/api/libro-visitas', libroVisitasRoutes);
app.use('/api/pre-registro', preRegistroRoutes);
app.use('/api/documentos', documentoRoutes);

// Middleware para rutas no encontradas
app.use((req, res, next) => {
  res.status(404).json({ message: 'Ruta no encontrada' });
});

// --- INICIAR SERVIDOR ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n✅ Servidor corriendo en el puerto ${PORT}`);
  console.log(`🚀 API disponible en: http://localhost:${PORT}\n`);
});
