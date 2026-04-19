# Complete Data Points Mapping - Production Monitoring Dashboard

## Overview
This document outlines all data points required for the Production Monitoring Dashboard project, organized by entity type and data source.

---

## 1. PRODUCTS
**Source:** `mock/products.json` → Loaded via `/api/products`
**Primary Use:** Product catalog, production cards, stock tracking

### Product Object Structure:
```json
{
  "id": "integer - unique product identifier",
  "name": "string - product display name",
  "sku": "string - stock keeping unit code",
  "category": "string - product category (Tops, Bottoms, Outerwear, etc.)",
  "subparts": "ar6ray of strings - component materials/subparts"
}
```

### Data Points:
| Field | Type | Purpose | Example |
|-------|------|---------|---------|
| id | integer | Unique product identifier | 1 |
| name | string | Product display name | "Classic T-Shirt" |
| sku | string | Stock keeping unit code | "TS-001" |
| category | string | Product classification | "Tops" |
| subparts | array | Component materials | ["Cotton", "Thread", "Elastic"] |

### Data Range:
- Currently 10 sample products (IDs 1-10)
- Real data loaded from Excel: `Production Planning Detail.xlsx`

---

## 2. PRODUCTION PLANS
**Source:** `mock/production.json` → Loaded via `/api/production-plan`
**Primary Use:** Track manufacturing progress, display running jobs

### Production Plan Object Structure:
```json
{
  "id": "string - unique production plan identifier",
  "product_id": "integer - references product ID",
  "start_date": "string (YYYY-MM-DD) - production start date",
  "end_date": "string (YYYY-MM-DD) - planned completion date",
  "status": "string - one of [Completed, Running, Pending]",
  "progress": "integer (0-100) - percentage complete",
  "target": "integer - quantity target (pieces)",
  "subparts": "array - materials/components for production"
}
```

### Data Points:
| Field | Type | Purpose | Example |
|-------|------|---------|---------|
| id | string | Unique plan identifier | "PP-2023-001" |
| product_id | integer | References product | 1 |
| start_date | string | YYYY-MM-DD format | "2023-10-01" |
| end_date | string | YYYY-MM-DD format | "2023-10-10" |
| status | enum | [Completed, Running, Pending] | "Running" |
| progress | integer | Completion percentage 0-100 | 65 |
| target | integer | Quantity target | 500 |
| subparts | array | Components needed | ["Cotton", "Thread"] |

### Status Values:
- `Completed` - Production finished
- `Running` - Currently in production
- `Pending` - Scheduled but not started

---

## 3. INVENTORY / STOCK
**Source:** `mock/inventory.json` → Loaded via `/api/inventory`
**Primary Use:** Stock tracking, alert generation, low stock warnings

### Inventory Object Structure:
```json
{
  "product_id": "integer - references product ID",
  "available_stock": "integer - quantity available for sale/use",
  "reserved_stock": "integer - quantity reserved/allocated"
}
```

### Data Points:
| Field | Type | Purpose | Example |
|-------|------|---------|---------|
| product_id | integer | References product | 1 |
| available_stock | integer | Available quantity | 500 |
| reserved_stock | integer | Reserved quantity | 50 |

### Computed Metrics:
- **Total Stock** = available_stock + reserved_stock
- **Days of Stock Left** = available_stock / avg_daily_sales
- **Stock Status** = "Critical" if days_left < 3, else "Healthy"

---

## 4. SALES DATA
**Source:** `mock/sales.json` → Loaded via `/api/sales`
**Primary Use:** Demand tracking, alert triggers, trend analysis

### Sales Object Structure:
```json
{
  "date": "string (YYYY-MM-DD) - sale date",
  "product_id": "integer - references product ID",
  "quantity": "integer - units sold"
}
```

### Data Points:
| Field | Type | Purpose | Example |
|-------|------|---------|---------|
| date | string | YYYY-MM-DD format | "2023-10-20" |
| product_id | integer | References product | 1 |
| quantity | integer | Units sold | 100 |

### Computed Metrics:
- **Daily Sales** = sum of all quantities for a date/product
- **Average Daily Sales** (7-day) = mean of last 7 days quantities
- **Sales Spike** = today_qty > (avg_7day * 1.5)
- **Sales Trend** = Q3 > Q2 > Q1 (upward for 2+ days)

