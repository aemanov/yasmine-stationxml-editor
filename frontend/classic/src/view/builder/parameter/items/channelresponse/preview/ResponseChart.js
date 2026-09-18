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
* NRLv2 online support (2026): ASGSR, Alexey Emanov.
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
* ****************************************************************************/


Ext.define('yasmine.view.xml.builder.parameter.items.channelresponse.preview.ResponseChart', {
  extend: 'Ext.container.Container',
  xtype: 'response-chart',
  minHeight: 0,
  flex: 1,
  style: {
    'border-width': 'thin',
    'border-style': 'solid',
    'border-color': '#d0d0d0'
  },
  viewModel: {
    data: {
      showChartControls: true,
      showDownloadButtons: true
    },
    formulas: {
      chartImageHtml: function (get) {
        var url = get('channelResponseImageUrl');
        if (!url) return '';
        var escaped = (url || '').replace(/"/g, '&quot;');
        return '<div class="response-chart-img-wrap">' +
          '<img src="' + escaped + '" alt="Chart" class="response-chart-img" />' +
          '</div>';
      },
      chartOrMessageIndex: function (get) {
        return get('channelResponsePlotMessage') ? 1 : 0;
      }
    }
  },
  layout: {
    type: 'vbox',
    align: 'stretch'
  },
  items: [
    {
      xtype: 'container',
      cls: 'response-chart-toolbar',
      padding: '4 4 0 4',
      layout: {
        type: 'hbox',
        align: 'middle'
      },
      hidden: true,
      bind: {
        hidden: '{!channelResponseImageUrl || (!showChartControls && !showDownloadButtons)}'
      },
      items: [
        {
          xtype: 'numberfield',
          fieldLabel: 'Min',
          labelWidth: 32,
          flex: 1,
          minWidth: 0,
          allowDecimals: true,
          decimalPrecision: 5,
          minValue: 0,
          margin: '0 6 4 0',
          bind: {
            hidden: '{!showChartControls}',
            value: '{minFrequency}'
          },
          listeners: {
            specialkey: function (field, e) {
              if (e.getKey() === e.ENTER) {
                e.stopEvent();
                var ctrl = field.lookupController();
                if (ctrl && typeof ctrl.loadChannelResponsePlot === 'function') {
                  ctrl.loadChannelResponsePlot();
                }
                return false;
              }
            }
          }
        },
        {
          xtype: 'numberfield',
          fieldLabel: 'Max',
          labelWidth: 32,
          flex: 1,
          minWidth: 0,
          allowDecimals: true,
          decimalPrecision: 5,
          minValue: 0,
          margin: '0 6 4 0',
          bind: {
            hidden: '{!showChartControls}',
            value: '{maxFrequency}'
          },
          listeners: {
            specialkey: function (field, e) {
              if (e.getKey() === e.ENTER) {
                e.stopEvent();
                var ctrl = field.lookupController();
                if (ctrl && typeof ctrl.loadChannelResponsePlot === 'function') {
                  ctrl.loadChannelResponsePlot();
                }
                return false;
              }
            }
          }
        },
        {
          xtype: 'button',
          iconCls: 'fa fa-refresh',
          tooltip: 'Rebuild Plot',
          margin: '0 4 4 0',
          bind: {
            hidden: '{!showChartControls}'
          },
          handler: 'loadChannelResponsePlot'
        },
        {
          xtype: 'button',
          margin: '0 4 4 0',
          bind: {
            hidden: '{!showDownloadButtons}'
          },
          iconCls: 'fa fa-area-chart',
          tooltip: 'Download Plot',
          handler: 'downloadChannelResponsePlot'
        },
        {
          xtype: 'button',
          margin: '0 0 4 0',
          bind: {
            hidden: '{!showDownloadButtons}'
          },
          iconCls: 'fa fa-table',
          tooltip: 'Download CSV',
          handler: 'downloadChannelResponseCsv'
        }
      ]
    },
    {
      xtype: 'container',
      flex: 1,
      minHeight: 0,
      cls: 'response-chart-body',
      layout: {
        type: 'card',
        activeItem: 0
      },
      bind: {
        activeItem: '{chartOrMessageIndex}'
      },
      items: [
        {
          xtype: 'component',
          cls: 'response-chart-img-container',
          bind: {
            html: '{chartImageHtml}'
          }
        },
        {
          xtype: 'displayfield',
          padding: 20,
          fieldStyle: {
            color: '#c0392b',
            fontSize: '14px',
            fontFamily: 'inherit',
            whiteSpace: 'pre-wrap'
          },
          bind: {
            value: '{channelResponsePlotMessage}'
          }
        }
      ]
    }
  ]

});
