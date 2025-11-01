# ATFCF (After Tax Free Cash Flow) Financial Tool

A web app to calculate ATFCF (After Tax Free Cash Flow for S&P 500 Companies), using a Node.js backend, Postgres database, and yfinance API with a Python Microservice. 

## Live at: https://atfcf-service.onrender.com 

## Development

1. Clone the repo
2. Switch into the atfcf_service:
    - Create a Virtual Environment by running `python3 -m venv venv`
    - Activate the Virtual Environment by running `source venv/bin/activate`
    - Install Requirements by runnning `pip install -r requirements.txt`
    - Start the microservice by running `python atfcf_service.py`
    - Activate the tests by running `source venv/bin/activate && python test_yfinance.py`
3. Run `npm start` to start the app at http://localhost:3000 (Make sure to be in ATFCF within terminal)

## Stack
- Node.js (web)
- Postgres (db)
- Docker Compose
