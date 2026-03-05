# SLO de estabilidad del test suite

## Objetivo

Establecer y medir de forma periódica la estabilidad del suite de pruebas para detectar flakiness tempranamente.

## Definición de SLO

- SLI principal: `flake_rate = failed_runs / total_runs`.
- Objetivo (SLO): `flake_rate <= 2%` por ejecución de control.
- Ventana inicial: 3 repeticiones consecutivas por capa crítica (backend y frontend).

## Método de medición

En cada ejecución del workflow de estabilidad:

1. Se corre backend 3 veces (`python -m pytest -q`).
2. Se corre frontend 3 veces (`npx vitest run --coverage`).
3. Se calcula tasa de fallo por capa y total.
4. Si la tasa total supera 2%, el workflow falla.

## Umbrales operativos

- `0% - 2%`: estable (cumple SLO).
- `>2% - 5%`: riesgo (requiere investigación).
- `>5%`: inestable (bloqueo de calidad recomendado).

## Evidencia auditable

- Workflow: `.github/workflows/test-stability-slo.yml`.
- Artefacto: `stability-report.md` generado por ejecución.

## Ciclo de revisión

- Frecuencia: semanal automática + ejecución manual bajo demanda.
- Dueño sugerido: QA/Tech Lead del proyecto.
