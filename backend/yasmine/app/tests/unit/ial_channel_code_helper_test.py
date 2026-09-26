# 2026-09-26, version 4.4.0-beta: ASGSR, Alexey Emanov
# AROL channel-code helper is a stub: always empty codes.

import unittest

from yasmine.app.helpers.ial.ial_channel_code_helper import IalChannelCodeHelper


class IalChannelCodeHelperTest(unittest.TestCase):

    def test_guess_code_is_empty(self):
        self.assertEqual(IalChannelCodeHelper().guess_code(None, None), ('', ''))
        self.assertEqual(IalChannelCodeHelper().guess_code(['a'], ['b']), ('', ''))
