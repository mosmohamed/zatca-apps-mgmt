from __future__ import annotations

from dataclasses import dataclass, field
from difflib import SequenceMatcher
from typing import Any

from .excel_reader import ExcelPayload
from .normalize import (
    APP_ROLE_RANK,
    EMAIL_DOMAIN,
    cell_text,
    full_name,
    generate_email,
    is_blank,
    is_valid_email,
    map_application_type,
    map_department,
    map_status,
    map_support_type,
    normalize_application_name,
    normalize_email,
    normalize_name,
    normalize_whitespace,
    parse_bool,
    parse_phone,
    preferred_display_name,
    split_applications,
    split_display_name,
    split_emails,
    split_people,
    split_technologies,
    unique_generated_email,
)
from .schema_inspector import SchemaSnapshot

PLACEHOLDER_DESCRIPTION = "TODO - Imported application. Description was missing from source Excel."
PLACEHOLDER_TECHNICAL_CATEGORY = "TODO Technical Category"
PLACEHOLDER_VENDOR = "TODO Vendor"
PLACEHOLDER_REMARKS = "TODO - Verify imported data"
PLACEHOLDER_DEPARTMENT = "Unknown Department"
PLACEHOLDER_APPLICATION_TYPE = "Internal App"
STATIC_ROLE_EMPLOYEE = "employee"


@dataclass
class Placeholder:
    entity_type: str
    entity: str
    field: str
    value: str
    reason: str


@dataclass
class CanonicalUser:
    first_name: str
    last_name: str
    email: str
    phone: str | None = None
    display_name: str = ""
    email_source: str = "generated"
    spatie_role: str | None = STATIC_ROLE_EMPLOYEE
    sources: list[str] = field(default_factory=list)
    generated_email: bool = False
    static: bool = False


@dataclass
class CanonicalApplication:
    name: str
    application_type: str
    department: str
    technical_category: str | None = None
    description: str | None = None
    vendor: str | None = None
    is_live: bool | None = None
    is_under_operation: bool | None = None
    support_type: str = "Business Hours"
    status: str = "Active"
    criticality: str = "Medium"
    technologies: list[str] = field(default_factory=list)
    remarks: str | None = None
    source: str = "phase2"
    excel_row: int | None = None
    excel_number: str | None = None
    placeholder_fields: list[str] = field(default_factory=list)


@dataclass
class CanonicalAssignment:
    user_email: str
    application_name: str
    app_role: str
    is_primary: bool
    source: str
    remarks: str | None = None


@dataclass
class ImportResult:
    users: list[CanonicalUser]
    applications: list[CanonicalApplication]
    assignments: list[CanonicalAssignment]
    placeholders: list[Placeholder]
    warnings: list[str]
    skipped_rows: list[dict[str, Any]]
    generated_emails: list[dict[str, str]]
    email_collisions: list[dict[str, str]]
    duplicate_users: list[str]
    duplicate_applications: list[str]
    suspicious_application_matches: list[dict[str, Any]]
    unmatched_names: list[str]
    stats: dict[str, Any]


