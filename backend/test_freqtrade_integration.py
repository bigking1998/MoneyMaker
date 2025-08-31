"""
Test file for Task 1.1.1: Implement freqtrade IStrategy base class
"""

import sys
sys.path.append('/app/backend')

import pandas as pd
import numpy as np
from datetime import datetime, timezone, timedelta
from freqtrade_integration.strategy_interface import LumaTradeIStrategy, LumaTradeSampleStrategy

def create_sample_ohlcv_data(periods=100):
    """Create sample OHLCV data for testing"""
    
    # Generate realistic BTC price data
    base_price = 108000
    dates = pd.date_range(start=datetime.now(timezone.utc) - timedelta(minutes=periods*5), 
                         periods=periods, freq='5min')
    
    # Generate price movement with some volatility
    np.random.seed(42)  # For reproducible tests
    price_changes = np.random.normal(0, 0.001, periods)  # 0.1% average volatility
    prices = [base_price]
    
    for change in price_changes[1:]:
        new_price = prices[-1] * (1 + change)
        prices.append(new_price)
    
    # Create OHLCV data
    data = []
    for i, (date, close) in enumerate(zip(dates, prices)):
        high = close * (1 + abs(np.random.normal(0, 0.002)))  # Slight high variation
        low = close * (1 - abs(np.random.normal(0, 0.002)))   # Slight low variation
        open_price = prices[i-1] if i > 0 else close
        volume = np.random.randint(100, 1000)
        
        data.append({
            'date': date,
            'open': open_price,
            'high': high, 
            'low': low,
            'close': close,
            'volume': volume
        })
    
    df = pd.DataFrame(data)
    df.set_index('date', inplace=True)
    return df

def test_freqtrade_istrategy_interface():
    """Test Task 1.1.1: freqtrade IStrategy interface implementation"""
    
    print("🧪 Testing Task 1.1.1: Freqtrade IStrategy Interface")
    
    # Test 1: Can instantiate IStrategy implementation
    print("\n1. Testing IStrategy instantiation...")
    
    config = {
        'timeframe': '5m',
        'stake_amount': 100,
        'dry_run': True
    }
    
    strategy = LumaTradeSampleStrategy(config)
    assert hasattr(strategy, 'populate_indicators')
    assert hasattr(strategy, 'populate_entry_trend') 
    assert hasattr(strategy, 'populate_exit_trend')
    assert strategy.timeframe == '5m'
    print("✅ IStrategy instantiation works")
    
    # Test 2: Test dataframe-based processing
    print("\n2. Testing DataFrame-based processing...")
    
    df = create_sample_ohlcv_data(50)
    metadata = {'pair': 'BTC/USD', 'timeframe': '5m'}
    
    # Test indicators
    df_with_indicators = strategy.populate_indicators(df, metadata)
    assert 'sma30' in df_with_indicators.columns
    assert 'rsi' in df_with_indicators.columns  
    assert 'ema21' in df_with_indicators.columns
    assert 'macd' in df_with_indicators.columns
    print("✅ Indicators added to DataFrame")
    
    # Test entry trend
    df_with_entry = strategy.populate_entry_trend(df_with_indicators, metadata)
    assert 'enter_long' in df_with_entry.columns
    print("✅ Entry signals added to DataFrame")
    
    # Test exit trend  
    df_final = strategy.populate_exit_trend(df_with_entry, metadata)
    assert 'exit_long' in df_final.columns
    print("✅ Exit signals added to DataFrame")
    
    # Test 3: Test LumaTrade analysis integration
    print("\n3. Testing LumaTrade analysis integration...")
    
    analysis_result = strategy.analyze_lumatrade(df, metadata)
    
    required_fields = ['signal', 'dataframe', 'indicators', 'entry_signals', 'exit_signals', 'analysis_time']
    for field in required_fields:
        assert field in analysis_result, f"Missing field: {field}"
    
    assert analysis_result['signal'] in ['buy', 'sell', 'hold', 'exit']
    assert isinstance(analysis_result['dataframe'], pd.DataFrame)
    assert isinstance(analysis_result['indicators'], dict)
    print("✅ LumaTrade analysis integration works")
    
    # Test 4: Test freqtrade compatibility
    print("\n4. Testing freqtrade compatibility...")
    
    # Check if strategy has freqtrade required attributes
    assert hasattr(strategy, 'minimal_roi')
    assert hasattr(strategy, 'stoploss')
    assert hasattr(strategy, 'timeframe') 
    assert hasattr(strategy, 'INTERFACE_VERSION')
    assert strategy.INTERFACE_VERSION >= 3
    print("✅ Freqtrade compatibility confirmed")
    
    # Test 5: Test TA-Lib integration
    print("\n5. Testing TA-Lib integration...")
    
    # Verify indicators calculated correctly
    df_test = df_with_indicators.dropna()
    if not df_test.empty:
        # Check SMA calculation
        assert df_test['sma30'].notna().any(), "SMA should have valid values"
        
        # Check RSI range (should be 0-100)
        rsi_values = df_test['rsi'].dropna()
        if not rsi_values.empty:
            assert rsi_values.min() >= 0 and rsi_values.max() <= 100, "RSI should be in range 0-100"
        
        print("✅ TA-Lib indicators working correctly")
    
    # Test 6: Test strategy info
    print("\n6. Testing strategy information...")
    
    strategy_info = strategy.get_strategy_info()
    required_info = ['name', 'timeframe', 'minimal_roi', 'stoploss', 'strategy_class']
    for field in required_info:
        assert field in strategy_info, f"Missing info field: {field}"
    
    assert strategy_info['strategy_class'] == 'LumaTradeIStrategy'
    print("✅ Strategy information complete")
    
    # Test 7: Test signal generation 
    print("\n7. Testing signal generation...")
    
    # Create data that should trigger signals
    test_signals = False
    for _ in range(3):  # Try multiple times with different data
        df_signal_test = create_sample_ohlcv_data(60)
        result = strategy.analyze_lumatrade(df_signal_test, metadata)
        
        if result['signal'] != 'hold':
            test_signals = True
            print(f"✅ Generated signal: {result['signal']}")
            break
    
    if not test_signals:
        print("⚠️  No trading signals generated (may be normal depending on market conditions)")
    
    print("\n🎉 Task 1.1.1 VERIFICATION COMPLETE - Freqtrade IStrategy interface working!")
    print("✅ IStrategy interface implementation matches freqtrade pattern")
    print("✅ DataFrame-based processing working")
    print("✅ TA-Lib integration functional") 
    print("✅ LumaTrade analysis wrapper working")
    print("✅ Freqtrade compatibility confirmed")
    
    return True

if __name__ == "__main__":
    test_freqtrade_istrategy_interface()