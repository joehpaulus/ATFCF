import yfinance as yf

# Test with WIT ticker
ticker = yf.Ticker("WIT")

print("=== Testing TTM Methods ===")

# Test TTM cash flow
print("\n1. TTM Cash Flow:")
try:
    ttm_cf = ticker.ttm_cashflow
    print("TTM Cash Flow data:")
    print(ttm_cf.head())
    
    if 'Free Cash Flow' in ttm_cf.index:
        fcf_ttm = ttm_cf.loc['Free Cash Flow'].iloc[0]
        print(f"\nFCF (TTM): ${fcf_ttm:,.0f}")
    if 'Operating Cash Flow' in ttm_cf.index:
        ocf_ttm = ttm_cf.loc['Operating Cash Flow'].iloc[0]
        print(f"OCF (TTM): ${ocf_ttm:,.0f}")
        
except Exception as e:
    print(f"Error with ttm_cashflow: {e}")

# Test TTM financials/income statement
print("\n2. TTM Financials:")
try:
    ttm_income = ticker.ttm_financials
    print("TTM Financials data:")
    print(ttm_income.head())
    
    if 'EBIT' in ttm_income.index:
        ebit_ttm = ttm_income.loc['EBIT'].iloc[0]
        print(f"\nEBIT (TTM): ${ebit_ttm:,.0f}")
    if 'Tax Provision' in ttm_income.index:
        tax_ttm = ttm_income.loc['Tax Provision'].iloc[0]
        print(f"Tax Provision (TTM): ${tax_ttm:,.0f}")
        
except Exception as e:
    print(f"Error with ttm_financials: {e}")

# Test alternative TTM method names
print("\n3. Alternative TTM methods:")
try:
    ttm_cf_alt = ticker.ttm_cash_flow
    print("ttm_cash_flow method works")
except Exception as e:
    print(f"ttm_cash_flow error: {e}")

try:
    ttm_income_alt = ticker.ttm_income_stmt
    print("ttm_income_stmt method works")
except Exception as e:
    print(f"ttm_income_stmt error: {e}")

# Compare with previous results
print("\n4. Comparison:")
print("Previous quarterly sum FCF: $115,708,000,000")
print("Previous annual data FCF: $154,389,000,000")
print("New TTM method FCF: See above")
