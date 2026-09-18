# GUI smoke: hash routes render Ext views without page errors.

import unittest

from yasmine.app.tests.common import check_web_app_is_down, skip_unless_gui
from yasmine.app.tests.common.wgui import SeletiounTestMixin


@skip_unless_gui
@unittest.skipIf(check_web_app_is_down(), "Application is down")
class RoutesGuiTest(SeletiounTestMixin):

    def test_xmls_route(self):
        self.open_page('#xmls')
        self.wait_js("Ext.ComponentQuery.query('xml-list').length>0", 'xml-list missing')

    def test_settings_route(self):
        self.open_page('#settings')
        self.wait_js("Ext.ComponentQuery.query('settings-list').length>0", 'settings-list missing')

    def test_user_library_route(self):
        self.open_page('#user-libraries')
        self.wait_js("Ext.ComponentQuery.query('userlibrary-list').length>0", 'user library list missing')

    def test_about_route(self):
        self.open_page('#about')
        self.wait_js("Ext.ComponentQuery.query('app-main').length>0", 'main missing after about')
