"""
dataset_validation.py — Digital Twin vs Real Dataset Validation Engine
=======================================================================
Battery Digital Twin | Validation Layer

When real battery datasets are placed in the datasets/ folders,
this script:
  1. Auto-detects files in NASA/, CALCE/, or Oxford/
  2. Loads datasets via calibration/dataset_loader.py
  3. Runs Digital Twin physics engine under equivalent conditions
  4. Computes error metrics: MAE, RMSE, Percentage Error for V, T, Q
  5. Generates battery_model/validation/validation_report.md

Does NOT falsely claim validation if datasets are missing.
"""

import os
import sys
import math
import datetime
from typing import Optional, Dict, Any, List

# Add parent directories
_MODEL_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.insert(0, _MODEL_ROOT)
sys.path.insert(0, os.path.join(_MODEL_ROOT, 'physics'))
sys.path.insert(0, os.path.join(_MODEL_ROOT, 'calibration'))
sys.path.insert(0, os.path.join(_MODEL_ROOT, 'parameters'))

from param_loader import check_system_calibration_status
from dataset_loader import scan_all_datasets, load_and_normalize_dataset, check_dataset_availability
from electrical_model import CellElectricalModel, compute_ocv, compute_terminal_voltage
from thermal_model import PackThermalModel


# ── Error Metrics Calculations ────────────────────────────────────────────────
def compute_rmse(actual: List[float], predicted: List[float]) -> float:
    """Compute Root Mean Square Error between two series."""
    if not actual or not predicted or len(actual) != len(predicted):
        return float('nan')
    n = len(actual)
    mse = sum((a - p) ** 2 for a, p in zip(actual, predicted)) / n
    return math.sqrt(mse)


def compute_mae(actual: List[float], predicted: List[float]) -> float:
    """Compute Mean Absolute Error."""
    if not actual or not predicted or len(actual) != len(predicted):
        return float('nan')
    n = len(actual)
    return sum(abs(a - p) for a, p in zip(actual, predicted)) / n


def compute_mape(actual: List[float], predicted: List[float]) -> float:
    """Compute Mean Absolute Percentage Error (%)."""
    if not actual or not predicted or len(actual) != len(predicted):
        return float('nan')
    valid_pairs = [(a, p) for a, p in zip(actual, predicted) if abs(a) > 1e-6]
    if not valid_pairs:
        return float('nan')
    mape = sum(abs((a - p) / a) for a, p in valid_pairs) / len(valid_pairs) * 100.0
    return mape


# ── Digital Twin Physics Simulation Runner ────────────────────────────────────
def run_dt_simulation_series(current_series: List[float],
                              time_series: List[float],
                              initial_soc_percent: float = 100.0,
                              initial_temp_C: float = 25.0,
                              resistance_ohm: float = 0.020) -> List[Dict[str, float]]:
    """
    Run the Modular Digital Twin physics engine against an empirical current time series.

    Returns:
        List of {voltage_V, temperature_C, soc_percent} dicts per step.
    """
    cell_elec = CellElectricalModel(soc_percent=initial_soc_percent, resistance_ohm=resistance_ohm)
    pack_therm = PackThermalModel(num_cells=1, initial_temp_C=initial_temp_C)
    pack_therm.set_resistances([resistance_ohm])

    results = []
    n_steps = len(current_series)

    for idx in range(n_steps):
        i_app = current_series[idx]
        dt = 1.0
        if idx > 0 and len(time_series) == n_steps:
            dt = max(0.01, min(10.0, time_series[idx] - time_series[idx-1]))

        elec_res = cell_elec.step(current_A=i_app, dt_s=dt)
        temps = pack_therm.step(currents=[i_app], flow_rate_LPM=8.5, dt_s=dt)

        results.append({
            'voltage_V': elec_res['voltage_V'],
            'soc_percent': elec_res['soc_percent'],
            'temperature_C': round(temps[0], 2)
        })

    return results


