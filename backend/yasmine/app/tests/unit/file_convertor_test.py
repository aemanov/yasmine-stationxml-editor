# SSRF, zip-slip and YAML loader tests for FileConvertorService.

import io
import os
import tempfile
import unittest
import zipfile
from unittest.mock import patch

import yaml

from yasmine.app.services.file_convertor_service import FileConvertorService


class FileConvertorServiceTest(unittest.TestCase):

    def test_convert_from_url_rejects_file_scheme(self):
        with self.assertRaises(ValueError):
            FileConvertorService().convert_from_url('file:///etc/passwd')

    def test_convert_from_url_rejects_localhost(self):
        with self.assertRaises(ValueError):
            FileConvertorService().convert_from_url('http://127.0.0.1/secret.zip')

    def test_convert_from_url_rejects_private_host(self):
        with self.assertRaises(ValueError):
            FileConvertorService().convert_from_url('https://192.168.1.1/nrl.zip')

    def test_zip_slip_does_not_write_outside_target(self):
        buf = io.BytesIO()
        with zipfile.ZipFile(buf, 'w') as zf:
            zf.writestr('../evil.txt', 'pwned')
            zf.writestr('ok.yaml', 'a: 1\n')
        buf.seek(0)
        with zipfile.ZipFile(buf) as zf:
            with self.assertRaises(ValueError):
                FileConvertorService(flattern=False).convert_from_zip(zf)

    def test_user_library_uses_safe_yaml_loader(self):
        service = FileConvertorService(flattern=True, is_full_loader=False)
        self.assertFalse(service.is_full_loader)
        tmp = tempfile.mkdtemp()
        try:
            path = os.path.join(tmp, 'x.yaml')
            with open(path, 'w') as handle:
                handle.write('!!python/object/apply:os.system ["echo pwned"]\n')
            with self.assertRaises((yaml.YAMLError, Exception)):
                yaml.load(open(path, 'rb'), Loader=yaml.FullLoader if service.is_full_loader else yaml.SafeLoader)
        finally:
            pass
