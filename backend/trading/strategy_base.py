"""
Base Strategy Class for LumaTrade Automated Trading System
"""

from abc import ABC, abstractmethod
from enum import Enum
from typing import Dict, List, Optional, Any
from datetime import datetime
import uuid
import logging

class StrategyStatus(Enum):
    STOPPED = "stopped"
    RUNNING = "running"
    PAUSED = "paused"
    ERROR = "error"

class TradeSignal(Enum):
    BUY = "buy"
    SELL = "sell"
    HOLD = "hold"

class TradeType(Enum):
    MARKET = "market"
    LIMIT = "limit"
    STOP = "stop"
    STOP_LIMIT = "stop_limit"

class Trade:
    """Individual trade representation"""
    def __init__(self, symbol: str, side: TradeSignal, amount: float, 
                 trade_type: TradeType = TradeType.MARKET, price: Optional[float] = None):
        self.id = str(uuid.uuid4())
        self.symbol = symbol
        self.side = side
        self.amount = amount
        self.trade_type = trade_type
        self.price = price
        self.timestamp = datetime.utcnow()
        self.status = "pending"
        self.executed_price = None
        self.executed_amount = None
        self.fees = 0.0

class StrategyConfig:
    """Base configuration for trading strategies"""
    def __init__(self, name: str, **kwargs):
        self.name = name
        self.symbol = kwargs.get('symbol', 'BTC/USD')
        self.base_amount = kwargs.get('base_amount', 100.0)  # USD amount per trade
        self.max_position = kwargs.get('max_position', 1000.0)  # Maximum USD position
        self.stop_loss_pct = kwargs.get('stop_loss_pct', 0.05)  # 5% stop loss
        self.take_profit_pct = kwargs.get('take_profit_pct', 0.10)  # 10% take profit
        self.enabled = kwargs.get('enabled', True)
        self.custom_params = kwargs

