import { useEffect, useState } from 'react';
import styles from './AdminPage.module.css';
import AdminNav from '../components/AdminNav';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function AdminCanjesPage() {
  const [canjesPendientes, setCanjesPendientes] = useState([]);
  const [preRegistros, setPreRegistros] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const tokenHeader = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

  const fetchCanjes = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/canjes/pendientes`, { headers: tokenHeader() });
      const data = await res.json();
      if (res.ok) setCanjesPendientes(data.canjes || []);
      else setMessage(data.message || 'Error al cargar canjes.');
    } catch {
      setMessage('Error de conexión al cargar canjes.');
    }
  };

  const fetchPreRegistros = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/pre-registro`, { headers: tokenHeader() });
      const data = await res.json();
      if (res.ok) setPreRegistros(data.preRegistros || []);
      else setMessage(data.message || 'Error al cargar pre-registros.');
    } catch {
      setMessage('Error de conexión al cargar pre-registros.');
    }
  };

  useEffect(() => {
    fetchCanjes();
    fetchPreRegistros();
  }, []);

  const aprobarCanje = async (id) => {
    if (!window.confirm('¿Aprobar este canje?')) return;
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch(`${API_BASE}/api/canjes/${id}/aprobar`, {
        method: 'PUT',
        headers: tokenHeader()
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(data.message || 'Canje aprobado.');
        fetchCanjes();
      } else {
        setMessage(data.message || 'Error al aprobar canje.');
      }
    } catch {
      setMessage('Error de conexión al aprobar canje.');
    } finally {
      setLoading(false);
    }
  };

  const rechazarCanje = async (id) => {
    const comentario = window.prompt('Motivo del rechazo (opcional)') || null;
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch(`${API_BASE}/api/canjes/${id}/rechazar`, {
        method: 'PUT',
        headers: {
          ...tokenHeader(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ comentario_admin: comentario })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(data.message || 'Canje rechazado.');
        fetchCanjes();
      } else {
        setMessage(data.message || 'Error al rechazar canje.');
      }
    } catch {
      setMessage('Error de conexión al rechazar canje.');
    } finally {
      setLoading(false);
    }
  };

  const aprobarPre = async (id) => {
    if (!window.confirm('¿Aprobar este pre-registro?')) return;
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch(`${API_BASE}/api/pre-registro/${id}/aprobar`, {
        method: 'PUT',
        headers: tokenHeader()
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(data.message || 'Pre-registro aprobado.');
        fetchPreRegistros();
      } else {
        setMessage(data.message || 'Error al aprobar pre-registro.');
      }
    } catch {
      setMessage('Error de conexión al aprobar pre-registro.');
    } finally {
      setLoading(false);
    }
  };

  const rechazarPre = async (id) => {
    if (!window.confirm('¿Rechazar este pre-registro?')) return;
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch(`${API_BASE}/api/pre-registro/${id}/rechazar`, {
        method: 'PUT',
        headers: tokenHeader()
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(data.message || 'Pre-registro rechazado.');
        fetchPreRegistros();
      } else {
        setMessage(data.message || 'Error al rechazar pre-registro.');
      }
    } catch {
      setMessage('Error de conexión al rechazar pre-registro.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.container}>
        <h1 className={styles.header}>Canjes y pre-registros</h1>
        <AdminNav />

        {(message || loading) && (
          <div className={styles.messageBox}>
            {loading && <p>Procesando...</p>}
            {message && <p>{message}</p>}
          </div>
        )}

        <div className={styles.card}>
          <h3 className={styles.sectionTitle}>Canjes pendientes</h3>
          {canjesPendientes.length === 0 ? (
            <p>No hay canjes pendientes de aprobación.</p>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.th}>Fecha</th>
                    <th className={styles.th}>Socio</th>
                    <th className={styles.th}>Producto</th>
                    <th className={styles.th}>Puntos</th>
                    <th className={styles.th}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {canjesPendientes.map((canje, index) => (
                    <tr key={canje.id} className={index % 2 === 0 ? styles.trEven : null}>
                      <td className={styles.td}>{new Date(canje.fecha).toLocaleString()}</td>
                      <td className={styles.td}>{canje.nombre_socio}</td>
                      <td className={styles.td}>{canje.nombre_producto}</td>
                      <td className={styles.td}>{canje.puntos_utilizados}</td>
                      <td className={styles.td}>
                        <button onClick={() => aprobarCanje(canje.id)} disabled={loading} className={`${styles.buttonPrimary} ${styles.buttonApprove}`}>Aprobar</button>
                        <button onClick={() => rechazarCanje(canje.id)} disabled={loading} className={`${styles.buttonPrimary} ${styles.buttonReject}`}>Rechazar</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className={styles.card}>
          <h3 className={styles.sectionTitle}>Pre-registros pendientes</h3>
          {preRegistros.length === 0 ? (
            <p>No hay solicitudes pendientes.</p>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.th}>Nombre</th>
                    <th className={styles.th}>Email</th>
                    <th className={styles.th}>Fecha</th>
                    <th className={styles.th}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {preRegistros.map((pr, index) => (
                    <tr key={pr.id} className={index % 2 === 0 ? styles.trEven : null}>
                      <td className={styles.td}>{pr.nombre}</td>
                      <td className={styles.td}>{pr.email}</td>
                      <td className={styles.td}>{new Date(pr.fecha_registro).toLocaleString()}</td>
                      <td className={styles.td}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => aprobarPre(pr.id)} disabled={loading} className={`${styles.buttonPrimary} ${styles.buttonApprove}`}>Aprobar</button>
                          <button onClick={() => rechazarPre(pr.id)} disabled={loading} className={`${styles.buttonPrimary} ${styles.buttonReject}`}>Rechazar</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
