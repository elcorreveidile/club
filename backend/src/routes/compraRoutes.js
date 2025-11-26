// backend/src/routes/compraRoutes.js
import { Router } from 'express';
import { registrarCompraFisica } from '../controllers/compraController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authMiddleware); // Proteger la ruta
router.post('/', registrarCompraFisica);

export default router;