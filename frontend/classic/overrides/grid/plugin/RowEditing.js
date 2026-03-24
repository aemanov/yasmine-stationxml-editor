/* ****************************************************************************
 * Override: RowEditing - guard against null context in validateEdit/completeEdit.
 * When multiple grids with row editing are in a tabpanel, context can be null
 * when Enter is pressed or completeEdit is called (e.g. from completeAllRowEdits).
 * Fixes: TypeError: null is not an object (evaluating 'me.context.record')
 *
 * NRLv2 online support (2026): ASGSR, Alexey Emanov.
 * ****************************************************************************/
Ext.define('overrides.grid.plugin.RowEditing', {
  override: 'Ext.grid.plugin.RowEditing',

  completeEdit: function () {
    var me = this;

    if (!me.context || !me.context.record) {
      me.editing = false;
      me.context = null;
      return;
    }
    me.callParent(arguments);
  },

  validateEdit: function () {
    var me = this;

    if (!me.context || !me.context.record) {
      return true;
    }
    return me.callParent(arguments);
  }
});
