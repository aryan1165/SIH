// Function to fetch weather data from Open-Meteo API
async function fetchWeatherData() {
    // Set default coordinates if input is empty
    const defaultLat = '61.5240';
    const defaultLong = '105.3188';

    // Get latitude and longitude from input fields, use default if empty
    const latInput = document.getElementById("latitude");
    const longInput = document.getElementById("longitude");

    const lat = latInput.value || defaultLat;
    const long = longInput.value || defaultLong;

    // Clear the input fields after retrieving the values
    latInput.value = '';
    longInput.value = '';

    // Update the displayed coordinates
    let latDescription = document.getElementById("lati");
    let longiDescription = document.getElementById("longi");
    latDescription.innerText = lat;  // Update the latitude display
    longiDescription.innerText = long; // Update the longitude display

    // Log values to check if they are correct
    console.log("Latitude:", lat);
    console.log("Longitude:", long);

    // Construct API parameters
    const apiUrl = 'https://api.open-meteo.com/v1/forecast';
    const params = {
        latitude: lat,
        longitude: long,
        hourly: ['temperature_2m', 'wind_speed_10m', 'wind_speed_80m', 'wind_speed_120m', 'wind_speed_180m']
    };

    // Construct API URL
    const urlWithParams = `${apiUrl}?latitude=${params.latitude}&longitude=${params.longitude}&hourly=${params.hourly.join(',')}`;

    try {
        // Fetch weather data
        const response = await fetch(urlWithParams);
        const data = await response.json();

        // Process the hourly weather data
        const hourly = data.hourly;
        const times = hourly.time.map(t => new Date(t).toLocaleString());

        const temperature_2m = hourly.temperature_2m;
        const wind_speed_10m = hourly.wind_speed_10m;
        const wind_speed_80m = hourly.wind_speed_80m;
        const wind_speed_120m = hourly.wind_speed_120m;
        const wind_speed_180m = hourly.wind_speed_180m;

        // Call functions to plot wind speed and temperature data separately
        plotWindSpeedData(times, wind_speed_10m, wind_speed_80m, wind_speed_120m, wind_speed_180m);
        plotTemperatureData(times, temperature_2m);
    } catch (error) {
        console.error('Error fetching weather data:', error);
    }
}

// Function to plot the wind speed data using Plotly
function plotWindSpeedData(times, wind_speed_10m, wind_speed_80m, wind_speed_120m, wind_speed_180m) {
    const windSpeed10mTrace = {
        x: times,
        y: wind_speed_10m,
        mode: 'lines',
        name: 'Wind Speed 10m (m/s)',
        line: { color: 'blue' }
    };

    const windSpeed80mTrace = {
        x: times,
        y: wind_speed_80m,
        mode: 'lines',
        name: 'Wind Speed 80m (m/s)',
        line: { color: 'green' }
    };

    const windSpeed120mTrace = {
        x: times,
        y: wind_speed_120m,
        mode: 'lines',
        name: 'Wind Speed 120m (m/s)',
        line: { color: 'orange' }
    };

    const windSpeed180mTrace = {
        x: times,
        y: wind_speed_180m,
        mode: 'lines',
        name: 'Wind Speed 180m (m/s)',
        line: { color: 'purple' }
    };

    const layout = {
        title: 'Hourly Wind Speed Data',
        xaxis: { title: 'Time' },
        yaxis: { title: 'Wind Speed (m/s)' }
    };

    const data = [windSpeed10mTrace, windSpeed80mTrace, windSpeed120mTrace, windSpeed180mTrace];

    // Plot the wind speed data in the "windSpeedPlot" div
    Plotly.newPlot('windSpeedPlot', data, layout);
}

// Function to plot the temperature data using Plotly
function plotTemperatureData(times, temperature_2m) {
    const temperatureTrace = {
        x: times,
        y: temperature_2m,
        mode: 'lines',
        name: 'Temperature 2m (°C)',
        line: { color: 'red' }
    };

    const layout = {
        title: 'Hourly Temperature Data',
        xaxis: { title: 'Time' },
        yaxis: { title: 'Temperature (°C)' }
    };

    const data = [temperatureTrace];

    // Plot the temperature data in the "temperaturePlot" div
    Plotly.newPlot('temperaturePlot', data, layout);
}

// Event listener for the "Get Data" button
document.getElementById('getData').addEventListener('click', () => {
    fetchWeatherData();
});

// Fetch weather data immediately with default coordinates on page load
fetchWeatherData();
