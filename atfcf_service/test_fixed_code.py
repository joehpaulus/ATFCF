from atfcf_service import calculate_atfcf

# Test the fixed code with WIT
result = calculate_atfcf("WIT")

if result:
    print(f"\n=== Results for WIT ===")
    print(f"ATFCF: ${result['atfcf']:,.0f}")
    print(f"FCF: ${result['fcf']:,.0f}")
    print(f"EBIT: ${result['ebit']:,.0f}")
    print(f"Tax Rate: {result['tax_rate']:.2%}")
    print(f"Tax Provision: ${result['tax_provision']:,.0f}")
else:
    print("Failed to calculate ATFCF for WIT") 