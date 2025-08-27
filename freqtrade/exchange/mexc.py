""" MEXC exchange subclass """
import logging
from typing import Dict, List, Optional, Tuple

import ccxt

from freqtrade.enums import CandleType, MarginMode, TradingMode
from freqtrade.exceptions import DDosProtection, OperationalException, TemporaryError
from freqtrade.exchange import Exchange
from freqtrade.exchange.common import retrier


logger = logging.getLogger(__name__)


class Mexc(Exchange):

    _ft_has: Dict = {
        "stoploss_on_exchange": True,
        "stoploss_order_types": {"limit": "STOP_LOSS_LIMIT", "market": "STOP_LOSS"},
        "order_time_in_force": ['GTC', 'IOC', 'FOK'],
        "ohlcv_candle_limit": 1000,
        "trades_pagination": "time",
        "trades_pagination_arg": "startTime",
        "l2_limit_range": [5, 10, 20, 50, 100, 500, 1000],
        "ccxt_futures_name": "swap",
        "mark_ohlcv_timeframe": "1h",
        "funding_fee_timeframe": "8h",
    }

    _ft_has_futures: Dict = {
        "stoploss_order_types": {"limit": "STOP", "market": "STOP_MARKET"},
        "tickers_have_price": True,
        "fee_cost_in_contracts": True,
    }

    _supported_trading_mode_margin_pairs: List[Tuple[TradingMode, MarginMode]] = [
        # TradingMode.SPOT always supported and not required in this list
        (TradingMode.FUTURES, MarginMode.CROSS),
        (TradingMode.FUTURES, MarginMode.ISOLATED)
    ]

    def stoploss_adjust(self, stop_loss: float, order: Dict, side: str) -> bool:
        """
        Verify stop_loss against stoploss-order value (limit or price)
        Returns True if adjustment is necessary.
        :param side: "buy" or "sell"
        """
        return (
            order.get('stopPrice', None) is None
            or (
                order['type'] in ('STOP_LOSS', 'STOP_LOSS_LIMIT', 'STOP', 'STOP_MARKET')
                and (
                    (side == "sell" and stop_loss > float(order['stopPrice'])) or
                    (side == "buy" and stop_loss < float(order['stopPrice']))
                )
            ))

    @retrier
    def additional_exchange_init(self) -> None:
        """
        Additional exchange initialization logic.
        .api will be available at this point.
        Must be overridden in child methods if required.
        """
        try:
            if self.trading_mode == TradingMode.FUTURES and not self._config['dry_run']:
                # Check MEXC futures account settings
                pass
        except ccxt.DDoSProtection as e:
            raise DDosProtection(e) from e
        except (ccxt.NetworkError, ccxt.ExchangeError) as e:
            raise TemporaryError(
                f'Could not initialize MEXC exchange due to {e.__class__.__name__}. Message: {e}') from e
        except ccxt.BaseError as e:
            raise OperationalException(e) from e

    @retrier
    def _set_leverage(
        self,
        leverage: float,
        pair: Optional[str] = None,
        trading_mode: Optional[TradingMode] = None
    ):
        """
        Set's the leverage before making a trade, in order to not
        have the same leverage on every trade
        """
        trading_mode = trading_mode or self.trading_mode

        if self._config['dry_run'] or trading_mode != TradingMode.FUTURES:
            return

        try:
            self._api.set_leverage(leverage, pair)
        except ccxt.DDoSProtection as e:
            raise DDosProtection(e) from e
        except (ccxt.NetworkError, ccxt.ExchangeError) as e:
            raise TemporaryError(
                f'Could not set leverage due to {e.__class__.__name__}. Message: {e}') from e
        except ccxt.BaseError as e:
            raise OperationalException(e) from e

    def get_fee(self, symbol: str, type: str = None, side: str = None, amount: float = None,
                price: float = None, takerOrMaker: str = 'taker', params: Dict = {}) -> float:
        """
        Fetch trading fees for MEXC
        """
        try:
            # MEXC typically has 0.2% maker and taker fees for spot trading
            # For futures, it's usually 0.02% maker and 0.06% taker
            if self.trading_mode == TradingMode.FUTURES:
                return 0.0006 if takerOrMaker == 'taker' else 0.0002  # 0.06% / 0.02%
            else:
                return 0.002 if takerOrMaker == 'taker' else 0.002  # 0.2% / 0.2%
        except Exception:
            # Fallback to default fee structure
            return 0.002

    @retrier  
    def set_margin_mode(self, pair: str, margin_mode: MarginMode, params: Dict = {}):
        """
        Set margin mode (cross or isolated) for MEXC futures
        """
        if self.trading_mode != TradingMode.FUTURES:
            return
            
        if self._config['dry_run']:
            return
            
        try:
            mode = 1 if margin_mode == MarginMode.CROSS else 2  # MEXC uses 1=cross, 2=isolated
            self._api.set_margin_mode(mode, pair, params)
        except ccxt.DDoSProtection as e:
            raise DDosProtection(e) from e
        except (ccxt.NetworkError, ccxt.ExchangeError) as e:
            raise TemporaryError(
                f'Could not set margin mode due to {e.__class__.__name__}. Message: {e}') from e
        except ccxt.BaseError as e:
            raise OperationalException(e) from e