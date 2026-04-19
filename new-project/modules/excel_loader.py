import pandas as pd
import random
from datetime import datetime

EXCEL_PATH = 'Production Planning Detail.xlsx'
SALES_EXCEL_PATH = 'Sales Order Detail.xlsx'

def load_excel_data():
    """
    Reads the production planning and sales excel files.
    """
    try:
        # 1. Load Production Data
        df_prod = pd.read_excel(EXCEL_PATH, header=1)
        df_prod.columns = df_prod.columns.astype(str).str.strip()
    except Exception as e:
        print(f"Error reading Production Excel: {e}")
        return [], [], [], []

    # Aggregation for Production
    raw_aggregation = {}
    for _, row in df_prod.iterrows():
        prod_code = str(row.get('Production Code', row.get('ITEM NAME', 'Unknown'))).strip()
        if prod_code == 'nan' or not prod_code:
            continue
            
        material = str(row.get('MATERIAL NAME', 'No Material')).strip()
        target = row.get('TARGET PCS', 0)
        try:
            target = float(target) if pd.notnull(target) else 0
        except:
            target = 0
            
        status_checked = str(row.get('STITCHING ORDER ALLOW', 'UNCHECKED')).upper() == 'CHECKED'
        start_date_raw = row.get('PLANNING DATE', datetime.now())
        
        # Date Parsing
        if isinstance(start_date_raw, datetime):
            start_date = start_date_raw.strftime('%Y-%m-%d')
        else:
            try:
                ds = str(start_date_raw).strip().split(' ')[0]
                dt = datetime.strptime(ds, '%d-%m-%Y')
                start_date = dt.strftime('%Y-%m-%d')
            except:
                try:
                    dt = datetime.strptime(str(start_date_raw).strip().split(' ')[0], '%Y-%m-%d')
                    start_date = dt.strftime('%Y-%m-%d')
                except:
                    start_date = str(start_date_raw).split(' ')[0]

        if prod_code not in raw_aggregation:
            raw_aggregation[prod_code] = {
                'materials': {},
                'is_running': False,
                'date': start_date
            }
            
        if material not in raw_aggregation[prod_code]['materials']:
            raw_aggregation[prod_code]['materials'][material] = 0
        raw_aggregation[prod_code]['materials'][material] += target
        
        if status_checked:
            raw_aggregation[prod_code]['is_running'] = True

    # Build Products and Plans
    products_map = {}
    production_plans = []
    
    for prod_code, data in raw_aggregation.items():
        try:
            numeric_id = int(float(prod_code))
        except:
            numeric_id = prod_code

        material_names = [m for m in data['materials'].keys() if m != 'No Material' and m != 'nan']
        job_target = max(data['materials'].values()) if data['materials'] else 0
        
        products_map[prod_code] = {
            "id": numeric_id,
            "name": prod_code, 
            "sku": prod_code,
            "category": "General",
            "subparts": material_names
        }
        
        production_plans.append({
            "product_id": numeric_id,
            "status": "Running" if data['is_running'] else "Pending",
            "start_date": data['date'],
            "progress": random.randint(15, 85) if data['is_running'] else 0,
            "target": int(job_target),
            "subparts": material_names
        })

    products = list(products_map.values())

    # 2. Load Sales Data
    sales_map = {}
    try:
        df_sales = pd.read_excel(SALES_EXCEL_PATH, header=1)
        df_sales.columns = df_sales.columns.astype(str).str.strip()
        
        for _, row in df_sales.iterrows():
            raw_sid = str(row.get('PRODUCT', '')).strip()
            if not raw_sid or raw_sid == 'nan':
                continue
            
            try:
                sid = str(int(float(raw_sid)))
            except:
                sid = raw_sid

            qty = row.get('ORDER PCS', 0)
            try:
                qty = int(qty) if pd.notnull(qty) else 0
            except:
                qty = 0
                
            if sid not in sales_map:
                sales_map[sid] = 0
            sales_map[sid] += qty
            
    except Exception as e:
        print(f"Error reading Sales Excel: {e}")

    # Build Sales list
    sales = []
    for p in products:
        sku_str = str(p['sku'])
        qty = sales_map.get(sku_str, 0)
        sales.append({
            "product_id": p['id'],
            "quantity": qty
        })

    # 3. MOCK Inventory
    inventory = []
    for p in products:
        inventory.append({
            "product_id": p['id'],
            "available_stock": 0, # Placeholder for YTA
            "reserved_stock": 0
        })

    return products, production_plans, inventory, sales
