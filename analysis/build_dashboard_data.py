"""
Retail Inventory Intelligence - dashboard data pipeline.

Reads the cleaned synthetic retail dataset, rebuilds the prepared dashboard
datasets and writes everything the front end consumes into ./data/.

Run from the repository root:

    python analysis/build_dashboard_data.py

Calculations (project-defined assumptions, not industry standards)
-----------------------------------------------------------------
Average Inventory      mean of the daily Inventory Level for a product-store pair
Average Daily Demand   summed Demand / number of trading days in the window
Days of Inventory      Average Inventory / Average Daily Demand  (null when demand is 0)
Inventory Status       < 3 days Critical
                       3 - < 7 days Low Stock
                       7 - 30 days Healthy
                       > 30 days Overstock Candidate
                       Average Daily Demand = 0 -> No Demand
Reorder Point          Average Daily Demand * lead time (5) + Average Daily Demand * safety stock (2)
Suggested Reorder Qty  max(Reorder Point - Average Inventory, 0)   (illustrative, not purchasing advice)

The notebook output in ./output/dashboard_inventory.csv computed Avg Inventory as
mean(Inventory Level) / day count, which understates it by the day count and inflates
Suggested Reorder Qty. This script writes corrected copies to ./data/ and leaves the
notebook and its output folder untouched.
"""

from __future__ import annotations

import json
from pathlib import Path

import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
SOURCE_CSV = ROOT / "sales_data_cleaned.csv"
OUT_DIR = ROOT / "data"

LEAD_TIME_DAYS = 5
SAFETY_STOCK_DAYS = 2
CRITICAL_BELOW = 3.0
LOW_BELOW = 7.0
HEALTHY_MAX = 30.0

STATUS_ORDER = ["Critical", "Low Stock", "Healthy", "Overstock Candidate", "No Demand"]


# --------------------------------------------------------------------------- helpers


def classify_status(days_of_inventory: pd.Series, avg_daily_demand: pd.Series) -> pd.Series:
    """Apply the project thresholds, returning 'No Demand' when demand is zero."""
    return pd.Series(
        np.select(
            [
                avg_daily_demand <= 0,
                days_of_inventory < CRITICAL_BELOW,
                days_of_inventory < LOW_BELOW,
                days_of_inventory <= HEALTHY_MAX,
            ],
            ["No Demand", "Critical", "Low Stock", "Healthy"],
            default="Overstock Candidate",
        ),
        index=days_of_inventory.index,
    )


def pair_aggregates(frame: pd.DataFrame) -> pd.DataFrame:
    """Product-store level inventory health for the rows given."""
    grouped = (
        frame.groupby(["Product ID", "Store ID"], sort=True)
        .agg(
            category=("Category", "first"),
            avg_inventory=("Inventory Level", "mean"),
            demand=("Demand", "sum"),
            units_sold=("Units Sold", "sum"),
            units_ordered=("Units Ordered", "sum"),
            days=("Date", "nunique"),
        )
        .reset_index()
    )
    grouped["avg_daily_demand"] = grouped["demand"] / grouped["days"]
    grouped["days_of_inventory"] = np.where(
        grouped["avg_daily_demand"] > 0,
        grouped["avg_inventory"] / grouped["avg_daily_demand"],
        np.nan,
    )
    grouped["status"] = classify_status(grouped["days_of_inventory"].fillna(0.0), grouped["avg_daily_demand"])
    reorder_point = grouped["avg_daily_demand"] * (LEAD_TIME_DAYS + SAFETY_STOCK_DAYS)
    grouped["suggested_reorder_qty"] = np.maximum(reorder_point - grouped["avg_inventory"], 0.0)
    return grouped


def kpis(frame: pd.DataFrame) -> dict:
    units_sold = int(frame["Units Sold"].sum())
    demand = int(frame["Demand"].sum())
    avg_inventory = float(frame["Inventory Level"].mean()) if len(frame) else None
    return {
        "unitsSold": units_sold,
        "demand": demand,
        "unitsOrdered": int(frame["Units Ordered"].sum()),
        "avgInventory": None if avg_inventory is None else round(avg_inventory, 6),
        "fulfillmentRate": round(units_sold / demand * 100, 6) if demand else None,
        "tradingDays": int(frame["Date"].nunique()),
        "dailyRows": int(len(frame)),
    }


