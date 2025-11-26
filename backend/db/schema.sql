-- Schema de base alineado con los controladores actuales.
-- Revísalo y aplícalo en tu instancia Postgres según corresponda.

-- Tipos de socio (define los puntos por euro)
CREATE TABLE IF NOT EXISTS "TiposSocio" (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  puntos_por_euro NUMERIC(10,2) NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Socios
CREATE TABLE IF NOT EXISTS "Socios" (
  id SERIAL PRIMARY KEY,
  numero_socio VARCHAR(50) NOT NULL UNIQUE,
  nombre TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  rol VARCHAR(20) NOT NULL DEFAULT 'socio',
  id_tipo_socio INTEGER REFERENCES "TiposSocio"(id),
  puntos_anio_actual NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Productos del catálogo
CREATE TABLE IF NOT EXISTS "Productos" (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  precio_puntos INTEGER NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Pre-registros de nuevos socios
CREATE TABLE IF NOT EXISTS "PreRegistros" (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  email TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  estado VARCHAR(30) NOT NULL DEFAULT 'pendiente',
  fecha_registro TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  fecha_aprobacion TIMESTAMPTZ,
  id_admin_aprobador INTEGER REFERENCES "Socios"(id)
);

-- Documentos de socios
CREATE TABLE IF NOT EXISTS "DocumentosSocio" (
  id SERIAL PRIMARY KEY,
  id_socio INTEGER NOT NULL REFERENCES "Socios"(id),
  tipo VARCHAR(30) NOT NULL,
  archivo_path TEXT NOT NULL,
  original_nombre TEXT,
  estado VARCHAR(30) NOT NULL DEFAULT 'pendiente',
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  verificado_por INTEGER REFERENCES "Socios"(id),
  verificado_en TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_doc_socio_tipo ON "DocumentosSocio"(id_socio, tipo);

-- Compras físicas registradas por admin
CREATE TABLE IF NOT EXISTS "ComprasFisicas" (
  id SERIAL PRIMARY KEY,
  id_socio INTEGER NOT NULL REFERENCES "Socios"(id),
  total_euros NUMERIC(12,2) NOT NULL,
  descripcion TEXT,
  id_admin INTEGER REFERENCES "Socios"(id),
  empleado TEXT,
  fecha TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Canjes de puntos por productos
CREATE TABLE IF NOT EXISTS "Canjes" (
  id SERIAL PRIMARY KEY,
  id_socio INTEGER NOT NULL REFERENCES "Socios"(id),
  id_producto INTEGER NOT NULL REFERENCES "Productos"(id),
  puntos_utilizados NUMERIC(12,2) NOT NULL,
  fecha TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  estado VARCHAR(30) NOT NULL DEFAULT 'pendiente',
  fecha_entrega TIMESTAMPTZ,
  comentario_admin TEXT
);

-- Movimientos de puntos (pérdidas/ganancias)
CREATE TABLE IF NOT EXISTS "MovimientosPuntos" (
  id SERIAL PRIMARY KEY,
  id_socio INTEGER NOT NULL REFERENCES "Socios"(id),
  puntos NUMERIC(12,2) NOT NULL,
  motivo TEXT NOT NULL,
  descripcion TEXT,
  id_compra_fisica INTEGER REFERENCES "ComprasFisicas"(id),
  id_canje INTEGER REFERENCES "Canjes"(id),
  anio INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM NOW()),
  fecha TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Sugerencias de socios
CREATE TABLE IF NOT EXISTS "Sugerencias" (
  id SERIAL PRIMARY KEY,
  id_socio INTEGER NOT NULL REFERENCES "Socios"(id),
  titulo TEXT NOT NULL,
  texto TEXT NOT NULL,
  fecha TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  estado VARCHAR(30) NOT NULL DEFAULT 'recibida'
);

-- Libro de visitas (público o socio)
CREATE TABLE IF NOT EXISTS "LibroVisitas" (
  id SERIAL PRIMARY KEY,
  nombre_autor TEXT NOT NULL,
  texto TEXT NOT NULL,
  id_socio INTEGER REFERENCES "Socios"(id) ON DELETE SET NULL,
  fecha TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices útiles
CREATE INDEX IF NOT EXISTS idx_socios_email ON "Socios"(email);
CREATE INDEX IF NOT EXISTS idx_mov_puntos_socio_anio ON "MovimientosPuntos"(id_socio, anio DESC, fecha DESC);
CREATE INDEX IF NOT EXISTS idx_canjes_estado ON "Canjes"(estado);
CREATE INDEX IF NOT EXISTS idx_preregistros_estado ON "PreRegistros"(estado);
