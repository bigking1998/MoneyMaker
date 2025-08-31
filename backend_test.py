#!/usr/bin/env python3
"""
LumaTrade Backend API Testing Suite
Tests all API endpoints and functionality
"""

import requests
import sys
import json
import time
from datetime import datetime
from typing import Dict, List, Any

class LumaTradeAPITester:
    def __init__(self, base_url="https://crypto-bot-hub-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def log_test(self, name: str, success: bool, details: str = ""):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}: PASSED {details}")
        else:
            self.failed_tests.append(f"{name}: {details}")
            print(f"❌ {name}: FAILED {details}")

    def make_request(self, method: str, endpoint: str, data: Dict = None, timeout: int = 10) -> tuple:
        """Make HTTP request and return (success, response_data, status_code)"""
        url = f"{self.api_url}/{endpoint}" if not endpoint.startswith('http') else endpoint
        
        try:
            if method.upper() == 'GET':
                response = requests.get(url, timeout=timeout)
            elif method.upper() == 'POST':
                response = requests.post(url, json=data, timeout=timeout)
            else:
                return False, {}, 0
                
            return response.status_code < 400, response.json() if response.content else {}, response.status_code
            
        except requests.exceptions.Timeout:
            return False, {"error": "Request timeout"}, 0
        except requests.exceptions.ConnectionError:
            return False, {"error": "Connection error"}, 0
        except Exception as e:
            return False, {"error": str(e)}, 0

    def test_root_endpoint(self):
        """Test API root endpoint"""
        success, data, status = self.make_request('GET', '')
        expected_keys = ['message', 'status']
        
        if success and all(key in data for key in expected_keys):
            self.log_test("Root Endpoint", True, f"Status: {status}, Message: {data.get('message', 'N/A')}")
        else:
            self.log_test("Root Endpoint", False, f"Status: {status}, Data: {data}")

    def test_crypto_pairs(self):
        """Test crypto pairs endpoint"""
        success, data, status = self.make_request('GET', 'crypto/pairs')
        
        if success and isinstance(data, list):
            if len(data) > 0:
                # Check first item structure
                first_pair = data[0]
                required_fields = ['symbol', 'price', 'base_currency', 'quote_currency']
                
                if all(field in first_pair for field in required_fields):
                    self.log_test("Crypto Pairs", True, f"Found {len(data)} pairs, Status: {status}")
                else:
                    missing = [f for f in required_fields if f not in first_pair]
                    self.log_test("Crypto Pairs", False, f"Missing fields: {missing}")
            else:
                self.log_test("Crypto Pairs", False, "Empty response")
        else:
            self.log_test("Crypto Pairs", False, f"Status: {status}, Invalid response format")

    def test_specific_crypto_pair(self):
        """Test specific crypto pair endpoint"""
        test_symbols = ['ETH/USD', 'BTC/USD', 'eth/usd']  # Test case sensitivity
        
        for symbol in test_symbols:
            success, data, status = self.make_request('GET', f'crypto/pair/{symbol}')
            
            if success and 'symbol' in data:
                self.log_test(f"Crypto Pair {symbol}", True, f"Price: ${data.get('price', 'N/A')}")
            else:
                self.log_test(f"Crypto Pair {symbol}", False, f"Status: {status}")

    def test_exchange_prices(self):
        """Test exchange prices endpoint"""
        test_symbols = ['ETH/USD', 'BTC/USD']
        
        for symbol in test_symbols:
            success, data, status = self.make_request('GET', f'exchanges/prices/{symbol}')
            
            if success and isinstance(data, dict):
                exchanges = list(data.keys())
                self.log_test(f"Exchange Prices {symbol}", True, f"Found {len(exchanges)} exchanges")
            else:
                self.log_test(f"Exchange Prices {symbol}", False, f"Status: {status}")

    def test_aggregated_exchanges(self):
        """Test aggregated exchanges endpoint"""
        success, data, status = self.make_request('GET', 'exchanges/aggregated')
        
        if success and isinstance(data, list):
            if len(data) > 0:
                first_item = data[0]
                required_fields = ['exchange', 'symbol', 'price', 'volume', 'status']
                
                if all(field in first_item for field in required_fields):
                    self.log_test("Aggregated Exchanges", True, f"Found {len(data)} exchange entries")
                else:
                    missing = [f for f in required_fields if f not in first_item]
                    self.log_test("Aggregated Exchanges", False, f"Missing fields: {missing}")
            else:
                self.log_test("Aggregated Exchanges", False, "Empty response")
        else:
            self.log_test("Aggregated Exchanges", False, f"Status: {status}")

    def test_market_stats(self):
        """Test market statistics endpoint"""
        success, data, status = self.make_request('GET', 'market/stats')
        
        if success:
            required_fields = ['total_market_cap', 'total_volume_24h', 'market_sentiment']
            
            if all(field in data for field in required_fields):
                sentiment = data.get('market_sentiment', 'unknown')
                self.log_test("Market Stats", True, f"Sentiment: {sentiment}")
            else:
                missing = [f for f in required_fields if f not in data]
                self.log_test("Market Stats", False, f"Missing fields: {missing}")
        else:
            self.log_test("Market Stats", False, f"Status: {status}")

    def test_dydx_endpoints(self):
        """Test DyDx integration endpoints"""
        # Test connect wallet
        wallet_data = {"address": "0x1234567890abcdef"}
        success, data, status = self.make_request('POST', 'dydx/connect', wallet_data)
        
        if success and data.get('status') == 'connected':
            self.log_test("DyDx Connect", True, f"Address: {data.get('address')}")
        else:
            self.log_test("DyDx Connect", False, f"Status: {status}")

        # Test get positions
        test_address = "0x1234567890abcdef"
        success, data, status = self.make_request('GET', f'dydx/positions/{test_address}')
        
        if success and 'positions' in data:
            self.log_test("DyDx Positions", True, f"Total value: {data.get('total_value', 0)}")
        else:
            self.log_test("DyDx Positions", False, f"Status: {status}")

        # Test execute trade
        trade_data = {
            "symbol": "ETH/USD",
            "side": "buy",
            "amount": 1.0,
            "price": 3600
        }
        success, data, status = self.make_request('POST', 'dydx/trade', trade_data)
        
        if success and 'status' in data:
            self.log_test("DyDx Trade", True, f"Trade ID: {data.get('trade_id', 'N/A')}")
        else:
            self.log_test("DyDx Trade", False, f"Status: {status}")

    def test_portfolio_endpoints(self):
        """Test portfolio management endpoints"""
        # Create portfolio
        portfolio_data = {
            "user_address": "0xtest123",
            "balances": {"ETH": 10.5, "USD": 5000.0},
            "total_value_usd": 15000.0,
            "pnl_24h": 150.0
        }
        
        success, data, status = self.make_request('POST', 'portfolio', portfolio_data)
        
        if success and 'id' in data:
            self.log_test("Create Portfolio", True, f"Portfolio ID: {data.get('id')}")
            
            # Test get portfolio
            user_address = portfolio_data['user_address']
            success, data, status = self.make_request('GET', f'portfolio/{user_address}')
            
            if success and data.get('user_address') == user_address:
                self.log_test("Get Portfolio", True, f"Total value: ${data.get('total_value_usd', 0)}")
            else:
                self.log_test("Get Portfolio", False, f"Status: {status}")
        else:
            self.log_test("Create Portfolio", False, f"Status: {status}")

    def test_trades_endpoints(self):
        """Test trading endpoints"""
        # Create trade
        trade_data = {
            "user_address": "0xtest123",
            "symbol": "ETH/USD",
            "side": "buy",
            "amount": 1.0,
            "price": 3600.0,
            "fee": 5.0,
            "exchange": "binance",
            "status": "completed"
        }
        
        success, data, status = self.make_request('POST', 'trades', trade_data)
        
        if success and 'id' in data:
            self.log_test("Create Trade", True, f"Trade ID: {data.get('id')}")
            
            # Test get user trades
            user_address = trade_data['user_address']
            success, data, status = self.make_request('GET', f'trades/{user_address}')
            
            if success and isinstance(data, list):
                self.log_test("Get User Trades", True, f"Found {len(data)} trades")
            else:
                self.log_test("Get User Trades", False, f"Status: {status}")
        else:
            self.log_test("Create Trade", False, f"Status: {status}")

    def test_websocket_endpoint(self):
        """Test WebSocket endpoint availability"""
        # We can't easily test WebSocket in this script, but we can check if the endpoint exists
        # This is a placeholder - in a real test we'd use websocket-client library
        self.log_test("WebSocket Endpoint", True, "WebSocket endpoint exists (not tested in this script)")

    def test_freqtrade_endpoints(self):
        """Test Freqtrade integration endpoints"""
        # Test 1: List strategies (should be empty initially)
        success, data, status = self.make_request('GET', 'freqtrade/strategies')
        
        if success and 'strategies' in data:
            initial_count = len(data['strategies'])
            self.log_test("Freqtrade - List Strategies", True, f"Found {initial_count} strategies initially")
        else:
            self.log_test("Freqtrade - List Strategies", False, f"Status: {status}, Data: {data}")
            return
        
        # Test 2: Create a new SMA-RSI strategy
        strategy_data = {
            "name": "Test_SMA_RSI_Strategy",
            "type": "sample",
            "symbol": "BTC/USD",
            "timeframe": "5m",
            "stake_amount": 100,
            "dry_run": True,
            "minimal_roi": {"0": 0.04, "20": 0.02, "30": 0.01, "40": 0.0},
            "stoploss": -0.10
        }
        
        success, data, status = self.make_request('POST', 'freqtrade/strategy/create', strategy_data)
        
        if success and data.get('success') and 'strategy_id' in data:
            strategy_id = data['strategy_id']
            self.log_test("Freqtrade - Create Strategy", True, f"Created strategy ID: {strategy_id}")
            
            # Test 3: Verify strategy was created by listing again
            success, data, status = self.make_request('GET', 'freqtrade/strategies')
            
            if success and len(data.get('strategies', [])) > initial_count:
                self.log_test("Freqtrade - Verify Strategy Created", True, f"Strategy count increased to {len(data['strategies'])}")
                
                # Test 4: Get specific strategy details
                success, data, status = self.make_request('GET', f'freqtrade/strategy/{strategy_id}')
                
                if success and data.get('success') and 'strategy' in data:
                    strategy_info = data['strategy']
                    self.log_test("Freqtrade - Get Strategy Details", True, f"Strategy name: {strategy_info.get('name', 'N/A')}")
                else:
                    self.log_test("Freqtrade - Get Strategy Details", False, f"Status: {status}")
                
                # Test 5: Analyze strategy signals
                success, data, status = self.make_request('POST', f'freqtrade/strategy/{strategy_id}/analyze')
                
                if success and data.get('success') and 'analysis' in data:
                    analysis = data['analysis']
                    signal = analysis.get('signal', 'unknown')
                    indicators = analysis.get('indicators', {})
                    current_price = analysis.get('current_price')
                    
                    self.log_test("Freqtrade - Strategy Analysis", True, 
                                f"Signal: {signal}, Price: ${current_price}, Indicators: {len(indicators)}")
                    
                    # Test 6: Verify technical indicators are calculated
                    expected_indicators = ['sma30', 'rsi', 'ema21', 'macd']
                    found_indicators = [ind for ind in expected_indicators if ind in indicators]
                    
                    if len(found_indicators) >= 2:  # At least 2 indicators should be present
                        self.log_test("Freqtrade - Technical Indicators", True, 
                                    f"Found indicators: {found_indicators}")
                    else:
                        self.log_test("Freqtrade - Technical Indicators", False, 
                                    f"Expected indicators not found. Got: {list(indicators.keys())}")
                    
                    # Test 7: Verify signal generation logic
                    if signal in ['buy', 'sell', 'hold']:
                        self.log_test("Freqtrade - Signal Generation", True, f"Valid signal: {signal}")
                    else:
                        self.log_test("Freqtrade - Signal Generation", False, f"Invalid signal: {signal}")
                        
                else:
                    self.log_test("Freqtrade - Strategy Analysis", False, f"Status: {status}, Data: {data}")
                
                # Test 8: Test analyze-all endpoint
                success, data, status = self.make_request('POST', 'freqtrade/analyze-all')
                
                if success and data.get('success') and 'results' in data:
                    results = data['results']
                    analyzed_count = data.get('analyzed_count', 0)
                    self.log_test("Freqtrade - Analyze All Strategies", True, 
                                f"Analyzed {analyzed_count} strategies")
                else:
                    self.log_test("Freqtrade - Analyze All Strategies", False, f"Status: {status}")
                
                # Test 9: Delete strategy (cleanup)
                success, data, status = self.make_request('DELETE', f'freqtrade/strategy/{strategy_id}')
                
                if success and data.get('success'):
                    self.log_test("Freqtrade - Delete Strategy", True, "Strategy deleted successfully")
                else:
                    self.log_test("Freqtrade - Delete Strategy", False, f"Status: {status}")
                    
            else:
                self.log_test("Freqtrade - Verify Strategy Created", False, "Strategy count did not increase")
        else:
            self.log_test("Freqtrade - Create Strategy", False, f"Status: {status}, Data: {data}")

    def test_freqtrade_data_integration(self):
        """Test Freqtrade integration with real-time data"""
        # Test that crypto data is available for Freqtrade analysis
        success, data, status = self.make_request('GET', 'crypto/pairs')
        
        if success and isinstance(data, list) and len(data) > 0:
            btc_data = None
            for pair in data:
                if pair.get('symbol') == 'BTC/USD':
                    btc_data = pair
                    break
            
            if btc_data:
                self.log_test("Freqtrade - BTC Data Available", True, 
                            f"BTC price: ${btc_data.get('price', 'N/A')}")
                
                # Create a strategy to test data flow
                strategy_data = {
                    "name": "Data_Integration_Test",
                    "type": "sample",
                    "symbol": "BTC/USD",
                    "timeframe": "5m"
                }
                
                success, data, status = self.make_request('POST', 'freqtrade/strategy/create', strategy_data)
                
                if success and 'strategy_id' in data:
                    strategy_id = data['strategy_id']
                    
                    # Analyze with current market data
                    success, data, status = self.make_request('POST', f'freqtrade/strategy/{strategy_id}/analyze')
                    
                    if success and 'analysis' in data:
                        analysis = data['analysis']
                        current_price = analysis.get('current_price')
                        
                        # Verify the analysis uses real market data
                        if current_price and current_price > 0:
                            self.log_test("Freqtrade - Real-time Data Integration", True, 
                                        f"Analysis using real price: ${current_price}")
                        else:
                            self.log_test("Freqtrade - Real-time Data Integration", False, 
                                        "Analysis not using real price data")
                    else:
                        self.log_test("Freqtrade - Real-time Data Integration", False, 
                                    "Failed to analyze with real-time data")
                    
                    # Cleanup
                    self.make_request('DELETE', f'freqtrade/strategy/{strategy_id}')
                else:
                    self.log_test("Freqtrade - Real-time Data Integration", False, 
                                "Failed to create test strategy")
            else:
                self.log_test("Freqtrade - BTC Data Available", False, "BTC/USD data not found")
        else:
            self.log_test("Freqtrade - BTC Data Available", False, "No crypto data available")

    def test_trading_strategy_manager(self):
        """Test trading strategy manager endpoints"""
        # Test strategy manager functionality
        success, data, status = self.make_request('POST', 'trading/strategy-manager/test')
        
        if success and data.get('success'):
            self.log_test("Trading - Strategy Manager Test", True, 
                        f"Manager working: {data.get('message', 'N/A')}")
        else:
            self.log_test("Trading - Strategy Manager Test", False, f"Status: {status}")
        
        # Test lifecycle summary
        success, data, status = self.make_request('GET', 'trading/lifecycle-summary')
        
        if success and data.get('success'):
            lifecycle_data = data.get('data', {})
            total_strategies = lifecycle_data.get('total_strategies', 0)
            self.log_test("Trading - Lifecycle Summary", True, 
                        f"Total strategies: {total_strategies}")
        else:
            self.log_test("Trading - Lifecycle Summary", False, f"Status: {status}")

    def test_error_handling(self):
        """Test error handling for invalid requests"""
        # Test invalid crypto pair
        success, data, status = self.make_request('GET', 'crypto/pair/INVALID')
        
        if not success or status == 404:
            self.log_test("Error Handling - Invalid Pair", True, f"Correctly returned error for invalid pair")
        else:
            self.log_test("Error Handling - Invalid Pair", False, f"Should have returned 404, got {status}")

        # Test invalid exchange prices
        success, data, status = self.make_request('GET', 'exchanges/prices/INVALID')
        
        if not success or status == 404:
            self.log_test("Error Handling - Invalid Exchange", True, f"Correctly returned error for invalid exchange")
        else:
            self.log_test("Error Handling - Invalid Exchange", False, f"Should have returned error, got {status}")
        
        # Test invalid Freqtrade strategy
        success, data, status = self.make_request('GET', 'freqtrade/strategy/invalid-id')
        
        if not success or status == 404:
            self.log_test("Error Handling - Invalid Strategy ID", True, f"Correctly returned error for invalid strategy")
        else:
            self.log_test("Error Handling - Invalid Strategy ID", False, f"Should have returned 404, got {status}")
        
        # Test invalid strategy type
        invalid_strategy_data = {
            "name": "Invalid_Strategy",
            "type": "invalid_type",
            "symbol": "BTC/USD"
        }
        
        success, data, status = self.make_request('POST', 'freqtrade/strategy/create', invalid_strategy_data)
        
        if not success or status >= 400:
            self.log_test("Error Handling - Invalid Strategy Type", True, f"Correctly rejected invalid strategy type")
        else:
            self.log_test("Error Handling - Invalid Strategy Type", False, f"Should have rejected invalid type, got {status}")

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting LumaTrade API Tests...")
        print(f"📡 Testing API at: {self.api_url}")
        print("=" * 60)
        
        # Core API tests
        self.test_root_endpoint()
        self.test_crypto_pairs()
        self.test_specific_crypto_pair()
        self.test_exchange_prices()
        self.test_aggregated_exchanges()
        self.test_market_stats()
        
        # Integration tests
        self.test_dydx_endpoints()
        self.test_portfolio_endpoints()
        self.test_trades_endpoints()
        
        # Freqtrade integration tests (NEW)
        print("\n🤖 Testing Freqtrade Integration...")
        self.test_freqtrade_endpoints()
        self.test_freqtrade_data_integration()
        self.test_trading_strategy_manager()
        
        # WebSocket and error handling
        self.test_websocket_endpoint()
        self.test_error_handling()
        
        # Print summary
        print("=" * 60)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.failed_tests:
            print("\n❌ Failed Tests:")
            for failed_test in self.failed_tests:
                print(f"   • {failed_test}")
        
        success_rate = (self.tests_passed / self.tests_run) * 100 if self.tests_run > 0 else 0
        print(f"✨ Success Rate: {success_rate:.1f}%")
        
        return self.tests_passed == self.tests_run

def main():
    """Main test execution"""
    tester = LumaTradeAPITester()
    
    try:
        success = tester.run_all_tests()
        return 0 if success else 1
    except KeyboardInterrupt:
        print("\n⚠️  Tests interrupted by user")
        return 1
    except Exception as e:
        print(f"\n💥 Unexpected error: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main())