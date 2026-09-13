"""
parameter_updater.py — Safe Parameter JSON File Updater with Provenance
========================================================================
Battery Digital Twin | Calibration Layer

Updates parameter JSON configuration files in battery_model/parameters/
with newly calibrated parameter metadata while preserving original structure
and maintaining provenance traceability.
"""

import json
import os
from typing import Dict, Any

_PARAM_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'parameters'))


def update_json_file(file_name: str, new_params: Dict[str, Any]) -> bool:
    """
    Safely update a parameter JSON file with calibrated values and metadata.

    Args:
        file_name:  Target JSON file (e.g. 'battery_parameters.json')
        new_params: Dict of parameter updates with metadata

    Returns:
        True if updated successfully, False otherwise.
    """
    path = os.path.join(_PARAM_DIR, file_name)
    if not os.path.exists(path):
        return False

    try:
        with open(path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        _deep_update_metadata(data, new_params)

        with open(path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2)

        return True
    except Exception as e:
        print(f"[ERROR] Failed to update {file_name}: {str(e)}")
        return False


def _deep_update_metadata(target: dict, source: dict):
    """
    Recursively update target dict with source metadata parameter dicts.
    """
    for key, val in source.items():
        if key in target:
            if isinstance(val, dict) and 'value' in val:
                # Direct parameter metadata match
                target[key] = val
            elif isinstance(val, dict) and isinstance(target[key], dict):
                # Nested dict (e.g. ocv_soc_model)
                _deep_update_metadata(target[key], val)
            else:
                target[key] = val
        else:
            target[key] = val


def update_parameter_files(extracted_results: Dict[str, Any]) -> Dict[str, Any]:
    """
    Apply all extracted dataset parameters across parameter files.

    Args:
        extracted_results: Dict output from parameter_extractor.extract_battery_parameters()

    Returns:
        dict summary of files updated.
    """
    if extracted_results.get('status') != 'SUCCESS' or 'parameters' not in extracted_results:
        return {'status': 'NO_UPDATES', 'reason': 'No calibrated parameters found'}

    params = extracted_results['parameters']
    updated_files = []

    # Check battery parameters updates (resistance, OCV)
    battery_updates = {}
    if 'cell_internal_resistance_ohm' in params:
        battery_updates['cell_internal_resistance_ohm'] = params['cell_internal_resistance_ohm']
    if 'ocv_soc_model' in params:
        battery_updates['ocv_soc_model'] = params['ocv_soc_model']

    if battery_updates:
        if update_json_file('battery_parameters.json', battery_updates):
            updated_files.append('battery_parameters.json')

    # Check aging parameters updates (capacity fade)
    aging_updates = {}
    if 'capacity_fade_model' in params:
        aging_updates['capacity_fade_model'] = params['capacity_fade_model']

    if aging_updates:
        if update_json_file('aging_parameters.json', aging_updates):
            updated_files.append('aging_parameters.json')

    return {
        'status': 'SUCCESS' if updated_files else 'NO_UPDATES',
        'updated_files': updated_files,
        'dataset_used': extracted_results.get('dataset_file', '')
    }


# ── Standalone Test ───────────────────────────────────────────────────────────
if __name__ == '__main__':
    print("=" * 60)
    print("  Parameter Updater — Standalone Test")
    print("=" * 60)

    test_updates = {
        'status': 'SUCCESS',
        'dataset_file': 'CALCE_test_01.csv',
        'parameters': {
            'cell_internal_resistance_ohm': {
                'value': 0.0195,
                'unit': 'ohm',
                'source': 'CALCE',
                'calibrated': True,
                'dataset_used': 'CALCE_test_01.csv'
            }
        }
    }

    res = update_parameter_files(test_updates)
    print(f"Update Result: {res}")
    print()
