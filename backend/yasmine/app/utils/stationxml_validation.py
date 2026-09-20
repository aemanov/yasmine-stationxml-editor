# ****************************************************************************
#
# StationXML 1.2 schema and recommendation validation.
#
# ****************************************************************************

import io
from functools import lru_cache
from pathlib import Path

from lxml import etree

from yasmine.app.utils.inv_valid import ValidateInventory


STATIONXML_VERSION = '1.2'
STATIONXML_NAMESPACE = 'http://www.fdsn.org/xml/station/1'


def _vendored_schema_path():
    return (
        Path(__file__).resolve().parents[2]
        / 'resources'
        / 'schemas'
        / 'stationxml'
        / STATIONXML_VERSION
        / 'fdsn-station-1.2.xsd'
    )


def stationxml_schema_path():
    """Return the vendored schema, with ObsPy's identical copy as fallback."""
    vendored = _vendored_schema_path()
    if vendored.is_file():
        return vendored

    try:
        import obspy.io.stationxml

        bundled = (
            Path(obspy.io.stationxml.__file__).resolve().parent
            / 'data'
            / 'fdsn-station-1.2.xsd'
        )
        if bundled.is_file():
            return bundled
    except (ImportError, OSError):
        pass

    raise FileNotFoundError(
        'StationXML 1.2 XSD was not found in Yasmine resources or ObsPy'
    )


@lru_cache(maxsize=1)
def stationxml_schema():
    """Compile and cache the StationXML 1.2 XSD."""
    parser = etree.XMLParser(
        resolve_entities=False,
        no_network=True,
        remove_blank_text=False,
    )
    return etree.XMLSchema(etree.parse(str(stationxml_schema_path()), parser))


def _issue(severity, code, message, path=None, line=None, column=None):
    issue = {
        'severity': severity,
        'code': code,
        'message': message,
        'path': path or '/',
    }
    if line is not None:
        issue['line'] = line
    if column is not None:
        issue['column'] = column
    return issue


def _parse_xml(xml_data):
    parser = etree.XMLParser(
        resolve_entities=False,
        no_network=True,
        remove_blank_text=False,
    )
    if hasattr(xml_data, 'read'):
        return etree.parse(xml_data, parser)
    if isinstance(xml_data, str):
        stripped = xml_data.lstrip()
        if not stripped.startswith('<'):
            return etree.parse(xml_data, parser)
        xml_data = xml_data.encode('utf-8')
    if isinstance(xml_data, (bytes, bytearray)):
        return etree.parse(io.BytesIO(bytes(xml_data)), parser)
    raise TypeError('xml_data must be bytes, XML text, a path, or a file object')


def validate_stationxml_12(xml_data):
    """Return blocking StationXML 1.2 XSD issues for *xml_data*."""
    try:
        document = _parse_xml(xml_data)
    except (etree.XMLSyntaxError, OSError, TypeError, ValueError) as exc:
        return [_issue(
            'error',
            'XML_SYNTAX',
            str(exc),
            line=getattr(exc, 'lineno', None),
            column=getattr(exc, 'offset', None),
        )]

    root = document.getroot()
    qname = etree.QName(root)
    if qname.namespace != STATIONXML_NAMESPACE or qname.localname != 'FDSNStationXML':
        return [_issue(
            'error',
            'STATIONXML_ROOT',
            'Root element must be FDSNStationXML in the StationXML namespace',
            path=document.getpath(root),
            line=root.sourceline,
        )]

    if root.get('schemaVersion') != STATIONXML_VERSION:
        return [_issue(
            'error',
            'STATIONXML_VERSION',
            'schemaVersion must be 1.2',
            path=document.getpath(root),
            line=root.sourceline,
        )]

    try:
        schema = stationxml_schema()
    except (OSError, etree.XMLSchemaParseError) as exc:
        return [_issue('error', 'SCHEMA_UNAVAILABLE', str(exc))]

    if schema.validate(document):
        return []

    return [
        _issue(
            'error',
            'XSD_%s' % (entry.type_name or 'VALIDATION'),
            entry.message,
            path=entry.path,
            line=entry.line,
            column=entry.column,
        )
        for entry in schema.error_log
    ]


def validate_inventory_recommendations(inventory, application=None):
    """Return non-XSD Yasmine/FDSN checks as non-blocking warnings."""
    messages = ValidateInventory(
        inventory,
        application=application,
        critical_only=False,
        warnings_only=True,
    ).run()
    return [
        _issue('warning', 'YASMINE_RECOMMENDATION', message)
        for message in messages
    ]
