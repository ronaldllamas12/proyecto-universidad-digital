from __future__ import annotations

import json
from pathlib import Path

import pytest

from app.main import app


pytestmark = [pytest.mark.integration, pytest.mark.contract]


BASELINE_PATH = Path(__file__).resolve().parents[1] / "data" / "openapi_contract_baseline.json"


def _extract_contract(schema: dict) -> dict:
    paths = schema.get("paths", {})
    normalized_paths: dict[str, dict[str, dict[str, object]]] = {}

    for path, methods in sorted(paths.items()):
        path_contract: dict[str, dict[str, object]] = {}
        for method, operation in sorted(methods.items()):
            if method.lower() not in {"get", "post", "put", "delete", "patch", "options", "head"}:
                continue
            responses = operation.get("responses", {})
            response_codes = sorted(str(code) for code in responses.keys())
            path_contract[method.lower()] = {
                "operation_id": operation.get("operationId"),
                "response_codes": response_codes,
            }
        normalized_paths[path] = path_contract

    return {
        "openapi": schema.get("openapi"),
        "api_version": schema.get("info", {}).get("version"),
        "paths": normalized_paths,
    }


def test_contract_baseline_file_exists() -> None:
    assert BASELINE_PATH.exists(), (
        "Falta baseline de contrato. Genera/actualiza con script local de contrato OpenAPI."
    )


def test_openapi_contract_has_no_breaking_removals() -> None:
    baseline = json.loads(BASELINE_PATH.read_text(encoding="utf-8"))
    current = _extract_contract(app.openapi())

    baseline_paths = baseline["paths"]
    current_paths = current["paths"]

    removed_paths = sorted(set(baseline_paths) - set(current_paths))
    assert not removed_paths, f"Breaking change: paths eliminados del contrato: {removed_paths}"

    removed_methods: list[str] = []
    removed_codes: list[str] = []

    for path, baseline_methods in baseline_paths.items():
        current_methods = current_paths.get(path, {})
        for method, baseline_info in baseline_methods.items():
            if method not in current_methods:
                removed_methods.append(f"{method.upper()} {path}")
                continue

            baseline_response_codes = set(baseline_info.get("response_codes", []))
            current_response_codes = set(current_methods[method].get("response_codes", []))
            missing_codes = sorted(baseline_response_codes - current_response_codes)
            if missing_codes:
                removed_codes.append(
                    f"{method.upper()} {path} -> faltan responses {missing_codes}"
                )

    assert not removed_methods, (
        "Breaking change: metodos eliminados del contrato: " + ", ".join(removed_methods)
    )
    assert not removed_codes, (
        "Breaking change: codigos de respuesta removidos del contrato: " + "; ".join(removed_codes)
    )
