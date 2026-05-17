let globalData = [];
let userCheckedCars = new Set(["3", "34", "80", "67", "81"]);
let isRaceActive = true; // TRACKS IF TELEMETRY PIPELINE SHOULD RUN
let refreshIntervalId = null; // HOLDS THE BACKGROUND SYNC LOOP HOOK

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
        font: { family: '"Space Grotesk", sans-serif', size: 11, color: '#ffffff' }
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
            // RACE HAS ENDED STATE ACTIVATION
            isRaceActive = false;
            clearInterval(clockInterval);
            
            // Kill the background refresh loop to optimize server loads
            if (refreshIntervalId) {
                clearInterval(refreshIntervalId);
            }

            if (timerElement) {
                timerElement.textContent = "RACE CONCLUDED";
                timerElement.style.color = "#ff0055";
            }

            // Update the Top Right Badge Element dynamically
            if (statusContainer) {
                statusContainer.innerHTML = `<i class="fa-solid fa-flag-checkered"></i> RACE ENDED`;
                statusContainer.style.background = "rgba(255, 0, 85, 0.15)";
                statusContainer.style.borderColor = "#ff0055";
                statusContainer.style.color = "#ff0055";
                statusContainer.style.boxShadow = "0 0 10px rgba(255, 0, 85, 0.2)";
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
        const latestTime = Math.max(...data.map(row => new Date(row.collection_time).getTime()));
        const latestData = data.filter(row => new Date(row.collection_time).getTime() === latestTime);

        renderKPIStats(latestData, latestTime);
        renderTopDrivers(latestData);
        renderLeaderboard(latestData);
        buildDriverCheckboxes(data);
        loadAllCharts();
        
        await loadWinnerPredictions();
    } catch (err) {
        console.error("Data pipeline refresh execution fault:", err);
    }
}

async function loadWinnerPredictions() {
    try {
        const response = await fetch("http://127.0.0.1:8000/api/winner-prediction");
        const predictions = await response.json();
        
        const predictionContainer = document.getElementById("winner-predictions");
        if (!predictionContainer) return;
        
        predictionContainer.innerHTML = "";

        if (!predictions || predictions.length === 0) {
            predictionContainer.innerHTML = `<p style="color:#8a8a93; font-style:italic; padding:10px;">Awaiting telemetry data analytics...</p>`;
            return;
        }

        predictions.forEach((pred) => {
            predictionContainer.innerHTML += `
                <div class="prediction-card">
                    <div class="prediction-header">
                        <span class="prediction-driver">${pred.driver || "Unknown Driver"}</span>
                        <span class="prediction-car">#${pred.car_number}</span>
                    </div>
                    <div class="prediction-vehicle">${pred.vehicle || "Unknown Entry Spec"}</div>
                    <div class="progress-bar-bg">
                        <div class="progress-bar-fill" style="width: ${pred.probability}%"></div>
                    </div>
                    <div class="prediction-percentage">${pred.probability}% WIN PROB</div>
                </div>
            `;
        });
    } catch (err) {
        console.error("Error ingestion tracking from winner predictions endpoint:", err);
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
                    <p><strong>Driver:</strong> <span style="color:#fff; font-weight:bold;">${driver.driver_name}</span></p>
                    <p><strong>Car Number:</strong> <span style="color:var(--accent-neon); font-weight:bold;">#${driver.car_number}</span></p>
                    <p><strong>Machine Spec:</strong> ${driver.vehicle}</p>
                    <p><strong>Sector Best:</strong> <span style="color:#00ff88; font-weight:bold;">${driver.fastest_lap}</span></p>
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
                    <b style="color:var(--accent-neon); font-style:italic; font-size:1.2rem;">P${car.position}</b>
                    <div>
                        <h3 style="margin:0; font-weight:bold;">${car.driver_name}</h3>
                        <span style="font-size:0.8rem; color:var(--text-muted); text-transform:uppercase;">${car.vehicle}</span>
                    </div>
                    <p><strong>CAR:</strong> #${car.car_number}</p>
                    <p><strong>CLASS:</strong> <span style="background:rgba(255,255,255,0.05); padding:3px 8px; border-radius:2px; font-size:0.8rem;">${car.class}</span></p>
                    <p><strong>LAP COUNTER:</strong> ${car.laps}</p>
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
            uniqueDrivers.push({ car_number: row.car_number, driver_name: row.driver_name });
        }
    });
    const existingCount = checkboxContainer.querySelectorAll('input[type="checkbox"]').length;
    if (existingCount === uniqueDrivers.length) return;

    checkboxContainer.innerHTML = "";
    uniqueDrivers.sort((a, b) => parseInt(a.car_number) - parseInt(b.car_number)).forEach(driver => {
        const wrapper = document.createElement("label");
        wrapper.className = "checkbox-wrapper";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.value = driver.car_number;
        
        if (userCheckedCars.has(driver.car_number)) {
            checkbox.checked = true;
            wrapper.classList.add("is-checked");
        }

        checkbox.addEventListener("change", (e) => {
            if (e.target.checked) {
                userCheckedCars.add(e.target.value);
                wrapper.classList.add("is-checked");
            } else {
                userCheckedCars.delete(e.target.value);
                wrapper.classList.remove("is-checked");
            }
            loadAllCharts();
        });

        const textLabel = document.createElement("span");
        const shortName = driver.driver_name ? driver.driver_name.split(' ')[0] : "Unknown";
        textLabel.textContent = `#${driver.car_number} - ${shortName}`;

        wrapper.appendChild(checkbox);
        wrapper.appendChild(textLabel);
        checkboxContainer.appendChild(wrapper);
    });
}

