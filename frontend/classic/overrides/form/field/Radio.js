/* ****************************************************************************
 * Override: Radio - add tooltip support for bindings
 * Ext.form.field.Radio lacks setTooltip, causing "Cannot bind tooltip" error.
 * Implements tooltip like Ext.button.Button (data-qtip for QuickTips).
 *
 * NRLv2 online support (2026): ASGSR, Alexey Emanov.
 * ****************************************************************************/
Ext.define('overrides.form.field.Radio', {
  override: 'Ext.form.field.Radio',

  tooltip: null,

  setTooltip: function (tip) {
    var me = this;

    me.tooltip = tip;
    if (me.rendered && me.el && me.el.dom) {
      if (tip) {
        me.el.dom.setAttribute('data-qtip', Ext.htmlEncode(tip));
      } else {
        me.el.dom.removeAttribute('data-qtip');
      }
    }
  },

  onRender: function () {
    var me = this;

    me.callParent(arguments);

    if (me.tooltip && me.el && me.el.dom) {
      me.el.dom.setAttribute('data-qtip', Ext.htmlEncode(me.tooltip));
    }
  }
});