def ranked_top(grouped: pd.DataFrame, value_column: str, label_column: str) -> dict | None:
    if grouped.empty:
        return None
    ordered = grouped.sort_values([value_column, label_column], ascending=[False, True])
    top = ordered.iloc[0]
    return {label_column: str(top[label_column]), value_column: float(top[value_column])}


# --------------------------------------------------------------------------- load


def load_source() -> pd.DataFrame:
    if not SOURCE_CSV.exists():
        raise SystemExit(f"Source dataset not found: {SOURCE_CSV}")
    frame = pd.read_csv(SOURCE_CSV)
    frame["Date"] = pd.to_datetime(frame["Date"])
    frame["month"] = frame["Date"].dt.to_period("M")
    return frame


def month_dimension(frame: pd.DataFrame) -> pd.DataFrame:
    months = (
        frame.groupby("month", sort=True)
        .agg(days=("Date", "nunique"))
        .reset_index()
    )
    months["key"] = months["month"].astype(str)
    months["label"] = months["month"].dt.strftime("%b %Y")
    months["month_number"] = months["month"].dt.month
    months["short_label"] = months["month"].dt.strftime("%b")
    months["year"] = months["month"].dt.year
    return months


# --------------------------------------------------------------------------- writers


def write_prepared_csvs(frame: pd.DataFrame, months: pd.DataFrame) -> pd.DataFrame:
    pairs = pair_aggregates(frame)

    pairs[
        [
            "Product ID",
            "Store ID",
            "category",
            "avg_inventory",
            "avg_daily_demand",
            "days_of_inventory",
            "status",
            "suggested_reorder_qty",
        ]
    ].rename(
        columns={
            "category": "Category",
            "avg_inventory": "Avg Inventory",
            "avg_daily_demand": "Avg Daily Demand",
            "days_of_inventory": "Days of Inventory",
            "status": "Inventory Status",
            "suggested_reorder_qty": "Suggested Reorder Qty",
        }
    ).round(
        {"Avg Inventory": 2, "Avg Daily Demand": 2, "Days of Inventory": 2, "Suggested Reorder Qty": 1}
    ).to_csv(
        OUT_DIR / "dashboard_inventory.csv", index=False
    )

    category = (
        frame.groupby("Category", sort=True)
        .agg(
            units_sold=("Units Sold", "sum"),
            demand=("Demand", "sum"),
            units_ordered=("Units Ordered", "sum"),
            avg_inventory=("Inventory Level", "mean"),
            avg_price=("Price", "mean"),
        )
        .reset_index()
    )
    pair_counts = pairs.groupby("category").size().rename("pairs")
    category = category.merge(pair_counts, left_on="Category", right_index=True, how="left")
    category["fulfillment_rate"] = category["units_sold"] / category["demand"] * 100
    category_output = category.rename(
        columns={
            "units_sold": "Units Sold",
            "demand": "Demand",
            "units_ordered": "Units Ordered",
            "avg_inventory": "Avg Inventory",
            "avg_price": "Avg Price",
            "pairs": "Product Store Pairs",
            "fulfillment_rate": "Fulfillment Rate",
        }
    )[
        [
            "Category",
            "Units Sold",
            "Demand",
            "Units Ordered",
            "Avg Inventory",
            "Avg Price",
            "Product Store Pairs",
            "Fulfillment Rate",
        ]
    ]
    category_output.sort_values("Units Sold", ascending=False).round(2).to_csv(
        OUT_DIR / "category_analysis.csv", index=False
    )

    status_matrix = (
        pairs.pivot_table(index="Store ID", columns="status", values="Product ID", aggfunc="count")
        .reindex(columns=STATUS_ORDER, fill_value=0)
        .fillna(0)
        .astype(int)
    )
    store = (
        frame.groupby("Store ID", sort=True)
        .agg(
            units_sold=("Units Sold", "sum"),
            demand=("Demand", "sum"),
            units_ordered=("Units Ordered", "sum"),
            avg_inventory=("Inventory Level", "mean"),
            region=("Region", "first"),
        )
        .reset_index()
    )
    store = store.merge(status_matrix, left_on="Store ID", right_index=True, how="left")
    store["risk_count"] = store.get("Critical", 0) + store.get("Low Stock", 0)
    store["total_pairs"] = store[STATUS_ORDER].sum(axis=1)
    store["avg_days_of_inventory"] = pairs.groupby("Store ID")["days_of_inventory"].mean().round(2).values
    store["fulfillment_rate"] = store["units_sold"] / store["demand"] * 100
    store_output = store.rename(
        columns={
            "region": "Region",
            "units_sold": "Units Sold",
            "demand": "Demand",
            "units_ordered": "Units Ordered",
            "avg_inventory": "Avg Inventory",
            "risk_count": "Risk Count",
            "total_pairs": "Product Store Pairs",
            "avg_days_of_inventory": "Avg Days of Inventory",
            "fulfillment_rate": "Fulfillment Rate",
        }
    )[
        [
            "Store ID",
            "Region",
            "Units Sold",
            "Demand",
            "Units Ordered",
            "Avg Inventory",
            "Fulfillment Rate",
            "Critical",
            "Low Stock",
            "Healthy",
            "Overstock Candidate",
            "No Demand",
            "Risk Count",
            "Product Store Pairs",
            "Avg Days of Inventory",
        ]
    ]
    store_output.sort_values(
        ["Risk Count", "Critical", "Store ID"], ascending=[False, False, True]
    ).round(2).to_csv(OUT_DIR / "store_analysis.csv", index=False)

    status_counts = (
        pairs["status"].value_counts().reindex(STATUS_ORDER, fill_value=0).rename_axis("Inventory Status")
    )
    pd.DataFrame(
        {
            "Inventory Status": status_counts.index,
            "Product Store Count": status_counts.values,
            "Percentage": (status_counts.values / len(pairs) * 100).round(2),
        }
    ).to_csv(OUT_DIR / "status_counts.csv", index=False)

    monthly = (
        frame.groupby("month", sort=True)
        .agg(
            days=("Date", "nunique"),
            units_sold=("Units Sold", "sum"),
            demand=("Demand", "sum"),
            units_ordered=("Units Ordered", "sum"),
            avg_inventory=("Inventory Level", "mean"),
        )
        .reset_index()
    )
    monthly["Month"] = monthly["month"].astype(str)
    monthly["Month Label"] = monthly["month"].dt.strftime("%b %Y")
    monthly["Fulfillment Rate"] = (monthly["units_sold"] / monthly["demand"] * 100).round(2)
    monthly[
        ["Month", "Month Label", "days", "units_sold", "demand", "units_ordered", "avg_inventory", "Fulfillment Rate"]
    ].rename(
        columns={
            "days": "Days",
            "units_sold": "Units Sold",
            "demand": "Demand",
            "units_ordered": "Units Ordered",
            "avg_inventory": "Avg Inventory",
        }
    ).round({"Avg Inventory": 2}).to_csv(
        OUT_DIR / "monthly_demand.csv", index=False
    )

    seasonality = (
        frame.groupby(frame["Date"].dt.month, sort=True)
        .agg(
            days=("Date", "nunique"),
            units_sold=("Units Sold", "sum"),
            demand=("Demand", "sum"),
            units_ordered=("Units Ordered", "sum"),
            avg_inventory=("Inventory Level", "mean"),
        )
        .reset_index(names="Month Number")
    )
    seasonality["Month Name"] = pd.to_datetime(
        seasonality["Month Number"], format="%m"
    ).dt.strftime("%B")
    seasonality["Avg Daily Demand"] = seasonality["demand"] / seasonality["days"]
    seasonality[
        ["Month Number", "Month Name", "days", "units_sold", "demand", "units_ordered", "Avg Daily Demand", "avg_inventory"]
    ].rename(
        columns={
            "days": "Days",
            "units_sold": "Units Sold",
            "demand": "Demand",
            "units_ordered": "Units Ordered",
            "avg_inventory": "Avg Inventory",
        }
    ).round({"Avg Daily Demand": 2, "Avg Inventory": 2}).to_csv(
        OUT_DIR / "monthly_seasonality.csv", index=False
    )

    return pairs


