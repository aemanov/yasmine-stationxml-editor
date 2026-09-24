/* ****************************************************************************
*
* Shared helpers for Recalculate Sensitivity in response selectors / wizard.
*
* ****************************************************************************/

Ext.define('yasmine.utils.ResponseRecalculateUtil', {
  singleton: true,

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
    Ext.ux.Mediator.fireEvent('wizard-updateActionButtons', []);
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
    var stacked = yasmine.utils.ResponsiveUtil.useStackLayout();
    return Ext.create({
      xtype: 'button',
      text: stacked ? 'Recalculate' : 'Recalculate Sensitivity',
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
      icon: Ext.MessageBox.ERROR
    });
  }
});
