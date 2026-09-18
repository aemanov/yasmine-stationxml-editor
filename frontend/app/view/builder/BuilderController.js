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


Ext.define('yasmine.view.xml.builder.BuilderController', {
  extend: 'Ext.app.ViewController',
  alias: 'controller.builder',
  requires: [
    'yasmine.view.xml.builder.parameter.ParameterList',
    'yasmine.view.xml.builder.comparison.Comparison',
    'yasmine.utils.ResponsiveUtil'
  ],
  onTreeItemSelected: function(node) {
    this.getViewModel().set('selectedNode', node);
  },
  onTreeItemDeSelected: function() {
    this.getViewModel().set('selectedNode', null);
  },
  onShowParameters: function(node) {
    this.getViewModel().set('selectedNode', node);
  },
  afterRender: function () {
    let viewModel = this.getViewModel();
    let xmlId = viewModel.get('xmlId');
    viewModel.set('xml', yasmine.model.Xml.load(parseInt(xmlId)));
    let mode = this.getViewModel().get('viewMode');
    if (mode === yasmine.BuilderMode.BUILDER) {
      this.buildBuilderModeView()
    } else {
      this.buildComparisonModeView()
    }
    this.mon(Ext.GlobalEvents, 'resize', this.onViewportResize, this, {buffer: 200});
  },
  onExportXmlClick: function () {
    yasmine.store.FileLoader.load(`api/xml/ie/${this.getViewModel().get('xmlId')}`);
  },
  onValidateXmlClick: function () {
    Ext.Ajax.request({
      url: `/api/xml/validate/${this.getViewModel().get('xmlId')}`,
      method: 'GET',
      success: function (response) {
        var errors = JSON.parse(response.responseText);
        if (errors && errors.length > 0) {
          Ext.Msg.alert('Validation Errors', errors.join('<br>'), Ext.emptyFn);
        } else {
          Ext.Msg.alert('Validation Errors', 'No Errors', Ext.emptyFn);
        }
      }
    });
  },
  buildBuilderModeView: function () {
    this.getViewModel().set('viewMode', yasmine.BuilderMode.BUILDER);
    this.removeModeView('xml-comparison');
    this.createModeView('parameter-list', true);
  },
  buildComparisonModeView: function () {
    this.getViewModel().set('viewMode', yasmine.BuilderMode.COMPARATOR);
    this.removeModeView('parameter-list');
    this.createModeView('xml-comparison', false);
  },
  removeModeView: function (viewName) {
    let view = this.lookup(viewName);
    if (view && view.ownerCt) {
      view.ownerCt.remove(view, true);
    }
  },
  createModeView: function (viewName, isBuilder) {
    let useCard = yasmine.utils.ResponsiveUtil.useCardLayout();
    this._usingCard = useCard;
    let cfg = {
      xtype: viewName,
      reference: viewName,
      border: true,
      collapsible: !useCard,
      split: !useCard,
      region: 'east'
    };
    if (useCard) {
      cfg.split = false;
      cfg.collapsible = false;
      cfg.hidden = true;
      cfg.width = 1;
    } else {
      let viewWidth = this.getView().getWidth() || yasmine.utils.ResponsiveUtil.getWidth();
      let percent = parseFloat(yasmine.utils.ResponsiveUtil.getSplitPercent(isBuilder)) / 100;
      cfg.width = Math.max(280, Math.round(viewWidth * percent));
      let maxWidth = yasmine.utils.ResponsiveUtil.getEastMaxWidth(isBuilder);
      if (maxWidth) {
        cfg.maxWidth = maxWidth;
        cfg.width = Math.min(cfg.width, maxWidth);
      }
    }
    let modeView = Ext.create(cfg);
    this.getView().add(modeView);
    this.updatePaneSwitcher(!isBuilder);
    let selectedNode = this.getViewModel().get('selectedNode');
    if (selectedNode && modeView.getController && modeView.getController() && modeView.getController().initData) {
      modeView.getController().initData(selectedNode);
    }
  },
  applySplitSizing: function (modeView, isBuilder) {
    let percent = parseFloat(yasmine.utils.ResponsiveUtil.getSplitPercent(isBuilder)) / 100;
    let owner = this.getView();
    let ownerWidth = owner.getWidth() || yasmine.utils.ResponsiveUtil.getWidth();
    let width = Math.max(280, Math.round(ownerWidth * percent));
    let maxWidth = yasmine.utils.ResponsiveUtil.getEastMaxWidth(isBuilder);
    if (maxWidth) {
      width = Math.min(width, maxWidth);
      modeView.setMaxWidth(maxWidth);
    } else if (modeView.setMaxWidth) {
      modeView.setMaxWidth(undefined);
    }
    modeView.setWidth(width);
  },
  updatePaneSwitcher: function (isComparison) {
    let switcher = this.lookup('builderPaneSwitcher');
    let detailBtn = this.lookup('builderPaneDetailBtn');
    let children = this.lookup('builderChildren');
    let isBuilder = this.getViewModel().get('viewMode') === yasmine.BuilderMode.BUILDER;
    let modeView = this.lookup(isBuilder ? 'parameter-list' : 'xml-comparison');
    if (!switcher) {
      return;
    }
    if (this._usingCard) {
      switcher.show();
      if (detailBtn) {
        detailBtn.setText(isComparison ? 'Compare' : 'Parameters');
      }
      switcher.items.each(function (btn, index) {
        btn.setPressed(index === 0);
      });
      if (children) {
        children.show();
      }
      if (modeView) {
        modeView.hide();
      }
    } else {
      switcher.hide();
      if (children) {
        children.show();
      }
      if (modeView) {
        modeView.show();
      }
    }
  },
  onBuilderPaneToggle: function (container, button, pressed) {
    if (!pressed || !this._usingCard) {
      return;
    }
    let children = this.lookup('builderChildren');
    let isBuilder = this.getViewModel().get('viewMode') === yasmine.BuilderMode.BUILDER;
    let modeView = this.lookup(isBuilder ? 'parameter-list' : 'xml-comparison');
    let showDetail = button.getItemId() === 'detail';
    if (children) {
      children.setHidden(showDetail);
    }
    if (modeView) {
      modeView.setHidden(!showDetail);
      if (showDetail) {
        modeView.setWidth(this.getView().getWidth());
      }
    }
  },
  onViewportResize: function () {
    let isBuilder = this.getViewModel().get('viewMode') === yasmine.BuilderMode.BUILDER;
    let viewName = isBuilder ? 'parameter-list' : 'xml-comparison';
    let modeView = this.lookup(viewName);
    if (!modeView) {
      return;
    }
    let wantCard = yasmine.utils.ResponsiveUtil.useCardLayout();
    if (wantCard === this._usingCard) {
      if (!wantCard) {
        this.applySplitSizing(modeView, isBuilder);
      }
      return;
    }
    this._usingCard = wantCard;
    if (modeView.ownerCt) {
      modeView.ownerCt.remove(modeView, false);
    }
    modeView.collapsible = !wantCard;
    modeView.split = !wantCard;
    modeView.region = 'east';
    if (wantCard) {
      modeView.width = 1;
      modeView.hidden = true;
    } else {
      this.applySplitSizing(modeView, isBuilder);
      modeView.hidden = false;
    }
    this.getView().add(modeView);
    this.updatePaneSwitcher(!isBuilder);
  }
});
