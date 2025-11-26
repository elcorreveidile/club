import { useEffect, useState } from 'react';
import styles from './AdminPage.module.css';
import AdminNav from '../components/AdminNav';
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function AdminSociosPage() {
  const [socios, setSocios] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [newNombre, setNewNombre] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newNumero, setNewNumero] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRol, setNewRol] = useState('socio');
  const [docsEstado, setDocsEstado] = useState({});
  const [historialSocio, setHistorialSocio] = useState([]);
  const [historialNombre, setHistorialNombre] = useState('');
  const [historialYear, setHistorialYear] = useState('actual');
  const [filtroSocio, setFiltroSocio] = useState('');

  const searchText = filtroSocio.trim().toLowerCase();
  const filteredSocios = searchText
    ? socios.filter((s) => {
        const nombre = (s.nombre || '').toLowerCase();
        const email = (s.email || '').toLowerCase();
        const numero = (s.numero_socio || '').toLowerCase();
        return nombre.includes(searchText) || email.includes(searchText) || numero.includes(searchText);
      })
    : [];

  const fetchSocios = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_BASE}/api/socios/lista`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setSocios(data.socios || []);
      else setMessage(data.message || 'Error al cargar socios.');
    } catch {
      setMessage('Error de conexión al cargar socios.');
    }
  };

  const fetchDocs = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_BASE}/api/documentos/todos`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        const estadoMap = {};
        data.documentos.forEach(doc => {
          if (!estadoMap[doc.id_socio]) estadoMap[doc.id_socio] = {};
          estadoMap[doc.id_socio][doc.tipo] = doc.estado;
        });
        setDocsEstado(estadoMap);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchSocios();
    fetchDocs();
  }, []);

  const handleCrearSocio = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_BASE}/api/socios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          nombre: newNombre,
          email: newEmail,
          password: newPassword,
          numero_socio: newNumero,
          rol: newRol
        })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('Socio creado correctamente.');
        setNewNombre('');
        setNewEmail('');
        setNewNumero('');
        setNewPassword('');
        setNewRol('socio');
        fetchSocios();
      } else {
        setMessage(data.message || 'Error al crear socio.');
      }
    } catch {
      setMessage('Error de conexión al crear socio.');
    } finally {
      setLoading(false);
    }
  };

  const handleEliminarSocio = async (id) => {
    if (!window.confirm('¿Eliminar este socio?')) return;
    setLoading(true);
    setMessage('');
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_BASE}/api/socios/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(data.message || 'Socio eliminado.');
        fetchSocios();
      } else {
        setMessage(data.message || 'Error al eliminar socio.');
      }
    } catch {
      setMessage('Error de conexión al eliminar socio.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerHistorial = async (socio) => {
    setMessage('');
    setLoading(true);
    const token = localStorage.getItem('token');
    try {
      const anioParam =
        historialYear === 'todos'
          ? 'todos'
          : historialYear === 'actual'
          ? new Date().getFullYear()
          : historialYear;
      const res = await fetch(`${API_BASE}/api/puntos/historial/${socio.id}?anio=${anioParam}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setHistorialSocio(data.movimientos || []);
        setHistorialNombre(`${socio.nombre} (${socio.numero_socio})`);
      } else {
        setMessage(data.message || 'No se pudo cargar el historial.');
      }
    } catch {
      setMessage('Error de conexión al cargar historial.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.container}>
        <h1 className={styles.header}>Gestión de socios</h1>
        <AdminNav />

        {(message || loading) && (
          <div className={styles.messageBox}>
            {loading && <p>Procesando...</p>}
            {message && <p>{message}</p>}
          </div>
        )}

        <div className={styles.card}>
          <h3 className={styles.sectionTitle}>Crear socio</h3>
          <form onSubmit={handleCrearSocio} style={{ display: 'grid', gap: '8px', marginBottom: '12px' }}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Nombre</label>
              <input className={styles.input} value={newNombre} onChange={(e) => setNewNombre(e.target.value)} required />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Email</label>
              <input className={styles.input} type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} required />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Número socio</label>
              <input className={styles.input} value={newNumero} onChange={(e) => setNewNumero(e.target.value)} required />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Contraseña</label>
              <input className={styles.input} type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Rol</label>
              <select className={styles.input} value={newRol} onChange={(e) => setNewRol(e.target.value)}>
                <option value="socio">Socio</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <button type="submit" className={styles.buttonPrimary} disabled={loading}>Crear socio</button>
          </form>
        </div>

        <div className={styles.card}>
          <h3 className={styles.sectionTitle}>Socios</h3>
          <div style={{ marginBottom: '8px' }}>
            <label className={styles.label}>Año historial:</label>{' '}
            <select
              className={styles.input}
              style={{ maxWidth: '180px', display: 'inline-block' }}
              value={historialYear}
              onChange={(e) => setHistorialYear(e.target.value)}
            >
              <option value="actual">Año actual</option>
              <option value={new Date().getFullYear() - 1}>{new Date().getFullYear() - 1}</option>
              <option value="todos">Todos los años</option>
            </select>
          </div>
          <div style={{ marginBottom: '12px' }}>
            <input
              className={styles.input}
              placeholder="Buscar socio por nombre, email o número"
              value={filtroSocio}
              onChange={(e) => setFiltroSocio(e.target.value)}
              style={{ maxWidth: '320px' }}
            />
          </div>
          {socios.length === 0 ? (
            <p>No hay socios registrados.</p>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.th}>Número</th>
                    <th className={styles.th}>Nombre</th>
                    <th className={styles.th}>Email</th>
                    <th className={styles.th}>Rol</th>
                    <th className={styles.th}>Docs</th>
                    <th className={styles.th}>Acciones</th>
                    <th className={styles.th}>Puntos</th>
                  </tr>
                </thead>
                <tbody>
                  {!searchText ? (
                    <tr>
                      <td className={styles.td} colSpan={7}>Empieza a escribir para buscar un socio.</td>
                    </tr>
                  ) : filteredSocios.length === 0 ? (
                    <tr>
                      <td className={styles.td} colSpan={7}>Sin resultados para esa búsqueda.</td>
                    </tr>
                  ) : (
                    filteredSocios.map((s, index) => {
                    const docs = docsEstado[s.id] || {};
                    const completos = ['dni', 'foto', 'contrato'].every(t => docs[t] === 'verificado');
                    const badge = completos ? 'Completo' : 'Pendiente';
                    return (
                      <tr key={s.id} className={index % 2 === 0 ? styles.trEven : null}>
                        <td className={styles.td}>{s.numero_socio}</td>
                        <td className={styles.td}>{s.nombre}</td>
                        <td className={styles.td}>{s.email}</td>
                        <td className={styles.td}>{s.rol}</td>
                        <td className={styles.td}>{badge}</td>
                        <td className={styles.td}>
                          <button
                            onClick={() => handleEliminarSocio(s.id)}
                            disabled={loading}
                            className={`${styles.buttonPrimary} ${styles.buttonReject}`}
                          >
                            Eliminar
                          </button>
                        </td>
                        <td className={styles.td}>
                          <button
                            onClick={() => handleVerHistorial(s)}
                            disabled={loading}
                            className={styles.buttonPrimary}
                          >
                            Historial
                          </button>
                        </td>
                      </tr>
                    );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {historialNombre && (
          <div className={styles.card}>
            <h3 className={styles.sectionTitle}>Historial de puntos: {historialNombre}</h3>
            {historialSocio.length === 0 ? (
              <p>No hay movimientos de puntos para este socio.</p>
            ) : (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th className={styles.th}>Fecha</th>
                      <th className={styles.th}>Motivo</th>
                      <th className={styles.th}>Descripción</th>
                      <th className={styles.th}>Puntos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historialSocio.map((mov) => (
                      <tr key={mov.id}>
                        <td className={styles.td}>{new Date(mov.fecha).toLocaleString()}</td>
                        <td className={styles.td}>{mov.motivo}</td>
                        <td className={styles.td}>{mov.descripcion}</td>
                        <td className={styles.td}>{mov.puntos}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
