# FileValidatorService missing-schema behavior.

import os
import tempfile
import unittest

from yasmine.app.services.file_validator_service import FileValidatorService


class FileValidatorServiceTest(unittest.TestCase):

    def test_missing_schema_raises(self):
        tmp = tempfile.NamedTemporaryFile(delete=False, suffix='.json')
        tmp.write(b'[]')
        tmp.close()
        try:
            with self.assertRaises(Exception):
                FileValidatorService().validate([tmp.name], '/no/such/schema.json')
        finally:
            os.unlink(tmp.name)
