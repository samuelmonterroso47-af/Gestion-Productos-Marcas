-- Esquema de base de datos: Gestion de Productos y Marcas
-- Ejecutar una sola vez sobre una base de datos PostgreSQL vacia.

CREATE TABLE IF NOT EXISTS ventas (
    id              SERIAL PRIMARY KEY,
    fecha           DATE NOT NULL,
    cliente         VARCHAR(120) NOT NULL,
    departamento    VARCHAR(80) NOT NULL,
    municipio       VARCHAR(80) NOT NULL,
    marca           VARCHAR(80) NOT NULL,
    codigo          VARCHAR(40),
    tipo_producto   VARCHAR(20) NOT NULL, -- '3WH', '2WH', etc.
    cantidad        NUMERIC(14,2) NOT NULL DEFAULT 0,
    monto           NUMERIC(14,2) NOT NULL DEFAULT 0,
    creado_en       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ventas_fecha ON ventas (fecha);
CREATE INDEX IF NOT EXISTS idx_ventas_cliente ON ventas (cliente);
CREATE INDEX IF NOT EXISTS idx_ventas_marca ON ventas (marca);
CREATE INDEX IF NOT EXISTS idx_ventas_municipio ON ventas (municipio);
CREATE INDEX IF NOT EXISTS idx_ventas_tipo_producto ON ventas (tipo_producto);

-- Tamano estimado del mercado (parque de unidades) por municipio y tipo de producto.
-- Se usa para calcular participacion de mercado en los modulos 3WH / 2WH.
CREATE TABLE IF NOT EXISTS parque_estimado (
    id                  SERIAL PRIMARY KEY,
    departamento        VARCHAR(80) NOT NULL,
    municipio           VARCHAR(80) NOT NULL,
    tipo_producto       VARCHAR(20) NOT NULL,
    unidades_estimadas  NUMERIC(14,2) NOT NULL,
    UNIQUE (municipio, tipo_producto)
);

-- Catalogo de clientes conocidos, independiente de si ya compraron o no.
-- Permite detectar oportunidades (clientes que nunca compraron cierta marca).
CREATE TABLE IF NOT EXISTS catalogo_clientes (
    id              SERIAL PRIMARY KEY,
    nombre          VARCHAR(120) UNIQUE NOT NULL,
    departamento    VARCHAR(80),
    municipio       VARCHAR(80)
);

-- Catalogo de marcas que la empresa distribuye.
CREATE TABLE IF NOT EXISTS catalogo_marcas (
    id      SERIAL PRIMARY KEY,
    nombre  VARCHAR(80) UNIQUE NOT NULL
);

-- Asociacion manual entre un codigo principal y codigos relacionados
-- (ej. repuestos equivalentes de otras marcas), usada en el modulo de
-- Recuperacion de Codigos.
CREATE TABLE IF NOT EXISTS codigos_relacionados (
    id                  SERIAL PRIMARY KEY,
    codigo_principal    VARCHAR(40) NOT NULL,
    codigo_relacionado  VARCHAR(40) NOT NULL,
    UNIQUE (codigo_principal, codigo_relacionado)
);
