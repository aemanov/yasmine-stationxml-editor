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
      padding: '0 0 0 5',
      layout: {
        type: 'hbox',
        pack: 'center',
        padding: '5 0 0 0'
      },
      height: 38,
      hidden: true,
      bind: {
        hidden: '{!channelResponseImageUrl || !showChartControls}'
      },
      items: [
        {
          xtype: 'numberfield',
          fieldLabel: 'Min <i class="fa fa-question-circle" data-qtip="Min Frequency"></i>',
          labelWidth: 50,
          width: 150,
          allowDecimals: true,
          decimalPrecision: 5,
          minValue: 0,
          margin: '0 10 0 0',
          bind: {
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
          fieldLabel: 'Max <i class="fa fa-question-circle" data-qtip="Max Frequency"></i>',
          labelWidth: 50,
          width: 150,
          allowDecimals: true,
          decimalPrecision: 5,
          minValue: 0,
          margin: '0 10 0 0',
          bind: {
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
          handler: 'loadChannelResponsePlot'
        }
      ]
    },
    {
      layout: 'hbox',
      items: [
        {
          xtype: 'button',
          hidden: true,
          margin: '0 0 0 10',
          bind: {
            hidden: '{!channelResponseImageUrl|| !showDownloadButtons}'
          },
          iconCls: 'fa fa-area-chart',
          tooltip: 'Download Plot',
          handler: 'downloadChannelResponsePlot'
        },
        {
          xtype: 'button',
          hidden: true,
          margin: '0 0 0 10',
          bind: {
            hidden: '{!channelResponseImageUrl || !showDownloadButtons}'
          },
          iconCls: 'fa fa-table',
          tooltip: 'Download CSV',
          handler: 'downloadChannelResponseCsv'
        },
      ]
    },
    {
      xtype: 'container',
      flex: 1,
      minHeight: 0,
      layout: {
        type: 'card',
        activeItem: 0
      },
      bind: {
        activeItem: '{chartOrMessageIndex}'
      },
      items: [
        {
          xtype: 'container',
          layout: 'fit',
          overflow: 'hidden',
          items: [
            {
              xtype: 'component',
              cls: 'response-chart-img-container',
              overflow: 'hidden',
              bind: {
                html: '{chartImageHtml}'
              }
            }
          ]
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
