/* 2026-09-28, version 4.4.0-beta: ASGSR, Alexey Emanov */
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {loadSingleton} = require('./ext-singleton');

const dialog = loadSingleton(
  'classic/src/view/builder/parameter/items/channelresponse/RecalculateSensitivityDialog.js'
);

test('formatHz shows n/a for missing or non-positive values', () => {
  assert.equal(dialog.formatHz(null), 'n/a');
  assert.equal(dialog.formatHz(''), 'n/a');
  assert.equal(dialog.formatHz(0), 'n/a');
  assert.equal(dialog.formatHz(-1), 'n/a');
});

test('formatHz appends Hz for positive numbers', () => {
  assert.equal(dialog.formatHz(4.2458333), '4.2458333 Hz');
  assert.equal(dialog.formatHz('10'), '10 Hz');
});

test('formatReported shows value at frequency', () => {
  assert.equal(dialog.formatReported({}), 'n/a');
  assert.equal(dialog.formatReported({
    reported_sensitivity_value: 100,
    reported_sensitivity_frequency: null
  }), '100');
  assert.equal(dialog.formatReported({
    reported_sensitivity_value: 79894100000,
    reported_sensitivity_frequency: 4.2458333
  }), '79894100000 @ 4.2458333 Hz');
});

test('onRecalculateClick confirms Auto without a frequency field', () => {
  const choices = [];
  const win = Object.assign({}, dialog, {
    down: function () {
      return {getValue: function () { return 'auto'; }};
    },
    getOnConfirm: function () {
      return function (choice) { choices.push(choice); };
    },
    close: function () {}
  });
  win.onRecalculateClick();
  assert.equal(choices.length, 1);
  assert.equal(choices[0].frequencyMode, 'auto');
  assert.equal(choices[0].frequency, undefined);
});

test('onRecalculateClick confirms custom frequency', () => {
  const choices = [];
  const win = Object.assign({}, dialog, {
    down: function (id) {
      if (id === '#frequencyMode') {
        return {getValue: function () { return 'custom'; }};
      }
      if (id === '#customFrequency') {
        return {getValue: function () { return 1.5; }};
      }
      return null;
    },
    getOnConfirm: function () {
      return function (choice) { choices.push(choice); };
    },
    close: function () {}
  });
  win.onRecalculateClick();
  assert.equal(choices.length, 1);
  assert.equal(choices[0].frequencyMode, 'custom');
  assert.equal(choices[0].frequency, 1.5);
});
