'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

function joinPath(basePath, relativePath) {
  const base = String(basePath || '').replace(/\/+$/, '');
  const relative = String(relativePath == null ? '' : relativePath).replace(/^\/+/, '');
  if (!relative) {
    return base;
  }
  if (relative.charAt(0) === '@') {
    return base + '/@' + relative.substring(1);
  }
  return base + '/' + relative;
}

function nearestKnownPath(path, catalog) {
  if (!catalog || !path) {
    return null;
  }
  const nodes = catalog.nodes || {};
  let candidate = String(path);
  while (candidate) {
    if (nodes[candidate]) {
      return candidate;
    }
    candidate = candidate.replace(/\/(?:@)?[^/]+$/, '');
  }
  return catalog.rootPath || null;
}

function buildResponsePath(treeNode, basePath, attributeName) {
  const parts = [];
  let node = treeNode;
  while (node) {
    const key = node.key;
    if (key && key !== 'Response') {
      parts.unshift(key);
    }
    node = node.parentNode;
  }
  let path = String(basePath || '').replace(/\/+$/, '');
  if (parts.length) {
    path += '/' + parts.join('/');
  }
  if (attributeName) {
    path += '/@' + String(attributeName).replace(/^@/, '');
  }
  return path;
}

function relativePathForField(parameterName, field, baseRelative) {
  const parameter = String(parameterName || '').toLowerCase();
  let relative;
  if (field && field.stationXmlRelativePath !== undefined) {
    relative = field.stationXmlRelativePath;
  } else {
    const mappings = {
      comments: {
        value: 'Value',
        subject: '@subject'
      },
      operators: {
        website: 'WebSite',
        agency: 'Agency'
      },
      person: {
        name: 'Name',
        email: 'Email'
      }
    };
    const label = String((field && field.fieldLabel) || '')
      .replace(/<[^>]*>/g, '')
      .replace(/[^a-z0-9]+/gi, ' ')
      .trim()
      .toLowerCase();
    relative = mappings[parameter] && mappings[parameter][label];
  }
  if (baseRelative) {
    return joinPath(baseRelative, relative);
  }
  return relative;
}

test('joinPath appends elements and attributes', () => {
  assert.equal(
    joinPath('/FDSNStationXML/Network/Comment', 'Author'),
    '/FDSNStationXML/Network/Comment/Author'
  );
  assert.equal(
    joinPath('/FDSNStationXML/Network/Comment', '@subject'),
    '/FDSNStationXML/Network/Comment/@subject'
  );
  assert.equal(joinPath('/FDSNStationXML/Network', ''), '/FDSNStationXML/Network');
});

test('nearestKnownPath walks to the closest catalog node', () => {
  const catalog = {
    rootPath: '/FDSNStationXML',
    nodes: {
      '/FDSNStationXML': {},
      '/FDSNStationXML/Network': {},
      '/FDSNStationXML/Network/Comment': {}
    }
  };
  assert.equal(
    nearestKnownPath('/FDSNStationXML/Network/Comment/Author/Name', catalog),
    '/FDSNStationXML/Network/Comment'
  );
  assert.equal(nearestKnownPath('/unknown', catalog), '/FDSNStationXML');
});

test('buildResponsePath includes stages and attributes', () => {
  const stage = {
    key: 'StageGain',
    parentNode: {key: 'Stage', parentNode: {key: 'Response'}}
  };
  assert.equal(
    buildResponsePath(
      stage,
      '/FDSNStationXML/Network/Station/Channel/Response',
      'resourceId'
    ),
    '/FDSNStationXML/Network/Station/Channel/Response/Stage/StageGain/@resourceId'
  );
});

test('relativePathForField prefers explicit paths and person prefixes', () => {
  assert.equal(
    relativePathForField('comments', {stationXmlRelativePath: '@subject'}),
    '@subject'
  );
  assert.equal(
    relativePathForField('comments', {fieldLabel: 'Value'}),
    'Value'
  );
  assert.equal(
    relativePathForField('person', {fieldLabel: 'Name'}, 'Author'),
    'Author/Name'
  );
  assert.equal(
    relativePathForField('person', {fieldLabel: 'Email'}, 'Contact'),
    'Contact/Email'
  );
});
