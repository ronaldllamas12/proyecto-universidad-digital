# Universidad Digital

Plataforma fullstack para gestión académica universitaria, con backend en FastAPI + SQLAlchemy y frontend en React + Vite + TypeScript.

Incluye:

- Arquitectura por dominios (usuarios, roles, materias, periodos, inscripciones, calificaciones, dashboard).
- Autenticación y autorización por roles.
- Tests backend y frontend con umbrales de cobertura.
- CI/CD con GitHub Actions.
- Despliegue en Render (backend + DB) y Vercel/Render static (frontend).

---

## 1. Arquitectura General

### Backend (`backend/`)

- FastAPI, SQLAlchemy 2, Pydantic Settings.
- Seguridad aplicada: JWT, cookies HttpOnly, CORS por entorno, headers de seguridad.
- Inicialización automática de roles base y usuario admin seed al arrancar.
- Módulos principales:

```text
backend/app/
├── auth/
├── core/
├── dashboard/
├── enrollments/
├── grades/
├── periods/
├── roles/
├── subjects/
├── teacher_assignments/
└── users/
```

### Frontend (`frontend/`)

- React 18 + TypeScript + Vite.
- React Router, React Hook Form + Zod, Axios.
- Pruebas con Vitest + Testing Library + Cypress.
- Puerto local configurado por defecto: `3000`.

---

## 2. Estructura del Repositorio

```text
universidad-digital/
├── backend/                     # API, modelos, servicios, tests backend
├── frontend/                    # App React, tests frontend y Cypress
├── checklists_por_capas/        # Checklists de calidad y evaluación
├── docs/                        # Documentación técnica y reportes
├── README.md                    # Este documento
├── README_TEST.md               # Guía de validación manual backend
├── README_FRONTEND.md           # Guía frontend
└── README_TEST_FRONT.md         # Guía manual fullstack
```

Archivos de infraestructura en la raíz del workspace:

- `docker-compose.yml`
- `render.yaml`
- `.github/workflows/*`

---

## 3. Requisitos

### Opción local (sin Docker)

- Python 3.12
- Node.js 20+
- PostgreSQL 15+

### Opción contenedores

- Docker + Docker Compose

---

## 4. Variables de Entorno

### Backend (`backend/.env`)

La configuración usa prefijo `APP_`, con soporte adicional para `DATABASE_URL` en despliegue.

Ejemplo mínimo:

```env
APP_ENV=development
APP_DATABASE_URL=postgresql+psycopg://postgres:admin@localhost:5433/universidad
APP_JWT_SECRET=change_me
APP_CORS_ORIGINS=["http://localhost:3000","http://127.0.0.1:3000"]
APP_COOKIE_SAMESITE=lax

# seed inicial (si no existen)
APP_SEED_ADMIN_EMAIL=admin@universidad.edu
APP_SEED_ADMIN_PASSWORD=Admin1234567!
APP_SEED_ADMIN_NAME=Administrador
```

Notas:

- En producción, `APP_JWT_SECRET` y orígenes CORS deben estar configurados.
- Si existe `DATABASE_URL`, se usa como prioridad para conexión.

### Frontend (`frontend/.env`)

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

Para Cypress, usar como referencia `frontend/cypress.env.example.json`.

### Mailtrap para recuperación de contraseña

Para que `POST /auth/forgot-password` envíe correo real, configura SMTP con Mailtrap en `backend/.env`:

```env
APP_SMTP_HOST=sandbox.smtp.mailtrap.io
APP_SMTP_PORT=587
APP_SMTP_USERNAME=<tu_user_mailtrap>
APP_SMTP_PASSWORD=<tu_password_mailtrap>
APP_SMTP_FROM_EMAIL=no-reply@universidad-digital.local
APP_SMTP_FROM_NAME=Universidad Digital
APP_SMTP_USE_TLS=true
APP_SMTP_USE_SSL=false
APP_SMTP_TIMEOUT_SECONDS=10
APP_FRONTEND_RESET_PASSWORD_URL=http://localhost:3000/forgot-password
```

