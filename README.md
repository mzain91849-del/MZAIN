# Zain Fast Food — E-Commerce Storefront & Admin System

Tagline: **“Fresh. Hot. Delivered.”**

A responsive, mobile-first fast-food e-commerce web application built for browsing categories, customizing menu items (sizes, spice levels, add-ons), managing carts with server-side price/coupon/delivery calculation in PKR, placing Cash on Delivery (COD) orders, tracking live order statuses, and administering products, categories, inventory stock, promotions, and store settings.

---

## 1. Brand Visual Identity & Palette

| Color Name | HEX | Usage |
| :--- | :--- | :--- |
| **Primary Red** | `#D92332` | Primary CTAs, active tabs, sale highlights |
| **Cheese Yellow** | `#FFC928` | Warm accents and highlights on dark surfaces |
| **Dark Charcoal** | `#202124` | Headings, hero contrast, navigation, footer |
| **Warm Cream** | `#FFF8EE` | Main background canvas |
| **White** | `#FFFFFF` | Product cards, forms, and clean surfaces |

---

## 2. Quick Start & Run Instructions

### Web Full-Stack Runtime (Express + Vite + React + Persistent JSON Store)

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Initialize / Seed Database:**
   The server automatically initializes and seeds `data/store-db.json` on first startup with clearly labelled demo categories, menu items (in PKR), promotional coupons (`ZAIN15`, `WELCOME200`), store settings, and demo accounts.

3. **Start the development server (Port 3000):**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   npm start
   ```

---

## 3. Demo Accounts & Promotional Codes (Development Testing)

> **Security Note:** In production, never hard-code credentials; configure administrator accounts via environment variables or CLI superuser creation. The following accounts are seeded strictly for local/demo evaluation:

- **Store Administrator:**
  - **Email:** `admin@zainfastfood.demo`
  - **Password:** `Admin123!`
- **Demo Customer:**
  - **Email:** `customer@zainfastfood.demo`
  - **Password:** `Customer123!`
- **Demo Order Tracking:**
  - **Order Number:** `ZFF-1041`
  - **Phone Number:** `0321-4567890`
- **Demo Promo Coupons:**
  - `ZAIN15` — 15% off on orders of PKR 1,500 or above
  - `WELCOME200` — Flat PKR 200 off on orders of PKR 1,000 or above

---

## 4. Security & Data Integrity Highlights

- **Server-Side Totals:** All item prices, size deltas, add-on prices, coupon discounts, minimum order thresholds, and delivery fees are recalculated on the server (`/api/cart/calculate` and `/api/orders`). Browser-submitted totals are never trusted.
- **Immutable Order Item Snapshots:** Placing an order stores a permanent snapshot of product names, unit prices, selected sizes, spice levels, and add-ons so subsequent product edits do not alter historical receipts.
- **Customer Order Privacy:** Signed-in customers can only access their own orders (`/api/orders/my`). Direct order status lookup requires matching phone number verification.
- **Stock & Availability Enforcement:** Unavailable or out-of-stock products are rejected at checkout, and confirmed orders automatically decrement inventory stock.

---

## 5. Django Reference Commands (When Deploying with Python/Django)

If migrating or deploying the backend with Python + Django (`zain_fast_food/`):

```bash
python -m venv venv
source venv/bin/activate
pip install django pillow psycopg2-binary
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```
