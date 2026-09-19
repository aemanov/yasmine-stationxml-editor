/* ****************************************************************************
 *
 * Viewport-class helpers for Classic UI.
 *
 * Layout follows CSS viewport width/height, not device names.
 * Minimum supported viewport: 320 CSS px. Wearables are out of scope.
 *
 * NRLv2 online support (2026): ASGSR, Alexey Emanov.
 *
 * ****************************************************************************/

Ext.define('yasmine.utils.ResponsiveUtil', {
  singleton: true,

  MIN_WIDTH: 320,
  STACK_MAX: 767,
  COMPACT_HEIGHT: 500,
  HEADER_LEFT_MIN: 1280,
  COMPARISON_SPLIT_MIN: 1280,
  WIDE_MIN: 1920,
  ULTRAWIDE_MIN: 2560,
  EAST_MAX_WIDTH: 720,
  HELP_MAX_WIDTH: 480,

  BODY_CLASSES: [
    'yasmine-vp-xs',
    'yasmine-vp-sm',
    'yasmine-vp-md',
    'yasmine-vp-lg',
    'yasmine-vp-xl',
    'yasmine-vp-xxl',
    'yasmine-vp-uw',
    'yasmine-compact-height'
  ],

  getSize: function () {
    var width = Ext.Element.getViewportWidth();
    var height = Ext.Element.getViewportHeight();
    return {
      width: Math.max(width || 0, 1),
      height: Math.max(height || 0, 1)
    };
  },

  getWidth: function () {
    return this.getSize().width;
  },

  getHeight: function () {
    return this.getSize().height;
  },

  isCompactHeight: function () {
    return this.getHeight() < this.COMPACT_HEIGHT;
  },

  getViewportClass: function () {
    var width = this.getWidth();
    if (width < 360) {
      return 'xs';
    }
    if (width < 768) {
      return 'sm';
    }
    if (width < 1024) {
      return 'md';
    }
    if (width < 1280) {
      return 'lg';
    }
    if (width < 1920) {
      return 'xl';
    }
    if (width < 2560) {
      return 'xxl';
    }
    return 'uw';
  },

  useStackLayout: function () {
    return this.getWidth() <= this.STACK_MAX || this.isCompactHeight();
  },

  useIconOnlyTabs: function () {
    return this.getWidth() <= this.STACK_MAX || this.isCompactHeight();
  },

  useCardLayout: function () {
    return this.useStackLayout();
  },

  useTopHeader: function () {
    return this.getWidth() < this.HEADER_LEFT_MIN || this.isCompactHeight();
  },

  useComparisonSplit: function () {
    return this.getWidth() >= this.COMPARISON_SPLIT_MIN && !this.isCompactHeight();
  },

  isWide: function () {
    return this.getWidth() >= this.WIDE_MIN;
  },

  isUltrawide: function () {
    return this.getWidth() >= this.ULTRAWIDE_MIN;
  },

  getSplitPercent: function (isBuilder) {
    if (isBuilder) {
      return '40%';
    }
    return this.getWidth() >= this.HEADER_LEFT_MIN ? '70%' : '50%';
  },

  getEastMaxWidth: function (isBuilder) {
    if (isBuilder && this.isUltrawide()) {
      return this.EAST_MAX_WIDTH + 160;
    }
    if (isBuilder && this.isWide()) {
      return this.EAST_MAX_WIDTH;
    }
    return undefined;
  },

  fillViewport: function (win, viewWidth, viewHeight) {
    if (!win || win.destroyed) {
      return;
    }
    viewWidth = viewWidth || this.getWidth();
    viewHeight = viewHeight || this.getHeight();
    if (win.setMinWidth) {
      win.setMinWidth(Math.min(280, viewWidth));
    }
    if (win.setMinHeight) {
      win.setMinHeight(Math.min(200, viewHeight));
    }
    if (win.setMaxWidth) {
      win.setMaxWidth(viewWidth);
    }
    if (win.setMaxHeight) {
      win.setMaxHeight(viewHeight);
    }
    if (win.maximize && !win.maximized) {
      win.maximize();
    }
    // iOS maximize often leaves a side gap; pin to the visual viewport.
    if (win.setSize) {
      win.setSize(viewWidth, viewHeight);
    }
    if (win.setPagePosition) {
      win.setPagePosition(0, 0);
    } else {
      if (win.setX) {
        win.setX(0);
      }
      if (win.setY) {
        win.setY(0);
      }
    }
  },

  fitMinWidth: function (preferred) {
    var available = Math.max(0, this.getWidth() - 16);
    return Math.min(preferred || 0, available);
  },

  fitWindow: function (win, options) {
    options = options || {};
    if (!win || win.destroyed) {
      return;
    }
    var viewSize = this.getSize();
    var viewWidth = viewSize.width;
    var viewHeight = viewSize.height;

    if (win.setMaxWidth) {
      win.setMaxWidth(viewWidth);
    }
    if (win.setMaxHeight) {
      win.setMaxHeight(viewHeight);
    }

    if (this.useStackLayout()) {
      this.fillViewport(win, viewWidth, viewHeight);
      return;
    }

    if (win.maximized) {
      return;
    }

    var preferredWidth = options.width || Math.min(1000, Math.floor(viewWidth * 0.85));
    var preferredHeight = options.height || Math.min(700, Math.floor(viewHeight * 0.85));
    var minWidth = Math.min(options.minWidth || 800, viewWidth);
    var minHeight = Math.min(options.minHeight || 500, viewHeight);

    win.setMinWidth(minWidth);
    win.setMinHeight(minHeight);
    win.setSize(
      Math.max(minWidth, Math.min(preferredWidth, viewWidth)),
      Math.max(minHeight, Math.min(preferredHeight, viewHeight))
    );
    if (win.center) {
      win.center();
    }
    this.clampWindow(win);
  },

  clampWindow: function (win) {
    if (!win || win.destroyed) {
      return;
    }
    var viewSize = this.getSize();
    var viewWidth = viewSize.width;
    var viewHeight = viewSize.height;
    var width;
    var height;
    var x;
    var y;

    if (win.setMaxWidth) {
      win.setMaxWidth(viewWidth);
    }
    if (win.setMaxHeight) {
      win.setMaxHeight(viewHeight);
    }
    if (win.minWidth > viewWidth && win.setMinWidth) {
      win.setMinWidth(Math.min(280, viewWidth));
    }
    if (win.minHeight > viewHeight && win.setMinHeight) {
      win.setMinHeight(Math.min(200, viewHeight));
    }
    if (this.useStackLayout()) {
      this.fillViewport(win, viewWidth, viewHeight);
      return;
    }
    if (win.maximized) {
      return;
    }

    width = win.getWidth();
    height = win.getHeight();
    if (width > viewWidth) {
      win.setWidth(viewWidth);
    }
    if (height > viewHeight) {
      win.setHeight(viewHeight);
    }
    x = win.getX();
    y = win.getY();
    width = win.getWidth();
    height = win.getHeight();
    if (x < 0) {
      win.setX(0);
      x = 0;
    }
    if (y < 0) {
      win.setY(0);
      y = 0;
    }
    if (x + width > viewWidth) {
      win.setX(Math.max(0, viewWidth - width));
    }
    if (y + height > viewHeight) {
      win.setY(Math.max(0, viewHeight - height));
    }
  },

  fitHelpWindow: function (win) {
    if (!win || win.destroyed) {
      return;
    }
    var viewSize = this.getSize();
    if (this.useStackLayout()) {
      win.setMaxWidth(undefined);
      win.setWidth(Math.floor(viewSize.width * 0.92));
      win.setHeight(Math.floor(viewSize.height * 0.8));
      win.center();
      return;
    }
    win.setMaxWidth(this.HELP_MAX_WIDTH);
    win.setWidth(Math.min(this.HELP_MAX_WIDTH, Math.floor(viewSize.width * 0.3)));
    win.setHeight(Math.floor(viewSize.height * 0.8));
  },

  applyBodyCls: function () {
    var body = Ext.getBody();
    if (!body) {
      return;
    }
    Ext.Array.each(this.BODY_CLASSES, function (cls) {
      body.removeCls(cls);
    });
    body.addCls('yasmine-vp-' + this.getViewportClass());
    if (this.isCompactHeight()) {
      body.addCls('yasmine-compact-height');
    }
    this.syncHeaderBrand();
    this.syncNavTabs();
  },

  bind: function () {
    var me = this;
    me.applyBodyCls();
    Ext.on('resize', function () {
      me.applyBodyCls();
      me.syncViewportSize();
    });
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', function () {
        me.applyBodyCls();
        me.syncViewportSize();
      });
    }
    // iOS Safari often reports 0x0 on the first layout pass.
    Ext.defer(function () {
      me.applyBodyCls();
      me.syncViewportSize();
    }, 50);
  },

  syncViewportSize: function () {
    if (!Ext.ComponentQuery) {
      return;
    }
    var main = Ext.ComponentQuery.query('app-main')[0];
    if (main && !main.destroyed && main.handleViewportResize) {
      main.handleViewportResize();
    }
  },

  syncHeaderBrand: function () {
    var main, header, titleCmp;
    if (!Ext.ComponentQuery) {
      return;
    }
    main = Ext.ComponentQuery.query('app-main')[0];
    if (!main || main.destroyed || !main.getHeader) {
      return;
    }
    header = main.getHeader();
    if (!header || header.destroyed) {
      return;
    }
    titleCmp = header.getTitle && header.getTitle();
    if (titleCmp && !titleCmp.destroyed && titleCmp.setWidth) {
      // ExtJS ignores setWidth(undefined); null clears the 44px
      // icon-only width so YASMINE can shrink-wrap again.
      titleCmp.setWidth(this.useTopHeader() ? 44 : null);
    }
    if (header.updateLayout) {
      header.updateLayout();
    }
  },

  syncNavTabs: function () {
    var main, tabBar, iconOnly;
    if (!Ext.ComponentQuery) {
      return;
    }
    main = Ext.ComponentQuery.query('app-main')[0];
    if (!main || main.destroyed || !main.getTabBar) {
      return;
    }
    tabBar = main.getTabBar();
    if (!tabBar || tabBar.destroyed) {
      return;
    }
    iconOnly = this.useIconOnlyTabs();
    tabBar.items.each(function (tab) {
      var fullText;
      if (!tab || tab.destroyed || !tab.setText) {
        return;
      }
      if (tab._fullText == null) {
        tab._fullText = tab.getText() || '';
      }
      fullText = tab._fullText;
      if (iconOnly) {
        if (tab.getText()) {
          tab.setText('');
        }
        if (tab.setTooltip && fullText) {
          tab.setTooltip(fullText);
        }
      } else {
        if (tab.getText() !== fullText) {
          tab.setText(fullText);
        }
        if (tab.setTooltip) {
          tab.setTooltip('');
        }
      }
    });
    if (tabBar.updateLayout) {
      tabBar.updateLayout();
    }
  }
});
