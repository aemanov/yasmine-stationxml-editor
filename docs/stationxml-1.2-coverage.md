# StationXML 1.2 coverage

This document is the acceptance checklist for StationXML 1.2 support in
Yasmine. The normative source is the FDSN StationXML 1.2 XSD. Rules that are
recommended by FDSN or Yasmine, but are not constraints in the XSD, are
reported as warnings.

Coverage has three forms:

- **Form**: a typed editor is available in the parameter list.
- **Tree**: the response tree is constrained by a schema descriptor and uses
  typed value and attribute controls.
- **Pass-through**: foreign-namespace elements and attributes are retained
  without an editor.

## Document root

- Form: `Source`, including an empty value.
- Form: optional `Sender`, `Module`, and `ModuleURI`.
- Form: required UTC `Created`.
- Fixed: exported `schemaVersion` is `1.2`.
- Pass-through: root `xs:any` and `xs:anyAttribute`.

## Network, Station, and Channel base node

- Form: required `code`.
- Form: optional `startDate`, `endDate`, `sourceID`, `restrictedStatus`,
  `alternateCode`, and `historicalCode`.
- Form: optional `Description`.
- Form: repeatable `Identifier`, with separate optional `type` and required
  text value.
- Form: repeatable `Comment`, including optional `id`, `subject`, effective
  dates, and authors.
- Form: `DataAvailability`, including an optional `Extent` and zero or more
  `Span` entries. A span-only value is supported.
- Pass-through: BaseNode `xs:any` and `xs:anyAttribute`.

## Network

- Form: repeatable `Operator`.
- Form: optional `TotalNumberStations` and `SelectedNumberStations`.
- Warning: the two station count fields are deprecated by the 1.2
  documentation but remain editable.

## Station

- Form: `Latitude`, `Longitude`, `Elevation`, and `Site`.
- Form: optional `WaterLevel`, `Vault`, and `Geology`.
- Form: repeatable `Equipment`, `Operator`, and `ExternalReference`.
- Form: optional `CreationDate`, `TerminationDate`,
  `TotalNumberChannels`, and `SelectedNumberChannels`.
- Warning: creation/termination dates and channel count fields are deprecated
  by the 1.2 documentation but remain editable.

## Channel

- Form: required, possibly empty, `locationCode`.
- Form: repeatable `ExternalReference`.
- Form: `Latitude`, `Longitude`, `Elevation`, and `Depth`.
- Form: optional `Azimuth`, `Dip`, and `WaterLevel`.
- Form: repeatable `Type`, including all StationXML 1.2 enum values.
- Form: optional `SampleRate` and `SampleRateRatio`.
- Form: optional `ClockDrift` and `CalibrationUnits`.
- Form: optional `Sensor`, `PreAmplifier`, `DataLogger`, and repeatable
  `Equipment`.
- Warning: Channel `Type` is deprecated by the 1.2 documentation but remains
  editable.

## Measured numeric values

The scalar value can still be edited inline. The metadata editor retains:

- `plusError`, `minusError`, and `measurementMethod` where the XSD type
  permits uncertainty metadata;
- `datum` for latitude and longitude;
- editable `unit` for open-unit values;
- the fixed unit as read-only information for constrained types.

The profile applies to latitude, longitude, elevation, depth, azimuth, dip,
water level, sample rate, and clock drift. Editing only the scalar value does
not remove imported metadata.

## Nested standard types

- Form: all `Site` fields; `Name` is required.
- Form: all `Equipment` fields, repeatable calibration dates, and optional
  `resourceId`.
- Form: `Operator` with required `Agency`, contacts, and optional website.
- Form: `Person` names, agencies, emails, and phones.
- Form: phone optional country code, required area code, required patterned
  number, and optional description.
- Form: `ExternalReference` required URI and description.
- Form: `Units` required name and optional description.

## Response

- Tree: optional `Response@resourceId` and an explicitly empty Response.
- Tree: mutually exclusive `InstrumentSensitivity` and
  `InstrumentPolynomial`.
- Tree: ordered, repeatable `Stage` with required non-negative `number` and
  optional `resourceId`.
- Tree: the stage choice between `Polynomial` and the
  filter/Decimation/StageGain branch.
- Tree: complete `PolesZeros`, `Coefficients`, `FIR`, `ResponseList`, and
  `Polynomial` branches.
- Tree: response units, numeric uncertainty attributes, enums, child order,
  cardinality, and all required values and attributes.
- Pass-through: foreign elements and attributes at Response, Stage, and filter
  extension points.

## Extension pass-through

The importer stores foreign-namespace XML as opaque sidecar data for every
StationXML 1.2 extension point. The exporter restores QName, namespace
declarations, attributes, text, child content, and owner position. Standard
editors do not allow extension XML to be changed. Deleting the owning
standard object intentionally deletes its extension sidecar.

## Acceptance fixtures

The integration suite covers:

- a minimal StationXML 1.2 document;
- every standard non-response field and optional omission;
- all measured-value metadata;
- extent-only, span-only, and extent-plus-spans DataAvailability;
- Station and Channel external references;
- empty Response and every response filter/polynomial branch;
- foreign elements and attributes at each XSD extension point;
- import, unrelated edit, export, XSD validation, and semantic XML comparison;
- migration of a database created at the previous Alembic head.