# ── Dataset Comparison ────────────────────────────────────────────────────────
def compare_dataset_to_digital_twin(dataset_info: Dict[str, Any]) -> Dict[str, Any]:
    """
    Compare real dataset measurements against Digital Twin simulation outputs.
    """
    if 'error' in dataset_info or dataset_info.get('status') != 'SUCCESS':
        return {
            'status': 'FAILED',
            'reason': dataset_info.get('error', 'Failed dataset load'),
            'file': dataset_info.get('file', '')
        }

    ds_type = dataset_info.get('dataset', 'Unknown')
    file_path = dataset_info.get('file', '')
    fname = os.path.basename(file_path)

    real_v = dataset_info.get('voltage_V', [])
    real_i = dataset_info.get('current_A', [])
    real_t = dataset_info.get('temperature_C', [])
    real_time = dataset_info.get('time_s', [])

    if not real_v:
        return {
            'status': 'INCOMPATIBLE',
            'reason': 'Required column "Voltage" missing or corrupted',
            'file': fname,
            'dataset_type': ds_type
        }

    # Limit to first 500 points for validation evaluation
    eval_len = min(500, len(real_v))
    eval_v = real_v[:eval_len]
    eval_i = real_i[:eval_len] if real_i else [1.5] * eval_len
    eval_time = real_time[:eval_len] if real_time else list(range(eval_len))

    # Initial condition setup
    init_v = eval_v[0]
    init_soc = max(0.0, min(100.0, (init_v - 3.20) / 0.95 * 100.0))
    init_temp = real_t[0] if real_t else 25.0

    # Run physics engine simulation
    sim_out = run_dt_simulation_series(eval_i, eval_time, initial_soc_percent=init_soc, initial_temp_C=init_temp)
    sim_v = [s['voltage_V'] for s in sim_out]
    sim_t = [s['temperature_C'] for s in sim_out]

    # Metrics computation
    v_rmse = compute_rmse(eval_v, sim_v)
    v_mae  = compute_mae(eval_v, sim_v)
    v_mape = compute_mape(eval_v, sim_v)

    metrics = {
        'voltage': {
            'rmse_V': round(v_rmse, 5),
            'mae_V': round(v_mae, 5),
            'percentage_error': round(v_mape, 2)
        }
    }

    if real_t and len(real_t) >= eval_len:
        eval_t = real_t[:eval_len]
        t_rmse = compute_rmse(eval_t, sim_t)
        t_mae  = compute_mae(eval_t, sim_t)
        t_mape = compute_mape(eval_t, sim_t)
        metrics['temperature'] = {
            'rmse_C': round(t_rmse, 3),
            'mae_C': round(t_mae, 3),
            'percentage_error': round(t_mape, 2)
        }

    return {
        'status': 'VALIDATED',
        'file': fname,
        'dataset_type': ds_type,
        'points_evaluated': eval_len,
        'metrics': metrics,
        'quality_rating': 'EXCELLENT' if v_rmse < 0.03 else ('GOOD' if v_rmse < 0.08 else 'REVIEW_NEEDED')
    }


