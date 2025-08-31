"""
Test file for Task 1.1.2: Strategy lifecycle management
"""

import sys
sys.path.append('/app/backend')

from trading.base_strategy import BaseStrategy, StrategyConfig, TradeSignal, StrategyStatus
from trading.strategy_manager import StrategyManager
from typing import Dict, Any

class LifecycleTestStrategy(BaseStrategy):
    """Test strategy with lifecycle tracking"""
    
    def __init__(self, config: StrategyConfig):
        super().__init__(config)
        self.setup_called = False
        self.cleanup_called = False
        self.setup_params = None
        
    def analyze(self, market_data: Dict[str, Any]) -> TradeSignal:
        return TradeSignal.HOLD
    
    def get_strategy_specific_info(self) -> Dict[str, Any]:
        return {
            'setup_called': self.setup_called,
            'cleanup_called': self.cleanup_called,
            'setup_params': self.setup_params
        }
    
    def on_setup(self, params: Dict[str, Any]):
        """Custom setup logic"""
        self.setup_called = True
        self.setup_params = params
    
    def on_cleanup(self):
        """Custom cleanup logic"""
        self.cleanup_called = True

def test_task_1_1_2():
    """Test Task 1.1.2: Strategy lifecycle management"""
    
    print("🧪 Testing Task 1.1.2: Strategy Lifecycle Management")
    
    # Create fresh manager
    manager = StrategyManager()
    
    # Test 1: Strategy registration and initialization
    print("\n1. Testing strategy registration and initialization...")
    
    manager.register_strategy_class("lifecycle_test", LifecycleTestStrategy)
    registered_types = manager.get_registered_types()
    assert "lifecycle_test" in registered_types
    print("✅ Strategy class registration works")
    
    config = StrategyConfig(name="Lifecycle Test", symbol="BTC/USD", test_param="value")
    strategy_id = manager.initialize_strategy("lifecycle_test", config)
    assert strategy_id is not None
    print(f"✅ Strategy initialization works (ID: {strategy_id[:8]}...)")
    
    # Test 2: Setup phase
    print("\n2. Testing strategy setup...")
    
    setup_params = {'param1': 'value1', 'param2': 123}
    setup_success = manager.setup_strategy(strategy_id, setup_params)
    assert setup_success == True
    
    strategy = manager.get_strategy(strategy_id)
    assert strategy.setup_called == True
    assert strategy.setup_params == setup_params
    print("✅ Strategy setup works with custom parameters")
    
    # Test 3: Execute phase - state management
    print("\n3. Testing execute phase - state management...")
    
    # Start strategy
    start_success = manager.start_strategy(strategy_id)
    assert start_success == True
    assert strategy.get_status() == StrategyStatus.RUNNING
    print("✅ Strategy start in execute phase works")
    
    # Execute strategy cycle
    market_data = {'price': 50000, 'volume': 1000}
    signal = manager.execute_strategy_cycle(strategy_id, market_data)
    assert signal == 'hold'
    print("✅ Strategy execution cycle works")
    
    # Pause strategy
    pause_success = manager.pause_strategy(strategy_id)
    assert pause_success == True
    assert strategy.get_status() == StrategyStatus.PAUSED
    print("✅ Strategy pause in execute phase works")
    
    # Resume strategy
    resume_success = manager.resume_strategy(strategy_id)
    assert resume_success == True
    assert strategy.get_status() == StrategyStatus.RUNNING
    print("✅ Strategy resume in execute phase works")
    
    # Stop strategy
    stop_success = manager.stop_strategy(strategy_id)
    assert stop_success == True
    assert strategy.get_status() == StrategyStatus.STOPPED
    print("✅ Strategy stop in execute phase works")
    
    # Test 4: Cleanup phase
    print("\n4. Testing cleanup phase...")
    
    # Verify strategy exists before cleanup
    assert manager.get_strategy(strategy_id) is not None
    
    cleanup_success = manager.cleanup_strategy(strategy_id)
    assert cleanup_success == True
    assert strategy.cleanup_called == True
    
    # Verify strategy is removed after cleanup
    assert manager.get_strategy(strategy_id) is None
    print("✅ Strategy cleanup works and removes strategy from manager")
    
    # Test 5: Lifecycle summary and tracking
    print("\n5. Testing lifecycle summary...")
    
    # Create multiple strategies in different states
    config1 = StrategyConfig(name="Test1", symbol="ETH/USD")
    config2 = StrategyConfig(name="Test2", symbol="SOL/USD")
    
    id1 = manager.initialize_strategy("lifecycle_test", config1)
    id2 = manager.initialize_strategy("lifecycle_test", config2)
    
    manager.start_strategy(id1)
    manager.start_strategy(id2)
    manager.pause_strategy(id2)
    
    summary = manager.get_lifecycle_summary()
    assert summary['total_strategies'] == 2
    assert summary['running'] == 1
    assert summary['paused'] == 1
    assert summary['stopped'] == 0
    print("✅ Lifecycle summary tracking works")
    
    # Test 6: Emergency cleanup
    print("\n6. Testing emergency cleanup...")
    
    manager.emergency_cleanup_all()
    final_summary = manager.get_lifecycle_summary()
    assert final_summary['total_strategies'] == 0
    print("✅ Emergency cleanup works")
    
    # Test 7: Error handling
    print("\n7. Testing error handling...")
    
    # Test invalid strategy type
    try:
        manager.initialize_strategy("nonexistent", config)
        assert False, "Should have raised ValueError"
    except ValueError as e:
        assert "Unknown strategy type" in str(e)
        print("✅ Invalid strategy type error handling works")
    
    # Test operations on nonexistent strategy
    fake_id = "nonexistent-id"
    assert manager.setup_strategy(fake_id) == False
    assert manager.start_strategy(fake_id) == False
    assert manager.stop_strategy(fake_id) == False
    assert manager.cleanup_strategy(fake_id) == False
    print("✅ Nonexistent strategy error handling works")
    
    print("\n🎉 Task 1.1.2 VERIFICATION COMPLETE - All lifecycle tests passed!")
    print("✅ INIT: Strategy registration and initialization")
    print("✅ SETUP: Strategy configuration and preparation") 
    print("✅ EXECUTE: State management and execution cycles")
    print("✅ CLEANUP: Resource disposal and removal")
    
    return True

if __name__ == "__main__":
    test_task_1_1_2()