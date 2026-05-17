import sqlite3
import pandas as pd
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

app = FastAPI(title="Apex Velocity Engine")


# CORS POLICY

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ROUTING & STATIC CONFIGURATIONS

app.mount("/static", StaticFiles(directory="frontend/static"), name="static")
templates = Jinja2Templates(directory="frontend/templates")

def get_connection():
    return sqlite3.connect("database/race_data.db")

@app.get("/")
def home(request: Request):
    # FIXED: Using the required modern FastAPI syntax to prevent unhashable dict exceptions
    return templates.TemplateResponse(request=request, name="index.html")


# ANALYTICS ENGINE DATA LOOP

@app.get("/api/analytics")
def analytics():
    connection = get_connection()
    query = "SELECT * FROM race_data ORDER BY collection_time ASC"
    df = pd.read_sql_query(query, connection)
    connection.close()

    # Data Scrubbing & Sanitization Pipeline
    df = df[df["driver_name"].notna()]
    df = df[df["driver_name"] != ""]
    df = df[df["driver_name"] != "NormalQualified"]
    df = df[df["position"].notna()]

    # Type Coercion Matrix
    df["position"] = pd.to_numeric(df["position"], errors="coerce")
    df["pit_stops"] = pd.to_numeric(df["pit_stops"], errors="coerce")
    df["laps"] = pd.to_numeric(df["laps"], errors="coerce")
    
    df = df.fillna("")
    return df.to_dict(orient="records")

# LIVE WINNER PREDICTION ENGINE

@app.get("/api/winner-prediction")
def winner_prediction():
    connection = get_connection()
    query = """
    SELECT *
    FROM race_data
    ORDER BY collection_time ASC
    """
    df = pd.read_sql_query(query, connection)
    connection.close()

    # Data Scrubbing & Sanitization Pipeline
    df = df[df["driver_name"].notna()]
    df = df[df["driver_name"] != ""]
    df = df[df["driver_name"] != "NormalQualified"]
    df = df[df["position"].notna()]

    # Type Coercion Matrix
    df["position"] = pd.to_numeric(df["position"], errors="coerce")
    df["pit_stops"] = pd.to_numeric(df["pit_stops"], errors="coerce")
    df["laps"] = pd.to_numeric(df["laps"], errors="coerce")

    # Isolate the most recent telemetry entry update
    latest_time = df["collection_time"].max()
    # FIXED: Added .copy() to decouple slice references and stop Pandas warnings
    latest_df = df[df["collection_time"] == latest_time].copy()

    # Lap Time Parsing Function
    def lap_to_seconds(lap):
        try:
            minutes, seconds = str(lap).split(":")
            return float(minutes) * 60 + float(seconds)
        except:
            return 9999

    latest_df["lap_seconds"] = latest_df["fastest_lap"].apply(lap_to_seconds)

    # Prediction Engine Calculation Array Loop
    predictions = []
    for _, row in latest_df.iterrows():
        # Better track position = higher weight score
        position_score = (100 - row["position"]) * 0.45

        # Speed scaling: lower lap times = better score multipliers
        lap_score = (1000 / row["lap_seconds"]) * 25

        # Endurance evaluation weight factor
        lap_count_score = row["laps"] * 0.3

        # Pit Stop Delay Offset Penalty
        pit_penalty = row["pit_stops"] * 2

        total_score = position_score + lap_score + lap_count_score - pit_penalty

        predictions.append({
            "driver": row["driver_name"],
            "car_number": row["car_number"],
            "vehicle": row["vehicle"],
            "score": max(0, total_score) # Clamps score values to prevent negative breakdowns
        })

    if not predictions:
        return []

    prediction_df = pd.DataFrame(predictions)
    total = prediction_df["score"].sum()

    # Convert relative scores into exact probability indices
    if total > 0:
        prediction_df["probability"] = (prediction_df["score"] / total) * 100
    else:
        prediction_df["probability"] = 0

    # Format data layout structures for the grid UI components
    prediction_df = prediction_df.sort_values("probability", ascending=False)
    prediction_df = prediction_df.head(5)
    prediction_df["probability"] = prediction_df["probability"].round(2)
    prediction_df = prediction_df.fillna("")

    return prediction_df.to_dict(orient="records")