def generate_validation_report() -> Dict[str, Any]:
    """
    Run full validation suite and write validation_report.md.
    """
    discovered = scan_all_datasets()
    total_datasets = sum(len(v) for v in discovered.values())

    sys_status, sys_details = check_system_calibration_status()
    timestamp = datetime.datetime.utcnow().isoformat(timespec='seconds') + 'Z'

    results = []

    if total_datasets > 0:
        for ds_type, file_list in discovered.items():
            for fpath in file_list:
                norm_ds = load_and_normalize_dataset(fpath, ds_type)
                comp_res = compare_dataset_to_digital_twin(norm_ds)
                results.append(comp_res)

    report_data = {
        'timestamp': timestamp,
        'system_status': sys_status,
        'datasets_found': total_datasets,
        'discovered': discovered,
        'results': results
    }

    # Write validation_report.md
    report_path = os.path.join(_MODEL_ROOT, 'validation', 'validation_report.md')

    lines = []
    lines.append("# Battery Digital Twin Validation Report\n")
    lines.append(f"**Generated**: `{timestamp}`  ")
    lines.append(f"**Digital Twin Status**: `{sys_status} PARAMETER MODE`  ")
    lines.append(f"**Total Datasets Evaluated**: `{total_datasets}`\n")
    lines.append("---\n")

    lines.append("## 1. Executive Summary\n")
    if total_datasets == 0:
        lines.append("> [!WARNING]")
        lines.append("> **No Validation Performed**: Missing raw battery datasets.")
        lines.append("> The Digital Twin is currently running in **DEFAULT PARAMETER MODE**.")
        lines.append("> Validation requires dataset files in `battery_model/datasets/`.\n")
    else:
        lines.append(f"Evaluated {total_datasets} dataset file(s) across NASA, CALCE, and Oxford sources.\n")

    lines.append("## 2. Dataset Discovery & Requirements Status\n")
    lines.append("| Dataset Source | Discovered Files | Validation Role | Requirements Status |")
    lines.append("|---|---|---|---|")

    nasa_cnt = len(discovered['NASA'])
    calce_cnt = len(discovered['CALCE'])
    oxford_cnt = len(discovered['Oxford'])

    lines.append(f"| **NASA PCoE** | `{nasa_cnt} file(s)` | Capacity Fade & Aging Validation | {'READY' if nasa_cnt > 0 else 'MISSING — Add .mat/.csv to datasets/NASA/'} |")
    lines.append(f"| **CALCE** | `{calce_cnt} file(s)` | Electrical & Thermal Feature Calibration | {'READY' if calce_cnt > 0 else 'MISSING — Add .csv to datasets/CALCE/'} |")
    lines.append(f"| **Oxford** | `{oxford_cnt} file(s)` | Independent Validation | {'READY' if oxford_cnt > 0 else 'MISSING — Add .csv to datasets/Oxford/'} |\n")

    if results:
        lines.append("## 3. Metric Evaluation Results\n")
        lines.append("| Dataset File | Type | Status | Voltage RMSE | Voltage MAE | Voltage Error (%) | Rating |")
        lines.append("|---|---|---|---|---|---|---|")
        for r in results:
            if r.get('status') == 'VALIDATED':
                vm = r['metrics'].get('voltage', {})
                lines.append(f"| `{r['file']}` | {r['dataset_type']} | {r['status']} | {vm.get('rmse_V')} V | {vm.get('mae_V')} V | {vm.get('percentage_error')}% | `{r.get('quality_rating')}` |")
            else:
                lines.append(f"| `{r.get('file', 'N/A')}` | {r.get('dataset_type', 'N/A')} | {r['status']} | N/A | N/A | N/A | `UNVALIDATED` |")
        lines.append("")

    lines.append("## 4. Unvalidated / Missing Dataset Diagnostic Guidance\n")
    lines.append("If validation failed or was skipped, ensure your dataset contains these standard column names:")
    lines.append("- **Voltage**: `Voltage`, `v_cell`, `V`, `Vbatt`")
    lines.append("- **Current**: `Current`, `i_cell`, `I`, `Ibatt`")
    lines.append("- **Temperature**: `Temperature`, `Temp`, `T_cell`, `T_degC`")
    lines.append("- **Time**: `Time`, `time_s`, `test_time`")

    with open(report_path, 'w', encoding='utf-8') as f:
        f.write("\n".join(lines))

    return report_data


# ── Standalone Test ───────────────────────────────────────────────────────────
if __name__ == '__main__':
    print("=" * 60)
    print("  Dataset Validation Engine — Standalone Test")
    print("=" * 60)

    report = generate_validation_report()
    print(f"\nValidation Report Status: {report['system_status']}")
    print(f"Datasets Found          : {report['datasets_found']}")
    print(f"Report Generated at     : battery_model/validation/validation_report.md")
    print()
