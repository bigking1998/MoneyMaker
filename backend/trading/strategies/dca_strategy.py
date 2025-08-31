"""
Dollar Cost Averaging (DCA) Strategy Implementation
"""

from typing import Dict, Any
from datetime import datetime, timedelta
import logging

from ..strategy_base import BaseStrategy, TradeSignal, StrategyConfig

class DCAConfig(StrategyConfig):
    """Configuration for DCA Strategy"""
    def __init__(self, name: str, **kwargs):
        super().__init__(name, **kwargs)
        self.interval_minutes = kwargs.get('interval_minutes', 60)  # Buy every hour
        self.dca_amount = kwargs.get('dca_amount', 50.0)  # $50 per DCA
        self.max_total_investment = kwargs.get('max_total_investment', 5000.0)  # Max $5000 total
        self.only_buy = kwargs.get('only_buy', True)  # Only buy, never sell
        self.price_threshold_pct = kwargs.get('price_threshold_pct', None)  # Optional: only buy if price drops X%

class DCAStrategy(BaseStrategy):
    """
    Dollar Cost Averaging Strategy
    
    Automatically buys a fixed USD amount of cryptocurrency at regular intervals,
    regardless of the price. This is a popular strategy for long-term accumulation.
    """
    
    def __init__(self, config: DCAConfig):
        super().__init__(config)
        self.dca_config = config
        self.last_purchase_time = None
        self.total_invested = 0.0
        self.total_crypto_acquired = 0.0
        self.average_buy_price = 0.0
        self.purchases_count = 0
        self.last_price = 0.0
        
        # DCA specific logger
        self.logger = logging.getLogger(f"strategy.dca.{self.config.name}")
        
    def analyze_market(self, market_data: Dict[str, Any]) -> TradeSignal:
        """
        DCA Strategy Logic:
        1. Check if enough time has passed since last purchase
        2. Check if we haven't exceeded max investment
        3. Optionally check price threshold
        4. Generate BUY signal if conditions met
        """
        current_time = datetime.utcnow()
        current_price = market_data.get('price', 0)
        
        if current_price <= 0:
            return TradeSignal.HOLD
        
        self.last_price = current_price
        
        # Check if we've exceeded max investment
        if self.total_invested >= self.dca_config.max_total_investment:
            self.logger.info(f"Max investment reached: ${self.total_invested}")
            return TradeSignal.HOLD
        
        # Check if enough time has passed since last purchase
        if self.last_purchase_time:
            time_diff = current_time - self.last_purchase_time
            required_interval = timedelta(minutes=self.dca_config.interval_minutes)
            
            if time_diff < required_interval:
                return TradeSignal.HOLD
        
        # Optional: Check price threshold (buy only if price dropped)
        if self.dca_config.price_threshold_pct and self.average_buy_price > 0:
            price_drop = ((self.average_buy_price - current_price) / self.average_buy_price) * 100
            if price_drop < self.dca_config.price_threshold_pct:
                self.logger.info(f"Price hasn't dropped enough. Current: ${current_price}, Avg: ${self.average_buy_price:.2f}")
                return TradeSignal.HOLD
        
        # All conditions met - generate BUY signal
        return TradeSignal.BUY
    
    def calculate_trade_amount(self, signal: TradeSignal, market_data: Dict[str, Any]) -> float:
        """Calculate DCA amount (fixed USD amount per purchase)"""
        if signal != TradeSignal.BUY:
            return 0.0
        
        # Calculate remaining investment capacity
        remaining_capacity = self.dca_config.max_total_investment - self.total_invested
        
        # Use DCA amount or remaining capacity, whichever is smaller
        return min(self.dca_config.dca_amount, remaining_capacity)
    
    def custom_validate_trade(self, trade) -> bool:
        """Custom DCA validation"""
        # DCA only buys, never sells (unless configured otherwise)
        if self.dca_config.only_buy and trade.side != TradeSignal.BUY:
            return False
        
        # Check if we have capacity for this purchase
        trade_value = trade.amount * self.last_price
        if self.total_invested + trade_value > self.dca_config.max_total_investment:
            return False
        
        return True
    
    def execute_trade(self, trade, executed_price: float, executed_amount: float, fees: float = 0.0):
        """Override to update DCA-specific metrics"""
        super().execute_trade(trade, executed_price, executed_amount, fees)
        
        if trade.side == TradeSignal.BUY:
            # Update DCA metrics
            trade_value = executed_amount * executed_price
            self.total_invested += trade_value + fees
            self.total_crypto_acquired += executed_amount
            self.purchases_count += 1
            self.last_purchase_time = datetime.utcnow()
            
            # Calculate new average buy price
            if self.total_crypto_acquired > 0:
                self.average_buy_price = self.total_invested / self.total_crypto_acquired
            
            self.logger.info(f"DCA Purchase #{self.purchases_count}: {executed_amount:.6f} {self.config.symbol} at ${executed_price:.2f}")
            self.logger.info(f"Total invested: ${self.total_invested:.2f}, Avg price: ${self.average_buy_price:.2f}")
    
    def get_strategy_info(self) -> Dict[str, Any]:
        """Get DCA-specific strategy information"""
        current_value = self.total_crypto_acquired * self.last_price if self.last_price > 0 else 0
        unrealized_pnl = current_value - self.total_invested
        unrealized_pnl_pct = (unrealized_pnl / self.total_invested * 100) if self.total_invested > 0 else 0
        
        return {
            'strategy_type': 'DCA',
            'name': self.config.name,
            'symbol': self.config.symbol,
            'interval_minutes': self.dca_config.interval_minutes,
            'dca_amount': self.dca_config.dca_amount,
            'max_total_investment': self.dca_config.max_total_investment,
            'total_invested': self.total_invested,
            'total_crypto_acquired': self.total_crypto_acquired,
            'average_buy_price': self.average_buy_price,
            'current_price': self.last_price,
            'current_value': current_value,
            'unrealized_pnl': unrealized_pnl,
            'unrealized_pnl_pct': unrealized_pnl_pct,
            'purchases_count': self.purchases_count,
            'last_purchase_time': self.last_purchase_time,
            'investment_progress_pct': (self.total_invested / self.dca_config.max_total_investment * 100) if self.dca_config.max_total_investment > 0 else 0,
            'next_purchase_eta': self._get_next_purchase_eta()
        }
    
    def _get_next_purchase_eta(self) -> str:
        """Calculate when the next purchase will happen"""
        if not self.last_purchase_time:
            return "Ready now"
        
        if self.total_invested >= self.dca_config.max_total_investment:
            return "Investment complete"
        
        next_purchase_time = self.last_purchase_time + timedelta(minutes=self.dca_config.interval_minutes)
        time_remaining = next_purchase_time - datetime.utcnow()
        
        if time_remaining.total_seconds() <= 0:
            return "Ready now"
        
        hours = int(time_remaining.total_seconds() // 3600)
        minutes = int((time_remaining.total_seconds() % 3600) // 60)
        
        if hours > 0:
            return f"{hours}h {minutes}m"
        else:
            return f"{minutes}m"
    
    def on_start(self):
        """Called when DCA strategy starts"""
        self.logger.info(f"Starting DCA strategy for {self.config.symbol}")
        self.logger.info(f"DCA Amount: ${self.dca_config.dca_amount}, Interval: {self.dca_config.interval_minutes}min")
        self.logger.info(f"Max Investment: ${self.dca_config.max_total_investment}")
    
    def on_stop(self):
        """Called when DCA strategy stops"""
        self.logger.info(f"Stopping DCA strategy")
        self.logger.info(f"Final Stats - Invested: ${self.total_invested:.2f}, Acquired: {self.total_crypto_acquired:.6f}")
        
    def __repr__(self):
        return f"<DCAStrategy(symbol={self.config.symbol}, invested=${self.total_invested:.2f}, purchases={self.purchases_count})>"