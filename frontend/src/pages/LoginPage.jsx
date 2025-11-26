// frontend/src/pages/LoginPage.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './LoginPage.module.css';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    console.log("🔐 Enviando petición de login...");

    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      console.log("🔍 Respuesta del backend recibida:", response);

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Login exitoso. Datos recibidos:", data);
        
        // Guardar en localStorage
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.socio));
        console.log("✅ Token y usuario guardados en localStorage.");

        // Redirigir según rol
        const destino = data.socio?.rol === 'admin' ? '/admin' : '/panel';
        console.log(`🚀 Redirigiendo a ${destino}...`);
        navigate(destino);
        console.log("✅ Navegación ejecutada.");

      } else {
        console.error("❌ Login fallido. Status:", response.status);
        setError('Credenciales inválidas. Inténtalo de nuevo.');
      }
    } catch (err) {
      console.error("❌ Error en el catch del fetch:", err);
      setError('No se pudo conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginCard}>
        <div className={styles.header}>
          <span className={styles.tag}>Club de Fumadores</span>
          <h2>Accede al panel</h2>
          <p className={styles.subtitle}>Gestiona canjes, puntos y socios desde un solo lugar.</p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Email</label>
            <input
              className={styles.input}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Contraseña</label>
            <input
              className={styles.input}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button className={styles.button} type="submit" disabled={loading}>
            {loading ? 'Ingresando...' : 'Iniciar Sesión'}
          </button>
        </form>

        {error && <div className={styles.error}>{error}</div>}
      </div>
    </div>
  );
}

export default LoginPage;
