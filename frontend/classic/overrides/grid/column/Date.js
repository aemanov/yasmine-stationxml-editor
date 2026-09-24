Ext.define('overrides.grid.column.Date', {
  override: 'Ext.grid.column.Date',

  initComponent: function () {
    if (this.yasmineGuiDate) {
      this.format = this.yasmineGuiDate === 'short'
        ? yasmine.Globals.DatePrintShortFormat
        : yasmine.Globals.DatePrintLongFormat;
    }
    this.callParent(arguments);
  }
});
