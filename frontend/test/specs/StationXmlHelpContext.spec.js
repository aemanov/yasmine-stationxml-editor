describe('yasmine.utils.StationXmlHelpContext', function () {
  var Context;

  beforeEach(function () {
    Context = yasmine.utils.StationXmlHelpContext;
  });

  it('joins element and attribute relative paths', function () {
    expect(Context.joinPath('/FDSNStationXML/Network/Comment', 'Author'))
      .toBe('/FDSNStationXML/Network/Comment/Author');
    expect(Context.joinPath('/FDSNStationXML/Network/Comment', '@subject'))
      .toBe('/FDSNStationXML/Network/Comment/@subject');
  });

  it('resolves editor contexts to the nearest catalog path', function () {
    var catalog = {
      rootPath: '/FDSNStationXML',
      editorContexts: {
        network: {
          comments: '/FDSNStationXML/Network/Comment'
        }
      },
      nodes: {
        '/FDSNStationXML': {},
        '/FDSNStationXML/Network': {},
        '/FDSNStationXML/Network/Comment': {},
        '/FDSNStationXML/Network/Comment/Author': {}
      }
    };
    expect(Context.resolve({
      nodeType: 1,
      parameterName: 'comments',
      relativePath: 'Author/Name'
    }, catalog)).toBe('/FDSNStationXML/Network/Comment/Author');
  });

  it('maps Comment and Operator fields, including person prefixes', function () {
    expect(Context.relativePathForField('comments', {
      stationXmlRelativePath: '@subject'
    })).toBe('@subject');
    expect(Context.relativePathForField('operators', {
      getFieldLabel: function () { return 'Website'; }
    })).toBe('WebSite');
    expect(Context.relativePathForField('person', {
      getFieldLabel: function () { return 'Name'; }
    }, 'Author')).toBe('Author/Name');
    expect(Context.relativePathForField('person', {
      getFieldLabel: function () { return 'Email'; }
    }, 'Contact')).toBe('Contact/Email');
  });

  it('builds response tree paths from stage keys', function () {
    var node = {
      get: function (name) { return name === 'key' ? 'StageGain' : null; },
      parentNode: {
        get: function (name) { return name === 'key' ? 'Stage' : null; },
        parentNode: {
          get: function (name) { return name === 'key' ? 'Response' : null; }
        }
      }
    };
    expect(Context.buildResponsePath(
      node,
      '/FDSNStationXML/Network/Station/Channel/Response',
      'resourceId'
    )).toBe(
      '/FDSNStationXML/Network/Station/Channel/Response/Stage/StageGain/@resourceId'
    );
  });
});
