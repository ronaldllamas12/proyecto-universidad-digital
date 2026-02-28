# Frontend Testing Architecture — Universidad Digital

## Principio rector

Mientras más se parezca al uso real del usuario, más confiable es el test.

## Stack de pruebas

- Vitest
- React Testing Library
- user-event

## Estructura del proyecto de pruebas

- `tests/setup`: configuración global de pruebas y matchers.
- `tests/unit`: comportamiento aislado del componente (render, accesibilidad, estado inicial).
- `tests/interaction`: interacción real de usuario (`type`, `click`, `keyboard`, `tab`).
- `tests/functional`: flujos completos de UI con estado y re-render.
- `tests/fixtures`: datos de prueba reutilizables, edge-cases y payloads simulados.

## Qué valida cada capa

### Unit behavior

- Render inicial observable.
- Roles accesibles (`textbox`, `button`, `list`, `listitem`, `checkbox`).
- Estado vacío y render condicional.

### Interaction

- Escribir texto y enviar formulario.
- Submit por click y por Enter.
- Toggle de completado.
- Eliminación por botón.
- Estado async de submit (botón deshabilitado).

### Functional UI

- Tarea agregada aparece en lista.
- Marcado completado cambia estilo.
- Eliminar tarea re-renderiza lista.
- Carga de tareas simuladas con `vi.mock` (datos de servidor).

## Mocking: cuándo usar `vi.fn()` y `vi.mock()`

- `vi.fn()`: para callbacks locales (`onCreateTask`, `onToggleTask`, `onDeleteTask`) y verificar invocaciones.
- `vi.mock()`: para reemplazar módulos externos/servicios (por ejemplo, `fetchTasksFromServer`) y controlar escenarios de datos.

## Buenas prácticas aplicadas

- Patrón Arrange-Act-Assert.
- `screen` en lugar de `container`.
- Queries por rol y nombre accesible primero.
- `await` en interacciones de `userEvent`.
- Casos de borde incluidos: vacío, espacios, texto largo, múltiples submits.
- Tests independientes y deterministas.

## Accesibilidad validada

- Labels asociados (`label` + `htmlFor`).
- Inputs y botones encontrados por rol + nombre accesible.
- Navegación por teclado (`tab`, `Enter`).
- Mensajes de error con `role="alert"`.

## Configuración de entorno

- `vitest.config.ts`
  - `environment: "jsdom"`
  - `setupFiles: ["./tests/setup/setupTests.ts"]`
  - cobertura enfocada en componentes.
- `tests/setup/setupTests.ts`
  - `@testing-library/jest-dom/vitest`
  - `cleanup()` tras cada test.

## Uso de IA como copiloto (prompts útiles)

### Generar casos faltantes

"Revisa este test de React Testing Library y propón 5 casos edge orientados a comportamiento observable del usuario, evitando estado interno."

### Detectar huecos de cobertura

"Analiza estos archivos de tests de TaskForm/TaskList y enumera comportamientos no cubiertos por rol/keyboard/a11y."

### Simplificar tests largos

"Refactoriza este test manteniendo AAA, removiendo duplicación y mejorando legibilidad sin cambiar assertions funcionales."

### Refactorizar fixtures repetidos

"Extrae datos repetidos de estos tests a fixtures reutilizables y aplica nombres orientados a intención del usuario."

## Nota académica

Este sistema es un modelo profesional para frontend behavior testing. Si se incorporan nuevas pantallas, repetir la misma pirámide: unit + interaction + functional, priorizando accesibilidad y flujo de usuario.
