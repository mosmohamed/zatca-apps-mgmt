from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from .pipeline import ImportResult


def write_reports(
    result: ImportResult,
    report_dir: Path,
    seeder_path: Path,
    extra: dict[str, Any] | None = None,
) -> dict[str, Path]:
    report_dir.mkdir(parents=True, exist_ok=True)
    text_path = report_dir / "migration_report.txt"
    json_path = report_dir / "migration_report.json"
    normalized_path = report_dir / "normalized_import_data.json"

    payload = build_report_payload(result, seeder_path, extra or {})
    text_path.write_text(render_text_report(payload), encoding="utf-8", newline="\n")
    json_path.write_text(json.dumps(payload, indent=2, ensure_ascii=False), encoding="utf-8", newline="\n")
    normalized_path.write_text(
        json.dumps(payload["normalized"], indent=2, ensure_ascii=False),
        encoding="utf-8",
        newline="\n",
    )
    return {
        "text": text_path,
        "json": json_path,
        "normalized": normalized_path,
    }


def build_report_payload(result: ImportResult, seeder_path: Path, extra: dict[str, Any]) -> dict[str, Any]:
    return {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "seeder": str(seeder_path),
        "stats": result.stats,
        "warnings": result.warnings,
        "skipped_rows": result.skipped_rows,
        "duplicate_users": result.duplicate_users,
        "duplicate_applications": result.duplicate_applications,
        "generated_emails": result.generated_emails,
        "email_collisions": result.email_collisions,
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
        "suspicious_application_matches": result.suspicious_application_matches,
        "unmatched_names": result.unmatched_names,
        "schema": extra,
        "normalized": {
            "users": [
                {
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "email": user.email,
                    "phone": user.phone,
                    "email_source": user.email_source,
                    "role": user.spatie_role,
                    "sources": user.sources,
                    "static": user.static,
                }
                for user in result.users
            ],
            "applications": [
                {
                    "name": app.name,
                    "application_type": app.application_type,
                    "department": app.department,
                    "technical_category": app.technical_category,
                    "description": app.description,
                    "vendor": app.vendor,
                    "status": app.status,
                    "support_type": app.support_type,
                    "technologies": app.technologies,
                    "remarks": app.remarks,
                    "source": app.source,
                }
                for app in result.applications
            ],
            "assignments": [
                {
                    "user_email": item.user_email,
                    "application_name": item.application_name,
                    "app_role": item.app_role,
                    "is_primary": item.is_primary,
                    "source": item.source,
                    "remarks": item.remarks,
                }
                for item in result.assignments
            ],
        },
    }


def render_text_report(payload: dict[str, Any]) -> str:
    stats = payload["stats"]
    lines = [
        "=======================================",
        "MIGRATION GENERATION SUMMARY",
        "=======================================",
        "",
        f"Users Sheet Rows: {stats.get('users_sheet_rows', 0)}",
        f"PHASE2 Application Rows: {stats.get('phase2_application_rows', 0)}",
        "",
        f"Users from Users Sheet: {stats.get('users_from_users_sheet', 0)}",
        f"Users discovered from PHASE2: {stats.get('users_from_phase2', 0)}",
        f"Cross-sheet users merged: {stats.get('cross_sheet_users_merged', 0)}",
        f"Final unique users: {stats.get('final_unique_users', 0)}",
        "",
        f"Applications from PHASE2: {stats.get('applications_from_phase2', 0)}",
        f"Applications referenced by Users Sheet: {stats.get('applications_from_users_sheet', 0)}",
        f"Applications matched: {stats.get('applications_matched', 0)}",
        f"Additional applications generated: {stats.get('additional_applications', 0)}",
        f"Final applications: {stats.get('final_applications', 0)}",
        "",
        f"Assignments from Users Sheet: {stats.get('assignments_from_users_sheet', 0)}",
        f"Support assignments: {stats.get('support_assignments', 0)}",
        f"Management Owner assignments: {stats.get('management_owner_assignments', 0)}",
        f"Application Lead assignments: {stats.get('application_lead_assignments', 0)}",
        f"Duplicate assignments merged: {stats.get('duplicate_assignments_merged', 0)}",
        f"Final assignments: {stats.get('final_assignments', 0)}",
        "",
        f"Generated Emails: {stats.get('generated_emails', 0)}",
        f"Email Collisions Resolved: {stats.get('email_collisions', 0)}",
        f"Missing/Placeholder Fields: {stats.get('placeholder_values', 0)}",
        f"Invalid/skipped rows: {stats.get('invalid_skipped_rows', 0)}",
        "",
        "Static Users:",
        "✓ super_admin@zatca.gov.sa",
        "✓ infra_admin@zatca.gov.sa",
        "✓ sd_admin@zatca.gov.sa",
        "✓ viewer@zatca.gov.sa",
        "",
        f"Generated: {payload['seeder']}",
        "",
        "Placeholder Data Generated",
        "==========================",
    ]

    placeholders = payload["placeholders"]
    if not placeholders:
        lines.append("(none)")
    else:
        for item in placeholders:
            lines.append("")
            lines.append(f"{item['entity_type']}: {item['entity']}")
            lines.append(f"Field: {item['field']}")
            lines.append(f"Value: {item['value']}")
            lines.append(f"Reason: {item['reason']}")

    if payload["email_collisions"]:
        lines.extend(["", "Email Collisions", "================"])
        for item in payload["email_collisions"]:
            lines.append(f"- {item['name']}: {item['requested']} -> {item['assigned']}")

    if payload["suspicious_application_matches"]:
        lines.extend(["", "Suspicious Application Name Matches (not merged)", "=============================================="])
        for item in payload["suspicious_application_matches"]:
            lines.append(f"- {item['left']} ≈ {item['right']} ({item['ratio']})")

    if payload["warnings"]:
        lines.extend(["", "Warnings", "========"])
        lines.extend(f"- {warning}" for warning in payload["warnings"])

    if payload["skipped_rows"]:
        lines.extend(["", "Skipped Rows", "============"])
        for row in payload["skipped_rows"]:
            lines.append(f"- {row.get('sheet')} row {row.get('row')}: {row.get('reason')}")

    lines.append("")
    return "\n".join(lines)
