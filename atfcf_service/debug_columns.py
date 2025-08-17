import yfinance as yf

# Test with WIT ticker
ticker = yf.Ticker("WIT")

print("=== Column Analysis for WIT ===")

# Check cash flow columns
print("\n1. Cash Flow Columns:")
cf = ticker.cashflow
print("Column names:", list(cf.columns))
print("Column types:", cf.dtypes)
print("\nFirst few rows:")
print(cf.head())

# Check income statement columns  
print("\n2. Income Statement Columns:")
income = ticker.financials
print("Column names:", list(income.columns))
print("Column types:", income.dtypes)
print("\nFirst few rows:")
print(income.head())

# Check if there's a TTM column specifically
print("\n3. Looking for TTM column:")
for col in cf.columns:
    if 'TTM' in str(col) or 'ttm' in str(col).lower():
        print(f"Found TTM column: {col}")

# Check quarterly data structure
print("\n4. Quarterly Data Structure:")
qcf = ticker.quarterly_cashflow
print("Quarterly columns:", list(qcf.columns))
print("Quarterly data shape:", qcf.shape)
