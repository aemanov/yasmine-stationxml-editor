# ****************************************************************************
#
# Unit tests for SEED channel-prefix suggestions.
#
# ****************************************************************************/

import unittest

from yasmine.app.helpers.nrl.seed_channel_prefix import (
    angular_period_from_keys,
    band_code,
    input_units_from_text,
    parse_angular_period,
    sample_rate_from_keys,
    response_sample_rate_and_units,
    suggest_channel_prefix,
    units_and_legacy_from_resp,
)


class SeedChannelPrefixTest(unittest.TestCase):

    def test_angular_period_is_reciprocal_of_natural_frequency(self):
        self.assertEqual(parse_angular_period('120 s'), 120)
        self.assertAlmostEqual(parse_angular_period('4.5 Hz'), 1 / 4.5)

    def test_band_uses_angular_period_above_10_hz(self):
        self.assertEqual(band_code(100, '120 s'), 'H')
        self.assertEqual(band_code(20, 120), 'B')
        self.assertEqual(band_code(100, '1 s'), 'E')
        self.assertEqual(band_code(100, None), 'H')
        self.assertEqual(band_code(0.1, 120), 'V')
        self.assertEqual(band_code(1, 1), 'L')
        self.assertEqual(band_code(5e-5, None), 'P')
        self.assertEqual(band_code(5e-6, None), 'T')

    def test_velocity_broadband_prefix(self):
        suggestion = suggest_channel_prefix('groundVel', '120 s', '100 Hz')
        self.assertEqual(suggestion['prefix'], 'HH')

    def test_short_period_and_geophone(self):
        short = suggest_channel_prefix('groundVel', '1 s', 100)
        self.assertEqual(short['prefix'], 'EH')
        geophone = suggest_channel_prefix('groundVel', '5 Hz', 100)
        self.assertEqual(geophone['instrument'], 'P')
        self.assertEqual(geophone['band'], 'E')

    def test_units_infer_velocity_or_acceleration(self):
        velocity = suggest_channel_prefix(None, None, 100, input_units='M/S')
        self.assertEqual(velocity['prefix'], 'HH')
        self.assertEqual(velocity['instrument'], 'H')
        acceleration = suggest_channel_prefix(
            'unknown', None, 100, input_units='M/S**2'
        )
        self.assertEqual(acceleration['prefix'], 'HN')
        short = suggest_channel_prefix(None, '1 s', 100, input_units='cm/s^2')
        self.assertEqual(short['prefix'], 'EN')

    def test_acceleration_pressure_and_low_gain(self):
        self.assertEqual(
            suggest_channel_prefix('groundAcc', None, 100)['prefix'], 'HN'
        )
        self.assertEqual(
            suggest_channel_prefix(None, 30, 20, input_units='Pa')['prefix'], 'BD'
        )
        low = suggest_channel_prefix(
            'groundVel', '120 s', 20, description='Low gain seismometer'
        )
        self.assertEqual(low['prefix'], 'BL')
        air = suggest_channel_prefix('airPressure', '30 s', 20)
        self.assertFalse(air['orientationApplies'])
        self.assertEqual(air['code'], 'BDF')
        weather = suggest_channel_prefix('airPressure', '30 s', 20, description='barometer')
        self.assertEqual(weather['code'], 'BDO')
        self.assertTrue(suggest_channel_prefix('groundVel', '120 s', 20)['orientationApplies'])

    def test_partial_and_legacy(self):
        rate_only = suggest_channel_prefix(sample_rate=20)
        self.assertEqual(rate_only['prefix'], 'B')
        empty = suggest_channel_prefix()
        self.assertEqual(empty['prefix'], '')
        legacy = suggest_channel_prefix(sample_rate=20, legacy_instrument='L')
        self.assertEqual(legacy['prefix'], 'BL')

    def test_combined_response_rate_and_units_assume_broadband(self):
        class Stage(object):
            def __init__(self, input_units, input_rate, factor, output_rate=None):
                self.input_units = input_units
                self.decimation_input_sample_rate = input_rate
                self.decimation_factor = factor
                self.decimation_output_sample_rate = output_rate

        class Sensitivity(object):
            input_units = 'M/S'

        class Response(object):
            instrument_sensitivity = Sensitivity()
            response_stages = [Stage('M/S', 100, 1), Stage('V', 100, 1, 40)]

        rate, units = response_sample_rate_and_units(Response())
        self.assertEqual(rate, 40)
        self.assertEqual(units, 'M/S')
        suggestion = suggest_channel_prefix(
            sensor_type=None,
            angular_period=None,
            sample_rate=rate,
            input_units=units,
        )
        self.assertEqual(suggestion['prefix'], 'BH')

    def test_keys_and_resp(self):
        self.assertEqual(angular_period_from_keys(['120 s', 'STS-2']), 120)
        self.assertEqual(
            sample_rate_from_keys(['120 s'], ['100 Hz', 'causal']), 100
        )
        units, letter = units_and_legacy_from_resp(
            'B054F05     Response in units lookup:              M/S - Velocity\n'
            'B052F04     Channel:                               SHZ\n'
        )
        self.assertEqual(units, 'M/S')
        self.assertEqual(letter, 'H')
        self.assertEqual(
            input_units_from_text('Stage 1: PolesZerosResponseStage from M/S**2 to V, gain: 1'),
            'M/S**2'
        )
