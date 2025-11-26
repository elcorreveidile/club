// backend/src/routes/productoRoutes.js
import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { getCatalogo, crearProducto, actualizarProducto, eliminarProducto } from '../controllers/productoController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { adminMiddleware } from '../middleware/adminMiddleware.js';

const router = Router();

// Middleware opcional: si viene token, lo valida y añade req.user; si no, sigue sin cortar
const optionalAuth = (req, _res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token) {
      req.user = jwt.verify(token, process.env.JWT_SECRET);
    }
  } catch {
    // ignoramos errores de token opcional
  }
  next();
};

// Esta ruta es pública, no necesita autenticación
router.get('/catalogo', optionalAuth, getCatalogo);

// Rutas protegidas para admin
router.use(authMiddleware, adminMiddleware);
router.post('/', crearProducto);
router.put('/:id', actualizarProducto);
router.delete('/:id', eliminarProducto);

export default router;
