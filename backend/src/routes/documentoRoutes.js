import { Router } from 'express';
import { uploadDocumento, getEstadoDocumentos, listarDocumentosAdmin, verificarDocumento, descargarDocumento } from '../controllers/documentoController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { adminMiddleware } from '../middleware/adminMiddleware.js';

const router = Router();

router.use(authMiddleware);

router.post('/', uploadDocumento);
router.get('/estado', getEstadoDocumentos);
router.get('/todos', adminMiddleware, listarDocumentosAdmin);
router.put('/:id/verificar', adminMiddleware, verificarDocumento);
router.get('/:id/archivo', descargarDocumento);

export default router;
