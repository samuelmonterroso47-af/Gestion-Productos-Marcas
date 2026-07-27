# Gestión de Productos y Marcas

Dashboard de seguimiento comercial: participación de mercado (3WH/2WH), promedios de compra por cliente, recuperación de marcas y códigos, y detección de oportunidades de promoción. Full-stack: frontend HTML/CSS/JS + API en Node/Express + base de datos PostgreSQL real.

## Arquitectura

```
public/    -> Frontend estatico (HTML, CSS, JS), servido por Express
server/    -> API REST (Node.js + Express + PostgreSQL)
```

Todos los módulos leen de una tabla maestra `ventas` (una fila por transacción) más un par de tablas de apoyo (`parque_estimado`, `catalogo_clientes`, `catalogo_marcas`, `codigos_relacionados`). Los datos se cargan subiendo un Excel/CSV desde la pestaña **"Cargar Datos"**; no hay datos de ejemplo hardcodeados.

## Módulos

1. **Mercado 3WH / 2WH**: participación de mercado por municipio = unidades vendidas ÷ unidades estimadas del mercado (`parque_estimado`), comparando mes actual vs. mes anterior.
2. **Promedios de Clientes**: gasto del mes actual vs. promedio de 3 y 6 meses; clasifica clientes en nuevos, en riesgo, sin compra o top.
3. **Recuperación de Marcas**: días transcurridos desde la última compra de cada cliente por marca (Normal / Alerta / Crítico).
4. **Recuperación de Códigos**: igual que el anterior pero por código de producto, con asociación manual de códigos relacionados.
5. **Oportunidades de Promoción**: cruza el catálogo de clientes con el catálogo de marcas para detectar combinaciones cliente-marca que nunca se han comprado.

## Requisitos

- Node.js 18+
- PostgreSQL 13+ (local, o un proveedor gratuito como [Neon](https://neon.tech) o [Supabase](https://supabase.com))

## Configuración local

```bash
cd server
npm install
cp .env.example .env        # ajusta DATABASE_URL
npm run db:init             # crea las tablas (schema.sql)
npm start                   # http://localhost:3000
```

La app completa (frontend + API) queda servida en `http://localhost:3000`.

## Estructura del Excel para cargar Ventas

Pestaña "Cargar Datos" → sección Ventas. Columnas (nombres de encabezado, sin importar mayúsculas):

| fecha | cliente | departamento | municipio | marca | codigo | tipo_producto | cantidad | monto |
|---|---|---|---|---|---|---|---|---|
| 2026-07-15 | Cliente 1 | Quetzaltenango | Quetzaltenango | GTS | A101 | 3WH | 10 | 50000 |

- `tipo_producto`: usa `3WH`, `2WH`, o el tipo que corresponda a tu negocio (debe coincidir con lo que subas en Parque Estimado si quieres ver participación de mercado).
- `codigo` es opcional (se usa en el módulo de Recuperación de Códigos).

## Estructura del Excel para Parque Estimado (tamaño de mercado)

| departamento | municipio | tipo_producto | unidades_estimadas |
|---|---|---|---|
| Quetzaltenango | Quetzaltenango | 3WH | 1500 |

Esto solo alimenta el cálculo de % de participación de mercado en los módulos 1 y 2; súbelo una vez y actualízalo cuando cambien tus estimaciones.

## Desplegar para tu portafolio

1. **Base de datos**: crea un proyecto gratuito en [Neon](https://neon.tech) (o Supabase) y copia la cadena de conexión.
2. **Backend**: sube este repo a Render o Railway como Web Service, con `server/` como directorio raíz, comando de arranque `npm start`, y variable de entorno `DATABASE_URL` apuntando a tu base en Neon.
3. Antes del primer uso, corre `npm run db:init` (Render/Railway permiten ejecutar comandos one-off, o corres el script localmente apuntando a la BD de producción).
4. El mismo servicio sirve el frontend (`public/`), así que solo necesitas una URL para todo.

## Tecnologías

- Frontend: HTML, CSS, JavaScript (fetch a la API, sin frameworks).
- Backend: Node.js, Express.
- Base de datos: PostgreSQL.
- Carga de archivos: Multer + ExcelJS.
