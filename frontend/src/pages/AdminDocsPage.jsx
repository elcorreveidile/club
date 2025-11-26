import { useEffect, useState } from 'react';
import styles from './AdminPage.module.css';
import AdminNav from '../components/AdminNav';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function AdminDocsPage() {
  const [docs, setDocs] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchDocs = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_BASE}/api/documentos/todos`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setDocs(data.documentos || []);
      else setMessage(data.message || 'Error al cargar documentos.');
    } catch (err) {
      setMessage('Error de conexión al cargar documentos.');
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const updateEstado = async (id, estado) => {
    const token = localStorage.getItem('token');
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch(`${API_BASE}/api/documentos/${id}/verificar`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ estado })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(data.message || 'Estado actualizado.');
        fetchDocs();
      } else {
        setMessage(data.message || 'Error al actualizar estado.');
      }
    } catch (err) {
      setMessage('Error de conexión al actualizar estado.');
    } finally {
      setLoading(false);
    }
  };

  const descargar = async (doc) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_BASE}/api/documentos/${doc.id}/archivo`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        const data = await res.json();
        setMessage(data.message || 'Error al descargar.');
        return;
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      const extFromPath = doc.archivo_path && doc.archivo_path.includes('.')
        ? `.${doc.archivo_path.split('.').pop()}`
        : '.bin';
      const downloadName = doc.original_nombre || `${doc.tipo}_${doc.numero_socio || doc.id_socio}${extFromPath}`;
      a.href = url;
      a.download = downloadName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setMessage('Error de conexión al descargar.');
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.container}>
        <h1 className={styles.header}>Documentos de socios</h1>
        <AdminNav />

        {(message || loading) && (
          <div className={styles.messageBox}>
            {loading && <p>Procesando...</p>}
            {message && <p>{message}</p>}
          </div>
        )}

        <div className={styles.card}>
          <h3 className={styles.sectionTitle}>Pendientes y verificados</h3>
          {docs.length === 0 ? (
            <p>No hay documentos cargados.</p>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.th}>Socio</th>
                    <th className={styles.th}>Email</th>
                    <th className={styles.th}>Tipo</th>
                    <th className={styles.th}>Estado</th>
                    <th className={styles.th}>Creado</th>
                    <th className={styles.th}>Archivo</th>
                    <th className={styles.th}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {docs.map((doc, idx) => (
                    <tr key={doc.id} className={idx % 2 === 0 ? styles.trEven : null}>
                      <td className={styles.td}>{doc.nombre} ({doc.numero_socio})</td>
                      <td className={styles.td}>{doc.email}</td>
                      <td className={styles.td}>{doc.tipo}</td>
                      <td className={styles.td}>{doc.estado}</td>
                      <td className={styles.td}>{new Date(doc.creado_en).toLocaleString()}</td>
                      <td className={styles.td}>{doc.original_nombre || doc.archivo_path}</td>
                      <td className={styles.td} style={{ display: 'flex', gap: '8px' }}>
                        <button className={`${styles.buttonPrimary} ${styles.buttonApprove}`} disabled={loading} onClick={() => updateEstado(doc.id, 'verificado')}>Verificar</button>
                        <button className={`${styles.buttonPrimary} ${styles.buttonReject}`} disabled={loading} onClick={() => updateEstado(doc.id, 'rechazado')}>Rechazar</button>
                        <button className={styles.buttonPrimary} disabled={loading} onClick={() => descargar(doc)}>Descargar</button>
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
