# 2026-09-25, version 4.3.3-beta: ASGSR, Alexey Emanov
# ****************************************************************************
#
# Suggest the two-letter SEED channel prefix from sample rate, the
# instrument angular period, and the measured quantity.
#
# The angular period is the reciprocal of the instrument natural frequency
# (NRL Long-Period_Corner, or Low-Frequency_Corner in hertz when the
# period corners are absent), not a geometric angle. Band letters follow
# SEED Appendix A, including the 10 s split above 10 Hz.
#
# ****************************************************************************/

import re

_NUMBER = re.compile(r'([0-9]*\.?[0-9]+(?:[eE][+\-]?\d+)?)')
_SECONDS = re.compile(r'([0-9]*\.?[0-9]+)\s*(?:s|sec|secs|seconds)\b', re.I)
_HERTZ = re.compile(r'([0-9]*\.?[0-9]+)\s*hz\b', re.I)
_CHANNEL = re.compile(r'B052F04\s+Channel:\s*([A-Z0-9]{2,3})', re.I)
_LOW_FREQUENCY_CORNER = re.compile(
    r'Low-Frequency[_\s]+Corner\s*[:=]?\s*'
    r'([0-9]*\.?[0-9]+(?:[eE][+\-]?\d+)?)\s*(hz|s|sec|secs|seconds)?',
    re.I,
)


def parse_number(value):
    if value is None or value == '':
        return None
    if isinstance(value, (int, float)):
        return float(value)
    match = _NUMBER.search(str(value).strip())
    if not match:
        return None
    try:
        return float(match.group(1))
    except ValueError:
        return None


def parse_angular_period(value):
    """Return the angular period in seconds.

    A value in seconds is used as-is. A value in hertz is the natural
    frequency, and the period is its reciprocal.
    """
    if value is None or value == '':
        return None
    if isinstance(value, (int, float)):
        return float(value)
    text = str(value).strip()
    seconds = _SECONDS.search(text)
    if seconds:
        return float(seconds.group(1))
    hertz = _HERTZ.search(text)
    if hertz:
        frequency = float(hertz.group(1))
        return (1.0 / frequency) if frequency else None
    return parse_number(text)


def angular_period_from_low_frequency_corner(text):
    """Period in seconds from an NRL Low-Frequency_Corner phrase.

    The catalog stores this corner in hertz. A missing unit is hertz.
    A zero corner has no finite period and leaves the band broadband.
    """
    match = _LOW_FREQUENCY_CORNER.search(str(text or ''))
    if not match:
        return None
    value = float(match.group(1))
    unit = (match.group(2) or 'hz').lower()
    if unit.startswith('h'):
        return (1.0 / value) if value else None
    return value


def angular_period_from_keys(keys):
    """Angular period from sensor key text: '120 s' or '4.5 Hz'."""
    text = ' '.join(str(key) for key in keys or [])
    seconds = _SECONDS.search(text)
    if seconds:
        return float(seconds.group(1))
    frequencies = [float(item) for item in _HERTZ.findall(text)]
    if not frequencies:
        return None
    # Without an explicit period, a lone frequency is the natural frequency.
    # Two frequencies: the smaller is the natural frequency.
    frequency = min(frequencies) if len(frequencies) > 1 else frequencies[0]
    if len(frequencies) == 1:
        return 1.0 / frequency if frequency else None
    return 1.0 / frequency if frequency else None


def sample_rate_from_keys(sensor_keys, datalogger_keys):
    """Sample rate in Hz from datalogger keys, else from a mixed key list."""
    logger_text = ' '.join(str(key) for key in datalogger_keys or [])
    logger_rates = [float(item) for item in _HERTZ.findall(logger_text)]
    if logger_rates:
        return logger_rates[-1]
    sensor_text = ' '.join(str(key) for key in sensor_keys or [])
    frequencies = [float(item) for item in _HERTZ.findall(sensor_text)]
    if _SECONDS.search(sensor_text) and frequencies:
        return max(frequencies)
    if len(frequencies) > 1:
        return max(frequencies)
    return None


def units_and_legacy_from_resp(text):
    """Return (input unit, legacy instrument letter) from a RESP document."""
    units = None
    legacy = None
    for line in (text or '').splitlines():
        if units is None and line.startswith('B054F05'):
            payload = line.split(':', 1)[-1].strip()
            units = payload.split(' - ', 1)[0].strip() or None
        if legacy is None:
            match = _CHANNEL.search(line)
            if match and len(match.group(1)) >= 2:
                letter = match.group(1)[1].upper()
                if letter != 'Z':
                    legacy = letter
        if units is not None and legacy is not None:
            break
    return units, legacy


