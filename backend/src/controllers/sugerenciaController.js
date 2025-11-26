// backend/src/controllers/sugerenciaController.js
import { pool } from '../config/db.js';

// Para que un socio envíe una nueva sugerencia
export const crearSugerencia = async (req, res) => {
  const { titulo, texto } = req.body;
  const socioId = req.user.id; // Obtenemos el ID del socio del token JWT

  if (!titulo || titulo.trim() === '' || !texto || texto.trim() === '') {
    return res.status(400).json({ message: 'El título y el texto de la sugerencia son requeridos.' });
  }

  try {
    const result = await pool.query(
      "INSERT INTO sugerencias (id_socio, titulo, texto, fecha, estado) VALUES ($1, $2, $3, NOW(), 'recibida') RETURNING *",
      [socioId, titulo, texto]
    );

    res.status(201).json({
      message: 'Sugerencia enviada con éxito.',
      sugerencia: result.rows[0]
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en el servidor al crear la sugerencia.' });
  }
};

// Para que el admin vea todas las sugerencias
export const getSugerencias = async (req, res) => {
  // Solo un admin puede ver las sugerencias
  if (req.user.rol !== 'admin') {
    return res.status(403).json({ message: 'Acceso denegado' });
  }

  try {
    const result = await pool.query(
      `SELECT s.id, s.texto, s.fecha, s.leida, u.nombre AS nombre_socio, u.numero_socio
       FROM sugerencias s
       LEFT JOIN Socios u ON s.id_socio = u.id
       ORDER BY s.fecha DESC`
    );

    res.status(200).json({ sugerencias: result.rows });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en el servidor al obtener las sugerencias.' });
  }
};

// Para que el admin marque una sugerencia como leída
export const marcarComoLeida = async (req, res) => {
  if (req.user.rol !== 'admin') {
    return res.status(403).json({ message: 'Acceso denegado' });
  }

  const { id } = req.params;

  try {
    const result = await pool.query(
      'UPDATE sugerencias SET leida = TRUE WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Sugerencia no encontrada.' });
    }

    res.status(200).json({
      message: 'Sugerencia marcada como leída.',
      sugerencia: result.rows[0]
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en el servidor al actualizar la sugerencia.' });
  }
};
