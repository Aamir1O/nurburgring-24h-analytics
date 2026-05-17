import os
import time

from datetime import datetime
from io import StringIO

import pandas as pd

from selenium import webdriver
from selenium.webdriver.common.by import By

from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

from sqlalchemy import create_engine


# =========================================
# SUPABASE DATABASE URL
# =========================================

DATABASE_URL = "postgresql://postgres:G+6qu8tYXEfEH6F@db.pqbainxuhahcqvwjxznu.supabase.co:5432/postgres"


# =========================================
# CREATE DATABASE ENGINE
# =========================================

engine = create_engine(
    DATABASE_URL
)


# =========================================
# CREATE TABLE IF NOT EXISTS
# =========================================

create_table_query = """

CREATE TABLE IF NOT EXISTS race_data (

    id SERIAL PRIMARY KEY,

    position TEXT,
    car_number TEXT,
    class TEXT,
    pro_class TEXT,
    rank TEXT,
    driver_name TEXT,
    laps TEXT,
    gap TEXT,
    last_lap TEXT,
    fastest_lap TEXT,
    pit_stops TEXT,
    vehicle TEXT,
    collection_time TEXT

)

"""

with engine.begin() as conn:

    conn.exec_driver_sql(
        create_table_query
    )


# =========================================
# CREATE DIRECTORIES
# =========================================

os.makedirs("data/raw", exist_ok=True)
os.makedirs("data/processed", exist_ok=True)


# =========================================
# START SELENIUM DRIVER
# =========================================

print("Starting Chrome browser...")

driver = webdriver.Chrome()


# =========================================
# OPEN LIVE TIMING PAGE
# =========================================

url = "https://www.24h-rennen.de/en/live-en/"

driver.get(url)

print("Opening live timing page...")


# =========================================
# WAIT FOR IFRAME
# =========================================

print("Waiting for live timing iframe...")


WebDriverWait(driver, 30).until(

    EC.presence_of_element_located(
        (By.TAG_NAME, "iframe")
    )
)

iframes = driver.find_elements(
    By.TAG_NAME,
    "iframe"
)

print(f"Total iframes found: {len(iframes)}")


# =========================================
# SWITCH TO IFRAME
# =========================================

if len(iframes) > 0:

    driver.switch_to.frame(
        iframes[2]
    )

    print(
        "Connected to live timing iframe"
    )

else:

    raise Exception(
        "No iframe found."
    )


# =========================================
# LIVE COLLECTION LOOP
# =========================================

while True:

    try:

        print(
            "\nCollecting live race snapshot..."
        )

        # =================================
        # EXTRACT TABLE
        # =================================

        tables = driver.find_elements(
            By.TAG_NAME,
            "table"
        )

        if len(tables) == 0:

            print(
                "No tables found."
            )

            time.sleep(10)

            continue

        table_html = tables[0].get_attribute(
            "outerHTML"
        )

        # =================================
        # CONVERT TO DATAFRAME
        # =================================

        df = pd.read_html(
            StringIO(table_html)
        )[0]

        # =================================
        # CLEAN DATA
        # =================================

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

        race_df = df[
            core_columns
        ].copy()

        # =================================
        # ADD TIMESTAMP
        # =================================

        collection_time = str(
            datetime.now()
        )

        race_df[
            "collection_time"
        ] = collection_time

        # =================================
        # SAVE CSV BACKUP
        # =================================

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

        # =================================
        # RENAME COLUMNS
        # =================================

        race_df.columns = [

            "position",
            "car_number",
            "class",
            "pro_class",
            "rank",
            "driver_name",
            "laps",
            "gap",
            "last_lap",
            "fastest_lap",
            "pit_stops",
            "vehicle",
            "collection_time"
        ]

        # =================================
        # INSERT INTO SUPABASE
        # =================================

        race_df.to_sql(

            "race_data",

            engine,

            if_exists="append",

            index=False
        )

        # =================================
        # SUCCESS LOGS
        # =================================

        print(

            f"Inserted {len(race_df)} rows "
            f"into Supabase PostgreSQL."
        )

        print(

            f"Collection time: "
            f"{collection_time}"
        )

        # =================================
        # WAIT 30 SECONDS
        # =================================

        time.sleep(30)

    except Exception as e:

        print("\nERROR OCCURRED:")

        print(e)

        print(
            "\nRetrying in 10 seconds..."
        )

        time.sleep(10)