// backend/src/routes/authRoutes.js
import { Router } from 'express';
import { login } from '../controllers/authController.js';
import { preRegistrar } from '../controllers/preRegistroController.js';

const router = Router();

router.post('/login', login);

// Nueva ruta para el pre-registro
router.post('/preregistro', preRegistrar);

export default router;
