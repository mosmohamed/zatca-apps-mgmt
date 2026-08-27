from __future__ import annotations

import math
import re
import unicodedata
from typing import Any

EMAIL_DOMAIN = "zatca.gov.sa"
EMAIL_RE = re.compile(r"^[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}$", re.IGNORECASE)
WHITESPACE_RE = re.compile(r"\s+", re.UNICODE)
UNSUPPORTED_LOCAL_RE = re.compile(r"[^a-z0-9._+\-]+")
PERSON_SEPARATORS_RE = re.compile(r"\s*(?:[-–—]|[,;]|\r?\n)+\s*")
# Do not split on "/": names like "CI/CD pipeline" must stay intact.
TECH_SEPARATORS_RE = re.compile(r"\s*[,;|]+\s*|\r?\n+")
APP_SEPARATORS_RE = re.compile(r"\s*[,;]+\s*|\r?\n+")

TRUTHY_VALUES = {
    "yes",
    "y",
    "true",
    "live",
    "1",
    "on",
    "active",
}
FALSY_VALUES = {
    "no",
    "n",
    "false",
    "not live",
    "notlive",
    "0",
    "off",
    "inactive",
}

APPLICATION_TYPE_ALIASES = {
    "other apps": "Internal App",
    "other app": "Internal App",
    "others": "Internal App",
    "other": "Internal App",
    "internal": "Internal App",
    "internal app": "Internal App",
    "internal apps": "Internal App",
    "customs": "Customs",
    "customes": "Customs",
    "custom": "Customs",
}

DEPARTMENT_ALIASES = {
    "customs": "Customs",
    "customes": "Customs",
    "custom": "Customs",
    "other apps": "Internal",
    "other app": "Internal",
    "internal": "Internal",
    "internal app": "Internal",
    "internal apps": "Internal",
}

APP_ROLE_RANK = {
    "ZATCA Management": 40,
    "Application Lead": 30,
    "Support": 20,
    "Viewer": 10,
}


def is_blank(value: Any) -> bool:
    if value is None:
        return True
    if isinstance(value, float) and math.isnan(value):
        return True
    if isinstance(value, str) and value.strip() == "":
        return True
    text = str(value).strip()
    return text == "" or text.lower() in {"nan", "none", "null", "-", "n/a", "na"}


def cell_text(value: Any) -> str:
    if is_blank(value):
        return ""
    if isinstance(value, float):
        if value.is_integer():
            return str(int(value))
        return str(value).strip()
    if isinstance(value, int):
        return str(value)
    return str(value).replace("\xa0", " ").strip()


def normalize_whitespace(value: str) -> str:
    return WHITESPACE_RE.sub(" ", value.replace("\xa0", " ")).strip()


def normalize_name(value: str) -> str:
    collapsed = normalize_whitespace(value)
    collapsed = collapsed.replace(" - ", "-").replace("- ", "-").replace(" -", "-")
    return collapsed.casefold()


def normalize_email(value: str) -> str:
    return normalize_whitespace(value).lower()


def normalize_application_name(value: str) -> str:
    return normalize_whitespace(value).casefold()


def header_key(value: Any) -> str:
    text = normalize_whitespace(cell_text(value)).lower()
    text = re.sub(r"[?]+$", "", text)
    text = text.replace("&", "and")
    return WHITESPACE_RE.sub(" ", text)


def split_display_name(display_name: str) -> tuple[str, str]:
    parts = [part for part in normalize_whitespace(display_name).split(" ") if part]
    if not parts:
        return "", ""
    if len(parts) == 1:
        return parts[0], parts[0]
    return parts[0], " ".join(parts[1:])


def full_name(first_name: str, last_name: str) -> str:
    if first_name.casefold() == last_name.casefold():
        return first_name
    return normalize_whitespace(f"{first_name} {last_name}")


def slug_local_part(value: str) -> str:
    decomposed = unicodedata.normalize("NFKD", value)
    ascii_only = decomposed.encode("ascii", "ignore").decode("ascii")
    local = ascii_only.lower().replace(" ", "")
    local = UNSUPPORTED_LOCAL_RE.sub("", local)
    return local.strip("._+-")


def generate_email(first_name: str, last_name: str, domain: str = EMAIL_DOMAIN) -> str:
    first = slug_local_part(first_name)
    last = slug_local_part(last_name)
    if not first and not last:
        return ""
    if not first:
        local = last or "user"
    elif not last:
        local = f"{first[0]}{first}"
    else:
        local = f"{first[0]}{last}"
    if not local:
        local = "user"
    return f"{local}@{domain}"


