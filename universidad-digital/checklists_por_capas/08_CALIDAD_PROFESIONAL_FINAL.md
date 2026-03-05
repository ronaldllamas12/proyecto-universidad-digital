# Capa 8 — Calidad profesional final

## Sistema de pruebas

- [✅] Detecta errores reales si el sistema se rompe
  - Evidencia: pruebas de permisos, errores de red, flujos CRUD y contrato API.
- [✅] Sirve para refactorizar sin miedo
  - Evidencia: cobertura amplia por capas (unit/integration/e2e, interaction/functional).
- [✅] Podría ejecutarse en integración continua
  - Evidencia: workflows backend + scripts automatizados frontend (`test`, `cy:run`, etc.).
- [✅] Tiene valor en un entorno empresarial
  - Evidencia: validación de seguridad/roles, contratos API y flujos completos.
- [✅] No es solo para pasar la materia
  - Evidencia: existen gates de calidad en CI, política de gobernanza IA, plantilla obligatoria de revisión humana y métricas de mantenibilidad automatizadas.

## Ampliación (nivel profesional)

- [✅] Existe puerta mínima de calidad automatizada
  - Evidencia: gate de cobertura backend, gate de cobertura frontend y workflow unificado full-stack.
- [✅] Existe SLO de estabilidad del suite (flake rate) medido
  - Evidencia: política SLO en `docs/TEST_STABILITY_SLO.md` + medición periódica en `.github/workflows/test-stability-slo.yml` con artefacto `stability-report.md` y umbral <= 2%.
- [✅] Existe consolidación de reporte full-stack en pipeline único
  - Evidencia: `.github/workflows/quality-gate-fullstack.yml` integra backend, frontend y mantenibilidad.

## Resultado capa

- Cumplimiento estimado: **100%**
- Conteo: **8 ✅ / 0 ❌ / 0 ⚠️**
