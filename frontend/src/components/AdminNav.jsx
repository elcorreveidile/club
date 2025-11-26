import { useNavigate } from 'react-router-dom';
import styles from '../pages/AdminPage.module.css';

export default function AdminNav() {
  const navigate = useNavigate();

  return (
    <div className={styles.card} style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
      <h3 className={styles.sectionTitle}>Accesos rápidos</h3>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        <button className={styles.buttonPrimary} onClick={() => navigate('/admin')}>Compras</button>
        <button className={styles.buttonPrimary} onClick={() => navigate('/admin/socios')}>Gestión de socios</button>
        <button className={styles.buttonPrimary} onClick={() => navigate('/admin/canjes')}>Canjes y pre-registros</button>
        <button className={styles.buttonPrimary} onClick={() => navigate('/admin/documentos')}>Documentos</button>
        <button className={styles.buttonPrimary} onClick={() => navigate('/tienda')}>Tienda</button>
        <button className={styles.buttonPrimary} onClick={() => navigate('/buzon-sugerencias')}>Buzón</button>
        <button className={styles.buttonPrimary} onClick={() => navigate('/libro-visitas')}>Libro de visitas</button>
      </div>
    </div>
  );
}
