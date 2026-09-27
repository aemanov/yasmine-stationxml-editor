/* ****************************************************************************
* 2026-09-28, version 4.4.0-beta: ASGSR, Alexey Emanov
*
* Frequency choice dialog before Recalculate Sensitivity.
*
* ****************************************************************************/


Ext.define('yasmine.view.xml.builder.parameter.items.channelresponse.RecalculateSensitivityDialog', {
  extend: 'Ext.window.Window',
  xtype: 'recalculate-sensitivity-dialog',
  requires: [
    'Ext.form.RadioGroup',
    'Ext.form.field.Number',
    'Ext.form.field.Display'
  ],

  title: 'Recalculate Sensitivity',
  modal: true,
  frame: false,
  cls: 'yasmine-window',
  layout: 'fit',
  width: 560,
  minWidth: 360,
  maxHeight: 640,
  bodyPadding: 12,
  closeAction: 'destroy',
  resizable: true,
  scrollable: 'y',

  config: {
    options: null,
    onConfirm: null
  },

  initComponent: function () {
    let options = this.getOptions() || {};
    let that = this;
    this.items = {
      xtype: 'form',
      reference: 'form',
      border: false,
      layout: {
        type: 'vbox',
        align: 'stretch'
      },
      items: [
        {
          xtype: 'component',
          cls: 'recalculate-sensitivity-warning',
          margin: '0 0 12 0',
          html: [
            '<p style="margin:0 0 8px 0;">',
            'ObsPy does <b>not</b> use the current InstrumentSensitivity frequency. ',
            'In Auto mode it takes the first-stage normalization frequency and caps it ',
            'by Nyquist&nbsp;/&nbsp;2 (so <code>f&nbsp;≤&nbsp;Fs&nbsp;/&nbsp;4</code>).',
            '</p>',
            '<p style="margin:0;color:#555;">',
            'That is why the recalculated frequency can look unexpected ',
            '(for example when sample rate is non-standard).',
            '</p>'
          ].join('')
        },
        {
          xtype: 'displayfield',
          fieldLabel: 'Reported sensitivity',
          labelWidth: 180,
          value: that.formatReported(options)
        },
        {
          xtype: 'displayfield',
          fieldLabel: 'First-stage normalization frequency',
          labelWidth: 180,
          value: that.formatHz(options.normalization_frequency)
        },
        {
          xtype: 'displayfield',
          fieldLabel: 'Response sample rate',
          labelWidth: 180,
          value: that.formatHz(options.sample_rate)
        },
        {
          xtype: 'displayfield',
          fieldLabel: 'Predicted Auto frequency',
          labelWidth: 180,
          value: that.formatHz(options.auto_frequency)
        },
        {
          xtype: 'radiogroup',
          itemId: 'frequencyMode',
          fieldLabel: 'Recalculation frequency',
          labelWidth: 180,
          columns: 1,
          vertical: true,
          simpleValue: true,
          local: true,
          value: 'auto',
          items: [
            {boxLabel: 'Auto (ObsPy default)', name: 'frequencyMode', inputValue: 'auto', checked: true},
            {boxLabel: 'Custom frequency', name: 'frequencyMode', inputValue: 'custom'}
          ],
          listeners: {
            change: function (group, value) {
              let field = that.down('#customFrequency');
              if (field) {
                field.setDisabled(value !== 'custom');
                if (value === 'custom') {
                  field.focus();
                }
              }
            }
          }
        },
        {
          xtype: 'numberfield',
          itemId: 'customFrequency',
          fieldLabel: 'Frequency (Hz)',
          labelWidth: 180,
          minValue: 1e-12,
          allowBlank: false,
          hideTrigger: false,
          decimalPrecision: 8,
          disabled: true,
          value: options.auto_frequency != null
            ? options.auto_frequency
            : (options.reported_sensitivity_frequency != null
              ? options.reported_sensitivity_frequency
              : 1)
        }
      ]
    };
    this.buttons = [
      {
        text: 'Cancel',
        handler: function () {
          that.close();
        }
      },
      {
        text: 'Recalculate',
        ui: 'default-toolbar',
        handler: function () {
          that.onRecalculateClick();
        }
      }
    ];
    this.callParent(arguments);
  },

  formatHz: function (value) {
    if (value == null || value === '') {
      return 'n/a';
    }
    let number = Number(value);
    if (!(number > 0)) {
      return 'n/a';
    }
    return number + ' Hz';
  },

  formatReported: function (options) {
    let value = options.reported_sensitivity_value;
    let freq = options.reported_sensitivity_frequency;
    if (value == null || value === '') {
      return 'n/a';
    }
    let valueText = Number(value);
    if (isNaN(valueText)) {
      valueText = value;
    }
    if (freq == null || freq === '') {
      return String(valueText);
    }
    return valueText + ' @ ' + Number(freq) + ' Hz';
  },

  onRecalculateClick: function () {
    let modeGroup = this.down('#frequencyMode');
    let mode = modeGroup ? modeGroup.getValue() : 'auto';
    let choice = {frequencyMode: mode === 'custom' ? 'custom' : 'auto'};
    if (choice.frequencyMode === 'custom') {
      let field = this.down('#customFrequency');
      let freq = field ? field.getValue() : null;
      if (freq == null || !(Number(freq) > 0)) {
        Ext.Msg.alert('Recalculate Sensitivity', 'Enter a frequency greater than zero.');
        return;
      }
      choice.frequency = Number(freq);
    }
    let onConfirm = this.getOnConfirm();
    this.close();
    if (typeof onConfirm === 'function') {
      onConfirm(choice);
    }
  }
});
