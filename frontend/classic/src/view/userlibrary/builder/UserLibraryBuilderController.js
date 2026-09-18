/* ****************************************************************************
*
* This file is part of the yasmine editing tool.
*
* yasmine (Yet Another Station Metadata INformation Editor), a tool to
* create and edit station metadata information in FDSN stationXML format,
* is a common development of IRIS and RESIF.
* Development and addition of new features is shared and agreed between * IRIS and RESIF.
*
*
* Version 1.0 of the software was funded by SAGE, a major facility fully
* funded by the National Science Foundation (EAR-1261681-SAGE),
* development done by ISTI and led by IRIS Data Services.
* Version 2.0 of the software was funded by CNRS and development led by * RESIF.
*
* This program is free software; you can redistribute it
* and/or modify it under the terms of the GNU Lesser General Public
* License as published by the Free Software Foundation; either
* version 3 of the License, or (at your option) any later version. *
* This program is distributed in the hope that it will be
* useful, but WITHOUT ANY WARRANTY; without even the implied warranty
* of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
* GNU Lesser General Public License (GNU-LGPL) for more details. *
* You should have received a copy of the GNU Lesser General Public
* License along with this software. If not, see
* <https://www.gnu.org/licenses/>
*
*
* 2019/10/07 : version 2.0.0 initial commit
*
* ****************************************************************************/


Ext.define('yasmine.view.userlibrary.builder.UserLibraryBuilderController', {
  extend: 'Ext.app.ViewController',
  alias: 'controller.userlibrary-builder',
  init: function () {
    this.syncLibraryLayout();
    this.mon(Ext.GlobalEvents, 'resize', this.syncLibraryLayout, this, {buffer: 200});
  },
  initModel: function (libraryId) {
    let record = new yasmine.model.UserLibrary({ id: libraryId });
    let viewModel = this.getViewModel();
    record.load({
      scope: this,
      success: function (record) {
        viewModel.set('selectedLibrary', record);
        viewModel.set('storeLibraryId', record.get('id'));
        viewModel.set('storeNodeType', yasmine.NodeTypeEnum.network);
        viewModel.notify();
      }
    });
  },
  onNodeTypeSelected: function (container, button) {
    let nodeTypeMap = {
      'type_1': yasmine.NodeTypeEnum.network,
      'type_2': yasmine.NodeTypeEnum.station,
      'type_3': yasmine.NodeTypeEnum.channel
    };
    Ext.ux.Mediator.fireEvent('children-reload', nodeTypeMap[button.itemId]);
  },
  syncLibraryLayout: function () {
    var workspace = this.lookup('libraryWorkspace');
    var switcher = this.lookup('libraryPaneSwitcher');
    if (!workspace || !yasmine.utils.ResponsiveUtil) {
      return;
    }
    var useCard = yasmine.utils.ResponsiveUtil.useCardLayout();
    if (useCard === this._libraryCardLayout) {
      return;
    }
    this._libraryCardLayout = useCard;
    if (useCard) {
      workspace.setLayout({type: 'card'});
      if (switcher) {
        switcher.show();
        workspace.setActiveItem(0);
      }
    } else {
      workspace.setLayout({type: 'hbox', align: 'stretch'});
      if (switcher) {
        switcher.hide();
      }
    }
    workspace.updateLayout();
  },
  onLibraryPaneToggle: function (container, button, pressed) {
    if (!pressed || !yasmine.utils.ResponsiveUtil.useCardLayout()) {
      return;
    }
    var workspace = this.lookup('libraryWorkspace');
    if (workspace) {
      workspace.setActiveItem(button.getItemId() === 'detail' ? 1 : 0);
    }
  }
});
