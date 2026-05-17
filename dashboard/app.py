import sqlite3
import pandas as pd
import streamlit as st
import plotly.express as px
import plotly.graph_objects as go

from streamlit_autorefresh import st_autorefresh


# =========================================
# AUTO REFRESH
# =========================================

st_autorefresh(
    interval=30 * 1000,
    key="race_dashboard_refresh"
)


# =========================================
# PAGE CONFIG
# =========================================

st.set_page_config(
    page_title="24H Nürburgring Analytics",
    page_icon="🏎️",
    layout="wide"
)


# =========================================
# CUSTOM CSS
# =========================================

st.markdown("""
<style>

.main {
    background-color: #0E1117;
}

h1, h2, h3 {
    color: white;
}

[data-testid="metric-container"] {
    background-color: #1E1E1E;
    border: 1px solid #333333;
    padding: 15px;
    border-radius: 12px;
}

section[data-testid="stSidebar"] {
    background-color: #111111;
}

.stDataFrame {
    border-radius: 10px;
}

</style>
""", unsafe_allow_html=True)


# =========================================
# HEADER
# =========================================

st.title("🏎️ 24H Nürburgring Race Analytics Platform")

st.success(
    "🟢 LIVE RACE STATUS — Dashboard updates every 30 seconds"
)

st.caption("Powered by Selenium + SQLite + Streamlit")


# =========================================
# LOAD DATA FROM SQLITE
# =========================================

def load_data():

    connection = sqlite3.connect(
        "database/race_data.db"
    )

    query = """
    SELECT *
    FROM race_data
    """

    df = pd.read_sql_query(
        query,
        connection
    )

    connection.close()

    # =====================================
    # DATA TYPE CONVERSIONS
    # =====================================

    df["collection_time"] = pd.to_datetime(
        df["collection_time"]
    )

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

    return df


df = load_data()


# =========================================
# SIDEBAR
# =========================================

st.sidebar.title("🏁 Dashboard Controls")

selected_cars = st.sidebar.multiselect(
    "Select Cars",
    options=sorted(df["car_number"].unique()),
    default=sorted(df["car_number"].unique())[:5]
)

filtered_df = df[
    df["car_number"].isin(selected_cars)
]


# =========================================
# LATEST SNAPSHOT
# =========================================

latest_time = df["collection_time"].max()

latest_df = df[
    df["collection_time"] == latest_time
]

latest_df = latest_df.sort_values(
    "position"
)


# =========================================
# KPI METRICS
# =========================================

st.subheader("📊 Race Overview")

col1, col2, col3, col4, col5 = st.columns(5)

col1.metric(
    "Cars",
    latest_df["car_number"].nunique()
)

col2.metric(
    "Drivers",
    latest_df["driver_name"].nunique()
)

col3.metric(
    "Classes",
    latest_df["class"].nunique()
)

col4.metric(
    "Latest Update",
    latest_time.strftime("%H:%M:%S")
)

col5.metric(
    "Database Rows",
    len(df)
)


# =========================================
# TOP DRIVER CARDS
# =========================================

st.subheader("🏆 Current Top Drivers")

top_drivers = latest_df.head(3)

card1, card2, card3 = st.columns(3)

cards = [
    card1,
    card2,
    card3
]

for idx, (_, row) in enumerate(
    top_drivers.iterrows()
):

    with cards[idx]:

        st.markdown(f"""
        ### #{row['position']}

        **Driver:** {row['driver_name']}

        **Car:** {row['car_number']}

        **Vehicle:** {row['vehicle']}

        **Fastest Lap:** {row['fastest_lap']}
        """)


# =========================================
# TABS
# =========================================

tab1, tab2, tab3, tab4 = st.tabs([
    "📊 Analytics",
    "🏎️ Telemetry",
    "🏁 Leaderboard",
    "📄 Raw Data"
])


# =========================================
# ANALYTICS TAB
# =========================================

