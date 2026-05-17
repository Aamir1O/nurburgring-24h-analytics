import os
import glob
import pandas as pd


# =========================================
# FIND ALL PROCESSED CSV FILES
# =========================================

files = glob.glob("data/processed/*.csv")

print(f"Total snapshot files found: {len(files)}")


# =========================================
# READ AND COMBINE FILES
# =========================================

all_dataframes = []

for file in files:

    try:

        df = pd.read_csv(file)

        all_dataframes.append(df)

    except Exception as e:

        print(f"Error reading {file}")
        print(e)


# =========================================
# MERGE INTO MASTER DATASET
# =========================================

master_df = pd.concat(all_dataframes, ignore_index=True)

print("\nMASTER DATASET CREATED")

print(master_df.head())


# =========================================
# CONVERT TIMESTAMP
# =========================================

master_df["collection_time"] = pd.to_datetime(
    master_df["collection_time"]
)


# =========================================
# SORT BY TIME
# =========================================

master_df = master_df.sort_values(
    by="collection_time"
)


# =========================================
# SAVE MASTER DATASET
# =========================================

os.makedirs("data/final", exist_ok=True)

master_path = "data/final/master_race_dataset.csv"

master_df.to_csv(master_path, index=False)

print(f"\nMASTER DATASET SAVED:")
print(master_path)

print(f"\nTOTAL ROWS: {len(master_df)}")
print(f"TOTAL COLUMNS: {len(master_df.columns)}")