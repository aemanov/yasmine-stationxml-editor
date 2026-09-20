# GUI smoke: import, wizard, parameter editor, and help dialogs.

import unittest

from yasmine.app.tests.common import check_web_app_is_down, skip_unless_gui
from yasmine.app.tests.common.wgui import SeletiounTestMixin


@skip_unless_gui
@unittest.skipIf(check_web_app_is_down(), "Application is down")
class DialogsGuiTest(SeletiounTestMixin):

    def test_required_dialog_classes_exist(self):
        self.open_page('#xmls')
        ready = self.driver.execute_script("""
            return !!(
                Ext.ClassManager.getByAlias('widget.xml-import') &&
                Ext.ClassManager.getByAlias('widget.wizard-create') &&
                Ext.ClassManager.getByAlias('widget.parameter-editor') &&
                Ext.ClassManager.getByAlias('widget.help_html_editor') &&
                Ext.ClassManager.getByAlias('widget.stationxml-help') &&
                Ext.ClassManager.getByAlias('widget.yasmine-data-availability-field') &&
                Ext.ClassManager.getByAlias('widget.measurement-metadata-window')
            );
        """)
        self.assertTrue(ready, 'required Ext dialog classes are missing')

    def test_xml_import_dialog_opens(self):
        self.open_page('#xmls')
        self.driver.execute_script("Ext.create({xtype: 'xml-import'}).show();")
        self.wait_js(
            "Ext.ComponentQuery.query('xml-import').length>0",
            'xml-import dialog missing',
        )

    def test_help_window_opens(self):
        self.open_page('#about')
        self.driver.execute_script(
            "Ext.create({xtype: 'help_html_editor', html: '<p>help</p>'}).show();"
        )
        self.wait_js(
            "Ext.ComponentQuery.query('help_html_editor').length>0",
            'help window missing',
        )

    def test_stationxml_help_window_opens(self):
        self.open_page('#xmls')
        self.driver.execute_script(
            "Ext.create({xtype: 'stationxml-help'}).show();"
        )
        self.wait_js(
            "Ext.ComponentQuery.query('stationxml-help').length>0",
            'stationxml-help window missing',
        )

    def test_data_availability_editor_creates(self):
        self.open_page('#xmls')
        created = self.driver.execute_script("""
            var editor = Ext.create({xtype: 'yasmine-data-availability-field'});
            return !!(editor && editor.getXType &&
                editor.getXType() === 'yasmine-data-availability-field');
        """)
        self.assertTrue(created, 'data availability editor missing')

    def test_measurement_metadata_window_opens(self):
        self.open_page('#xmls')
        self.driver.execute_script(
            "Ext.create({xtype: 'measurement-metadata-window'}).show();"
        )
        self.wait_js(
            "Ext.ComponentQuery.query('measurement-metadata-window').length>0",
            'measurement metadata window missing',
        )

    def test_xml_edit_dialog_opens(self):
        self.open_page('#xmls')
        self.driver.execute_script("Ext.create({xtype: 'xml-edit'}).show();")
        self.wait_js(
            "Ext.ComponentQuery.query('xml-edit').length>0",
            'xml-edit dialog missing',
        )

    def test_wizard_dialog_opens(self):
        self.open_page('#xmls')
        self.driver.execute_script("Ext.create({xtype: 'wizard-create'}).show();")
        self.wait_js(
            "Ext.ComponentQuery.query('wizard-create').length>0",
            'wizard dialog missing',
        )

    def test_parameter_editor_dialog_opens(self):
        self.open_page('#xmls')
        self.driver.execute_script("Ext.create({xtype: 'parameter-editor'}).show();")
        self.wait_js(
            "Ext.ComponentQuery.query('parameter-editor').length>0",
            'parameter-editor dialog missing',
        )
