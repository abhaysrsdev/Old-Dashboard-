import streamlit as st
import pandas as pd
from modules.data_loader import get_production_plans, get_products

# Page Config
st.set_page_config(page_title="Production Dashboard", layout="wide")

# Title
st.title("🏭 Production Monitoring Dashboard")

# Load Data
plans_df = get_production_plans()
products_df = get_products()

# --- Section 1: Running Production Plan ---
st.header("📌 Running Production Plan")

if not plans_df.empty:
    running_plan = plans_df[plans_df['status'] == 'Running']
    
    if not running_plan.empty:
        plan = running_plan.iloc[0]
        product_name = products_df[products_df['id'] == plan['product_id']]['name'].values[0] if not products_df.empty else f"Product {plan['product_id']}"
        
        col1, col2, col3 = st.columns(3)
        with col1:
            st.metric("Plan ID", plan['id'])
        with col2:
            st.metric("Product", product_name)
        with col3:
            st.metric("Progress", f"{plan['progress']}%")
            
        st.progress(plan['progress'] / 100)
    else:
        st.info("No active production plan found.")
else:
    st.warning("No production data available.")


# --- Section 2: Sales Heatmap ---
st.header("📊 Sales Overview")
sales_df = get_sales_data()

if not sales_df.empty:
    # Basic sales plot
    sales_chart_data = sales_df.pivot(index='date', columns='product_id', values='quantity')
    st.line_chart(sales_chart_data)
else:
    st.info("No sales data available.")
    
st.markdown("---")

# --- Section 3: Alert Panel ---
st.header("🚨 Active Alerts")
from modules.data_loader import get_inventory
from modules.alerts import check_alerts

inventory_df = get_inventory()
alerts = check_alerts(sales_df, inventory_df)

if alerts:
    for alert in alerts:
        product_name = products_df[products_df['id'] == alert['product_id']]['name'].values[0] if not products_df.empty else f"ID {alert['product_id']}"
        severity_color = "red" if alert['severity'] == "Critical" else "orange"
        
        st.error(f"**[{alert['severity']}]** {product_name}: {alert['message']}")
else:
    st.success("✅ No active alerts. System is healthy.")

st.markdown("---")

# --- Section 4: Stock Overview ---
st.header("📦 Stock Overview")

if not inventory_df.empty:
    # Merge with product names
    stock_view = inventory_df.merge(products_df, left_on='product_id', right_on='id', how='left')
    stock_view = stock_view[['name', 'available_stock', 'reserved_stock', 'sku']]
    
    # Highlight low stock logic for display could be added here (e.g. style)
    st.dataframe(stock_view, use_container_width=True)
else:
    st.info("No inventory data available.")