---

## 5. JOB WORK / SUBPROCESSES
**Source:** `mock/job_work.json` → Loaded via `/api/job-work`
**Primary Use:** Detailed job tracking, karigar assignment, subprocess management

### Job Work Object Structure:
```json
{
  "production_id": "string - unique job identifier",
  "production_code": "string - production code (matches product ID)",
  "product_name": "string - product display name",
  "status": "string - job status",
  "subprocesses": {
    "embroidery": {
      "karigar_name": "string - assigned worker name",
      "due_days": "integer - days until due",
      "submitted_qty": "integer - quantity completed",
      "total_qty": "integer - target quantity",
      "items": {
        "touching": { "karigar_name": "...", "due_days": 2, "submitted_qty": 300, "total_qty": 300 },
        "embroidery": { ... },
        "latkan": { ... },
        "outing": { ... },
        "pleating": { ... }
      }
    },
    "stitching": { ... },
    "finishing": { ... }
  }
}
```

### Data Points:

#### Top-Level Job Work:
| Field | Type | Purpose | Example |
|-------|------|---------|---------|
| production_id | string | Unique job ID | "17244" |
| production_code | string | Production code | "17244" |
| product_name | string | Product display name | "Product 17244" |
| status | string | Current status | "In Progress" |

#### Subprocess Level (embroidery, stitching, finishing):
| Field | Type | Purpose | Example |
|-------|------|---------|---------|
| karigar_name | string | Assigned worker name | "Ahmed" |
| due_days | integer | Days remaining | 3 |
| submitted_qty | integer | Quantity completed | 300 |
| total_qty | integer | Target quantity | 300 |

#### Nested Items (within subprocesses):
| Field | Type | Purpose | Example |
|-------|------|---------|---------|
| karigar_name | string | Sub-process worker | "Sohan" |
| due_days | integer | Days remaining | 2 |
| submitted_qty | integer | Completed quantity | 300 |
| total_qty | integer | Target quantity | 300 |

### Computed Metrics:
- **Progress %** = (submitted_qty / total_qty) * 100
- **Is Complete** = submitted_qty >= total_qty
- **Active Process** = First process where submitted_qty < total_qty
- **Overdue Status** = due_days <= 0

---

## 6. ALERTS
**Source:** Generated by `modules/alerts.py` based on Sales & Inventory
**Endpoints:** Computed dynamically, not directly fetched

### Alert Object Structure:
```json
{
  "product_id": "integer - product identifier",
  "type": "string - alert category",
  "message": "string - human-readable alert message",
  "severity": "string - one of [Critical, High, Medium, Low]",
  "timestamp": "string - ISO format timestamp"
}
```

### Alert Types & Data Points:

#### 1. HIGH DEMAND (Sales Spike)
| Field | Type | Trigger | Example |
|-------|------|---------|---------|
| product_id | integer | Product with spike | 1 |
| type | string | "High Demand" | "High Demand" |
| message | string | Details + sales figures | "Sales spike detected! 250 units sold today (Avg: 116.0)" |
| severity | string | Always "Critical" | "Critical" |

**Data Points Used:**
- today_sales (latest date quantity)
- avg_daily_sales (7-day average)
- Trigger: today_sales > (avg_daily_sales * 1.5)

#### 2. LOW STOCK (Stock Risk)
| Field | Type | Trigger | Example |
|-------|------|---------|---------|
| product_id | integer | Product with low stock | 2 |
| type | string | "Low Stock" | "Low Stock" |
| message | string | Days of stock remaining | "Stock running low! Only 1.5 days of cover left." |
| severity | string | "High" | "High" |

**Data Points Used:**
- current_available_stock
- avg_daily_sales (7-day average)
- Calculation: days_left = current_stock / avg_daily_sales
- Trigger: days_left < 3

#### 3. TRENDING UP (Continuous Sales Rise)
| Field | Type | Trigger | Example |
|-------|------|---------|---------|
| product_id | integer | Product trending | 3 |
| type | string | "Trending Up" | "Trending Up" |
| message | string | Sales progression | "Trending up! Sales rising for 2 days straight (100 -> 110 -> 120)" |
| severity | string | "Medium" | "Medium" |

