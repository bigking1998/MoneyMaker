"""
Base Strategy Class for LumaTrade Trading System
Task 1.1.1: Create base Strategy class/interface
"""

from abc import ABC, abstractmethod
from enum import Enum
from typing import Dict, Any, Optional
from datetime import datetime
import uuid

class StrategyStatus(Enum):
    """Strategy execution status"""
    STOPPED = "stopped"
    RUNNING = "running" 
    PAUSED = "paused"
    ERROR = "error"

class TradeSignal(Enum):
    """Trading signals that strategies can generate"""
    BUY = "buy"
    SELL = "sell"
    HOLD = "hold"

class StrategyConfig:
    """Base configuration for all trading strategies"""
    def __init__(self, name: str, symbol: str = "BTC/USD", **kwargs):
        self.name = name
        self.symbol = symbol
        self.created_at = datetime.utcnow()
        self.custom_params = kwargs
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            'name': self.name,
            'symbol': self.symbol,
            'created_at': self.created_at.isoformat(),
            'custom_params': self.custom_params
        }

class BaseStrategy(ABC):
    """
    Abstract base class for all trading strategies.
    Defines the interface that all concrete strategies must implement.
    """
    
    def __init__(self, config: StrategyConfig):
        if not isinstance(config, StrategyConfig):
            raise TypeError("config must be an instance of StrategyConfig")
        
        self.id = str(uuid.uuid4())
        self.config = config
        self.status = StrategyStatus.STOPPED
        self.created_at = datetime.utcnow()
        self.started_at = None
        self.stopped_at = None
        
        # Initialize strategy-specific state
        self.last_signal = TradeSignal.HOLD
        self.last_analysis_time = None
    
    def get_id(self) -> str:
        """Get unique strategy ID"""
        return self.id
    
    def get_name(self) -> str:
        """Get strategy name"""
        return self.config.name
    
    def get_symbol(self) -> str:
        """Get trading symbol"""
        return self.config.symbol
    
    def get_status(self) -> StrategyStatus:
        """Get current strategy status"""
        return self.status
    
    def get_config(self) -> StrategyConfig:
        """Get strategy configuration"""
        return self.config
    
    def start(self):
        """Start the strategy execution"""
        if self.status == StrategyStatus.RUNNING:
            raise ValueError("Strategy is already running")
        
        self.status = StrategyStatus.RUNNING
        self.started_at = datetime.utcnow()
        self.on_start()
    
    def stop(self):
        """Stop the strategy execution"""
        if self.status == StrategyStatus.STOPPED:
            return
        
        prev_status = self.status
        self.status = StrategyStatus.STOPPED
        self.stopped_at = datetime.utcnow()
        self.on_stop()
        return prev_status
    
    def pause(self):
        """Pause the strategy execution"""
        if self.status != StrategyStatus.RUNNING:
            raise ValueError("Can only pause a running strategy")
        
        self.status = StrategyStatus.PAUSED
        self.on_pause()
    
    def resume(self):
        """Resume the strategy execution"""
        if self.status != StrategyStatus.PAUSED:
            raise ValueError("Can only resume a paused strategy")
        
        self.status = StrategyStatus.RUNNING
        self.on_resume()
    
    def analyze_market_data(self, market_data: Dict[str, Any]) -> TradeSignal:
        """
        Analyze market data and return trading signal.
        This is the main entry point for strategy execution.
        """
        if self.status != StrategyStatus.RUNNING:
            return TradeSignal.HOLD
        
        try:
            self.last_analysis_time = datetime.utcnow()
            signal = self.analyze(market_data)
            self.last_signal = signal
            return signal
        except Exception as e:
            self.status = StrategyStatus.ERROR
            raise e
    
    def get_info(self) -> Dict[str, Any]:
        """Get comprehensive strategy information"""
        return {
            'id': self.id,
            'name': self.config.name,
            'symbol': self.config.symbol,
            'status': self.status.value,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'started_at': self.started_at.isoformat() if self.started_at else None,
            'stopped_at': self.stopped_at.isoformat() if self.stopped_at else None,
            'last_signal': self.last_signal.value if self.last_signal else None,
            'last_analysis_time': self.last_analysis_time.isoformat() if self.last_analysis_time else None,
            'strategy_type': self.__class__.__name__,
            **self.get_strategy_specific_info()
        }
    
    # Abstract methods that concrete strategies must implement
    @abstractmethod
    def analyze(self, market_data: Dict[str, Any]) -> TradeSignal:
        """
        Analyze market data and return a trading signal.
        This is the core logic that each strategy must implement.
        
        Args:
            market_data: Dictionary containing market data (price, volume, etc.)
            
        Returns:
            TradeSignal: BUY, SELL, or HOLD signal
        """
        pass
    
    @abstractmethod
    def get_strategy_specific_info(self) -> Dict[str, Any]:
        """
        Return strategy-specific information for monitoring/debugging.
        
        Returns:
            Dictionary with strategy-specific data
        """
        pass
    
    # Optional lifecycle hooks (can be overridden by concrete strategies)
    def on_start(self):
        """Called when strategy starts"""
        pass
    
    def on_stop(self):
        """Called when strategy stops"""  
        pass
    
    def on_pause(self):
        """Called when strategy is paused"""
        pass
    
    def on_resume(self):
        """Called when strategy resumes"""
        pass
    
    def __repr__(self):
        return f"<{self.__class__.__name__}(id={self.id[:8]}, name='{self.config.name}', status={self.status.value})>"