def unique_generated_email(base_email: str, taken: set[str]) -> tuple[str, bool]:
    normalized = normalize_email(base_email)
    if normalized not in taken:
        return normalized, False

    local, _, domain = normalized.partition("@")
    suffix = 2
    collision = True
    candidate = normalized
    while candidate in taken:
        candidate = f"{local}{suffix}@{domain}"
        suffix += 1
    return candidate, collision


def is_valid_email(value: str) -> bool:
    return bool(value) and EMAIL_RE.match(value) is not None


def parse_phone(value: Any) -> str | None:
    if is_blank(value):
        return None
    if isinstance(value, float):
        if math.isnan(value):
            return None
        if value.is_integer():
            digits = str(int(value))
        else:
            digits = format(value, "f").rstrip("0").rstrip(".")
        return digits or None

    text = cell_text(value)
    if text.endswith(".0") and text.replace(".", "", 1).replace("-", "", 1).isdigit():
        text = text[:-2]
    return text or None


def split_people(value: str) -> list[str]:
    if is_blank(value):
        return []
    parts = PERSON_SEPARATORS_RE.split(normalize_whitespace(cell_text(value)))
    names: list[str] = []
    seen: set[str] = set()
    for part in parts:
        name = normalize_whitespace(part)
        if name == "" or name in {",", ";", "-"}:
            continue
        key = normalize_name(name)
        if key in seen:
            continue
        seen.add(key)
        names.append(name)
    return names


def split_emails(value: str) -> list[str]:
    if is_blank(value):
        return []
    parts = PERSON_SEPARATORS_RE.split(cell_text(value))
    emails: list[str] = []
    seen: set[str] = set()
    for part in parts:
        email = normalize_email(part)
        if not is_valid_email(email) or email in seen:
            continue
        seen.add(email)
        emails.append(email)
    return emails


def split_applications(value: str) -> list[str]:
    if is_blank(value):
        return []
    parts = APP_SEPARATORS_RE.split(cell_text(value))
    names: list[str] = []
    seen: set[str] = set()
    for part in parts:
        name = normalize_whitespace(part)
        if name == "":
            continue
        key = normalize_application_name(name)
        if key in seen:
            continue
        seen.add(key)
        names.append(name)
    return names


def split_technologies(value: str) -> list[str]:
    if is_blank(value):
        return []
    parts = TECH_SEPARATORS_RE.split(cell_text(value))
    names: list[str] = []
    seen: set[str] = set()
    for part in parts:
        name = normalize_whitespace(part)
        if len(name) >= 2 and name[0] == '"' and name[-1] == '"':
            name = normalize_whitespace(name[1:-1])
        if name == "" or name.lower() in {"n/a", "na", "none", "nil"}:
            continue
        key = name.casefold()
        if key in seen:
            continue
        seen.add(key)
        names.append(name)
    return names


def parse_bool(value: Any) -> bool | None:
    if is_blank(value):
        return None
    text = normalize_whitespace(cell_text(value)).casefold()
    text = text.replace("_", " ")
    if text in TRUTHY_VALUES:
        return True
    if text in FALSY_VALUES:
        return False
    return None


def map_application_type(value: str) -> str | None:
    if is_blank(value):
        return None
    key = normalize_whitespace(value).casefold()
    if key in APPLICATION_TYPE_ALIASES:
        return APPLICATION_TYPE_ALIASES[key]
    return normalize_whitespace(value)


def map_department(value: str) -> str | None:
    if is_blank(value):
        return None
    key = normalize_whitespace(value).casefold()
    if key in DEPARTMENT_ALIASES:
        return DEPARTMENT_ALIASES[key]
    return normalize_whitespace(value)


def map_status(is_live: bool | None) -> str:
    if is_live is False:
        return "Maintenance"
    return "Active"


def map_support_type(is_under_operation: bool | None) -> str:
    if is_under_operation is False:
        return "Best Effort"
    return "Business Hours"


def preferred_display_name(current: str, incoming: str) -> str:
    if not current:
        return incoming
    if not incoming:
        return current
    if incoming != incoming.upper() and current == current.upper():
        return incoming
    if " " in incoming and " " not in current:
        return incoming
    return current
