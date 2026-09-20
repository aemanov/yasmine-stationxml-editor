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

    def test_no_pageerror_at_breakpoints(self):
        for width, height in self.SIZES:
            self.driver.set_window_size(width, height)
            self.open_page('#xmls')
            self.wait_js("Ext.ComponentQuery.query('app-main').length>0", 'main missing at %sx%s' % (width, height))
            errors = [msg for msg in self.page_errors() if msg]
            self.assertEqual(errors, [], 'pageerror at %sx%s: %s' % (width, height, errors))

    def test_header_is_left_at_1280(self):
        self.driver.set_window_size(1440, 900)
        self.open_page('#xmls')
        self.wait_js(
            "Ext.ComponentQuery.query('app-main')[0].getHeaderPosition()==='left'",
            'header should be left at 1440',
        )

    def test_header_is_top_below_1280(self):
        self.driver.set_window_size(768, 900)
        self.open_page('#xmls')
        self.wait_js(
            "Ext.ComponentQuery.query('app-main')[0].getHeaderPosition()==='top'",
            'header should be top below 1280',
        )

    def test_user_library_keeps_parameters_pane_on_resize(self):
        self.driver.set_window_size(375, 812)
        self.open_page('#user-libraries')
        self.redirect_to('user-library-builder/1')
        self.wait_js(
            "Ext.ComponentQuery.query('userlibrary-builder').length>0",
            'user library builder missing',
        )
        switched = self.driver.execute_script("""
            var builder = Ext.ComponentQuery.query('userlibrary-builder')[0];
            if (!builder) { return false; }
            var switcher = builder.lookupReference('libraryPaneSwitcher');
            var detail = switcher && switcher.down('#detail');
            if (!detail) { return false; }
            detail.setPressed(true);
            return detail.pressed === true;
        """)
        self.assertTrue(switched, 'could not press Parameters pane')
        self.driver.set_window_size(400, 812)
        self.driver.execute_script("Ext.GlobalEvents.fireEvent('resize');")
        still_detail = self.driver.execute_script("""
            var builder = Ext.ComponentQuery.query('userlibrary-builder')[0];
            var switcher = builder && builder.lookupReference('libraryPaneSwitcher');
            var detail = switcher && switcher.down('#detail');
            return !!(detail && detail.pressed);
        """)
        self.assertTrue(still_detail, 'User Library reset to Hierarchy on resize')

    def test_xml_node_util_and_responsive_helpers(self):
        self.driver.set_window_size(320, 640)
        self.open_page('#xmls')
        stacked = self.driver.execute_script(
            "return yasmine.utils.ResponsiveUtil.useStackLayout();"
        )
        self.assertTrue(stacked)
        title = self.driver.execute_script("""
            return yasmine.utils.XmlNodeUtil.getNodeTitle({
                data: {key: 'code', code: 'HHZ'}
            });
        """)
        self.assertIn('code', title)
        self.assertIn('HHZ', title)
        self.driver.set_window_size(1440, 900)
        self.driver.execute_script("Ext.GlobalEvents.fireEvent('resize');")
        stacked_wide = self.driver.execute_script(
            "return yasmine.utils.ResponsiveUtil.useStackLayout();"
        )
        self.assertFalse(stacked_wide)