with tab1:

    # =====================================
    # POSITION EVOLUTION
    # =====================================

    st.subheader("📈 Position Evolution")

    fig_positions = px.line(
        filtered_df,
        x="collection_time",
        y="position",
        color="car_number",
        markers=True,
        title="Race Position Changes Over Time"
    )

    fig_positions.update_yaxes(
        autorange="reversed"
    )

    fig_positions.update_layout(
        template="plotly_dark",
        height=500
    )

    st.plotly_chart(
        fig_positions,
        use_container_width=True
    )


    # =====================================
    # OVERTAKE ANALYSIS
    # =====================================

    st.subheader("🚀 Overtake Analysis")

    position_changes = (
        filtered_df.groupby("car_number")["position"]
        .agg(["min", "max"])
        .reset_index()
    )

    position_changes["positions_gained"] = (
        position_changes["max"] -
        position_changes["min"]
    )

    fig_overtakes = px.bar(
        position_changes,
        x="car_number",
        y="positions_gained",
        color="positions_gained",
        title="Position Change Analysis"
    )

    fig_overtakes.update_layout(
        template="plotly_dark",
        height=450
    )

    st.plotly_chart(
        fig_overtakes,
        use_container_width=True
    )


    # =====================================
    # PACE CONSISTENCY ANALYSIS
    # =====================================

    st.subheader("🎯 Pace Consistency Analysis")

    pace_df = filtered_df.copy()

    def lap_to_seconds(lap):

        try:

            lap = str(lap)

            minutes, seconds = lap.split(":")

            return (
                float(minutes) * 60 +
                float(seconds)
            )

        except:
            return None

    pace_df["fastest_seconds"] = (
        pace_df["fastest_lap"]
        .apply(lap_to_seconds)
    )

    consistency = (
        pace_df.groupby("car_number")[
            "fastest_seconds"
        ]
        .std()
        .reset_index()
    )

    consistency.columns = [
        "Car",
        "Pace Variability"
    ]

    consistency = consistency.sort_values(
        by="Pace Variability"
    )

    fig_consistency = px.bar(
        consistency,
        x="Car",
        y="Pace Variability",
        color="Pace Variability",
        title="Driver Pace Consistency"
    )

    fig_consistency.update_layout(
        template="plotly_dark",
        height=500
    )

    st.plotly_chart(
        fig_consistency,
        use_container_width=True
    )


    # =====================================
    # FASTEST LAP LEADERBOARD
    # =====================================

    st.subheader("⚡ Fastest Lap Leaderboard")

    fastest_df = filtered_df.copy()

    fastest_df["lap_seconds"] = (
        fastest_df["fastest_lap"]
        .apply(lap_to_seconds)
    )

    fastest_laps = (
        fastest_df.groupby("driver_name")[
            "lap_seconds"
        ]
        .min()
        .reset_index()
        .sort_values("lap_seconds")
        .head(10)
    )

    fig_fastest = px.bar(
        fastest_laps,
        x="driver_name",
        y="lap_seconds",
        color="lap_seconds",
        title="Top Fastest Drivers"
    )

    fig_fastest.update_layout(
        template="plotly_dark",
        height=450
    )

    st.plotly_chart(
        fig_fastest,
        use_container_width=True
    )


    # =====================================
    # RACE LEADER TIMELINE
    # =====================================

    st.subheader("👑 Race Leader Timeline")

    leaders = df[df["position"] == 1]

    fig_leaders = px.scatter(
        leaders,
        x="collection_time",
        y="driver_name",
        color="car_number",
        title="Race Leaders Over Time"
    )

    fig_leaders.update_layout(
        template="plotly_dark",
        height=400
    )

    st.plotly_chart(
        fig_leaders,
        use_container_width=True
    )


    # =====================================
    # PIT STRATEGY ANALYSIS
    # =====================================

    st.subheader("⛽ Pit Strategy Timeline")

    fig_pit_timeline = px.scatter(
        filtered_df,
        x="collection_time",
        y="car_number",
        size="pit_stops",
        color="pit_stops",
        title="Pit Stop Strategy Over Time"
    )

    fig_pit_timeline.update_layout(
        template="plotly_dark",
        height=500
    )

    st.plotly_chart(
        fig_pit_timeline,
        use_container_width=True
    )


    # =====================================
    # RACE INTENSITY SCORE
    # =====================================

    st.subheader("🔥 Race Intensity Score")

    intensity_score = (
        filtered_df["position"].std()
    )

    st.metric(
        "Race Intensity",
        round(intensity_score, 2)
    )

    st.caption("""
    Higher score indicates
    greater position volatility
    and more competitive racing.
    """)


# =========================================
# TELEMETRY TAB
# =========================================

with tab2:

    st.subheader("🏎️ Telemetry Analysis")

    st.info("""
    Telemetry columns were removed during
    SQLite normalization for cleaner architecture.

    Future enhancement:
    Create separate telemetry table for sector analysis.
    """)

    telemetry_summary = pd.DataFrame({
        "Metric": [
            "Live Updates",
            "SQLite Backend",
            "Auto Refresh",
            "Historical Tracking"
        ],
        "Status": [
            "Enabled",
            "Connected",
            "30 Seconds",
            "Active"
        ]
    })

    st.dataframe(
        telemetry_summary,
        use_container_width=True
    )


# =========================================
# LEADERBOARD TAB
# =========================================

with tab3:

    st.subheader("🏁 Live Leaderboard")

    st.caption("""
    Live leaderboard updates every 30 seconds
    from the Nürburgring timing system.
    """)

    leaderboard_columns = [
        "position",
        "car_number",
        "driver_name",
        "class",
        "laps",
        "gap",
        "fastest_lap",
        "pit_stops",
        "vehicle"
    ]

    st.dataframe(
        latest_df[leaderboard_columns],
        use_container_width=True
    )


# =========================================
# RAW DATA TAB
# =========================================

with tab4:

    st.subheader("📄 Raw Race Dataset")

    st.dataframe(
        filtered_df,
        use_container_width=True
    )