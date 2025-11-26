// backend/src/controllers/socioController.js
import { pool } from '../config/db.js';
import bcrypt from 'bcryptjs';

export const getPerfil = async (req, res) => {
  // El middleware de autenticación se encarga de verificar el token
  // y añade el id del socio a req.user
  const socioId = req.user.id;

  try {
    const result = await pool.query(
      'SELECT id, numero_socio, nombre, email, rol, puntos_anio_actual FROM Socios WHERE id = $1',
      [socioId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Socio no encontrado' });
    }

    res.status(200).json({ socio: result.rows[0] });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en el servidor al obtener el perfil' });
  }
};

export const getListaSocios = async (req, res) => {
  try {
    // El usuario que hace la petición debe ser admin
    if (req.user.rol !== 'admin') {
      return res.status(403).json({ message: 'Acceso denegado' });
    }

    const result = await pool.query('SELECT id, numero_socio, nombre, email, rol FROM Socios ORDER BY nombre');
    res.status(200).json({ socios: result.rows });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en el servidor al obtener la lista de socios' });
  }
};

// Crear un socio (solo admin)
export const crearSocio = async (req, res) => {
  if (req.user.rol !== 'admin') {
    return res.status(403).json({ message: 'Acceso denegado' });
  }

  const { nombre, email, password, numero_socio, rol = 'socio', id_tipo_socio = null, puntos_anio_actual = 0 } = req.body;

  if (!nombre || !email || !password || !numero_socio) {
    return res.status(400).json({ message: 'Nombre, email, contraseña y número de socio son obligatorios.' });
  }

  try {
    const existeEmail = await pool.query('SELECT 1 FROM Socios WHERE email = $1', [email]);
    if (existeEmail.rows.length > 0) {
      return res.status(409).json({ message: 'El email ya está registrado.' });
    }
    const existeNumero = await pool.query('SELECT 1 FROM Socios WHERE numero_socio = $1', [numero_socio]);
    if (existeNumero.rows.length > 0) {
      return res.status(409).json({ message: 'El número de socio ya está en uso.' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO Socios (numero_socio, nombre, email, password_hash, rol, id_tipo_socio, puntos_anio_actual) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, numero_socio, nombre, email, rol, puntos_anio_actual',
      [numero_socio, nombre, email, password_hash, rol, id_tipo_socio, puntos_anio_actual]
    );

    res.status(201).json({ socio: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en el servidor al crear el socio' });
  }
};

// Eliminar socio (solo admin)
export const eliminarSocio = async (req, res) => {
  if (req.user.rol !== 'admin') {
    return res.status(403).json({ message: 'Acceso denegado' });
  }

  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ message: 'ID requerido' });
  }

  try {
    const result = await pool.query('DELETE FROM Socios WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Socio no encontrado' });
    }
    res.status(200).json({ message: 'Socio eliminado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en el servidor al eliminar el socio' });
  }
};
