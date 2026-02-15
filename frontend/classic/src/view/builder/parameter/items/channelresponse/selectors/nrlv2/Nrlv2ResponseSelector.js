/* ****************************************************************************
*
* NRLv2 Online Response Selector - Same layout as NRL: Datalogger | Sensor | Response
* Data from webservice (catalog + combine)
*
* NRLv2 online support (2026): ASGSR, Alexey Emanov.
*
* ****************************************************************************/

Ext.define('yasmine.view.xml.builder.parameter.items.channelresponse.nrlv2.Nrlv2ResponseSelector', {
  extend: 'Ext.tab.Panel',
  xtype: 'nrlv2-response-selector',
  reference: 'nrlv2-response-selector',
  requires: [
    'Ext.toolbar.Breadcrumb',
    'yasmine.view.xml.builder.parameter.items.channelresponse.nrlv2.Nrlv2ResponseSelectorController',
    'yasmine.view.xml.builder.parameter.items.channelresponse.nrlv2.Nrlv2ResponseSelectorModel',
    'yasmine.view.xml.builder.parameter.items.channelresponse.preview.ResponsePreview'
  ],
  controller: 'nrlv2-response-selector',
  viewModel: 'nrlv2-response-selector',
  style: 'border: solid #d0d0d0 1px;',
  items: [
    {
      bind: { title: '{dataloggerStatus} Datalogger' },
      flex: 1,
      layout: { type: 'vbox', align: 'stretch' },
      bodyPadding: 5,
      items: [
        {
          xtype: 'breadcrumb',
          showMenuIcons: true,
          showIcons: true,
          scrollable: true,
          height: 200,
          layout: 'vbox',
          useSplitButtons: true,
          componentCls: 'equipment',
          displayField: 'title',
          reference: 'dataloggerCmp',
          bind: {
            store: '{dataloggerStore}',
            selection: '{dataloggerSelection}'
          },
          defaults: { listeners: { click: 'onDataloggerClick' } },
          listeners: { change: 'onDataloggerSelectionChange' }
        },
        {
          xtype: 'textareafield',
          flex: 1,
          readOnly: true,
          scrollable: true,
          padding: '5 0 0 0',
          fieldStyle: {
            fontFamily: 'Consolas,Monaco,Lucida Console,Liberation Mono,DejaVu Sans Mono,Bitstream Vera Sans Mono,Courier New, monospace;',
            fontSize: '11px',
            whiteSpace: 'pre'
          },
          bind: { value: '{dataloggerPreview}' }
        }
      ]
    },
    {
      bind: { title: '{sensorStatus} Sensor' },
      flex: 1,
      layout: { type: 'vbox', align: 'stretch' },
      bodyPadding: 5,
      items: [
        {
          xtype: 'breadcrumb',
          showMenuIcons: true,
          showIcons: true,
          scrollable: true,
          height: 200,
          layout: 'vbox',
          useSplitButtons: true,
          componentCls: 'equipment',
          displayField: 'title',
          reference: 'sensorCmp',
          bind: {
            store: '{sensorStore}',
            selection: '{sensorSelection}'
          },
          defaults: { listeners: { click: 'onSensorClick' } },
          listeners: { change: 'onSensorSelectionChange' }
        },
        {
          xtype: 'textareafield',
          flex: 1,
          readOnly: true,
          scrollable: true,
          padding: '5 0 0 0',
          fieldStyle: {
            fontFamily: 'Consolas,Monaco,Lucida Console,Liberation Mono,DejaVu Sans Mono,Bitstream Vera Sans Mono,Courier New, monospace;',
            fontSize: '11px',
            whiteSpace: 'pre'
          },
          bind: { value: '{sensorPreview}' }
        }
      ]
    },
    {
      bind: {
        title: '{responseStatus} Response',
        disabled: '{!channelResponseText}'
      },
      disabled: true,
      flex: 1,
      layout: 'fit',
      bodyPadding: 5,
      items: [{ xtype: 'response-preview' }]
    }
  ]
});