def write_payload(frame: pd.DataFrame, months: pd.DataFrame, pairs: pd.DataFrame) -> dict:
    stores = sorted(frame["Store ID"].unique())
    products = sorted(frame["Product ID"].unique())
    categories = sorted(frame["Category"].unique())

    store_index = {value: index for index, value in enumerate(stores)}
    product_index = {value: index for index, value in enumerate(products)}
    category_index = {value: index for index, value in enumerate(categories)}
    month_index = {value: index for index, value in enumerate(months["key"])}

    pair_frame = pairs.sort_values(["Store ID", "Product ID"]).reset_index(drop=True)
    pair_keys = {
        (row["Product ID"], row["Store ID"]): index for index, row in pair_frame.iterrows()
    }
    pair_rows = [
        [store_index[row["Store ID"]], product_index[row["Product ID"]], category_index[row["category"]]]
        for _, row in pair_frame.iterrows()
    ]

    facts = (
        frame.groupby(["month", "Store ID", "Product ID"], sort=True)
        .agg(
            days=("Date", "nunique"),
            inventory_sum=("Inventory Level", "sum"),
            units_sold=("Units Sold", "sum"),
            units_ordered=("Units Ordered", "sum"),
            demand=("Demand", "sum"),
        )
        .reset_index()
    )
    facts["month"] = facts["month"].astype(str).map(month_index)
    facts["pair"] = [
        pair_keys[(product, store)] for product, store in zip(facts["Product ID"], facts["Store ID"])
    ]
    facts = facts.sort_values(["month", "pair"])

    payload = {
        "meta": {
            "title": "Retail Inventory Intelligence",
            "dataSource": "Synthetic retail inventory dataset",
            "datasetFile": SOURCE_CSV.name,
            "analysisTool": "Python + Pandas",
            "dashboardStack": "React + Vite + Recharts",
            "rows": int(len(frame)),
            "dateRange": {
                "start": frame["Date"].min().strftime("%Y-%m-%d"),
                "end": frame["Date"].max().strftime("%Y-%m-%d"),
            },
            "generated": pd.Timestamp.now(tz="UTC").strftime("%Y-%m-%d"),
            "assumptions": {
                "criticalBelow": CRITICAL_BELOW,
                "lowBelow": LOW_BELOW,
                "healthyMax": HEALTHY_MAX,
                "leadTimeDays": LEAD_TIME_DAYS,
                "safetyStockDays": SAFETY_STOCK_DAYS,
            },
            "notes": [
                "Inventory status thresholds are project-defined for this portfolio exercise, not industry standards.",
                "Suggested reorder quantities use a 5 day lead time plus 2 days of safety stock and are illustrative only.",
                "Data is synthetic and is not affiliated with any real retailer.",
                "Corrected copy of the notebook output: Average Inventory is the mean daily Inventory Level per product-store pair.",
            ],
        },
        "dimensions": {
            "months": [
                {
                    "key": row["key"],
                    "label": row["label"],
                    "shortLabel": row["short_label"],
                    "days": int(row["days"]),
                }
                for _, row in months.iterrows()
            ],
            "stores": stores,
            "products": products,
            "categories": categories,
        },
        "pairs": pair_rows,
        "facts": {
            "month": facts["month"].astype(int).tolist(),
            "pair": facts["pair"].astype(int).tolist(),
            "days": facts["days"].astype(int).tolist(),
            "inventorySum": facts["inventory_sum"].astype(float).tolist(),
            "unitsSold": facts["units_sold"].astype(int).tolist(),
            "unitsOrdered": facts["units_ordered"].astype(int).tolist(),
            "demand": facts["demand"].astype(int).tolist(),
        },
    }
    (OUT_DIR / "dashboard-data.json").write_text(
        json.dumps(payload, separators=(",", ":"), allow_nan=False), encoding="utf-8"
    )
    return payload


