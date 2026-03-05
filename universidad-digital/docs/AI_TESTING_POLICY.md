# Política de uso de IA para pruebas

## Objetivo

Establecer reglas obligatorias para usar herramientas de IA (incluyendo Copilot) al crear o modificar tests en backend, frontend y e2e.

## Alcance

Aplica a todo cambio en:

- `backend/tests/**`
- `frontend/tests/**`
- `frontend/cypress/**`
- Configuración de calidad de tests en CI (`.github/workflows/**`, `pytest.ini`, `vitest.config.ts`).

## Reglas obligatorias

1. Toda sugerencia de IA debe ser revisada y comprendida antes de incorporarse.
2. Ningún bloque de código generado por IA se integra sin validación humana explícita.
3. Todo cambio asistido por IA debe incluir evidencia de verificación local (tests relevantes ejecutados).
4. Si la IA propone una solución compleja, se debe dejar trazabilidad de la decisión técnica.
5. Está prohibido aceptar tests triviales o irrelevantes (por ejemplo, asserts vacíos o sin valor funcional).

## Criterios de aceptación para PR

Un PR con cambios asistidos por IA solo puede aprobarse si:

- Declara qué partes fueron asistidas por IA.
- Incluye resultados de ejecución de tests afectados.
- Incluye revisión humana de riesgos (falsos positivos, sobreajuste, cobertura ficticia, duplicación).
- Vincula el registro de prompts/decisiones en `prompts/PROMPT_DECISIONS_LOG.md`.

## Auditoría

La auditoría mínima de cada cambio debe permitir reconstruir:

- Prompt usado (resumen).
- Decisión adoptada.
- Riesgo identificado y mitigación.
- Evidencia de ejecución (comando y resultado).

## Incumplimientos

El incumplimiento de esta política bloquea la aprobación del PR hasta completar la evidencia requerida.
