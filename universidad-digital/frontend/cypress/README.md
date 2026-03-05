# Suite E2E Cypress — Universidad Digital

## Arquitectura

```
cypress/
├── e2e/
│   ├── auth/
│   │   ├── login-success.cy.ts       # Login exitoso + contrato API
│   │   ├── login-failure.cy.ts        # Login inválido, vacío, backend caído
│   │   └── session-management.cy.ts   # Token expirado, logout, persistencia sesión
│   ├── navigation/
│   │   ├── authenticated-routes.cy.ts # Dashboard admin, sidebar, métricas
│   │   └── route-protection.cy.ts     # Bloqueo sin auth, roles, 404
│   └── tasks/
│       ├── task-crud.cy.ts            # Crear, toggle, eliminar
│       ├── task-confirmation.cy.ts    # Validación visual + API + persistencia
│       ├── task-visualization.cy.ts   # Lista, estado vacío, loading, UI
│       ├── task-resilience.cy.ts      # Backend caído, 500, timeout, corrupto
│       └── task-integration.cy.ts     # Flujo completo contra API real
├── fixtures/
│   ├── users.json                     # Credenciales por rol
│   ├── tasks.json                     # Datos de tareas
│   ├── auth-responses.json            # Respuestas mock de auth
│   ├── dashboard-metrics.json         # Métricas del dashboard
│   └── error-responses.json           # Payloads de error estándar
├── support/
│   ├── e2e.ts                         # Configuración global + imports
│   ├── index.d.ts                     # Tipos TypeScript para comandos
│   ├── commands/
│   │   ├── auth.commands.ts           # mockAuthApi, loginAsAdminSession
│   │   ├── task.commands.ts           # mockTaskApi, createTaskViaUI
│   │   └── common.commands.ts         # assertApiResponse, assertJsonBodyKeys
│   ├── helpers/
│   │   ├── constants.ts               # API endpoints, rutas, selectores
│   │   ├── api-assertions.ts          # Funciones de aserción de API
│   │   └── interceptors.ts            # Fábricas de interceptores
│   └── page-objects/
│       ├── LoginPage.ts               # Interacciones página login
│       ├── DashboardPage.ts           # Interacciones dashboard admin
│       └── TasksPage.ts               # Interacciones página tareas
└── tsconfig.json
```

## Configuración de entorno

### Variables de entorno

| Variable                 | Default                 | Descripción              |
| ------------------------ | ----------------------- | ------------------------ |
| `CYPRESS_BASE_URL`       | `http://127.0.0.1:3000` | URL del frontend         |
| `CYPRESS_API_URL`        | `http://127.0.0.1:8000` | URL del backend          |
| `CYPRESS_ADMIN_EMAIL`    | `admin@universidad.com` | Email del admin          |
| `CYPRESS_ADMIN_PASSWORD` | `password123456`        | Password del admin       |
| `CYPRESS_RUN_REAL_API`   | `false`                 | Ejecutar contra API real |

### Archivo `cypress.env.json` (opcional, gitignored)

```json
{
  "apiUrl": "http://127.0.0.1:8000",
  "adminEmail": "admin@universidad.com",
  "adminPassword": "password123456",
  "runAgainstRealApi": false
}
```

## Instrucciones de ejecución

### Modo interactivo (Cypress GUI)

```bash
npm run cy:open
```

### Ejecución completa (headless)

```bash
npm run cy:run
```

### Con Chrome

```bash
npm run cy:run:chrome
```

### Con Edge

```bash
npm run cy:run:edge
```

### Con Edge headed (visible)

```bash
npm run cy:run:edge:headed
```

### Solo tests de integración (API real)

```bash
npm run cy:run:integration
```

### Ejecución directa con variables

```bash
CYPRESS_RUN_REAL_API=true npx cypress run --spec "cypress/e2e/tasks/task-integration.cy.ts"
```

### Ejecución por carpeta

```bash
npx cypress run --spec "cypress/e2e/auth/**/*.cy.ts"
npx cypress run --spec "cypress/e2e/tasks/**/*.cy.ts"
npx cypress run --spec "cypress/e2e/navigation/**/*.cy.ts"
```

## Cobertura del suite

### Autenticación (8 tests)

- Login exitoso con validación de contrato API
- Redirect si ya autenticado
- Credenciales inválidas (401)
- Campos vacíos (validación Zod frontend)
- Password < 8 caracteres
- Backend caído (network error)
- Múltiples intentos fallidos
- Token expirado → redirect login
- Logout desde sidebar
- Persistencia de sesión al recargar

### Navegación (8 tests)

- Dashboard admin con métricas correctas
- Navegación sidebar sin perder sesión
- Acceso directo a página de tareas
- Bloqueo sin autenticación
- Bloqueo por rol (estudiante → /admin)
- Bloqueo por rol (docente → /admin)
- Página 404 para rutas inexistentes
- Acceso permitido a rutas del rol

### Tareas CRUD (5 tests)

- Crear tarea válida + contrato API completo
- Rechazar tarea vacía (validación frontend)
- Rechazar tarea con espacios en blanco
- Toggle completar/descompletar
- Eliminar tarea

### Confirmación (5 tests)

- Confirmación visual post-creación
- Confirmación por API (respuesta = UI)
- Persistencia post-reload
- Persistencia estado completado
- Lista múltiple con datos correctos

### Visualización (7 tests)

- Estado vacío
- Lista precargada
- Indicador de carga
- Estructura de cada item (checkbox + título + eliminar)
- Diferencia visual completada vs pendiente
- Refresco mantiene estado
- Formulario siempre visible

### Resiliencia (11 tests)

- Network error en GET /tasks
- Network error en POST /tasks
- Error 500 en POST → redirect /500
- Error 500 en GET → redirect /500
- Backend lento GET (2.5s)
- Backend lento POST (2.5s)
- JSON corrupto
- Respuesta parcial sin campos
- Error de validación 422
- Crear + eliminar consistencia
- Crear + completar + recargar consistencia

### Integración real (1 test, skip sin API)

- Flujo completo: login → crear → API → persistencia → cleanup

**Total: ~45 escenarios E2E**

## Principios de diseño

- **Waits inteligentes**: `cy.wait("@alias")` en lugar de `cy.wait(5000)`
- **Validación triple**: UI + API + datos en cada test
- **Interceptores modulares**: store en memoria que simula backend real
- **Page Objects**: encapsulan selectores y evitan duplicación
- **Comandos reutilizables**: `mockAuthApi`, `mockTaskApi` configurables
- **Fixtures dinámicos**: datos centralizados y reutilizables
- **Limpieza entre tests**: `beforeEach` resetea cookies/storage
- **Retry automático**: `runMode: 2` retries en CI
- **Escalable**: agregar nuevos tests solo requiere nuevo `.cy.ts`
