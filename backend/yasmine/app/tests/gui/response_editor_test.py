# Response parameter editor must fill the window and open the tree.

import json
import os
import time
import unittest

from yasmine.app.tests.common import check_web_app_is_down, skip_unless_gui
from yasmine.app.tests.common.wgui import SeletiounTestMixin


OPEN_EDITOR_JS = """
return (function () {
    try {
        Ext.ComponentQuery.query('parameter-editor').forEach(function (win) {
            if (win.destroy) { win.destroy(); }
        });
        var record = Ext.create('yasmine.model.Parameter');
        record.set('name', 'response');
        record.set('class', 'yasmine-channel-response-field');
        record.set('value', {nodeId: 1, response: {Response: {}}});
        record.set('nodeId', 1);
        var EditorCtl = Ext.ClassManager.get(
            'yasmine.view.xml.builder.parameter.items.channelresponse.ChannelResponseEditorController'
        );
        var proto = EditorCtl && EditorCtl.prototype;
        var originalPlot = proto && proto.loadChannelResponsePlot;
        if (proto) {
            proto.loadChannelResponsePlot = Ext.emptyFn;
        }
        var win = Ext.create({
            xtype: 'parameter-editor',
            scrollable: false,
            layout: 'fit'
        });
        win.getViewModel().set('record', record);
        win.getViewModel().set('nodeType', yasmine.NodeTypeEnum.channel);
        try {
            win.getController().createFrom();
            win.show();
        } finally {
            if (proto && originalPlot) {
                proto.loadChannelResponsePlot = originalPlot;
            }
        }
        return {ok: true};
    } catch (error) {
        return {
            ok: false,
            error: String((error && error.message) || error),
            stack: error && error.stack
        };
    }
})();
"""

GEOMETRY_JS = """
return (function () {
    function safeCall(obj, method, fallback) {
        try {
            if (!obj || typeof obj[method] !== 'function') { return fallback; }
            return obj[method]();
        } catch (error) {
            return fallback;
        }
    }
    function box(cmp) {
        if (!cmp) { return null; }
        var layout = null;
        try {
            layout = cmp.getLayout && cmp.getLayout() ? cmp.getLayout().type : null;
        } catch (error) {
            layout = String(error);
        }
        return {
            xtype: safeCall(cmp, 'getXType', null),
            width: safeCall(cmp, 'getWidth', null),
            height: safeCall(cmp, 'getHeight', null),
            hidden: safeCall(cmp, 'isHidden', null),
            layout: layout,
            itemCount: cmp.items && cmp.items.getCount ? cmp.items.getCount() : 0,
            text: cmp.el && cmp.el.dom ? String(cmp.el.dom.innerText || '').slice(0, 240) : ''
        };
    }
    function bodyBox(win) {
        try {
            if (!win || !win.body) { return null; }
            return {
                width: win.body.getWidth ? win.body.getWidth(true) : null,
                height: win.body.getHeight ? win.body.getHeight(true) : null
            };
        } catch (error) {
            return {error: String(error)};
        }
    }
    try {
        var win = Ext.ComponentQuery.query('parameter-editor')[0];
        var field = Ext.ComponentQuery.query('yasmine-channel-response-field')[0];
        var preview = Ext.ComponentQuery.query('response-preview')[0];
        var tree = Ext.ComponentQuery.query('channel-response-tree-editor')[0];
        var vm = win && win.getViewModel ? win.getViewModel() : null;
        return {
            win: box(win),
            body: bodyBox(win),
            field: box(field),
            preview: box(preview),
            tree: box(tree),
            flags: vm ? {
                showResponseActions: vm.get('showResponseActions'),
                showEditResponse: vm.get('showEditResponse'),
                showSelectResponse: vm.get('showSelectResponse'),
                showRecalculateSensitivity: vm.get('showRecalculateSensitivity'),
                currentView: field && field.getViewModel ? field.getViewModel().get('currentViewReference') : null
            } : null,
            pageErrors: window.__yasminePageErrors || []
        };
    } catch (error) {
        return {error: String((error && error.message) || error), stack: error && error.stack};
    }
})();
"""

