// frontend/src/components/LibroVisitas.jsx
import { useState, useEffect } from 'react';
import styles from './LibroVisitas.module.css';
import AdminNav from './AdminNav';
import adminStyles from '../pages/AdminPage.module.css';
import publicStyles from '../pages/PublicPage.module.css';

const LibroVisitas = () => {
  const [entradas, setEntradas] = useState([]);
  const [nombreAutor, setNombreAutor] = useState('');
  const [texto, setTexto] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const API_URL = 'http://localhost:5000/api/libro-visitas';
  const isAdmin = (() => {
    try {
      const u = localStorage.getItem('user');
      return u ? JSON.parse(u)?.rol === 'admin' : false;
    } catch {
      return false;
    }
  })();

  useEffect(() => {
    const fetchEntradas = async () => {
      try {
        const response = await fetch(API_URL);
        const data = await response.json();
        if (response.ok) {
          setEntradas(data.entradas || []);
        } else {
          setMessage(data.message || 'Error al cargar las entradas del libro de visitas.');
        }
      } catch (error) {
        console.error('Error al cargar el libro de visitas:', error);
        setMessage('Error al cargar las entradas del libro de visitas.');
      }
    };

    fetchEntradas();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!nombreAutor.trim() || !texto.trim()) {
      setMessage('El nombre del autor y el texto son requeridos.');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre_autor: nombreAutor, texto })
      });

      const data = await response.json();
      if (response.ok) {
        setMessage(data.message || '¡Gracias por tu visita! Tu entrada ha sido añadida.');
        setNombreAutor('');
        setTexto('');
        // Recargar la lista
        const updated = await fetch(API_URL);
        const updatedData = await updated.json();
        if (updated.ok) setEntradas(updatedData.entradas || []);
      } else {
        setMessage(data.message || 'Error al enviar tu entrada.');
      }
    } catch (error) {
      setMessage('Error al enviar tu entrada.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Eliminar esta firma del libro?')) return;
    setLoading(true);
    setMessage('');
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setEntradas((prev) => prev.filter((e) => e.id !== id));
        setMessage(data.message || 'Entrada eliminada.');
      } else {
        setMessage(data.message || 'No se pudo eliminar.');
      }
    } catch (error) {
      setMessage('Error al eliminar la entrada.');
    } finally {
      setLoading(false);
    }
  };

  const content = (
    <>
      {!isAdmin && <h2 className={styles.title}>Libro de Visitas</h2>}
      <p className={styles.description}>
        Deja tu huella y comparte tu experiencia en el club.
      </p>

      {!isAdmin && (
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="nombre_autor">Tu Nombre (o "Anónimo"):</label>
            <input
              type="text"
              id="nombre_autor"
              name="nombre_autor"
              required
              className={styles.input}
              value={nombreAutor}
              onChange={(e) => setNombreAutor(e.target.value)}
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="texto">Tu Mensaje:</label>
            <textarea
              id="texto"
              name="texto"
              rows="4"
              required
              className={styles.textarea}
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
            ></textarea>
          </div>
          <button type="submit" disabled={loading} className={styles.button}>
            {loading ? 'Enviando...' : 'Firma en el Libro'}
          </button>
        </form>
      )}

      {message && <div className={styles.messageBox}>{message}</div>}

      <h3 className={styles.entriesTitle}>{isAdmin ? 'Firmas recibidas' : 'Firmas Anteriores'}</h3>
      <div className={styles.entriesList}>
        {entradas.length === 0 ? (
          <p className={styles.noEntries}>Aún no hay firmas en el libro.</p>
        ) : (
          <ul className={styles.entryListUl}>
            {entradas.map((entrada) => (
              <li key={entrada.id} className={styles.entryItem}>
                <div className={styles.entryHeader}>
                  <strong>{entrada.nombre_autor}</strong>
                  <span>{new Date(entrada.fecha).toLocaleDateString()}</span>
                </div>
                <p>{entrada.texto}</p>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => handleEliminar(entrada.id)}
                    className={styles.deleteButton}
                  >
                    Eliminar
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );

  if (isAdmin) {
    return (
      <div className={adminStyles.pageContainer}>
        <div className={adminStyles.container}>
          <h1 className={adminStyles.header}>Libro de Visitas</h1>
          <AdminNav />
          <div className={adminStyles.card}>
            <div className={styles.container}>{content}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={publicStyles.page}>
      <div className={publicStyles.container}>
        <div className={publicStyles.card}>
          <div className={styles.container}>{content}</div>
        </div>
      </div>
    </div>
  );
};

export default LibroVisitas;
