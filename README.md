# Nürburgring 24H Analytics

## Real-Time Endurance Racing Analytics & Prediction Platform

A full-stack live motorsport analytics platform built around the ADAC RAVENOL 24H Nürburgring endurance race.

This project collects live race timing data using Selenium, processes and stores the data using Python and SQLite, exposes analytics APIs using FastAPI, and visualizes race insights through a modern HTML/CSS/JavaScript frontend.

The platform also includes a live winner prediction engine powered by real-time analytics.

---

# Development Workflow

This project was built step-by-step as a complete live analytics system.

The goal was not only to visualize race data, but also to simulate how modern real-time analytics platforms are designed in production environments.

Below is the full development workflow used to build the platform.

---

## Step 1 — Live Race Data Research

The project began by researching publicly available live timing systems for the Nürburgring 24H race.

The live timing page was analyzed to understand:

* HTML structure
* Timing tables
* Dynamic content loading
* Embedded telemetry components
* Iframe-based timing systems

Initial requests using Python Requests and BeautifulSoup were blocked by Cloudflare protection.

This led to the decision to use Selenium for browser automation.

---

## Step 2 — Selenium-Based Live Scraper

A Selenium scraping engine was built to:

* Open the live timing website
* Wait for dynamic content to load
* Extract live leaderboard tables
* Capture driver telemetry information
* Continuously refresh live race data

The scraper collects:

* Position
* Car number
* Driver name
* Vehicle
* Fastest lap
* Pit stops
* Gap timings
* Race class

The scraper runs continuously and acts as the real-time data ingestion layer.

---

## Step 3 — Data Extraction & Table Parsing

The live race tables were extracted using Selenium.

The HTML table content was converted into structured Pandas DataFrames.

This stage included:

* HTML parsing
* Table extraction
* Dynamic content handling
* DataFrame conversion
* Snapshot creation

Each live race snapshot was stored with timestamps.

---

## Step 4 — Data Cleaning & Preprocessing

Raw race data required significant preprocessing before analytics could be performed.

The preprocessing pipeline included:

* Invalid row filtering
* Removal of corrupted entries
* Missing value handling
* Numeric type conversion
* Timestamp normalization
* Duplicate removal
* Empty row filtering

Pandas was heavily used during this phase.

This step transformed noisy telemetry data into analytics-ready datasets.

---

## Step 5 — Historical Race Dataset Creation

Instead of analyzing only current race state, the system continuously stored historical snapshots.

This enabled:

* Time-series analytics
* Position tracking
* Historical comparisons
* Trend analysis
* Driver evolution monitoring

The historical snapshots were merged into a master dataset.

---

## Step 6 — SQLite Database Integration

A SQLite storage engine was integrated into the project.

The database layer stores:

* Live telemetry snapshots
* Historical race states
* Processed analytics data
* Driver information

SQLite was chosen because it is lightweight, fast, portable, and ideal for analytics prototyping.

This stage transformed the project from a simple scraper into a persistent analytics platform.

---

## Step 7 — Analytics Layer Development

A dedicated analytics layer was created using Pandas.

This stage included:

* Leaderboard analytics
* Position evolution analysis
* Pit strategy analysis
* Comparative driver analytics
* Vehicle performance analysis
* Fastest lap analysis
* Race overview KPIs

The analytics engine continuously processes live race information.

---

## Step 8 — FastAPI Backend Development

A FastAPI backend was built to expose race analytics data through APIs.

The backend serves:

* Analytics endpoints
* Prediction endpoints
* Frontend templates
* Live telemetry data

This separated the backend data processing system from the frontend visualization layer.

---

## Step 9 — Frontend Dashboard Development

A modern frontend dashboard was created using:

* HTML
* CSS
* JavaScript
* Plotly.js

The frontend visualizes:

* Live leaderboard
* Position evolution charts
* Pit strategy analytics
* Driver comparison views
* KPI overview cards
* Interactive telemetry graphs

The frontend continuously fetches live race data from the FastAPI backend.

---

## Step 10 — Interactive Data Visualization

Interactive visual analytics were implemented using Plotly.js.

Charts were designed for:

* Real-time updates
* Driver filtering
* Historical analysis
* Race telemetry exploration
* Strategy monitoring

This transformed the platform into a lightweight motorsport business intelligence dashboard.

---

## Step 11 — Winner Prediction Engine

A predictive analytics engine was added to estimate probable race winners.

The prediction engine analyzes:

* Current position
* Fastest lap pace
* Pit stop count
* Laps completed
* Overall race competitiveness

