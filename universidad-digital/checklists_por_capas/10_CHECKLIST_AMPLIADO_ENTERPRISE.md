# Checklist Ampliado Enterprise — Sistema de Testing

> Objetivo: extender la evaluación más allá de unit/integration/frontend/e2e y cubrir calidad técnica-operativa completa.

---

## 1) Calidad de diseño de casos

- [ ] Cada test tiene objetivo explícito (riesgo o requisito)
- [ ] Existe criterio de entrada/salida por caso
- [ ] Se prueban rutas felices, alternas y error
- [ ] Se prueban bordes de dominio (límites numéricos, vacíos, nulos)
- [ ] Se evita acoplar tests a implementación interna
- [ ] Los tests no contienen lógica compleja innecesaria

---

## 2) Contratos API y compatibilidad

- [ ] Hay pruebas de contrato request/response
- [ ] Se validan códigos HTTP esperados por endpoint
- [ ] Se valida schema/shape JSON de respuesta
- [ ] Se prueban errores de validación 4xx
- [ ] Se prueban errores de negocio 409/422 cuando aplica
- [ ] Existe control de breaking changes en contratos

---

## 3) Seguridad de aplicación

- [ ] Se prueban autenticación y expiración de token
- [ ] Se prueban autorizaciones por rol (RBAC)
- [ ] Se prueban accesos indebidos a recursos de otro usuario
- [ ] Se prueban entradas maliciosas (inyección básica)
- [ ] Se prueban headers de seguridad críticos
- [ ] Se prueban rutas sensibles sin credenciales

---

## 4) Performance y escalabilidad

- [ ] Se miden tiempos de respuesta en endpoints críticos
- [ ] Se definen umbrales de performance por operación
- [ ] Se prueban escenarios de carga nominal
- [ ] Se prueban escenarios de pico/estrés
- [ ] Se detectan regresiones de rendimiento en CI
- [ ] Se reportan percentiles (p50/p95/p99) cuando aplica

---

## 5) Resiliencia y tolerancia a fallos

- [ ] Se prueban fallos de red y timeouts
- [ ] Se prueban reintentos/backoff cuando aplica
- [ ] Se prueban degradaciones parciales del sistema
- [ ] Se valida manejo de errores sin filtrar excepciones sensibles
- [ ] Se valida recuperación tras fallo de dependencia
- [ ] Se prueban casos de disponibilidad parcial (servicios externos)

---

## 6) Datos de prueba y consistencia

- [ ] Existen fixtures/factories reutilizables
- [ ] Los datasets son deterministas (seed/control de aleatoriedad)
- [ ] No se reutilizan datos persistentes no controlados
- [ ] Se limpian datos entre tests
- [ ] Se separan datos sensibles de datos sintéticos
- [ ] Se versionan datasets críticos de prueba

---

## 7) Entornos y configuración

- [ ] Entorno local reproducible documentado
- [ ] Entorno CI reproduce condiciones mínimas de producción
- [ ] Variables de entorno de tests están centralizadas
- [ ] No hay secretos hardcodeados en tests
- [ ] Se validan diferencias de entorno (local/CI/staging)
- [ ] Se define estrategia de test data por entorno

---

## 8) CI/CD y quality gates

- [ ] Pipeline ejecuta lint + tests + cobertura
- [ ] Pipeline falla ante quality gate incumplido
- [ ] Se publican artefactos de pruebas/cobertura
- [ ] Se ejecutan suites por etapa (rápidas vs completas)
- [ ] Existe estrategia de pruebas para PR vs main
- [ ] Se evita merging con tests inestables sin control

---

## 9) Observabilidad y diagnósticos de pruebas

- [ ] Fallos de test dejan evidencia accionable (logs/screenshots/videos)
- [ ] Se registran métricas de duración por suite
- [ ] Se mide flaky rate por periodo
- [ ] Existe trazabilidad test → componente/endpoint
- [ ] Se puede reproducir un fallo de CI en local
- [ ] Se conserva historial de resultados para tendencias

---

## 10) Mantenibilidad y deuda técnica del suite

- [ ] El suite evita duplicación excesiva
- [ ] Se usan helpers/page objects/fixtures para reutilización
- [ ] Se controla complejidad de tests largos
- [ ] Se hace refactor periódico del test code
- [ ] Hay convenciones de naming documentadas
- [ ] El onboarding de nuevos tests es simple y claro

---

## 11) Cobertura inteligente (no solo porcentaje)

- [ ] Se cubren rutas de mayor riesgo de negocio
- [ ] Se cubren flujos de autorización y seguridad
- [ ] Se cubren errores y excepciones relevantes
- [ ] Se cubren integraciones externas críticas
- [ ] Se evita inflar cobertura con tests triviales
- [ ] Se revisa cobertura por módulo y no solo global

---

## 12) Frontend UX/A11y testing

- [ ] Se prueban flujos principales de usuario
- [ ] Se prueban estados vacíos/loading/error
- [ ] Se prueban interacciones por teclado
- [ ] Se usan queries semánticas (role/label/text)
- [ ] Se validan mensajes de error útiles al usuario
- [ ] Se validan permisos de navegación por rol

---

## 13) Backend negocio y reglas de dominio

- [ ] Se prueban invariantes de dominio
- [ ] Se prueban transiciones de estado válidas/ inválidas
- [ ] Se prueban reglas de unicidad/conflicto
- [ ] Se prueban reglas temporales (periodos/fechas)
- [ ] Se prueban errores de consistencia cruzada
- [ ] Se prueban casos de concurrencia básica cuando aplica

---

## 14) Gobernanza de IA en testing

- [ ] Existe política de uso de IA en generación de tests
- [ ] Hay checklist de revisión humana obligatoria
- [ ] Se registra trazabilidad de cambios asistidos por IA
- [ ] Se evita aceptar sugerencias sin validación
- [ ] Se controlan duplicaciones/artefactos generados por IA
- [ ] Se documentan decisiones técnicas relevantes del prompt

---

## 15) Release readiness (go/no-go)

- [ ] Existe criterio objetivo de salida por release
- [ ] Todas las suites críticas pasan en CI
- [ ] No hay defectos bloqueantes abiertos
- [ ] Riesgos conocidos tienen plan de mitigación
- [ ] Se valida smoke test post-deploy
- [ ] Se valida rollback plan y observabilidad mínima

---

## Resultado sugerido

| Rango  | Interpretación                                   |
| ------ | ------------------------------------------------ |
| 90–100 | Listo para producción con alta confianza         |
| 75–89  | Aceptable, requiere mitigaciones puntuales       |
| 60–74  | Riesgo medio, reforzar antes de escalar          |
| < 60   | Riesgo alto, no recomendado como gate de release |

## Recomendación de uso

- Evalúa cada ítem como: `✅ Cumple`, `❌ No cumple`, `⚠️ Evidencia insuficiente`.
- Calcula score por bloque y score total.
- Prioriza mejoras en orden: Seguridad → Cobertura inteligente → CI/CD → Resiliencia.
