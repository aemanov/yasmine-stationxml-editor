/* ****************************************************************************
 * Override: FileButton - add aria-label to file input for accessibility
 * Fixes "No label associated with a form field" - the hidden file input
 * has no visible label; aria-label provides the accessible name.
 * ****************************************************************************/
Ext.define('overrides.form.field.FileButton', {
    override: 'Ext.form.field.FileButton',

    afterTpl: [
        '<input id="{id}-fileInputEl" data-ref="fileInputEl" class="{childElCls} {inputCls}" ',
            'type="file" size="1" name="{inputName}" unselectable="on" ',
            'aria-label="{ariaLabel}" ',
            '<tpl if="accept != null">accept="{accept}"</tpl>',
            '<tpl if="tabIndex != null">tabindex="{tabIndex}"</tpl>',
        '>'
    ],

    getTemplateArgs: function() {
        var me = this,
            args = me.callParent(),
            owner = me.up('filefield') || me.up('textfield') || me.ownerCt,
            label;
        label = me.ariaLabel || (owner && owner.fieldLabel) || me.text || 'Select file';
        args.ariaLabel = Ext.String.htmlEncode(label);
        return args;
    }
});