SCENARIOS = [
    {"id": "all", "filters": {}},
    {"id": "store-s002", "filters": {"store": "S002"}},
    {"id": "category-groceries", "filters": {"category": "Groceries"}},
    {"id": "product-p0007", "filters": {"product": "P0007"}},
    {"id": "year-2023", "filters": {"from": "2023-01", "to": "2023-12"}},
    {"id": "empty-s004-toys-late-2023", "filters": {"from": "2023-07", "to": "2024-01", "store": "S004", "category": "Toys"}},
    {"id": "s001-furniture", "filters": {"store": "S001", "category": "Furniture"}},
    {"id": "p0012-s005", "filters": {"store": "S005", "product": "P0012"}},
]


def apply_filters(frame: pd.DataFrame, filters: dict) -> pd.DataFrame:
    subset = frame
    if filters.get("store"):
        subset = subset[subset["Store ID"] == filters["store"]]
    if filters.get("category"):
        subset = subset[subset["Category"] == filters["category"]]
    if filters.get("product"):
        subset = subset[subset["Product ID"] == filters["product"]]
    if filters.get("from"):
        subset = subset[subset["month"] >= pd.Period(filters["from"], freq="M")]
    if filters.get("to"):
        subset = subset[subset["month"] <= pd.Period(filters["to"], freq="M")]
    return subset


