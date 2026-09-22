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

    def test_measurement_metadata_buttons_fit(self):
        self.open_page('#xmls')
        self.resize_viewport(375, 812)
        opened = self.driver.execute_script("""
            return (function () {
                try {
                    Ext.ComponentQuery.query('measurement-metadata-window').forEach(
                        function (win) {
                            if (win.destroy) { win.destroy(); }
                        }
                    );
                    Ext.create({xtype: 'measurement-metadata-window'}).show();
                    return {ok: true};
                } catch (error) {
                    return {
                        ok: false,
                        error: String((error && error.message) || error)
                    };
                }
            })();
        """)
        self.assertTrue(opened.get('ok'), opened)
        self.wait_js(
            "Ext.ComponentQuery.query('measurement-metadata-window').length>0",
            'measurement metadata window missing',
        )
        geometry = self.driver.execute_script("""
            var win = Ext.ComponentQuery.query('measurement-metadata-window')[0];
            var clearBtn = win && win.down('button[text=Clear Metadata]');
            var saveBtn = win && win.down('button[text=Save]');
            var cancelBtn = win && win.down('button[text=Cancel]');
            var winBox = win && win.getBox();
            function fits(box, host) {
                if (!box || !host) { return false; }
                return box.x >= host.x - 2 &&
                    box.y >= host.y - 2 &&
                    box.x + box.width <= host.x + host.width + 2 &&
                    box.y + box.height <= host.y + host.height + 2;
            }
            function info(btn) {
                if (!btn) { return null; }
                var box = btn.getBox();
                return {
                    visible: btn.isVisible(true),
                    fits: !!(winBox && fits(box, winBox)),
                    w: box.width,
                    h: box.height,
                    y: box.y
                };
            }
            return {
                winHeight: winBox && winBox.height,
                clear: info(clearBtn),
                save: info(saveBtn),
                cancel: info(cancelBtn)
            };
        """)
        self.save_screenshot('measurement-metadata-buttons')
        for name in ('clear', 'save', 'cancel'):
            button = geometry.get(name) or {}
            self.assertTrue(
                button.get('visible'),
                '%s button missing: %s' % (name, geometry),
            )
            self.assertTrue(
                button.get('fits'),
                '%s button does not fit: %s' % (name, geometry),
            )
            self.assertGreater(
                button.get('h') or 0,
                20,
                '%s button is clipped: %s' % (name, geometry),
            )

    def test_xml_edit_dialog_opens(self):
        self.open_page('#xmls')
        self.driver.execute_script("Ext.create({xtype: 'xml-edit'}).show();")
        self.wait_js(
            "Ext.ComponentQuery.query('xml-edit').length>0",
            'xml-edit dialog missing',
        )

    def test_xml_edit_header_tools_are_touch_sized_and_aligned(self):
        self.open_page('#xmls')
        self.resize_viewport(375, 812)
        geometry = self.driver.execute_script("""
            var win = Ext.create({xtype: 'xml-edit'});
            win.show();
            yasmine.utils.ResponsiveUtil.syncHeaderTools();

            return win.header.query('tool').map(function (tool) {
                var outer = tool.el.dom.getBoundingClientRect();
                var inner = tool.toolEl.dom.getBoundingClientRect();
                var innerCenterX = inner.left + inner.width / 2;
                var innerCenterY = inner.top + inner.height / 2;
                var target = document.elementFromPoint(innerCenterX, innerCenterY);
                return {
                    type: tool.type,
                    width: outer.width,
                    height: outer.height,
                    iconWidth: inner.width,
                    iconHeight: inner.height,
                    iconFontSize: parseFloat(
                        window.getComputedStyle(tool.toolEl.dom).fontSize
                    ),
                    centerDeltaX: Math.abs(
                        outer.left + outer.width / 2 - innerCenterX
                    ),
                    centerDeltaY: Math.abs(
                        outer.top + outer.height / 2 - innerCenterY
                    ),
                    iconInsideHitTarget: tool.el.dom.contains(target)
                };
            });
        """)
        self.save_screenshot('xml-edit-touch-header-tools')
        self.assertEqual(
            [tool.get('type') for tool in geometry],
            ['help', 'close'],
            geometry,
        )
        for tool in geometry:
            self.assertGreaterEqual(tool.get('width') or 0, 44, tool)
            self.assertGreaterEqual(tool.get('height') or 0, 44, tool)
            self.assertGreaterEqual(tool.get('iconWidth') or 0, 28, tool)
            self.assertGreaterEqual(tool.get('iconHeight') or 0, 28, tool)
            self.assertGreaterEqual(tool.get('iconFontSize') or 0, 26, tool)
            self.assertLessEqual(tool.get('centerDeltaX') or 0, 1, tool)
            self.assertLessEqual(tool.get('centerDeltaY') or 0, 1, tool)
            self.assertTrue(tool.get('iconInsideHitTarget'), tool)

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

    def test_comments_editor_header_stays_compact(self):
        self.open_page('#xmls')
        opened = self.driver.execute_script("""
            return (function () {
                try {
                    Ext.ComponentQuery.query('parameter-editor').forEach(function (win) {
                        if (win.destroy) { win.destroy(); }
                    });
                    var record = Ext.create('yasmine.model.Parameter');
                    record.set('name', 'comments');
                    record.set('class', 'yasmine-comments-field');
                    record.set('value', []);
                    var win = Ext.create({xtype: 'parameter-editor'});
                    win.getViewModel().set('record', record);
                    win.getViewModel().set('nodeType', yasmine.NodeTypeEnum.station);
                    win.getController().createFrom();
                    win.show();
                    return {ok: true};
                } catch (error) {
                    return {
                        ok: false,
                        error: String((error && error.message) || error)
                    };
                }
            })();
        """)
        self.assertTrue(opened.get('ok'), opened)
        self.wait_js(
            "Ext.ComponentQuery.query('yasmine-comments-field grid').length>0",
            'comments grid missing',
        )
        geometry = self.driver.execute_script("""
            var field = Ext.ComponentQuery.query('yasmine-comments-field')[0];
            var grid = field && field.down('grid');
            var header = grid && grid.headerCt;
            var authors = grid && grid.getColumnManager &&
                grid.getColumnManager().getColumns().filter(function (col) {
                    return col.dataIndex === 'authors';
                })[0];
            return {
                headerHeight: header && header.getHeight ? header.getHeight() : null,
                authorsHeight: authors && authors.getHeight ? authors.getHeight() : null,
                authorsFlex: authors && authors.flex,
                gridHeight: grid && grid.getHeight ? grid.getHeight() : null
            };
        """)
        self.save_screenshot('comments-editor-header')
        self.assertLess(
            geometry.get('headerHeight') or 0,
            80,
            'comments grid header is oversized: %s' % geometry,
        )
        self.assertNotEqual(
            geometry.get('authorsHeight'),
            400,
            'Authors column still has a 400px header: %s' % geometry,
        )

    def test_comment_form_person_toolbar_fits(self):
        self.open_page('#xmls')
        opened = self.driver.execute_script("""
            return (function () {
                try {
                    Ext.ComponentQuery.query('comments-editor-form').forEach(function (win) {
                        if (win.destroy) { win.destroy(); }
                    });
                    var win = Ext.create({xtype: 'comments-editor-form'});
                    win.show();
                    return {ok: true};
                } catch (error) {
                    return {
                        ok: false,
                        error: String((error && error.message) || error)
                    };
                }
            })();
        """)
        self.assertTrue(opened.get('ok'), opened)
        self.wait_js(
            "Ext.ComponentQuery.query('comments-editor-form person-list').length>0",
            'comment form person-list missing',
        )
        geometry = self.driver.execute_script("""
            var win = Ext.ComponentQuery.query('comments-editor-form')[0];
            var grid = win && win.down('person-list');
            var tbar = grid && grid.getDockedItems('toolbar[dock=top]')[0];
            var buttons = tbar ? tbar.query('button') : [];
            var saveBtn = win && win.down('button[text=Save]');
            var cancelBtn = win && win.down('button[text=Cancel]');
            var winBox = win && win.getBox();
            var gridBox = grid && grid.getBox();
            var tbarBox = tbar && tbar.getBox();
            function fits(box, host) {
                if (!box || !host) { return false; }
                return box.x >= host.x - 2 &&
                    box.y >= host.y - 2 &&
                    box.x + box.width <= host.x + host.width + 2 &&
                    box.y + box.height <= host.y + host.height + 2;
            }
            return {
                winWidth: winBox && winBox.width,
                winHeight: winBox && winBox.height,
                gridWidth: gridBox && gridBox.width,
                tbarWidth: tbarBox && tbarBox.width,
                buttonCount: buttons.length,
                buttonsFit: buttons.every(function (btn) {
                    return btn.isVisible(true) && fits(btn.getBox(), tbarBox || gridBox);
                }),
                buttonBoxes: buttons.map(function (btn) {
                    var box = btn.getBox();
                    return {
                        w: box.width,
                        h: box.height,
                        x: box.x,
                        y: box.y,
                        visible: btn.isVisible(true)
                    };
                }),
                saveVisible: !!(saveBtn && saveBtn.isVisible(true)),
                saveFits: !!(saveBtn && winBox && fits(saveBtn.getBox(), winBox)),
                cancelVisible: !!(cancelBtn && cancelBtn.isVisible(true)),
                cancelFits: !!(cancelBtn && winBox && fits(cancelBtn.getBox(), winBox))
            };
        """)
        self.save_screenshot('comment-form-person-toolbar')
        self.assertGreaterEqual(geometry.get('buttonCount') or 0, 3, geometry)
        self.assertTrue(
            geometry.get('buttonsFit'),
            'PERSONS toolbar buttons overflow: %s' % geometry,
        )
        self.assertTrue(geometry.get('saveVisible'), 'Save button missing: %s' % geometry)
        self.assertTrue(geometry.get('cancelVisible'), 'Cancel button missing: %s' % geometry)
        self.assertTrue(geometry.get('saveFits'), 'Save button does not fit: %s' % geometry)
        self.assertTrue(geometry.get('cancelFits'), 'Cancel button does not fit: %s' % geometry)
        self.assertGreater(
            geometry.get('gridWidth') or 0,
            (geometry.get('winWidth') or 0) * 0.7,
            'PERSONS grid is not stretching to dialog width: %s' % geometry,
        )

    def test_parameter_labels_use_spaced_xml_names(self):
        self.open_page('#xmls')
        labels = self.driver.execute_script("""
            var Context = yasmine.utils.StationXmlHelpContext;
            return {
                startDate: Context.labelForParameter('start_date'),
                clockDrift: Context.labelForParameter(
                    'clock_drift_in_seconds_per_sample'
                ),
                samples: Context.labelForParameter(
                    'sample_rate_ratio_number_samples'
                ),
                sourceId: Context.labelForParameter('source_id'),
                comments: Context.labelForParameter('comments')
            };
        """)
        self.assertEqual(labels.get('startDate'), 'Start Date', labels)
        self.assertEqual(labels.get('clockDrift'), 'Clock Drift', labels)
        self.assertEqual(
            labels.get('samples'),
            'Sample Rate Ratio / Number Samples',
            labels,
        )
        self.assertEqual(labels.get('sourceId'), 'Source ID', labels)
        self.assertEqual(labels.get('comments'), 'Comment', labels)

    def test_stationxml_double_fields_keep_small_fractions(self):
        self.open_page('#xmls')
        result = self.driver.execute_script("""
            return (function () {
                try {
                    Ext.syncRequire([
                        'yasmine.view.xml.builder.parameter.items.float.StationXmlDoubleField',
                        'yasmine.view.xml.builder.parameter.items.float.FloatEditor',
                        'yasmine.view.xml.builder.parameter.items.longitude.LongitudeEditor',
                        'yasmine.view.xml.builder.parameter.items.channelresponse.treeeditor.ValueEditor'
                    ]);

                    function roundTrip(xtype, typed) {
                        var field = Ext.create({
                            xtype: xtype,
                            renderTo: Ext.getBody(),
                            validator: function () {
                                return true;
                            }
                        });
                        field.setRawValue(typed);
                        field.setValue(field.rawToValue(field.getRawValue()));
                        var result = {
                            ok: field.getValue() === Number(typed),
                            precision: field.decimalPrecision
                        };
                        field.destroy();
                        return result;
                    }

                    var floatSmall = roundTrip('yasmine-float-field', '0.001');
                    var floatSlow = roundTrip('yasmine-float-field', '0.000023148');
                    var longDouble = roundTrip(
                        'yasmine-stationxml-double-field',
                        '-180.12345678901234'
                    );
                    var longitudeField = Ext.create({
                        xtype: 'yasmine-longitude-field'
                    });
                    var longitudeMaxLengthOk = longitudeField.maxLength > 20;
                    longitudeField.destroy();

                    var grid = Ext.create({
                        xtype: 'channel-response-value-editor',
                        renderTo: Ext.getBody()
                    });
                    var record = Ext.create('XmlValue', {
                        name: 'Value',
                        value: '',
                        canHaveValue: true,
                        definition: {valueType: 'number'},
                        readOnly: false
                    });
                    var columns = grid.getColumns();
                    var valueCol = null;
                    for (var i = 0; i < columns.length; i++) {
                        if (columns[i].dataIndex === 'value') {
                            valueCol = columns[i];
                            break;
                        }
                    }
                    var editor = valueCol.getEditor(record);
                    var responseField = editor.field;
                    responseField.setRawValue('0.001');
                    responseField.setValue(
                        responseField.rawToValue(responseField.getRawValue())
                    );
                    var responseOk = responseField.getValue() === 0.001;
                    var responseXtype = responseField.getXType();
                    grid.destroy();

                    return {
                        floatSmallOk: floatSmall.ok,
                        floatPrecision: floatSmall.precision,
                        floatSlowOk: floatSlow.ok,
                        longitudeOk: longDouble.ok,
                        longitudeMaxLengthOk: longitudeMaxLengthOk,
                        responseOk: responseOk,
                        responseXtype: responseXtype
                    };
                } catch (e) {
                    return {error: String(e && e.message ? e.message : e)};
                }
            })();
        """)
        self.assertNotIn('error', result or {}, result)
        self.assertTrue(result.get('floatSmallOk'), result)
        self.assertEqual(result.get('floatPrecision'), 16, result)
        self.assertTrue(result.get('floatSlowOk'), result)
        self.assertTrue(result.get('longitudeOk'), result)
        self.assertTrue(result.get('longitudeMaxLengthOk'), result)
        self.assertTrue(result.get('responseOk'), result)
        self.assertEqual(
            result.get('responseXtype'),
            'yasmine-stationxml-double-field',
            result,
        )
