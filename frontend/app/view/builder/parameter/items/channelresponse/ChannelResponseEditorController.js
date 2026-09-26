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
* NRLv2 online support (2026): ASGSR, Alexey Emanov.
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


Ext.define('yasmine.view.xml.builder.parameter.items.channelresponse.ChannelResponseEditorController', {
  extend: 'yasmine.view.xml.builder.parameter.ParameterItemEditorController',
  alias: 'controller.channel-response-editor',
  requires: [
    'Ext.ux.Mediator',
    'yasmine.utils.ResponseRecalculateUtil',
    'yasmine.view.xml.builder.parameter.items.channelresponse.preview.ResponsePreview',
    'yasmine.view.xml.builder.parameter.items.channelresponse.selectors.SelectorsContainer',
    'yasmine.view.xml.builder.parameter.items.channelresponse.treeeditor.ChannelResponseTreeEditor',
    'yasmine.view.xml.builder.parameter.items.channelresponse.nrl.NrlResponseSelector',
    'yasmine.view.xml.builder.parameter.items.channelresponse.nrl.NrlResponseTypeSelector',
    'yasmine.view.xml.builder.parameter.items.channelresponse.arol.ArolResponseSelector',
    'yasmine.view.xml.builder.parameter.items.channelresponse.nrlv2.Nrlv2ResponseSelector'
  ],
  init: function () {
    this.callParent(arguments);
    this.mon(Ext.GlobalEvents, 'nrlv2SettingsChanged', function () {
      let vm = this.getViewModel();
      if (vm) vm.set('settingsUpdatedAt', Date.now());
    }, this);
  },
  initData: function () {
    let record = this.getViewModel().get('record');
    let value = record.get('value');
    if (value) {
      this.getViewModel().set('channelResponseText', value);
      this.loadChannelResponsePlot();
      this.createPreview();
      return;
    }

    this.createResponseSelector();
  },
  fillRecord: function () {
    let currentViewRef = this.getViewModel().get('currentViewReference');
    let record = this.getViewModel().get('record');
    if (currentViewRef === 'response-preview') {
      let value = record.get('value');
      if (value && value.response) {
        return;
      }
      return;
    }
    let currentView = this.lookup(currentViewRef);
    if (!currentView && yasmine.utils.ResponseRecalculateUtil.SELECTOR_XTYPES.indexOf(currentViewRef) >= 0) {
      currentView = this.getView().items.getAt(0);
    }
    if (currentView && currentView.getController && currentView.getController().fillRecord) {
      currentView.getController().fillRecord();
      return;
    }
    if (currentViewRef === 'selectors-container') {
      return;
    }
    let child = this.getView().items.getAt(0);
    if (child && child.getController && child.getController().fillRecord) {
      child.getController().fillRecord();
    }
  },
  validate: function () {
    let currentViewRef = this.getViewModel().get('currentViewReference');
    let currentView = this.lookup(currentViewRef) || this.getView().items.getAt(0);
    if (currentView && currentView.getController) {
      let controller = currentView.getController();
      if (controller && controller.validate) {
        return controller.validate();
      }
    }
    return true;
  },
  createPreview: function () {
    this.createComponent('response-preview', [], false);
  },
  createResponseSelector: function () {
    this.createComponent('selectors-container', [], false);
  },
  createNrlResponseSelector: function () {
    this._pendingNrlLibrary = 'nrl';
    this.createComponent('nrl-response-type-selector', [], false);
  },
  createArolResponseSelector: function () {
    this.createComponent('arol-response-selector', [], false);
  },
  createNrlv2ResponseSelector: function () {
    this._pendingNrlLibrary = 'nrlv2_online';
    this.createComponent('nrl-response-type-selector', [], false);
  },
  openNrlSelector: function (responseType) {
    let library = this._pendingNrlLibrary || 'nrl';
    let xtype = library === 'nrlv2_online' ? 'nrlv2-response-selector' : 'nrl-response-selector';
    let element = (responseType === 'integrated' || responseType === 'soh') ? responseType : null;
    this.createComponent(xtype, [], false, {responseElement: element});
  },
  createXmlResponseEditor: function () {
    this.createComponent('channel-response-tree-editor', this.createTreeEditorActionButtons(), true);
  },
  createComponent: function (name, actionButtons, canSave, extraConfig) {
    let container = this.getView();
    let child;
    try {
      child = Ext.create(Ext.apply({
        xtype: name,
        reference: name,
        flex: 1,
        minHeight: 240
      }, extraConfig || {}));
    } catch (error) {
      Ext.MessageBox.alert(
        'Cannot open response editor',
        (error && error.message) || String(error)
      );
      return;
    }
    this.getViewModel().set('currentViewReference', name);
    let previous = container.items.getRange();
    container.removeAll(false, true);
    try {
      container.add(child);
    } catch (addError) {
      Ext.Array.each(previous, function (item) {
        if (item && !item.destroyed) {
          container.add(item);
        }
      });
      child.destroy();
      Ext.MessageBox.alert(
        'Cannot open response editor',
        (addError && addError.message) || String(addError)
      );
      return;
    }
    Ext.Array.each(previous, function (item) {
      if (item && !item.destroyed) {
        item.destroy();
      }
    });

    this.syncPreviewActionFlags(name);
    Ext.ux.Mediator.fireEvent('parameterEditorController-updateActionButtons', actionButtons);
    Ext.ux.Mediator.fireEvent('parameterEditorController-canSaveButton', canSave);
    this.syncSelectorActionButtons(name);
    this.syncEditorSize();
    let win = container.up('window');
    if (container.updateLayout) {
      container.updateLayout();
    }
    if (win && !win.destroyed && win.updateLayout) {
      win.updateLayout();
    }
    this.syncEditorSize();
  },
  syncEditorSize: function () {
    let view = this.getView();
    let win = view && view.up('window');
    if (!view || view.destroyed || !win || win.destroyed || !win.body) {
      return;
    }
    let height = win.body.getHeight(true);
    let width = win.body.getWidth(true);
    if (height < 1 || width < 1) {
      return;
    }
    if (view.getWidth() === width && view.getHeight() === height) {
      return;
    }
    if (view.getHeight() < 80) {
      view.setHeight(height);
    }
    if (view.getWidth() < 80) {
      view.setWidth(width);
    }
    let child = view.items && view.items.getAt(0);
    if (child && !child.destroyed) {
      if (child.getHeight && child.getHeight() < 80 && child.setHeight) {
        child.setHeight(height);
      }
      if (child.updateLayout) {
        child.updateLayout();
      }
    }
  },
  syncPreviewActionFlags: function (viewName) {
    let win = this.getView() && this.getView().up('window');
    let vm = win && win.getViewModel();
    let preview = viewName === 'response-preview';
    if (!vm) {
      return;
    }
    vm.set({
      showResponseActions: true,
      showEditResponse: preview,
      showSelectResponse: preview,
      showRecalculateSensitivity: preview,
      showImportResp: true
    });
  },
  onImportRespClick: function () {
    let field = this.lookupReference('respFileField');
    let input = field && (field.fileInputEl || (field.button && field.button.fileInputEl));
    if (input && input.dom) {
      input.dom.click();
    }
  },
  onRespFileChange: function (field) {
    if (!field || !field.getValue()) {
      return;
    }
    let form = this.lookupReference('respImportForm');
    let record = this.getViewModel().get('record');
    let nodeId = record && (record.get('nodeId') || record.get('node_inst_id'));
    let nodeField = this.lookupReference('respNodeInstanceId');
    if (nodeField) {
      nodeField.setValue(nodeId);
    }
    let that = this;
    form.getForm().submit({
      url: '/api/channel/response/import-resp/',
      success: function (fp, action) {
        field.reset();
        that.applyImportedResponse(action.result || {});
      },
      failure: function (fp, action) {
        field.reset();
        let message = (action && action.result && action.result.message) || 'Cannot import RESP file';
        Ext.Msg.alert('Import RESP', message);
      }
    });
  },
  applyImportedResponse: function (result) {
    let vm = this.getViewModel();
    let record = vm.get('record');
    if (result.text) {
      vm.set('channelResponseText', result.text);
      if (record) {
        record.set('value', result.text);
        record.commit();
      }
    }
    this.createPreview();
    this.loadChannelResponsePlot();
    Ext.ux.Mediator.fireEvent('channel-response-imported', {
      nodeId: record && (record.get('nodeId') || record.get('node_inst_id')),
      text: result.text,
      data: result.data
    });
  },
  syncSelectorActionButtons: function (viewName) {
    let name = viewName || this.getViewModel().get('currentViewReference');
    if (yasmine.utils.ResponseRecalculateUtil.SELECTOR_XTYPES.indexOf(name) < 0) {
      return;
    }
    let child = this.getView().items.getAt(0);
    if (!child || !child.getViewModel) {
      return;
    }
    let ctrl = child.getController();
    if (ctrl && typeof ctrl.syncActiveSelectorTab === 'function') {
      ctrl.syncActiveSelectorTab();
    }
    yasmine.utils.ResponseRecalculateUtil.updateParameterEditorActionButtons(child.getViewModel());
  },
  createActionButtons: function () {
    var stacked = yasmine.utils.ResponsiveUtil.useStackLayout();
    return [
      Ext.create({
        xtype: 'button',
        text: stacked ? 'Edit' : 'Edit Response',
        tooltip: 'Edit Response',
        iconCls: 'x-fa fa-pencil',
        handler: () => this.createXmlResponseEditor()
      }),
      Ext.create({
        xtype: 'button',
        text: stacked ? 'Select' : 'Select a new Response',
        tooltip: 'Select a new Response',
        iconCls: 'x-fa fa-pencil',
        handler: () => this.createResponseSelector()
      }),
      this.createRecalculateSensitivityButton(stacked)
    ]
  },
  createTreeEditorActionButtons: function () {
    return [this.createRecalculateSensitivityButton()];
  },
  createRecalculateSensitivityButton: function (stacked) {
    return Ext.create({
      xtype: 'button',
      text: 'Recalculate Sensitivity',
      tooltip: 'Recalculate Sensitivity',
      iconCls: 'x-fa fa-calculator',
      handler: () => this.recalculateSensitivity()
    });
  },
  recalculateSensitivity: function () {
    let that = this;
    let vm = this.getViewModel();
    let record = vm && vm.get('record');
    if (!record) {
      return;
    }
    let nodeInstanceId = record.get('node_inst_id');
    let currentViewRef = vm.get('currentViewReference');
    let payload = {
      nodeInstanceId: nodeInstanceId,
      min: vm.get('minFrequency'),
      max: vm.get('maxFrequency')
    };

    let pendingValue = record.get('value');
    if (pendingValue && pendingValue.response) {
      payload.response = pendingValue.response;
    }

    if (currentViewRef === 'channel-response-tree-editor') {
      let treeView = this.lookup('channel-response-tree-editor') || this.getView().items.getAt(0);
      if (treeView && treeView.getController) {
        let treeCtrl = treeView.getController();
        let store = treeCtrl.lookup('channelresponsetree').getStore();
        payload.response = treeCtrl.prepareResponse(store.getRoot().data.children);
      }
    }

    Ext.Ajax.request({
      method: 'POST',
      url: '/api/channel/response/recalculate-sensitivity/',
      jsonData: payload,
      success: function (response) {
        if (!that.getView() || that.getView().destroyed) {
          return;
        }
        let vm = that.getViewModel();
        if (!vm) {
          return;
        }
        let result = JSON.parse(response.responseText);
        if (!result.success) {
          Ext.MessageBox.show({
            title: 'An error occurred',
            msg: result.message,
            buttons: Ext.MessageBox.OK,
            icon: Ext.MessageBox['ERROR']
          });
          return;
        }

        vm.set('channelResponseText', result.text);
        vm.set('channelResponseImageUrl', result.plot_url);
        vm.set('channelResponseCsvUrl', result.csv_url);
        yasmine.utils.ResponseRecalculateUtil.applyPlotMaxFrequency(vm, result);
        record.set('value', {
          nodeId: record.get('nodeId'),
          response: result.data
        });
        Ext.ux.Mediator.fireEvent('parameterEditorController-canSaveButton', true);

        if (currentViewRef === 'channel-response-tree-editor') {
          let treeView = that.lookup('channel-response-tree-editor') || that.getView().items.getAt(0);
          if (treeView && treeView.getController) {
            let treeController = treeView.getController();
            let tree = treeController.lookupReference('channelresponsetree');
            let selection = tree.getSelection()[0];
            if (!selection) {
              selection = tree.getStore().findNode(
                'key',
                'InstrumentSensitivity',
                tree.getStore().getRoot(),
                true,
                false,
                true
              );
            }
            let selectedPath = selection ?
              treeController.buildNodeIdentityPath(selection) : null;
            treeController.reloadTree(result.data, selectedPath);
          }
        }
      },
      failure: function () {
        Ext.MessageBox.show({
          title: 'An error occurred',
          msg: 'Cannot recalculate sensitivity.',
          buttons: Ext.MessageBox.OK,
          icon: Ext.MessageBox['ERROR']
        });
      }
    });
  },
  downloadChannelResponsePlot: function () {
    let url = this.getViewModel().get('channelResponseImageUrl');
    if (!url) {
      return;
    }
    let win = window.open(url, '_blank');
    if (win) {
      win.focus();
    }
  },
  downloadChannelResponseCsv: function () {
    let url = this.getViewModel().get('channelResponseCsvUrl');
    if (!url) {
      return;
    }
    let win = window.open(url, '_self');
    if (win) {
      win.focus();
    }
  },
  loadChannelResponsePlot: function () {
    let record = this.getViewModel().get('record');
    let pendingValue = record && record.get('value');
    if (pendingValue && pendingValue.response) {
      this.recalculateSensitivity();
      return;
    }

    let that = this;
    let nodeInstanceId = record.get('node_inst_id');
    let min = this.getViewModel().get('minFrequency');
    let max = this.getViewModel().get('maxFrequency');
    Ext.Ajax.request({
      method: 'GET',
      params: {nodeInstanceId, min, max},
      url: `/api/channel/response/plot-url/`,
      success: function (response, options) {
        if (!that.getView() || that.getView().destroyed) {
          return;
        }
        let vm = that.getViewModel();
        if (!vm) {
          return;
        }
        let result = JSON.parse(response.responseText);
        if (!result.success) {
          Ext.MessageBox.show({
            title: 'An error occurred',
            msg: result.message,
            buttons: Ext.MessageBox.OK,
            icon: Ext.MessageBox['ERROR']
          });
        } else {
          vm.set('channelResponseImageUrl', result.plot_url);
          vm.set('channelResponseCsvUrl', result.csv_url);
          yasmine.utils.ResponseRecalculateUtil.applyPlotMaxFrequency(vm, result);
          var win = that.getView() && that.getView().up('window');
          if (win) {
            yasmine.utils.ResponsiveUtil.clampWindow(win);
          }
        }
      }
    });
  }
});
