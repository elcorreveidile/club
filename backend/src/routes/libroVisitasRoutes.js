// backend/src/routes/libroVisitasRoutes.js
import { Router } from 'express';
import { crearEntrada, getEntradas, eliminarEntrada } from '../controllers/libroVisitasController.js';
import { authMiddleware, adminMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

// Ruta para crear una nueva entrada (pública o para socios)
router.post('/', crearEntrada);

// Ruta para obtener todas las entradas (pública)
router.get('/', getEntradas);

// Ruta para eliminar una entrada (solo admin)
router.delete('/:id', authMiddleware, adminMiddleware, eliminarEntrada);

export default router;
