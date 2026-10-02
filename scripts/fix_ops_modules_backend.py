"""One-shot fixes for cloned ops modules backend."""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BACKEND = ROOT / "backend"


def patch_messages() -> None:
    for lang in ("en", "ar"):
        path = BACKEND / "lang" / lang / "messages.php"
        text = path.read_text(encoding="utf-8")
        if "network_ops_categories" in text:
            print(f"messages {lang}: already patched")
            continue

        # Clone service_desk_* blocks with replacements.
        blocks = [
            ("service_desk_levels", "network_ops_levels", "Service desk", "Network ops", "مكتب الخدمة", "عمليات الشبكة"),
            ("service_desk_categories", "network_ops_categories", "Service desk", "Network ops", "مكتب الخدمة", "عمليات الشبكة"),
            ("service_desk_team_assignments", "network_ops_team_assignments", "Service desk", "Network ops", "مكتب الخدمة", "عمليات الشبكة"),
            ("service_desk_teams_details", "network_ops_teams_details", "Service desk", "Network ops", "مكتب الخدمة", "عمليات الشبكة"),
            ("service_desk_levels", "smart_facilities_levels", "Service desk", "Smart facilities", "مكتب الخدمة", "المرافق الذكية"),
            ("service_desk_categories", "smart_facilities_categories", "Service desk", "Smart facilities", "مكتب الخدمة", "المرافق الذكية"),
            ("service_desk_team_assignments", "smart_facilities_team_assignments", "Service desk", "Smart facilities", "مكتب الخدمة", "المرافق الذكية"),
            ("service_desk_teams_details", "smart_facilities_teams_details", "Service desk", "Smart facilities", "مكتب الخدمة", "المرافق الذكية"),
            ("service_desk_levels", "release_management_levels", "Service desk", "Release management", "مكتب الخدمة", "إدارة الإصدارات"),
            ("service_desk_categories", "release_management_categories", "Service desk", "Release management", "مكتب الخدمة", "إدارة الإصدارات"),
            ("service_desk_team_assignments", "release_management_team_assignments", "Service desk", "Release management", "مكتب الخدمة", "إدارة الإصدارات"),
            ("service_desk_teams_details", "release_management_teams_details", "Service desk", "Release management", "مكتب الخدمة", "إدارة الإصدارات"),
        ]

        # Also clone license message keys if present
        if "'service_desk_licenses'" in text or '"service_desk_licenses"' in text:
            blocks.extend(
                [
                    (
                        "service_desk_licenses",
                        "network_ops_licenses",
                        "Service desk",
                        "Network ops",
                        "مكتب الخدمة",
                        "عمليات الشبكة",
                    ),
                    (
                        "service_desk_licenses",
                        "smart_facilities_licenses",
                        "Service desk",
                        "Smart facilities",
                        "مكتب الخدمة",
                        "المرافق الذكية",
                    ),
                ]
            )

        insert_chunks: list[str] = []
        for src_key, dst_key, en_from, en_to, ar_from, ar_to in blocks:
            pattern = rf"('{src_key}'\s*=>\s*\[[^\]]*?\],)"
            m = re.search(pattern, text, flags=re.S)
            if not m:
                # try nested with more depth
                pattern = rf"('{src_key}'\s*=>\s*\((?:[^][]|\[(?:[^][]|\[[^][]*\])*\])*\],)"
                m = re.search(rf"('{src_key}'\s*=>\s*\[[\s\S]*?\n    \],)", text)
            if not m:
                print(f"WARN: missing block {src_key} in {lang}")
                continue
            chunk = m.group(1)
            chunk = chunk.replace(f"'{src_key}'", f"'{dst_key}'", 1)
            if lang == "en":
                chunk = chunk.replace(en_from, en_to)
                chunk = chunk.replace(en_from.lower(), en_to.lower())
            else:
                chunk = chunk.replace(ar_from, ar_to)
            insert_chunks.append(chunk)

        # Also lookups keys
        lookups_additions_en = {
            "network_ops_levels": "Network ops levels retrieved successfully.",
            "network_ops_categories": "Network ops categories retrieved successfully.",
            "smart_facilities_levels": "Smart facilities levels retrieved successfully.",
            "smart_facilities_categories": "Smart facilities categories retrieved successfully.",
            "release_management_levels": "Release management levels retrieved successfully.",
            "release_management_categories": "Release management categories retrieved successfully.",
        }
        lookups_additions_ar = {
            "network_ops_levels": "تم جلب مستويات عمليات الشبكة بنجاح.",
            "network_ops_categories": "تم جلب فئات عمليات الشبكة بنجاح.",
            "smart_facilities_levels": "تم جلب مستويات المرافق الذكية بنجاح.",
            "smart_facilities_categories": "تم جلب فئات المرافق الذكية بنجاح.",
            "release_management_levels": "تم جلب مستويات إدارة الإصدارات بنجاح.",
            "release_management_categories": "تم جلب فئات إدارة الإصدارات بنجاح.",
        }
        additions = lookups_additions_en if lang == "en" else lookups_additions_ar

        if "'service_desk_categories' =>" in text and "network_ops_categories" not in text:
            # insert after service_desk_teams_details block
            anchor = "'service_desk_teams_details'"
            idx = text.find(anchor)
            if idx == -1:
                print(f"WARN: no anchor in {lang}")
            else:
                end = text.find("],", idx)
                end = text.find("\n", end) + 1
                text = text[:end] + "\n    " + "\n\n    ".join(insert_chunks) + "\n" + text[end:]

        # lookups subsection
        for key, msg in additions.items():
            needle = f"'{key}' =>"
            if needle in text:
                continue
            sd_lookup = "'service_desk_categories' =>"
            li = text.find(sd_lookup)
            if li == -1:
                continue
            line_end = text.find("\n", li)
            text = text[: line_end + 1] + f"        '{key}' => '{msg}',\n" + text[line_end + 1 :]

        path.write_text(text, encoding="utf-8")
        print(f"messages {lang}: patched")