A weighted scoring system was used to calculate live winning probabilities.

This introduced predictive sports analytics concepts into the platform.

---

## Step 12 — Real-Time Analytics Pipeline

The final platform operates as a continuous real-time analytics system.

The complete pipeline works as follows:

```text
Live Race Timing
        ↓
Selenium Scraper
        ↓
Data Cleaning
        ↓
SQLite Database
        ↓
FastAPI Backend
        ↓
Frontend Dashboard
        ↓
Prediction Engine
```

The platform continuously updates and visualizes race telemetry in real time.

---

# Project Overview

This system was built to simulate how modern sports analytics platforms work in real-world environments.

The platform continuously:

* Collects live race timing data
* Processes and cleans race telemetry
* Stores structured data in SQLite
* Serves analytics APIs through FastAPI
* Displays live dashboards and charts
* Generates real-time race predictions

The architecture follows a real production-style analytics pipeline.

---

# System Architecture

```text
Live Nürburgring Timing Website
                ↓
        Selenium Web Scraper
                ↓
        Data Cleaning Pipeline
                ↓
           SQLite Database
                ↓
           FastAPI Backend
                ↓
      HTML / CSS / JavaScript
                ↓
      Interactive Analytics UI
```

---

# Features

## Live Data Collection

* Selenium-based race data scraping
* Automatic live timing updates
* Real-time leaderboard extraction
* Continuous data ingestion
* Automatic snapshot collection

---

## Data Processing

* Data cleaning using Pandas
* Missing value handling
* Type conversion and normalization
* Invalid row filtering
* Time-series processing

---

## Database Layer

* SQLite-based storage engine
* Historical race snapshots
* Persistent telemetry storage
* Structured race analytics database

---

## Backend API

Built using FastAPI.

### API Endpoints

| Endpoint                 | Description                                  |
| ------------------------ | -------------------------------------------- |
| `/api/analytics`         | Returns cleaned race analytics data          |
| `/api/winner-prediction` | Returns live winner prediction probabilities |

---

## Interactive Frontend Dashboard

The frontend was built using:

* HTML
* CSS
* JavaScript
* Plotly.js

### Dashboard Features

* Live leaderboard
* Race overview metrics
* Driver filtering system
* Position evolution visualization
* Pit strategy analysis
* Telemetry-style charts
* Top driver cards
* Live updating frontend

---

# Predictive Analytics Engine

The project includes a live winner prediction system.

The prediction engine analyzes:

* Current race position
* Fastest lap pace
* Pit stop count
* Lap count
* Overall race performance

The engine calculates:

* Winning probability percentages
* Top predicted winners
* Live prediction updates

This simulates a simplified motorsport analytics prediction engine.

---

# Technologies Used

## Backend

* Python
* FastAPI
* SQLite
* Pandas
* Selenium

---

## Frontend

* HTML5
* CSS3
* JavaScript
* Plotly.js

---

## Data Engineering

* Live web scraping
* ETL pipeline
* Data cleaning
* Structured storage
* Automated updates

---

# Analytics Used In The Project

This project heavily focuses on real-time data analytics and sports intelligence.

The platform continuously transforms raw live race timing information into structured analytical insights that can be visualized and interpreted in real time.

The analytics layer of the project was built using Python and Pandas and simulates many concepts used in modern motorsport telemetry systems and live sports analytics platforms.

---

## Data Collection Analytics Pipeline

The analytics workflow begins with live race data extraction.

The Selenium scraper continuously collects:

* Current race positions
* Driver names
* Vehicle information
* Lap counts
* Fastest laps
* Pit stop counts
* Gap timings
* Class information

This data is collected repeatedly over time to build a time-series race dataset.

The system essentially creates a live telemetry database from a public timing feed.

---

## Data Cleaning & Preprocessing

Raw live race timing data is often inconsistent and noisy.

Several preprocessing steps were implemented before analytics processing:

### Cleaning Operations

* Removal of invalid rows
* Filtering corrupted race entries
* Handling missing values
* String normalization
* Duplicate handling
* Null value processing
* Timestamp formatting

### Type Conversion

The project converts race telemetry into machine-readable formats:

* Position → Numeric
* Pit Stops → Numeric
* Lap Counts → Numeric
* Timing values → Structured values

This preprocessing pipeline enables reliable analytics calculations and visualizations.

---

## Descriptive Analytics

Descriptive analytics is used to summarize the current state of the race.

Examples include:

* Current race leader
* Top drivers
* Total active cars
* Driver counts
* Vehicle distribution
* Race class breakdown
* Current leaderboard standings

