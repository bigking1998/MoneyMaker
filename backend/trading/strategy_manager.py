"""
Strategy Manager for Task 1.1.2: Strategy lifecycle management
Handles init, setup, execute, and cleanup of strategies
"""

from typing import Dict, List, Type, Optional, Any
from datetime import datetime
import logging
from threading import Lock

from .base_strategy import BaseStrategy, StrategyConfig, StrategyStatus

class StrategyManager:
    """
    Manages the complete lifecycle of trading strategies:
    - Initialization: Create strategy instances
    - Setup: Configure and prepare strategies
    - Execute: Run strategy analysis and manage state
    - Cleanup: Properly dispose of strategies
    """
    
    def __init__(self):
        self.strategies: Dict[str, BaseStrategy] = {}
        self.strategy_classes: Dict[str, Type[BaseStrategy]] = {}
        self._lock = Lock()
        self.logger = logging.getLogger("StrategyManager")
        
    def register_strategy_class(self, strategy_type: str, strategy_class: Type[BaseStrategy]):
        """
        Register a strategy class for later instantiation
        Part of initialization phase
        """
        if not issubclass(strategy_class, BaseStrategy):
            raise TypeError(f"Strategy class must inherit from BaseStrategy")
        
        self.strategy_classes[strategy_type] = strategy_class
        self.logger.info(f"Registered strategy type: {strategy_type}")
        
    def get_registered_types(self) -> List[str]:
        """Get list of registered strategy types"""
        return list(self.strategy_classes.keys())
    
    def initialize_strategy(self, strategy_type: str, config: StrategyConfig) -> str:
        """
        INIT: Create and initialize a new strategy instance
        """
        if strategy_type not in self.strategy_classes:
            raise ValueError(f"Unknown strategy type: {strategy_type}. Available: {self.get_registered_types()}")
        
        # Create strategy instance
        strategy_class = self.strategy_classes[strategy_type]
        strategy = strategy_class(config)
        
        # Store strategy
        with self._lock:
            self.strategies[strategy.get_id()] = strategy
        
        self.logger.info(f"Initialized strategy: {config.name} (ID: {strategy.get_id()})")
        return strategy.get_id()
    
    def setup_strategy(self, strategy_id: str, setup_params: Optional[Dict[str, Any]] = None) -> bool:
        """
        SETUP: Configure and prepare strategy for execution
        """
        strategy = self.get_strategy(strategy_id)
        if not strategy:
            return False
        
        try:
            # Call setup hook if strategy has custom setup logic
            if hasattr(strategy, 'on_setup'):
                strategy.on_setup(setup_params or {})
            
            self.logger.info(f"Setup completed for strategy: {strategy.get_name()}")
            return True
        except Exception as e:
            self.logger.error(f"Setup failed for strategy {strategy_id}: {e}")
            strategy.status = StrategyStatus.ERROR
            return False
    
    def execute_strategy_cycle(self, strategy_id: str, market_data: Dict[str, Any]) -> Optional[str]:
        """
        EXECUTE: Run one execution cycle of the strategy
        Returns the trading signal generated (if any)
        """
        strategy = self.get_strategy(strategy_id)
        if not strategy:
            return None
        
        if strategy.get_status() != StrategyStatus.RUNNING:
            return None
        
        try:
            signal = strategy.analyze_market_data(market_data)
            return signal.value if signal else None
        except Exception as e:
            self.logger.error(f"Execution failed for strategy {strategy_id}: {e}")
            strategy.status = StrategyStatus.ERROR
            return None
    
    def cleanup_strategy(self, strategy_id: str) -> bool:
        """
        CLEANUP: Properly dispose of a strategy and free resources
        """
        strategy = self.get_strategy(strategy_id)
        if not strategy:
            return False
        
        try:
            # Stop strategy if it's running
            if strategy.get_status() in [StrategyStatus.RUNNING, StrategyStatus.PAUSED]:
                strategy.stop()
            
            # Call cleanup hook if strategy has custom cleanup logic
            if hasattr(strategy, 'on_cleanup'):
                strategy.on_cleanup()
            
            # Remove from manager
            with self._lock:
                if strategy_id in self.strategies:
                    del self.strategies[strategy_id]
            
            self.logger.info(f"Cleaned up strategy: {strategy.get_name()}")
            return True
        except Exception as e:
            self.logger.error(f"Cleanup failed for strategy {strategy_id}: {e}")
            return False
    
    def start_strategy(self, strategy_id: str) -> bool:
        """Start a strategy (part of execute phase)"""
        strategy = self.get_strategy(strategy_id)
        if not strategy:
            return False
        
        try:
            strategy.start()
            return True
        except Exception as e:
            self.logger.error(f"Failed to start strategy {strategy_id}: {e}")
            return False
    
    def stop_strategy(self, strategy_id: str) -> bool:
        """Stop a strategy (part of execute phase)"""
        strategy = self.get_strategy(strategy_id)
        if not strategy:
            return False
        
        try:
            strategy.stop()
            return True
        except Exception as e:
            self.logger.error(f"Failed to stop strategy {strategy_id}: {e}")
            return False
    
    def pause_strategy(self, strategy_id: str) -> bool:
        """Pause a strategy (part of execute phase)"""
        strategy = self.get_strategy(strategy_id)
        if not strategy:
            return False
        
        try:
            strategy.pause()
            return True
        except Exception as e:
            self.logger.error(f"Failed to pause strategy {strategy_id}: {e}")
            return False
    
    def resume_strategy(self, strategy_id: str) -> bool:
        """Resume a strategy (part of execute phase)"""
        strategy = self.get_strategy(strategy_id)
        if not strategy:
            return False
        
        try:
            strategy.resume()
            return True
        except Exception as e:
            self.logger.error(f"Failed to resume strategy {strategy_id}: {e}")
            return False
    
    def get_strategy(self, strategy_id: str) -> Optional[BaseStrategy]:
        """Get strategy by ID"""
        return self.strategies.get(strategy_id)
    
    def get_all_strategies(self) -> List[BaseStrategy]:
        """Get all strategies"""
        return list(self.strategies.values())
    
    def get_running_strategies(self) -> List[BaseStrategy]:
        """Get all currently running strategies"""
        return [s for s in self.strategies.values() if s.get_status() == StrategyStatus.RUNNING]
    
    def get_lifecycle_summary(self) -> Dict[str, Any]:
        """Get summary of strategy lifecycle states"""
        total = len(self.strategies)
        running = len([s for s in self.strategies.values() if s.get_status() == StrategyStatus.RUNNING])
        paused = len([s for s in self.strategies.values() if s.get_status() == StrategyStatus.PAUSED])
        stopped = len([s for s in self.strategies.values() if s.get_status() == StrategyStatus.STOPPED])
        error = len([s for s in self.strategies.values() if s.get_status() == StrategyStatus.ERROR])
        
        return {
            'total_strategies': total,
            'running': running,
            'paused': paused,
            'stopped': stopped,
            'error': error,
            'registered_types': self.get_registered_types()
        }
    
    def emergency_cleanup_all(self):
        """Emergency cleanup of all strategies"""
        self.logger.warning("EMERGENCY CLEANUP: Cleaning up all strategies")
        strategy_ids = list(self.strategies.keys())
        for strategy_id in strategy_ids:
            self.cleanup_strategy(strategy_id)

# Global strategy manager instance
strategy_manager = StrategyManager()