function getFilteredData() {
    if (userCheckedCars.size === 0) {
        return globalData;
    }
    return globalData.filter(row => userCheckedCars.has(row.car_number));
}

function lapToSeconds(lap) {
    if (!lap) return null;
    try {
        const parts = lap.split(":");
        if (parts.length < 2) return parseFloat(parts[0]) || null;
        return (parseFloat(parts[0]) * 60 + parseFloat(parts[1]));
    } catch { 
        return null;
    }
}

function loadAllCharts() {
    const filteredData = getFilteredData();
    createPositionChart(filteredData);
    createFastestLapChart(filteredData);
    createOvertakeChart(filteredData);
    createWormChart(filteredData);
}

function createPositionChart(data) {
    const targetChart = document.getElementById("position-chart");
    if (!targetChart) return;

    const groupedCars = {};
    data.forEach(row => {
        if (!groupedCars[row.car_number]) {
            groupedCars[row.car_number] = {
                x: [], y: [], mode: "lines+markers",
                name: `Car #${row.car_number}`, line: { width: 3, shape: 'spline' }
            };
        }
        groupedCars[row.car_number].x.push(row.collection_time);
        groupedCars[row.car_number].y.push(row.position);
    });

    const layout = {
        ...commonPlotlyLayoutTheme,
        height: 480,
        xaxis: { 
            title: "Timeline Delta Stream", 
            type: 'date',
            gridcolor: 'rgba(255,255,255,0.04)',
            zeroline: false,
            tickfont: { family: '"Space Grotesk", sans-serif', color: '#8a8a93' }
        },
        yaxis: { 
            title: "Position Rank Index", 
            autorange: "reversed",
            gridcolor: 'rgba(255,255,255,0.04)',
            zeroline: false,
            tickfont: { family: '"Space Grotesk", sans-serif', color: '#8a8a93' }
        }
    };
    Plotly.newPlot("position-chart", Object.values(groupedCars), layout, { responsive: true });
}

function createWormChart(data) {
    const targetChart = document.getElementById("worm-chart");
    if (!targetChart) return;

    const timeSlices = {};
    data.forEach(row => {
        if (!timeSlices[row.collection_time]) {
            timeSlices[row.collection_time] = [];
        }
        const secs = lapToSeconds(row.fastest_lap);
        if (secs) {
            timeSlices[row.collection_time].push({
                car: row.car_number,
                seconds: secs
            });
        }
    });

    const baselines = {};
    Object.keys(timeSlices).forEach(time => {
        const slices = timeSlices[time];
        if (slices.length > 0) {
            const leaderTime = Math.min(...slices.map(s => s.seconds));
            baselines[time] = leaderTime;
        }
    });

    const wormData = {};
    data.forEach(row => {
        const currentSecs = lapToSeconds(row.fastest_lap);
        const leaderSecs = baselines[row.collection_time];
        
        if (currentSecs && leaderSecs !== undefined) {
            if (!wormData[row.car_number]) {
                wormData[row.car_number] = {
                    x: [], y: [], mode: "lines",
                    name: `${row.driver_name ? row.driver_name.split(' ')[0] : 'Car'} (#${row.car_number})`,
                    line: { width: 3, shape: 'spline' }
                };
            }
            const gap = currentSecs - leaderSecs;
            wormData[row.car_number].x.push(row.collection_time);
            wormData[row.car_number].y.push(gap);
        }
    });

    const layout = {
        ...commonPlotlyLayoutTheme,
        height: 480,
        xaxis: { 
            title: "Timeline Delta Stream", 
            type: 'date',
            gridcolor: 'rgba(255,255,255,0.04)',
            zeroline: false,
            tickfont: { family: '"Space Grotesk", sans-serif', color: '#8a8a93' }
        },
        yaxis: { 
            title: "Seconds Behind Session Leader",
            autorange: "reversed",
            gridcolor: 'rgba(255,255,255,0.04)',
            zeroline: false,
            tickfont: { family: '"Space Grotesk", sans-serif', color: '#8a8a93' }
        }
    };
    Plotly.newPlot("worm-chart", Object.values(wormData), layout, { responsive: true });
}

