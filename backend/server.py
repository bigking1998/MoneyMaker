from fastapi import FastAPI, APIRouter, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any
import uuid
from datetime import datetime, timedelta
import json
import asyncio
import aiohttp
import ccxt
import pandas as pd
import numpy as np
from collections import defaultdict
from datetime import timezone

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI(title="LumaTrade API", description="Crypto Trading Platform API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        
    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            
    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)
        
    async def broadcast(self, message: dict):
        message_str = json.dumps(message, default=str)  # Convert datetime to string
        for connection in self.active_connections:
            try:
                await connection.send_text(message_str)
            except:
                # Remove broken connections
                self.active_connections.remove(connection)

manager = ConnectionManager()

# Pydantic Models
class CryptoPair(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    symbol: str
    base_currency: str
    quote_currency: str
    price: float
    price_24h_change: float
    volume_24h: float
    market_cap: Optional[float] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class ExchangePrice(BaseModel):
    exchange: str
    symbol: str
    price: float
    volume: float
    status: str  # "limited", "trending", "rising", "falling"
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class TradingPair(BaseModel):
    symbol: str
    price: float
    change_24h: float
    volume_24h: float
    high_24h: float
    low_24h: float
    
class Portfolio(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_address: str
    balances: Dict[str, float]
    total_value_usd: float
    pnl_24h: float
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class Trade(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_address: str
    symbol: str
    side: str  # "buy" or "sell"
    amount: float
    price: float
    fee: float
    exchange: str
    status: str  # "pending", "completed", "failed"
    timestamp: datetime = Field(default_factory=datetime.utcnow)

# Global variables for caching
crypto_data_cache = {}
exchange_prices_cache = defaultdict(dict)

# Exchange configuration
EXCHANGES = {
    'binance': ccxt.binance({'sandbox': False, 'enableRateLimit': True}),
    'okx': ccxt.okx({'sandbox': False, 'enableRateLimit': True}),
    'bybit': ccxt.bybit({'sandbox': False, 'enableRateLimit': True}),
    'kraken': ccxt.kraken({'sandbox': False, 'enableRateLimit': True}),
}

# Crypto data fetching functions
async def fetch_crypto_data():
    """Fetch crypto data from multiple sources"""
    try:
        # Fetch from CoinGecko API
        async with aiohttp.ClientSession() as session:
            url = "https://api.coingecko.com/api/v3/coins/markets"
            params = {
                'vs_currency': 'usd',
                'order': 'market_cap_desc',
                'per_page': 100,
                'page': 1,
                'sparkline': False,
                'price_change_percentage': '24h'
            }
            
            async with session.get(url, params=params) as response:
                if response.status == 200:
                    data = await response.json()
                    
                    for coin in data:
                        symbol = coin['symbol'].upper() + '/USD'
                        crypto_pair = CryptoPair(
                            symbol=symbol,
                            base_currency=coin['symbol'].upper(),
                            quote_currency='USD',
                            price=coin['current_price'] or 0,
                            price_24h_change=coin['price_change_percentage_24h'] or 0,
                            volume_24h=coin['total_volume'] or 0,
                            market_cap=coin['market_cap']
                        )
                        crypto_data_cache[symbol] = crypto_pair.dict()
                        
    except Exception as e:
        logging.error(f"Error fetching crypto data: {e}")

async def fetch_exchange_prices():
    """Fetch prices from multiple exchanges"""
    try:
        symbols = ['BTC/USD', 'ETH/USD', 'BNB/USD', 'ADA/USD', 'SOL/USD']
        
        for exchange_name, exchange in EXCHANGES.items():
            try:
                for symbol in symbols:
                    try:
                        ticker = exchange.fetch_ticker(symbol)
                        
                        # Determine status based on price change
                        change_24h = ticker.get('percentage', 0) or 0
                        if abs(change_24h) < 1:
                            status = "limited"
                        elif change_24h > 5:
                            status = "rising"
                        elif change_24h < -5:
                            status = "falling"
                        else:
                            status = "trending"
                            
                        exchange_price = ExchangePrice(
                            exchange=exchange_name,
                            symbol=symbol,
                            price=ticker['last'] or 0,
                            volume=ticker['quoteVolume'] or 0,
                            status=status
                        )
                        
                        exchange_prices_cache[symbol][exchange_name] = exchange_price.dict()
                        
                    except Exception as e:
                        logging.error(f"Error fetching {symbol} from {exchange_name}: {e}")
                        
            except Exception as e:
                logging.error(f"Error with exchange {exchange_name}: {e}")
                
    except Exception as e:
        logging.error(f"Error fetching exchange prices: {e}")

# Background task to update crypto data
async def update_crypto_data():
    """Background task to continuously update crypto data"""
    while True:
        await fetch_crypto_data()
        await fetch_exchange_prices()
        
        # Broadcast updates to WebSocket clients
        if crypto_data_cache:
            await manager.broadcast({
                'type': 'crypto_update',
                'data': dict(list(crypto_data_cache.items())[:20])  # Send top 20
            })
            
        if exchange_prices_cache:
            await manager.broadcast({
                'type': 'exchange_update', 
                'data': dict(exchange_prices_cache)
            })
            
        await asyncio.sleep(30)  # Update every 30 seconds

# API Routes
@api_router.get("/")
async def root():
    return {"message": "LumaTrade API v1.0", "status": "running"}

@api_router.get("/crypto/pairs", response_model=List[Dict])
async def get_crypto_pairs():
    """Get list of crypto trading pairs"""
    if not crypto_data_cache:
        await fetch_crypto_data()
    return list(crypto_data_cache.values())

@api_router.get("/crypto/pair/{symbol}")
async def get_crypto_pair(symbol: str):
    """Get specific crypto pair data"""
    symbol = symbol.upper()
    if symbol in crypto_data_cache:
        return crypto_data_cache[symbol]
    raise HTTPException(status_code=404, detail=f"Crypto pair {symbol} not found")

@api_router.get("/exchanges/prices/{symbol}")
async def get_exchange_prices(symbol: str):
    """Get prices from all exchanges for a symbol"""
    symbol = symbol.upper()
    if symbol in exchange_prices_cache:
        return exchange_prices_cache[symbol]
    raise HTTPException(status_code=404, detail=f"No exchange data for {symbol}")

@api_router.get("/exchanges/aggregated")
async def get_aggregated_exchanges():
    """Get aggregated exchange data for dashboard"""
    result = []
    
    for symbol, exchanges in exchange_prices_cache.items():
        for exchange_name, data in exchanges.items():
            result.append({
                'exchange': exchange_name,
                'symbol': symbol,
                'price': data['price'],
                'volume': data['volume'],
                'status': data['status'],
                'timestamp': data['timestamp']
            })
    
    return result

@api_router.post("/portfolio", response_model=Portfolio)
async def create_portfolio(portfolio_data: dict):
    """Create or update user portfolio"""
    portfolio = Portfolio(**portfolio_data)
    await db.portfolios.insert_one(portfolio.dict())
    return portfolio

@api_router.get("/portfolio/{user_address}", response_model=Portfolio)
async def get_portfolio(user_address: str):
    """Get user portfolio"""
    portfolio = await db.portfolios.find_one({"user_address": user_address})
    if portfolio:
        return Portfolio(**portfolio)
    raise HTTPException(status_code=404, detail="Portfolio not found")

@api_router.post("/trades", response_model=Trade)
async def create_trade(trade_data: dict):
    """Create a new trade"""
    trade = Trade(**trade_data)
    await db.trades.insert_one(trade.dict())
    
    # Broadcast trade update
    await manager.broadcast({
        'type': 'trade_update',
        'data': trade.dict()
    })
    
    return trade

@api_router.get("/trades/{user_address}", response_model=List[Trade])
async def get_user_trades(user_address: str):
    """Get user's trade history"""
    trades = await db.trades.find({"user_address": user_address}).to_list(100)
    return [Trade(**trade) for trade in trades]

@api_router.get("/market/stats")
async def get_market_stats():
    """Get overall market statistics"""
    total_market_cap = sum(
        data.get('market_cap', 0) or 0 
        for data in crypto_data_cache.values()
    )
    
    total_volume = sum(
        data.get('volume_24h', 0) or 0 
        for data in crypto_data_cache.values()
    )
    
    # Calculate market trend
    positive_changes = sum(
        1 for data in crypto_data_cache.values()
        if data.get('price_24h_change', 0) > 0
    )
    
    total_coins = len(crypto_data_cache)
    market_sentiment = "bullish" if positive_changes > total_coins * 0.6 else "bearish"
    
    return {
        'total_market_cap': total_market_cap,
        'total_volume_24h': total_volume,
        'total_coins': total_coins,
        'market_sentiment': market_sentiment,
        'positive_changes': positive_changes,
        'negative_changes': total_coins - positive_changes
    }

# WebSocket endpoint
@api_router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection alive and handle client messages
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            if message_data.get('type') == 'subscribe':
                # Send current data to new subscriber
                await websocket.send_text(json.dumps({
                    'type': 'initial_data',
                    'crypto_data': dict(list(crypto_data_cache.items())[:20]),
                    'exchange_data': dict(exchange_prices_cache)
                }))
                
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logging.error(f"WebSocket error: {e}")
        manager.disconnect(websocket)

# DyDx Integration placeholder endpoints
@api_router.post("/dydx/connect")
async def connect_dydx_wallet(wallet_data: dict):
    """Connect DyDx wallet"""
    return {"status": "connected", "address": wallet_data.get("address")}

@api_router.get("/dydx/positions/{address}")
async def get_dydx_positions(address: str):
    """Get DyDx positions for address"""
    # Placeholder - would integrate with actual DyDx API
    return {"positions": [], "total_value": 0}

@api_router.post("/dydx/trade")
async def execute_dydx_trade(trade_data: dict):
    """Execute trade on DyDx"""
    # Placeholder - would integrate with actual DyDx trading
    return {"status": "pending", "trade_id": str(uuid.uuid4())}

# Include the router in the main app
app.include_router(api_router)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Startup event to initialize data fetching
@app.on_event("startup")
async def startup_event():
    logger.info("Starting LumaTrade API...")
    # Start background task for data updates
    asyncio.create_task(update_crypto_data())
    
@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()