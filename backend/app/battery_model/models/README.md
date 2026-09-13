# AI Prediction Models

## Place Trained Models Here

This directory is the integration point between the Battery Digital Twin
and AI prediction models.

## Expected Model Files

| File | Description | Input Features | Output |
|------|-------------|----------------|--------|
| `soc_model.pkl` | State of Charge predictor | BMS telemetry features | SOC % |
| `soh_model.pkl` | State of Health predictor | BMS telemetry + cycle count | SOH % |
| `rul_model.pkl` | Remaining Useful Life predictor | BMS telemetry + cycle history | Remaining cycles |
| `anomaly_model.pkl` | Anomaly detection model | BMS telemetry features | Anomaly score / flag |

## Model Requirements
- Format: Python `pickle` (.pkl) files
- Interface: Scikit-learn compatible (must implement `.predict(X)`)
- Input: Feature vector from `inference_interface.py::extract_features()`
- Compatible with: scikit-learn, XGBoost, LightGBM, TensorFlow/Keras (via sklearn wrapper)

## Input Feature Vector
The `inference_interface.py::extract_features()` function produces this vector:
```
pack_voltage, pack_current, pack_temp_max, pack_temp_avg, pack_soc, cycle_count,
cell_voltage_mean, cell_voltage_min, cell_voltage_max, cell_voltage_std, cell_delta_V,
cell_temp_mean, cell_temp_max, cell_temp_std, cooling_flow, cooling_active,
fault_count, contactor_closed
```

## How to Use
1. Train your model on NASA/CALCE/Oxford datasets
2. Save as .pkl using `pickle.dump(model, open('soc_model.pkl', 'wb'))`
3. Place in this directory
4. `inference_interface.py` will automatically detect and load the model

## Auto-Detection
`inference_interface.py` checks for each .pkl file at startup.
If found → runs inference. If not found → returns scaffold stub response.
