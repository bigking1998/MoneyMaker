#!/usr/bin/env python3
"""
Test script for MEXC integration with Freqtrade
"""
import os
import sys
import ccxt

# Add the app directory to Python path
sys.path.insert(0, '/app')

def test_mexc_ccxt():
    """Test MEXC using CCXT directly"""
    print("=== Testing MEXC with CCXT ===")
    
    mexc = ccxt.mexc({
        'apiKey': 'mx0vgla83yUOaxe700',
        'secret': 'd749ef4aeb594628b035d462b8d46bb0',
        'enableRateLimit': True,
    })
    
    try:
        # Test basic functionality
        markets = mexc.load_markets()
        print(f"✅ Markets loaded: {len(markets)} total")
        
        balance = mexc.fetch_balance()
        print("✅ Balance fetched successfully")
        
        ticker = mexc.fetch_ticker('BTC/USDT')
        print(f"✅ BTC/USDT ticker: ${ticker['last']}")
        
        orderbook = mexc.fetch_order_book('ETH/USDT', 5)
        print(f"✅ ETH/USDT orderbook: bid ${orderbook['bids'][0][0]}")
        
        return True
        
    except Exception as e:
        print(f"❌ CCXT test failed: {e}")
        return False

def test_mexc_exchange_class():
    """Test our MEXC Exchange class"""
    print("\n=== Testing MEXC Exchange Class ===")
    
    try:
        from freqtrade.exchange.mexc import Mexc
        
        # Create minimal config
        config = {
            'exchange': {
                'name': 'mexc',
                'key': 'mx0vgla83yUOaxe700',
                'secret': 'd749ef4aeb594628b035d462b8d46bb0',
                'ccxt_config': {'enableRateLimit': True}
            },
            'dry_run': True,
            'trading_mode': 'spot',
            'margin_mode': '',
        }
        
        # Test creating exchange instance
        mexc_exchange = Mexc(config, validate=False)
        print("✅ MEXC Exchange class instantiated")
        
        return True
        
    except Exception as e:
        print(f"❌ Exchange class test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_mexc_futures():
    """Test MEXC futures functionality"""
    print("\n=== Testing MEXC Futures ===")
    
    mexc = ccxt.mexc({
        'apiKey': 'mx0vgla83yUOaxe700',
        'secret': 'd749ef4aeb594628b035d462b8d46bb0',
        'enableRateLimit': True,
        'options': {'defaultType': 'swap'}
    })
    
    try:
        markets = mexc.load_markets()
        futures_markets = {k: v for k, v in markets.items() if v.get('swap', False)}
        print(f"✅ Futures markets: {len(futures_markets)}")
        
        # Test futures ticker
        ticker = mexc.fetch_ticker('BTC/USDT:USDT')
        print(f"✅ BTC/USDT:USDT futures ticker: ${ticker['last']}")
        
        return True
        
    except Exception as e:
        print(f"❌ Futures test failed: {e}")
        return False

def main():
    """Run all tests"""
    print("Starting MEXC Integration Tests...\n")
    
    tests = [
        test_mexc_ccxt,
        test_mexc_exchange_class,
        test_mexc_futures,
    ]
    
    passed = 0
    total = len(tests)
    
    for test in tests:
        try:
            if test():
                passed += 1
        except Exception as e:
            print(f"❌ Test {test.__name__} failed with exception: {e}")
    
    print(f"\n=== Test Results: {passed}/{total} passed ===")
    
    if passed == total:
        print("🎉 All MEXC tests PASSED!")
        
        print("\n=== Next Steps ===")
        print("✅ MEXC spot trading integration complete")
        print("✅ MEXC futures support available")
        print("✅ Ready for Phase 1 testing")
        print("\nTo test with Freqtrade commands:")
        print("1. Use the config file: /app/mexc_test_config.json")
        print("2. Run: python3 -m freqtrade trade --config mexc_test_config.json --dry-run")
        
        return True
    else:
        print("❌ Some tests failed. Please check the errors above.")
        return False

if __name__ == "__main__":
    main()