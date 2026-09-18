# XML attribute escaping in response JSON-to-XML conversion.

import unittest

from yasmine.app.services.attribute_service import AttributeService


class AttributeXmlEscapeTest(unittest.TestCase):

    def test_quoted_attribute_value_is_escaped(self):
        service = AttributeService.__new__(AttributeService)
        service.response_xml_str = ''
        service._prepare_response_json_as_xml(
            {'Stage': {'attributes': {'name': 'a"b', 'units': 'm/s'}}},
        )
        self.assertNotIn('name="a"b"', service.response_xml_str)
        self.assertIn('a&quot;b', service.response_xml_str)