class ImportPipeline:
    def __init__(self, payload: ExcelPayload, schema: SchemaSnapshot) -> None:
        self.payload = payload
        self.schema = schema
        self.users: dict[str, CanonicalUser] = {}
        self.users_by_name: dict[str, str] = {}
        self.applications: dict[str, CanonicalApplication] = {}
        self.assignments: dict[tuple[str, str], CanonicalAssignment] = {}
        self.placeholders: list[Placeholder] = []
        self.warnings: list[str] = []
        self.skipped_rows: list[dict[str, Any]] = []
        self.generated_emails: list[dict[str, str]] = []
        self.email_collisions: list[dict[str, str]] = []
        self.duplicate_users: list[str] = []
        self.duplicate_applications: list[str] = []
        self.suspicious_application_matches: list[dict[str, Any]] = []
        self.unmatched_names: list[str] = []
        self.taken_emails: set[str] = set()
        self.stats: dict[str, Any] = {
            "users_sheet_rows": len(payload.users_rows),
            "phase2_application_rows": len(payload.phase2_rows),
            "users_from_users_sheet": 0,
            "users_from_phase2": 0,
            "cross_sheet_users_merged": 0,
            "applications_from_phase2": 0,
            "applications_from_users_sheet": 0,
            "applications_matched": 0,
            "additional_applications": 0,
            "assignments_from_users_sheet": 0,
            "support_assignments": 0,
            "management_owner_assignments": 0,
            "application_lead_assignments": 0,
            "duplicate_assignments_merged": 0,
        }

    def run(self) -> ImportResult:
        self._seed_existing_emails()
        self._seed_static_users()
        self._import_users_sheet()
        self._import_phase2()
        self._create_missing_applications_from_users()
        self._detect_suspicious_application_names()
        self._finalize_stats()
        return ImportResult(
            users=sorted(self.users.values(), key=lambda item: item.email),
            applications=sorted(self.applications.values(), key=lambda item: item.name.casefold()),
            assignments=sorted(
                self.assignments.values(),
                key=lambda item: (item.application_name.casefold(), item.user_email),
            ),
            placeholders=self.placeholders,
            warnings=self.warnings + self.payload.users_detection.warnings + self.payload.phase2_detection.warnings,
            skipped_rows=self.skipped_rows,
            generated_emails=self.generated_emails,
            email_collisions=self.email_collisions,
            duplicate_users=sorted(set(self.duplicate_users)),
            duplicate_applications=sorted(set(self.duplicate_applications)),
            suspicious_application_matches=self.suspicious_application_matches,
            unmatched_names=sorted(set(self.unmatched_names)),
            stats=self.stats,
        )

    def _seed_existing_emails(self) -> None:
        for user in self.schema.users:
            email = normalize_email(str(user.get("email") or ""))
            if email:
                self.taken_emails.add(email)

    def _seed_static_users(self) -> None:
        static_users = [
            ("Super", "Admin", "super_admin@zatca.gov.sa", "5678910110", "super_admin"),
            ("Infra", "Admin", "infra_admin@zatca.gov.sa", "5678910110", "infra_admin"),
            ("SD", "Admin", "sd_admin@zatca.gov.sa", "5678910110", "sd_admin"),
            ("Viewer", "User", "viewer@zatca.gov.sa", "5678910110", "viewer"),
        ]
        for first, last, email, phone, role in static_users:
            self._upsert_user(
                CanonicalUser(
                    first_name=first,
                    last_name=last,
                    email=email,
                    phone=phone,
                    display_name=f"{first} {last}",
                    email_source="static",
                    spatie_role=role,
                    sources=["static"],
                    static=True,
                )
            )

    def _import_users_sheet(self) -> None:
        for row in self.payload.users_rows:
            display = normalize_whitespace(cell_text(row.get("display_name")))
            email_raw = normalize_email(cell_text(row.get("email")))
            if display == "" and email_raw == "":
                self.skipped_rows.append({"sheet": row.get("_sheet"), "row": row.get("_row"), "reason": "blank user"})
                continue
            if display == "":
                self.warnings.append(f"Users sheet row {row.get('_row')} is missing Display Name; skipped.")
                self.skipped_rows.append({"sheet": row.get("_sheet"), "row": row.get("_row"), "reason": "missing name"})
                continue

            first, last = split_display_name(display)
            email = email_raw
            generated = False
            if email and not is_valid_email(email):
                self.warnings.append(
                    f"Users sheet row {row.get('_row')} has invalid email '{email}'; generating a fallback."
                )
                email = ""
            if not email:
                email, generated = self._make_generated_email(first, last, display)
            phone = parse_phone(row.get("phone"))
            existing_before = email in self.users or normalize_name(display) in self.users_by_name
            user = self._upsert_user(
                CanonicalUser(
                    first_name=first,
                    last_name=last,
                    email=email,
                    phone=phone,
                    display_name=display,
                    email_source="users_sheet" if not generated else "generated",
                    spatie_role=STATIC_ROLE_EMPLOYEE,
                    sources=["users_sheet"],
                    generated_email=generated,
                )
            )
            if existing_before:
                self.duplicate_users.append(user.email)
                self.stats["cross_sheet_users_merged"] += 1
            else:
                self.stats["users_from_users_sheet"] += 1

            for app_name in split_applications(cell_text(row.get("applications"))):
                application = self._ensure_application_reference(app_name, source="users_sheet")
                self._add_assignment(
                    CanonicalAssignment(
                        user_email=user.email,
                        application_name=application.name,
                        app_role="Viewer",
                        is_primary=False,
                        source="users_sheet",
                        remarks="Imported from Users sheet",
                    )
                )
                self.stats["assignments_from_users_sheet"] += 1

    def _import_phase2(self) -> None:
        for row in self.payload.phase2_rows:
            app_name = normalize_whitespace(cell_text(row.get("app_name")))
            if app_name == "":
                self.skipped_rows.append(
                    {"sheet": row.get("_sheet"), "row": row.get("_row"), "reason": "missing application name"}
                )
                continue

            key = normalize_application_name(app_name)
            existing = self.applications.get(key)
            if existing and existing.source == "phase2":
                self.duplicate_applications.append(app_name)
                self.warnings.append(
                    f"PHASE2 row {row.get('_row')} duplicates application '{app_name}'. Merging."
                )

            application_type = map_application_type(cell_text(row.get("application_type"))) or PLACEHOLDER_APPLICATION_TYPE
            if map_application_type(cell_text(row.get("application_type"))) is None:
                self._placeholder("Application", app_name, "application_type", application_type, "missing Column H")

            department_source = cell_text(row.get("application_type"))
            department = map_department(department_source) or PLACEHOLDER_DEPARTMENT
            if map_department(department_source) is None:
                self._placeholder("Application", app_name, "department", department, "missing Column H")
            department = self._resolve_department(department)

            technical_category = normalize_whitespace(cell_text(row.get("technical_category"))) or None
            description = normalize_whitespace(cell_text(row.get("description"))) or None
            vendor = normalize_whitespace(cell_text(row.get("vendor_name"))) or None
            remarks = normalize_whitespace(cell_text(row.get("remarks"))) or None
            live_raw = cell_text(row.get("live"))
            under_raw = cell_text(row.get("under_operation"))
            is_live = parse_bool(live_raw)
            is_under_operation = parse_bool(under_raw)
            if live_raw and is_live is None:
                self.warnings.append(
                    f"PHASE2 row {row.get('_row')} has non-boolean Live value '{live_raw}' for '{app_name}'."
                )
            if under_raw and is_under_operation is None:
                extra = normalize_whitespace(under_raw)
                remarks = _join_remarks(remarks, f"Under Operation: {extra}")
                self.warnings.append(
                    f"PHASE2 row {row.get('_row')} has non-boolean under Operation value '{under_raw}' for '{app_name}'."
                )

            technologies = split_technologies(cell_text(row.get("stack")))
            preferred_name = self.schema.preferred_application_name(app_name)
            if vendor:
                vendor = self.schema.preferred_vendor_name(vendor)

            placeholder_fields: list[str] = []
            if description is None:
                description = PLACEHOLDER_DESCRIPTION
                placeholder_fields.append("description")
                self._placeholder("Application", preferred_name, "description", description, "missing App Description")
            if technical_category is None:
                technical_category = PLACEHOLDER_TECHNICAL_CATEGORY
                placeholder_fields.append("technical_category")
                self._placeholder(
                    "Application",
                    preferred_name,
                    "technical_category",
                    technical_category,
                    "missing Technical Category",
                )
            if vendor is None:
                vendor = PLACEHOLDER_VENDOR
                placeholder_fields.append("vendor")
                self._placeholder("Application", preferred_name, "vendor", vendor, "missing Vendor Name")
            if remarks is None:
                remarks = PLACEHOLDER_REMARKS
                placeholder_fields.append("remarks")
                self._placeholder("Application", preferred_name, "remarks", remarks, "missing Remarks")

            application = CanonicalApplication(
                name=preferred_name if existing is None else preferred_display_name(existing.name, preferred_name),
                application_type=application_type,
                department=department,
                technical_category=technical_category,
                description=description,
                vendor=vendor,
                is_live=is_live,
                is_under_operation=is_under_operation,
                support_type=map_support_type(is_under_operation),
                status=map_status(is_live),
                technologies=technologies,
                remarks=remarks,
                source="phase2",
                excel_row=int(row.get("_row") or 0) or None,
                excel_number=cell_text(row.get("excel_number")) or None,
                placeholder_fields=placeholder_fields,
            )
            if existing and existing.source != "phase2":
                self.stats["applications_matched"] += 1
            elif existing is None:
                self.stats["applications_from_phase2"] += 1
            self.applications[key] = application

            support_names = split_people(cell_text(row.get("support_name")))
            support_emails = split_emails(cell_text(row.get("support_email")))
            support_users = self._resolve_people(
                names=support_names,
                emails=support_emails,
                source="phase2_support",
                row_number=row.get("_row"),
                context=f"Support for {application.name}",
            )
            for person in support_users:
                self._add_assignment(
                    CanonicalAssignment(
                        user_email=person.email,
                        application_name=application.name,
                        app_role="Support",
                        is_primary=False,
                        source="phase2_support",
                        remarks="PHASE2 Support",
                    )
                )
                self.stats["support_assignments"] += 1

            owner = self._resolve_single_person(
                cell_text(row.get("management_owner")),
                cell_text(row.get("management_owner_email")),
                source="phase2_management_owner",
                row_number=row.get("_row"),
                context=f"Management Owner for {application.name}",
            )
            if owner:
                self._add_assignment(
                    CanonicalAssignment(
                        user_email=owner.email,
                        application_name=application.name,
                        app_role="ZATCA Management",
                        is_primary=True,
                        source="phase2_management_owner",
                        remarks="PHASE2 ZATCA Management Owner",
                    )
                )
                self.stats["management_owner_assignments"] += 1

            lead = self._resolve_single_person(
                cell_text(row.get("app_lead")),
                cell_text(row.get("app_lead_email")),
                source="phase2_app_lead",
                row_number=row.get("_row"),
                context=f"App Lead for {application.name}",
            )
            if lead:
                self._add_assignment(
                    CanonicalAssignment(
                        user_email=lead.email,
                        application_name=application.name,
                        app_role="Application Lead",
                        is_primary=True,
                        source="phase2_app_lead",
                        remarks="PHASE2 ZATCA App Lead",
                    )
                )
                self.stats["application_lead_assignments"] += 1

    def _create_missing_applications_from_users(self) -> None:
        for application in list(self.applications.values()):
            if application.source != "users_sheet":
                continue
            self.stats["additional_applications"] += 1
            application.application_type = PLACEHOLDER_APPLICATION_TYPE
            application.department = self._resolve_department("Internal")
            application.technical_category = PLACEHOLDER_TECHNICAL_CATEGORY
            application.description = PLACEHOLDER_DESCRIPTION
            application.vendor = PLACEHOLDER_VENDOR
            application.remarks = PLACEHOLDER_REMARKS
            application.placeholder_fields = [
                "application_type",
                "department",
                "technical_category",
                "description",
                "vendor",
                "remarks",
            ]
            for field_name, value in [
                ("application_type", application.application_type),
                ("department", application.department),
                ("technical_category", application.technical_category),
                ("description", application.description),
                ("vendor", application.vendor),
                ("remarks", application.remarks),
            ]:
                self._placeholder(
                    "Application",
                    application.name,
                    field_name,
                    value,
                    "referenced on Users sheet but missing from PHASE2",
                )

    def _ensure_application_reference(self, name: str, source: str) -> CanonicalApplication:
        key = normalize_application_name(name)
        existing = self.applications.get(key)
        if existing:
            if source == "users_sheet" and existing.source == "phase2":
                self.stats["applications_matched"] += 1
            return existing
        preferred = self.schema.preferred_application_name(name)
        application = CanonicalApplication(
            name=preferred,
            application_type=PLACEHOLDER_APPLICATION_TYPE,
            department=self._resolve_department("Internal"),
            source=source,
        )
        self.applications[key] = application
        if source == "users_sheet":
            self.stats["applications_from_users_sheet"] += 1
        return application

    def _resolve_people(
        self,
        names: list[str],
        emails: list[str],
        source: str,
        row_number: Any,
        context: str,
    ) -> list[CanonicalUser]:
        people: list[CanonicalUser] = []
        if names and emails and len(names) == len(emails):
            pairs = list(zip(names, emails, strict=True))
        elif names and len(emails) == 1 and len(names) > 1:
            pairs = [(name, "") for name in names]
            self.warnings.append(
                f"PHASE2 row {row_number}: {context} has {len(names)} names and 1 email; generating emails."
            )
        elif names:
            if emails and len(emails) != len(names):
                self.warnings.append(
                    f"PHASE2 row {row_number}: {context} name/email counts differ "
                    f"({len(names)} names, {len(emails)} emails); generating emails."
                )
            pairs = [(name, "") for name in names]
        elif emails:
            pairs = [("", email) for email in emails]
        else:
            return []

        for name, email in pairs:
            person = self._resolve_single_person(name, email, source, row_number, context)
            if person:
                people.append(person)
        return people

    def _resolve_single_person(
        self,
        name: str,
        email: str,
        source: str,
        row_number: Any,
        context: str,
    ) -> CanonicalUser | None:
        display = normalize_whitespace(name)
        explicit_email = normalize_email(email) if is_valid_email(normalize_email(email)) else ""
        if explicit_email == "" and email and not is_blank(email):
            self.warnings.append(
                f"PHASE2 row {row_number}: {context} has invalid email '{email}'."
            )

        if display == "" and explicit_email == "":
            return None

        if display == "" and explicit_email:
            local = explicit_email.split("@", 1)[0]
            display = normalize_whitespace(local.replace(".", " ").replace("_", " "))
            self.unmatched_names.append(f"{context}: email-only {explicit_email}")

        first, last = split_display_name(display) if display else ("Imported", "User")
        generated = False
        resolved_email = explicit_email
        email_source = "phase2_explicit" if explicit_email else "generated"

        existing = self._find_user(display, resolved_email)
        if existing:
            if resolved_email and resolved_email != existing.email:
                self.warnings.append(
                    f"PHASE2 row {row_number}: {context} matched existing user {existing.email} "
                    f"instead of '{resolved_email}'."
                )
            existing.sources.append(source)
            if existing.phone is None:
                pass
            self.stats["cross_sheet_users_merged"] += 1
            return existing

        db_email = self.schema.user_email_by_name(display) if display else None
        if db_email:
            resolved_email = normalize_email(db_email)
            email_source = "existing_database"

        if not resolved_email:
            resolved_email, generated = self._make_generated_email(first, last, display)
            email_source = "generated"

        user = self._upsert_user(
            CanonicalUser(
                first_name=first,
                last_name=last,
                email=resolved_email,
                display_name=display or full_name(first, last),
                email_source=email_source,
                spatie_role=STATIC_ROLE_EMPLOYEE,
                sources=[source],
                generated_email=generated,
            )
        )
        self.stats["users_from_phase2"] += 1
        return user

    def _find_user(self, display_name: str, email: str) -> CanonicalUser | None:
        if email:
            found = self.users.get(normalize_email(email))
            if found:
                return found
        if display_name:
            mapped = self.users_by_name.get(normalize_name(display_name))
            if mapped:
                return self.users.get(mapped)
        generated = ""
        if display_name:
            first, last = split_display_name(display_name)
            generated = generate_email(first, last)
            found = self.users.get(generated)
            if found:
                return found
        return None

    def _upsert_user(self, incoming: CanonicalUser) -> CanonicalUser:
        incoming.email = normalize_email(incoming.email)
        existing = self._find_user(incoming.display_name, incoming.email)
        if existing is None:
            self.users[incoming.email] = incoming
            self.taken_emails.add(incoming.email)
            if incoming.display_name:
                self.users_by_name.setdefault(normalize_name(incoming.display_name), incoming.email)
            return incoming

        if incoming.email and incoming.email != existing.email and incoming.email not in self.users:
            pass
        if incoming.email_source == "users_sheet" or existing.email_source in {"generated", "phase2_explicit"}:
            if incoming.first_name:
                existing.first_name = incoming.first_name
            if incoming.last_name:
                existing.last_name = incoming.last_name
            if incoming.display_name:
                existing.display_name = incoming.display_name
        if incoming.phone and not existing.phone:
            existing.phone = incoming.phone
        if incoming.email_source == "users_sheet" and incoming.email != existing.email:
            old_email = existing.email
            if incoming.email not in self.users:
                self.users.pop(old_email, None)
                existing.email = incoming.email
                existing.email_source = incoming.email_source
                self.users[existing.email] = existing
                self.taken_emails.add(existing.email)
                self._repoint_assignments(old_email, existing.email)
        if incoming.static:
            existing.static = True
            existing.spatie_role = incoming.spatie_role
        for source in incoming.sources:
            if source not in existing.sources:
                existing.sources.append(source)
        if incoming.display_name:
            self.users_by_name[normalize_name(incoming.display_name)] = existing.email
        return existing

    def _repoint_assignments(self, old_email: str, new_email: str) -> None:
        updated: dict[tuple[str, str], CanonicalAssignment] = {}
        for key, assignment in self.assignments.items():
            if assignment.user_email == old_email:
                assignment.user_email = new_email
                updated[(new_email, key[1])] = assignment
            else:
                updated[key] = assignment
        self.assignments = updated

    def _make_generated_email(self, first: str, last: str, display: str) -> tuple[str, bool]:
        base = generate_email(first, last)
        if not base:
            base = f"generated-user-{len(self.generated_emails) + 1:03d}@{EMAIL_DOMAIN}"
            self._placeholder("User", display or base, "email", base, "could not generate email from name")
        email, collided = unique_generated_email(base, self.taken_emails)
        if collided:
            self.email_collisions.append({"name": display, "requested": base, "assigned": email})
        self.generated_emails.append({"name": display, "email": email})
        self.taken_emails.add(email)
        return email, True

    def _add_assignment(self, incoming: CanonicalAssignment) -> None:
        app_key = normalize_application_name(incoming.application_name)
        key = (normalize_email(incoming.user_email), app_key)
        existing = self.assignments.get(key)
        if existing is None:
            self.assignments[key] = incoming
            return
        self.stats["duplicate_assignments_merged"] += 1
        if APP_ROLE_RANK.get(incoming.app_role, 0) > APP_ROLE_RANK.get(existing.app_role, 0):
            existing.app_role = incoming.app_role
            existing.is_primary = incoming.is_primary or existing.is_primary
            existing.source = incoming.source
        else:
            existing.is_primary = existing.is_primary or incoming.is_primary
        existing.remarks = _join_remarks(existing.remarks, incoming.remarks)

    def _resolve_department(self, name: str) -> str:
        preferred = self.schema.preferred_department_name(name)
        if preferred.casefold() != "internal":
            return preferred
        for existing in self.schema.departments:
            lowered = existing.casefold()
            if "zakat" in lowered or "tax" in lowered:
                return existing
        return preferred

    def _detect_suspicious_application_names(self) -> None:
        names = [app.name for app in self.applications.values()]
        for index, left in enumerate(names):
            for right in names[index + 1 :]:
                ratio = SequenceMatcher(None, left.casefold(), right.casefold()).ratio()
                if 0.82 <= ratio < 1.0:
                    self.suspicious_application_matches.append(
                        {"left": left, "right": right, "ratio": round(ratio, 3)}
                    )

    def _placeholder(self, entity_type: str, entity: str, field: str, value: str, reason: str) -> None:
        self.placeholders.append(
            Placeholder(entity_type=entity_type, entity=entity, field=field, value=value, reason=reason)
        )

    def _finalize_stats(self) -> None:
        self.stats.update(
            {
                "final_unique_users": len(self.users),
                "final_applications": len(self.applications),
                "final_assignments": len(self.assignments),
                "generated_emails": len(self.generated_emails),
                "email_collisions": len(self.email_collisions),
                "placeholder_values": len(self.placeholders),
                "invalid_skipped_rows": len(self.skipped_rows),
            }
        )


def _join_remarks(*parts: str | None) -> str | None:
    values = []
    seen: set[str] = set()
    for part in parts:
        text = normalize_whitespace(part or "")
        if text == "" or text in seen:
            continue
        seen.add(text)
        values.append(text)
    if not values:
        return None
    return " | ".join(values)