CLICK_EDIT_JS = """
return (function () {
    try {
        var win = Ext.ComponentQuery.query('parameter-editor')[0];
        if (!win) { return {ok: false, error: 'no window'}; }
        win.getController().onEditResponseClick();
        return {ok: true};
    } catch (error) {
        return {
            ok: false,
            error: String((error && error.message) || error),
            stack: error && error.stack
        };
    }
})();
"""


@skip_unless_gui
@unittest.skipIf(check_web_app_is_down(), "Application is down")
class ResponseEditorGuiTest(SeletiounTestMixin):

    SIZES = (
        (1440, 900, 'xl'),
        (375, 812, 'sm-phone'),
        (768, 1024, 'sm-tablet'),
        (1920, 1080, 'xxl-wide'),
    )

    def _dismiss_messageboxes(self):
        try:
            self.driver.execute_script(
                "Ext.ComponentQuery.query('messagebox').forEach(function (box) {"
                "  var btn = box.down && box.down('button');"
                "  if (btn && btn.click) { btn.click(); }"
                "  else if (box.hide) { box.hide(); }"
                "});"
            )
        except Exception as error:
            return str(error)
        return None

    def test_response_editor_fills_window_and_opens_tree(self):
        report = []
        self.open_page('#xmls')
        try:
            for width, height, label in self.SIZES:
                row = {'label': label, 'size': [width, height]}
                self.resize_viewport(width, height)
                opened = self.driver.execute_script(OPEN_EDITOR_JS)
                row['open'] = opened
                if not opened.get('ok'):
                    report.append(row)
                    continue
                self.wait_js(
                    "Ext.ComponentQuery.query('parameter-editor').length>0",
                    'parameter-editor missing at %s' % label,
                )
                time.sleep(0.6)
                row['dismissPreview'] = self._dismiss_messageboxes()
                row['preview'] = self.driver.execute_script(GEOMETRY_JS)
                row['previewShot'] = os.path.basename(self.save_screenshot(
                    'response-preview__%s__%sx%s' % (label, width, height)
                ))
                row['click'] = self.driver.execute_script(CLICK_EDIT_JS)
                time.sleep(0.8)
                row['dismissTree'] = self._dismiss_messageboxes()
                row['tree'] = self.driver.execute_script(GEOMETRY_JS)
                row['treeShot'] = os.path.basename(self.save_screenshot(
                    'response-tree__%s__%sx%s' % (label, width, height)
                ))
                report.append(row)
                self.driver.execute_script(
                    "Ext.ComponentQuery.query('parameter-editor').forEach(function (win) {"
                    "  if (win.destroy) { win.destroy(); }"
                    "});"
                )
        finally:
            report_path = os.path.join(self.screenshot_dir(), 'response-editor.json')
            with open(report_path, 'w', encoding='utf-8') as handle:
                json.dump(report, handle, indent=2)

        self.assertTrue(report, 'no response editor samples captured')
        widest = next((row for row in report if row.get('label') == 'xl'), report[-1])
        self.assertTrue(widest.get('open', {}).get('ok'), widest.get('open'))
        self.assertTrue(widest.get('click', {}).get('ok'), widest.get('click'))
        preview_height = (widest['preview'].get('preview') or {}).get('height') or 0
        field_height = (widest['preview'].get('field') or {}).get('height') or 0
        self.assertGreater(
            max(preview_height, field_height),
            80,
            'response preview collapsed: %s' % widest['preview'],
        )
        tree_height = (widest['tree'].get('tree') or {}).get('height') or 0
        self.assertGreater(
            tree_height,
            80,
            'response tree missing/collapsed: %s' % widest['tree'],
        )
        self.assertFalse(
            (widest['tree'].get('flags') or {}).get('showEditResponse'),
            'Edit Response stayed visible after opening the tree',
        )
