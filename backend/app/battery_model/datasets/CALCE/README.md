# CALCE Battery Dataset

## Add Files Here
Place CALCE Battery Research Group `.csv` files in this directory.

## Dataset Source
Download from: https://calce.umd.edu/battery-data

**Recommended datasets:**
- CS2 cell group: `CS2_33.csv`, `CS2_34.csv`, `CS2_35.csv`, `CS2_36.csv`
- CX2 cell group: `CX2_16.csv`, `CX2_33.csv`, `CX2_34.csv`, `CX2_35.csv`, `CX2_36.csv`

## Expected Column Names (CSV)
| Column | Description |
|--------|-------------|
| `Cycle_Index` | Cycle number |
| `Voltage(V)` | Cell terminal voltage |
| `Current(A)` | Applied current |
| `Temperature (C)` | Cell temperature |
| `Discharge_Capacity(Ah)` | Discharged capacity per cycle |
| `Charge_Capacity(Ah)` | Charged capacity per cycle |

## Auto-Detection
When `.csv` files are placed here, `dataset_validation.py` will automatically:
1. Load and parse all CSV files
2. Run Digital Twin physics at matching current/SOC conditions
3. Compute Voltage RMSE and Capacity Error against real data
