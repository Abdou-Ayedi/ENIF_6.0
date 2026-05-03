# Smart Waste Management Dashboard (Coojewi TEAM)

A real-time IoT dashboard for smart waste bins, featuring fill levels, anomaly detection, machine learning predictions, and dispatch routing.

## Project Structure

This project is divided into several main components:
- `Frontend/`: A React/TypeScript web application using Vite, TailwindCSS, and shadcn/ui.
- `iwatch/`: Python simulator and machine learning pipeline for generating smart bin telemetry (fill level, gas, temperature, humidity, weight, location) and predicting anomalies.
- `mosquitto/`: Docker volume for Mosquitto MQTT broker configuration.
- Machine Learning Models: `iso_model.pkl`, `iso_forest_model.pkl`, and `xgb_model.pkl` used by the Python pipeline to enrich data.

## System Architecture

1. **Simulator (`main/merged.py`)**: Generates realistic smart bin data.
2. **Machine Learning Pipeline**: Analyzes telemetry data, flags anomalies, and calculates dispatch routes.
3. **Eclipse Ditto (Digital Twin)**: Manages the digital twin of our bins, updating states dynamically.
4. **Mosquitto (MQTT Broker)**: Facilitates the communication between the Python pipeline, Eclipse Ditto, and the Frontend dashboard.
5. **Frontend Dashboard**: Connects to the data stream to visualize real-time states of the bins on a map, showing charts, metrics, and alerts.

## Requirements

1. **Docker & Docker Compose**: For running Mosquitto and Eclipse Ditto.
2. **Python 3.8+**: For the ML pipeline and simulator.
3. **Node.js & npm**: For running the Frontend dashboard.

## Setup & Execution

### 1. Start Eclipse Ditto and Mosquitto

You will need a running instance of Eclipse Ditto and Mosquitto.

**Ditto**:
Clone Ditto and start it using Docker Compose:
```bash
git clone https://github.com/eclipse-ditto/ditto.git
cd ditto
git checkout tags/3.0.0
cd deployment/docker
docker compose up -d
```

**Mosquitto**:
Run Mosquitto via Docker in the project root:
```bash
docker run -it --name mosquitto --network docker_default -p 1883:1883 -v "%cd%\mosquitto:/mosquitto/" eclipse-mosquitto
```



### 3. Run the Data Pipeline

Navigate to the project root and install the Python dependencies:
```bash
pip install -r requirements.txt # if available
# or install manually: pip install paho-mqtt requests pandas scikit-learn
```

Run the pipeline:
```bash
cd iwatch
python merged.py
```
This script will start simulating bin data, processing it through the ML models, and sending updates via MQTT to Ditto.

### 4. Run the Frontend Dashboard

Navigate to the `Frontend` directory, install dependencies, and start the development server:

```bash
cd Frontend
npm install
npm run dev
```

The dashboard will be available at `http://localhost:5173` (or the port specified by Vite in your terminal). It will automatically connect to your data streams to display live updates.

---
**Contributors**: Coojewi TEAM / Abdou-Ayedi
