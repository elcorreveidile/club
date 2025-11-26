// frontend/src/pages/HomePage.jsx
import { Link } from 'react-router-dom';
import styles from './HomePage.module.css';
import logoSrc from '../assets/logo.png';
import loungeImg from '../assets/the-club.jpg';
import chillImg from '../assets/chill.jpeg';
import actImg from '../assets/actuacion.jpeg';

export default function HomePage() {
  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.heroContent}>
          <img src={logoSrc} alt="GRX Grass Social" className={styles.logo} />
          <p className={styles.kicker}>Club social de fumadores</p>
          <h1 className={styles.title}>Bienvenido a GRX Grass Social</h1>
          <p className={styles.subtitle}>
            Un espacio seguro y privado para nuestra comunidad. Consulta el catálogo, deja tu firma o solicita tu membresía.
          </p>
          <div className={styles.ctaGroup}>
            <Link to="/pre-registro" className={styles.ctaPrimary}>Solicitar membresía</Link>
            <Link to="/libro-visitas" className={styles.ctaSecondary}>Libro de visitas</Link>
          </div>
        </div>
      </header>

      <main className={styles.sections}>
        <section className={`${styles.card} ${styles.cardWithImage}`} style={{ backgroundImage: `url(${loungeImg})` }}>
          <div className={styles.overlay}>
            <h2>Tienda</h2>
            <p>Explora el catálogo y canjea con tus puntos cuando seas socio.</p>
            <Link to="/tienda" className={styles.link}>Ir a la tienda</Link>
          </div>
        </section>

        <section className={`${styles.card} ${styles.cardWithImage}`} style={{ backgroundImage: `url(${chillImg})` }}>
          <div className={styles.overlay}>
            <h2>Buzón de sugerencias</h2>
            <p>Tu opinión cuenta. Comparte ideas y mejoras para el club.</p>
            <Link to="/buzon-sugerencias" className={styles.link}>Abrir buzón</Link>
          </div>
        </section>

        <section className={`${styles.card} ${styles.cardWithImage}`} style={{ backgroundImage: `url(${actImg})` }}>
          <div className={styles.overlay}>
            <h2>Hazte socio</h2>
            <p>Completa el pre-registro y un administrador revisará tu solicitud.</p>
            <Link to="/pre-registro" className={styles.link}>Pre-registro</Link>
          </div>
        </section>
      </main>
    </div>
  );
}
