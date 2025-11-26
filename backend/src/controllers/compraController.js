// backend/src/controllers/compraController.js
import { pool } from '../config/db.js';

export const registrarCompraFisica = async (req, res) => {
  // Solo un admin puede registrar compras
  if (req.user.rol !== 'admin') {
    return res.status(403).json({ message: 'Acceso denegado' });
  }

  const { id_socio, total_euros, empleado, producto } = req.body;

  if (!id_socio || !total_euros || total_euros <= 0 || !empleado || !producto) {
    return res.status(400).json({ message: 'Datos inválidos (socio, importe, empleado y producto son obligatorios).' });
  }

  // Regla: 1 punto por cada 10€ gastados (puntos decimales permitidos)
  const puntosGanados = Number((total_euros / 10).toFixed(2));
  const productoLimpio = String(producto).trim();

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Registrar la compra
    const compraResult = await client.query(
      'INSERT INTO comprasfisicas (id_socio, total_euros, descripcion, id_admin, empleado, producto) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
      [
        id_socio,
        total_euros,
        `Compra de ${productoLimpio} registrada por ${empleado} (admin ${req.user.numero_socio || ''})`.trim(),
        req.user.id,
        empleado,
        productoLimpio
      ]
    );

    // 2. Crear el movimiento de puntos
    await client.query(
      'INSERT INTO MovimientosPuntos (id_socio, puntos, motivo, descripcion, id_compra_fisica, anio) VALUES ($1, $2, $3, $4, $5, $6)',
      [
        id_socio,
        puntosGanados,
        'compra_fisica',
        `Compra de ${total_euros}€ (${productoLimpio}) registrada por ${empleado}`,
        compraResult.rows[0].id,
        new Date().getFullYear()
      ]
    );

    // 3. Actualizar los puntos del socio
    await client.query(
      'UPDATE Socios SET puntos_anio_actual = puntos_anio_actual + $1 WHERE id = $2',
      [puntosGanados, id_socio]
    );

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Compra registrada y puntos añadidos correctamente.',
      puntos_ganados: puntosGanados
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ message: 'Error al registrar la compra' });
  } finally {
    client.release();
  }
};