These metrics provide a high-level understanding of the ongoing race.

---

## Time-Series Analytics

The project continuously stores race snapshots over time.

This allows the system to perform time-series analysis on race evolution.

### Time-Series Features

* Position evolution tracking
* Overtake detection
* Race progression monitoring
* Historical race movement
* Driver progression trends

The position evolution chart is generated using historical race snapshots and visualizes how driver positions change over time.

This simulates real telemetry dashboards used in endurance racing.

---

## Comparative Analytics

The system compares driver and vehicle performance across multiple dimensions.

### Comparison Metrics

* Fastest laps
* Position changes
* Gap timings
* Pit stop counts
* Endurance consistency
* Relative race performance

These comparisons help identify:

* Strongest performing drivers
* Most efficient pit strategies
* Fastest cars
* Consistent race pace

---

## Pit Strategy Analytics

Endurance racing heavily depends on pit strategy.

The project analyzes pit stop patterns and compares pit frequency between teams.

### Insights Generated

* Teams with aggressive pit strategies
* Low-pit endurance runs
* Pit stop efficiency
* Strategy differences across classes

This introduces operational analytics concepts into the platform.

---

## Performance Analytics

The platform evaluates driver and vehicle performance using telemetry-style calculations.

### Performance Indicators

* Fastest lap pace
* Position stability
* Race consistency
* Competitive ranking
* Endurance efficiency

These metrics simulate real race engineering analysis systems.

---

## Predictive Analytics

One of the most advanced components of the project is the live winner prediction engine.

The prediction system uses weighted analytical scoring to estimate probable race winners.

### Prediction Inputs

The engine analyzes:

* Current position
* Fastest lap pace
* Pit stop count
* Laps completed
* Overall race competitiveness

### Prediction Logic

Each driver receives a weighted score based on race performance.

These scores are normalized into winning probabilities.

The frontend then visualizes:

* Top predicted winners
* Live probability updates
* Prediction rankings

This simulates simplified predictive sports analytics systems used in motorsport and live event analytics.

---

## Data Visualization Analytics

The platform transforms raw telemetry data into interactive visual insights.

Charts and dashboards were implemented using Plotly.js.

### Visual Analytics Components

* Position evolution graphs
* Pit strategy charts
* Leaderboards
* Driver performance cards
* Race overview KPIs
* Prediction probability bars

The frontend acts as a lightweight business intelligence dashboard for live race telemetry.

---

## Business Intelligence Concepts

The dashboard also incorporates BI-style analytics principles.

Examples include:

* KPI cards
* Interactive filtering
* Real-time updates
* Data-driven visualization
* Operational monitoring
* Performance dashboards

This makes the project similar in concept to platforms like:

* Tableau
* Power BI
* Grafana
* Sports telemetry dashboards

except implemented fully using Python and JavaScript.

---

## Real-World Analytics Concepts Demonstrated

This project demonstrates practical usage of:

| Analytics Area        | Usage In Project             |
| --------------------- | ---------------------------- |
| Descriptive Analytics | Leaderboards & race metrics  |
| Time-Series Analytics | Position evolution tracking  |
| Comparative Analytics | Driver and car comparisons   |
| Operational Analytics | Pit strategy analysis        |
| Predictive Analytics  | Winner prediction engine     |
| Data Visualization    | Interactive telemetry charts |
| Business Intelligence | Dashboard KPIs & monitoring  |
| Data Engineering      | Live ETL race pipeline       |

---

# Folder Structure



---

# How To Run The Project

## Step 1 — Start Live Scraper

```bash
python src/data_collection/live_collector.py
```

This continuously updates the database with live race data.

---

## Step 2 — Start FastAPI Backend

```bash
python -m uvicorn backend_api.main:app --reload
```

---

## Step 3 — Open Dashboard

Open:

```text
http://127.0.0.1:8000
```

---

# Future Improvements

Potential future upgrades:

* Machine learning race prediction models
* Driver pace forecasting
* Tire degradation analytics
* Multi-race historical analysis
* Docker deployment
* Cloud-hosted backend
* Real-time websocket updates
* Advanced telemetry simulations

---

# Resume Value

This project demonstrates:

* Data Analytics
* Data Engineering
* Backend Development
* Frontend Development
* API Development
* Database Management
* Predictive Analytics
* Real-Time Systems
* Interactive Visualization

---

# Author

Built as a real-time endurance racing analytics platform inspired by modern motorsport telemetry and sports analytics systems.
