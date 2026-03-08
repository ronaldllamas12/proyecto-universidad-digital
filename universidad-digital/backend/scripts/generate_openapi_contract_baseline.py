from __future__ import annotations

import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.main import app


def extract_contract(schema: dict) -> dict:
    paths = schema.get("paths", {})
    normalized_paths: dict[str, dict[str, dict[str, object]]] = {}

    for path, methods in sorted(paths.items()):
        path_contract: dict[str, dict[str, object]] = {}
        for method, operation in sorted(methods.items()):
            method_lower = method.lower()
            if method_lower not in {"get", "post", "put", "delete", "patch", "options", "head"}:
                continue
            responses = operation.get("responses", {})
            response_codes = sorted(str(code) for code in responses.keys())
            path_contract[method_lower] = {
                "operation_id": operation.get("operationId"),
                "response_codes": response_codes,
            }
        normalized_paths[path] = path_contract

    return {
        "openapi": schema.get("openapi"),
        "api_version": schema.get("info", {}).get("version"),
        "paths": normalized_paths,
    }


def main() -> None:
    baseline_path = Path(__file__).resolve().parents[1] / "tests" / "data" / "openapi_contract_baseline.json"
    baseline_path.parent.mkdir(parents=True, exist_ok=True)
    contract = extract_contract(app.openapi())
    baseline_path.write_text(json.dumps(contract, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Baseline generado: {baseline_path}")


if __name__ == "__main__":
    main()
