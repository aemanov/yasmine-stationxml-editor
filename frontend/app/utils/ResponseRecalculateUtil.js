/* ****************************************************************************
* 2026-09-28, version 4.4.0-beta: ASGSR, Alexey Emanov
*
* Shared helpers for Recalculate Sensitivity in response selectors / wizard.
*
* ****************************************************************************/

Ext.define('yasmine.utils.ResponseRecalculateUtil', {
  singleton: true,

  requires: [
    'yasmine.view.xml.builder.parameter.items.channelresponse.RecalculateSensitivityDialog'
  ],

  SELECTOR_XTYPES: [
    'nrlv2-response-selector',
    'nrl-response-selector',
    'arol-response-selector'
  ],

  isSelectorView: function (vm) {
    let view = vm && vm.getView();
    return !!(view && this.SELECTOR_XTYPES.indexOf(view.xtype) >= 0);
  },

  withRecalculateFlag: function (value, vm) {
    if (vm && vm.get('responseTree')) {
      value.recalculateSensitivity = true;
    }
    return value;
  },

  nodeInstanceId: function (record) {
    if (!record || typeof record.get !== 'function') {
      return null;
    }
    let mapped = record.get('nodeId');
    if (mapped !== undefined && mapped !== null && mapped !== '') {
      return mapped;
    }
    let raw = record.get('node_inst_id');
    return raw === undefined ? null : raw;
  },

  getRecordFromContext: function (vm) {
    if (!vm) {
      return null;
    }
    let record = vm.get('record');
    if (record) {
      return record;
    }
    let view = vm.getView();
    if (view && view.up) {
      let parentVm = view.up().lookupViewModel();
      if (parentVm) {
        return parentVm.get('record');
      }
    }
    return null;
  },

  PLOT_POINT_BUDGET: 4000000,
  PLOT_MIN_WITHOUT_MAX_REDUCTION: 0.001,

  limitMaxForPointBudget: function (vm, minHz) {
    if (!vm) {
      return;
    }
    minHz = Number(minHz);
    var maxHz = Number(vm.get('maxFrequency'));
    if (!(minHz > 0) || !(minHz < this.PLOT_MIN_WITHOUT_MAX_REDUCTION) || !(maxHz > 0)) {
      return;
    }
    var limit = this.PLOT_POINT_BUDGET * minHz / 2;
    if (limit < minHz) {
      limit = minHz;
    }
    if (maxHz > limit) {
      vm.set('maxFrequency', limit);
    }
  },

  applyPlotMaxFrequency: function (vm, result) {
    if (!vm || !result || result.max_frequency == null || result.max_frequency === '') {
      return;
    }
    vm.set('maxFrequency', Number(result.max_frequency));
  },

  applyRecalculateResult: function (vm, result) {
    vm.set('channelResponseText', result.text);
    vm.set('channelResponseImageUrl', result.plot_url);
    vm.set('channelResponseCsvUrl', result.csv_url);
    vm.set('channelResponsePlotMessage', null);
    this.applyPlotMaxFrequency(vm, result);
    if (result.data) {
      vm.set('responseTree', result.data);
      if (!vm.get('wizardMode')) {
        if (!this.isSelectorView(vm)) {
          let record = this.getRecordFromContext(vm);
          if (record && record.get('nodeId')) {
            record.set('value', {
              nodeId: record.get('nodeId'),
              response: result.data
            });
          }
        }
        Ext.ux.Mediator.fireEvent('parameterEditorController-canSaveButton', true);
      }
    }
    this.updateWizardActionButtons(vm);
    this.updateParameterEditorActionButtons(vm);
  },

  updateWizardActionButtons: function (vm) {
    if (!vm || !vm.get('wizardMode')) {
      return;
    }
    if (!this.shouldShowRecalculateButton(vm)) {
      Ext.ux.Mediator.fireEvent('wizard-updateActionButtons', []);
      return;
    }
    let controller = vm.getView().getController();
    Ext.ux.Mediator.fireEvent('wizard-updateActionButtons', [
      this.createRecalculateButton(controller)
    ]);
  },

  updateParameterEditorActionButtons: function (vm) {
    if (!vm || vm.get('wizardMode')) {
      return;
    }
    if (!this.shouldShowRecalculateButton(vm)) {
      Ext.ux.Mediator.fireEvent('parameterEditorController-updateActionButtons', []);
      return;
    }
    let controller = vm.getView().getController();
    Ext.ux.Mediator.fireEvent('parameterEditorController-updateActionButtons', [
      this.createRecalculateButton(controller)
    ]);
  },

  shouldShowRecalculateButton: function (vm) {
    return !!vm.get('channelResponseText') && vm.get('activeSelectorTab') === 2;
  },

  createRecalculateButton: function (controller) {
    return Ext.create({
      xtype: 'button',
      text: 'Recalculate Sensitivity',
      tooltip: 'Recalculate Sensitivity',
      iconCls: 'x-fa fa-calculator',
      handler: function () {
        if (controller && typeof controller.recalculateSensitivity === 'function') {
          controller.recalculateSensitivity();
        }
      }
    });
  },

  showRecalculateError: function (message) {
    Ext.MessageBox.show({
      title: 'An error occurred',
      msg: message || 'Cannot recalculate sensitivity.',
      buttons: Ext.MessageBox.OK,
      icon: Ext.MessageBox.ERROR,
      width: 520
    });
  },

  /**
   * Load ObsPy frequency options, show the dialog, then call onConfirm(choice).
   * choice is {frequencyMode: 'auto'|'custom', frequency?: number}.
   */
  promptRecalculateSensitivity: function (payload, onConfirm) {
    let that = this;
    Ext.Ajax.request({
      method: 'POST',
      url: '/api/channel/response/recalculate-sensitivity-options/',
      jsonData: payload || {},
      success: function (response) {
        let result;
        try {
          result = JSON.parse(response.responseText);
        } catch (err) {
          that.showRecalculateError('Cannot load recalculation options.');
          return;
        }
        if (!result.success) {
          that.showRecalculateError(result.message || 'Cannot load recalculation options.');
          return;
        }
        Ext.create('yasmine.view.xml.builder.parameter.items.channelresponse.RecalculateSensitivityDialog', {
          options: result,
          onConfirm: onConfirm
        }).show();
      },
      failure: function () {
        that.showRecalculateError('Cannot load recalculation options.');
      }
    });
  },

  /**
   * POST recalculate-sensitivity with optional frequencyMode/frequency from the dialog.
   */
  postRecalculateSensitivity: function (payload, choice, handlers) {
    handlers = handlers || {};
    let jsonData = Ext.apply({}, payload || {});
    if (choice && choice.frequencyMode) {
      jsonData.frequencyMode = choice.frequencyMode;
      if (choice.frequencyMode === 'custom' && choice.frequency != null) {
        jsonData.frequency = choice.frequency;
      }
    }
    Ext.Ajax.request({
      method: 'POST',
      url: '/api/channel/response/recalculate-sensitivity/',
      jsonData: jsonData,
      success: handlers.success,
      failure: handlers.failure
    });
  }
});
