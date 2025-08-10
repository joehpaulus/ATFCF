import yfinance as yf

# Test with WIT ticker
ticker = yf.Ticker("WIT")

print("=== Available Data for WIT ===")

# Check if TTM data is available directly
print("\n1. Annual Cash Flow Statement:")
try:
    cf = ticker.cashflow
    print("Annual Cash Flow (includes TTM):")
    print(cf.head())
    
    # Check for specific metrics
    if 'Free Cash Flow' in cf.index:
        print(f"\nFree Cash Flow (TTM): ${cf.loc['Free Cash Flow'].iloc[0]:,.0f}")
    if 'Operating Cash Flow' in cf.index:
        print(f"Operating Cash Flow (TTM): ${cf.loc['Operating Cash Flow'].iloc[0]:,.0f}")
    if 'Capital Expenditure' in cf.index:
        print(f"Capital Expenditure (TTM): ${cf.loc['Capital Expenditure'].iloc[0]:,.0f}")
        
except Exception as e:
    print(f"Error getting cashflow: {e}")

print("\n2. Annual Income Statement:")
try:
    income = ticker.financials
    print("Annual Income Statement (includes TTM):")
    print(income.head())
    
    # Check for specific metrics
    if 'EBIT' in income.index:
        print(f"\nEBIT (TTM): ${income.loc['EBIT'].iloc[0]:,.0f}")
    if 'Tax Provision' in income.index:
        print(f"Tax Provision (TTM): ${income.loc['Tax Provision'].iloc[0]:,.0f}")
    if 'Income Tax Expense' in income.index:
        print(f"Income Tax Expense (TTM): ${income.loc['Income Tax Expense'].iloc[0]:,.0f}")
        
except Exception as e:
    print(f"Error getting financials: {e}")

print("\n3. Quarterly Data (for comparison):")
try:
    qcf = ticker.quarterly_cashflow
    print("Quarterly Cash Flow:")
    print(qcf.head())
    
    # Sum last 4 quarters for comparison
    if 'Free Cash Flow' in qcf.index:
        fcf_ttm_sum = qcf.loc['Free Cash Flow'][:4].sum()
        print(f"\nFCF (TTM sum of 4 quarters): ${fcf_ttm_sum:,.0f}")
        
except Exception as e:
    print(f"Error getting quarterly cashflow: {e}")

try:
    qincome = ticker.quarterly_financials
    print("Quarterly Income Statement:")
    print(qincome.head())
    
    # Sum last 4 quarters for comparison
    if 'EBIT' in qincome.index:
        ebit_ttm_sum = qincome.loc['EBIT'][:4].sum()
        print(f"\nEBIT (TTM sum of 4 quarters): ${ebit_ttm_sum:,.0f}")
    if 'Tax Provision' in qincome.index:
        tax_ttm_sum = qincome.loc['Tax Provision'][:4].sum()
        print(f"Tax Provision (TTM sum of 4 quarters): ${tax_ttm_sum:,.0f}")
        
except Exception as e:
    print(f"Error getting quarterly financials: {e}")

print("\n4. Info:")
try:
    info = ticker.info
    print("Company Info keys:")
    print(list(info.keys())[:20])  # First 20 keys
except Exception as e:
    print(f"Error getting info: {e}") 