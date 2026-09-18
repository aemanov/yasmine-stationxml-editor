# Regression tests for JSON encode/decode (ids, jsonpickle allowlist).

import unittest

from obspy.core.inventory.util import Comment

from yasmine.app.utils.ujson import json_dump, json_load


class JsonCodecTest(unittest.TestCase):

    def test_null_id_does_not_raise(self):
        data = json_load('{"xid": null}')
        self.assertIsNone(data['xid'])

    def test_string_id_does_not_raise(self):
        data = json_load('{"xid": "abc"}')
        self.assertEqual(data['xid'], 'abc')

    def test_empty_and_minus_one_id_become_none(self):
        self.assertIsNone(json_load('{"id": ""}')['id'])
        self.assertIsNone(json_load('{"node_id": "-1"}')['node_id'])

    def test_negative_numeric_id_becomes_none(self):
        self.assertIsNone(json_load('{"id": -3}')['id'])

    def test_positive_id_preserved(self):
        self.assertEqual(json_load('{"id": 7}')['id'], 7)

    def test_unknown_py_object_is_rejected(self):
        payload = '{"py/object": "subprocess.Popen", "args": ["id"]}'
        with self.assertRaises((ValueError, TypeError)):
            json_load(payload)

    def test_obspy_comment_roundtrip(self):
        dumped = json_dump(Comment(value='hello'))
        restored = json_load(dumped)
        self.assertIsInstance(restored, Comment)
        self.assertEqual(restored.value, 'hello')
