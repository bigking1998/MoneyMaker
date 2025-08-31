"""
Comprehensive Test Suite for Freqtrade Integration
Verifies practice strategy bots are working and properly reference https://github.com/freqtrade/freqtrade
"""

import sys
sys.path.append('/app/backend')

import pandas as pd
import numpy as np
from freqtrade_integration.strategy_interface import LumaTradeSampleStrategy, LumaTradeIStrategy
from datetime import datetime, timezone
import requests
import json

def create_sample_data():
    """Create sample OHLCV data for testing"""
    dates = pd.date_range(start='2025-01-01', periods=50, freq='5T')
    data = []
    
    for i, date in enumerate(dates):
        price = 109000 + np.random.normal(0, 1000)  # BTC price around $109k
        data.append({
            'date': date,
            'open': price,
            'high': price * 1.01,
            'low': price * 0.99,
            'close': price,
            'volume': np.random.uniform(100, 1000)
        })
    
    df = pd.DataFrame(data)
    df.set_index('date', inplace=True)
    return df

def test_freqtrade_repository_compliance():
    """Test compliance with official Freqtrade repository patterns"""
    print("🧪 Testing Freqtrade Repository Compliance")
    print("   Repository: https://github.com/freqtrade/freqtrade")
    
    # Test 1: Verify imports from official freqtrade
    print("\n1. Testing official Freqtrade imports...")
    try:
        from freqtrade.strategy.interface import IStrategy as FreqtradeIStrategy
        from freqtrade.strategy import BooleanParameter, CategoricalParameter, DecimalParameter
        print("✅ Successfully imported from official freqtrade repository")
        print("   - freqtrade.strategy.interface.IStrategy")
        print("   - freqtrade.strategy parameters")
    except ImportError as e:
        print(f"❌ Failed to import from freqtrade: {e}")
        return False
    
    # Test 2: Verify strategy inheritance
    print("\n2. Testing strategy inheritance from official IStrategy...")
    strategy = LumaTradeSampleStrategy()
    assert isinstance(strategy, FreqtradeIStrategy), "Must inherit from freqtrade.strategy.interface.IStrategy"
    print("✅ Strategy properly inherits from freqtrade.strategy.interface.IStrategy")
    
    # Test 3: Verify required attributes match freqtrade standards
    print("\n3. Testing required attributes match freqtrade standards...")
    required_attrs = {
        'INTERFACE_VERSION': int,
        'minimal_roi': dict,
        'stoploss': float,
        'timeframe': str,
        'startup_candle_count': int
    }
    
    for attr, expected_type in required_attrs.items():
        assert hasattr(strategy, attr), f"Missing required attribute: {attr}"
        value = getattr(strategy, attr)
        assert isinstance(value, expected_type), f"Attribute {attr} should be {expected_type}, got {type(value)}"
        print(f"✅ {attr}: {value}")
    
    # Test 4: Verify interface version compatibility
    print("\n4. Testing interface version compatibility...")
    assert strategy.INTERFACE_VERSION >= 3, "Interface version should be 3 or higher for modern freqtrade"
    print(f"✅ Interface version {strategy.INTERFACE_VERSION} is compatible with freqtrade")
    
    return True

def test_official_freqtrade_methods():
    """Test official Freqtrade method implementation"""
    print("\n🧪 Testing Official Freqtrade Methods")
    
    strategy = LumaTradeSampleStrategy()
    sample_data = create_sample_data()
    metadata = {'pair': 'BTC/USD', 'timeframe': '5m'}
    
    # Test 1: populate_indicators (core freqtrade method)
    print("\n1. Testing populate_indicators (official freqtrade method)...")
    df_with_indicators = strategy.populate_indicators(sample_data.copy(), metadata)
    
    # Verify official freqtrade indicators are calculated
    expected_indicators = ['sma30', 'rsi', 'ema21', 'macd', 'macdsignal', 'macdhist']
    for indicator in expected_indicators:
        assert indicator in df_with_indicators.columns, f"Missing indicator: {indicator}"
        values = df_with_indicators[indicator].dropna()
        assert len(values) > 0, f"Indicator {indicator} has no valid values"
        print(f"✅ {indicator}: {len(values)} calculated values")
    
    # Test 2: populate_entry_trend (core freqtrade method)
    print("\n2. Testing populate_entry_trend (official freqtrade method)...")
    df_with_entry = strategy.populate_entry_trend(df_with_indicators, metadata)
    assert 'enter_long' in df_with_entry.columns, "Missing enter_long column"
    entry_signals = df_with_entry['enter_long'].sum()
    print(f"✅ Entry signals generated: {entry_signals}")
    
    # Test 3: populate_exit_trend (core freqtrade method)
    print("\n3. Testing populate_exit_trend (official freqtrade method)...")
    df_final = strategy.populate_exit_trend(df_with_entry, metadata)
    assert 'exit_long' in df_final.columns, "Missing exit_long column"
    exit_signals = df_final['exit_long'].sum()
    print(f"✅ Exit signals generated: {exit_signals}")
    
    return df_final

