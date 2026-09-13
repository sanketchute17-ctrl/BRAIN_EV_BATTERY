# Oxford Battery Degradation Dataset

## Add Files Here
Place Oxford Battery Degradation Study `.csv` files in this directory.

## Dataset Source
Download from: https://ora.ox.ac.uk/objects/uuid:03ba4b01-cfed-46d3-9b1a-7d4a7bdf6fac

**Dataset contains:** 8 lithium iron phosphate (LFP) cells, cycle-aged at different temperatures.

## Expected Column Names (CSV)
| Column | Description |
|--------|-------------|
| `time/s` | Time in seconds |
| `Ecell/V` | Cell voltage |
| `I/mA` | Current in milliamps |
| `Temperature/°C` | Cell temperature |
| `Capacity/mA.h` | Measured capacity |
| `cycle number` | Cycle index |

## Auto-Detection
When `.csv` files are placed here, `dataset_validation.py` will automatically:
1. Load and parse CSV files (columns auto-mapped)
2. Compare Digital Twin voltage predictions against real measured values
3. Report RMSE and quality score

## Note on Chemistry
Oxford dataset uses **LFP** cells. The Digital Twin models **NMC** chemistry.
A chemistry correction factor may be required for direct comparison.