def band_code(sample_rate, angular_period=None):
    """SEED band letter.

    A missing angular period or natural frequency uses the long-period
    column. An accelerometer open to low frequencies is therefore broadband.
    """
    rate = parse_number(sample_rate)
    if rate is None:
        return ''
    period = parse_angular_period(angular_period)
    short_period = period is not None and period < 10

    if rate >= 1000:
        return 'G' if short_period else 'F'
    if rate >= 250:
        return 'D' if short_period else 'C'
    if rate >= 80:
        return 'E' if short_period else 'H'
    if rate >= 10:
        return 'S' if short_period else 'B'
    if rate > 1:
        return 'M'
    if 0.9 < rate < 1.1:
        return 'L'
    if 0.09 < rate < 0.11:
        return 'V'
    if 0.009 < rate < 0.011:
        return 'U'
    if 0.0001 <= rate < 0.001:
        return 'R'
    if 0.00001 <= rate < 0.0001:
        return 'P'
    if 0.000001 <= rate < 0.00001:
        return 'T'
    if rate < 0.000001:
        return 'Q'
    return ''


def motion_is_clear(sensor_type):
    """True when the catalog type is already ground velocity or acceleration."""
    token = re.sub(r'[\s_\-]+', '', str(sensor_type or '').lower())
    return token in (
        'groundvel', 'groundvelocity', 'velocity',
        'groundacc', 'groundaccel', 'groundacceleration', 'acceleration',
    )


def response_sample_rate_and_units(response):
    """Final sample rate and input units of a combined channel response.

    The rate is the output of the last stage. Units are the sensitivity
    input, or the first stage when the sensitivity has none.
    """
    stages = getattr(response, 'response_stages', None) or []
    rate = None
    if stages:
        last = stages[-1]
        output_rate = getattr(last, 'decimation_output_sample_rate', None)
        factor = getattr(last, 'decimation_factor', None)
        input_rate = getattr(last, 'decimation_input_sample_rate', None)
        if output_rate not in (None, 0):
            rate = float(output_rate)
        elif factor not in (None, 0) and input_rate not in (None, 0):
            rate = float(input_rate) / float(factor)
    units = None
    sensitivity = getattr(response, 'instrument_sensitivity', None)
    if sensitivity is not None and getattr(sensitivity, 'input_units', None):
        units = str(sensitivity.input_units)
    elif stages and getattr(stages[0], 'input_units', None):
        units = str(stages[0].input_units)
    return rate, units


def input_units_from_text(text):
    """First-stage input units from a RESP file or an ObsPy response printout."""
    for line in (text or '').splitlines():
        if line.startswith('B054F05'):
            payload = line.split(':', 1)[-1].strip()
            units = payload.split(' - ', 1)[0].strip()
            if units:
                return units
        match = re.search(r'\bfrom\s+(\S+)\s+to\s+', line, re.I)
        if match:
            return match.group(1)
        match = re.search(r'\bFrom\s+(\S+)\s+\(', line)
        if match:
            return match.group(1)
    return None


def _quantity(sensor_type, input_units):
    token = re.sub(r'[\s_\-]+', '', str(sensor_type or '').lower())
    by_type = {
        'groundvel': 'velocity',
        'groundvelocity': 'velocity',
        'velocity': 'velocity',
        'groundacc': 'acceleration',
        'groundaccel': 'acceleration',
        'groundacceleration': 'acceleration',
        'acceleration': 'acceleration',
        'pressure': 'pressure',
        'airpressure': 'pressure',
        'waterpressure': 'hydrophone',
        'hydrophone': 'hydrophone',
        'infrasound': 'infrasound',
        'tilt': 'tilt',
        'rotation': 'rotation',
        'rotational': 'rotation',
        'magnetic': 'magnetic',
        'humidity': 'humidity',
        'temperature': 'temperature',
        'electric': 'electric',
        'electricpotential': 'electric',
        'strain': 'strain',
        'rainfall': 'rainfall',
        'rain': 'rainfall',
        'bolometer': 'bolometer',
        'volumetricstrain': 'volumetric',
        'volumetric': 'volumetric',
        'wind': 'wind',
        'electronic': 'electronic',
    }
    if token in by_type:
        return by_type[token]

    units = re.sub(r'\s+', '', str(input_units or '').lower())
    units = units.replace('**', '^')
    # m/s^2, cm/s^2, nm/s2: acceleration. m/s is velocity.
    if re.search(r'/s(\^2|2)$', units):
        return 'acceleration'
    if re.search(r'/s(ec)?$', units):
        return 'velocity'
    if units in ('pa', 'pascal', 'pascals'):
        return 'pressure'
    if units in ('rad/s^2', 'rad/s2', 'rad/s'):
        return 'rotation'
    if units in ('rad', 'radian', 'radians'):
        return 'tilt'
    if units in ('t', 'tesla', 'teslas'):
        return 'magnetic'
    if units in ('%', 'percent'):
        return 'humidity'
    if units in ('degc', 'celsius', 'degcelsius'):
        return 'temperature'
    if units in ('m/m',):
        return 'strain'
    return None


