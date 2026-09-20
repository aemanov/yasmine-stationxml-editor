# Capture every main route and key dialog at ResponsiveUtil breakpoints.

import json
import os
import time
import unittest

from yasmine.app.tests.common import check_web_app_is_down, skip_unless_gui
from yasmine.app.tests.common.wgui import SeletiounTestMixin


@skip_unless_gui
@unittest.skipIf(check_web_app_is_down(), "Application is down")
class ScreenshotAuditGuiTest(SeletiounTestMixin):

    # Mirrors frontend/app/utils/ResponsiveUtil.js
    SIZES = (
        (320, 640, 'xs'),
        (375, 812, 'sm-phone'),
        (767, 500, 'stack-compact'),
        (768, 1024, 'sm-tablet'),
        (1024, 768, 'md'),
        (1279, 800, 'lg-top-header'),
        (1280, 800, 'lg-left-header'),
        (1440, 900, 'xl'),
        (1920, 1080, 'xxl-wide'),
        (2560, 1440, 'uw'),
    )
    ROUTES = (
        ('xmls', 'xml-list'),
        ('settings', 'settings-list'),
        ('user-libraries', 'userlibrary-list'),
        ('about', 'app-main'),
    )
    DIALOGS = (
        ('xml-import', None),
        ('xml-edit', None),
        ('wizard-create', None),
        ('stationxml-help', None),
        ('help_html_editor', {'html': '<p>GATITO help</p>'}),
    )

    def test_capture_site_at_breakpoints(self):
        report = {
            'host': self.get_host(),
            'shots': [],
            'xmlId': None,
            'libraryId': None,
        }
        self.open_page('#xmls')
        xml_id = self._first_store_id('xml-list')
        library_id = self._first_store_id('userlibrary-list')
        report['xmlId'] = xml_id
        report['libraryId'] = library_id

        for width, height, label in self.SIZES:
            self.resize_viewport(width, height)
            time.sleep(0.35)
            for route, query in self.ROUTES:
                self.open_page('#%s' % route)
                self.resize_viewport(width, height)
                time.sleep(0.25)
                self.wait_js(
                    "Ext.ComponentQuery.query('%s').length>0" % query,
                    '%s missing at %s' % (query, label),
                )
                overflow = self.driver.execute_script(
                    "return document.documentElement.scrollWidth - window.innerWidth"
                )
                path = self.save_screenshot('%s__%s__%sx%s' % (label, route, width, height))
                report['shots'].append({
                    'file': os.path.basename(path),
                    'route': route,
                    'size': [width, height],
                    'label': label,
                    'overflow': overflow,
                    'errors': self.page_errors(),
                    'header': self.driver.execute_script(
                        "var m=Ext.ComponentQuery.query('app-main')[0];"
                        "return m && m.getHeaderPosition ? m.getHeaderPosition() : null;"
                    ),
                })

            if xml_id:
                self.open_page('#xmls')
                self.redirect_to('xml-builder/%s' % xml_id)
                self.resize_viewport(width, height)
                self.wait_js(
                    "Ext.ComponentQuery.query('xmlBuilder').length>0",
                    'xml builder missing at %s' % label,
                    silent=True,
                )
                time.sleep(0.4)
                path = self.save_screenshot('%s__xml-builder__%sx%s' % (label, width, height))
                report['shots'].append({
                    'file': os.path.basename(path),
                    'route': 'xml-builder',
                    'size': [width, height],
                    'label': label,
                    'errors': self.page_errors(),
                })

            if library_id:
                self.open_page('#user-libraries')
                self.redirect_to('user-library-builder/%s' % library_id)
                self.resize_viewport(width, height)
                self.wait_js(
                    "Ext.ComponentQuery.query('userlibrary-builder').length>0",
                    'user library builder missing at %s' % label,
                    silent=True,
                )
                time.sleep(0.4)
                path = self.save_screenshot(
                    '%s__user-library-builder__%sx%s' % (label, width, height)
                )
                report['shots'].append({
                    'file': os.path.basename(path),
                    'route': 'user-library-builder',
                    'size': [width, height],
                    'label': label,
                    'errors': self.page_errors(),
                })

        for width, height, label in ((375, 812, 'sm-phone'), (1440, 900, 'xl')):
            self.open_page('#xmls')
            self.resize_viewport(width, height)
            time.sleep(0.25)
            for xtype, extra in self.DIALOGS:
                self.driver.execute_script(
                    "Ext.ComponentQuery.query(arguments[0]).forEach(function (w) {"
                    "  if (w.destroy) { w.destroy(); }"
                    "});",
                    xtype,
                )
                cfg = {'xtype': xtype}
                if extra:
                    cfg.update(extra)
                self.driver.execute_script("Ext.create(arguments[0]).show();", cfg)
                self.wait_js(
                    "Ext.ComponentQuery.query('%s').length>0" % xtype,
                    '%s missing at %s' % (xtype, label),
                )
                time.sleep(0.2)
                path = self.save_screenshot('%s__dialog-%s__%sx%s' % (label, xtype, width, height))
                report['shots'].append({
                    'file': os.path.basename(path),
                    'route': 'dialog:%s' % xtype,
                    'size': [width, height],
                    'label': label,
                    'errors': self.page_errors(),
                })
                self.driver.execute_script(
                    "Ext.ComponentQuery.query(arguments[0]).forEach(function (w) {"
                    "  if (w.destroy) { w.destroy(); }"
                    "});",
                    xtype,
                )

        report_path = os.path.join(self.screenshot_dir(), 'report.json')
        with open(report_path, 'w', encoding='utf-8') as handle:
            json.dump(report, handle, indent=2)
        self.assertTrue(os.path.isfile(report_path))

    def _first_store_id(self, xtype):
        try:
            self.open_page('#xmls' if xtype == 'xml-list' else '#user-libraries')
            self.wait_js(
                "Ext.ComponentQuery.query('%s').length>0" % xtype,
                '%s missing' % xtype,
            )
            self.wait_js(
                "Ext.ComponentQuery.query('%s')[0].store && "
                "!Ext.ComponentQuery.query('%s')[0].store.isLoading()" % (xtype, xtype),
                '%s store still loading' % xtype,
                timeout=30,
                silent=True,
            )
            return self.driver.execute_script(
                "var cmp = Ext.ComponentQuery.query(arguments[0])[0];"
                "if (!cmp || !cmp.store || !cmp.store.getCount()) { return null; }"
                "var rec = cmp.store.getAt(0);"
                "return rec ? rec.get('id') : null;",
                xtype,
            )
        except Exception:
            return None
