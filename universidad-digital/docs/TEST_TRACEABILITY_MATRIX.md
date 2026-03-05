# Matriz de trazabilidad requisito → test

## Objetivo

Proveer trazabilidad explícita entre requisitos funcionales/riesgos y suites de pruebas, incluyendo criterio de entrada/salida por escenario.

## Criterios de entrada/salida (globales)

- Entrada mínima:
  - Dependencias instaladas (`backend/requirements.txt`, `frontend/package.json`).
  - Variables de entorno de test configuradas (`frontend/cypress.env.json` basado en `cypress.env.example.json`).
  - Workflows de calidad disponibles en `.github/workflows/*`.
- Salida mínima:
  - Suites críticas ejecutadas sin fallos bloqueantes.
  - Gates de cobertura y estabilidad en verde.
  - Evidencia registrada en reportes/artefactos de CI.

## Matriz

| ID          | Requisito/Riesgo                                         | Tipo                  | Criterio de entrada                                          | Criterio de salida                                                                      | Evidencia de tests                                                                                                                                                                                                                                           |
| ----------- | -------------------------------------------------------- | --------------------- | ------------------------------------------------------------ | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| RQ-AUTH-001 | Login válido/invalidado y sesión segura                  | Funcional/Seguridad   | Usuario de prueba activo y endpoint `/auth/login` disponible | Login válido retorna token; inválido retorna 401; sesión se mantiene/expira según flujo | `backend/tests/integration/test_auth_api.py`, `frontend/cypress/e2e/auth/login-success.cy.ts`, `frontend/cypress/e2e/auth/login-failure.cy.ts`, `frontend/cypress/e2e/auth/session-management.cy.ts`                                                         |
| RQ-RBAC-002 | Control de acceso por rol (Admin/Docente/Estudiante)     | Seguridad             | Roles base cargados y rutas protegidas expuestas             | Acceso permitido solo a rol autorizado; acceso indebido redirige o falla 403/401        | `backend/tests/integration/test_users_api.py`, `backend/tests/integration/test_grades_api.py`, `frontend/cypress/e2e/navigation/route-protection.cy.ts`, `frontend/tests/unit/ProtectedRoute.unit.test.tsx`                                                  |
| RQ-USR-003  | CRUD de usuarios y roles                                 | Negocio               | `GET /users` y `GET /roles` operativos                       | Crear/actualizar usuario exitoso; conflictos detectados; roles asignables/removibles    | `backend/tests/unit/test_unit_users_services.py`, `backend/tests/integration/test_users_api.py`, `frontend/cypress/e2e/users/user-management.cy.ts`                                                                                                          |
| RQ-SUBJ-004 | Gestión de materias (crear/actualizar/desactivar)        | Negocio               | Endpoint `/subjects` disponible con auth admin               | Materia válida persiste; inválida rechazada; update/desactivación consistente           | `backend/tests/unit/test_unit_subjects_services.py`, `backend/tests/integration/test_subjects_services.py`, `frontend/cypress/e2e/subjects/subject-management.cy.ts`                                                                                         |
| RQ-PER-005  | Gestión de periodos y reglas de fechas                   | Negocio               | Endpoint `/periods` disponible con auth admin                | Periodo válido creado/actualizado; validaciones de fechas activas                       | `backend/tests/unit/test_unit_periods_services.py`, `backend/tests/integration/test_periods_services.py`, `frontend/cypress/e2e/periods/period-management.cy.ts`                                                                                             |
| RQ-ENR-006  | Inscripciones consistentes (alumno-materia-periodo)      | Negocio/Integridad    | Entidades relacionadas existentes (user, subject, period)    | Inscripción válida creada; duplicados y conflictos detectados                           | `backend/tests/unit/test_unit_enrollments_services.py`, `backend/tests/integration/test_enrollments_services.py`, `frontend/cypress/e2e/enrollments/enrollment-flow.cy.ts`                                                                                   |
| RQ-GRD-007  | Calificaciones con restricciones por rol                 | Negocio/Seguridad     | Enrollment activo y actor autorizado                         | Crear/editar/borrar nota autorizado; masking para admin; no autorizado falla            | `backend/tests/unit/test_unit_grades_services.py`, `backend/tests/integration/test_grades_api.py`, `frontend/cypress/e2e/auth/session-management.cy.ts`                                                                                                      |
| RQ-DSH-008  | Dashboards por rol con métricas coherentes               | Funcional             | Endpoints `/dashboard/*` disponibles                         | Carga de métricas correcta por rol, sin fuga de datos                                   | `backend/tests/unit/test_unit_dashboard_services.py`, `backend/tests/integration/test_dashboard_services.py`, `frontend/cypress/e2e/navigation/authenticated-routes.cy.ts`                                                                                   |
| RQ-TASK-009 | Gestión de tareas (CRUD + resiliencia UI)                | Funcional/Resiliencia | Rutas admin accesibles y mocks API activos                   | CRUD consistente; errores de red/control de estados manejados                           | `frontend/tests/functional/Tasks.functional.test.tsx`, `frontend/cypress/e2e/tasks/task-crud.cy.ts`, `frontend/cypress/e2e/tasks/task-resilience.cy.ts`                                                                                                      |
| RQ-QG-010   | Calidad de build (coverage, mantenibilidad, estabilidad) | Calidad/Operación     | Workflows CI habilitados                                     | Gates y SLO pasan (coverage, debt, flakiness, performance smoke)                        | `.github/workflows/backend-ci.yml`, `.github/workflows/frontend-ci.yml`, `.github/workflows/test-maintainability.yml`, `.github/workflows/test-stability-slo.yml`, `.github/workflows/performance-smoke.yml`, `.github/workflows/quality-gate-fullstack.yml` |

## Uso operativo

- Al añadir una nueva historia/requisito, crear un nuevo ID `RQ-*` y enlazar al menos 1 test por capa relevante.
- En PR, actualizar esta matriz cuando cambie cobertura funcional o riesgo.
- En release, usar esta matriz como evidencia de cierre para `GO/NO-GO`.
