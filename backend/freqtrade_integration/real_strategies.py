"""
Real Freqtrade Strategies for LumaTrade
These are production-ready strategies that use real market data and implement proper Freqtrade patterns.
"""

import pandas as pd
import numpy as np
from typing import Dict, Any
import talib.abstract as ta
from datetime import datetime, timezone

from .strategy_interface import LumaTradeIStrategy

class RSIMACDStrategy(LumaTradeIStrategy):
    """
    Real RSI + MACD Strategy
    Entry: RSI < 30 (oversold) AND MACD line crosses above signal line
    Exit: RSI > 70 (overbought) OR MACD line crosses below signal line
    """
    
    # Strategy configuration
    minimal_roi = {
        "0": 0.06,    # 6% profit target immediately
        "15": 0.04,   # 4% after 15 minutes
        "30": 0.02,   # 2% after 30 minutes
        "60": 0.01,   # 1% after 1 hour
        "120": 0.0    # Break even after 2 hours
    }
    
    stoploss = -0.08  # 8% stop loss
    timeframe = '5m'
    startup_candle_count = 50  # Need enough data for indicators
    
    # Strategy parameters
    rsi_period = 14
    rsi_oversold = 30
    rsi_overbought = 70
    macd_fast = 12
    macd_slow = 26
    macd_signal = 9
    
    def populate_indicators(self, dataframe: pd.DataFrame, metadata: dict) -> pd.DataFrame:
        """Calculate technical indicators for RSI + MACD strategy"""
        
        # RSI (Relative Strength Index)
        dataframe['rsi'] = ta.RSI(dataframe, timeperiod=self.rsi_period)
        
        # MACD (Moving Average Convergence Divergence)
        macd = ta.MACD(dataframe, 
                      fastperiod=self.macd_fast,
                      slowperiod=self.macd_slow, 
                      signalperiod=self.macd_signal)
        dataframe['macd'] = macd['macd']
        dataframe['macdsignal'] = macd['macdsignal']
        dataframe['macdhist'] = macd['macdhist']
        
        # Additional indicators for context
        dataframe['sma20'] = ta.SMA(dataframe, timeperiod=20)
        dataframe['sma50'] = ta.SMA(dataframe, timeperiod=50)
        dataframe['ema12'] = ta.EMA(dataframe, timeperiod=12)
        dataframe['volume_sma'] = ta.SMA(dataframe['volume'], timeperiod=20)
        
        # Bollinger Bands for volatility context
        bb = ta.BBANDS(dataframe, timeperiod=20)
        dataframe['bb_upper'] = bb['upperband']
        dataframe['bb_middle'] = bb['middleband']
        dataframe['bb_lower'] = bb['lowerband']
        
        return dataframe
    
    def populate_entry_trend(self, dataframe: pd.DataFrame, metadata: dict) -> pd.DataFrame:
        """Define entry conditions for RSI + MACD strategy"""
        
        # MACD crossover: MACD line crosses above signal line
        dataframe['macd_crossover'] = (
            (dataframe['macd'] > dataframe['macdsignal']) &
            (dataframe['macd'].shift(1) <= dataframe['macdsignal'].shift(1))
        )
        
        # Entry conditions
        dataframe.loc[
            (
                (dataframe['rsi'] < self.rsi_oversold) &          # RSI oversold
                (dataframe['macd_crossover']) &                   # MACD bullish crossover
                (dataframe['volume'] > dataframe['volume_sma']) & # Above average volume
                (dataframe['close'] > dataframe['sma20'])         # Price above short-term trend
            ),
            'enter_long'] = 1
        
        return dataframe
    
    def populate_exit_trend(self, dataframe: pd.DataFrame, metadata: dict) -> pd.DataFrame:
        """Define exit conditions for RSI + MACD strategy"""
        
        # MACD bearish crossover: MACD line crosses below signal line
        dataframe['macd_bearish_crossover'] = (
            (dataframe['macd'] < dataframe['macdsignal']) &
            (dataframe['macd'].shift(1) >= dataframe['macdsignal'].shift(1))
        )
        
        # Exit conditions
        dataframe.loc[
            (
                (dataframe['rsi'] > self.rsi_overbought) |        # RSI overbought
                (dataframe['macd_bearish_crossover']) |           # MACD bearish crossover
                (dataframe['close'] < dataframe['bb_lower'])      # Price below Bollinger Band lower
            ),
            'exit_long'] = 1
        
        return dataframe

