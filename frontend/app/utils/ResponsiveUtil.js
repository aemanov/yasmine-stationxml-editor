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
    if (Ext.getBody && Ext.getBody()) {
      return Ext.getBody().getViewSize();
    }
    return {
      width: Ext.Element.getViewportWidth(),
      height: Ext.Element.getViewportHeight()
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

    if (this.useStackLayout()) {
      win.setMinWidth(Math.min(280, viewWidth));
      win.setMinHeight(Math.min(200, viewHeight));
      if (!win.maximized && win.maximize) {
        win.maximize();
      }
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
  },

  clampWindow: function (win) {
    if (!win || win.destroyed || win.maximized) {
      return;
    }
    var viewSize = this.getSize();
    var changed = false;
    if (win.getHeight() > viewSize.height) {
      win.setHeight(viewSize.height);
      changed = true;
    }
    if (win.getWidth() > viewSize.width) {
      win.setWidth(viewSize.width);
      changed = true;
    }
    if (changed && win.center) {
      win.center();
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
  },

  bind: function () {
    var me = this;
    me.applyBodyCls();
    Ext.on('resize', function () {
      me.applyBodyCls();
    });
  }
});
