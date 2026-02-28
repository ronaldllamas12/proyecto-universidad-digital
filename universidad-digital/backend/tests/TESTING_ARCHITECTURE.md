# Sistema de Pruebas — Universidad Digital (Backend)

## 1) Alcance y supuestos del sistema

El backend implementa actualmente: autenticación, usuarios, roles, materias (cursos), periodos, matrículas, calificaciones, dashboard y API REST con SQLAlchemy.

Para cumplir un enfoque empresarial completo, se propone extender en iteraciones futuras:

- **Pagos**: módulo `app/payments` (servicios, rutas, modelos, reconciliación).
- **Reportes**: módulo `app/reports` (agregaciones, exportaciones, analítica).

Mientras esos módulos no existan, sus pruebas quedan en el plan de crecimiento (no se inventa código productivo inexistente).

## 2) Pirámide de testing aplicada

- **Unit tests** (`tests/unit`): lógica pura, validaciones, seguridad, errores, sin BD/red.
- **Integration tests** (`tests/integration`): servicios + modelos + BD temporal SQLite compartida.
- **E2E tests** (`tests/e2e`): flujo real por API con `httpx.AsyncClient` sin mocks internos.

## 3) Estructura de carpetas

- `tests/unit`: pruebas rápidas de funciones/lógica aislada.
- `tests/integration`: pruebas de integración de servicios y persistencia.
- `tests/e2e`: pruebas de recorrido funcional del usuario.
- `tests/fixtures`: ubicación reservada para fixtures especializados reutilizables.
- `tests/factories`: ubicación reservada para factories modulares por dominio.
- `tests/data`: datasets JSON/CSV para escenarios reproducibles.

## 4) Buenas prácticas obligatorias implementadas

- Patrón **AAA** (Arrange-Act-Assert).
- Convenciones de nombres descriptivas (`test_<acción>_<resultado>`).
- Determinismo e independencia por test (rollback por función).
- Sin estado compartido mutable entre casos.
- Fixtures por scope apropiado.
- Parametrización (`@pytest.mark.parametrize`).
- Uso de markers (`unit`, `integration`, `e2e`, `security`, `db`, etc.).
- Uso de `monkeypatch` y `Mock` en unit tests.
- Uso de factories para datos persistibles.

## 5) Fixtures profesionales (y scope recomendado)

En `tests/conftest.py`:

- `db` (**function**): sesión aislada con transacción rollback.
- `api_client` (**function**): cliente HTTP async para API.
- `authorized_client` (**function**): cliente autenticado admin.
- `authenticated_headers` (**function**): headers `Authorization` listos.
- `valid_user_payload` (**function**), `invalid_user_payload` (**function**), `course_payload` (**function**), `enrollment_payload` (**function**): datos de entrada controlados.
- `create_test_database` (**session**): crea y destruye esquema una sola vez.

## 6) Cobertura de casos

Cada módulo debe incluir:

- **Normales**: éxito esperado con datos válidos.
- **Límite**: vacío, mínimo/máximo, transiciones de estado.
- **Inválidos**: tipos incorrectos, valores inconsistentes, duplicados.
- **Seguridad**: permisos, token inválido/revocado, acceso indebido.

## 7) Cobertura y configuración

- `pytest.ini` define ejecución y `--cov-fail-under=85`.
- `pyproject.toml` define configuración de `coverage` y `ruff`.
- Meta mínima activa: **85%**.

## 8) CI empresarial

Flujo en `.github/workflows/backend-ci.yml`:

1. Instala dependencias.
2. Ejecuta lint (`ruff`).
3. Ejecuta tests (`pytest`).
4. Falla automáticamente si cobertura global < 85%.

## 9) Gestión de datos de prueba

- Faker/factory-boy para variabilidad controlada.
- Seeds reproducibles cuando aplique (en datasets de `tests/data`).
- Evitar hardcode agresivo fuera de escenarios explícitos.
- Preferir builders/factories y fixtures sobre datos repetidos en cada test.

## 10) Mapa académico-profesional (resultado esperado)

Este backend ya incluye ejemplos reales de:

- unit testing con `monkeypatch`, `Mock` y parametrización.
- integration testing con BD temporal y servicios.
- e2e de flujo funcional por API.

Para completar el objetivo “universidad digital full” (incluyendo pagos/reportes), la siguiente iteración recomendada es agregar `app/payments` y `app/reports` con sus contratos y su suite en las tres capas de la pirámide.
