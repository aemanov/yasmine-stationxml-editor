/* ****************************************************************************
*
* StationXML 1.2 help catalog loading and editor-context resolution.
*
* ****************************************************************************/

Ext.define('yasmine.utils.StationXmlHelpContext', {
  singleton: true,

  catalog: null,
  loading: false,
  waiters: null,

  constructor: function () {
    this.waiters = [];
    return this.callParent(arguments);
  },

  load: function (success, failure, scope) {
    var me = this;
    if (me.catalog) {
      Ext.callback(success, scope || me, [me.catalog]);
      return;
    }

    me.waiters.push({
      success: success,
      failure: failure,
      scope: scope
    });
    if (me.loading) {
      return;
    }

    me.loading = true;
    Ext.Ajax.request({
      url: '/api/stationxml/help/1.2/',
      method: 'GET',
      success: function (response) {
        var waiters = me.waiters;
        me.waiters = [];
        me.loading = false;
        try {
          me.catalog = Ext.decode(response.responseText);
          Ext.Array.each(waiters, function (waiter) {
            Ext.callback(
              waiter.success,
              waiter.scope || me,
              [me.catalog]
            );
          });
        } catch (error) {
          Ext.Array.each(waiters, function (waiter) {
            Ext.callback(waiter.failure, waiter.scope || me, [error]);
          });
        }
      },
      failure: function (response) {
        var waiters = me.waiters;
        me.waiters = [];
        me.loading = false;
        Ext.Array.each(waiters, function (waiter) {
          Ext.callback(
            waiter.failure,
            waiter.scope || me,
            [response]
          );
        });
      }
    });
  },

  clearCache: function () {
    this.catalog = null;
    this.loading = false;
    this.waiters = [];
  },

  nodeTypeName: function (nodeType) {
    if (nodeType === 1 || nodeType === '1') {
      return 'network';
    }
    if (nodeType === 2 || nodeType === '2') {
      return 'station';
    }
    if (nodeType === 3 || nodeType === '3') {
      return 'channel';
    }
    return String(nodeType || '').toLowerCase();
  },

  joinPath: function (basePath, relativePath) {
    var base = String(basePath || '').replace(/\/+$/, '');
    var relative = String(relativePath == null ? '' : relativePath)
      .replace(/^\/+/, '');
    if (!relative) {
      return base;
    }
    if (relative.charAt(0) === '@') {
      return base + '/@' + relative.substring(1);
    }
    return base + '/' + relative;
  },

  resolve: function (context, catalog) {
    catalog = catalog || this.catalog;
    if (!catalog) {
      return null;
    }
    if (Ext.isString(context)) {
      return this.nearestKnownPath(context, catalog);
    }
    context = context || {};
    if (context.path) {
      return this.nearestKnownPath(context.path, catalog);
    }

    var level = this.nodeTypeName(context.nodeType);
    var mappings = catalog.editorContexts || {};
    var base = mappings[level] &&
      mappings[level][context.parameterName];
    if (!base && context.rootField) {
      base = mappings.root && mappings.root[context.rootField];
    }
    if (!base) {
      return null;
    }
    return this.nearestKnownPath(
      this.joinPath(base, context.relativePath),
      catalog
    );
  },

  nearestKnownPath: function (path, catalog) {
    catalog = catalog || this.catalog;
    if (!catalog || !path) {
      return null;
    }
    var nodes = catalog.nodes || {};
    var candidate = String(path);
    while (candidate) {
      if (nodes[candidate]) {
        return candidate;
      }
      candidate = candidate.replace(/\/(?:@)?[^/]+$/, '');
    }
    return catalog.rootPath || null;
  },

  buildResponsePath: function (treeNode, basePath, attributeName) {
    var parts = [];
    var node = treeNode;
    while (node) {
      var key = node.get ? node.get('key') : (
        node.data ? node.data.key : node.key
      );
      if (key && key !== 'Response') {
        parts.unshift(key);
      }
      node = node.parentNode;
    }
    var path = String(basePath || '').replace(/\/+$/, '');
    if (parts.length) {
      path += '/' + parts.join('/');
    }
    if (attributeName) {
      path += '/@' + String(attributeName).replace(/^@/, '');
    }
    return path;
  },

  relativePathForField: function (parameterName, field, baseRelative) {
    var parameter = String(parameterName || '').toLowerCase();
    var relative;
    if (field && field.stationXmlRelativePath !== undefined) {
      relative = field.stationXmlRelativePath;
    } else {
      relative = this._mappedRelativePath(parameter, field);
    }
    if (baseRelative) {
      return this.joinPath(baseRelative, relative);
    }
    return relative;
  },

  _mappedRelativePath: function (parameter, field) {
    var fieldName = field && field.getName ? field.getName() : '';
    var label = field && field.getFieldLabel ?
      field.getFieldLabel() : (field && field.fieldLabel);
    label = String(label || fieldName || '')
      .replace(/<[^>]*>/g, '')
      .replace(/[^a-z0-9]+/gi, ' ')
      .trim()
      .toLowerCase();

    var mappings = {
      site: {
        name: 'Name',
        description: 'Description',
        town: 'Town',
        county: 'County',
        region: 'Region',
        country: 'Country'
      },
      comments: {
        subject: '@subject',
        comment: 'Value',
        value: 'Value',
        id: '@id',
        'id optional': '@id',
        'effective start date': 'BeginEffectiveTime',
        'effective end date': 'EndEffectiveTime',
        author: 'Author'
      },
      operators: {
        website: 'WebSite',
        agency: 'Agency',
        contact: 'Contact'
      },
      person: {
        name: 'Name',
        agency: 'Agency',
        email: 'Email',
        'country code': 'CountryCode',
        'area code': 'AreaCode',
        'phone number': 'PhoneNumber',
        description: '@description'
      },
      equipment: {
        type: 'Type',
        description: 'Description',
        model: 'Model',
        manufacturer: 'Manufacturer',
        vendor: 'Vendor',
        'serial number': 'SerialNumber',
        'resource id': '@resourceId',
        'installation date': 'InstallationDate',
        'removal date': 'RemovalDate',
        'calibration date': 'CalibrationDate'
      },
      equipments: {
        type: 'Type',
        description: 'Description',
        model: 'Model',
        manufacturer: 'Manufacturer',
        vendor: 'Vendor',
        'serial number': 'SerialNumber',
        'resource id': '@resourceId',
        'installation date': 'InstallationDate',
        'removal date': 'RemovalDate',
        'calibration date': 'CalibrationDate'
      },
      external_references: {
        uri: 'URI',
        description: 'Description'
      },
      identifiers: {
        value: '',
        type: '@type'
      }
    };

    if (parameter === 'sensor' || parameter === 'pre_amplifier' ||
        parameter === 'data_logger') {
      parameter = 'equipment';
    }
    return mappings[parameter] && mappings[parameter][label];
  },

  remember: function (owner, path) {
    if (owner && path) {
      owner.stationXmlHelpPath = path;
    }
    return path;
  },

  remembered: function (owner) {
    return owner && owner.stationXmlHelpPath;
  }
});
