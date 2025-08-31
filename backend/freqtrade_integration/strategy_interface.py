"""
Freqtrade IStrategy Implementation for LumaTrade
Task 1.1.1: Implement freqtrade IStrategy base class

Based on: freqtrade/strategy/interface.py
"""

from abc import ABC, abstractmethod
from typing import Dict, List, Optional, Any
import pandas as pd
from datetime import datetime, timezone
import talib.abstract as ta
from freqtrade.strategy.interface import IStrategy as FreqtradeIStrategy
from freqtrade.strategy import (
    BooleanParameter, CategoricalParameter, DecimalParameter, 
    IntParameter, RealParameter, merge_informative_pair
)
import logging

class LumaTradeIStrategy(FreqtradeIStrategy):
    """
    LumaTrade implementation of freqtrade's IStrategy interface.
    Provides the same functionality as freqtrade strategies but integrated with LumaTrade.
    """
    
    # Strategy metadata (inherited from freqtrade)
    INTERFACE_VERSION: int = 3
    
    # Default strategy settings (can be overridden)
    minimal_roi: Dict[str, float] = {
        "60": 0.01,    # 1% profit after 60 minutes
        "30": 0.02,    # 2% profit after 30 minutes  
        "0": 0.04      # 4% profit immediately
    }
    
    stoploss: float = -0.10  # 10% stop loss
    
    timeframe = '5m'  # Default 5-minute timeframe
    
    # Can this strategy go short?
    can_short: bool = False
    
    # Optimal timeframe for the strategy
    # Minimal ROI designed for the strategy
    startup_candle_count: int = 30
    
    # Optional order type mapping
    order_types = {
        'entry': 'limit',
        'exit': 'limit',
        'stoploss': 'market',
        'stoploss_on_exchange': False
    }
    
    def __init__(self, config: dict = None) -> None:
        """Initialize strategy with LumaTrade-specific enhancements"""
        super().__init__(config or {})
        self.logger = logging.getLogger(self.__class__.__name__)
        
        # LumaTrade specific initialization
        self.lumatrade_config = config or {}
        self.trade_count = 0
        self.last_analysis_time = None
    
    def populate_indicators(self, dataframe: pd.DataFrame, metadata: dict) -> pd.DataFrame:
        """
        Add technical indicators to the dataframe.
        This method must be implemented by concrete strategies.
        
        Args:
            dataframe: OHLCV data as pandas DataFrame
            metadata: Additional metadata (pair name, timeframe, etc.)
            
        Returns:
            DataFrame with added indicators
        """
        # This is abstract - must be implemented by subclasses
        return dataframe
    
    def populate_entry_trend(self, dataframe: pd.DataFrame, metadata: dict) -> pd.DataFrame:
        """
        Define entry signals. Add 'enter_long' or 'enter_short' columns.
        
        Args:
            dataframe: DataFrame with indicators
            metadata: Additional metadata
            
        Returns:
            DataFrame with entry signals
        """
        # This is abstract - must be implemented by subclasses  
        return dataframe
    
    def populate_exit_trend(self, dataframe: pd.DataFrame, metadata: dict) -> pd.DataFrame:
        """
        Define exit signals. Add 'exit_long' or 'exit_short' columns.
        
        Args:
            dataframe: DataFrame with indicators
            metadata: Additional metadata
            
        Returns:
            DataFrame with exit signals
        """
        # This is abstract - must be implemented by subclasses
        return dataframe
    
    # Additional LumaTrade-specific methods
    def analyze_lumatrade(self, dataframe: pd.DataFrame, metadata: dict) -> Dict[str, Any]:
        """
        LumaTrade-specific analysis method that processes the full strategy pipeline.
        This method coordinates the three main freqtrade methods.
        """
        try:
            self.last_analysis_time = datetime.now(timezone.utc)
            
            # Step 1: Add indicators
            df_with_indicators = self.populate_indicators(dataframe.copy(), metadata)
            
            # Step 2: Add entry signals  
            df_with_entry = self.populate_entry_trend(df_with_indicators, metadata)
            
            # Step 3: Add exit signals
            df_final = self.populate_exit_trend(df_with_entry, metadata)
            
            # Extract latest signals
            latest_row = df_final.iloc[-1] if not df_final.empty else {}
            
            # Determine current signal
            current_signal = 'hold'
            if latest_row.get('enter_long', False):
                current_signal = 'buy'
            elif latest_row.get('enter_short', False) and self.can_short:
                current_signal = 'sell'
            elif latest_row.get('exit_long', False) or latest_row.get('exit_short', False):
                current_signal = 'exit'
            
            return {
                'signal': current_signal,
                'dataframe': df_final,
                'indicators': self._extract_indicators(latest_row),
                'entry_signals': {
                    'enter_long': bool(latest_row.get('enter_long', False)),
                    'enter_short': bool(latest_row.get('enter_short', False))
                },
                'exit_signals': {
                    'exit_long': bool(latest_row.get('exit_long', False)), 
                    'exit_short': bool(latest_row.get('exit_short', False))
                },
                'metadata': metadata,
                'analysis_time': self.last_analysis_time
            }
            
        except Exception as e:
            self.logger.error(f"Error in strategy analysis: {e}")
            return {
                'signal': 'hold',
                'error': str(e),
                'analysis_time': self.last_analysis_time
            }
    
    def _extract_indicators(self, row: pd.Series) -> Dict[str, Any]:
        """Extract indicator values from the latest row"""
        indicators = {}
        
        # All possible indicator columns to extract (including specific names)
        indicator_patterns = [
            'sma', 'sma30', 'sma50', 'sma200',  # Simple Moving Averages
            'ema', 'ema21', 'ema50', 'ema200',  # Exponential Moving Averages
            'rsi',                               # Relative Strength Index
            'macd', 'macdsignal', 'macdhist',   # MACD indicators
            'bb_upperband', 'bb_lowerband',     # Bollinger Bands
            'adx',                              # Average Directional Index
            'stoch_k', 'stoch_d',               # Stochastic
            'atr',                              # Average True Range
            'volume'                            # Volume
        ]
        
        # Extract all available indicators from the row
        for col in row.index:
            # Check if column name matches any of our indicator patterns
            if any(pattern in col.lower() for pattern in ['sma', 'ema', 'rsi', 'macd', 'bb_', 'adx', 'stoch', 'atr']):
                value = row[col]
                # Convert numpy types to Python types for JSON serialization
                if pd.notna(value):
                    indicators[col] = float(value) if hasattr(value, 'dtype') else value
        
        return indicators
    
    def get_strategy_info(self) -> Dict[str, Any]:
        """Get comprehensive strategy information for LumaTrade"""
        return {
            'name': self.__class__.__name__,
            'timeframe': self.timeframe,
            'minimal_roi': self.minimal_roi,
            'stoploss': self.stoploss,
            'can_short': self.can_short,
            'startup_candle_count': self.startup_candle_count,
            'order_types': self.order_types,
            'interface_version': self.INTERFACE_VERSION,
            'trade_count': self.trade_count,
            'last_analysis_time': self.last_analysis_time.isoformat() if self.last_analysis_time else None,
            'strategy_class': 'LumaTradeIStrategy'
        }

