# Battery Digital Twin Calibration Layer

This directory contains the dataset calibration pipeline for calibrating physical battery parameters from real empirical test datasets.

## Architecture

```
Real Battery Dataset
        ↓
Dataset Analysis (dataset_loader.py)
        ↓
Parameter Extraction (parameter_extractor.py)
        ↓
Calibrated Battery Parameters (parameter_updater.py)
        ↓
Physics Engine (electrical_model.py, thermal_model.py, etc.)
        ↓
Digital Twin Simulation
```

## Dataset Roles & Expected Schema

### 1. NASA PCoE Dataset
- **Location**: `battery_model/datasets/NASA/`
- **File Format**: `.mat` or `.csv`
- **Role**: Analyze cycle-dependent degradation, capacity fade rate ($\beta$), internal resistance growth rate ($\alpha$), and State of Health ($SOH$) evolution.

### 2. CALCE Battery Dataset
- **Location**: `battery_model/datasets/CALCE/`
- **File Format**: `.csv`
- **Role**: High-rate electrical cycling analysis, internal resistance ($R_0$) estimation, OCV vs SOC curve calibration ($a, b$), and thermal generation characteristics.

### 3. Oxford Battery Degradation Dataset
- **Location**: `battery_model/datasets/Oxford/`
- **File Format**: `.csv`
- **Role**: **Independent Validation Dataset**. Used to compare real battery behaviour vs Digital Twin simulated outputs without merging incompatible parameters.

---

## Parameter Metadata & Provenance

Every parameter in `battery_model/parameters/*.json` includes metadata tracking its origin:

```json
{
  "cell_internal_resistance_ohm": {
    "value": 0.020,
    "unit": "ohm",
    "source": "initial_assumption",
    "calibrated": false,
    "dataset_used": null
  }
}
```

After calibration pipeline execution on a dataset, parameters are updated with provenance:

```json
{
  "cell_internal_resistance_ohm": {
    "value": 0.0195,
    "unit": "ohm",
    "source": "CALCE",
    "calibrated": true,
    "dataset_used": "CALCE_CS2_35_1_21_11.csv"
  }
}
```

---

## Instructions for Adding Datasets

1. Place your downloaded dataset files in their respective folders:
   - NASA files $\rightarrow$ `battery_model/datasets/NASA/`
   - CALCE files $\rightarrow$ `battery_model/datasets/CALCE/`
   - Oxford files $\rightarrow$ `battery_model/datasets/Oxford/`

2. Run the calibration engine:
   ```bash
   python -m calibration.calibration_engine
   ```
   or call `run_calibration_pipeline()` from Python.

3. System status will update automatically from:
   `DEFAULT PARAMETER MODE — NOT DATA CALIBRATED`
   to:
   `CALIBRATED` / `PARTIALLY VALIDATED` / `VALIDATED`
