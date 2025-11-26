// backend/src/routes/sugerenciaRoutes.js
import { Router } from 'express';
import { crearSugerencia, getSugerencias, marcarComoLeida } from '../controllers/sugerenciaController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

// Ruta para que el socio cree una sugerencia (protegida)
router.post('/', authMiddleware, crearSugerencia);

// Rutas para el admin
router.get('/', authMiddleware, getSugerencias);
router.put('/:id/leida', authMiddleware, marcarComoLeida);

export default router;