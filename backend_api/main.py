from sqlalchemy import create_engine
import pandas as pd

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates


# =========================================
# DATABASE CONNECTION
# =========================================

DATABASE_URL = "postgresql://postgres:G+6qu8tYXEfEH6F@db.pqbainxuhahcqvwjxznu.supabase.co:5432/postgres"

engine = create_engine(
    DATABASE_URL
)


# =========================================
# FASTAPI INITIALIZATION
# =========================================

app = FastAPI(
    title="Apex Velocity Engine"
)


# =========================================
# CORS POLICY
# =========================================

app.add_middleware(

    CORSMiddleware,

    allow_origins=["*"],

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"],
)


# =========================================
# STATIC + TEMPLATE CONFIG
# =========================================

app.mount(

    "/static",

    StaticFiles(
        directory="frontend/static"
    ),

    name="static"
)

templates = Jinja2Templates(
    directory="frontend/templates"
)


# =========================================
# HOME PAGE
# =========================================

@app.get("/")
def home(request: Request):

    return templates.TemplateResponse(

        request=request,

        name="index.html"
    )


# =========================================
# ANALYTICS ENDPOINT
# =========================================

@app.get("/api/analytics")

def analytics():

    query = """

    SELECT *
    FROM race_data
    ORDER BY collection_time ASC

    """

    df = pd.read_sql(
        query,
        engine
    )

    # CLEANING
    df = df[df["driver_name"].notna()]
    df = df[df["driver_name"] != ""]
    df = df[df["driver_name"] != "NormalQualified"]
    df = df[df["position"].notna()]

    # TYPE CONVERSION
    df["position"] = pd.to_numeric(
        df["position"],
        errors="coerce"
    )

    df["pit_stops"] = pd.to_numeric(
        df["pit_stops"],
        errors="coerce"
    )

    df["laps"] = pd.to_numeric(
        df["laps"],
        errors="coerce"
    )

    df = df.fillna("")

    return df.to_dict(
        orient="records"
    )


# =========================================
# WINNER PREDICTION ENDPOINT
# =========================================

@app.get("/api/winner-prediction")

def winner_prediction():

    query = """

    SELECT *
    FROM race_data
    ORDER BY collection_time ASC

    """

    df = pd.read_sql(
        query,
        engine
    )

    # CLEANING
    df = df[df["driver_name"].notna()]
    df = df[df["driver_name"] != ""]
    df = df[df["driver_name"] != "NormalQualified"]
    df = df[df["position"].notna()]

    # TYPE CONVERSION
    df["position"] = pd.to_numeric(
        df["position"],
        errors="coerce"
    )

    df["pit_stops"] = pd.to_numeric(
        df["pit_stops"],
        errors="coerce"
    )

    df["laps"] = pd.to_numeric(
        df["laps"],
        errors="coerce"
    )

    latest_time = df[
        "collection_time"
    ].max()

    latest_df = df[
        df["collection_time"]
        ==
        latest_time
    ].copy()

    # LAP TIME PARSER

    def lap_to_seconds(lap):

        try:

            minutes, seconds = str(
                lap
            ).split(":")

            return (
                float(minutes) * 60
                +
                float(seconds)
            )

        except:

            return 9999

    latest_df["lap_seconds"] = (

        latest_df["fastest_lap"]

        .apply(lap_to_seconds)
    )

    predictions = []

    for _, row in latest_df.iterrows():

        position_score = (
            100 - row["position"]
        ) * 0.45

        lap_score = (
            1000 / row["lap_seconds"]
        ) * 25

        lap_count_score = (
            row["laps"] * 0.3
        )

        pit_penalty = (
            row["pit_stops"] * 2
        )

        total_score = (

            position_score
            +
            lap_score
            +
            lap_count_score
            -
            pit_penalty
        )

        predictions.append({

            "driver":
            row["driver_name"],

            "car_number":
            row["car_number"],

            "vehicle":
            row["vehicle"],

            "score":
            max(0, total_score)
        })

    if not predictions:

        return []

    prediction_df = pd.DataFrame(
        predictions
    )

    total = prediction_df[
        "score"
    ].sum()

    if total > 0:

        prediction_df["probability"] = (

            prediction_df["score"]
            /
            total
        ) * 100

    else:

        prediction_df["probability"] = 0

    prediction_df = prediction_df.sort_values(

        "probability",

        ascending=False
    )

    prediction_df = prediction_df.head(5)

    prediction_df["probability"] = (

        prediction_df["probability"]
        .round(2)
    )

    prediction_df = prediction_df.fillna("")

    return prediction_df.to_dict(
        orient="records"
    )