---
layout: page
title: StationXML 1.2 contextual help
permalink: /stationxml-context-help/
---

Yasmine shows FDSN StationXML 1.2 schema help when you click **?** in the
inventory editor. The text is the original English XSD annotation. Yasmine
does not translate it.

## What the help window shows

The window always starts from the current editor focus:

- the canonical XML name from the schema. The inventory field list uses the
  same names with spaces (`startDate` appears as **Start Date**, `ClockDrift`
  as **Clock Drift**)
- the absolute path, for example `/FDSNStationXML/Network/Station/Site/Name`
- attributes and children of that node
- English documentation from the vendored StationXML 1.2 XSD
- a tree of the full schema, with search

**Full schema** jumps from the current field to the complete hierarchy.
Nested editors keep their place in that hierarchy: a comment author opens
`Comment/Author`, while an operator contact opens `Operator/Contact`.

## Two help systems

StationXML schema help is not GATITO helper text.

| UI | API | Source |
| --- | --- | --- |
| Parameter **?** | `/api/stationxml/help/1.2/` | FDSN StationXML 1.2 XSD |
| GATITO lists and HTML help | `/api/helper/` and `/api/help/` | Yasmine helper content |

Do not mix the two URLs. GATITO suggestions stay on `/api/helper/`.

## Provenance

The schema copy lives in
`backend/yasmine/resources/schemas/stationxml/1.2/fdsn-station-1.2.xsd`.
It is the unmodified FDSN StationXML 1.2 schema:

<https://www.fdsn.org/xml/station/fdsn-station-1.2.xsd>

Generated catalogs (`catalog.json`, `editor-contexts.json`,
`response-1.2.json`) are derived from that XSD. The FDSN prose remains
FDSN documentation; it is not redistributed under the Yasmine LGPL
license.

Regenerate the catalogs after an XSD update:

```bash
python backend/tools/generate_stationxml_help.py
```

## Export and validation

Export writes StationXML 1.2 and then validates the result against the
same XSD. Schema errors block the download. Yasmine and FDSN operational
checks remain warnings and do not block export.
