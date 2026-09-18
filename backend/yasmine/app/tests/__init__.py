# Test package for Yasmine.
#
# All suites are off for release builds. Set YASMINE_TEST=1 to load them.
# GUI still needs YASMINE_TEST_GUI=1; downloads need YASMINE_TEST_NETWORK=1.

import os
import unittest

TESTS_ENV = 'YASMINE_TEST'


def tests_enabled():
    return os.environ.get(TESTS_ENV, '').lower() in ('1', 'true', 'yes')


class TestsDisabled(unittest.TestCase):
    @unittest.skip('Tests disabled. Set %s=1 to run them.' % TESTS_ENV)
    def test_disabled(self):
        pass


def gated_load_tests(loader, standard_tests, pattern):
    if not tests_enabled():
        return unittest.defaultTestLoader.loadTestsFromTestCase(TestsDisabled)
    return standard_tests


def load_tests(loader, standard_tests, pattern):
    if not tests_enabled():
        return unittest.defaultTestLoader.loadTestsFromTestCase(TestsDisabled)
    this_dir = os.path.dirname(__file__)
    top = getattr(loader, '_top_level_dir', None)
    suite = unittest.TestSuite()
    for sub in ('unit', 'http', 'integration', 'gui'):
        suite.addTests(loader.discover(
            start_dir=os.path.join(this_dir, sub),
            pattern=pattern or '*_test.py',
            top_level_dir=top,
        ))
    return suite
