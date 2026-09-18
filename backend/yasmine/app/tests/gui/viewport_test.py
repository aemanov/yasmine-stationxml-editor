# Viewport overflow and Settings two-column layout smoke tests.

import unittest

from yasmine.app.tests.common import check_web_app_is_down, skip_unless_gui
from yasmine.app.tests.common.wgui import SeletiounTestMixin


@skip_unless_gui
@unittest.skipIf(check_web_app_is_down(), "Application is down")
class ViewportGuiTest(SeletiounTestMixin):

    SIZES = ((320, 640), (375, 812), (768, 1024), (1440, 900), (1920, 1080))

    def test_no_horizontal_overflow_at_breakpoints(self):
        for width, height in self.SIZES:
            self.driver.set_window_size(width, height)
            self.open_page('#xmls')
            self.wait_js("Ext.ComponentQuery.query('app-main').length>0", 'main missing at %sx%s' % (width, height))
            overflow = self.driver.execute_script(
                "return document.documentElement.scrollWidth - window.innerWidth"
            )
            self.assertLessEqual(overflow, 2, 'horizontal overflow at %sx%s: %s' % (width, height, overflow))

    def test_settings_channel_stays_with_network_column(self):
        self.driver.set_window_size(1440, 900)
        self.open_page('#settings')
        self.wait_js("Ext.ComponentQuery.query('settings-list').length>0", 'settings-list missing')
        aligned = self.driver.execute_script("""
            var channel = Ext.ComponentQuery.query('settings-list fieldset[title=Channel]')[0];
            var network = Ext.ComponentQuery.query('settings-list fieldset[title=Network]')[0];
            if (!channel || !network) { return false; }
            return Math.abs(channel.getX() - network.getX()) < 80;
        """)
        self.assertTrue(aligned, 'Channel fieldset drifted away from Network column')

    def test_settings_stacks_on_narrow_viewport(self):
        self.driver.set_window_size(375, 812)
        self.open_page('#settings')
        self.wait_js("Ext.ComponentQuery.query('settings-list').length>0", 'settings-list missing')
        stacked = self.driver.execute_script("""
            var channel = Ext.ComponentQuery.query('settings-list fieldset[title=Channel]')[0];
            var general = Ext.ComponentQuery.query('settings-list fieldset[title=General]')[0];
            if (!channel || !general) { return true; }
            return channel.getY() >= general.getY();
        """)
        self.assertTrue(stacked)
