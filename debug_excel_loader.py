import sys
import os
import pandas as pd

# Add current dir to path
sys.path.append(os.getcwd())

from modules.excel_loader import load_excel_data, EXCEL_PATH

print(f"Testing Loader with file: {EXCEL_PATH}")

products, plans, inv, sales = load_excel_data()

print(f"Products Loaded: {len(products)}")
print(f"Plans Loaded: {len(plans)}")

if len(products) > 0:
    print("Sample Product:", products[0])
else:
    print("NO PRODUCTS LOADED. Debugging DataFrame...")
    try:
        df = pd.read_excel(EXCEL_PATH, header=1)
        df.columns = df.columns.astype(str).str.strip()
        print("Columns Found:", df.columns.tolist())
        print("First Row:", df.iloc[0].to_dict())
        
        # Check specific columns we look for
        req_cols = ['ITEM NAME', 'PART NAME', 'MATERIAL NAME', 'TARGET PCS']
        for col in req_cols:
            if col not in df.columns:
                print(f"MISSING COLUMN: '{col}'")
            else:
                print(f"Found Column: '{col}'")
                
    except Exception as e:
        print(f"Error reading raw excel: {e}")
