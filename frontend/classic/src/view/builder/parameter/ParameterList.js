/* ****************************************************************************
*
* This file is part of the yasmine editing tool.
*
* yasmine (Yet Another Station Metadata INformation Editor), a tool to
* create and edit station metadata information in FDSN stationXML format,
* is a common development of IRIS and RESIF.
* Development and addition of new features is shared and agreed between * IRIS and RESIF.
*
*
* Version 1.0 of the software was funded by SAGE, a major facility fully
* funded by the National Science Foundation (EAR-1261681-SAGE),
* development done by ISTI and led by IRIS Data Services.
* Version 2.0 of the software was funded by CNRS and development led by * RESIF.
*
* This program is free software; you can redistribute it
* and/or modify it under the terms of the GNU Lesser General Public
* License as published by the Free Software Foundation; either
* version 3 of the License, or (at your option) any later version. *
* This program is distributed in the hope that it will be
* useful, but WITHOUT ANY WARRANTY; without even the implied warranty
* of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU Lesser General Public License (GNU-LGPL) for more details. *
* You should have received a copy of the GNU Lesser General Public
* License along with this software. If not, see
* <https://www.gnu.org/licenses/>
*
*
* 2019/10/07 : version 2.0.0 initial commit
*
* ****************************************************************************/


Ext.define('yasmine.view.xml.builder.parameter.ParameterList', {
  extend: 'Ext.grid.Panel',
  xtype: 'parameter-list',
  requires: [
    'Ext.toolbar.Paging',
    'yasmine.view.xml.builder.parameter.ParameterListModel',
    'yasmine.view.xml.builder.parameter.ParameterListController',
    'yasmine.view.xml.builder.parameter.ParameterEditor',
    'yasmine.view.xml.builder.parameter.ParameterEditorExt',
    'yasmine.view.xml.builder.parameter.items.measurement.MeasurementMetadata',
    'yasmine.view.xml.builder.parameter.items.measurement.MeasurementMetadataWindow'
  ],
  viewModel: 'parameter-list',
  controller: 'parameter-list',
  initComponent: function () {
    if (this.hideTitle || (this.config && this.config.hideTitle)) {
      this.tools = [];
      this.collapsible = false;
    }
    this.callParent();
  },
  bind: {
    store: '{infoStore}',
    title: '{title}',
    selection: '{theRow}'
  },
  multiColumnSort: true,
  viewConfig: {
    loadMask: false
  },
  plugins: {
    ptype: 'cellediting',
    clicksToEdit: 1,
    getEditor: function (record, column) {
      var old = column.getItemId;
      column.getItemId = function () {
        return record.id
      };
      var editor = Ext.grid.plugin.CellEditing.prototype.getEditor.call(this, record, column);
      column.getItemId = old;
      return editor;
    },
    listeners: {
      beforeedit: 'onBeginEdit',
      canceledit: 'onCancelCellEditFinish',
      edit: 'onCellEdit',
      validateedit: 'onCellEditValidate'
    }
  },
  columns: [
    {
      text: 'Name',
      dataIndex: 'name',
      renderer: 'nameRenderer',
      flex: 1
    },
    {
      text: 'Value',
      flex: 1,
      dataIndex: 'value',
      renderer: 'valueRenderer',
      cachedEditors: new Ext.util.HashMap(),
      getEditor: function (record) {
        let field = this.cachedEditors.get(record.get('id'));
        if (!field) {
          field = Ext.create({
            xtype: record.get('attr_class')
          });
          field.getViewModel().set('record', record);
        }
        return field
      },
      editor: {
        completeOnEnter: true,
        field: {
          xtype: 'textfield',
          allowBlank: false
        }
      }
    },
    {
      xtype: 'actioncolumn',
      text: 'Metadata',
      width: 76,
      align: 'center',
      menuDisabled: true,
      sortable: false,
      items: [{
        handler: 'onMeasurementMetadataClick',
        isDisabled: function (view, rowIndex, colIndex, item, record) {
          return !yasmine.view.xml.builder.parameter.items.measurement.MeasurementMetadata
            .isSupported(record.get('name'));
        },
        getTip: function (value, metadata, record) {
          var helper = yasmine.view.xml.builder.parameter.items.measurement.MeasurementMetadata;
          if (!helper.isSupported(record.get('name'))) {
            return null;
          }
          return Ext.htmlEncode(
            helper.getSummary(record.get('name'), record.get('valueMeta')) ||
            'Add measurement metadata'
          );
        },
        getClass: function (value, metadata, record) {
          var helper = yasmine.view.xml.builder.parameter.items.measurement.MeasurementMetadata;
          if (!helper.isSupported(record.get('name'))) {
            return 'x-hidden-display';
          }
          return 'x-fa fa-sliders';
        }
      }]
    }
  ],
  listeners: {
    cellkeydown: 'onCellKeyDown'
  },
  tools: [
    {
      type: 'help',
      handler: 'onHelpClick'
    }
  ],
  tbar: [
    {
      xtype: 'combobox',
      disabled: true,
      width: 200,
      bind: {
        selection: '{selectedAvailableParameter}',
        store: '{availableParamsStore}',
        disabled: '{!isAvailableParamsEnabled}'
      },
      displayField: 'name',
      reference: 'availableParamsCntr',
      emptyText: 'Add Field',
      queryMode: 'local',
      listeners: {
        select: 'onAddClick'
      },
      triggers: {
        clear: {
          cls: 'x-form-clear-trigger',
          handler: function (cmp) {
            cmp.clearValue();
          }
        }
      }
    },
    {
      tooltip: 'Delete Parameter',
      iconCls: 'x-fa fa-minus',
      handler: 'onDeleteClick',
      disabled: true,
      bind: {
        disabled: '{!theRow}'
      }
    }
  ]
});
