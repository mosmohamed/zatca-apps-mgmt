from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

from openpyxl import Workbook

from excel_import.normalize import (
    generate_application_code,
    generate_email,
    map_application_type,
    map_customs_or_internal_it,
    normalize_saudi_phone,
    parse_bool,
    parse_phone,
    split_applications,
    split_display_name,
    split_people,
    unique_generated_email,
)


class NormalizeTest(unittest.TestCase):
    def test_split_display_name(self) -> None:
        self.assertEqual(split_display_name("Ahmed Mohamed"), ("Ahmed", "Mohamed"))
        self.assertEqual(
            split_display_name("Ahmed Mohamed Ali Hassan"),
            ("Ahmed", "Mohamed Ali Hassan"),
        )
        self.assertEqual(split_display_name("Ahmed"), ("Ahmed", "Ahmed"))

    def test_generate_email(self) -> None:
        self.assertEqual(generate_email("Ahmed", "Mohamed"), "amohamed@zatca.gov.sa")
        self.assertEqual(generate_email("Mostafa", "Yehia"), "myehia@zatca.gov.sa")
        self.assertEqual(generate_email("Ahmed", "Ahmed"), "aahmed@zatca.gov.sa")

    def test_application_type_mapping(self) -> None:
        self.assertEqual(map_application_type("Other Apps"), "Internal App")
        self.assertEqual(map_application_type("Customs"), "Customs")

    def test_map_customs_or_internal_it(self) -> None:
        self.assertEqual(map_customs_or_internal_it("Customs"), "Customs")
        self.assertEqual(map_customs_or_internal_it("customes"), "Customs")
        self.assertEqual(map_customs_or_internal_it("Other Apps"), "Internal IT")
        self.assertEqual(map_customs_or_internal_it(""), "Internal IT")
        self.assertEqual(map_customs_or_internal_it(None), "Internal IT")

    def test_generate_application_code(self) -> None:
        self.assertEqual(generate_application_code("Alfabet & Aris"), "ALFABET_ARIS")
        self.assertEqual(
            generate_application_code("Bonded Zone Management solution"),
            "BONDED_ZONE_MANAGEMENT_SOLUTION",
        )
        self.assertEqual(generate_application_code("Bitrix24", {"BITRIX24"}), "BITRIX24_2")

    def test_split_people_and_apps(self) -> None:
        self.assertEqual(
            split_people("Ahmed Mohamed - Mohamed Ali - John Smith"),
            ["Ahmed Mohamed", "Mohamed Ali", "John Smith"],
        )
        self.assertEqual(
            split_applications("ZATCA Portal, E-Invoice, Internal Portal"),
            ["ZATCA Portal", "E-Invoice", "Internal Portal"],
        )

    def test_phone_and_bool(self) -> None:
        self.assertEqual(parse_phone(501234567.0), "501234567")
        self.assertTrue(parse_bool("Yes"))
        self.assertFalse(parse_bool("Not Live"))
        self.assertIsNone(parse_bool("Dev"))

    def test_normalize_saudi_phone(self) -> None:
        self.assertEqual(normalize_saudi_phone(505333689), "+966505333689")
        self.assertEqual(normalize_saudi_phone(505333689.0), "+966505333689")
        self.assertEqual(normalize_saudi_phone("505333689"), "+966505333689")
        self.assertEqual(normalize_saudi_phone("+966505333689"), "+966505333689")
        self.assertEqual(normalize_saudi_phone("966505333689"), "+966505333689")
        self.assertEqual(normalize_saudi_phone("0505333689"), "+966505333689")
        self.assertEqual(normalize_saudi_phone("505 333 689"), "+966505333689")
        self.assertEqual(normalize_saudi_phone("00966505333689"), "+966505333689")
        self.assertEqual(normalize_saudi_phone("+966 50 533 3689"), "+966505333689")
        self.assertIsNone(normalize_saudi_phone(None))
        self.assertIsNone(normalize_saudi_phone(""))

    def test_email_collision(self) -> None:
        email, collided = unique_generated_email("amohamed@zatca.gov.sa", {"amohamed@zatca.gov.sa"})
        self.assertTrue(collided)
        self.assertEqual(email, "amohamed2@zatca.gov.sa")


