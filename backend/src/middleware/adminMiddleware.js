// backend/src/middleware/adminMiddleware.js
export const adminMiddleware = (req, res, next) => {
  // authMiddleware ya se ha ejecutado y ha añadido req.user
  if (req.user.rol !== 'admin') {
    return res.status(403).json({ message: 'Acceso denegado: Se requiere rol de administrador.' });
  }
  next(); // Si es admin, continuar
};