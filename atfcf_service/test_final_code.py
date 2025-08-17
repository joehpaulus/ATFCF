from atfcf_service import calculate_atfcf

# Test the final updated code with WIT
result = calculate_atfcf("WIT")

if result:
    print(f"\n=== Final Results for WIT ===")
    print(f"ATFCF: ${result['atfcf']:,.0f}")
    print(f"FCF: ${result['fcf']:,.0f}")
    print(f"EBIT: ${result['ebit']:,.0f}")
    print(f"Tax Rate: {result['tax_rate']:.2%}")
    print(f"Tax Provision: ${result['tax_provision']:,.0f}")
    print(f"Operating Cash Flow: ${result['ocf']:,.0f}")
    print(f"Capital Expenditure: ${result['capex']:,.0f}")
    print(f"Depreciation & Amortization: ${result['da']:,.0f}")
    print(f"Change in Working Capital: ${result['delta_wc']:,.0f}")
    
    # Verify the calculation
    calculated_atfcf = result['fcf'] - (result['ebit'] * result['tax_rate'])
    print(f"\nVerification:")
    print(f"ATFCF = FCF - (EBIT × Tax Rate)")
    print(f"ATFCF = ${result['fcf']:,.0f} - (${result['ebit']:,.0f} × {result['tax_rate']:.2%})")
    print(f"ATFCF = ${calculated_atfcf:,.0f}")
    
else:
    print("Failed to calculate ATFCF for WIT")
