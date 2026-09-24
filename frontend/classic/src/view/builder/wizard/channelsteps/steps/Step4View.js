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
* ****************************************************************************/


Ext.define('yasmine.view.xml.builder.wizard.channelsteps.steps.Step4View', {
  extend: 'Ext.panel.Panel',
  xtype: 'channel-step-4',
  controller: {
    isValid: function () {
      let viewModel = this.getViewModel();
      if (viewModel.get('sohMode') && viewModel.get('orientationApplies') !== true && viewModel.get('orientationApplies') !== false) {
        Ext.Msg.alert('Error', 'Please choose whether orientation applies to this channel', Ext.emptyFn);
        return false;
      }
      let items = this.getView().items;
      for (let i = 0; i < items.getCount(); i++) {
        let item = items.getAt(i);
        if (item.isHidden && item.isHidden()) {
          continue;
        }
        if (item.validate && !item.validate()) {
          return false;
        }
      }
      return true;
    },
    initComponent: function () {
      let viewModel = this.getViewModel();
      viewModel.set('codePrefix', null);
      viewModel.set('orient', null);
      viewModel.set('sohMode', false);
      viewModel.set('orientationApplies', null);
      viewModel.set('sohChannelCode', null);
      viewModel.set('sohSuggestedPrefix', null);
      viewModel.set('sohSuggestedCode', null);
      viewModel.set('scalarChannel', false);
      viewModel.set('sampleRateKnown', true);
      viewModel.set('resolvedSampleRate', null);
      let question = this.lookup('orientationApplies');
      if (question) {
        question.reset();
      }

      let stepsData = this.getViewModel().get('stepsStoredData');
      let knownRate = stepsData.sampleRate || stepsData.sohSampleRate;
      if (this.rateIsKnown(knownRate)) {
        viewModel.set('resolvedSampleRate', knownRate);
        viewModel.set('sampleRateKnown', true);
      } else if (stepsData.selectedLibrary === 'none') {
        viewModel.set('sampleRateKnown', false);
        return;
      }

      let responseType = stepsData.nrlResponseType;
      if (responseType === 'soh') {
        viewModel.set('sohMode', true);
        this.loadSohSuggestion();
        return;
      }
      this.loadChannelPrefix();
    },
    rateIsKnown: function (value) {
      if (value === null || value === undefined || value === '' || value === '*') {
        return false;
      }
      return /[0-9]/.test(String(value));
    },
    onAskedSampleRateBlur: function (field) {
      let value = field.getValue();
      if (!this.rateIsKnown(value)) {
        return;
      }
      let viewModel = this.getViewModel();
      viewModel.set('resolvedSampleRate', value);
      let stepsData = viewModel.get('stepsStoredData');
      stepsData.sampleRate = value;
      stepsData.sohSampleRate = value;
      if (viewModel.get('sohMode')) {
        this.loadSohSuggestion();
      } else if (stepsData.selectedLibrary !== 'none') {
        this.loadChannelPrefix();
      }
    },
    applyResolvedRate: function (suggestion) {
      let viewModel = this.getViewModel();
      if (suggestion && this.rateIsKnown(suggestion.sampleRate)) {
        viewModel.set('sampleRateKnown', true);
        if (!this.rateIsKnown(viewModel.get('resolvedSampleRate'))) {
          viewModel.set('resolvedSampleRate', suggestion.sampleRate);
        }
        return;
      }
      if (!this.rateIsKnown(viewModel.get('resolvedSampleRate'))) {
        viewModel.set('sampleRateKnown', false);
      }
    },
    loadChannelPrefix: function () {
      let stepsData = this.getViewModel().get('stepsStoredData');
      Ext.Ajax.request({
        scope: this,
        jsonData: {
          libraryType: stepsData.selectedLibrary,
          nrlResponseType: stepsData.nrlResponseType,
          sensorType: stepsData.sensorType || null,
          angularPeriod: stepsData.angularPeriod || null,
          sampleRate: stepsData.sampleRate || null,
          inputUnits: stepsData.inputUnits || null,
          instconfig: stepsData.instconfig || null,
          description: stepsData.configDescription || '',
          sensorKeys: stepsData.sensorKeys || [],
          dataloggerKeys: stepsData.dataloggerKeys || []
        },
        url: '/api/wizard/guess/prefix/',
        method: 'POST',
        success: function (response) {
          let suggestion = Ext.decode(response.responseText, true) || {};
          let viewModel = this.getViewModel();
          let stepsData = viewModel.get('stepsStoredData');
          this.applyResolvedRate(suggestion);
          let scalar = stepsData.nrlResponseType !== 'integrated' && suggestion.orientationApplies === false;
          if (scalar) {
            viewModel.set('scalarChannel', true);
            viewModel.set('sohChannelCode', suggestion.code || suggestion.prefix || '');
          } else if (suggestion.prefix) {
            viewModel.set('codePrefix', suggestion.prefix);
          }
          this.refreshWizardNavigation();
        }
      });
    },
    loadSohSuggestion: function () {
      let stepsData = this.getViewModel().get('stepsStoredData');
      let payload = {
        channelDescription: stepsData.sohChannelDescription || null,
        sampleRate: stepsData.sohSampleRate || null,
        libraryType: stepsData.selectedLibrary,
        sensorKeys: stepsData.sensorKeys || []
      };
      Ext.Ajax.request({
        scope: this,
        jsonData: payload,
        url: '/api/wizard/guess/soh-code/',
        method: 'POST',
        success: function (response) {
          let suggestion = Ext.decode(response.responseText, true) || {};
          let viewModel = this.getViewModel();
          this.applyResolvedRate(suggestion);
          viewModel.set('sohSuggestedPrefix', suggestion.prefix || '');
          viewModel.set('sohSuggestedCode', suggestion.code || '');
          this.applySohSuggestion();
          this.refreshWizardNavigation();
        }
      });
    },
    applySohSuggestion: function () {
      let viewModel = this.getViewModel();
      if (viewModel.get('orientationApplies') === true && !viewModel.get('codePrefix')) {
        viewModel.set('codePrefix', viewModel.get('sohSuggestedPrefix') || '');
      }
      if (viewModel.get('orientationApplies') === false && !viewModel.get('sohChannelCode')) {
        viewModel.set('sohChannelCode', viewModel.get('sohSuggestedCode') || '');
      }
    },
    onOrientationAppliesChange: function (group, value) {
      let answer = value && value.orientationApplies;
      let viewModel = this.getViewModel();
      if (answer !== 'yes' && answer !== 'no') {
        viewModel.set('orientationApplies', null);
        this.refreshWizardNavigation();
        return;
      }
      viewModel.set('orientationApplies', answer === 'yes');
      this.applySohSuggestion();
      this.refreshWizardNavigation();
    },
    refreshWizardNavigation: function () {
      let wizard = this.getView().up('wizard-per-sample-rate-channel');
      if (wizard) {
        wizard.getController().updateNavigationButtonState();
      }
    },
    storeStepData: function () {
      let viewModel = this.getViewModel();
      let orient = viewModel.get('orient');
      let codePrefix = viewModel.get('codePrefix');
      let channelInfo = this.getViewModel().get('channelInfo');
      if (this.rateIsKnown(viewModel.get('resolvedSampleRate'))) {
        channelInfo.set('sampleRate', viewModel.get('resolvedSampleRate'));
      }

      if (viewModel.get('scalarChannel') || (viewModel.get('sohMode') && viewModel.get('orientationApplies') === false)) {
        channelInfo.set('code1', viewModel.get('sohChannelCode') || '');
        channelInfo.set('code2', '');
        channelInfo.set('code3', '');
        channelInfo.set('omitDipAzimuth', true);
        return;
      }
      channelInfo.set('omitDipAzimuth', false);

      if (orient === yasmine.ChannelOrient.ZNE) {
        channelInfo.set('code1', codePrefix + 'Z')
        channelInfo.set('code2', codePrefix + 'N')
        channelInfo.set('code3', codePrefix + 'E')
        channelInfo.set('dip1', -90)
        channelInfo.set('dip2', 0)
        channelInfo.set('dip3', 0)
        channelInfo.set('azimuth1', 0)
        channelInfo.set('azimuth2', 0)
        channelInfo.set('azimuth3', 90)
      } else if (orient === yasmine.ChannelOrient.Z12) {
        channelInfo.set('code1', codePrefix + 'Z')
        channelInfo.set('code2', codePrefix + '1')
        channelInfo.set('code3', codePrefix + '2')
        channelInfo.set('dip1', 0)
        channelInfo.set('dip2', 0)
        channelInfo.set('dip3', 0)
        channelInfo.set('azimuth1', 0)
        channelInfo.set('azimuth2', 0)
        channelInfo.set('azimuth3', 0)
      } else if (orient === yasmine.ChannelOrient.Z) {
        channelInfo.set('code1', codePrefix + 'Z')
        channelInfo.set('code2', '')
        channelInfo.set('code3', '')
        channelInfo.set('dip1', -90)
        channelInfo.set('dip2', 0)
        channelInfo.set('dip3', 0)
        channelInfo.set('azimuth1', 0)
        channelInfo.set('azimuth2', 0)
        channelInfo.set('azimuth3', 0)
      }
    }
  },
  layout: {
    type: 'vbox',
    align: 'stretch',
    pack: 'start'
  },
  maxWidth: 420,
  minWidth: 0,
  defaults: {
    labelWidth: 150,
  },
  items: [
    {
      xtype: 'numberfield',
      reference: 'askedSampleRate',
      fieldLabel: 'Sample Rate (Hz)',
      minValue: 0,
      allowDecimals: true,
      decimalPrecision: 6,
      allowBlank: false,
      bind: {
        hidden: '{sampleRateKnown}'
      },
      listeners: {
        blur: 'onAskedSampleRateBlur'
      }
    },
    {
      xtype: 'radiogroup',
      reference: 'orientationApplies',
      fieldLabel: 'Orientation applies',
      columns: 1,
      simpleValue: false,
      bind: {
        hidden: '{!showSohQuestion}'
      },
      items: [
        {boxLabel: 'Yes', name: 'orientationApplies', inputValue: 'yes'},
        {boxLabel: 'No', name: 'orientationApplies', inputValue: 'no'}
      ],
      listeners: {
        change: 'onOrientationAppliesChange'
      }
    },
    {
      xtype: 'textfield',
      fieldLabel: 'Channel code',
      bind: {
        value: '{sohChannelCode}',
        hidden: '{!showSohName}'
      },
      maxLength: 3,
      enforceMaxLength: true,
      allowBlank: false
    },
    {
      xtype: 'textfield',
      fieldLabel: 'Channel Prefix',
      reference: 'codePrefix',
      bind: {
        value: '{codePrefix}',
        hidden: '{!showOrientedCode}'
      },
      maxLength: 2,
      enforceMaxLength: true,
      allowBlank: false
    },
    {
      xtype: 'combobox',
      fieldLabel: 'Channel Orientation',
      bind: {
        value: '{orient}',
        hidden: '{!showOrientedCode}'
      },
      allowBlank: false,
      editable: false,
      displayField: 'name',
      valueField: 'id',
      store: {
        store: 'store.array',
        fields: ['id', 'name'],
        data: [
          [yasmine.ChannelOrient.ZNE, 'ZNE (3 channels)'],
          [yasmine.ChannelOrient.Z12, 'Z12 (3 channels)'],
          [yasmine.ChannelOrient.Z, 'Z (1 channel)']
        ]
      },
      forceSelection: true
    }
  ]
});
