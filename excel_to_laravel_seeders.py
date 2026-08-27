#!/usr/bin/env python3
"""Convert a ZATCA Excel workbook into a self-contained Laravel seeder."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SCRIPTS = ROOT / "scripts"
if str(SCRIPTS) not in sys.path:
    sys.path.insert(0, str(SCRIPTS))

from excel_import.excel_reader import load_workbook_payload  # noqa: E402
from excel_import.php_emitter import emit_seeder  # noqa: E402
from excel_import.pipeline import ImportPipeline  # noqa: E402
from excel_import.report import render_text_report, write_reports  # noqa: E402
from excel_import.schema_inspector import inspect_schema, parse_laravel_version  # noqa: E402


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Read Users + PHASE2 Excel sheets and generate ImportedPortfolioSeeder.php.",
    )
    parser.add_argument("workbook", type=Path, help="Path to the Excel workbook (.xlsx)")
    parser.add_argument(
        "--output",
        type=Path,
        default=ROOT / "backend" / "database" / "seeders",
        help="Directory for the generated Laravel seeder",
    )
    parser.add_argument(
        "--report-dir",
        type=Path,
        default=ROOT / "scripts" / "excel_import_output",
        help="Directory for migration_report.txt/json and normalized_import_data.json",
    )
    parser.add_argument(
        "--laravel-root",
        type=Path,
        default=ROOT / "backend",
        help="Laravel project root used for schema inspection",
    )
    parser.add_argument(
        "--skip-db",
        action="store_true",
        help="Skip live MySQL inspection and rely on Laravel models/migrations only",
    )
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    workbook = args.workbook.expanduser().resolve()
    if not workbook.is_file():
        raise SystemExit(f"Excel workbook not found: {workbook}")

    laravel_root = args.laravel_root.expanduser().resolve()
    output_dir = args.output.expanduser().resolve()
    report_dir = args.report_dir.expanduser().resolve()

    print(f"Laravel version constraint: {parse_laravel_version(laravel_root)}")
    print(f"Reading workbook: {workbook}")
    payload = load_workbook_payload(workbook)
    print(f"Sheets: {', '.join(payload.sheet_names)}")
    print(
        f"Users sheet: {payload.users_detection.sheet_name} "
        f"(header row {payload.users_detection.header_row}, {len(payload.users_rows)} data rows)"
    )
    print(
        f"PHASE2 sheet: {payload.phase2_detection.sheet_name} "
        f"(header row {payload.phase2_detection.header_row}, {len(payload.phase2_rows)} data rows)"
    )
    print(f"PHASE2 columns: {', '.join(sorted(payload.phase2_detection.columns))}")

    schema = inspect_schema(laravel_root, skip_db=args.skip_db)
    if schema.connected:
        print(f"MySQL connected: {schema.database} ({len(schema.tables)} tables)")
        print(
            f"Existing records: users={len(schema.users)} applications={len(schema.applications)} "
            f"vendors={len(schema.vendors)} departments={len(schema.departments)}"
        )
    else:
        print("MySQL was not inspected; seeder will resolve records by name at runtime.")
        for warning in schema.warnings:
            print(f"Schema warning: {warning}")

    result = ImportPipeline(payload, schema).run()
    seeder_path = emit_seeder(result, output_dir / "ImportedPortfolioSeeder.php")
    reports = write_reports(
        result,
        report_dir,
        seeder_path,
        extra={
            "laravel_version": parse_laravel_version(laravel_root),
            "database": schema.database,
            "connected": schema.connected,
            "tables": schema.tables,
            "users_sheet": payload.users_detection.sheet_name,
            "phase2_sheet": payload.phase2_detection.sheet_name,
            "phase2_columns": payload.phase2_detection.columns,
        },
    )

    summary = render_text_report(
        {
            "stats": result.stats,
            "seeder": str(seeder_path),
            "placeholders": [
                {
                    "entity_type": item.entity_type,
                    "entity": item.entity,
                    "field": item.field,
                    "value": item.value,
                    "reason": item.reason,
                }
                for item in result.placeholders
            ],
            "email_collisions": result.email_collisions,
            "suspicious_application_matches": result.suspicious_application_matches,
            "warnings": result.warnings,
            "skipped_rows": result.skipped_rows,
        }
    )
    print()
    print(summary)
    print(f"Migration report: {reports['text']}")
    print(f"Normalized JSON: {reports['normalized']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
