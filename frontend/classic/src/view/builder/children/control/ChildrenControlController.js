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
* 2026-09-26, version 4.4.0-beta: ASGSR, Alexey Emanov
*
* ****************************************************************************/


Ext.define('yasmine.view.xml.builder.children.control.ChildrenControlController', {
  extend: 'Ext.app.ViewController',
  alias: 'controller.children-control',
  init: function () {
    this.mon(Ext.ux.Mediator, 'node-selected', this.onNodeSelected, this);
    this.mon(Ext.ux.Mediator, 'node-updated', this.onNodeUpdated, this);
    this.mon(Ext.GlobalEvents, 'resize', this.syncMapButton, this, {buffer: 150});
    this.mon(Ext.GlobalEvents, 'resize', this.syncEpochField, this, {buffer: 150});
    this.syncMapButton();
    var view = this.getView();
    view.on('afterlayout', this.syncEpochField, this);
  },
  syncEpochField: function () {
    var view = this.getView();
    var field = view.down('#epochCombo');
    var fill = view.down('#epochFill');
    var layout = view.getLayout();
    var inner = layout && layout.innerCt;
    var used = 0;
    var room;
    var hideLabel;
    var width;
    if (!field || field.destroyed || !view.rendered || !inner) {
      return;
    }
    view.items.each(function (item) {
      var el;
      if (item === fill) {
        return false;
      }
      if (item === field || item.hidden || !item.rendered) {
        return;
      }
      el = item.getEl();
      used = Math.max(used, el.getLocalX() + el.getWidth());
    });
    room = inner.getWidth() - used;
    hideLabel = room < 246 + 8;
    width = hideLabel ? 186 : 246;
    if (field.hideLabel !== hideLabel) {
      field.setHideLabel(hideLabel);
    }
    if (field.getWidth() !== width) {
      field.setWidth(width);
    }
  },
  syncMapButton: function () {
    var button = this.getView().down('#mapButton');
    var narrow = yasmine.utils.ResponsiveUtil && yasmine.utils.ResponsiveUtil.getWidth() <= yasmine.utils.ResponsiveUtil.STACK_MAX;
    if (!button || button.destroyed) {
      return;
    }
    button.setText(narrow ? '' : 'Map');
  },
  initViewModel: function (viewModel) {
    viewModel.getStore('userLibraryStore').load({
      callback: (records) => {
        this.createExtractMenu(records);
        this.createInsertNodeMenu(records);
        this.getViewModel().notify();
      }
    });
  },
  createExtractMenu: function (records) {
    let extractMenu = records.map(x => {
      return {
        iconCls: 'x-fa fa-university',
        bind: {
          text: 'Extract a selected <b>{currentNodeTitle}</b> to <b>"' + x.get('name') + '"</b> user library'
        },
        libraryId: x.get('id'),
        libraryName: x.get('name'),
        handler: 'onExtractClick'
      }
    });
    this.getViewModel().set('extractNodeMenu', extractMenu);
  },
  createInsertNodeMenu: function (records) {
    let insertMenu = records.map(x => {
      return {
        iconCls: 'x-fa fa-university',
        bind: {
          text: x.get('name'),
        },
        libraryId: x.get('id'),
        libraryName: x.get('name'),
        handler: 'onInsertClick'
      }
    });
    this.getViewModel().set('insertNodeMenu', insertMenu);
  },
  deleteNode: function (nodeId) {
    let xmlId = this.getViewModel().get('xmlId');
    yasmine.services.NodeService.deleteNode(xmlId, nodeId).then(() => {
      Ext.ux.Mediator.fireEvent('node-deleted', nodeId);
    });
  },
  createDefaultNode: function () {
    let xmlId = this.getViewModel().get('xmlId');
    let selectedNode = this.getViewModel().get('selectedNode');
    if (!selectedNode) {
      return;
    }
    let nodeType = yasmine.utils.NodeTypeConverter.getChild(selectedNode.nodeType);
    yasmine.services.NodeService.createNode(xmlId, selectedNode.id, nodeType).then((result) => {
      Ext.ux.Mediator.fireEvent('node-created', result.responseData.nodeId);
    });
  },
  addNodeFromLibrary: function (libraryNodeId) {
    let xmlId = this.getViewModel().get('xmlId');
    let selectedNode = this.getViewModel().get('selectedNode');
    if (!selectedNode) {
      return;
    }
    let nodeType = yasmine.utils.NodeTypeConverter.getChild(selectedNode.nodeType);
    yasmine.services.NodeService.addNodeFromLibrary(xmlId, selectedNode.id, nodeType, libraryNodeId).then((result) => {
      Ext.ux.Mediator.fireEvent('node-created', result.responseData.nodeId);
    });
  },
  onNodeSelected: function (node) {
    this.getViewModel().set('selectedNode', node);
  },
  onNodeUpdated: function () {
    this.getViewModel().getStore('epochStore').reload();
  },
  onEpochClearClick: function () {
    this.getViewModel().set('selectedEpoch', null);
  },
  onEpochSelect: function (combo, record) {
    Ext.ux.Mediator.fireEvent('epoch-selected', record ? record.getData().date : null);
  },
  onExtractClick: function (event) {
    let selectedNode = this.getViewModel().get('selectedNode');
    if (!selectedNode || !selectedNode.id) {
      return;
    }
    let nodeType = selectedNode.nodeType;
    Ext.Ajax.request({
      url: '/api/user-library/node/',
      jsonData: {
        libraryId: event.libraryId,
        nodeType: nodeType,
        parentNodeId: null,
        nodeIdToClone: selectedNode.id
      },
      method: 'POST',
      success: function (response) {
        let result = JSON.parse(response.responseText);
        if (result.success) {
          Ext.toast({
            html: 'The ' + Ext.String.htmlEncode(yasmine.utils.NodeTypeConverter.toString(nodeType)) +
              ' has been added to "' + Ext.String.htmlEncode(event.libraryName || '') + '" library',
            align: 't'
          });
        } else {
          Ext.MessageBox.show({
            title: 'An error occurred',
            msg: result.message,
            buttons: Ext.MessageBox.OK,
            icon: Ext.MessageBox['ERROR']
          });
        }
      }
    });
  },
  onInsertClick: function (event) {
    let listView = Ext.create({
      xtype: 'library-list',
      listeners: {selected: (nodeId) => this.addNodeFromLibrary(nodeId)}
    });
    let selectedNode = this.getViewModel().get('selectedNode');
    let nodeType = yasmine.utils.NodeTypeConverter.getChild(selectedNode.nodeType);
    listView.getViewModel().set('nodeType', nodeType);
    listView.getViewModel().set('libraryId', event.libraryId);
    listView.getViewModel().set('libraryName', event.libraryName);
    listView.getViewModel().set('parentId', selectedNode.id);
    listView.getViewModel().set('xmlId', this.getViewModel().get('xmlId'));
    listView.show();
  },
  onWizardClick: function () {
    let selectedNode = this.getViewModel().get('selectedNode');
    if (!selectedNode) {
      return;
    }
    let wizard = Ext.create({
      xtype: 'wizard-create',
      listeners: {saved: () => Ext.ux.Mediator.fireEvent('node-created')}
    });

    let wizardModel = wizard.getViewModel();
    wizardModel.set('xmlId', this.getViewModel().get('xmlId'));
    wizardModel.set('networkId', null);
    wizardModel.set('networkCode', null);
    wizardModel.set('stationId', null);
    wizardModel.set('stationCode', null);

    yasmine.services.NodeService.findNodePath(selectedNode.id).then((data) => {
      if (wizard.destroyed) {
        return;
      }
      for (const node of data.path) {
        if (node.nodeType === yasmine.NodeTypeEnum.network) {
          wizardModel.set('networkId', node.id);
          wizardModel.set('networkCode', node.code);
        } else if (node.nodeType === yasmine.NodeTypeEnum.station) {
          wizardModel.set('stationId', node.id);
          wizardModel.set('stationCode', node.code);
        }
      }
      if (!selectedNode.root) {
        wizardModel.set('startNodeId', selectedNode.id);
        wizardModel.set('startNodeType', selectedNode.nodeType);
        wizardModel.set('startIndex', selectedNode.nodeType);
        wizardModel.set('currentIndex', selectedNode.nodeType);
      }
      wizard.show();
    });
  },
  onMapClick: function () {
    let selectedNode = this.getViewModel().get('selectedNode');
    if (!selectedNode) {
      return;
    }
    let epoch = this.getViewModel().get('selectedEpoch');
    let mapWindow = Ext.create({xtype: 'station-map'});
    mapWindow.getController().loadMap({
      xmlId: this.getViewModel().get('xmlId'),
      nodeId: selectedNode.id || 0,
      epoch: epoch && epoch.get ? epoch.get('date') : null,
      epochLabel: epoch && epoch.get ? epoch.get('dateString') : null
    });
    mapWindow.show();
  },
  onAddDefaultClick: function () {
    this.createDefaultNode();
  },
  onDeleteClick: function () {
    let node = this.getViewModel().get('selectedNode');
    if (!node) {
      return;
    }
    Ext.Msg.confirm('Confirm', "Are you sure you want to delete '" + Ext.String.htmlEncode(node.name || '') + "'?", (btn) => {
      if (btn === 'yes') {
        this.deleteNode(node.id);
      }
    });
  },
});
