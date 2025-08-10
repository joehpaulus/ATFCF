from flask import Flask, request, jsonify
import yfinance as yf
import time
from functools import lru_cache

app = Flask(__name__)

# Cache for yfinance data to avoid repeated API calls
@lru_cache(maxsize=1000)
def get_ticker_data(ticker):
    return yf.Ticker(ticker)

def calculate_atfcf(ticker):
    try:
        t = get_ticker_data(ticker)
        
        # Get annual data which includes TTM values (more accurate than summing quarters)
        cf = t.cashflow
        income = t.financials
        
        if cf.empty or income.empty:
            print(f"No data available for {ticker}")
            return None

        try:
            # Get TTM values from annual cash flow statement (first column is most recent TTM)
            ocf_ttm = cf.loc['Operating Cash Flow'].iloc[0]
            fcf_ttm = cf.loc['Free Cash Flow'].iloc[0]
            capex_ttm = cf.loc['Capital Expenditure'].iloc[0]
            da_ttm = cf.loc['Depreciation And Amortization'].iloc[0]
            delta_wc_ttm = cf.loc['Change In Working Capital'].iloc[0]
            
            # Get TTM values from annual income statement (first column is most recent TTM)
            ebit_ttm = income.loc['EBIT'].iloc[0]
            tax_provision_ttm = income.loc['Tax Provision'].iloc[0]
            
            # Print the key metrics for verification
            print(f"\n=== {ticker} Metrics ===")
            print(f"FCF (TTM): ${fcf_ttm:,.0f}")
            print(f"EBIT (TTM): ${ebit_ttm:,.0f}")
            print(f"Tax Provision (TTM): ${tax_provision_ttm:,.0f}")
            print(f"Tax Rate: {tax_provision_ttm/ebit_ttm:.2%}")
            print(f"ATFCF: ${fcf_ttm - (ebit_ttm * (tax_provision_ttm/ebit_ttm)):,.0f}")
            print("=" * 30)
            
        except KeyError as e:
            print(f"Missing required data for {ticker}: {e}")
            return None
        
        # Check if EBIT is valid (positive)
        if ebit_ttm <= 0:
            print(f"EBIT is {ebit_ttm} for {ticker}, ATFCF cannot be calculated")
            return None
        
        # Calculate actual tax rate
        tax_rate = tax_provision_ttm / ebit_ttm
        
        # Calculate ATFCF using the formula: ATFCF = FCF - (EBIT x tax rate)
        atfcf = fcf_ttm - (ebit_ttm * tax_rate)
        
        return {
            'atfcf': atfcf,
            'fcf': fcf_ttm,
            'ebit': ebit_ttm,
            'tax_rate': tax_rate,
            'tax_provision': tax_provision_ttm,
            'ocf': ocf_ttm,
            'capex': capex_ttm,
            'da': da_ttm,
            'delta_wc': delta_wc_ttm
        }
        
    except Exception as e:
        print(f"Error calculating TTM ATFCF for {ticker}: {e}")
        return None

@app.route('/atfcf', methods=['GET'])
def get_atfcf():
    ticker = request.args.get('ticker')
    if not ticker:
        return jsonify({'error': 'No ticker provided'}), 400
    
    result = calculate_atfcf(ticker)
    if result is None:
        return jsonify({'error': 'Could not calculate ATFCF for ticker'}), 404
    
    return jsonify({
        'ticker': ticker,
        'atfcf': result['atfcf'],
        'fcf': result['fcf'],
        'ebit': result['ebit'],
        'tax_rate': result['tax_rate'],
        'tax_provision': result['tax_provision'],
        'ocf': result['ocf'],
        'capex': result['capex'],
        'da': result['da'],
        'delta_wc': result['delta_wc']
    })

if __name__ == '__main__':
    app.run(port=5001)