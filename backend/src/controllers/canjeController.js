// backend/src/controllers/canjeController.js
import { pool } from '../config/db.js';

// --- FUNCIONES PARA EL SOCIO ---

// Función para que un socio SOLICITE un nuevo canje
export const solicitarCanje = async (req, res) => {
  const socioId = req.user.id;
  const { id_producto } = req.body;

  if (!id_producto) {
    return res.status(400).json({ message: 'El ID del producto es requerido.' });
  }

  try {
    // 1. Verificar que el producto existe y tiene stock (sin bloquear todavía)
    const productoResult = await pool.query({
      text: 'SELECT nombre, precio_puntos, stock FROM Productos WHERE id = $1',
      values: [id_producto]
    });

    if (productoResult.rows.length === 0) {
      return res.status(404).json({ message: 'Producto no encontrado.' });
    }
    const producto = productoResult.rows[0];

    if (producto.stock <= 0) {
      return res.status(400).json({ message: 'El producto está agotado.' });
    }

    // 2. Crear el registro del canje con estado 'pendiente'
    // IMPORTANTE: No restamos puntos ni stock todavía.
    const canjeResult = await pool.query({
      text: 'INSERT INTO Canjes (id_socio, id_producto, puntos_utilizados, fecha, estado) VALUES ($1, $2, $3, NOW(), $4) RETURNING *',
      values: [socioId, id_producto, producto.precio_puntos, 'pendiente']
    });

    res.status(201).json({
      message: `Solicitud de canje para "${producto.nombre}" realizada con éxito. Está pendiente de aprobación.`,
      canje: canjeResult.rows[0]
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en el servidor al solicitar el canje.' });
  }
};


// --- FUNCIONES PARA EL ADMINISTRADOR ---

// Función para obtener la lista de canjes pendientes (sin cambios, está bien)
export const getCanjesPendientes = async (req, res) => {
  if (req.user.rol !== 'admin') {
    return res.status(403).json({ message: 'Acceso denegado' });
  }

  try {
    const result = await pool.query(`
      SELECT c.id, c.fecha, c.puntos_utilizados, c.estado,
             s.nombre AS nombre_socio, s.numero_socio,
             p.nombre AS nombre_producto
      FROM Canjes c
      JOIN Socios s ON c.id_socio = s.id
      JOIN Productos p ON c.id_producto = p.id
      WHERE c.estado = 'pendiente'
      ORDER BY c.fecha DESC
    `);

    res.status(200).json({ canjes: result.rows });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en el servidor al obtener los canjes' });
  }
};

// NUEVA FUNCIÓN: Para que el admin APRUEBE un canje (aquí va la transacción)
export const aprobarCanje = async (req, res) => {
  if (req.user.rol !== 'admin') {
    return res.status(403).json({ message: 'Acceso denegado' });
  }

  const { id_canje } = req.params; // Obtenemos el ID de los parámetros de la URL

  if (!id_canje) {
    return res.status(400).json({ message: 'El ID del canje es requerido.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Obtener detalles del canje pendiente y bloquear las filas necesarias
    const canjeResult = await client.query({
      text: `
        SELECT c.id, c.id_socio, c.id_producto, c.puntos_utilizados,
               s.puntos_anio_actual,
               p.stock
        FROM Canjes c
        JOIN Socios s ON c.id_socio = s.id
        JOIN Productos p ON c.id_producto = p.id
        WHERE c.id = $1 AND c.estado = 'pendiente'
        FOR UPDATE OF s, p -- Bloqueamos las filas del socio y del producto
      `,
      values: [id_canje]
    });

    if (canjeResult.rows.length === 0) {
      throw new Error('Canje no encontrado o no está pendiente.');
    }

    const { id_socio, id_producto, puntos_utilizados, puntos_anio_actual, stock } = canjeResult.rows[0];

    // 2. Verificar de nuevo si hay stock y si el socio tiene puntos suficientes
    if (stock <= 0) {
      throw new Error('El producto se agotó mientras se procesaba la solicitud.');
    }
    if (puntos_anio_actual < puntos_utilizados) {
      throw new Error('El socio ya no tiene suficientes puntos para este canje.');
    }

    // 3. Realizar las operaciones atómicas
    const nuevoStock = stock - 1;
    const nuevosPuntos = puntos_anio_actual - puntos_utilizados;

    await client.query({
      text: 'UPDATE Productos SET stock = $1 WHERE id = $2',
      values: [nuevoStock, id_producto]
    });
    await client.query({
      text: 'UPDATE Socios SET puntos_anio_actual = $1 WHERE id = $2',
      values: [nuevosPuntos, id_socio]
    });

    // 4. Actualizar el estado del canje a 'entregado' y registrar la fecha de entrega
    const updatedCanjeResult = await client.query({
      text: 'UPDATE Canjes SET estado = $1, fecha_entrega = NOW() WHERE id = $2 RETURNING *',
      values: ['entregado', id_canje]
    });

    // 5. Registrar el movimiento de puntos
    await client.query({
      text: 'INSERT INTO MovimientosPuntos (id_socio, puntos, motivo, descripcion, id_compra_fisica, id_canje, anio) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      values: [id_socio, -puntos_utilizados, 'canje', `Canje aprobado de producto ID: ${id_producto}`, null, id_canje, new Date().getFullYear()]
    });

    await client.query('COMMIT');

    res.status(200).json({
      message: 'Canje aprobado y entregado con éxito.',
      canje: updatedCanjeResult.rows[0]
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    res.status(400).json({ message: error.message });
  } finally {
    client.release();
  }
};

// NUEVA FUNCIÓN: Para que el admin RECHACE un canje
export const rechazarCanje = async (req, res) => {
  if (req.user.rol !== 'admin') {
    return res.status(403).json({ message: 'Acceso denegado' });
  }

  const { id_canje } = req.params;
  const { comentario_admin } = req.body; // Opcional: un motivo de rechazo

  if (!id_canje) {
    return res.status(400).json({ message: 'El ID del canje es requerido.' });
  }

  try {
    const result = await pool.query({
      text: 'UPDATE Canjes SET estado = $1, comentario_admin = $2 WHERE id = $3 AND estado = $4 RETURNING *',
      values: ['rechazado', comentario_admin || null, id_canje, 'pendiente']
    });

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Canje no encontrado o no estaba pendiente.' });
    }

    res.status(200).json({
      message: 'Canje rechazado con éxito.',
      canje: result.rows[0]
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en el servidor al rechazar el canje.' });
  }
};

// La función antigua 'entregarCanje' y 'registrarCanje' ya no son necesarias con este nuevo flujo.