from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from typing import List, Optional
import json
import os
import pandas as pd

# Import Real Data Loader
from modules.excel_loader import load_excel_data

app = FastAPI()

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# --- DATA STORE ---
# Load from Excel on startup
try:
    print("Loading Real Data from Excel...")
    products, production_plans, inventory, sales = load_excel_data()
    print(f"Loaded {len(products)} products from Excel.")
except Exception as e:
    print(f"Failed to load Excel: {e}. using empty defaults.")
    products, production_plans, inventory, sales = [], [], [], []

@app.get("/")
async def read_index():
    return FileResponse('static/index.html')

@app.get("/api/products")
async def api_products():
    return products

@app.get("/api/inventory")
async def api_inventory():
    return inventory

@app.get("/api/sales")
async def api_sales():
    return sales

@app.get("/api/production-plan")
async def api_production_plan():
    # Return directly, no need for pandas conversion here as loader returns dicts
    return production_plans

@app.get("/api/job-work")
async def api_job_work():
    try:
        with open('mock/job_work.json', 'r') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading job work mock: {e}")
        return []
