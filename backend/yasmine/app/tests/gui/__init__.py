# Selenium GUI tests against a running app (opt-in).

import unittest

from yasmine.app.tests.common import gui_tests_enabled


def load_tests(loader, standard_tests, pattern):
    if not gui_tests_enabled():
        return unittest.TestSuite()
    return standard_tests
