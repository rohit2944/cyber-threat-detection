# AI-Based Detection of Cyber Threats in Unidirectional IP Traffic

> **A Full-Stack Cybersecurity Academic Project** using Machine Learning (Scikit-Learn), Python Flask REST API, React.js (Vite), and SQLite.

---

## 🛡️ Project Overview

Traditional Network Intrusion Detection Systems (NIDS) heavily rely on predefined static signatures, making them vulnerable to zero-day exploits, obfuscated attacks, and encrypted traffic patterns. Deep Packet Inspection (DPI) of bidirectional traffic also introduces high latency and privacy concerns.

This project presents an **AI-powered cybersecurity traffic analysis platform** that inspects **unidirectional IP network flow characteristics** (such as flow duration, packet rates, byte rates, packet size statistics, and TCP flags) to accurately classify traffic as **NORMAL** or **MALICIOUS/THREAT**.

### Key Features
- **Unidirectional Flow Classification**: Evaluates statistical flow properties without inspecting private packet payload contents.
- **Multi-Algorithm ML Benchmarking**: Evaluates and compares 4 machine learning models:
  1. **Random Forest Classifier** (Primary Model)
  2. **Decision Tree Classifier**
  3. **Logistic Regression**
  4. **Support Vector Machine (SVM)**
- **Automated Model Selection**: Auto-selects the optimal classifier prioritizing **F1-Score** (critical for imbalanced network traffic datasets).
- **Interactive Web Dashboard**: Built with React & Recharts featuring live traffic ratios, threat subclass breakdowns, recent prediction logs, and model accuracy gauges.
- **Real-Time Threat Prediction**: Web form supporting presets (Normal HTTP, DDoS SYN Flood, Port Scanning Sweep, SSH Brute Force) with confidence percentages and risk levels (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`).
- **Explainable AI (XAI)**: Visualizes feature importances to reveal key contributing network parameters behind predictions.
- **Dataset Preprocessing & Upload**: Upload custom CSV traffic datasets, clean duplicates, impute missing values, and trigger model retraining.
- **Audit History & CSV Export**: SQLite database tracking all prediction logs with pagination, filtering, search, and downloadable CSV export.

---

## 🛠️ Technology Stack

| Layer | Technologies Used |
| :--- | :--- |
| **Frontend** | React.js (Vite), Vanilla CSS3 (Dark Cybersecurity Design), Recharts, Lucide React, Axios |
| **Backend API** | Python 3, Flask, Flask-CORS, Joblib, Pytest |
| **Machine Learning** | Scikit-Learn, Pandas, NumPy, StandardScaler |
| **Database** | SQLite 3 (`database/cyber_threat.db`) |

---

## 📁 Application Structure

```
cyber-threat-detection/
│
├── backend/
│   ├── app.py                      # Flask REST API Web Server
│   ├── train_model.py              # ML Training & 4-Algorithm Benchmark Pipeline
│   ├── predict.py                  # Threat Inference & Risk Calculation Engine
│   ├── preprocess.py               # Feature Extraction & Scaling Pipeline
│   ├── database.py                 # SQLite Database Manager & CRUD Operations
│   ├── requirements.txt            # Backend Python Dependencies
│   ├── models/                     # Saved Model Artifacts (.pkl, .json)
│   ├── datasets/                   # Synthetic & Uploaded CSV Datasets
│   ├── utils/                      # Helper Scripts (Dataset Generators)
│   └── tests/                      # Pytest Unit Tests
│
├── frontend/
│   ├── package.json                # Frontend NPM Dependencies
│   ├── vite.config.js              # Vite Dev Server Configuration
│   ├── index.html                  # HTML5 Template
│   ├── .env                        # Frontend Environment (VITE_API_URL)
│   └── src/
│       ├── components/             # Sidebar, Header, StatCard
│       ├── pages/                  # Dashboard, Predict, Dataset, TrainModel, Performance, History, About
│       ├── services/               # Axios REST API Client (api.js)
│       ├── styles/                 # Dark Cybersecurity Theme (index.css)
│       ├── App.jsx                 # Routing Layout
│       └── main.jsx                # React Entry Point
│
├── database/
│   └── cyber_threat.db             # SQLite Database File
│
├── README.md                       # Complete Project Documentation
└── .gitignore                      # Git Exclusion Rules
```

---

## 🚀 Installation & Execution Guide (Windows)

### Step 1: Clone or Navigate to Project Directory
```powershell
cd cyber-threat-detection
```

---

### Step 2: Backend Setup & Server Execution

1. Open PowerShell and navigate to the `backend/` directory:
   ```powershell
   cd backend
   ```

2. Create a Python virtual environment:
   ```powershell
   python -m venv .venv
   ```

3. Activate the virtual environment:
   ```powershell
   .venv\Scripts\activate
   ```

4. Install backend dependencies:
   ```powershell
   pip install -r requirements.txt
   ```

5. Train the initial machine learning models (generates pre-trained artifacts on synthetic demonstration flow dataset):
   ```powershell
   python train_model.py
   ```

6. Start the Flask REST API backend server:
   ```powershell
   python app.py
   ```
   *The backend server will run on `http://localhost:5000`.*

---

### Step 3: Frontend Setup & Server Execution

1. Open a **new** PowerShell terminal and navigate to the `frontend/` directory:
   ```powershell
   cd cyber-threat-detection\frontend
   ```

2. Install Node.js frontend dependencies:
   ```powershell
   npm install
   ```

3. Confirm `.env` configuration points to backend:
   ```env
   VITE_API_URL=http://localhost:5000
   ```

4. Launch the Vite React development server:
   ```powershell
   npm run dev
   ```
   *Access the web dashboard in your browser at `http://localhost:5173`.*

---

## 🔌 Backend REST API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | System health check and active model status |
| `GET` | `/api/dashboard` | Aggregated dashboard statistics and recent prediction logs |
| `POST` | `/api/predict` | Predict threat level for a single unidirectional IP flow record |
| `POST` | `/api/upload-dataset` | Upload and validate custom CSV dataset |
| `POST` | `/api/train` | Trigger model retraining and 4-algorithm comparison |
| `GET` | `/api/model-performance` | Retrieve accuracy, confusion matrix, and feature importances |
| `GET` | `/api/dataset-info` | Fetch active dataset metadata and sample data snippet |
| `GET` | `/api/history` | Paginated search and filtered prediction history |
| `DELETE`| `/api/history/<id>` | Delete a single prediction entry by ID |
| `DELETE`| `/api/history` | Clear all prediction history records |
| `GET` | `/api/history/export` | Export prediction history as a CSV file download |

---

## 🤖 Machine Learning Pipeline & Features

### Extracted Unidirectional IP Flow Features
- `src_port`: Source Port Number
- `dst_port`: Destination Port Number
- `protocol`: Transport Protocol (TCP=6, UDP=17, ICMP=1)
- `flow_duration`: Total Flow Duration (ms)
- `total_pkts`: Total Packets in Flow
- `total_bytes`: Total Bytes in Flow
- `packet_rate`: Packets per second (`total_pkts / duration`)
- `byte_rate`: Bytes per second (`total_bytes / duration`)
- `fwd_pkts`: Forward Direction Packet Count
- `fwd_bytes`: Forward Direction Byte Count
- `avg_pkt_size`: Average Packet Size (bytes)
- `min_pkt_size`: Minimum Packet Size (bytes)
- `max_pkt_size`: Maximum Packet Size (bytes)
- `tcp_flags`: TCP Control Flags Bitmask
- `iat_mean`: Mean Inter-Arrival Time (ms)

### Algorithm Comparison Logic
When training is triggered, the pipeline splits data into **80% training / 20% testing** sets using `train_test_split(random_state=42)` with stratification:
1. **Random Forest Classifier**: Primary algorithm providing ensemble decision trees and feature importances.
2. **Decision Tree Classifier**: Interpretable rule-based decision trees.
3. **Logistic Regression**: Linear baseline scaled using `StandardScaler`.
4. **Support Vector Machine (SVM)**: Non-linear RBF kernel classification.

The best model artifact is auto-selected based on **F1 Score**:
$$\text{F1 Score} = 2 \times \frac{\text{Precision} \times \text{Recall}}{\text{Precision} + \text{Recall}}$$

---

## 🗄️ Database Schema (SQLite)

The SQLite database is located at `database/cyber_threat.db`.

### `prediction_history` Table
- `id` (INTEGER PRIMARY KEY)
- `timestamp` (TEXT)
- `source_ip` (TEXT)
- `dest_ip` (TEXT)
- `src_port` (INTEGER)
- `dst_port` (INTEGER)
- `protocol` (TEXT)
- `flow_duration` (REAL)
- `total_pkts` (INTEGER)
- `total_bytes` (INTEGER)
- `prediction` (TEXT)
- `predicted_class` (TEXT)
- `confidence` (REAL)
- `risk_level` (TEXT)
- `contributing_features` (TEXT JSON)

---

## 🧪 Testing Instructions

Run automated backend unit tests using `pytest` inside the backend virtual environment:

```powershell
cd backend
.venv\Scripts\activate
python -m pytest tests/
```

### Verified Test Modules:
- `tests/test_db.py`: Validates SQLite table initialization, CRUD, and parameterized query execution.
- `tests/test_preprocessing.py`: Validates protocol encoding, duplicate cleaning, and single flow payload formatting.
- `tests/test_model.py`: Tests ML model training, metrics calculation, and threat prediction inference.
- `tests/test_api.py`: Validates Flask REST API endpoints and error handlers.

---

## ⚠️ Defensive Use & Responsible AI Disclaimer

This application is designed **strictly for defensive network traffic analysis, security research, and educational purposes**. 
- Synthetic demonstration data is provided for testing and is clearly identified as demonstration data.
- The system does not contain functionality for exploiting hosts, stealing credentials, launching DDoS attacks, deploying malware, or performing unauthorized network scanning.
- Prediction outputs represent AI probabilistic predictions and should be correlated with comprehensive SIEM/SOC telemetry.
