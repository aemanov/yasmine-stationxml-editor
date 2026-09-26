# 2026-09-24, version 4.3.3-beta: ASGSR, Alexey Emanov
# Import creates a document only for FDSN StationXML.

import io
import unittest

from yasmine.app.models import XmlModel
from yasmine.app.tests.integration.utils.integration_util import migrate_db, remove_db
from yasmine.app.utils.db import db_transaction
from yasmine.app.utils.facade import ProcessMixin
from yasmine.app.utils.imp_exp import ImportStationXml
from yasmine.app.utils.stationxml_validation import STATIONXML_IMPORT_ERROR


STATIONXML = b'''<?xml version="1.0" encoding="UTF-8"?>
<FDSNStationXML xmlns="http://www.fdsn.org/xml/station/1" schemaVersion="1.2">
  <Source>gate</Source>
  <Created>2020-01-01T00:00:00Z</Created>
  <Network code="XX">
    <Station code="AAA">
      <Latitude>1.0</Latitude>
      <Longitude>2.0</Longitude>
      <Elevation>3.0</Elevation>
      <Site><Name>Gate</Name></Site>
    </Station>
  </Network>
</FDSNStationXML>
'''

DATALESS = b'000001V 010009402.3121970,001,00:00:00.0000~'

SEISCOMP = b'''<?xml version="1.0"?>
<seiscomp xmlns="http://geofon.gfz-potsdam.de/ns/seiscomp3-schema/0.11">
  <Inventory></Inventory>
</seiscomp>
'''


class StationXmlImportGateTest(unittest.TestCase, ProcessMixin):

    @classmethod
    def setUpClass(cls):
        migrate_db(cls.__name__)

    def setUp(self):
        ProcessMixin.__init__(self)

    def test_fdsn_stationxml_is_imported(self):
        before = self.db.query(XmlModel).count()
        xml = ImportStationXml('gate', io.BytesIO(STATIONXML), self).run()
        self.assertEqual(self.db.query(XmlModel).count(), before + 1)
        self.assertEqual(xml.name, 'gate')
        self.assertEqual(xml.source, 'gate')

    def test_dataless_and_seiscomp_are_rejected(self):
        before = self.db.query(XmlModel).count()
        for payload in (DATALESS, SEISCOMP, b'<not-xml', b''):
            with self.assertRaises(ValueError) as error:
                ImportStationXml('nope', io.BytesIO(payload), self).run()
            self.assertEqual(str(error.exception), STATIONXML_IMPORT_ERROR)
            self.assertEqual(self.db.query(XmlModel).count(), before)

    def tearDown(self):
        with db_transaction(self.db):
            self.db.query(XmlModel).delete()

    @classmethod
    def tearDownClass(cls):
        try:
            remove_db(cls.__name__)
        except OSError:
            pass
