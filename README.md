# Old Dashboard 🚀

A professional dashboard project for tracking production, inventory, and sales data. This project uses FastAPI for the backend and a modern web frontend to visualize data from Excel and Mock JSON sources.

## ✨ Features
- **Real-time Data Loading**: Loads data directly from Excel files.
- **Mock Data Fallback**: Automatically falls back to Mock JSON data if Excel is missing or empty.
- **REST API**: Clean endpoints for Products, Inventory, Sales, and Production Plans.
- **Static Dashboard**: A modern frontend served via FastAPI.
- **Dockerized**: Easy deployment using Docker or Docker Compose.

## 🛠️ Tech Stack
- **Backend**: Python 3.10+, FastAPI, Uvicorn
- **Data Processing**: Pandas, OpenPyXL
- **Frontend**: HTML5, Vanilla CSS, JavaScript
- **Infrastructure**: Docker

## 🚀 Getting Started

### Prerequisites
- Python 3.10 or higher
- (Optional) Docker

### 1. Manual Setup
1. **Clone the repository**:
   ```bash
   git clone https://github.com/abhaysrsdev/Old-Dashboard-.git
   cd Old-Dashboard-
   ```

2. **Create a virtual environment**:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Run the application**:
   ```bash
   uvicorn main:app --reload
   ```
   The dashboard will be available at `http://127.0.0.1:8000`.

### 2. Docker Setup
1. **Build the image**:
   ```bash
   docker build -t old-dashboard .
   ```

2. **Run the container**:
   ```bash
   docker run -p 8000:8000 old-dashboard
   ```

## 📁 Project Structure
- `main.py`: Entry point of the FastAPI application.
- `modules/`: Contains logic for data loading and alerts.
- `static/`: Frontend assets (HTML, CSS, JS).
- `mock/`: Default JSON data for testing.
- `requirements.txt`: Python dependencies.
- `Dockerfile`: Container configuration.

## 📝 License
This project is for demonstration and production monitoring purposes.
