import { useState } from 'react';
import styles from '../components/PreRegistroForm.module.css';
import logoSrc from '../assets/logo.png';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function PreRegistroPage() {
  const [formData, setFormData] = useState({
    nombre: '',
    email: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch(`${API_BASE}/api/pre-registro`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (response.ok) {
        setMessage(data.message || '¡Solicitud enviada!');
        setFormData({ nombre: '', email: '' });
      } else {
        setMessage(data.message || 'No se pudo completar el pre-registro.');
      }
    } catch (error) {
      setMessage('Error en el servidor. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.logoWrap}>
          <img src={logoSrc} alt="GRX Grass Social" style={{ height: 64 }} />
        </div>
        <h2 className={styles.title}>Solicitud de Membresía</h2>
        <p className={styles.description}>
          ¡Bienvenido al club! Completa este formulario para solicitar tu membresía. Un administrador revisará tu solicitud y te contactará.
        </p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="nombre">Nombre Completo</label>
            <input
              type="text"
              id="nombre"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              required
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className={styles.input}
            />
          </div>

          <button type="submit" disabled={loading} className={styles.button}>
            {loading ? 'Enviando...' : 'Enviar Solicitud'}
          </button>
        </form>

        {message && <div className={styles.messageBox}>{message}</div>}
      </div>
    </div>
  );
}
