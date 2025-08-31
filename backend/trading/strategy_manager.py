"""
Strategy Manager for LumaTrade - Manages strategy lifecycle and execution
"""

from typing import Dict, List, Optional, Type
from datetime import datetime
import asyncio
import logging
from threading import Lock

from .strategy_base import BaseStrategy, StrategyStatus, StrategyConfig

class StrategyManager:
    """
    Centralized manager for all trading strategies
    """
    
    def __init__(self):
        self.strategies: Dict[str, BaseStrategy] = {}
        self.strategy_classes: Dict[str, Type[BaseStrategy]] = {}
        self.running_strategies: List[str] = []
        self._lock = Lock()
        self.logger = logging.getLogger("strategy_manager")
        self._market_data_cache = {}
        
    def register_strategy_class(self, strategy_name: str, strategy_class: Type[BaseStrategy]):
        """Register a strategy class for later instantiation"""
        self.strategy_classes[strategy_name] = strategy_class
        self.logger.info(f"Registered strategy class: {strategy_name}")
    
    def create_strategy(self, strategy_type: str, config: StrategyConfig) -> str:
        """Create a new strategy instance"""
        if strategy_type not in self.strategy_classes:
            raise ValueError(f"Unknown strategy type: {strategy_type}")
        
        strategy_class = self.strategy_classes[strategy_type]
        strategy = strategy_class(config)
        
        with self._lock:
            self.strategies[strategy.id] = strategy
        
        self.logger.info(f"Created strategy: {config.name} ({strategy.id})")
        return strategy.id
    
    def start_strategy(self, strategy_id: str) -> bool:
        """Start a specific strategy"""
        strategy = self.get_strategy(strategy_id)
        if not strategy:
            return False
        
        try:
            strategy.start()
            with self._lock:
                if strategy_id not in self.running_strategies:
                    self.running_strategies.append(strategy_id)
            return True
        except Exception as e:
            self.logger.error(f"Failed to start strategy {strategy_id}: {e}")
            return False
    
    def stop_strategy(self, strategy_id: str) -> bool:
        """Stop a specific strategy"""
        strategy = self.get_strategy(strategy_id)
        if not strategy:
            return False
        
        try:
            strategy.stop()
            with self._lock:
                if strategy_id in self.running_strategies:
                    self.running_strategies.remove(strategy_id)
            return True
        except Exception as e:
            self.logger.error(f"Failed to stop strategy {strategy_id}: {e}")
            return False
    
    def pause_strategy(self, strategy_id: str) -> bool:
        """Pause a specific strategy"""
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
        """Resume a specific strategy"""
        strategy = self.get_strategy(strategy_id)
        if not strategy:
            return False
        
        try:
            strategy.resume()
            return True
        except Exception as e:
            self.logger.error(f"Failed to resume strategy {strategy_id}: {e}")
            return False
    
    def delete_strategy(self, strategy_id: str) -> bool:
        """Delete a strategy (must be stopped first)"""
        strategy = self.get_strategy(strategy_id)
        if not strategy:
            return False
        
        if strategy.status != StrategyStatus.STOPPED:
            return False
        
        with self._lock:
            del self.strategies[strategy_id]
            if strategy_id in self.running_strategies:
                self.running_strategies.remove(strategy_id)
        
        self.logger.info(f"Deleted strategy {strategy_id}")
        return True
    
    def get_strategy(self, strategy_id: str) -> Optional[BaseStrategy]:
        """Get a strategy by ID"""
        return self.strategies.get(strategy_id)
    
    def get_all_strategies(self) -> List[BaseStrategy]:
        """Get all strategies"""
        return list(self.strategies.values())
    
    def get_running_strategies(self) -> List[BaseStrategy]:
        """Get all running strategies"""
        return [self.strategies[sid] for sid in self.running_strategies if sid in self.strategies]
    
    def get_strategy_summary(self) -> Dict[str, any]:
        """Get summary of all strategies"""
        total = len(self.strategies)
        running = len(self.running_strategies)
        paused = sum(1 for s in self.strategies.values() if s.status == StrategyStatus.PAUSED)
        stopped = sum(1 for s in self.strategies.values() if s.status == StrategyStatus.STOPPED)
        error = sum(1 for s in self.strategies.values() if s.status == StrategyStatus.ERROR)
        
        return {
            'total_strategies': total,
            'running': running,
            'paused': paused,
            'stopped': stopped,
            'error': error,
            'registered_types': list(self.strategy_classes.keys())
        }
    
    def update_market_data(self, symbol: str, market_data: Dict[str, any]):
        """Update all strategies with new market data"""
        self._market_data_cache[symbol] = {
            **market_data,
            'timestamp': datetime.utcnow()
        }
        
        # Update strategies that trade this symbol
        for strategy_id in self.running_strategies.copy():
            strategy = self.get_strategy(strategy_id)
            if strategy and strategy.config.symbol == symbol:
                try:
                    strategy.update_market_data(market_data)
                except Exception as e:
                    self.logger.error(f"Error updating strategy {strategy_id} with market data: {e}")
                    strategy.status = StrategyStatus.ERROR
                    self.running_strategies.remove(strategy_id)
    
    def get_pending_trades(self) -> List[dict]:
        """Get all pending trades from all strategies"""
        all_trades = []
        for strategy in self.strategies.values():
            for trade in strategy.pending_trades:
                all_trades.append({
                    'strategy_id': strategy.id,
                    'strategy_name': strategy.config.name,
                    'trade_id': trade.id,
                    'symbol': trade.symbol,
                    'side': trade.side.value,
                    'amount': trade.amount,
                    'trade_type': trade.trade_type.value,
                    'price': trade.price,
                    'timestamp': trade.timestamp
                })
        return all_trades
    
    def execute_trade(self, strategy_id: str, trade_id: str, executed_price: float, 
                     executed_amount: float, fees: float = 0.0) -> bool:
        """Execute a pending trade"""
        strategy = self.get_strategy(strategy_id)
        if not strategy:
            return False
        
        # Find the trade
        trade = None
        for t in strategy.pending_trades:
            if t.id == trade_id:
                trade = t
                break
        
        if not trade:
            return False
        
        try:
            strategy.execute_trade(trade, executed_price, executed_amount, fees)
            return True
        except Exception as e:
            self.logger.error(f"Failed to execute trade {trade_id}: {e}")
            return False
    
    def get_all_performance_metrics(self) -> List[Dict[str, any]]:
        """Get performance metrics for all strategies"""
        return [strategy.get_performance_metrics() for strategy in self.strategies.values()]
    
    def emergency_stop_all(self):
        """Emergency stop all strategies"""
        self.logger.warning("EMERGENCY STOP: Stopping all strategies")
        for strategy_id in self.running_strategies.copy():
            self.stop_strategy(strategy_id)
    
    def cleanup_stopped_strategies(self):
        """Remove old stopped strategies to free memory"""
        to_remove = []
        current_time = datetime.utcnow()
        
        for strategy_id, strategy in self.strategies.items():
            if (strategy.status == StrategyStatus.STOPPED and 
                strategy.stopped_at and 
                (current_time - strategy.stopped_at).days > 7):
                to_remove.append(strategy_id)
        
        for strategy_id in to_remove:
            self.delete_strategy(strategy_id)
        
        if to_remove:
            self.logger.info(f"Cleaned up {len(to_remove)} old strategies")

# Global strategy manager instance
strategy_manager = StrategyManager()