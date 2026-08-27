from __future__ import annotations

import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from .normalize import normalize_application_name, normalize_email, normalize_name, normalize_whitespace


@dataclass
class SchemaSnapshot:
    connected: bool
    database: str | None
    tables: list[str] = field(default_factory=list)
    columns: dict[str, list[str]] = field(default_factory=dict)
    users: list[dict[str, Any]] = field(default_factory=list)
    applications: list[dict[str, Any]] = field(default_factory=list)
    vendors: list[str] = field(default_factory=list)
    departments: list[str] = field(default_factory=list)
    application_types: list[str] = field(default_factory=list)
    technologies: list[str] = field(default_factory=list)
    app_roles: list[str] = field(default_factory=list)
    roles: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)

    def preferred_application_name(self, name: str) -> str:
        key = normalize_application_name(name)
        for existing in self.applications:
            existing_name = str(existing.get("name_en") or "")
            if normalize_application_name(existing_name) == key:
                return existing_name
        return name

    def preferred_vendor_name(self, name: str) -> str:
        key = name.casefold()
        for existing in self.vendors:
            if existing.casefold() == key:
                return existing
        return name

    def preferred_department_name(self, name: str) -> str:
        key = name.casefold()
        for existing in self.departments:
            if existing.casefold() == key:
                return existing
            if key in existing.casefold() or existing.casefold() in key:
                return existing
        if key in {"customs", "custom", "customes"}:
            for existing in self.departments:
                if "custom" in existing.casefold():
                    return existing
        return name

    def user_email_by_name(self, full_name: str) -> str | None:
        key = normalize_name(full_name)
        for user in self.users:
            combined = normalize_whitespace(
                f"{user.get('first_name') or ''} {user.get('last_name') or ''}"
            )
            if normalize_name(combined) == key:
                email = user.get("email")
                return str(email) if email else None
        return None


def inspect_schema(laravel_root: Path, skip_db: bool = False) -> SchemaSnapshot:
    snapshot = SchemaSnapshot(connected=False, database=None)
    env = _read_env(laravel_root / ".env")
    snapshot.database = env.get("DB_DATABASE")

    _inspect_models(laravel_root, snapshot)

    if skip_db:
        snapshot.warnings.append("Database inspection skipped by flag.")
        return snapshot

    try:
        snapshot = _inspect_mysql(env, snapshot)
    except Exception as exc:  # noqa: BLE001
        snapshot.warnings.append(f"MySQL inspection failed: {exc}")

    return snapshot


def _read_env(path: Path) -> dict[str, str]:
    values: dict[str, str] = {}
    if not path.is_file():
        return values
    for line in path.read_text(encoding="utf-8").splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#") or "=" not in stripped:
            continue
        key, _, raw = stripped.partition("=")
        values[key.strip()] = raw.strip().strip('"').strip("'")
    return values


def _inspect_models(laravel_root: Path, snapshot: SchemaSnapshot) -> None:
    models = laravel_root / "app" / "Models"
    required = ["User.php", "Application.php", "ApplicationAssignment.php", "AppRole.php"]
    for name in required:
        if not (models / name).is_file():
            snapshot.warnings.append(f"Missing expected Laravel model: {name}")


def _inspect_mysql(env: dict[str, str], snapshot: SchemaSnapshot) -> SchemaSnapshot:
    import mysql.connector

    connection = mysql.connector.connect(
        host=env.get("DB_HOST", "127.0.0.1"),
        port=int(env.get("DB_PORT") or 3306),
        user=env.get("DB_USERNAME", "root"),
        password=env.get("DB_PASSWORD", ""),
        database=env.get("DB_DATABASE", "it_portfolio_system"),
        connection_timeout=5,
    )
    try:
        cursor = connection.cursor(dictionary=True)
        snapshot.connected = True
        cursor.execute("SHOW TABLES")
        table_key = None
        rows = cursor.fetchall()
        tables: list[str] = []
        for row in rows:
            if table_key is None:
                table_key = next(iter(row.keys()))
            tables.append(str(row[table_key]))
        snapshot.tables = tables

        for table in tables:
            cursor.execute(f"DESCRIBE `{table}`")
            snapshot.columns[table] = [str(col["Field"]) for col in cursor.fetchall()]

        if "users" in tables:
            cursor.execute(
                "SELECT id, first_name, last_name, email, phone FROM users WHERE deleted_at IS NULL"
            )
            snapshot.users = list(cursor.fetchall())

        if "applications" in tables:
            cursor.execute(
                "SELECT id, name_en, name_ar, code FROM applications WHERE deleted_at IS NULL"
            )
            snapshot.applications = list(cursor.fetchall())

        snapshot.vendors = _string_list(cursor, tables, "vendors", "name")
        snapshot.departments = _string_list(cursor, tables, "departments", "name_en")
        snapshot.application_types = _string_list(cursor, tables, "application_types", "name_en")
        snapshot.technologies = _string_list(cursor, tables, "technologies", "name")
        snapshot.app_roles = _string_list(cursor, tables, "app_roles", "name")
        snapshot.roles = _string_list(cursor, tables, "roles", "name")
        return snapshot
    finally:
        connection.close()


def _string_list(cursor, tables: list[str], table: str, column: str) -> list[str]:
    if table not in tables:
        return []
    deleted = " WHERE deleted_at IS NULL" if table in {"vendors", "departments", "technologies", "app_roles"} else ""
    cursor.execute(f"SELECT `{column}` AS value FROM `{table}`{deleted}")
    values: list[str] = []
    for row in cursor.fetchall():
        value = row.get("value")
        if value:
            values.append(str(value))
    return values


def parse_laravel_version(laravel_root: Path) -> str:
    composer = laravel_root / "composer.json"
    if not composer.is_file():
        return "unknown"
    match = re.search(r'"laravel/framework"\s*:\s*"([^"]+)"', composer.read_text(encoding="utf-8"))
    return match.group(1) if match else "unknown"
