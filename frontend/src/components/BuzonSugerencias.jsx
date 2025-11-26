// frontend/src/components/BuzonSugerencias.jsx
import { useState, useEffect } from 'react';
import styles from './BuzonSugerencias.module.css'; // Usaremos CSS Modules para el estilo
import AdminNav from './AdminNav';
import adminStyles from '../pages/AdminPage.module.css';
import publicStyles from '../pages/PublicPage.module.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const API_URL = `${API_BASE}/api/sugerencias`;

const BuzonSugerencias = () => {
  const [sugerencias, setSugerencias] = useState([]);
  const [titulo, setTitulo] = useState('');
  const [texto, setTexto] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [userRole, setUserRole] = useState(null);
  const [adminSugs, setAdminSugs] = useState([]);
  const isAdmin = userRole === 'admin';

  useEffect(() => {
    // Obtenemos el rol del usuario desde localStorage al montar el componente
    const userData = JSON.parse(localStorage.getItem('user'));
    setUserRole(userData?.rol || null);

    const fetchAdmin = async () => {
      if (userData?.rol !== 'admin') return;
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(API_URL, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) {
          setAdminSugs(data.sugerencias || []);
        }
      } catch (err) {
        console.error('Error cargando sugerencias admin', err);
      }
    };
    fetchAdmin();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!titulo.trim() || !texto.trim()) {
      setMessage('El título y el texto son obligatorios.');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ titulo, texto })
      });

      const data = await response.json();
      if (response.ok) {
        setMessage(data.message);
        setTitulo('');
        setTexto('');
      } else {
        setMessage(data.message || 'Error al enviar la sugerencia.');
      }

    } catch (error) {
      setMessage('Error al enviar la sugerencia.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const userContent = (
    <>
      <div className={styles.hero}>
        <p className={styles.kicker}>Cuéntanos</p>
        <h2 className={styles.title}>Buzón de Sugerencias</h2>
        <p className={styles.description}>
          Tus ideas mejoran el club. Envía propuestas sobre ambiente, eventos o servicio.
        </p>
      </div>

      <div className={styles.card}>
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Título</label>
            <input
              className={styles.input}
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ej: Más música en directo los viernes"
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Tu sugerencia</label>
            <textarea
              className={styles.textarea}
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Escribe aquí tu idea..."
              rows="5"
              required
            />
          </div>
          <button type="submit" disabled={loading} className={styles.button}>
            {loading ? 'Enviando...' : 'Enviar Sugerencia'}
          </button>
        </form>

        {message && <div className={styles.messageBox}>{message}</div>}

        <div className={styles.mapWrapper}>
          <h3 className={styles.subtitle}>Encuéntranos</h3>
          <p className={styles.muted}>Visita nuestro club o deja tu reseña en Google.</p>
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d397.3797452562443!2d-3.6023783683776887!3d37.175568795563656!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xd71fdc3dc8c8263%3A0xfd7492580867b57!2sgrass%20club%20grx!5e0!3m2!1ses!2ses!4v1764105443613!5m2!1ses!2ses"
            width="100%"
            height="280"
            style={{ border: 0, borderRadius: '8px' }}
            allowFullScreen=""
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Ubicación GRX Grass Social"
          />
          <a
            className={styles.button}
            href="https://maps.app.goo.gl/UefYi1NApPTLSMoP9"
            target="_blank"
            rel="noreferrer"
            style={{ marginTop: '12px', display: 'inline-block', textAlign: 'center' }}
          >
            Escribir reseña
          </a>
        </div>
      </div>

      {userRole === 'socio' && (
        <div className={styles.card}>
          <h3 className={styles.subtitle}>Mis sugerencias</h3>
          <p className={styles.muted}>Próximamente podrás ver el historial aquí.</p>
        </div>
      )}
    </>
  );

  const adminContent = (
    <div className={styles.card}>
      <h3 className={styles.subtitle}>Sugerencias recibidas</h3>
      {adminSugs.length === 0 ? (
        <p className={styles.muted}>No hay sugerencias.</p>
      ) : (
        <div className={styles.adminList}>
          {adminSugs.map((sug) => (
            <div key={sug.id} className={styles.adminItem}>
              <div>
                <strong>{sug.nombre_socio || 'Socio'}</strong>{' '}
                <span className={styles.muted}>
                  {sug.numero_socio ? `(${sug.numero_socio})` : ''} · {new Date(sug.fecha).toLocaleString()}
                </span>
              </div>
              <div className={styles.adminTitle}>{sug.titulo}</div>
              <p className={styles.adminText}>{sug.texto}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  if (isAdmin) {
    return (
      <div className={adminStyles.pageContainer}>
        <div className={adminStyles.container}>
          <h1 className={adminStyles.header}>Buzón de Sugerencias</h1>
          <AdminNav />
          <div className={adminStyles.card}>
            {adminContent}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={publicStyles.page}>
      <div className={publicStyles.container}>
        <div className={publicStyles.card}>
          <div className={styles.container}>{userContent}</div>
        </div>
      </div>
    </div>
  );
};

export default BuzonSugerencias;
