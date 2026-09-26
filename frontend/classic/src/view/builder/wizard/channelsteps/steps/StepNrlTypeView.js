/* ****************************************************************************
* 2026-09-24, version 4.3.0-beta: ASGSR, Alexey Emanov
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
*
* ****************************************************************************/


Ext.define('yasmine.view.xml.builder.wizard.channelsteps.steps.StepNrlTypeView', {
  extend: 'Ext.panel.Panel',
  xtype: 'channel-nrl-response-type',
  requires: ['overrides.form.field.Radio'],
  controller: {
    isValid: function () {
      if (!this.getSelectedValue()) {
        Ext.Msg.alert('Error', 'Please make a choice', Ext.emptyFn);
        return false;
      }
      return true;
    },
    storeStepData: function () {
      let viewModel = this.getViewModel();
      let value = this.getSelectedValue();
      viewModel.get('stepsStoredData').nrlResponseType = value;
      viewModel.set('nrlResponseType', value);
      viewModel.get('channelInfo').set('nrlResponseType', value);
    },
    getSelectedValue: function () {
      let cmp = this.lookup('responseTypeCmp');
      return cmp.getValue().rb;
    }
  },
  items: [
    {
      xtype: 'radiogroup',
      width: '100%',
      maxWidth: 420,
      minWidth: 0,
      reference: 'responseTypeCmp',
      vertical: true,
      columns: 1,
      items: [
        {xtype: 'component', html: '<b>Select a response type.</b>', cls: 'x-form-check-group-label'},
        {boxLabel: 'Datalogger + sensor', name: 'rb', inputValue: 'cascade'},
        {boxLabel: 'Integrated', name: 'rb', inputValue: 'integrated'},
        {boxLabel: 'SOH', name: 'rb', inputValue: 'soh'}
      ]
    }
  ]
});
