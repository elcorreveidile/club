import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../config/db.js';
import { sendAdminAlert, sendWhatsAppAlert } from '../utils/email.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.resolve(__dirname, '../../uploads');

const ensureUploadDir = () => {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
};

const allowedTipos = ['dni', 'foto', 'contrato'];
const sanitizeName = (name) =>
  name
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_+/g, '_')
    .slice(-100);

export const uploadDocumento = async (req, res) => {
  const { tipo, fileBase64, filename } = req.body;
  const socioId = req.user.id;

  if (!tipo || !fileBase64) {
    return res.status(400).json({ message: 'Tipo y archivo son requeridos.' });
  }
  if (!allowedTipos.includes(tipo)) {
    return res.status(400).json({ message: 'Tipo de documento no permitido.' });
  }

  try {
    ensureUploadDir();
    // Extraer extensión del dataURL si existe
    const match = fileBase64.match(/^data:(.+);base64,(.*)$/);
    if (!match) {
      return res.status(400).json({ message: 'Formato de archivo inválido.' });
    }
    const mime = match[1];
    const ext = mime.split('/')[1] || 'bin';
    const buffer = Buffer.from(match[2], 'base64');
    const safeOriginal = filename ? sanitizeName(filename) : `${tipo}.${ext}`;
    const storedName = `${socioId}_${tipo}_${Date.now()}_${safeOriginal}`;
    const filePath = path.join(uploadDir, storedName);
    fs.writeFileSync(filePath, buffer);

    await pool.query(
      `INSERT INTO documentossocio (id_socio, tipo, archivo_path, original_nombre, estado, creado_en)
       VALUES ($1, $2, $3, $4, 'pendiente', NOW())
       ON CONFLICT (id_socio, tipo) DO UPDATE
       SET archivo_path = EXCLUDED.archivo_path, original_nombre = EXCLUDED.original_nombre, estado = 'pendiente', creado_en = NOW(), verificado_por = NULL, verificado_en = NULL`,
      [socioId, tipo, storedName, safeOriginal]
    );

    // Notificar al admin
    await sendAdminAlert({
      subject: 'Nuevo documento subido',
      text: `El socio ${socioId} subió un documento (${tipo}). Revisa en el panel de admin para verificarlo.`
    });
    await sendWhatsAppAlert({ text: `Socio ${socioId} subió documento ${tipo}.` });

    res.status(201).json({ message: 'Documento subido, pendiente de verificación.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al subir el documento.' });
  }
};

export const descargarDocumento = async (req, res) => {
  const { id } = req.params;
  try {
    const docResult = await pool.query(
      'SELECT * FROM documentossocio WHERE id = $1',
      [id]
    );
    if (docResult.rows.length === 0) {
      return res.status(404).json({ message: 'Documento no encontrado.' });
    }
    const doc = docResult.rows[0];
    // Solo admin o dueño
    if (req.user.rol !== 'admin' && req.user.id !== doc.id_socio) {
      return res.status(403).json({ message: 'Acceso denegado' });
    }
    const filePath = path.join(uploadDir, doc.archivo_path);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Archivo no encontrado en el servidor.' });
    }
    const downloadName = doc.original_nombre || `${doc.tipo}_${doc.id_socio}${path.extname(doc.archivo_path)}`;
    return res.download(filePath, downloadName);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al descargar el documento.' });
  }
};

export const getEstadoDocumentos = async (req, res) => {
  const socioId = req.user.id;
  try {
    const result = await pool.query(
      `SELECT tipo, estado, archivo_path, original_nombre, verificado_en
       FROM documentossocio
       WHERE id_socio = $1`,
      [socioId]
    );
    const estado = {};
    allowedTipos.forEach(t => {
      estado[t] = 'pendiente';
    });
    result.rows.forEach(row => {
      estado[row.tipo] = row.estado;
    });
    res.status(200).json({ estado, documentos: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener estado de documentos.' });
  }
};

export const listarDocumentosAdmin = async (_req, res) => {
  try {
    const result = await pool.query(`
      SELECT ds.id, ds.id_socio, ds.tipo, ds.estado, ds.creado_en, ds.verificado_en, ds.archivo_path, ds.original_nombre,
             s.nombre, s.email, s.numero_socio
      FROM documentossocio ds
      JOIN socios s ON ds.id_socio = s.id
      ORDER BY ds.creado_en DESC
    `);
    res.status(200).json({ documentos: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener documentos.' });
  }
};

export const verificarDocumento = async (req, res) => {
  const { id } = req.params;
  const { estado = 'verificado' } = req.body;
  if (!['verificado', 'pendiente', 'rechazado'].includes(estado)) {
    return res.status(400).json({ message: 'Estado inválido.' });
  }
  try {
    const result = await pool.query(
      `UPDATE documentossocio
       SET estado = $1, verificado_por = $2, verificado_en = NOW()
       WHERE id = $3
       RETURNING *`,
      [estado, req.user.id, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Documento no encontrado.' });
    }
    res.status(200).json({ message: 'Estado actualizado.', documento: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al actualizar documento.' });
  }
};
