import sqlite3
import os



# CREATE DATABASE DIRECTORY


os.makedirs("database", exist_ok=True)



# CONNECT TO SQLITE DATABASE


connection = sqlite3.connect(
    "database/race_data.db"
)

cursor = connection.cursor()



# CREATE RACE DATA TABLE


cursor.execute("""
CREATE TABLE IF NOT EXISTS race_data (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    position INTEGER,
    car_number TEXT,
    class TEXT,
    pro_class TEXT,
    rank TEXT,
    driver_name TEXT,
    laps INTEGER,
    gap TEXT,
    last_lap TEXT,
    fastest_lap TEXT,
    pit_stops INTEGER,
    vehicle TEXT,

    collection_time TEXT
)
""")


# COMMIT CHANGES


connection.commit()

connection.close()

print("Database and table created successfully.")