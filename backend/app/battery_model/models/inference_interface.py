"""
inference_interface.py — AI Prediction Model Integration Interface
===================================================================
Battery Digital Twin | Models Layer

This module is the integration point between the Battery Digital Twin
and downstream AI prediction models.

Input:  BMS telemetry JSON (from telemetry_generator.py)
Output: AI prediction results

Expected model files (place in models/ directory):
  - soc_model.pkl     : State of Charge predictor
  - soh_model.pkl     : State of Health predictor
  - rul_model.pkl     : Remaining Useful Life predictor
  - anomaly_model.pkl : Anomaly / fault detection model

Architecture:
  BMS Telemetry → Feature Adapter (feature_adapter.py) → ML Model → Prediction Output
"""

import os
import json
import datetime
from typing import Dict, Any

from feature_adapter import transform_telemetry_for_model, MODEL_FEATURE_SCHEMAS

# Optional pickle & numpy imports
try:
    import pickle
    PICKLE_AVAILABLE = True
except ImportError:
    PICKLE_AVAILABLE = False

_MODELS_DIR = os.path.dirname(__file__)

MODEL_FILES = {
    'soc':     os.path.join(_MODELS_DIR, 'soc_model.pkl'),
    'soh':     os.path.join(_MODELS_DIR, 'soh_model.pkl'),
    'rul':     os.path.join(_MODELS_DIR, 'rul_model.pkl'),
    'anomaly': os.path.join(_MODELS_DIR, 'anomaly_model.pkl'),
}


def _load_model(model_key: str):
    """Load a .pkl model file if it exists."""
    path = MODEL_FILES.get(model_key)
    if not path or not os.path.exists(path):
        return None
    if not PICKLE_AVAILABLE:
        return None
    try:
        with open(path, 'rb') as f:
            return pickle.load(f)
    except Exception as e:
        print(f"[ERROR] Failed to load {model_key} model: {str(e)}")
        return None


def _check_model_availability() -> dict:
    """Check which model files are present."""
    return {
        key: os.path.exists(path)
        for key, path in MODEL_FILES.items()
    }