function createFastestLapChart(data) {
    const targetChart = document.getElementById("fastestlap-chart");
    if (!targetChart) return;

    const fastest = {};
    data.forEach(row => {
        const seconds = lapToSeconds(row.fastest_lap);
        if (!seconds) return;
        if (!fastest[row.driver_name] || seconds < fastest[row.driver_name]) {
            fastest[row.driver_name] = seconds;
        }
    });
    const sorted = Object.entries(fastest).sort((a, b) => a[1] - b[1]).slice(0, 10);
    const trace = [{
        x: sorted.map(x => x[0]),
        y: sorted.map(x => x[1]),
        mode: "lines+markers",
        type: "scatter",
        line: { color: '#00ff88', width: 3 },
        marker: { size: 8, color: '#ff0055' }
    }];

    const layout = { 
        ...commonPlotlyLayoutTheme, 
        height: 480,
        xaxis: { 
            title: "Top Driver Standings",
            gridcolor: 'rgba(255,255,255,0.04)',
            zeroline: false,
            tickfont: { family: '"Space Grotesk", sans-serif', color: '#8a8a93' }
        },
        yaxis: { 
            title: "Best Sector Index (Seconds)",
            gridcolor: 'rgba(255,255,255,0.04)',
            zeroline: false,
            tickfont: { family: '"Space Grotesk", sans-serif', color: '#8a8a93' }
        }
    };
    Plotly.newPlot("fastestlap-chart", trace, layout, { responsive: true });
}

function createOvertakeChart(data) {
    const targetChart = document.getElementById("overtake-chart");
    if (!targetChart) return;

    const grouped = {};
    data.forEach(row => {
        if (!grouped[row.car_number]) grouped[row.car_number] = [];
        grouped[row.car_number].push(row.position);
    });
    const cars = [];
    const gains = [];
    Object.keys(grouped).forEach(car => {
        if (grouped[car].length > 0) {
            cars.push(`Car #${car}`);
            gains.push(Math.max(...grouped[car]) - Math.min(...grouped[car]));
        }
    });
    const trace = [{ x: cars, y: gains, type: "bar", marker: { color: '#ff0055', opacity: 0.85 } }];

    const layout = { 
        ...commonPlotlyLayoutTheme, 
        height: 480,
        xaxis: { 
            title: "Active Machine Entries",
            gridcolor: 'rgba(255,255,255,0.04)',
            zeroline: false,
            tickfont: { family: '"Space Grotesk", sans-serif', color: '#8a8a93' }
        },
        yaxis: { 
            title: "Aggregate Position Shift Volume",
            gridcolor: 'rgba(255,255,255,0.04)',
            zeroline: false,
            tickfont: { family: '"Space Grotesk", sans-serif', color: '#8a8a93' }
        }
    };
    Plotly.newPlot("overtake-chart", trace, layout, { responsive: true });
}

function openTab(tabId, event) {
    document.querySelectorAll(".tab-content").forEach(tab => tab.classList.remove("active-content"));
    const selectedTab = document.getElementById(tabId);
    if (selectedTab) selectedTab.classList.add("active-content");
    
    document.querySelectorAll(".tab-button").forEach(btn => btn.classList.remove("active-tab"));
    if (event && event.currentTarget) event.currentTarget.classList.add("active-tab");
}

document.addEventListener("DOMContentLoaded", () => {
    // PASS THE RACE DURATION REMAINING IN HOURS (e.g., 2.5 hours remaining)
    startRaceClock(24); 
    
    loadDashboard();
    
    // Assign to a global reference so we can stop it if the clock expires while tab is open
    refreshIntervalId = setInterval(loadDashboard, 30000);
});