// backend/src/controllers/productoController.js
import { pool } from '../config/db.js';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.resolve(__dirname, '../../uploads/products');

const ensureUploadDir = () => {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
};

const parseOptionalUser = (req) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return null;
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
};

export const getCatalogo = async (req, res) => {
  try {
    const user = req.user || parseOptionalUser(req);
    const isSocio = user && (user.rol === 'socio' || user.rol === 'admin');
    const result = await pool.query(
      isSocio
        ? 'SELECT * FROM productos ORDER BY nombre'
        : "SELECT * FROM productos WHERE categoria = 'publico' ORDER BY nombre"
    );
    res.status(200).json({ productos: result.rows });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en el servidor al obtener el catálogo' });
  }
};

export const crearProducto = async (req, res) => {
  const { nombre, descripcion, precio_puntos, precio_euros, stock, categoria = 'publico', imagen_base64, filename } = req.body;
  const rawPrice = precio_puntos ?? precio_euros;
  const price = Number(rawPrice);
  if (!nombre || rawPrice == null || !Number.isFinite(price) || stock == null) {
    return res.status(400).json({ message: 'Nombre, precio (euros) y stock son requeridos.' });
  }
  if (!['publico', 'socios'].includes(categoria)) {
    return res.status(400).json({ message: 'Categoría inválida.' });
  }
  try {
    let imagen_url = null;
    if (imagen_base64) {
      ensureUploadDir();
      const match = imagen_base64.match(/^data:(.+);base64,(.*)$/);
      if (!match) {
        return res.status(400).json({ message: 'Formato de imagen inválido.' });
      }
      const ext = match[1].split('/')[1] || 'bin';
      const safeName = (filename || `producto.${ext}`).replace(/[^a-zA-Z0-9._-]/g, '_');
      const storedName = `${Date.now()}_${safeName}`;
      const buffer = Buffer.from(match[2], 'base64');
      fs.writeFileSync(path.join(uploadDir, storedName), buffer);
      imagen_url = `/uploads/products/${storedName}`;
    }

    const result = await pool.query(
      'INSERT INTO productos (nombre, descripcion, precio_puntos, precio_euros, stock, categoria, imagen_url) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [nombre, descripcion || '', price, price, stock, categoria, imagen_url]
    );
    res.status(201).json({ producto: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al crear producto' });
  }
};

export const actualizarProducto = async (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion, precio_puntos, precio_euros, stock, categoria, imagen_base64, filename } = req.body;
  if (!id) return res.status(400).json({ message: 'ID requerido' });
  if (categoria && !['publico', 'socios'].includes(categoria)) {
    return res.status(400).json({ message: 'Categoría inválida.' });
  }
  try {
    let nuevaImagenUrl = null;
    if (imagen_base64) {
      ensureUploadDir();
      const match = imagen_base64.match(/^data:(.+);base64,(.*)$/);
      if (!match) {
        return res.status(400).json({ message: 'Formato de imagen inválido.' });
      }
      const ext = match[1].split('/')[1] || 'bin';
      const safeName = (filename || `producto.${ext}`).replace(/[^a-zA-Z0-9._-]/g, '_');
      const storedName = `${Date.now()}_${safeName}`;
      const buffer = Buffer.from(match[2], 'base64');
      fs.writeFileSync(path.join(uploadDir, storedName), buffer);
      nuevaImagenUrl = `/uploads/products/${storedName}`;
    }

    const rawPrice = precio_puntos ?? precio_euros;
    const price = rawPrice == null ? null : Number(rawPrice);
    const result = await pool.query(
      'UPDATE productos SET nombre = COALESCE($1, nombre), descripcion = COALESCE($2, descripcion), precio_puntos = COALESCE($3, precio_puntos), precio_euros = COALESCE($3, precio_euros), stock = COALESCE($4, stock), categoria = COALESCE($5, categoria), imagen_url = COALESCE($6, imagen_url) WHERE id = $7 RETURNING *',
      [
        nombre,
        descripcion,
        price,
        stock,
        categoria,
        nuevaImagenUrl,
        id
      ]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: 'Producto no encontrado' });
    res.status(200).json({ producto: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al actualizar producto' });
  }
};

export const eliminarProducto = async (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ message: 'ID requerido' });
  try {
    const result = await pool.query('DELETE FROM productos WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Producto no encontrado' });
    res.status(200).json({ message: 'Producto eliminado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al eliminar producto' });
  }
};
