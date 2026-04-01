from __future__ import annotations

from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.types import ASGIApp, Message, Receive, Scope, Send

from app.core.config import settings
from app.core.database import SessionLocal, init_db
from app.core.errors import AppError, ConflictError, ForbiddenError, NotFoundError, UnauthorizedError
from app.roles.services import ensure_default_roles
from app.auth.routes import router as auth_router
from app.enrollments.routes import router as enrollments_router
from app.grades.routes import router as grades_router
from app.periods.routes import router as periods_router
from app.roles.routes import router as roles_router
from app.subjects.routes import router as subjects_router
from app.users.routes import router as users_router
from app.dashboard.router import router as dashboard_router


SECURITY_RESPONSE_HEADERS: tuple[tuple[str, str], ...] = (
    ("x-content-type-options", "nosniff"),
    ("x-frame-options", "DENY"),
    ("referrer-policy", "no-referrer"),
    ("content-security-policy", "default-src 'self'"),
    ("strict-transport-security", "max-age=63072000; includeSubDomains; preload"),
)


class SecurityHeadersMiddleware:
    """Attach security headers to all HTTP responses at ASGI level."""

    def __init__(self, app: ASGIApp) -> None:
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope.get("type") != "http":
            await self.app(scope, receive, send)
            return

        async def send_with_security_headers(message: Message) -> None:
            if message.get("type") == "http.response.start":
                headers = list(message.get("headers", []))
                present_names = {name.lower() for name, _ in headers}
                for header_name, header_value in SECURITY_RESPONSE_HEADERS:
                    encoded_name = header_name.encode("latin-1")
                    if encoded_name not in present_names:
                        headers.append((encoded_name, header_value.encode("latin-1")))
                message["headers"] = headers

            await send(message)

        await self.app(scope, receive, send_with_security_headers)



@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
    db = SessionLocal()
    try:
        ensure_default_roles(db)
    finally:
        db.close()
    yield


app = FastAPI(title=settings.api_title, version=settings.api_version, lifespan=lifespan)

if settings.is_production:
    if not settings.jwt_secret:
        raise RuntimeError("APP_JWT_SECRET es obligatorio en producción.")
    if not settings.cors_origins:
        raise RuntimeError("APP_CORS_ORIGINS es obligatorio en producción.")
    settings.cookie_secure = True

allowed_origins = settings.cors_origins or [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173","https://proyecto-universidad-digital.onrender.com",
    "https://universidad-digital.onrender.com",
    "https://proyecto-universidad-digital-backen.vercel.app",
    "https://proyecto-universidad-digital-zj37.vercel.app"
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)
app.add_middleware(SecurityHeadersMiddleware)

@app.get("/")
def root():
    return {"status": "ok", "message": "API funcionando 🚀"}

@app.get("/_meta/security-policy", tags=["meta"])
def security_policy_metadata() -> dict[str, object]:
    return {
        "security_headers": {name: value for name, value in SECURITY_RESPONSE_HEADERS},
        "middleware": "SecurityHeadersMiddleware",
        "environment": settings.env,
    }


@app.exception_handler(NotFoundError)
def not_found_handler(request: Request, exc: NotFoundError) -> JSONResponse:
    return JSONResponse(status_code=404, content={"detail": exc.message})


@app.exception_handler(ConflictError)
def conflict_handler(request: Request, exc: ConflictError) -> JSONResponse:
    return JSONResponse(status_code=409, content={"detail": exc.message})


@app.exception_handler(UnauthorizedError)
def unauthorized_handler(request: Request, exc: UnauthorizedError) -> JSONResponse:
    return JSONResponse(status_code=401, content={"detail": exc.message})


@app.exception_handler(ForbiddenError)
def forbidden_handler(request: Request, exc: ForbiddenError) -> JSONResponse:
    return JSONResponse(status_code=403, content={"detail": exc.message})


@app.exception_handler(AppError)
def app_error_handler(request: Request, exc: AppError) -> JSONResponse:
    return JSONResponse(status_code=400, content={"detail": exc.message})


@app.exception_handler(RequestValidationError)
def validation_error_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    normalized_errors: list[dict[str, Any]] = []
    for item in exc.errors():
        normalized = dict(item)
        ctx = normalized.get("ctx")
        if isinstance(ctx, dict) and "error" in ctx:
            safe_ctx = dict(ctx)
            safe_ctx["error"] = str(safe_ctx["error"])
            normalized["ctx"] = safe_ctx
        normalized_errors.append(normalized)
    return JSONResponse(status_code=422, content={"detail": normalized_errors})


app.include_router(auth_router)
app.include_router(users_router)
app.include_router(roles_router)
app.include_router(subjects_router)
app.include_router(periods_router)
app.include_router(enrollments_router)
app.include_router(grades_router)
app.include_router(dashboard_router)
