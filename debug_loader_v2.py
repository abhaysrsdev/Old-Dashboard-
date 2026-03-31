import pandas as pd
import os

EXCEL_PATH = 'Production Planning Detail.xlsx'

try:
    # Try reading with header=0 (default)
    print("--- Attempt 1: header=0 ---")
    df = pd.read_excel(EXCEL_PATH, header=0)
    print("Columns:", df.columns.tolist())
    print("First Row:", df.iloc[0].tolist() if not df.empty else "Empty")
    
    # Check if headers are likely in the first row
    first_row_values = [str(x) for x in df.iloc[0].tolist()]
    if "PLANNING DATE" in first_row_values:
        print("FOUND HEADERS IN ROW 0! Adjusting to header=1")
    
    # Try reading with header=1
    print("\n--- Attempt 2: header=1 ---")
    df = pd.read_excel(EXCEL_PATH, header=1)
    print("Columns:", df.columns.tolist())
    print("First Row:", df.iloc[0].tolist() if not df.empty else "Empty")
    
except Exception as e:
    print(f"Error: {e}")