def add_soft_deletes_to_categories() -> None:
    for name in (
        "NetworkOpsCategory",
        "SmartFacilitiesCategory",
        "ReleaseManagementCategory",
    ):
        path = BACKEND / "app" / "Models" / f"{name}.php"
        text = path.read_text(encoding="utf-8")
        if "SoftDeletes" in text:
            continue
        text = text.replace(
            "use Illuminate\\Database\\Eloquent\\Model;\n",
            "use Illuminate\\Database\\Eloquent\\Model;\nuse Illuminate\\Database\\Eloquent\\SoftDeletes;\n",
        )
        text = text.replace(
            "use LogsActivity;\n",
            "use LogsActivity;\n    use SoftDeletes;\n",
        )
        path.write_text(text, encoding="utf-8")
        print(f"SoftDeletes: {name}")


def fix_rm_seeder() -> None:
    path = BACKEND / "database" / "seeders" / "ReleaseManagementSeeder.php"
    text = path.read_text(encoding="utf-8")
    text = text.replace("use App\\Models\\ReleaseManagementLicense;\n", "")
    text = re.sub(
        r"\s*\$this->seedReleaseManagementLicenses\(\);\n",
        "\n",
        text,
    )
    # Remove the entire license seed method
    text = re.sub(
        r"\n    private function seedReleaseManagementLicenses\(\): void\n    \{[\s\S]*?\n    \}\n",
        "\n",
        text,
        count=1,
    )
    path.write_text(text, encoding="utf-8")
    print("RM seeder: removed licenses")


