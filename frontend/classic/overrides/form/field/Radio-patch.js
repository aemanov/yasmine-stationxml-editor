/**
 * Early patch: add setTooltip to Ext.form.field.Radio before app loads.
 * Must run after ext-all-debug.js. Fixes "Cannot bind tooltip" error.
 */
(function waitForExt() {
  if (typeof Ext === 'undefined' || !Ext.form || !Ext.form.field || !Ext.form.field.Radio) {
    setTimeout(waitForExt, 10);
    return;
  }

  if (typeof Ext.form.field.Radio.prototype.setTooltip !== 'function') {
    Ext.form.field.Radio.prototype.setTooltip = function(tip) {
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
})();
