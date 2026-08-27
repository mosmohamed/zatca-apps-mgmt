from __future__ import annotations

import unittest

from excel_import.normalize import (
    generate_email,
    map_application_type,
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

    def test_email_collision(self) -> None:
        email, collided = unique_generated_email("amohamed@zatca.gov.sa", {"amohamed@zatca.gov.sa"})
        self.assertTrue(collided)
        self.assertEqual(email, "amohamed2@zatca.gov.sa")


if __name__ == "__main__":
    unittest.main()
