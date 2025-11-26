// backend/src/controllers/authController.js
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db.js';

export const login = async (req, res) => {
  console.log("🔐 Iniciando lógica de login...");
  const { email, password } = req.body;

  if (!email || !password) {
    console.log("❌ Faltan email o password.");
    return res.status(400).json({ message: 'Por favor, proporciona email y contraseña' });
  }

  try {
    console.log(`🔍 Buscando socio con email: ${email}...`);
    const result = await pool.query('SELECT * FROM Socios WHERE email = $1', [email]);
    console.log("✅ Consulta a la base de datos finalizada.");

    if (result.rows.length === 0) {
      console.log("❌ No se encontró al socio.");
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const socio = result.rows[0];
    console.log("🔐 Comparando contraseña...");
    const passwordMatch = await bcrypt.compare(password, socio.password_hash);
    console.log("✅ Comparación de contraseña finalizada.");

    if (!passwordMatch) {
      console.log("❌ La contraseña no coincide.");
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    console.log("🔑 Generando token...");
    const token = jwt.sign(
      { id: socio.id, rol: socio.rol, numero_socio: socio.numero_socio },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    console.log("✅ Token generado.");

    console.log("🚀 Enviando respuesta de éxito al cliente.");
    res.status(200).json({
      message: 'Login exitoso',
      token,
      socio: {
        id: socio.id,
        nombre: socio.nombre,
        email: socio.email,
        rol: socio.rol,
        numero_socio: socio.numero_socio,
      }
    });
    console.log("✅ Respuesta enviada.");

  } catch (error) {
    // --- LÍNEA CLAVE PARA VER EL ERROR REAL ---
    console.error("❌ ERROR DETALLADO en el login:", error);
    res.status(500).json({ message: 'Error en el servidor', details: error.message });
  }
};
// backend/src/controllers/authController.js
// ... (el resto de tu código existente: login, etc.)

// Función para el pre-registro de un nuevo socio
export const preRegistro = async (req, res) => {
  const { nombre, email, password, numero_socio } = req.body;

  // Validación básica de los datos de entrada
  if (!nombre || !email || !password || !numero_socio) {
    return res.status(400).json({ message: 'Todos los campos son requeridos.' });
  }

  try {
    // 1. Verificar si el email o el número de socio ya existen
    const socioExistente = await pool.query(
      'SELECT id FROM socios WHERE email = $1 OR numero_socio = $2',
      [email, numero_socio]
    );

    if (socioExistente.rows.length > 0) {
      return res.status(409).json({ message: 'El email o el número de socio ya están registrados.' });
    }

    // 2. Hashear la contraseña (asumo que tienes bcryptjs instalado)
    const bcrypt = require('bcryptjs');
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 3. Guardar al nuevo socio en la base de datos con estado 'pendiente_aprobacion'
    const nuevoSocio = await pool.query(
      'INSERT INTO socios (nombre, email, password, numero_socio, estado, fecha_registro) VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING id, nombre, email, numero_socio, estado',
      [nombre, email, hashedPassword, numero_socio, 'pendiente_aprobacion']
    );

    res.status(201).json({
      message: 'Solicitud de pre-registro enviada. Un administrador revisará tu solicitud.',
      // No devolvemos el token ni datos del usuario hasta que sea aprobado.
      socio: nuevoSocio.rows[0]
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en el servidor durante el pre-registro.' });
  }
};