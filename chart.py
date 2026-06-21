#!/usr/bin/env python3
"""
chart.py — Terminal Spending Analytics Helper
Fulfills the backend/offline script requirements for ExpenseFlow.
This utility analyzes expense records and renders an ASCII representation
of spending trends directly to the console.
"""

import sys
import json
from datetime import datetime

# Sample data fallback if no input file is provided
DEFAULT_DATA = [
    {"tag_name": "groceries", "amount": 4200, "expense_date": "2026-06-15", "payment_type": "UPI"},
    {"tag_name": "rent", "amount": 15000, "expense_date": "2026-06-01", "payment_type": "CARD"},
    {"tag_name": "travel", "amount": 2800, "expense_date": "2026-06-18", "payment_type": "CASH"},
    {"tag_name": "food", "amount": 1800, "expense_date": "2026-06-20", "payment_type": "UPI"},
    {"tag_name": "groceries", "amount": 2500, "expense_date": "2026-06-05", "payment_type": "CASH"},
    {"tag_name": "entertainment", "amount": 3500, "expense_date": "2026-06-10", "payment_type": "CARD"},
]

def load_data(filepath=None):
    if not filepath:
        return DEFAULT_DATA
    try:
        with open(filepath, 'r') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading {filepath}: {e}. Using sample data instead.")
        return DEFAULT_DATA

def generate_ascii_chart(data):
    # Group spending by tag
    tag_totals = {}
    total_spent = 0
    for item in data:
        tag = item.get("tag_name", "other").lower()
        amt = float(item.get("amount", 0))
        tag_totals[tag] = tag_totals.get(tag, 0.0) + amt
        total_spent += amt

    if total_spent == 0:
        print("No outflow values logged.")
        return

    print("\n" + "=" * 54)
    print("           EXPENSEFLOW TERMINAL ANALYTICS")
    print("=" * 54)
    print(f"Total Logged Outflow: Rs. {total_spent:,.2f}")
    print("-" * 54)

    # Sort tags by spending desc
    sorted_tags = sorted(tag_totals.items(), key=lambda x: x[1], reverse=True)
    
    max_label_len = max(len(tag) for tag, _ in sorted_tags) if sorted_tags else 10
    max_bar_width = 30

    for tag, amt in sorted_tags:
        pct = amt / total_spent
        bar_len = int(pct * max_bar_width)
        bar = "█" * bar_len + "░" * (max_bar_width - bar_len)
        label = tag.ljust(max_label_len)
        print(f" {label} | {bar} | Rs. {amt:8,.2f} ({pct*100:5.1f}%)")
    
    print("=" * 54 + "\n")

if __name__ == "__main__":
    path = sys.argv[1] if len(sys.argv) > 1 else None
    if path in ("-h", "--help"):
        print("Usage: python chart.py [path_to_expenses_json]")
        print("Analyzes expense datasets and renders an ASCII breakdown in console.")
    else:
        dataset = load_data(path)
        generate_ascii_chart(dataset)