def rewrite_module_seeder_identity(
    path: Path,
    *,
    area: str,
    email_suffix: str,
    root_code: str,
    root_name_en: str,
    root_name_ar: str,
    root_desc: str,
    children: list[tuple[str, str, str, int]],
    extra_root: tuple[str, str, str, str, int] | None,
) -> None:
    text = path.read_text(encoding="utf-8")

    # emails -sd@ -> module suffix
    text = text.replace("-sd@zatca.gov.sa", f"-{email_suffix}@zatca.gov.sa")
    text = text.replace("sd_admin@zatca.gov.sa", f"{email_suffix}_admin@zatca.gov.sa")

    # Replace first root category block codes loosely via SERVICE-DESK code
    # Build new category seeding section from marker comments is hard; do targeted replaces.
    replacements = {
        "'SERVICE-DESK'": f"'{root_code}'",
        "'SD-INCIDENT'": f"'{children[0][0]}'",
        "'SD-REQUEST'": f"'{children[1][0]}'",
        "'SD-ACCESS'": f"'{children[2][0]}'",
        "'SD-CHANGE'": f"'{children[3][0]}'",
        "'SD-KNOWLEDGE'": f"'{extra_root[0]}'" if extra_root else "'SD-KNOWLEDGE'",
    }
    for a, b in replacements.items():
        text = text.replace(a, b)

    # Fix Arabic root names / descriptions that still say service desk
    text = text.replace(
        f"'name_en' => '{root_name_en}',\n                'name_ar' => 'مكتب الخدمة',\n                'description' => 'ITIL service desk streams',",
        f"'name_en' => '{root_name_en}',\n                'name_ar' => '{root_name_ar}',\n                'description' => '{root_desc}',",
    )

    # child names for network/sf/rm - replace SD child english names if module-specific provided
    for code, name_en, name_ar, _sort in children:
        # already have codes replaced; update names when still Incident Management etc.
        pass

    # Explicitly set module-appropriate child names by code match after replace
    child_map = {c[0]: c for c in children}
    for code, name_en, name_ar, sort_order in children:
        # pattern after replace: ['code' => 'NO-INCIDENT', 'name_en' => 'Incident Management', ...]
        text = re.sub(
            rf"(\['code' => '{re.escape(code)}', 'name_en' => ')[^']+(', 'name_ar' => ')[^']+(', 'sort_order' => )\d+(\])",
            rf"\g<1>{name_en}\g<2>{name_ar}\g<3>{sort_order}\g<4>",
            text,
        )

    if extra_root:
        code, name_en, name_ar, desc, sort_order = extra_root
        text = re.sub(
            rf"(\['code' => '{re.escape(code)}',\s*\n\s*'parent_id' => null,\s*\n\s*'name_en' => ')[^']+(',\s*\n\s*'name_ar' => ')[^']+(',\s*\n\s*'description' => ')[^']*(',\s*\n\s*'sort_order' => )\d+",
            rf"\g<1>{name_en}\g<2>{name_ar}\g<3>{desc}\g<4>{sort_order}",
            text,
        )

    # Assign operational area after user firstOrCreate
    area_snippet = f"""
            $user->operationalAreas()->firstOrCreate(
                ['area' => '{area}'],
            );
"""
    if "operationalAreas()->firstOrCreate" not in text:
        text = text.replace(
            "            if (! $user->hasRole('employee') && ! $user->hasRole('super_admin')) {\n                $user->assignRole($employeeRole);\n            }\n",
            "            if (! $user->hasRole('employee') && ! $user->hasRole('super_admin')) {\n                $user->assignRole($employeeRole);\n            }\n"
            + area_snippet,
        )

    # Level notes still say service desk - soften to generic escalation notes
    text = text.replace("First-line service desk response", "First-line response")
    text = text.replace("Escalate to service desk lead", "Escalate to team lead")
    text = text.replace("استجابة الخط الأول لمكتب الخدمة", "استجابة الخط الأول")
    text = text.replace("التصعيد إلى قائد مكتب الخدمة", "التصعيد إلى قائد الفريق")

    path.write_text(text, encoding="utf-8")
    print(f"Seeder identity: {path.name}")


def main() -> None:
    patch_messages()
    add_soft_deletes_to_categories()
    fix_rm_seeder()

    rewrite_module_seeder_identity(
        BACKEND / "database" / "seeders" / "NetworkOpsSeeder.php",
        area="network_ops",
        email_suffix="netops",
        root_code="NETWORK-OPS",
        root_name_en="Network Ops",
        root_name_ar="عمليات الشبكة",
        root_desc="Network operations streams",
        children=[
            ("NO-CORE", "Core Network", "الشبكة الأساسية", 1),
            ("NO-WAN", "WAN & Connectivity", "الشبكة الواسعة والاتصال", 2),
            ("NO-SECURITY", "Network Security", "أمن الشبكة", 3),
            ("NO-WIRELESS", "Wireless", "اللاسلكي", 4),
        ],
        extra_root=("NO-MONITORING", "Monitoring & NOC", "المراقبة ومركز العمليات", "NOC and monitoring stream", 2),
    )
    rewrite_module_seeder_identity(
        BACKEND / "database" / "seeders" / "SmartFacilitiesSeeder.php",
        area="smart_facilities",
        email_suffix="sf",
        root_code="SMART-FACILITIES",
        root_name_en="Smart Facilities",
        root_name_ar="المرافق الذكية",
        root_desc="Smart facilities streams",
        children=[
            ("SF-BUILDING", "Building Systems", "أنظمة المباني", 1),
            ("SF-ACCESS", "Physical Access", "التحكم بالدخول", 2),
            ("SF-HVAC", "HVAC & Energy", "التكييف والطاقة", 3),
            ("SF-CCTV", "CCTV & Sensors", "الكاميرات والمستشعرات", 4),
        ],
        extra_root=("SF-SUPPORT", "Facilities Support", "دعم المرافق", "General facilities support stream", 2),
    )
    rewrite_module_seeder_identity(
        BACKEND / "database" / "seeders" / "ReleaseManagementSeeder.php",
        area="release_management",
        email_suffix="rm",
        root_code="RELEASE-MGMT",
        root_name_en="Release Management",
        root_name_ar="إدارة الإصدارات",
        root_desc="Release management streams",
        children=[
            ("RM-PLAN", "Release Planning", "تخطيط الإصدارات", 1),
            ("RM-BUILD", "Build & Package", "البناء والتعبئة", 2),
            ("RM-DEPLOY", "Deployment", "النشر", 3),
            ("RM-ROLLBACK", "Rollback & Hotfix", "التراجع والإصلاح العاجل", 4),
        ],
        extra_root=("RM-CAB", "CAB & Approvals", "لجنة التغيير والموافقات", "Change advisory board stream", 2),
    )


if __name__ == "__main__":
    main()
