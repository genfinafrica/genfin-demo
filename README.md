# genfin-demo

This is a generated README.md file for the GENFIN-AFRICA Demo System, combining the business requirements specification (BRS) with the technical details from the App.js (React) and app.py (Flask) files.
GENFIN-AFRICA: Stage-Based Financing Demo System
This application demonstrates a cutting-edge model for climate-smart financing, linking smallholder farmer productivity, data-driven scoring, and financial access through the simulation of AI and decentralized ledger technology (blockchain).
The core concept is to provide stage-based financing unlocked only when verified farming milestones are met, moving away from traditional collateral-based lending.
✨ Core Features & Value Proposition (In-Scope Demo)
The demo system simulates an end-to-end crop financing cycle and highlights key innovations:
 * AI Farmer Proficiency Score (FPS) & XAI: An AI-driven score that predicts the farmer's likelihood of successful yield. Users can view the Explainable AI (XAI) factors contributing to the score and risk band.
 * Smart-Contract Simulation: The financing lifecycle is managed by a simulated smart contract, providing an immutable audit trail of state transitions (e.g., DRAFT → ACTIVE → STAGE_N_COMPLETED).
 * Progressive, Stage-Based Disbursement: Funds are released incrementally across a 7-stage workflow, ensuring they are used productively and only after the preceding milestone is verified.
 * Data Governance & Role Restriction: The Insurer dashboard demonstrates restricted views of XAI factors and contract logs to adhere to simulated data privacy policies (POPIA compliance).
 * Federated Learning Mock: The architecture includes a simulation of federated learning where clients (farmers) contribute to a model update without transferring raw, sensitive data.
 * Mock Integrations: Simulates triggers from external data sources like IoT sensor logs (e.g., soil moisture, pest detection) and file uploads (e.g., soil test reports).
🗺️ Demo Workflow & User Roles
The application is driven by different user roles, each with a specific dashboard, to simulate the end-to-end process:
| Role | Interface | Primary Function |
|---|---|---|
| Farmer | Chatbot Mock |
Registration, checking STATUS, uploading files, and inputting mock IoT sensor data. |
| Field Officer | Dashboard | 
The trigger point—responsible for validating milestones (e.g., confirming Soil Test Completed or triggering a Pest Event) to unlock the next financing stage. |
| Lender/Admin | Dashboard | 
Portfolio monitoring, viewing the full contract audit trail, and monitoring AI risk scores and XAI factors. |
| Insurer | Dashboard | 
Monitoring policy status and viewing triggers (e.g., low moisture) that could initiate a claim. |
| Tester FAQ | Dashboard | 
Provides context on the solution, detailed testing steps, and a comparison of the Demo Implementation vs. the Actual Solution Goal. |
7-Stage Financing Cycle (Stages 1-7)
 * Stage 1: Soil Test (UNLOCKED by default)
 * Stage 2: Inputs (Seed/Fertilizer)
 * Stage 3: Insurance Premium (Triggers drought policy activation)
 * Stage 4: Weeding/Maintenance
 * Stage 5: Pest Control (Conditional based on Officer/IoT trigger)
 * Stage 6: Packaging
 * Stage 7: Transport/Marketing
💻 Technical Stack
This demo is implemented as a microservices architecture with separate frontend and backend components.
| Component | Technology | Details |
|---|---|---|
| Frontend | React (JavaScript) | Provides the mobile-first, multi-dashboard user experience (App.js). Uses axios for API communication. |
| Backend | Python, Flask | 
Handles API routing, business logic, and database operations (app.py). |
| Database | Flask-SQLAlchemy | 
Uses a local SQLite file (genfin_demo.db) for persistence and contract state tracking. |
| Reporting | Reportlab (Python) | Generates a mock KPI dashboard/report (PDF). |
⚙️ Setup and Installation
Prerequisites
 * Python 3.8+ (for Backend)
 * Node.js & npm (for Frontend)
 * Flask and Flask-SQLAlchemy dependencies (listed in app.py)
1. Backend Setup (app.py)
The backend is a Flask application.
 * Install Dependencies:
   # Assuming you use a virtual environment
pip install Flask Flask-SQLAlchemy Flask-Cors reportlab # and any other dependencies

 * Initialize the Database:
   The application requires the database tables to be created first.
   export FLASK_APP=app.py
flask init-db

(This command drops all previous data and recreates a clean SQLite database).
 * Run the Backend Server:
   python app.py
# Server will run on http://127.0.0.1:5000 by default.

2. Frontend Setup (App.js)
The frontend is a React application.
 * Install Dependencies:
   npm install # Assuming a package.json exists with React, axios, etc.

 * Configure API Endpoint (Optional):
If the backend is not running on the default http://127.0.0.1:5000, set the REACT_APP_API_URL environment variable.
   # Example for Linux/macOS
export REACT_APP_API_URL='http://your-backend-ip:5000'

 * Run the Frontend:
   npm start # Or your equivalent command (e.g., next dev)

⚠️ Important Note on Simulations
This is a proof-of-concept demo. The following components are simulated and do not involve real-world interaction:
 * Smart Contract: Simulated via database logging and cryptographic hashing in app.py. It does not interact with a real blockchain mainnet.
 * AI Scoring: Uses a mock calculation based on static factors (e.g., Land Size, Stages Completed Ratio) rather than a live PyTorch model with real-time data.
 * Funds: No real money movement is involved; disbursements are simulated ledger entries.
 
