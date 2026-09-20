# FDSN StationXML 1.2 schema

`fdsn-station-1.2.xsd` is the unmodified schema published by the
International Federation of Digital Seismograph Networks:

<https://www.fdsn.org/xml/station/fdsn-station-1.2.xsd>

Backend validation, response-editor descriptors and contextual help use
this copy. Generated `catalog.json`, `editor-contexts.json` and
`response-1.2.json` are derived from the XSD annotations. The FDSN schema
text remains FDSN documentation and is not licensed as Yasmine LGPL.

ObsPy's bundled schema is only a fallback for installations created before
the resource was added.

The schema help HTTP API is `/api/stationxml/help/1.2/`. GATITO content
continues to use `/api/help/` and `/api/helper/`.
