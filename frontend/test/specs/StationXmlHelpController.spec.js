describe('yasmine.view.help.stationxml.StationXmlHelpController', function () {
  it('loads the versioned StationXML help catalog', function () {
    var controller = Ext.create('yasmine.view.help.stationxml.StationXmlHelpController');
    var requested;
    var originalLoad = yasmine.utils.StationXmlHelpContext.load;
    yasmine.utils.StationXmlHelpContext.load = function (success) {
      requested = true;
      Ext.callback(success, controller, [{
        rootPath: '/FDSNStationXML',
        tree: {xmlName: 'FDSNStationXML', path: '/FDSNStationXML', children: []},
        nodes: {'/FDSNStationXML': {xmlName: 'FDSNStationXML'}}
      }]);
    };
    try {
      controller.loadContext({path: '/FDSNStationXML/Network'}, 'Network');
    } finally {
      yasmine.utils.StationXmlHelpContext.load = originalLoad;
      if (controller.destroy) {
        controller.destroy();
      }
    }
    expect(requested).toBe(true);
  });
});