class BaseStrategy(ABC):
    """
    Abstract base class for all trading strategies
    """
    
    def __init__(self, config: StrategyConfig):
        self.config = config
        self.id = str(uuid.uuid4())
        self.status = StrategyStatus.STOPPED
        self.created_at = datetime.utcnow()
        self.started_at = None
        self.stopped_at = None
        
        # Trading state
        self.current_position = 0.0  # Current position size
        self.unrealized_pnl = 0.0
        self.realized_pnl = 0.0
        self.total_trades = 0
        self.winning_trades = 0
        self.losing_trades = 0
        
        # Trade history
        self.trade_history: List[Trade] = []
        self.pending_trades: List[Trade] = []
        
        # Logger
        self.logger = logging.getLogger(f"strategy.{self.__class__.__name__}")
        
    def start(self):
        """Start the strategy"""
        if self.status != StrategyStatus.STOPPED:
            raise ValueError(f"Cannot start strategy in {self.status.value} state")
        
        self.status = StrategyStatus.RUNNING
        self.started_at = datetime.utcnow()
        self.logger.info(f"Strategy {self.config.name} started")
        self.on_start()
    
    def stop(self):
        """Stop the strategy"""
        if self.status == StrategyStatus.STOPPED:
            return
        
        self.status = StrategyStatus.STOPPED
        self.stopped_at = datetime.utcnow()
        self.logger.info(f"Strategy {self.config.name} stopped")
        self.on_stop()
    
    def pause(self):
        """Pause the strategy"""
        if self.status != StrategyStatus.RUNNING:
            raise ValueError(f"Cannot pause strategy in {self.status.value} state")
        
        self.status = StrategyStatus.PAUSED
        self.logger.info(f"Strategy {self.config.name} paused")
        self.on_pause()
    
    def resume(self):
        """Resume the strategy"""
        if self.status != StrategyStatus.PAUSED:
            raise ValueError(f"Cannot resume strategy in {self.status.value} state")
        
        self.status = StrategyStatus.RUNNING
        self.logger.info(f"Strategy {self.config.name} resumed")
        self.on_resume()
    
    def update_market_data(self, market_data: Dict[str, Any]):
        """Update strategy with new market data"""
        if self.status == StrategyStatus.RUNNING:
            try:
                signal = self.analyze_market(market_data)
                if signal != TradeSignal.HOLD:
                    trade = self.create_trade(signal, market_data)
                    if trade and self.validate_trade(trade):
                        self.pending_trades.append(trade)
                        self.logger.info(f"Generated {signal.value} signal for {trade.symbol}")
            except Exception as e:
                self.logger.error(f"Error analyzing market data: {e}")
                self.status = StrategyStatus.ERROR
    
    def create_trade(self, signal: TradeSignal, market_data: Dict[str, Any]) -> Optional[Trade]:
        """Create a trade based on signal and market data"""
        if signal == TradeSignal.HOLD:
            return None
        
        current_price = market_data.get('price', 0)
        if current_price <= 0:
            return None
        
        # Calculate trade amount based on strategy config
        amount_usd = self.calculate_trade_amount(signal, market_data)
        amount_crypto = amount_usd / current_price
        
        trade = Trade(
            symbol=self.config.symbol,
            side=signal,
            amount=amount_crypto,
            trade_type=TradeType.MARKET
        )
        
        return trade
    
    def validate_trade(self, trade: Trade) -> bool:
        """Validate if trade should be executed"""
        # Check if strategy is running
        if self.status != StrategyStatus.RUNNING:
            return False
        
        # Check position limits
        new_position = self.calculate_new_position(trade)
        if abs(new_position) > self.config.max_position:
            self.logger.warning(f"Trade would exceed max position limit")
            return False
        
        # Custom validation by strategy
        return self.custom_validate_trade(trade)
    
    def calculate_new_position(self, trade: Trade) -> float:
        """Calculate what the new position would be after trade"""
        multiplier = 1 if trade.side == TradeSignal.BUY else -1
        return self.current_position + (trade.amount * multiplier)
    
    def calculate_trade_amount(self, signal: TradeSignal, market_data: Dict[str, Any]) -> float:
        """Calculate the USD amount for the trade"""
        return self.config.base_amount
    
    def execute_trade(self, trade: Trade, executed_price: float, executed_amount: float, fees: float = 0.0):
        """Mark trade as executed with actual execution details"""
        trade.status = "executed"
        trade.executed_price = executed_price
        trade.executed_amount = executed_amount
        trade.fees = fees
        
        # Update position
        multiplier = 1 if trade.side == TradeSignal.BUY else -1
        self.current_position += executed_amount * multiplier
        
        # Move from pending to history
        if trade in self.pending_trades:
            self.pending_trades.remove(trade)
        self.trade_history.append(trade)
        
        # Update statistics
        self.total_trades += 1
        self.logger.info(f"Trade executed: {trade.side.value} {executed_amount} {trade.symbol} at ${executed_price}")
    
    def get_performance_metrics(self) -> Dict[str, Any]:
        """Get strategy performance metrics"""
        total_trades = len(self.trade_history)
        win_rate = (self.winning_trades / total_trades * 100) if total_trades > 0 else 0
        
        return {
            'strategy_id': self.id,
            'name': self.config.name,
            'status': self.status.value,
            'total_trades': total_trades,
            'winning_trades': self.winning_trades,
            'losing_trades': self.losing_trades,
            'win_rate': win_rate,
            'realized_pnl': self.realized_pnl,
            'unrealized_pnl': self.unrealized_pnl,
            'current_position': self.current_position,
            'started_at': self.started_at,
            'runtime': (datetime.utcnow() - self.started_at).total_seconds() if self.started_at else 0
        }
    
    # Abstract methods that must be implemented by concrete strategies
    @abstractmethod
    def analyze_market(self, market_data: Dict[str, Any]) -> TradeSignal:
        """Analyze market data and return trading signal"""
        pass
    
    @abstractmethod
    def get_strategy_info(self) -> Dict[str, Any]:
        """Get strategy-specific information"""
        pass
    
    # Optional override methods
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
    
    def custom_validate_trade(self, trade: Trade) -> bool:
        """Custom trade validation - override in subclasses"""
        return True
    
    def __repr__(self):
        return f"<{self.__class__.__name__}(id={self.id[:8]}..., status={self.status.value}, symbol={self.config.symbol})>"