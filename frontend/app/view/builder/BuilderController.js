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
  init: function () {
    this.mon(Ext.ux.Mediator, 'node-selected', this.onTreeItemSelected, this);
  },
  onTreeItemSelected: function(node) {
    this.getViewModel().set('selectedNode', node || null);
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
    viewModel.set('compactLayout', yasmine.utils.ResponsiveUtil.useStackLayout());
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
    let cfg = {
      xtype: viewName,
      reference: viewName,
      border: true,
      region: 'east',
      split: !useCard,
      collapsible: !useCard,
      floatable: false,
      hidden: useCard
    };
    if (!useCard) {
      cfg.width = this.getSplitWidth(isBuilder);
    }
    let modeView = Ext.create(cfg);
    this.installModeView(modeView, useCard, isBuilder);
    this.updatePaneSwitcher(!isBuilder);
    let selectedNode = this.getViewModel().get('selectedNode');
    let modeController = modeView.getController && modeView.getController();
    if (selectedNode && modeController && modeController.initData) {
      modeController.initData(selectedNode);
    } else if (selectedNode) {
      Ext.ux.Mediator.fireEvent('node-selected', selectedNode);
    }
  },
  getSplitWidth: function (isBuilder) {
    let viewWidth = this.getView().getWidth() || yasmine.utils.ResponsiveUtil.getWidth();
    let percent = parseFloat(yasmine.utils.ResponsiveUtil.getSplitPercent(isBuilder)) / 100;
    let width = Math.max(280, Math.round(viewWidth * percent));
    let maxWidth = yasmine.utils.ResponsiveUtil.getEastMaxWidth(isBuilder);
    if (maxWidth) {
      width = Math.min(width, maxWidth);
    }
    return width;
  },
  clearBorderSplitters: function () {
    let owner = this.getView();
    if (!owner || owner.destroyed || !owner.query) {
      return;
    }
    Ext.Array.each(owner.query('splitter'), function (splitter) {
      if (splitter && !splitter.destroyed) {
        Ext.destroy(splitter);
      }
    });
  },
  setPaneRenderedHidden: function (pane, hidden) {
    if (!pane || pane.destroyed) {
      return;
    }
    if (hidden) {
      if (pane.hidden) {
        pane.hidden = false;
      }
      pane.hide();
      if (pane.el && pane.el.dom) {
        pane.el.setDisplayed(false);
        pane.el.setStyle({
          display: 'none',
          visibility: 'hidden'
        });
      }
    } else {
      if (pane.el && pane.el.dom) {
        pane.el.setStyle({
          display: '',
          visibility: ''
        });
        pane.el.setDisplayed(true);
      }
      pane.show();
    }
  },
  installModeView: function (modeView, useCard, isBuilder) {
    let owner = this.getView();
    this._usingCard = useCard;
    this.clearBorderSplitters();
    if (modeView.ownerCt === owner) {
      owner.remove(modeView, false);
    }
    modeView.region = 'east';
    modeView.split = !useCard;
    modeView.collapsible = !useCard;
    modeView.floatable = false;
    // Add visible, then hide — hide() is a no-op if hidden is already true,
    // which left the east panel painted over the tree after resize.
    modeView.hidden = false;
    if (useCard) {
      modeView.width = undefined;
    } else {
      modeView.width = this.getSplitWidth(isBuilder);
    }
    owner.add(modeView);
    if (modeView.setCollapsible) {
      modeView.setCollapsible(!useCard);
    }
    if (useCard) {
      this.setPaneRenderedHidden(modeView, true);
    } else {
      this.setPaneRenderedHidden(modeView, false);
      this.applySplitSizing(modeView, isBuilder);
    }
  },
  applySplitSizing: function (modeView, isBuilder) {
    let width = this.getSplitWidth(isBuilder);
    let maxWidth = yasmine.utils.ResponsiveUtil.getEastMaxWidth(isBuilder);
    if (maxWidth) {
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
      this.showCardPane(false);
    } else {
      switcher.hide();
      this.setPaneRenderedHidden(children, false);
      this.setPaneRenderedHidden(modeView, false);
    }
  },
  showCardPane: function (showDetail) {
    let children = this.lookup('builderChildren');
    let isBuilder = this.getViewModel().get('viewMode') === yasmine.BuilderMode.BUILDER;
    let modeView = this.lookup(isBuilder ? 'parameter-list' : 'xml-comparison');
    let owner = this.getView();
    this.setPaneRenderedHidden(children, showDetail);
    if (modeView) {
      if (modeView.setCollapsible) {
        modeView.setCollapsible(false);
      }
      this.setPaneRenderedHidden(modeView, !showDetail);
      if (showDetail) {
        modeView.setWidth(owner.getWidth());
      }
    }
    if (owner && owner.updateLayout) {
      owner.updateLayout();
    }
  },
  onBuilderPaneToggle: function (container, button, pressed) {
    if (!pressed || !this._usingCard) {
      return;
    }
    this.showCardPane(button.getItemId() === 'detail');
  },
  onViewportResize: function () {
    this.getViewModel().set('compactLayout', yasmine.utils.ResponsiveUtil.useStackLayout());
    let isBuilder = this.getViewModel().get('viewMode') === yasmine.BuilderMode.BUILDER;
    let viewName = isBuilder ? 'parameter-list' : 'xml-comparison';
    let modeView = this.lookup(viewName);
    let wantCard;
    if (!modeView) {
      return;
    }
    wantCard = yasmine.utils.ResponsiveUtil.useCardLayout();
    if (wantCard === this._usingCard) {
      if (!wantCard) {
        this.applySplitSizing(modeView, isBuilder);
      } else if (!modeView.isHidden()) {
        modeView.setWidth(this.getView().getWidth());
      }
      return;
    }
    this.installModeView(modeView, wantCard, isBuilder);
    this.updatePaneSwitcher(!isBuilder);
  }
});