Flujo esperado:

1. El usuario envía su correo institucional en `/auth/forgot-password`.
2. Backend genera token de recuperación y envía enlace por correo (Mailtrap).
3. El enlace llega a `/forgot-password#token=...` en frontend.
4. Frontend canjea token con `/auth/reset-password/exchange` y restablece con `/auth/reset-password`.

#### Variante producción (Mailtrap Live SMTP)

Para ambientes productivos, usa credenciales del servicio Live SMTP de Mailtrap (no Sandbox):

```env
APP_SMTP_HOST=live.smtp.mailtrap.io
APP_SMTP_PORT=587
APP_SMTP_USERNAME=<tu_live_user_mailtrap>
APP_SMTP_PASSWORD=<tu_live_password_mailtrap>
APP_SMTP_FROM_EMAIL=no-reply@tu-dominio.com
APP_SMTP_FROM_NAME=Universidad Digital
APP_SMTP_USE_TLS=true
APP_SMTP_USE_SSL=false
APP_SMTP_TIMEOUT_SECONDS=10
APP_FRONTEND_RESET_PASSWORD_URL=https://tu-frontend.com/forgot-password
```

Notas de producción:

- No activar `APP_SMTP_USE_TLS` y `APP_SMTP_USE_SSL` al mismo tiempo.
- Si usas puerto `465`, normalmente corresponde `APP_SMTP_USE_SSL=true` y `APP_SMTP_USE_TLS=false`.
- Define `APP_FRONTEND_RESET_PASSWORD_URL` con URL publica real del frontend.

#### Prueba en 2 minutos (end-to-end)

1. Configura variables SMTP en `backend/.env` y reinicia backend.
2. Entra a Mailtrap y deja abierta la inbox (Sandbox o Live, segun entorno).
3. En `http://127.0.0.1:8000/docs`, ejecuta `POST /auth/forgot-password` con un email institucional existente.
4. Abre el correo recibido en Mailtrap y copia el enlace de recuperacion.
5. Abre el enlace en navegador, define nueva contraseña y valida login con `POST /auth/login`.

Payload rapido para `POST /auth/forgot-password`:

```json
{
  "email": "admin@universidad.edu"
}
```

---

## 5. Ejecución Rápida con Docker (Recomendada)

Desde la raíz del workspace:

```bash
docker compose up -d --build
```

Servicios y puertos:

- Backend API: `http://localhost:8000`
- Frontend: `http://localhost:3000`
- PostgreSQL: `localhost:5433`

Volúmenes persistentes:

- `postgres_data`: datos de PostgreSQL.
- `pg_backups`: backups automáticos diarios (retención 7 días).
- `backend_data`: datos del backend en `/app/data`.
- `backend_logs`: logs del backend en `/app/logs`.
- `frontend_node_modules`: dependencias del frontend en contenedor.

Comandos útiles:

```bash
# detener sin borrar datos
docker compose down

# detener y borrar volúmenes
docker compose down -v

# listar backups
docker compose exec db_backup ls -lh /backups
```

Restore (ejemplo):

```bash
docker compose exec -T db sh -lc "psql -U postgres -d universidad < /tmp/restore.sql"
```

---

## 6. Ejecución Local Manual

### 6.1 Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Documentación interactiva API:

- `http://127.0.0.1:8000/docs`

### 6.2 Frontend

```bash
cd frontend
npm install
npm run dev
```

Aplicación frontend:

- `http://localhost:3000`

---

## 7. API y Dominios Principales

Rutas principales (CRUD y flujos):

- `auth` (`/auth/login`, `/auth/me`, `/auth/logout`, recuperación de contraseña)
- `users` (`/users`)
- `roles` (`/roles`)
- `subjects` (`/subjects`)
- `periods` (`/periods`)
- `enrollments` (`/enrollments`)
- `grades` (`/grades`)
- `dashboard` (`/dashboard`)

