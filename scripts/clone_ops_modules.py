#!/usr/bin/env python3
"""Clone Service Desk backend+frontend into Network Ops / Smart Facilities / Release Management."""

from __future__ import annotations

import re
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BACKEND = ROOT / "backend"
FRONTEND = ROOT / "frontend" / "src"

MODULES = [
    {
        "key": "network_ops",
        "Pascal": "NetworkOps",
        "kebab": "network-ops",
        "snake": "network_ops",
        "camel": "networkOps",
        "title": "Network Ops",
        "with_licenses": True,
        "folder": "network-ops",
    },
    {
        "key": "smart_facilities",
        "Pascal": "SmartFacilities",
        "kebab": "smart-facilities",
        "snake": "smart_facilities",
        "camel": "smartFacilities",
        "title": "Smart Facilities",
        "with_licenses": True,
        "folder": "smart-facilities",
    },
    {
        "key": "release_management",
        "Pascal": "ReleaseManagement",
        "kebab": "release-management",
        "snake": "release_management",
        "camel": "releaseManagement",
        "title": "Release Management",
        "with_licenses": False,
        "folder": "release-management",
    },
]


def transform(text: str, m: dict, with_licenses: bool) -> str:
    # Order matters: longer tokens first
    reps = [
        ("ServiceDesk", m["Pascal"]),
        ("service-desk", m["kebab"]),
        ("service_desk", m["snake"]),
        ("serviceDesk", m["camel"]),
        ("Service Desk", m["title"]),
    ]
    out = text
    for a, b in reps:
        out = out.replace(a, b)
    if not with_licenses:
        # Leave license-related cloned files to be deleted later
        pass
    return out


def copy_transformed(src: Path, dst: Path, m: dict, with_licenses: bool) -> None:
    if not src.exists():
        print("missing", src)
        return
    text = transform(src.read_text(encoding="utf-8"), m, with_licenses)
    dst.parent.mkdir(parents=True, exist_ok=True)
    dst.write_text(text, encoding="utf-8")
    print("wrote", dst.relative_to(ROOT))


def rename_path(path: str, m: dict) -> str:
    return (
        path.replace("ServiceDesk", m["Pascal"])
        .replace("service-desk", m["kebab"])
        .replace("service_desk", m["snake"])
        .replace("serviceDesk", m["camel"])
    )


BACKEND_FILES = [
    "app/Models/ServiceDeskLevel.php",
    "app/Models/ServiceDeskCategory.php",
    "app/Models/ServiceDeskTeamAssignment.php",
    "app/Models/ServiceDeskLicense.php",
    "app/Services/ServiceDeskLevelService.php",
    "app/Services/ServiceDeskCategoryService.php",
    "app/Services/ServiceDeskTeamAssignmentService.php",
    "app/Services/ServiceDeskEscalationMatrixExportService.php",
    "app/Services/ServiceDeskLicenseService.php",
    "app/Http/Controllers/Api/V1/ServiceDeskLevelController.php",
    "app/Http/Controllers/Api/V1/ServiceDeskCategoryController.php",
    "app/Http/Controllers/Api/V1/ServiceDeskTeamAssignmentController.php",
    "app/Http/Controllers/Api/V1/ServiceDeskLicenseController.php",
    "app/Policies/ServiceDeskLevelPolicy.php",
    "app/Policies/ServiceDeskCategoryPolicy.php",
    "app/Policies/ServiceDeskTeamAssignmentPolicy.php",
    "app/Policies/ServiceDeskLicensePolicy.php",
    "app/Http/Resources/ServiceDeskLevelResource.php",
    "app/Http/Resources/ServiceDeskCategoryResource.php",
    "app/Http/Resources/ServiceDeskTeamAssignmentResource.php",
    "app/Http/Resources/ServiceDeskLicenseResource.php",
    "app/Exports/ServiceDeskEscalationMatrixExport.php",
    "app/Exports/Definitions/ServiceDeskLicensesExportDefinition.php",
    "database/factories/ServiceDeskLicenseFactory.php",
    "database/seeders/ServiceDeskSeeder.php",
]

REQUEST_DIRS = [
    "app/Http/Requests/ServiceDeskLevel",
    "app/Http/Requests/ServiceDeskCategory",
    "app/Http/Requests/ServiceDeskTeamAssignment",
    "app/Http/Requests/ServiceDeskLicense",
]

FRONTEND_FEATURE = FRONTEND / "features" / "service-desk"


