import os
import time
import sqlite3

from datetime import datetime
from io import StringIO

import pandas as pd

from selenium import webdriver
from selenium.webdriver.common.by import By


# =========================================
# CREATE DIRECTORIES
# =========================================

os.makedirs("data/raw", exist_ok=True)
os.makedirs("data/processed", exist_ok=True)


# =========================================
# SQLITE CONNECTION
# =========================================

connection = sqlite3.connect(
    "database/race_data.db",
    check_same_thread=False
)

cursor = connection.cursor()


# =========================================
# START SELENIUM DRIVER
# =========================================

print("Starting Chrome browser...")

driver = webdriver.Chrome()

url = "https://www.24h-rennen.de/en/live-en/"

driver.get(url)

print("Opening live timing page...")

time.sleep(10)


# =========================================
# SWITCH TO LIVE TIMING IFRAME
# =========================================

iframes = driver.find_elements(By.TAG_NAME, "iframe")

print(f"Total iframes found: {len(iframes)}")

driver.switch_to.frame(iframes[2])

print("Connected to live timing iframe")


# =========================================
# LIVE COLLECTION LOOP
# =========================================

while True:

    try:

        print("\nCollecting live race snapshot...")

        # ---------------------------------
        # EXTRACT TABLE
        # ---------------------------------

        tables = driver.find_elements(
            By.TAG_NAME,
            "table"
        )

        table_html = tables[0].get_attribute(
            "outerHTML"
        )

        # ---------------------------------
        # CONVERT TO DATAFRAME
        # ---------------------------------

        df = pd.read_html(
            StringIO(table_html)
        )[0]

        # ---------------------------------
        # CLEAN DATA
        # ---------------------------------

        if "Unnamed: 0" in df.columns:

            df = df.drop(
                columns=["Unnamed: 0"]
            )

        core_columns = [
            "Pos.",
            "No.",
            "Class",
            "Pro",
            "Rank",
            "Name",
            "Laps",
            "Gap",
            "Last",
            "Fastest",
            "Pit",
            "Vehicle"
        ]

        race_df = df[core_columns].copy()

        # ---------------------------------
        # ADD TIMESTAMP
        # ---------------------------------

        collection_time = str(
            datetime.now()
        )

        race_df["collection_time"] = (
            collection_time
        )

        # ---------------------------------
        # SAVE CSV BACKUP
        # ---------------------------------

        timestamp = datetime.now().strftime(
            "%Y%m%d_%H%M%S"
        )

        processed_path = (
            f"data/processed/"
            f"clean_race_data_{timestamp}.csv"
        )

        race_df.to_csv(
            processed_path,
            index=False
        )

        # ---------------------------------
        # INSERT INTO SQLITE
        # ---------------------------------

        for _, row in race_df.iterrows():

            cursor.execute("""
            INSERT INTO race_data (

                position,
                car_number,
                class,
                pro_class,
                rank,
                driver_name,
                laps,
                gap,
                last_lap,
                fastest_lap,
                pit_stops,
                vehicle,
                collection_time

            )

            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)

            """, (

                row["Pos."],
                row["No."],
                row["Class"],
                row["Pro"],
                row["Rank"],
                row["Name"],
                row["Laps"],
                row["Gap"],
                row["Last"],
                row["Fastest"],
                row["Pit"],
                row["Vehicle"],
                row["collection_time"]

            ))

        connection.commit()

        # ---------------------------------
        # PRINT SUCCESS
        # ---------------------------------

        print(
            f"Inserted {len(race_df)} rows "
            f"into SQLite database."
        )

        print(
            f"Collection time: "
            f"{collection_time}"
        )

        # ---------------------------------
        # WAIT 30 SECONDS
        # ---------------------------------

        time.sleep(30)

    except Exception as e:

        print("\nERROR OCCURRED:")
        print(e)

        print("\nRetrying in 10 seconds...")

        time.sleep(10)