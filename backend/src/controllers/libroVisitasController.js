// backend/src/controllers/libroVisitasController.js
import { pool } from '../config/db.js';

// Para que cualquiera (o solo socios) deje una entrada en el libro de visitas
export const crearEntrada = async (req, res) => {
  const { nombre_autor, texto } = req.body;
  const socioId = req.user?.id || null; // El ID del socio si está logueado, si no, es null.

  if (!nombre_autor || !texto || texto.trim() === '') {
    return res.status(400).json({ message: 'El nombre del autor y el texto son requeridos.' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO libro_visitas (nombre_autor, texto, id_socio, fecha) VALUES ($1, $2, $3, NOW()) RETURNING *',
      [nombre_autor, texto, socioId]
    );

    res.status(201).json({
      message: 'Entrada añadida al libro de visitas con éxito.',
      entrada: result.rows[0]
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en el servidor al crear la entrada.' });
  }
};

// Para que el admin elimine una entrada concreta
export const eliminarEntrada = async (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ message: 'ID requerido' });

  try {
    const result = await pool.query('DELETE FROM libro_visitas WHERE id = $1', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Entrada no encontrada' });
    }
    res.status(200).json({ message: 'Entrada eliminada correctamente.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al eliminar la entrada.' });
  }
};

// Para obtener todas las entradas del libro de visitas
export const getEntradas = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, nombre_autor, texto, fecha FROM libro_visitas ORDER BY fecha DESC'
    );

    res.status(200).json({ entradas: result.rows });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en el servidor al obtener las entradas.' });
  }
};
