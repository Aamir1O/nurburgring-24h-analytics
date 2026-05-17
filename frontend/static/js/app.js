
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

    let totalSeconds = Math.floor(durationInHours * 60 * 60);

    const timerElement = document.getElementById("countdown-timer");
    const statusContainer = document.getElementById("live-status-container");

    function updateClock() {

        let hours = Math.floor(totalSeconds / 3600);
        let minutes = Math.floor((totalSeconds % 3600) / 60);
        let seconds = totalSeconds % 60;

        hours = hours < 10 ? "0" + hours : hours;
        minutes = minutes < 10 ? "0" + minutes : minutes;
        seconds = seconds < 10 ? "0" + seconds : seconds;

        if (timerElement) {
            timerElement.textContent = `${hours}:${minutes}:${seconds}`;
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
                timerElement.textContent = "RACE CONCLUDED";
                timerElement.style.color = "#ff0055";
            }

            if (statusContainer) {
                statusContainer.innerHTML = `
                    <i class="fa-solid fa-flag-checkered"></i>
                    RACE ENDED
                `;
            }
        }
    }

    const clockInterval = setInterval(updateClock, 1000);
    updateClock();
}

async function loadDashboard() {

    try {

        const response = await fetch("/api/analytics");
        const data = await response.json();

        globalData = data;

        if (!data || data.length === 0) return;

        const latestTime = Math.max(
            ...data.map(row => new Date(row.collection_time).getTime())
        );

        const latestData = data.filter(
            row => new Date(row.collection_time).getTime() === latestTime
        );

        renderKPIStats(latestData, latestTime);
        renderTopDrivers(latestData);
        renderLeaderboard(latestData);
        buildDriverCheckboxes(data);

        loadAllCharts();

        await loadWinnerPredictions();

    } catch (err) {
        console.error("Dashboard loading fault:", err);
    }
}

async function loadWinnerPredictions() {

    try {

        const response = await fetch("/api/winner-prediction");
        const predictions = await response.json();

        const predictionContainer = document.getElementById("winner-predictions");

        if (!predictionContainer) return;

        predictionContainer.innerHTML = "";

        if (!predictions || predictions.length === 0) {

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
                            style="width:${pred.probability}%"
                        ></div>

                    </div>

                    <div class="prediction-percentage">
                        ${pred.probability}% WIN PROB
                    </div>

                </div>
            `;
        });

    } catch (err) {
        console.error("Prediction rendering failure:", err);
    }
}

function renderKPIStats(latestData, latestTime) {

    const statsEl = document.getElementById("stats");
    if (!statsEl) return;

    statsEl.innerHTML = `

        <div class="stat-card">
            <p><i class="fa-solid fa-car"></i> Grid Capacity</p>
            <h2>${new Set(latestData.map(row => row.car_number)).size} Entries</h2>
        </div>

        <div class="stat-card">
            <p><i class="fa-solid fa-user-ninja"></i> Active Racers</p>
            <h2>${new Set(latestData.map(row => row.driver_name)).size} Drivers</h2>
        </div>

        <div class="stat-card">
            <p><i class="fa-solid fa-layer-group"></i> Active Divisions</p>
            <h2>${new Set(latestData.map(row => row.class)).size} Classes</h2>
        </div>

        <div class="stat-card">
            <p><i class="fa-solid fa-clock"></i> Node Array Sync</p>
            <h2>${new Date(latestTime).toLocaleTimeString()}</h2>
        </div>
    `;
}

function renderTopDrivers(latestData) {

    const topDrivers = document.getElementById("top-drivers");
    if (!topDrivers) return;

    topDrivers.innerHTML = "";

    latestData
        .sort((a, b) => a.position - b.position)
        .slice(0, 3)
        .forEach((driver, idx) => {

            topDrivers.innerHTML += `

                <div class="driver-card">

                    <h2>P${idx + 1}</h2>

                    <p>
                        <strong>Driver:</strong>
                        <span style="color:#fff;font-weight:bold;">
                            ${driver.driver_name}
                        </span>
                    </p>

                    <p>
                        <strong>Car Number:</strong>
                        <span style="color:var(--accent-neon);font-weight:bold;">
                            #${driver.car_number}
                        </span>
                    </p>

                    <p>
                        <strong>Machine Spec:</strong>
                        ${driver.vehicle}
                    </p>

                    <p>
                        <strong>Sector Best:</strong>
                        <span style="color:#00ff88;font-weight:bold;">
                            ${driver.fastest_lap}
                        </span>
                    </p>

                </div>
            `;
        });
}

function renderLeaderboard(latestData) {

    const leaderboard = document.getElementById("leaderboard");
    if (!leaderboard) return;

    leaderboard.innerHTML = "";

    latestData
        .sort((a, b) => a.position - b.position)
        .slice(0, 15)
        .forEach(car => {

            leaderboard.innerHTML += `

                <div class="leaderboard-card">

                    <b style="
                        color:var(--accent-neon);
                        font-style:italic;
                        font-size:1.2rem;
                    ">
                        P${car.position}
                    </b>

                    <div>
                        <h3 style="margin:0;font-weight:bold;">
                            ${car.driver_name}
                        </h3>

                        <span style="
                            font-size:0.8rem;
                            color:var(--text-muted);
                            text-transform:uppercase;
                        ">
                            ${car.vehicle}
                        </span>
                    </div>

                    <p><strong>CAR:</strong> #${car.car_number}</p>
                    <p><strong>CLASS:</strong> ${car.class}</p>
                    <p><strong>LAPS:</strong> ${car.laps}</p>

                </div>
            `;
        });
}

function buildDriverCheckboxes(data) {

    const checkboxContainer = document.getElementById("driver-checkbox-list");
    if (!checkboxContainer) return;

    const uniqueDrivers = [];

    data.forEach(row => {

        if (!uniqueDrivers.find(d => d.car_number === row.car_number)) {

            uniqueDrivers.push({
                car_number: row.car_number,
                driver_name: row.driver_name
            });
        }
    });

    checkboxContainer.innerHTML = "";

    uniqueDrivers
        .sort((a, b) => parseInt(a.car_number) - parseInt(b.car_number))
        .forEach(driver => {

            const wrapper = document.createElement("label");
            wrapper.className = "checkbox-wrapper";

            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.value = driver.car_number;

            if (userCheckedCars.has(driver.car_number)) {
                checkbox.checked = true;
            }

            checkbox.addEventListener("change", (e) => {

                if (e.target.checked) {
                    userCheckedCars.add(e.target.value);
                } else {
                    userCheckedCars.delete(e.target.value);
                }

                loadAllCharts();
            });

            const textLabel = document.createElement("span");
            textLabel.textContent = `#${driver.car_number} - ${driver.driver_name}`;

            wrapper.appendChild(checkbox);
            wrapper.appendChild(textLabel);

            checkboxContainer.appendChild(wrapper);
        });
}

