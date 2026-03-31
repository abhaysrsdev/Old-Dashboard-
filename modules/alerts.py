import pandas as pd
from datetime import datetime, timedelta

def check_alerts(sales_df, inventory_df):
    alerts = []
    
    if sales_df.empty or inventory_df.empty:
        return alerts

    # Convert date to datetime
    sales_df['date'] = pd.to_datetime(sales_df['date'])
    today = datetime.now().date() # In real app use max date or today
    # For mock data, let's use the max date in the dataset to simulate "today"
    max_date = sales_df['date'].max()
    
    # 1. Sales Spike Alert
    # Formula: If today_sales > (avg_last_7_days * 1.5)
    
    # Get last 7 days (excluding "today"/max_date for average calc? 
    # Usually average of previous 7 days)
    
    products = sales_df['product_id'].unique()
    
    for pid in products:
        p_sales = sales_df[sales_df['product_id'] == pid].sort_values('date')
        
        # Get sales for "today" (last available date)
        today_sales_row = p_sales[p_sales['date'] == max_date]
        if today_sales_row.empty:
            continue
            
        today_qty = today_sales_row['quantity'].iloc[0]
        
        # Get previous 7 days
        start_date = max_date - timedelta(days=7)
        last_7_days = p_sales[(p_sales['date'] >= start_date) & (p_sales['date'] < max_date)]
        
        if not last_7_days.empty:
            avg_daily = last_7_days['quantity'].mean()
            
            if avg_daily > 0 and today_qty > (avg_daily * 1.5):
                alerts.append({
                    "product_id": int(pid),
                    "type": "High Demand",
                    "message": f"Sales spike detected! {today_qty} units sold today (Avg: {avg_daily:.1f})",
                    "severity": "Critical",
                    "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                })
                
        # 2. Stock Risk Alert
        # Formula: stock_days_left = current_stock / avg_daily_sales
        # If stock_days_left < 3: Trigger Alert
        
        p_stock_row = inventory_df[inventory_df['product_id'] == pid]
        if not p_stock_row.empty:
            current_stock = p_stock_row['available_stock'].iloc[0]
            
            # Use same avg daily sales from above
            if not last_7_days.empty:
                avg_daily = last_7_days['quantity'].mean()
                
                if avg_daily > 0:
                    days_left = current_stock / avg_daily
                    if days_left < 3:
                        alerts.append({
                            "product_id": int(pid),
                            "type": "Low Stock",
                            "message": f"Stock running low! Only {days_left:.1f} days of cover left.",
                            "severity": "High",
                            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                        })


        # 3. Continuous Trend Alert
        # Product is trending continuously 2+ days
        # Meaning: Today > Yesterday AND Yesterday > Day Before
        
        # We need at least 3 days of data: Today (max_date), Yesterday, Day Before
        if len(p_sales) >= 3:
            # Sort is already done above
            # Get last 3 records
            last_3_days = p_sales.tail(3)
            if len(last_3_days) == 3:
                q3 = last_3_days.iloc[2]['quantity'] # Today
                q2 = last_3_days.iloc[1]['quantity'] # Yesterday
                q1 = last_3_days.iloc[0]['quantity'] # Day before
                
                if q3 > q2 and q2 > q1:
                     alerts.append({
                        "product_id": int(pid),
                        "type": "Trending Up",
                        "message": f"Trending up! Sales rising for 2 days straight ({q1} -> {q2} -> {q3})",
                        "severity": "Medium",
                        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                    })

    return alerts