def run_inference(telemetry_packet: dict) -> dict:
    """
    Run AI model inference on a BMS telemetry packet.

    Loads .pkl models if available, returns structured status stubs if not yet trained.

    Args:
        telemetry_packet: Standardized BMS JSON telemetry dict.

    Returns:
        Prediction results dict with confidence and feature validation.
    """
    availability = _check_model_availability()

    predictions = {
        'timestamp':          datetime.datetime.utcnow().isoformat() + 'Z',
        'battery_id':         telemetry_packet.get('battery_id', 'EV_DT_001'),
        'models_available':   availability,
        'predictions': {}
    }

    # 1. SOC Prediction
    soc_transform = transform_telemetry_for_model(telemetry_packet, 'soc_model.pkl')
    if availability['soc'] and soc_transform['status'] == 'SUCCESS':
        soc_model = _load_model('soc')
        if soc_model:
            pred_val = float(soc_model.predict([soc_transform['feature_vector']])[0])
            predictions['predictions']['soc'] = {
                'value_percent': round(pred_val, 2),
                'model_loaded': True,
                'status': 'SUCCESS'
            }
        else:
            predictions['predictions']['soc'] = {'value_percent': None, 'model_loaded': False, 'status': 'MODEL_LOAD_FAILED'}
    else:
        status_msg = 'MODEL_NOT_YET_TRAINED — Place soc_model.pkl in models/' if not availability['soc'] else f"FEATURE_ERROR: {soc_transform.get('error_message')}"
        predictions['predictions']['soc'] = {'value_percent': None, 'model_loaded': False, 'status': status_msg}

    # 2. SOH Prediction
    soh_transform = transform_telemetry_for_model(telemetry_packet, 'soh_model.pkl')
    if availability['soh'] and soh_transform['status'] == 'SUCCESS':
        soh_model = _load_model('soh')
        if soh_model:
            pred_val = float(soh_model.predict([soh_transform['feature_vector']])[0])
            predictions['predictions']['soh'] = {
                'value_percent': round(pred_val, 2),
                'model_loaded': True,
                'status': 'SUCCESS'
            }
        else:
            predictions['predictions']['soh'] = {'value_percent': None, 'model_loaded': False, 'status': 'MODEL_LOAD_FAILED'}
    else:
        status_msg = 'MODEL_NOT_YET_TRAINED — Place soh_model.pkl in models/' if not availability['soh'] else f"FEATURE_ERROR: {soh_transform.get('error_message')}"
        predictions['predictions']['soh'] = {'value_percent': None, 'model_loaded': False, 'status': status_msg}

    # 3. RUL Prediction
    rul_transform = transform_telemetry_for_model(telemetry_packet, 'rul_model.pkl')
    if availability['rul'] and rul_transform['status'] == 'SUCCESS':
        rul_model = _load_model('rul')
        if rul_model:
            pred_val = float(rul_model.predict([rul_transform['feature_vector']])[0])
            predictions['predictions']['rul'] = {
                'remaining_cycles': round(pred_val, 1),
                'model_loaded': True,
                'status': 'SUCCESS'
            }
        else:
            predictions['predictions']['rul'] = {'remaining_cycles': None, 'model_loaded': False, 'status': 'MODEL_LOAD_FAILED'}
    else:
        status_msg = 'MODEL_NOT_YET_TRAINED — Place rul_model.pkl in models/' if not availability['rul'] else f"FEATURE_ERROR: {rul_transform.get('error_message')}"
        predictions['predictions']['rul'] = {'remaining_cycles': None, 'model_loaded': False, 'status': status_msg}

    # 4. Anomaly Detection
    anomaly_transform = transform_telemetry_for_model(telemetry_packet, 'anomaly_model.pkl')
    if availability['anomaly'] and anomaly_transform['status'] == 'SUCCESS':
        anomaly_model = _load_model('anomaly')
        if anomaly_model:
            score = float(anomaly_model.predict([anomaly_transform['feature_vector']])[0])
            predictions['predictions']['anomaly'] = {
                'anomaly_score': score,
                'is_anomaly': score == -1 or score > 0.8,
                'model_loaded': True,
                'status': 'SUCCESS'
            }
        else:
            predictions['predictions']['anomaly'] = {'is_anomaly': False, 'model_loaded': False, 'status': 'MODEL_LOAD_FAILED'}
    else:
        # BMS rule proxy if ML anomaly model not present
        bms_status_dict = telemetry_packet.get('bms_status', {})
        warn_cnt = bms_status_dict.get('warning_count', telemetry_packet.get('fault_count', 0))
        predictions['predictions']['anomaly'] = {
            'anomaly_score': float(warn_cnt),
            'is_anomaly': warn_cnt > 0,
            'model_loaded': False,
            'status': 'Using BMS fault count proxy — Place anomaly_model.pkl in models/'
        }

    return predictions


# ── Standalone Test ───────────────────────────────────────────────────────────
if __name__ == '__main__':
    print("=" * 60)
    print("  AI Inference Interface — Standalone Test")
    print("=" * 60)

    availability = _check_model_availability()
    print(f"\nModel File Availability:")
    for model, avail in availability.items():
        print(f"  {model:<10}: {'FOUND' if avail else 'NOT YET TRAINED'}")

    mock_packet = {
        'battery_id': 'EV_DT_001',
        'pack': {'voltage_V': 30.24, 'current_A': 15.0, 'power_W': 453.6, 'soc_percent': 74.2, 'cycle_count': 100},
        'cells': [{'id': i, 'voltage_V': 3.78 + i*0.001, 'temperature_C': 30.0 + i*0.5, 'effective_resistance_ohm': 0.020} for i in range(1, 9)],
        'thermal_system': {'coolant_flow': 8.5, 'max_temperature_C': 34.0, 'avg_temperature_C': 30.0},
        'bms_status': {'warning_count': 0, 'contactor_state': 'CLOSED'}
    }

    results = run_inference(mock_packet)
    print(f"\nInference Results:")
    for k, v in results['predictions'].items():
        print(f"  {k:<10}: {v}")
    print()
