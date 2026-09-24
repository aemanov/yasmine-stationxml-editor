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

[Yasmine (Yet Another Station Metadata INformation Editor)](https://github.com/iris-edu/yasmine-stationxml-editor) 4.3.2-beta creates and edits geophysical station metadata as FDSN StationXML 1.2.

Before you begin, follow the [Installation](/yasmine-stationxml-editor/installation) instructions to get Yasmine up and running.

## FDSN StationXML

![Figure: Levels of StationXML Response Detail](/yasmine-stationxml-editor/assets/images/response-level-details.drawio.png)

Figure: Levels of StationXML Response Detail

[FDSN StationXML](https://www.fdsn.org/xml/station/) is the XML format for geophysical metadata maintained by the International Federation of Digital Seismograph Networks (FDSN). It succeeds [SEED 2.4](http://www.fdsn.org/publications.htm). Yasmine pins [StationXML 1.2](https://docs.fdsn.org/projects/stationxml/en/v1.2/) (schema dated 2022-02-25).

StationXML is a hierarchy. `FDSNStationXML` contains networks, each network contains stations, and each station contains channels. A channel may contain a `Response`. The field checklist is [StationXML 1.2 coverage](/yasmine-stationxml-editor/stationxml-1.2-coverage).

Export writes this declaration and then checks the file against the vendored XSD. `schemaLocation` is optional in FDSN examples and is not added by Yasmine.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<FDSNStationXML xmlns="http://www.fdsn.org/xml/station/1" schemaVersion="1.2">
```

Figure: StationXML 1.2 root written by Yasmine ([schema](https://www.fdsn.org/xml/station/fdsn-station-1.2.xsd))

The XML document window shows **Schema Version** as a read-only field. Export always sets `schemaVersion` to `1.2`, including when the imported file used `1.1`. A file whose root is not `FDSNStationXML` in the StationXML namespace, or whose `schemaVersion` is not `1.2`, fails validation.

Some organizations add rules beyond the XSD. IRIS publishes a separate [StationXML Validator](https://github.com/iris-edu/stationxml-validator). Yasmine does not run that tool.

### StationXML 1.2 editing and validation

The inventory parameter list exposes the standard StationXML 1.2 fields. Channel `StorageFormat` is not in StationXML 1.2, and Yasmine has no editor for it.

Measured values such as coordinates, elevation, depth, azimuth, dip, water level, sample rate and clock drift keep `plusError`, `minusError`, `measurementMethod`, and, where the type allows it, `datum` and `unit`, when only the scalar is edited. Data availability can be an extent, one or more spans, or both. A span-only document is stored without an extent. Import temporarily supplies an extent so ObsPy can read the file, then drops that extent before the value is saved.

The Response editor is a tree. Its add menu, values, attributes, order and choices follow the StationXML 1.2 schema, so every filter and polynomial branch uses the same editor.

**File → Validate XML** opens a dialog titled **StationXML 1.2 Validation**:

- **Errors** fail the StationXML 1.2 XSD. Export refuses the download and returns HTTP 400.
- **Warnings** are Yasmine recommendations. They cover SEED-style code lengths, `sourceID` as a URI, alternate and historical code lengths, and epoch overlap or inverted start and end dates. They do not block export.

XSD `<warning>` notes, such as “This element is likely to be removed”, appear in contextual help. They are not the warnings in the validation dialog.

Saving a response is blocked when the response tree violates the 1.2 schema. The response validate API also returns operational notes (stage numbering, units, a zero stage gain, decimation factor and offset, and a missing `InstrumentSensitivity` or `InstrumentPolynomial`). Those notes do not mark the tree invalid, and the save dialog lists schema errors.

Elements and attributes from foreign XML namespaces are kept through import, editing and export. They are shown as read-only extension data.

### StationXML contextual help

Click **?** in the inventory parameter editor, in the XML document window, or in a nested Comment, Operator or Person window. The **StationXML 1.2** window shows the XML name, the schema path, type, use, cardinality, constraints, child elements, attributes, examples, and any XSD warning. The prose is the original English annotation.

This is separate from GATITO helper lists. See
[StationXML 1.2 contextual help](/yasmine-stationxml-editor/stationxml-context-help).

## Instrument Response

![Figure: Communication in a Modern Seismic Network](/yasmine-stationxml-editor/assets/images/communication-in-a-modern-seismic-network.drawio.png)

Figure: Communication in a Modern Seismic Network

The physical hardware includes the geophysical equipment and the communication path from the source to the destination:

- a *sensor* to measure ground motion as electrical voltage
- a *digitizer* (and *clock*) to quantize the continuous signal into discrete sequences of binary digits
- a *station* to transform the data into a form appropriate for transmission
- a *channel* including the *communication medium* over which the data reaches the receiver

Geophysicists use the term *instrument response* to describe the unique signature the instrument imparts on the observation.

Yasmine provides access to two libraries with metadata descriptions and schema object definitions for well-known Earth-science observation instruments such as sensors and digitizers:

- [The Nominal Response Library (NRL)](https://ds.iris.edu/ds/nrl/)
   : Recommended nominal responses from IRIS / EarthScope. **NRL Offline (download archive)** keeps a local copy and checks the catalog with `updatedsince`. **NRL Online** fetches a response from the NRL Web Service when it is needed. Both produce a StationXML 1.2 `Response`. Each offers three response types: **Datalogger + sensor**, **Integrated**, and **SOH**. **Datalogger + sensor** keeps a separate sensor and datalogger. **Integrated** is one instrument and fills both channel Sensor and DataLogger. **SOH** fills DataLogger. If the downloaded archive has no files for Integrated or SOH, the selector shows `This response type is not in the downloaded NRL`.

- [The Atomic Response Objects Library (AROL)](https://gitlab.com/resif/arol/)
   : A new instrument response library under development by Résif containing a smaller albeit easier and faster set of descriptions than the NRL

## Exercise: Create Metadata With Yasmine

The creation wizard walks Network, then Station, then Channel, then a final step. The window title shows the path, with the current step in capitals, for example `NETWORK > Station > Channel > Final Step`.

### Create a user library and an XML document

- [ ] On the **User Library** tab, select **New Library** and provide a name
- [ ] On the **XML** tab, select **New XML**
- [ ] Enter the Yasmine document **Name** and the StationXML root fields: **Source** (the element may be empty), optional **Sender**, **Module** and **Module URI**, and required **Created (UTC)**. **Schema Version** stays `1.2`

[FDSNStationXML](https://docs.fdsn.org/projects/stationxml/en/v1.2/reference.html#fdsnstationxml-required)

### Add a network

- [ ] Select the document and **Open Builder**, or double-click the row
- [ ] **Settings → XML View Mode** chooses how the builder lists nodes. **Tree** is an expandable hierarchy. **Card** shows each network, station, and channel as a card with its code, dates, and the fields for that level. Double-click a card, or use **Open children**, to go down a level. The arrow card returns to the parent. Below 768px the cards are a single column. At that width, and when the window is shorter than 500px, the builder shows either the hierarchy or the parameters; switch them with **Hierarchy** and **Parameters**
- [ ] Open the add menu and choose **Add a Network using a wizard**
- [ ] Enter [Network](https://docs.fdsn.org/projects/stationxml/en/v1.2/reference.html#network-required) information and select **Next**

### Add a station

- [ ] Enter [Station](https://docs.fdsn.org/projects/stationxml/en/v1.2/reference.html#station) information and select **Next**

### Add channels and a response

**NRL Offline** and **NRL Online** use six steps for each sample rate. **AROL** and **I don't need a response** use five steps: they have no response-type step.

- [ ] Step 1: location code, start and end dates, latitude, longitude, elevation and depth
- [ ] Step 2: **NRL Offline (downloaded archive)**, **AROL**, **NRL Online**, or **I don't need a response**. **NRL Online** stays disabled until that setting is enabled
- [ ] NRL step 3: **Select a response type.** Choose **Datalogger + sensor**, **Integrated**, or **SOH**
- [ ] Instrument step (NRL step 4, otherwise step 3): choose the instruments, or continue when no response is needed. **Datalogger + sensor** and **AROL** use a Datalogger tab and a Sensor tab. **Integrated** and **SOH** use one tab, labeled **Integrated** or **SOH**. **NRL Online** then walks manufacturer, model, and configuration. A **Help**, **Model help**, or **Configuration help** button beside a breadcrumb opens the NRL catalog text for that level. It stays the same height as the crumb
- [ ] Orientation step (NRL step 5, otherwise step 4): channel prefix and orientation (`ZNE (3 channels)`, `Z12 (3 channels)`, or `Z (1 channel)`). **SOH** first asks **Orientation applies**. **Yes** uses that prefix and orientation. **No** asks for one **Channel code**. If the response does not already carry a sample rate, this step also asks for **Sample Rate (Hz)**
- [ ] Last channel step (NRL step 6, otherwise step 5): channel codes, dip and azimuth
- [ ] On **Final Step**, choose whether to store the network, station and channels in a user library, then select **Complete Wizard**

The channel response editor asks for the same three NRL choices — **Datalogger + sensor**, **Integrated**, and **SOH** — before the selector opens. **Import RESP** loads a `.resp` file into the channel `Response` and opens the existing preview.

[Channel](https://docs.fdsn.org/projects/stationxml/en/v1.2/reference.html#channel) and [Response](https://docs.fdsn.org/projects/stationxml/en/v1.2/reference.html#response)

## Exercise: Manage StationXML With Yasmine

The quickest way to become familiar with how to work with metadata in Yasmine is to import existing StationXML files.

### Import XML

Import accepts only an FDSN StationXML file. The root must be `FDSNStationXML` in the StationXML namespace. `schemaVersion` 1.0, 1.1 and 1.2 are accepted. Export still writes `1.2`. Dataless SEED and other inventory formats are rejected.

- [ ] Choose an existing StationXML file, or download one from [fdsnws-station](https://service.earthscope.org/fdsnws/station/1/) (for example [UW.QARB HNE](https://service.earthscope.org/fdsnws/station/1/query?net=UW&station=QARB&channel=HNE&location=01&level=channel&nodata=404)). The former `service.iris.edu` host redirects to `service.earthscope.org`
- [ ] On the **XML** tab, select **Import** and choose the file

### Validate XML

- [ ] Open the document with **Open Builder** or by double-clicking the row
- [ ] Choose **File → Validate XML**
- [ ] Read **Errors** and **Warnings** in the **StationXML 1.2 Validation** dialog. Only errors block a later export

### Extract a node

- [ ] In the builder, select a network, station or channel
- [ ] Open the extract menu (**Save selected … to a user library**) and choose **Extract a selected Network to "…" user library** (the label follows the selected node and library name)

### Exchange a user library

A user library can be moved to another Yasmine installation as an ordinary FDSN StationXML file. The file contains the library networks, stations and channels. **Module** stores the library name.

- [ ] On the **User Library** tab, select a library and choose **Export**. The download is `{library-name}.xml` with `schemaVersion="1.2"`
- [ ] On another installation, choose **Import** and select that file. Leave **Name** blank to keep the original library name from **Module**. If that name is already used, the imported library gets a numeric suffix such as ` (2)`
- [ ] If that name is already used, the existing library is left unchanged and the imported library receives a numeric suffix

### Export XML

- [ ] On the **XML** tab, select the document and choose **Export**, or in the builder choose **File → Export as XML**
- [ ] If export is blocked, the message begins with `StationXML 1.2 export blocked`. Fix that XSD error and export again. Warnings from **Validate XML** do not block the download
