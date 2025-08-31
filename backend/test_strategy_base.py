"""
Test file for Task 1.1.1: Create base Strategy class/interface
"""

import sys
sys.path.append('/app/backend')

from trading.base_strategy import BaseStrategy, StrategyConfig, TradeSignal, StrategyStatus
from typing import Dict, Any

class TestStrategy(BaseStrategy):
    """Test implementation of BaseStrategy for verification"""
    
    def analyze(self, market_data: Dict[str, Any]) -> TradeSignal:
        """Simple test analysis: buy if price > 100000, sell if < 50000, hold otherwise"""
        price = market_data.get('price', 0)
        if price > 100000:
            return TradeSignal.BUY
        elif price < 50000:
            return TradeSignal.SELL
        else:
            return TradeSignal.HOLD
    
    def get_strategy_specific_info(self) -> Dict[str, Any]:
        """Return test strategy specific info"""
        return {
            'test_parameter': 'test_value',
            'analysis_count': getattr(self, 'analysis_count', 0)
        }

def test_task_1_1_1():
    """Test Task 1.1.1: Create base Strategy class/interface"""
    
    print("🧪 Testing Task 1.1.1: Base Strategy Class")
    
    # Test 1: Can create StrategyConfig
    print("\n1. Testing StrategyConfig creation...")
    config = StrategyConfig(name="Test Strategy", symbol="BTC/USD", test_param=123)
    assert config.name == "Test Strategy"
    assert config.symbol == "BTC/USD"
    assert config.custom_params['test_param'] == 123
    print("✅ StrategyConfig creation works")
    
    # Test 2: Can instantiate concrete strategy class
    print("\n2. Testing strategy instantiation...")
    strategy = TestStrategy(config)
    assert strategy.get_name() == "Test Strategy"
    assert strategy.get_symbol() == "BTC/USD"
    assert strategy.get_status() == StrategyStatus.STOPPED
    assert strategy.get_id() is not None
    print(f"✅ Strategy instantiated: {strategy}")
    
    # Test 3: All abstract methods are implemented
    print("\n3. Testing abstract method implementation...")
    market_data = {'price': 110000, 'volume': 1000}
    signal = strategy.analyze(market_data)
    assert signal == TradeSignal.BUY  # Price > 100000
    info = strategy.get_strategy_specific_info()
    assert 'test_parameter' in info
    print("✅ Abstract methods work correctly")
    
    # Test 4: Strategy lifecycle methods work
    print("\n4. Testing lifecycle methods...")
    
    # Test start
    strategy.start()
    assert strategy.get_status() == StrategyStatus.RUNNING
    assert strategy.started_at is not None
    print("✅ Strategy start works")
    
    # Test market analysis while running
    signal = strategy.analyze_market_data({'price': 30000})
    assert signal == TradeSignal.SELL  # Price < 50000
    assert strategy.last_signal == TradeSignal.SELL
    print("✅ Market analysis while running works")
    
    # Test pause
    strategy.pause()
    assert strategy.get_status() == StrategyStatus.PAUSED
    print("✅ Strategy pause works")
    
    # Test resume
    strategy.resume()
    assert strategy.get_status() == StrategyStatus.RUNNING
    print("✅ Strategy resume works")
    
    # Test stop
    prev_status = strategy.stop()
    assert strategy.get_status() == StrategyStatus.STOPPED
    assert strategy.stopped_at is not None
    assert prev_status == StrategyStatus.RUNNING
    print("✅ Strategy stop works")
    
    # Test 5: Invalid operations are rejected
    print("\n5. Testing invalid operations...")
    
    try:
        strategy.pause()  # Should fail - strategy is stopped
        assert False, "Should have raised ValueError"
    except ValueError:
        print("✅ Invalid pause correctly rejected")
    
    try:
        strategy.resume()  # Should fail - strategy is stopped
        assert False, "Should have raised ValueError" 
    except ValueError:
        print("✅ Invalid resume correctly rejected")
    
    # Test 6: Strategy info is complete
    print("\n6. Testing strategy info...")
    info = strategy.get_info()
    required_fields = ['id', 'name', 'symbol', 'status', 'created_at', 'strategy_type']
    for field in required_fields:
        assert field in info, f"Missing field: {field}"
    assert info['strategy_type'] == 'TestStrategy'
    print("✅ Strategy info complete")
    
    print("\n🎉 Task 1.1.1 VERIFICATION COMPLETE - All tests passed!")
    print(f"Strategy ID: {strategy.get_id()}")
    print(f"Final Status: {strategy.get_status().value}")
    
    return True

if __name__ == "__main__":
    test_task_1_1_1()