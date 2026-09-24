# ****************************************************************************
#
# Plot failures must report the evalresp reason, not ObsPy's generic code.
#
# ****************************************************************************/

import unittest
from unittest.mock import MagicMock

from obspy.core.inventory.response import InstrumentSensitivity, Response

from yasmine.app.utils.response_plot import format_plot_failure


class FormatPlotFailureTest(unittest.TestCase):

    def test_zero_stage0_sensitivity_replaces_illegal_resp_format(self):
        response = Response(
            instrument_sensitivity=InstrumentSensitivity(0.0, 21.2308, 'PA', 'COUNT'),
            response_stages=[],
        )
        message = format_plot_failure(
            ValueError('norm_resp: Illegal RESP format'),
            response,
        )
        self.assertIn('Stage 0 sensitivity is 0', message)
        self.assertIn('21.2308', message)
        self.assertIn('zero stage gain', message)
        self.assertNotIn('Illegal RESP format', message)
        self.assertNotIn('units mismatch', message)

    def test_zero_stage_gain(self):
        stage = MagicMock()
        stage.stage_sequence_number = 2
        stage.stage_gain = 0.0
        stage.input_units = 'V'
        stage.output_units = 'COUNT'
        response = MagicMock()
        response.instrument_sensitivity = None
        response.response_stages = [stage]
        message = format_plot_failure(
            ValueError('norm_resp: Illegal RESP format'),
            response,
        )
        self.assertIn('Stage 2 gain is 0', message)
        self.assertNotIn('Illegal RESP format', message)

    def test_units_mismatch(self):
        first = MagicMock()
        first.stage_sequence_number = 1
        first.stage_gain = 1.0
        first.input_units = 'M/S'
        first.output_units = 'V'
        second = MagicMock()
        second.stage_sequence_number = 2
        second.stage_gain = 1.0
        second.input_units = 'PA'
        second.output_units = 'COUNT'
        response = MagicMock()
        response.instrument_sensitivity = MagicMock(value=1.0)
        response.response_stages = [first, second]
        message = format_plot_failure(
            ValueError('check_channel: Illegal RESP format'),
            response,
        )
        self.assertIn('Units mismatch at stage 2', message)
        self.assertIn('v followed by pa', message)

    def test_other_errors_stay_unchanged(self):
        message = format_plot_failure(ValueError('matplotlib failed'), None)
        self.assertEqual(message, 'Cannot generate plot.<br>matplotlib failed')
