// frontend/src/pages/AdminPage.jsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './AdminPage.module.css'; // <-- Importamos los estilos
import AdminNav from '../components/AdminNav';

function AdminPage() {
  const [socios, setSocios] = useState([]);
  const [selectedSocioId, setSelectedSocioId] = useState('');
  const [selectedSocioLabel, setSelectedSocioLabel] = useState('');
  const [selectedEmpleado, setSelectedEmpleado] = useState('');
  const [importe, setImporte] = useState('');
  const [producto, setProducto] = useState('');
  const [productos, setProductos] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [filtroSocio, setFiltroSocio] = useState('');
  const navigate = useNavigate();

  const filteredSocios = socios.filter((s) => {
    const t = filtroSocio.trim().toLowerCase();
    if (!t) return true;
    return (
      s.nombre.toLowerCase().includes(t) ||
      (s.numero_socio && s.numero_socio.toLowerCase().includes(t)) ||
      (s.email && s.email.toLowerCase().includes(t))
    );
  });

  const empleados = [
    { id: 'mar', nombre: 'Mar' },
    { id: 'sonia', nombre: 'Sonia' }
  ];

  // ... (El resto de tu lógica: useEffect, handleRegistrarCompra, etc.) ...
  // Pega aquí todo el código de las funciones que tenías antes
  // desde el useEffect hasta el final del componente.

  const fetchSocios = useCallback(async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch('http://localhost:5000/api/socios/lista', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setSocios(data.socios);
      } else {
        setMessage('Error al cargar la lista de socios.');
      }
    } catch (err) {
      setMessage('Error de conexión.');
    }
  }, []);

  useEffect(() => {
    fetchSocios();
    // Cargar productos para sugerencias
    const fetchProductos = async () => {
      const token = localStorage.getItem('token');
      try {
        const res = await fetch('http://localhost:5000/api/productos/catalogo', {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        const data = await res.json();
        if (res.ok) setProductos(data.productos || []);
      } catch {
        // ignore
      }
    };
    fetchProductos();
  }, [fetchSocios]);

  const handleRegistrarCompra = async (e) => {
    e.preventDefault();
    if (!selectedSocioId || !importe) {
      setMessage('Por favor, selecciona un socio e introduce un importe.');
      return;
    }
    if (!selectedEmpleado) {
      setMessage('Selecciona el empleado que registra la compra.');
      return;
    }
    if (!producto.trim()) {
      setMessage('Indica el producto vendido.');
      return;
    }
    setLoading(true);
    setMessage('');
    const token = localStorage.getItem('token');
    try {
      const response = await fetch('http://localhost:5000/api/compras-fisicas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          id_socio: selectedSocioId,
          total_euros: parseFloat(importe),
          empleado: selectedEmpleado,
          producto: producto.trim()
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setMessage(`¡Compra registrada! Se añadieron ${data.puntos_ganados} puntos al socio.`);
        setSelectedSocioId('');
        setSelectedSocioLabel('');
        setImporte('');
        setProducto('');
      } else {
        setMessage(data.message || 'Error al registrar la compra.');
      }
    } catch (err) {
      setMessage('Error de conexión al registrar la compra.');
    } finally {
      setLoading(false);
    }
  };

  const handleRechazarCanje = async (idCanje) => {
    const comentario = window.prompt('¿Cuál es el motivo del rechazo? (Opcional)');
    setLoadingCanjes(true);
    setMessage('');
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`http://localhost:5000/api/canjes/${idCanje}/rechazar`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ comentario_admin: comentario }),
      });
      const data = await response.json();
      if (response.ok) {
        setMessage(data.message || 'Canje rechazado con éxito.');
        fetchCanjes();
      } else {
        setMessage(data.message || 'Error al rechazar el canje.');
      }
    } catch (err) {
      setMessage('Error de conexión al rechazar el canje.');
    } finally {
      setLoadingCanjes(false);
    }
  };

  const handleAprobarPreRegistro = async (id) => {
    if (!window.confirm('¿Aprobar este pre-registro?')) return;
    setLoadingPreRegistros(true);
    setMessage('');
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`http://localhost:5000/api/pre-registro/${id}/aprobar`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setMessage(data.message || 'Pre-registro aprobado.');
        fetchPreRegistros();
      } else {
        setMessage(data.message || 'Error al aprobar el pre-registro.');
      }
    } catch (err) {
      setMessage('Error de conexión al aprobar el pre-registro.');
    } finally {
      setLoadingPreRegistros(false);
    }
  };

  const handleRechazarPreRegistro = async (id) => {
    if (!window.confirm('¿Rechazar este pre-registro?')) return;
    setLoadingPreRegistros(true);
    setMessage('');
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`http://localhost:5000/api/pre-registro/${id}/rechazar`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setMessage(data.message || 'Pre-registro rechazado.');
        fetchPreRegistros();
      } else {
        setMessage(data.message || 'Error al rechazar el pre-registro.');
      }
    } catch (err) {
      setMessage('Error de conexión al rechazar el pre-registro.');
    } finally {
      setLoadingPreRegistros(false);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.container}>
        <h1 className={styles.header}>Panel de Administración</h1>

        <AdminNav />

        {(message || loading) && (
          <div className={styles.messageBox}>
            {loading && <p>Procesando...</p>}
            {message && <p>{message}</p>}
          </div>
        )}

        <div className={styles.card}>
          <h3 className={styles.sectionTitle}>Registrar Compra Física</h3>
          <form onSubmit={handleRegistrarCompra}>
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="socio-filter">Buscar socio:</label>
              <input
                id="socio-filter"
                type="text"
                placeholder="Nombre o número de socio"
                value={filtroSocio}
                onChange={(e) => setFiltroSocio(e.target.value)}
                className={styles.input}
              />
              {filtroSocio && (
                <div style={{ marginTop: '6px', fontSize: '14px', color: '#111', background: '#f2f2f2', borderRadius: 8, padding: 8 }}>
                  {filteredSocios.length === 0 ? (
                    <span>No hay coincidencias.</span>
                  ) : (
                    filteredSocios.slice(0, 5).map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => { setSelectedSocioId(s.id); setSelectedSocioLabel(`${s.nombre} (${s.numero_socio})`); }}
                        style={{ display: 'block', width: '100%', textAlign: 'left', padding: '6px 8px', border: 'none', background: '#fff', marginBottom: 4, borderRadius: 6, cursor: 'pointer' }}
                      >
                        {s.nombre} ({s.numero_socio})
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Socio seleccionado:</label>
              <div className={styles.input} style={{ background: '#eef2f7' }}>
                {selectedSocioLabel || 'Ninguno seleccionado'}
              </div>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="importe-input">Importe (€):</label>
              <input id="importe-input" type="number" step="0.01" value={importe} onChange={(e) => setImporte(e.target.value)} required className={styles.input} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="producto-input">Producto vendido:</label>
              <input
                id="producto-input"
                type="text"
                placeholder="Escribe para buscar en catálogo..."
                value={producto}
                onChange={(e) => setProducto(e.target.value)}
                required
                className={styles.input}
              />
              {producto.trim() && (
                <div style={{ marginTop: 6, background: '#f8f8f8', borderRadius: 8, padding: 6, border: '1px solid #ddd' }}>
                  {productos
                    .filter((p) =>
                      p.nombre.toLowerCase().includes(producto.toLowerCase())
                    )
                    .slice(0, 6)
                    .map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setProducto(p.nombre)}
                        style={{
                          display: 'block',
                          width: '100%',
                          textAlign: 'left',
                          padding: '6px 8px',
                          border: 'none',
                          background: '#fff',
                          marginBottom: 4,
                          borderRadius: 6,
                          cursor: 'pointer'
                        }}
                      >
                        {p.nombre} {p.categoria === 'socios' ? '(solo socios)' : ''}
                      </button>
                    ))}
                </div>
              )}
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="empleado-select">Empleado:</label>
              <select id="empleado-select" value={selectedEmpleado} onChange={(e) => setSelectedEmpleado(e.target.value)} required className={styles.input}>
                <option value="">-- Selecciona empleado --</option>
                {empleados.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.nombre}</option>
                ))}
              </select>
            </div>
            <button type="submit" disabled={loading} className={styles.buttonPrimary}>
              {loading ? 'Registrando...' : 'Registrar Compra y Sumar Puntos'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}

export default AdminPage;