class LumaTradeSampleStrategy(LumaTradeIStrategy):
    """
    Sample strategy implementation for testing.
    Based on common freqtrade patterns with SMA and RSI.
    """
    
    # Strategy parameters
    minimal_roi = {
        "40": 0.0,
        "30": 0.01,
        "20": 0.02,
        "0": 0.04
    }
    
    stoploss = -0.10
    timeframe = '5m'
    startup_candle_count: int = 30
    
    def populate_indicators(self, dataframe: pd.DataFrame, metadata: dict) -> pd.DataFrame:
        """Add SMA and RSI indicators"""
        
        # Simple Moving Average (30 periods)
        dataframe['sma30'] = ta.SMA(dataframe, timeperiod=30)
        
        # Relative Strength Index (14 periods)  
        dataframe['rsi'] = ta.RSI(dataframe, timeperiod=14)
        
        # Exponential Moving Average (21 periods)
        dataframe['ema21'] = ta.EMA(dataframe, timeperiod=21)
        
        # MACD
        macd = ta.MACD(dataframe)
        dataframe['macd'] = macd['macd']
        dataframe['macdsignal'] = macd['macdsignal']
        dataframe['macdhist'] = macd['macdhist']
        
        return dataframe
    
    def populate_entry_trend(self, dataframe: pd.DataFrame, metadata: dict) -> pd.DataFrame:
        """
        Entry strategy:
        - Buy when price is above SMA30 and RSI is below 30 (oversold)
        """
        
        dataframe.loc[
            (
                (dataframe['close'] > dataframe['sma30']) &  # Price above SMA
                (dataframe['rsi'] < 30) &                     # RSI oversold
                (dataframe['volume'] > 0)                     # Volume check
            ),
            'enter_long'] = 1
        
        return dataframe
    
    def populate_exit_trend(self, dataframe: pd.DataFrame, metadata: dict) -> pd.DataFrame:
        """
        Exit strategy:
        - Sell when RSI is above 70 (overbought)
        """
        
        dataframe.loc[
            (
                (dataframe['rsi'] > 70)                      # RSI overbought
            ),
            'exit_long'] = 1
        
        return dataframe