function getFilteredData() {

    if (userCheckedCars.size === 0) {
        return globalData;
    }

    return globalData.filter(
        row => userCheckedCars.has(row.car_number)
    );
}

function lapToSeconds(lap) {

    if (!lap) return null;

    try {

        lap = String(lap).trim();

        // INVALID VALUES
        if (
            lap === "---" ||
            lap === "" ||
            lap.toUpperCase() === "OUT"
        ) {
            return null;
        }

        // VALID FORMAT
        if (lap.includes(":")) {

            const parts = lap.split(":");

            const minutes = parseFloat(parts[0]);
            const seconds = parseFloat(parts[1]);

            if (
                isNaN(minutes) ||
                isNaN(seconds)
            ) {
                return null;
            }

            return (
                minutes * 60
                +
                seconds
            );
        }

        // FALLBACK
        const numeric = parseFloat(lap);

        return isNaN(numeric)
            ? null
            : numeric;

    } catch {

        return null;
    }
}

function loadAllCharts() {

    const filteredData = getFilteredData();

    createPositionChart(filteredData);
    createFastestLapChart(filteredData);
    createOvertakeChart(filteredData);
}

function createPositionChart(data) {

    const groupedCars = {};

    data.forEach(row => {

        if (!groupedCars[row.car_number]) {

            groupedCars[row.car_number] = {
                x: [],
                y: [],
                mode: "lines+markers",
                name: `Car #${row.car_number}`,
                line: { width: 3, shape: 'spline' }
            };
        }

        groupedCars[row.car_number].x.push(row.collection_time);
        groupedCars[row.car_number].y.push(row.position);
    });

    const layout = {
        ...commonPlotlyLayoutTheme,
        height: 480,
        yaxis: {
            autorange: "reversed"
        }
    };

    Plotly.newPlot(
        "position-chart",
        Object.values(groupedCars),
        layout,
        { responsive: true }
    );
}

function createFastestLapChart(data) {

    const fastest = {};

    data.forEach(row => {

        const seconds = lapToSeconds(row.fastest_lap);

        if (!seconds) return;

        if (!fastest[row.driver_name] || seconds < fastest[row.driver_name]) {
            fastest[row.driver_name] = seconds;
        }
    });

    const sorted = Object.entries(fastest)
        .sort((a, b) => a[1] - b[1])
        .slice(0, 10);

    const trace = [{
        x: sorted.map(x => x[0]),
        y: sorted.map(x => x[1]),
        type: "bar"
    }];

    Plotly.newPlot(
        "fastestlap-chart",
        trace,
        {
            ...commonPlotlyLayoutTheme,
            height: 480
        },
        { responsive: true }
    );
}

function createOvertakeChart(data) {

    const grouped = {};

    data.forEach(row => {

        if (!grouped[row.car_number]) {
            grouped[row.car_number] = [];
        }

        grouped[row.car_number].push(row.position);
    });

    const cars = [];
    const gains = [];

    Object.keys(grouped).forEach(car => {

        cars.push(`Car #${car}`);

        gains.push(
            Math.max(...grouped[car])
            -
            Math.min(...grouped[car])
        );
    });

    const trace = [{
        x: cars,
        y: gains,
        type: "bar"
    }];

    Plotly.newPlot(
        "overtake-chart",
        trace,
        {
            ...commonPlotlyLayoutTheme,
            height: 480
        },
        { responsive: true }
    );
}

function openTab(tabId, event) {

    document.querySelectorAll(".tab-content")
        .forEach(tab =>
            tab.classList.remove("active-content")
        );

    const selectedTab = document.getElementById(tabId);

    if (selectedTab) {
        selectedTab.classList.add("active-content");
    }

    document.querySelectorAll(".tab-button")
        .forEach(btn =>
            btn.classList.remove("active-tab")
        );

    if (event && event.currentTarget) {
        event.currentTarget.classList.add("active-tab");
    }
}

document.addEventListener("DOMContentLoaded", () => {

    const timerElement =
        document.getElementById(
            "countdown-timer"
        );

    const statusContainer =
        document.getElementById(
            "live-status-container"
        );

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
            "rgba(255,0,85,0.15)";
    }

    loadDashboard();

    refreshIntervalId = setInterval(
        loadDashboard,
        30000
    );
});