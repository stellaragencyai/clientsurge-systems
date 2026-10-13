from __future__ import annotations

import importlib.util
import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MODULE_PATH = ROOT / "clientsurge_assurance.py"
SPEC = importlib.util.spec_from_file_location("clientsurge_assurance", MODULE_PATH)
assert SPEC and SPEC.loader
assurance = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(assurance)


class CheckoutValidationTests(unittest.TestCase):
    def test_accepts_valid_live_smoke_response(self) -> None:
        failures, safe = assurance.validate_checkout_response(
            200,
            {
                "url": "https://checkout.stripe.com/c/pay/cs_live_example_secret",
                "session_id": "cs_live_example",
                "request_id": "req_example",
                "stripe_mode": "live",
                "smoke_test": True,
            },
        )
        self.assertEqual([], failures)
        self.assertEqual("live", safe["stripe_mode"])
        self.assertNotIn("secret", safe["checkout_url"])

    def test_rejects_non_stripe_or_missing_session(self) -> None:
        failures, _ = assurance.validate_checkout_response(
            500,
            {
                "url": "https://example.com/not-stripe",
                "request_id": "",
                "stripe_mode": "test",
                "smoke_test": False,
            },
        )
        self.assertGreaterEqual(len(failures), 5)

    def test_redacts_checkout_session_path(self) -> None:
        redacted = assurance.redact_checkout_url(
            "https://checkout.stripe.com/c/pay/cs_live_sensitive#fidkdWxOYHwnPyd1blpxYHZxWjA0"
        )
        self.assertEqual(
            "https://checkout.stripe.com/c/pay/[redacted-checkout-session]",
            redacted,
        )
        self.assertNotIn("sensitive", redacted)


class RouteProfileTests(unittest.TestCase):
    def test_light_and_full_profiles_are_present(self) -> None:
        payload = json.loads((ROOT / "routes.json").read_text(encoding="utf-8"))
        self.assertGreaterEqual(len(payload["light"]), 4)
        self.assertGreaterEqual(len(payload["full"]), 20)
        self.assertTrue(any(route["path"].startswith("/product-signup") for route in payload["full"]))


if __name__ == "__main__":
    unittest.main()
