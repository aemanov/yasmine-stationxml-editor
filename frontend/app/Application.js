/**
 * The main application class. An instance of this class is created by app.js
 * when it calls Ext.application(). This is the ideal place to handle
 * application launch and initialization details.
 *
 * NRLv2 online support (2026): ASGSR, Alexey Emanov.
 */
Ext.ns('yasmine.Globals');
yasmine.Globals.NotApplicable = '';
yasmine.Globals.DatePrintLongFormat = 'Y-m-d H:i:s';
yasmine.Globals.DatePrintShortFormat = 'Y-m-d';
yasmine.Globals.DateReadFormat = 'd/m/Y H:i:s';
yasmine.Globals.BuilderViewMode = 1;
yasmine.Globals.Settings = null;
yasmine.Globals.LocationColorScale = null; // Very ugly solution. TODO: find a better way to implement it
yasmine.Globals.logoUrl = function (file) {
  file = file || 'logo.png';
  try {
    if (Ext.manifest && typeof Ext.manifest === 'object' && Ext.manifest.resources) {
      return Ext.getResourcePath('images/' + file, 'shared');
    }
  } catch (e) {}
  return 'resources/images/' + file;
};

Ext.util.JSON.encodeDate = function (o) {
  return '"' + Ext.Date.format(o, yasmine.Globals.DateReadFormat) + '"'
};

Ext.define('yasmine.Application', {
  extend: 'Ext.app.Application',
  name: 'yasmine',
  requires: [
    'Ext.grid.plugin.RowEditing',
    'overrides.grid.plugin.RowEditing',
    'overrides.form.field.Radio',
    'yasmine.view.settings.Settings',
    'yasmine.utils.SettingsUtil',
    'yasmine.utils.ResponsiveUtil'
  ],
  quickTips: false,
  platformConfig: {
    desktop: {
      quickTips: true
    }
  },
  defaultToken: 'xmls',
  stores: [
    // TODO: add global / shared stores here
  ],
  init: function () {
    // Suppress WAI-ARIA compatibility warnings (menu button SPACE/ENTER conflict)
    Ext.ariaWarn = Ext.emptyFn;

    // Ensure Radio has setTooltip for bindings (Ext.form.field.Radio lacks it; Bindable requires it)
    var Radio = Ext.form && Ext.form.field && Ext.form.field.Radio;
    if (Radio) {
      Radio.prototype.setTooltip = function (tip) {
        this.tooltip = tip;
        if (this.rendered && this.el && this.el.dom) {
          if (tip) {
            this.el.dom.setAttribute('data-qtip', Ext.htmlEncode(tip));
          } else {
            this.el.dom.removeAttribute('data-qtip');
          }
        }
      };
    }

    Ext.Ajax.setTimeout(120000);
    Ext.Ajax.on('requestexception', function (conn, response, options) {
      var message;
      try {
        var parsed = JSON.parse(response.responseText || '{}');
        message = parsed.data || parsed.message || parsed.reason || 'Please try again or contact your administrator.';
      } catch (error) {
        message = 'Please try again or contact your administrator.'
      }
      Ext.MessageBox.show({
        title: 'An error occurred',
        msg: message,
        buttons: Ext.MessageBox.OK,
        icon: Ext.MessageBox['ERROR']
      });
    });
    Ext.Error.handle = function (err) {
      Ext.MessageBox.show({
        title: 'An error occurred',
        msg: 'Please try again or contact your administrator.',
        buttons: Ext.MessageBox.OK,
        icon: Ext.MessageBox['ERROR']
      });
    };
    var requestCounter = 0;
    Ext.Ajax.on('beforerequest', function () {
      if (requestCounter === 0) {
        var splashscreen = Ext.getBody().mask('Loading...');
        splashscreen.dom.style.zIndex = '99999';
        splashscreen.show({
          delay: 700
        });
      }
      requestCounter++;
    }, this);
    Ext.Ajax.on('requestcomplete', function (conn, response) {
      requestCounter--;
      if (requestCounter === 0) {
        Ext.getBody().unmask();
      }
      if (response.responseText) {
        let result = {};
        try {
          result = JSON.parse(response.responseText);
        } catch (e) {
          result = {};
        }

        response.responseData = {};
        if (result.hasOwnProperty('success') && !result.success) {
          Ext.MessageBox.show({
            title: 'An error occurred',
            msg: result.message || result.data || 'Please try again or contact your administrator.',
            buttons: Ext.MessageBox.OK,
            icon: Ext.MessageBox['ERROR']
          });
        } else if (result.hasOwnProperty('data')) {
          response.responseData = Array.isArray(result.data)
            ? result.data.slice()
            : Object.assign({}, result.data);
        }
      }
    }, this);
    Ext.Ajax.on('requestexception', function () {
      requestCounter--;
      if (requestCounter === 0) {
        Ext.getBody().unmask();
      }
    }, this);
  },
  launch: function () {
    try {
      yasmine.utils.ResponsiveUtil.bind();
    } catch (bindError) {
      Ext.log.warn('ResponsiveUtil.bind failed: ' + bindError);
    }
    try {
      yasmine.services.SettingsService.initSettings();
    } catch (settingsError) {
      Ext.log.warn('SettingsService.initSettings failed: ' + settingsError);
    }
    if (typeof window.yasmineHideSplash === 'function') {
      Ext.defer(window.yasmineHideSplash, 1);
    }

    Ext.define('Override.form.field.VTypes', {
      override: 'Ext.form.field.VTypes',
      phoneNumber: function (value) {
        return this.phoneNumberRe.test(value);
      },
      phoneNumberRe: /[0-9]{3}-[0-9]+/,
      phoneNumberText: 'Not a valid phone number. Must be in the form "XXX-XXXX", e.g. 123-4567',
      phoneNumberMask: /[\d-]/,
      countryCode: function (value) {
        return this.countryCodeRe.test(value);
      },
      countryCodeRe: /^[0-9]{1,2}$/,
      countryCodeText: 'Country code must be 1 or 2 digits',
      countryCodeMask: /[0-9]/,
      areaCode: function (value) {
        return this.areaCodeRe.test(value);
      },
      areaCodeRe: /^[0-9]{3,4}$/,
      areaCodeText: 'Area code must be 3 or 4 digits',
      areaCodeMask: /[0-9]/
    });
  },
  onAppUpdate: function () {
    Ext.Msg.confirm('Application Update', 'This application has an update, reload?', function (choice) {
      if (choice === 'yes') {
        window.location.reload();
      }
    });
  }
});
