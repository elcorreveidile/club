// backend/src/routes/preRegistroRoutes.js
import { Router } from 'express';
import { preRegistrar, getPreRegistros, aprobarPreRegistro, rechazarPreRegistro } from '../controllers/preRegistroController.js';
import { authMiddleware, adminMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

// Ruta pública para pre-registrar un socio
router.post('/', preRegistrar);

// Rutas para el admin (protección con middleware)
router.get('/', authMiddleware, adminMiddleware, getPreRegistros);
router.put('/:id/aprobar', authMiddleware, adminMiddleware, aprobarPreRegistro);
router.put('/:id/rechazar', authMiddleware, adminMiddleware, rechazarPreRegistro);

export default router;