class ImportUsersFromExcelTest(unittest.TestCase):
    def test_extracts_names_emails_and_plus_966_phones(self) -> None:
        from import_users_from_excel import extract_users

        workbook = Workbook()
        sheet = workbook.active
        sheet.title = "Users"
        sheet["B2"] = "Sl. No."
        sheet["C2"] = "Display Name"
        sheet["D2"] = "Email"
        sheet["E2"] = "Applications"
        sheet["F2"] = "Phone Number"
        sheet["B3"] = 1
        sheet["C3"] = "Abdullah Alsubaie"
        sheet["D3"] = "abdsubaie-c@zatca.gov.sa"
        sheet["E3"] = "Yesser, IT Integration"
        sheet["F3"] = 505333689
        sheet["B4"] = 2
        sheet["C4"] = "Amjad Al-Jenidil"
        sheet["D4"] = "ajenidil-c@zatca.gov.sa"
        sheet["E4"] = "Tableau, PowerBI"
        sheet["F4"] = "0505333689"

        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "users.xlsx"
            workbook.save(path)
            users, columns = extract_users(path)

        self.assertEqual(columns.header_row, 2)
        self.assertEqual(len(users), 2)
        self.assertIsNone(users[0].skipped_reason)
        self.assertEqual(users[0].first_name, "Abdullah")
        self.assertEqual(users[0].last_name, "Alsubaie")
        self.assertEqual(users[0].email, "abdsubaie-c@zatca.gov.sa")
        self.assertEqual(users[0].phone, "+966505333689")
        self.assertEqual(users[1].first_name, "Amjad")
        self.assertEqual(users[1].last_name, "Al-Jenidil")
        self.assertEqual(users[1].phone, "+966505333689")


class ImportApplicationsFromExcelTest(unittest.TestCase):
    def test_extracts_phase2_apps_and_maps_column_h(self) -> None:
        from import_applications_from_excel import extract_applications

        workbook = Workbook()
        sheet = workbook.active
        sheet.title = "PHASE2"
        sheet["B1"] = "#"
        sheet["C1"] = "App Names"
        sheet["D1"] = "Technical Category"
        sheet["E1"] = "App Description"
        sheet["F1"] = "Under Operation?"
        sheet["G1"] = "Live? Yes/No"
        sheet["H1"] = "Customs, Other Apps"
        sheet["B2"] = 4
        sheet["C2"] = "Auction"
        sheet["D2"] = "Application"
        sheet["F2"] = "Yes"
        sheet["G2"] = "Yes"
        sheet["H2"] = "Customs"
        sheet["B3"] = 7
        sheet["C3"] = "Bitrix24"
        sheet["D3"] = "Tool"
        sheet["F3"] = "Dev"
        sheet["G3"] = "Yes"
        sheet["H3"] = "Other Apps"
        sheet["B4"] = 8
        sheet["C4"] = "Bonded Zone Management solution"
        sheet["D4"] = "Application"
        sheet["F4"] = "Dev"
        sheet["G4"] = "Yes"
        sheet["H4"] = "Customs"

        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "portfolio.xlsx"
            workbook.save(path)
            applications, detection = extract_applications(path)

        self.assertEqual(detection.sheet_name, "PHASE2")
        self.assertEqual(detection.header_row, 1)
        self.assertEqual(len(applications), 3)
        self.assertIsNone(applications[0].skipped_reason)
        self.assertEqual(applications[0].name_en, "Auction")
        self.assertEqual(applications[0].classification, "Customs")
        self.assertEqual(applications[0].status_name, "Active")
        self.assertEqual(applications[0].support_type_name, "Business Hours")
        self.assertEqual(applications[1].name_en, "Bitrix24")
        self.assertEqual(applications[1].classification, "Internal IT")
        self.assertEqual(applications[1].code, "BITRIX24")
        self.assertEqual(applications[1].support_type_name, "Best Effort")
        self.assertEqual(applications[2].classification, "Customs")
        self.assertEqual(applications[2].code, "BONDED_ZONE_MANAGEMENT_SOLUTION")


if __name__ == "__main__":
    unittest.main()
