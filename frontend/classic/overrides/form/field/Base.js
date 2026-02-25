/* ****************************************************************************
 * Override: form.field.Base - add aria-labelledby when skipLabelForAttribute
 * Fixes "No label associated with a form field" - when label has no for=
 * attribute (e.g. RowEditor, CheckboxGroup), associate via aria-labelledby.
 * ****************************************************************************/
Ext.define('overrides.form.field.Base', {
    override: 'Ext.form.field.Base',

    getSubTplData: function(fieldData) {
        var me = this,
            data = me.callParent([fieldData]),
            id = me.id,
            inputElAttr = data.inputElAriaAttributes;

        // When label has no for= (skipLabelForAttribute), associate via aria-labelledby
        if (me.skipLabelForAttribute && me.hasVisibleLabel()) {
            if (!inputElAttr) {
                inputElAttr = data.inputElAriaAttributes = {};
            }
            inputElAttr['aria-labelledby'] = id + '-labelEl';
        }

        return data;
    }
});
