from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
import xml.etree.ElementTree as ET


ROOT = Path(__file__).resolve().parents[1]
COVERAGE_XML = ROOT / "coverage.xml"
OUTPUT_MD = ROOT.parent / "docs" / "TEST_COVERAGE_BY_MODULE_DASHBOARD.md"


@dataclass
class ModuleStats:
    files: int = 0
    covered_lines: int = 0
    total_lines: int = 0

    @property
    def percent(self) -> float:
        if self.total_lines == 0:
            return 0.0
        return (self.covered_lines / self.total_lines) * 100.0


def _safe_int(value: str | None) -> int:
    try:
        return int(value or 0)
    except ValueError:
        return 0


def _module_from_filename(filename: str) -> str:
    normalized = filename.replace("\\", "/")
    if normalized.startswith("app/"):
        normalized = normalized.removeprefix("app/")

    if "/" not in normalized:
        return "root"

    return normalized.split("/", 1)[0]


def build_dashboard() -> int:
    if not COVERAGE_XML.exists():
        raise FileNotFoundError(f"No existe coverage.xml en: {COVERAGE_XML}")

    root = ET.parse(COVERAGE_XML).getroot()
    modules: dict[str, ModuleStats] = defaultdict(ModuleStats)

    for class_node in root.findall(".//class"):
        filename = class_node.get("filename", "")
        module_name = _module_from_filename(filename)
        line_nodes = class_node.findall("./lines/line")
        valid = len(line_nodes)
        covered = sum(1 for line_node in line_nodes if _safe_int(line_node.get("hits")) > 0)

        stats = modules[module_name]
        stats.files += 1
        stats.covered_lines += covered
        stats.total_lines += valid

    ordered = sorted(modules.items(), key=lambda item: item[0])
    generated_at = datetime.now(timezone.utc).replace(microsecond=0).isoformat()

    lines = [
        "# Dashboard de Cobertura por Modulo",
        "",
        "Reporte automatico de cobertura backend por dominio/modulo a partir de `backend/coverage.xml`.",
        "",
        f"- Generado UTC: {generated_at}",
        f"- Fuente: `{COVERAGE_XML.relative_to(ROOT.parent)}`",
        "",
        "| Modulo | Archivos | Lineas cubiertas | Lineas totales | Cobertura |",
        "| --- | ---: | ---: | ---: | ---: |",
    ]

    total_files = 0
    total_covered = 0
    total_lines = 0

    for module_name, stats in ordered:
        total_files += stats.files
        total_covered += stats.covered_lines
        total_lines += stats.total_lines
        lines.append(
            f"| `{module_name}` | {stats.files} | {stats.covered_lines} | {stats.total_lines} | {stats.percent:.2f}% |"
        )

    global_percent = (total_covered / total_lines * 100.0) if total_lines else 0.0
    lines.extend(
        [
            "",
            "## Resumen global",
            "",
            f"- Archivos considerados: **{total_files}**",
            f"- Lineas cubiertas: **{total_covered}**",
            f"- Lineas totales: **{total_lines}**",
            f"- Cobertura global derivada por modulo: **{global_percent:.2f}%**",
        ]
    )

    OUTPUT_MD.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"Dashboard generado en: {OUTPUT_MD}")
    return 0


if __name__ == "__main__":
    raise SystemExit(build_dashboard())
