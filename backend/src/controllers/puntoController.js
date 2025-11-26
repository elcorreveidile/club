// backend/src/controllers/puntoController.js
import { pool } from '../config/db.js';

export const getHistorialPuntos = async (req, res) => {
  // Obtenemos el ID del socio del token verificado por el middleware
  const socioId = req.user.id;
  const anioParam = req.query.anio;
  const anioActual = new Date().getFullYear();
  const filtroTodos = anioParam === 'todos';
  const anio = filtroTodos ? null : (anioParam ? Number(anioParam) : anioActual);

  try {
    const result = filtroTodos
      ? await pool.query(
          'SELECT id, puntos, motivo, descripcion, fecha, anio FROM MovimientosPuntos WHERE id_socio = $1 ORDER BY fecha DESC',
          [socioId]
        )
      : await pool.query(
          'SELECT id, puntos, motivo, descripcion, fecha, anio FROM MovimientosPuntos WHERE id_socio = $1 AND anio = $2 ORDER BY fecha DESC',
          [socioId, anio]
        );

    res.status(200).json({ movimientos: result.rows });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en el servidor al obtener el historial de puntos' });
  }
};

// Historial para admin de cualquier socio (ruta separada y protegida por adminMiddleware)
export const getHistorialPuntosAdmin = async (req, res) => {
  const { socioId } = req.params;
  const anioParam = req.query.anio;
  const anioActual = new Date().getFullYear();
  const filtroTodos = anioParam === 'todos';
  const anio = filtroTodos ? null : (anioParam ? Number(anioParam) : anioActual);

  if (!socioId) return res.status(400).json({ message: 'ID de socio requerido' });
  try {
    const result = filtroTodos
      ? await pool.query(
          'SELECT id, puntos, motivo, descripcion, fecha, anio FROM MovimientosPuntos WHERE id_socio = $1 ORDER BY fecha DESC',
          [socioId]
        )
      : await pool.query(
          'SELECT id, puntos, motivo, descripcion, fecha, anio FROM MovimientosPuntos WHERE id_socio = $1 AND anio = $2 ORDER BY fecha DESC',
          [socioId, anio]
        );
    res.status(200).json({ movimientos: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en el servidor al obtener el historial de puntos' });
  }
};
