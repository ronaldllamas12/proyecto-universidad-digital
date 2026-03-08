# Estrategia de Test Data por Entorno

## Objetivo

Definir reglas formales para gestionar datos de prueba en `local`, `CI` y `staging`, con separacion explicita entre datos sensibles y sinteticos, y versionado de datasets criticos.

## Clasificacion de datos

- `synthetic`: datos ficticios generados para pruebas (obligatorio por defecto).
- `sensitive`: datos con posible PII o trazabilidad real.

Reglas obligatorias:

1. En este repositorio solo se permiten datasets `synthetic` versionados.
2. Queda prohibido persistir PII real en fixtures, factories, snapshots o artefactos.
3. Todo dataset critico debe registrarse en `backend/tests/data/datasets_manifest.json`.

## Estrategia por entorno

## Local

- Fuente principal: fixtures/factories + datasets sinteticos versionados.
- Base de datos de test: SQLite en memoria con rollback por test.
- Semilla deterministica global habilitada en `backend/tests/conftest.py`.

## CI

- Misma estrategia de datos que local (paridad funcional de tests).
- Validacion automatica de manifiesto de datasets y versionado semver.
- Bloqueo de pipeline si falta un dataset declarado o version invalida.

## Staging

- Solo smoke/controlado con datos sinteticos en cuentas sandbox.
- No replicar datos productivos reales.
- Se recomienda rotar datasets por version para evitar drift de pruebas.

## Versionado de datasets criticos

- Archivo fuente: `backend/tests/data/datasets_manifest.json`.
- Esquema de version: `semver` (`major.minor.patch`).
- Todo cambio incompatible en dataset: incremento de `major`.
- Cambio aditivo compatible: incremento de `minor`.
- Correccion menor no estructural: incremento de `patch`.

## Validacion sistematica

- Script: `backend/scripts/validate_test_datasets.py`
- Ejecucion en CI: `backend-ci` y `quality-gate-fullstack`.
- Controles minimos:
  - Manifest existente y parseable.
  - Versiones con formato semver.
  - Paths de datasets existentes.
  - Clasificacion permitida (`synthetic`).

## Evidencia relacionada

- `backend/tests/data/datasets_manifest.json`
- `backend/tests/data/datasets/*.json`
- `.github/workflows/backend-ci.yml`
- `.github/workflows/quality-gate-fullstack.yml`
