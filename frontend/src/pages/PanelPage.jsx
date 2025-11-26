// frontend/src/pages/PanelPage.jsx
import { useState, useEffect } from 'react';
import stylesDocs from './AdminPage.module.css'; // reuse card styles
import publicStyles from './PublicPage.module.css';

function PanelPage() {
  const [socioData, setSocioData] = useState(null);
  const [historial, setHistorial] = useState([]); // <-- NUEVO ESTADO PARA EL HISTORIAL
  const [totalPuntos, setTotalPuntos] = useState(0);
  const [error, setError] = useState('');
  const [docsEstado, setDocsEstado] = useState({ dni: 'pendiente', foto: 'pendiente', contrato: 'pendiente' });
  const [docMessage, setDocMessage] = useState('');
  const [docLoading, setDocLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login';
      return;
    }

    const fetchData = async () => {
      try {
        // Petición para obtener los datos del perfil
        const perfilResponse = await fetch('http://localhost:5000/api/socios/perfil', {
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
        });
        const perfilData = await perfilResponse.json();

        if (perfilResponse.ok) {
          setSocioData(perfilData.socio);
        } else {
          throw new Error(perfilData.message || 'No se pudieron cargar los datos del perfil.');
        }

        // Petición para obtener el historial de puntos
        const historialResponse = await fetch('http://localhost:5000/api/puntos/historial?anio=todos', {
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
        });
        const historialData = await historialResponse.json();

        if (historialResponse.ok) {
          setHistorial(historialData.movimientos);
          const suma = (historialData.movimientos || []).reduce((acc, m) => acc + Number(m.puntos || 0), 0);
          setTotalPuntos(suma);
        } else {
          console.error('Error al cargar historial:', historialData.message);
        }

        // Estado de documentos
        const docsResponse = await fetch('http://localhost:5000/api/documentos/estado', {
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
        });
        const docsData = await docsResponse.json();
        if (docsResponse.ok) {
          setDocsEstado(docsData.estado || {});
        }

      } catch (err) {
        setError(err.message || 'Error de conexión al servidor.');
      }
    };

    fetchData();
  }, []);

  if (error) {
    return <p style={{ color: 'red', textAlign: 'center', marginTop: '50px' }}>{error}</p>;
  }

  if (!socioData) {
    return <p style={{ textAlign: 'center', marginTop: '50px' }}>Cargando datos del socio...</p>;
  }

  return (
    <div className={publicStyles.page}>
      <div className={publicStyles.container}>
        <div className={publicStyles.card}>
          <h2 className={publicStyles.title}>Bienvenido a tu Panel, {socioData.nombre}!</h2>
          <p className={publicStyles.subtitle}>Gestiona tus puntos y sube tu documentación pendiente.</p>

          <div style={{ marginBottom: '20px' }}>
            <p><strong>Número de Socio:</strong> {socioData.numero_socio}</p>
            <p><strong>Email:</strong> {socioData.email}</p>
            <p><strong>Rol:</strong> {socioData.rol}</p>
            <p><strong>Tus Puntos (Año Actual):</strong> {socioData.puntos_anio_actual}</p>
            <p><strong>Total puntos acumulados:</strong> {totalPuntos}</p>
          </div>

          <button
            className={stylesDocs.buttonPrimary}
            onClick={() => { localStorage.removeItem('token'); window.location.href = '/login'; }}
          >
            Cerrar Sesión
          </button>
        </div>

        <div className={publicStyles.card}>
          <h3 className={publicStyles.title}>Historial de Puntos</h3>
          {historial.length === 0 ? (
            <p>No hay movimientos de puntos este año.</p>
          ) : (
            <div className={stylesDocs.tableWrap}>
              <table className={stylesDocs.table}>
                <thead>
                  <tr>
                    <th className={stylesDocs.th}>Fecha</th>
                    <th className={stylesDocs.th}>Motivo</th>
                    <th className={stylesDocs.th}>Descripción</th>
                    <th className={stylesDocs.th}>Puntos</th>
                  </tr>
                </thead>
                <tbody>
                  {historial.map((mov) => (
                    <tr key={mov.id}>
                      <td className={stylesDocs.td}>{new Date(mov.fecha).toLocaleString()}</td>
                      <td className={stylesDocs.td}>{mov.motivo}</td>
                      <td className={stylesDocs.td}>{mov.descripcion}</td>
                      <td className={stylesDocs.td} style={{ color: mov.puntos > 0 ? 'green' : 'red' }}>
                        {mov.puntos > 0 ? `+${mov.puntos}` : mov.puntos}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className={publicStyles.card}>
          <h3 className={publicStyles.title}>Documentación pendiente</h3>
          <p className={publicStyles.subtitle}>Sube tus documentos para completar tu registro.</p>
          <div className={stylesDocs.card}>
            {docMessage && <p style={{ color: 'blue' }}>{docMessage}</p>}
            {docLoading && <p>Subiendo...</p>}
            <ul>
              {['dni', 'foto', 'contrato'].map((tipo) => (
                <li key={tipo} style={{ marginBottom: '12px' }}>
                  <strong>{tipo.toUpperCase()}:</strong> {docsEstado[tipo] || 'pendiente'}
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setDocMessage('');
                      setDocLoading(true);
                      const reader = new FileReader();
                      reader.onloadend = async () => {
                        try {
                          const token = localStorage.getItem('token');
                          const response = await fetch('http://localhost:5000/api/documentos', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              'Authorization': `Bearer ${token}`
                            },
                          body: JSON.stringify({ tipo, fileBase64: reader.result, filename: file.name })
                          });
                          const data = await response.json();
                          if (response.ok) {
                            setDocMessage(data.message);
                            const docsResponse = await fetch('http://localhost:5000/api/documentos/estado', {
                              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
                            });
                            const docsData = await docsResponse.json();
                            if (docsResponse.ok) setDocsEstado(docsData.estado || {});
                          } else {
                            setDocMessage(data.message || 'Error al subir documento.');
                          }
                        } catch (err) {
                          setDocMessage('Error de conexión al subir documento.');
                        } finally {
                          setDocLoading(false);
                        }
                      };
                      reader.readAsDataURL(file);
                    }}
                    style={{ marginLeft: '12px' }}
                  />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PanelPage;