Las reglas de autorización combinan:

- RBAC por rol (`Administrador`, `Docente`, `Estudiante`)
- ownership para acceso a datos propios

---

## 8. Testing y Calidad

### Backend

```bash
cd backend
python -m pytest -q
```

Configuración destacada:

- Cobertura mínima global: `90%` (`--cov-fail-under=90`).
- Marcadores: `unit`, `integration`, `e2e`, `security`, `performance`, `contract`, `concurrency`, etc.
- Scripts de soporte:
  - `scripts/validate_test_datasets.py`
  - `scripts/generate_module_coverage_dashboard.py`
  - `scripts/generate_openapi_contract_baseline.py`
  - `scripts/staging_equivalence_smoke.py`

### Frontend

```bash
cd frontend
npm run test            # Vitest
npm run cy:run          # Cypress E2E (Electron)
npm run cy:run:edge     # Cypress en Edge
```

Scripts relevantes:

- `npm run build`
- `npm run test:watch`
- `npm run test:ui`
- `npm run cy:run:integration`

Guías detalladas:

- `README_TEST.md`
- `README_FRONTEND.md`
- `README_TEST_FRONT.md`

---

## 9. CI/CD (GitHub Actions)

Workflows principales:

- `backend-ci.yml`: lint (`ruff`), validación de datasets y tests backend.
- `frontend-ci.yml`: tests frontend con cobertura.
- `quality-gate-fullstack.yml`: gate unificado backend + frontend + mantenibilidad.
- `cd-render.yml`: despliegue continuo por hooks (Render backend + Vercel frontend) tras quality gate exitoso en `main`.

Otros workflows del proyecto:

- `performance-smoke.yml`
- `staging-equivalence-smoke.yml`
- `test-observability-metrics.yml`
- `test-stability-slo.yml`
- `test-maintainability.yml`

---

## 10. Despliegue en Render/Vercel

El archivo `render.yaml` define:

- Web service Python: `universidad-digital-api`
- Static site: `universidad-digital-frontend`
- Base de datos PostgreSQL: `universidad-digital-db`

Para CD por hooks (GitHub Secrets):

- `RENDER_DEPLOY_HOOK_BACKEND`
- `VERCEL_DEPLOY_HOOK_FRONTEND`

Recomendaciones:

- Usar `environment: production` en workflows de despliegue.
- Proteger la rama `main` y el entorno de producción con reviewers.

---

## 11. Documentación del Proyecto

Además de este README, revisar:

- `docs/TEST_EXECUTION_STRATEGY_FAST_FULL.md`
- `docs/TEST_TRACEABILITY_MATRIX.md`
- `docs/TEST_DATA_ENVIRONMENT_STRATEGY.md`
- `docs/TEST_STABILITY_SLO.md`
- `docs/TEST_OBSERVABILITY_DASHBOARD.md`
- `docs/GO_NO_GO_RELEASE.md`
- `docs/CI_LOCAL_REPRO_GUIDE.md`
- `checklists_por_capas/00_RESUMEN_GENERAL.md`

---

## 12. Troubleshooting Rápido

- Error CORS en local:
  verificar `APP_CORS_ORIGINS` y reiniciar backend.
- Error JWT (`APP_JWT_SECRET no configurado`):
  definir la variable en backend y reiniciar.
- Frontend no conecta API:
  revisar `VITE_API_BASE_URL`.
- Tests E2E inestables por entorno:
  ejecutar primero backend y frontend en puertos esperados (`8000` y `3000`) y limpiar artefactos (`npm run cy:clean`).

---

## 13. Estado del Proyecto

Proyecto fullstack operativo con enfoque académico-profesional:

- backend y frontend desacoplados
- cobertura con umbral de calidad
- automatización de pipeline de calidad y despliegue
- documentación y checklists por capas
