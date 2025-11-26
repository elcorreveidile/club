// backend/src/routes/socioRoutes.js
import { Router } from 'express';
import { getPerfil, getListaSocios, crearSocio, eliminarSocio } from '../controllers/socioController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { adminMiddleware } from '../middleware/adminMiddleware.js';

const router = Router();

// Todas las rutas de este fichero estarán protegidas
router.use(authMiddleware);

router.get('/perfil', getPerfil);
router.get('/lista', getListaSocios); // <-- AÑADIR LA NUEVA RUTA
router.post('/', adminMiddleware, crearSocio);
router.delete('/:id', adminMiddleware, eliminarSocio);

export default router;
