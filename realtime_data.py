#!/usr/bin/env python3
"""
Real-time inventory monitoring and alerting system.
Monitors inventory file for low-stock conditions and logs alerts with timestamps.

Usage:
    python3 realtime_data.py          # Start monitoring
    python3 realtime_data.py report   # Generate one-time report
"""

import os
import time
from datetime import datetime

# Configuration
DATA_DIR = "data"
INVENTORY_FILE = os.path.join(DATA_DIR, "inventory.txt")
ALERT_FILE = os.path.join(DATA_DIR, "alerts.log")
LOW_STOCK_THRESHOLD = 10
CHECK_INTERVAL = 30  # seconds


def load_inventory():
    """Load inventory from text file."""
    inventory = {}
    if not os.path.exists(INVENTORY_FILE):
        return inventory
    
    try:
        with open(INVENTORY_FILE, 'r') as f:
            for line in f:
                parts = line.strip().split()
                if len(parts) >= 4:
                    product_id = parts[0]
                    name = parts[1]
                    price = float(parts[2])
                    quantity = int(parts[3])
                    inventory[product_id] = {
                        'name': name,
                        'price': price,
                        'quantity': quantity
                    }
    except Exception as e:
        print(f"Error reading inventory: {e}")
    
    return inventory


def log_alert(product_id, name, quantity):
    """Log a low-stock alert."""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    alert = f"[{timestamp}] LOW STOCK ALERT: {product_id} ({name}) - Quantity: {quantity}\n"
    
    try:
        with open(ALERT_FILE, 'a') as f:
            f.write(alert)
        print(alert.strip())
    except Exception as e:
        print(f"Error writing alert: {e}")


def monitor_inventory(threshold=LOW_STOCK_THRESHOLD):
    """Monitor inventory and alert on low stock."""
    print(f"Starting inventory monitor (threshold: {threshold} units)...")
    print(f"Checking every {CHECK_INTERVAL} seconds. Press Ctrl+C to stop.\n")
    
    previous_state = {}
    
    try:
        while True:
            inventory = load_inventory()
            
            # Check for new low-stock items
            for product_id, details in inventory.items():
                qty = details['quantity']
                name = details['name']
                
                # Alert if quantity dropped below threshold
                if qty < threshold:
                    prev_qty = previous_state.get(product_id, {}).get('quantity', qty)
                    if prev_qty >= threshold:  # Newly low stock
                        log_alert(product_id, name, qty)
            
            previous_state = inventory
            time.sleep(CHECK_INTERVAL)
    
    except KeyboardInterrupt:
        print("\nInventory monitor stopped.")


def generate_report():
    """Generate inventory report."""
    inventory = load_inventory()
    if not inventory:
        print("No inventory data found.")
        return
    
    print("\n" + "="*60)
    print("INVENTORY REPORT")
    print("="*60)
    print(f"{'ID':<10} {'Name':<15} {'Price':<10} {'Qty':<8} {'Status':<15}")
    print("-"*60)
    
    total_value = 0
    for product_id, details in inventory.items():
        qty = details['quantity']
        price = details['price']
        name = details['name'][:15]
        status = "LOW STOCK" if qty < LOW_STOCK_THRESHOLD else "OK"
        print(f"{product_id:<10} {name:<15} ${price:<9.2f} {qty:<8} {status:<15}")
        total_value += qty * price
    
    print("-"*60)
    print(f"Total Inventory Value: ${total_value:.2f}")
    print("="*60 + "\n")


if __name__ == '__main__':
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == 'report':
        generate_report()
    else:
        monitor_inventory()