def instrument_code(sensor_type=None, input_units=None, angular_period=None,
                    description='', legacy_instrument=None):
    """Instrument letter from the measured quantity."""
    quantity = _quantity(sensor_type, input_units)
    period = parse_angular_period(angular_period)
    text = str(description or '').lower()
    low_gain = 'low gain' in text or 'low-gain' in text

    if quantity == 'velocity':
        if period is not None and period <= 0.2:
            return 'P'
        return 'L' if low_gain else 'H'
    if quantity == 'acceleration':
        return 'N'
    if quantity in ('pressure', 'hydrophone', 'infrasound'):
        return 'D'
    if quantity == 'tilt':
        return 'A'
    if quantity == 'rotation':
        return 'J'
    if quantity == 'magnetic':
        return 'F'
    if quantity == 'humidity':
        return 'I'
    if quantity == 'temperature':
        return 'K'
    if quantity == 'electric':
        return 'Q'
    if quantity == 'strain':
        return 'S'
    if quantity == 'rainfall':
        return 'R'
    if quantity == 'bolometer':
        return 'U'
    if quantity == 'volumetric':
        return 'V'
    if quantity == 'wind':
        return 'W'
    if quantity == 'electronic':
        return 'E'

    letter = str(legacy_instrument or '').strip().upper()[:1]
    if letter and letter != 'Z':
        return letter
    return ''


# Appendix A: dip and azimuth are not applicable and should be omitted.
_NO_DIP_AZIMUTH = {
    'pressure', 'hydrophone', 'infrasound', 'humidity', 'temperature',
    'rainfall', 'bolometer', 'volumetric', 'wind', 'electronic',
}


def _location_letter(sensor_type, description, default):
    """Third letter for a scalar sensor: a place or kind, not a direction."""
    text = ('%s %s' % (sensor_type or '', description or '')).lower()
    if 'hydrophone' in text or 'waterpressure' in text or 'water pressure' in text:
        return 'H'
    if 'infrasound' in text or 'microbarometer' in text or 'infra' in text:
        return 'F'
    if 'barometer' in text or 'weather' in text:
        return 'O'
    if 'down hole' in text or 'downhole' in text or 'borehole' in text:
        return 'D'
    if 'underground' in text:
        return 'U'
    if 'inside' in text or 'indoor' in text or 'building' in text:
        return 'I'
    token = re.sub(r'[\s_\-]+', '', str(sensor_type or '').lower())
    if token == 'airpressure':
        return 'F'
    return default


def channel_mnemonic(sensor_type=None, input_units=None, description=''):
    """SEED orientation letter when dip and azimuth do not apply."""
    quantity = _quantity(sensor_type, input_units)
    if quantity in ('pressure', 'hydrophone', 'infrasound'):
        return _location_letter(sensor_type, description, 'O')
    if quantity == 'humidity':
        return _location_letter(sensor_type, description, 'O')
    if quantity == 'temperature':
        return _location_letter(sensor_type, description, 'O')
    if quantity == 'wind':
        text = ('%s %s' % (sensor_type or '', description or '')).lower()
        if 'direction' in text:
            return 'D'
        return 'S'
    return ''


def suggest_channel_prefix(sensor_type=None, angular_period=None, sample_rate=None,
                           input_units=None, description='', legacy_instrument=None):
    """Return band, instrument and the editable two-letter prefix.

    When Appendix A says dip and azimuth are not applicable, ``code`` is the
    suggested full channel name and ``orientationApplies`` is false.
    """
    band = band_code(sample_rate, angular_period)
    instrument = instrument_code(
        sensor_type, input_units, angular_period, description, legacy_instrument
    )
    prefix = band + instrument
    quantity = _quantity(sensor_type, input_units)
    applies = quantity not in _NO_DIP_AZIMUTH
    mnemonic = '' if applies else channel_mnemonic(sensor_type, input_units, description)
    return {
        'band': band,
        'instrument': instrument,
        'prefix': prefix,
        'code': prefix + mnemonic,
        'orientationApplies': applies,
    }
