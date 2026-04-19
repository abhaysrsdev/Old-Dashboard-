import pandas as pd
import json
import random

EXCEL_PATH = 'Production Planning Detail.xlsx'

def sync_job_work():
    try:
        df = pd.read_excel(EXCEL_PATH, header=1)
        df.columns = df.columns.astype(str).str.strip()
        
        # Get unique production codes and names
        # We'll take the first 10-20 to keep it manageable but realistic
        production_units = []
        unique_codes = []
        
        for _, row in df.iterrows():
            code = str(row.get('Production Code', row.get('ITEM NAME', 'Unknown'))).strip()
            if code == 'nan' or not code or code in unique_codes:
                continue
            
            unique_codes.append(code)
            name = str(row.get('ITEM NAME', code)).strip()
            
            # Strictly sequential logic for sub-subprocesses
            sub_sub_items = ["touching", "embroidery", "latkan", "outing", "pleating"]
            active_index = random.randint(0, len(sub_sub_items) - 1)
            
            nested_items = {}
            total_qty = 300
            for i, key in enumerate(sub_sub_items):
                karigar = random.choice(["Imran", "Ahmed", "Farhan", "Zaid", "Vikram", "Sohan", "Amit", "Rahul"])
                due = random.randint(1, 5)
                
                if i < active_index:
                    sub_qty = total_qty # Past
                elif i == active_index:
                    sub_qty = random.choice([0, 100, 150]) # Present
                else:
                    sub_qty = 0 # Future
                    
                nested_items[key] = {
                    "karigar_name": karigar,
                    "due_days": due,
                    "submitted_qty": sub_qty,
                    "total_qty": total_qty
                }

            # Create a mock job work entry for this real production unit
            subprocesses = {
                "embroidery": {
                    "karigar_name": random.choice(["Ahmed", "Farhan", "Imran", "Zaid"]),
                    "due_days": random.randint(1, 3),
                    "submitted_qty": 300,
                    "total_qty": 300,
                    "items": nested_items
                },
                "stitching": {
                    "karigar_name": random.choice(["Suresh", "Manoj", "Ramesh", "Deepak"]),
                    "due_days": random.randint(3, 5),
                    "submitted_qty": random.choice([0, 100, 150, 300]),
                    "total_qty": 300
                },
                "finishing": {
                    "karigar_name": random.choice(["Kapil", "Varun", "Sunil", "Arjun"]),
                    "due_days": random.randint(7, 10),
                    "submitted_qty": 0,
                    "total_qty": 300
                }
            }
            
            # Randomize progress a bit more realistically
            # If stitching has progress, embroidery must be done.
            # If touching has progress, stitching must be done.
            if subprocesses["stitching"]["submitted_qty"] > 0:
                subprocesses["embroidery"]["submitted_qty"] = subprocesses["embroidery"]["total_qty"]
            
            # Force the first job to be fully completed for testing
            if len(production_units) == 0:
                for p_key in subprocesses:
                    subprocesses[p_key]["submitted_qty"] = subprocesses[p_key]["total_qty"]

            production_units.append({
                "production_id": code,
                "production_code": code,
                "product_name": f"Product {name}",
                "status": "In Progress",
                "subprocesses": subprocesses
            })
            
            if len(production_units) >= 15:
                break
                
        with open('mock/job_work.json', 'w') as f:
            json.dump(production_units, f, indent=2)
        
        print(f"Successfully synced {len(production_units)} production units to mock/job_work.json")

    except Exception as e:
        print(f"Error syncing job work: {e}")

if __name__ == "__main__":
    sync_job_work()
