# Capa 3 — Pruebas de componentes (Frontend)

## Comportamiento

- [✅] Se prueba renderizado
  - Evidencia: `frontend/tests/unit/TaskForm.unit.test.tsx`, `TaskList.unit.test.tsx`.
- [✅] Se prueban eventos (click, input, submit)
  - Evidencia: `frontend/tests/interaction/TaskForm.interaction.test.tsx`.
- [✅] Se prueban estados condicionales
  - Evidencia: loading/error/success en `TasksPage.functional.test.tsx`.
- [✅] Se prueban mensajes de error
  - Evidencia: alertas de conectividad y validación.
- [✅] Se prueban props inválidas
  - Evidencia: fallback ante `variant` inválida en `frontend/tests/unit/Button.unit.test.tsx` (`hace fallback seguro cuando recibe variant inválida`).

## Aislamiento

- [✅] APIs están mockeadas
  - Evidencia: `vi.mock("../../src/services/taskService")`.
- [✅] No hay llamadas reales al backend
  - Evidencia: en unit/interaction/functional se usan mocks en service layer.
- [✅] El test no depende de CSS ni estilos visuales
  - Evidencia: assertions por rol/texto y comportamiento.

## Claridad

- [✅] Los tests describen comportamiento del usuario
  - Evidencia: suites `interaction` y `functional` orientadas a flujo.
- [✅] No se prueban detalles internos del componente
  - Evidencia: no hay acceso a estado interno; sólo interfaz pública.
- [✅] Se usan queries semánticas (role, label, text)
  - Evidencia: `getByRole`, `findByRole`, `getByText`, `queryByRole`.

## Ampliación (componentes frontend)

- [✅] Se prueban interacciones de teclado
  - Evidencia: Enter/tab en `TaskForm.interaction.test.tsx`.
- [✅] Hay separación unit/interaction/functional
  - Evidencia: estructura de carpetas dedicada.
- [✅] Existe setup global de pruebas
  - Evidencia: `tests/setup/setupTests.ts` + `vitest.config.ts`.
- [✅] Se limpia el árbol entre tests
  - Evidencia: `cleanup()` en afterEach global.

## Resultado capa

- Cumplimiento estimado: **100%**
- Conteo: **15 ✅ / 0 ❌ / 0 ⚠️**
