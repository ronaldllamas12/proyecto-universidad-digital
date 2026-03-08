from __future__ import annotations

import json
import re
from pathlib import Path


SEMVER_RE = re.compile(r"^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$")


def ensure_semver(value: str, field_name: str) -> None:
    if not SEMVER_RE.match(value):
        raise ValueError(f"{field_name} no cumple semver: {value}")


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    manifest_path = root / "tests" / "data" / "datasets_manifest.json"

    if not manifest_path.exists():
        raise FileNotFoundError(f"No existe manifiesto: {manifest_path}")

    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))

    ensure_semver(str(manifest.get("manifest_version", "")), "manifest_version")

    datasets = manifest.get("datasets", [])
    if not isinstance(datasets, list) or not datasets:
        raise ValueError("El manifiesto debe contener al menos un dataset")

    for dataset in datasets:
        dataset_id = str(dataset.get("id", "")).strip()
        version = str(dataset.get("version", "")).strip()
        classification = str(dataset.get("classification", "")).strip()
        relative_path = str(dataset.get("path", "")).strip()

        if not dataset_id:
            raise ValueError("Dataset sin id en manifest")

        ensure_semver(version, f"dataset[{dataset_id}].version")

        if classification != "synthetic":
            raise ValueError(
                f"dataset[{dataset_id}] tiene clasificacion no permitida: {classification}"
            )

        absolute_path = root.parent / relative_path
        if not absolute_path.exists():
            raise FileNotFoundError(
                f"dataset[{dataset_id}] referencia path inexistente: {relative_path}"
            )

    print("Datasets manifest validado correctamente")


if __name__ == "__main__":
    main()
