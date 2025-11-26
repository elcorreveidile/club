// frontend/src/pages/TiendaPage.jsx
import { useState, useEffect } from 'react';
import AdminNav from '../components/AdminNav';
import adminStyles from './AdminPage.module.css';
import publicStyles from './PublicPage.module.css';
import styles from './TiendaPage.module.css';
import fallbackImg from '../assets/tu-rincon.jpg';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function TiendaPage() {
  const [productos, setProductos] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [previewImg, setPreviewImg] = useState(null);
  const [newProd, setNewProd] = useState({
    nombre: '',
    descripcion: '',
    precio_euros: '',
    stock: '',
    categoria: 'publico',
    imagen_base64: '',
    filename: ''
  });
  const [editProd, setEditProd] = useState(null);
  const [editVals, setEditVals] = useState({
    nombre: '',
    descripcion: '',
    precio_euros: '',
    stock: '',
    categoria: 'publico',
    imagen_base64: '',
    filename: ''
  });
  const isAdmin = (() => {
    try {
      const u = localStorage.getItem('user');
      return u ? JSON.parse(u)?.rol === 'admin' : false;
    } catch {
      return false;
    }
  })();

  useEffect(() => {
    const fetchProductos = async () => {
      try {
        // Esta ruta será pública, no necesita token
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers.Authorization = `Bearer ${token}`;
        const response = await fetch(`${API_BASE}/api/productos/catalogo`, { headers });
        const data = await response.json();

        if (response.ok) {
          setProductos(data.productos);
        } else {
          setError('Error al cargar el catálogo.');
        }
      } catch (err) {
        setError('Error de conexión.');
      }
    };
    fetchProductos();
    const onStorage = () => setToken(localStorage.getItem('token'));
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const handleAddProduct = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      const res = await fetch(`${API_BASE}/api/productos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          nombre: newProd.nombre,
          descripcion: newProd.descripcion,
          precio_puntos: Number(newProd.precio_euros || 0),
          precio_euros: Number(newProd.precio_euros || 0),
          stock: Number(newProd.stock),
          categoria: newProd.categoria,
          imagen_base64: newProd.imagen_base64 || undefined,
          filename: newProd.filename || undefined
        })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('Producto creado.');
        setNewProd({
          nombre: '',
          descripcion: '',
          precio_euros: '',
          stock: '',
          categoria: 'publico',
          imagen_base64: '',
          filename: ''
        });
        // reload
        const updated = await fetch(`${API_BASE}/api/productos/catalogo`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const updData = await updated.json();
        if (updated.ok) setProductos(updData.productos || []);
      } else {
        setError(data.message || 'Error al crear producto.');
      }
    } catch (err) {
      setError('Error de conexión al crear producto.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este producto?')) return;
    setMessage('');
    setError('');
    try {
      const res = await fetch(`${API_BASE}/api/productos/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(data.message || 'Producto eliminado.');
        setProductos((prev) => prev.filter((p) => p.id !== id));
      } else {
        setError(data.message || 'Error al eliminar producto.');
      }
    } catch (err) {
      setError('Error de conexión al eliminar producto.');
    }
  };

  const startEdit = (prod) => {
    setEditProd(prod);
    setEditVals({
      nombre: prod.nombre,
      descripcion: prod.descripcion || '',
      precio_euros: prod.precio_puntos ?? '',
      stock: prod.stock ?? '',
      categoria: prod.categoria || 'publico',
      imagen_base64: '',
      filename: ''
    });
    setMessage('Editando producto. Si no quieres cambiar la imagen, deja el campo vacío y pulsa Guardar.');
  };

  const handleEditFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      setEditVals((prev) => ({ ...prev, imagen_base64: '', filename: '' }));
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setEditVals((prev) => ({
        ...prev,
        imagen_base64: ev.target?.result || '',
        filename: file.name
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editProd) return;
    setMessage('');
    setError('');
    try {
      const res = await fetch(`${API_BASE}/api/productos/${editProd.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          nombre: editVals.nombre,
          descripcion: editVals.descripcion,
          precio_puntos: Number(editVals.precio_euros || 0),
          precio_euros: Number(editVals.precio_euros || 0),
          stock: Number(editVals.stock || 0),
          categoria: editVals.categoria || 'publico',
          imagen_base64: editVals.imagen_base64 || undefined,
          filename: editVals.filename || undefined
        })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('Producto actualizado.');
        const updated = await fetch(`${API_BASE}/api/productos/catalogo`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const updData = await updated.json();
        if (updated.ok) setProductos(updData.productos || []);
        setEditProd(null);
      } else {
        setError(data.message || 'Error al actualizar.');
      }
    } catch (err) {
      setError('Error de conexión al actualizar.');
    }
  };

  const handleCanjear = async (producto) => {
    const token = localStorage.getItem('token');
    if (!token) {
      setMessage('Debes estar logueado para canjear productos.');
      return;
    }

    if (!window.confirm(`¿Estás seguro de que quieres canjear "${producto.nombre}" por ${producto.precio_puntos} puntos?`)) {
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/canjes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id_producto: producto.id }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`¡Canje exitoso! Has canjeado "${producto.nombre}".`);
        // Opcional: podríamos recargar los puntos del socio
      } else {
        setMessage(data.message || 'Error al realizar el canje.');
      }
    } catch (err) {
      setMessage('Error de conexión.');
    }
  };

  const content = (
    <>
      {!isAdmin && (
        <div className={styles.hero}>
          <div className={styles.heroContent}>
            <p className={styles.kicker}>Explora la tienda</p>
            <h2>Catálogo del Club</h2>
            <p>Canjea productos con tus puntos o descubre lo que tenemos disponible.</p>
          </div>
        </div>
      )}
      {message && <div className={styles.alertSuccess}>{message}</div>}
      {error && <div className={styles.alertError}>{error}</div>}
      <div className={styles.grid}>
        {productos.map((producto) => {
          const img = producto.imagen_url
            ? (producto.imagen_url.startsWith('http') ? producto.imagen_url : `${API_BASE}${producto.imagen_url}`)
            : fallbackImg;
          const pts = producto.precio_puntos;
          const euros = producto.precio_euros ?? (pts ? pts.toFixed(2) : null);
          const isSoloSocios = producto.categoria === 'socios';
          return (
            <div key={producto.id} className={styles.card}>
              <div
                className={styles.cardImage}
                style={{ backgroundImage: `url(${img})` }}
                onClick={() => setPreviewImg({ src: img, alt: producto.nombre })}
                role="button"
                title="Ver imagen completa"
              >
                <span className={`${styles.badge} ${producto.stock > 0 ? styles.badgeOk : styles.badgeKo}`}>
                  {producto.stock > 0 ? 'En stock' : 'Agotado'}
                </span>
                {isSoloSocios && <span className={styles.badgeSocios}>Solo socios</span>}
              </div>
              <div className={styles.cardBody}>
                <h4>{producto.nombre}</h4>
                <p className={styles.desc}>{producto.descripcion}</p>
                <div className={styles.meta}>
                  {euros && <span className={styles.chip}>{euros} €</span>}
                  {pts && <span className={styles.chip}>{pts} pts</span>}
                </div>
                <div className={styles.actions}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => handleCanjear(producto)}
                      disabled={producto.stock <= 0 || !token}
                      className={styles.button}
                    >
                      {!token ? 'Inicia sesión para canjear' : producto.stock > 0 ? 'Canjear' : 'Agotado'}
                    </button>
                    {isAdmin && (
                      <>
                        <button className={styles.button} style={{ background: '#2ecc71' }} onClick={() => startEdit(producto)}>Editar</button>
                        <button className={styles.button} style={{ background: '#e74c3c', color: '#fff' }} onClick={() => handleDelete(producto.id)}>Eliminar</button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );

  if (isAdmin) {
    return (
      <div className={adminStyles.pageContainer}>
        <div className={adminStyles.container}>
          <h1 className={adminStyles.header}>Tienda</h1>
          <AdminNav />
          <div className={adminStyles.card}>
            <h3 className={adminStyles.sectionTitle}>Crear producto</h3>
            <form className={styles.adminForm} onSubmit={handleAddProduct}>
              <input className={styles.input} placeholder="Nombre" value={newProd.nombre} onChange={(e) => setNewProd({ ...newProd, nombre: e.target.value })} required />
              <input className={styles.input} placeholder="Descripción" value={newProd.descripcion} onChange={(e) => setNewProd({ ...newProd, descripcion: e.target.value })} />
              <input className={styles.input} placeholder="Precio (€)" type="number" value={newProd.precio_euros} onChange={(e) => setNewProd({ ...newProd, precio_euros: e.target.value })} required />
              <input className={styles.input} placeholder="Stock" type="number" value={newProd.stock} onChange={(e) => setNewProd({ ...newProd, stock: e.target.value })} required />
              <select
                className={styles.input}
                value={newProd.categoria}
                onChange={(e) => setNewProd({ ...newProd, categoria: e.target.value })}
              >
                <option value="publico">Disponible para todos</option>
                <option value="socios">Exclusivo socios</option>
              </select>
              <div className={styles.fileBox}>
                <label className={styles.label}>Imagen del producto</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      setNewProd((prev) => ({
                        ...prev,
                        imagen_base64: ev.target?.result || '',
                        filename: file.name
                      }));
                    };
                    reader.readAsDataURL(file);
                  }}
                  className={styles.input}
                />
              </div>
              <button className={styles.button} type="submit">Crear</button>
            </form>

            {editProd && (
              <div className={adminStyles.card} style={{ marginTop: '16px' }}>
                <h3 className={adminStyles.sectionTitle}>Editar producto</h3>
                <form className={styles.adminForm} onSubmit={handleSaveEdit}>
                  <input className={styles.input} placeholder="Nombre" value={editVals.nombre} onChange={(e) => setEditVals({ ...editVals, nombre: e.target.value })} required />
                  <input className={styles.input} placeholder="Descripción" value={editVals.descripcion} onChange={(e) => setEditVals({ ...editVals, descripcion: e.target.value })} />
                  <input className={styles.input} placeholder="Precio (€)" type="number" value={editVals.precio_euros} onChange={(e) => setEditVals({ ...editVals, precio_euros: e.target.value })} required />
                  <input className={styles.input} placeholder="Stock" type="number" value={editVals.stock} onChange={(e) => setEditVals({ ...editVals, stock: e.target.value })} required />
                  <select className={styles.input} value={editVals.categoria} onChange={(e) => setEditVals({ ...editVals, categoria: e.target.value })}>
                    <option value="publico">Disponible para todos</option>
                    <option value="socios">Exclusivo socios</option>
                  </select>
                  <div className={styles.fileBox}>
                    <label className={styles.label}>Cambiar imagen (opcional). Si no quieres cambiarla, deja vacío y pulsa Guardar.</label>
                    <input type="file" accept="image/*" onChange={handleEditFile} className={styles.input} />
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className={styles.button} type="submit">Guardar</button>
                    <button className={styles.button} type="button" style={{ background: '#7f8c8d' }} onClick={() => setEditProd(null)}>Cancelar</button>
                  </div>
                </form>
              </div>
            )}

            <div className={adminStyles.card}>
              {content}
            </div>
          </div>
        </div>
        <ImagePreview preview={previewImg} onClose={() => setPreviewImg(null)} />
      </div>
    );
  }

  return (
    <div className={publicStyles.page}>
      <div className={publicStyles.container}>
        <div className={publicStyles.card}>
          {content}
        </div>
      </div>
      <ImagePreview preview={previewImg} onClose={() => setPreviewImg(null)} />
    </div>
  );
}

// Modal de imagen completa
function ImagePreview({ preview, onClose }) {
  if (!preview) return null;
  return (
    <div className={styles.modalBackdrop} onClick={onClose} role="button" aria-label="Cerrar imagen">
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <img src={preview.src} alt={preview.alt || 'Imagen'} className={styles.modalImage} />
        <button className={styles.modalClose} onClick={onClose}>Cerrar</button>
      </div>
    </div>
  );
}

export default TiendaPage;
