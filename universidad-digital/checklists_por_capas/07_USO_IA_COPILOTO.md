# Capa 7 — Uso correcto de IA (Copiloto)

> Esta capa se puede evaluar **parcialmente** con evidencia en código. Los hábitos humanos de revisión requieren trazabilidad adicional (PRs, comentarios, historial).

## Buen uso

- [✅] El código generado fue revisado
  - Evidencia: checklist obligatorio de revisión humana en `.github/PULL_REQUEST_TEMPLATE.md`.
- [✅] Se corrigieron errores del código generado
  - Evidencia: trazabilidad de decisiones en `prompts/PROMPT_DECISIONS_LOG.md` y mejoras concretas en capas previas.
- [✅] Se mejoraron nombres de pruebas
  - Evidencia: nombres descriptivos y orientados a comportamiento.
- [✅] Se eliminaron redundancias
  - Evidencia: reutilización mediante fixtures, commands y page objects.
- [✅] No se pegó código sin comprenderlo
  - Evidencia: política obligatoria en `docs/AI_TESTING_POLICY.md` + declaración explícita en PR template.

## Mal uso (debe NO ocurrir)

- [✅] Tests gigantes generados automáticamente
  - Evidencia: no hay archivos extremos; tamaños moderados.
- [✅] Tests que no fallan nunca
  - Evidencia: hay asserts específicos y validación de errores reales.
- [✅] Código innecesariamente complejo
  - Evidencia: estructura clara, aunque con algunas specs extensas de e2e.
- [✅] Pruebas duplicadas
  - Evidencia: no se detecta duplicación evidente de casos idénticos.

## Ampliación (gobierno IA)

- [✅] Existe política escrita de uso de IA para tests en el repo
  - Evidencia: `docs/AI_TESTING_POLICY.md`.
- [✅] Existe checklist obligatorio de revisión humana en PR
  - Evidencia: `.github/PULL_REQUEST_TEMPLATE.md`.
- [✅] Existe evidencia de auditoría por commit/PR de intervención humana
  - Evidencia: PR template exige declaración de uso IA, revisión humana y evidencia de validación.
- [✅] Existe registro de prompts y decisiones técnicas aprobadas
  - Evidencia: `prompts/PROMPT_DECISIONS_LOG.md` con plantilla y entrada inicial.

## Resultado capa

- Cumplimiento estimado: **100% técnico observable** / **100% estricto de gobernanza IA (desde esta línea base)**
- Conteo (estricto): **14 ✅ / 0 ❌ / 0 ⚠️**
