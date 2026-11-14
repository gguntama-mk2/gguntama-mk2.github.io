"""Minimal regression checks for the safe source patch (no server writes)."""
import unittest
from tools.project_t_calendar_clock_patch import (
    CLOCK_OLD, CLOCK_NEW, FETCH_OLD, FETCH_NEW,
    PARSE_OLD, PARSE_NEW, CAL_OLD, CAL_NEW, patch_html, extract_seed,
)

class PatchTests(unittest.TestCase):
    def test_rewrites_exact_anchors(self):
        html = "\n".join([CLOCK_OLD, FETCH_OLD, PARSE_OLD, CAL_OLD])
        patched = patch_html(html)
        self.assertIn(CLOCK_NEW, patched)
        self.assertIn(FETCH_NEW, patched)
        self.assertIn(PARSE_NEW, patched)
        self.assertIn(CAL_NEW, patched)
        self.assertNotIn("worldtimeapi.org", patched)
        self.assertNotIn("'/api/v1/calendar/events'", patched)

    def test_refuses_unknown_input(self):
        with self.assertRaises(ValueError):
            patch_html("<html></html>")

    def test_extracts_seed(self):
        src = 'const SEED0=' + '{"events":[' + ','.join(['{}']*21) + ']}' + ';\nconst seedFrom'
        self.assertEqual(len(extract_seed(src)["events"]), 21)

if __name__ == "__main__":
    unittest.main()
