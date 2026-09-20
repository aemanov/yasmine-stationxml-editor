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
* 2019/10/07 : version 2.0.0 initial commit
*
* ****************************************************************************/


Ext.define('yasmine.view.xml.builder.parameter.items.channelresponse.treeeditor.ChannelResponseTreeEditorController', {
  extend: 'Ext.app.ViewController',
  alias: 'controller.channel-response-tree-editor',
  listen: {
    controller: {
      '#channel-response-tree-controller': {
        responseNodeSelected: 'onNodeSelected'
      },
      '#parameter-editor-controller': {
        saveRecordError: 'onSaveRecordError'
      }
    }
  },
  initViewModel: function () {
    yasmine.utils.ResponseSchemaUtil.load(function (descriptor) {
      if (!descriptor) {
        Ext.MessageBox.alert('Response schema unavailable', 'Cannot load the StationXML 1.2 response descriptor.');
        return;
      }
      this.loadChannelResponseForEditing();
    }, this);
  },
  fillRecord: function () {
    let store = this.lookup('channelresponsetree').getStore();
    let rootNode = store.getRoot();
    let record = this.getViewModel().get('record');
    let nodeId = record.get('nodeId');
    record.set('value', {nodeId: nodeId, response: this.prepareResponse(rootNode)});
  },
  onSaveRecordError: function (message) {
    Ext.MessageBox.show({
      title: 'Please fix response',
      msg: message,
      buttons: Ext.MessageBox.OK,
      icon: Ext.MessageBox['ERROR']
    });
  },
  loadChannelResponseForEditing: function () {
    let record = this.getViewModel().get('record');
    let pendingValue = record.get('value');
    if (pendingValue && pendingValue.response) {
      this.applyTreeData(pendingValue.response);
      return;
    }

    let nodeInstanceId = record.get('node_inst_id');
    let that = this;

    Ext.Ajax.request({
      method: 'GET',
      params: {nodeInstanceId},
      url: `/api/channel/response/xml/`,
      success: function (response, options) {
        let result = JSON.parse(response.responseText);
        if (!result.success) {
          Ext.MessageBox.show({
            title: 'An error occurred',
            msg: result.message,
            buttons: Ext.MessageBox.OK,
            icon: Ext.MessageBox['ERROR']
          });
        } else {
          that.applyTreeData(result.data);
        }
      }
    });
  },
  reloadTree: function (channelResponseData, reselectKey) {
    this.applyTreeData(channelResponseData, reselectKey);
  },
  applyTreeData: function (channelResponseData, reselectKey) {
    channelResponseData = channelResponseData || {Response: {}};
    if (!channelResponseData.hasOwnProperty('Response')) {
      channelResponseData = {Response: channelResponseData};
    }
    this.getViewModel().set('channelResponse', channelResponseData);
    let responseRoot = Ext.clone(channelResponseData);
    this.convertResponseTreeStore(responseRoot, null);
    responseRoot.expanded = true;
    responseRoot.iconCls = 'fa-code';

    let responseTree = this.lookupReference('channelresponsetree');
    let selectedKey = reselectKey;
    let selection = responseTree.getSelection()[0];
    if (!selectedKey && selection && selection.get('key')) {
      selectedKey = selection.get('key');
    }
    let responseTreeStore = Ext.create('Ext.data.TreeStore', {
      root: responseRoot
    });
    responseTree.setStore(responseTreeStore);
    if (selectedKey) {
      let node = responseTree.getStore().findNode('key', selectedKey, responseTree.getRoot(), true, false, true);
      if (node) {
        responseTree.setSelection(node);
        this.onNodeSelected(node);
      }
    } else {
      responseTree.setSelection(responseTreeStore.getRoot());
      this.onNodeSelected(responseTreeStore.getRoot());
    }
  },
  prepareResponse: function (rootNode) {
    return this.prepareResponseNode(rootNode);
  },
  prepareResponseNode: function (responseNode) {
    let nodeData = responseNode.data || responseNode;
    if (nodeData._opaqueValue) {
      return Ext.clone(nodeData._opaqueValue);
    }
    let nodeName = nodeData.key;
    let result = {};
    let originalValue = nodeData[nodeName];
    let definition = yasmine.utils.ResponseSchemaUtil.getType(nodeData.schemaType);
    if (!definition || definition.kind === 'simple') {
      result[nodeName] = Ext.clone(originalValue);
      return result;
    }

    let value = {};
    if (originalValue && Ext.isObject(originalValue)) {
      if (originalValue.attributes && Ext.Object.getSize(originalValue.attributes)) {
        value.attributes = Ext.clone(originalValue.attributes);
      }
      if (originalValue.namespaces && Ext.Object.getSize(originalValue.namespaces)) {
        value.namespaces = Ext.clone(originalValue.namespaces);
      }
      if (originalValue.$namespaces && Ext.Object.getSize(originalValue.$namespaces)) {
        value.$namespaces = Ext.clone(originalValue.$namespaces);
      }
    }
    let children = [];
    Ext.Array.each(responseNode.childNodes || [], function (child) {
      children.push(this.prepareResponseNode(child));
    }, this);
    if (children.length) {
      value.children = children;
    }
    result[nodeName] = value;
    return result;
  },
  convertResponseTreeStore: function (responseNode, parentType) {
    responseNode.iconCls = 'fa-code';
    let nodeName = Ext.Array.findBy(Object.keys(responseNode), function (key) {
      return ['attributes', 'children', 'namespaces', '$namespaces'].indexOf(key) < 0;
    });
    if (nodeName) {
      responseNode.key = nodeName;
      let schemaType = parentType
        ? yasmine.utils.ResponseSchemaUtil.typeForChild(parentType, nodeName)
        : (nodeName === 'Response' ? 'Response' : null);
      let isForeign = yasmine.utils.ResponseSchemaUtil.isForeignName(nodeName);
      responseNode.schemaType = schemaType;
      responseNode.foreign = isForeign;
      responseNode.readOnly = isForeign || !schemaType;

      if (responseNode.readOnly) {
        responseNode._opaqueValue = Ext.clone((function () {
          let opaque = {};
          opaque[nodeName] = responseNode[nodeName];
          return opaque;
        })());
        responseNode.text = '<span class="x-fa fa-lock"></span>&nbsp;' +
          yasmine.utils.ResponseSchemaUtil.displayName(Ext.htmlEncode(nodeName));
        responseNode.leaf = true;
        return true;
      }

      let value = responseNode[nodeName];
      let nodeValue = null;
      if (value !== Object(value)) {
        nodeValue = value;
      } else if (value && Ext.isArray(value.children) && value.children.length === 1 && value.children[0] !== Object(value.children[0])) {
        nodeValue = value.children[0];
      }
      responseNode.text = '<span>' + Ext.htmlEncode(nodeName) + '</span>';
      if (nodeValue !== null && nodeValue !== undefined && nodeValue !== '') {
        responseNode.text += ':&nbsp;<span style="font-weight:bold;">' + Ext.htmlEncode(String(nodeValue)) + '</span>';
      }

      let definition = yasmine.utils.ResponseSchemaUtil.getType(schemaType);
      let elementChildren = [];
      if (value && Ext.isArray(value.children)) {
        Ext.Array.each(value.children, function (child) {
          if (Ext.isObject(child) && this.convertResponseTreeStore(child, schemaType)) {
            elementChildren.push(child);
          }
        }, this);
      }
      responseNode.children = elementChildren;
      responseNode.leaf = !!definition && definition.kind === 'simple';
      return true;
    } else {
      return false;
    }
  },
  onNodeSelected: function (node) {
    let valuePanel = this.lookupReference('channel-response-value-editor');
    valuePanel.getStore().removeAll();
    valuePanel.getController().setNodeName(null);

    let attributePanel = this.lookupReference('channel-response-attribute-editor');
    attributePanel.getStore().removeAll();
    attributePanel.getController().setNode(null, null, true);

    let readOnly = !!(node.get('readOnly') || node.get('foreign'));
    let definition = yasmine.utils.ResponseSchemaUtil.definitionForNode(node);
    this.getViewModel().set('canAddNewNode', yasmine.utils.ResponseSchemaUtil.canAddNode(node));
    this.getViewModel().set('selectedNodeReadOnly', readOnly);
    this.getViewModel().set('canDeleteResponseNode', yasmine.utils.ResponseSchemaUtil.canDeleteNode(node));
    this.getViewModel().set('selectedResponseNode', node);
    attributePanel.getController().setNode(node, definition, readOnly);
    valuePanel.getController().setNodeName(node.get('key'));

    let nodeData = node.data;
    let nodeName = nodeData.key;
    let nodeValue = yasmine.utils.XmlNodeUtil.getValue(node);
    let canNodeHaveValue = !!definition && definition.kind === 'simple';
    valuePanel.getController().setRecord(nodeName, nodeValue, canNodeHaveValue, definition, readOnly);

    if (!nodeData[nodeData.key]) {
      return;
    }

    let attributes = nodeData[nodeData.key].attributes || {};
    for (let attr in attributes) {
      if (attributes.hasOwnProperty(attr)) {
        let attrVal = attributes[attr].toString();
        let attrDefinition = yasmine.utils.ResponseSchemaUtil.attributeDefinition(node, attr);
        let attrReadOnly = readOnly || !attrDefinition || yasmine.utils.ResponseSchemaUtil.isForeignAttribute(attr);
        attributePanel.getController().addRecord(attr, attrVal, attrDefinition, attrReadOnly);
      }
    }
  }

});
