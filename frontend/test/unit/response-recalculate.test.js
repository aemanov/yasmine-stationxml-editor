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
