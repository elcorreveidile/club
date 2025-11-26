# Club de Fumadores – App Full Stack

Aplicación completa (frontend React + backend Node/Express + PostgreSQL) para gestión de socios, canjes, tienda, preregistro, documentos y comunicación (email/WhatsApp).

## Requisitos
- Node.js 18+ (se ha usado Node 22)
- PostgreSQL
- npm

## Instalación rápida
```bash
git clone https://github.com/elcorreveidile/club.git
cd club-fumadores-app
```

### Backend
```bash
cd backend
npm install
```
Configura `backend/.env` (ver sección .env). Luego:
```bash
npm run dev   # nodemon server.js
```
API: `http://localhost:5000`

### Frontend
```bash
cd frontend
npm install
npm run dev   # Vite
```
App: `http://localhost:5173`

## Variables de entorno (backend/.env)
Ejemplo mínimo:
```
PORT=5000
DATABASE_URL=postgres://user:pass@localhost:5432/club_db
JWT_SECRET=tu_clave_jwt

# SMTP para emails
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu_email@gmail.com
SMTP_PASS=tu_pass_app
ADMIN_EMAIL=destino_admin@gmail.com

# WhatsApp Cloud API (opcionales)
WA_TOKEN=
WA_PHONE_ID=
WA_ADMIN_TO=
```

## Esquema / migraciones rápidas
Tablas principales: `socios, productos, comprasfisicas, canjes, movimientosPuntos, preregistros, documentossocio, libro_visitas, sugerencias`.

SQL clave (añadir columnas nuevas si faltan):
```sql
ALTER TABLE productos
  ADD COLUMN IF NOT EXISTS precio_euros numeric(12,2),
  ADD COLUMN IF NOT EXISTS precio_puntos numeric(12,2),
  ADD COLUMN IF NOT EXISTS categoria text DEFAULT 'publico',
  ADD COLUMN IF NOT EXISTS imagen_url text;

ALTER TABLE comprasfisicas
  ADD COLUMN IF NOT EXISTS id_admin integer REFERENCES socios(id),
  ADD COLUMN IF NOT EXISTS empleado text,
  ADD COLUMN IF NOT EXISTS producto text;

ALTER TABLE documentossocio
  ADD COLUMN IF NOT EXISTS original_nombre text;

-- Puntos decimales
ALTER TABLE socios ALTER COLUMN puntos_anio_actual TYPE numeric(12,2);
ALTER TABLE canjes ALTER COLUMN puntos_utilizados TYPE numeric(12,2);
ALTER TABLE MovimientosPuntos ALTER COLUMN puntos TYPE numeric(12,2);
```

## Scripts npm
- Backend: `npm run dev` (nodemon server.js)
- Frontend: `npm run dev` (Vite)

## Funcionalidades destacadas
- **Autenticación JWT** (roles admin/socio).
- **Tienda**: productos públicos/exclusivos socios, imágenes subidas a `backend/uploads/products`, canje por puntos (1 punto = 1 €).
- **Compras físicas**: admin registra compras, suma puntos (1 punto por cada 10 €), guarda producto y empleado.
- **Canjes**: solicitudes y gestión de canjes.
- **Preregistro**: alta pendiente; aprobación genera socio, envía email y alerta (WhatsApp si configurado).
- **Documentación**: socios suben DNI/foto/contrato, admin descarga/verifica; archivos en `backend/uploads`.
- **Buzón de sugerencias y Libro de visitas**: público; vistas admin sin formularios, con eliminación/lectura.
- **Panel socio**: puntos del año, total acumulado, historial, estado de documentos.
- **Panel admin**: gestión de socios (búsqueda, historial de puntos), productos (CRUD con imagen), preregistros, canjes, sugerencias, documentos, compras físicas.

## Notas de despliegue
- Servir `/uploads` en producción de forma protegida (ya se expone en `server.js`).
- Ajusta CORS en `backend/server.js` según el dominio de tu frontend.
- Para GitHub Pages necesitarías un build estático del frontend; la API debe desplegarse en un servicio con Node/Postgres (Render/Railway/etc.).
