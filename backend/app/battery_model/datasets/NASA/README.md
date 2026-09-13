# NASA PCoE Battery Dataset

## Add Files Here
Place NASA PCoE Battery Dataset `.mat` files in this directory.

## Dataset Source
Download from: https://www.nasa.gov/content/prognostics-center-of-excellence-data-set-repository

**Recommended datasets:**
- `B0005.mat` through `B0018.mat` — 18650 cells, 1.5A / 2A discharge
- Each file contains ~600+ charge/discharge cycles

## Expected File Format
- Format: MATLAB `.mat` (v5 or v7.3)
- Structure: `B000X.cycle(n).data.Voltage_measured`
- Columns: `Voltage_measured`, `Current_measured`, `Temperature_measured`, `Capacity`, `Time`

## Auto-Detection
When files are present, `dataset_validation.py` will automatically:
1. Load and parse all `.mat` files
2. Compare Digital Twin physics output to real measured data
3. Report Voltage RMSE, Temperature RMSE, Capacity Error

## Citation
> B. Saha and K. Goebel (2007). Battery Data Set. NASA Ames Prognostics Data Repository.
