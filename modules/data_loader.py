import os
import json
import pandas as pd
from dotenv import load_dotenv

load_dotenv()

USE_MOCK = os.getenv("USE_MOCK", "True") == "True"

MOCK_DIR = os.path.join(os.path.dirname(__file__), "../mock")

def load_data(file_name):
    """Loads data from a JSON file in the mock directory."""
    file_path = os.path.join(MOCK_DIR, file_name)
    try:
        with open(file_path, "r") as f:
            return json.load(f)
    except FileNotFoundError:
        return []


from modules.erp_client import DecentERPClient

# Initialize Client
erp_client = DecentERPClient()

def get_products():
    if USE_MOCK:
        return pd.DataFrame(load_data("products.json"))
    return erp_client.get_products()

def get_production_plans():
    if USE_MOCK:
        return pd.DataFrame(load_data("production.json"))
    return erp_client.get_production_plans()

def get_sales_data():
    if USE_MOCK:
        return pd.DataFrame(load_data("sales.json"))
    return erp_client.get_sales_data()

def get_inventory():
    if USE_MOCK:
        return pd.DataFrame(load_data("inventory.json"))
    return erp_client.get_inventory()

