// backend/src/middleware/authMiddleware.js
import jwt from 'jsonwebtoken';

export const authMiddleware = (req, res, next) => {
  // 1. Obtener el token de la cabecera
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // "Bearer TOKEN"

  console.log('AuthMiddleware - Token recibido:', token); // <-- LOG TEMPORAL

  if (token == null) {
    console.log('AuthMiddleware - Error: Token no proporcionado'); // <-- LOG TEMPORAL
    return res.status(401).json({ message: 'Token no proporcionado' });
  }

  // 2. Verificar el token
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.log('AuthMiddleware - Error de verificación:', err); // <-- LOG TEMPORAL
      return res.status(403).json({ message: 'Token inválido o ha expirado' });
    }

    // 3. Añadir la información del usuario a la petición
    console.log('AuthMiddleware - Usuario verificado:', user); // <-- LOG TEMPORAL
    req.user = user;
    next(); // Continuar al siguiente middleware o a la ruta
  });
};

// Middleware para rutas solo de administradores
export const adminMiddleware = (req, res, next) => {
  if (!req.user || req.user.rol !== 'admin') {
    return res.status(403).json({ message: 'Acceso denegado' });
  }
  next();
};
