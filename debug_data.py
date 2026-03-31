import sys
import os
import pandas as pd

# Add current directory to path so we can import modules
sys.path.append(os.getcwd())

try:
    from modules.data_loader import get_products, get_inventory, get_sales_data, get_production_plans
    print("Successfully imported data_loader")
except Exception as e:
    print(f"Error importing data_loader: {e}")
    sys.exit(1)

def test_data():
    print("--- Testing Data Loading ---")
    
    try:
        products = get_products()
        print(f"Products: {len(products)} records")
        if not products.empty:
            print(products.head(2))
        else:
            print("Products DF is empty!")
            
        inventory = get_inventory()
        print(f"\nInventory: {len(inventory)} records")
        if not inventory.empty:
            print(inventory.head(2))
        else:
            print("Inventory DF is empty!")

        sales = get_sales_data()
        print(f"\nSales: {len(sales)} records")
        if not sales.empty:
            print(sales.head(2))
        else:
            print("Sales DF is empty!")

        plans = get_production_plans()
        print(f"\nProduction Plans: {len(plans)} records")
        if not plans.empty:
            print(plans.head(2))
        else:
            print("Production Plans DF is empty!")

        print("\n--- End Test ---")

    except Exception as e:
        print(f"Error during data loading: {e}")

if __name__ == "__main__":
    test_data()