**Data Points Used:**
- Q1 (2 days ago quantity)
- Q2 (yesterday quantity)
- Q3 (today quantity)
- Trigger: Q3 > Q2 > Q1

---

## 7. FRONTEND DASHBOARD DISPLAY DATA

### Critical Section (High Attention)
**Condition:** Alerts with severity >= "High" + Production status != "Running"

**Data Points Needed:**
- Alert severity
- Product name
- Production status
- Sales quantity
- Stock available

### Production Pipeline Section
**Display:** All active and pending production plans

**Data Points per Card:**
- Product name
- Production status (Running/Pending/Completed)
- Progress percentage
- Target quantity
- Start date
- Materials/subparts

### Stock Overview Table
**Display:** Product inventory with material breakdown

**Data Points per Row:**
- Product name
- SKU
- Available stock
- Reserved stock
- Total stock
- Days of stock remaining

### Product Detail Modal
**Display:** Full product information popup

**Data Points:**
- Product name
- SKU
- Category
- Total stock
- Reserved stock
- Production due date
- Production status
- Progress percentage
- Manufacturing stages
- Subpart breakdown

---

## 8. DATA LOADING SOURCES

### Mock Data (Development)
- `/mock/products.json`
- `/mock/production.json`
- `/mock/inventory.json`
- `/mock/sales.json`
- `/mock/job_work.json`

### Excel Data (Production - via `excel_loader.py`)
- `Production Planning Detail.xlsx`
  - Extracts: Production Code, Material Name, Target PCS, Planning Date, Stitching Order Allow
- `Sales Order Detail.xlsx`
  - Extracts: Product, Order PCS

### ERP Integration (via `erp_client.py`)
- API endpoints for products, production plans, sales, inventory
- Requires: ERP_BASE_URL, ERP_API_KEY environment variables

---

## 9. DATA FLOW DIAGRAM

```
Excel Files
    ↓
excel_loader.py → Products, Production Plans, Inventory, Sales
    ↓
main.py (FastAPI) → /api/* endpoints
    ↓
frontend (app.js)
    ↓
Dashboard Components:
  - Product Cards
  - Production Pipeline
  - Stock Overview
  - Job Work Tracking
  - Alert Panel
```

---

## 10. CRITICAL DATA VALIDATIONS

| Data Point | Required | Format | Constraints |
|-----------|----------|--------|-------------|
| product_id | Yes | integer | > 0, must reference product |
| date | Yes | string | YYYY-MM-DD format |
| quantity | Yes | integer | >= 0 |
| status | Yes | enum | [Completed, Running, Pending, In Progress] |
| progress | Yes | integer | 0-100 range |
| karigar_name | Yes | string | Non-empty, < 100 chars |
| submitted_qty | Yes | integer | >= 0, <= total_qty |
| available_stock | Yes | integer | >= 0 |
| price/cost | Optional | decimal | For future use |

---

## 11. ENVIRONMENT VARIABLES REQUIRED

```
USE_MOCK=True/False (default: True)
ERP_BASE_URL=http://erp-api.example.com
ERP_API_KEY=your-api-key-here
```

---

## Summary Statistics

| Entity | Count | Fields | Computed Metrics |
|--------|-------|--------|------------------|
| Products | 10 | 5 | Category count, Total by SKU |
| Production Plans | 3+ | 8 | Avg progress, Status distribution |
| Inventory | 10 | 3 | Total stock, Days remaining |
| Sales | 100+ | 3 | Daily total, 7-day avg, spike detection |
| Job Work | 1000+ | Hierarchical | Process completion %, Overdue count |
| Alerts | Dynamic | 4 | Generated per data load |

---

## API Endpoints Reference

```
GET /api/products           → Product[] (name, sku, category, subparts)
GET /api/production-plan    → ProductionPlan[] (status, progress, dates)
GET /api/inventory          → Inventory[] (available_stock, reserved_stock)
GET /api/sales              → Sales[] (date, quantity, product_id)
GET /api/job-work           → JobWork[] (status, subprocesses with progress)
GET /                       → Dashboard UI (index.html)
```

---

## Data Refresh Intervals

- **Dashboard**: Refreshes every 30 seconds (frontend auto-poll)
- **Alerts**: Generated on each data fetch
- **Excel Load**: On application startup (main.py)
- **ERP Sync**: On demand via API endpoints

