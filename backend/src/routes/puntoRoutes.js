// backend/src/routes/puntoRoutes.js
import { Router } from 'express';
import { getHistorialPuntos, getHistorialPuntosAdmin } from '../controllers/puntoController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { adminMiddleware } from '../middleware/adminMiddleware.js';

const router = Router();

router.use(authMiddleware); // Proteger la ruta
router.get('/historial', getHistorialPuntos);
router.get('/historial/:socioId', adminMiddleware, getHistorialPuntosAdmin);

export default router;