def write_migration(m: dict, with_licenses: bool) -> None:
    stamp = {
        "network_ops": "2026_09_04_110000",
        "smart_facilities": "2026_09_04_110100",
        "release_management": "2026_09_04_110200",
    }[m["key"]]
    snake = m["snake"]
    levels = f"{snake}_levels"
    cats = f"{snake}_categories"
    assigns = f"{snake}_team_assignments"
    licenses = f"{snake}_licenses"

    license_block = ""
    if with_licenses:
        license_block = f"""
        Schema::create('{licenses}', function (Blueprint $table): void {{
            $table->id();
            $table->string('publisher');
            $table->string('name');
            $table->string('product');
            $table->string('version')->nullable();
            $table->text('description')->nullable();
            $table->string('environment')->nullable();
            $table->unsignedInteger('licensed')->default(0);
            $table->unsignedInteger('used')->default(0);
            $table->unsignedInteger('available')->default(0);
            $table->string('proof_of_entitlement')->nullable();
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->timestamps();
            $table->softDeletes();
            $table->index(['publisher', 'name', 'product'], '{snake}_licenses_searchable_index');
        }});
"""

    drop_licenses = f"        Schema::dropIfExists('{licenses}');\n" if with_licenses else ""

    content = f"""<?php

declare(strict_types=1);

use Illuminate\\Database\\Migrations\\Migration;
use Illuminate\\Database\\Schema\\Blueprint;
use Illuminate\\Support\\Facades\\Schema;

return new class extends Migration
{{
    public function up(): void
    {{
        Schema::create('{levels}', function (Blueprint $table): void {{
            $table->id();
            $table->string('code')->unique();
            $table->string('name_en');
            $table->string('name_ar');
            $table->string('note_en')->nullable();
            $table->string('note_ar')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        }});

        Schema::create('{cats}', function (Blueprint $table): void {{
            $table->id();
            $table->foreignId('parent_id')->nullable()->constrained('{cats}')->cascadeOnDelete();
            $table->string('name_en');
            $table->string('name_ar');
            $table->string('code')->unique();
            $table->text('description')->nullable();
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
        }});

        Schema::create('{assigns}', function (Blueprint $table): void {{
            $table->id();
            $table->foreignId('{snake}_category_id')->constrained('{cats}')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('{snake}_level_id')->constrained('{levels}')->cascadeOnDelete();
            $table->unsignedInteger('sort_order')->default(0);
            $table->timestamps();
            $table->unique(
                ['{snake}_category_id', 'user_id', '{snake}_level_id'],
                'uq_{snake}_team_assignment'
            );
            $table->index(['{snake}_category_id', '{snake}_level_id'], '{snake}_team_cat_level_idx');
            $table->index('user_id', '{snake}_team_user_idx');
        }});
{license_block}
    }}

    public function down(): void
    {{
{drop_licenses}        Schema::dropIfExists('{assigns}');
        Schema::dropIfExists('{cats}');
        Schema::dropIfExists('{levels}');
    }}
}};
"""
    path = BACKEND / "database" / "migrations" / f"{stamp}_create_{snake}_tables.php"
    path.write_text(content, encoding="utf-8")
    print("wrote", path.relative_to(ROOT))


def main() -> None:
    for m in MODULES:
        with_licenses = bool(m["with_licenses"])
        write_migration(m, with_licenses)

        for rel in BACKEND_FILES:
            if not with_licenses and ("License" in rel or "license" in rel):
                continue
            src = BACKEND / rel
            dst = BACKEND / rename_path(rel, m)
            copy_transformed(src, dst, m, with_licenses)

        for d in REQUEST_DIRS:
            if not with_licenses and "License" in d:
                continue
            src_dir = BACKEND / d
            if not src_dir.exists():
                continue
            dst_dir = BACKEND / rename_path(d, m)
            for src in src_dir.glob("*.php"):
                dst = dst_dir / rename_path(src.name, m)
                copy_transformed(src, dst, m, with_licenses)

        # Frontend feature folder
        if FRONTEND_FEATURE.exists():
            dst_feature = FRONTEND / "features" / m["folder"]
            if dst_feature.exists():
                shutil.rmtree(dst_feature)
            for src in FRONTEND_FEATURE.rglob("*"):
                if src.is_dir():
                    continue
                if not with_licenses and "license" in src.name.lower():
                    continue
                rel = src.relative_to(FRONTEND_FEATURE)
                dst = dst_feature / Path(rename_path(str(rel).replace("\\", "/"), m))
                copy_transformed(src, dst, m, with_licenses)

    print("done")


if __name__ == "__main__":
    main()
