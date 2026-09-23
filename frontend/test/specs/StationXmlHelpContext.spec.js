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

  it('turns XML names into spaced field labels', function () {
    expect(Context.xmlNameToLabel('startDate')).toBe('Start Date');
    expect(Context.xmlNameToLabel('ClockDrift')).toBe('Clock Drift');
    expect(Context.xmlNameToLabel('sourceID')).toBe('Source ID');
    expect(Context.xmlNameToLabel('ModuleURI')).toBe('Module URI');
    expect(Context.xmlNameToLabel('SampleRateRatio/NumberSamples'))
      .toBe('Sample Rate Ratio / Number Samples');
    expect(Context.labelForParameter('start_date')).toBe('Start Date');
    expect(Context.labelForParameter('clock_drift_in_seconds_per_sample'))
      .toBe('Clock Drift');
    expect(Context.labelForParameter('sample_rate_ratio_number_samples'))
      .toBe('Sample Rate Ratio / Number Samples');
  });

  it('uses collection labels without changing XML element labels', function () {
    expect(Context.labelForParameter('comments')).toBe('Comments');
    expect(Context.labelForParameter('identifiers')).toBe('Identifiers');
    expect(Context.labelForParameter('operators')).toBe('Operators');
    expect(Context.labelForParameter('external_references'))
      .toBe('External References');
    expect(Context.labelForParameter('types')).toBe('Types');
    expect(Context.labelForParameter('equipments')).toBe('Equipment');
    expect(Context.labelForParameter('start_date')).toBe('Start Date');
    expect(Context.xmlNameToLabel('Comment')).toBe('Comment');
    expect(Context.relabelMessages(
      ["Attribute 'comments' required."],
      'comments'
    )).toEqual(["Attribute 'Comments' required."]);
  });

  it('prefers catalog editor contexts when a help catalog is loaded', function () {
    var original = Context.catalog;
    Context.catalog = {
      editorContexts: {
        channel: {
          clock_drift_in_seconds_per_sample:
            '/FDSNStationXML/Network/Station/Channel/ClockDrift'
        }
      }
    };
    try {
      expect(Context.labelForParameter(
        'clock_drift_in_seconds_per_sample',
        3
      )).toBe('Clock Drift');
    } finally {
      Context.catalog = original;
    }
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
