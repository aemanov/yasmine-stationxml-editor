/* ****************************************************************************
*
* NRLv2 Response Selector ViewModel - Same structure as NRL
*
* NRLv2 online support (2026): ASGSR, Alexey Emanov.
*
* ****************************************************************************/

Ext.define('yasmine.view.xml.builder.parameter.items.channelresponse.nrlv2.Nrlv2ResponseSelectorModel', {
  extend: 'Ext.app.ViewModel',
  alias: 'viewmodel.nrlv2-response-selector',
  data: {
    sensorSelection: null,
    sensorInstconfig: null,
    sensorSource: null,
    sensorPreview: null,

    dataloggerSelection: null,
    dataloggerInstconfig: null,
    dataloggerSource: null,
    dataloggerPreview: null,

    minFrequency: 0.001,
    maxFrequency: null,

    channelResponseImageUrl: null,
    channelResponseCsvUrl: null,
    channelResponseText: null
  },
  stores: {
    sensorStore: {
      type: 'tree',
      model: 'yasmine.view.xml.builder.parameter.items.channelresponse.nrlv2.Nrlv2ResponseTreeModel',
      proxy: {
        type: 'ajax',
        url: '/api/nrlv2/sensors/',
        reader: {
          type: 'json',
          rootProperty: 'data'
        }
      },
      autoLoad: false,
      nodeParam: 'node',
      root: {
        id: 0,
        text: '<b>sensor</b>'
      }
    },
    dataloggerStore: {
      type: 'tree',
      model: 'yasmine.view.xml.builder.parameter.items.channelresponse.nrlv2.Nrlv2ResponseTreeModel',
      proxy: {
        type: 'ajax',
        url: '/api/nrlv2/dataloggers/',
        reader: {
          type: 'json',
          rootProperty: 'data'
        }
      },
      autoLoad: false,
      nodeParam: 'node',
      root: {
        id: 0,
        text: '<b>datalogger</b>'
      }
    }
  },
  formulas: {
    dataloggerStatus: function (get) {
      return get('dataloggerPreview')
        ? ' <i class="fa fa-check" style="color: green"></i>'
        : ' <i class="fa fa-ban" style="color: red"></i>';
    },
    sensorStatus: function (get) {
      return get('sensorPreview')
        ? ' <i class="fa fa-check" style="color: green"></i>'
        : ' <i class="fa fa-ban" style="color: red"></i>';
    },
    responseStatus: function (get) {
      return (get('sensorPreview') && get('dataloggerPreview'))
        ? ' <i class="fa fa-check" style="color: green"></i>'
        : ' <i class="fa fa-ban" style="color: red"></i>';
    },
    instconfig: function (get) {
      let s = get('sensorInstconfig');
      let d = get('dataloggerInstconfig');
      return (s && d) ? s + ':' + d : null;
    }
  }
});


Ext.define('yasmine.view.xml.builder.parameter.items.channelresponse.nrlv2.Nrlv2ResponseTreeModel', {
  extend: 'Ext.data.TreeModel',
  fields: [
    { name: 'text', type: 'string', persist: false },
    { name: 'key', type: 'string', persist: false },
    { name: 'leaf', type: 'boolean', persist: false },
    { name: 'source', type: 'string', persist: false },
    {
      name: 'title',
      type: 'string',
      persist: false,
      convert: function (value, record) {
        let delimiter = record.get('key') ? ':' : '';
        let text = (record.get('text') || '').replace('Select the', '').trim();
        if (!text) {
          text = '';
          delimiter = '';
        }
        return `<b>${text}${delimiter}</b> ${record.get('key') || ''}`;
      }
    }
  ]
});
