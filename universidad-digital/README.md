## Universidad Digital

API y frontend para gestión académica universitaria con FastAPI y React.

### Backend

Estructura por dominio (SRP):

```
backend/app/
├── core/
├── users/
├── roles/
├── subjects/
├── periods/
├── enrollments/
└── grades/
```

Cada dominio incluye `models.py`, `schemas.py`, `services.py` y `routes.py`.

### Endpoints principales

```
GET/POST    /users
GET/PUT     /users/{id}
DELETE      /users/{id}

GET/POST    /roles
GET/PUT     /roles/{id}
DELETE      /roles/{id}

GET/POST    /subjects
GET/PUT     /subjects/{id}
DELETE      /subjects/{id}

GET/POST    /periods
GET/PUT     /periods/{id}
DELETE      /periods/{id}

GET/POST    /enrollments
GET/PUT     /enrollments/{id}
DELETE      /enrollments/{id}

GET/POST    /grades
GET/PUT     /grades/{id}
DELETE      /grades/{id}
```

### Requisitos

Instalar dependencias desde `backend/requirements.txt`.

### Ejecutar en localhost

1. Backend:
   - Copiar `backend/.env.example` a `backend/.env` y ajustar credenciales de DB.
   - Instalar dependencias:
     - `cd backend`
     - `pip install -r requirements.txt`
   - Levantar API:
     - `uvicorn app.main:app --reload --host 127.0.0.1 --port 8000`

2. Frontend:
   - Copiar `frontend/.env.example` a `frontend/.env.local`.
   - Instalar dependencias y arrancar:
     - `cd frontend`
     - `npm install`
     - `npm run dev`

Con esto abres el frontend en `http://localhost:5173` apuntando al backend local `http://127.0.0.1:8000`.

### Deploy en Render (y mantener localhost)

Este repositorio ya incluye `render.yaml` para desplegar:

- `universidad-digital-api` (FastAPI)
- `universidad-digital-frontend` (sitio estático Vite)
- `universidad-digital-db` (PostgreSQL)

Pasos:

1. En Render, crear servicio usando **Blueprint** y seleccionar este repo.
2. Render detecta `render.yaml` y crea backend, frontend y base de datos.
3. En el servicio backend, configurar secretos:
   - `APP_JWT_SECRET`
   - `APP_CORS_ORIGINS` con JSON de orígenes permitidos, por ejemplo:
     - `["https://universidad-digital-frontend.onrender.com","http://localhost:5173","http://127.0.0.1:5173"]`
4. En el servicio frontend, verificar `VITE_API_BASE_URL` con la URL real del backend Render.

### Trabajar en ambos entornos sin cambiar código

- Local: usar `frontend/.env.local` con `VITE_API_BASE_URL=http://127.0.0.1:8000`.
- Render: usar variable del servicio frontend `VITE_API_BASE_URL=https://<tu-backend>.onrender.com`.

Así puedes abrir localmente en `localhost` y también tener producción en Render al mismo tiempo.
