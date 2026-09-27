/* 2026-09-26, version 4.4.0-beta: ASGSR, Alexey Emanov */
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {loadSingleton} = require('./ext-singleton');

const util = loadSingleton('app/utils/ResponseRecalculateUtil.js');

function vm(values) {
  const store = Object.assign({}, values);
  return {
    get: function (key) {
      return store[key];
    },
    set: function (key, value) {
      store[key] = value;
    },
    getView: function () {
      return store.view || null;
    }
  };
}

test('withRecalculateFlag sets the flag only when a tree exists', () => {
  const value = {};
  util.withRecalculateFlag(value, vm({responseTree: {Stage: []}}));
  assert.equal(value.recalculateSensitivity, true);
  const other = {};
  util.withRecalculateFlag(other, vm({}));
  assert.equal(other.recalculateSensitivity, undefined);
});

test('isSelectorView uses the selector xtypes', () => {
  assert.equal(util.isSelectorView(vm({view: {xtype: 'nrlv2-response-selector'}})), true);
  assert.equal(util.isSelectorView(vm({view: {xtype: 'parameter-editor'}})), false);
  assert.equal(util.isSelectorView(null), false);
});

test('limitMaxForPointBudget lowers Max when Min is very small', () => {
  const model = vm({maxFrequency: 100});
  util.limitMaxForPointBudget(model, 1e-6);
  assert.ok(model.get('maxFrequency') < 100);
  assert.ok(model.get('maxFrequency') > 0);
  const unchanged = vm({maxFrequency: 100});
  util.limitMaxForPointBudget(unchanged, 0.01);
  assert.equal(unchanged.get('maxFrequency'), 100);
});

test('applyPlotMaxFrequency copies a numeric max', () => {
  const model = vm({maxFrequency: 10});
  util.applyPlotMaxFrequency(model, {max_frequency: '40'});
  assert.equal(model.get('maxFrequency'), 40);
  util.applyPlotMaxFrequency(model, {max_frequency: null});
  assert.equal(model.get('maxFrequency'), 40);
});

test('nodeInstanceId prefers the mapped nodeId field', () => {
  assert.equal(util.nodeInstanceId({
    get: function (key) {
      return key === 'nodeId' ? 42 : undefined;
    }
  }), 42);
  assert.equal(util.nodeInstanceId({
    get: function (key) {
      return key === 'node_inst_id' ? 7 : undefined;
    }
  }), 7);
  assert.equal(util.nodeInstanceId(null), null);
});

test('updateWizardActionButtons shows one recalculate button on the response tab', () => {
  const events = [];
  const wizard = loadSingleton('app/utils/ResponseRecalculateUtil.js', {
    Ext: {
      create: function (cfg) {
        return cfg;
      },
      ux: {
        Mediator: {
          fireEvent: function (name, payload) {
            events.push([name, payload]);
          }
        }
      }
    }
  });
  const controller = {recalculateSensitivity: function () {}};
  wizard.updateWizardActionButtons(vm({
    wizardMode: true,
    channelResponseText: 'B053F03',
    activeSelectorTab: 2,
    view: {getController: function () { return controller; }}
  }));
  assert.equal(events.length, 1);
  assert.equal(events[0][0], 'wizard-updateActionButtons');
  assert.equal(events[0][1].length, 1);
  assert.equal(events[0][1][0].text, 'Recalculate Sensitivity');
  events.length = 0;
  wizard.updateWizardActionButtons(vm({
    wizardMode: true,
    channelResponseText: 'B053F03',
    activeSelectorTab: 0,
    view: {getController: function () { return controller; }}
  }));
  assert.equal(events[0][1].length, 0);
  events.length = 0;
  wizard.updateWizardActionButtons(vm({wizardMode: false}));
  assert.equal(events.length, 0);
});

test('shouldShowRecalculateButton needs text and the XML tab', () => {
  assert.equal(util.shouldShowRecalculateButton(vm({
    channelResponseText: 'ok',
    activeSelectorTab: 2
  })), true);
  assert.equal(util.shouldShowRecalculateButton(vm({
    channelResponseText: 'ok',
    activeSelectorTab: 0
  })), false);
});

test('postRecalculateSensitivity merges frequencyMode into the payload', () => {
  const calls = [];
  const withAjax = loadSingleton('app/utils/ResponseRecalculateUtil.js', {
    Ext: {
      apply: function (object, config) {
        object = object || {};
        Object.assign(object, config || {});
        return object;
      },
      Ajax: {
        request: function (cfg) {
          calls.push(cfg);
        }
      }
    }
  });
  withAjax.postRecalculateSensitivity(
    {nodeInstanceId: 1, min: 0.001},
    {frequencyMode: 'custom', frequency: 1.5},
    {success: function () {}, failure: function () {}}
  );
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, '/api/channel/response/recalculate-sensitivity/');
  assert.equal(calls[0].jsonData.frequencyMode, 'custom');
  assert.equal(calls[0].jsonData.frequency, 1.5);
  assert.equal(calls[0].jsonData.nodeInstanceId, 1);
});

test('promptRecalculateSensitivity opens the dialog after options load', () => {
  const created = [];
  const withAjax = loadSingleton('app/utils/ResponseRecalculateUtil.js', {
    Ext: {
      create: function (name, cfg) {
        created.push([name, cfg]);
        return {show: function () { this.shown = true; }};
      },
      Ajax: {
        request: function (cfg) {
          cfg.success({
            responseText: JSON.stringify({
              success: true,
              normalization_frequency: 10,
              sample_rate: 16.9833332,
              auto_frequency: 4.2458333
            })
          });
        }
      },
      MessageBox: {show: function () {}, OK: 1, ERROR: 2}
    }
  });
  let confirmed = null;
  withAjax.promptRecalculateSensitivity({nodeInstanceId: 9}, function (choice) {
    confirmed = choice;
  });
  assert.equal(created.length, 1);
  assert.match(created[0][0], /RecalculateSensitivityDialog/);
  assert.equal(created[0][1].options.auto_frequency, 4.2458333);
  created[0][1].onConfirm({frequencyMode: 'auto'});
  assert.deepEqual(confirmed, {frequencyMode: 'auto'});
});
