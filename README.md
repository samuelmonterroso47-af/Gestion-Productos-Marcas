# Evaluación de Mercado (3WH)

Este proyecto es un módulo de evaluación de mercado para mototaxis (3WH) que utiliza datos de ventas y estimaciones de la flota para calcular la participación de mercado por municipio. La aplicación proporciona recomendaciones estratégicas basadas en la participación de mercado para guiar las decisiones de negocio.

## Características

-   Visualización de datos de participación de mercado.
-   Filtros dinámicos por municipio.
-   Recomendaciones automáticas basadas en umbrales de participación.
-   Opción de exportar los datos a formato CSV.

## Tecnologías Utilizadas

-   HTML
-   Tailwind CSS
-   JavaScript (ESM)

## Estructura del proyecto

```
.
├── index.html          # Punto de entrada de la aplicación
├── assets/
│   ├── css/
│   │   └── styles.css  # Estilos del dashboard
│   └── js/
│       └── app.js      # Lógica de pestañas y filtros
└── data/
    └── dashboard3wh.db # Datos de referencia del módulo 3WH
```

## Cómo ejecutar el proyecto

Al ser una aplicación estática (HTML, CSS y JS), no requiere instalación de dependencias:

1. Clona el repositorio.
2. Abre `index.html` directamente en tu navegador, o sírvelo con un servidor local, por ejemplo:

```bash
npx serve .
```
