import os
import requests
import pandas as pd
from dotenv import load_dotenv

load_dotenv()

class DecentERPClient:
    def __init__(self):
        self.base_url = os.getenv("ERP_BASE_URL")
        self.api_key = os.getenv("ERP_API_KEY")
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

    def _get(self, endpoint):
        """Helper method for GET requests."""
        if not self.base_url:
            print("Warning: ERP_BASE_URL not set.")
            return []
            
        try:
            url = f"{self.base_url}{endpoint}"
            response = requests.get(url, headers=self.headers)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"API Request Error: {e}")
            return []

    def get_production_plans(self):
        data = self._get("/production-plans")
        return pd.DataFrame(data) if data else pd.DataFrame()

    def get_sales_data(self):
        data = self._get("/sales")
        return pd.DataFrame(data) if data else pd.DataFrame()

    def get_inventory(self):
        data = self._get("/inventory")
        return pd.DataFrame(data) if data else pd.DataFrame()

    def get_products(self):
        data = self._get("/products")
        return pd.DataFrame(data) if data else pd.DataFrame()