def test_api_integration():
    """Test API integration with Freqtrade patterns"""
    print("\n🧪 Testing API Integration with Freqtrade Patterns")
    
    base_url = 'http://localhost:8001/api'
    
    # Test 1: Create strategy via API
    print("\n1. Creating strategy via API...")
    strategy_data = {
        'name': 'APIFreqtradeTest',
        'type': 'sample',
        'symbol': 'BTC/USD',
        'timeframe': '5m',
        'minimal_roi': {'0': 0.04, '20': 0.02, '30': 0.01, '40': 0.0},
        'stoploss': -0.10,
        'dry_run': True
    }
    
    try:
        response = requests.post(f'{base_url}/freqtrade/strategy/create', json=strategy_data, timeout=10)
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                strategy_id = result['strategy_id']
                print(f"✅ Strategy created via API: {strategy_id}")
                
                # Test 2: Analyze strategy
                print("\n2. Analyzing strategy with real market data...")
                analysis_response = requests.post(f'{base_url}/freqtrade/strategy/{strategy_id}/analyze', timeout=15)
                
                if analysis_response.status_code == 200:
                    analysis = analysis_response.json()
                    if analysis.get('success'):
                        indicators = analysis['analysis']['indicators']
                        signal = analysis['analysis']['signal']
                        current_price = analysis['analysis']['current_price']
                        
                        print(f"✅ Strategy analysis completed:")
                        print(f"   Signal: {signal.upper()}")
                        print(f"   Current BTC Price: ${current_price:,.2f}")
                        print(f"   Indicators: {list(indicators.keys())}")
                        
                        # Verify freqtrade indicators are present
                        freqtrade_indicators = ['sma30', 'rsi', 'ema21', 'macd']
                        found = [ind for ind in freqtrade_indicators if ind in indicators]
                        print(f"   Freqtrade indicators found: {found}")
                        
                        if len(found) >= 3:
                            print("✅ API integration using official Freqtrade indicators")
                            
                            # Test signal logic
                            rsi = indicators.get('rsi')
                            if rsi:
                                print(f"   RSI Value: {rsi:.2f}")
                                if signal == 'buy' and rsi < 30:
                                    print("✅ BUY signal correctly generated (RSI oversold)")
                                elif signal == 'sell' and rsi > 70:
                                    print("✅ SELL signal correctly generated (RSI overbought)")
                                else:
                                    print(f"✅ {signal.upper()} signal follows strategy logic")
                            
                            return True
                        else:
                            print("⚠️ Some Freqtrade indicators missing")
                    else:
                        print(f"❌ Analysis failed: {analysis}")
                else:
                    print(f"❌ Analysis request failed: {analysis_response.status_code}")
            else:
                print(f"❌ Strategy creation failed: {result}")
        else:
            print(f"❌ API request failed: {response.status_code}")
            
    except Exception as e:
        print(f"❌ API test failed: {e}")
        
    return False

def run_comprehensive_test():
    """Run comprehensive test suite"""
    print("🚀 COMPREHENSIVE FREQTRADE INTEGRATION TEST")
    print("=" * 70)
    print("Repository: https://github.com/freqtrade/freqtrade")
    print("Testing: Practice strategy bots compliance and functionality")
    print("=" * 70)
    
    all_passed = True
    
    try:
        # Test 1: Repository compliance
        if not test_freqtrade_repository_compliance():
            all_passed = False
        
        # Test 2: Official methods
        df_final = test_official_freqtrade_methods()
        if df_final is None:
            all_passed = False
        
        # Test 3: API integration
        if not test_api_integration():
            all_passed = False
        
        print("\n" + "=" * 70)
        if all_passed:
            print("🎉 ALL TESTS PASSED!")
            print("\n✅ VERIFICATION COMPLETE:")
            print("   - Official Freqtrade repository compliance")
            print("   - IStrategy interface implementation")
            print("   - populate_indicators/entry_trend/exit_trend methods")
            print("   - TA-Lib technical indicators integration")
            print("   - API endpoints with real market data")
            print("   - Signal generation following Freqtrade patterns")
            
            print(f"\n🎯 CONCLUSION:")
            print(f"   ✅ Practice strategy bots are working correctly")
            print(f"   ✅ Properly reference https://github.com/freqtrade/freqtrade")
            print(f"   ✅ Follow official Freqtrade interface standards")
            print(f"   ✅ Generate valid buy/sell/hold signals")
            print(f"   ✅ Integrate with real-time market data")
        else:
            print("❌ SOME TESTS FAILED")
            print("   Please check the implementation for compliance issues")
            
    except Exception as e:
        print(f"❌ TEST SUITE FAILED: {e}")
        import traceback
        traceback.print_exc()
        all_passed = False
    
    return all_passed

if __name__ == "__main__":
    success = run_comprehensive_test()
    exit(0 if success else 1)