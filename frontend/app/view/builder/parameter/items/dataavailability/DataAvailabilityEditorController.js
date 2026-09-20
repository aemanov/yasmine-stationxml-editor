/* ****************************************************************************
*
* This file is part of the yasmine editing tool.
*
* yasmine (Yet Another Station Metadata INformation Editor), a tool to
* create and edit station metadata information in FDSN stationXML format,
* is a common development of IRIS and RESIF.
* Development and addition of new features is shared and agreed between * IRIS and RESIF.
*
* Version 1.0 of the software was funded by SAGE, a major facility fully
* funded by the National Science Foundation (EAR-1261681-SAGE),
* development done by ISTI and led by IRIS Data Services.
* Version 2.0 of the software was funded by CNRS and development led by * RESIF.
*
* This program is free software; you can redistribute it
* and/or modify it under the terms of the GNU Lesser General Public
* License as published by the Free Software Foundation; either
* version 3 of the License, or (at your option) any later version.
*
* This program is distributed in the hope that it will be
* useful, but WITHOUT ANY WARRANTY; without even the implied warranty
* of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU Lesser General Public License (GNU-LGPL) for more details.
*
* You should have received a copy of the GNU Lesser General Public
* License along with this software. If not, see
* <https://www.gnu.org/licenses/>
*
*
* 2019/10/07 : version 2.0.0 initial commit
*
* ****************************************************************************/


Ext.define('yasmine.view.xml.builder.parameter.items.dataavailability.DataAvailabilityEditorController', {
  extend: 'yasmine.view.xml.builder.parameter.ParameterItemEditorController',
  alias: 'controller.data-availability-editor',

  parseDate: function (value) {
    var normalized;

    if (!value) {
      return null;
    }
    if (Ext.isDate(value)) {
      return value;
    }
    normalized = String(value).replace('T', ' ').replace(/Z$/, '').replace(/\.\d+$/, '');
    return Ext.Date.parse(normalized, yasmine.Globals.DateReadFormat, true) ||
      Ext.Date.parse(normalized, yasmine.Globals.DatePrintLongFormat, true) ||
      Ext.Date.parse(normalized, 'Y-m-d H:i:s', true);
  },

  formatDate: function (value) {
    return value ? Ext.Date.format(value, 'Y-m-d\\TH:i:s\\Z') : null;
  },

  initData: function () {
    var record = this.getViewModel().get('record');
    var value = record.get('value') || {};
    var extent = value.extent || value;
    var spans = value.spans || [];
    var store = this.getViewModel().getStore('spanStore');
    var fieldset = this.lookupReference('extentFieldset');
    var me = this;

    store.removeAll();
    this.getViewModel().set({
      extentStart: this.parseDate(extent.start),
      extentEnd: this.parseDate(extent.end)
    });

    Ext.Array.each(spans, function (span) {
      store.add({
        start: me.parseDate(span.start),
        end: me.parseDate(span.end),
        numberSegments: span.numberSegments != null ?
          span.numberSegments : (span.number_of_segments != null ?
            span.number_of_segments : span.number_segments),
        maximumTimeTear: span.maximumTimeTear != null ?
          span.maximumTimeTear : span.maximum_time_tear
      });
    });

    if (extent.start || extent.end) {
      fieldset.expand();
    } else {
      fieldset.collapse();
    }
  },

  fillRecord: function () {
    var viewModel = this.getViewModel();
    var fieldset = this.lookupReference('extentFieldset');
    var includeExtent = !fieldset.collapsed;
    var me = this;
    var spans = [];

    viewModel.getStore('spanStore').each(function (span) {
      spans.push({
        start: me.formatDate(span.get('start')),
        end: me.formatDate(span.get('end')),
        numberSegments: span.get('numberSegments'),
        maximumTimeTear: span.get('maximumTimeTear')
      });
    });

    viewModel.get('record').set('value', {
      extent: includeExtent ? {
        start: this.formatDate(viewModel.get('extentStart')),
        end: this.formatDate(viewModel.get('extentEnd'))
      } : null,
      spans: spans
    });
  },

  validate: function () {
    var errors = [];
    var fieldset = this.lookupReference('extentFieldset');
    var viewModel = this.getViewModel();

    if (!fieldset.collapsed &&
        (!viewModel.get('extentStart') || !viewModel.get('extentEnd'))) {
      errors.push('Extent start and end are both required when an extent is included.');
    }

    viewModel.getStore('spanStore').each(function (span, index) {
      if (!span.get('start') || !span.get('end') ||
          span.get('numberSegments') == null ||
          span.get('numberSegments') === '') {
        errors.push('Span ' + (index + 1) +
          ' requires start, end, and number of segments.');
      }
    });

    viewModel.set('validation.activeErrors', errors);
    if (errors.length) {
      return false;
    }
    return this.callParent(arguments);
  },

  onAddSpanClick: function () {
    var store = this.getViewModel().getStore('spanStore');
    var span = new yasmine.view.xml.builder.parameter.items.dataavailability.DataAvailabilitySpan();
    var grid = this.lookupReference('spanGrid');

    store.add(span);
    grid.findPlugin('rowediting').startEdit(span, 0);
  },

  onDeleteSpanClick: function () {
    this.getViewModel().getStore('spanStore').remove(
      this.getViewModel().get('selectedSpan')
    );
  },

  onCancelSpanEditing: function (editor, context) {
    if (context.record.phantom) {
      this.getViewModel().getStore('spanStore').remove(context.record);
    }
  }
});