def write_reference(frame: pd.DataFrame) -> None:
    scenarios = []
    for scenario in SCENARIOS:
        subset = apply_filters(frame, scenario["filters"])
        pairs = pair_aggregates(subset)
        statuses = pairs["status"].value_counts().reindex(STATUS_ORDER, fill_value=0)

        by_category = (
            subset.groupby("Category", sort=True)["Units Sold"].sum().reset_index()
        )
        by_store = subset.groupby("Store ID", sort=True)["Units Sold"].sum().reset_index()

        entry = {
            "id": scenario["id"],
            "filters": scenario["filters"],
            "kpis": kpis(subset),
            "statusCounts": {status: int(statuses[status]) for status in STATUS_ORDER},
            "totalPairs": int(len(pairs)),
            "topCategory": ranked_top(by_category, "Units Sold", "Category"),
            "topStore": ranked_top(by_store, "Units Sold", "Store ID"),
        }
        if len(pairs) <= 25:
            entry["pairs"] = [
                {
                    "product": row["Product ID"],
                    "store": row["Store ID"],
                    "category": row["category"],
                    "avgInventory": round(float(row["avg_inventory"]), 6),
                    "avgDailyDemand": round(float(row["avg_daily_demand"]), 6),
                    "daysOfInventory": round(float(row["days_of_inventory"]), 6),
                    "status": row["status"],
                    "suggestedReorderQty": round(float(row["suggested_reorder_qty"]), 6),
                }
                for _, row in pairs.sort_values(["Store ID", "Product ID"]).iterrows()
            ]
        scenarios.append(entry)

    (OUT_DIR / "expected_reference.json").write_text(
        json.dumps({"scenarios": scenarios}, indent=2, allow_nan=False), encoding="utf-8"
    )


def print_summary(frame: pd.DataFrame, pairs: pd.DataFrame, payload: dict) -> None:
    summary = kpis(frame)
    counts = pairs["status"].value_counts().reindex(STATUS_ORDER, fill_value=0)
    print("Retail Inventory Intelligence - dataset build")
    print(f"  source            {SOURCE_CSV.name} ({len(frame):,} rows)")
    print(f"  window            {payload['meta']['dateRange']['start']} -> {payload['meta']['dateRange']['end']}")
    print(f"  product-stores    {len(pairs)} pairs across {frame['Store ID'].nunique()} stores")
    print(f"  units sold        {summary['unitsSold']:,}")
    print(f"  demand            {summary['demand']:,}")
    print(f"  units ordered     {summary['unitsOrdered']:,}")
    print(f"  avg inventory     {summary['avgInventory']:.2f}")
    print(f"  fulfillment rate  {summary['fulfillmentRate']:.2f}%")
    print("  status counts     " + ", ".join(f"{status}: {int(counts[status])}" for status in STATUS_ORDER))
    print(f"  payload           {len(payload['facts']['month']):,} month-pair facts -> data/dashboard-data.json")
    print(f"  reference cases   {len(SCENARIOS)} scenarios -> data/expected_reference.json")
    print("\nWrote: " + ", ".join(sorted(path.name for path in OUT_DIR.glob("*"))))


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    frame = load_source()
    months = month_dimension(frame)
    pairs = write_prepared_csvs(frame, months)
    payload = write_payload(frame, months, pairs)
    write_reference(frame)
    print_summary(frame, pairs, payload)


if __name__ == "__main__":
    main()