class BreakoutStrategy(LumaTradeIStrategy):
    """
    Real Breakout Strategy
    Entry: Price breaks above resistance with high volume
    Exit: Price falls below support or profit target reached
    """
    
    minimal_roi = {
        "0": 0.08,    # 8% profit target
        "20": 0.05,   # 5% after 20 minutes
        "40": 0.03,   # 3% after 40 minutes
        "80": 0.0     # Break even after 80 minutes
    }
    
    stoploss = -0.06  # 6% stop loss
    timeframe = '15m'
    startup_candle_count = 100
    
    # Strategy parameters
    breakout_period = 20
    volume_multiplier = 1.5
    atr_period = 14
    
    def populate_indicators(self, dataframe: pd.DataFrame, metadata: dict) -> pd.DataFrame:
        """Calculate indicators for breakout strategy"""
        
        # Support and Resistance levels
        dataframe['resistance'] = dataframe['high'].rolling(window=self.breakout_period).max()
        dataframe['support'] = dataframe['low'].rolling(window=self.breakout_period).min()
        
        # Average True Range for volatility
        dataframe['atr'] = ta.ATR(dataframe, timeperiod=self.atr_period)
        
        # Volume indicators
        dataframe['volume_sma'] = ta.SMA(dataframe['volume'], timeperiod=20)
        dataframe['volume_ratio'] = dataframe['volume'] / dataframe['volume_sma']
        
        # Moving averages for trend confirmation
        dataframe['sma20'] = ta.SMA(dataframe, timeperiod=20)
        dataframe['ema50'] = ta.EMA(dataframe, timeperiod=50)
        
        # RSI for momentum
        dataframe['rsi'] = ta.RSI(dataframe, timeperiod=14)
        
        # MACD for trend confirmation
        macd = ta.MACD(dataframe)
        dataframe['macd'] = macd['macd']
        dataframe['macdsignal'] = macd['macdsignal']
        
        return dataframe
    
    def populate_entry_trend(self, dataframe: pd.DataFrame, metadata: dict) -> pd.DataFrame:
        """Define breakout entry conditions"""
        
        # Breakout conditions
        dataframe.loc[
            (
                (dataframe['close'] > dataframe['resistance'].shift(1)) &    # Price breaks resistance
                (dataframe['volume_ratio'] > self.volume_multiplier) &       # High volume
                (dataframe['rsi'] > 50) &                                    # Momentum confirmation
                (dataframe['macd'] > dataframe['macdsignal']) &              # MACD bullish
                (dataframe['close'] > dataframe['sma20'])                    # Above trend
            ),
            'enter_long'] = 1
        
        return dataframe
    
    def populate_exit_trend(self, dataframe: pd.DataFrame, metadata: dict) -> pd.DataFrame:
        """Define breakout exit conditions"""
        
        dataframe.loc[
            (
                (dataframe['close'] < dataframe['support'].shift(1)) |       # Price breaks support
                (dataframe['rsi'] < 30) |                                    # Oversold
                (dataframe['macd'] < dataframe['macdsignal'])                # MACD bearish
            ),
            'exit_long'] = 1
        
        return dataframe

class MeanReversionStrategy(LumaTradeIStrategy):
    """
    Real Mean Reversion Strategy
    Entry: Price deviates significantly from mean and shows reversal signs
    Exit: Price returns to mean or stops out
    """
    
    minimal_roi = {
        "0": 0.04,
        "30": 0.02,
        "60": 0.01,
        "120": 0.0
    }
    
    stoploss = -0.05
    timeframe = '5m'
    startup_candle_count = 50
    
    # Strategy parameters
    bb_period = 20
    bb_std = 2.0
    rsi_period = 14
    
    def populate_indicators(self, dataframe: pd.DataFrame, metadata: dict) -> pd.DataFrame:
        """Calculate mean reversion indicators"""
        
        # Bollinger Bands
        bb = ta.BBANDS(dataframe, timeperiod=self.bb_period, nbdevup=self.bb_std, nbdevdn=self.bb_std)
        dataframe['bb_upper'] = bb['upperband']
        dataframe['bb_middle'] = bb['middleband']
        dataframe['bb_lower'] = bb['lowerband']
        
        # RSI
        dataframe['rsi'] = ta.RSI(dataframe, timeperiod=self.rsi_period)
        
        # Stochastic
        stoch = ta.STOCH(dataframe)
        dataframe['stoch_k'] = stoch['slowk']
        dataframe['stoch_d'] = stoch['slowd']
        
        # Williams %R
        dataframe['williams_r'] = ta.WILLR(dataframe, timeperiod=14)
        
        # CCI (Commodity Channel Index)
        dataframe['cci'] = ta.CCI(dataframe, timeperiod=20)
        
        return dataframe
    
    def populate_entry_trend(self, dataframe: pd.DataFrame, metadata: dict) -> pd.DataFrame:
        """Mean reversion entry conditions"""
        
        dataframe.loc[
            (
                (dataframe['close'] < dataframe['bb_lower']) &    # Price below lower BB
                (dataframe['rsi'] < 30) &                         # Oversold RSI
                (dataframe['stoch_k'] < 20) &                     # Oversold Stochastic
                (dataframe['williams_r'] < -80) &                 # Oversold Williams %R
                (dataframe['cci'] < -100)                         # Oversold CCI
            ),
            'enter_long'] = 1
        
        return dataframe
    
    def populate_exit_trend(self, dataframe: pd.DataFrame, metadata: dict) -> pd.DataFrame:
        """Mean reversion exit conditions"""
        
        dataframe.loc[
            (
                (dataframe['close'] > dataframe['bb_middle']) |   # Price returns to mean
                (dataframe['rsi'] > 70) |                         # Overbought
                (dataframe['stoch_k'] > 80)                       # Overbought Stochastic
            ),
            'exit_long'] = 1
        
        return dataframe

# Strategy registry for easy access
REAL_STRATEGIES = {
    'rsi_macd': RSIMACDStrategy,
    'breakout': BreakoutStrategy, 
    'mean_reversion': MeanReversionStrategy
}