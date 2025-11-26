// backend/src/routes/canjeRoutes.js
import { Router } from 'express';
import { solicitarCanje, getCanjesPendientes, aprobarCanje, rechazarCanje } from '../controllers/canjeController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { adminMiddleware } from '../middleware/adminMiddleware.js'; // <-- Importamos el nuevo middleware

const router = Router();

// Todas las rutas de canjes requieren que el usuario esté autenticado
router.use(authMiddleware);

// --- RUTAS PARA EL SOCIO ---

// El socio solicita un canje (la ruta POST /)
// Usamos la nueva función 'solicitarCanje' del controlador refactorizado
router.post('/', solicitarCanje);

// --- RUTAS PARA EL ADMINISTRADOR ---

// A partir de aquí, todas las rutas requerirán rol de admin
// Usamos el adminMiddleware para proteger estas rutas
router.use(adminMiddleware);

// 1. Obtener la lista de canjes pendientes (sin cambios en la ruta)
router.get('/pendientes', getCanjesPendientes);

// 2. Nueva ruta para APROBAR un canje específico
// Usamos PUT para modificar un recurso y el ID en la URL es una buena práctica REST
router.put('/:id_canje/aprobar', aprobarCanje);

// 3. Nueva ruta para RECHAZAR un canje específico
router.put('/:id_canje/rechazar', rechazarCanje);

// La ruta antigua '/entregar' ya no es necesaria y ha sido eliminada

export default router;