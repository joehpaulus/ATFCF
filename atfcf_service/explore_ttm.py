import yfinance as yf

# Test with WIT ticker
ticker = yf.Ticker("WIT")

print("=== Exploring TTM Data Sources ===")

# Method 1: Check if there's a TTM method
print("\n1. Available methods on ticker object:")
methods = [method for method in dir(ticker) if not method.startswith('_')]
print("Methods:", methods[:20])  # First 20 methods

# Method 2: Check if there's a get_ttm method
print("\n2. Looking for TTM-specific methods:")
ttm_methods = [method for method in methods if 'ttm' in method.lower()]
print("TTM methods:", ttm_methods)

# Method 3: Check if quarterly data has more columns (maybe TTM is included)
print("\n3. Full quarterly data columns:")
qcf = ticker.quarterly_cashflow
print("All quarterly columns:", list(qcf.columns))
print("Quarterly data shape:", qcf.shape)

# Method 4: Check if there's a different financial data method
print("\n4. Checking other financial data methods:")
try:
    # Some tickers have different methods
    if hasattr(ticker, 'get_financials'):
        print("get_financials method exists")
    if hasattr(ticker, 'get_cashflow'):
        print("get_cashflow method exists")
    if hasattr(ticker, 'get_income_stmt'):
        print("get_income_stmt method exists")
except Exception as e:
    print(f"Error checking methods: {e}")

# Method 5: Check if quarterly data includes TTM as last column
print("\n5. Checking if quarterly data includes TTM:")
print("Quarterly cash flow data:")
print(qcf.head())

# Method 6: Check if there's a way to get current TTM
print("\n6. Current date and fiscal year info:")
import datetime
now = datetime.datetime.now()
print(f"Current date: {now}")
print(f"Current fiscal year end: {now.year}-03-31")
print(f"Previous fiscal year end: {now.year-1}-03-31")
