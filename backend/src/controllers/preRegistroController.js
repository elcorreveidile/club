// backend/src/controllers/preRegistroController.js
import bcrypt from 'bcryptjs';
import { pool } from '../config/db.js';
import { sendWelcomeEmail, sendAdminAlert, sendWhatsAppAlert } from '../utils/email.js';

// Para que un usuario se pre-registre
export const preRegistrar = async (req, res) => {
  const { nombre, email } = req.body;

  if (!nombre || !email) {
    return res.status(400).json({ message: 'Nombre y email son requeridos.' });
  }

  try {
    // 1. Comprobar si el email ya existe en Socios o en PreRegistros pendientes
    const emailSocio = await pool.query('SELECT 1 FROM socios WHERE email = $1', [email]);
    if (emailSocio.rows.length > 0) {
      return res.status(409).json({ message: 'Este correo electrónico ya está registrado.' });
    }

    const emailPendiente = await pool.query(
      "SELECT 1 FROM preregistros WHERE email = $1 AND estado = 'pendiente'",
      [email]
    );
    if (emailPendiente.rows.length > 0) {
      return res.status(409).json({ message: 'Ya tienes una solicitud pendiente.' });
    }

    // 2. Generar un hash placeholder (no pedimos contraseña aquí)
    const hashedPassword = await bcrypt.hash(email, 10);

    // 3. Insertar la solicitud en PreRegistros
    await pool.query(
      "INSERT INTO preregistros (nombre, email, password_hash, estado, fecha_registro) VALUES ($1, $2, $3, 'pendiente', NOW())",
      [nombre, email, hashedPassword]
    );

    // Notificar al admin
    await sendAdminAlert({
      subject: 'Nuevo pre-registro',
      text: `Se ha recibido un nuevo pre-registro:\nNombre: ${nombre}\nEmail: ${email}\n\nRevisa en el panel admin.`
    });
    await sendWhatsAppAlert({ text: `Nuevo pre-registro: ${nombre} (${email})` });

    res.status(201).json({
      message: '¡Pre-registro completado! Un administrador revisará tu solicitud.'
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en el servidor al pre-registrar al usuario.' });
  }
};

// Para que el admin vea la lista de pre-registros pendientes
export const getPreRegistros = async (req, res) => {
  if (req.user.rol !== 'admin') {
    return res.status(403).json({ message: 'Acceso denegado' });
  }

  try {
    const result = await pool.query(`
      SELECT id, nombre, email, fecha_registro, estado
      FROM PreRegistros
      WHERE estado = 'pendiente'
      ORDER BY fecha_registro DESC
    `);

    res.status(200).json({ preRegistros: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener los pre-registros.' });
  }
};

// Para que el admin apruebe un pre-registro
export const aprobarPreRegistro = async (req, res) => {
  if (req.user.rol !== 'admin') {
    return res.status(403).json({ message: 'Acceso denegado.' });
  }

  const { id } = req.params; // ID del pre-registro

  try {
    // Obtener pre-registro pendiente
    const preReg = await pool.query(
      "SELECT * FROM preregistros WHERE id = $1 AND estado = 'pendiente'",
      [id]
    );

    if (preReg.rows.length === 0) {
      return res.status(404).json({ message: 'Pre-registro no encontrado o ya procesado.' });
    }

    const { nombre, email, dni_pasaporte } = preReg.rows[0];
    const dniValue = dni_pasaporte || 'pendiente';

    // Generar número de socio simple y contraseña temporal
    const numero_socio = `SOC${Date.now().toString().slice(-6)}`;
    const tempPassword = Math.random().toString(36).slice(-8);
    const password_hash = await bcrypt.hash(tempPassword, 10);

    // Crear socio
    const socioResult = await pool.query(
      'INSERT INTO socios (numero_socio, nombre, email, dni_pasaporte, password_hash, rol, puntos_anio_actual) VALUES ($1, $2, $3, $4, $5, $6, 0) RETURNING id',
      [numero_socio, nombre, email, dniValue, password_hash, 'socio']
    );

    // Marcar como aprobado el pre-registro
    await pool.query(
      "UPDATE preregistros SET estado = 'aprobado', fecha_aprobacion = NOW(), id_admin_aprobador = $2 WHERE id = $1",
      [id, req.user.id]
    );

    // Enviar email (si SMTP configurado, si no, log en consola)
    await sendWelcomeEmail({
      to: email,
      nombre,
      numero_socio,
      tempPassword
    });
    await sendWhatsAppAlert({ text: `Pre-registro aprobado: ${nombre} (${numero_socio}).` });

    res.status(200).json({
      message: 'Pre-registro aprobado y socio creado.',
      socio_id: socioResult.rows[0].id,
      numero_socio,
      tempPassword // opcional: visible en respuesta para el admin
    });

  } catch (error) {
    console.error('Error al aprobar el pre-registro:', error);
    res.status(500).json({ message: 'Error en el servidor al aprobar el pre-registro.' });
  }
};

// Para que el admin rechace un pre-registro
export const rechazarPreRegistro = async (req, res) => {
  if (req.user.rol !== 'admin') {
    return res.status(403).json({ message: 'Acceso denegado.' });
  }

  const { id } = req.params;

  try {
    const result = await pool.query(
      "UPDATE PreRegistros SET estado = 'rechazado', fecha_aprobacion = NOW(), id_admin_aprobador = $2 WHERE id = $1 AND estado = 'pendiente' RETURNING *",
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Pre-registro no encontrado o ya procesado.' });
    }

    res.status(200).json({ message: 'Pre-registro rechazado.' });
  } catch (error) {
    console.error('Error al rechazar el pre-registro:', error);
    res.status(500).json({ message: 'Error en el servidor al rechazar el pre-registro.' });
  }
};
