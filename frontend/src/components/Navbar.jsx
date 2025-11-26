// src/components/Navbar.jsx
import { Link, useNavigate } from 'react-router-dom';
import logoSrc from '../assets/logo.png';
import styles from './Navbar.module.css';

const Navbar = () => {
  const navigate = useNavigate();

  // Recuperamos usuario desde localStorage
  const user = (() => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  })();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const homeHref = user ? (user.rol === 'admin' ? '/admin' : '/panel') : '/';

  const isAdmin = user?.rol === 'admin';
  const logo = (
    <Link to="/" className="navbar-brand" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <img src={logoSrc} alt="GRX Grass Social" style={{ height: 40, width: 'auto' }} />
    </Link>
  );

  return (
    <nav className={styles.nav}>
      <div className={styles.logo}>{logo}</div>
      <div className={styles.links}>
        <Link to="/tienda" className={styles.link}>Catálogo</Link>
        <Link to="/libro-visitas" className={styles.link}>Libro de Visitas</Link>
        <Link to="/buzon-sugerencias" className={styles.link}>Buzón de Sugerencias</Link>
        {isAdmin && <Link to="/admin" className={styles.link}>Panel Admin</Link>}
        {user && !isAdmin && <Link to="/panel" className={styles.link}>Panel Socio</Link>}
      </div>
      <div className={styles.right}>
        {user ? (
          <>
            <span>Hola, {user.nombre}</span>
            <button onClick={handleLogout} className={styles.btn}>Cerrar Sesión</button>
          </>
        ) : (
          <>
            <Link to="/login" className={styles.link}>Iniciar Sesión</Link>
            <Link to="/pre-registro" className={`${styles.link} ${styles.cta}`}>Pre-registro</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
