# Inteligencia Comercial 2WH · 3WH

Aplicación web para decidir **dónde crecer y a quién atender primero** en la venta de repuestos para motos (2WH) y mototaxis (3WH) en Guatemala.

Cruza la **flota real** de cada municipio (registro público del parque vehicular, INE/SAT) con la venta, los clientes y sus compras por marca y código.

> Demo: la flota es dato público real; ventas, clientes, marcas y códigos son **ficticios**.

## Módulos

| Módulo | Qué responde |
|---|---|
| **Mercado 3WH** | Participación de mercado por municipio = venta ÷ (mototaxis × gasto mensual por unidad). Umbral y gasto editables; recomendación automática: *enfocar*, *recuperar* o *mantener / expandir*. |
| **Mercado 2WH** | Venta del mes contra el promedio del municipio y venta por moto registrada. |
| **Clientes** | Mes actual vs. promedio de 3 y 6 meses; segmentos *sin compra*, *nuevo*, *en riesgo* y *top 20 %*. |
| **Recuperación de marcas** | Días desde la última compra de cada marca por cliente, con umbrales de alerta y crítico editables. |
| **Recuperación de códigos** | Asocia códigos equivalentes o sustitutos: si el cliente compró cualquiera, el código cuenta como recuperado. Las asociaciones se guardan en el navegador. |
| **Oportunidades de promoción** | Marcas que cada cliente nunca ha comprado, con la acción recomendada según su perfil. |

Todas las tablas se filtran, se ordenan con un clic en el encabezado y se exportan a CSV.

## Tecnología

- HTML, CSS y JavaScript (módulos ES), sin dependencias ni compilación.
- `data/datos.json`, generado con `tools/generar_datos.py` (Python) a partir del parque vehicular.

## Cómo ejecutarlo

Necesita un servidor local (el navegador no permite leer `datos.json` con doble clic):

```bash
npx serve .
```

o

```bash
python -m http.server 8000
```

y abrir `http://localhost:8000`.

## Regenerar los datos

```bash
python tools/generar_datos.py ruta/a/parque-vehicular.json
```
