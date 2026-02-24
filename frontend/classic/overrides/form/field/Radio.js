/* ****************************************************************************
 * Override: Radio - add tooltip support for bindings
 * Ext.form.field.Radio lacks setTooltip, causing "Cannot bind tooltip" error.
 *
 * NRLv2 online support (2026): ASGSR, Alexey Emanov.
 * ****************************************************************************/
Ext.define('overrides.form.field.Radio', {
  override: 'Ext.form.field.Radio',

  config: {
    /**
     * @cfg {String} tooltip
     * Tooltip text shown when hovering over the radio (requires Ext.tip.QuickTipManager).
     */
    tooltip: null
  },

  updateTooltip: function (tip) {
    var el = this.el;

    if (el && el.dom) {
      if (tip) {
        el.dom.setAttribute('data-qtip', Ext.htmlEncode(tip));
      } else {
        el.dom.removeAttribute('data-qtip');
      }
    }
  },

  onRender: function () {
    var me = this;

    me.callParent(arguments);

    if (me.tooltip) {
      me.updateTooltip(me.tooltip);
    }
  }
});
