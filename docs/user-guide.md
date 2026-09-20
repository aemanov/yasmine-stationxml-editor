---
layout: page
title: User Guide
permalink: /user-guide/
---
- [FDSN StationXML](#fdsn-stationxml)
- [StationXML contextual help](#stationxml-contextual-help)
- [Instrument Response](#instrument-response)
- [Exercise: Create Metadata With Yasmine](#exercise-create-metadata-with-yasmine)
- [Exercise: Manage StationXML With Yasmine](#exercise-manage-stationxml-with-yasmine)

[Yasmine (Yet Another Station Metadata INformation Editor)](https://github.com/iris-edu/yasmine-stationxml-editor) v4.1.3-beta is an editor designed to facilitate the creation of geophysical station metadata in FDSN StationXML format.

Before you begin, follow the [Installation](/yasmine-stationxml-editor/installation) instructions to get Yasmine up and running.

## FDSN StationXML

![Figure: Levels of StationXML Response Detail](/yasmine-stationxml-editor/assets/images/response-level-details.drawio.png)

Figure: Levels of StationXML Response Detail

[FDSN StationXML](http://www.fdsn.org/xml/station) is a standard XML format to represent geophysical metadata developed by the International Federation of Digital Seismograph Networks (FDSN) as a successor to [SEED 2.4](http://www.fdsn.org/publications.htm).

Yasmine validates against the pinned schema [StationXML v1.2](https://docs.fdsn.org/projects/stationxml/en/v1.2/). Note that some organizations require rules in addition to those defined by the FDSN. For instance, IRIS verifies StationXML according to its [StationXML Validator](http://github.com/iris-edu/stationxml-validator).

To understand how StationXML is organized, it is helpful to keep in mind the XML data model describes hierarchal relations where top-level elements are most general and the lower ones most specific. StationXML begins with the FDSN StationXML declaration itself and adds increasingly specific metadata at subsequent levels.

```xml
 <?xml version="1.0" encoding="UTF-8"?>
 <FDSNStationXML xmlns="http://www.fdsn.org/xml/station/1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
   xsi:schemaLocation="http://www.fdsn.org/xml/station/1  http://www.fdsn.org/xml/station/fdsn-station-1.2.xsd"
   schemaVersion="1.2">
```

Figure: StationXML v1.2 file declaration ([schema](https://www.fdsn.org/xml/station/fdsn-station-1.2.xsd))

### StationXML 1.2 editing and validation

The inventory parameter list exposes every standard StationXML 1.2 field.
Measured values such as coordinates, elevation, sample rate and clock drift
retain their uncertainty, measurement method, datum and unit metadata when
the scalar value is edited. Data availability can be entered as an extent,
one or more spans, or both.

The Response editor remains a tree editor. Its add menu, value controls,
attributes, ordering and choices are constrained by the StationXML 1.2
schema. This permits all response stage types without requiring a separate
form for every filter type.

Validation results distinguish between:

- **Errors**, which violate the StationXML 1.2 XSD and prevent export.
- **Warnings**, which are recommendations from the StationXML documentation,
  FDSN practice or Yasmine operational checks.

Elements and attributes from foreign XML namespaces are preserved during
import, editing and export. They are shown as read-only extension data;
Yasmine does not provide a general-purpose editor for them.

### StationXML contextual help

Click **?** in the inventory parameter editor, or in a nested Comment,
Operator or Person window, to open StationXML 1.2 schema help for the
current field. The window shows the canonical XML name, the schema path,
attributes, children and the original English FDSN documentation.

This is separate from GATITO helper lists. See
[StationXML 1.2 contextual help](/yasmine-stationxml-editor/stationxml-context-help)
for the API split and catalog provenance.

## Instrument Response

![Figure: Communication in a Modern Seismic Network](/yasmine-stationxml-editor/assets/images/communication-in-a-modern-seismic-network.drawio.png)

Figure: Communication in a Modern Seismic Network

The physical hardware includes the geophysical equipment and communication medium by which the data is communicated form its source to destination:

- a *sensor* to measure ground motion as electrical voltage
- a *digitizer* (and *clock*) to quantize the continuous signal into discrete sequences of binary digits
- a *station* to transform the data into a form appropriate for transmission
- a *channel* including the *communication medium* over which the data reaches the receiver

Geophysicists use the term *instrument response* to describe the unique signature the instrument imparts on the observation.

Yasmine provides access to two libraries with metadata descriptions and schema object definitions for well-known Earth-science observation instruments such as sensors and digitizers:

- [The Nominal Response Library (NRL)](https://ds.iris.edu/ds/nrl/)
   : A comprehensive library of recommended nominal responses from IRIS. Use **NRL Offline** in Settings to maintain a local copy (updated via catalog `updatedsince`), or **NRLv2 online** to fetch responses on demand from the IRIS NRL Web Service.

- [The Atomic Response Objects Library (AROL)](https://gitlab.com/resif/arol/)
   : A new instrument response library under development by Résif containing a smaller albeit easier and faster set of descriptions than the NRL

## Exercise: Create Metadata With Yasmine

Yasmine provides a wizard to step you though the process from the top-down of creating StationXML from scratch.

### Create User Library and XML

- [ ] From the `User Library` tab, select `Create a new library` and provide a name
- [ ] From the `XML` tab, select `Create` then provide the XML container name for Yasmine and top-level [FDSN StationXML](https://docs.fdsn.org/projects/stationxml/en/latest/reference.html#fdsnstationxml-required) information

### Add a Network

- [ ] Select `Inventory` and `Add -> Add a network using a wizard`
- [ ] Provide [Network](https://docs.fdsn.org/projects/stationxml/en/latest/reference.html#network-required) information and select `Next`

### Add Stations

- [ ] Provide [Station](https://docs.fdsn.org/projects/stationxml/en/latest/reference.html#station) information and select `Next`

### Add Channels

- [ ] Provide [Channel](https://docs.fdsn.org/projects/stationxml/en/latest/reference.html#channel) information and select `Next`

### Add Responses

- [ ] Provide [Response](https://docs.fdsn.org/projects/stationxml/en/latest/reference.html#response) information and select `Next`
- [ ] Provide remaining [Channel](https://docs.fdsn.org/projects/stationxml/en/latest/reference.html#channel) information and select `Next`
- [ ] Select to save Network, Station, and Channel information to your User Library then `Complete Wizard`

## Exercise: Manage StationXML With Yasmine

The quickest way to become familiar with how to work with metadata in Yasmine is to import existing StationXML files.

### Import XML

- [ ] Choose an existing StationXML file or one from the IRIS [fdsnws-station](http://service.iris.edu/fdsnws/station/1) service (e.g. [UW.QARB HNE](https://service.iris.edu/fdsnws/station/1/query?net=UW&station=QARB&channel=HNE&location=01&level=channel&nodata=404))
- [ ] From the `XML` tab, select `Import XML` then your file

### Validate XML

- [ ] From the `XML` tab, double-click your filename then `File -> Validate`
- [ ] Bonus: Why won't [this](https://service.iris.edu/fdsnws/station/1/query?net=XB&station=ELYSE&channel=MHU&level=response&nodata=404) file validate?

### Extract XML

- [ ] From the `XML` tab, double-click your filename
- [ ] Select a Network and `Extract -> Extract a selected Network to user library`

### Export XML

- [ ] From the `XML` tab, highlight the filename then `Export as XML`
- [ ] If export is blocked, fix the reported StationXML 1.2 XSD error and export again
