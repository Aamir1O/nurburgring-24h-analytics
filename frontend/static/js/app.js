let globalData = [];
let userCheckedCars = new Set(["3", "34", "80", "67", "81"]);
let isRaceActive = true;
let refreshIntervalId = null;

const commonPlotlyLayoutTheme = {
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    font: { 
        family: '"Space Grotesk", "Montserrat", "Arial", sans-serif', 
        color: '#ffffff',
        size: 11
    },
    margin: { l: 60, r: 40, t: 30, b: 50 },
    legend: {
        font: { 
            family: '"Space Grotesk", sans-serif', 
            size: 11, 
            color: '#ffffff' 
        }
    }
};

function startRaceClock(durationInHours) {

    let totalSeconds = Math.floor(
        durationInHours * 60 * 60
    );

    const timerElement = document.getElementById(
        "countdown-timer"
    );

    const statusContainer = document.getElementById(
        "live-status-container"
    );

    function updateClock() {

        let hours = Math.floor(
            totalSeconds / 3600
        );

        let minutes = Math.floor(
            (totalSeconds % 3600) / 60
        );

        let seconds = totalSeconds % 60;

        hours = hours < 10 ? "0" + hours : hours;
        minutes = minutes < 10 ? "0" + minutes : minutes;
        seconds = seconds < 10 ? "0" + seconds : seconds;

        if (timerElement) {

            timerElement.textContent = `
                ${hours}:${minutes}:${seconds}
            `;
        }

        if (totalSeconds > 0) {

            totalSeconds--;

        } else {

            isRaceActive = false;

            clearInterval(clockInterval);

            if (refreshIntervalId) {
                clearInterval(refreshIntervalId);
            }

            if (timerElement) {

                timerElement.textContent =
                    "RACE CONCLUDED";

                timerElement.style.color =
                    "#ff0055";
            }

            if (statusContainer) {

                statusContainer.innerHTML = `
                    <i class="fa-solid fa-flag-checkered"></i>
                    RACE ENDED
                `;

                statusContainer.style.background =
                    "rgba(255, 0, 85, 0.15)";

                statusContainer.style.borderColor =
                    "#ff0055";

                statusContainer.style.color =
                    "#ff0055";
            }
        }
    }

    const clockInterval = setInterval(
        updateClock,
        1000
    );

    updateClock();
}


async function loadDashboard() {

    try {

        const response = await fetch(
            "/api/analytics"
        );

        const data = await response.json();

        globalData = data;

        if (!data || data.length === 0) return;

        const latestTime = Math.max(

            ...data.map(
                row =>
                new Date(
                    row.collection_time
                ).getTime()
            )
        );

        const latestData = data.filter(

            row =>

            new Date(
                row.collection_time
            ).getTime()

            ===

            latestTime
        );

        renderKPIStats(
            latestData,
            latestTime
        );

        renderTopDrivers(
            latestData
        );

        renderLeaderboard(
            latestData
        );

        buildDriverCheckboxes(
            data
        );

        loadAllCharts();

        await loadWinnerPredictions();

    } catch (err) {

        console.error(
            "Dashboard loading fault:",
            err
        );
    }
}


async function loadWinnerPredictions() {

    try {

        // FIXED FOR RENDER
        const response = await fetch(
            "/api/winner-prediction"
        );

        const predictions = await response.json();

        const predictionContainer =
            document.getElementById(
                "winner-predictions"
            );

        if (!predictionContainer) return;

        predictionContainer.innerHTML = "";

        if (
            !predictions ||
            predictions.length === 0
        ) {

            predictionContainer.innerHTML = `

                <p style="
                    color:#8a8a93;
                    font-style:italic;
                    padding:10px;
                ">
                    Awaiting telemetry data analytics...
                </p>

            `;

            return;
        }

        predictions.forEach((pred) => {

            predictionContainer.innerHTML += `

                <div class="prediction-card">

                    <div class="prediction-header">

                        <span class="prediction-driver">

                            ${pred.driver || "Unknown Driver"}

                        </span>

                        <span class="prediction-car">

                            #${pred.car_number}

                        </span>

                    </div>

                    <div class="prediction-vehicle">

                        ${pred.vehicle || "Unknown Entry Spec"}

                    </div>

                    <div class="progress-bar-bg">

                        <div 
                            class="progress-bar-fill" 
                            style="
                                width:${pred.probability}%
                            "
                        ></div>

                    </div>

                    <div class="prediction-percentage">

                        ${pred.probability}% WIN PROB

                    </div>

                </div>

            `;
        });

    } catch (err) {

        console.error(
            "Prediction rendering failure:",
            err
        );
    }
}


function renderKPIStats(latestData, latestTime) {

    const statsEl =
        document.getElementById("stats");

    if (!statsEl) return;

    statsEl.innerHTML = `

        <div class="stat-card">
            <p>
                <i class="fa-solid fa-car"></i>
                Grid Capacity
            </p>
            <h2>
                ${new Set(
                    latestData.map(
                        row => row.car_number
                    )
                ).size}
                Entries
            </h2>
        </div>

        <div class="stat-card">
            <p>
                <i class="fa-solid fa-user-ninja"></i>
                Active Racers
            </p>
            <h2>
                ${new Set(
                    latestData.map(
                        row => row.driver_name
                    )
                ).size}
                Drivers
            </h2>
        </div>

        <div class="stat-card">
            <p>
                <i class="fa-solid fa-layer-group"></i>
                Active Divisions
            </p>
            <h2>
                ${new Set(
                    latestData.map(
                        row => row.class
                    )
                ).size}
                Classes
            </h2>
        </div>

        <div class="stat-card">
            <p>
                <i class="fa-solid fa-clock"></i>
                Node Array Sync
            </p>
            <h2>
                ${new Date(
                    latestTime
                ).toLocaleTimeString()}
            </h2>
        </div>

    `;
}


function renderTopDrivers(latestData) {

    const topDrivers =
        document.getElementById(
            "top-drivers"
        );

    if (!topDrivers) return;

    topDrivers.innerHTML = "";

    latestData

        .sort(
            (a, b) =>
            a.position - b.position
        )

        .slice(0, 3)

        .forEach((driver, idx) => {

            topDrivers.innerHTML += `

                <div class="driver-card">

                    <h2>
                        P${idx + 1}
                    </h2>

                    <p>
                        <strong>Driver:</strong>
                        <span style="
                            color:#fff;
                            font-weight:bold;
                        ">
                            ${driver.driver_name}
                        </span>
                    </p>

                    <p>
                        <strong>Car Number:</strong>
                        <span style="
                            color:var(--accent-neon);
                            font-weight:bold;
                        ">
                            #${driver.car_number}
                        </span>
                    </p>

                    <p>
                        <strong>Machine Spec:</strong>
                        ${driver.vehicle}
                    </p>

                    <p>
                        <strong>Sector Best:</strong>
                        <span style="
                            color:#00ff88;
                            font-weight:bold;
                        ">
                            ${driver.fastest_lap}
                        </span>
                    </p>

                </div>

            `;
        });
}