# CLAUDE.md

Contexto para Claude Code al trabajar en este repositorio.

## Sobre el proyecto

Dashboard estático (HTML/CSS/JS, sin build ni dependencias) para evaluación
de mercado y gestión de productos/marcas. Ver `README.md` para detalles
funcionales y estructura de carpetas.

## Convención de commits

Usar [Conventional Commits](https://www.conventionalcommits.org/) en español:

```
tipo: descripción corta en minúscula, sin punto final
```

Tipos permitidos:

-   `feat`: nueva funcionalidad
-   `fix`: corrección de un bug
-   `docs`: cambios de documentación (README, comentarios largos, etc.)
-   `style`: cambios de formato/estilo que no afectan lógica (espacios, CSS)
-   `refactor`: cambio de código que no agrega funcionalidad ni corrige bugs
-   `chore`: mantenimiento (dependencias, configuración, `.gitignore`, etc.)

Ejemplos:

```
feat: agrega filtro por departamento en módulo 3WH
fix: corrige cálculo de participación de mercado en módulo 2WH
docs: actualiza instrucciones de ejecución en README
```

Reglas:

-   Un commit = un cambio lógico. No mezclar features distintas en un commit.
-   Cuerpo del commit (opcional, tras línea en blanco) explica el *por qué*,
    no el *qué* (el diff ya muestra el qué).
-   No usar mensajes genéricos como "cambios", "actualización", "fix" a secas.

## Ramas

-   `main`: siempre debe quedar en estado funcional/desplegable.
-   Trabajo nuevo en ramas descriptivas: `feat/nombre-corto`,
    `fix/nombre-corto`, `docs/nombre-corto`.

## Antes de hacer commit

-   Revisar `git status` y `git diff` para confirmar que solo se incluyen los
    archivos/cambios relacionados con ese commit.
-   No commitear archivos generados, temporales o de sistema (ver `.gitignore`).
