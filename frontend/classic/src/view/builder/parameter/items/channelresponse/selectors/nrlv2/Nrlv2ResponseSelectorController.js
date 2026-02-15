/* ****************************************************************************
*
* NRLv2 Response Selector Controller - Same logic as NRL, data from webservice
*
* NRLv2 online support (2026): ASGSR, Alexey Emanov.
*
* ****************************************************************************/

Ext.define('yasmine.view.xml.builder.parameter.items.channelresponse.nrlv2.Nrlv2ResponseSelectorController', {
  extend: 'Ext.app.ViewController',
  alias: 'controller.nrlv2-response-selector',

  initViewModel: function () {
    let dataloggerStore = this.getStore('dataloggerStore');
    let sensorStore = this.getStore('sensorStore');
    dataloggerStore.on('load', this.onStoreLoad, this);
    sensorStore.on('load', this.onStoreLoad, this);
    dataloggerStore.getRoot().expand();
    sensorStore.getRoot().expand();
  },

  onStoreLoad: function (store, records, successful, deferredCount) {
    let me = this;
    deferredCount = deferredCount || 0;
    let root = store.getRoot();
    let breadcrumb = store === this.getStore('dataloggerStore')
      ? this.lookupReference('dataloggerCmp')
      : this.lookupReference('sensorCmp');
    if (!breadcrumb && root && root.hasChildNodes() && deferredCount < 5) {
      Ext.defer(function () { me.onStoreLoad(store, records, successful, deferredCount + 1); }, 100);
      return;
    }
    if (!breadcrumb) return;
    let sel = breadcrumb.getSelection();
    if (root && root.hasChildNodes() && !sel) {
      breadcrumb.setSelection(root);
    } else if (successful && sel && sel.hasChildNodes()) {
      breadcrumb.setSelection(null);
      breadcrumb.setSelection(sel);
    }
  },

  init: function () {
    let me = this;
    this.getView().on('boxready', function () {
      me.setupBreadcrumbLoadOnSelect(me.lookupReference('dataloggerCmp'), me.getStore('dataloggerStore'));
      me.setupBreadcrumbLoadOnSelect(me.lookupReference('sensorCmp'), me.getStore('sensorStore'));
    });
  },

  setupBreadcrumbLoadOnSelect: function (breadcrumb, store) {
    if (!breadcrumb || !store) return;
    let me = this;
    let url = store === me.getStore('dataloggerStore') ? '/api/nrlv2/dataloggers/' : '/api/nrlv2/sensors/';
    breadcrumb.on('selectionchange', function (cmp, node) {
      if (node && !node.isLeaf() && !node.hasChildNodes()) {
        let nodeId = node.getId();
        let path = (nodeId && nodeId !== '0' && nodeId !== 'root') ? nodeId : '';
        Ext.Ajax.request({
          url: url,
          method: 'GET',
          params: path ? { node: path } : {},
          success: function (resp) {
            let result = JSON.parse(resp.responseText);
            let data = result && result.data;
            if (data && Ext.isArray(data)) {
              Ext.Array.each(data, function (item) {
                node.appendChild(item);
              });
              if (cmp.getSelection() === node) {
                cmp.setSelection(null);
                cmp.setSelection(node);
              }
            }
          }
        });
      }
    });
  },

  getStore: function (name) {
    return this.getViewModel().getStore(name);
  },

  fillRecord: function () {
    let vm = this.getViewModel();
    let sensorInstconfig = vm.get('sensorInstconfig');
    let dataloggerInstconfig = vm.get('dataloggerInstconfig');
    if (!sensorInstconfig || !dataloggerInstconfig) return;

    let record = vm.get('record') || this.getView().up().lookupViewModel().get('record');
    if (record) {
      let instconfig = sensorInstconfig + ':' + dataloggerInstconfig;
      let sensorSource = vm.get('sensorSource');
      let dataloggerSource = vm.get('dataloggerSource');
      let source = (sensorSource && sensorSource === dataloggerSource) ? sensorSource : (sensorSource || dataloggerSource);
      record.set('value', { libraryType: 'nrlv2_online', instconfig: instconfig, source: source || undefined });
    }
  },

  isDataloggerCompleted: function () {
    return !!this.getViewModel().get('dataloggerPreview');
  },

  isSensorCompleted: function () {
    return !!this.getViewModel().get('sensorPreview');
  },

  getViewModel: function () {
    return this.getView().getViewModel();
  },

  onSensorSelectionChange: function (cmp, node) {
    this.showResponse(node, 'sensor', 'sensorInstconfig');
  },

  onSensorClick: function (item) {
    let node = this.getStore('sensorStore').getNodeById(item._breadcrumbNodeId);
    this.showResponse(node, 'sensor', 'sensorInstconfig');
  },

  onDataloggerSelectionChange: function (cmp, node) {
    this.showResponse(node, 'datalogger', 'dataloggerInstconfig');
  },

  onDataloggerClick: function (item) {
    let node = this.getStore('dataloggerStore').getNodeById(item._breadcrumbNodeId);
    this.showResponse(node, 'datalogger', 'dataloggerInstconfig');
  },

  showResponse: function (node, device, instconfigProperty) {
    let vm = this.getViewModel();
    vm.set(device + 'Preview', null);
    vm.set('channelResponseText', null);
    vm.set('channelResponseImageUrl', null);
    vm.set('channelResponseCsvUrl', null);
    vm.set(instconfigProperty, null);
    vm.set(device + 'Source', null);

    if (!node || !node.isLeaf()) {
      Ext.ux.Mediator.fireEvent('parameterEditorController-canSaveButton', false);
      return;
    }

    let instconfig = node.get('key');
    let source = node.get('source');
    vm.set(instconfigProperty, instconfig);
    vm.set(device + 'Source', source);
    this.loadPreviewResponse(device, instconfig, source);
  },

  loadPreviewResponse: function (device, instconfig, source) {
    let that = this;
    let params = { instconfig: instconfig };
    if (source) params.source = source;
    Ext.Ajax.request({
      method: 'GET',
      params: params,
      url: `/api/nrlv2/${device}/response/`,
      success: function (response) {
        that.getViewModel().set(device + 'Preview', response.responseText);
        that.loadChannelResponseIfPossible();
      },
      failure: function (response) {
        that.getViewModel().set(device + 'Preview', 'Error: ' + (response.status || 'Unknown'));
      }
    });
  },

  loadChannelResponseIfPossible: function () {
    let vm = this.getViewModel();
    let sensorInstconfig = vm.get('sensorInstconfig');
    let dataloggerInstconfig = vm.get('dataloggerInstconfig');
    if (!sensorInstconfig || !dataloggerInstconfig) return;

    let instconfig = sensorInstconfig + ':' + dataloggerInstconfig;
    let min = vm.get('minFrequency');
    let max = vm.get('maxFrequency');
    let sensorSource = vm.get('sensorSource');
    let dataloggerSource = vm.get('dataloggerSource');
    let source = (sensorSource && sensorSource === dataloggerSource) ? sensorSource : (sensorSource || dataloggerSource);
    let that = this;

    let params = { instconfig: instconfig, min: min, max: max };
    if (source) params.source = source;
    Ext.Ajax.request({
      method: 'GET',
      params: params,
      url: '/api/nrlv2/channel/response/preview/',
      success: function (response, options) {
        let result = JSON.parse(response.responseText);
        if (result.success) {
          vm.set('channelResponseText', result.text);
          vm.set('channelResponseImageUrl', result.plot_url);
          vm.set('channelResponseCsvUrl', result.csv_url);
          Ext.ux.Mediator.fireEvent('parameterEditorController-canSaveButton', true);
        } else {
          vm.set('channelResponseImageUrl', null);
          vm.set('channelResponseCsvUrl', null);
          Ext.MessageBox.show({
            title: 'An error occurred',
            msg: result.message || result.errorCode || 'Unknown error',
            buttons: Ext.MessageBox.OK,
            icon: Ext.MessageBox.ERROR
          });
        }
      }
    });
  },

  loadChannelResponsePlot: function () {
    this.loadChannelResponseIfPossible();
  },

  downloadChannelResponsePlot: function () {
    let url = this.getViewModel().get('channelResponseImageUrl');
    if (url) {
      let w = window.open('', '_blank');
      w.location = url;
      w.focus();
    }
  },

  downloadChannelResponseCsv: function () {
    let url = this.getViewModel().get('channelResponseCsvUrl');
    if (url) {
      let w = window.open('', '_self');
      w.location = url;
      w.focus();
    }
  }
});
