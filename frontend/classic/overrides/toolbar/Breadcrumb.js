/* ****************************************************************************
 * Override: Breadcrumb - always update arrow when node has children
 * Fixes missing arrow (>) after manufacturer when children are loaded async
 *
 * NRLv2 online support (2026): ASGSR, Alexey Emanov.
 * ****************************************************************************/
Ext.define('overrides.toolbar.Breadcrumb', {
  override: 'Ext.toolbar.Breadcrumb',

  updateSelection: function (node, prevNode) {
    var me = this,
      buttons = me._buttons,
      items = [],
      itemCount = Ext.ComponentQuery.query('[isCrumb]', me.getRefItems()).length,
      needsSync = me._needsSync,
      displayField = me.getDisplayField(),
      showIcons, glyph, iconCls, icon, newItemCount, currentNode, text, button, id, depth, i;

    Ext.suspendLayouts();

    if (node) {
      currentNode = node;
      depth = node.get('depth');
      newItemCount = depth + 1;
      i = depth;

      while (currentNode) {
        id = currentNode.getId();
        button = buttons[i];

        // Don't break when node has children - we must update arrow visibility
        if (!needsSync && button && button._breadcrumbNodeId === id && !currentNode.hasChildNodes()) {
          break;
        }

        text = currentNode.get(displayField);

        if (button) {
          button.setText(text);
        } else {
          button = buttons[i] = Ext.create({
            isCrumb: true,
            xtype: me.getUseSplitButtons() ? 'splitbutton' : 'button',
            ui: me.getButtonUI(),
            cls: me._btnCls + ' ' + me._btnCls + '-' + me.ui,
            text: text,
            showEmptyMenu: true,
            menu: {
              listeners: {
                click: '_onMenuClick',
                beforeshow: '_onMenuBeforeShow',
                scope: me
              }
            },
            handler: '_onButtonClick',
            scope: me
          });
        }

        showIcons = me.getShowIcons();

        if (showIcons !== false) {
          glyph = currentNode.get('glyph');
          icon = currentNode.get('icon');
          iconCls = currentNode.get('iconCls');

          if (glyph) {
            button.setGlyph(glyph);
            button.setIcon(null);
            button.setIconCls(iconCls);
          } else if (icon) {
            button.setGlyph(null);
            button.setIconCls(null);
            button.setIcon(icon);
          } else if (iconCls) {
            button.setGlyph(null);
            button.setIcon(null);
            button.setIconCls(iconCls);
          } else if (showIcons) {
            button.setGlyph(null);
            button.setIcon(null);
            button.setIconCls(
              (currentNode.isLeaf() ? me._leafIconCls : me._folderIconCls) + '-' + me.ui
            );
          } else {
            button.setGlyph(null);
            button.setIcon(null);
            button.setIconCls(null);
          }
        }

        button.setArrowVisible(currentNode.hasChildNodes());
        button._breadcrumbNodeId = currentNode.getId();

        currentNode = currentNode.parentNode;
        i--;
      }

      if (newItemCount > itemCount) {
        items = buttons.slice(itemCount, depth + 1);
        me.add(items);
      } else {
        for (i = itemCount - 1; i >= newItemCount; i--) {
          me.remove(buttons[i], false);
        }
      }

    } else {
      for (i = 0; i < buttons.length; i++) {
        me.remove(buttons[i], false);
      }
    }

    Ext.resumeLayouts(true);

    me.fireEvent('selectionchange', me, node, prevNode);

    if (me._shouldFireChangeEvent) {
      me.fireEvent('change', me, node, prevNode);
    }
    me._shouldFireChangeEvent = true;

    me._needsSync = false;
  }
});
